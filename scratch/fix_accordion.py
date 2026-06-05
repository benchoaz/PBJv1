import re

with open("frontend/src/components/ProcurementPanel.jsx", "r") as f:
    code = f.read()

# 1. Add states
state_injection = """  const [checkedItems, setCheckedItems] = useState(() => {"""
new_states = """  const [expandedSearchRows, setExpandedSearchRows] = useState({});
  const [searchParams, setSearchParams] = useState({});
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState('');

  const handleToggleSearchRow = (itemNo, initialData) => {
    setExpandedSearchRows(prev => ({ ...prev, [itemNo]: !prev[itemNo] }));
    if (!searchParams[itemNo]) {
      setSearchParams(prev => ({
        ...prev,
        [itemNo]: {
          query: initialData.name || '',
          vendorTarget: initialData.vendor || '',
          minPrice: 0,
          maxPrice: initialData.paguDpa || initialData.price || 0
        }
      }));
    }
  };

  const handleSearchParamChange = (itemNo, field, value) => {
    setSearchParams(prev => ({
      ...prev,
      [itemNo]: {
        ...prev[itemNo],
        [field]: value
      }
    }));
  };

  const executePuppeteerSearch = async (itemsToSearch) => {
    if (itemsToSearch.length === 0) return;
    setIsSearching(true);
    setSearchProgress(`Menganalisis Katalog untuk ${itemsToSearch.length} komoditas... Mohon tunggu.`);
    try {
      const response = await fetch('http://localhost:3001/api/survey/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          items: itemsToSearch,
          useAi: true,
          locations: [],
          ignorePriceLimit: false,
          autoComparator: true
        })
      });

      if (!response.ok) throw new Error('Gagal mengeksekusi survei: ' + response.statusText);
      const data = await response.json();
      const results = data.results || [];
      
      let successCount = 0;
      results.forEach((res, i) => {
        const targetItem = itemsToSearch[i];
        if (res.success && res.price > 0) {
          successCount++;
          // Update the negotiated items state with new target tayang & vendor
          setNegotiatedItems(prev => {
            const current = prev[targetItem.originalNo] || {};
            return {
              ...prev,
              [targetItem.originalNo]: {
                ...current,
                tayang: res.price,
                vendor: res.vendor,
                link: res.link
              }
            };
          });
        }
      });
      alert(`✅ Pencarian selesai. ${successCount} dari ${itemsToSearch.length} produk berhasil ditemukan atau diperbarui.`);
    } catch (e) {
      alert('Error saat menjalankan survei: ' + e.message);
    } finally {
      setIsSearching(false);
      setSearchProgress('');
    }
  };

  const handleSearchSingleItem = (item) => {
    const params = searchParams[item.no] || {};
    const payloadItem = {
      name: params.query || item.name,
      qty: item.qty,
      price: params.maxPrice || item.paguDpa || item.price,
      originalNo: item.no,
      vendorTarget: params.vendorTarget || ''
    };
    executePuppeteerSearch([payloadItem]);
  };

  const handleSearchAll = () => {
    const activeItems = getPackageItems(submittedPack).filter(i => checkedItems[i.no]);
    const payloadItems = activeItems.map(item => {
      const params = searchParams[item.no] || {};
      return {
        name: params.query || item.name,
        qty: item.qty,
        price: params.maxPrice || item.paguDpa || item.price,
        originalNo: item.no,
        vendorTarget: params.vendorTarget || ''
      };
    });
    executePuppeteerSearch(payloadItems);
  };

  const [checkedItems, setCheckedItems] = useState(() => {"""
code = code.replace(state_injection, new_states)

# 2. Add Global Button & Progress
old_header = """            <p className="text-sm text-slate-500 mb-6">
              Lakukan proses negosiasi harga dan ongkos kirim secara langsung dengan Penyedia Katalog Elektronik. Masukkan harga kesepakatan final per item di bawah ini.
            </p>"""

new_header = """            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <p className="text-sm text-slate-500 max-w-2xl">
                Lakukan proses negosiasi harga dan ongkos kirim secara langsung dengan Penyedia Katalog Elektronik. Masukkan harga kesepakatan final per item di bawah ini.
              </p>
              <button 
                onClick={handleSearchAll}
                disabled={isSearching}
                className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm text-xs py-2.5 px-5 rounded-lg font-bold flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isSearching ? '⏳ Memproses AI...' : '🚀 Cari Semua Produk (AI)'}
              </button>
            </div>
            
            {isSearching && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl mb-4 flex items-center gap-3 animate-pulse">
                <span className="text-xl">🤖</span>
                <span className="text-sm font-bold">{searchProgress}</span>
              </div>
            )}"""
code = code.replace(old_header, new_header)

# 3. Add Accordion Toggle Button in Aksi/Dok
old_aksi = """                        <td className="p-4 text-center">
                          <button
                            onClick={async () => {"""

new_aksi = """                        <td className="p-4 text-center flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleToggleSearchRow(item.no, item)}
                            className={`p-2 rounded-lg border transition-all ${expandedSearchRows[item.no] ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-indigo-600'}`}
                            title="Cari / Setel Produk Alternatif"
                          >
                            🔍
                          </button>
                          <button
                            onClick={async () => {"""
code = code.replace(old_aksi, new_aksi)

# 4. Render Accordion Row
old_row_end = """                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>"""

new_row_end = """                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>"""
# Wait, I need to inject the accordion TR right after the main TR.
# The main TR is returned by `return ( <tr key={item.no}>...</tr> );`
# I'll replace the return wrapper to return a React.Fragment containing BOTH rows.

old_return_tr = """                    return (
                      <tr key={item.no} className="hover:bg-slate-50/50 transition-colors">"""

new_return_tr = """                    const sParams = searchParams[item.no] || { query: '', vendorTarget: '', minPrice: 0, maxPrice: 0 };
                    return (
                      <React.Fragment key={item.no}>
                      <tr className="hover:bg-slate-50/50 transition-colors">"""

code = code.replace(old_return_tr, new_return_tr)

old_tr_close = """                        </td>
                      </tr>
                    );"""

new_tr_close = """                        </td>
                      </tr>
                      {expandedSearchRows[item.no] && (
                        <tr className="bg-indigo-50/30 border-b border-indigo-100">
                          <td colSpan="10" className="p-4">
                            <div className="bg-white border border-indigo-100 rounded-xl p-5 shadow-sm">
                              <div className="flex items-center gap-2 mb-4 text-indigo-700 font-bold text-sm">
                                <span>🔍</span> Pengaturan Pencarian Alternatif Katalog (Baris {idx + 1})
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Kata Kunci / Nama Produk</label>
                                  <input 
                                    type="text" 
                                    value={sParams.query}
                                    onChange={(e) => handleSearchParamChange(item.no, 'query', e.target.value)}
                                    className="w-full text-xs p-2 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Target Penyedia (Opsional)</label>
                                  <input 
                                    type="text" 
                                    value={sParams.vendorTarget}
                                    onChange={(e) => handleSearchParamChange(item.no, 'vendorTarget', e.target.value)}
                                    className="w-full text-xs p-2 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500"
                                    placeholder="Ketik nama spesifik vendor..."
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Harga Min (Rp)</label>
                                  <input 
                                    type="number" 
                                    value={sParams.minPrice}
                                    onChange={(e) => handleSearchParamChange(item.no, 'minPrice', e.target.value)}
                                    className="w-full text-xs p-2 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Harga Max (Rp)</label>
                                  <input 
                                    type="number" 
                                    value={sParams.maxPrice}
                                    onChange={(e) => handleSearchParamChange(item.no, 'maxPrice', e.target.value)}
                                    className="w-full text-xs p-2 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500"
                                  />
                                </div>
                              </div>
                              <div className="mt-4 flex justify-end">
                                <button 
                                  onClick={() => handleSearchSingleItem(item)}
                                  disabled={isSearching}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold px-5 py-2 rounded-lg flex items-center gap-2 transition-all disabled:opacity-50"
                                >
                                  {isSearching ? '⏳ Mencari...' : '🚀 Mulai Cari (Puppeteer)'}
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                      </React.Fragment>
                    );"""
code = code.replace(old_tr_close, new_tr_close)

with open("frontend/src/components/ProcurementPanel.jsx", "w") as f:
    f.write(code)

print("Accordion logic added successfully.")
