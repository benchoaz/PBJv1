import React, { useState, useEffect, useRef } from 'react';
import { usePPK } from './PPKContext';
import { Loader2, RefreshCw, Radio, FileText, AlertTriangle, CheckCircle2, Building2, ClipboardList, Search, Database } from 'lucide-react';


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
  const [isSearchingByRup, setIsSearchingByRup] = useState(false);
  const [sirupFromDB, setSirupFromDB] = useState(false); // apakah data dari DB lokal
  const searchTimeoutRef = useRef(null);

  // ── Load SIRUP dari DB lokal saat mount ───────────────────────────────────
  useEffect(() => {
    if (!satkerId) return;
    const loadFromDB = async () => {
      try {
        const res = await fetch(`/api/sirup/saved?satker_id=${satkerId}&tahun=${new Date().getFullYear()}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.packages?.length > 0) {
          const mapped = data.packages.map(pkg => ({
            noSirup: pkg.no_sirup,
            packName: pkg.nama_paket,
            pagu: pkg.pagu_sirup,
            method: pkg.metode_pemilihan,
            sumberDana: pkg.sumber_dana,
            mak: pkg.mak,
            tahun: String(pkg.tahun_anggaran),
            _from_db: true,
          }));
          setSirupPackages(mapped);
          setSirupFromDB(true);
        }
      } catch (e) {
        console.error('Error loading SIRUP from DB:', e);
      }
    };
    // Selalu muat dari DB saat mount agar data terbaru ditampilkan
    loadFromDB();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [satkerId]);

  // ── Pencarian by No. RUP (hanya filter lokal) ────────────────────────────
  const handleSearchChange = (val) => {
    setSirupSearchQuery(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    // Auto-search lokal sudah berjalan via filter di bagian render.
    // Jika tidak ada di lokal, user harus menekan tombol "Tarik Ulang LKPP".
    // Kita matikan auto-fetch ke server agar tidak membebani Puppeteer/LKPP.
  };

  const fetchSirupPackages = async (idSatker) => {
    setIsFetchingSirup(true);
    setSirupFromDB(false);
    try {
      const res = await fetch(`/api/sirup/satker/${idSatker}?tahun=${new Date().getFullYear()}`);
      const data = await res.json();
      const pkgs = data.packages || data.data || (Array.isArray(data) ? data : null);
      if (pkgs) {
        setSirupPackages(pkgs);
        // Auto-save ke DB
        if (pkgs.length > 0) {
          fetch('/api/sirup/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              satker_id: idSatker,
              tahun_anggaran: new Date().getFullYear(),
              packages: pkgs.map(p => ({
                noSirup: p.noSirup, packName: p.packName, pagu: p.pagu,
                method: p.method, sumberDana: p.sumberDana, mak: p.mak || ''
              }))
            })
          }).catch(() => {});
        }
      } else {
        alert('Format respon dari proxy SIRUP tidak sesuai.');
      }
    } catch (e) {
      alert('Gagal mengambil data SIRUP LKPP: ' + e.message);
    } finally {
      setIsFetchingSirup(false);
    }
  };
  const handleResolveRup = async () => {
    const query = sirupSearchQuery.trim();
    if (!/^\d{7,10}$/.test(query)) {
      alert("Masukkan nomor RUP yang valid (7-10 digit angka).");
      return;
    }
    
    setIsSearchingByRup(true);
    try {
      const res = await fetch(`/api/sirup/package/${query}`, {
        headers: {
          'X-User-Satker': satkerId || ''
        }
      });
      if (!res.ok) {
        throw new Error(await res.text() || "RUP tidak ditemukan di LKPP.");
      }
      const data = await res.json();
      if (data.success && data.package) {
        const newPkg = {
          noSirup: data.package.noSirup,
          packName: data.package.packName,
          pagu: data.package.pagu,
          method: data.package.method,
          sumberDana: data.package.sumberDana,
          mak: data.package.mak || '',
          tahun: data.package.tahun,
          _from_db: false,
        };
        
        // Tambahkan ke state lokal dulu (langsung tampil)
        setSirupPackages(prev => {
          if (prev.some(p => p.noSirup === newPkg.noSirup)) return prev;
          return [newPkg, ...prev];
        });
        
        // Kosongkan query agar daftar penuh tampil
        setSirupSearchQuery('');
        
        // Reload dari DB untuk sinkronisasi penuh
        try {
          const dbRes = await fetch(`/api/sirup/saved?satker_id=${satkerId}&tahun=${new Date().getFullYear()}`);
          if (dbRes.ok) {
            const dbData = await dbRes.json();
            if (dbData.success && dbData.packages?.length > 0) {
              const mapped = dbData.packages.map(pkg => ({
                noSirup: pkg.no_sirup,
                packName: pkg.nama_paket,
                pagu: pkg.pagu_sirup,
                method: pkg.metode_pemilihan,
                sumberDana: pkg.sumber_dana,
                mak: pkg.mak,
                tahun: String(pkg.tahun_anggaran),
                _from_db: true,
              }));
              setSirupPackages(mapped);
              setSirupFromDB(true);
            }
          }
        } catch (dbErr) {
          console.error('Error reloading from DB:', dbErr);
        }

        alert(`✅ Sukses menarik Paket RUP #${newPkg.noSirup} dari LKPP!\nPaket telah ditambahkan ke daftar di bawah.`);
      } else {
        alert("Gagal menarik data paket RUP dari LKPP.");
      }
    } catch (e) {
      alert("Gagal mencari RUP: " + e.message);
    } finally {
      setIsSearchingByRup(false);
    }
  };



  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-8 mb-6 animate-slide-up shadow-sm">
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
              <div className="relative">
                <input
                  type="text"
                  value={sirupSearchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Ketik nama paket atau No. RUP..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 outline-none pr-8"
                />
                {isSearchingByRup ? (
                  <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-400 animate-spin" />
                ) : (
                  <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                )}
              </div>
            </div>

            <button
              onClick={() => fetchSirupPackages(satkerId)}
              className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 active:scale-95 animate-fade-in"
            >
              {isFetchingSirup ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menarik Data...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Tarik Ulang LKPP</span>
                </>
              )}
            </button>

            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = async (event) => {
                    try {
                      const json = JSON.parse(event.target.result);
                      if (!json || (!json.aaData && !Array.isArray(json))) {
                        alert("Format file JSON tidak valid. Pastikan file yang Anda unggah benar.");
                        return;
                      }
                      
                      setIsFetchingSirup(true);
                      const uploadRes = await fetch(`/api/sirup/satker/${satkerId}?tahun=2026`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(json)
                      });
                      const uploadData = await uploadRes.json();
                      if (uploadData.success) {
                        alert(`✅ Sukses mengimpor paket SIRUP untuk Satker #${satkerId}!`);
                        fetchSirupPackages(satkerId);
                      } else {
                        alert("Gagal menyimpan data ke database: " + (uploadData.message || "Error"));
                      }
                    } catch (err) {
                      alert("Gagal membaca file JSON: " + err.message);
                    } finally {
                      setIsFetchingSirup(false);
                      e.target.value = '';
                    }
                  };
                  reader.readAsText(file);
                }}
                className="hidden"
                id="sirup-json-upload"
              />
              <button
                type="button"
                onClick={() => document.getElementById('sirup-json-upload').click()}
                className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 active:scale-95 animate-fade-in"
              >
                <span>Impor JSON SIRUP</span>
              </button>
            </div>
          </div>

          {/* SOP Panduan Impor JSON */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-2">
            <p className="font-bold text-slate-700">💡 Panduan Cepat Menarik Paket via Impor JSON (Jika Tarik Otomatis Gagal):</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>
                Buka link resmi LKPP ini di tab baru:{" "}
                <a 
                  href={`https://sirup.inaproc.id/sirup/datatablectr/dataruppenyediasatker?tahun=2026&idSatker=${satkerId}&sEcho=1&iColumns=7&iDisplayStart=0&iDisplayLength=2000`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-indigo-600 font-semibold underline hover:text-indigo-800"
                >
                  Unduh Data Paket Satker {satkerId} (Klik Kanan &gt; Buka di Tab Baru)
                </a>
              </li>
              <li>Setelah halaman terbuka dan menampilkan data teks (JSON), <strong>klik kanan</strong> di mana saja pada halaman tersebut dan pilih <strong>"Save As..." (Simpan Sebagai...)</strong>.</li>
              <li>Simpan file dengan nama apa saja (pastikan formatnya tetap <code>.json</code>).</li>
              <li>Kembali ke halaman ini, klik tombol <strong className="text-emerald-600">"Impor JSON SIRUP"</strong> di atas, lalu pilih file yang baru saja diunduh. Selesai!</li>
            </ol>
          </div>


          {/* List of Live LKPP Packages */}
          <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                {sirupFromDB && <Database className="w-3 h-3 text-slate-400" />}
                Paket RUP LKPP {new Date().getFullYear()} — {sirupPackages.filter(p =>
                  (p.packName || '').toLowerCase().includes(sirupSearchQuery.toLowerCase()) ||
                  String(p.noSirup || '').includes(sirupSearchQuery.trim())
                ).length} paket
                {sirupFromDB && <span className="text-slate-300 font-normal">(Dari cache server)</span>}
              </span>
              <span className="px-2 py-0.5 text-[9px] rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">● Live</span>
            </div>

            {isFetchingSirup ? (
              <div className="p-12 text-center text-slate-500 space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
                <p className="text-xs font-semibold">Menghubungkan ke API SIRUP LKPP dan mengambil paket terbaru...</p>
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100">
                {(() => {
                  const queryTrim = sirupSearchQuery.trim();
                  const filtered = sirupPackages.filter(p =>
                    (p.packName || '').toLowerCase().includes(queryTrim.toLowerCase()) ||
                    String(p.noSirup || '').includes(queryTrim)
                  );

                  if (filtered.length === 0 && /^\d{7,10}$/.test(queryTrim)) {
                    return (
                      <div className="px-5 py-8 text-center bg-indigo-50/20 flex flex-col items-center justify-center gap-3">
                        <AlertTriangle className="w-6 h-6 text-indigo-500 animate-bounce" />
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-slate-700">Paket RUP #{queryTrim} tidak ditemukan di database lokal</p>
                          <p className="text-[10px] text-slate-400">Anda dapat langsung mencarinya di portal server LKPP.</p>
                        </div>
                        <button
                          onClick={handleResolveRup}
                          disabled={isSearchingByRup}
                          className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 active:scale-95 shadow-sm border border-indigo-600"
                        >
                          {isSearchingByRup ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Mencari di LKPP...</span>
                            </>
                          ) : (
                            <>
                              <Search className="w-3.5 h-3.5" />
                              <span>Cari RUP #{queryTrim} di LKPP</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  }

                  if (sirupPackages.length === 0) {
                    return (
                      <div className="p-12 text-center text-slate-400 space-y-2">
                        <Radio className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="text-xs">Tidak ada data paket LKPP yang berhasil ditarik. Silakan klik tombol "Tarik Ulang LKPP" atau isi manual di bawah.</p>
                      </div>
                    );
                  }

                  if (filtered.length === 0) {
                    return (
                      <div className="p-8 text-center text-slate-400 text-xs">
                        Tidak ada paket yang cocok dengan pencarian Anda.
                      </div>
                    );
                  }

                  return filtered.map((p) => (
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
                              klpd: currentUser?.perangkatDaerah || '',
                              satker: currentUser?.department || '',
                              volume: '1 Paket',
                              uraian: p.packName,
                              spesifikasi: 'Spesifikasi sesuai rincian DPA',
                              pdn: 'Ya',
                              usahaKecil: 'Ya',
                              jenisPengadaan: 'Barang',
                              mak: p.mak || '7.01.01.2.06.0002'
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
                  ));
                })()}
              </div>
            )}
          </div>

          {/* Fallback Input Manual (collapsible styled border) */}
          <div className="border border-dashed border-slate-300 rounded-2xl p-5 bg-slate-50/30">
            <h4 className="text-xs font-bold text-slate-600 uppercase mb-3 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Opsi Alternatif: Input RUP Manual</span>
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
                      klpd: currentUser?.perangkatDaerah || '',
                      satker: currentUser?.department || '',
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
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-amber-600" />
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-2 gap-2">
                <span className="text-[10px] font-semibold">
                  {namaAcara.trim().length < 10 ? (
                    <span className="flex items-center gap-1 text-amber-600">
                      <AlertTriangle className="w-3.5 h-3.5" /> Minimal 10 karakter ({namaAcara.trim().length}/10)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-emerald-600">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Nama acara sudah diisi ({namaAcara.trim().length} karakter)
                    </span>
                  )}
                </span>
                <div className="flex flex-wrap gap-2">
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
 <Building2 className="w-5 h-5 text-slate-700" /> Detail Rencana Umum Pengadaan (RUP) Penyedia - SIRUP LKPP
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
 <div className="col-span-2 px-4 py-2.5">{detailModalPack.satker || currentUser?.department || 'Satuan Kerja'}</div>
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
 <td className="px-2 py-1">{detailModalPack.satker || currentUser?.department || 'Satuan Kerja'}</td>
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
