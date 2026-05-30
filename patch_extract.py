import re

def update_main():
    with open('/home/beni/PBJ/dpa-parser/main.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    start_str = "# ── Ekstrak Rincian Item dari blok teks ─────────────────────────────────────\ndef extract_rincian_from_block(block_text: str) -> List[RincianItem]:"
    end_str = "# ── AI Refinement: Merapikan & Membaca Rincian otomatis ──────────────────────"
    
    start_idx = content.find(start_str)
    end_idx = content.find(end_str)
    
    if start_idx == -1 or end_idx == -1:
        print("Could not find start or end block")
        return
        
    new_func = """# ── Ekstrak Rincian Item dari blok teks ─────────────────────────────────────
def extract_rincian_from_block(block_text: str) -> List[RincianItem]:
    \"\"\"
    Parsing baris-baris dalam blok rekening untuk mengekstrak item rincian.
    Mendukung penggabungan multi-baris dan State-Machine untuk nama/spesifikasi.
    \"\"\"
    items = []
    lines = [l.strip() for l in block_text.split('\\n') if l.strip()]

    # Gabungkan baris total nominal (jika terpisah di baris berikutnya)
    merged_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if i + 1 < len(lines):
            next_line = lines[i+1].strip()
            # Cek apakah next_line adalah nominal murni (misal: 5.400.000 atau 5400000)
            if re.match(r'^\\d{1,3}(\\.\\d{3})+(,\\d+)?$', next_line) or re.match(r'^\\d+$', next_line):
                line = line + " " + next_line
                i += 1
        merged_lines.append(line)
        i += 1

    item_no = 1
    current_name_buffer = []  # State-machine buffer untuk nama & spesifikasi

    for line in merged_lines:
        if len(line) < 4:
            continue
        lower_line = line.lower()
        if any(kw in lower_line for kw in ['kode rekening', 'uraian rekening', 'anggaran', 'rencana realisasi', 'jumlah anggaran sub kegiatan', 'rincian perhitungan']):
            continue
        if re.match(r'^(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\\b', lower_line):
            continue
        if re.search(r'rp\\.?\\s*0(?:[,.]00)?\\b', line, re.IGNORECASE):
            continue

        dpa_match = DPA_LINE_PAT.search(line)
        nominals = NOMINAL.findall(line)
        
        # Cek apakah baris ini memiliki indikasi angka (volume/harga)
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
            multi_match = re.search(r'(\\d+(?:[,.]\\d+)?)\\s*([a-zA-Z]{2,10})\\s*x\\s*(\\d+(?:[,.]\\d+)?)\\s*([a-zA-Z]{2,10})', line, re.IGNORECASE)
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
                    alt_match = re.search(r'(?:volume:?\\s*)?(\\d+[\\.,]?\\d*)\\s*([a-zA-Z]{2,12})\\b', line, re.IGNORECASE)
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
                first_num = re.search(r'\\b\\d', line)
                if 'volume:' in lower_line:
                    nama_raw = line[:lower_line.find('volume:')].strip()
                elif first_num:
                    nama_raw = line[:first_num.start()].strip()
                else:
                    nama_raw = line.strip()

        # STATE MACHINE LOGIC
        if not has_volume_satuan:
            # Baris ini bukan item rincian yang valid (kemungkinan nama barang / spesifikasi yang terpotong)
            clean_text = re.sub(r'[^\\w\\s/\\-\\.&,()\\u00C0-\\u024F]', '', line).strip()
            clean_text = re.sub(r'[\\-\\s\\.:]+$', '', clean_text).strip()
            if len(clean_text) >= 3 and not re.match(r'^[0-9\\s.,xX*()\\-]+$', clean_text):
                current_name_buffer.append(clean_text)
        else:
            # Baris ini adalah item rincian valid!
            nama_raw = re.sub(r'[^\\w\\s/\\-\\.&,()\\u00C0-\\u024F]', '', nama_raw).strip()
            nama_raw = re.sub(r'[\\-\\s\\.:]+$', '', nama_raw).strip()
            
            final_name_parts = []
            if current_name_buffer:
                for buf in current_name_buffer:
                    if re.match(r'^(spesifikasi|spek|merk|tipe|type|ukuran|warna)\\s*[:\\-]?\\s*$', buf, re.IGNORECASE):
                        continue
                    final_name_parts.append(buf)
            
            if nama_raw and not re.match(r'^(spesifikasi|spek|merk|tipe|type|ukuran|warna)\\s*[:\\-]?\\s*$', nama_raw, re.IGNORECASE):
                final_name_parts.append(nama_raw)
                
            if final_name_parts:
                final_name = " ".join(final_name_parts)
                if len(final_name_parts) > 1:
                    main_item = final_name_parts[0]
                    specs = ", ".join(final_name_parts[1:])
                    final_name = f"{main_item} ({specs})"
            else:
                final_name = "Item Detail DPA"
            
            items.append(RincianItem(
                no=item_no,
                nama=final_name[:120],
                volume=vol,
                satuan=normalize_satuan(satuan),
                harga_satuan=harga_sat,
                harga_total=harga_total
            ))
            item_no += 1
            current_name_buffer = []

    return items

"""
    new_content = content[:start_idx] + new_func + content[end_idx:]
    with open('/home/beni/PBJ/dpa-parser/main.py', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Updated extract_rincian_from_block in main.py")

update_main()
