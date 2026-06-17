import fitz
import json
import re

doc = fitz.open('/tmp/pbj_logs/debug_uploaded_dpa.pdf')

def parse_dpa_tables(doc):
    rekenings = []
    current_rek = None
    
    for page in doc:
        tables = page.find_tables()
        for tab in tables:
            extracted = tab.extract()
            for row in extracted:
                clean_row = [c.replace("\n", " ").strip() if c is not None else "" for c in row]
                if not any(clean_row): continue
                
                # Check for rekening (e.g., 5.1.02.01.001.00052 in col 0 or 1)
                kode_match = re.search(r'\b5\.[12]\.\d{2}\.\d{2}\.\d{3}\.\d{5}\b', clean_row[0] + " " + clean_row[1])
                if kode_match:
                    kode = kode_match.group(0)
                    uraian = clean_row[1] if clean_row[1] else clean_row[0]
                    pagu_str = clean_row[-1].replace('Rp', '').replace('.', '').replace(',00', '').strip()
                    pagu = int(pagu_str) if pagu_str.isdigit() else 0
                    current_rek = {
                        "kode": kode, "uraian": uraian, "pagu": pagu, "rincian": []
                    }
                    rekenings.append(current_rek)
                    continue
                    
                if current_rek:
                    # Check if it's a rincian item (has volume in col 2)
                    vol_text = clean_row[2] if len(clean_row) > 2 else ""
                    if vol_text and re.search(r'\d+', vol_text):
                        # Extract volume
                        vol_match = re.findall(r'\d+', vol_text)
                        vol = 1
                        if len(vol_match) == 2 and 'x' in vol_text.lower():
                            vol = int(vol_match[0]) * int(vol_match[1])
                        elif len(vol_match) > 0:
                            vol = int(vol_match[0])
                            
                        nama = clean_row[1]
                        satuan = clean_row[3] if len(clean_row) > 3 else "Buah"
                        harga_str = clean_row[4].replace('Rp', '').replace('.', '').replace(',00', '').strip() if len(clean_row) > 4 else "0"
                        total_str = clean_row[-1].replace('Rp', '').replace('.', '').replace(',00', '').strip() if len(clean_row) > 5 else "0"
                        
                        harga_sat = int(harga_str) if harga_str.isdigit() else 0
                        harga_tot = int(total_str) if total_str.isdigit() else 0
                        
                        if harga_tot > 0:
                            current_rek["rincian"].append({
                                "nama": nama, "volume": vol, "satuan": satuan, "harga_satuan": harga_sat, "harga_total": harga_tot
                            })
                    elif len(clean_row) > 1 and clean_row[1].startswith("[ - ]"):
                        # Grouping header, append as parent? Actually we can ignore or append to next items
                        pass
    return rekenings

print(json.dumps(parse_dpa_tables(doc), indent=2))

