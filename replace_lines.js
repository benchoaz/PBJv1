const fs = require('fs');
const path = './frontend/src/components/ProcurementPanel.jsx';
const lines = fs.readFileSync(path, 'utf8').split('\n');

const replacement = `            <>
              {/* TABEL PENETAPAN & NEGOSIASI PP */}
              <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span>🤝</span> Tabel Penetapan & Negosiasi PP
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-3">Nama Produk (Katalog PPK)</th>
                        <th className="p-3">Nama Penyedia</th>
                        <th className="p-3">Harga PPK (Awal)</th>
                        <th className="p-3">Harga Final (Nego)</th>
                        <th className="p-3">Qty</th>
                        <th className="p-3">Total Final</th>
                        <th className="p-3 text-center">Aksi / Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {getPackageItems(submittedPack).filter(item => checkedItems[item.no]).map(item => {
                        const doc = savedDocs[item.name] || {};
                        const hpsPrice = item.price || 0;
                        const qty = item.qty || 1;
                        
                        const finalPrice = doc.negotiatedPrice || hpsPrice;
                        const vendor = doc.selectedProduct?.vendor || '';
                        
                        const isCocok = parseInt(finalPrice) === parseInt(hpsPrice);

                        return (
                          <tr key={item.no} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-3 font-semibold text-slate-800 min-w-[250px]">
                              <div className="flex flex-col gap-1">
                                {item.name}
                                {doc.url && <a href={doc.url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 hover:underline">🔗 {doc.url.length > 40 ? doc.url.substring(0,40)+'...' : doc.url}</a>}
                              </div>
                            </td>
                            <td className="p-3 min-w-[150px]">
                              <input 
                                type="text" 
                                className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs focus:ring-indigo-500 focus:border-indigo-500"
                                value={vendor}
                                placeholder="Nama Vendor"
                                onChange={(e) => {
                                  setSavedDocs({
                                    ...savedDocs,
                                    [item.name]: {
                                      ...doc,
                                      selectedProduct: { ...(doc.selectedProduct || {}), vendor: e.target.value }
                                    }
                                  });
                                }}
                              />
                            </td>
                            <td className="p-3 text-slate-500 whitespace-nowrap">
                              Rp {hpsPrice.toLocaleString('id-ID')}
                            </td>
                            <td className="p-3 min-w-[150px]">
                              <div className="flex items-center gap-1">
                                <span className="text-slate-500 font-medium">Rp</span>
                                <input 
                                  type="number" 
                                  className="w-full bg-white border border-emerald-300 rounded px-2 py-1.5 text-xs font-bold text-emerald-700 focus:ring-emerald-500 focus:border-emerald-500"
                                  value={finalPrice}
                                  onChange={(e) => {
                                    setSavedDocs({
                                      ...savedDocs,
                                      [item.name]: { ...doc, negotiatedPrice: e.target.value }
                                    });
                                  }}
                                />
                              </div>
                            </td>
                            <td className="p-3 text-slate-700 font-bold text-center">
                              {qty}
                            </td>
                            <td className="p-3 font-black text-indigo-700 whitespace-nowrap">
                              Rp {(parseInt(finalPrice) * qty).toLocaleString('id-ID')}
                            </td>
                            <td className="p-3 text-center min-w-[150px]">
                              {isCocok ? (
                                <button 
                                  onClick={() => alert('Data produk disimpan! Harga cocok dengan PPK.')}
                                  className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] rounded-lg hover:bg-emerald-100 transition-colors w-full"
                                >
                                  ✅ Simpan (Harga Tetap)
                                </button>
                              ) : (
                                <button 
                                  onClick={() => handleOpenDocModal(item.name, doc.selectedProduct || item)}
                                  className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px] rounded-lg hover:bg-amber-100 transition-colors w-full flex items-center justify-center gap-1"
                                >
                                  <span>⚖️</span> Input Nego & Bukti
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>`;

// Replace from line 974 to 1549 (0-indexed: 973 to 1548)
const before = lines.slice(0, 973);
const after = lines.slice(1549);
const newLines = [...before, replacement, ...after];

fs.writeFileSync(path, newLines.join('\n'));
console.log('Lines successfully replaced');
