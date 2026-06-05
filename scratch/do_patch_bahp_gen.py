import re

with open("frontend/src/components/ProcurementPanel.jsx", "r") as f:
    code = f.read()

# 1. Replace the BAHP Rincian Penetapan <tbody>
old_tbody_start = "                  <tbody>\n                    {checkedItems[1] && savedDocs.laptop.selectedProduct ? ("
old_tbody_end = "                    )}                     \n                  </tbody>\n                </table>"
# Wait, I am not sure about the exact text. Let's use regex to replace between <tbody> and </table> right after "A. Hasil Rincian Penetapan Produk"
# Or just replace the whole table section.

old_table_section = """                <table className="w-full border-collapse border border-slate-900 text-[10px] text-left font-sans">
                  <thead>
                    <tr className="bg-slate-100 font-bold text-center">
                      <td className="border border-slate-900 p-2 w-8">No</td>
                      <td className="border border-slate-900 p-2">Nama Barang Pilihan (e-Katalog Inaproc)</td>
                      <td className="border border-slate-900 p-2">Penyedia / Vendor</td>
                      <td className="border border-slate-900 p-2 text-right">Harga Katalog</td>
                      <td className="border border-slate-900 p-2 text-right">Harga Negosiasi</td>
                      <td className="border border-slate-900 p-2 text-right">Biaya Kirim</td>
                    </tr>
                  </thead>
                  <tbody>"""

new_table_section = """                <table className="w-full border-collapse border border-slate-900 text-[10px] text-left font-sans">
                  <thead>
                    <tr className="bg-slate-100 font-bold text-center">
                      <td className="border border-slate-900 p-2 w-8">No</td>
                      <td className="border border-slate-900 p-2">Nama Barang Pilihan (e-Katalog Inaproc)</td>
                      <td className="border border-slate-900 p-2">Penyedia / Vendor</td>
                      <td className="border border-slate-900 p-2 text-right">Harga Katalog</td>
                      <td className="border border-slate-900 p-2 text-right">Harga Negosiasi</td>
                      <td className="border border-slate-900 p-2 text-right">Biaya Kirim</td>
                    </tr>
                  </thead>
                  <tbody>
                    {getPackageItems(submittedPack).map((item, idx) => {
                      if (!checkedItems[item.no]) return null;
                      const nego = negotiatedItems[item.no] || {};
                      if (!nego.vendor) return null;
                      return (
                        <tr key={item.no}>
                          <td className="border border-slate-900 p-2 text-center">{idx + 1}</td>
                          <td className="border border-slate-900 p-2 font-medium">{item.name}</td>
                          <td className="border border-slate-900 p-2">{nego.vendor}</td>
                          <td className="border border-slate-900 p-2 text-right">Rp {(item.price || 0).toLocaleString('id-ID')}</td>
                          <td className="border border-slate-900 p-2 text-right font-bold bg-slate-50">Rp {(parseFloat(nego.price) || 0).toLocaleString('id-ID')}</td>
                          <td className="border border-slate-900 p-2 text-right">Rp {(parseFloat(nego.ongkir) || 0).toLocaleString('id-ID')}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>"""

# Let's write a python script that accurately replaces this part by splitting strings
with open("scratch/do_patch_bahp.py", "w") as f_py:
    f_py.write('''import re
with open("frontend/src/components/ProcurementPanel.jsx", "r") as f:
    code = f.read()

# 1. Replace Table Body
start_str = """                <table className="w-full border-collapse border border-slate-900 text-[10px] text-left font-sans">"""
end_str = """                <div className="font-bold text-[11px] uppercase tracking-wide border-b border-slate-300 pb-1 mt-6 font-sans text-indigo-850">B. Lampiran I: Matriks Komparasi Perbandingan Produk (Syarat Mutlak Audit BPK)</div>"""

start_idx = code.find(start_str)
end_idx = code.find(end_str)

new_table = """                <table className="w-full border-collapse border border-slate-900 text-[10px] text-left font-sans">
                  <thead>
                    <tr className="bg-slate-100 font-bold text-center">
                      <td className="border border-slate-900 p-2 w-8">No</td>
                      <td className="border border-slate-900 p-2">Nama Barang Pilihan (e-Katalog Inaproc)</td>
                      <td className="border border-slate-900 p-2">Penyedia / Vendor</td>
                      <td className="border border-slate-900 p-2 text-right">Harga Katalog</td>
                      <td className="border border-slate-900 p-2 text-right">Harga Negosiasi</td>
                      <td className="border border-slate-900 p-2 text-right">Biaya Kirim</td>
                    </tr>
                  </thead>
                  <tbody>
                    {getPackageItems(submittedPack).map((item, idx) => {
                      if (!checkedItems[item.no]) return null;
                      const nego = negotiatedItems[item.no] || {};
                      if (!nego.vendor) return null;
                      return (
                        <tr key={item.no}>
                          <td className="border border-slate-900 p-2 text-center">{idx + 1}</td>
                          <td className="border border-slate-900 p-2 font-medium">{item.name}</td>
                          <td className="border border-slate-900 p-2">{nego.vendor}</td>
                          <td className="border border-slate-900 p-2 text-right">Rp {(item.price || 0).toLocaleString('id-ID')}</td>
                          <td className="border border-slate-900 p-2 text-right font-bold bg-slate-50">Rp {(parseFloat(nego.price) || 0).toLocaleString('id-ID')}</td>
                          <td className="border border-slate-900 p-2 text-right">Rp {(parseFloat(nego.ongkir) || 0).toLocaleString('id-ID')}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

"""

code = code[:start_idx] + new_table + code[end_idx:]

# 2. Replace B. Lampiran I and Lampiran II
start_idx_B = code.find(end_str) # end_str is "B. Lampiran I..."
# We want to replace everything from B until the end of the <div className="border border-slate-900...">
# Let's find "C. Bukti Audit Trail" or just replace until "                  <div className="mt-8 flex justify-end print:hidden">"

end_str_C = """                  <div className="mt-8 flex justify-end print:hidden">"""
end_idx_C = code.find(end_str_C)

new_lampiran = """                <div className="font-bold text-[11px] uppercase tracking-wide border-b border-slate-300 pb-1 mt-6 font-sans text-indigo-850">B. Lampiran I: Matriks Komparasi Perbandingan Produk (Syarat Mutlak Audit BPK)</div>
                <p className="font-sans text-[10px] text-slate-600 mb-4">Pejabat Pengadaan telah membandingkan minimal 3 produk sejenis dari vendor yang berbeda di e-Katalog untuk mendapatkan harga wajar terbaik bagi negara:</p>

                {getPackageItems(submittedPack).map((item, idx) => {
                  if (!checkedItems[item.no]) return null;
                  const nego = negotiatedItems[item.no];
                  if (!nego || !nego.linkSelected) return null;

                  return (
                    <div key={item.no} className="space-y-1.5 mb-6 font-sans break-inside-avoid">
                      <div className="font-bold text-[9px] text-slate-700">{idx + 1}. Matriks Komparasi: {item.name}</div>
                      <table className="w-full border-collapse border border-slate-950 text-[9px] text-center">
                        <thead>
                          <tr className="bg-slate-100 font-bold">
                            <td className="border border-slate-950 p-1.5 w-24">Kriteria Komparasi</td>
                            <td className="border border-slate-955 p-1.5 bg-indigo-50 font-bold text-indigo-900 border-2">Produk Terpilih ⭐</td>
                            <td className="border border-slate-955 p-1.5">Produk Pembanding 1</td>
                            <td className="border border-slate-955 p-1.5">Produk Pembanding 2</td>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-slate-950 p-1.5 font-bold bg-slate-50 text-left font-sans">Harga Negosiasi</td>
                            <td className="border border-slate-950 p-1.5 font-mono font-bold text-indigo-700 bg-indigo-50/30">Rp {(parseFloat(nego.price) || 0).toLocaleString('id-ID')}</td>
                            <td className="border border-slate-950 p-1.5 font-mono text-slate-400">Tidak Dinegosiasi</td>
                            <td className="border border-slate-950 p-1.5 font-mono text-slate-400">Tidak Dinegosiasi</td>
                          </tr>
                          <tr>
                            <td className="border border-slate-950 p-1.5 font-bold bg-slate-50 text-left font-sans">URL Tautan Asli</td>
                            <td className="border border-slate-955 p-1.5 bg-indigo-50/30 break-all text-[8px] text-indigo-600"><a href={nego.linkSelected} target="_blank">{nego.linkSelected}</a></td>
                            <td className="border border-slate-955 p-1.5 break-all text-[8px] text-indigo-600"><a href={nego.linkCompare1} target="_blank">{nego.linkCompare1 || '-'}</a></td>
                            <td className="border border-slate-955 p-1.5 break-all text-[8px] text-indigo-600"><a href={nego.linkCompare2} target="_blank">{nego.linkCompare2 || '-'}</a></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  );
                })}

                <div className="font-bold text-[11px] uppercase tracking-wide border-b border-slate-300 pb-1 mt-6 font-sans text-indigo-850">C. Lampiran II: Tangkapan Layar (Audit Trail e-Katalog LKPP)</div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {getPackageItems(submittedPack).map((item, idx) => {
                    if (!checkedItems[item.no]) return null;
                    const nego = negotiatedItems[item.no];
                    if (!nego || !nego.hasScreenshot) return null;
                    
                    return (
                      <div key={item.no} className="border border-slate-300 p-2 rounded text-center">
                        <div className="text-[9px] font-bold text-slate-700 mb-2 truncate">{item.name}</div>
                        <div className="w-full h-32 bg-slate-100 flex flex-col items-center justify-center border border-dashed border-slate-300 rounded text-slate-400">
                          <span className="text-2xl mb-1">📸</span>
                          <span className="text-[8px] font-mono">[Screenshot e-Katalog]</span>
                          <span className="text-[7px] text-indigo-500 mt-1">Valid: Sistem Telah Menyimpan Rekaman</span>
                        </div>
                      </div>
                    )
                  })}
                </div>

"""

code = code[:start_idx_B] + new_lampiran + code[end_idx_C:]

with open("frontend/src/components/ProcurementPanel.jsx", "w") as f:
    f.write(code)

print("Patch BAHP done.")
''')
