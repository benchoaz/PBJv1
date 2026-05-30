import re

file_path = '/home/beni/PBJ/frontend/src/components/ProcurementPreparation.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add expandedSurveyRows state
if 'const [expandedSurveyRows, setExpandedSurveyRows]' not in content:
    content = content.replace(
        'const [expandedEditCardIndex, setExpandedEditCardIndex] = useState(null);',
        'const [expandedEditCardIndex, setExpandedEditCardIndex] = useState(null);\n  const [expandedSurveyRows, setExpandedSurveyRows] = useState({});'
    )

# 2. Extract the JSX logic inside the mapping
# We need to find: return items.map((item, idx) => { ... })
start_map = content.find('return items.map((item, idx) => {')
end_map = content.find('})\n                        })()}', start_map)

if start_map != -1 and end_map != -1:
    map_content = content[start_map:end_map]
    
    # We replace `<tr key={item.no || idx} ...>` with `<React.Fragment key={item.no || idx}><tr className...>`
    # and add the expanded row at the end of the return statement before `)`
    
    # Let's rebuild the map function entirely because it's complex.
    # We will use the existing `surveyItem` logic from the card rendering.
    
    new_map = """return items.map((item, idx) => {
                            const unitHpsPrice = hpsPrices[item.name] !== undefined ? hpsPrices[item.name] : item.price;
                            const totalHpsItem = item.qty * unitHpsPrice;
                            const isOverbudget = unitHpsPrice > item.price;
                            const surveyItem = activeData?.products?.find(p => p.name === item.name);
                            const isRowExpanded = expandedSurveyRows[idx];
                            
                            // Logika untuk kartu survei
                            const p = surveyItem;
                            const isFailed = p ? (!p.success || p.vendor === 'TIDAK DITEMUKAN') : false;
                            const keyword = customKeywords[idx] !== undefined ? customKeywords[idx] : (p ? p.name : item.name);
                            const isLoading = loadingProductIndex === idx;

                            return (
                              <React.Fragment key={item.no || idx}>
                              <tr className={`border-b border-slate-100 hover:bg-slate-50/60 transition-colors ${isOverbudget ? 'bg-rose-50/50' : ''}`}>
                                <td className="py-3 px-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                                <td className="py-3 px-2 font-bold text-slate-800">
                                  {item.name}
                                  <span className="text-[10px] text-slate-450 block font-normal mt-0.5">Satuan: {item.unit}</span>
                                </td>
                                <td className="py-3 px-2">
                                  {surveyItem && surveyItem.success && surveyItem.vendor !== 'TIDAK DITEMUKAN' ? (
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-[10px] font-bold text-slate-700 truncate max-w-[150px]" title={surveyItem.vendor}>🏪 {surveyItem.vendor}</span>
                                      <a href={surveyItem.link} target="_blank" rel="noopener noreferrer" className="text-[9px] text-indigo-600 hover:text-indigo-800 underline">Tautan Produk</a>
                                    </div>
                                  ) : (
                                    <span className="text-[9px] text-slate-400 italic bg-slate-100 px-1.5 py-0.5 rounded">Belum disurvei</span>
                                  )}
                                  {surveyItem && (
                                    <button 
                                      type="button" 
                                      onClick={() => setExpandedSurveyRows(prev => ({...prev, [idx]: !prev[idx]}))}
                                      className="mt-1.5 text-[9px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
                                    >
                                      {isRowExpanded ? '🔼 Tutup Detail' : '🔽 Lihat Detail Survei'}
                                    </button>
                                  )}
                                </td>
                                <td className="py-3 px-2 text-center font-bold text-slate-700">{item.qty}</td>
                                <td className="py-3 px-2 text-right font-mono text-slate-500">Rp&nbsp;{item.price.toLocaleString()}</td>
                                <td className="py-3 px-4 text-right">
                                  <div className="relative inline-block w-full">
                                    <span className={`absolute left-3 top-1/2 -translate-y-1/2 font-bold text-[10px] ${isOverbudget ? 'text-rose-500' : 'text-slate-400'}`}>Rp</span>
                                    <input
                                      type="number"
                                      value={unitHpsPrice}
                                      onChange={(e) => {
                                        const newPrice = parseFloat(e.target.value) || 0;
                                        setHpsPrices(prev => ({
                                          ...prev,
                                          [item.name]: newPrice
                                        }));
                                        setIsSigned(false);
                                        if (step === 4) setStep(3);
                                      }}
                                      className={`w-full bg-slate-50 border text-slate-800 rounded-xl py-1.5 pl-8 pr-3 text-xs font-mono font-bold text-right focus:ring-2 outline-none transition-all ${isOverbudget ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200 text-rose-700 bg-rose-50/50' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-150'}`}
                                    />
                                  </div>
                                  {isOverbudget && <div className="text-[9px] font-bold text-rose-500 text-right mt-1 animate-pulse">⚠️ Melebihi Pagu</div>}
                                </td>
                                <td className="py-3 px-3 text-right font-mono font-bold text-indigo-650">
                                  Rp&nbsp;{totalHpsItem.toLocaleString()}
                                </td>
                              </tr>
                              
                              {/* EXPANDED ACCORDION ROW */}
                              {isRowExpanded && surveyItem && (
                                <tr>
                                  <td colSpan="7" className="p-0 border-b border-slate-100">
                                    <div className="bg-slate-50/80 p-4 border-l-4 border-l-indigo-400 shadow-inner">
                                      <div className="flex flex-col lg:flex-row gap-6">
                                        
                                        {/* Bagian Kiri: Status & Justifikasi */}
                                        <div className="flex-1 space-y-4">
                                          <div className="flex items-center gap-3">
                                            {isFailed ? (
                                              <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wide bg-slate-200/50 px-2 py-1 rounded">
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Tidak Ditemukan
                                              </span>
                                            ) : (
                                              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-wide bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Ditemukan
                                              </span>
                                            )}
                                            
                                            {!isFailed && (
                                              <div className="text-indigo-650 font-mono font-extrabold text-sm flex items-baseline gap-0.5">
                                                <span className="text-[10px] font-bold">Rp</span> {p.price.toLocaleString('id-ID')}
                                              </div>
                                            )}
                                          </div>
                                          
                                          {!isFailed && (
                                            <div className="space-y-3">
                                              <div>
                                                <div className="flex items-center justify-between mb-1">
                                                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">📝 Justifikasi Pemilihan</label>
                                                  <button
                                                    type="button"
                                                    onClick={() => enhanceJustificationWithAI(p.id, justifications[p.id] || '')}
                                                    disabled={isEnhancingJustification[p.id]}
                                                    className="text-[9px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded border border-indigo-200 transition-colors flex items-center gap-1 disabled:opacity-50"
                                                  >
                                                    {isEnhancingJustification[p.id] ? '✨ Merapikan...' : '✨ Rapikan Bahasa (AI)'}
                                                  </button>
                                                </div>
                                                <textarea
                                                  value={justifications[p.id] || ''}
                                                  onChange={(e) => setJustifications({...justifications, [p.id]: e.target.value})}
                                                  placeholder="Ketik alasan singkat, misal: 'barang rusak bisa dikembalikan' lalu klik tombol AI di atas..."
                                                  className={`w-full px-3 py-2 bg-white border rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 min-h-[60px] resize-y transition-colors ${isEnhancingJustification[p.id] ? 'border-indigo-400 ring-1 ring-indigo-400 bg-indigo-50/30' : 'border-slate-300 focus:ring-indigo-500'}`}
                                                  disabled={isEnhancingJustification[p.id]}
                                                />
                                                <div className="flex gap-2 mt-2">
                                                  <button
                                                    type="button"
                                                    onClick={() => setJustifications({ ...justifications, [p.id]: "Penyedia ini dipilih karena mampu menyediakan mayoritas (>80%) dari total item barang yang dibutuhkan, sehingga sangat mengefisienkan biaya pengiriman, mempermudah administrasi kontrak, dan memastikan seluruh barang tiba dalam satu waktu." })}
                                                    className="text-[9px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded border border-blue-200 transition-colors"
                                                  >
                                                    💡 Template: Satu Pintu (>80%)
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      const currentJustification = justifications[p.id] || '';
                                                      if (!currentJustification.trim()) {
                                                        alert('Isi justifikasi terlebih dahulu sebelum diterapkan ke semua barang!');
                                                        return;
                                                      }
                                                      const newJustifications = { ...justifications };
                                                      activeData.products.forEach(prod => {
                                                        newJustifications[prod.id] = currentJustification;
                                                      });
                                                      setJustifications(newJustifications);
                                                    }}
                                                    className="text-[9px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded border border-emerald-200 transition-colors"
                                                  >
                                                    ✨ Terapkan ke Seluruh Barang
                                                  </button>
                                                </div>
                                              </div>
                                              
                                              <div className="pt-2 border-t border-slate-200">
                                                { (screenshotStatus[p.id] === 'done' || (p.img && p.img.includes('/screenshots/'))) ? (
                                                  <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-1.5 bg-emerald-50 w-fit px-3 py-1.5 rounded-lg border border-emerald-200">
                                                    ✅ Screenshot Tersimpan
                                                  </div>
                                                ) : screenshotStatus[p.id] === 'loading' ? (
                                                  <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
                                                    ⏳ Menyimpan Screenshot...
                                                  </div>
                                                ) : (
                                                  <button
                                                    onClick={() => captureScreenshot(p)}
                                                    className="text-[10px] font-bold text-white bg-slate-800 hover:bg-slate-900 px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                                                  >
                                                    📸 Sepakati & Ambil Screenshot
                                                  </button>
                                                )}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                        
                                        {/* Bagian Kanan: Edit Keyword & Produk Pembanding */}
                                        <div className="flex-1 space-y-4">
                                          <div className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-sm">
                                            <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                                              🔍 Sesuaikan Pencarian Ulang
                                            </h4>
                                            <div className="space-y-2.5">
                                              <div>
                                                <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Kata Kunci Pencarian</label>
                                                <div className="flex gap-1.5">
                                                  <input
                                                    type="text"
                                                    value={keyword}
                                                    onChange={(e) => setCustomKeywords({ ...customKeywords, [idx]: e.target.value })}
                                                    placeholder="Contoh: Laptop i5"
                                                    className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] focus:ring-1 focus:ring-indigo-500"
                                                    disabled={isLoading}
                                                  />
                                                  <button
                                                    type="button"
                                                    onClick={() => runSingleItemSurvey(idx, keyword)}
                                                    disabled={isLoading || !keyword.trim()}
                                                    className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] transition-all"
                                                  >
                                                    {isLoading ? '...' : 'Cari'}
                                                  </button>
                                                </div>
                                              </div>
                                              <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                  <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Target Penyedia (Opsional)</label>
                                                  <input
                                                    type="text"
                                                    value={customTargets[idx] || ''}
                                                    onChange={(e) => setCustomTargets({ ...customTargets, [idx]: e.target.value })}
                                                    placeholder="Nama Toko"
                                                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] focus:ring-1 focus:ring-indigo-500"
                                                    disabled={isLoading}
                                                  />
                                                </div>
                                                <div>
                                                  <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Harga Maks. (Opsional)</label>
                                                  <input
                                                    type="number"
                                                    value={customPrices[idx] || ''}
                                                    onChange={(e) => setCustomPrices({ ...customPrices, [idx]: e.target.value })}
                                                    placeholder={`< ${p.price || p.paguDpa}`}
                                                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] focus:ring-1 focus:ring-indigo-500"
                                                    disabled={isLoading}
                                                  />
                                                </div>
                                              </div>
                                            </div>
                                          </div>

                                          {!isFailed && (
                                            <div className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-sm">
                                              <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                ⚖️ Produk Pembanding
                                              </h4>
                                              <div className="space-y-2">
                                                <input 
                                                  type="text" placeholder="Nama Produk Pembanding" 
                                                  value={(comparisons[p.id] && comparisons[p.id].name) || ''}
                                                  onChange={(e) => setComparisons({...comparisons, [p.id]: {...(comparisons[p.id]||{}), name: e.target.value}})}
                                                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px]"
                                                />
                                                <div className="flex gap-2">
                                                  <input 
                                                    type="text" placeholder="Penyedia Pembanding" 
                                                    value={(comparisons[p.id] && comparisons[p.id].vendor) || ''}
                                                    onChange={(e) => setComparisons({...comparisons, [p.id]: {...(comparisons[p.id]||{}), vendor: e.target.value}})}
                                                    className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px]"
                                                  />
                                                  <select 
                                                    value={(comparisons[p.id] && comparisons[p.id].status) || 'Luar Katalog'}
                                                    onChange={(e) => setComparisons({...comparisons, [p.id]: {...(comparisons[p.id]||{}), status: e.target.value}})}
                                                    className="w-1/3 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px]"
                                                  >
                                                    <option value="Luar Katalog">Luar Katalog</option>
                                                    <option value="Toko Daring">Toko Daring</option>
                                                    <option value="E-Katalog">E-Katalog</option>
                                                  </select>
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                        
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                              </React.Fragment>
                            )
                          }"""
    
    content = content[:start_map] + new_map + content[end_map:]

# 3. Remove or hide the horizontal survey cards section
start_survey_section = content.find('{surveyData && (\n                <div className="mb-6 bg-slate-50/50 p-5 rounded-2xl border border-slate-200/80">')
if start_survey_section != -1:
    end_survey_section = content.find('</div>\n              )}\n\n              {/* NEW HPS PENETAPAN SECTION */}', start_survey_section)
    if end_survey_section != -1:
        # Instead of deleting, let's replace the large map with just the header and "Ambil Semua Screenshot" button if needed, 
        # or we can hide it completely.
        # Wait, the "Ambil Semua Screenshot" button is useful. Let's keep the header and delete the cards.
        
        replacement = """{surveyData && (
                <div className="mb-6 flex justify-end gap-2">
                    <button
                      onClick={handleBatchCustomSearch}
                      disabled={isSurveying}
                      className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-[10px] font-bold px-4 py-2 rounded shadow-sm transition-all flex items-center gap-1 active:scale-95"
                    >
                      🔍 Cari Ulang Massal
                    </button>
                    <button
                      onClick={captureAllScreenshots}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold px-4 py-2 rounded shadow-sm transition-all flex items-center gap-1 active:scale-95"
                    >
                      📸 Ambil Semua Screenshot
                    </button>
                </div>
              )}"""
        
        content = content[:start_survey_section] + replacement + content[end_survey_section+6:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Rewrite applied.")
