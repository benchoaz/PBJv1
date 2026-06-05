import re

with open("frontend/src/components/ProcurementPanel.jsx", "r") as f:
    code = f.read()

# Fix the variable mapping to use `item.katalogPrice` and `item.paguDpa` which are the real DB fields
old_vars = """                    const tayang = nego.tayang !== undefined ? nego.tayang : (item.tayang || '');
                    const negoPrice = nego.price !== undefined ? nego.price : '';
                    const ongkir = nego.ongkir !== undefined ? nego.ongkir : '';
                    
                    const hpsSatuan = item.price || 0;"""

new_vars = """                    const tayang = nego.tayang !== undefined ? nego.tayang : (item.katalogPrice !== undefined ? item.katalogPrice : (item.tayang || ''));
                    const negoPrice = nego.price !== undefined ? nego.price : '';
                    const ongkir = nego.ongkir !== undefined ? nego.ongkir : '';
                    
                    const paguSatuan = item.paguDpa !== undefined ? item.paguDpa : (item.price || 0);
                    const hpsSatuan = item.price || 0;"""

code = code.replace(old_vars, new_vars)

# Fix the pagu DPA cell to display paguSatuan instead of hpsSatuan
old_pagu_cell = """                        <td className="p-4 text-right">
                          <div className="font-mono font-bold text-slate-700 text-xs">Rp {hpsSatuan.toLocaleString('id-ID')}</div>
                          <div className="text-[9px] text-rose-500 font-bold mt-0.5 uppercase">Batas Maksimal</div>
                        </td>"""

new_pagu_cell = """                        <td className="p-4 text-right">
                          <div className="font-mono font-bold text-slate-700 text-xs">Rp {paguSatuan.toLocaleString('id-ID')}</div>
                          <div className="text-[9px] text-rose-500 font-bold mt-0.5 uppercase">Batas Maksimal</div>
                        </td>"""

code = code.replace(old_pagu_cell, new_pagu_cell)

# In case my previous script merged the survey data using `item.tayang`, I should make it `item.katalogPrice`
# Let's check if the merge logic is there.
old_merge = """                  tayang: surveyProd.price,"""
new_merge = """                  tayang: surveyProd.price,
                  katalogPrice: surveyProd.price,"""
code = code.replace(old_merge, new_merge)

with open("frontend/src/components/ProcurementPanel.jsx", "w") as f:
    f.write(code)

print("Mapping fixed.")
