"""
DPA Mock PDF Generator
======================
Script to programmatically generate two mock DPA PDFs:
1. dpa_native.pdf: Contains structured digital text layer and exact coordinate layout.
2. dpa_scanned.pdf: Scanned PDF format containing only high-resolution rasterized page images (no text layer) to trigger Tesseract.
"""

import os
import fitz  # PyMuPDF
from pdf2image import convert_from_path
from PIL import Image

def generate_native_dpa():
    print("Generating dpa_native.pdf...")
    doc = fitz.open()
    # Create standard A4 portrait page (595 x 842 points)
    page = doc.new_page(width=595, height=842)
    
    # 1. Title Header
    page.insert_text((50, 45), "DOKUMEN PELAKSANAAN ANGGARAN", fontsize=13, fontname="helvetica-bold")
    page.insert_text((50, 62), "PEJABAT PEMBUAT KOMITMEN (PPK) KABUPATEN PROBOLINGGO", fontsize=11, fontname="helvetica-bold")
    page.insert_text((50, 77), "Dinas Pendidikan Kabupaten Probolinggo - TA 2026", fontsize=9, fontname="helvetica-oblique")
    
    # Draw double divider line
    page.draw_line((50, 90), (545, 90), color=(0.1, 0.1, 0.1), width=1.5)
    page.draw_line((50, 93), (545, 93), color=(0.1, 0.1, 0.1), width=0.5)

    # 2. Table Headers
    page.insert_text((50, 125), "KODE REKENING", fontsize=9, fontname="helvetica-bold")
    page.insert_text((180, 125), "URAIAN REKENING & RINCIAN BELANJA", fontsize=9, fontname="helvetica-bold")
    page.insert_text((475, 125), "JUMLAH (Rp)", fontsize=9, fontname="helvetica-bold")

    # Table lines
    page.draw_line((50, 112), (545, 112), color=(0.2, 0.2, 0.2), width=1)
    page.draw_line((50, 134), (545, 134), color=(0.2, 0.2, 0.2), width=1)

    # 3. Row 1: Belanja Alat Tulis Kantor
    page.insert_text((50, 160), "5.1.02.01.001.00024", fontsize=8.5, fontname="helvetica")
    page.insert_text((180, 160), "Belanja Alat Tulis Kantor", fontsize=8.5, fontname="helvetica-bold")
    page.insert_text((180, 175), "Penyediaan ATK Kantor Cabang [Sumber Dana: DAU]", fontsize=8, fontname="helvetica")
    page.insert_text((180, 188), "Volume: 120 Rim x Rp 45.000", fontsize=8, fontname="helvetica-oblique")
    page.insert_text((475, 160), "5.400.000", fontsize=9, fontname="helvetica-bold")

    # Row 2: Belanja Kertas dan Cover
    page.insert_text((50, 220), "5.1.02.01.001.00025", fontsize=8.5, fontname="helvetica")
    page.insert_text((180, 220), "Belanja Kertas dan Cover", fontsize=8.5, fontname="helvetica-bold")
    page.insert_text((180, 235), "Cetak Brosur & Dokumen Persiapan [Sumber Dana: PAD]", fontsize=8, fontname="helvetica")
    page.insert_text((180, 248), "Volume: 150 Rim x Rp 30.000", fontsize=8, fontname="helvetica-oblique")
    page.insert_text((475, 220), "4.500.000", fontsize=9, fontname="helvetica-bold")

    # Row 3: Belanja Bahan Komputer (Tinta Printer)
    page.insert_text((50, 280), "5.1.02.01.001.00029", fontsize=8.5, fontname="helvetica")
    page.insert_text((180, 280), "Belanja Bahan Komputer", fontsize=8.5, fontname="helvetica-bold")
    page.insert_text((180, 295), "Pengadaan Tinta Printer LaserJet [Sumber Dana: DAU]", fontsize=8, fontname="helvetica")
    page.insert_text((180, 308), "Volume: 20 Box x Rp 150.000", fontsize=8, fontname="helvetica-oblique")
    page.insert_text((475, 280), "3.000.000", fontsize=9, fontname="helvetica-bold")

    # Bottom border
    page.draw_line((50, 330), (545, 330), color=(0.2, 0.2, 0.2), width=1)
    
    # Save document
    doc.save("dpa_native.pdf")
    doc.close()
    print("dpa_native.pdf successfully generated!")

def generate_scanned_dpa():
    print("Generating dpa_scanned.pdf from native images...")
    # Convert native PDF to image
    images = convert_from_path("dpa_native.pdf", dpi=150)
    
    # Save image as a completely new, textless PDF
    images[0].save("dpa_scanned.pdf", "PDF", resolution=150.0, save_all=True)
    print("dpa_scanned.pdf successfully generated!")

if __name__ == "__main__":
    generate_native_dpa()
    generate_scanned_dpa()
    print("All test PDFs successfully generated!")
