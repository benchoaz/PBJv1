import re

def patch_file():
    with open('dpa-parser/main.py', 'r') as f:
        content = f.read()

    # Find the end of the for loop in extract_rincian_from_block
    # The loop ends around line 434
    
    target = """                item_no += 1
            except Exception:
                pass"""

    replacement = """                item_no += 1
            except Exception:
                pass
            continue

        # JIKA TIDAK ADA VOLUME/SATUAN YANG MATCH (Bukan baris item baru)
        # Cek apakah baris ini adalah sambungan Spesifikasi untuk item terakhir
        if items:
            clean_line = re.sub(r'[^\\w\\s/\\-\\.&,()\\u00C0-\\u024F]', '', line).strip()
            clean_line = re.sub(r'[\\-\\s\\.:]+$', '', clean_line).strip()
            if len(clean_line) > 3 and not re.match(r'^[0-9\\s.,xX*()\\-]+$', clean_line):
                # Abaikan baris header atau metadata
                if any(kw in clean_line.lower() for kw in ['sumber dana', 'belanja', 'alat tulis', 'jumlah', 'total', 'ppn']):
                    continue
                # Jika diawali kata spesifikasi/spek
                spec_match = re.match(r'^(?:spesifikasi|spek|merk|tipe|type|ukuran|warna)[\\s:]*(.*)$', clean_line, re.IGNORECASE)
                if spec_match:
                    spec_text = spec_match.group(1).strip()
                    if spec_text:
                        items[-1].nama += f" (Spesifikasi: {spec_text})"
                else:
                    # Jika baris sebelumnya adalah "Spesifikasi:" saja, maka baris ini mungkin isinya
                    if items[-1].nama.endswith("(Spesifikasi: )"):
                        items[-1].nama = items[-1].nama[:-1] + clean_line + ")"
"""
    if target in content:
        new_content = content.replace(target, replacement)
        with open('dpa-parser/main.py', 'w') as f:
            f.write(new_content)
        print("Patched successfully!")
    else:
        print("Target not found!")

patch_file()
