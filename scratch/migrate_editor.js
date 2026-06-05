const fs = require('fs');

const step3Path = '/home/beni/PBJ/frontend/src/components/ppk/Step3RincianHPS.jsx';
let step3Content = fs.readFileSync(step3Path, 'utf8');

if (!step3Content.includes('isAiEditorOpen')) {
  // Add state to Step3
  step3Content = step3Content.replace(
    /const \{[\s\S]*?\} = usePPK\(\);/,
    `$&
  const [isAiEditorOpen, setIsAiEditorOpen] = useState(true);
  const [aiLoadingField, setAiLoadingField] = useState(null);
  
  const handleAiAssist = (field) => {
    setAiLoadingField(field);
    setTimeout(() => {
      let enhancedText = '';
      if (field === 'justifikasiMerek') {
        enhancedText = \`Sesuai dengan spesifikasi teknis dan standar operasional yang dibutuhkan, pemilihan merek/produk tertentu dilakukan dengan justifikasi untuk menjaga kompatibilitas, efisiensi pemeliharaan, serta menjamin ketersediaan layanan purna jual di sekitar lokasi satuan kerja.\`;
      } else if (field === 'metodePemilihan') {
        enhancedText = \`Pemilihan penyedia dilakukan melalui metode E-Purchasing berdasarkan Peraturan Presiden tentang Pengadaan Barang/Jasa Pemerintah. Proses ini akan mengutamakan negosiasi harga dan persyaratan teknis untuk mendapatkan value for money terbaik dari penyedia Katalog Elektronik.\`;
      } else if (field === 'spesifikasiLayanan') {
        enhancedText = \`Penyedia wajib memberikan garansi resmi minimal 1 (satu) tahun. Pengiriman barang harus dilakukan ke lokasi tujuan akhir maksimal 14 hari kalender sejak pesanan dikonfirmasi. Apabila ditemukan cacat fisik atau ketidaksesuaian spesifikasi pada saat serah terima, penyedia wajib mengganti dengan barang baru maksimal 2x24 jam.\`;
      }
      setDppSpecs({
        ...dppSpecs,
        [field]: enhancedText
      });
      setAiLoadingField(null);
    }, 1500);
  };
  
  const handleApplyDefaults = () => {
    setDppSpecs({
      ...dppSpecs,
      justifikasiMerek: \`Sesuai dengan spesifikasi teknis dan standar operasional yang dibutuhkan, pemilihan merek/produk tertentu dilakukan dengan justifikasi untuk menjaga kompatibilitas, efisiensi pemeliharaan, serta menjamin ketersediaan layanan purna jual di sekitar lokasi satuan kerja.\`,
      metodePemilihan: \`Pemilihan penyedia dilakukan melalui metode E-Purchasing berdasarkan Peraturan Presiden tentang Pengadaan Barang/Jasa Pemerintah. Proses ini akan mengutamakan negosiasi harga dan persyaratan teknis untuk mendapatkan value for money terbaik dari penyedia Katalog Elektronik.\`,
      spesifikasiLayanan: \`Penyedia wajib memberikan garansi resmi minimal 1 (satu) tahun. Pengiriman barang harus dilakukan ke lokasi tujuan akhir maksimal 14 hari kalender sejak pesanan dikonfirmasi. Apabila ditemukan cacat fisik atau ketidaksesuaian spesifikasi pada saat serah terima, penyedia wajib mengganti dengan barang baru maksimal 2x24 jam.\`
    });
  };
`
  );

  // Insert form before the "Template DPP" badge in Step3
  const formHtml = `
                    {/* Badge Indikator Jenis DPP & Editor KAK */}
                    <div className="mb-6 p-4 border rounded-xl bg-blue-50 border-blue-200">
                      <div className="font-bold text-blue-900 text-sm mb-1 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📋</span> Pengaturan Klausul Dokumen
                        </div>
                      </div>
                      
                      {isAiEditorOpen && (
                        <div className="bg-white rounded-xl border border-blue-100 p-5 mt-4 shadow-sm animate-fade-in space-y-5">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-bold text-slate-800">Penyusunan Klausul & Spesifikasi Teknis</h4>
                            <button onClick={handleApplyDefaults} className="text-[10px] text-slate-500 hover:text-slate-700 underline font-medium">Reset ke Teks Standar</button>
                          </div>
                          
                          {/* Justifikasi Teknis Merek */}
                          <div>
                            <div className="flex justify-between items-end mb-1.5">
                              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Justifikasi Teknis Merek</label>
                              <button onClick={() => handleAiAssist('justifikasiMerek')} disabled={aiLoadingField === 'justifikasiMerek'} className="text-[10px] bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-2 py-1 rounded shadow-sm flex items-center gap-1 disabled:opacity-50">
                                ✨ {aiLoadingField === 'justifikasiMerek' ? 'Memproses...' : 'AI Assist'}
                              </button>
                            </div>
                            <textarea 
                              value={dppSpecs?.justifikasiMerek || ''} 
                              onChange={(e) => setDppSpecs({...dppSpecs, justifikasiMerek: e.target.value})}
                              placeholder="Jelaskan justifikasi jika memilih merek/produk spesifik tertentu..."
                              className="w-full text-xs p-3 border border-slate-200 rounded-lg min-h-[70px] focus:border-indigo-500 outline-none leading-relaxed"
                            />
                          </div>

                          {/* Metode Pemilihan Penyedia */}
                          <div>
                            <div className="flex justify-between items-end mb-1.5">
                              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Metode Pemilihan Penyedia</label>
                              <button onClick={() => handleAiAssist('metodePemilihan')} disabled={aiLoadingField === 'metodePemilihan'} className="text-[10px] bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-2 py-1 rounded shadow-sm flex items-center gap-1 disabled:opacity-50">
                                ✨ {aiLoadingField === 'metodePemilihan' ? 'Memproses...' : 'AI Assist'}
                              </button>
                            </div>
                            <textarea 
                              value={dppSpecs?.metodePemilihan || ''} 
                              onChange={(e) => setDppSpecs({...dppSpecs, metodePemilihan: e.target.value})}
                              placeholder="Sebutkan metode pemilihan penyedia (misal: E-Purchasing melalui Negosiasi Harga)..."
                              className="w-full text-xs p-3 border border-slate-200 rounded-lg min-h-[70px] focus:border-indigo-500 outline-none leading-relaxed"
                            />
                          </div>

                          {/* Spesifikasi Layanan/Kualitas */}
                          <div>
                            <div className="flex justify-between items-end mb-1.5">
                              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Spesifikasi Layanan & Kualitas (Klausul Tambahan)</label>
                              <button onClick={() => handleAiAssist('spesifikasiLayanan')} disabled={aiLoadingField === 'spesifikasiLayanan'} className="text-[10px] bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-2 py-1 rounded shadow-sm flex items-center gap-1 disabled:opacity-50">
                                ✨ {aiLoadingField === 'spesifikasiLayanan' ? 'Memproses...' : 'AI Assist'}
                              </button>
                            </div>
                            <textarea 
                              value={dppSpecs?.spesifikasiLayanan || ''} 
                              onChange={(e) => setDppSpecs({...dppSpecs, spesifikasiLayanan: e.target.value})}
                              placeholder="Sebutkan syarat garansi, perizinan (SLHS), aturan pengiriman, SLA, dll..."
                              className="w-full text-xs p-3 border border-slate-200 rounded-lg min-h-[70px] focus:border-indigo-500 outline-none leading-relaxed"
                            />
                          </div>
                        </div>
                      )}
                    </div>
  `;

  step3Content = step3Content.replace(
    /\{\/\* Badge Indikator Jenis DPP \*\/\}/,
    formHtml + '\n                  {/* Badge Indikator Jenis DPP */}'
  );
  fs.writeFileSync(step3Path, step3Content, 'utf8');
  console.log('Migrated to step3');
}

