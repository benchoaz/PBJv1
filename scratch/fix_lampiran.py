import re

with open("frontend/src/components/ProcurementPanel.jsx", "r") as f:
    code = f.read()

start_str = """                <div className="font-bold text-[11px] uppercase tracking-wide border-b border-slate-300 pb-1 mt-6 font-sans text-indigo-850">B. Lampiran I: Matriks Komparasi Perbandingan Produk (Syarat Mutlak Audit BPK)</div>"""
end_str = """                <div className="font-bold text-[11px] uppercase tracking-wide border-b border-slate-300 pb-1 mt-8 font-sans text-indigo-850">D. Validasi Kewajaran Harga oleh Pejabat Pengadaan (PP)</div>"""

start_idx = code.find(start_str)
end_idx = code.find(end_str)

if start_idx == -1:
    print("Could not find start_str!")
if end_idx == -1:
    print("Could not find end_str!")

if start_idx != -1 and end_idx != -1:
    new_lampiran = """                <div className="font-bold text-[11px] uppercase tracking-wide border-b border-slate-300 pb-1 mt-6 font-sans text-indigo-850">B. Lampiran I: Matriks Komparasi Perbandingan Produk (Otomatisasi AI)</div>
                <p className="font-sans text-[10px] text-slate-600 mb-4">Pejabat Pengadaan telah dibantu oleh Asisten AI untuk membandingkan produk dari vendor berbeda di e-Katalog untuk mendapatkan harga wajar terbaik bagi negara:</p>

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
                            <td className="border border-slate-955 p-1.5">Produk Pembanding (AI)</td>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-slate-950 p-1.5 font-bold bg-slate-50 text-left font-sans">Nama Vendor</td>
                            <td className="border border-slate-950 p-1.5 font-bold text-indigo-700 bg-indigo-50/30">{nego.vendor}</td>
                            <td className="border border-slate-950 p-1.5 font-bold text-slate-600">{nego.compareVendor || 'Vendor e-Katalog'}</td>
                          </tr>
                          <tr>
                            <td className="border border-slate-950 p-1.5 font-bold bg-slate-50 text-left font-sans">Harga Negosiasi / Tayang</td>
                            <td className="border border-slate-950 p-1.5 font-mono font-bold text-indigo-700 bg-indigo-50/30">Rp {(parseFloat(nego.price) || 0).toLocaleString('id-ID')}</td>
                            <td className="border border-slate-950 p-1.5 font-mono text-slate-600">Rp {(parseFloat(nego.comparePrice) || 0).toLocaleString('id-ID')}</td>
                          </tr>
                          <tr>
                            <td className="border border-slate-950 p-1.5 font-bold bg-slate-50 text-left font-sans">URL Tautan Asli</td>
                            <td className="border border-slate-955 p-1.5 bg-indigo-50/30 break-all text-[8px] text-indigo-600"><a href={nego.linkSelected} target="_blank">{nego.linkSelected}</a></td>
                            <td className="border border-slate-955 p-1.5 break-all text-[8px] text-indigo-600"><a href={nego.linkCompare1} target="_blank">{nego.linkCompare1 || '-'}</a></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  );
                })}

                <div className="font-bold text-[11px] uppercase tracking-wide border-b border-slate-300 pb-1 mt-6 font-sans text-indigo-850 break-before-page">C. Lampiran II: Bukti Tangkapan Layar (Screenshot) Otomatis AI</div>
                <div className="mt-4 grid grid-cols-2 gap-4 mb-8">
                  {getPackageItems(submittedPack).map((item, idx) => {
                    if (!checkedItems[item.no]) return null;
                    const nego = negotiatedItems[item.no];
                    if (!nego || !nego.hasScreenshot || !nego.screenshotUrl) return null;
                    
                    return (
                      <div key={item.no} className="border border-slate-300 p-2 rounded text-center">
                        <div className="text-[9px] font-bold text-slate-700 mb-2 truncate">Pembanding: {item.name}</div>
                        <div className="w-full h-48 bg-slate-100 flex flex-col items-center justify-center border border-slate-300 rounded overflow-hidden shadow-sm">
                          <img src={nego.screenshotUrl} alt="Screenshot" className="object-cover w-full h-full" />
                        </div>
                        <div className="text-[7px] text-emerald-600 mt-1 font-bold">✓ Diverifikasi oleh AI Asisten</div>
                      </div>
                    )
                  })}
                </div>

"""
    code = code[:start_idx] + new_lampiran + code[end_idx:]
    with open("frontend/src/components/ProcurementPanel.jsx", "w") as f:
        f.write(code)
    print("Lampiran successfully replaced.")
