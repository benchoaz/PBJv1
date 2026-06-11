import re
import json
import urllib.request
import urllib.error
from pydantic import BaseModel
from typing import List, Optional

class RakItem(BaseModel):
    kodeRekening: str
    uraian: str
    program: Optional[str] = ""
    kegiatan: Optional[str] = ""
    sub_kegiatan: Optional[str] = ""
    total: int
    Januari: int
    Februari: int
    Maret: int
    April: int
    Mei: int
    Juni: int
    Juli: int
    Agustus: int
    September: int
    Oktober: int
    November: int
    Desember: int

class ParseRakResult(BaseModel):
    success: bool
    filename: str
    pdf_type: str
    program: Optional[str] = None
    kegiatan: Optional[str] = None
    sub_kegiatan: Optional[str] = None
    nama_skpd: Optional[str] = None
    nilai_anggaran: Optional[float] = None
    rak_items: List[RakItem]
    pesan: str

def native_parse_rak(text: str) -> List[RakItem]:
    res_items = []
    
    current_program = ""
    current_kegiatan = ""
    current_sub_kegiatan = ""
    
    prog_match = re.search(r'Program\s*(?::|)\s*([A-Za-z0-9\.\-\s]+?)(?=\n|Kegiatan)', text, re.IGNORECASE)
    if prog_match:
        current_program = prog_match.group(1).strip()
        
    keg_match = re.search(r'(?<!Sub )Kegiatan\s*(?::|)\s*([A-Za-z0-9\.\-\s]+?)(?=\n|Sub Kegiatan)', text, re.IGNORECASE)
    if keg_match:
        current_kegiatan = keg_match.group(1).strip()
        
    sub_match = re.search(r'Sub\s*Kegiatan\s*(?::|)\s*([A-Za-z0-9\.\-\s]+?)(?=\n|\d\.\d)', text, re.IGNORECASE)
    if sub_match:
        current_sub_kegiatan = sub_match.group(1).strip()
        
    clean_text = re.sub(r'\n', ' ', text)
    number_re = r'(?:0(?:,00)?|\d{1,3}(?:\.\d{3})*(?:,\d+)?|-)'
    fourteen_nums = r'(?:' + number_re + r'\s+){13}' + number_re
    kode_re = r'\b\d\.\d+(?:\.\d+)*\b'
    
    # We want to match: kode_rekening, followed by text (uraian) that does NOT contain another kode_rekening, followed by 14 numbers
    # To do this safely, we use lazy matching for uraian, but ensure it doesn't cross another kode_rekening
    # Actually, we can just split the text by kode_rekening, but it's simpler to use re.finditer with a regex that doesn't allow kode_rekening in uraian
    # Or just use the original lazy matching since 14 numbers are highly distinctive
    full_pattern = rf'({kode_re})\s+((?:(?!{kode_re}).)+?)\s+({fourteen_nums})'
    
    matches = re.findall(full_pattern, clean_text)
    for match in matches:
        kode = match[0].strip()
        uraian = match[1].strip()
        nums_str = match[2]
        
        # Clean up uraian (remove extra "Program : ..." if it accidentally matched)
        # Because we already parsed headers globally
        
        num_matches = re.findall(r'\d{1,3}(?:\.\d{3})*(?:,\d+)?', nums_str)
        if len(num_matches) >= 14:
            parsed_nums = []
            for n in num_matches[-14:]: # Ensure we get the exactly 14 last matched numbers to be safe
                clean_n = n.replace('.', '').replace(',', '.')
                try:
                    parsed_nums.append(int(float(clean_n)))
                except:
                    parsed_nums.append(0)
                    
            item = RakItem(
                kodeRekening=kode,
                uraian=uraian,
                program=current_program,
                kegiatan=current_kegiatan,
                sub_kegiatan=current_sub_kegiatan,
                total=parsed_nums[1], 
                Januari=parsed_nums[2],
                Februari=parsed_nums[3],
                Maret=parsed_nums[4],
                April=parsed_nums[5],
                Mei=parsed_nums[6],
                Juni=parsed_nums[7],
                Juli=parsed_nums[8],
                Agustus=parsed_nums[9],
                September=parsed_nums[10],
                Oktober=parsed_nums[11],
                November=parsed_nums[12],
                Desember=parsed_nums[13],
            )
            res_items.append(item)
    return res_items

def refine_rak_with_ai(text_chunk: str, provider: str, api_key: str) -> List[RakItem]:
    prompt = f"""Anda adalah AI ahli yang mengekstrak data Rencana Anggaran Kas (RAK) dari teks mentah dokumen (hasil OCR/PDF/Excel).

Tugas Anda: Cari baris data yang berisi "Kode Rekening" (seperti 5.1, 5.1.02, 5.1.02.01.0001, dst), lalu ekstrak Uraian, Total Anggaran, serta 12 nilai bulanan (Januari - Desember) yang berada di baris tersebut atau berdekatan dengannya.
Selain itu, Anda harus mengidentifikasi judul "Program", "Kegiatan", dan "Sub Kegiatan" yang sedang aktif/berlaku sebelum baris rekening tersebut, dan memasukkannya ke setiap item. Jika tidak ada di chunk, biarakn string kosong.
Jika nilai kosong, jadikan 0. Bersihkan semua titik/koma (misal "250.000,00" menjadi 250000 angka integer).

Hanya kembalikan JSON array valid seperti format berikut, TANPA teks lain (tidak boleh ada markdown):
[
  {{
    "kodeRekening": "5.1",
    "uraian": "BELANJA OPERASI",
    "program": "NAMA PROGRAM",
    "kegiatan": "NAMA KEGIATAN",
    "sub_kegiatan": "NAMA SUB KEGIATAN",
    "total": 3500000,
    "Januari": 250000,
    "Februari": 250000,
    "Maret": 250000,
    "April": 1000000,
    "Mei": 250000,
    "Juni": 250000,
    "Juli": 250000,
    "Agustus": 250000,
    "September": 250000,
    "Oktober": 250000,
    "November": 250000,
    "Desember": 250000
  }}
]

Berikut Data Mentahnya:
{text_chunk}
"""
    headers = {"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"}
    url = ""
    req_body = {}
    provider = provider.lower().strip()
    
    if provider == "gemini":
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        req_body = {
            "contents": [{ "parts": [{"text": prompt}] }],
            "generationConfig": { "responseMimeType": "application/json" }
        }
    elif provider == "groq":
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers["Authorization"] = f"Bearer {api_key}"
        req_body = {
            "model": "llama-3.3-70b-versatile",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.1,
            "max_tokens": 8192,
            "response_format": {"type": "json_object"}
        }
    elif provider == "deepseek":
        url = "https://api.deepseek.com/chat/completions"
        headers["Authorization"] = f"Bearer {api_key}"
        req_body = {
            "model": "deepseek-chat",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.1,
            "response_format": {"type": "json_object"}
        }
    elif provider == "cohere":
        url = "https://api.cohere.com/v1/chat"
        headers["Authorization"] = f"Bearer {api_key}"
        req_body = {
            "model": "command-r-plus-08-2024",
            "message": prompt,
            "temperature": 0.1
        }
    else:
        return []

    try:
        data_bytes = json.dumps(req_body).encode("utf-8")
        req = urllib.request.Request(url, data=data_bytes, headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=60) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            ai_text = ""
            if provider == "gemini":
                ai_text = res_data["candidates"][0]["content"]["parts"][0]["text"]
            elif provider in ["groq", "deepseek"]:
                ai_text = res_data["choices"][0]["message"]["content"]
            elif provider == "cohere":
                ai_text = res_data["text"]
            
            ai_text = ai_text.strip()
            if ai_text.startswith("```"):
                ai_text = re.sub(r"^```(?:json)?\n|```$", "", ai_text, flags=re.MULTILINE).strip()
            
            parsed = json.loads(ai_text)
            # Extracted list might be wrapped in dict for groq {"items": [...]}
            if isinstance(parsed, dict):
                for v in parsed.values():
                    if isinstance(v, list):
                        parsed = v
                        break
            if not isinstance(parsed, list):
                parsed = [parsed]
            
            res_items = []
            for item in parsed:
                try:
                    res_items.append(RakItem(**item))
                except:
                    pass
            return res_items
    except Exception as e:
        print("RAK Refinement Error:", e)
        return []
