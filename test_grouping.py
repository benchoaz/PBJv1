import fitz
import json
import re

doc = fitz.open('/tmp/pbj_logs/debug_uploaded_dpa.pdf')

def test():
    rekenings = []
    current_rek = None
    group_major = ""
    group_minor = ""
    
    for page in doc:
        tables = page.find_tables()
        for tab in tables:
            extracted = tab.extract()
            for row in extracted:
                clean_row = [c.replace("\n", " ").strip() if c is not None else "" for c in row]
                if not any(clean_row): continue
                
                kode_match = re.search(r'\b5\.[12]\.\d{2}\.\d{2}\.\d{3}\.\d{5}\b', clean_row[0] + " " + clean_row[1])
                if kode_match:
                    if current_rek and current_rek["pagu"] > 0:
                        rekenings.append(current_rek)
                        
                    kode = kode_match.group(0)
                    uraian = clean_row[1] if clean_row[1] else clean_row[0]
                    pagu_str = clean_row[-1].replace('Rp', '').replace('.', '').replace(',00', '').strip()
                    pagu = int(pagu_str) if pagu_str.isdigit() else 0
                    
                    current_rek = {"kode": kode, "pagu": pagu, "rincian": []}
                    group_major = ""
                    group_minor = ""
                    continue
                    
                if current_rek:
                    vol_text = clean_row[2] if len(clean_row) > 2 else ""
                    
                    if len(clean_row) > 1 and not vol_text:
                        if re.match(r'^\[\s*#\s*\]', clean_row[1]):
                            group_major = re.sub(r'^\[\s*#\s*\]\s*', '', clean_row[1]).strip()
                            group_minor = ""
                        elif re.match(r'^\[\s*\-\s*\]', clean_row[1]):
                            group_minor = re.sub(r'^\[\s*\-\s*\]\s*', '', clean_row[1]).strip()
                    
                    if vol_text and re.search(r'\d+', vol_text):
                        nama_asli = clean_row[1]
                        combined_group = ""
                        if group_major and group_minor:
                            combined_group = f"[{group_major} - {group_minor}]"
                        elif group_major:
                            combined_group = f"[{group_major}]"
                        elif group_minor:
                            combined_group = f"[{group_minor}]"
                            
                        nama_final = f"{combined_group} {nama_asli}".strip() if combined_group else nama_asli
                        
                        harga_str = clean_row[4].replace('Rp', '').replace('.', '').replace(',00', '').strip() if len(clean_row) > 4 else "0"
                        harga_tot = int(harga_str) if harga_str.isdigit() else 0
                        if harga_tot > 0:
                            current_rek["rincian"].append(nama_final)

    if current_rek and current_rek["pagu"] > 0:
        rekenings.append(current_rek)
        
    return rekenings

print(json.dumps([r for r in test() if "5.1.02.01.001.00052" in r["kode"]], indent=2))
