import re
import sys

with open("frontend/src/components/ProcurementPanel.jsx", "r") as f:
    content = f.read()

# 1. Add comparison states
state_insertion = """  const [autoScreenshots, setAutoScreenshots] = useState(() => {
"""
new_state = """  const [comparisonData, setComparisonData] = useState(() => {
    const saved = localStorage.getItem('pbj_pp_comparison');
    return saved ? JSON.parse(saved) : {};
  });
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [activeCompareItem, setActiveCompareItem] = useState(null);
  const [activeCompareIndex, setActiveCompareIndex] = useState(null);

"""
content = content.replace(state_insertion, new_state + state_insertion)


# 2. Modify Auto-fill logic
autofill_old = """                           newNego[item.no].vendor = item.vendor || 'UMKK Penyedia Katalog';
                           newNego[item.no].penawaran = item.price;
                           newNego[item.no].negosiasi = item.price; // or slightly less
                           newNego[item.no].ongkir = 0;"""
autofill_new = """                           // Do not auto-fill vendor, PP must choose
                           // newNego[item.no].vendor = item.vendor || 'UMKK Penyedia Katalog';
                           // newNego[item.no].penawaran = item.price;
                           // newNego[item.no].negosiasi = item.price;
                           // newNego[item.no].ongkir = 0;"""
content = content.replace(autofill_old, autofill_new)

# 3. Update the Negosiasi Table rendering
# Find the line: <td className="p-2">\n                              <input \n                                type="text"\n                                placeholder="Nama Penyedia e-Katalog..."
# And replace the vendor input with the new UI.
table_cell_old = """                            <td className="p-2">
                              <input 
                                type="text"
                                placeholder="Nama Penyedia e-Katalog..."
                                value={vendor}
                                onChange={e => updateNegotiationData(item.no, 'vendor', e.target.value)}
                                className="w-full text-[10px] p-1.5 border border-slate-200 rounded focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none"
                              />
                            </td>"""

table_cell_new = """                            <td className="p-2">
                              <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-1.5">
                                  <input 
                                    type="text"
                                    placeholder="Nama Penyedia..."
                                    value={vendor}
                                    onChange={e => updateNegotiationData(item.no, 'vendor', e.target.value)}
                                    className="w-full text-[10px] p-1.5 border border-slate-200 rounded focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none bg-white"
                                  />
                                </div>
                                {(() => {
                                  const parsed = JSON.parse(submittedPack.description || '{}');
                                  const surveyData = parsed.surveyData;
                                  const surveyItem = surveyData?.products?.find(p => p.name === item.name);
                                  if (surveyItem && surveyItem.success && surveyItem.vendor !== 'TIDAK DITEMUKAN') {
                                    return (
                                      <div className="text-[8px] bg-indigo-50 border border-indigo-100 text-indigo-700 px-1.5 py-1 rounded">
                                        <span className="font-bold">Ref PPK:</span> {surveyItem.vendor} <span className="font-mono">(Rp {(surveyItem.price || 0).toLocaleString('id-ID')})</span>
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                                <button
                                  onClick={() => {
                                    const parsed = JSON.parse(submittedPack.description || '{}');
                                    const surveyData = parsed.surveyData;
                                    const surveyItem = surveyData?.products?.find(p => p.name === item.name);
                                    
                                    setActiveCompareItem({ ...item, surveyItem, no: item.no });
                                    setActiveCompareIndex(item.no);
                                    setShowCompareModal(true);
                                  }}
                                  className="w-full text-[9px] font-bold bg-slate-800 hover:bg-slate-900 text-white py-1 rounded shadow-sm flex items-center justify-center gap-1 transition-colors"
                                >
                                  <span>⚖️</span> Cari Pembanding
                                </button>
                              </div>
                            </td>"""
content = content.replace(table_cell_old, table_cell_new)


# 4. Inject the Compare Modal right before the final </div> of the component return
modal_code = """
      {/* MODAL KOMPARASI PP */}
      {showCompareModal && activeCompareItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 font-sans">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-up">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-5 flex justify-between items-center z-10">
              <div>
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <span>⚖️</span> Matriks Komparasi Pejabat Pengadaan
                </h3>
                <p className="text-xs text-slate-500 mt-1">Item: <strong className="text-indigo-700">{activeCompareItem.name}</strong></p>
              </div>
              <button onClick={() => setShowCompareModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">✕</button>
            </div>
            
            <div className="p-6 bg-slate-50">
              <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl mb-6 text-sm text-indigo-900 leading-relaxed">
                <strong>Instruksi Audit:</strong> Sesuai regulasi e-Purchasing, Pejabat Pengadaan (PP) dilarang langsung menetapkan vendor rekomendasi PPK tanpa melakukan komparasi/negosiasi independen. Silakan cari 2 (dua) vendor pembanding lain di Inaproc untuk melengkapi matriks 3 produk sejenis.
              </div>

              {(() => {
                const itemNo = activeCompareIndex;
                const currentData = comparisonData[itemNo] || {
                  v1: { vendor: activeCompareItem.surveyItem?.vendor || '', price: activeCompareItem.surveyItem?.price || 0, isPpkRef: true },
                  v2: { vendor: '', price: 0 },
                  v3: { vendor: '', price: 0 },
                  winner: 'v1'
                };

                const updateV = (key, field, val) => {
                  const newData = { ...comparisonData, [itemNo]: { ...currentData, [key]: { ...currentData[key], [field]: val } } };
                  setComparisonData(newData);
                  localStorage.setItem('pbj_pp_comparison', JSON.stringify(newData));
                };

                const setWinner = (key) => {
                  const newData = { ...comparisonData, [itemNo]: { ...currentData, winner: key } };
                  setComparisonData(newData);
                  localStorage.setItem('pbj_pp_comparison', JSON.stringify(newData));
                };
                
                const saveToNegotiation = () => {
                   const winnerData = currentData[currentData.winner];
                   if (!winnerData.vendor) {
                     alert('Penyedia yang menang belum diisi namanya!');
                     return;
                   }
                   updateNegotiationData(itemNo, 'vendor', winnerData.vendor);
                   updateNegotiationData(itemNo, 'penawaran', winnerData.price);
                   updateNegotiationData(itemNo, 'negosiasi', winnerData.price); // Default to offer price
                   setShowCompareModal(false);
                };

                return (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      {['v1', 'v2', 'v3'].map((vKey, idx) => {
                        const v = currentData[vKey];
                        const isWinner = currentData.winner === vKey;
                        return (
                          <div key={vKey} className={`bg-white border-2 rounded-xl p-4 transition-all ${isWinner ? 'border-indigo-500 shadow-md ring-4 ring-indigo-50' : 'border-slate-200'}`}>
                            <div className="flex justify-between items-center mb-4">
                              <span className="font-bold text-xs bg-slate-100 px-2 py-1 rounded text-slate-700">Vendor {idx + 1} {v.isPpkRef && '(Ref. PPK)'}</span>
                              <button
                                onClick={() => setWinner(vKey)}
                                className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors ${isWinner ? 'bg-indigo-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                              >
                                {isWinner ? '⭐ TERPILIH' : 'Pilih Ini'}
                              </button>
                            </div>
                            
                            <div className="space-y-3">
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 block mb-1">Nama Penyedia</label>
                                <input 
                                  type="text" 
                                  value={v.vendor} 
                                  onChange={e => updateV(vKey, 'vendor', e.target.value)}
                                  placeholder="Contoh: CV Maju Jaya"
                                  className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 block mb-1">Harga Tayang (Rp)</label>
                                <input 
                                  type="number" 
                                  value={v.price} 
                                  onChange={e => updateV(vKey, 'price', e.target.value)}
                                  placeholder="0"
                                  className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 block mb-1">Link Produk (Opsional)</label>
                                <input 
                                  type="text" 
                                  value={v.link || ''} 
                                  onChange={e => updateV(vKey, 'link', e.target.value)}
                                  placeholder="https://katalog.inaproc.id/..."
                                  className="w-full text-[10px] p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                       <button onClick={() => setShowCompareModal(false)} className="px-5 py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors">Batal</button>
                       <button onClick={saveToNegotiation} className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-colors flex items-center gap-2">
                         <span>💾</span> Simpan Hasil Komparasi ke Tabel
                       </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
"""

content = content.replace("    </div>\n  );\n}", modal_code + "\n    </div>\n  );\n}")

with open("frontend/src/components/ProcurementPanel.jsx", "w") as f:
    f.write(content)
print("ProcurementPanel.jsx patched successfully.")
