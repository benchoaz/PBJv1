import re

with open('frontend/src/components/ProcurementPanel.jsx', 'r') as f:
    content = f.read()

# Replace React import if necessary
if "import React" not in content:
    content = content.replace("import { useState, useEffect } from 'react'", "import React, { useState, useEffect } from 'react'")

# Replace the table row start
old_row_start = """                        return (
                          <tr key={item.no} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="p-2 text-center text-slate-400 font-medium">{item.no}</td>"""
new_row_start = """                        const isExpanded = activeCompareIndex === item.no && showCompareModal;
                        return (
                          <React.Fragment key={item.no}>
                          <tr className={`border-b border-slate-100 transition-colors ${isExpanded ? 'bg-indigo-50/40' : 'hover:bg-slate-50'}`}>
                            <td className="p-2 text-center text-slate-400 font-medium">{item.no}</td>"""
content = content.replace(old_row_start, new_row_start)

# Replace the button
old_button = """                                <button
                                  onClick={() => {
                                    const parsed = JSON.parse(submittedPack.description || '{}');
                                    const surveyData = parsed.surveyData;
                                    const surveyItem = surveyData?.products?.find(p => p.name === item.name);
                                    
                                    setActiveCompareItem({ ...item, surveyItem, no: item.no });
                                    setActiveCompareIndex(item.no);
                                    setShowCompareModal(true);
                                  }}
                                  className="w-full text-[9px] font-bold bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 py-1 rounded shadow-sm flex items-center justify-center gap-1 transition-colors"
                                >
                                  <Scale className="w-3 h-3" /> Cari Pembanding
                                </button>"""
new_button = """                                <button
                                  onClick={() => {
                                    if (isExpanded) {
                                      setShowCompareModal(false);
                                      setActiveCompareIndex(null);
                                    } else {
                                      const parsed = JSON.parse(submittedPack.description || '{}');
                                      const surveyData = parsed.surveyData;
                                      const surveyItem = surveyData?.products?.find(p => p.name === item.name);
                                      
                                      setActiveCompareItem({ ...item, surveyItem, no: item.no });
                                      setActiveCompareIndex(item.no);
                                      setShowCompareModal(true);
                                    }
                                  }}
                                  className={`w-full text-[9px] font-bold border py-1 rounded shadow-sm flex items-center justify-center gap-1 transition-colors ${isExpanded ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white hover:bg-indigo-50 border-indigo-200 text-indigo-700'}`}
                                >
                                  <Scale className="w-3 h-3" /> {isExpanded ? 'Tutup Pembanding' : 'Cari Pembanding'}
                                </button>"""
content = content.replace(old_button, new_button)

# Replace the row end with the expanded UI
old_row_end = """                            <td className="p-2 text-right font-mono font-bold text-slate-800 text-[10px]">
                              Rp {totalAkhir.toLocaleString('id-ID')}
                            </td>
                          </tr>
                        );"""
new_row_end = """                            <td className="p-2 text-right font-mono font-bold text-slate-800 text-[10px]">
                              Rp {totalAkhir.toLocaleString('id-ID')}
                            </td>
                          </tr>

                          {/* EXPANDED INLINE COMPARISON ROW */}
                          {isExpanded && (
                            <tr className="bg-slate-50 border-b-2 border-indigo-200 shadow-inner">
                              <td colSpan="8" className="p-6">
                                <div className="max-w-6xl mx-auto">
                                  <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
                                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                      <Scale className="w-5 h-5 text-indigo-600" />
                                      Matriks Produk Pembanding (PP)
                                    </h4>
                                    <span className="text-xs bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                                      Item: {item.name}
                                    </span>
                                  </div>
                                  
                                  {(() => {
                                    const currentData = comparisonData[item.no] || {
                                      v1: { vendor: activeCompareItem?.surveyItem?.vendor || '', price: activeCompareItem?.surveyItem?.price || 0, isPpkRef: true },
                                      v2: { vendor: '', price: 0 },
                                      v3: { vendor: '', price: 0 },
                                      winner: 'v1'
                                    };

                                    const updateV = (key, field, val) => {
                                      const newData = { ...comparisonData, [item.no]: { ...currentData, [key]: { ...currentData[key], [field]: val } } };
                                      setComparisonData(newData);
                                      localStorage.setItem('pbj_pp_comparison_data', JSON.stringify(newData));
                                    };

                                    const handleScreenshotUpload = (key, e) => {
                                      if (e.target.files[0]) {
                                        // In real app, we'd upload to backend. Here we create a local object URL or fake it.
                                        const fileUrl = URL.createObjectURL(e.target.files[0]);
                                        updateV(key, 'screenshot', fileUrl);
                                        updateV(key, 'screenshotName', e.target.files[0].name);
                                      }
                                    };

                                    const setWinner = (key) => {
                                      const newData = { ...comparisonData, [item.no]: { ...currentData, winner: key } };
                                      setComparisonData(newData);
                                      localStorage.setItem('pbj_pp_comparison_data', JSON.stringify(newData));
                                      
                                      // Auto apply to negotiation
                                      const winnerData = newData[item.no][key];
                                      if (winnerData.vendor) {
                                        updateNegotiationData(item.no, 'vendor', winnerData.vendor);
                                        updateNegotiationData(item.no, 'penawaran', winnerData.price);
                                        updateNegotiationData(item.no, 'negosiasi', winnerData.price);
                                      }
                                    };

                                    return (
                                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                                        {['v1', 'v2', 'v3'].map((vKey, idx) => {
                                          const v = currentData[vKey];
                                          const isWinner = currentData.winner === vKey;
                                          return (
                                            <div key={vKey} className={`bg-white rounded-xl border-2 transition-all overflow-hidden ${isWinner ? 'border-indigo-500 shadow-md ring-4 ring-indigo-50/50' : 'border-slate-200'}`}>
                                              <div className={`px-4 py-3 border-b flex justify-between items-center ${isWinner ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
                                                <span className={`font-bold text-xs ${isWinner ? 'text-indigo-800' : 'text-slate-600'}`}>
                                                  Vendor {idx + 1} {v.isPpkRef && '(Ref. PPK)'}
                                                </span>
                                                <button
                                                  onClick={() => setWinner(vKey)}
                                                  className={`text-[10px] font-bold px-3 py-1.5 rounded transition-all ${isWinner ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border border-slate-300 hover:bg-slate-100 text-slate-700'}`}
                                                >
                                                  {isWinner ? '⭐ TERPILIH' : 'Pilih Ini'}
                                                </button>
                                              </div>
                                              
                                              <div className="p-4 space-y-4">
                                                <div>
                                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Nama Penyedia</label>
                                                  <input 
                                                    type="text" 
                                                    value={v.vendor} 
                                                    onChange={e => updateV(vKey, 'vendor', e.target.value)}
                                                    placeholder="Contoh: CV Maju Jaya"
                                                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                                  />
                                                </div>
                                                <div>
                                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Harga Tayang Katalog</label>
                                                  <div className="relative">
                                                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">Rp</span>
                                                    <input 
                                                      type="number" 
                                                      value={v.price} 
                                                      onChange={e => updateV(vKey, 'price', e.target.value)}
                                                      placeholder="0"
                                                      className="w-full text-xs py-2.5 pl-8 pr-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono font-bold text-slate-700"
                                                    />
                                                  </div>
                                                </div>
                                                <div>
                                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                                                    <span>🔗</span> Link Produk (Opsional)
                                                  </label>
                                                  <input 
                                                    type="text" 
                                                    value={v.link || ''} 
                                                    onChange={e => updateV(vKey, 'link', e.target.value)}
                                                    placeholder="https://katalog.inaproc.id/..."
                                                    className="w-full text-[10px] p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 hover:bg-white transition-colors"
                                                  />
                                                </div>
                                                
                                                {/* SCREENSHOT UPLOAD */}
                                                {!v.isPpkRef && (
                                                  <div>
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                                                      <span>📸</span> Screenshot Katalog
                                                    </label>
                                                    <div className="relative border-2 border-dashed border-slate-300 rounded-lg p-3 text-center hover:bg-slate-50 transition-colors group">
                                                      <input 
                                                        type="file" 
                                                        accept="image/*"
                                                        onChange={e => handleScreenshotUpload(vKey, e)}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                      />
                                                      {v.screenshotName ? (
                                                        <div className="text-[10px] font-bold text-emerald-600 flex items-center justify-center gap-1.5">
                                                          <span className="text-emerald-500">✓</span> {v.screenshotName.substring(0, 15)}...
                                                        </div>
                                                      ) : (
                                                        <div className="text-[10px] text-slate-500 font-medium group-hover:text-indigo-600">
                                                          Upload Screenshot
                                                        </div>
                                                      )}
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          )
                                        })}
                                      </div>
                                    )
                                  })()}
                                </div>
                              </td>
                            </tr>
                          )}
                          </React.Fragment>
                        );"""
content = content.replace(old_row_end, new_row_end)
if old_row_end not in content: print("FAILED TO MATCH OLD ROW END")

with open('frontend/src/components/ProcurementPanel.jsx', 'w') as f:
    f.write(content)

print("Injected inline comparison UI successfully.")
