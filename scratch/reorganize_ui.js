const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../frontend/src/components/ppk/Step3RincianHPS.jsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Remove "Template Nota Dinas" block
const tplNdMatch = content.match(/<div[^>]*>\s*<label[^>]*>Template Nota Dinas<\/label>[\s\S]*?<\/div>\s*<\/div>/);
// Wait, Template Nota Dinas and Template Dokumen Persiapan are in a grid-cols-2 div:
const tplsGridMatch = content.match(/<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">\s*<div>\s*<label[^>]*>Template Nota Dinas[\s\S]*?<\/select>\s*<\/div>\s*<\/div>/);

if (tplsGridMatch) {
  content = content.replace(tplsGridMatch[0], '');
}

// 2. Remove "Nomor DPP", "Nomor Nota Dinas", and "Tanggal Surat" from the Informasi Surat grid
const nomorDppMatch = content.match(/<div>\s*<label[^>]*>Nomor DPP \(Manual\)<\/label>[\s\S]*?<\/div>/);
if (nomorDppMatch) content = content.replace(nomorDppMatch[0], '');

const nomorNdMatch = content.match(/<div>\s*<label[^>]*>Nomor Nota Dinas \(Manual\)<\/label>[\s\S]*?<\/div>/);
if (nomorNdMatch) content = content.replace(nomorNdMatch[0], '');

const tanggalMatch = content.match(/<div>\s*<label[^>]*>Tanggal Surat \/ Dokumen<\/label>[\s\S]*?<\/div>/);
if (tanggalMatch) content = content.replace(tanggalMatch[0], '');

// 3. Inject them into Pengaturan Klausul Dokumen
const klausulTarget = '{/* Badge Indikator Jenis DPP & Editor KAK */}';

const injectedUI = `
                    {/* Badge Indikator Jenis DPP & Editor KAK */}
                    <div className="mb-6 p-4 border rounded-xl bg-blue-50 border-blue-200">
                      <div className="font-bold text-blue-900 text-sm mb-4 flex items-center justify-between gap-2 border-b border-blue-200/50 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📋</span> Template Dokumen & Klausul (Gabungan)
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                        <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Template Nota Dinas</label>
                          ${tplsGridMatch ? tplsGridMatch[0].match(/<select[\s\S]*?<\/select>/)[0] : ''}
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Template Dokumen Persiapan (DPP)</label>
                          ${tplsGridMatch ? tplsGridMatch[0].match(/<select[\s\S]*?<\/select>/g)[1] : ''}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                        <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Nomor Nota Dinas</label>
                          ${nomorNdMatch ? nomorNdMatch[0].match(/<input[\s\S]*?\/>/)[0] : ''}
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Nomor DPP</label>
                          ${nomorDppMatch ? nomorDppMatch[0].match(/<input[\s\S]*?\/>/)[0] : ''}
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Tanggal Surat</label>
                          ${tanggalMatch ? tanggalMatch[0].match(/<input[\s\S]*?\/>/)[0] : ''}
                        </div>
                      </div>
`;

content = content.replace(
  /\{\/\* Badge Indikator Jenis DPP & Editor KAK \*\/\}[\s\S]*?<div className="mb-6 p-4 border rounded-xl bg-blue-50 border-blue-200">\s*<div className="font-bold text-blue-900 text-sm mb-1 flex items-center justify-between gap-2">\s*<div className="flex items-center gap-2">\s*<span className="text-lg">📋<\/span> Pengaturan Klausul Dokumen\s*<\/div>\s*<\/div>/,
  injectedUI
);

fs.writeFileSync(targetPath, content, 'utf8');
console.log('UI Reorganized Successfully');
