import asyncio
from dpa_parser.rka_parser import refine_rka_with_ai
import fitz

doc = fitz.open("/home/beni/PBJ/dpa-parser/logs/debug_uploaded_rka.pdf")
text_to_parse = "\n".join(page.get_text() for page in doc)
lines = text_to_parse.split('\n')
chunk_size = 150
chunks = ['\n'.join(lines[i:i + chunk_size]) for i in range(0, len(lines), chunk_size)]

print("Total chunks:", len(chunks))
if len(chunks) > 0:
    chunk = chunks[0]
    print("Testing chunk 0")
    items = refine_rka_with_ai(chunk, "groq", "gsk_Vf1mQ9r28271n8lXb0M4WGdyb3FYX9D7h6C3xW0GjK6rX9P2")
    print("Extracted:", items)
