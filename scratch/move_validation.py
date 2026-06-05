import re

with open("frontend/src/components/ProcurementPanel.jsx", "r") as f:
    code = f.read()

# Use regex to find the block
pattern = r'(                \{\/\* ═══════════════════════════════════════════════════════════ \*\/}\n                \{\/\* SEKSI D: VALIDASI KEWAJARAN HARGA OLEH PP.*?)(              \{\/\* Tanda Tangan PP \*\/})'

match = re.search(pattern, code, flags=re.DOTALL)
if not match:
    print("Could not find the block using regex.")
    exit(1)

form_code = match.group(1)
tanda_tangan_marker = match.group(2)

static_docs_code = """                {/* ═══════════════════════════════════════════════════════════ */}
                {/* SEKSI D: VALIDASI KEWAJARAN HARGA OLEH PP (READ-ONLY)       */}
                {/* ═══════════════════════════════════════════════════════════ */}
                <div className="font-bold text-[11px] uppercase tracking-wide border-b border-slate-300 pb-1 mt-8 font-sans text-indigo-850 break-before-page">D. Validasi Kewajaran Harga oleh Pejabat Pengadaan (PP)</div>
                <p className="font-sans text-[10px] text-slate-600 mb-3">Sesuai <strong>Perpres No. 12 Tahun 2021 Pasal 50</strong> dan <strong>Peraturan LKPP No. 9 Tahun 2021</strong>, PP telah melakukan verifikasi kewajaran harga dengan hasil sebagai berikut:</p>

                <table className="w-full text-[9px] mb-4 font-sans">
                  <tbody>
                    <tr>
                      <td className="py-1 pr-2 font-bold text-slate-700 w-1/3 align-top">D.1 Verifikasi Kesetaraan Spesifikasi</td>
                      <td className="py-1 text-slate-800 font-bold border-l border-slate-300 pl-2">
                        {specEqual ? `[ ✓ ] ${specEqual}` : '[-] Belum diverifikasi'}
                        {specEqualNote && <div className="text-[8px] text-slate-500 font-normal mt-0.5">Catatan: {specEqualNote}</div>}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 pr-2 font-bold text-slate-700 w-1/3 align-top">D.2 Kelengkapan Komponen Harga</td>
                      <td className="py-1 text-slate-800 font-bold border-l border-slate-300 pl-2">
                        {Object.entries(priceChecklist).filter(([k,v]) => v).length > 0 ? (
                           Object.entries(priceChecklist).filter(([k,v]) => v).map(([k]) => (
                             <div key={k}>[ ✓ ] {
                               k === 'ppn' ? 'Harga sudah termasuk PPN 12%' : 
                               k === 'ongkir' ? 'Harga sudah termasuk Ongkos Kirim' :
                               k === 'instalasi' ? 'Biaya Instalasi / Set-up sudah termasuk' :
                               k === 'garansi' ? 'Masa dan Jenis Garansi telah dikonfirmasi' :
                               k === 'stok' ? 'Ketersediaan Stok (Ready) telah dikonfirmasi' :
                               k === 'resmi' ? 'Harga tercantum resmi di e-Katalog' : k
                             }</div>
                           ))
                        ) : '[-] Belum diverifikasi'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 pr-2 font-bold text-slate-700 w-1/3 align-top">D.3 Verifikasi Kewajaran Nilai</td>
                      <td className="py-1 text-slate-800 font-bold border-l border-slate-300 pl-2">
                        {hasDiscount ? (
                           <>
                             <div>[ ✓ ] Ya, harga ini wajar dan dapat dipertanggungjawabkan. Terdapat diskon / program promosi khusus.</div>
                             {discountPrice && <div className="text-[8px] text-slate-500 font-normal mt-0.5">Harga Promo: Rp {parseInt(discountPrice).toLocaleString('id-ID')}</div>}
                           </>
                        ) : '[ ] Tidak ada diskon, harga tayang adalah harga pas (wajar berdasarkan spesifikasi).'}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="font-bold text-[11px] uppercase tracking-wide border-b border-slate-300 pb-1 mt-6 font-sans text-indigo-850">E. Bukti Komunikasi & Kesepakatan Tambahan</div>
                <div className="text-[9px] font-sans mb-4 mt-2">
                  <div className="mb-2"><strong>Bukti Tangkapan Layar Chat / Negosiasi:</strong> {chatCaptures.length > 0 ? `${chatCaptures.length} dokumen terlampir pada arsip fisik` : 'Tidak ada lampiran komunikasi.'}</div>
                  {chatNotes && <div className="mb-2"><strong>Ringkasan Kesepakatan:</strong> {chatNotes}</div>}
                  <div className="mb-1"><strong>Kesepakatan Pengiriman:</strong> {deliveryAgreement || '-'}</div>
                  <div><strong>Kesepakatan Garansi:</strong> {warrantyAgreement || '-'}</div>
                </div>

                <div className="font-bold text-[11px] uppercase tracking-wide border-b border-slate-300 pb-1 mt-6 font-sans text-indigo-850">F. Mekanisme & Cara Pembayaran</div>
                <div className="text-[9px] font-sans mb-4 mt-2">
                  <div className="font-bold">Termin Pembayaran: {paymentTerms}</div>
                </div>

                <div className="font-bold text-[11px] uppercase tracking-wide border-b border-slate-300 pb-1 mt-6 font-sans text-indigo-850">G. Penilaian Kinerja Penyedia (Vendor Rating)</div>
                <div className="text-[9px] font-sans mb-6 mt-2 border border-slate-300 p-2 bg-slate-50">
                  <div className="font-bold text-lg mb-1">{'★'.repeat(vendorRating || 0)}{'☆'.repeat(5-(vendorRating || 0))}</div>
                  <div className="font-bold mb-1">Status: {vendorRatingStatus || 'Belum dinilai'}</div>
                  <div className="italic text-slate-600">Catatan: {vendorRatingNote || 'Tidak ada catatan evaluasi.'}</div>
                </div>

                <p className="mt-8 font-sans text-[10px] text-slate-500 italic">
                  Demikian Berita Acara Hasil Pemilihan (BAHP) ini dibuat secara elektronik oleh Pejabat Pengadaan untuk menjadi dokumen pertanggungjawaban dalam audit belanja dinas e-Purchasing.
                </p>
              </div>

"""

# Replace the old form with static read-only in the docs tab
code = code[:match.start()] + static_docs_code + code[match.end(1):]


# Now inject the old form into the search tab
insert_target = """            <div className="mt-8 flex justify-end">
              <button 
                onClick={async () => {"""

if insert_target not in code:
    print("Could not find insertion target for the form in search tab.")
    exit(1)

form_code_adjusted = form_code.replace('mt-8 font-sans', 'mt-8').replace('border-b border-slate-300', 'border-b border-slate-200')

# Need to escape curly braces in form_code_adjusted if using f-string, or just use string concatenation
wrapped_form_code = """            {/* --- MOVED VALIDATION FORMS --- */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mt-6">
              <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                <span>📋</span> Validasi & Pengaturan Negosiasi
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                Silakan lengkapi form validasi spesifikasi, kesepakatan pengiriman, dan penilaian vendor di bawah ini sebelum menerbitkan BAHP.
              </p>
""" + form_code_adjusted + """
            </div>
            
"""

code = code.replace(insert_target, wrapped_form_code + insert_target)

with open("frontend/src/components/ProcurementPanel.jsx", "w") as f:
    f.write(code)

print("Forms successfully moved and replaced.")
