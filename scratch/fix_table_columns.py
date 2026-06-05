import re

with open("frontend/src/components/ProcurementPanel.jsx", "r") as f:
    code = f.read()

# 1. Update the headers
old_headers = """                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs uppercase tracking-wider font-bold">
                    <th className="p-4 w-12 text-center">No</th>
                    <th className="p-4 min-w-[250px]">Deskripsi Komoditas (DPA & PPK)</th>
                    <th className="p-4 text-center">Vol</th>
                    <th className="p-4 text-right">Harga HPS (Satuan)</th>
                    <th className="p-4 min-w-[200px]">Nama Penyedia (Katalog)</th>
                    <th className="p-4 w-36 text-right">Nego Satuan</th>
                    <th className="p-4 w-32 text-right">Ongkir</th>
                    <th className="p-4 text-right">Total Akhir</th>
                    <th className="p-4 text-center">Aksi / Dok</th>
                  </tr>
                </thead>"""

new_headers = """                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs uppercase tracking-wider font-bold">
                    <th className="p-4 w-12 text-center">No</th>
                    <th className="p-4 min-w-[250px]">Deskripsi Komoditas</th>
                    <th className="p-4 text-center">Vol</th>
                    <th className="p-4 text-right w-32">Pagu DPA/HPS (Satuan)</th>
                    <th className="p-4 w-36 text-right">Harga Tayang Katalog</th>
                    <th className="p-4 min-w-[150px]">Nama Penyedia</th>
                    <th className="p-4 w-36 text-right">Nego Satuan</th>
                    <th className="p-4 w-32 text-right">Ongkir</th>
                    <th className="p-4 text-right w-32">Total Akhir</th>
                    <th className="p-4 text-center">Aksi / Dok</th>
                  </tr>
                </thead>"""

code = code.replace(old_headers, new_headers)


# 2. Update the row data
old_row = """                        <td className="p-4 text-center font-semibold text-slate-700">
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
                        </td>"""

# First, I need to extract variables at the top of the map function
old_vars = """                    const vendor = nego.vendor || '';
                    const negoPrice = nego.price !== undefined ? nego.price : '';
                    const ongkir = nego.ongkir !== undefined ? nego.ongkir : '';"""

new_vars = """                    const vendor = nego.vendor || '';
                    const tayang = nego.tayang !== undefined ? nego.tayang : '';
                    const negoPrice = nego.price !== undefined ? nego.price : '';
                    const ongkir = nego.ongkir !== undefined ? nego.ongkir : '';"""

code = code.replace(old_vars, new_vars)

new_row = """                        <td className="p-4 text-center font-semibold text-slate-700">
                          {item.qty} <span className="text-[10px] text-slate-400 font-normal uppercase">{item.unit}</span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="font-mono font-bold text-slate-700 text-xs">Rp {hpsSatuan.toLocaleString('id-ID')}</div>
                          <div className="text-[9px] text-slate-400 mt-0.5">Batas Maksimal</div>
                        </td>
                        <td className="p-4">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">Rp</span>
                            <input 
                              type="number" 
                              className="w-full text-xs p-2.5 pl-8 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white shadow-sm text-right font-mono"
                              placeholder="0"
                              value={tayang}
                              onChange={e => handleNegotiationChange(item.no, 'tayang', e.target.value)}
                            />
                          </div>
                        </td>
                        <td className="p-4">
                          <input 
                            type="text" 
                            className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white shadow-sm"
                            placeholder="Ketik nama vendor..."
                            value={vendor}
                            onChange={e => handleNegotiationChange(item.no, 'vendor', e.target.value)}
                          />
                        </td>"""

code = code.replace(old_row, new_row)


# 3. Update the validation when clicking "Cari Pembanding"
old_val = """                                if (!nego.vendor || nego.price === undefined || nego.price === '') {"""
new_val = """                                if (!nego.vendor || nego.tayang === undefined || nego.tayang === '' || nego.price === undefined || nego.price === '') {"""

code = code.replace(old_val, new_val)

old_alert = """                                    alert('Mohon isi Vendor dan Harga Negosiasi terlebih dahulu sebelum mencari pembanding.');"""
new_alert = """                                    alert('Mohon lengkapi Nama Vendor, Harga Tayang, dan Harga Negosiasi terlebih dahulu sebelum mencari pembanding.');"""

code = code.replace(old_alert, new_alert)

# 4. Update validation before generating BAHP
old_bahp_val = """if (!n.vendor || n.price === undefined || n.price === '') hasEmpty = true;"""
new_bahp_val = """if (!n.vendor || n.tayang === undefined || n.tayang === '' || n.price === undefined || n.price === '') hasEmpty = true;"""
code = code.replace(old_bahp_val, new_bahp_val)

old_bahp_alert = """alert('Mohon lengkapi Nama Vendor dan Harga Negosiasi Satuan untuk seluruh item yang dicentang sebelum menerbitkan BAHP.');"""
new_bahp_alert = """alert('Mohon lengkapi Nama Vendor, Harga Tayang Katalog, dan Harga Negosiasi Satuan untuk seluruh item yang dicentang sebelum menerbitkan BAHP.');"""
code = code.replace(old_bahp_alert, new_bahp_alert)

with open("frontend/src/components/ProcurementPanel.jsx", "w") as f:
    f.write(code)

print("Table headers and rows updated successfully.")
