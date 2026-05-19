import fitz

def debug():
    doc = fitz.open("dpa_native.pdf")
    print("=== DPA TEXT CONTENT ===")
    for idx, page in enumerate(doc):
        print(f"--- PAGE {idx+1} ---")
        print(page.get_text())

if __name__ == "__main__":
    debug()
