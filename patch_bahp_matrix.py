import re
import sys

with open("frontend/src/components/ProcurementPanel.jsx", "r") as f:
    content = f.read()

start_marker = "{(() => {\n                  const items = getPackageItems(submittedPack);\n                  const parsed = JSON.parse(submittedPack.description || '{}');\n                  const surveyData = parsed.surveyData;"
end_marker = "                {/* \n\n                {/* ═══════════════════════════════════════════════════════════ */}"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Could not find markers")
    sys.exit(1)

new_code = """{(() => {
                  const items = getPackageItems(submittedPack);
                  const parsed = JSON.parse(submittedPack.description || '{}');
                  const surveyData = parsed.surveyData;
                  
                  if (!comparisonData || Object.keys(comparisonData).length === 0) {
                     return <p className="text-[10px] text-slate-400 italic mb-4">Belum ada data komparasi Pejabat Pengadaan. Silakan gunakan tombol "Cari Pembanding" di tabel negosiasi.</p>;
                  }

                  return items.map((item, idx) => {
                     const comp = comparisonData[item.no];
                     if (!comp) return null;
                     
                     const v1 = comp.v1 || {};
                     const v2 = comp.v2 || {};
                     const v3 = comp.v3 || {};
                     
                     return (
                       <div key={idx} className="mb-6 space-y-2 border border-slate-300 rounded-lg p-3 bg-white">
                         <div className="font-bold text-[10px] text-slate-700">{idx + 1}. Item: {item.name} (Kebutuhan: {item.qty} {item.unit})</div>
                         
                         <table className="w-full border-collapse border border-slate-900 text-[9px] text-center font-sans">
                           <thead>
                             <tr className="bg-slate-100 font-bold">
                               <td className="border border-slate-900 p-1.5 w-32">Kriteria Komparasi</td>
                               <td className={`border border-slate-900 p-1.5 ${comp.winner === 'v1' ? 'bg-indigo-50 text-indigo-900 border-2' : ''}`}>
                                 Vendor 1 {v1.isPpkRef && '(Ref PPK)'} {comp.winner === 'v1' ? '⭐ TERPILIH' : ''}
                               </td>
                               <td className={`border border-slate-900 p-1.5 ${comp.winner === 'v2' ? 'bg-indigo-50 text-indigo-900 border-2' : ''}`}>
                                 Vendor 2 {comp.winner === 'v2' ? '⭐ TERPILIH' : ''}
                               </td>
                               <td className={`border border-slate-900 p-1.5 ${comp.winner === 'v3' ? 'bg-indigo-50 text-indigo-900 border-2' : ''}`}>
                                 Vendor 3 {comp.winner === 'v3' ? '⭐ TERPILIH' : ''}
                               </td>
                             </tr>
                           </thead>
                           <tbody>
                             <tr>
                               <td className="border border-slate-900 p-1.5 font-bold bg-slate-50 text-left">Nama Penyedia</td>
                               <td className={`border border-slate-900 p-1.5 ${comp.winner === 'v1' ? 'bg-indigo-50/30 font-bold' : ''}`}>{v1.vendor || '-'}</td>
                               <td className={`border border-slate-900 p-1.5 ${comp.winner === 'v2' ? 'bg-indigo-50/30 font-bold' : ''}`}>{v2.vendor || '-'}</td>
                               <td className={`border border-slate-900 p-1.5 ${comp.winner === 'v3' ? 'bg-indigo-50/30 font-bold' : ''}`}>{v3.vendor || '-'}</td>
                             </tr>
                             <tr>
                               <td className="border border-slate-900 p-1.5 font-bold bg-slate-50 text-left">Harga Tayang Katalog</td>
                               <td className={`border border-slate-900 p-1.5 font-mono ${comp.winner === 'v1' ? 'bg-indigo-50/30 text-emerald-700 font-bold' : ''}`}>Rp {(parseFloat(v1.price) || 0).toLocaleString('id-ID')}</td>
                               <td className={`border border-slate-900 p-1.5 font-mono ${comp.winner === 'v2' ? 'bg-indigo-50/30 text-emerald-700 font-bold' : ''}`}>Rp {(parseFloat(v2.price) || 0).toLocaleString('id-ID')}</td>
                               <td className={`border border-slate-900 p-1.5 font-mono ${comp.winner === 'v3' ? 'bg-indigo-50/30 text-emerald-700 font-bold' : ''}`}>Rp {(parseFloat(v3.price) || 0).toLocaleString('id-ID')}</td>
                             </tr>
                           </tbody>
                         </table>
                         
                         {(() => {
                           if (comp.winner === 'v1' && v1.isPpkRef) {
                             const surveyItem = surveyData?.products?.find(p => p.name === item.name);
                             let imgSrc = surveyItem?.searchImg || surveyItem?.img;
                             if (imgSrc && imgSrc.startsWith('/screenshots/')) imgSrc = `http://localhost:3001${imgSrc}`;
                             
                             if (imgSrc) {
                               return (
                                 <div className="mt-3">
                                   <span className="text-[8px] font-bold text-indigo-600 uppercase block mb-1">📸 Bukti Tangkapan Layar Inaproc LKPP (Vendor Terpilih):</span>
                                   <img src={imgSrc} alt="Tangkapan Layar" className="w-full max-h-[300px] object-contain rounded border border-slate-200" />
                                 </div>
                               );
                             }
                           }
                           return null;
                         })()}
                       </div>
                     );
                  });
                })()}

"""

content = content[:start_idx] + new_code + content[end_idx:]

with open("frontend/src/components/ProcurementPanel.jsx", "w") as f:
    f.write(content)
print("BAHP Matrix patched successfully.")
