"""
DPA Parser Service v3.0
========================
Membaca DPA APBD Pemerintah Daerah dari PDF.
Mengekstrak rekening anggaran BESERTA rincian item (nama barang, vol, satuan, harga/sat, harga total).
Mendukung PDF Native (PyMuPDF) dan PDF Scan (Tesseract OCR).
"""

import re
import io
import os
import json
import time
import hashlib
import urllib.request
import urllib.error
from typing import Optional, List, Tuple
from fastapi import FastAPI, File, UploadFile, HTTPException, Header
import fitz  # PyMuPDF
import numpy as np
from paddleocr import PaddleOCR
import logging
logging.getLogger("ppocr").setLevel(logging.WARNING)
ocr_engine = PaddleOCR(use_angle_cls=True, lang='en')
from pdf2image import convert_from_bytes
from PIL import Image
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="DPA Parser Service", version="3.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ── Pola Regex ──────────────────────────────────────────────────────────────
# Kode rekening: hanya pola 12-segment penuh atau Permendagri baru
REKENING_FULL = re.compile(r'\b5\.[12]\.\d{2}\.\d{2}\.\d{3}\.\d{5}\b')
REKENING_MAK = re.compile(r'\b\d+(?:\.\d+)*\.5\.[12]\.\d{2}\.\d{2}\.\d{3}\.\d{5}\b')
REKENING_PERMENDAGRI = re.compile(r'\b\d{1,2}\.\d{2}\.\d{2}\.\d{1,2}\.\d{3}\b')

NOMINAL = re.compile(r'\b(\d{1,3}(?:\.\d{3})+)(?:,\d{0,2})?\b')
SATUAN_LIST = ['Unit','Buah','Rim','Lembar','Paket','Set','Bh','Pcs','Box','Keping',
               'Roll','Botol','Liter','Kg','M','Meter','Dus','Lusin','Pasang','Eksemplar',
               'Biji','Pack','Tube','Kaleng','Pkt','Porsi','Kegiatan','Kgt','Rol','Lbr',
               'Boks','Stel','Setel','Kodi','Gross','Bln','Bulan','Hari','Hr','Thn','Tahun',
               'OH','OB','OK','OT','Orang','M2','M3']
SATUAN_PAT = re.compile(
    r'(\d+(?:[,.]\d+)?)\s*(?:/\s*)?(' + '|'.join(SATUAN_LIST) + r')\b',
    re.IGNORECASE
)
SUMBER_DANA = re.compile(r'\b(PAD|DAU|DAK|DBH|BLUD|SILPA|Bantuan Keuangan)\b', re.IGNORECASE)
DPA_LINE_PAT = re.compile(
    r'(\d+(?:[,.]\d+)?)\s*(?:/\s*)?([a-zA-Z]{2,12})\s*(?:x|@)\s*(?:Rp\.?\s*)?(\d{1,3}(?:\.\d{3})+)',
    re.IGNORECASE
)

# Nama barang: baris yang diawali huruf kapital, bukan angka, panjang 5-80 char
ITEM_NAME_PAT = re.compile(r'^([A-Z][A-Za-z0-9\s/\-\.&,()]{4,79}?)(?:\s+\d|\s*$)', re.MULTILINE)

# SIRUP matching: kode rekening → noSirup (bisa di-extend)
REKENING_SIRUP_MAP = {
    "5.1.02.01.001.00024": {"noSirup": "ATK", "kategori": "ATK"},
    "5.1.02.01.001.00025": {"noSirup": "KERTAS", "kategori": "KERTAS"},
    "5.1.02.01.001.00029": {"noSirup": "KOMPUTER", "kategori": "KOMPUTER"},
    "5.1.02.01.001.00026": {"noSirup": "CETAK", "kategori": "CETAK"},
    "5.1.02.01.001.00012": {"noSirup": "CETAK", "kategori": "CETAK"},
}


def normalize_satuan(sat: str) -> str:
    if not sat:
        return "Buah"
    s = sat.lower().strip()
    s = re.sub(r'[^a-z0-9/]', '', s)
    
    # Mapping koreksi typo OCR umum
    if s in ['rim', 'r1m', 'r!m', 'rm']:
        return "Rim"
    if s in ['buah', 'bua1h', 'bu4h', 'bua', 'bh', 'b.h']:
        return "Buah"
    if s in ['paket', 'pkt', 'p1kt', 'pak3t', 'pake', 'pact']:
        return "Paket"
    if s in ['unit', 'un1t', 'unt', 'uni']:
        return "Unit"
    if s in ['box', 'b0x', 'boks', 'bok']:
        return "Box"
    if s in ['lembar', 'lbr', 'lmbr', 'l1mbar']:
        return "Lembar"
    if s in ['set', 'st', 'stel', 'setel']:
        return "Set"
    if s in ['liter', 'ltr', 'l1ter']:
        return "Liter"
    if s in ['kg', 'kilogram', 'kilo']:
        return "Kg"
    if s in ['pcs', 'pc']:
        return "Pcs"
    if s in ['roll', 'rol', 'r0ll']:
        return "Roll"
    if s in ['oh', 'oranghari', 'orang/hari', 'orang/hr']:
        return "OH"
    if s in ['ob', 'orangbulan', 'orang/bulan']:
        return "OB"
    if s in ['ok', 'orangkali', 'orang/kali']:
        return "OK"
    if s in ['ot', 'orangtahun', 'orang/tahun']:
        return "OT"
    if s in ['bulan', 'bln']:
        return "Bulan"
    if s in ['hari', 'hr']:
        return "Hari"
    if s in ['tahun', 'thn']:
        return "Tahun"
    if s in ['orang', 'org']:
        return "Orang"
        
    return sat.capitalize()


# ── Model Pydantic ───────────────────────────────────────────────────────────
class RincianItem(BaseModel):
    no: int
    nama: str
    volume: float
    satuan: str
    harga_satuan: int
    harga_total: int

class RekeningDPA(BaseModel):
    kode_rekening: str
    uraian: str
    pagu: int
    volume_total: Optional[str] = None
    satuan_total: Optional[str] = None
    sumber_dana: Optional[str] = None
    confidence: int
    rincian: List[RincianItem] = []
    kategori_sirup: Optional[str] = None
    raw_text_block: Optional[str] = None

class ParseResult(BaseModel):
    success: bool
    filename: str
    total_halaman: int
    pdf_type: str
    ocr_engine: str
    ocr_confidence: float
    ocr_mode: Optional[str] = "local"
    rekening: List[RekeningDPA]
    pesan: str


def clean_uraian(text: str) -> str:
    lines = []
    for line in text.split('\n'):
        line = line.strip()
        if not line:
            continue
        # Skip if it contains Rp 0 or Rp. 0 or Rp0,00
        if re.search(r'rp\.?\s*0(?:[,.]00)?\b', line, re.IGNORECASE) or re.search(r'\b0(?:[,.]00)?\b', line):
            continue
        # Skip if it is just numbers or garbage
        if re.match(r'^[0-9\s.,xX*]+$', line):
            continue
        lines.append(line)
    
    if not lines:
        return "Belanja"
        
    text = lines[0]
    text = re.sub(r'\[.*?\]|\(.*?\)', '', text)
    text = re.sub(r'Sumber Dana\s*:.*', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\b\d{1,3}(?:\.\d{3})+(?:,\d{2})?\b', '', text)
    text = re.sub(r'\b\d+\s*(?:' + '|'.join(SATUAN_LIST) + r')\b', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\s+', ' ', text).strip()
    return text[:120]


# ── Ekstrak Rincian Item dari blok teks ─────────────────────────────────────
def extract_rincian_from_block(block_text: str) -> List[RincianItem]:
    """
    Parsing baris-baris dalam blok rekening untuk mengekstrak item rincian.
    Mendukung penggabungan multi-baris (informasi volume di atas, nominal murni di bawahnya).
    """
    items = []
    lines = [l.strip() for l in block_text.split('\n') if l.strip()]

    # Gabungkan baris total nominal (jika terpisah di baris berikutnya)
    merged_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if i + 1 < len(lines):
            next_line = lines[i+1].strip()
            # Cek apakah next_line adalah nominal murni (misal: 5.400.000 atau 5400000)
            if re.match(r'^\d{1,3}(\.\d{3})+(,\d+)?$', next_line) or re.match(r'^\d+$', next_line):
                line = line + " " + next_line
                i += 1 # Lewati baris berikutnya karena sudah digabung
        merged_lines.append(line)
        i += 1

    item_no = 1
    for line in merged_lines:
        if len(line) < 4:
            continue
        # Skip header-like lines
        if any(kw in line.lower() for kw in ['kode rekening', 'uraian rekening', 'anggaran']):
            continue

        # Skip jika barang sudah dihapus (Rp0,00 atau Rp0)
        if re.search(r'rp\.?\s*0(?:[,.]00)?\b', line, re.IGNORECASE):
            continue

        # Coba cocokkan dengan pola rincian spesifik: "Volume Satuan x Rp HargaSatuan"
        dpa_match = DPA_LINE_PAT.search(line)
        if dpa_match:
            try:
                vol_str = dpa_match.group(1)
                satuan = dpa_match.group(2)
                harga_sat_str = dpa_match.group(3)

                vol = float(vol_str.replace(',', '.'))
                harga_sat = int(harga_sat_str.replace('.', ''))
                harga_total = int(vol * harga_sat)

                # Ekstrak nama/uraian barang
                pos_pat = dpa_match.start()
                if 'volume:' in line.lower():
                    pos_vol = line.lower().find('volume:')
                    nama_raw = line[:pos_vol].strip()
                else:
                    nama_raw = line[:pos_pat].strip()

                nama_raw = re.sub(r'[^\w\s/\-\.&,()\u00C0-\u024F]', '', nama_raw).strip()
                nama_raw = re.sub(r'[\-\s\.:]+$', '', nama_raw).strip()

                # JIKA nama kosong/pendek/hanya kata "Spesifikasi", cari baris nama riil ke belakang (hingga 5 baris)
                idx_line = merged_lines.index(line)
                if (not nama_raw or len(nama_raw) < 3 or nama_raw.lower() == 'spesifikasi') and idx_line > 0:
                    for offset in range(1, min(6, idx_line + 1)):
                        prev_line = merged_lines[idx_line - offset].strip()
                        if not prev_line:
                            continue
                        prev_clean = re.sub(r'[^\w\s/\-\.&,()\u00C0-\u024F]', '', prev_line).strip()
                        prev_clean = re.sub(r'[\-\s\.:]+$', '', prev_clean).strip()
                        if prev_clean.lower() == 'spesifikasi':
                            continue
                        if any(kw in prev_line.lower() for kw in ['kode rekening', 'uraian rekening', 'anggaran', 'rincian perhitungan', 'sumber pendanaan', 'sumber dana']):
                            continue
                        if re.match(r'^[0-9\s.,xX*()\-]+$', prev_clean):
                            continue
                        if len(prev_clean) >= 3:
                            nama_raw = prev_clean
                            break

                if len(nama_raw) < 3:
                    nama_raw = "Item Detail DPA"

                items.append(RincianItem(
                    no=item_no,
                    nama=nama_raw[:100],
                    volume=vol,
                    satuan=normalize_satuan(satuan),
                    harga_satuan=harga_sat,
                    harga_total=harga_total
                ))
                item_no += 1
                continue # Lanjut ke baris berikutnya, bypass pemrosesan umum
            except Exception:
                pass

        # Cari nominal-nominal di baris ini
        nominals = NOMINAL.findall(line)
        vals = []
        for n in nominals:
            try:
                v = int(n.replace('.', ''))
                if v >= 1000:
                    vals.append(v)
            except:
                pass

        # Cari satuan dan volume menggunakan SATUAN_PAT
        sat_match = SATUAN_PAT.search(line)
        satuan = sat_match.group(2) if sat_match else None
        vol_str = sat_match.group(1) if sat_match else None

        # Jika tidak ketemu satuan standar, cari pola alternatif volume (misal: "Volume: 120 Rim")
        if not satuan:
            alt_match = re.search(r'(?:volume:?\s*)?(\d+[\.,]?\d*)\s*([a-zA-Z]{2,12})\b', line, re.IGNORECASE)
            if alt_match:
                vol_str = alt_match.group(1)
                sat_candidate = alt_match.group(2)
                # Pastikan bukan kata kunci terlarang
                if sat_candidate.lower() not in ['volume', 'rupiah', 'harga', 'total', 'dpa', 'pagu', 'dan', 'atau']:
                    satuan = sat_candidate

        # Ekstrak nama/uraian barang
        first_num = re.search(r'\b\d', line)
        if 'volume:' in line.lower():
            pos_vol = line.lower().find('volume:')
            nama_raw = line[:pos_vol].strip()
        elif first_num:
            nama_raw = line[:first_num.start()].strip()
        else:
            nama_raw = line.strip()

        # Bersihkan nama barang dari karakter liar di ujung
        nama_raw = re.sub(r'[^\w\s/\-\.&,()\u00C0-\u024F]', '', nama_raw).strip()
        nama_raw = re.sub(r'[\-\s\.:]+$', '', nama_raw).strip()

        # JIKA nama kosong/sangat pendek/hanya kata "Spesifikasi", cari baris nama riil ke belakang (hingga 5 baris)
        idx_line = merged_lines.index(line)
        if (not nama_raw or len(nama_raw) < 3 or nama_raw.lower() == 'spesifikasi') and idx_line > 0:
            for offset in range(1, min(6, idx_line + 1)):
                prev_line = merged_lines[idx_line - offset].strip()
                if not prev_line:
                    continue
                prev_clean = re.sub(r'[^\w\s/\-\.&,()\u00C0-\u024F]', '', prev_line).strip()
                prev_clean = re.sub(r'[\-\s\.:]+$', '', prev_clean).strip()
                if prev_clean.lower() == 'spesifikasi':
                    continue
                if any(kw in prev_line.lower() for kw in ['kode rekening', 'uraian rekening', 'anggaran', 'rincian perhitungan', 'sumber pendanaan', 'sumber dana']):
                    continue
                if re.match(r'^[0-9\s.,xX*()\-]+$', prev_clean):
                    continue
                if len(prev_clean) >= 3:
                    nama_raw = prev_clean
                    break

        if len(nama_raw) >= 3 and satuan and len(vals) >= 1:
            try:
                vol = float(vol_str.replace(',', '.')) if vol_str else 1.0
                
                # Heuristik kalkulasi harga satuan & total
                if len(vals) >= 2:
                    harga_total = max(vals)
                    sorted_vals = sorted(vals, reverse=True)
                    harga_sat = sorted_vals[1] if len(sorted_vals) > 1 else int(harga_total / vol)
                    # Pastikan hitungan logis (toleransi selisih 10%)
                    if abs(harga_sat * vol - harga_total) / max(harga_total, 1) > 0.10:
                        harga_sat = int(harga_total / vol) if vol > 0 else harga_sat
                else:
                    harga_total = vals[0]
                    # Jika nominal tunggal itu sangat besar, asumsikan itu total harga
                    if harga_total > 5000:
                        harga_sat = int(harga_total / vol) if vol > 0 else harga_total
                    else:
                        harga_sat = harga_total
                        harga_total = int(harga_sat * vol)

                items.append(RincianItem(
                    no=item_no,
                    nama=nama_raw[:100],
                    volume=vol,
                    satuan=normalize_satuan(satuan),
                    harga_satuan=harga_sat,
                    harga_total=harga_total
                ))
                item_no += 1
            except Exception:
                pass

    return items


# ── AI Refinement: Merapikan & Membaca Rincian otomatis ──────────────────────
def refine_rincian_with_ai(block_text: str, provider: str, api_key: str) -> List[RincianItem]:
    if not provider or not api_key:
        return []
    
    prompt = f"""Bapak adalah asisten AI ahli keuangan daerah dan pengadaan barang/jasa (PBJ) Indonesia.
Tugas Anda adalah mengekstrak rincian item belanja dari potongan teks DPA (RKA Belanja SKPD) berikut ini.
Koreksi typo OCR (seperti 'Bua1h' -> 'Buah', 'R1m' -> 'Rim', atau nominal angka dengan separator titik/koma yang salah dibaca).
Pastikan uraian/nama barang hasil ekstraksi bersih, jelas terbaca, bebas dari prefiks kode rekening, dan mudah dipahami manusia di web view.

FOKUS PADA DETAIL BARANG:
- Gabungkan kelompok/kategori barang (seperti 'Printer', 'Laptop', 'Komputer') dengan merk/tipe/spesifikasi detail di bawahnya (seperti 'EPSON L121', 'Laptop Intel Celeron') agar nama barang hasil ekstraksi sangat spesifik dan detail (contoh hasil: 'Printer EPSON L121' atau 'Laptop Intel Celeron'). JANGAN menulis nama barang yang terlalu umum jika ada detail merk/spesifikasi!

JIKA di teks DPA terdapat item dengan nominal harga/jumlah Rp 0,00 (atau Rp 0), itu berarti item tersebut sudah terhapus/dihapus, sehingga JANGAN dimasukkan ke dalam hasil ekstraksi!

Format output WAJIB berupa JSON ARRAY murni yang berisi objek dengan format berikut (tanpa kata pengantar, penjelasan, atau pembungkus markdown ```json):
[
  {{
    "nama": "Uraian nama barang/jasa yang jelas",
    "volume": 10.0,
    "satuan": "Buah/Rim/Paket/Unit",
    "harga_satuan": 150000,
    "harga_total": 1500000
  }}
]

Potongan Teks DPA:
{block_text}
"""

    headers = {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    url = ""
    req_body = {}

    provider = provider.lower().strip()
    try:
        if provider == "gemini":
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
            req_body = {
                "contents": [{
                    "parts": [{"text": prompt}]
                }],
                "generationConfig": {
                    "responseMimeType": "application/json"
                }
            }
        elif provider == "groq":
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers["Authorization"] = f"Bearer {api_key}"
            models_to_try = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "llama3-70b-8192", "mixtral-8x7b-32768"]
            for model_name in models_to_try:
                try:
                    req_body = {
                        "model": model_name,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.1,
                        "response_format": {"type": "json_object"}
                    }
                    data_bytes = json.dumps(req_body).encode("utf-8")
                    req = urllib.request.Request(url, data=data_bytes, headers=headers, method="POST")
                    with urllib.request.urlopen(req, timeout=60) as response:
                        res_data = json.loads(response.read().decode("utf-8"))
                        ai_text = res_data["choices"][0]["message"]["content"].strip()
                        if ai_text.startswith("```"):
                            ai_text = re.sub(r"^```(?:json)?\n|```$", "", ai_text, flags=re.MULTILINE).strip()
                        parsed = json.loads(ai_text)
                        
                        items_list = []
                        if isinstance(parsed, list):
                            items_list = parsed
                        elif isinstance(parsed, dict):
                            for val in parsed.values():
                                if isinstance(val, list):
                                    items_list = val
                                    break
                            if not items_list:
                                items_list = [parsed]

                        result_items = []
                        for idx, item in enumerate(items_list):
                            vol = float(item.get("volume", 1.0) or 1.0)
                            harga_sat = int(item.get("harga_satuan", 0) or 0)
                            harga_tot = int(item.get("harga_total", 0) or (vol * harga_sat))
                            
                            # JANGAN masukkan barang yang harganya Rp 0 (sudah dihapus)
                            if harga_sat == 0 or harga_tot == 0:
                                continue
                            
                            result_items.append(RincianItem(
                                no=len(result_items) + 1,
                                nama=str(item.get("nama", "Item Detail DPA") or "Item Detail DPA")[:120],
                                volume=vol,
                                satuan=normalize_satuan(str(item.get("satuan", "Buah") or "Buah")),
                                harga_satuan=harga_sat,
                                harga_total=harga_tot
                            ))
                        return result_items
                except urllib.error.HTTPError as he:
                    try:
                        err_body = he.read().decode("utf-8")
                    except:
                        err_body = ""
                    print(f"⚠️ Groq model '{model_name}' failed with {he.code}: {err_body}. Trying next model...")
                    continue
                except Exception as e:
                    print(f"⚠️ Groq model '{model_name}' failed with: {str(e)}. Trying next model...")
                    continue
            return []
        elif provider == "anthropic":
            url = "https://api.anthropic.com/v1/messages"
            headers["x-api-key"] = api_key
            headers["anthropic-version"] = "2023-06-01"
            req_body = {
                "model": "claude-3-haiku-20240307",
                "max_tokens": 1500,
                "messages": [
                    {"role": "user", "content": prompt}
                ]
            }
        elif provider == "openai":
            url = "https://api.openai.com/v1/chat/completions"
            headers["Authorization"] = f"Bearer {api_key}"
            req_body = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.1
            }
        else:
            return []

        # Kirim request HTTP POST menggunakan urllib
        data_bytes = json.dumps(req_body).encode("utf-8")
        req = urllib.request.Request(url, data=data_bytes, headers=headers, method="POST")
        
        with urllib.request.urlopen(req, timeout=60) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            
            ai_text = ""
            if provider == "gemini":
                ai_text = res_data["candidates"][0]["content"]["parts"][0]["text"]
            elif provider in ["groq", "openai"]:
                ai_text = res_data["choices"][0]["message"]["content"]
            elif provider == "anthropic":
                ai_text = res_data["content"][0]["text"]

            ai_text = ai_text.strip()
            if ai_text.startswith("```"):
                ai_text = re.sub(r"^```(?:json)?\n|```$", "", ai_text, flags=re.MULTILINE).strip()
            
            parsed = json.loads(ai_text)
            items_list = []
            if isinstance(parsed, list):
                items_list = parsed
            elif isinstance(parsed, dict):
                for val in parsed.values():
                    if isinstance(val, list):
                        items_list = val
                        break
                if not items_list:
                    items_list = [parsed]

            result_items = []
            for idx, item in enumerate(items_list):
                vol = float(item.get("volume", 1.0) or 1.0)
                harga_sat = int(item.get("harga_satuan", 0) or 0)
                harga_tot = int(item.get("harga_total", 0) or (vol * harga_sat))
                
                # JANGAN masukkan barang yang harganya Rp 0 (sudah dihapus)
                if harga_sat == 0 or harga_tot == 0:
                    continue
                
                result_items.append(RincianItem(
                    no=len(result_items) + 1,
                    nama=str(item.get("nama", "Item Detail DPA") or "Item Detail DPA")[:120],
                    volume=vol,
                    satuan=normalize_satuan(str(item.get("satuan", "Buah") or "Buah")),
                    harga_satuan=harga_sat,
                    harga_total=harga_tot
                ))
            return result_items

    except urllib.error.HTTPError as he:
        try:
            err_body = he.read().decode("utf-8")
        except:
            err_body = ""
        print(f"⚠️ AI Refinement HTTP Error for provider {provider}: {he.code} - {he.reason} - {err_body}")
        return []
    except Exception as e:
        print(f"⚠️ AI Refinement Error for provider {provider}: {str(e)}")
        return []


# ── Pipeline Ekstraksi Utama ─────────────────────────────────────────────────
def run_extraction_pipeline(doc: fitz.Document, full_ocr_text: str, use_ocr: bool, ai_provider: str = "", api_key: str = "") -> List[RekeningDPA]:
    rekening_map = {}  # kode → RekeningDPA

    if use_ocr:
        pages_text = [full_ocr_text]
    else:
        pages_text = [page.get_text(sort=True) for page in doc]

    full_text = '\n'.join(pages_text)

    # Temukan semua kode rekening beserta posisinya (izinkan duplikasi pos untuk penanganan detail vs ringkasan)
    all_occurrences = [] # list of (kode, pos)
    
    for m in REKENING_MAK.finditer(full_text):
        all_occurrences.append((m.group(0), m.start()))

    # Jika tidak ada MAK, cari REKENING_FULL (5.1.02.01...)
    if not all_occurrences:
        for m in REKENING_FULL.finditer(full_text):
            all_occurrences.append((m.group(0), m.start()))

    # Fallback Permendagri jika tidak ada kode penuh
    if not all_occurrences:
        for m in REKENING_PERMENDAGRI.finditer(full_text):
            kode = m.group(0)
            if kode.startswith(('1.', '5.', '6.', '7.')):
                all_occurrences.append((kode, m.start()))

    if not all_occurrences:
        return []

    # Urutkan berdasarkan posisi dalam teks
    sorted_occurrences = sorted(all_occurrences, key=lambda x: x[1])

    rekening_candidates = []

    for idx, (kode, pos_start) in enumerate(sorted_occurrences):
        # Blok teks: dari kode ini sampai kode berikutnya (max 50000 char untuk detail penuh)
        if idx + 1 < len(sorted_occurrences):
            pos_end = min(sorted_occurrences[idx + 1][1], pos_start + 50000)
        else:
            pos_end = min(pos_start + 50000, len(full_text))

        block = full_text[pos_start:pos_end]
        block_after = full_text[pos_start + len(kode):pos_end]

        # Pagu: cari nominal terbesar di blok
        nominals = NOMINAL.findall(block_after)
        pagu = 0
        for n in nominals:
            try:
                v = int(n.replace('.', ''))
                if v > pagu and v >= 100000:
                    pagu = v
            except:
                pass

        if pagu == 0:
            continue

        # Uraian: teks sebelum nominal pertama
        first_nom = NOMINAL.search(block_after)
        uraian_raw = block_after[:first_nom.start()].strip() if first_nom else block_after[:100]
        uraian = clean_uraian(uraian_raw)
        if len(uraian) < 5:
            # Coba ambil dari sebelum kode rekening
            before = full_text[max(0, pos_start - 200):pos_start]
            uraian = clean_uraian(before.split('\n')[-1])

        # Sumber dana
        sd_match = SUMBER_DANA.search(block_after[:300])
        sumber = sd_match.group(0) if sd_match else None

        # Volume & satuan total
        sat_match = SATUAN_PAT.search(block_after[:200])
        vol_total = sat_match.group(1) if sat_match else None
        sat_total = sat_match.group(2).capitalize() if sat_match else None

        # Rincian item: Hubungkan ke AI Refinement jika user menginputkan API key di Admin Dashboard
        rincian = []
        if ai_provider and api_key:
            print(f"✨ Memanggil AI Refiner ({ai_provider}) untuk merapikan rincian...")
            rincian = refine_rincian_with_ai(block_after, ai_provider, api_key)
            
        # Fallback ke regex lokal jika AI tidak membuahkan hasil atau dinonaktifkan
        if not rincian:
            rincian = extract_rincian_from_block(block_after)

        # Confidence
        conf = 30
        if REKENING_FULL.match(kode): conf += 30
        if pagu > 100000: conf += 20
        if len(uraian) > 5: conf += 10
        if sumber: conf += 10

        # Kategori SIRUP
        sirup_info = REKENING_SIRUP_MAP.get(kode, {})
        kategori = sirup_info.get("kategori")

        rekening_candidates.append(RekeningDPA(
            kode_rekening=kode,
            uraian=uraian,
            pagu=pagu,
            volume_total=vol_total,
            satuan_total=sat_total,
            sumber_dana=sumber,
            confidence=conf,
            rincian=rincian,
            kategori_sirup=kategori,
            raw_text_block=block_after
        ))

    # Kelompokkan kandidat berdasarkan kode rekening untuk memilih yang terbaik (yang memiliki rincian paling lengkap)
    best_rekening = {}
    for candidate in rekening_candidates:
        kode = candidate.kode_rekening
        if kode not in best_rekening:
            best_rekening[kode] = candidate
        else:
            current_best = best_rekening[kode]
            # Pilih yang memiliki rincian lebih banyak
            if len(candidate.rincian) > len(current_best.rincian):
                best_rekening[kode] = candidate
            # Jika rincian sama, pilih yang pagu-nya lebih masuk akal / lebih besar
            elif len(candidate.rincian) == len(current_best.rincian):
                if candidate.pagu > current_best.pagu:
                    best_rekening[kode] = candidate

    return list(best_rekening.values())


# ── OCR untuk PDF Scan ───────────────────────────────────────────────────────
def ocr_pdf(pdf_bytes: bytes) -> Tuple[str, float]:
    images = convert_from_bytes(pdf_bytes, dpi=300)
    texts, total_conf = [], 0.0
    for img in images:
        img_array = np.array(img)
        # Convert RGB to BGR for PaddleOCR (OpenCV format)
        img_array = img_array[:, :, ::-1].copy()
        
        result = ocr_engine.ocr(img_array, cls=True)
        
        page_text = []
        page_conf_sum = 0.0
        page_conf_count = 0
        
        if result and result[0]:
            # result[0] is a list of lines for the first image
            for line in result[0]:
                if not line: continue
                text = line[1][0]
                conf = line[1][1]
                page_text.append(text)
                page_conf_sum += conf
                page_conf_count += 1
                
        texts.append('\n'.join(page_text))
        if page_conf_count > 0:
            total_conf += (page_conf_sum / page_conf_count) * 100
        else:
            total_conf += 75.0
            
    avg = total_conf / len(images) if images else 0.0
    return '\n--- PAGE BREAK ---\n'.join(texts), avg


import pandas as pd

def ocr_image(image_bytes: bytes) -> Tuple[str, float]:
    img = Image.open(io.BytesIO(image_bytes))
    img_array = np.array(img)
    # Convert RGB to BGR for PaddleOCR (OpenCV format)
    if len(img_array.shape) == 3 and img_array.shape[2] == 3:
        img_array = img_array[:, :, ::-1].copy()
    elif len(img_array.shape) == 3 and img_array.shape[2] == 4:
        img_array = img_array[:, :, :3]
        img_array = img_array[:, :, ::-1].copy()
        
    result = ocr_engine.ocr(img_array, cls=True)
    page_text = []
    page_conf_sum = 0.0
    page_conf_count = 0
    if result and result[0]:
        for line in result[0]:
            if not line: continue
            text = line[1][0]
            conf = line[1][1]
            page_text.append(text)
            page_conf_sum += conf
            page_conf_count += 1
            
    avg = (page_conf_sum / page_conf_count) * 100 if page_conf_count > 0 else 75.0
    return '\n'.join(page_text), avg

def parse_excel(excel_bytes: bytes) -> Tuple[str, float]:
    excel_file = io.BytesIO(excel_bytes)
    all_sheets = pd.read_excel(excel_file, sheet_name=None, header=None)
    
    texts = []
    for sheet_name, df in all_sheets.items():
        texts.append(f"--- SHEET: {sheet_name} ---")
        df = df.dropna(how='all')
        for idx, row in df.iterrows():
            row_vals = [str(val).strip() for val in row.values if pd.notna(val) and str(val).strip() != '']
            if row_vals:
                texts.append("  ".join(row_vals))
    return '\n'.join(texts), 100.0


# ── Audit Log ────────────────────────────────────────────────────────────────
def write_log(pages: int, count: int, engine: str, status: str, pdf_bytes: bytes):
    os.makedirs('logs', exist_ok=True)
    entry = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "file_hash": hashlib.sha256(pdf_bytes).hexdigest()[:16],
        "pages": pages, "rekening_count": count,
        "ocr_engine": engine, "status": status
    }
    with open('logs/extraction_audit.jsonl', 'a') as f:
        f.write(json.dumps(entry) + '\n')


# ── Endpoints ────────────────────────────────────────────────────────────────
@app.get('/health')
def health():
    paddle_ver = "installed"
    docs_today, sum_conf = 0, 0.0
    today = time.strftime("%Y-%m-%d", time.gmtime())
    if os.path.exists('logs/extraction_audit.jsonl'):
        try:
            with open('logs/extraction_audit.jsonl') as f:
                for line in f:
                    e = json.loads(line.strip())
                    if e.get('timestamp', '').startswith(today):
                        docs_today += 1
        except: pass
    return {
        "status": "ok", "service": "dpa-parser",
        "engine_pymupdf": fitz.__version__,
        "engine_paddleocr": paddle_ver,
        "docs_processed_today": docs_today
    }

@app.post('/parse-dpa', response_model=ParseResult)
async def parse_dpa(file: UploadFile = File(...), x_ai_provider: Optional[str] = Header(None), x_ai_key: Optional[str] = Header(None)):
    filename = file.filename.lower()
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(400, 'Berkas kosong.')

    # Save bytes for local debugging and inspection
    try:
        ext = 'xlsx' if (filename.endswith('.xlsx') or filename.endswith('.xls')) else 'png' if (filename.endswith('.png') or filename.endswith('.jpg') or filename.endswith('.jpeg')) else 'pdf'
        with open(f'logs/debug_uploaded_dpa.{ext}', 'wb') as f:
            f.write(file_bytes)
        print(f"💾 Saved uploaded file for debugging to logs/debug_uploaded_dpa.{ext}")
    except Exception as e:
        print(f"⚠️ Failed to save debug file: {str(e)}")

    mode_status = "ai" if x_ai_provider and x_ai_key else "local"

    # 1. EXCEL Parsing
    if filename.endswith('.xlsx') or filename.endswith('.xls'):
        try:
            excel_text, _ = parse_excel(file_bytes)
            rekening = run_extraction_pipeline(None, excel_text, use_ocr=True, ai_provider=x_ai_provider, api_key=x_ai_key)
            write_log(1, len(rekening), 'pandas', 'ok', file_bytes)
            return ParseResult(
                success=True, filename=file.filename,
                total_halaman=1, pdf_type='excel',
                ocr_engine='pandas', ocr_confidence=100.0,
                ocr_mode=mode_status,
                rekening=rekening,
                pesan=f'Berhasil mengekstrak lembar Excel dengan AI Refinement ({x_ai_provider or "none"}). {len(rekening)} rekening ditemukan.'
            )
        except Exception as e:
            raise HTTPException(500, f'Gagal memproses file Excel: {str(e)}')

    # 2. IMAGE Parsing
    elif filename.endswith('.png') or filename.endswith('.jpg') or filename.endswith('.jpeg'):
        try:
            image_text, ocr_conf = ocr_image(file_bytes)
            rekening = run_extraction_pipeline(None, image_text, use_ocr=True, ai_provider=x_ai_provider, api_key=x_ai_key)
            write_log(1, len(rekening), 'paddleocr-image', 'ok', file_bytes)
            return ParseResult(
                success=True, filename=file.filename,
                total_halaman=1, pdf_type='image',
                ocr_engine='paddleocr', ocr_confidence=round(ocr_conf, 1),
                ocr_mode=mode_status,
                rekening=rekening,
                pesan=f'Berhasil mengekstrak gambar DPA dengan AI Refinement ({x_ai_provider or "none"}). {len(rekening)} rekening ditemukan.'
            )
        except Exception as e:
            raise HTTPException(500, f'Gagal memproses gambar: {str(e)}')

    # 3. PDF Parsing
    elif filename.endswith('.pdf'):
        doc = None
        try:
            doc = fitz.open(stream=file_bytes, filetype='pdf')
            total_pages = len(doc)

            # Deteksi PDF native vs scan
            total_chars = sum(len(p.get_text().strip()) for p in doc)
            is_scan = total_chars < 100

            if is_scan:
                doc.close()
                ocr_text, ocr_conf = ocr_pdf(file_bytes)
                rekening = run_extraction_pipeline(None, ocr_text, use_ocr=True, ai_provider=x_ai_provider, api_key=x_ai_key)
                write_log(total_pages, len(rekening), 'paddleocr', 'ok', file_bytes)
                return ParseResult(
                    success=True, filename=file.filename,
                    total_halaman=total_pages, pdf_type='scan',
                    ocr_engine='paddleocr', ocr_confidence=round(ocr_conf, 1),
                    ocr_mode=mode_status,
                    rekening=rekening,
                    pesan=f'Berhasil OCR scan PDF dengan AI Refinement ({x_ai_provider or "none"}). {len(rekening)} rekening ditemukan.'
                )

            # Native PDF
            rekening = run_extraction_pipeline(doc, '', use_ocr=False, ai_provider=x_ai_provider, api_key=x_ai_key)
            avg_conf = sum(r.confidence for r in rekening) / len(rekening) if rekening else 0
            doc.close()

            # Fallback ke OCR jika confidence rendah atau tidak ada rekening
            if not rekening or avg_conf < 60:
                ocr_text, ocr_conf = ocr_pdf(file_bytes)
                rekening_ocr = run_extraction_pipeline(None, ocr_text, use_ocr=True, ai_provider=x_ai_provider, api_key=x_ai_key)
                if len(rekening_ocr) >= len(rekening):
                    rekening = rekening_ocr
                write_log(total_pages, len(rekening), 'paddleocr-fallback', 'ok', file_bytes)
                return ParseResult(
                    success=True, filename=file.filename,
                    total_halaman=total_pages, pdf_type='native-ocr-fallback',
                    ocr_engine='paddleocr', ocr_confidence=round(ocr_conf, 1),
                    ocr_mode=mode_status,
                    rekening=rekening,
                    pesan=f'Fallback ke OCR dengan AI Refinement. {len(rekening)} rekening ditemukan.'
                )

            write_log(total_pages, len(rekening), 'pymupdf', 'ok', file_bytes)
            return ParseResult(
                success=True, filename=file.filename,
                total_halaman=total_pages, pdf_type='native',
                ocr_engine='pymupdf', ocr_confidence=99.0,
                ocr_mode=mode_status,
                rekening=rekening,
                pesan=f'Sukses baca DPA native dengan AI Refinement ({x_ai_provider or "none"}). {len(rekening)} rekening ditemukan.'
            )
        except Exception as e:
            if doc and not doc.is_closed:
                try: doc.close()
                except: pass
            raise HTTPException(500, f'Gagal mengekstrak berkas DPA: {str(e)}')
            
    else:
        raise HTTPException(400, 'Format berkas tidak didukung. Harap unggah berkas PDF, Gambar (.png/.jpg/.jpeg), atau Excel (.xlsx/.xls).')


# ── AI Rincian Alignment Endpoint ──────────────────────────────────────────
class AlignItemInput(BaseModel):
    no: int
    nama: str
    volume: float
    satuan: str
    harga_satuan: int
    harga_total: int

class AlignRequest(BaseModel):
    items: List[AlignItemInput]
    target_pagu: int
    provider: str
    api_key: str
    raw_text_block: Optional[str] = None

@app.post('/align-rincian')
async def align_rincian(req: AlignRequest):
    print(f"DEBUG: /align-rincian request received. Provider={req.provider}, has_api_key={bool(req.api_key)}")
    if not req.api_key or not req.provider:
        # ── Fallback Cerdas Lokal: Re-parse raw_text_block untuk mencari item yang hilang ──
        upd = [item.dict() for item in req.items]
        raw_block = req.raw_text_block or ""
        
        if raw_block and len(raw_block) > 20:
            # Re-extract rincian dari raw text block untuk menemukan item yang belum terdeteksi
            re_extracted = extract_rincian_from_block(raw_block)
            
            if len(re_extracted) > len(upd):
                # Ada item baru yang ditemukan! Gunakan hasil re-extract
                upd = []
                for idx, item in enumerate(re_extracted):
                    upd.append({
                        "no": idx + 1,
                        "nama": item.nama,
                        "volume": item.volume,
                        "satuan": item.satuan,
                        "harga_satuan": item.harga_satuan,
                        "harga_total": item.harga_total
                    })
                print(f"🔍 Re-extract menemukan {len(upd)} items (sebelumnya {len(req.items)} items)")
        
        if upd:
            current_total = sum(i['harga_total'] for i in upd)
            delta = req.target_pagu - current_total
            
            if delta != 0 and len(upd) > 0:
                # Distribusi proporsional: sebarkan selisih ke semua item secara proporsional
                if current_total > 0:
                    for i in range(len(upd)):
                        proportion = upd[i]['harga_total'] / current_total
                        adjustment = int(round(delta * proportion))
                        upd[i]['harga_total'] = max(0, upd[i]['harga_total'] + adjustment)
                        if upd[i]['volume'] > 0:
                            upd[i]['harga_satuan'] = int(round(upd[i]['harga_total'] / upd[i]['volume']))
                    
                    # Koreksi sisa pembulatan pada item terakhir
                    final_total = sum(i['harga_total'] for i in upd)
                    remainder = req.target_pagu - final_total
                    if remainder != 0:
                        upd[-1]['harga_total'] += remainder
                        if upd[-1]['volume'] > 0:
                            upd[-1]['harga_satuan'] = int(round(upd[-1]['harga_total'] / upd[-1]['volume']))
                else:
                    # Jika total 0, bagi rata
                    per_item = int(round(req.target_pagu / len(upd)))
                    for i in range(len(upd)):
                        upd[i]['harga_total'] = per_item
                        if upd[i]['volume'] > 0:
                            upd[i]['harga_satuan'] = int(round(per_item / upd[i]['volume']))
                    remainder = req.target_pagu - sum(i['harga_total'] for i in upd)
                    if remainder != 0:
                        upd[-1]['harga_total'] += remainder
                        if upd[-1]['volume'] > 0:
                            upd[-1]['harga_satuan'] = int(round(upd[-1]['harga_total'] / upd[-1]['volume']))
        
        return {"success": True, "aligned_items": upd, "ocr_mode": "local-reparse"}

    # Refinement Cerdas Menggunakan AI (Gemini/Groq)
    raw_block_text = req.raw_text_block or ""
    prompt = f"""
Anda adalah asisten AI audit sistem pengadaan barang/jasa (PBJ).
Tugas Anda adalah menyeimbangkan/menyelaraskan daftar rincian barang hasil pembacaan DPA berikut agar jumlah total harga keseluruhannya (sum of harga_total) PAS 100% sama dengan TARGET PAGU: Rp {req.target_pagu}.

BANDINGKAN daftar rincian barang saat ini dengan POTONGAN TEKS DPA ASLI di bawah ini.
Temukan semua item rincian belanja (nama barang, volume, satuan, harga satuan) yang tercantum di dalam teks DPA tersebut.

POTONGAN TEKS DPA ASLI:
\"\"\"
{raw_block_text}
\"\"\"

DAFTAR ITEM RINCIAN SAAT INI:
{json.dumps([item.dict() for item in req.items], indent=2)}

ATURAN REFINEMENT KETAT:
1. Cari semua item yang ada di potongan teks DPA asli. Jangan hanya terpaku pada daftar rincian saat ini. Jika di teks DPA ada item lain yang belum masuk ke daftar rincian saat ini, Anda HARUS menambahkannya!
2. FOKUS PADA DETAIL BARANG: Gabungkan kelompok/kategori barang (seperti 'Printer', 'Laptop', 'Komputer') dengan merk/tipe/spesifikasi detail di bawahnya (seperti 'EPSON L121', 'Laptop Intel Celeron') agar nama barang hasil ekstraksi sangat spesifik dan detail (contoh hasil: 'Printer EPSON L121' atau 'Laptop Intel Celeron'). JANGAN menulis nama barang yang terlalu umum jika ada detail merk/spesifikasi!
3. JIKA di teks DPA terdapat item dengan nominal harga/jumlah Rp 0,00 (atau Rp 0), itu berarti item tersebut sudah terhapus/dihapus, sehingga JANGAN dimasukkan ke dalam rincian!
4. Sesuaikan volume, satuan, dan harga satuan secara wajar dan logis sesuai angka yang tertulis di teks DPA agar total penjumlahannya PAS 100% sama dengan target pagu: Rp {req.target_pagu}.
5. Jangan mengubah uraian/nama spesifikasi barang asli secara drastis, pertahankan deskripsi aslinya!
6. Anda harus mengembalikan respons HANYA berupa array JSON yang valid tanpa markdown formatting. Setiap elemen harus memiliki keys: "no" (int), "nama" (string), "volume" (float), "satuan" (string), "harga_satuan" (int), "harga_total" (int).

Format JSON keluaran yang diwajibkan:
[
  {{ "no": 1, "nama": "Uraian Spesifikasi", "volume": 12.0, "satuan": "Rim", "harga_satuan": 45000, "harga_total": 540000 }}
]
"""
    try:
        print("DEBUG: calling refine_rincian_with_ai...")
        raw_res = refine_rincian_with_ai(prompt, req.provider, req.api_key)
        if raw_res:
            items_res = []
            for idx, item in enumerate(raw_res):
                if item.harga_satuan == 0 or item.harga_total == 0:
                    continue
                item_dict = item.dict()
                item_dict["no"] = len(items_res) + 1
                items_res.append(item_dict)
            print(f"✨ AI alignment succeeded with {len(items_res)} items using provider {req.provider}")
            return {"success": True, "aligned_items": items_res, "ocr_mode": "ai"}
        else:
            print("DEBUG: refine_rincian_with_ai returned empty list")
    except Exception as err:
        print(f"AI alignment failed: {err}")

    # Fallback lokal cerdas jika AI error
    print("⚠️ AI alignment failed, falling back to local math solver")
    upd = [item.dict() for item in req.items]
    if upd:
        current_total = sum(i['harga_total'] for i in upd)
        delta = req.target_pagu - current_total
        last_idx = len(upd) - 1
        upd[last_idx]['harga_total'] = max(0, upd[last_idx]['harga_total'] + delta)
        if upd[last_idx]['volume'] > 0:
            upd[last_idx]['harga_satuan'] = int(round(upd[last_idx]['harga_total'] / upd[last_idx]['volume']))
    return {"success": True, "aligned_items": upd, "ocr_mode": "local-fallback"}
