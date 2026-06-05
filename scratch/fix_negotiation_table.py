import re

with open("frontend/src/components/ProcurementPanel.jsx", "r") as f:
    code = f.read()

# 1. Add state for negotiatedItems
state_injection = """  // Negotiation Table States
  const [negotiatedItems, setNegotiatedItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pbj_negotiated_items')) || {};
    } catch(e) {
      return {};
    }
  });

  const handleNegotiationChange = (itemIdx, field, value) => {
    const updated = {
      ...negotiatedItems,
      [itemIdx]: {
        ...(negotiatedItems[itemIdx] || {}),
        [field]: value
      }
    };
    setNegotiatedItems(updated);
    localStorage.setItem('pbj_negotiated_items', JSON.stringify(updated));
  };

  // Inaproc final documents state"""

code = code.replace("  // Inaproc final documents state", state_injection)


# 2. Change tab name
code = code.replace("🔍 Cari & Bandingkan e-Katalog Inaproc", "🤝 Tabel Negosiasi e-Purchasing")


# 3. Replace activeTab === 'search' block
start_boundary = "{activeTab === 'search' && ("
end_boundary = "{activeTab === 'docs' && ("

start_idx = code.find(start_boundary)
end_idx = code.find(end_boundary)

if start_idx == -1 or end_idx == -1:
    print("Could not find boundaries!")
else:
    new_search_block = """{activeTab === 'search' && (
        <div className="space-y-6 animate-slide-up mb-8">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
              <span>🤝</span> Tabel Negosiasi e-Purchasing
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              Lakukan proses negosiasi harga dan ongkos kirim secara langsung dengan Penyedia Katalog Elektronik. Masukkan harga kesepakatan final per item di bawah ini.
            </p>
            
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs uppercase tracking-wider font-bold">
                    <th className="p-4 w-12 text-center">No</th>
                    <th className="p-4 min-w-[250px]">Deskripsi Komoditas (DPA & PPK)</th>
                    <th className="p-4 text-center">Vol</th>
                    <th className="p-4 text-right">Harga HPS (Satuan)</th>
                    <th className="p-4 min-w-[200px]">Nama Penyedia (Katalog)</th>
                    <th className="p-4 w-36 text-right">Nego Satuan</th>
                    <th className="p-4 w-32 text-right">Ongkir</th>
                    <th className="p-4 text-right">Total Akhir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {getPackageItems(submittedPack).map((item, idx) => {
                    if (!checkedItems[item.no]) return null;
                    const nego = negotiatedItems[item.no] || {};
                    const vendor = nego.vendor || '';
                    const negoPrice = nego.price !== undefined ? nego.price : '';
                    const ongkir = nego.ongkir !== undefined ? nego.ongkir : '';
                    
                    const hpsSatuan = item.price || 0;
                    const negoVal = parseFloat(negoPrice) || 0;
                    const ongkirVal = parseFloat(ongkir) || 0;
                    const totalAkhir = (negoVal * item.qty) + ongkirVal;
                    const totalHps = hpsSatuan * item.qty;
                    const isOverbudget = totalAkhir > totalHps;
                    
                    return (
                      <tr key={item.no} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 text-center text-slate-500 font-medium">{idx + 1}</td>
                        <td className="p-4 whitespace-normal min-w-[250px]">
                          <div className="font-bold text-slate-800 text-sm">{item.name}</div>
                          <div className="text-xs text-slate-500 mt-1 line-clamp-2" title={item.specs}>{item.specs || '-'}</div>
                          {item.link && (
                            <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-600 hover:underline mt-1.5 inline-flex items-center gap-1 font-medium bg-indigo-50 px-2 py-0.5 rounded">
                              🔗 Link Referensi Katalog
                            </a>
                          )}
                        </td>
                        <td className="p-4 text-center font-semibold text-slate-700">
                          {item.qty} <span className="text-[10px] text-slate-400 font-normal uppercase">{item.unit}</span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="font-mono font-medium text-slate-700">Rp {hpsSatuan.toLocaleString('id-ID')}</div>
                        </td>
                        <td className="p-4">
                          <input 
                            type="text" 
                            className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white shadow-sm"
                            placeholder="Ketik nama vendor..."
                            value={vendor}
                            onChange={e => handleNegotiationChange(item.no, 'vendor', e.target.value)}
                          />
                        </td>
                        <td className="p-4">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">Rp</span>
                            <input 
                              type="number" 
                              className="w-full text-xs p-2.5 pl-8 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white shadow-sm text-right font-mono"
                              placeholder="0"
                              value={negoPrice}
                              onChange={e => handleNegotiationChange(item.no, 'price', e.target.value)}
                            />
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">Rp</span>
                            <input 
                              type="number" 
                              className="w-full text-xs p-2.5 pl-8 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white shadow-sm text-right font-mono"
                              placeholder="0"
                              value={ongkir}
                              onChange={e => handleNegotiationChange(item.no, 'ongkir', e.target.value)}
                            />
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className={`font-mono font-black text-sm ${totalAkhir > 0 ? (isOverbudget ? 'text-rose-600' : 'text-emerald-600') : 'text-slate-400'}`}>
                            Rp {totalAkhir.toLocaleString('id-ID')}
                          </div>
                          {totalAkhir > 0 && (
                            <div className={`text-[9px] font-bold mt-1 px-1.5 py-0.5 inline-block rounded uppercase tracking-wider ${isOverbudget ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                              {isOverbudget ? '⚠️ Overbudget' : '✓ Aman (Hemat)'}
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-8 flex justify-end">
              <button 
                onClick={async () => {
                  const activeItems = getPackageItems(submittedPack).filter(i => checkedItems[i.no]);
                  let hasEmpty = false;
                  activeItems.forEach(i => {
                    const n = negotiatedItems[i.no] || {};
                    if (!n.vendor || n.price === undefined || n.price === '') hasEmpty = true;
                  });
                  if (hasEmpty) {
                    alert('Mohon lengkapi Nama Vendor dan Harga Negosiasi Satuan untuk seluruh item yang dicentang sebelum menerbitkan BAHP.');
                    return;
                  }
                  
                  try {
                    const firstVendor = negotiatedItems[activeItems[0].no]?.vendor || 'Penyedia e-Katalog';
                    let totalNego = 0;
                    let totalOngkir = 0;
                    activeItems.forEach(i => {
                      const n = negotiatedItems[i.no] || {};
                      totalNego += (parseFloat(n.price) || 0) * i.qty;
                      totalOngkir += (parseFloat(n.ongkir) || 0);
                    });
                    
                    const data = {
                      document_number: `027 / ${Math.floor(Math.random() * 100) + 10} / PP / 437.82 / 2026`,
                      vendor_name: firstVendor,
                      vendor_address: 'Sesuai data terverifikasi e-Katalog LKPP',
                      catalog_url: activeItems[0]?.link || 'https://e-katalog.lkpp.go.id',
                      initial_price: activeItems.reduce((acc, curr) => acc + (curr.price * curr.qty), 0),
                      negotiated_price: totalNego,
                      shipping_cost: totalOngkir,
                      screenshot_url: '',
                    };
                    
                    const res = await fetch(`/api/projects/${submittedPack.id}/bahp`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(data)
                    });
                    
                    if (!res.ok) throw new Error('Gagal menyimpan BAHP ke database');
                    
                    setActiveTab('docs');
                    alert('Berita Acara Hasil Pemilihan (BAHP) e-Purchasing berhasil diterbitkan berdasarkan Tabel Negosiasi!');
                  } catch (err) {
                    console.error(err);
                    setActiveTab('docs');
                    alert('Berita Acara Hasil Pemilihan (BAHP) dibuat, tapi ada peringatan: ' + err.message);
                  }
                }}
                className="btn-primary text-sm font-bold py-3.5 px-8 shadow-md hover:shadow-lg transition-all flex items-center gap-2 rounded-xl"
              >
                📜 Simpan & Terbitkan Berita Acara Pemilihan (BAHP)
              </button>
            </div>
          </div>
        </div>
      )}

      """

    # Do the replacement
    code = code[:start_idx] + new_search_block + code[end_idx:]

with open("frontend/src/components/ProcurementPanel.jsx", "w") as f:
    f.write(code)

print("Panel rewritten!")
