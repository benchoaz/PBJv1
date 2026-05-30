import re
import fitz

def extract_global_metadata(text: str) -> dict:
    meta = {
        "program": None,
        "kegiatan": None,
        "sub_kegiatan": None,
        "lokasi": None,
        "waktu_pelaksanaan": None
    }
    if not text:
        return meta
        
    prog_match = re.search(r'Program\s*(?::\s*|\n:?\s*|\s{2,})([^\n]+)', text, re.IGNORECASE)
    if prog_match: meta["program"] = prog_match.group(1).strip()
    
    keg_match = re.search(r'Kegiatan\s*(?::\s*|\n:?\s*|\s{2,})([^\n]+)', text, re.IGNORECASE)
    if keg_match: meta["kegiatan"] = keg_match.group(1).strip()
    
    sub_keg_match = re.search(r'Sub\s*Kegiatan\s*(?::\s*|\n:?\s*|\s{2,})([^\n]+)', text, re.IGNORECASE)
    if sub_keg_match: meta["sub_kegiatan"] = sub_keg_match.group(1).strip()
    
    lokasi_match = re.search(r'Lokasi\s*(?::\s*|\n:?\s*|\s{2,})([^\n]+)', text, re.IGNORECASE)
    if lokasi_match: meta["lokasi"] = lokasi_match.group(1).strip()
    
    waktu_match = re.search(r'Waktu\s*Pelaksanaan\s*(?::\s*|\n:?\s*|\s{2,})([^\n]+)', text, re.IGNORECASE)
    if waktu_match: meta["waktu_pelaksanaan"] = waktu_match.group(1).strip()
    
    return meta

if __name__ == "__main__":
    doc = fitz.open("dpa-parser/logs/debug_uploaded_dpa.pdf")
    text = "\n".join(page.get_text() for page in doc)
    print("PyMuPDF Metadata:", extract_global_metadata(text))

