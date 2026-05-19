import fitz
import re
from main import run_extraction_pipeline

def test():
    print("=== TESTING NATIVE DPA ===")
    doc = fitz.open("dpa_native.pdf")
    res = run_extraction_pipeline(doc, "", use_ocr=False)
    print(f"Total rekening terdeteksi: {len(res)}")
    for r in res:
        print(f"Rekening: {r.kode_rekening} | Pagu: {r.pagu} | Rincian count: {len(r.rincian)}")
        for item in r.rincian:
            print(f"  - {item.nama} | Vol: {item.volume} {item.satuan} | Harga: {item.harga_satuan} | Total: {item.harga_total}")

    print("\n=== TESTING FULL MAK PATTERN (7.01.01.2.06.0002.5.1.02.01.001.00024) ===")
    test_text = """
    7.01.01.2.06.0002.5.1.02.01.001.00024
    Belanja Alat Tulis Kantor Kecamatan Besuk
    Penyediaan Kertas HVS Kantor Besuk [Sumber Dana: DAU]
    Volume: 50 Rim x Rp 50.000
    2.500.000
    """
    temp_doc = fitz.open()
    temp_doc.new_page()
    res_mak = run_extraction_pipeline(temp_doc, test_text, use_ocr=True)
    temp_doc.close()
    print(f"Total rekening MAK terdeteksi: {len(res_mak)}")
    for r in res_mak:
        print(f"Rekening MAK: {r.kode_rekening} | Pagu: {r.pagu} | Rincian count: {len(r.rincian)}")
        for item in r.rincian:
            print(f"  - {item.nama} | Vol: {item.volume} {item.satuan} | Harga: {item.harga_satuan} | Total: {item.harga_total}")

if __name__ == "__main__":
    test()
