import fitz
doc = fitz.open()
page = doc.new_page()
print(hasattr(page, "find_tables"))
