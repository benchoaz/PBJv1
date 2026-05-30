import re
from typing import List

class RincianItem:
    def __init__(self, no, nama, volume, satuan, harga_satuan, harga_total):
        self.no = no
        self.nama = nama
        self.volume = volume
        self.satuan = satuan
        self.harga_satuan = harga_satuan
        self.harga_total = harga_total
    def __repr__(self):
        return f"{self.no}. {self.nama} | Vol: {self.volume} {self.satuan} | Rp{self.harga_satuan} | Rp{self.harga_total}"

DPA_LINE_PAT = re.compile(r'(?:volume:?\s*)?(\d+[\.,]?\d*)\s*([a-zA-Z]{2,10})\s*(?:x\s*\d+[\.,]?\d*\s*[a-zA-Z]{2,10}\s*)?(?:harga(?:[\s\-]?satuan)?:?\s*)?(?:Rp\.?)?\s*(\d{1,3}(?:\.\d{3})*)\b', re.IGNORECASE)
NOMINAL = re.compile(r'\b\d{1,3}(?:\.\d{3})+\b')
SATUAN_PAT = re.compile(r'(?:volume:?\s*)?(\d+[\.,]?\d*)\s*([a-zA-Z]{2,10})', re.IGNORECASE)

def normalize_satuan(s): return s

def extract_rincian_from_block(block_text: str) -> List[RincianItem]:
    items = []
    lines = [l.strip() for l in block_text.split('\n') if l.strip()]

    item_no = 1
    current_item = None

    for line in lines:
        if len(line) < 4: continue
        lower_line = line.lower()
        if any(kw in lower_line for kw in ['kode rekening', 'uraian rekening', 'anggaran', 'rencana realisasi', 'jumlah anggaran sub kegiatan', 'rincian perhitungan']):
            continue
        if re.match(r'^(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\b', lower_line):
            continue
        if re.search(r'rp\.?\s*0(?:[,.]00)?\b', line, re.IGNORECASE):
            continue

        dpa_match = DPA_LINE_PAT.search(line)
        nominals = NOMINAL.findall(line)
        has_volume_satuan = False
        vol_str, satuan, harga_sat, harga_total = None, None, 0, 0
        vol = 1.0

        if dpa_match:
            has_volume_satuan = True
            vol_str = dpa_match.group(1)
            satuan = dpa_match.group(2)
            harga_sat = int(dpa_match.group(3).replace('.', ''))
            vol = float(vol_str.replace(',', '.'))
            harga_total = int(vol * harga_sat)
            pos_pat = dpa_match.start()
            if 'volume:' in lower_line:
                nama_raw = line[:lower_line.find('volume:')].strip()
            else:
                nama_raw = line[:pos_pat].strip()
        else:
            multi_match = re.search(r'(\d+(?:[,.]\d+)?)\s*([a-zA-Z]{2,10})\s*x\s*(\d+(?:[,.]\d+)?)\s*([a-zA-Z]{2,10})', line, re.IGNORECASE)
            if multi_match:
                has_volume_satuan = True
                v1 = float(multi_match.group(1).replace(',', '.'))
                v2 = float(multi_match.group(3).replace(',', '.'))
                vol = v1 * v2
                satuan = f"{multi_match.group(2).capitalize()} / {multi_match.group(4).capitalize()}"
            else:
                sat_match = SATUAN_PAT.search(line)
                if sat_match:
                    has_volume_satuan = True
                    vol_str = sat_match.group(1)
                    satuan = sat_match.group(2)
                    vol = float(vol_str.replace(',', '.'))
                else:
                    alt_match = re.search(r'(?:volume:?\s*)?(\d+[\.,]?\d*)\s*([a-zA-Z]{2,12})\b', line, re.IGNORECASE)
                    if alt_match and alt_match.group(2).lower() not in ['volume', 'rupiah', 'harga', 'total', 'dpa', 'pagu', 'dan', 'atau']:
                        has_volume_satuan = True
                        vol_str = alt_match.group(1)
                        satuan = alt_match.group(2)
                        vol = float(vol_str.replace(',', '.'))

        if has_volume_satuan:
            vals = []
            for n in nominals:
                try:
                    v = int(n.replace('.', ''))
                    if v >= 1000: vals.append(v)
                except: pass
            
            if len(vals) >= 2:
                harga_total = max(vals)
                sorted_vals = sorted(vals, reverse=True)
                harga_sat = sorted_vals[1] if len(sorted_vals) > 1 else int(harga_total / vol)
                if abs(harga_sat * vol - harga_total) / max(harga_total, 1) > 0.10:
                    harga_sat = int(harga_total / vol) if vol > 0 else harga_sat
            elif len(vals) == 1:
                harga_total = vals[0]
                if harga_total > 5000:
                    harga_sat = int(harga_total / vol) if vol > 0 else harga_total
                else:
                    harga_sat = harga_total
                    harga_total = int(harga_sat * vol)
            else:
                has_volume_satuan = False

        if has_volume_satuan:
            first_num = re.search(r'\b\d', line)
            if not dpa_match:
                if 'volume:' in lower_line:
                    nama_raw = line[:lower_line.find('volume:')].strip()
                elif first_num:
                    nama_raw = line[:first_num.start()].strip()
                else:
                    nama_raw = line.strip()

            nama_raw = re.sub(r'[^\w\s/\-\.&,()\u00C0-\u024F]', '', nama_raw).strip()
            nama_raw = re.sub(r'[\-\s\.:]+$', '', nama_raw).strip()

            current_item = RincianItem(
                no=item_no,
                nama=nama_raw[:120],
                volume=vol,
                satuan=normalize_satuan(satuan),
                harga_satuan=harga_sat,
                harga_total=harga_total
            )
            items.append(current_item)
            item_no += 1
        else:
            # Does not have volume, so it might be specification
            if current_item is not None:
                clean_text = re.sub(r'[^\w\s/\-\.&,()\u00C0-\u024F]', '', line).strip()
                clean_text = re.sub(r'[\-\s\.:]+$', '', clean_text).strip()
                if len(clean_text) >= 3 and not re.match(r'^[0-9\s.,xX*()\-]+$', clean_text):
                    # check if it's a known non-spec text
                    if "sumber dana" in clean_text.lower():
                        continue
                    
                    if re.match(r'^(spesifikasi|spek|merk|tipe|type|ukuran|warna)[\s:]*', clean_text, re.IGNORECASE):
                        spec_text = re.sub(r'^(spesifikasi|spek|merk|tipe|type|ukuran|warna)[\s:]*', '', clean_text, flags=re.IGNORECASE).strip()
                        if spec_text:
                            current_item.nama += f" ({spec_text})"
                    else:
                        # Append as continuation if not explicitly a spec keyword
                        current_item.nama += f" {clean_text}"

    return items

sample = """
5.1.02.01.001.00024 Belanja Alat/Bahan untuk Kegiatan Kantor-Alat Tulis Kantor Rp5.027.800,00
[ # ] Alat Tulis Kantor Rp5.027.800,00
Sumber Dana: Sisa Lebih Perhitungan Anggaran Tahun Sebelumnya
[ - ] Alat Tulis Kantor Rp5.027.800,00
Alas Triplek 6 Biji Biji Rp15.900,00 0% Rp95.400,00
Spesifikasi: 
Ballpoint / Ballpen / Pena 6 Pack Pack Rp239.400,00 0% Rp1.436.400,00
Spesifikasi: Ballpoint Baliner
Ballpoint / Ballpen / Pena 10 Pack Pak Rp38.400,00 0% Rp384.000,00
Spesifikasi: Biasa, R6 Isi 12 Buah ( setara Standard )
Bantalan Stempel 10 Buah Buah Rp17.100,00 0% Rp171.000,00
Spesifikasi: Biasa
Gunting 5 Buah Buah Rp32.000,00 0% Rp160.000,00
Spesifikasi: Besar
"""

for it in extract_rincian_from_block(sample):
    print(it)

