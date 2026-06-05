import re

with open("frontend/src/components/ProcurementPanel.jsx", "r") as f:
    content = f.read()

# 1. Replace the legacy table blocks for BAHP (lines 1420-1500)
# We will use regex to find the entire block from "Komoditas LAPTOP" down to the button
start_marker = "{/* Laptop Row */}"
end_marker = "                        <button \n                          onClick={async () => {\n                            if (!submittedPack || !submittedPack.id) {\n                              setActiveTab('docs');\n                              alert('Berita Acara Hasil Pemilihan (BAHP) Pengadaan Langsung secara e-Purchasing berhasil dibuat (Mode Simulasi Lokal).');\n                              return;\n                            }"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    new_table_block = """                      {/* DYNAMIC BAHP DOCUMENTATION LIST */}
                      {getPackageItems(submittedPack).filter(item => checkedItems[item.no]).map(item => {
                        const doc = savedDocs[item.name] || {};
                        return (
                          <div key={item.no} className="mb-4">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-slate-700">📦 Komoditas {item.name}:</span>
                              {doc.selectedProduct ? (
                                <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full">TERDOKUMENTASI</span>
                              ) : (
                                <span className="text-[9px] bg-rose-100 text-rose-800 font-extrabold px-2 py-0.5 rounded-full">BELUM</span>
                              )}
                            </div>
                            {doc.selectedProduct && (
                              <div className="space-y-2 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                                <div className="font-semibold text-slate-800 truncate">{doc.selectedProduct.name}</div>
                                <div className="text-[10px] text-slate-500 font-mono truncate hover:underline" title={doc.url}>
                                  🔗 {doc.url}
                                </div>
                                {doc.screenshot && (
                                  <div className="relative group rounded overflow-hidden h-24 border border-slate-300">
                                    <img src={doc.screenshot} alt="Screenshot" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-[10px] text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                      Lihat Screenshot Inaproc
                                    </div>
                                  </div>
                                )}
                                <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-600 border-t border-slate-200 pt-1.5">
                                  <div>Harga Net: <strong>Rp {parseFloat(doc.negotiatedPrice || 0).toLocaleString('id-ID')}</strong></div>
                                  <div>Ongkir: <strong>Rp {parseFloat(doc.negotiatedOngkir || 0).toLocaleString('id-ID')}</strong></div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      
                      {getPackageItems(submittedPack).filter(item => checkedItems[item.no]).every(item => savedDocs[item.name]?.selectedProduct) && (
"""
    content = content[:start_idx] + new_table_block + content[end_idx:]

# 2. Replace the PDF generation variables and table
pdf_start_marker = "                              const vendor1 = savedDocs.laptop.selectedProduct?.vendor || '';"
pdf_end_marker = "                              const pdfUrl = blobUrl;"
pdf_start_idx = content.find(pdf_start_marker)
pdf_end_idx = content.find(pdf_end_marker)

if pdf_start_idx != -1 and pdf_end_idx != -1:
    new_pdf_logic = """                              const vendor1 = 'Multi Vendor';
                              const vendor2 = '';
                              let totalInitial = 0;
                              let totalNego = 0;
                              let totalOngkir = 0;
                              let catalogUrls = [];
                              let screenshots = [];
                              
                              getPackageItems(submittedPack).filter(item => checkedItems[item.no]).forEach(item => {
                                 const doc = savedDocs[item.name] || {};
                                 if (doc.selectedProduct) {
                                    totalInitial += parseFloat(doc.selectedProduct.price || 0);
                                    totalNego += parseFloat(doc.negotiatedPrice || 0);
                                    totalOngkir += parseFloat(doc.negotiatedOngkir || 0);
                                    if (doc.url) catalogUrls.push(doc.url);
                                    if (doc.screenshot) screenshots.push(doc.screenshot);
                                 }
                              });

                              const payload = {
                                project_id: submittedPack.id,
                                pp_nip: user.nip,
                                vendor_name: vendor1,
                                catalog_url: catalogUrls.join(', '),
                                initial_price: totalInitial,
                                negotiated_price: totalNego,
                                shipping_cost: totalOngkir,
                                screenshot_url: screenshots[0] || ''
                              };
"""
    content = content[:pdf_start_idx] + new_pdf_logic + content[pdf_end_idx:]


# 3. Replace the PRINT table (around line 1616)
print_start = "                    {checkedItems[1] && savedDocs.laptop.selectedProduct ? ("
print_end = "                    {/* Printer Row */}"
p_start_idx = content.find(print_start)
p_end_idx = content.find(print_end)

if p_start_idx != -1 and p_end_idx != -1:
    # Now find the end of the printer row up to the total row
    total_row = "                  <tr className=\"bg-slate-100 font-bold border-t-2 border-slate-400\">"
    total_idx = content.find(total_row, p_end_idx)
    
    new_print_table = """                    {getPackageItems(submittedPack).map((item, idx) => {
                      const isChecked = checkedItems[item.no];
                      const doc = savedDocs[item.name] || {};
                      if (isChecked && doc.selectedProduct) {
                         return (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors text-[10px]">
                            <td className="border border-slate-900 p-2 text-center">{idx + 1}</td>
                            <td className="border border-slate-900 p-2 font-medium">{doc.selectedProduct.name}</td>
                            <td className="border border-slate-900 p-2">{doc.selectedProduct.vendor}</td>
                            <td className="border border-slate-900 p-2 text-right">Rp {parseFloat(doc.selectedProduct.price || 0).toLocaleString('id-ID')}</td>
                            <td className="border border-slate-900 p-2 text-right font-bold bg-slate-50">Rp {parseFloat(doc.negotiatedPrice || 0).toLocaleString('id-ID')}</td>
                            <td className="border border-slate-900 p-2 text-right">Rp {parseFloat(doc.negotiatedOngkir || 0).toLocaleString('id-ID')}</td>
                          </tr>
                         );
                      } else {
                         return (
                          <tr key={idx} className="bg-slate-50/50">
                            <td colSpan="6" className="border border-slate-900 p-2 text-center text-slate-450 font-sans text-[9px] italic">Item {item.name} Tidak Diproses dalam Sesi Pemilihan Ini</td>
                          </tr>
                         );
                      }
                    })}
"""
    content = content[:p_start_idx] + new_print_table + content[total_idx:]

with open("frontend/src/components/ProcurementPanel.jsx", "w") as f:
    f.write(content)
print("BAHP UI patched successfully!")
