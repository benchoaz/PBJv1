import React, { useState } from 'react';
import { usePPK } from './PPKContext';

export default function Step1PilihPaket() {
  const { 
    docSettings, setDocSettings,
    step, setStep,
    dpaName, setDpaName,
    satkerId, setSatkerId,
    scrapedData, setScrapedData,
    selectedPack, setSelectedPack,
    detailModalPack, setDetailModalPack,
    rincianModal, setRincianModal,
    hpsValue, setHpsValue,
    isHpsExemptSelected, setIsHpsExemptSelected,
    hpsPrices, setHpsPrices,
    techSpecs, setTechSpecs,
    packageMetadata, setPackageMetadata,
    selectedTplId, setSelectedTplId,
    selectedNdTplId, setSelectedNdTplId,
    matchedDpaTypes, setMatchedDpaTypes,
    dpaAccounts, setDpaAccounts,
    dpaRincian, setDpaRincian,
    sirupPackages, setSirupPackages,
    isUpdating, setIsUpdating,
    surveyLoading, setSurveyLoading,
    surveyData, setSurveyData,
    surveyLogs, setSurveyLogs,
    aiError, setAiError,
    activeDocPreview, setActiveDocPreview,
    resetAll, handleSimpanPaket, currentUser,
    namaAcara, setNamaAcara
  } = usePPK();

  const [sirupSearchQuery, setSirupSearchQuery] = useState('');
  const [isFetchingSirup, setIsFetchingSirup] = useState(false);

  const fetchSirupPackages = async (idSatker) => {
    setIsFetchingSirup(true);
    try {
      const res = await fetch(`/api/sirup/satker/${idSatker}`);
      const data = await res.json();
      if (data && Array.isArray(data.data)) {
        setSirupPackages(data.data);
      } else if (data && Array.isArray(data.packages)) {
        setSirupPackages(data.packages);
      } else if (data && Array.isArray(data)) {
        setSirupPackages(data);
      } else {
        alert('Format respon dari proxy SIRUP tidak sesuai.');
      }
    } catch (e) {
      alert('Gagal mengambil data SIRUP LKPP: ' + e.message);
    } finally {
      setIsFetchingSirup(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-8 mb-6 animate-slide-up shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center shrink-0">
            <span className="text-slate-700 text-xs font-bold">1</span>
          </div>
          <h2 className="text-base font-bold text-slate-900">Kunci Rencana Umum Pengadaan (SIRUP LKPP)</h2>
        </div>
        <span className="px-3 py-1 text-[10px] rounded-full bg-slate-100 border border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">Jangkar Anggaran</span>
      </div>

      <p className="text-sm text-slate-400 mb-6 leading-relaxed">
        Pilih paket pengadaan yang terdaftar di portal SIRUP LKPP untuk mengunci pagu anggaran. Jika data tidak muncul, gunakan form input manual di bawah.
      </p>

      {!selectedPack ? (
        <div className="space-y-6">
          {/* Filter Satker & Fetch Action */}
          <div className="flex flex-col sm:flex-row gap-4 items-end bg-slate-50/60 p-5 rounded-xl border border-slate-100">
            <div className="flex-1">
              <label className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1.5">Instansi Pengadaan Anda</label>
              <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="truncate pr-2 text-indigo-700 font-bold">{currentUser?.perangkatDaerah}</span>
                  <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded text-[10px] whitespace-nowrap shadow-sm border border-indigo-200">ID Satker: {satkerId}</span>
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  {currentUser?.department}
                </div>
              </div>
            </div>

            <div className="flex-1">
              <label className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1.5">Cari Paket / No. RUP</label>
              <input
                type="text"
                value={sirupSearchQuery}
                onChange={(e) => setSirupSearchQuery(e.target.value)}
                placeholder="Ketik untuk memfilter..."
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 focus:border-slate-400 outline-none"
              />
            </div>

            <button
              onClick={() => fetchSirupPackages(satkerId)}
              className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 active:scale-95"
            >
              {isFetchingSirup ? '⚙️ Menarik Data...' : '↻ Tarik Ulang LKPP'}
            </button>
          </div>

          {/* List of Live LKPP Packages */}
          <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Paket RUP LKPP 2026 — {sirupPackages.filter(p => (p.packName || '').toLowerCase().includes(sirupSearchQuery.toLowerCase()) || (p.noSirup || '').includes(sirupSearchQuery)).length} paket
              </span>
              <span className="px-2 py-0.5 text-[9px] rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">● Live</span>
            </div>

            {isFetchingSirup ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <div className="animate-spin text-2xl inline-block">⚙️</div>
                <p className="text-xs font-semibold">Menghubungkan ke API SIRUP LKPP dan mengambil paket terbaru...</p>
              </div>
            ) : sirupPackages.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <span className="text-2xl block mb-2">📡</span>
                <p className="text-xs">Tidak ada data paket LKPP yang berhasil ditarik. Silakan klik tombol "Tarik Ulang LKPP" atau isi manual di bawah.</p>
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100">
                {sirupPackages
                  .filter(p => (p.packName || '').toLowerCase().includes(sirupSearchQuery.toLowerCase()) || (p.noSirup || '').includes(sirupSearchQuery))
                  .map((p) => (
                    <div key={p.noSirup} className="px-5 py-4 hover:bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-colors">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded">
                            #{p.noSirup}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {p.method}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800 leading-snug">{p?.packName}</p>
                        <div className="text-[10px] text-slate-400">
                          {p.sumberDana} · {p.jadwalPemilihan}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                        <span className="text-sm font-bold text-slate-900 font-mono">
                          Rp&nbsp;{p.pagu?.toLocaleString()}
                        </span>
                        <button
                          onClick={() => {
                            const selected = {
                              ...p,
                              klpd: 'Kab. Probolinggo',
                              satker: satkerId === '67081' ? 'Kecamatan Besuk' : 'Satker Kecamatan',
                              volume: '1 Paket',
                              uraian: p.packName,
                              spesifikasi: 'Spesifikasi sesuai rincian DPA',
                              pdn: 'Ya',
                              usahaKecil: 'Ya',
                              jenisPengadaan: 'Barang',
                              mak: '7.01.01.2.06.0002'
                            }
                            setSelectedPack(selected)
                            setHpsValue(p.pagu.toString())
                            setTechSpecs(`Volume: 1 Paket\nSpesifikasi: Sesuai Rincian DPA\nNo RUP: ${p.noSirup}`)
                            setStep(2)
                            alert(`✅ Paket RUP #${p.noSirup} berhasil dikunci!\nSilakan lanjutkan Langkah 2 dengan mengunggah berkas rincian DPA.`);
                          }}
                          className="bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-semibold px-3.5 py-1.5 rounded-lg transition-all active:scale-[0.97]"
                        >
                          Kunci Paket
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Fallback Input Manual (collapsible styled border) */}
          <div className="border border-dashed border-slate-300 rounded-2xl p-5 bg-slate-50/30">
            <h4 className="text-xs font-bold text-slate-600 uppercase mb-3 flex items-center gap-1">
              <span>✍️</span> Opsi Alternatif: Input RUP Manual
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1">Nomor RUP SIRUP</label>
                <input
                  type="text"
                  id="manual_no_rup"
                  placeholder="Contoh: 65307012"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1">Nama Paket Pengadaan</label>
                <input
                  type="text"
                  id="manual_nama_paket"
                  placeholder="Nama paket belanja..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-[10px] text-slate-500 font-bold mb-1">Pagu Anggaran (Rp)</label>
                  <input
                    type="number"
                    id="manual_pagu"
                    placeholder="Pagu RUP..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-extrabold text-emerald-700"
                  />
                </div>
                <button
                  onClick={() => {
                    const noRup = document.getElementById('manual_no_rup')?.value
                    const namaPaket = document.getElementById('manual_nama_paket')?.value
                    const paguRup = parseInt(document.getElementById('manual_pagu')?.value) || 0

                    if (!noRup || !namaPaket || paguRup <= 0) {
                      alert('Mohon isi Nomor RUP, Nama Paket, dan Pagu dengan benar.')
                      return
                    }

                    const manualPack = {
                      noSirup: noRup,
                      packName: namaPaket,
                      pagu: paguRup,
                      method: 'Pengadaan Langsung',
                      sumberDana: 'APBD',
                      tahun: '2026',
                      klpd: 'Kab. Probolinggo',
                      satker: currentUser?.department || 'Kecamatan Besuk',
                      volume: '1 Paket',
                      uraian: namaPaket,
                      spesifikasi: 'Spesifikasi sesuai rincian DPA',
                      pdn: 'Ya',
                      usahaKecil: 'Ya',
                      jenisPengadaan: 'Barang',
                      mak: '7.01.01.2.06.0002'
                    }

                    setSelectedPack(manualPack)
                    setHpsValue(paguRup.toString())
                    setTechSpecs(`Volume: 1 Paket\nSpesifikasi: Sesuai Rincian DPA\nNo RUP: ${noRup}`)
                    setStep(2)
                    alert(`✅ Sukses mengunci Paket SIRUP RUP #${noRup} secara manual!`);
                  }}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm uppercase shrink-0"
                >
                  Kunci Manual
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Paket Terkunci
              </span>
              <span className="font-mono text-[10px] bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded">#{selectedPack.noSirup}</span>
            </div>
            <h4 className="text-sm font-semibold text-slate-900 leading-relaxed">{selectedPack?.packName}</h4>
            <div className="text-xs text-slate-400">
              Pagu: <span className="font-bold text-slate-700">Rp&nbsp;{selectedPack.pagu?.toLocaleString()}</span> · {selectedPack.satker}
            </div>
          </div>
          <button
            onClick={() => {
              if (confirm('Ubah paket SIRUP? Data DPA yang terhubung akan disesuaikan.')) {
                setSelectedPack(null)
                setIsHpsExemptSelected(false)
                localStorage.removeItem('pbj_hps_exempt_selected')
                setNamaAcara('')
                setStep(1)
              }
            }}
            className="text-xs text-slate-400 hover:text-rose-600 font-semibold transition-colors shrink-0"
          >
            Ganti Paket
          </button>
        </div>

        {/* ── NAMA ACARA/KEGIATAN ─────────────────────── */}
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-amber-800 mb-0.5">
                Nama Acara / Kegiatan <span className="text-rose-500">*</span>
              </label>
              <p className="text-[10px] text-amber-600 mb-3 leading-relaxed">
                Identitas unik DPP ini. Gunakan nama acara spesifik agar setiap pesanan mudah dibedakan meskipun menggunakan No. SIRUP yang sama.
              </p>
              <input
                type="text"
                value={namaAcara}
                onChange={e => setNamaAcara(e.target.value)}
                placeholder={`Contoh: Rapat Koordinasi Bulanan - ${new Date().toLocaleDateString('id-ID', {month:'long', year:'numeric'})}`}
                className={`w-full border rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 transition-all ${
                  namaAcara.trim().length >= 10
                    ? 'border-emerald-300 bg-emerald-50/50 text-emerald-800 focus:ring-emerald-300'
                    : 'border-amber-300 bg-white text-slate-800 focus:ring-amber-300'
                }`}
              />
              <div className="flex items-center justify-between mt-2">
                <span className={`text-[10px] font-semibold ${
                  namaAcara.trim().length >= 10 ? 'text-emerald-600' : 'text-amber-500'
                }`}>
                  {namaAcara.trim().length < 10
                    ? `⚠ Minimal 10 karakter (${namaAcara.trim().length}/10)`
                    : `✓ Nama acara sudah diisi (${namaAcara.trim().length} karakter)`}
                </span>
                <div className="flex gap-2">
                  {[
                    `Rapat Evaluasi - ${new Date().toLocaleDateString('id-ID',{month:'short',year:'numeric'})}`,
                    `Bimtek Pengadaan - ${new Date().toLocaleDateString('id-ID',{month:'short',year:'numeric'})}`,
                    `Rapat Koordinasi - ${new Date().toLocaleDateString('id-ID',{month:'short',year:'numeric'})}`
                  ].map(saran => (
                    <button
                      key={saran}
                      onClick={() => setNamaAcara(saran)}
                      className="text-[9px] px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-full font-semibold transition-colors border border-amber-200"
                    >
                      {saran.split(' - ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
      )}
    
{/* RUP LKPP Detail Sheet Modal */}
 {detailModalPack && (
 <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)' }} className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md p-4 overflow-y-auto animate-fade-in">
 <div className="bg-white rounded-2xl w-full max-w-7xl shadow-2xl border border-slate-100 overflow-hidden animate-zoom-in my-8">
 {/* Header */}
 <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
 <div>
 <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
 <span>🏛️</span> Detail Rencana Umum Pengadaan (RUP) Penyedia - SIRUP LKPP
 </h3>
 <p className=" text-slate-500 font-mono mt-0.5">
 https://sirup.inaproc.id/sirup/ro/penyedia/detailPaketPenyedia2020?idPaket={detailModalPack.noSirup}
 </p>
 </div>
 <button
 onClick={() => setDetailModalPack(null)}
 className="text-slate-400 hover:text-slate-600 text-2xl font-semibold transition-colors"
 >
 &times;
 </button>
 </div>

 {/* Sheet Body */}
 <div className="p-6 overflow-y-auto max-h-[70vh]">
 <div className="border border-slate-200 rounded-lg overflow-hidden text-xs text-slate-700">

 {/* Row 1 */}
 <div className="grid grid-cols-3 border-b border-slate-200">
 <div className="bg-slate-50 px-4 py-2.5 font-semibold border-r border-slate-200">Kode RUP</div>
 <div className="col-span-2 px-4 py-2.5 font-mono font-bold text-indigo-600 text-sm">{detailModalPack.noSirup}</div>
 </div>

 {/* Row 2 */}
 <div className="grid grid-cols-3 border-b border-slate-200">
 <div className="bg-slate-50 px-4 py-2.5 font-semibold border-r border-slate-200">Nama Paket</div>
 <div className="col-span-2 px-4 py-2.5 font-bold leading-relaxed text-slate-800">{detailModalPack?.packName}</div>
 </div>

 {/* Row 3 */}
 <div className="grid grid-cols-3 border-b border-slate-200">
 <div className="bg-slate-50 px-4 py-2.5 font-semibold border-r border-slate-200">Nama KLPD</div>
 <div className="col-span-2 px-4 py-2.5">{detailModalPack.klpd || 'Kab. Probolinggo'}</div>
 </div>

 {/* Row 4 */}
 <div className="grid grid-cols-3 border-b border-slate-200">
 <div className="bg-slate-50 px-4 py-2.5 font-semibold border-r border-slate-200">Satuan Kerja</div>
 <div className="col-span-2 px-4 py-2.5">{detailModalPack.satker || 'Kecamatan Besuk'}</div>
 </div>

 {/* Row 5 */}
 <div className="grid grid-cols-3 border-b border-slate-200">
 <div className="bg-slate-50 px-4 py-2.5 font-semibold border-r border-slate-200">Tahun Anggaran</div>
 <div className="col-span-2 px-4 py-2.5">{detailModalPack.tahun || '2026'}</div>
 </div>

 {/* Row 6: Lokasi Pekerjaan */}
 <div className="grid grid-cols-3 border-b border-slate-200">
 <div className="bg-slate-50 px-4 py-2.5 font-semibold border-r border-slate-200 flex items-center">Lokasi Pekerjaan</div>
 <div className="col-span-2 p-2">
 <table className="w-full border border-slate-200 rounded bg-white">
 <thead className="bg-slate-50 uppercase font-bold text-slate-500">
 <tr>
 <th className="border-b border-r border-slate-200 px-2 py-1 text-left">No.</th>
 <th className="border-b border-r border-slate-200 px-2 py-1 text-left">Provinsi</th>
 <th className="border-b border-r border-slate-200 px-2 py-1 text-left">Kabupaten/Kota</th>
 <th className="border-b border-slate-200 px-2 py-1 text-left">Detail Lokasi</th>
 </tr>
 </thead>
 <tbody>
 <tr>
 <td className="border-r border-slate-200 px-2 py-1">1.</td>
 <td className="border-r border-slate-200 px-2 py-1">Jawa Timur</td>
 <td className="border-r border-slate-200 px-2 py-1">Probolinggo (Kab.)</td>
 <td className="px-2 py-1">{detailModalPack.satker || 'Kecamatan Besuk'}</td>
 </tr>
 </tbody>
 </table>
 </div>
 </div>

 {/* Row 7 */}
 <div className="grid grid-cols-3 border-b border-slate-200">
 <div className="bg-slate-50 px-4 py-2.5 font-semibold border-r border-slate-200">Volume Pekerjaan</div>
 <div className="col-span-2 px-4 py-2.5">{detailModalPack.volume || '1 Paket'}</div>
 </div>

 {/* Row 8 */}
 <div className="grid grid-cols-3 border-b border-slate-200">
 <div className="bg-slate-50 px-4 py-2.5 font-semibold border-r border-slate-200">Uraian Pekerjaan</div>
 <div className="col-span-2 px-4 py-2.5 font-medium">{detailModalPack.uraian}</div>
 </div>

 {/* Row 9 */}
 <div className="grid grid-cols-3 border-b border-slate-200">
 <div className="bg-slate-50 px-4 py-2.5 font-semibold border-r border-slate-200">Spesifikasi Pekerjaan</div>
 <div className="col-span-2 px-4 py-2.5 font-mono ">{detailModalPack.spesifikasi}</div>
 </div>

 {/* Row 10 */}
 <div className="grid grid-cols-3 border-b border-slate-200">
 <div className="bg-slate-50 px-4 py-2.5 font-semibold border-r border-slate-200">Produk Dalam Negeri</div>
 <div className="col-span-2 px-4 py-2.5">{detailModalPack.pdn || 'Ya'}</div>
 </div>

 {/* Row 11 */}
 <div className="grid grid-cols-3 border-b border-slate-200">
 <div className="bg-slate-50 px-4 py-2.5 font-semibold border-r border-slate-200">Usaha Kecil</div>
 <div className="col-span-2 px-4 py-2.5">{detailModalPack.usahaKecil || 'Ya'}</div>
 </div>

 {/* Row 12 */}
 <div className="grid grid-cols-3 border-b border-slate-200">
 <div className="bg-slate-50 px-4 py-2.5 font-semibold border-r border-slate-200">Sustainable Public Procurement (SPP)</div>
 <div className="col-span-2 px-4 py-2.5">{detailModalPack.spp || 'Aspek Ekonomi (Ya), Aspek Sosial (Ya), Aspek Lingkungan (Ya)'}</div>
 </div>

 {/* Row 13 */}
 <div className="grid grid-cols-3 border-b border-slate-200">
 <div className="bg-slate-50 px-4 py-2.5 font-semibold border-r border-slate-200">Pra DIPA / DPA</div>
 <div className="col-span-2 px-4 py-2.5">{detailModalPack.praDipa || 'Tidak'}</div>
 </div>

 {/* Row 14: Sumber Dana */}
 <div className="grid grid-cols-3 border-b border-slate-200">
 <div className="bg-slate-50 px-4 py-2.5 font-semibold border-r border-slate-200 flex items-center">Sumber Dana</div>
 <div className="col-span-2 p-2">
 <table className="w-full border border-slate-200 rounded bg-white">
 <thead className="bg-slate-50 uppercase font-bold text-slate-500">
 <tr>
 <th className="border-b border-r border-slate-200 px-2 py-1 text-left">No.</th>
 <th className="border-b border-r border-slate-200 px-2 py-1 text-left">Sumber Dana</th>
 <th className="border-b border-r border-slate-200 px-2 py-1 text-left">T.A.</th>
 <th className="border-b border-r border-slate-200 px-2 py-1 text-left">KLPD</th>
 <th className="border-b border-r border-slate-200 px-2 py-1 text-left">MAK</th>
 <th className="border-b border-slate-200 px-2 py-1 text-left">Pagu</th>
 </tr>
 </thead>
 <tbody>
 <tr>
 <td className="border-r border-slate-200 px-2 py-1">1.</td>
 <td className="border-r border-slate-200 px-2 py-1">{detailModalPack.sumberDana || 'APBD'}</td>
 <td className="border-r border-slate-200 px-2 py-1">{detailModalPack.tahun || '2026'}</td>
 <td className="border-r border-slate-200 px-2 py-1">{detailModalPack.klpd || 'Kab. Probolinggo'}</td>
 <td className="border-r border-slate-200 px-2 py-1 font-mono text-slate-800 font-medium">{detailModalPack.mak}</td>
 <td className="px-2 py-1 font-bold text-emerald-600">Rp&nbsp;{detailModalPack.pagu?.toLocaleString()}</td>
 </tr>
 </tbody>
 </table>
 </div>
 </div>

 {/* Row 15 */}
 <div className="grid grid-cols-3 border-b border-slate-200">
 <div className="bg-slate-50 px-4 py-2.5 font-semibold border-r border-slate-200">Jenis Pengadaan</div>
 <div className="col-span-2 px-4 py-2.5">{detailModalPack.jenisPengadaan || 'Barang'}</div>
 </div>

 {/* Row 16 */}
 <div className="grid grid-cols-3 border-b border-slate-200">
 <div className="bg-slate-50 px-4 py-2.5 font-semibold border-r border-slate-200">Metode Pemilihan</div>
 <div className="col-span-2 px-4 py-2.5 font-bold text-indigo-700">{detailModalPack.method}</div>
 </div>

 {/* Row 17: Jadwal Pemanfaatan */}
 <div className="grid grid-cols-3 border-b border-slate-200">
 <div className="bg-slate-50 px-4 py-2.5 font-semibold border-r border-slate-200">Pemanfaatan Barang/Jasa</div>
 <div className="col-span-2 px-4 py-2.5">
 <span className="font-semibold text-slate-500">Mulai:</span> {detailModalPack.pemanfaatan?.split(' - ')[0] || 'Januari 2026'} &nbsp;&nbsp;|&nbsp;&nbsp; <span className="font-semibold text-slate-500">Akhir:</span> {detailModalPack.pemanfaatan?.split(' - ')[1] || 'Desember 2026'}
 </div>
 </div>

 {/* Row 18: Jadwal Kontrak */}
 <div className="grid grid-cols-3 border-b border-slate-200">
 <div className="bg-slate-50 px-4 py-2.5 font-semibold border-r border-slate-200">Jadwal Pelaksanaan Kontrak</div>
 <div className="col-span-2 px-4 py-2.5">
 <span className="font-semibold text-slate-500">Mulai:</span> {detailModalPack.jadwalKontrak?.split(' - ')[0] || 'Januari 2026'} &nbsp;&nbsp;|&nbsp;&nbsp; <span className="font-semibold text-slate-500">Akhir:</span> {detailModalPack.jadwalKontrak?.split(' - ')[1] || 'Desember 2026'}
 </div>
 </div>

 {/* Row 19: Jadwal Pemilihan */}
 <div className="grid grid-cols-3 border-b border-slate-200">
 <div className="bg-slate-50 px-4 py-2.5 font-semibold border-r border-slate-200">Jadwal Pemilihan Penyedia</div>
 <div className="col-span-2 px-4 py-2.5">
 <span className="font-semibold text-slate-500">Mulai:</span> {detailModalPack.jadwalPemilihan?.split(' - ')[0] || 'Januari 2026'} &nbsp;&nbsp;|&nbsp;&nbsp; <span className="font-semibold text-slate-500">Akhir:</span> {detailModalPack.jadwalPemilihan?.split(' - ')[1] || 'Januari 2026'}
 </div>
 </div>

 {/* Row 20 */}
 <div className="grid grid-cols-3">
 <div className="bg-slate-50 px-4 py-2.5 font-semibold border-r border-slate-200">Tanggal Umumkan Paket</div>
 <div className="col-span-2 px-4 py-2.5 font-semibold text-slate-600">{detailModalPack.tglDiumumkan || '2 Januari 2026'}</div>
 </div>

 </div>
 </div>

 {/* Footer */}
 <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
 <button
 onClick={() => setDetailModalPack(null)}
 className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition-colors"
 >
 Tutup Detail
 </button>
 <button
 onClick={() => {
 selectPackage(detailModalPack)
 setDetailModalPack(null)
 }}
 className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg transition-colors"
 >
 Pilih Paket & Sinkronkan
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
  );
}
