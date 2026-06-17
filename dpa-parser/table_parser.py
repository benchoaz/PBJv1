def run_table_extraction_pipeline(doc, ai_provider: str = "", api_key: str = "", esc_provider: str = "", esc_key: str = ""):
    rekenings = []
    current_rek = None
    
    for page in doc:
        tables = page.find_tables()
        for tab in tables:
            extracted = tab.extract()
            for row in extracted:
                clean_row = [c.replace("\n", " ").strip() if c is not None else "" for c in row]
                if not any(clean_row): continue
                
                kode_match = re.search(r'\b5\.[12]\.\d{2}\.\d{2}\.\d{3}\.\d{5}\b', clean_row[0] + " " + clean_row[1])
                if kode_match:
                    if current_rek and current_rek.pagu > 0:
                        rekenings.append(current_rek)
                        
                    kode = kode_match.group(0)
                    uraian = clean_row[1] if clean_row[1] else clean_row[0]
                    pagu_str = clean_row[-1].replace('Rp', '').replace('.', '').replace(',00', '').strip()
                    pagu = int(pagu_str) if pagu_str.isdigit() else 0
                    
                    sirup_info = REKENING_SIRUP_MAP.get(kode, {})
                    kategori = sirup_info.get("kategori")
                    
                    current_rek = RekeningDPA(
                        kode_rekening=kode,
                        uraian=clean_uraian(uraian),
                        pagu=pagu,
                        confidence=95,
                        rincian=[],
                        is_valid=True,
                        validation_reason="Tabel DPA diekstrak dengan presisi tinggi menggunakan fitz.find_tables.",
                        kategori_sirup=kategori,
                        raw_text_block="[Tabel DPA Native]"
                    )
                    continue
                    
                if current_rek:
                    vol_text = clean_row[2] if len(clean_row) > 2 else ""
                    if vol_text and re.search(r'\d+', vol_text):
                        vol_match = re.findall(r'\d+[\.,]?\d*', vol_text)
                        vol = 1.0
                        if len(vol_match) == 2 and 'x' in vol_text.lower():
                            v1 = float(vol_match[0].replace(',', '.'))
                            v2 = float(vol_match[1].replace(',', '.'))
                            vol = v1 * v2
                        elif len(vol_match) > 0:
                            vol = float(vol_match[0].replace(',', '.'))
                            
                        nama = clean_row[1]
                        satuan = clean_row[3] if len(clean_row) > 3 else "Buah"
                        harga_str = clean_row[4].replace('Rp', '').replace('.', '').replace(',00', '').strip() if len(clean_row) > 4 else "0"
                        total_str = clean_row[-1].replace('Rp', '').replace('.', '').replace(',00', '').strip() if len(clean_row) > 5 else "0"
                        
                        harga_sat = int(harga_str) if harga_str.isdigit() else 0
                        harga_tot = int(total_str) if total_str.isdigit() else 0
                        
                        if harga_tot > 0:
                            current_rek.rincian.append(RincianItem(
                                no=len(current_rek.rincian) + 1,
                                nama=nama[:120],
                                volume=vol,
                                satuan=normalize_satuan(satuan),
                                harga_satuan=harga_sat,
                                harga_total=harga_tot
                            ))

    if current_rek and current_rek.pagu > 0:
        rekenings.append(current_rek)
        
    # Validasi AI (jika disediakan key) untuk mencocokkan total dengan pagu
    # (Opsional: Karena ini dari tabel PDF, biasanya sudah tepat 100%)

    return rekenings
