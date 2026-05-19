import re

NOMINAL = re.compile(r'\b(\d{1,3}(?:\.\d{3})+)(?:,\d{0,2})?\b')
SATUAN_LIST = ['Unit','Buah','Rim','Lembar','Paket','Set','Bh','Pcs','Box','Keping',
               'Roll','Botol','Liter','Kg','M','Meter','Dus','Lusin','Pasang','Eksemplar',
               'Biji','Pack','Lembar','Tube','Kaleng']
SATUAN_PAT = re.compile(
    r'(\d+(?:[,.]\d+)?)\s*(' + '|'.join(SATUAN_LIST) + r')\b',
    re.IGNORECASE
)

def debug_smart():
    block_text = """Belanja Alat Tulis Kantor
Penyediaan ATK Kantor Cabang [Sumber Dana: DAU]
Volume: 120 Rim x Rp 45.000
5.400.000"""

    print("=== TESTING SMART FALLBACK ===")
    lines = [l.strip() for l in block_text.split('\n') if l.strip()]
    
    # Gabungkan baris total nominal
    merged_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if i + 1 < len(lines):
            next_line = lines[i+1].strip()
            if re.match(r'^\d{1,3}(\.\d{3})+(,\d+)?$', next_line) or re.match(r'^\d+$', next_line):
                line = line + " " + next_line
                i += 1
        merged_lines.append(line)
        i += 1
        
    print(f"Merged lines: {merged_lines}")
    
    for idx, line in enumerate(merged_lines):
        if len(line) < 4:
            continue
        if any(kw in line.lower() for kw in ['kode rekening', 'uraian rekening', 'anggaran']):
            continue
            
        nominals = NOMINAL.findall(line)
        sat_match = SATUAN_PAT.search(line)
        
        # Ekstrak nama
        first_num = re.search(r'\b\d', line)
        if 'volume:' in line.lower():
            pos_vol = line.lower().find('volume:')
            nama_raw = line[:pos_vol].strip()
        elif first_num:
            nama_raw = line[:first_num.start()].strip()
        else:
            nama_raw = line.strip()
            
        # Bersihkan nama
        nama_raw = re.sub(r'[^\w\s/\-\.&,()\u00C0-\u024F]', '', nama_raw).strip()
        nama_raw = re.sub(r'[\-\s\.:]+$', '', nama_raw).strip()
        
        # JIKA nama kosong tapi ada satuan & volume, ambil dari baris sebelumnya!
        if not nama_raw or len(nama_raw) < 3:
            if idx > 0:
                prev_line = merged_lines[idx - 1]
                # Bersihkan prev_line
                prev_clean = re.sub(r'[^\w\s/\-\.&,()\u00C0-\u024F]', '', prev_line).strip()
                prev_clean = re.sub(r'[\-\s\.:]+$', '', prev_clean).strip()
                if len(prev_clean) >= 3:
                    nama_raw = prev_clean
                    
        print(f"\nUraian: '{nama_raw}'")
        print(f"  Volume: {sat_match.group(1) if sat_match else 1.0} {sat_match.group(2) if sat_match else 'Buah'}")
        print(f"  Nominals: {nominals}")

if __name__ == "__main__":
    debug_smart()
