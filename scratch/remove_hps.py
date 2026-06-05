import re

with open("frontend/src/components/ProcurementPanel.jsx", "r") as f:
    code = f.read()

# 1. Update Headers
old_headers = """                    <th className="p-4 text-right w-32">Pagu DPA (Satuan)</th>
                    <th className="p-4 text-right w-32">HPS (Satuan)</th>
                    <th className="p-4 w-36 text-right">Harga Tayang Katalog</th>"""
new_headers = """                    <th className="p-4 text-right w-32">Pagu DPA (Satuan)</th>
                    <th className="p-4 w-36 text-right">Harga Tayang Katalog</th>"""
code = code.replace(old_headers, new_headers)

# 2. Update Row
old_row = """                        <td className="p-4 text-right">
                          <div className="font-mono font-bold text-slate-700 text-xs">Rp {hpsSatuan.toLocaleString('id-ID')}</div>
                          <div className="text-[9px] text-rose-500 font-bold mt-0.5 uppercase">Batas Maksimal</div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="font-mono font-bold text-indigo-700 text-xs">Rp {hpsSatuan.toLocaleString('id-ID')}</div>
                          <div className="text-[9px] text-indigo-400 mt-0.5">Est. PPK</div>
                        </td>"""
new_row = """                        <td className="p-4 text-right">
                          <div className="font-mono font-bold text-slate-700 text-xs">Rp {hpsSatuan.toLocaleString('id-ID')}</div>
                          <div className="text-[9px] text-rose-500 font-bold mt-0.5 uppercase">Batas Maksimal</div>
                        </td>"""
code = code.replace(old_row, new_row)

with open("frontend/src/components/ProcurementPanel.jsx", "w") as f:
    f.write(code)

print("HPS column removed.")
