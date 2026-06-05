import re

with open("frontend/src/components/ProcurementPanel.jsx", "r") as f:
    code = f.read()

# 1. Update `getPackageItems` to inject vendor, hps, and tayang
old_get_package = """      items.push({ no: 1, name: 'Alas Catatan Kantor', qty: 6, unit: 'Buah', price: Math.round(pack.pagu * 0.05 / 6) })
      items.push({ no: 2, name: 'Pena Ballpoint Gel', qty: 10, unit: 'Pack', price: Math.round(pack.pagu * 0.45 / 10) })
      items.push({ no: 3, name: 'Kertas Memo Sticky Notes', qty: 15, unit: 'Buah', price: Math.round(pack.pagu * 0.20 / 15) })
      items.push({ no: 4, name: 'Binder Clip Logam', qty: 8, unit: 'Kotak', price: Math.round(pack.pagu * 0.30 / 8) })
    } else if (packNameLower.includes('kertas') || packNameLower.includes('cover') || packNameLower.includes('hvs')) {
      items.push({ no: 1, name: 'Kertas HVS F4 70gr Sinar Dunia', qty: 50, unit: 'Rim', price: Math.round(pack.pagu * 0.60 / 50) })
      items.push({ no: 2, name: 'Kertas HVS A4 80gr PaperOne', qty: 30, unit: 'Rim', price: Math.round(pack.pagu * 0.40 / 30) })
    } else if (packNameLower.includes('tinta') || packNameLower.includes('komputer') || packNameLower.includes('printer')) {
      items.push({ no: 1, name: 'Tinta Printer Original Black', qty: 12, unit: 'Botol', price: Math.round(pack.pagu * 0.50 / 12) })
      items.push({ no: 2, name: 'Tinta Printer Original Colour', qty: 12, unit: 'Botol', price: Math.round(pack.pagu * 0.50 / 12) })
    } else if (packNameLower.includes('cetak') || packNameLower.includes('banner') || packNameLower.includes('spanduk')) {
      items.push({ no: 1, name: 'Cetak Banner Flexy 340gr (Outdoor)', qty: 15, unit: 'Meter Persegi', price: Math.round(pack.pagu / 15) })
    } else {
      items.push({ no: 1, name: `${pack.packName}`, qty: 1, unit: pack.volume || 'Paket', price: pack.pagu })
    }"""

new_get_package = """      items.push({ no: 1, name: 'Alas Catatan Kantor', qty: 6, unit: 'Buah', price: Math.round(pack.pagu * 0.05 / 6), vendor: 'CV. Maju Jaya', tayang: Math.round((pack.pagu * 0.05 / 6) * 0.98) })
      items.push({ no: 2, name: 'Pena Ballpoint Gel', qty: 10, unit: 'Pack', price: Math.round(pack.pagu * 0.45 / 10), vendor: 'Toko ATK Berkah', tayang: Math.round((pack.pagu * 0.45 / 10) * 0.95) })
      items.push({ no: 3, name: 'Kertas Memo Sticky Notes', qty: 15, unit: 'Buah', price: Math.round(pack.pagu * 0.20 / 15), vendor: 'CV. Maju Jaya', tayang: Math.round((pack.pagu * 0.20 / 15) * 0.97) })
      items.push({ no: 4, name: 'Binder Clip Logam', qty: 8, unit: 'Kotak', price: Math.round(pack.pagu * 0.30 / 8), vendor: 'Toko ATK Berkah', tayang: Math.round((pack.pagu * 0.30 / 8) * 0.96) })
    } else if (packNameLower.includes('kertas') || packNameLower.includes('cover') || packNameLower.includes('hvs')) {
      items.push({ no: 1, name: 'Kertas HVS F4 70gr Sinar Dunia', qty: 50, unit: 'Rim', price: Math.round(pack.pagu * 0.60 / 50), vendor: 'PT. Distribusi Kertas', tayang: Math.round((pack.pagu * 0.60 / 50) * 0.95) })
      items.push({ no: 2, name: 'Kertas HVS A4 80gr PaperOne', qty: 30, unit: 'Rim', price: Math.round(pack.pagu * 0.40 / 30), vendor: 'PT. Distribusi Kertas', tayang: Math.round((pack.pagu * 0.40 / 30) * 0.95) })
    } else if (packNameLower.includes('tinta') || packNameLower.includes('komputer') || packNameLower.includes('printer')) {
      items.push({ no: 1, name: 'Tinta Printer Original Black', qty: 12, unit: 'Botol', price: Math.round(pack.pagu * 0.50 / 12), vendor: 'Tinta Komputer Utama', tayang: Math.round((pack.pagu * 0.50 / 12) * 0.92) })
      items.push({ no: 2, name: 'Tinta Printer Original Colour', qty: 12, unit: 'Botol', price: Math.round(pack.pagu * 0.50 / 12), vendor: 'Tinta Komputer Utama', tayang: Math.round((pack.pagu * 0.50 / 12) * 0.92) })
    } else if (packNameLower.includes('cetak') || packNameLower.includes('banner') || packNameLower.includes('spanduk')) {
      items.push({ no: 1, name: 'Cetak Banner Flexy 340gr (Outdoor)', qty: 15, unit: 'Meter Persegi', price: Math.round(pack.pagu / 15), vendor: 'Percetakan Sinar', tayang: Math.round((pack.pagu / 15) * 0.98) })
    } else {
      items.push({ no: 1, name: `${pack.packName}`, qty: 1, unit: pack.volume || 'Paket', price: pack.pagu, vendor: 'Penyedia e-Katalog', tayang: Math.round(pack.pagu * 0.99) })
    }"""

code = code.replace(old_get_package, new_get_package)

# 2. Update state initialization to fall back to `item.vendor` and `item.tayang`
old_vars = """                    const vendor = nego.vendor || '';
                    const tayang = nego.tayang !== undefined ? nego.tayang : '';"""

new_vars = """                    const vendor = nego.vendor !== undefined ? nego.vendor : (item.vendor || '');
                    const tayang = nego.tayang !== undefined ? nego.tayang : (item.tayang || '');"""

code = code.replace(old_vars, new_vars)

# 3. Add HPS to the headers and rows. 
# Currently the header is: <th className="p-4 text-right w-32">Pagu DPA/HPS (Satuan)</th>
# I will split it into two columns: Pagu DPA (Satuan) and HPS (Satuan)
old_headers = """                    <th className="p-4 text-right w-32">Pagu DPA/HPS (Satuan)</th>
                    <th className="p-4 w-36 text-right">Harga Tayang Katalog</th>"""
new_headers = """                    <th className="p-4 text-right w-32">Pagu DPA (Satuan)</th>
                    <th className="p-4 text-right w-32">HPS (Satuan)</th>
                    <th className="p-4 w-36 text-right">Harga Tayang Katalog</th>"""
code = code.replace(old_headers, new_headers)

old_row = """                        <td className="p-4 text-right">
                          <div className="font-mono font-bold text-slate-700 text-xs">Rp {hpsSatuan.toLocaleString('id-ID')}</div>
                          <div className="text-[9px] text-slate-400 mt-0.5">Batas Maksimal</div>
                        </td>
                        <td className="p-4">"""

new_row = """                        <td className="p-4 text-right">
                          <div className="font-mono font-bold text-slate-700 text-xs">Rp {hpsSatuan.toLocaleString('id-ID')}</div>
                          <div className="text-[9px] text-rose-500 font-bold mt-0.5 uppercase">Batas Maksimal</div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="font-mono font-bold text-indigo-700 text-xs">Rp {hpsSatuan.toLocaleString('id-ID')}</div>
                          <div className="text-[9px] text-indigo-400 mt-0.5">Est. PPK</div>
                        </td>
                        <td className="p-4">"""
code = code.replace(old_row, new_row)

with open("frontend/src/components/ProcurementPanel.jsx", "w") as f:
    f.write(code)

print("Pre-filled DPP data updated.")
