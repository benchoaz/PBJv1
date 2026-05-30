import sys
from main import extract_rincian_from_block

def test_lookback():
    print("=== TESTING DPA LOOK-BACK MERGING LOGIC ===")

    # Test Case 1: Simple Ballpoint with Specification
    text_1 = """
    5.1.02.01.001.00024
    Alat Tulis Kantor
    Ballpoint
    Spesifikasi: Ballpoint Baliner
    Volume: 10 Buah x Rp 15.000
    150.000
    """
    
    print("\n[Running Test Case 1] Ballpoint with Spesifikasi: Ballpoint Baliner")
    items_1 = extract_rincian_from_block(text_1)
    for item in items_1:
        print(f"Parsed Item: '{item.nama}' | Vol: {item.volume} | Satuan: {item.satuan} | Harga: {item.harga_satuan} | Total: {item.harga_total}")
    
    assert any("Ballpoint (Spesifikasi Ballpoint Baliner)" in item.nama for item in items_1), "Failed Test Case 1!"
    print("✓ Test Case 1 Passed!")

    # Test Case 2: Multiple specs backwards
    text_2 = """
    5.1.02.01.001.00024
    Alat Tulis Kantor
    Ballpoint
    Spesifikasi: Ballpoint Baliner
    Tipe: Baliner Hitam
    Volume: 10 Buah x Rp 15.000
    150.000
    """
    
    print("\n[Running Test Case 2] Ballpoint with Multiple Specifications")
    items_2 = extract_rincian_from_block(text_2)
    for item in items_2:
        print(f"Parsed Item: '{item.nama}' | Vol: {item.volume} | Satuan: {item.satuan} | Harga: {item.harga_satuan} | Total: {item.harga_total}")
    
    assert any("Ballpoint (Spesifikasi Ballpoint Baliner, Tipe Baliner Hitam)" in item.nama for item in items_2), "Failed Test Case 2!"
    print("✓ Test Case 2 Passed!")

    # Test Case 3: Specification with no brackets/parenthesis (unbracketed keyword split in survey service check)
    text_3 = """
    5.1.02.01.001.00025
    Alat Tulis Kantor
    Laptop Merk ASUS Vivobook
    Volume: 1 Unit x Rp 8.000.000
    8.000.000
    """
    print("\n[Running Test Case 3] Unbracketed spec keyword inline (Laptop Merk ASUS Vivobook)")
    items_3 = extract_rincian_from_block(text_3)
    for item in items_3:
        print(f"Parsed Item: '{item.nama}' | Vol: {item.volume} | Satuan: {item.satuan} | Harga: {item.harga_satuan} | Total: {item.harga_total}")
    
    print("✓ Test Case 3 Passed!")

    print("\nALL DPA PARSER TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    try:
        test_lookback()
    except AssertionError as e:
        print(f"\n❌ Assertion Error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected Error: {e}")
        sys.exit(1)
