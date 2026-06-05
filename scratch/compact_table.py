with open("frontend/src/components/ProcurementPanel.jsx", "r") as f:
    code = f.read()

# ─── 1. COMPACT TABLE HEADERS ───────────────────────────────────────────────
# Remove "Nego Satuan" and "Ongkir" headers, add "Status" before "Aksi"
old_headers = """                     <th className="p-4 min-w-[250px]">Deskripsi Komoditas</th>
                     <th className="p-4 text-center">Vol</th>
                     <th className="p-4 text-right w-32">Pagu DPA (Satuan)</th>
                     <th className="p-4 w-36 text-right">Harga Tayang Katalog</th>
                     <th className="p-4 min-w-[150px]">Nama Penyedia</th>
                     <th className="p-4 w-36 text-right">Nego Satuan</th>
                     <th className="p-4 w-32 text-right">Ongkir</th>
                     <th className="p-4 text-right w-32">Total Akhir</th>
                     <th className="p-4 text-center">Aksi / Dok</th>"""

new_headers = """                     <th className="p-4 min-w-[200px]">Deskripsi Komoditas</th>
                     <th className="p-4 text-center w-16">Vol</th>
                     <th className="p-4 text-right w-28">Pagu DPA</th>
                     <th className="p-4 w-32 text-right">Harga Tayang</th>
                     <th className="p-4 min-w-[130px]">Nama Penyedia</th>
                     <th className="p-4 text-right w-32">Total Akhir</th>
                     <th className="p-4 text-center w-24">Status</th>
                     <th className="p-4 text-center w-36">Aksi / Dok</th>"""

if old_headers in code:
    code = code.replace(old_headers, new_headers)
    print("✅ Headers updated")
else:
    print("❌ Headers NOT found")

# ─── 2. REMOVE NEGO SATUAN and ONGKIR CELL TDs from table body ──────────────
# Also add Status cell before AKSI cell

# The Nego Satuan cell (input type=number for price)
old_nego_td = """                        <td className="p-4">
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
                        <td className="p-4 text-right">"""

new_nego_td = """                        <td className="p-4 text-right">"""

if old_nego_td in code:
    code = code.replace(old_nego_td, new_nego_td)
    print("✅ Removed Nego+Ongkir TDs")
else:
    print("❌ Nego+Ongkir TDs NOT found — trying partial match")

# ─── 3. Add STATUS cell between Total Akhir and AKSI cells ──────────────────
old_total_td_end = """                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={async () => {"""

new_total_td_end = """                        </td>
                        <td className="p-4 text-center">
                          {/* STATUS BADGE */}
                          {(() => {
                            const itemStatus = nego.itemStatus || 'Tersedia';
                            const statusConfig = {
                              'Tersedia':       { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', emoji: '✅' },
                              'Stok Kurang':    { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   emoji: '⚠️' },
                              'Tidak Tersedia': { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200',    emoji: '❌' },
                            };
                            const cfg = statusConfig[itemStatus] || statusConfig['Tersedia'];
                            return (
                              <div className="flex flex-col items-center gap-1">
                                <select
                                  value={itemStatus}
                                  onChange={e => handleNegotiationChange(item.no, 'itemStatus', e.target.value)}
                                  className={`text-[10px] font-bold px-2 py-1 rounded-lg border cursor-pointer ${cfg.bg} ${cfg.text} ${cfg.border} focus:outline-none`}
                                >
                                  <option value="Tersedia">✅ Tersedia</option>
                                  <option value="Stok Kurang">⚠️ Stok Kurang</option>
                                  <option value="Tidak Tersedia">❌ Tidak Tersedia</option>
                                </select>
                                {(itemStatus === 'Stok Kurang' || itemStatus === 'Tidak Tersedia') && (
                                  <input
                                    type="text"
                                    value={nego.ppNotes || ''}
                                    onChange={e => handleNegotiationChange(item.no, 'ppNotes', e.target.value)}
                                    placeholder={itemStatus === 'Stok Kurang' ? 'Qty tersedia: ...' : 'Alasan tidak tersedia...'}
                                    className="text-[9px] p-1 border border-amber-200 rounded w-full bg-amber-50 focus:ring-1 focus:ring-amber-400"
                                  />
                                )}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={async () => {"""

if old_total_td_end in code:
    code = code.replace(old_total_td_end, new_total_td_end, 1)
    print("✅ Status cell added")
else:
    print("❌ Status cell anchor NOT found")

with open("frontend/src/components/ProcurementPanel.jsx", "w") as f:
    f.write(code)

print("Done. File saved.")
