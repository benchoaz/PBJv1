import re

with open("frontend/src/components/ProcurementPanel.jsx", "r") as f:
    code = f.read()

# Problem 1: The old closing `</tr> )` (returned from map) was left intact AND
# the new accordion block was inserted SEPARATELY, so React.Fragment is never closed properly.
# Fix: Replace the STALE old close block with proper Fragment close.

old_close = """                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>"""

new_close = """                          </button>
                        </td>
                      </tr>
                      {expandedSearchRows[item.no] && (
                        <tr className="bg-indigo-50/30 border-b border-indigo-100">
                          <td colSpan="10" className="p-4">
                            <div className="bg-white border border-indigo-100 rounded-xl p-5 shadow-sm">
                              <div className="flex items-center gap-2 mb-4 text-indigo-700 font-bold text-sm">
                                <span>🔍</span> Pengaturan Pencarian Alternatif Katalog (Produk #{idx + 1}: {item.name})
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
                                    placeholder="Nama spesifik vendor..."
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
                                    value={sParams.maxPrice || (item.paguDpa || item.price || 0)}
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
                                  {isSearching ? '⏳ Mencari...' : '🚀 Mulai Cari (Puppeteer AI)'}
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                      </React.Fragment>
                    )
                  })}
                </tbody>"""

# First, remove the duplicate accordion block if previously injected (to avoid double insertion)
# Find the old duplicate block from previous script attempt
old_dupe_start = """                      {expandedSearchRows[item.no] && (
                        <tr className="bg-indigo-50/30 border-b border-indigo-100">"""
old_dupe_end = """                      </React.Fragment>
                    );"""
# Check if there's already an accordion block injected previously
if old_dupe_start in code:
    # Extract and remove the entire old block between old_close_plain and old_dupe_end
    old_plain_close = """                      </tr>
                      {expandedSearchRows[item.no] && (
                        <tr className="bg-indigo-50/30 border-b border-indigo-100">"""
    # Remove the old accordion block including trailing `</React.Fragment>` and `;`
    old_full_block = code[code.find(old_plain_close):code.find("</React.Fragment>\n                    );\n                  })")+len("</React.Fragment>\n                    );\n                  })")]
    # Simpler approach: reconstruct
    print("Found old accordion, rebuilding...")

count = code.count(old_close)
print(f"Found {count} occurrences of old_close")

code = code.replace(old_close, new_close, 1)

# Also make sure React is imported at the top (needed for React.Fragment)
if "import React" not in code and "import React," not in code:
    code = code.replace("import { useState", "import React, { useState", 1)

with open("frontend/src/components/ProcurementPanel.jsx", "w") as f:
    f.write(code)

print("Fix applied.")
