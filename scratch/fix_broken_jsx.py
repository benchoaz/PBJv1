with open("frontend/src/components/ProcurementPanel.jsx", "r") as f:
    lines = f.readlines()

# Lines are 1-indexed. We need to fix lines 1168-1184 (0-indexed: 1167-1183)
# The broken block is lines 1168-1184. Replace them with correct JSX.

correct_block = '''                      <tr className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 text-center text-slate-500 font-medium">{idx + 1}</td>
                        <td className="p-4 whitespace-normal min-w-[220px]">
                          <div className="font-bold text-slate-800 text-sm leading-snug">{item.name}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2" title={item.specs}>{item.specs || '-'}</div>
                          <button
                            onClick={() => handleToggleSearchRow(item.no, item)}
                            className={`mt-2 text-[11px] font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 transition-all w-full justify-center ${
                              expandedSearchRows[item.no]
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                                : 'bg-white border-indigo-300 text-indigo-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
                            }`}
                          >
                            🔍 {expandedSearchRows[item.no] ? 'Tutup Pencarian ▲' : 'Cari Produk ▼'}
                          </button>
                        </td>
'''

# Replace lines 1168 to 1184 (0-indexed: 1167 to 1183)
new_lines = lines[:1167] + [correct_block] + lines[1184:]

with open("frontend/src/components/ProcurementPanel.jsx", "w") as f:
    f.writelines(new_lines)

print("Fixed broken JSX at lines 1168-1184.")

# Verify
with open("frontend/src/components/ProcurementPanel.jsx", "r") as f:
    verify = f.readlines()
for i, l in enumerate(verify[1165:1190], start=1166):
    print(f"{i}: {l}", end='')
