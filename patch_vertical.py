import re

file_path = "/home/beni/PBJ/frontend/src/components/ProcurementPanel.jsx"
with open(file_path, "r") as f:
    content = f.read()

# Replace Chunk 1
target_1 = """                                    const currentData = comparisonData[item.no] || {
                                      v1: { vendor: activeCompareItem?.surveyItem?.vendor || '', price: activeCompareItem?.surveyItem?.price || 0, isPpkRef: true },
                                      v2: { vendor: '', price: 0 },
                                      winner: 'v1'
                                    };

                                    const updateV = (key, field, val) => {
                                      const newData = { ...comparisonData, [item.no]: { ...currentData, [key]: { ...currentData[key], [field]: val } } };
                                      setComparisonData(newData);
                                      localStorage.setItem('pbj_pp_comparison_data', JSON.stringify(newData));
                                    };"""

replace_1 = """                                    let ppkImgSrc = '';
                                    try {
                                      const parsed = JSON.parse(submittedPack.description || '{}');
                                      const surveyItem = parsed.surveyData?.products?.find(p => p.name === item.name);
                                      ppkImgSrc = surveyItem?.searchImg || surveyItem?.img || '';
                                      if (ppkImgSrc && ppkImgSrc.startsWith('/screenshots/')) ppkImgSrc = `http://localhost:3001${ppkImgSrc}`;
                                    } catch (e) {}
                                    
                                    const currentData = comparisonData[item.no] || {
                                      utama: { 
                                        vendor: activeCompareItem?.surveyItem?.vendor || '', 
                                        price: activeCompareItem?.surveyItem?.price || 0, 
                                        link: activeCompareItem?.surveyItem?.link || '',
                                        screenshot: ppkImgSrc,
                                        isPpkRef: true 
                                      },
                                      pembanding: { vendor: '', price: 0, link: '', screenshot: '', isPpkRef: false },
                                      winner: 'utama'
                                    };

                                    const updateV = (key, field, val) => {
                                      const newData = { ...comparisonData, [item.no]: { ...currentData, [key]: { ...currentData[key], [field]: val } } };
                                      setComparisonData(newData);
                                      localStorage.setItem('pbj_pp_comparison_data', JSON.stringify(newData));
                                    };"""

# Replace Chunk 2
target_2 = """                                          const newData = { ...comparisonData, [item.no]: { ...currentData, [key]: { ...currentData[key], screenshot: imgSrc, screenshotName: 'Auto-Screenshot.png', price: singleRes.price || vData.price, vendor: singleRes.vendor || vData.vendor, isScanning: false } } };
                                          setComparisonData(newData);
                                          localStorage.setItem('pbj_pp_comparison_data', JSON.stringify(newData));
                                        } else {"""

replace_2 = """                                          let finalDataForNo = { ...currentData };
                                          if (key === 'utama' && currentData.utama.isPpkRef && isManualLink) {
                                            finalDataForNo.pembanding = { ...currentData.utama, isPpkRef: true };
                                          }
                                          finalDataForNo[key] = { 
                                            ...finalDataForNo[key], 
                                            screenshot: imgSrc, 
                                            screenshotName: 'Auto-Screenshot.png', 
                                            price: singleRes.price || vData.price, 
                                            vendor: singleRes.vendor || vData.vendor, 
                                            link: isManualLink ? vData.link : (singleRes.link || vData.link),
                                            isScanning: false,
                                            isPpkRef: false 
                                          };
                                          const newData = { ...comparisonData, [item.no]: finalDataForNo };
                                          setComparisonData(newData);
                                          localStorage.setItem('pbj_pp_comparison_data', JSON.stringify(newData));
                                        } else {"""

# Replace Chunk 3
import re
target_3_pattern = re.compile(r'return \(\s*<div className="grid grid-cols-1 md:grid-cols-2 gap-5">.*?</div>\s*\)', re.DOTALL)

replace_3 = """return (
                                      <div className="flex flex-col gap-6">
                                        {['utama', 'pembanding'].map((vKey) => {
                                          const v = currentData[vKey];
                                          const isUtama = vKey === 'utama';
                                          return (
                                            <div key={vKey} className={`bg-white rounded-xl border-2 transition-all overflow-hidden ${isUtama ? 'border-indigo-500 shadow-md ring-4 ring-indigo-50/50' : 'border-slate-200'}`}>
                                              <div className={`px-4 py-3 border-b flex justify-between items-center ${isUtama ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
                                                <h5 className={`font-bold text-sm flex items-center gap-2 ${isUtama ? 'text-indigo-800' : 'text-slate-600'}`}>
                                                  {isUtama ? '👑 PRODUK TERPILIH (UTAMA)' : '⚖️ PRODUK PEMBANDING'}
                                                  {v.isPpkRef && <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full ml-2">Ref PPK</span>}
                                                </h5>
                                                {isUtama ? (
                                                  <span className="text-[10px] font-bold px-3 py-1.5 rounded bg-indigo-600 text-white shadow-sm flex items-center gap-1"><span className="text-yellow-300">⭐</span> TERPILIH</span>
                                                ) : (
                                                  <button
                                                    onClick={() => {
                                                      const newData = { ...comparisonData, [item.no]: { ...currentData, utama: currentData.pembanding, pembanding: currentData.utama } };
                                                      setComparisonData(newData);
                                                      localStorage.setItem('pbj_pp_comparison_data', JSON.stringify(newData));
                                                      if (newData[item.no].utama.vendor) {
                                                        updateNegotiationData(item.no, 'vendor', newData[item.no].utama.vendor);
                                                        updateNegotiationData(item.no, 'penawaran', newData[item.no].utama.price);
                                                        updateNegotiationData(item.no, 'negosiasi', newData[item.no].utama.price);
                                                      }
                                                    }}
                                                    className="text-[10px] font-bold px-3 py-1.5 rounded transition-all bg-white border border-slate-300 hover:bg-slate-100 text-slate-700"
                                                  >
                                                    Jadikan Produk Utama
                                                  </button>
                                                )}
                                              </div>
                                              
                                              <div className="p-4 flex flex-col lg:flex-row gap-4 h-auto lg:h-[280px]">
                                                {/* MAXIMIZED SCREENSHOT PREVIEW (LEFT SIDE) */}
                                                <div className="w-full lg:w-2/3 border border-slate-200 rounded-lg bg-slate-100 overflow-hidden relative group flex items-center justify-center">
                                                  {v.screenshot ? (
                                                    <img src={v.screenshot} className="w-full h-full object-contain bg-white cursor-pointer hover:scale-105 transition-transform" onClick={() => window.open(v.screenshot, '_blank')} alt="Screenshot" />
                                                  ) : (
                                                    <div className="text-center text-slate-400 flex flex-col items-center">
                                                      <span className="text-4xl mb-2">📸</span>
                                                      <span className="text-xs">Belum ada data visual</span>
                                                    </div>
                                                  )}
                                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                                    <span className="text-white text-xs font-bold px-4 py-2 bg-black/50 rounded-full">Tarik/Klik Manual</span>
                                                  </div>
                                                  <input 
                                                    type="file" 
                                                    accept="image/*"
                                                    title="Upload manual"
                                                    onChange={e => handleScreenshotUpload(vKey, e)}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                  />
                                                </div>

                                                {/* CONTROLS & INFO (RIGHT SIDE) */}
                                                <div className="w-full lg:w-1/3 flex flex-col justify-between">
                                                  <div className="space-y-4">
                                                    <div>
                                                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                                                        <span>🔗</span> Link E-Katalog
                                                      </label>
                                                      <div className="flex flex-col gap-2">
                                                        <input 
                                                          type="text" 
                                                          value={v.link || ''} 
                                                          onChange={e => updateV(vKey, 'link', e.target.value)}
                                                          placeholder="Paste Link Katalog di sini..."
                                                          className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 hover:bg-white transition-colors"
                                                        />
                                                        <button
                                                          onClick={() => runAutoScreenshot(vKey)}
                                                          disabled={v.isScanning}
                                                          className={`w-full text-xs font-bold py-2.5 rounded-lg flex items-center justify-center transition-all ${v.isScanning ? 'bg-indigo-100 text-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'}`}
                                                        >
                                                          {v.isScanning ? (
                                                            <span className="flex items-center gap-2"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Memproses...</span>
                                                          ) : (
                                                            <span>{v.link ? '🤖 Tarik via Link' : '🤖 Cari Otomatis'}</span>
                                                          )}
                                                        </button>
                                                      </div>
                                                    </div>

                                                    <div className="space-y-3">
                                                      <div>
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Nama Penyedia</label>
                                                        <input 
                                                          type="text" 
                                                          value={v.vendor} 
                                                          onChange={e => updateV(vKey, 'vendor', e.target.value)}
                                                          placeholder="Contoh: CV Maju Jaya"
                                                          className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 bg-slate-50"
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
                                                            className="w-full text-xs py-2.5 pl-8 pr-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono font-bold text-emerald-600 bg-slate-50"
                                                          />
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          )
                                        })}
                                      </div>
                                    )"""

content = content.replace(target_1, replace_1)
content = content.replace(target_2, replace_2)

match = target_3_pattern.search(content)
if match:
    content = content[:match.start()] + replace_3 + content[match.end():]
else:
    print("Pattern 3 not found!")

with open(file_path, "w") as f:
    f.write(content)

print("Patch applied successfully.")
