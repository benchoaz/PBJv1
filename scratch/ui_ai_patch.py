import re

with open("frontend/src/components/ProcurementPanel.jsx", "r") as f:
    code = f.read()

# 1. Update the Aksi column button
old_button = """                        <td className="p-4 text-center">
                          <button
                            onClick={() => setIsDocModalOpen(item)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 mx-auto ${nego.linkSelected ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'}`}
                          >
                            {nego.linkSelected ? '✓ Bukti Tersimpan' : '🔗 Bukti Link'}
                          </button>
                        </td>"""

new_button = """                        <td className="p-4 text-center">
                          <button
                            onClick={async () => {
                                if (!nego.vendor || nego.price === undefined || nego.price === '') {
                                    alert('Mohon isi Vendor dan Harga Negosiasi terlebih dahulu sebelum mencari pembanding.');
                                    return;
                                }
                                handleNegotiationChange(item.no, 'isAiLoading', true);
                                try {
                                    const res = await fetch('http://localhost:3001/api/survey/find-comparator', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ query: item.name, originalVendor: nego.vendor })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                        handleNegotiationChange(item.no, 'linkSelected', item.link || 'https://e-katalog.lkpp.go.id');
                                        handleNegotiationChange(item.no, 'linkCompare1', data.detailUrl);
                                        handleNegotiationChange(item.no, 'compareName', data.name);
                                        handleNegotiationChange(item.no, 'compareVendor', data.vendor);
                                        handleNegotiationChange(item.no, 'comparePrice', data.price);
                                        handleNegotiationChange(item.no, 'hasScreenshot', true);
                                        handleNegotiationChange(item.no, 'screenshotUrl', 'http://localhost:3001' + data.screenshotUrl);
                                    } else {
                                        alert('Gagal mencari pembanding: ' + (data.error || 'Unknown error'));
                                    }
                                } catch (e) {
                                    alert('Error menghubungi AI Asisten: ' + e.message);
                                }
                                handleNegotiationChange(item.no, 'isAiLoading', false);
                            }}
                            disabled={nego.isAiLoading}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 mx-auto ${nego.hasScreenshot ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'}`}
                          >
                            {nego.isAiLoading ? '⏳ Mencari...' : (nego.hasScreenshot ? '✓ AI Selesai' : '🤖 Cari Pembanding & Bukti (AI)')}
                          </button>
                        </td>"""

code = code.replace(old_button, new_button)

# 2. Delete the Modal Code
modal_start = "      {/* Document Link Modal */}"
modal_end = "      )}"""
# Wait, I injected it using `fix_doc_modal.py` right before `    </div>\n  )\n}\n\nexport default ProcurementPanel`
# Let's use regex to remove it
code = re.sub(r'      \{\/\* Document Link Modal \*\/}.*?      \)}', '', code, flags=re.DOTALL)

# 3. Fix BAHP Matriks Komparasi (Lampiran I)
# We need to replace the old B. Lampiran I section we injected in `do_patch_bahp.py`
old_lampiran_start = """                <div className="font-bold text-[11px] uppercase tracking-wide border-b border-slate-300 pb-1 mt-6 font-sans text-indigo-850">B. Lampiran I: Matriks Komparasi Perbandingan Produk (Syarat Mutlak Audit BPK)</div>"""
old_lampiran_end = """                <div className="font-bold text-[11px] uppercase tracking-wide border-b border-slate-300 pb-1 mt-6 font-sans text-indigo-850">C. Lampiran II: Tangkapan Layar (Audit Trail e-Katalog LKPP)</div>"""

new_lampiran = """                <div className="font-bold text-[11px] uppercase tracking-wide border-b border-slate-300 pb-1 mt-6 font-sans text-indigo-850">B. Lampiran I: Matriks Komparasi Perbandingan Produk (Otomatisasi AI)</div>
                <p className="font-sans text-[10px] text-slate-600 mb-4">Pejabat Pengadaan telah dibantu oleh Asisten AI untuk membandingkan produk dari vendor berbeda di e-Katalog untuk mendapatkan harga wajar terbaik bagi negara:</p>

                {getPackageItems(submittedPack).map((item, idx) => {
                  if (!checkedItems[item.no]) return null;
                  const nego = negotiatedItems[item.no];
                  if (!nego || !nego.linkSelected) return null;

                  return (
                    <div key={item.no} className="space-y-1.5 mb-6 font-sans break-inside-avoid">
                      <div className="font-bold text-[9px] text-slate-700">{idx + 1}. Matriks Komparasi: {item.name}</div>
                      <table className="w-full border-collapse border border-slate-950 text-[9px] text-center">
                        <thead>
                          <tr className="bg-slate-100 font-bold">
                            <td className="border border-slate-950 p-1.5 w-24">Kriteria Komparasi</td>
                            <td className="border border-slate-955 p-1.5 bg-indigo-50 font-bold text-indigo-900 border-2">Produk Terpilih ⭐</td>
                            <td className="border border-slate-955 p-1.5">Produk Pembanding (AI)</td>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-slate-950 p-1.5 font-bold bg-slate-50 text-left font-sans">Nama Vendor</td>
                            <td className="border border-slate-950 p-1.5 font-bold text-indigo-700 bg-indigo-50/30">{nego.vendor}</td>
                            <td className="border border-slate-950 p-1.5 font-bold text-slate-600">{nego.compareVendor || 'Vendor e-Katalog'}</td>
                          </tr>
                          <tr>
                            <td className="border border-slate-950 p-1.5 font-bold bg-slate-50 text-left font-sans">Harga Negosiasi / Tayang</td>
                            <td className="border border-slate-950 p-1.5 font-mono font-bold text-indigo-700 bg-indigo-50/30">Rp {(parseFloat(nego.price) || 0).toLocaleString('id-ID')}</td>
                            <td className="border border-slate-950 p-1.5 font-mono text-slate-600">Rp {(parseFloat(nego.comparePrice) || 0).toLocaleString('id-ID')}</td>
                          </tr>
                          <tr>
                            <td className="border border-slate-950 p-1.5 font-bold bg-slate-50 text-left font-sans">URL Tautan Asli</td>
                            <td className="border border-slate-955 p-1.5 bg-indigo-50/30 break-all text-[8px] text-indigo-600"><a href={nego.linkSelected} target="_blank">{nego.linkSelected}</a></td>
                            <td className="border border-slate-955 p-1.5 break-all text-[8px] text-indigo-600"><a href={nego.linkCompare1} target="_blank">{nego.linkCompare1 || '-'}</a></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  );
                })}

                """

start_idx = code.find(old_lampiran_start)
end_idx = code.find(old_lampiran_end)
if start_idx != -1 and end_idx != -1:
    code = code[:start_idx] + new_lampiran + code[end_idx:]

# 4. Fix Lampiran II images
old_lampiran_2_start = """                <div className="mt-4 grid grid-cols-2 gap-4">"""
old_lampiran_2_end = """                </div>\n\n"""

# Let's find end properly
# The end of Lampiran II is the end of the div grid.

new_lampiran_2 = """                <div className="mt-4 grid grid-cols-2 gap-4">
                  {getPackageItems(submittedPack).map((item, idx) => {
                    if (!checkedItems[item.no]) return null;
                    const nego = negotiatedItems[item.no];
                    if (!nego || !nego.hasScreenshot || !nego.screenshotUrl) return null;
                    
                    return (
                      <div key={item.no} className="border border-slate-300 p-2 rounded text-center">
                        <div className="text-[9px] font-bold text-slate-700 mb-2 truncate">Pembanding: {item.name}</div>
                        <div className="w-full h-48 bg-slate-100 flex flex-col items-center justify-center border border-dashed border-slate-300 rounded overflow-hidden">
                          <img src={nego.screenshotUrl} alt="Screenshot" className="object-cover w-full h-full" />
                        </div>
                      </div>
                    )
                  })}
                </div>"""

start_idx2 = code.find(old_lampiran_2_start)
# Find the next </div>\n\n or just replace the block we know
end_block = """                    )
                  })}
                </div>"""
end_idx2 = code.find(end_block, start_idx2) + len(end_block)

if start_idx2 != -1 and end_idx2 != -1:
    code = code[:start_idx2] + new_lampiran_2 + code[end_idx2:]

with open("frontend/src/components/ProcurementPanel.jsx", "w") as f:
    f.write(code)

print("UI AI integration done.")
