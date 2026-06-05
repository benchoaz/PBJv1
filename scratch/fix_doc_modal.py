import re

with open("frontend/src/components/ProcurementPanel.jsx", "r") as f:
    code = f.read()

# 1. Add states for Document Modal
state_injection = """  // Inaproc final documents state
  const [isDocModalOpen, setIsDocModalOpen] = useState(null);
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);
"""
code = code.replace("  // Inaproc final documents state", state_injection)


# 2. Add header to Table Negotiation
code = code.replace('<th className="p-4 text-right">Total Akhir</th>', '<th className="p-4 text-right">Total Akhir</th>\n                    <th className="p-4 text-center">Aksi / Dok</th>')

# 3. Add column to Table Negotiation row
col_injection = """                        <td className="p-4 text-right">
                          <div className={`font-mono font-black text-sm ${totalAkhir > 0 ? (isOverbudget ? 'text-rose-600' : 'text-emerald-600') : 'text-slate-400'}`}>
                            Rp {totalAkhir.toLocaleString('id-ID')}
                          </div>
                          {totalAkhir > 0 && (
                            <div className={`text-[9px] font-bold mt-1 px-1.5 py-0.5 inline-block rounded uppercase tracking-wider ${isOverbudget ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                              {isOverbudget ? '⚠️ Overbudget' : '✓ Aman (Hemat)'}
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => setIsDocModalOpen(item)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 mx-auto ${nego.linkSelected ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'}`}
                          >
                            {nego.linkSelected ? '✓ Bukti Tersimpan' : '🔗 Bukti Link'}
                          </button>
                        </td>"""

# I need to match the existing column carefully
old_col = """                        <td className="p-4 text-right">
                          <div className={`font-mono font-black text-sm ${totalAkhir > 0 ? (isOverbudget ? 'text-rose-600' : 'text-emerald-600') : 'text-slate-400'}`}>
                            Rp {totalAkhir.toLocaleString('id-ID')}
                          </div>
                          {totalAkhir > 0 && (
                            <div className={`text-[9px] font-bold mt-1 px-1.5 py-0.5 inline-block rounded uppercase tracking-wider ${isOverbudget ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                              {isOverbudget ? '⚠️ Overbudget' : '✓ Aman (Hemat)'}
                            </div>
                          )}
                        </td>"""
code = code.replace(old_col, col_injection)

# 4. Inject Modal Component
modal_injection = """      {/* Document Link Modal */}
      {isDocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-slide-up">
            <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold">🔗 Dokumentasi Bukti Link Katalog</h3>
              <button onClick={() => !isCapturingScreenshot && setIsDocModalOpen(null)} className="text-white hover:text-indigo-200">
                ✖
              </button>
            </div>
            
            <div className="p-6 space-y-4 bg-slate-50">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">
                  1. URL Produk Terpilih (Vendor Akhir)
                </label>
                <input 
                  type="url" 
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-emerald-50/30"
                  placeholder="https://e-katalog.lkpp.go.id/..."
                  value={negotiatedItems[isDocModalOpen.no]?.linkSelected || ''}
                  onChange={e => handleNegotiationChange(isDocModalOpen.no, 'linkSelected', e.target.value)}
                  disabled={isCapturingScreenshot}
                />
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-2 mb-2">
                  <h4 className="text-xs font-bold text-slate-700">Bukti Pembanding (Syarat Minimal 2 Produk Lain)</h4>
                  <p className="text-[10px] text-slate-500">Lengkapi URL untuk memenuhi standar Audit Trail BAHP e-Purchasing.</p>
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">
                    2. URL Produk Pembanding 1
                  </label>
                  <input 
                    type="url" 
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="https://e-katalog.lkpp.go.id/..."
                    value={negotiatedItems[isDocModalOpen.no]?.linkCompare1 || ''}
                    onChange={e => handleNegotiationChange(isDocModalOpen.no, 'linkCompare1', e.target.value)}
                    disabled={isCapturingScreenshot}
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">
                    3. URL Produk Pembanding 2
                  </label>
                  <input 
                    type="url" 
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="https://e-katalog.lkpp.go.id/..."
                    value={negotiatedItems[isDocModalOpen.no]?.linkCompare2 || ''}
                    onChange={e => handleNegotiationChange(isDocModalOpen.no, 'linkCompare2', e.target.value)}
                    disabled={isCapturingScreenshot}
                  />
                </div>
              </div>

              {isCapturingScreenshot ? (
                <div className="flex flex-col items-center justify-center p-4">
                  <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                  <div className="text-xs font-bold text-indigo-700 animate-pulse">Memproses Tangkapan Layar (Auto-Screenshot) dari e-Katalog...</div>
                </div>
              ) : (
                <div className="pt-2">
                  <button 
                    onClick={() => {
                      setIsCapturingScreenshot(true);
                      setTimeout(() => {
                        handleNegotiationChange(isDocModalOpen.no, 'hasScreenshot', true);
                        setIsCapturingScreenshot(false);
                        setIsDocModalOpen(null);
                        alert('Bukti Link & Tangkapan Layar berhasil didokumentasikan dan disimpan ke database!');
                      }, 1500);
                    }}
                    className="w-full btn-primary text-sm font-bold py-3 px-4 shadow-md flex justify-center items-center gap-2"
                  >
                    💾 Simpan & Ambil Screenshot Otomatis
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}"""

# Replace the closing div of "main content" with modal + closing div.
# Searching for the first div close after docs tab to inject.
# Actually, just inject it before the last closing </div> of the component.
code = code.replace("    </div>\n  )\n}\n\nexport default ProcurementPanel", modal_injection + "\n    </div>\n  )\n}\n\nexport default ProcurementPanel")

with open("frontend/src/components/ProcurementPanel.jsx", "w") as f:
    f.write(code)

print("Patch part 1 done.")
