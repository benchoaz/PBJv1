import re

text = """
Urusan : 7 - UNSUR KEWILAYAHAN
Bidang Urusan : 7.01 - KECAMATAN
Program : 7.01.01 - PROGRAM PENUNJANG
Kegiatan : 7.01.01.2.06 - Administrasi Umum
Sub Kegiatan : 7.01.01.2.06.0002 - Penyediaan Peralatan
5.1 BELANJA OPERASI 12.692.200,00 12.692.200,00 3.173.050,00 0,00 0,00 3.173.050,00 0,00 0,00 3.173.050,00 0,00 0,00 3.173.050,00 0,00 0,00
5.1.02 Belanja Barang 12.692.200,00 12.692.200,00 3.173.050,00 0,00 0,00 3.173.050,00 0,00 0,00 3.173.050,00 0,00 0,00 3.173.050,00 0,00 0,00
5.1.02.01.001.00024 Belanja Alat/Bahan untuk Kegiatan
Kantor - Alat Tulis
Kantor 5.027.800,00 5.027.800,00 1.256.950,00 0,00 0,00 1.256.950,00 0,00 0,00 1.256.950,00 0,00 0,00 1.256.950,00 0,00 0,00
5.1.02.01.001.00025 Belanja Makanan
5.000.000,00 5.000.000,00 1.000.000,00 0,00 0,00 1.000.000,00 0,00 0,00 1.000.000,00 0,00 0,00 1.000.000,00 0,00 0,00
"""

def extract_rka(text):
    # Find all Kode Rekening
    # A Kode Rekening is 5.1 or 5.1.02 etc
    # Let's use a regex that matches Kode Rekening, then lazily matches any characters until it sees 14 numbers
    # Wait, the 14 numbers might be separated by newlines!
    
    # Let's normalize spaces and newlines
    # But wait, we need to extract program, kegiatan, sub_kegiatan first!
    
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
        
    print("Prog:", current_program)
    print("Keg:", current_kegiatan)
    print("Sub:", current_sub_kegiatan)
    
    # Find all pattern: Kode Rekening -> text -> 14 numbers
    # A number format: \d{1,3}(?:\.\d{3})*(?:,\d+)?
    num_pattern = r'\d{1,3}(?:\.\d{3})*(?:,\d+)?'
    
    # We want to find: (kode) (uraian) (14 x num)
    # Since uraian might contain newlines, we can use re.DOTALL or just replace newlines with space first.
    clean_text = re.sub(r'\n', ' ', text)
    
    # The regex:
    # (?P<kode>\d+(?:\.\d+)*)\s+(?P<uraian>.*?)\s+(?P<nums>(?:(?:0,00|\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s+){13}(?:0,00|\d{1,3}(?:\.\d{3})*(?:,\d{2})?))
    # Wait, 14 numbers might not be exactly followed by spaces at the end
    
    number_re = r'(?:0(?:,00)?|\d{1,3}(?:\.\d{3})*(?:,\d+)?|-)'
    fourteen_nums = r'(?:' + number_re + r'\s+){13}' + number_re
    
    # But wait! A kode rekening must be at least one digit and one dot? "5.1" is \d+\.\d+
    # A kode rekening can be just \d\.\d+...
    kode_re = r'\b\d\.\d+(?:\.\d+)*\b'
    
    full_pattern = rf'({kode_re})\s+(.*?)\s+({fourteen_nums})'
    
    matches = re.findall(full_pattern, clean_text)
    for m in matches:
        print("MATCH:", m[0], "|", m[1], "|", m[2])

extract_rka(text)
