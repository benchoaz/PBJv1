import re
import sys

with open("frontend/src/components/ProcurementPanel.jsx", "r") as f:
    content = f.read()

# Replace the Lampiran I and II hardcoded sections with dynamic mapping
start_marker = "B. Lampiran I: Matriks Komparasi Perbandingan Produk (Syarat Mutlak Audit BPK)</div>"
end_marker = "SEKSI D: VALIDASI KEWAJARAN HARGA OLEH PP"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Could not find markers")
    sys.exit(1)

# Backtrack to the start of the <div class="font-bold ..."> tag for start_marker
div_start = content.rfind("<div", 0, start_idx)

# Go to the end of the previous div before SEKSI D
div_end = content.rfind("</div>", 0, end_idx) + 6

new_section = """<div className="font-bold text-[11px] uppercase tracking-wide border-b border-slate-300 pb-1 mt-6 font-sans text-indigo-850">B. Lampiran I & II: Dokumen Pengumpulan Referensi Harga (Katalog Inaproc)</div>
                <p className="font-sans text-[10px] text-slate-600 mb-2">Pejabat Pengadaan dan PPK telah memverifikasi produk dan mengumpulkan referensi harga secara sah berdasarkan portal E-Purchasing LKPP Nasional:</p>

                {(() => {
                  const items = getPackageItems(submittedPack);
                  const parsed = JSON.parse(submittedPack.description || '{}');
                  const surveyData = parsed.surveyData;
                  
                  if (!surveyData || !surveyData.products || surveyData.products.length === 0) {
                    return <p className="text-[10px] text-slate-400 italic mb-4">Belum ada data survei Inaproc. Silakan PPK melakukan survei pasar otomatis di aplikasi PPK.</p>;
                  }

                  return surveyData.products.map((product, idx) => {
                     const itemDef = items[idx] || {};
                     const vendor = product.vendor || 'TIDAK DITEMUKAN';
                     if (vendor === 'TIDAK DITEMUKAN' || !product.success) return null;
                     
                     let imgSrc = product.searchImg || product.img;
                     if (imgSrc && imgSrc.startsWith('/screenshots/')) {
                       imgSrc = `http://localhost:3001${imgSrc}`;
                     }
                     
                     return (
                       <div key={idx} className="mb-6 space-y-2 border border-slate-300 rounded-lg p-3 bg-white">
                         <div className="font-bold text-[10px] text-slate-700">{idx + 1}. Item: {product.name} (Kebutuhan: {itemDef.qty} {itemDef.unit})</div>
                         
                         <table className="w-full border-collapse border border-slate-900 text-[9px] text-center font-sans">
                           <thead>
                             <tr className="bg-slate-100 font-bold">
                               <td className="border border-slate-900 p-1.5 w-32">Kriteria</td>
                               <td className="border border-slate-900 p-1.5 bg-indigo-50 text-indigo-900 font-bold border-2">Vendor E-Katalog (Terpilih)</td>
                             </tr>
                           </thead>
                           <tbody>
                             <tr>
                               <td className="border border-slate-900 p-1.5 font-bold bg-slate-50 text-left">Nama Penyedia</td>
                               <td className="border border-slate-900 p-1.5">{vendor}</td>
                             </tr>
                             <tr>
                               <td className="border border-slate-900 p-1.5 font-bold bg-slate-50 text-left">Harga Tayang Katalog</td>
                               <td className="border border-slate-900 p-1.5 font-mono text-emerald-700 font-bold">Rp {(product.price || 0).toLocaleString('id-ID')}</td>
                             </tr>
                             <tr>
                               <td className="border border-slate-900 p-1.5 font-bold bg-slate-50 text-left">Tautan Produk</td>
                               <td className="border border-slate-900 p-1.5 text-blue-600 break-all text-[8px]"><a href={product.link} target="_blank" rel="noreferrer">{product.link}</a></td>
                             </tr>
                           </tbody>
                         </table>
                         
                         {imgSrc && (
                           <div className="mt-3">
                             <span className="text-[8px] font-bold text-indigo-600 uppercase block mb-1">📸 Bukti Tangkapan Layar Inaproc LKPP:</span>
                             <img src={imgSrc} alt="Tangkapan Layar" className="w-full max-h-[400px] object-contain rounded border border-slate-200" />
                           </div>
                         )}
                       </div>
                     );
                  });
                })()}

                {/* """

content = content[:div_start] + new_section + content[div_end:]

with open("frontend/src/components/ProcurementPanel.jsx", "w") as f:
    f.write(content)
print("Replaced BAHP tables successfully.")
