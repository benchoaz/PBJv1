import React, { useState, useRef, useEffect } from 'react';
import { usePPK } from './PPKContext';
import { FileText, CheckCircle2, Edit3, Trash2, PlusCircle, AlertTriangle, XCircle, Loader2, RefreshCw, Zap, Sparkles, FolderOpen, Save, Check, Link } from 'lucide-react';
import SmartRAKGrid from './SmartRAKGrid';


// ─── Utility: fuzzy match rekening DPA ke paket SIRUP ────────────────────────
function findBestSirupMatch(acc, packages, selectedPack = null) {
  if (selectedPack) return { ...selectedPack, _score: 'Sesuai Pilihan Step 1' };
  if (!packages || packages.length === 0 || !acc) return null;
  const stopWords = new Set([
    'belanja','dan','untuk','kegiatan','bahan','alat','kantor','sub',
    'penyediaan','jasa','modal','giat','pada','atas','atau','serta',
    'dalam','dengan','yang','pengadaan'
  ]);
  const accWords = (acc.name || '').toLowerCase()
    .split(/[\s/.,()-]+/)
    .filter(w => w.length > 2 && !stopWords.has(w));

  let bestPack = null;
  let bestScore = -1;

  packages.forEach(pack => {
    let score = 0;
    const paguDiff = Math.abs((acc.pagu || 0) - (pack.pagu || 0));
    if (paguDiff === 0) score += 120;
    else if (paguDiff < 500) score += 100;
    else if (paguDiff < 2000) score += 80;
    else if (paguDiff < 10000) score += 50;
    else if (acc.pagu > 0 && paguDiff / acc.pagu < 0.03) score += 35;

    const packLow = (pack.packName || '').toLowerCase();
    const kwHits = accWords.filter(kw => packLow.includes(kw)).length;
    score += kwHits * 20;

    if (score > bestScore) { bestScore = score; bestPack = pack; }
  });

  return bestScore >= 40 ? { ...bestPack, _score: bestScore } : null;
}

const cleanUraian = (uraian) => {
  if (!uraian) return '';
  const junkRegex = /(Nama\s+[A-Z\s]+,\s*(SE|ST|MM|M\.Si|S\.Pd|M\.Pd|S\.E\.|S\.T\.|S\.Kom)|Tolak Ukur|Dana Yang|Jumlah Laporan|Kinerja|Indikator|Sumber Dana).*/i;
  let match = uraian.match(junkRegex);
  if (match) {
    const idx = uraian.search(junkRegex);
    return uraian.substring(0, idx).trim();
  }
  return uraian.trim();
};

export default function Step2UploadDPA() {
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
    resetAll, handleSimpanPaket, currentUser
  } = usePPK();

  // Local state not in context
  const [isFetchingSirup, setIsFetchingSirup] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(() =>
    localStorage.getItem('pbj_sirup_last_sync') || null
  );
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);
  const [parseLogs, setParseLogs] = useState([]);
  const [dpaOcrMode, setDpaOcrMode] = useState(false);
  const [sirupSearchQuery, setSirupSearchQuery] = useState('');
  const [isAnalyzingDpa, setIsAnalyzingDpa] = useState(false);
  const [isSavingDpa, setIsSavingDpa] = useState(false);
  const [dpaSavedOk, setDpaSavedOk] = useState(false);
  const fileInputRef = useRef(null);

  // ── FUNGSI SIMPAN DPA KE DB ──────────────────────────────────────────────
  const saveDpaAccountsToDB = async (accounts, fileName, currentRincian = null) => {
    if (!accounts || accounts.length === 0) return;
    const rincianData = currentRincian || dpaRincian;
    const satker = currentUser?.idSatker || satkerId;
    if (!satker) return;
    setIsSavingDpa(true);
    try {
      const res = await fetch('/api/dpa/accounts/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          satker_id: satker,
          tahun_anggaran: new Date().getFullYear(),
          file_name: fileName || 'DPA',
          accounts: accounts.map(acc => ({
            account: acc.account,
            name: acc.name,
            pagu: acc.pagu,
            confidence: acc.confidence,
            ocr_engine: acc.ocr_engine,
            pagu_method: acc.pagu_method,
            verified: acc.verified || false,
            is_valid: acc.is_valid,
            validation_reason: acc.validation_reason,
            raw_text_block: acc.raw_text_block,
            items: (rincianData[acc.account] || []).map((item, i) => ({
              no: i + 1,
              nama: item.nama,
              volume: item.volume,
              satuan: item.satuan,
              harga_satuan: item.harga_satuan,
              harga_total: item.harga_total,
            }))
          }))
        })
      });
      if (res.ok) setDpaSavedOk(true);
    } catch (err) {
      console.error('Error saving DPA to DB:', err);
    } finally {
      setIsSavingDpa(false);
    }
  };

  // ── FUNGSI LOAD DPA DARI DB ──────────────────────────────────────────────
  const loadDpaFromDB = async () => {
    const satker = currentUser?.idSatker || satkerId;
    if (!satker || dpaAccounts.length > 0) return; // Jangan load ulang kalau sudah ada
    try {
      const res = await fetch(`/api/dpa/accounts?satker_id=${satker}&tahun=${new Date().getFullYear()}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && data.accounts?.length > 0) {
        const mapped = data.accounts.map(acc => ({
          account: acc.kode_rekening,
          name: cleanUraian(acc.uraian_rekening),
          pagu: acc.pagu_dpa,
          confidence: acc.confidence,
          ocr_engine: acc.ocr_engine,
          pagu_method: acc.pagu_method,
          verified: acc.is_verified,
          is_valid: acc.is_valid,
          validation_reason: acc.validation_reason,
          _from_db: true,
        }));
        setDpaAccounts(mapped);
        setDpaSavedOk(true);
        // Load rincian items
        const newRincian = {};
        data.accounts.forEach(acc => {
          if (acc.items?.length > 0) {
            newRincian[acc.kode_rekening] = acc.items.map(it => ({
              no: it.no_urut,
              nama: it.nama_barang,
              volume: it.volume,
              satuan: it.satuan,
              harga_satuan: it.harga_satuan,
              harga_total: it.harga_total,
            }));
          }
        });
        if (Object.keys(newRincian).length > 0) setDpaRincian(prev => ({ ...newRincian, ...prev }));
      }
    } catch (err) {
      console.error('Error loading DPA from DB:', err);
    }
  };

  // ── FUNGSI LOAD SIRUP TERSIMPAN DARI DB ──────────────────────────────────
  const loadSirupFromDB = async (targetSatker) => {
    const satker = targetSatker || currentUser?.idSatker || satkerId;
    if (!satker) return;
    try {
      const res = await fetch(`/api/sirup/saved?satker_id=${satker}&tahun=${new Date().getFullYear()}`);
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
        // Merge: prioritize local if already loaded
        setSirupPackages(prev => {
          if (prev.length > 0) return prev;
          return mapped;
        });
        const nowIso = new Date().toISOString();
        setLastSyncTime(nowIso);
      }
    } catch (err) {
      console.error('Error loading saved SIRUP:', err);
    }
  };

  // Fetch SIRUP data
  const fetchSirupPackages = async (targetSatkerId) => {
    setIsFetchingSirup(true);
    try {
      const target = targetSatkerId || satkerId;
      const response = await fetch(`/api/sirup/satker/${target}?tahun=${new Date().getFullYear()}`);
      if (!response.ok) throw new Error(`Server returned error: ${response.status}`);
      const data = await response.json();
      const pkgs = data.packages || data.data || (Array.isArray(data) ? data : null);
      if (data.success !== false && pkgs) {
        setSirupPackages(pkgs);
        const nowIso = new Date().toISOString();
        setLastSyncTime(nowIso);
        localStorage.setItem('pbj_sirup_packages', JSON.stringify(pkgs));
        localStorage.setItem('pbj_sirup_last_sync', nowIso);
        // ── Auto-save SIRUP ke DB ──
        const satker = currentUser?.idSatker || satkerId || target;
        if (satker && pkgs.length > 0) {
          fetch('/api/sirup/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              satker_id: satker,
              tahun_anggaran: new Date().getFullYear(),
              packages: pkgs.map(p => ({
                noSirup: p.noSirup,
                packName: p.packName,
                pagu: p.pagu,
                method: p.method,
                sumberDana: p.sumberDana,
                mak: p.mak || '',
              }))
            })
          }).catch(e => console.error('Error saving SIRUP to DB:', e));
        }
      } else {
        throw new Error(data.message || 'Gagal memformat RUP LKPP');
      }
    } catch (err) {
      console.error('Error fetching SIRUP packages:', err);
      alert('Gagal mengambil data SIRUP LKPP: ' + err.message + '\n\nPastikan koneksi internet server stabil.');
    } finally {
      setIsFetchingSirup(false);
    }
  };

  // Auto-fetch saat komponen mount jika cache kosong
  useEffect(() => {
    if (satkerId) {
      loadDpaFromDB();       // ← Load DPA dari DB terlebih dahulu
      loadSirupFromDB(satkerId);  // ← Load SIRUP dari DB
      // HAPUS fetchSirupPackages fallback di sini karena menyebabkan race condition
      // dengan Step1PilihPaket yang juga memuat dari DB, sehingga menimpa data menjadi [].
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [satkerId]);

  // Pilih paket dari tabel SIRUP → lanjut ke step 3 + simpan ke DB
  const selectPackage = (pack) => {
    setSelectedPack(pack);
    setHpsValue(pack.pagu.toString());
    setIsHpsExemptSelected(false);
    setTechSpecs(`Volume: ${pack.volume}\nSpesifikasi: ${pack.spesifikasi}\nMAK: ${pack.mak}`);
    setStep(3);
    // ── Auto-save paket SIRUP yang dipilih ke DB ──
    const satker = currentUser?.idSatker || satkerId;
    if (satker) {
      fetch('/api/sirup/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          satker_id: satker,
          tahun_anggaran: new Date().getFullYear(),
          packages: [{
            noSirup: pack.noSirup,
            packName: pack.packName,
            pagu: pack.pagu,
            method: pack.method,
            sumberDana: pack.sumberDana,
            mak: pack.mak || '',
            klpd: pack.klpd || '',
            satkerNama: pack.satker || '',
            uraian: pack.uraian || '',
            spesifikasi: pack.spesifikasi || '',
          }]
        })
      }).catch(e => console.error('Error saving selected SIRUP to DB:', e));
    }
  };

  // Cek apakah paket SIRUP cocok dengan rekening DPA yang diupload
  const isPackageMatchedWithDpa = (pack) => {
    if (!pack || !dpaAccounts || dpaAccounts.length === 0) return false;
    const stopWords = ['belanja','dan','untuk','kegiatan','bahan','alat','kantor','sub','penyediaan','jasa','modal'];
    return dpaAccounts.some(acc => {
      const paguDifference = Math.abs(acc.pagu - pack.pagu);
      if (paguDifference < 1000) return true;
      const accWords = acc.name.toLowerCase().split(/[\s/.,()-]+/);
      const keywords = accWords.filter(w => w.length > 2 && !stopWords.includes(w));
      const packNameLower = (pack.packName || '').toLowerCase();
      const hasKeywordMatch = keywords.some(kw => packNameLower.includes(kw));
      return hasKeywordMatch && pack.pagu <= acc.pagu;
    });
  };

  const confirmExtractedData = () => {
    setStep(3);
  };

  return (
    <>
      {/* ── LANGKAH 2: UPLOAD DPA ATAU EDIT DETAIL RINCIAN ITEM BARANG ── */}
      <div className={`bg-white border border-slate-200 rounded-2xl p-4 sm:p-8 mb-6 shadow-sm transition-all duration-300 ${!selectedPack ? 'opacity-40 pointer-events-none' : 'animate-slide-up'}`}>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center shrink-0">
              <span className="text-slate-700 text-xs font-bold">2</span>
            </div>
            <h2 className="text-base font-bold text-slate-900">Dokumen Pelaksanaan Anggaran (DPA) — Rincian Item</h2>
          </div>
          <span className="px-3 py-1 text-[10px] rounded-full bg-slate-100 border border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">Rincian Item</span>
        </div>

        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          Unggah file DPA PDF Bapak untuk diekstrak rincian itemnya secara otomatis, atau input manual jika file DPA merupakan hasil pemindaian (scan gambar).
        </p>

        {/* Upload Zone */}
        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-slate-400 transition-colors mb-6 bg-slate-50/30">
          {dpaName ? (
            <div className="text-emerald-600">
              <FileText className="w-10 h-10 text-indigo-500 mx-auto mb-2" />
              <span className="font-bold block text-slate-700 text-xs mb-0.5">{dpaName}</span>
              <span className="text-xs text-emerald-600 font-bold flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Berkas DPA Berhasil Terhubung ke RUP #{selectedPack?.noSirup}</span>
              </span>
              {dpaAccounts.length > 0 && (
                <button
                  onClick={() => {
                    const acc = dpaAccounts[0]
                    if (acc) {
                      const existing = dpaRincian[acc.account] || []
                      setRincianModal({
                        kodeRekening: acc.account,
                        uraian: acc.name,
                        pagu: selectedPack.pagu,
                        raw_text_block: acc.raw_text_block || null,
                        items: existing.length > 0 ? existing.map((r, i) => ({ ...r, no: i + 1 })) : [
                          { no: 1, nama: '', volume: 1, satuan: 'Buah', harga_satuan: 0, harga_total: 0 }
                        ]
                      })
                    }
                  }}
                  className="mt-3 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 mx-auto shadow-sm"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Rincian Item ({dpaAccounts[0]?.rincianCount || 0} barang terdaftar)</span>
                </button>
              )}
              <button
                onClick={() => { setDpaName(null); setDpaAccounts([]); setDpaRincian({}); }}
                className="mt-3 text-xs text-rose-600 hover:text-rose-700 font-bold underline transition-colors block mx-auto"
              >
                Hapus &amp; Upload Ulang DPA
              </button>
            </div>
          ) : (
            <>
              <div className="mb-3">
                {isAnalyzingDpa ? (
                  <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto" />
                ) : (
                  <FolderOpen className="w-10 h-10 text-slate-400 mx-auto" />
                )}
              </div>
              <label className="border-2 border-dashed border-indigo-200 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50/50 transition-colors group">
                <input type="file" className="hidden" accept=".pdf, .xlsx, .xls, .png, .jpg, .jpeg" onChange={async (e) => {
                  const file = e.target.files[0]
                  if (!file) return
                  setDpaName(file.name)
                  setIsAnalyzingDpa(true)
                  try {
                    // 1. Ekstrak API Key aktif dari Database Satker atau fallback ke database global (Admin)
                    let activeProvider = ""
                    let activeKey = ""
                    let escalationProvider = ""
                    let escalationKey = ""
                    try {
                      const satker = currentUser?.idSatker || satkerId
                      let keys = null
                      if (satker) {
                        const resSatker = await fetch(`/api/settings/ocr_api_keys_satker_${satker}`)
                        if (resSatker.ok) {
                          const dataSatker = await resSatker.json()
                          if (dataSatker.value) {
                            keys = JSON.parse(dataSatker.value)
                          }
                        }
                      }

                      if (!keys) {
                        // Fallback: ambil setting ocr_api_keys global dari database server
                        const resGlobal = await fetch('/api/settings/ocr_api_keys')
                        if (resGlobal.ok) {
                          const dataGlobal = await resGlobal.json()
                          if (dataGlobal.value) {
                            keys = JSON.parse(dataGlobal.value)
                          }
                        }
                      }

                      if (keys) {
                        const activeKeysList = [];
                        const checkOrder = ['gemini', 'groq', 'openai', 'anthropic', 'deepseek', 'mistral', 'cohere', 'ollama'];
                        for (const prov of checkOrder) {
                          if (keys[prov]) {
                            activeKeysList.push({ provider: prov, key: keys[prov] });
                          }
                        }

                        if (activeKeysList.length > 0) {
                          activeProvider = activeKeysList[0].provider;
                          activeKey = activeKeysList[0].key;
                        }
                        if (activeKeysList.length > 1) {
                          escalationProvider = activeKeysList[1].provider;
                          escalationKey = activeKeysList[1].key;
                        }
                      }
                    } catch (errKey) {
                      console.error('Gagal mengambil/mem-parse kunci API OCR:', errKey)
                    }

                    // 2. Persiapkan request multipart formData
                    const formData = new FormData()
                    formData.append('file', file)

                    // 3. Masukkan header konfigurasi AI jika tersedia
                    const headers = {}
                    if (activeProvider && activeKey) {
                      headers['X-AI-Provider'] = activeProvider
                      headers['X-AI-Key'] = activeKey
                    }
                    if (escalationProvider && escalationKey) {
                      headers['X-AI-Escalation-Provider'] = escalationProvider
                      headers['X-AI-Escalation-Key'] = escalationKey
                    }

                    const response = await fetch('/api/dpa/parse', {
                      method: 'POST',
                      headers: headers,
                      body: formData
                    })

                    if (!response.ok) {
                      const errText = await response.text()
                      throw new Error(`Server error ${response.status}: ${errText}`)
                    }

                    const result = await response.json()
                    if (!result.success || !result.rekening || result.rekening.length === 0) {
                      throw new Error('Tidak ditemukan rekening belanja di berkas DPA ini.')
                    }
                    
                    // 3.5. Otomatis isi Metadata Paket dari hasil DPA (jika ada)
                    setPackageMetadata(prev => {
                      let subKegiatanStr = result.sub_kegiatan || prev.sub_kegiatan || '';
                      let nomorSubKegiatan = prev.nomor_sub_kegiatan || '';
                      let sumberDana = prev.sumber_dana || '';
                      
                      let programStr = result.program || prev.program || '';
                      let nomorProgram = prev.nomor_program || '';
                      if (result.program) {
                          const pMatch = programStr.match(/^([\d\.]+)\s*-\s*(.*)/);
                          if (pMatch) {
                              nomorProgram = pMatch[1].trim();
                              programStr = pMatch[2].trim();
                          }
                      }

                      let kegiatanStr = result.kegiatan || prev.kegiatan || '';
                      let nomorKegiatan = prev.nomor_kegiatan || '';
                      if (result.kegiatan) {
                          const kMatch = kegiatanStr.match(/^([\d\.]+)\s*-\s*(.*)/);
                          if (kMatch) {
                              nomorKegiatan = kMatch[1].trim();
                              kegiatanStr = kMatch[2].trim();
                          }
                      }

                      if (result.sub_kegiatan) {
                          const sdParts = subKegiatanStr.split(/Sumber Pendanaan\s*:?\s*/i);
                          if (sdParts.length > 1) {
                              sumberDana = sdParts[1].trim();
                              subKegiatanStr = sdParts[0].trim();
                          }
                          const numMatch = subKegiatanStr.match(/^([\d\.]+)\s*-\s*(.*)/);
                          if (numMatch) {
                              nomorSubKegiatan = numMatch[1].trim();
                              subKegiatanStr = numMatch[2].trim();
                          }
                      }

                      return {
                        ...prev,
                        program: programStr,
                        nomor_program: nomorProgram,
                        kegiatan: kegiatanStr,
                        nomor_kegiatan: nomorKegiatan,
                        sub_kegiatan: subKegiatanStr,
                        nomor_sub_kegiatan: nomorSubKegiatan,
                        sumber_dana: sumberDana,
                        lokasi_pekerjaan: result.lokasi || prev.lokasi_pekerjaan,
                        waktu_penyelesaian: result.waktu_pelaksanaan || prev.waktu_penyelesaian
                      };
                    })

                    // 4. Catat mode ekstraksi yang berhasil dilakukan (ai atau local)
                    const returnedMode = result.ocr_mode || (activeKey ? 'ai' : 'local')
                    setDpaOcrMode(returnedMode)
                    localStorage.setItem('pbj_dpa_ocr_mode', returnedMode)

                    // 5. Cari rekening yang paling cocok dengan kode MAK RUP yang dipilih
                    let acc = result.rekening[0]
                    if (selectedPack && selectedPack.mak) {
                      const cleanRUPMak = selectedPack.mak.replace(/\./g, '')
                      const foundAcc = result.rekening.find(r => {
                        const cleanDpaCode = r.kode_rekening.replace(/\./g, '')
                        return cleanRUPMak.includes(cleanDpaCode) || cleanDpaCode.includes(cleanRUPMak)
                      })
                      if (foundAcc) {
                        acc = foundAcc
                      }
                    }

                    // Petakan seluruh rekening hasil parse DPA agar tampil lengkap di tabel web view
                    const mappedAccounts = result.rekening.map(r => {
                      const isMatched = r.kode_rekening === acc.kode_rekening
                      return {
                        account: r.kode_rekening,
                        name: cleanUraian(r.uraian),
                        // JIKA cocok dengan RUP terpilih, pagu wajib sama dengan pagu RUP Resmi (MAK)!
                        pagu: isMatched && selectedPack ? selectedPack.pagu : r.pagu,
                        confidence: r.confidence || 95,
                        ocr_engine: result.ocr_engine || 'pymupdf',
                        verified: isMatched,
                        rincianCount: (r.rincian || []).length,
                        raw_text_block: r.raw_text_block || null,
                        is_valid: r.is_valid !== undefined ? r.is_valid : true,
                        validation_reason: r.validation_reason || ''
                      }
                    })
                    setDpaAccounts(mappedAccounts)

                    // Simpan seluruh rincian sub-item per rekening secara dinamis
                    const newRincian = {}
                    result.rekening.forEach(r => {
                      const isMatched = r.kode_rekening === acc.kode_rekening
                      let rincianItems = r.rincian ? JSON.parse(JSON.stringify(r.rincian)) : []

                      if (isMatched && selectedPack) {
                        // JIKA rincian hasil parse DPA benar-benar kosong, buat rincian default
                        if (rincianItems.length === 0) {
                          rincianItems = [{
                            no: 1,
                            nama: selectedPack?.packName || 'Rincian Belanja DPA',
                            volume: 1,
                            satuan: 'Paket',
                            harga_satuan: selectedPack.pagu,
                            harga_total: selectedPack.pagu,
                            isDefault: true
                          }]
                        }
                      }
                      newRincian[r.kode_rekening] = rincianItems
                    })
                    setDpaRincian(newRincian)

                    const ocrModeText = returnedMode === 'ai'
                      ? `menggunakan AI Refinement (${activeProvider.toUpperCase()})`
                      : 'menggunakan Parser Lokal (Tanpa AI karena API key admin kosong)';
                    alert(`✅ DPA Berhasil Dibaca!\nEkstraksi otomatis berhasil diselaraskan ${ocrModeText} dengan RUP #${selectedPack.noSirup}.`);
                    // ── Auto-save hasil parsing DPA ke DB server ──
                    saveDpaAccountsToDB(mappedAccounts, dpaName);
                    setStep(3)
                  } catch (err) {
                    console.error('DPA Parse error:', err)
                    alert('Gagal mengekstrak berkas DPA.\n' + err.message + '\n\nSilakan gunakan input manual rincian di bawah atau pastikan Anda mengunggah Excel DPA/RKA yang utuh.')

                    // Fallback manual agar user tidak stuck
                    const fallbackAcc = [{
                      account: '5.1.02.01.001.00024',
                      name: selectedPack?.packName,
                      pagu: selectedPack.pagu,
                      confidence: 100,
                      ocr_engine: 'manual',
                      verified: true,
                      rincianCount: 0
                    }]
                    setDpaAccounts(fallbackAcc)
                    setDpaRincian({ '5.1.02.01.001.00024': [] })
                    setDpaOcrMode('local')
                    localStorage.setItem('pbj_dpa_ocr_mode', 'local')
                  } finally {
                    setIsAnalyzingDpa(false)
                  }
                }} />
                <p className="mt-4 text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                  Klik untuk unggah DPA (PDF / Excel)
                </p>
                <p className="mt-1.5 text-xs text-slate-400 text-center max-w-xs leading-relaxed">
                  Unggah RKA/DPA asli yang Anda unduh dari SIPD (disarankan format Excel agar hasil baca tabel lebih akurat).
                </p>
              </label>

              {/* Opsi Lewati / Isi Manual langsung */}
              <div className="mt-3">
                <button
                  onClick={() => {
                    setDpaName('Rincian_Uraian_Manual.pdf')
                    const manualAcc = [{
                      account: '5.1.02.01.001.00024',
                      name: selectedPack?.packName,
                      pagu: selectedPack.pagu,
                      confidence: 100,
                      ocr_engine: 'manual',
                      verified: true,
                      rincianCount: 0
                    }]
                    setDpaAccounts(manualAcc)
                    setDpaRincian({ '5.1.02.01.001.00024': [] })
                    setRincianModal({
                      kodeRekening: '5.1.02.01.001.00024',
                      uraian: selectedPack?.packName,
                      pagu: selectedPack.pagu,
                      items: [
                        { no: 1, nama: '', volume: 1, satuan: 'Buah', harga_satuan: 0, harga_total: 0 }
                      ]
                    })
                  }}
                  className="text-xs text-slate-500 font-semibold hover:text-slate-700 hover:underline"
                >
                  Or, skip upload and fill item details manually ✍️
                </button>
              </div>
            </>
          )}
        </div>


        {/* Hasil Analisis & Pembacaan Rekening DPA (AI OCR) - TABEL LEBAR PENUH & SANGAT MUDAH DIBACA */}
        {dpaAccounts && dpaAccounts.length > 0 && (
          <div className="mt-8 border-t border-slate-200 pt-6 animate-slide-up space-y-4">

            {/* Banner Informasi OCR Mode */}
            {dpaOcrMode === 'ai' ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse"></span>
                <div className="text-xs text-slate-600 leading-relaxed">
                  <span className="font-semibold text-slate-800">AI OCR Aktif</span> — Rincian DPA berhasil dibaca dan diperbaiki secara otomatis oleh model AI.
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
                <div className="text-xs text-slate-600 leading-relaxed">
                  <span className="font-semibold text-slate-800">Parser Lokal (Tanpa AI)</span> — API Key belum dikonfigurasi. Hubungkan API Key di menu Admin untuk hasil yang lebih akurat.
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">
                  Hasil Analisis & Pembacaan Rekening DPA (AI OCR)
                </h3>
                <span className="text-xs text-indigo-600 font-medium flex items-center gap-1">
                  <Edit3 className="w-3 h-3" />
                  <span>Klik pada kolom untuk melakukan Edit Inline</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setDpaAccounts(prev => prev.map(acc => ({ ...acc, verified: true })));
                    alert('Semua rekening belanja daerah hasil pembacaan DPA Anda telah berhasil diverifikasi!');
                  }}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verifikasi Semua Rekening</span>
                </button>
              </div>
            </div>

            <div className="w-full">
              <table className="w-full text-left border-collapse block md:table md:min-w-[1000px]">
                <thead className="hidden md:table-header-group bg-slate-50/70">
                  <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-5 py-3 w-[140px]">Tingkat Keyakinan</th>
                    <th className="px-5 py-3 w-[200px]">Kode Rekening</th>
                    <th className="px-5 py-3 min-w-[300px]">Uraian Rekening</th>
                    <th className="px-5 py-3 text-right w-[160px]">Pagu DPA</th>
                    <th className="px-5 py-3 text-center w-[180px]">Aksi / Status</th>
                  </tr>
                </thead>
                <tbody className="block md:table-row-group text-sm">
                  {dpaAccounts.map((acc, index) => {
                    const confidenceVal = acc.confidence !== undefined ? acc.confidence : 85;
                    const isHigh = confidenceVal >= 80;
                    const isMedium = confidenceVal >= 50 && confidenceVal < 80;
                    const isLow = confidenceVal < 50;
                    const isUnverified = !acc.verified && (acc.pagu_method === 'fallback_max' || acc.ocr_engine === 'tesseract');

                    return (
                      <tr key={index} className="block md:table-row bg-white border border-slate-200 md:border-x-0 md:border-t-0 md:border-b-slate-100 rounded-xl md:rounded-none mb-4 md:mb-0 p-4 md:p-0 relative hover:bg-slate-50/40 transition-colors">
                        {/* 1. Confidence Column */}
                        <td className="block md:table-cell px-0 md:px-5 py-2 md:py-3 border-b border-dashed border-slate-200 md:border-0 mb-3 md:mb-0 pb-3 md:pb-0 flex justify-between items-center md:items-start md:block">
                          <span className="md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider">Keyakinan AI</span>
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${isHigh ? 'bg-emerald-500 animate-pulse' : isMedium ? 'bg-amber-400' : 'bg-rose-500'}`} />
                            <span className={`text-xs font-bold ${isHigh ? 'text-emerald-700' : isMedium ? 'text-amber-700' : 'text-rose-700'}`}>
                              {confidenceVal}% {isUnverified && <span className="text-[10px] font-normal text-amber-500 italic ml-1">(Harap verifikasi)</span>}
                            </span>
                          </div>
                        </td>

                        {/* 2. Kode Rekening Input */}
                        <td className="block md:table-cell px-0 md:px-5 py-2 font-mono">
                          <div className="md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kode Rekening</div>
                          <input
                            type="text"
                            value={acc.account}
                            onChange={(e) => handleInlineEdit(index, 'account', e.target.value)}
                            className="w-full bg-slate-50/50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-lg px-3 py-2 text-slate-800 font-mono text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                            placeholder="Kode Rekening..."
                          />
                        </td>

                        {/* 3. Uraian Rekening Input */}
                        <td className="block md:table-cell px-0 md:px-5 py-2">
                          <div className="md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 mt-2">Uraian Rekening</div>
                          <textarea
                            value={acc.name}
                            onChange={(e) => handleInlineEdit(index, 'name', e.target.value)}
                            className="w-full bg-slate-50/50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-lg px-3 py-2 text-slate-700 font-semibold text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all resize-y min-h-[42px]"
                            placeholder="Uraian Rekening..."
                            rows="2"
                          />
                        </td>

                        {/* 4. Pagu DPA Input */}
                        <td className="block md:table-cell px-0 md:px-5 py-2 text-left md:text-right">
                          <div className="md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 mt-2">Pagu DPA</div>
                          <div className="flex items-center md:justify-end border border-slate-200 focus-within:border-indigo-500 rounded-lg px-3 py-1.5 hover:bg-slate-100/50 focus-within:bg-white transition-all w-fit md:ml-auto">
                            <span className="text-xs text-slate-400 font-sans mr-1.5 select-none">Rp</span>
                            <input
                              type="number"
                              value={acc.pagu}
                              onChange={(e) => handleInlineEdit(index, 'pagu', parseInt(e.target.value) || 0)}
                              className="bg-transparent text-right font-extrabold text-indigo-600 focus:ring-0 border-none outline-none transition-all text-xs w-28 p-0"
                              placeholder="Pagu..."
                            />
                          </div>
                        </td>

                        {/* 5. Aksi / Status */}
                        <td className="block md:table-cell px-0 md:px-5 py-3 md:py-2 text-center md:whitespace-nowrap border-t border-dashed border-slate-200 md:border-0 mt-3 md:mt-0 pt-3 md:pt-0">
                          <div className="flex flex-wrap items-center justify-between md:justify-center gap-2">
                            {isUnverified ? (
                              <button
                                onClick={() => handleConfirmAccount(index)}
                                className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-2 py-1 rounded-lg text-[10px] font-bold transition-all shadow-sm flex items-center gap-1 active:scale-95"
                                title="Klik untuk verifikasi bahwa data ini sudah benar"
                              >
                                <AlertTriangle className="w-3 h-3 text-amber-500" />
                                <span>Verifikasi</span>
                              </button>
                            ) : acc.is_valid === false ? (
                              <span className="bg-rose-50 text-rose-700 border border-rose-100 px-2.5 py-1 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 justify-center cursor-help shadow-sm hover:scale-[1.02] transition-all" title={acc.validation_reason || "Terdeteksi rincian barang terpotong di dokumen asli"}>
                                <XCircle className="w-3 h-3 text-rose-600" />
                                <span>Terpotong</span>
                              </span>
                            ) : (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 justify-center cursor-help shadow-sm hover:scale-[1.02] transition-all" title={acc.validation_reason || "Rincian barang tuntas dan valid"}>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Valid</span>
                              </span>
                            )}
                            <button
                              onClick={() => {
                                const existing = dpaRincian[acc.account] || []
                                setRincianModal({
                                  kodeRekening: acc.account,
                                  uraian: acc.name,
                                  pagu: acc.pagu,
                                  raw_text_block: acc.raw_text_block || null,
                                  items: existing.length > 0 ? existing.map((r, i) => ({ ...r, no: i + 1 })) : [
                                    { no: 1, nama: '', volume: 1, satuan: 'Buah', harga_satuan: 0, harga_total: 0 }
                                  ]
                                })
                              }}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all flex items-center gap-1"
                              title="Edit rincian item barang untuk rekening ini"
                            >
                              <Edit3 className="w-3 h-3 text-slate-500" />
                              <span>Rincian</span>
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Hapus rekening belanja ini?')) {
                                  setDpaAccounts(prev => prev.filter((_, i) => i !== index))
                                }
                              }}
                              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                              title="Hapus Rekening"
                            >
                              <Trash2 className="w-4 h-4 text-slate-455" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Dynamic Add Row Button */}
            <div className="mt-3 flex justify-start">
              <button
                onClick={() => {
                  setDpaAccounts(prev => [
                    ...prev,
                    {
                      account: '5.1.02.01.001.00000',
                      name: 'Belanja Barang Daerah Baru',
                      pagu: 1000000,
                      confidence: 100,
                      pagu_method: 'manual',
                      ocr_engine: 'manual',
                      verified: true
                    }
                  ]);
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 active:scale-95"
              >
                <PlusCircle className="w-4 h-4 text-slate-600" />
                <span>Tambah Rekening Belanja Baru</span>
              </button>
            </div>
          </div>
        )}

        {/* ── MODAL EDIT RINCIAN ITEM ───────────────────────────────── */}
        {rincianModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex justify-between items-start p-6 border-b border-slate-200">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Edit3 className="w-5 h-5 text-indigo-650" />
                    <span>Edit Rincian Item DPA</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 font-mono">{rincianModal.kodeRekening} — {rincianModal.uraian}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Pagu: <span className="font-bold text-indigo-600">Rp&nbsp;{rincianModal.pagu?.toLocaleString()}</span></p>
                </div>
                <button onClick={() => setRincianModal(null)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">×</button>
              </div>

              {/* Info Banner when details were not parsed automatically (System Fallback) */}
              {rincianModal.items.some(item => item.isDefault) && (
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-5 flex items-start gap-3 shadow-sm animate-pulse-subtle">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <div className="text-xs text-amber-800 leading-relaxed font-medium">
                    <strong className="text-amber-900 font-bold block mb-0.5">Rincian Item Belanja Tidak Ditemukan Oleh OCR</strong>
                    Sistem tidak mendeteksi rincian sub-item belanja secara otomatis dari berkas DPA Anda. Sistem telah membuat rincian default (1 Paket senilai Pagu Resmi RUP) agar Anda dapat mengisi/mengedit uraian nama spesifikasi barang secara manual di bawah tanpa terjadi selisih pagu.
                  </div>
                </div>
              )}

              {/* Tabel Rincian */}
              <div className="overflow-auto flex-1 p-6">
                <table className="w-full text-xs text-left border-collapse block md:table">
                  <thead className="hidden md:table-header-group">
                    <tr className="bg-slate-50 text-slate-500 font-bold tracking-wider">
                      <th className="border border-slate-200 px-3 py-2 w-12 text-center">No</th>
                      <th className="border border-slate-200 px-3 py-2">Nama Barang / Uraian</th>
                      <th className="border border-slate-200 px-3 py-2 w-20 text-center">Volume</th>
                      <th className="border border-slate-200 px-3 py-2 w-24 text-center">Satuan</th>
                      <th className="border border-slate-200 px-3 py-2 w-32 text-right">Harga Satuan (Rp)</th>
                      <th className="border border-slate-200 px-3 py-2 w-32 text-right">Harga Total (Rp)</th>
                      <th className="border border-slate-200 px-3 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="block md:table-row-group">
                    {rincianModal.items.map((item, idx) => (
                      <tr key={idx} className="block md:table-row bg-white border border-slate-200 md:border-0 rounded-xl md:rounded-none mb-4 md:mb-0 p-3 md:p-0 relative hover:bg-slate-50">
                        <td className="hidden md:table-cell border border-slate-200 px-2 py-1.5 text-center text-slate-500 font-bold bg-slate-50/50">{idx + 1}</td>
                        <td className="block md:table-cell border-0 md:border md:border-slate-200 px-0 md:px-3 py-2 md:py-2.5">
                          <div className="md:hidden flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Item #{idx + 1}</span>
                          </div>
                          <textarea
                            rows={2}
                            className="w-full border border-slate-200 bg-white text-slate-850 font-bold focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10 rounded-xl px-3 py-2 text-xs shadow-sm transition-all resize-y overflow-auto leading-relaxed"
                            value={item.nama}
                            placeholder="Tulis uraian / nama spesifikasi barang secara lengkap..."
                            onChange={e => {
                              const upd = [...rincianModal.items]
                              upd[idx] = { ...upd[idx], nama: e.target.value }
                              setRincianModal(prev => ({ ...prev, items: upd }))
                            }}
                          />
                        </td>
                        <td className="block md:table-cell border-0 md:border md:border-slate-200 px-0 md:px-2 py-1">
                          <div className="flex md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-2 mb-1">Volume</div>
                          <input
                            type="number" min="0"
                            className="w-full border-0 bg-transparent focus:outline-none focus:bg-indigo-50 rounded px-1 py-0.5 text-left md:text-center"
                            value={item.volume}
                            onChange={e => {
                              const vol = parseFloat(e.target.value) || 0
                              const upd = [...rincianModal.items]
                              upd[idx] = { ...upd[idx], volume: vol, harga_total: Math.round(vol * (upd[idx].harga_satuan || 0)) }
                              setRincianModal(prev => ({ ...prev, items: upd }))
                            }}
                          />
                        </td>
                        <td className="block md:table-cell border-0 md:border md:border-slate-200 px-0 md:px-2 py-1">
                          <div className="flex md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-2 mb-1">Satuan</div>
                          <select
                            className="w-full border-0 bg-transparent focus:outline-none text-left md:text-center text-xs"
                            value={item.satuan}
                            onChange={e => {
                              const upd = [...rincianModal.items]
                              upd[idx] = { ...upd[idx], satuan: e.target.value }
                              setRincianModal(prev => ({ ...prev, items: upd }))
                            }}
                          >
                            {['Buah', 'Unit', 'Rim', 'Lembar', 'Paket', 'Set', 'Pcs', 'Box', 'Botol', 'Dus', 'Kg', 'Meter', 'Roll', 'Pack', 'Biji', 'Lusin', 'Kaleng', 'Eksemplar'].map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                        <td className="block md:table-cell border-0 md:border md:border-slate-200 px-0 md:px-2 py-1">
                          <div className="flex md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-2 mb-1">Harga Satuan (Rp)</div>
                          <input
                            type="number" min="0"
                            className="w-full border-0 bg-transparent focus:outline-none focus:bg-indigo-50 rounded px-1 py-0.5 text-left md:text-right font-mono"
                            value={item.harga_satuan}
                            onChange={e => {
                              const hs = parseInt(e.target.value) || 0
                              const upd = [...rincianModal.items]
                              upd[idx] = { ...upd[idx], harga_satuan: hs, harga_total: Math.round((upd[idx].volume || 1) * hs) }
                              setRincianModal(prev => ({ ...prev, items: upd }))
                            }}
                          />
                        </td>
                        <td className="block md:table-cell border-0 md:border md:border-slate-200 px-0 md:px-2 py-2 text-right">
                          <div className="flex md:block justify-between items-center border-t border-dashed border-slate-200 md:border-0 mt-2 md:mt-0 pt-2 md:pt-0">
                            <span className="md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total (Rp)</span>
                            <span className="font-bold font-mono text-indigo-650">{item.harga_total?.toLocaleString() || 0}</span>
                          </div>
                        </td>
                        <td className="absolute top-2 right-2 md:relative md:top-0 md:right-0 block md:table-cell border-0 md:border md:border-slate-200 px-0 md:px-2 py-1 text-center">
                          <button
                            onClick={() => {
                              const upd = rincianModal.items.filter((_, i) => i !== idx)
                              setRincianModal(prev => ({ ...prev, items: upd }))
                            }}
                            className="text-rose-400 hover:text-rose-600 font-bold"
                          >×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-bold">
                      <td colSpan="5" className="border border-slate-200 px-3 py-2 text-right text-slate-700">Total Rincian:</td>
                      <td className="border border-slate-200 px-3 py-2 text-right font-mono text-indigo-700">
                        {rincianModal.items.reduce((s, r) => s + (r.harga_total || 0), 0).toLocaleString()}
                      </td>
                      <td className="border border-slate-200"></td>
                    </tr>
                    <tr>
                      <td colSpan="7" className="px-3 py-4 bg-slate-50/50">
                        {(() => {
                          const total = rincianModal.items.reduce((s, r) => s + (r.harga_total || 0), 0)
                          const selisih = (rincianModal.pagu || 0) - total

                          const handleAutoBalance = async () => {
                            if (rincianModal.items.length === 0) return
                            try {
                              let activeProvider = ""
                              let activeKey = ""
                              try {
                                const satker = currentUser?.idSatker || satkerId
                                let keys = null
                                if (satker) {
                                  const resSatker = await fetch(`/api/settings/ocr_api_keys_satker_${satker}`)
                                  if (resSatker.ok) {
                                    const dataSatker = await resSatker.json()
                                    if (dataSatker.value) {
                                      keys = JSON.parse(dataSatker.value)
                                    }
                                  }
                                }

                                if (!keys) {
                                  // Fallback: ambil setting ocr_api_keys global dari database server
                                  const resGlobal = await fetch('/api/settings/ocr_api_keys')
                                  if (resGlobal.ok) {
                                    const dataGlobal = await resGlobal.json()
                                    if (dataGlobal.value) {
                                      keys = JSON.parse(dataGlobal.value)
                                    }
                                  }
                                }

                                if (keys) {
                                  if (keys.gemini) { activeProvider = "gemini"; activeKey = keys.gemini }
                                  else if (keys.groq) { activeProvider = "groq"; activeKey = keys.groq }
                                  else if (keys.openai) { activeProvider = "openai"; activeKey = keys.openai }
                                  else if (keys.anthropic) { activeProvider = "anthropic"; activeKey = keys.anthropic }
                                  else if (keys.deepseek) { activeProvider = "deepseek"; activeKey = keys.deepseek }
                                  else if (keys.mistral) { activeProvider = "mistral"; activeKey = keys.mistral }
                                  else if (keys.cohere) { activeProvider = "cohere"; activeKey = keys.cohere }
                                  else if (keys.ollama) { activeProvider = "ollama"; activeKey = keys.ollama }
                                }
                              } catch (errKey) {
                                console.error('Gagal mengambil/mem-parse kunci API OCR:', errKey)
                              }

                              // Jika sedang di proses, kasih loading indikasi (bisa pakai alert dulu sementara)
                              const btn = document.getElementById('btn-auto-balance')
                              const oldText = btn ? btn.innerText : ''
                              if (btn) {
                                btn.innerText = '⏳ Mengolah dengan AI...'
                                btn.disabled = true
                                btn.classList.add('opacity-50', 'cursor-wait')
                              }

                              const payload = {
                                items: rincianModal.items,
                                target_pagu: rincianModal.pagu || 0,
                                provider: activeProvider,
                                api_key: activeKey,
                                raw_text_block: rincianModal.raw_text_block || null
                              }

                              const res = await fetch('/api/dpa/align-rincian', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(payload)
                              })

                              if (!res.ok) throw new Error('API request failed')
                              const data = await res.json()
                              if (data.success && data.aligned_items) {
                                setRincianModal(prev => ({ ...prev, items: data.aligned_items }))
                                const modeText = data.ocr_mode === 'ai' ? `(AI Refinement via ${activeProvider.toUpperCase()})` : '(Matematika Lokal)'
                                alert(`✅ Berhasil diselaraskan 100% dengan Pagu RUP ${modeText}!`)
                              }

                              if (btn) {
                                btn.innerText = oldText
                                btn.disabled = false
                                btn.classList.remove('opacity-50', 'cursor-wait')
                              }
                            } catch (err) {
                              console.error(err)
                              alert('Gagal menyelaraskan rincian dengan AI.')
                              // Kembalikan state button
                              const btn = document.getElementById('btn-auto-balance')
                              if (btn) {
                                btn.innerText = '⚡ Selaraskan Otomatis dengan Pagu RUP'
                                btn.disabled = false
                                btn.classList.remove('opacity-50', 'cursor-wait')
                              }
                            }
                          }

                          return (
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                                <div>
                                  <span className="text-slate-500 font-medium">Pagu Resmi RUP:</span>
                                  <strong className="text-slate-800 font-bold ml-1.5">Rp&nbsp;{rincianModal.pagu?.toLocaleString()}</strong>
                                </div>
                                <div>
                                  <span className="text-slate-500 font-medium">Total Rincian DPA:</span>
                                  <strong className="text-indigo-700 font-bold ml-1.5">Rp&nbsp;{total.toLocaleString()}</strong>
                                </div>
                                <div className="border-l border-slate-200 h-4 hidden md:block"></div>
                                <div>
                                  <span className="text-slate-500 font-medium">Status Selisih:</span>
                                  {selisih === 0 ? (
                                    <span className="text-emerald-700 font-bold ml-1.5 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">✓ Cocok 100%</span>
                                  ) : (
                                    <span className={`font-bold ml-1.5 px-2 py-0.5 rounded border ${selisih > 0 ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-rose-700 bg-rose-50 border-rose-200'}`}>
                                      {selisih > 0 ? `Kurang Rp ${selisih.toLocaleString()}` : `Kelebihan Rp ${Math.abs(selisih).toLocaleString()}`}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {selisih !== 0 && (
                                <button
                                  type="button"
                                  id="btn-auto-balance"
                                  onClick={handleAutoBalance}
                                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all active:scale-[0.98] flex items-center gap-1.5"
                                  title="Menyelaraskan selisih anggaran secara otomatis ke item belanja terakhir"
                                >
                                  <Zap className="w-3.5 h-3.5 text-white" />
                                  <span>Selaraskan Otomatis dengan Pagu RUP</span>
                                </button>
                              )}
                            </div>
                          )
                        })()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
                {/* Tambah baris */}
                <button
                  onClick={() => {
                    const lastItem = rincianModal.items[rincianModal.items.length - 1]
                    setRincianModal(prev => ({
                      ...prev, items: [...prev.items, {
                        no: prev.items.length + 1,
                        nama: '', volume: 1, satuan: lastItem?.satuan || 'Buah',
                        harga_satuan: 0, harga_total: 0
                      }]
                    }))
                  }}
                  className="mt-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
                  <span>Tambah Baris Item</span>
                </button>
              </div>
              {/* Footer actions */}
              <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
                <button
                  onClick={() => setRincianModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50"
                >Batal</button>
                <button
                  onClick={async () => {
                    const validItems = rincianModal.items.filter(r => r.nama && r.harga_satuan > 0)
                    const newDpaRincian = { ...dpaRincian, [rincianModal.kodeRekening]: validItems };
                    const newDpaAccounts = dpaAccounts.map(acc =>
                      acc.account === rincianModal.kodeRekening
                        ? { ...acc, rincianCount: validItems.length, verified: true }
                        : acc
                    );
                    
                    setDpaRincian(newDpaRincian);
                    setDpaAccounts(newDpaAccounts);
                    
                    // Simpan permanen ke Database sebagai Ground Truth
                    await saveDpaAccountsToDB(newDpaAccounts, dpaName, newDpaRincian);
                    
                    setRincianModal(null)
                    alert(`✅ ${validItems.length} item rincian disimpan ke Ground Truth untuk rekening ${rincianModal.kodeRekening}!`)
                  }}
                  className="px-5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold shadow-sm flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4 text-white" />
                  <span>Simpan Rincian ke DPA Ground Truth</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Smart RAK Grid Section */}
        {dpaAccounts && dpaAccounts.length > 0 && (
          <SmartRAKGrid 
            dpaAccounts={dpaAccounts} 
            satkerId={satkerId} 
            packageMetadata={packageMetadata}
            dpaRincian={dpaRincian}
          />
        )}

        {/* Integrasi SIRUP — Sinkronisasi & Pemetaan No. RUP */}
        {dpaName && (
          <div className="border-t border-slate-100 pt-8 animate-fade-in mt-8 space-y-6">
            
            {/* Title Section with Subtitle */}
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-4 bg-indigo-600 rounded"></span>
                Integrasi &amp; Sinkronisasi RUP SIRUP LKPP
              </h3>
              <p className="text-xs text-slate-500">
                Hubungkan dan petakan rekening belanja DPA secara akurat ke dalam Rencana Umum Pengadaan (RUP) yang tercatat di portal resmi SIRUP LKPP.
              </p>
            </div>

            {/* Dashboard Kontrol Konektivitas (Enterprise Grade Layout) */}
            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-slate-50/70 border-b border-slate-100">
                
                {/* Left Side: Status & Satker Meta */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status Integrasi Sistem</span>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                      isFetchingSirup 
                        ? 'bg-amber-50 text-amber-700 animate-pulse border border-amber-200/80' 
                        : sirupPackages.length > 0 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80' 
                          : 'bg-rose-50 text-rose-800 border border-rose-200/80'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        isFetchingSirup 
                          ? 'bg-amber-500 animate-ping' 
                          : sirupPackages.length > 0 
                            ? 'bg-emerald-500' 
                            : 'bg-rose-500'
                      }`}></span>
                      {isFetchingSirup ? 'Sinkronisasi Aktif...' : sirupPackages.length > 0 ? 'Data SIRUP Terhubung' : 'Data Belum Sinkron'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                    <div className="flex items-center gap-2 text-slate-500">
                      <span>Satker ID:</span>
                      <strong className="text-slate-700 font-mono bg-white border border-slate-200/60 rounded px-1.5 py-0.5">{satkerId}</strong>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <span>Nama Satker:</span>
                      <strong className="text-slate-700">{currentUser?.department || 'Kecamatan'}</strong>
                    </div>
                  </div>
                </div>

                {/* Right Side: Quick Action Link */}
                <div className="shrink-0 flex items-center">
                  <a
                    href={`https://sirup.inaproc.id/sirup/home/penyediaSatker?idSatker=${satkerId}`}
                    target="_blank" rel="noreferrer"
                    className="text-xs text-slate-600 hover:text-indigo-600 font-semibold flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm transition-all hover:border-slate-300"
                  >
                    <span>Buka Portal SIRUP LKPP</span>
                    <span className="text-[10px] text-slate-400">↗</span>
                  </a>
                </div>
              </div>

              {/* Action Buttons Bar */}
              <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Button 1: Force Sync */}
                  <button
                    type="button"
                    onClick={() => fetchSirupPackages(satkerId)}
                    disabled={isFetchingSirup}
                    className={`text-xs font-bold px-5 py-3 rounded-xl transition-all flex items-center gap-2 border ${
                      isFetchingSirup 
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed shadow-none' 
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700 shadow-sm hover:shadow active:scale-98'
                    }`}
                  >
                    {isFetchingSirup ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    ) : (
                      <RefreshCw className="w-4 h-4 text-white" />
                    )}
                    <span>{isFetchingSirup ? 'Mengambil Data RUP...' : 'Sinkronkan Data SIRUP'}</span>
                  </button>

                  {/* Button 2: Auto-Link */}
                  {sirupPackages.length === 0 ? (
                    <div className="relative group">
                      <button
                        type="button"
                        disabled={true}
                        className="bg-slate-50 border border-slate-200 text-slate-400 text-xs font-bold px-5 py-3 rounded-xl flex items-center gap-2 cursor-not-allowed opacity-70 shadow-none"
                      >
                        <Zap className="w-4 h-4 text-slate-400" />
                        <span>Auto-Link Semua</span>
                      </button>
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-max max-w-xs bg-slate-800 text-white text-[10px] font-medium rounded px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md leading-relaxed z-10">
                        Ambil data SIRUP terlebih dahulu untuk mencocokkan secara otomatis
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        let count = 0;
                        const newLinks = [];
                        dpaAccounts.forEach(acc => {
                          const alreadyLinked = scrapedData.find(s => s.linkedRekening === acc.account);
                          if (!alreadyLinked) {
                            const best = findBestSirupMatch(acc, sirupPackages, selectedPack);
                            if (best) {
                              newLinks.push({
                                noSirup: best.noSirup,
                                packName: best.packName,
                                pagu: best.pagu,
                                method: best.method || 'Pengadaan Langsung',
                                sumberDana: best.sumberDana || 'APBD',
                                tahun: best.tahun || new Date().getFullYear().toString(),
                                klpd: currentUser?.perangkatDaerah || '',
                                satker: currentUser?.department || '',
                                volume: '1 Paket',
                                uraian: best.packName,
                                spesifikasi: 'Spesifikasi Sesuai Rincian DPA',
                                pdn: 'Ya',
                                usahaKecil: 'Ya',
                                jenisPengadaan: acc.account?.includes('5.2.') ? 'Modal' : 'Barang',
                                mak: acc.account,
                                linkedRekening: acc.account
                              });
                              count++;
                            }
                          }
                        });
                        if (count > 0) {
                          setScrapedData(prev => {
                            const filtered = prev.filter(s => !newLinks.find(n => n.linkedRekening === s.linkedRekening));
                            return [...filtered, ...newLinks];
                          });
                          setStep(Math.max(step, 2));
                          alert(`Berhasil memetakan otomatis ${count} rekening belanja ke paket RUP SIRUP yang sesuai!`);
                        } else {
                          alert('Semua rekening sudah terpetakan, atau tidak ditemukan paket RUP yang cocok dengan pagu & uraian.');
                        }
                      }}
                      className={`text-xs font-bold px-5 py-3 rounded-xl transition-all flex items-center gap-2 border shadow-sm hover:shadow active:scale-98 ${
                        dpaAccounts.filter(acc => !scrapedData.find(s => s.linkedRekening === acc.account)).length > 0
                          ? 'bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white border-indigo-600 animate-pulse ring-2 ring-indigo-300 ring-offset-1'
                          : 'bg-white hover:bg-slate-50 text-indigo-700 border-indigo-200'
                      }`}
                    >
                      <Zap className="w-4 h-4 text-white" />
                      <span>Auto-Link Semua Rekening</span>
                      <span className="bg-indigo-100/50 text-indigo-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                        {dpaAccounts.filter(acc => !scrapedData.find(s => s.linkedRekening === acc.account)).length} Belum Terhubung
                      </span>
                    </button>
                  )}
                </div>

                {/* Status message details */}
                <div className="text-xs text-slate-500 font-medium sm:text-right">
                  {isFetchingSirup ? (
                    <span className="text-amber-600 flex items-center gap-1.5 sm:justify-end">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                      Sedang memanggil endpoint LKPP...
                    </span>
                  ) : sirupPackages.length > 0 ? (
                    <div className="space-y-0.5">
                      <div className="text-emerald-700 font-bold flex items-center gap-1 sm:justify-end">
                        <Check className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{sirupPackages.length} Paket RUP termuat di memori</span>
                      </div>
                      {lastSyncTime && (
                        <div className="text-[10px] text-slate-400">
                          Sinkron terakhir: {new Date(lastSyncTime).toLocaleTimeString('id-ID')} WIB
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-rose-600 font-semibold flex items-center gap-1 sm:justify-end">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Data RUP kosong. Lakukan sinkronisasi di samping.</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Panduan Sistem */}
            <div className="border-l-4 border-indigo-600 bg-indigo-50/40 rounded-r-xl p-4 text-xs text-indigo-900 leading-relaxed shadow-sm">
              <strong className="block text-indigo-950 font-bold mb-1">Panduan Pemetaan Rekening:</strong>
              Klik tombol <strong className="text-indigo-950">Auto-Link Semua Rekening</strong> untuk mencocokkan rekening belanja DPA ke dalam paket RUP SIRUP secara instan berdasarkan algoritma kecocokan pagu dan semantik uraian. Anda juga dapat memetakan, mencari, atau mengubah paket secara manual per baris belanja di bawah.
            </div>

            {/* Input per rekening DPA */}
            {dpaAccounts.length > 0 ? (
              <div className="space-y-4">
                {dpaAccounts.map((acc, idx) => {
                  const linked = scrapedData.find(s => s.linkedRekening === acc.account)
                  return (
                    <div key={idx} className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md/5 transition-all p-5 space-y-4">
                      {/* Header rekening */}
                      <div className="flex items-start justify-between gap-3 flex-wrap border-b border-slate-100 pb-3">
                        <div className="space-y-1 flex-1 min-w-0">
                          <span className="inline-block bg-slate-100 text-slate-600 font-mono text-[10px] font-extrabold px-2 py-0.5 rounded border border-slate-200">
                            {acc.account}
                          </span>
                          <h4 className="text-xs font-bold text-slate-800 leading-snug">{acc.name}</h4>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pagu DPA Ground-Truth</div>
                          <div className="text-xs font-extrabold text-slate-700">Rp&nbsp;{acc.pagu?.toLocaleString('id-ID')}</div>
                        </div>
                      </div>

                      {/* Status: sudah terhubung atau belum */}
                      {linked ? (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-emerald-50/50 border border-emerald-200/80 rounded-xl px-4 py-3 text-xs gap-3">
                          <div className="space-y-1">
                            <div className="font-extrabold text-emerald-800 flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>Terhubung ke No. RUP SIRUP</span>
                            </div>
                            <div className="font-semibold text-slate-800">
                              <span className="font-mono text-indigo-700 font-extrabold bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded text-[10px] mr-1.5">#{linked.noSirup}</span>
                              {linked?.packName}
                            </div>
                            <div className="text-slate-500 font-medium">
                              Pagu SIRUP: <strong className="text-emerald-700">Rp&nbsp;{linked.pagu?.toLocaleString('id-ID')}</strong>
                              <span className="mx-1.5 text-slate-300">·</span>
                              Metode: <strong className="text-slate-700">{linked.method}</strong>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setScrapedData(prev => prev.filter(s => s.linkedRekening !== acc.account))}
                            className="shrink-0 self-start sm:self-center text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors hover:underline"
                          >
                            Ubah Hubungan RUP
                          </button>
                        </div>
                      ) : (
                        <SirupInputRow
                          acc={acc}
                          sirupPackages={sirupPackages}
                          selectedPack={selectedPack}
                          onFetchSirup={() => fetchSirupPackages(satkerId)}
                          onLink={(sirupPack) => {
                            const pack = { ...sirupPack, linkedRekening: acc.account }
                            setScrapedData(prev => {
                              const filtered = prev.filter(s => s.linkedRekening !== acc.account)
                              return [...filtered, pack]
                            })
                            setStep(Math.max(step, 2))
                          }}
                        />
                      )}
                    </div>
                  )
                })}

                {/* Status keseluruhan */}
                {scrapedData.filter(s => s.linkedRekening).length > 0 && (
                  <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🎉</span>
                      <span className="text-xs text-emerald-900 font-bold">
                        Sebanyak {scrapedData.filter(s => s.linkedRekening).length} dari {dpaAccounts.length} rekening belanja DPA telah berhasil terhubung dengan SIRUP LKPP!
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm hover:shadow active:scale-98"
                    >
                      Lanjut ke Penetapan HPS →
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
                ⬆️ Upload DPA terlebih dahulu untuk melihat daftar rekening yang perlu dipasangkan ke No. RUP SIRUP.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Horizontal Alur Persiapan Stepper */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between min-w-max gap-2">
          {[
            { num: 1, label: 'SIRUP LKPP & Kunci Paket' },
            { num: 2, label: 'Upload DPA & Rincian Item' },
            { num: 3, label: 'Penetapan HPS & Spesifikasi' },
            { num: 4, label: 'Kirim DPP ke PP' }
          ].map(({ num, label }, index) => (
            <div key={num} className="flex items-center flex-1">
              <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all w-full ${
                step === num ? 'bg-slate-50 border border-slate-200 shadow-sm' : 'bg-transparent'
              }`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-bold border transition-all ${
                  step === num ? 'bg-white border-slate-400 text-slate-800 shadow-sm' :
                  step > num ? 'bg-emerald-500 border-emerald-500 text-white' :
                  'bg-white border-slate-200 text-slate-400'
                }`}>
                  {step > num ? '✓' : num}
                </div>
                <span className={`text-xs font-medium whitespace-nowrap transition-all ${
                  step === num ? 'text-slate-800 font-bold' :
                  step > num ? 'text-slate-500 font-semibold' :
                  'text-slate-400'
                }`}>{label}</span>
              </div>
              {index < 3 && (
                <div className={`w-8 h-[2px] mx-2 rounded-full shrink-0 ${step > num ? 'bg-emerald-400' : 'bg-slate-200'}`}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area for Steps 2, 3, and 4 */}
      <div className="space-y-6 w-full">

          {/* Step 2: Scraped Data Table */}
          {scrapedData.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-slide-up mt-6">
              <h2 className="text-lg font-bold text-slate-900 mb-2">Hasil Pencarian Paket SIRUP</h2>
              <p className="text-xs text-slate-500 mb-6">Berikut adalah paket APBD yang ditemukan untuk RUP Penyedia {currentUser?.department || 'Kecamatan'}. Pilih paket untuk memuat detailnya.</p>

              <div className="w-full border border-slate-100 rounded-xl shadow-sm bg-white">
                <table className="min-w-full divide-y divide-slate-100 block md:table">
                  <thead className="bg-slate-50 hidden md:table-header-group">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Kode RUP</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Nama Paket</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Pagu (Rp)</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Sumber</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm block md:table-row-group">
                    {scrapedData.map(pack => (
                      <tr key={pack.noSirup} className={`block md:table-row hover:bg-slate-50 transition-colors ${selectedPack?.noSirup === pack.noSirup ? 'bg-indigo-50/50' : 'bg-white'} border border-slate-200 md:border-0 rounded-xl md:rounded-none p-4 md:p-0 mb-4 md:mb-0 relative`}>
                        <td className="block md:table-cell px-0 md:px-4 py-2 md:py-4 font-mono text-indigo-600 font-bold hover:underline cursor-pointer flex items-center gap-1" onClick={() => setDetailModalPack(pack)}>
                          <Link className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{pack.noSirup}</span>
                        </td>
                        <td className="block md:table-cell px-0 md:px-4 py-2 md:py-4 text-slate-700 md:max-w-xs font-medium" title={pack?.packName}>
                          <div className="flex flex-col gap-1.5">
                            <div className="md:truncate font-bold md:font-medium text-slate-800 md:text-slate-700">{pack?.packName}</div>
                            {isPackageMatchedWithDpa(pack) && (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-[9px] font-extrabold w-fit animate-pulse flex items-center gap-1 mt-1 md:mt-0">
                                <Sparkles className="w-3 h-3 text-emerald-650" />
                                <span>Cocok dengan Rincian DPA Anda</span>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="block md:table-cell px-0 md:px-4 py-2 md:py-4 text-emerald-600 font-bold">
                          <div className="md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 mt-2">Pagu</div>
                          Rp&nbsp;{(pack.pagu || 0).toLocaleString()}
                        </td>
                        <td className="block md:table-cell px-0 md:px-4 py-2 md:py-4 text-slate-500 font-medium">
                          <div className="md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 mt-2">Sumber Dana</div>
                          {pack.sumberDana}
                        </td>
                        <td className="block md:table-cell px-0 md:px-4 py-3 md:py-4 mt-3 md:mt-0 border-t border-dashed border-slate-200 md:border-0">
                          <button
                            onClick={() => selectPackage(pack)}
                            className="w-full md:w-auto bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold px-3 py-2.5 md:py-2 rounded-lg transition-colors shadow-sm"
                          >
                            Pilih Paket
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

      </div>
    </>
  );
}

function SirupInputRow({ acc, onLink, sirupPackages = [], onFetchSirup, selectedPack }) {
 const autoMatch = findBestSirupMatch(acc, sirupPackages, selectedPack);
 const [showPicker, setShowPicker] = useState(!autoMatch);
 const [search, setSearch] = useState('');

 const handleUse = (pack) => {
 onLink({
 noSirup: pack.noSirup,
 packName: pack.packName,
 pagu: pack.pagu,
 method: pack.method || 'Pengadaan Langsung',
 sumberDana: pack.sumberDana || 'APBD',
 tahun: pack.tahun || new Date().getFullYear().toString(),
 klpd: currentUser?.perangkatDaerah || '',
 satker: currentUser?.department || '',
 volume: '1 Paket',
 uraian: pack.packName,
 spesifikasi: 'Spesifikasi Sesuai Rincian DPA',
 pdn: 'Ya',
 usahaKecil: 'Ya',
 jenisPengadaan: acc.account?.includes('5.2.') ? 'Modal' : 'Barang',
 mak: acc.account
 });
 };

 const filtered = sirupPackages.filter(p => {
 const q = search.toLowerCase();
 return !q
 || (p.packName || '').toLowerCase().includes(q)
 || (p.noSirup || '').includes(q);
 });

 return (
 <div className="mt-2 space-y-3">

 {/* ── Rekomendasi Sistem (Auto-match card) ─────────────────────────────────── */}
 {autoMatch && !showPicker && (
 <div className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-4 transition-all">
 <div className="flex items-center justify-between mb-2">
 <span className=" font-bold text-indigo-700 bg-indigo-100/60 px-2 py-0.5 rounded uppercase tracking-wider">
 Rekomendasi Sistem
 </span>
 <span className=" font-bold text-slate-500">
 Skor Kesesuaian: <strong className="text-indigo-700 font-mono">{autoMatch._score}</strong>
 </span>
 </div>
 
 <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
 <div className="flex-1 space-y-1">
 <div className="text-xs font-bold text-slate-800 leading-relaxed">{autoMatch?.packName}</div>
 <div className=" text-slate-500 flex items-center gap-2 flex-wrap">
 <span className="font-mono text-indigo-700 font-extrabold bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded ">
 #{autoMatch.noSirup}
 </span>
 <span>Pagu SIRUP: <strong className="text-emerald-700">Rp&nbsp;{autoMatch.pagu?.toLocaleString('id-ID')}</strong></span>
 <span className="text-slate-300">·</span>
 <span>Metode: <strong className="text-slate-700">{autoMatch.method}</strong></span>
 </div>
 </div>
 
 <button
 type="button"
 onClick={() => handleUse(autoMatch)}
 className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl transition-all shadow-sm hover:shadow active:scale-95 whitespace-nowrap"
 >
 Gunakan Rekomendasi
 </button>
 </div>

 <div className="mt-3 pt-2.5 border-t border-slate-200/40">
 <button
 type="button"
 onClick={() => setShowPicker(true)}
 className=" text-slate-500 hover:text-indigo-600 font-semibold underline block transition-colors"
 >
 Cari manual dari daftar paket Satker...
 </button>
 </div>
 </div>
 )}

 {/* ── Pencarian Manual (Searchable picker) ───────────────────────────────────── */}
 {(!autoMatch || showPicker) && (
 <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-4 space-y-3">
 
 {showPicker && autoMatch && (
 <button
 type="button"
 onClick={() => setShowPicker(false)}
 className=" text-indigo-600 hover:text-indigo-800 font-bold underline flex items-center gap-1 transition-colors"
 >
 ← Kembali ke Rekomendasi Otomatis
 </button>
 )}

 {sirupPackages.length === 0 ? (
 /* Empty State: Belum Sinkron */
 <div className="bg-white border border-slate-200 rounded-xl p-6 text-center space-y-3">
 <div className="text-2xl text-slate-400">📡</div>
 <div className="space-y-1">
 <h5 className="text-xs font-bold text-slate-700">Koneksi SIRUP LKPP Belum Aktif</h5>
 <p className=" text-slate-500 max-w-xs mx-auto leading-relaxed">
 Data RUP untuk Satker ini belum diunduh dari server LKPP. Silakan lakukan sinkronisasi terlebih dahulu.
 </p>
 </div>
 <button
 type="button"
 onClick={() => onFetchSirup && onFetchSirup()}
 className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg shadow-sm transition-all active:scale-95"
 >
 Hubungkan &amp; Unduh RUP Sekarang
 </button>
 </div>
 ) : (
 /* Pencarian Aktif */
 <div className="space-y-2.5">
 <div className="flex items-center justify-between font-extrabold text-slate-500 uppercase tracking-wider">
 <span>Daftar Pemilihan Paket</span>
 <span className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono font-bold">
 {sirupPackages.length} Paket RUP
 </span>
 </div>
 
 <input
 type="text"
 placeholder="Ketik kata kunci nama paket belanja atau nomor RUP..."
 value={search}
 onChange={e => setSearch(e.target.value)}
 className="w-full border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 rounded-xl px-3.5 py-2 text-xs outline-none bg-white transition-all shadow-sm"
 />

 <div className="max-h-52 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
 {filtered.length === 0 ? (
 <div className="text-xs text-slate-400 italic py-4 text-center bg-white border border-slate-200/50 rounded-lg">
 Tidak ditemukan paket RUP yang cocok dengan kata kunci "{search}"
 </div>
 ) : (
 filtered.slice(0, 25).map(p => (
 <button
 key={p.noSirup}
 type="button"
 onClick={() => handleUse(p)}
 className="w-full text-left bg-white hover:bg-indigo-50/50 border border-slate-100 hover:border-indigo-100 rounded-lg px-3 py-2.5 transition-all group flex items-center justify-between gap-3 shadow-sm"
 >
 <span className="flex-1 min-w-0 space-y-0.5">
 <span className="inline-block font-mono text-indigo-700 font-extrabold bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded mr-1.5">
 #{p.noSirup}
 </span>
 <span className="text-slate-700 font-semibold group-hover:text-indigo-950 transition-colors leading-relaxed">
 {p?.packName}
 </span>
 <span className="block text-slate-400 mt-1 font-medium">
 Pagu: <strong className="text-emerald-700">Rp&nbsp;{p.pagu?.toLocaleString('id-ID')}</strong>
 <span className="mx-1.5 text-slate-300">·</span>
 Metode: <strong className="text-slate-600">{p.method}</strong>
 </span>
 </span>
 <span className="shrink-0 text-indigo-700 bg-indigo-50 group-hover:bg-indigo-600 group-hover:text-white border border-indigo-100 px-2.5 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap">
 Pilih Paket
 </span>
 </button>
 ))
 )}
 </div>
 </div>
 )}
 </div>
 )}
 </div>
 );
}

