import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { usePPK } from './PPKContext';

export default function Step4TemplateSurat() {
  const { 
    selectedPack, currentUser,
    docSettings, setDocSettings,
    packageMetadata, setPackageMetadata,
    dppSpecs, setDppSpecs,
    step, setStep,
    aiError, setAiError,
    hpsValue, isHpsExemptSelected,
    surveyData, hpsPrices, getPackageItems
  } = usePPK();

  const [activeDocPreview, setActiveDocPreview] = useState(null);
  const getPacketCategory = () => 'ATK';

  const getActiveSurveyData = () => null;
  const parseSmartColons = (t) => t;

  return (
    <>
      {/* Document Generation Action Center */}
              {(hpsValue || isHpsExemptSelected) && (
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 space-y-4">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Informasi Surat &amp; Penetapan</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">Lengkapi informasi di bawah ini agar sesuai dengan paket yang dikerjakan sebelum dicetak.</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Lokasi Pekerjaan / Tujuan</label>
                      <input type="text" value={packageMetadata.lokasi_pekerjaan} onChange={(e) => setPackageMetadata({...packageMetadata, lokasi_pekerjaan: e.target.value})} placeholder="Contoh: Kantor Kecamatan Besuk" className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Waktu Pelaksanaan</label>
                      <input type="text" value={packageMetadata.waktu_penyelesaian} onChange={(e) => setPackageMetadata({...packageMetadata, waktu_penyelesaian: e.target.value})} placeholder="Contoh: 14 (empat belas) hari kalender" className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Program</label>
                      <input type="text" value={packageMetadata.program} onChange={(e) => setPackageMetadata({...packageMetadata, program: e.target.value})} placeholder="Nama Program" className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Kegiatan</label>
                      <input type="text" value={packageMetadata.kegiatan} onChange={(e) => setPackageMetadata({...packageMetadata, kegiatan: e.target.value})} placeholder="Nama Kegiatan" className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Sub Kegiatan</label>
                      <input type="text" value={packageMetadata.sub_kegiatan} onChange={(e) => setPackageMetadata({...packageMetadata, sub_kegiatan: e.target.value})} placeholder="Nama Sub Kegiatan" className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nomor DPP (Manual)</label>
                      <input type="text" value={packageMetadata.nomor_dpp} onChange={(e) => setPackageMetadata({...packageMetadata, nomor_dpp: e.target.value})} placeholder="Opsional (Kosongi jika otomatis)" className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none transition-colors" />
                    </div>
                  </div>

                  {/* Badge Indikator Jenis DPP */}
                  <div className="mb-6 p-4 border rounded-xl bg-blue-50 border-blue-200">
                    <div className="font-bold text-blue-900 text-sm mb-1 flex items-center gap-2">
                      <span className="text-lg">📋</span> Template DPP: {
                        getPacketCategory(selectedPack?.packName || '') === 'Mamin-Prasmanan' ? 'Mamin — Prasmanan/Katering' :
                        getPacketCategory(selectedPack?.packName || '') === 'Mamin-Bungkus' ? 'Mamin — Nasi Kotak / Bungkus' :
                        getPacketCategory(selectedPack?.packName || '') === 'Mamin-Snack' ? 'Mamin — Snack' :
                        getPacketCategory(selectedPack?.packName || '') === 'Modal' ? 'Belanja Modal' :
                        getPacketCategory(selectedPack?.packName || '') === 'Konsolidasi' ? 'Konsolidasi' :
                        getPacketCategory(selectedPack?.packName || '') === 'Jasa' ? 'Jasa' : 'ATK / Standar'
                      }
                    </div>
                    <div className="text-xs text-blue-800 leading-relaxed">
                      {getPacketCategory(selectedPack?.packName || '') === 'Mamin-Prasmanan' && "Pasal kunci: I.e (Peralatan saji & Personil Layanan), VII (Wajib SLHS). Status: Jasa Katering."}
                      {getPacketCategory(selectedPack?.packName || '') === 'Mamin-Bungkus' && "Pasal kunci: I.e (Higienis, kemasan individual, 1 jam sebelum), VII (Wajib SLHS)."}
                      {getPacketCategory(selectedPack?.packName || '') === 'Mamin-Snack' && "Pasal kunci: I.e (Kemasan tertutup, masa kadaluarsa), VII (Wajib SLHS)."}
                      {getPacketCategory(selectedPack?.packName || '') === 'Modal' && "Pasal kunci: I.b (Merek & Service Center), VII (Surat Dukungan Pabrikan)."}
                      {getPacketCategory(selectedPack?.packName || '') === 'Konsolidasi' && "Pasal kunci: VI (Direct Purchasing ke Penyedia Konsolidasi). Status: Bebas HPS."}
                      {getPacketCategory(selectedPack?.packName || '') === 'Jasa' && "Pasal kunci: standar untuk Jasa lainnya."}
                      {getPacketCategory(selectedPack?.packName || '') === 'ATK' && "Pasal kunci: standar pengadaan ATK."}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    {!isHpsExemptSelected && (
                      <button
                        onClick={() => setActiveDocPreview('hps')}
                        className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 px-5 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
                      >
                        Lihat Surat Penetapan HPS
                      </button>
                    )}
                    <button
                      onClick={() => setActiveDocPreview('nd')}
                      className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 px-5 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
                    >
                      Lihat Nota Dinas
                    </button>
                    <button
                      onClick={() => setActiveDocPreview('dpp')}
                      className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 px-5 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
                    >
                      Lihat Dokumen DPP PPK
                    </button>
                  </div>
                  </div>
              )}
                  
      {/* DOCUMENT PREVIEW MODAL (A4 PAPER SIMULATION & HIGH-FIDELITY PRINT-READY VIEW) */}
      {activeDocPreview && selectedPack && createPortal(
        <div id="print-modal-parent" style={{ backgroundColor: 'rgba(15, 23, 42, 0.95)' }} className="fixed inset-0 backdrop-blur-md z-50 flex flex-col items-center overflow-y-auto p-4 animate-fade-in print:p-0 print:bg-white">

          {/* Style Injector to override print layout strictly for A4/F4 format */}
          <style dangerouslySetInnerHTML={{
            __html: `
            @media print {
              html, body {
                background: white !important;
                margin: 0 !important;
                padding: 0 !important;
                height: auto !important;
                overflow: visible !important;
              }
              
              body > #root {
                display: none !important;
              }
              
              body > #print-modal-parent {
                display: block !important;
                position: static !important;
                width: 100% !important;
                height: auto !important;
                overflow: visible !important;
                background: transparent !important;
                padding: 0 !important;
                margin: 0 !important;
                box-shadow: none !important;
                border: none !important;
                backdrop-filter: none !important;
              }
              
              .print\\:hidden {
                display: none !important;
                visibility: hidden !important;
              }
              
              #print-sheet {
                display: block !important;
                position: relative !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                box-shadow: none !important;
                border: none !important;
                min-height: auto !important;
                background: white !important;
              }
              
              /* Table formatting & pagination breaks */
              table {
                width: 100% !important;
                border-collapse: collapse !important;
                page-break-inside: auto !important;
                font-size: calc(1em - 1pt) !important;
              }
              tr {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              td, th {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              
              /* Prevent orphan headers */
              h1, h2, h3, h4, h5, h6 {
                page-break-after: avoid !important;
                break-after: avoid !important;
              }
              
              /* Avoid splitting signature blocks and table rows */
              .signature-section, tr {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              
              .break-before-page {
                page-break-before: always !important;
                break-before: page !important;
              }
              
              /* Hide scrollbars during print */
              ::-webkit-scrollbar {
                display: none !important;
              }
              
              @page {
                size: ${docSettings.paperSize === 'F4' ? '215mm 330mm' : 'A4'} portrait; 
                margin: ${docSettings.marginTop}mm ${docSettings.marginRight}mm ${docSettings.marginBottom}mm ${docSettings.marginLeft}mm !important; 
              }
            }
          `}} />
          <div className="fixed top-4 left-4 right-4 flex justify-between items-center z-50 bg-white/95 border border-slate-200/90 px-6 py-3.5 rounded-2xl shadow-2xl backdrop-blur-md max-w-7xl mx-auto print:hidden transition-all duration-300">
            <div className="text-slate-800 text-[11px] font-bold uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-800 animate-pulse"></span>
              Pratinjau Dokumen Resmi {activeDocPreview === 'hps' ? 'Surat Penetapan HPS' : activeDocPreview === 'nd' ? 'Nota Dinas Usulan' : 'Dokumen Persiapan Pengadaan (DPP)'}
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => window.location.href = '/admin/templates'}
                className="bg-sky-100 hover:bg-sky-200 text-sky-800 font-bold text-xs px-4 py-2 rounded-xl border border-sky-300 shadow-sm transition-all flex items-center gap-1.5"
                title="Atur Logo dan Kop Surat secara global"
              >
                ⚙️ Pengaturan Kop & Logo
              </button>
              <button
                onClick={() => window.print()}
                className="bg-emerald-600 hover:bg-emerald-750 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-600/10"
              >
                🖨️ Cetak / Unduh PDF
              </button>
              <button
                onClick={handleExportWord}
                className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
              >
                📥 Export Word (.doc)
              </button>
              <button
                onClick={() => setActiveDocPreview(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition-all border border-slate-200 flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                Tutup
              </button>
            </div>
          </div>

          {/* White Paper A4 Sheet */}
          <div
 id="print-sheet"

 className="bg-white text-slate-900 w-full shadow-2xl rounded-sm my-20 border border-slate-200 relative print:my-0 print:border-none print:shadow-none mx-auto flex-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-4 transition-shadow"
 style={{
 width: docSettings.paperSize === 'F4' ? '215mm' : '210mm',
 minHeight: docSettings.paperSize === 'F4' ? '330mm' : '297mm',
 paddingTop: `${docSettings.marginTop}mm`,
 paddingRight: `${docSettings.marginRight}mm`,
 paddingBottom: `${docSettings.marginBottom}mm`,
 paddingLeft: `${docSettings.marginLeft}mm`,
 fontFamily: docSettings.fontFamily === 'Bookman Old Style' 
 ? "'Bookman Old Style', Georgia, serif" 
 : docSettings.fontFamily === 'Arial' 
 ? "Arial, Helvetica, sans-serif" 
 : "'Times New Roman', Times, serif",
 fontSize: docSettings.fontSize || '12pt',
 lineHeight: docSettings.lineHeight || '1.15'
 }}
 >
 <div>
 {/* KOP SURAT DINAS / SATKER */}
 {docSettings.showKop && (
 <div className="w-full mb-6" style={{ pageBreakInside: 'avoid', fontFamily: '"Times New Roman", Times, serif' }}>
 <table className="no-border" style={{ width: '100%', borderCollapse: 'collapse', borderBottom: '3px solid black', marginBottom: '2px' }}>
 <tbody>
 <tr>
 <td style={{ width: '15%', verticalAlign: 'middle', textAlign: 'center', paddingBottom: '10px' }}>
 <img 
 className="logo-instansi"
 src={docSettings.logoType === 'pemda' ? "https://upload.wikimedia.org/wikipedia/commons/2/25/Lambang_Kabupaten_Probolinggo.png" : docSettings.logoType === 'garuda' ? "https://upload.wikimedia.org/wikipedia/commons/2/29/Garuda_Pancasila_Coat_of_Arms_of_Indonesia.svg" : docSettings.customLogo ? docSettings.customLogo : "https://upload.wikimedia.org/wikipedia/commons/2/25/Lambang_Kabupaten_Probolinggo.png"}
 alt="Logo Instansi" 
 style={{ maxHeight: '76px', maxWidth: '76px', objectFit: 'contain', display: 'inline-block' }} 
 />
 </td>
 <td style={{ width: '85%', textAlign: 'center', verticalAlign: 'middle', paddingBottom: '10px' }}>
 <div style={{ fontWeight: 'bold', fontSize: '14pt', textTransform: 'uppercase', lineHeight: '1.2' }}>{docSettings.namaPemda}</div>
 <div style={{ fontWeight: 'bold', fontSize: '18pt', textTransform: 'uppercase', lineHeight: '1.2' }}>{docSettings.namaInstansi}</div>
 <div style={{ fontSize: '10pt', marginTop: '4px', fontStyle: 'italic' }}>{docSettings.alamatLengkap}</div>
 </td>
 </tr>
 </tbody>
 </table>
 <div style={{ width: '100%', borderBottom: '1px solid black' }}></div>
 </div>
 )}

 {/* DOCUMENT CONTENT */}
 {activeDocPreview === 'hps' ? (
 // SURAT PENETAPAN HPS
 <div className="space-y-4">
 <div className="text-center font-bold uppercase underline text-[13pt] tracking-wide mt-2">
 Keputusan Pejabat Pembuat Komitmen
 </div>
 <div className="text-center font-bold font-sans -mt-3 text-slate-700">
 NOMOR: 027 / 142 / PPK / 437.82 / {new Date().getFullYear()}
 </div>
 <div className="text-center font-bold uppercase tracking-wider -mt-1">
 TENTANG<br />
 PENETAPAN HARGA PERKIRAAN SENDIRI (HPS)
 </div>
 <div className="text-center font-bold uppercase text-slate-800">
 PEKERJAAN: "{selectedPack?.packName}"
 </div>

 <div className="pt-4 space-y-3">
 <p className="text-justify">
 Menimbang bahwa untuk melaksanakan ketentuan Pasal 26 Peraturan Presiden Nomor 12 Tahun 2021 tentang Perubahan atas Peraturan Presiden Nomor 16 Tahun 2018 tentang Pengadaan Barang/Jasa Pemerintah, Pejabat Pembuat Komitmen (PPK) berkewajiban untuk menyusun dan menetapkan Harga Perkiraan Sendiri (HPS).
 </p>
 <p className="text-justify">
 Mengingat Dokumen Pelaksanaan Anggaran (DPA) Nomor: DPA/A.1/1.02.01/2026 yang bersumber dari Anggaran Pendapatan dan Belanja Daerah (APBD) Kabupaten Probolinggo Tahun Anggaran {new Date().getFullYear()}.
 </p>
 <div className="text-center font-bold uppercase py-2">MEMUTUSKAN:</div>

 <div className="pl-6 relative">
 <div className="absolute left-0 top-0 font-bold">KEDUA:</div>
 <p className="text-justify pl-1">
 Menetapkan Nilai Harga Perkiraan Sendiri (HPS) untuk pekerjaan pengadaan di bawah ini:
 </p>
 </div>

 {/* Table HPS */}
 <div className="pt-2">
 <table className="w-full border-collapse border border-slate-900 ">
 <thead>
 <tr className="bg-slate-100 font-bold text-center">
 <td className="border border-slate-900 p-2 w-8">No</td>
 <td className="border border-slate-900 p-2 text-left">Nama Barang / Uraian Rincian DPA</td>
 <td className="border border-slate-900 p-2 w-16">Jumlah</td>
 <td className="border border-slate-900 p-2 w-20">Satuan</td>
 <td className="border border-slate-900 p-2">Harga / Satuan (Rp)</td>
 <td className="border border-slate-900 p-2">Harga Total HPS (Rp)</td>
 </tr>
 </thead>
 <tbody>
 {getPackageItems(selectedPack).filter(item => (item.qty === '' ? 0 : (item.qty || 0)) > 0).map((item, idx) => {
 const unitHpsPrice = hpsPrices[item.name] !== undefined ? hpsPrices[item.name] : item.price;
 const surveyProduct = surveyData?.products?.find(p => p.name === item.name);
 const displayName = surveyProduct?.name || item.name;
 return (
 <tr key={item.no}>
 <td className="border border-slate-900 p-2 text-center">{item.no}</td>
 <td className="border border-slate-900 p-2 text-left font-medium">{displayName}</td>
 <td className="border border-slate-900 p-2 text-center font-bold">{item.qty}</td>
 <td className="border border-slate-900 p-2 text-center">{item.unit}</td>
 <td className="border border-slate-900 p-2 font-mono text-right">
   {unitHpsPrice.toLocaleString()}
 </td>
 <td className="border border-slate-900 p-2 font-mono font-bold text-right">
   {(item.qty * unitHpsPrice).toLocaleString()}
 </td>
 </tr>
 );
 })}
 <tr className="bg-slate-50 font-bold">
 <td colSpan="5" className="border border-slate-900 p-2 text-right">Jumlah Total Nilai HPS (Termasuk PPN & Pajak):</td>
 <td className="border border-slate-900 p-2 text-indigo-700 font-mono font-bold text-right">
   {parseInt(hpsValue).toLocaleString()}
 </td>
 </tr>
 </tbody>
 </table>
 </div>

 <p className="font-semibold italic bg-slate-100 p-2 rounded-sm border border-slate-300">
 Terbilang: "{terbilang(hpsValue)} Rupiah"
 </p>

 <p className="text-justify">
 HPS ini disusun secara kalkulatif dengan keahlian yang dapat dipertanggungjawabkan serta berdasarkan survei harga pasar riil di wilayah Kabupaten Probolinggo demi tercapainya asas efisiensi, efektivitas, transparansi, dan akuntabilitas keuangan daerah.
 </p>
 </div>
 </div>
 ) : activeDocPreview === 'nd' ? (
 // NOTA DINAS USULAN PENGADAAN
 <div className="space-y-4 relative">
 {(() => {
 const templatesStr = localStorage.getItem('pbj_templates');
 let templates = [];
 try { if (templatesStr) templates = JSON.parse(templatesStr); } catch (e) {}
 
 const ndTemplate = templates.find(t => t.id === selectedNdTplId) || templates.find(t => t.id === 'TPL-001');
 
 if (ndTemplate) {
 let content = ndTemplate.content;
 
 // Add centered title for default Nota Dinas
 if (ndTemplate.id === 'TPL-001' && !content.includes('NOTA DINAS')) {
    content = `<div class="text-center mb-6"><div class="font-bold text-lg underline leading-none mb-1">NOTA DINAS</div><div class="leading-none">Nomor : {{nomor_nd}}</div></div>\n` + content;
 }
 
 // Force remove legacy signature block from cached templates to prevent duplication
 content = content.replace(/Pejabat Pembuat Komitmen \(PPK\),?[\s\S]*?\{\{nama_ppk\}\}[\s\S]*?NIP\. \{\{nip_ppk\}\}/gi, '');

 const currentDocSettingsStr = localStorage.getItem('pbj_doc_settings');
 const docSettingsFallback = currentDocSettingsStr ? JSON.parse(currentDocSettingsStr) : null;
 const nomorBase = docSettingsFallback ? (docSettingsFallback.formatNomorSurat || '027/{nomor}/BPBJ/2026') : '027/{nomor}/BPBJ/2026';
 // Replace variables
 const replacements = {
 '{{nama_satker}}': currentUser?.department || 'Bagian Pengadaan Barang dan Jasa (BPBJ)',
 '{{nama_satker_kapital}}': (currentUser?.department || 'Bagian Pengadaan Barang dan Jasa (BPBJ)').toUpperCase(),
 '{{alamat_satker}}': docSettingsFallback ? docSettingsFallback.alamatLengkap : 'Jl. Raya Besuk Nomor 37 Besuk Probolinggo - 67283',
 '{{nama_pekerjaan}}': selectedPack.packName || '',
 '{{nilai_pagu}}': `Rp ${(selectedPack.pagu || 0).toLocaleString()} (${terbilang(selectedPack.pagu || 0)} Rupiah)`,
 '{{sumber_dana}}': `${selectedPack.sumberDana || 'APBD'} Tahun Anggaran ${new Date().getFullYear()}`,
 '{{nama_ppk}}': currentUser?.name || '',
 '{{nip_ppk}}': currentUser?.nip || '',
 '{{nomor_surat}}': nomorBase.replace('{nomor}', '045.2'),
 '{{nomor_nd}}': nomorBase.replace('{nomor}', '011/ND'),
 '{{nama_penyedia}}': '_______________________',
 '{{hari_tanggal_acara}}': '_______________________',
 '{{waktu_acara}}': '_______________________',
 '{{tempat_acara}}': '_______________________',
 '{{nama_pejabat_pengadaan}}': '_______________________',
 '{{nip_pejabat_pengadaan}}': '_______________________',
 '{{nomor_ba}}': nomorBase.replace('{nomor}', '108/BAKN'),
 '{{hari_ba}}': '_______________________',
 '{{tanggal_ba}}': '_______________________',
 '{{harga_penawaran}}': '_______________________',
 '{{harga_negosiasi}}': '_______________________',
 '{{nomor_bahp}}': nomorBase.replace('{nomor}', '112/BAHP'),
 '{{nilai_hps}}': '_______________________',
 '{{nama_penyedia_terpilih}}': '_______________________',
 '{{harga_final}}': '_______________________',
 '{{tempat_penetapan}}': 'Besuk',
 '{{nomor_sp}}': nomorBase.replace('{nomor}', '115/SP'),
 '{{alamat_penyedia}}': '_______________________',
 '{{nilai_kontrak}}': '_______________________',
 '{{waktu_penyelesaian}}': packageMetadata.waktu_penyelesaian || '14 (empat belas) hari kalender',
 '{{nomor_dpp}}': packageMetadata.nomor_dpp || '................................',
 '{{tanggal_dpp}}': new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
 '{{nomor_hps}}': nomorBase.replace('{nomor}', '014/HPS'),
 '{{tanggal_hps}}': new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
 '{{lokasi_pekerjaan}}': packageMetadata.lokasi_pekerjaan || (docSettingsFallback ? docSettingsFallback.namaInstansi : 'Komplek Perkantoran Pemerintah Daerah'),
 '{{program}}': packageMetadata.program || 'Program Penunjang Urusan Pemerintahan Daerah',
 '{{kegiatan}}': packageMetadata.kegiatan || 'Penyelenggaraan Pemerintahan dan Pelayanan Publik',
 '{{sub_kegiatan}}': packageMetadata.sub_kegiatan || 'Penyediaan Barang dan Jasa Perkantoran',
 '{{mak}}': selectedPack.mak || '',
 '{{pdn}}': 'Ya',
 '{{usaha_kecil}}': 'Ya',
 '{{pra_dipa}}': selectedPack.praDipa ? 'Ya' : 'Tidak',
 '{{volume_pekerjaan}}': selectedPack.volume || '1 Paket',
 '{{uraian_pekerjaan}}': `Pengadaan ${selectedPack.packName || ''} untuk operasional`,
 '{{kode_rup}}': selectedPack.noSirup || selectedPack.idPaket || '-'
 };
 
 Object.keys(replacements).forEach(key => {
 content = content.replace(new RegExp(key, 'g'), replacements[key]);
 });
 
 return <div style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', textAlign: 'justify', fontSize: '12pt', fontFamily: 'Arial, sans-serif' }} dangerouslySetInnerHTML={{ __html: parseSmartColons(content) }} />;
 }
 return <div className="text-center py-10">Template Nota Dinas tidak ditemukan.</div>;
 })()}
 </div>
 ) : (
 // DOKUMEN PERSIAPAN PENGADAAN (DPP)
 <div className="space-y-4 relative">
 {/* KOP SURAT DIHAPUS - KOP SURAT GLOBAL SUDAH ADA DI ATAS */}

 {(() => {
 const templatesStr = localStorage.getItem('pbj_templates');
 let templates = [];
 try { if (templatesStr) templates = JSON.parse(templatesStr); } catch (e) {}

 const cat = getPacketCategory(selectedPack?.packName || '');
 let tplId = 'TPL-006A';
 if (cat === 'Mamin') tplId = 'TPL-006B';
 else if (cat === 'Modal') tplId = 'TPL-006C';
 else if (cat === 'Jasa' || cat === 'Konstruksi') tplId = 'TPL-006D';
 else if (cat === 'Konsolidasi') tplId = 'TPL-006E';

 const template = templates.find(t => t.id === selectedTplId) || templates.find(t => t.id === tplId);
 
 if (template && template.content.includes('{{komponen_dinamis_dpp}}')) {
 // Template parsing logic
 let content = template.content;
 
 // Center the DPP title and Nomor
 content = content.replace(/^DOKUMEN PERSIAPAN PENGADAAN \(DPP\)\nNomor : \{\{nomor_dpp\}\}/, '<div class="text-center mb-6"><div class="font-bold text-lg underline leading-none mb-1">DOKUMEN PERSIAPAN PENGADAAN (DPP)</div><div class="leading-none">Nomor : {{nomor_dpp}}</div></div>');

 const currentDocSettingsStr = localStorage.getItem('pbj_doc_settings');
 const docSettingsFallback = currentDocSettingsStr ? JSON.parse(currentDocSettingsStr) : null;
 const nomorBase = docSettingsFallback ? (docSettingsFallback.formatNomorSurat || '027/{nomor}/BPBJ/2026') : '027/{nomor}/BPBJ/2026';
 // Replace variables
 const replacements = {
 '{{nama_satker}}': currentUser?.department || 'Bagian Pengadaan Barang dan Jasa (BPBJ)',
 '{{nama_satker_kapital}}': (currentUser?.department || 'Bagian Pengadaan Barang dan Jasa (BPBJ)').toUpperCase(),
 '{{alamat_satker}}': docSettingsFallback ? docSettingsFallback.alamatLengkap : 'Jl. Raya Besuk Nomor 37 Besuk Probolinggo - 67283',
 '{{nama_pekerjaan}}': selectedPack.packName || '',
 '{{nilai_pagu}}': `Rp ${(selectedPack.pagu || 0).toLocaleString()} (${terbilang(selectedPack.pagu || 0)} Rupiah)`,
 '{{sumber_dana}}': `${selectedPack.sumberDana || 'APBD'} Tahun Anggaran ${new Date().getFullYear()}`,
 '{{nama_ppk}}': currentUser?.name || '',
 '{{nip_ppk}}': currentUser?.nip || '',
 '{{nomor_surat}}': nomorBase.replace('{nomor}', '045.2'),
 '{{nomor_nd}}': nomorBase.replace('{nomor}', '011/ND'),
 '{{nama_penyedia}}': '_______________________',
 '{{hari_tanggal_acara}}': '_______________________',
 '{{waktu_acara}}': '_______________________',
 '{{tempat_acara}}': '_______________________',
 '{{nama_pejabat_pengadaan}}': '_______________________',
 '{{nip_pejabat_pengadaan}}': '_______________________',
 '{{nomor_ba}}': nomorBase.replace('{nomor}', '108/BAKN'),
 '{{hari_ba}}': '_______________________',
 '{{tanggal_ba}}': '_______________________',
 '{{harga_penawaran}}': '_______________________',
 '{{harga_negosiasi}}': '_______________________',
 '{{nomor_bahp}}': nomorBase.replace('{nomor}', '112/BAHP'),
 '{{nilai_hps}}': '_______________________',
 '{{nama_penyedia_terpilih}}': '_______________________',
 '{{harga_final}}': '_______________________',
 '{{tempat_penetapan}}': 'Besuk',
 '{{nomor_sp}}': nomorBase.replace('{nomor}', '115/SP'),
 '{{alamat_penyedia}}': '_______________________',
 '{{nilai_kontrak}}': '_______________________',
 '{{waktu_penyelesaian}}': packageMetadata.waktu_penyelesaian || '14 (empat belas) hari kalender',
 '{{nomor_dpp}}': packageMetadata.nomor_dpp || '................................',
 '{{tanggal_dpp}}': new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
 '{{nomor_hps}}': nomorBase.replace('{nomor}', '014/HPS'),
 '{{tanggal_hps}}': new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
 '{{lokasi_pekerjaan}}': packageMetadata.lokasi_pekerjaan || (docSettingsFallback ? docSettingsFallback.namaInstansi : 'Komplek Perkantoran Pemerintah Daerah'),
 '{{program}}': packageMetadata.program || 'Program Penunjang Urusan Pemerintahan Daerah',
 '{{kegiatan}}': packageMetadata.kegiatan || 'Penyelenggaraan Pemerintahan dan Pelayanan Publik',
 '{{sub_kegiatan}}': packageMetadata.sub_kegiatan || 'Penyediaan Barang dan Jasa Perkantoran',
 '{{mak}}': selectedPack.mak || '',
 '{{pdn}}': 'Ya',
 '{{usaha_kecil}}': 'Ya',
 '{{pra_dipa}}': selectedPack.praDipa ? 'Ya' : 'Tidak',
 '{{volume_pekerjaan}}': selectedPack.volume || '1 Paket',
 '{{uraian_pekerjaan}}': `Pengadaan ${selectedPack.packName || ''} untuk operasional`,
 '{{kode_rup}}': selectedPack.noSirup || selectedPack.idPaket || '-'
 };

 Object.keys(replacements).forEach(key => {
 content = content.replace(new RegExp(key, 'g'), replacements[key]);
 });

 const parts = content.split('{{komponen_dinamis_dpp}}');

 return (
 <>
 <div style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', textAlign: 'justify', fontSize: '12pt', fontFamily: 'Arial, sans-serif' }} dangerouslySetInnerHTML={{ __html: parseSmartColons(parts[0]) }} />
 
 {/* The Dynamic Components Section */}
 <div className="py-4">

 <div className="pl-4 space-y-2 ">
 <div className="font-bold">a. Spesifikasi Jenis, Jumlah, dan Mutu Barang</div>
 <table className="w-full border-collapse border border-slate-900 mb-2">
 <thead>
 <tr className="bg-slate-100 font-bold text-center">
 <td className="border border-slate-900 p-1">No</td>
 <td className="border border-slate-900 p-1">Identitas/Jenis Barang</td>
 <td className="border border-slate-900 p-1">Spesifikasi Mutu</td>
 <td className="border border-slate-900 p-1">Kuantitas</td>
 <td className="border border-slate-900 p-1">Satuan</td>
 </tr>
 </thead>
 <tbody>
 {getPackageItems(selectedPack).filter(item => (item.qty === '' ? 0 : (item.qty || 0)) > 0).map((item, idx) => {
 return (
 <tr key={item.no}>
 <td className="border border-slate-900 p-1 text-center">{idx + 1}</td>
 <td className="border border-slate-900 p-1">{item.name}</td>
 <td className="border border-slate-900 p-1">{item.spesifikasi || 'Sesuai Kebutuhan DPA'}</td>
 <td className="border border-slate-900 p-1 text-center">{item.qty}</td>
 <td className="border border-slate-900 p-1 text-center">{item.unit}</td>
 </tr>
 );
 })}
 </tbody>
 </table>

 <div className="font-bold mt-2">b. Justifikasi Teknis Dalam Penggunaan Merek</div>
 <p className="text-justify">
 {dppSpecs.merek || (getPacketCategory(selectedPack?.packName || '') === 'Modal'
 ? 'Mengingat spesifikasi yang dibutuhkan berteknologi tinggi dan memerlukan jaminan purna jual, maka ditetapkan standar merek pabrikan yang memiliki Service Center resmi di sekitar lokasi dinas.'
 : getPacketCategory(selectedPack?.packName || '') === 'Konsolidasi'
 ? 'Pengadaan merujuk pada penetapan merek dan spesifikasi hasil konsolidasi terpusat Katalog Sektoral sesuai Keputusan UKPBJ.'
 : 'Tidak mensyaratkan merek tertentu dan mengutamakan persaingan sehat sesuai spesifikasi teknis yang dibutuhkan.')}
 </p>

 <div className="font-bold mt-2">c. Spesifikasi Waktu</div>
 <p className="text-justify">Waktu pelaksanaan pengadaan maksimal selama {dppSpecs.waktu || '14 (Empat Belas) hari kalender'} sejak penerbitan SP.</p>

 <div className="font-bold mt-2">d. Spesifikasi Tempat</div>
 <p className="text-justify">Alamat tujuan akhir: {dppSpecs.tempat || (currentUser?.department?.includes('Bago') ? 'Jl. Raya Bago No. 176, Besuk' : 'Komp. Perkantoran Pemerintah Kabupaten Probolinggo')}</p>

 <div className="font-bold mt-2">e. Spesifikasi Tingkat Layanan</div>
 <ul className="list-disc pl-4 space-y-1">
 {dppSpecs.layanan ? (
   dppSpecs.layanan.split('\n').map((line, i) => line.trim() ? <li key={i}>{line}</li> : null)
 ) : (getPacketCategory(selectedPack?.packName || '') === 'Mamin-Prasmanan' ? (
 <>
 <li>Menyediakan peralatan saji/prasmanan, personil pelayanan (pramusaji), dan menjaga kebersihan area.</li>
 <li>Makanan dalam kondisi higienis dan siap saji selambat-lambatnya 1 Jam sebelum jadwal pelaksanaan kegiatan.</li>
 </>
 ) : (
 <>
 <li>Produk/barang harus dalam kondisi baru dan baik.</li>
 <li>Barang diantarkan langsung ke alamat tujuan akhir.</li>
 </>
 ))}
 {(getPacketCategory(selectedPack?.packName || '') === 'Mamin-Bungkus' || getPacketCategory(selectedPack?.packName || '') === 'Mamin-Snack') && (
 <li>Kondisi makanan/minuman higienis, bersih, terbungkus rapi/kemasan tertutup, dan dikirimkan 1 Jam sebelum jadwal pelaksanaan kegiatan.</li>
 )}
 {getPacketCategory(selectedPack?.packName || '') === 'Modal' && <li>Dilengkapi jaminan garansi resmi distributor/pabrikan minimal 1 tahun.</li>}
 <li>Penyedia wajib mengganti barang yang rusak/tidak sesuai spesifikasi selambat-lambatnya 1x24 jam.</li>
 </ul>
 </div>

 <div className="font-bold uppercase mt-4">II. Prioritas Penggunaan Produk Dalam Negeri</div>
 <p className="text-justify">
 Berdasarkan Peraturan Presiden tentang Pengadaan Barang/Jasa Pemerintah, PPK memprioritaskan pemilihan produk dalam negeri pada Katalog Elektronik yang memiliki label Produk Dalam Negeri (PDN) atau memiliki sertifikat TKDN.
 </p>

 <div className="font-bold uppercase mt-4">III. Prioritas Penggunaan Produk dari Usaha Kecil</div>
 <p className="text-justify">
 Mengingat pagu paket pengadaan ini bernilai di bawah Rp15.000.000.000,00 maka pengadaan diprioritaskan kepada Penyedia dengan Kualifikasi Usaha Kecil atau Koperasi di wilayah lokal.
 </p>

 <div className="font-bold uppercase mt-4">IV. Pengumpulan Referensi Harga</div>
 <p className="text-justify">
 PPK telah mempersiapkan referensi harga sebagai dasar pelaksanaan negosiasi yang diambil dari Katalog Elektronik, Harga Pasar setempat, dan/atau Standar Harga Satuan.
 </p>

 <div className="pl-4 space-y-2 ">
 <div className="font-bold">a. Informasi Katalog Elektronik Inaproc</div>
 {getActiveSurveyData() ? (() => {
 const foundProducts = getActiveSurveyData().products.filter(p => p.success && p.vendor !== 'TIDAK DITEMUKAN');
 if (foundProducts.length === 0) {
 return <p className="italic text-slate-600 my-1 pb-1 ">* Seluruh item barang tidak ditemukan di e-Katalog LKPP. Referensi e-Katalog tidak terlampir.</p>
 }
 return (
 <table className="w-full border-collapse border border-slate-900 mb-2 ">
 <thead>
 <tr className="bg-slate-100 font-bold text-center">
 <td className="border border-slate-900 p-1 w-8">No</td>
 <td className="border border-slate-900 p-1">Nama Barang</td>
 <td className="border border-slate-900 p-1">Penyedia Katalog</td>
 <td className="border border-slate-900 p-1 text-right">Harga Katalog (Rp)</td>
 </tr>
 </thead>
 <tbody>
 {foundProducts.map((p, idx) => (
 <tr key={p.id}>
 <td className="border border-slate-900 p-1 text-center">{idx + 1}</td>
 <td className="border border-slate-900 p-1 text-blue-700 underline">
 <a href={p.link} target="_blank" rel="noopener noreferrer" className="hover:text-blue-900">{p.name}</a>
 </td>
 <td className="border border-slate-900 p-1">{p.vendor}</td>
 <td className="border border-slate-900 p-1 text-right">
   {(p.price || 0).toLocaleString('id-ID')}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 );
 })() : (
 <p className="italic text-slate-500">Silakan lakukan Survei Pasar Otomatis pada panel PPK untuk memunculkan data e-Katalog.</p>
 )}

 <div className="font-bold mt-2">b. Informasi Harga Pasar / Standar Harga Satuan (Estimasi)</div>
 {isHpsExemptSelected ? (
 <p className="text-justify mb-2 indent-8">
 Sesuai dengan ketentuan pada <strong>Pasal 26 Peraturan Presiden Nomor 16 Tahun 2018 tentang Pengadaan Barang/Jasa Pemerintah sebagaimana telah diubah dengan Peraturan Presiden Nomor 12 Tahun 2021</strong>, penyusunan Harga Perkiraan Sendiri (HPS) dikecualikan untuk pengadaan barang/jasa dengan nilai Pagu Anggaran paling banyak Rp10.000.000,00 (sepuluh juta rupiah), E-Purchasing, dan/atau Tender pekerjaan terintegrasi. Sehubungan dengan hal tersebut, pengadaan ini menggunakan harga pasar atau harga satuan acuan belanja sebagai dasar pelaksanaan proses pengadaan tanpa menetapkan dokumen HPS tersendiri. Adapun rincian estimasi harga acuan adalah sebagai berikut:
 </p>
 ) : (
 <p className="text-justify mb-2">Berdasarkan hasil kalkulasi Harga Perkiraan Sendiri (HPS) bernilai total <b>Rp&nbsp;{parseInt(hpsValue || 0).toLocaleString('id-ID')}</b>, dengan rincian per item sebagai berikut:</p>
 )}
 <table className="w-full border-collapse border border-slate-900 mb-2 ">
 <thead>
 <tr className="bg-slate-100 font-bold text-center">
 <td className="border border-slate-900 p-1 w-8">No</td>
 <td className="border border-slate-900 p-1">Uraian Barang</td>
 <td className="border border-slate-900 p-1 w-32 text-right">{isHpsExemptSelected ? 'Harga Satuan Acuan (Rp)' : 'Harga HPS/SHS (Rp)'}</td>
 </tr>
 </thead>
 <tbody>
 {getPackageItems(selectedPack).filter(item => (item.qty === '' ? 0 : (item.qty || 0)) > 0).map((item, idx) => {
 const unitHpsPrice = hpsPrices[item.name] !== undefined ? hpsPrices[item.name] : item.price;
 // ✅ FIX: Use updated name from surveyData if available (e.g. user changed keyword)
 const surveyProduct = surveyData?.products?.find(p => p.name === item.name);
 const displayName = surveyProduct?.name || item.name;
 return (
 <tr key={item.no}>
 <td className="border border-slate-900 p-1 text-center">{idx + 1}</td>
 <td className="border border-slate-900 p-1">{displayName}</td>
 <td className="border border-slate-900 p-1 text-right">
   {unitHpsPrice.toLocaleString('id-ID')}
 </td>
 </tr>
 )
 })}
 </tbody>
 </table>
 </div>

 {getActiveSurveyData() && (
 <div className="pl-4 space-y-2 mt-4 page-break-inside-avoid">
 <div className="font-bold">c. Justifikasi Pemilihan dan Produk Pembanding</div>
 {(() => {
 const products = getActiveSurveyData().products;
 const productsWithData = products.filter(p => 
 (justifications[p.id] && justifications[p.id].trim()) || 
 (comparisons[p.id] && comparisons[p.id].name)
 );

 if (productsWithData.length === 0) {
 return <p className="italic text-slate-600 my-1 pb-1 ">* Tidak ada justifikasi spesifik atau produk pembanding yang dicatat.</p>;
 }

 // Group by justification text
 const groups = {};
 productsWithData.forEach(p => {
 const justText = (justifications[p.id] || '').trim();
 if (!groups[justText]) {
 groups[justText] = { items: [], comparisons: [] };
 }
 groups[justText].items.push(p.name);
 if (comparisons[p.id] && comparisons[p.id].name) {
 groups[justText].comparisons.push({ pName: p.name, mainPrice: p.price, comp: comparisons[p.id] });
 }
 });

 return (
 <div className="space-y-6 mt-2">
 {Object.keys(groups).map((justText, idx) => {
 const group = groups[justText];
 const isGlobal = group.items.length > 3 || group.items.length === products.length;
 
 return (
 <div key={`group-${idx}`} className="mb-4 p-4 border border-slate-300 rounded-lg bg-slate-50 shadow-sm page-break-inside-avoid">
 <div className="flex items-center gap-2 mb-3 border-b border-slate-200 pb-2">
 <span className="bg-indigo-600 text-white font-bold px-2 py-0.5 rounded uppercase tracking-wider">
 {isGlobal ? 'Klausul Tingkat Paket' : 'Klausul Spesifik'}
 </span>
 <span className=" font-semibold text-slate-700">
 Berlaku untuk {group.items.length} item barang
 </span>
 </div>
 
 <div className="mb-3 text-slate-600 italic leading-relaxed">
 {group.items.join(', ')}
 </div>
 
 {(() => {
    const isMamin = getPacketCategory(selectedPack?.packName || '').startsWith('Mamin');
    return (
      <>
        <div className="mb-4">
          <div className="font-bold text-slate-800 mb-1">
            {isMamin ? 'Catatan Pertimbangan Pemilihan:' : 'Pertimbangan Pemilihan Penyedia:'}
          </div>
          <div className={`text-justify pl-3 border-l-4 ${justText ? 'border-indigo-400' : 'border-slate-400'} mt-2 text-[11pt] text-slate-700`}>
            {isMamin ? (
              <>
                <p className="mb-2">Mengingat karakteristik pengadaan Makan Minum (Mamin) yang bersifat habis pakai dan memiliki risiko penurunan kualitas (basi) jika menempuh waktu perjalanan yang lama, maka Pejabat Pembuat Komitmen (PPK) menetapkan Kriteria Pembanding Utama secara terbatas, yaitu:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>Kesesuaian Harga:</strong> Membandingkan nilai ekonomis porsi yang selaras dengan pagu anggaran.</li>
                  <li><strong>Kedekatan Jarak Geografis:</strong> Memilih penyedia dengan radius terdekat (satu kecamatan/wilayah kerja) untuk memastikan ketepatan waktu distribusi saat jam konsumsi acara dan menjamin makanan diterima dalam kondisi segar (higienis).</li>
                </ul>
              </>
            ) : justText ? (
              <>
                Berdasarkan hasil survei pasar e-Katalog, Pejabat Pembuat Komitmen (PPK) menetapkan pemilihan penyedia dengan pertimbangan spesifikasi kinerja, waktu, dan/atau layanan pendukung sebagai berikut:<br/>
                <div className="mt-2 font-medium italic text-slate-800">"{justText}"</div>
              </>
            ) : (
              <>
                Berdasarkan hasil perbandingan katalog elektronik pada tabel referensi, Pejabat Pembuat Komitmen (PPK) menetapkan pemilihan penyedia didasarkan pada prinsip <span className="italic">Best Value for Money</span>. Pemilihan tidak semata-mata mempertimbangkan harga termurah, melainkan mempertimbangkan keunggulan spesifikasi teknis, ketersediaan stok, kecepatan pengiriman, serta garansi/layanan purna jual yang lebih dapat diandalkan untuk menunjang urgensi operasional pemerintah daerah.
              </>
            )}
          </div>
        </div>

        {group.comparisons.length > 0 && (
          <div className="mt-4">
            <div className="font-bold text-slate-800 mb-2">Tabel Komparasi Produk:</div>
            {group.comparisons.map((c, i) => (
              <div key={i} className="mb-6">
                <table className="w-full border-collapse border border-slate-300 text-[10pt]">
                  <thead>
                    <tr className="bg-slate-200 text-slate-800">
                      <th className="border border-slate-300 p-1.5 text-left font-bold w-[25%]">Komponen Evaluasi</th>
                      <th className="border border-slate-300 p-1.5 text-left font-bold w-[25%]">{isMamin ? 'Penyedia A (Pilihan)' : 'Produk Utama (Pilihan)'}</th>
                      <th className="border border-slate-300 p-1.5 text-left font-bold w-[25%]">{isMamin ? 'Penyedia B (Pembanding 1)' : 'Produk Pembanding 1'}</th>
                      <th className="border border-slate-300 p-1.5 text-left font-bold w-[25%]">{isMamin ? 'Penyedia C (Pembanding 2)' : 'Produk Pembanding 2'}</th>
                    </tr>
                  </thead>
                  <tbody contentEditable="true" suppressContentEditableWarning={true}>
                    {isMamin ? (
                      <>
                        <tr>
                          <td className="border border-slate-300 p-1.5 font-bold bg-slate-50">Nama Paket Mamin</td>
                          <td className="border border-slate-300 p-1.5">{c.pName}</td>
                          <td className="border border-slate-300 p-1.5">{c.comp.name || '-'}</td>
                          <td className="border border-slate-300 p-1.5 text-slate-400 italic">-</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1.5 font-bold bg-slate-50">Harga per Porsi</td>
                          <td className="border border-slate-300 p-1.5 font-bold">Rp {(c.mainPrice || 0).toLocaleString('id-ID')}</td>
                          <td className="border border-slate-300 p-1.5 font-bold">Rp {parseInt(c.comp.price || 0).toLocaleString('id-ID')}</td>
                          <td className="border border-slate-300 p-1.5 text-slate-400 italic">-</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1.5 font-bold bg-slate-50">Lokasi Dapur/Toko</td>
                          <td className="border border-slate-300 p-1.5">Kecamatan ... (1 Wilayah)</td>
                          <td className="border border-slate-300 p-1.5">{c.comp.lokasi || 'Kecamatan ... (Beda Wilayah)'}</td>
                          <td className="border border-slate-300 p-1.5 text-slate-400 italic">-</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1.5 font-bold bg-slate-50">Jarak & Estimasi Waktu</td>
                          <td className="border border-slate-300 p-1.5">2 KM / 10 Menit</td>
                          <td className="border border-slate-300 p-1.5">{c.comp.jarak || '15 KM / 45 Menit'}</td>
                          <td className="border border-slate-300 p-1.5 text-slate-400 italic">-</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1.5 font-bold bg-slate-50">Status TKDN</td>
                          <td className="border border-slate-300 p-1.5">PDN (Skala UMK)</td>
                          <td className="border border-slate-300 p-1.5">{c.comp.tkdn || 'PDN (Skala UMK)'}</td>
                          <td className="border border-slate-300 p-1.5 text-slate-400 italic">-</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1.5 font-bold bg-slate-50">Rekomendasi Akhir</td>
                          <td className="border border-slate-300 p-1.5 font-bold text-emerald-700">DIPILIH</td>
                          <td className="border border-slate-300 p-1.5 font-bold text-rose-600">Tidak Dipilih</td>
                          <td className="border border-slate-300 p-1.5 text-slate-400 italic">-</td>
                        </tr>
                      </>
                    ) : (
                      <>
                        <tr>
                          <td className="border border-slate-300 p-1.5 font-bold bg-slate-50">Merek & Tipe</td>
                          <td className="border border-slate-300 p-1.5">{c.pName}</td>
                          <td className="border border-slate-300 p-1.5">{c.comp.name || '-'}</td>
                          <td className="border border-slate-300 p-1.5 text-slate-400 italic">-</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1.5 font-bold bg-slate-50">Link E-Katalog</td>
                          <td className="border border-slate-300 p-1.5 text-blue-600">Terlampir</td>
                          <td className="border border-slate-300 p-1.5 text-blue-600">Terlampir</td>
                          <td className="border border-slate-300 p-1.5 text-slate-400 italic">-</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1.5 font-bold bg-slate-50">Spesifikasi Fisik</td>
                          <td className="border border-slate-300 p-1.5">Sesuai KAK</td>
                          <td className="border border-slate-300 p-1.5">{c.comp.spesifikasi || 'Sesuai KAK'}</td>
                          <td className="border border-slate-300 p-1.5 text-slate-400 italic">-</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1.5 font-bold bg-slate-50">Nilai TKDN (%)</td>
                          <td className="border border-slate-300 p-1.5"></td>
                          <td className="border border-slate-300 p-1.5">{c.comp.tkdn || ''}</td>
                          <td className="border border-slate-300 p-1.5 text-slate-400 italic">-</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1.5 font-bold bg-slate-50">Harga (Inc. Ongkir & PPN)</td>
                          <td className="border border-slate-300 p-1.5 font-bold">Rp {(c.mainPrice || 0).toLocaleString('id-ID')}</td>
                          <td className="border border-slate-300 p-1.5 font-bold">Rp {parseInt(c.comp.price || 0).toLocaleString('id-ID')}</td>
                          <td className="border border-slate-300 p-1.5 text-slate-400 italic">-</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            ))}
            
            {isMamin && (
              <div className="mt-2 text-[10pt] text-justify mb-4" contentEditable="true" suppressContentEditableWarning={true}>
                <div className="font-bold underline mb-1">JUSTIFIKASI TEKNIS PEMILIHAN PRODUK MAMIN</div>
                <p className="mb-2">Berdasarkan hasil telaah produk sejenis pada Etalase Katalog Elektronik Lokal, harga satuan porsi antara penyedia adalah sama/sebanding. Namun, Pejabat Pembuat Komitmen (PPK) menetapkan untuk memilih penyedia terpilih dengan pertimbangan teknis utama sebagai berikut:</p>
                <ul className="list-decimal pl-5 space-y-1">
                  <li><strong>Faktor Kedekatan Jarak dan Ketepatan Waktu:</strong> Penyedia berdomisili di Kecamatan yang sama dengan lokasi pelaksanaan acara/kantor (jarak &plusmn; 2 KM). Hal ini memastikan makanan dapat dikirim tepat waktu sesuai jadwal konsumsi peserta tanpa risiko keterlambatan akibat kemacetan jalan lintas kecamatan.</li>
                  <li><strong>Kualitas dan Higienitas Makanan:</strong> Jarak pengiriman yang pendek (&le; 10 menit) meminimalisir risiko penurunan kualitas makanan (basi/rusak) selama perjalanan, sehingga makanan diterima dalam kondisi segar dan hangat.</li>
                  <li><strong>Pemberdayaan Ekonomi Lokal:</strong> Memprioritaskan pelaku usaha mikro/kecil yang berada di lingkungan terdekat tempat kegiatan sesuai asas efektivitas pengadaan.</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </>
    );
  })()}
 </div>
 );
 })}
 </div>
 );
 })()}
 </div>
 )}

 <div className="font-bold uppercase mt-4">V. Rancangan Kontrak (Surat Pesanan)</div>
 <p className="text-justify">Draft/Rancangan Kontrak menggunakan bentuk Surat Pesanan (SP) E-Purchasing yang berlaku standar pada sistem Inaproc LKPP.</p>

 <div className="font-bold uppercase mt-4">VI. Rencana Metode Pemilihan Penyedia</div>
 <p className="text-justify">
 {getPacketCategory(selectedPack?.packName || '') === 'Konsolidasi'
 ? 'Pengadaan dilakukan secara langsung (Direct Purchasing) kepada Penyedia Konsolidasi Sektoral yang telah ditetapkan UKPBJ.'
 : 'E-Purchasing dengan metode Negosiasi Harga terhadap harga dan/atau layanan pendukung sesuai ketentuan Katalog Elektronik.'}
 </p>

 <div className="font-bold uppercase mt-4">VII. Persyaratan Kualifikasi</div>
 <p className=" font-bold mt-1">Penyedia Badan Usaha / Perorangan:</p>
 <ul className="list-disc pl-8 space-y-1 ">
 <li>Memiliki identitas / NIB dan izin usaha sesuai KBLI yang relevan.</li>
 <li>Memiliki status valid wajib pajak / NPWP.</li>
 {getPacketCategory(selectedPack?.packName || '') === 'Modal' && <li>Memiliki Surat Dukungan Pabrikan atau Distributor Resmi.</li>}
 {getPacketCategory(selectedPack?.packName || '').startsWith('Mamin') && <li>Memiliki Sertifikat Laik Higiene Sanitasi (SLHS) dari Dinas Kesehatan setempat.</li>}
 <li>Memiliki alamat usaha yang jelas dan kapasitas manajerial yang memadai.</li>
 </ul>

 </div>
 {/* Render the second part of the template (footer/signature) */}
 {parts[1] && (
 <div className="mt-8 pt-6 signature-section" style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', textAlign: 'justify', fontFamily: 'Arial, sans-serif', pageBreakInside: 'avoid', breakInside: 'avoid' }} dangerouslySetInnerHTML={{ __html: parseSmartColons(parts[1]) }} />
 )}
 </>
 );
 }
 
 // Fallback if template fails or doesn't have the placeholder
 return (
 <div className="text-center font-bold text-rose-600 p-4 border border-rose-300 rounded bg-rose-50">
 Template DPP tidak valid. Pastikan template memiliki tag {"{{komponen_dinamis_dpp}}"}
 </div>
 );
 })()}

 <div className="pt-4 space-y-3">
 {/* Lampiran Screenshot Jika Ada */}
 {getActiveSurveyData() && (() => {
 const foundWithImages = getActiveSurveyData().products.filter(p => p.success && p.vendor !== 'TIDAK DITEMUKAN' && (p.searchImg || p.img));
 if (foundWithImages.length === 0) return null;
 return (
 <div className="mt-8 break-before-page" style={{ pageBreakBefore: 'always', breakBefore: 'page' }}>
 <div className="font-bold uppercase mb-6 text-center border-b-2 border-slate-900 pb-2">LAMPIRAN: BUKTI TANGKAPAN LAYAR (SCREENSHOT) REFERENSI E-KATALOG LOKAL/NASIONAL</div>
 <div className="flex flex-col gap-8">
 {foundWithImages.map((p, index) => {
 // Gunakan searchImg (ber-watermark) jika ada, jika tidak fallback ke img thumbnail biasa
 let imgSrc = p.searchImg || p.img;
 if (imgSrc && imgSrc.startsWith('/screenshots/')) {
 imgSrc = `http://localhost:3001${imgSrc}`;
 }
 return (
 <div key={p.id} className="border border-slate-400 p-4 bg-slate-50" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
 <div className="font-bold mb-2 ">Gambar {index + 1}: {p.name} - {p.vendor}</div>
 <img src={imgSrc} alt={p.name} className="w-full h-auto object-contain border-2 border-slate-300 shadow-sm mb-2" style={{ maxHeight: '800px' }} />
 <div className="font-mono text-blue-800 break-all underline mt-2">
 <a href={p.link} target="_blank" rel="noopener noreferrer" className="hover:text-blue-900">{p.link}</a>
 </div>
 <div className="font-bold mt-1 text-slate-800">Harga Tayang: Rp&nbsp;{(p.price || 0).toLocaleString('id-ID')}</div>
 </div>
 );
 })}
 </div>
 </div>
 );
 })()}
 </div>
 </div>
 )}

 {/* SIGNATURE SECTION (FOOTER) */}
 <div className="flex justify-between items-end mt-12 pt-6 border-t border-slate-200 signature-section" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
 <div className="flex-1">
 {/* Kosong untuk memberikan ruang tanda tangan di kanan */}
 </div>
 <div className="w-max min-w-[14rem] px-4 text-center space-y-2">
 <div >
 Besuk, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
 </div>
 <div className=" font-bold uppercase">
 Pejabat Pembuat Komitmen (PPK)
 </div>

 {/* Ruang kosong untuk tanda tangan basah */}
 <div className="h-24"></div>

 <div className=" font-bold uppercase underline">
 {currentUser?.name}
 </div>
 <div className=" font-mono -mt-1">
 NIP. {currentUser?.nip}
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>,
 document.body
 )}

    </>
  );
}
