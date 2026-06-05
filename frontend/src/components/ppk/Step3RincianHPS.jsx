import React, { useState, useEffect } from 'react';
import { usePPK } from './PPKContext';
import DocPreviewModal from './DocPreviewModal';

export default function Step3RincianHPS() {
  // ── Dari PPKContext (tersedia) ──────────────────────────────────────────────
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
    dppSpecs, setDppSpecs,
    tanggalSurat, setTanggalSurat, getPackageItems
  } = usePPK();
  const [isAiEditorOpen, setIsAiEditorOpen] = useState(true);
  const [aiLoadingField, setAiLoadingField] = useState(null);
  
  const handleAiAssist = (field) => {
    setAiLoadingField(field);
    setTimeout(() => {
      let enhancedText = '';
      if (field === 'justifikasiMerek') {
        enhancedText = `Sesuai dengan spesifikasi teknis dan standar operasional yang dibutuhkan, pemilihan merek/produk tertentu dilakukan dengan justifikasi untuk menjaga kompatibilitas, efisiensi pemeliharaan, serta menjamin ketersediaan layanan purna jual di sekitar lokasi satuan kerja.`;
      } else if (field === 'metodePemilihan') {
        enhancedText = `Pemilihan penyedia dilakukan melalui metode E-Purchasing berdasarkan Peraturan Presiden tentang Pengadaan Barang/Jasa Pemerintah. Proses ini akan mengutamakan negosiasi harga dan persyaratan teknis untuk mendapatkan value for money terbaik dari penyedia Katalog Elektronik.`;
      } else if (field === 'spesifikasiLayanan') {
        enhancedText = `Penyedia wajib memberikan garansi resmi minimal 1 (satu) tahun. Pengiriman barang harus dilakukan ke lokasi tujuan akhir maksimal 14 hari kalender sejak pesanan dikonfirmasi. Apabila ditemukan cacat fisik atau ketidaksesuaian spesifikasi pada saat serah terima, penyedia wajib mengganti dengan barang baru maksimal 2x24 jam.`;
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
      justifikasiMerek: `Sesuai dengan spesifikasi teknis dan standar operasional yang dibutuhkan, pemilihan merek/produk tertentu dilakukan dengan justifikasi untuk menjaga kompatibilitas, efisiensi pemeliharaan, serta menjamin ketersediaan layanan purna jual di sekitar lokasi satuan kerja.`,
      metodePemilihan: `Pemilihan penyedia dilakukan melalui metode E-Purchasing berdasarkan Peraturan Presiden tentang Pengadaan Barang/Jasa Pemerintah. Proses ini akan mengutamakan negosiasi harga dan persyaratan teknis untuk mendapatkan value for money terbaik dari penyedia Katalog Elektronik.`,
      spesifikasiLayanan: `Penyedia wajib memberikan garansi resmi minimal 1 (satu) tahun. Pengiriman barang harus dilakukan ke lokasi tujuan akhir maksimal 14 hari kalender sejak pesanan dikonfirmasi. Apabila ditemukan cacat fisik atau ketidaksesuaian spesifikasi pada saat serah terima, penyedia wajib mengganti dengan barang baru maksimal 2x24 jam.`
    });
  };


  // ── Local state (tidak ada di context) ─────────────────────────────────────
  const [isSigned, setIsSigned] = useState(false);
  const [justifications, setJustifications] = useState({});
  const [comparisons, setComparisons] = useState({});
  const [screenshotStatus, setScreenshotStatus] = useState({});
  const [isEnhancingJustification, setIsEnhancingJustification] = useState({});
  const [isSurveying, setIsSurveying] = useState(false);
  const [surveyProgress, setSurveyProgress] = useState('');
  const [surveyProgressPercent, setSurveyProgressPercent] = useState(0);

  const [customTargets, setCustomTargets] = useState({});
  const [customMinPrices, setCustomMinPrices] = useState({});
  const [customMaxPrices, setCustomMaxPrices] = useState({});
  const [loadingProductIndex, setLoadingProductIndex] = useState(null);
  const [expandedEditCardIndex, setExpandedEditCardIndex] = useState(null);
  const [expandedSurveyRows, setExpandedSurveyRows] = useState({});
  const [cancelJobId, setCancelJobId] = useState(null);
  const [aiLoadingSpecIndex, setAiLoadingSpecIndex] = useState(null);

  const handleAiSpecAssist = async (item, idx) => {
    setAiLoadingSpecIndex(idx);
    try {
      const response = await fetch('/api/ai/generate-spec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_name: item.name })
      });
      if (!response.ok) throw new Error('Gagal menghubungi server AI');
      const data = await response.json();
      if (data.success && data.specifications) {
        const matchedAcc = getMatchingDpaAccount(selectedPack);
        const kodeRekening = matchedAcc?.account || `nosirup_${selectedPack?.noSirup}`;
        if (kodeRekening && dpaRincian[kodeRekening]) {
          const newRincian = { ...dpaRincian };
          const newArr = [...newRincian[kodeRekening]];
          newArr[idx] = { ...newArr[idx], spesifikasi: data.specifications };
          newRincian[kodeRekening] = newArr;
          setDpaRincian(newRincian);
          setIsSigned(false);
        }
      }
    } catch (e) {
      console.error(e);
      alert('Gagal menghasilkan spesifikasi otomatis: ' + e.message);
    } finally {
      setAiLoadingSpecIndex(null);
    }
  };

  const [useAiMode, setUseAiMode] = useState(true);
  const [globalPriceTolerance, setGlobalPriceTolerance] = useState(8);
  const [globalTargetVendor, setGlobalTargetVendor] = useState('SULTONI');
  const [searchLocations, setSearchLocations] = useState('Kab.Probolinggo');
  const [customKeywords, setCustomKeywords] = useState({});
  
  const [ignorePriceLimit, setIgnorePriceLimit] = useState(false);
  const [autoComparator, setAutoComparator] = useState(false);

  const handleTtdUpload = (e, role) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Str = event.target.result;
      const key = role === 'ppk' ? 'ttdPpk' : 'ttdPp';
      const newSettings = { ...docSettings, [key]: base64Str };
      setDocSettings(newSettings);
      localStorage.setItem('pbj_doc_settings', JSON.stringify(newSettings));
    };
    reader.readAsDataURL(file);
  };

  // ── Helper functions ────────────────────────────────────────────────────────
  const getActiveSurveyData = () => surveyData;

  const getPacketCategory = (packName) => {
    if (!packName) return 'ATK';
    const name = packName.toLowerCase();
    if (name.includes('laptop') || name.includes('printer') || name.includes('komputer') || name.includes('kendaraan') || name.includes('mesin') || name.includes('elektronik') || name.includes('modal')) return 'Modal';
    if (name.includes('kertas sektoral') || name.includes('seragam dinas') || name.includes('konsolidasi')) return 'Konsolidasi';
    if (name.includes('prasmanan') || name.includes('katering') || name.includes('catering')) return 'Mamin-Prasmanan';
    if (name.includes('nasi kotak') || name.includes('nasi bungkus') || name.includes('kotak')) return 'Mamin-Bungkus';
    if (name.includes('snack') || name.includes('kudapan')) return 'Mamin-Snack';
    if (name.includes('makan') || name.includes('minum') || name.includes('mamin') || name.includes('konsumsi')) return 'Mamin-Bungkus';
    if (name.includes('jasa') || name.includes('pemeliharaan') || name.includes('service')) return 'Jasa';
    return 'ATK';
  };

  // Automatically populate AI editor defaults based on selected DPP template
  useEffect(() => {
    let templateName = '';
    try {
      const templatesStr = localStorage.getItem('pbj_templates');
      if (templatesStr) {
        const templates = JSON.parse(templatesStr);
        const tpl = templates.find(t => t.id === selectedTplId);
        if (tpl) templateName = tpl.name || '';
      }
    } catch(e) {}
    
    let defMerek = "";
    let defMetode = "";
    let defSpek = "";

    if (templateName.includes('Modal')) {
      defMerek = "Sesuai dengan kebutuhan standar operasional, perangkat yang diadakan merujuk pada merek yang memiliki layanan purna jual resmi (Service Center) di wilayah terdekat dan terjamin ketersediaan suku cadangnya. Hal ini bertujuan untuk menjamin kelangsungan operasional perangkat setelah masa garansi habis.";
      defMetode = "Pemilihan penyedia dilakukan melalui metode E-Purchasing pada Katalog Elektronik (Katalog Lokal/Nasional/Sektoral) melalui prosedur Negosiasi Harga untuk mendapatkan barang dengan kualifikasi teknis yang tepat dan harga yang kompetitif.";
      defSpek = "Penyedia wajib melampirkan Surat Dukungan Pabrikan (apabila disyaratkan dalam e-Katalog), memberikan Garansi Resmi Pabrik minimal 1 (satu) tahun, serta bertanggung jawab atas proses pengiriman, instalasi, dan uji coba alat hingga berfungsi dengan baik.";
    } else if (templateName.includes('Konsolidasi')) {
      defMerek = "Pemilihan merek/produk telah ditetapkan berdasarkan hasil Konsolidasi Pengadaan oleh Bagian Pengadaan Barang dan Jasa Sekretariat Daerah yang memiliki spesifikasi teknis dan Standar Satuan Harga yang seragam.";
      defMetode = "Dilakukan melalui metode Direct Purchasing (Pembelian Langsung) pada e-Katalog Elektronik khusus etalase Produk Konsolidasi sesuai Surat Edaran PBJ tentang pelaksanaan pengadaan barang/jasa hasil konsolidasi tanpa memandang batasan HPS.";
      defSpek = "Penyedia yang dipilih merupakan penyedia pelaksana Katalog Konsolidasi terpilih. Pengiriman dilakukan sesuai permintaan parsial/sekaligus dan tidak diperkenankan ada tambahan ongkos kirim/biaya lainnya di luar yang tertera dalam kontrak.";
    } else if (templateName.includes('Makanan')) {
      defMerek = "Penyediaan jasa katering tidak mensyaratkan merek tertentu, melainkan berfokus pada kualitas cita rasa, higienitas penyajian, dan reputasi kebersihan penyedia lokal di sekitar lokasi kegiatan.";
      defMetode = "Metode E-Purchasing Katalog Elektronik Etalase Makanan dan Minuman, dengan mengedepankan pemberdayaan Pelaku Usaha Mikro dan Kecil (UMK) yang berdomisili di wilayah setempat.";
      defSpek = "Penyedia wajib memiliki Sertifikat Laik Higiene Sanitasi (SLHS). Makanan dikemas dalam wadah food-grade yang ramah lingkungan dan diantarkan ke lokasi kegiatan selambat-lambatnya 1 (satu) jam sebelum acara dimulai. Apabila ada prasmanan, harus disajikan lengkap dengan peralatan saji bersih.";
    } else if (templateName.includes('Jasa Lainnya')) {
      defMerek = "Tidak berlaku, pengadaan berupa layanan/jasa yang menitikberatkan pada kualifikasi personel dan rekam jejak perusahaan dalam menangani jasa serupa.";
      defMetode = "E-Purchasing melalui Katalog Elektronik sektoral/lokal dengan mengutamakan negosiasi pada ruang lingkup pekerjaan dan kewajaran harga.";
      defSpek = "Penyedia wajib melaksanakan layanan jasa sesuai kerangka acuan kerja, menyediakan tenaga terampil, serta memberikan laporan hasil pekerjaan secara berkala dan tepat waktu.";
    } else {
      // Default ATK/Barang Umum
      defMerek = "Barang yang diadakan merujuk pada standar pasaran yang umum beredar, memiliki kualitas SNI (jika ada), ramah lingkungan, dan dapat memenuhi fungsi kegiatan administrasi kantor dengan baik.";
      defMetode = "E-Purchasing pada Katalog Elektronik dengan prioritas Pelaku Usaha Mikro, Kecil, dan Koperasi (UMKK) untuk menstimulasi ekonomi lokal sesuai Instruksi Presiden.";
      defSpek = "Penyedia wajib mengirimkan barang dalam kondisi baru, tidak cacat fisik, dan bersegel asli pabrik. Apabila saat serah terima ditemukan barang rusak atau tidak sesuai pesanan, penyedia wajib menukarnya maksimal dalam waktu 2x24 jam.";
    }

    setDppSpecs(prev => ({
      ...prev,
      justifikasiMerek: defMerek,
      metodePemilihan: defMetode,
      spesifikasiLayanan: defSpek
    }));
  }, [selectedTplId]); 

  // Auto-fill MAK and Tahun Anggaran from selectedPack if they are empty
  useEffect(() => {
    if (selectedPack) {
      setPackageMetadata(prev => {
        let updated = false;
        const next = { ...prev };
        if (!next.mak && selectedPack.mak) {
          next.mak = selectedPack.mak;
          updated = true;
        }
        if (!next.tahun_anggaran) {
          next.tahun_anggaran = selectedPack.tahun || '2026';
          updated = true;
        }
        return updated ? next : prev;
      });
    }
  }, [selectedPack, setPackageMetadata]);






    const areAccountsCompatible = (dpaAcc, sirupMak) => {
    if (!dpaAcc || !sirupMak) return true

    // Temukan index angka 5 yang merupakan bagian awal kode rekening belanja (5.x.xx...)
    const indexFive = sirupMak.indexOf('5.')
    let cleanSirup = ''
    if (indexFive !== -1) {
      // Ambil dari angka 5 ke belakang
      const makAccountPart = sirupMak.substring(indexFive)
      cleanSirup = makAccountPart.replace(/[^0-9]/g, '')
    } else {
      cleanSirup = sirupMak.replace(/[^0-9]/g, '')
    }

    const cleanDpa = dpaAcc.replace(/[^0-9]/g, '')
    if (!cleanDpa || !cleanSirup) return true

    // Cocokkan apakah kode DPA terkandung di dalam bagian rekening MAK
    if (cleanSirup.includes(cleanDpa) || cleanDpa.includes(cleanSirup)) return true

    // Bandingkan kategori utama (6 digit pertama, misal 520205 vs 520210)
    const prefixDpa = cleanDpa.substring(0, 6)
    const prefixSirup = cleanSirup.substring(0, 6)
    if (prefixDpa && prefixSirup && prefixDpa === prefixSirup) return true

    return false
  }

  const isPackageMatchedWithDpa = (pack) => {
    if (!pack || !dpaAccounts || dpaAccounts.length === 0) return false

    // Stop words to filter out common terms from government accounts
    const stopWords = ['belanja', 'dan', 'untuk', 'kegiatan', 'bahan', 'alat', 'kantor', 'sub', 'penyediaan', 'jasa', 'modal']

    return dpaAccounts.some(acc => {
      // If MAK and account are incompatible, they cannot be a match!
      if (pack.mak && acc.account && !areAccountsCompatible(acc.account, pack.mak)) {
        return false
      }

      // 1. Direct Pagu Match (common in regional budget systems)
      const paguDifference = Math.abs(acc.pagu - pack.pagu)
      if (paguDifference < 1000) return true

      // 2. Dynamic Keyword Matching
      const accWords = (acc.name || '').toLowerCase().split(/[\s/.,()-]+/)
      const keywords = accWords.filter(w => w.length > 2 && !stopWords.includes(w))

      const packNameLower = (pack.packName || '').toLowerCase()
      const hasKeywordMatch = keywords.some(kw => packNameLower.includes(kw))

      // If we have keyword overlap and the package pagu is valid, it's a match!
      if (hasKeywordMatch && pack.pagu <= acc.pagu) {
        return true
      }

      return false
    })
  }

  const getMatchingDpaAccount = (pack) => {
    if (!pack || !dpaAccounts || dpaAccounts.length === 0) return null

    const stopWords = ['belanja', 'dan', 'untuk', 'kegiatan', 'bahan', 'alat', 'kantor', 'sub', 'penyediaan', 'jasa', 'modal']

    return dpaAccounts.find(acc => {
      // If MAK and account are incompatible, they cannot be a match!
      if (pack.mak && acc.account && !areAccountsCompatible(acc.account, pack.mak)) {
        return false
      }

      // 1. Direct Pagu Match (common in regional budget systems)
      const paguDifference = Math.abs(acc.pagu - pack.pagu)
      if (paguDifference < 1000) return true

      // 2. Dynamic Keyword Matching
      const accWords = (acc.name || '').toLowerCase().split(/[\s/.,()-]+/)
      const keywords = accWords.filter(w => w.length > 2 && !stopWords.includes(w))

      const packNameLower = (pack.packName || '').toLowerCase()
      const hasKeywordMatch = keywords.some(kw => packNameLower.includes(kw))

      if (hasKeywordMatch && pack.pagu <= acc.pagu) {
        return true
      }

      return false
    })
  }

  /**
   * getPackageItems — ambil rincian item dari DPA Ground Truth (hasil parser + koreksi PPK).
   * Prioritas: (1) dpaRincian[kode_rekening cocok], (2) dpaRincian['manual_nosirup_xxx'],
   * (3) item placeholder agar tabel tidak kosong.
   */
  const autoCleanKeyword = (name) => {
    if (!name) return '';
    let clean = name;
    if (clean.includes('(Spesifikasi')) {
      clean = clean.replace(/\(Spesifikasi\s+(.*?)\)/gi, ' $1');
    }
    if (clean.includes('/')) {
      clean = clean.split('/')[0].trim();
    }
    clean = clean.replace(/\(.*?\)/g, '');
    return clean.replace(/\s+/g, ' ').trim();
  };

  const isOverBudget = !isHpsExemptSelected && selectedPack?.pagu > 0 && parseInt(hpsValue || 0) > selectedPack.pagu;
  const cancelSurvey = () => setIsSurveying(false);

  const runAiSurvey = async () => {
    if (!selectedPack) return;
    setIsSurveying(true);
    setSurveyProgressPercent(0);
    setSurveyProgress('Menghubungkan ke sistem e-Katalog LKPP...');

    const category = getPacketCategory(selectedPack?.packName || '');
    const items = getPackageItems(selectedPack);

    const requestItems = items
      .filter(item => {
        const qty = item.qty === '' ? 0 : (item.qty || 0);
        return qty > 0;
      })
      .map((item, idx) => {
        let rawQuery = item.name;
        
        // Jika user sudah mengetik manual, gunakan itu
        if (customKeywords[idx] && customKeywords[idx].trim() !== '') {
          rawQuery = customKeywords[idx].trim();
        } 
        // Jika belum diketik manual dan mode AI aktif, bersihkan otomatis nama dari DPA
        else if (useAiMode) {
          rawQuery = autoCleanKeyword(item.name);
        }
  
        return {
          name: item.name,
          query: rawQuery,
          fallbackPrice: item.price,
          explicitMinPrice: customMinPrices[idx] ? parseInt(customMinPrices[idx].toString().replace(/\D/g, ''), 10) : null,
          explicitMaxPrice: customMaxPrices[idx] ? parseInt(customMaxPrices[idx].toString().replace(/\D/g, ''), 10) : null,
          priceTolerance: globalPriceTolerance,
          targetVendor: customTargets[idx] || globalTargetVendor || '',
          targetUrl: (customTargets[idx] && customTargets[idx].startsWith('http')) ? customTargets[idx] : ''
        };
      });

    if (requestItems.length === 0) {
      setIsSurveying(false);
      setSurveyProgress('Tidak ada item dengan QTY > 0 untuk disurvei.');
      return;
    }

    try {
      setSurveyProgress(`Menganalisis referensi E-Katalog... Mohon tunggu (Estimasi: ${items.length * 10} detik)`);
      setSurveyProgressPercent(5);

      // Server ini sekarang menggunakan Service Node.js baru di port 3001
      const response = await fetch('http://localhost:3001/api/survey/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          items: requestItems,
          useAi: useAiMode,
          locations: searchLocations.split(',').map(s => s.trim()).filter(Boolean),
          ignorePriceLimit: ignorePriceLimit,
          autoComparator: autoComparator
        })
      });

      if (!response.ok) {
        throw new Error('Gagal mengeksekusi survei: ' + response.statusText);
      }

      const runRes = await response.json();
      if (!runRes.jobId) throw new Error('Tidak mendapatkan Job ID dari server');
      setCancelJobId(runRes.jobId);

      setSurveyProgress(`Mengantre di Worker (Job ID: ${runRes.jobId})...`);

      let results = null;
      while (true) {
        await new Promise(r => setTimeout(r, 2500)); // poll every 2.5s
        
        const statusRes = await fetch(`http://localhost:3001/api/survey/status/${runRes.jobId}`);
        if (!statusRes.ok) throw new Error('Gagal mengecek status job');
        const statusData = await statusRes.json();

        if (statusData.isCanceled || statusData.status === 'completed') {
          results = statusData.results || [];
          if (statusData.isCanceled) {
            results.wasCanceled = true;
          }
          break;
        } else if (statusData.status === 'failed') {
          throw new Error('Gagal memproses data: ' + statusData.error);
        } else if (statusData.status === 'waiting' && statusData.progress === 0) {
          // Masih mengantre, belum diambil worker — tetap tampilkan progress awal
          setSurveyProgress(`Mengantre di Worker (Job ID: ${runRes.jobId})...`);
        } else {
          // Sedang diproses — update progress langsung tanpa threshold
          if (statusData.progress > 0) {
            setSurveyProgressPercent(statusData.progress);
            setSurveyProgress(`Sistem sedang mencari harga di E-Katalog (${statusData.progress}% selesai)...`);
          }
        }
      }

      setSurveyProgressPercent(95);
      setSurveyProgress('Menyusun lampiran bukti survei HPS...');

      const newHpsPrices = {};
      let totalHpsEstimate = 0;
      const newComparisons = { ...comparisons };

      // Integrate real results
      results.forEach((res, index) => {
        const qty = items[index].qty || 1;
        newHpsPrices[res.name] = res.price;
        totalHpsEstimate += (res.price * qty);
        
        // Auto-Comparator Capture
        if (autoComparator && res.comparators && res.comparators.length > 0) {
          const comp = res.comparators[0];
          newComparisons['ITEM-' + index] = {
            vendor: comp.vendor,
            name: comp.name,
            price: comp.price,
            status: comp.status,
            link: comp.link,
            alasan: comp.alasan,
            isAuto: true
          };
          
          if (res.comparators.length > 1) {
            const comp2 = res.comparators[1];
            newComparisons['ITEM-' + index + '-2'] = {
              vendor: comp2.vendor,
              name: comp2.name,
              price: comp2.price,
              status: comp2.status,
              link: comp2.link,
              alasan: comp2.alasan,
              isAuto: true
            };
          }
        }
      });
      setComparisons(newComparisons);

      setSurveyProgressPercent(95);
      await new Promise(r => setTimeout(r, 500));

      setSurveyData({
        category,
        products: results.map((r, i) => ({
          id: 'ITEM-' + i,
          name: r.name,
          vendor: r.vendor,
          price: r.price,
          link: r.link,
          img: r.img,
          searchImg: r.searchImg,
          success: r.success
        })),
        timestamp: new Date().toLocaleString('id-ID')
      });

      setHpsPrices(newHpsPrices);
      setHpsValue(totalHpsEstimate.toString());

      setSurveyProgressPercent(100);
      setIsSurveying(false);
      setTimeout(() => setSurveyProgressPercent(0), 1000);

      if (results && results.wasCanceled) {
        alert('⏹ Survei dihentikan oleh pengguna. Menyimpan data yang sudah berhasil diperoleh.');
      } else {
        alert('⚡ Sistem PBJ: Survei E-Katalog otomatis telah selesai! Bukti tautan dan gambar telah dilampirkan.');
      }

    } catch (err) {
      console.error(err);
      setIsSurveying(false);
      setSurveyProgress('');
      setSurveyProgressPercent(0);
      alert('Gagal melakukan survei E-Katalog: ' + err.message);
    }
  };

  const runSingleItemSurvey = async (productIndex, customQuery) => {
    if (!selectedPack || !surveyData) return;
    
    setLoadingProductIndex(productIndex);

    const items = getPackageItems(selectedPack);
    const targetItem = items[productIndex];
    if (!targetItem) {
      setLoadingProductIndex(null);
      return;
    }

    const requestItems = [{
      name: targetItem.name,
      query: customQuery,
      fallbackPrice: targetItem.price,
      explicitMinPrice: customMinPrices[productIndex] ? parseInt(customMinPrices[productIndex].toString().replace(/\D/g, ''), 10) : null,
      explicitMaxPrice: customMaxPrices[productIndex] ? parseInt(customMaxPrices[productIndex].toString().replace(/\D/g, ''), 10) : null,
      priceTolerance: globalPriceTolerance,
      targetVendor: customTargets[productIndex] || globalTargetVendor || '',
      targetUrl: (customTargets[productIndex] && customTargets[productIndex].startsWith('http')) ? customTargets[productIndex] : ''
    }];

    try {
      const response = await fetch('http://localhost:3001/api/survey/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          items: requestItems,
          useAi: useAiMode,
          locations: searchLocations.split(',').map(s => s.trim()).filter(Boolean),
          ignorePriceLimit: ignorePriceLimit,
          autoComparator: autoComparator
        })
      });

      if (!response.ok) {
        throw new Error('Gagal mengeksekusi survei kustom: ' + response.statusText);
      }

      const runRes = await response.json();
      if (!runRes.jobId) throw new Error('Tidak mendapatkan Job ID dari server');

      let results = null;
      while (true) {
        await new Promise(r => setTimeout(r, 1500)); // poll faster for single item
        
        const statusRes = await fetch(`http://localhost:3001/api/survey/status/${runRes.jobId}`);
        if (!statusRes.ok) throw new Error('Gagal mengecek status job');
        const statusData = await statusRes.json();

        if (statusData.status === 'completed') {
          results = statusData.results;
          break;
        } else if (statusData.status === 'failed') {
          throw new Error('Proses worker gagal: ' + statusData.error);
        }
      }
      const singleRes = results[0];

      if (singleRes) {
        const updatedProducts = [...surveyData.products];
        updatedProducts[productIndex] = {
          ...updatedProducts[productIndex],
          vendor: singleRes.vendor,
          price: singleRes.price,
          link: singleRes.link,
          img: singleRes.img,
          success: singleRes.success
        };
        const updatedData = { ...surveyData, products: updatedProducts };
        setSurveyData(updatedData);
        // Update di konteks global (jika ingin disimpan permanen)
        const matchedAcc = getMatchingDpaAccount(selectedPack);
        const kodeRekening = matchedAcc?.account || `nosirup_${selectedPack?.noSirup}`;
        const rincianItems = { ...dpaRincian };
        // Menyimpan status survey ke dpaRincian tidak sepenuhnya didukung struktur saat ini
        // Kita hanya akan mengandalkan surveyData global.
        
        if (singleRes.success) {
          setHpsPrices(prev => ({
            ...prev,
            [targetItem.name]: singleRes.price
          }));
        }
        
        if (singleRes.success) {
           alert(`✅ Berhasil! Produk "${singleRes.name}" ditemukan.`);
        } else {
           alert(`⚠️ Pencarian ulang selesai, namun barang tidak ditemukan di e-Katalog.`);
        }
      }
    } catch (err) {
      console.error('Single survey error:', err);
      alert('Gagal mencari ulang: ' + err.message);
    } finally {
      setLoadingProductIndex(null);
    }
  };

  const captureScreenshot = async (p) => {
    try {
      setScreenshotStatus(prev => ({ ...prev, [p.id]: 'loading' }));
      const response = await fetch('http://localhost:3001/api/survey/screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: p.link, id: p.id })
      });
      if (!response.ok) throw new Error('Gagal mengambil tangkapan layar');
      setScreenshotStatus(prev => ({ ...prev, [p.id]: 'done' }));
    } catch (err) {
      console.error(err);
      setScreenshotStatus(prev => ({ ...prev, [p.id]: 'error' }));
      alert(`Gagal tangkap layar untuk ${p.name}: ${err.message}`);
    }
  };

  const captureAllScreenshots = async () => {
    const activeData = surveyData;
    if (!activeData || !activeData.products) return;
    
    const toCapture = activeData.products.filter(p => p.success && p.vendor !== 'TIDAK DITEMUKAN' && screenshotStatus[p.id] !== 'done');
    
    if (toCapture.length === 0) {
      alert('Semua screenshot produk sudah tersedia atau tidak ada produk valid.');
      return;
    }

    for (const p of toCapture) {
      await captureScreenshot(p);
    }
  };

  const enhanceJustificationWithAI = async (productId, currentText) => {
    setIsEnhancingJustification(prev => ({ ...prev, [productId]: true }));
    try {
      const response = await fetch('/api/ai/enhance-justification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: currentText })
      });
      const data = await response.json();
      if (data.success) {
        setJustifications(prev => ({ ...prev, [productId]: data.result }));
      }
    } catch (err) {
      console.error('Enhance error:', err);
    } finally {
      setIsEnhancingJustification(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handleBatchCustomSearch = async () => {
    if (!selectedPack || !surveyData) return;
    
    const items = getPackageItems(selectedPack);
    const indicesToSearch = [];
    const requestItems = [];

    // Cari barang yang punya ketikan baru di customKeywords (baik sukses maupun gagal)
    surveyData.products.forEach((p, idx) => {
      if (customKeywords[idx] && customKeywords[idx].trim() !== '') {
        indicesToSearch.push(idx);
        requestItems.push({
          name: items[idx].name,
          query: customKeywords[idx].trim(),
          fallbackPrice: items[idx].price || items[idx].paguDpa,
          explicitMinPrice: customMinPrices[idx] ? parseInt(customMinPrices[idx].toString().replace(/\D/g, ''), 10) : null,
          explicitMaxPrice: customMaxPrices[idx] ? parseInt(customMaxPrices[idx].toString().replace(/\D/g, ''), 10) : null,
          priceTolerance: globalPriceTolerance,
          targetVendor: customTargets[idx] || globalTargetVendor || '',
          targetUrl: (customTargets[idx] && customTargets[idx].startsWith('http')) ? customTargets[idx] : ''
        });
      }
    });

    if (requestItems.length === 0) {
      alert("⚠️ Tidak ada barang yang diberi kata kunci baru. Ketikkan kata kuncinya dulu di kotak pencarian masing-masing barang!");
      return;
    }

    setIsSurveying(true);
    setSurveyProgressPercent(10);
    setSurveyProgress(`Mencari ulang ${requestItems.length} barang (Sesuai Filter Wilayah)...`);

    try {
      const response = await fetch('http://localhost:3001/api/survey/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           items: requestItems,
           useAi: false, // Matikan pencari sinonim untuk pencarian manual ini
           locations: searchLocations.split(',').map(s => s.trim()).filter(Boolean),
           ignorePriceLimit: ignorePriceLimit,
           autoComparator: autoComparator
        })
      });

      if (!response.ok) {
        throw new Error('Gagal mengeksekusi pencarian massal: ' + response.statusText);
      }

      const runRes = await response.json();
      if (!runRes.jobId) throw new Error('Tidak mendapatkan Job ID dari server');
      setCancelJobId(runRes.jobId);

      setSurveyProgress(`Mengantre di Worker (Job ID: ${runRes.jobId})...`);

      let results = null;
      while (true) {
        await new Promise(r => setTimeout(r, 2000));
        
        const statusRes = await fetch(`http://localhost:3001/api/survey/status/${runRes.jobId}`);
        if (!statusRes.ok) throw new Error('Gagal mengecek status job');
        const statusData = await statusRes.json();

        if (statusData.status === 'completed') {
          results = statusData.results;
          break;
        } else if (statusData.status === 'failed') {
          throw new Error('Proses worker gagal: ' + statusData.error);
        } else {
          setSurveyProgressPercent(statusData.progress || 10);
          setSurveyProgress(`Mencari ulang di latar belakang (${statusData.progress || 0}% selesai)...`);
        }
      }
      
      const updatedProducts = [...surveyData.products];
      const newHpsPrices = { ...hpsPrices };
      let successCount = 0;

      results.forEach((res, i) => {
        const originalIndex = indicesToSearch[i];
        const targetItem = items[originalIndex];

        updatedProducts[originalIndex] = {
          ...updatedProducts[originalIndex],
          vendor: res.vendor,
          price: res.price,
          link: res.link,
          img: res.img,
          searchImg: res.searchImg,
          success: res.success
        };
        if (res.success) {
          successCount++;
        }
        newHpsPrices[targetItem.name] = res.price;

        // Auto-Comparator Capture
        if (autoComparator && res.comparators && res.comparators.length > 0) {
          const comp = res.comparators[0];
          setComparisons(prev => {
            const newComps = { ...prev };
            newComps['ITEM-' + originalIndex] = {
              vendor: comp.vendor,
              name: comp.name,
              price: comp.price,
              status: comp.status,
              link: comp.link,
              alasan: comp.alasan,
              isAuto: true
            };
            
            if (res.comparators.length > 1) {
              const comp2 = res.comparators[1];
              newComps['ITEM-' + originalIndex + '-2'] = {
                vendor: comp2.vendor,
                name: comp2.name,
                price: comp2.price,
                status: comp2.status,
                link: comp2.link,
                alasan: comp2.alasan,
                isAuto: true
              };
            }
            return newComps;
          });
        }
      });

      const updatedSurveyData = {
        ...surveyData,
        products: updatedProducts,
        timestamp: new Date().toLocaleString('id-ID')
      };
      setSurveyData(updatedSurveyData);
      setHpsPrices(newHpsPrices);

      const totalHpsEstimate = items.reduce((sum, item) => {
        const price = newHpsPrices[item.name] !== undefined ? newHpsPrices[item.name] : item.price;
        return sum + (item.qty * price);
      }, 0);
      setHpsValue(totalHpsEstimate.toString());

      setSurveyProgressPercent(100);
      setIsSurveying(false);
      setTimeout(() => setSurveyProgressPercent(0), 1000);
      
      alert(`✅ Berhasil mencari ulang! ${successCount} dari ${requestItems.length} barang ditemukan.`);
      
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat pencarian massal: ' + err.message);
      setIsSurveying(false);
      setSurveyProgressPercent(0);
    }
  };



  return (
    <>
      {/* Step 3: HPS Formulation & Technical Specification */}
          <div className={`bg-white border border-slate-200 rounded-2xl p-8 shadow-sm transition-all duration-300 ${step < 3 ? 'opacity-50 pointer-events-none' : 'animate-slide-up'}`}>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center shrink-0">
                  <span className="text-slate-700 text-xs font-bold">3</span>
                </div>
                <h2 className="text-base font-bold text-slate-900">Penetapan Nilai HPS &amp; Spesifikasi Teknis</h2>
              </div>
              <span className="px-3 py-1 text-[10px] rounded-full bg-slate-100 border border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">Langkah 3</span>
            </div>

            {selectedPack && (
              <div className="mb-6 bg-slate-50 border border-slate-200 rounded-xl p-5 text-sm space-y-2">
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Paket Terpilih</div>
                <div className="text-slate-900 font-semibold">{selectedPack?.packName}</div>
                <div className="grid grid-cols-2 gap-3 mt-2 text-xs text-slate-500">
                  <div>Instansi: <span className="text-slate-700 font-medium">{selectedPack.klpd} ({selectedPack.satker})</span></div>
                  <div>Kode MAK: <span className="text-slate-700 font-mono font-medium">{selectedPack.mak}</span></div>
                  <div>Volume: <span className="text-slate-700 font-medium">{selectedPack.volume}</span></div>
                  <div>Spesifikasi: <span className="text-slate-700 font-medium">{selectedPack.spesifikasi}</span></div>
                </div>
              </div>
            )}

            {selectedPack && (() => {
              const isPaguExempt = selectedPack.pagu <= 10000000;
              const isEPurchasing = selectedPack.method && (selectedPack.method || '').toLowerCase().includes('e-purchasing');
              const isDirectProcurement = selectedPack.method && (selectedPack.method || '').toLowerCase().includes('pengadaan langsung');
              const isExempt = isPaguExempt || isEPurchasing || isDirectProcurement;

              if (!isExempt) return null;

              return (
                <div className="mb-6 bg-slate-50 border border-slate-200 rounded-xl p-5 text-xs text-slate-700 space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                    Informasi Pengecualian HPS — Perpres 12/2021
                  </div>
                  <p className="leading-relaxed text-slate-600">
                    Dokumen HPS <strong className="text-slate-800">tidak wajib disusun</strong> untuk paket ini karena memenuhi kriteria pengecualian berikut:
                  </p>
                  <ul className="space-y-2 pl-0">
                    {[
                      { met: isPaguExempt, label: `Nilai pagu ≤ Rp10 Juta (Pagu: Rp ${selectedPack.pagu?.toLocaleString()})` },
                      { met: isEPurchasing, label: `Metode E-Purchasing / Katalog Elektronik (${selectedPack.method})` },
                      { met: isDirectProcurement, label: 'Metode Pengadaan Langsung (bukti pembelian/nota)' }
                    ].map(({ met, label }, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${met ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                        <span className={met ? 'text-slate-700' : 'text-slate-400'}>{label}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-3 border-t border-slate-200 flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isHpsExemptSelected}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setIsHpsExemptSelected(checked);
                          setIsSigned(false);
                          if (checked) {
                            const items = getPackageItems(selectedPack);
                            const newHpsPrices = {};
                            items.forEach(item => {
                                newHpsPrices[item.name] = item.price;
                            });
                            setHpsPrices(newHpsPrices);
                            setHpsValue(selectedPack.pagu.toString());
                            if (activeDocPreview === 'hps') {
                              setActiveDocPreview('dpp');
                            }
                          } else {
                            setHpsValue(selectedPack.pagu.toString());
                          }
                          if (step === 4) setStep(3);
                        }}
                        className="rounded border-slate-300 text-slate-800 focus:ring-slate-400 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs text-slate-700 font-semibold">
                        Nyatakan paket ini BEBAS HPS (Lewati Surat Penetapan HPS)
                      </span>
                    </label>
                  </div>
                </div>
              );
            })()}

            <div className="space-y-4">
              {/* Asisten AI Survei */}
              <div className="mb-6 bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                {/* Row 1: Title + Reset button */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">Asisten Survei HPS &amp; Referensi e-Katalog</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-lg">Gunakan AI untuk mencari referensi harga pasar dari e-Katalog secara otomatis. Bukti URL &amp; Screenshot akan dilampirkan di DPP.</p>
                  </div>
                </div>

                {/* Row 2: Loading bar (full width, only when surveying) */}
                {isSurveying && (
                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl shadow-sm flex items-center gap-4 animate-in fade-in zoom-in duration-300">
                    {/* wrapper overflow-hidden + scale untuk crop tepian kosong SVG */}
                    <div className="w-16 h-16 shrink-0 overflow-hidden flex items-center justify-center">
                      <img src="/img/pbj-loader-flip.svg?v=1" alt="Loading Survei" className="w-full h-full scale-[2]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-[11px] font-bold text-emerald-800 mb-2 px-1">
                        <span className="truncate pr-2">{surveyProgress}</span>
                        <span className="shrink-0">{surveyProgressPercent}%</span>
                      </div>
                      <div className="w-full bg-emerald-200 h-2.5 rounded-full overflow-hidden shadow-inner">
                        <div
                          className="bg-emerald-600 h-full rounded-full transition-all duration-300 ease-out relative"
                          style={{ width: `${surveyProgressPercent}%` }}
                        >
                          <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Row 3: Controls (toggles left, buttons right) */}
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="flex-1 space-y-3">
                    {/* Switch AI */}
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setUseAiMode(!useAiMode)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${useAiMode ? 'bg-emerald-500' : 'bg-slate-300'}`}
                      >
                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${useAiMode ? 'translate-x-5' : 'translate-x-1'}`} />
                      </button>
                      <span className="text-xs font-medium text-slate-700">
                        {useAiMode ? 'AI Aktif (Semantic & Fallback)' : 'AI Nonaktif (Exact Match Only)'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Switch Abaikan Harga */}
                      <div className="flex items-center gap-2 flex-1">
                        <button 
                          onClick={() => setIgnorePriceLimit(!ignorePriceLimit)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${ignorePriceLimit ? 'bg-rose-500' : 'bg-slate-300'}`}
                          title="Jika aktif, harga yang melebihi pagu DPA tidak akan ditolak oleh sistem."
                        >
                          <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${ignorePriceLimit ? 'translate-x-5' : 'translate-x-1'}`} />
                        </button>
                        <span className="text-xs font-medium text-slate-700" title="Abaikan batasan harga pagu">
                          Abaikan Max Harga
                        </span>
                      </div>

                      {/* Switch Mode Pembanding */}
                      <div className="flex items-center gap-2 flex-1">
                        <button 
                          onClick={() => setAutoComparator(!autoComparator)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${autoComparator ? 'bg-indigo-500' : 'bg-slate-300'}`}
                          title="Jika aktif, otomatis mengisi produk pembanding dari alternatif yang lebih mahal."
                        >
                          <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${autoComparator ? 'translate-x-5' : 'translate-x-1'}`} />
                        </button>
                        <span className="text-xs font-medium text-slate-700">
                          Auto Pembanding
                        </span>
                      </div>
                    </div>
                    {/* Input Multi Lokasi */}
                    <div>
                      <input 
                        type="text"
                        value={searchLocations}
                        onChange={(e) => setSearchLocations(e.target.value)}
                        placeholder="Wilayah (Contoh: Probolinggo)"
                        className="w-full text-[11px] px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none mb-2"
                      />
                      <input 
                        type="text"
                        value={globalTargetVendor}
                        onChange={(e) => setGlobalTargetVendor(e.target.value)}
                        placeholder="URL/Slug/Nama Penyedia (misal: https://katalog.inaproc.id/sultoni-wza2)"
                        className="w-full text-[11px] px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none mb-2"
                        title="Tempel URL halaman toko penyedia dari katalog.inaproc.id untuk hasil terbaik. Contoh: https://katalog.inaproc.id/sultoni-wza2. Atau cukup masukkan slug (sultoni-wza2) atau nama (SULTONI)."
                      />
                      <div className="flex items-center border border-slate-300 rounded-lg focus-within:ring-2 focus-within:ring-emerald-500 bg-white">
                        <span className="text-[11px] text-slate-500 pl-3">Toleransi Harga Survei (±)</span>
                        <input 
                          type="number"
                          step="0.1"
                          value={globalPriceTolerance}
                          onChange={(e) => setGlobalPriceTolerance(e.target.value)}
                          className="flex-1 text-[11px] px-2 py-2 focus:outline-none bg-transparent"
                        />
                        <span className="text-[11px] text-slate-500 pr-3">%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5 w-full sm:w-48">
                    {isSurveying ? (
                      <button
                        onClick={cancelSurvey}
                        className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-6 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-red-500/20 active:scale-95 animate-pulse w-full"
                      >
                        <span className="text-sm">⏹</span> Hentikan Survei
                      </button>
                    ) : (
                      <button
                        onClick={runAiSurvey}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold px-6 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 active:scale-95 w-full"
                      >
                        Mulai Survei Otomatis
                      </button>
                    )}
                    <button
                      onClick={handleBatchCustomSearch}
                      disabled={isSurveying || !surveyData}
                      className={`text-xs font-bold px-6 py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 w-full ${
                        surveyData && !isSurveying
                          ? 'bg-amber-500 hover:bg-amber-600 text-white'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                      title="Cari ulang semua barang yang sudah Anda ketikkan kata kunci barunya sekaligus"
                    >
                      🔍 Cari Ulang
                    </button>
                    {surveyData && (
                      <button
                        onClick={() => {
                          if (window.confirm('Apakah Anda yakin ingin mereset hasil survei ini? Semua referensi harga dan link e-Katalog yang tersimpan akan dihapus.')) {
                            setSurveyData(null);
                            setSurveyLogs([]);
                            setCustomMinPrices({});
                            setCustomMaxPrices({});
                            setHpsPrices({});
                            setComparisons({});
                            setScreenshotStatus({});
                            setExpandedSurveyRows({});
                            // Hapus juga dari localStorage agar tidak kembali saat direfresh
                            localStorage.removeItem('pbj_survey_data');
                            localStorage.removeItem('pbj_hps_prices');
                          }
                        }}
                        disabled={isSurveying}
                        className="text-[11px] font-bold px-6 py-2 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 transition-all flex items-center justify-center gap-1.5 active:scale-95 w-full"
                        title="Hapus semua hasil survei dan mulai ulang"
                      >
                        🔄 Reset Survei
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* KALKULATOR HPS INTERAKTIF */}
              {selectedPack && (
                <div className="bg-white border border-slate-250 shadow-xl shadow-slate-100/40 rounded-2xl p-6 space-y-4 transition-all duration-300">
                  <div className="flex justify-between items-center border-b border-slate-200/80 pb-3.5">
                    <div className="flex items-start gap-2.5">
                      <div className="bg-slate-100 p-2 rounded-xl border border-slate-200 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line></svg>
                      </div>
                      <div>
                        <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wide">
                          Kalkulator Harga Tayang E-Katalog Berbasis Survei Pasar
                        </h3>
                        <p className="text-[10.5px] text-slate-500 mt-0.5 font-sans leading-relaxed">
                          Sesuaikan harga satuan berdasarkan survei harga pasar riil terbaru di Kabupaten Probolinggo.
                        </p>
                      </div>
                    </div>
                    {(() => {
                      const items = getPackageItems(selectedPack)
                      const totalHps = items.reduce((sum, item) => {
                        const price = hpsPrices[item.name] !== undefined ? hpsPrices[item.name] : item.price
                        const qty = item.qty === '' ? 0 : (item.qty || 0);
                        return sum + (qty * price)
                      }, 0)
                      const totalPagu = selectedPack?.pagu || 0;
                      const exceeds = totalHps > totalPagu
                      return (
                        <div className="text-right">
                          <span className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${exceeds
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                            {exceeds ? (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose-600"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                                Melebihi Pagu DPA
                              </>
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                HPS Efisien & Valid
                              </>
                            )}
                          </span>
                        </div>
                      )
                    })()}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="text-slate-500 border-b border-slate-200 font-bold uppercase text-[9px] tracking-wider bg-slate-50/50">
                          <th className="py-2.5 px-3 w-8 text-center rounded-l-xl">No</th>
                          <th className="py-2.5 px-2">Nama Barang / Rincian DPA</th>
                          <th className="py-2.5 px-2">Referensi e-Katalog</th>
                          <th className="py-2.5 px-2 text-center w-12">Qty</th>
                          <th className="py-2.5 px-2 text-right">Pagu DPA (Rp)</th>
                          <th className="py-2.5 px-4 text-right w-44">Harga Tayang E-Katalog (Rp)</th>
                          <th className="py-2.5 px-3 text-right rounded-r-xl">Total Tayang E-Katalog (Rp)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const items = getPackageItems(selectedPack)
                          const activeData = getActiveSurveyData()
                          return items.map((item, idx) => {
                            const unitHpsPrice = hpsPrices[item.name] !== undefined ? hpsPrices[item.name] : item.price;
                            const qtyNum = item.qty === '' ? 0 : (item.qty || 0);
                            const totalHpsItem = qtyNum * unitHpsPrice;
                            const isOverbudget = totalHpsItem > (qtyNum * item.price);
                            const surveyItem = activeData?.products?.find(p => p.name === item.name);
                            const isRowExpanded = expandedSurveyRows[idx];
                            
                            // Logika untuk kartu survei
                            const p = surveyItem;
                            const isFailed = p ? (!p.success || p.vendor === 'TIDAK DITEMUKAN') : false;
                            const keyword = customKeywords[idx] !== undefined ? customKeywords[idx] : (p ? p.name : item.name);
                            const isLoading = loadingProductIndex === idx;

                            return (
                              <React.Fragment key={item.no || idx}>
                              <tr className={`border-b border-slate-100 hover:bg-slate-50/60 transition-colors ${isOverbudget ? 'bg-rose-50/50' : ''}`}>
                                <td className="py-3 px-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                                <td className="py-3 px-2 text-slate-800">
                                  <div className="font-bold">{item.name}</div>
                                  <span className="text-[10px] text-slate-450 block font-normal mt-0.5 mb-2">Satuan: {item.unit}</span>
                                  
                                  {/* Input Parameter Teknis Produk */}
                                  <div className="flex flex-col gap-1 mt-1.5 max-w-xs">
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Parameter Teknis / Spesifikasi Mutu:</span>
                                    <div className="flex gap-1.5 items-center">
                                      <textarea
                                        value={item.spesifikasi || ''}
                                        onChange={(e) => {
                                          const matchedAcc = getMatchingDpaAccount(selectedPack);
                                          const kodeRekening = matchedAcc?.account || `nosirup_${selectedPack?.noSirup}`;
                                          if (kodeRekening && dpaRincian[kodeRekening]) {
                                            const newRincian = { ...dpaRincian };
                                            const newArr = [...newRincian[kodeRekening]];
                                            newArr[idx] = { ...newArr[idx], spesifikasi: e.target.value };
                                            newRincian[kodeRekening] = newArr;
                                            setDpaRincian(newRincian);
                                            setIsSigned(false);
                                          }
                                        }}
                                        placeholder="Contoh: Ukuran 0.8 mm, tinta hitam, nyaman digenggam..."
                                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[10px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-y min-h-[36px]"
                                      />
                                      <button
                                        type="button"
                                        disabled={aiLoadingSpecIndex === idx}
                                        onClick={() => handleAiSpecAssist(item, idx)}
                                        className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-850 font-bold border border-indigo-200 rounded text-[9px] flex items-center gap-1 transition-all h-fit self-end shrink-0"
                                        title="Dapatkan rekomendasi spesifikasi dari AI"
                                      >
                                        {aiLoadingSpecIndex === idx ? '⏳' : '✨'} AI Bantu
                                      </button>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-2">
                                  {surveyItem && surveyItem.success && surveyItem.vendor !== 'TIDAK DITEMUKAN' ? (
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-[10px] font-bold text-slate-700 truncate max-w-[150px]" title={surveyItem.vendor}>🏪 {surveyItem.vendor}</span>
                                      {(() => {
                                        const location = surveyItem.location || surveyItem.location_name || surveyItem.address || '';
                                        const cleanStr = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
                                        const isOutside = location && searchLocations && !searchLocations.split(',').some(loc => {
                                          const cleanLoc = cleanStr(loc);
                                          const cleanLocation = cleanStr(location);
                                          return cleanLocation.includes(cleanLoc) || cleanLoc.includes(cleanLocation);
                                        });
                                        if (isOutside) {
                                          return (
                                            <span className="text-[8px] font-bold text-rose-700 bg-rose-50 px-1 py-0.5 rounded border border-rose-200 w-fit mt-0.5" title={`Produk ditemukan di ${location}, di luar target wilayah: ${searchLocations}`}>
                                              📍 Luar Wilayah ({location})
                                            </span>
                                          );
                                        } else if (location) {
                                          return (
                                            <span className="text-[8px] text-slate-500 font-medium mt-0.5">
                                              📍 {location}
                                            </span>
                                          );
                                        }
                                        return null;
                                      })()}
                                      <a href={surveyItem.link} target="_blank" rel="noopener noreferrer" className="text-[9px] text-indigo-600 hover:text-indigo-800 underline">Tautan Produk</a>
                                      {surveyItem.isFallbackScreenshot && (
                                        <span className="text-[8px] font-bold text-amber-600 bg-amber-50 px-1 py-0.5 rounded border border-amber-200 w-fit mt-0.5" title="Menggunakan screenshot hasil pencarian karena halaman detail error/diblokir">⚠️ Mode Pencarian</span>
                                      )}
                                    </div>
                                  ) : surveyItem ? (
                                    <div className="flex flex-col gap-1 max-w-[150px]">
                                      <span className="text-[9px] text-rose-700 font-bold bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded w-fit">❌ Tidak Ditemukan</span>
                                      <span className="text-[9px] text-rose-500 font-semibold leading-tight block">Wajib atur Qty menjadi 0 agar dikecualikan dari paket</span>
                                    </div>
                                  ) : (
                                    <span className="text-[9px] text-slate-400 italic bg-slate-100 px-1.5 py-0.5 rounded">Belum disurvei</span>
                                  )}
                                  {surveyItem && (
                                    <button 
                                      type="button" 
                                      onClick={() => setExpandedSurveyRows(prev => ({...prev, [idx]: !prev[idx]}))}
                                      className="mt-1.5 text-[9px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
                                    >
                                      {isRowExpanded ? '🔼 Tutup Detail' : '🔽 Lihat Detail Survei'}
                                    </button>
                                  )}
                                </td>
                                <td className="py-3 px-2 text-center font-bold text-slate-700">
                                  <input
                                    type="number"
                                    value={item.qty === undefined ? '' : item.qty}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      const newQty = val === '' ? '' : Math.max(0, parseInt(val) || 0);
                                      const matchedAcc = getMatchingDpaAccount(selectedPack);
                                      const kodeRekening = matchedAcc?.account || `nosirup_${selectedPack?.noSirup}`;
                                      if (kodeRekening && dpaRincian[kodeRekening]) {
                                        const newRincian = { ...dpaRincian };
                                        const newArr = [...newRincian[kodeRekening]];
                                        newArr[idx] = { ...newArr[idx], volume: newQty };
                                        newRincian[kodeRekening] = newArr;
                                        setDpaRincian(newRincian);
                                        setIsSigned(false);
                                      }
                                    }}
                                    className="w-16 mx-auto bg-slate-50 border border-slate-200 text-slate-800 rounded-lg py-1 px-2 text-xs font-bold text-center focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                    min="0"
                                    title="Ketik 0 jika item ini tidak jadi dipesan di paket ini"
                                  />
                                </td>
                                <td className={`py-3 px-2 text-right font-mono transition-colors ${unitHpsPrice !== item.price ? 'text-slate-400' : 'text-slate-500'}`}>
                                  Rp&nbsp;{(item.price || 0).toLocaleString()}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <div className="relative inline-block w-full">
                                    <span className={`absolute left-3 top-1/2 -translate-y-1/2 font-bold text-[10px] ${isOverbudget ? 'text-rose-500' : (unitHpsPrice < item.price ? 'text-emerald-500' : 'text-slate-400')}`}>Rp</span>
                                    <input
                                      type="number"
                                      value={unitHpsPrice}
                                      onChange={(e) => {
                                        const newPrice = parseFloat(e.target.value) || 0;
                                        setHpsPrices(prev => ({
                                          ...prev,
                                          [item.name]: newPrice
                                        }));
                                        setIsSigned(false);
                                        if (step === 4) setStep(3);
                                      }}
                                      className={`w-full bg-slate-50 border rounded-xl py-1.5 pl-8 pr-3 text-xs font-mono font-bold text-right focus:ring-2 outline-none transition-all ${isOverbudget ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200 text-rose-700 bg-rose-50/50' : (unitHpsPrice < item.price ? 'border-emerald-200 focus:border-emerald-400 focus:ring-emerald-100 text-emerald-700 bg-emerald-50/40' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-150 text-slate-800')}`}
                                    />
                                  </div>
                                  {isOverbudget && <div className="text-[9px] font-bold text-rose-500 text-right mt-1 animate-pulse">⚠️ Melebihi Pagu</div>}
                                </td>
                                <td className={`py-3 px-3 text-right font-mono font-bold transition-colors ${isOverbudget ? 'text-rose-600' : (unitHpsPrice < item.price ? 'text-emerald-600' : 'text-indigo-650')}`}>
                                  Rp&nbsp;{totalHpsItem.toLocaleString()}
                                </td>
                              </tr>
                              
                              {/* EXPANDED ACCORDION ROW */}
                              {isRowExpanded && surveyItem && (
                                <tr>
                                  <td colSpan="7" className="p-0 border-b border-slate-100">
                                    <div className="bg-slate-50/80 p-4 border-l-4 border-l-indigo-400 shadow-inner">
                                      <div className="flex flex-col lg:flex-row gap-6">
                                        
                                        {/* Bagian Kiri: Status & Justifikasi */}
                                        <div className="flex-1 space-y-4">
                                          <div className="flex items-center gap-3">
                                            {isFailed ? (
                                              <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wide bg-slate-200/50 px-2 py-1 rounded">
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Tidak Ditemukan
                                              </span>
                                            ) : (
                                              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-wide bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Ditemukan
                                              </span>
                                            )}
                                            
                                            {!isFailed && (
                                              <div className="text-indigo-650 font-mono font-extrabold text-sm flex items-baseline gap-0.5">
                                                <span className="text-[10px] font-bold">Rp</span> {(p.price || 0).toLocaleString('id-ID')}
                                              </div>
                                            )}
                                          </div>
                                          
                                          {!isFailed && (
                                            <div className="space-y-3">
                                              <div>
                                                <div className="flex items-center justify-between mb-1">
                                                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">📝 Justifikasi Pemilihan</label>
                                                  <button
                                                    type="button"
                                                    onClick={() => enhanceJustificationWithAI(p.id, justifications[p.id] || '')}
                                                    disabled={isEnhancingJustification[p.id]}
                                                    className="text-[9px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded border border-indigo-200 transition-colors flex items-center gap-1 disabled:opacity-50"
                                                  >
                                                    {isEnhancingJustification[p.id] ? '✨ Merapikan...' : '✨ Rapikan Bahasa (AI)'}
                                                  </button>
                                                </div>
                                                <textarea
                                                  value={justifications[p.id] || ''}
                                                  onChange={(e) => setJustifications({...justifications, [p.id]: e.target.value})}
                                                  placeholder="Ketik alasan singkat, misal: 'barang rusak bisa dikembalikan' lalu klik tombol AI di atas..."
                                                  className={`w-full px-3 py-2 bg-white border rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 min-h-[60px] resize-y transition-colors ${isEnhancingJustification[p.id] ? 'border-indigo-400 ring-1 ring-indigo-400 bg-indigo-50/30' : 'border-slate-300 focus:ring-indigo-500'}`}
                                                  disabled={isEnhancingJustification[p.id]}
                                                />
                                                <div className="flex gap-2 mt-2">
                                                  <button
                                                    type="button"
                                                    onClick={() => setJustifications({ ...justifications, [p.id]: "Penyedia ini dipilih karena mampu menyediakan mayoritas (>80%) dari total item barang yang dibutuhkan, sehingga sangat mengefisienkan biaya pengiriman, mempermudah administrasi kontrak, dan memastikan seluruh barang tiba dalam satu waktu." })}
                                                    className="text-[9px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded border border-blue-200 transition-colors"
                                                  >
                                                    💡 Template: Satu Pintu (&gt;80%)
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      const currentJustification = justifications[p.id] || '';
                                                      if (!currentJustification.trim()) {
                                                        alert('Isi justifikasi terlebih dahulu sebelum diterapkan ke semua barang!');
                                                        return;
                                                      }
                                                      const newJustifications = { ...justifications };
                                                      activeData.products.forEach(prod => {
                                                        newJustifications[prod.id] = currentJustification;
                                                      });
                                                      setJustifications(newJustifications);
                                                    }}
                                                    className="text-[9px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded border border-emerald-200 transition-colors"
                                                  >
                                                    ✨ Terapkan ke Seluruh Barang
                                                  </button>
                                                </div>
                                              </div>
                                              
                                              <div className="pt-2 border-t border-slate-200">
                                                { (screenshotStatus[p.id] === 'done' || (p.img && p.img.includes('/screenshots/'))) ? (
                                                  <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-1.5 bg-emerald-50 w-fit px-3 py-1.5 rounded-lg border border-emerald-200">
                                                    ✅ Screenshot Tersimpan
                                                  </div>
                                                ) : screenshotStatus[p.id] === 'loading' ? (
                                                  <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
                                                    ⏳ Menyimpan Screenshot...
                                                  </div>
                                                ) : (
                                                  <button
                                                    onClick={() => captureScreenshot(p)}
                                                    className="text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                                                  >
                                                    📸 Sepakati & Ambil Screenshot
                                                  </button>
                                                )}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                        
                                        {/* Bagian Kanan: Edit Keyword & Produk Pembanding */}
                                        <div className="flex-1 space-y-4">
                                          <div className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-sm">
                                            <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                                              🔍 Sesuaikan Pencarian Ulang
                                            </h4>
                                            <div className="space-y-2.5">
                                              <div>
                                                <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Kata Kunci Pencarian</label>
                                                <div className="flex gap-1.5">
                                                  <input
                                                    type="text"
                                                    value={keyword}
                                                    onChange={(e) => setCustomKeywords({ ...customKeywords, [idx]: e.target.value })}
                                                    placeholder="Contoh: Laptop i5"
                                                    className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] focus:ring-1 focus:ring-indigo-500"
                                                    disabled={isLoading}
                                                  />
                                                  <button
                                                    type="button"
                                                    onClick={() => runSingleItemSurvey(idx, keyword)}
                                                    disabled={isLoading || !keyword.trim()}
                                                    className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] transition-all"
                                                  >
                                                    {isLoading ? '...' : 'Cari'}
                                                  </button>
                                                </div>
                                              </div>
                                              <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                  <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Target Penyedia (Opsional)</label>
                                                  <input
                                                    type="text"
                                                    value={customTargets[idx] || ''}
                                                    onChange={(e) => setCustomTargets({ ...customTargets, [idx]: e.target.value })}
                                                    placeholder="Nama Toko"
                                                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] focus:ring-1 focus:ring-indigo-500"
                                                    disabled={isLoading}
                                                  />
                                                </div>
                                                <div className="flex gap-2">
                                                  <div className="flex-1">
                                                    <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Harga Minimal (Opsional)</label>
                                                    <input
                                                      type="number"
                                                      value={customMinPrices[idx] || ''}
                                                      onChange={(e) => setCustomMinPrices({ ...customMinPrices, [idx]: e.target.value })}
                                                      placeholder={`> ${(p.price || p.paguDpa) * 0.5}`}
                                                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] focus:ring-1 focus:ring-indigo-500"
                                                      disabled={isLoading}
                                                    />
                                                  </div>
                                                  <div className="flex-1">
                                                    <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Harga Maksimal (Opsional)</label>
                                                    <input
                                                      type="number"
                                                      value={customMaxPrices[idx] || ''}
                                                      onChange={(e) => setCustomMaxPrices({ ...customMaxPrices, [idx]: e.target.value })}
                                                      placeholder={`< ${p.price || p.paguDpa}`}
                                                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] focus:ring-1 focus:ring-indigo-500"
                                                      disabled={isLoading}
                                                    />
                                                  </div>
                                                </div>
                                              </div>
                                              
                                              {/* Spesifikasi Mutu untuk DPA raw item */}
                                              <div className="mt-3">
                                                <label className="block text-[9px] font-bold text-slate-500 mb-0.5">📝 Spesifikasi Komposisi / Mutu (KAK)</label>
                                                <textarea
                                                  value={dppSpecs?.itemSpecs?.[p.id || idx] || ''}
                                                  onChange={(e) => setDppSpecs({...dppSpecs, itemSpecs: {...(dppSpecs.itemSpecs || {}), [p.id || idx]: e.target.value}})}
                                                  placeholder="Misal: Snack box isi 3 macam kue (manis & asin), air mineral kemasan gelas..."
                                                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[40px] resize-y"
                                                />
                                              </div>
                                            </div>
                                          </div>

                                          {!isFailed && (
                                            <div className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-sm">
                                              <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                ⚖️ Produk Pembanding
                                              </h4>
                                              <div className="space-y-2">
                                                <input 
                                                  type="text" placeholder="Nama Produk Pembanding" 
                                                  value={(comparisons[p.id] && comparisons[p.id].name) || ''}
                                                  onChange={(e) => setComparisons({...comparisons, [p.id]: {...(comparisons[p.id]||{}), name: e.target.value}})}
                                                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px]"
                                                />
                                                <div className="flex gap-2">
                                                  <input 
                                                    type="text" placeholder="Penyedia Pembanding" 
                                                    value={(comparisons[p.id] && comparisons[p.id].vendor) || ''}
                                                    onChange={(e) => setComparisons({...comparisons, [p.id]: {...(comparisons[p.id]||{}), vendor: e.target.value}})}
                                                    className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px]"
                                                  />
                                                  <select 
                                                    value={(comparisons[p.id] && comparisons[p.id].status) || 'Luar Katalog'}
                                                    onChange={(e) => setComparisons({...comparisons, [p.id]: {...(comparisons[p.id]||{}), status: e.target.value}})}
                                                    className="w-1/3 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px]"
                                                  >
                                                    <option value="Luar Katalog">Luar Katalog</option>
                                                    <option value="Toko Daring">Toko Daring</option>
                                                    <option value="E-Katalog">E-Katalog</option>
                                                  </select>
                                                </div>
                                              </div>
                                              <div className="mt-3 pt-3 border-t border-slate-100">
                                                <h5 className="text-[9px] font-semibold text-slate-500 mb-2 uppercase tracking-wider">Atribut Evaluasi Tambahan (Tampil di Cetak)</h5>
                                                <div className="grid grid-cols-2 gap-2">
                                                  <input 
                                                    type="text" placeholder="Lokasi Dapur/Toko" 
                                                    value={(comparisons[p.id] && comparisons[p.id].lokasi) || ''}
                                                    onChange={(e) => setComparisons({...comparisons, [p.id]: {...(comparisons[p.id]||{}), lokasi: e.target.value}})}
                                                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[9px]"
                                                  />
                                                  <input 
                                                    type="text" placeholder="Jarak & Waktu Tempuh" 
                                                    value={(comparisons[p.id] && comparisons[p.id].jarak) || ''}
                                                    onChange={(e) => setComparisons({...comparisons, [p.id]: {...(comparisons[p.id]||{}), jarak: e.target.value}})}
                                                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[9px]"
                                                  />
                                                  <input 
                                                    type="text" placeholder="Status TKDN" 
                                                    value={(comparisons[p.id] && comparisons[p.id].tkdn) || ''}
                                                    onChange={(e) => setComparisons({...comparisons, [p.id]: {...(comparisons[p.id]||{}), tkdn: e.target.value}})}
                                                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[9px]"
                                                  />
                                                  <input 
                                                    type="text" placeholder="Spesifikasi / Link" 
                                                    value={(comparisons[p.id] && comparisons[p.id].spesifikasi) || ''}
                                                    onChange={(e) => setComparisons({...comparisons, [p.id]: {...(comparisons[p.id]||{}), spesifikasi: e.target.value}})}
                                                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[9px]"
                                                  />
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                        
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                              </React.Fragment>
                            )
                          })
                        })()}
                      </tbody>
                    </table>
                  </div>

                  {(() => {
                    const items = getPackageItems(selectedPack)
                    const totalHps = items.reduce((sum, item) => {
                      const price = hpsPrices[item.name] !== undefined ? hpsPrices[item.name] : item.price
                      return sum + (item.qty * price)
                    }, 0)
                    const totalPagu = selectedPack?.pagu || 0;
                    return (
                      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center pt-4 border-t border-slate-200 text-xs">
                        <div className="text-slate-500 font-medium">
                          Total Pagu DPA: <span className="font-bold font-mono text-slate-850 bg-slate-100 px-2 py-1 rounded-lg">Rp&nbsp;{totalPagu.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-3.5">
                          <span className="text-slate-600 font-semibold">Hasil Kalkulasi HPS:</span>
                          <span className="text-sm font-bold font-mono text-slate-900 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">Rp&nbsp;{totalHps.toLocaleString()}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setHpsValue(totalHps.toString())
                              alert(`✅ Nilai HPS Resmi disetujui sebesar Rp ${totalHps.toLocaleString()} (Hasil kalkulasi survei pasar).`)
                            }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-semibold px-4 py-2 rounded-xl transition-all text-[11px] active:scale-95 flex items-center gap-1"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                            Gunakan Sebagai HPS Resmi
                          </button>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}

              {surveyData && (
                <div className="mb-6 bg-slate-50/50 p-5 rounded-2xl border border-slate-200/80">
                  <div className="text-xs font-bold text-slate-800 mb-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-slate-900">
                      <span>📊</span> Referensi Hasil Survei e-Katalog (Kategori: {surveyData.category})
                    </div>
                    <div className="flex items-center gap-2 self-start">
                      <button
                        onClick={captureAllScreenshots}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold px-3 py-1 rounded shadow-sm transition-all flex items-center gap-1 active:scale-95"
                        title="Ambil tangkapan layar untuk semua produk yang ditemukan"
                      >
                        📸 Ambil Semua Screenshot
                      </button>
                      <div className="text-[10px] text-slate-500 font-mono font-medium bg-slate-100 px-2 py-0.5 rounded">
                        Terakhir diupdate: {surveyData.timestamp}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 overflow-x-auto pb-3 pt-1">
                    {surveyData.products.map((p, idx) => {
                      const isFailed = !p.success || p.vendor === 'TIDAK DITEMUKAN';
                      const keyword = customKeywords[idx] !== undefined ? customKeywords[idx] : p.name;
                      const isLoading = loadingProductIndex === idx;
                      const isEditing = expandedEditCardIndex === idx || isFailed;

                      return (
                        <div 
                          key={p.id} 
                          className={`relative flex flex-col justify-between p-4 rounded-xl min-w-[300px] max-w-[300px] transition-all duration-300 border ${
                            isLoading ? 'animate-pulse opacity-75 border-slate-200 bg-slate-50/50' :
                            isFailed ? 'border-slate-200 bg-slate-50' :
                            'bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300'
                          }`}
                        >
                          <div>
                            <div className="font-bold text-slate-800 text-[11px] leading-snug line-clamp-2 min-h-[32px]">
                              {p.name}
                            </div>
                            
                            <div className="mt-2.5 flex items-center justify-between gap-2">
                              {isFailed ? (
                                <span className="flex items-center gap-1 text-[9px] font-semibold text-slate-500 uppercase tracking-wide">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Tidak Ditemukan
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-[9px] font-semibold text-emerald-600 uppercase tracking-wide">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Ditemukan
                                </span>
                              )}
                              {!isFailed && (
                                <button
                                  type="button"
                                  onClick={() => setExpandedEditCardIndex(isEditing ? null : idx)}
                                  className="text-slate-400 hover:text-indigo-650 font-bold text-[9px] underline transition-colors flex items-center gap-0.5"
                                  title="Ubah kata kunci pencarian"
                                >
                                  ✏️ Ubah
                                </button>
                              )}
                            </div>

                            <div className="mt-3.5 space-y-1">
                              {isFailed ? (
                                <div className="text-[10px] text-slate-500 italic bg-rose-50 border border-rose-100/60 p-2 rounded-xl leading-relaxed">
                                  Barang tidak ditemukan di e-Katalog dengan kata kunci default. Silakan cari ulang dengan kata kunci kustom di bawah.
                                </div>
                              ) : (
                                <>
                                  <div className="text-indigo-650 font-mono font-extrabold text-sm flex items-baseline gap-0.5">
                                    <span className="text-[10px] font-bold">Rp</span> {(p.price || 0).toLocaleString('id-ID')}
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-medium truncate flex items-center gap-1">
                                    <span>🏪</span> <span className="truncate" title={p.vendor}>{p.vendor}</span>
                                  </div>
                                  <div className="text-[9px] text-indigo-600 hover:text-indigo-700 underline truncate pt-0.5">
                                    <a href={p.link} target="_blank" rel="noopener noreferrer">🌐 Lihat di e-Katalog</a>
                                  </div>
                                  
                                  <div className="mt-2 pt-2 border-t border-slate-100">
                                    { (screenshotStatus[p.id] === 'done' || (p.img && p.img.includes('/screenshots/'))) ? (
                                      <div className="text-[9px] font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 w-fit px-2 py-1 rounded">
                                        ✅ Screenshot Tersimpan
                                      </div>
                                    ) : screenshotStatus[p.id] === 'loading' ? (
                                      <div className="text-[9px] font-bold text-slate-500 flex items-center gap-1">
                                        ⏳ Menyimpan...
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => captureScreenshot(p)}
                                        className="text-[9px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-2.5 py-1.5 rounded transition-colors flex items-center gap-1 w-full justify-center"
                                      >
                                        📸 Sepakati & Ambil Screenshot
                                      </button>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          {isEditing && (
                            <div className="mt-4 pt-3 border-t border-dashed border-slate-200 space-y-3">
                              <div>
                                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Kata Kunci Pencarian</label>
                              <div className="flex gap-1.5">
                                <input
                                  type="text"
                                  value={keyword}
                                  onChange={(e) => setCustomKeywords({ ...customKeywords, [idx]: e.target.value })}
                                  placeholder="Contoh: Laptop i5"
                                  className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                  disabled={isLoading}
                                />
                                <button
                                  type="button"
                                  onClick={() => runSingleItemSurvey(idx, keyword)}
                                  disabled={isLoading || !keyword.trim()}
                                  className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white font-semibold px-3 py-1.5 rounded-lg text-[9px] transition-all flex items-center gap-1 active:scale-95 shrink-0"
                                >
                                  {isLoading ? '...' : 'Cari'}
                                </button>
                              </div>
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Target Penyedia / URL e-Katalog (Opsional)</label>
                                <input
                                  type="text"
                                  value={customTargets[idx] || ''}
                                  onChange={(e) => setCustomTargets({ ...customTargets, [idx]: e.target.value })}
                                  placeholder="Contoh: CV Maju Jaya ATAU https://katalog.inaproc.id/..."
                                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                  disabled={isLoading}
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Harga Minimal (Opsional)</label>
                                <input
                                  type="number"
                                  value={customMinPrices[idx] || ''}
                                  onChange={(e) => setCustomMinPrices({ ...customMinPrices, [idx]: e.target.value })}
                                  placeholder={`> ${(p.price || p.paguDpa) * 0.5}`}
                                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] focus:ring-1 focus:ring-indigo-500"
                                  disabled={isLoading}
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Harga Maksimal (Opsional)</label>
                                <input
                                  type="number"
                                  value={customMaxPrices[idx] || ''}
                                  onChange={(e) => setCustomMaxPrices({ ...customMaxPrices, [idx]: e.target.value })}
                                  placeholder={`< ${p.price || p.paguDpa}`}
                                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] focus:ring-1 focus:ring-indigo-500"
                                  disabled={isLoading}
                                />
                              </div>
                            </div>
                          )}

                          {/* NEW: Spesifikasi Mutu & Justifikasi & Pembanding */}
                          {!isFailed && (
                            <div className="mt-4 pt-3 border-t border-dashed border-slate-200 space-y-3">
                              <div>
                                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">📝 Spesifikasi Komposisi / Mutu (KAK)</label>
                                <textarea
                                  value={dppSpecs?.itemSpecs?.[p.id] || ''}
                                  onChange={(e) => setDppSpecs({...dppSpecs, itemSpecs: {...(dppSpecs.itemSpecs || {}), [p.id]: e.target.value}})}
                                  placeholder="Misal: Snack box isi 3 macam kue (manis & asin), air mineral kemasan gelas..."
                                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[40px] resize-y"
                                />
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">📝 Justifikasi Pemilihan</label>
                                  <button
                                    type="button"
                                    onClick={() => enhanceJustificationWithAI(p.id, justifications[p.id] || '')}
                                    disabled={isEnhancingJustification[p.id]}
                                    className="text-[9px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded border border-indigo-200 transition-colors flex items-center gap-1 disabled:opacity-50"
                                    title="Gunakan AI untuk merapikan kalimat ini menjadi bahasa formal PBJ"
                                  >
                                    {isEnhancingJustification[p.id] ? '✨ Merapikan...' : '✨ Rapikan Bahasa (AI)'}
                                  </button>
                                </div>
                                <textarea
                                  value={justifications[p.id] || ''}
                                  onChange={(e) => setJustifications({...justifications, [p.id]: e.target.value})}
                                  placeholder="Ketik alasan singkat, misal: 'barang rusak bisa dikembalikan' lalu klik tombol AI di atas..."
                                  className={`w-full px-2.5 py-1.5 bg-slate-50 border rounded-lg text-[10px] text-slate-800 focus:outline-none focus:ring-1 min-h-[40px] resize-y transition-colors ${isEnhancingJustification[p.id] ? 'border-indigo-400 ring-1 ring-indigo-400 bg-indigo-50/30' : 'border-slate-200 focus:ring-indigo-500'}`}
                                  disabled={isEnhancingJustification[p.id]}
                                />
                                <div className="flex flex-col gap-1.5 mt-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setJustifications({ ...justifications, [p.id]: "Penyedia ini dipilih karena mampu menyediakan mayoritas (>80%) dari total item barang yang dibutuhkan, sehingga sangat mengefisienkan biaya pengiriman, mempermudah administrasi kontrak, dan memastikan seluruh barang tiba dalam satu waktu." });
                                    }}
                                    className="text-[9px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded w-full text-center transition-colors border border-blue-200"
                                  >
                                    💡 Template Alasan: Satu Pintu (&gt;80%)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const currentJustification = justifications[p.id] || '';
                                      if (!currentJustification.trim()) {
                                        alert('Isi justifikasi terlebih dahulu sebelum diterapkan ke semua barang!');
                                        return;
                                      }
                                      const newJustifications = { ...justifications };
                                      surveyData.products.forEach(prod => {
                                        newJustifications[prod.id] = currentJustification;
                                      });
                                      setJustifications(newJustifications);
                                    }}
                                    className="text-[9px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded w-full text-center transition-colors border border-emerald-200"
                                  >
                                    ✨ Terapkan Alasan ini ke Seluruh Barang
                                  </button>
                                </div>
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">⚖️ Produk Pembanding</label>
                                <div className="space-y-1.5 p-2 bg-slate-50/80 rounded-lg border border-slate-200/60">
                                  <input 
                                    type="text" placeholder="Nama Produk Pembanding" 
                                    value={(comparisons[p.id] && comparisons[p.id].name) || ''}
                                    onChange={(e) => setComparisons({...comparisons, [p.id]: {...(comparisons[p.id]||{}), name: e.target.value}})}
                                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[9px]"
                                  />
                                  <input 
                                    type="text" placeholder="Penyedia Pembanding" 
                                    value={(comparisons[p.id] && comparisons[p.id].vendor) || ''}
                                    onChange={(e) => setComparisons({...comparisons, [p.id]: {...(comparisons[p.id]||{}), vendor: e.target.value}})}
                                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[9px]"
                                  />
                                  <div className="flex gap-1.5">
                                    <select 
                                      value={(comparisons[p.id] && comparisons[p.id].status) || 'Luar Katalog'}
                                      onChange={(e) => setComparisons({...comparisons, [p.id]: {...(comparisons[p.id]||{}), status: e.target.value}})}
                                      className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded text-[9px] text-slate-700"
                                    >
                                      <option value="Luar Katalog">Luar Katalog</option>
                                      <option value="Dalam Katalog">Dalam Katalog</option>
                                    </select>
                                    <input 
                                      type="number" placeholder="Harga (Rp)" 
                                      value={(comparisons[p.id] && comparisons[p.id].price) || ''}
                                      onChange={(e) => setComparisons({...comparisons, [p.id]: {...(comparisons[p.id]||{}), price: e.target.value}})}
                                      className="w-20 px-2 py-1 bg-white border border-slate-200 rounded text-[9px]"
                                    />
                                  </div>
                                  <div className="mt-2 pt-2 border-t border-slate-200/50">
                                    <div className="grid grid-cols-2 gap-1.5">
                                      <input 
                                        type="text" placeholder="Lokasi Dapur/Toko" 
                                        value={(comparisons[p.id] && comparisons[p.id].lokasi) || ''}
                                        onChange={(e) => setComparisons({...comparisons, [p.id]: {...(comparisons[p.id]||{}), lokasi: e.target.value}})}
                                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[9px]"
                                      />
                                      <input 
                                        type="text" placeholder="Jarak & Waktu Tempuh" 
                                        value={(comparisons[p.id] && comparisons[p.id].jarak) || ''}
                                        onChange={(e) => setComparisons({...comparisons, [p.id]: {...(comparisons[p.id]||{}), jarak: e.target.value}})}
                                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[9px]"
                                      />
                                      <input 
                                        type="text" placeholder="Status TKDN" 
                                        value={(comparisons[p.id] && comparisons[p.id].tkdn) || ''}
                                        onChange={(e) => setComparisons({...comparisons, [p.id]: {...(comparisons[p.id]||{}), tkdn: e.target.value}})}
                                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[9px]"
                                      />
                                      <input 
                                        type="text" placeholder="Spesifikasi Fisik" 
                                        value={(comparisons[p.id] && comparisons[p.id].spesifikasi) || ''}
                                        onChange={(e) => setComparisons({...comparisons, [p.id]: {...(comparisons[p.id]||{}), spesifikasi: e.target.value}})}
                                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[9px]"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 md:p-7 shadow-sm">
                <div className="font-bold text-slate-800 text-sm mb-4 border-b border-slate-200 pb-2">Pengaturan Dokumen Persiapan (Dinamis)</div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-2 uppercase tracking-wider">Spesifikasi Waktu Pelaksanaan</label>
                    <input
                      type="text"
                      className="glass-input text-xs font-semibold"
                      value={dppSpecs.waktu}
                      onChange={(e) => setDppSpecs({...dppSpecs, waktu: e.target.value})}
                      placeholder="14 (Empat Belas) hari kalender"
                      disabled={isSigned}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-2 uppercase tracking-wider">Tempat Tujuan Akhir Pengiriman</label>
                    <input
                      type="text"
                      className="glass-input text-xs font-semibold"
                      value={dppSpecs.tempat}
                      onChange={(e) => setDppSpecs({...dppSpecs, tempat: e.target.value})}
                      placeholder="Kantor Kecamatan Besuk"
                      disabled={isSigned}
                    />
                  </div>
                </div>

                


                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 border-t border-slate-200 pt-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-2 uppercase tracking-wider">Unggah Gambar TTD PPK</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleTtdUpload(e, 'ppk')}
                        className="text-xs w-full text-slate-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                        disabled={isSigned}
                      />
                      {docSettings.ttdPpk && <div className="text-emerald-600 text-xs font-bold">✓ Tersimpan</div>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-2 uppercase tracking-wider">Unggah Gambar TTD Pejabat Pengadaan</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleTtdUpload(e, 'pp')}
                        className="text-xs w-full text-slate-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                        disabled={isSigned}
                      />
                      {docSettings.ttdPp && <div className="text-emerald-600 text-xs font-bold">✓ Tersimpan</div>}
                    </div>
                  </div>
                </div>
              </div>


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
                      <input type="text" value={packageMetadata.sub_kegiatan || ''} onChange={(e) => setPackageMetadata({...packageMetadata, sub_kegiatan: e.target.value})} placeholder="Nama Sub Kegiatan" className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">MAK / Kode Rekening</label>
                      <input type="text" value={packageMetadata.mak || ''} onChange={(e) => setPackageMetadata({...packageMetadata, mak: e.target.value})} placeholder="Misal: 5.1.02.01.01.0026" className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tahun Anggaran</label>
                      <input type="text" value={packageMetadata.tahun_anggaran || ''} onChange={(e) => setPackageMetadata({...packageMetadata, tahun_anggaran: e.target.value})} placeholder="Misal: 2026" className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none transition-colors" />
                    </div>
                  </div>

                  
                    
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
                          <select
                      value={selectedNdTplId}
                      onChange={(e) => {
                        setSelectedNdTplId(e.target.value);
                        const packId = selectedPack.id || selectedPack.noSirup;
                        localStorage.setItem(`pbj_selected_nd_template_${packId}`, e.target.value);
                        setIsSigned(false); 
                        if (step === 4) setStep(3);
                      }}
                      className="glass-input text-xs font-semibold bg-white text-slate-800 w-full p-2.5 border border-slate-200 rounded-xl shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                      disabled={isSigned}
                    >
                      {(() => {
                        const templatesStr = localStorage.getItem('pbj_templates');
                        let templates = [];
                        try { if (templatesStr) templates = JSON.parse(templatesStr); } catch (ex) {}
                        
                        if (templates.length === 0) {
                          return <option value="" disabled>Belum ada template tersimpan di sistem</option>;
                        }

                        const ndTemplates = templates.filter(t => 
                          (t.name || '').toLowerCase().includes('nota dinas') || 
                          (t.name || '').toLowerCase().includes('usulan pengadaan')
                        );
                        
                        const otherTemplates = templates.filter(t => !ndTemplates.includes(t));

                        return (
                          <>
                            <option value="">-- Pilih Template Nota Dinas --</option>
                            {ndTemplates.length > 0 && (
                              <optgroup label="Rekomendasi (Nota Dinas)">
                                {ndTemplates.map(t => (
                                  <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                              </optgroup>
                            )}
                            {otherTemplates.length > 0 && (
                              <optgroup label="Template Lainnya (Manual)">
                                {otherTemplates.map(t => (
                                  <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                              </optgroup>
                            )}
                          </>
                        );
                      })()}
                    </select>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Template Dokumen Persiapan (DPP)</label>
                          <select
                      value={selectedTplId}
                      onChange={(e) => {
                        const newTplId = e.target.value;
                        setSelectedTplId(newTplId);
                        const packId = selectedPack.id || selectedPack.noSirup;
                        localStorage.setItem(`pbj_selected_template_${packId}`, newTplId);
                        
                        // AUTO-FILL dppSpecs based on Template Category
                        const isMamin = newTplId === 'TPL-006B';
                        const isAtk = newTplId === 'TPL-006A';
                        const isModal = newTplId === 'TPL-006C';
                        const isPemeliharaan = newTplId === 'TPL-006F';
                        const isKonstruksi = newTplId === 'TPL-006G';
                        
                        let autoLatarBelakang = dppSpecs?.latarBelakang || '';
                        let autoMaksudTujuan = dppSpecs?.maksudTujuan || '';
                        let autoWaktu = packageMetadata.waktu_penyelesaian || '14 (empat belas) hari kalender';
                        
                        const satkerName = currentUser?.department || 'Pemerintah Kabupaten Probolinggo';
                        if (isMamin) {
                          autoLatarBelakang = `Dalam rangka mendukung pelaksanaan kegiatan operasional, rapat, dan/atau sosialisasi di lingkungan ${satkerName}, diperlukan penyediaan Makanan dan Minuman yang higienis dan memadai guna mendukung kelancaran pelaksanaan pada kegiatan ${packageMetadata.sub_kegiatan || selectedPack?.packName || 'tersebut'}.`;
                          autoMaksudTujuan = `1. Memenuhi kebutuhan konsumsi peserta kegiatan secara tepat waktu dan higienis.\n2. Mendukung kelancaran dan kesuksesan pelaksanaan acara secara keseluruhan di lingkungan ${satkerName}.`;
                          autoWaktu = '1 (Satu) hari kalender (atau sesuai jadwal pelaksanaan acara)';
                        } else if (isAtk) {
                          autoLatarBelakang = `Guna menunjang kelancaran administrasi dan operasional perkantoran sehari-hari di lingkungan ${satkerName}, sangat dibutuhkan ketersediaan Alat Tulis Kantor (ATK) dan/atau bahan habis pakai yang memadai, khususnya untuk menunjang kegiatan ${packageMetadata.sub_kegiatan || selectedPack?.packName || 'tersebut'}.`;
                          autoMaksudTujuan = `1. Memenuhi kebutuhan dasar administrasi perkantoran di lingkungan ${satkerName}.\n2. Memastikan tidak ada kendala kelangkaan material logistik dalam memberikan pelayanan publik secara prima.`;
                          autoWaktu = '14 (empat belas) hari kalender';
                        } else if (isModal) {
                          autoLatarBelakang = `Seiring dengan tuntutan kebutuhan modernisasi, digitalisasi, dan upaya peningkatan kinerja aparatur di lingkungan ${satkerName}, diperlukan dukungan penyediaan peralatan/aset/teknologi yang handal dan memadai untuk operasional kerja pada kegiatan ${packageMetadata.sub_kegiatan || selectedPack?.packName || 'tersebut'}.`;
                          autoMaksudTujuan = `1. Meningkatkan efisiensi kerja dan kinerja pegawai melalui dukungan peralatan teknologi modern.\n2. Memenuhi standar kelayakan sarana dan prasarana minimal perangkat daerah pada ${satkerName}.`;
                          autoWaktu = '30 (Tiga puluh) hari kalender';
                        } else if (isPemeliharaan) {
                          autoLatarBelakang = `Dalam rangka menjaga keandalan, keawetan, dan kinerja optimal dari aset/sarana/prasarana di lingkungan ${satkerName}, sangat diperlukan pelaksanaan pemeliharaan secara rutin dan berkala guna mendukung kelancaran operasional pada kegiatan ${packageMetadata.sub_kegiatan || selectedPack?.packName || 'tersebut'}.`;
                          autoMaksudTujuan = `1. Memastikan seluruh sarana dan prasarana kantor selalu dalam kondisi siap pakai.\n2. Mencegah kerusakan fatal (breakdown) serta memperpanjang usia pakai aset milik ${satkerName}.`;
                          autoWaktu = '365 (Tiga ratus enam puluh lima) hari kalender';
                        } else if (isKonstruksi) {
                          autoLatarBelakang = `Untuk memenuhi kebutuhan prasarana fisik, rehabilitasi bangunan, dan/atau peningkatan kapasitas fasilitas kerja yang representatif di lingkungan ${satkerName}, diperlukan pekerjaan pelaksanaan konstruksi fisik yang memenuhi standar teknis, kekuatan, dan keselamatan pada kegiatan ${packageMetadata.sub_kegiatan || selectedPack?.packName || 'tersebut'}.`;
                          autoMaksudTujuan = `1. Mewujudkan bangunan/fasilitas fisik yang kokoh, aman, dan fungsional sesuai gambar rencana.\n2. Menyediakan sarana kerja fisik yang memadai guna menunjang pelayanan publik di lingkungan ${satkerName}.`;
                          autoWaktu = '90 (Sembilan puluh) hari kalender';
                        }
                        
                        setDppSpecs({
                          ...dppSpecs,
                          latarBelakang: autoLatarBelakang,
                          maksudTujuan: autoMaksudTujuan,
                          waktu: autoWaktu
                        });
                        
                        setIsSigned(false); 
                        if (step === 4) setStep(3);
                      }}
                      className="glass-input text-xs font-semibold bg-white text-slate-800 w-full p-2.5 border border-slate-200 rounded-xl shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                      disabled={isSigned}
                    >
                      {(() => {
                        const templatesStr = localStorage.getItem('pbj_templates');
                        let templates = [];
                        try { if (templatesStr) templates = JSON.parse(templatesStr); } catch (ex) {}
                        
                        if (templates.length === 0) {
                          return <option value="" disabled>Belum ada template tersimpan di sistem</option>;
                        }

                        const dppTemplates = templates.filter(t => 
                          t.category === 'Tahap Persiapan' || 
                          t.id.startsWith('TPL-006') || 
                          (t.name || '').toLowerCase().includes('persiapan') || 
                          (t.name || '').toLowerCase().includes('dpp')
                        );
                        
                        const otherTemplates = templates.filter(t => !dppTemplates.includes(t));

                        return (
                          <>
                            <option value="">-- Pilih Template Dokumen --</option>
                            {dppTemplates.length > 0 && (
                              <optgroup label="Rekomendasi (Tahap Persiapan)">
                                {dppTemplates.map(t => (
                                  <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                              </optgroup>
                            )}
                            {otherTemplates.length > 0 && (
                              <optgroup label="Template Lainnya (Manual)">
                                {otherTemplates.map(t => (
                                  <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                              </optgroup>
                            )}
                          </>
                        );
                      })()}
                    </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                        <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Nomor Nota Dinas</label>
                          <input type="text" value={packageMetadata.nomor_nd || ''} onChange={(e) => setPackageMetadata({...packageMetadata, nomor_nd: e.target.value})} placeholder="Opsional (Kosongi jika otomatis)" className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none transition-colors" />
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Nomor DPP</label>
                          <input type="text" value={packageMetadata.nomor_dpp || ''} onChange={(e) => setPackageMetadata({...packageMetadata, nomor_dpp: e.target.value})} placeholder="Opsional (Kosongi jika otomatis)" className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none transition-colors" />
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Tanggal Surat</label>
                          <input type="date" value={tanggalSurat} onChange={(e) => setTanggalSurat(e.target.value)} className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none transition-colors" />
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

                  <div className="border-t border-slate-200/60 pt-4 mt-2">
                    {isSigned ? (
                      <div className="flex items-center justify-between bg-white border border-slate-200 p-5 rounded-xl animate-fade-in">
                        <div className="flex items-center gap-3">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                          <div>
                            <div className="text-xs font-semibold text-slate-800">Persiapan Selesai</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{currentUser.name} · NIP {currentUser.nip}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setIsSigned(false)
                            setStep(3)
                          }}
                          className="text-xs text-slate-400 hover:text-rose-600 font-semibold transition-colors"
                        >
                          Batal Selesai
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 border border-slate-200 p-5 rounded-xl">
                        <div className="text-xs text-slate-500 max-w-md leading-relaxed">
                          Selesaikan persiapan dokumen untuk mengirim berkas pengadaan.
                        </div>
                        <button
                          onClick={() => {
                            setIsSigned(true)
                            setStep(4)
                          }}
                          disabled={isOverBudget}
                          className={`text-white text-xs font-semibold px-5 py-3 rounded-xl flex items-center gap-2 transition-all ${isOverBudget ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-500 hover:bg-indigo-600'}`}
                        >
                          Sahkan Dokumen (TTE)
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              onClick={() => handleSimpanPaket(false)}
              disabled={isUpdating}
              className="bg-white border-2 border-slate-200 hover:border-indigo-500 text-slate-700 hover:text-indigo-600 px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 pointer-events-auto shadow-sm"
            >
              💾 Simpan Paket
            </button>
            <button
              onClick={() => {
                if (confirm('Anda yakin ingin menyerahkan dan mengunci dokumen ini untuk PP?')) {
                  const finalizedItems = getPackageItems(selectedPack).map((item, idx) => {
                    const unitHpsPrice = hpsPrices[item.name] !== undefined ? hpsPrices[item.name] : item.price;
                    const surveyProduct = surveyData?.products?.find(p => p.name === item.name);
                    return {
                      ...item,
                      name: surveyProduct?.name || item.name,
                      price: unitHpsPrice
                    };
                  });
                  
                  const dppType = getPacketCategory(selectedPack?.packName || '');
                  
                  updateRincian(selectedPack.id, {
                    items: finalizedItems,
                    totalHps: parseInt(hpsValue || 0),
                    status: 'Diserahkan ke PP',
                    isLocked: true,
                    isHpsExempt: isHpsExemptSelected,
                    hpsExemptReason: '',
                    dppType: dppType
                  });
                  setStep(1);
                  alert('Paket berhasil diserahkan ke Pejabat Pengadaan.');
                }
              }}
              disabled={!isSigned || isOverBudget}
              className={`text-white px-6 py-3 rounded-xl font-bold transition-all pointer-events-auto flex items-center gap-2 ${!isSigned || isOverBudget ? 'bg-slate-400 cursor-not-allowed opacity-50' : 'bg-emerald-600 hover:bg-emerald-700'}`}
            >
              Serahkan ke Pejabat Pengadaan →
            </button>
          </div>
          
          <DocPreviewModal 
            isHpsExemptSelected={isHpsExemptSelected} 
            comparisons={comparisons}
            justifications={justifications}
            autoComparator={autoComparator}
          />
    </>
  );
}