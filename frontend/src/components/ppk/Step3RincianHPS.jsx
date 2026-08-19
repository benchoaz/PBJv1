import React, { useState, useEffect } from 'react';
import { usePPK } from './PPKContext';
import { DEFAULT_TEMPLATES } from '../../utils/defaultTemplates';
import { Save, Search, RefreshCw, Camera, Sparkles, CheckCircle2, XCircle, AlertTriangle, Loader2, Check, FileText, ClipboardList, Edit3, Store, Globe, LayoutGrid } from 'lucide-react';
import { dialog } from '../../utils/dialog';

const getDynamicProductLink = (vendorName, keyword) => {
  if (!vendorName) return '';
  const cleanVendor = vendorName.trim();
  
  if (cleanVendor.includes('katalog.inaproc.id/')) {
    try {
      const fullUrl = cleanVendor.startsWith('http') ? cleanVendor : 'https://' + cleanVendor;
      const urlObj = new URL(fullUrl);
      const pathSegments = urlObj.pathname.split('/').filter(Boolean);
      // Jika memiliki 2 segmen atau lebih (contoh: /musaropa/gulaku-gula) dan bukan /search, kembalikan URL produk langsung!
      if (pathSegments.length >= 2 && !urlObj.pathname.startsWith('/search') && !urlObj.search.includes('catalogueSearch')) {
        return fullUrl;
      }
      const vendorSlug = pathSegments[0] ? pathSegments[0].toLowerCase() : '';
      const q = keyword || '';
      return `https://katalog.inaproc.id/${vendorSlug}?catalogueSearch=${encodeURIComponent(q)}`;
    } catch (e) {
      // ignore
    }
  }
  
  let vendorSlug = '';
  if (/^[a-z0-9][a-z0-9-]*[a-z0-9]$/i.test(cleanVendor) && cleanVendor.includes('-')) {
    vendorSlug = cleanVendor.toLowerCase();
  } else {
    vendorSlug = cleanVendor.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }
  
  const q = keyword || '';
  return `https://katalog.inaproc.id/${vendorSlug}?catalogueSearch=${encodeURIComponent(q)}`;
};

export default function Step3RincianHPS() {
  const DAFTAR_KECAMATAN = [
    "Bantaran", "Banyuanyar", "Besuk", "Dringu", "Gading", "Gending", "Kotaanyar", 
    "Kraksaan", "Krucil", "Kuripan", "Leces", "Lumbang", "Maron", 
    "Paiton", "Pajarakan", "Pakuniran", "Sukapura", "Sumber", "Sumberasih", 
    "Tegalsiwalan", "Tiris", "Tongas", "Wonomerto"
  ];
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
    tanggalSurat, setTanggalSurat, getPackageItems,
    comparisons, setComparisons,
    justifications, setJustifications,
    autoComparator, setAutoComparator
  } = usePPK();
  const [isAiEditorOpen, setIsAiEditorOpen] = useState(true);
  const [aiLoadingField, setAiLoadingField] = useState(null);
  const [globalMaxProviders, setGlobalMaxProviders] = useState(3);
  
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
  const [screenshotStatus, setScreenshotStatus] = useState({});
  const [isEnhancingJustification, setIsEnhancingJustification] = useState({});
  const [isSurveying, setIsSurveying] = useState(false);
  const [surveyProgress, setSurveyProgress] = useState('');
  const [surveyProgressPercent, setSurveyProgressPercent] = useState(0);
  const [vendorLocationMap, setVendorLocationMap] = useState({});
  const [rakAccounts, setRakAccounts] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1); // 1-12

  // Backward compatibility: saat surveyData dimuat dari context (sesi sebelumnya),
  // inisialisasi screenshotStatus dari p.img yang sudah ada.
  // Ini memastikan produk yang sudah punya screenshot lama tetap menampilkan 'done'.
  useEffect(() => {
    if (surveyData && surveyData.products) {
      setScreenshotStatus(prev => {
        const initialized = { ...prev };
        let changed = false;
        surveyData.products.forEach(p => {
          // Hanya inisialisasi jika status belum diset sama sekali (undefined)
          // dan produk memang sudah punya gambar screenshot valid
          if (prev[p.id] === undefined && p.img && p.img.includes('/screenshots/')) {
            initialized[p.id] = 'done';
            changed = true;
          }
        });
        return changed ? initialized : prev;
      });
    }
  }, [surveyData]);

  useEffect(() => {
    const fetchRAK = async () => {
      try {
        const idSatker = currentUser?.idSatker || satkerId || '67081'; 
        const res = await fetch(`/api/rak/accounts?satker_id=${idSatker}&tahun=${new Date().getFullYear()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.has_rka) {
            setRakAccounts(data.accounts || []);
          }
        }
      } catch (err) {
        console.error('Failed to fetch RAK:', err);
      }
    };
    fetchRAK();
    const interval = setInterval(fetchRAK, 5000);
    return () => clearInterval(interval);
  }, [currentUser, satkerId]);

  useEffect(() => {
    fetch('/api/vendor-locations')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const mapping = {};
          data.forEach(item => {
            if (item.vendor_name) {
              mapping[item.vendor_name.toUpperCase().trim()] = item.subdistrict;
            }
          });
          setVendorLocationMap(mapping);
        }
      })
      .catch(err => console.error("Error fetching vendor locations:", err));
  }, []);

  useEffect(() => {
    if (selectedPack) {
      const items = getPackageItems(selectedPack);
      const totalHps = items.reduce((sum, item) => {
        const price = hpsPrices[item.name] !== undefined ? hpsPrices[item.name] : item.price;
        const qty = item.qty === '' ? 0 : (item.qty || 0);
        return sum + (qty * price);
      }, 0);
      setHpsValue(totalHps.toString());
    }
  }, [hpsPrices, selectedPack, dpaRincian, getPackageItems, setHpsValue]);

  const handleUpdateVendorLocation = async (vendorName, subdistrict) => {
    if (!vendorName || vendorName === 'TIDAK DITEMUKAN' || vendorName === 'PENYEDIA INAPROC') return;
    try {
      const response = await fetch('/api/vendor-locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendor_name: vendorName, subdistrict: subdistrict })
      });
      if (response.ok) {
        setVendorLocationMap(prev => ({
          ...prev,
          [vendorName.toUpperCase().trim()]: subdistrict
        }));
      }
    } catch (e) {
      console.error("Error saving vendor location:", e);
    }
  };

  const getAutoJustificationText = (isMamin, targetVendor, targetPrice, targetLoc, compVendor, compPrice, compLoc, userSubdistrict) => {
    const formatPrice = (p) => {
      const num = parseFloat(p);
      return isNaN(num) ? '0' : num.toLocaleString('id-ID');
    };
    
    const cleanStr = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanTargetLoc = cleanStr(targetLoc);
    
    let targetIsZone1 = false;
    let targetIsZone2 = false;

    // Determine Target Location Label
    let targetLocLabel = targetLoc || 'Kab. Probolinggo';
    if (targetLoc) {
      if (userSubdistrict && cleanTargetLoc.includes(cleanStr(userSubdistrict))) {
        targetLocLabel = `${targetLoc} (Zona 1: Kec. Sama)`;
        targetIsZone1 = true;
      } else {
        const DAFTAR_KECAMATAN = [
          "Bantaran", "Banyuanyar", "Besuk", "Dringu", "Gading", "Gending", "Kotaanyar", 
          "Kraksaan", "Krucil", "Kuripan", "Leces", "Lumbang", "Maron", 
          "Paiton", "Pajarakan", "Pakuniran", "Sukapura", "Sumber", "Sumberasih", 
          "Tegalsiwalan", "Tiris", "Tongas", "Wonomerto"
        ];
        const isKec = DAFTAR_KECAMATAN.some(kec => cleanTargetLoc.includes(cleanStr(kec)));
        if (isKec) {
          targetLocLabel = `${targetLoc} (Zona 2: Luar Kecamatan)`;
          targetIsZone2 = true;
        }
      }
    }

    const tPrice = parseFloat(targetPrice) || 0;
    const cPrice = parseFloat(compPrice) || 0;
    const diff = cPrice - tPrice;
    const diffText = diff > 0 ? `dengan selisih penghematan Rp ${formatPrice(diff)} per unit` : '';

    // If there is NO comparator or comparator price is 0
    if (!compVendor || cPrice === 0) {
      if (isMamin) {
        return `Pemilihan penyedia ${targetVendor || 'Kandidat Produk Potensial'} (Rp ${formatPrice(tPrice)}) didasarkan pada kesesuaian harga tayang e-Katalog. Berdasarkan prinsip pengadaan yang efektif dan efisien, pemilihan ini didukung oleh aspek logistik penyedia yang berlokasi di ${targetLocLabel}. Lokasi yang strategis mengefisienkan waktu pengiriman Mamin agar terjamin kesegarannya (Food Safety) serta selaras dengan aspek pemberdayaan usaha lokal.`;
      }
      return `Pemilihan penyedia ${targetVendor || 'Kandidat Produk Potensial'} (Rp ${formatPrice(tPrice)}) didasarkan pada kesesuaian spesifikasi teknis dan harga tayang e-Katalog. Dari sisi lokasi, penyedia berlokasi di ${targetLocLabel} yang sangat mendukung koordinasi operasional dan mempermudah proses serah terima barang.`;
    }

    if (diff > 0) {
      // Target is cheaper
      if (isMamin) {
         return `Pemilihan penyedia ${targetVendor || 'Kandidat Produk Potensial'} (Rp ${formatPrice(tPrice)}) ditetapkan karena memberikan harga tayang e-Katalog yang lebih efisien dibandingkan ${compVendor} (Rp ${formatPrice(cPrice)}) ${diffText}. Selain pertimbangan ekonomis, dari aspek teknis dan logistik, lokasi penyedia di ${targetLocLabel} memastikan kecepatan waktu pengiriman sehingga kualitas dan kesegaran Mamin tetap terjaga. Hal ini sangat selaras dengan prinsip pengadaan yang efektif, efisien, dan pro-usaha lokal.`;
      } else {
         return `Pemilihan penyedia ${targetVendor || 'Kandidat Produk Potensial'} (Rp ${formatPrice(tPrice)}) ditetapkan karena menawarkan harga e-Katalog yang lebih efisien dibandingkan referensi lain yaitu ${compVendor} (Rp ${formatPrice(cPrice)}) ${diffText}. Keputusan ini mengacu pada prinsip Pengadaan Barang/Jasa yang efektif dan efisien. Ditunjang oleh lokasi penyedia di ${targetLocLabel}, proses koordinasi logistik dan percepatan serah terima fisik barang dapat dilakukan dengan optimal.`;
      }
    } else if (diff === 0) {
      // Prices are identical
      if (isMamin) {
         return `Berdasarkan survei e-Katalog, penyedia ${targetVendor || 'Kandidat Produk'} dan referensi ${compVendor} menawarkan harga yang sama persis yaitu Rp ${formatPrice(tPrice)}. Mengacu pada pedoman Pengadaan Barang/Jasa terkait kondisi penawaran harga yang sama, pemilihan ${targetVendor || 'Kandidat Produk'} diprioritaskan berdasarkan pertimbangan mitigasi risiko pengiriman dan jaminan kesegaran produk (Food Safety). Penyedia berlokasi di ${targetLocLabel} yang dinilai paling efisien secara jarak, waktu, dan sangat mendukung kebijakan pemberdayaan penyedia lokal setempat.`;
      } else {
         return `Berdasarkan hasil survei e-Katalog, penyedia ${targetVendor || 'Kandidat Produk'} dan referensi ${compVendor} menawarkan harga yang identik yaitu Rp ${formatPrice(tPrice)}. Sesuai dengan kaidah Pengadaan Barang/Jasa Pemerintah (Perpres 16/2018 jo Perpres 12/2021), apabila terdapat penawaran harga yang sama, evaluasi dilanjutkan dengan memprioritaskan capaian Tingkat Komponen Dalam Negeri (TKDN), kapasitas dan kesiapan stok penyedia, serta rekam jejak kinerja. Berdasarkan pertimbangan tersebut serta efisiensi jarak logistik di ${targetLocLabel}, maka ${targetVendor || 'Kandidat Produk'} dinilai memberikan keuntungan teknis terbaik.`;
      }
    } else {
      // Target is more expensive (diff < 0)
      if (isMamin) {
         return `Meskipun terdapat referensi dari ${compVendor} dengan penawaran lebih rendah (Rp ${formatPrice(cPrice)}), pemilihan penyedia ${targetVendor || 'Kandidat Produk'} (Rp ${formatPrice(tPrice)}) tetap ditetapkan dengan mendasarkan pada prinsip *Best Value for Money* dan manajemen risiko teknis logistik pengiriman Mamin. Penyedia berlokasi di ${targetLocLabel} yang menjamin kecepatan pengiriman untuk meminimalisir risiko keterlambatan konsumsi dan memastikan makanan/minuman tidak basi. Nilai efisiensi teknis ini dinilai sepadan dengan selisih harga tersebut.`;
      } else {
         return `Meskipun terdapat referensi ${compVendor} dengan harga yang secara nominal lebih rendah (Rp ${formatPrice(cPrice)}), pemilihan ${targetVendor || 'Kandidat Produk'} (Rp ${formatPrice(tPrice)}) ditetapkan berdasarkan prinsip *Best Value for Money* (Nilai Manfaat Uang). Pemilihan ini telah memperhitungkan secara komprehensif berbagai aspek teknis seperti kualitas barang, purna jual, pemenuhan kriteria Tingkat Komponen Dalam Negeri (TKDN), serta keandalan rekam jejak penyedia. Selain itu, kedekatan penyedia di ${targetLocLabel} signifikan mengurangi risiko operasional dan kendala distribusi barang.`;
      }
    }
  };

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
      dialog.error('Gagal menghasilkan spesifikasi otomatis: ' + e.message);
    } finally {
      setAiLoadingSpecIndex(null);
    }
  };

  const [useAiMode, setUseAiMode] = useState(true);
  const [globalPriceTolerance, setGlobalPriceTolerance] = useState(8);
  const [globalTargetVendor, setGlobalTargetVendor] = useState('');
  const [searchLocations, setSearchLocations] = useState('Kab. Probolinggo');
  const [customKeywords, setCustomKeywords] = useState({});
  
  const [ignorePriceLimit, setIgnorePriceLimit] = useState(false);

  const handleTtdUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64data = event.target.result;
      const newSettings = {
        ...docSettings,
        [type === 'ppk' ? 'ttdPpk' : 'ttdPp']: base64data
      };
      setDocSettings(newSettings);
      localStorage.setItem('pbj_doc_settings', JSON.stringify(newSettings));
      
      // Save to backend immediately so it survives cache clears
      const effectiveSatkerId = currentUser?.idSatker || (currentUser?.department ? currentUser.department.replace(/\s+/g, '_').toLowerCase() : '67081');
      if (effectiveSatkerId) {
        fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: `doc_settings_satker_${effectiveSatkerId}`, value: JSON.stringify(newSettings) })
        }).catch(err => console.error('Failed to save signature to backend', err));
      }
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
      let templates = DEFAULT_TEMPLATES;
      const templatesStr = localStorage.getItem('pbj_templates');
      if (templatesStr) {
        try { 
          const parsed = JSON.parse(templatesStr); 
          if (parsed && parsed.length > 0) templates = parsed;
        } catch (e) {}
      }
      const tpl = templates.find(t => t.id === selectedTplId);
      if (tpl) templateName = tpl.name || '';
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
      defSpek = "Kandidat penyedia yang direkomendasikan merupakan penyedia pelaksana Katalog Konsolidasi potensial. Pengiriman dilakukan sesuai permintaan parsial/sekaligus dan tidak diperkenankan ada tambahan ongkos kirim/biaya lainnya di luar yang tertera dalam e-Katalog.";
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
    const hasKonsolidasi = /konsolidasi/i.test(clean);
    clean = clean.replace(/\(.*?\)/g, '');
    if (hasKonsolidasi && !clean.toLowerCase().includes('konsolidasi')) {
      clean += ' konsolidasi';
    }
    return clean.replace(/\s+/g, ' ').trim();
  };

  const getAnggaranTersedia = () => {
    if (!selectedPack || rakAccounts.length === 0) return selectedPack?.pagu || 0;
    const matchedAcc = getMatchingDpaAccount(selectedPack);
    const kodeRekening = matchedAcc?.account;
    if (!kodeRekening) return selectedPack?.pagu || 0;
    
    const targetSub = (packageMetadata?.sub_kegiatan || '').trim().toLowerCase();
    const rakAcc = rakAccounts.find(acc => {
      if (acc.kode_rekening !== kodeRekening) return false;
      const accSub = (acc.sub_kegiatan || '').toLowerCase();
      return accSub.includes(targetSub) || targetSub.includes(accSub);
    });
    if (!rakAcc) return selectedPack?.pagu || 0;

    const months = ['bulan_jan','bulan_feb','bulan_mar','bulan_apr','bulan_mei','bulan_jun','bulan_jul','bulan_ags','bulan_sep','bulan_okt','bulan_nov','bulan_des'];
    
    // Hitung akhir dari Triwulan saat ini (1-3 -> 3, 4-6 -> 6, 7-9 -> 9, 10-12 -> 12)
    const currentTriwulanEndMonth = Math.ceil(currentMonth / 3) * 3;
    
    return months.slice(0, currentTriwulanEndMonth).reduce((sum, m) => sum + (rakAcc[m] || 0), 0);
  };

  const anggaranTersedia = getAnggaranTersedia();
  const isOverBudget = !isHpsExemptSelected && anggaranTersedia > 0 && parseInt(hpsValue || 0) > anggaranTersedia;
  const cancelSurvey = () => setIsSurveying(false);

  const fetchGeminiKeyHelper = async () => {
    let geminiKey = '';
    try {
      const satker = satkerId || '';
      let resKeys = await fetch(`/api/settings/ocr_api_keys_satker_${satker}`);
      if (!resKeys.ok) {
        resKeys = await fetch('/api/settings/ocr_api_keys');
      }
      if (resKeys.ok) {
        const keysObj = await resKeys.json();
        if (keysObj && keysObj.value) {
          const parsed = JSON.parse(keysObj.value);
          geminiKey = parsed.gemini || '';
        }
      }
    } catch (e) {
      console.error("Gagal memuat API key untuk AI:", e);
    }
    return geminiKey;
  };

  const runAiSurvey = async () => {
    if (!selectedPack) return;
    setIsSurveying(true);
    setSurveyProgressPercent(0);
    setSurveyProgress('Menghubungkan ke sistem e-Katalog LKPP...');

    const category = getPacketCategory(selectedPack?.packName || '');
    const items = getPackageItems(selectedPack);

    const requestItems = items
      .filter((item) => {
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

        if (category === 'Konsolidasi' && !rawQuery.toLowerCase().includes('konsolidasi')) {
          rawQuery += ' konsolidasi';
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
      })
      .filter(Boolean);

    if (requestItems.length === 0) {
      setIsSurveying(false);
      setSurveyProgress('Tidak ada item dengan QTY > 0 untuk disurvei.');
      return;
    }

    try {
      setSurveyProgress(`Menganalisis referensi E-Katalog... Mohon tunggu (Estimasi: ${items.length * 10} detik)`);
      setSurveyProgressPercent(5);

      // Load Gemini API Key using helper
      const geminiKey = await fetchGeminiKeyHelper();

      // Load Proxy dari localStorage jika user sudah menentukannya via Proxy Tester
      const userProxy = localStorage.getItem('pbj_scraper_proxy') || null;

      // Server ini sekarang menggunakan Service Node.js baru di port 3001
      const response = await fetch('/api/survey/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          items: requestItems,
          useAi: useAiMode,
          geminiKey: geminiKey,
          locations: searchLocations.split(',').map(s => s.trim()).filter(Boolean),
          ignorePriceLimit: ignorePriceLimit,
          autoComparator: autoComparator,
          proxy: userProxy,
          maxProviders: globalMaxProviders
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
      let failCount = 0;
      while (true) {
        await new Promise(r => setTimeout(r, 2500)); // poll every 2.5s
        
        try {
          const statusRes = await fetch(`/api/survey/status/${runRes.jobId}?t=${Date.now()}`, {
            headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
          });
          if (!statusRes.ok) throw new Error('Status response not OK');
          const statusData = await statusRes.json();
          failCount = 0; // reset on success

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
        } catch (err) {
          if (err.message.includes('Gagal memproses data')) {
            throw err; // Re-throw fatal worker errors
          }
          failCount++;
          console.warn(`Gagal mengecek status job (percobaan ${failCount}/5):`, err);
          if (failCount >= 5) {
            throw new Error('Gagal mengecek status job. Silakan periksa jaringan VPS Anda.');
          }
        }
      }

      setSurveyProgressPercent(95);
      setSurveyProgress('Menyusun lampiran bukti survei HPS...');

      const newHpsPrices = {};
      let totalHpsEstimate = 0;
      const newComparisons = { ...comparisons };
      const newJustifications = { ...justifications };

      // Integrate real results
      results.forEach((res, index) => {
        const qty = items[index].qty || 1;
        newHpsPrices[res.name] = res.price;
        totalHpsEstimate += (res.price * qty);
        
        // Auto-Comparator Capture
        if (autoComparator && res.comparators && res.comparators.length > 0) {
          res.comparators.forEach((comp, cIdx) => {
            const key = cIdx === 0 ? `ITEM-${index}` : `ITEM-${index}-${cIdx + 1}`;
            newComparisons[key] = {
              vendor: comp.vendor,
              name: comp.name,
              price: comp.price,
              status: comp.status,
              link: comp.link,
              alasan: comp.alasan,
              isAuto: true
            };
          });

          // Auto-fill justification
          const comp = res.comparators[0];
          const isMamin = category.startsWith('Mamin');
          const targetLoc = res.location || res.location_name || res.address || '';
          const compLoc = comp.location || comp.location_name || comp.address || '';
          const DAFTAR_KECAMATAN = [
            "Bantaran", "Banyuanyar", "Besuk", "Dringu", "Gading", "Gending", "Kotaanyar", 
            "Kraksaan", "Krucil", "Kuripan", "Leces", "Lumbang", "Maron", 
            "Paiton", "Pajarakan", "Pakuniran", "Sukapura", "Sumber", "Sumberasih", 
            "Tegalsiwalan", "Tiris", "Tongas", "Wonomerto"
          ];
          const userSatker = currentUser?.department || '';
          const userSubdistrict = DAFTAR_KECAMATAN.find(kec =>
            userSatker.toLowerCase().replace(/[^a-z0-9]/g, '').includes(kec.toLowerCase().replace(/[^a-z0-9]/g, ''))
          ) || '';

          newJustifications['ITEM-' + index] = getAutoJustificationText(
            isMamin,
            res.vendor,
            res.price,
            targetLoc,
            comp.vendor,
            comp.price,
            compLoc,
            userSubdistrict
          );
        }
      });
      setComparisons(newComparisons);
      setJustifications(newJustifications);

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
          vendorLink: r.vendorLink,
          img: r.img,
          searchImg: r.searchImg,
          success: r.success,
          location: r.location || r.location_name || r.address || '',
          comparators: r.comparators || [],
          minPrice: r.minPrice || null
        })),
        timestamp: new Date().toLocaleString('id-ID')
      });

      setHpsPrices(newHpsPrices);
      setHpsValue(totalHpsEstimate.toString());

      setSurveyProgressPercent(100);
      setIsSurveying(false);
      // Reset semua status screenshot agar tombol "Ambil Screenshot" muncul untuk semua produk baru
      setScreenshotStatus({});
      setTimeout(() => setSurveyProgressPercent(0), 1000);

      if (results && results.wasCanceled) {
        dialog.warning(
          'Data yang berhasil ditemukan sudah tersimpan.\n\nSelanjutnya: Klik tombol "📸 Ambil Semua Screenshot" untuk mengambil bukti gambar produk.',
          '⏹ Survei Dihentikan'
        );
      } else {
        dialog.success(
          'Data harga & link produk berhasil dikumpulkan dari e-Katalog LKPP.\n\nSelanjutnya: Klik tombol "📸 Ambil Semua Screenshot" di bawah untuk mengambil bukti gambar yang valid.',
          '⚡ Survei Selesai!'
        );
      }

    } catch (err) {
      console.error(err);
      setIsSurveying(false);
      setSurveyProgress('');
      setSurveyProgressPercent(0);
      dialog.error('Gagal melakukan survei E-Katalog:\n' + err.message, 'Survei Gagal');
    }
  };

  const runSingleItemSurvey = async (productIndex, customQuery) => {
    if (!selectedPack || !surveyData) return;
    
    setLoadingProductIndex(productIndex);

    const category = getPacketCategory(selectedPack?.packName || '');
    let finalQuery = customQuery;
    if (category === 'Konsolidasi' && !finalQuery.toLowerCase().includes('konsolidasi')) {
      finalQuery += ' konsolidasi';
    }

    const items = getPackageItems(selectedPack);
    const targetItem = items[productIndex];
    if (!targetItem) {
      setLoadingProductIndex(null);
      return;
    }

    const requestItems = [{
      name: targetItem.name,
      query: finalQuery,
      fallbackPrice: targetItem.price,
      explicitMinPrice: customMinPrices[productIndex] ? parseInt(customMinPrices[productIndex].toString().replace(/\D/g, ''), 10) : null,
      explicitMaxPrice: customMaxPrices[productIndex] ? parseInt(customMaxPrices[productIndex].toString().replace(/\D/g, ''), 10) : null,
      priceTolerance: globalPriceTolerance,
      targetVendor: customTargets[productIndex] || globalTargetVendor || '',
      targetUrl: (customTargets[productIndex] && customTargets[productIndex].startsWith('http')) ? customTargets[productIndex] : ''
    }];

    try {
      const geminiKey = await fetchGeminiKeyHelper();
      const userProxy = localStorage.getItem('pbj_scraper_proxy') || null;
      
      const response = await fetch('/api/survey/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          items: requestItems,
          useAi: useAiMode,
          geminiKey: geminiKey,
          locations: searchLocations.split(',').map(s => s.trim()).filter(Boolean),
          ignorePriceLimit: ignorePriceLimit,
          autoComparator: autoComparator,
          proxy: userProxy
        })
      });

      if (!response.ok) {
        throw new Error('Gagal mengeksekusi survei kustom: ' + response.statusText);
      }

      const runRes = await response.json();
      if (!runRes.jobId) throw new Error('Tidak mendapatkan Job ID dari server');

      let results = null;
      let failCount = 0;
      while (true) {
        await new Promise(r => setTimeout(r, 1500)); // poll faster for single item
        
        try {
          const statusRes = await fetch(`/api/survey/status/${runRes.jobId}?t=${Date.now()}`, {
            headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
          });
          if (!statusRes.ok) throw new Error('Status response not OK');
          const statusData = await statusRes.json();
          failCount = 0; // reset on success

          if (statusData.status === 'completed') {
            results = statusData.results;
            break;
          } else if (statusData.status === 'failed') {
            throw new Error('Proses worker gagal: ' + statusData.error);
          }
        } catch (err) {
          if (err.message.includes('Proses worker gagal')) {
            throw err; // Re-throw fatal worker errors
          }
          failCount++;
          console.warn(`Gagal mengecek status job (percobaan ${failCount}/5):`, err);
          if (failCount >= 5) {
            throw new Error('Gagal mengecek status job. Silakan periksa jaringan VPS Anda.');
          }
        }
      }
      const singleRes = results[0];

      if (singleRes) {
        const updatedProducts = [...surveyData.products];
        const targetName = targetItem.name;
        const prodIdx = updatedProducts.findIndex(p => p.name === targetName);
        const newProductObj = {
          id: 'ITEM-' + productIndex,
          name: singleRes.name || targetName,
          vendor: singleRes.vendor,
          price: singleRes.price,
          link: singleRes.link,
          vendorLink: singleRes.vendorLink,
          img: singleRes.img,
          searchImg: singleRes.searchImg || singleRes.img,
          success: singleRes.success,
          location: singleRes.location || singleRes.location_name || singleRes.address || '',
          comparators: singleRes.comparators || [],
          minPrice: singleRes.minPrice || null
        };
        if (prodIdx !== -1) {
          updatedProducts[prodIdx] = newProductObj;
        } else {
          updatedProducts.push(newProductObj);
        }
        const updatedData = { ...surveyData, products: updatedProducts };
        setSurveyData(updatedData);
        // Reset status screenshot item ini agar tombol ambil screenshot muncul kembali
        setScreenshotStatus(prev => ({ ...prev, [newProductObj.id]: undefined }));
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

        if (autoComparator && singleRes.comparators && singleRes.comparators.length > 0) {
          setComparisons(prev => {
            const newComps = { ...prev };
            singleRes.comparators.forEach((comp, cIdx) => {
              const key = cIdx === 0 ? `ITEM-${productIndex}` : `ITEM-${productIndex}-${cIdx + 1}`;
              newComps[key] = {
                vendor: comp.vendor,
                name: comp.name,
                price: comp.price,
                status: comp.status,
                link: comp.link,
                alasan: comp.alasan,
                isAuto: true
              };
            });
            return newComps;
          });
          
          const comp = singleRes.comparators[0];

          const isMamin = getPacketCategory(selectedPack?.packName || '').startsWith('Mamin');
          const targetLoc = singleRes.location || singleRes.location_name || singleRes.address || '';
          const compLoc = comp.location || comp.location_name || comp.address || '';
          const DAFTAR_KECAMATAN = [
            "Bantaran", "Banyuanyar", "Besuk", "Dringu", "Gading", "Gending", "Kotaanyar", 
            "Kraksaan", "Krucil", "Kuripan", "Leces", "Lumbang", "Maron", 
            "Paiton", "Pajarakan", "Pakuniran", "Sukapura", "Sumber", "Sumberasih", 
            "Tegalsiwalan", "Tiris", "Tongas", "Wonomerto"
          ];
          const userSatker = currentUser?.department || '';
          const userSubdistrict = DAFTAR_KECAMATAN.find(kec =>
            userSatker.toLowerCase().replace(/[^a-z0-9]/g, '').includes(kec.toLowerCase().replace(/[^a-z0-9]/g, ''))
          ) || '';

          setJustifications(prev => ({
            ...prev,
            ['ITEM-' + productIndex]: getAutoJustificationText(
              isMamin,
              singleRes.vendor,
              singleRes.price,
              targetLoc,
              comp.vendor,
              comp.price,
              compLoc,
              userSubdistrict
            )
          }));
        }
        
        if (singleRes.success) {
           dialog.success(`Produk "${singleRes.name}" ditemukan di e-Katalog.\nSilakan klik tombol "📸 Ambil Screenshot Bukti" untuk mengambil gambar.`, 'Pencarian Berhasil');
        } else {
           dialog.warning('Pencarian ulang selesai, namun barang tidak ditemukan di e-Katalog.\nCoba gunakan kata kunci yang berbeda.', 'Barang Tidak Ditemukan');
        }
      }
    } catch (err) {
      console.error('Single survey error:', err);
      dialog.error('Gagal mencari ulang:\n' + err.message, 'Pencarian Gagal');
    } finally {
      setLoadingProductIndex(null);
    }
  };

  const captureScreenshot = async (p) => {
    if (!p.link) {
      dialog.warning(`Link produk "${p.name}" tidak tersedia.\n\nCoba jalankan ulang survei untuk item ini.`, 'Link Tidak Tersedia');
      return;
    }
    try {
      setScreenshotStatus(prev => ({ ...prev, [p.id]: 'loading' }));

      // ── Helper: ambil 1 screenshot dari 1 URL ─────────────────────────
      const fetchScreenshot = async (url) => {
        const response = await fetch('/api/survey/screenshot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });
        if (!response.ok) throw new Error('Gagal mengambil tangkapan layar: ' + url);
        const data = await response.json();
        if (!data.success || !data.img) throw new Error('Respons tidak valid dari server screenshot');
        return data.img;
      };

      // ── 1. Screenshot penyedia UTAMA ─────────────────────────────────
      const mainImg = await fetchScreenshot(p.link);

      // ── 2. Screenshot setiap COMPARATOR yang punya link produk ───────
      const comparators = p.comparators || [];
      const updatedComparators = [...comparators];
      for (let i = 0; i < updatedComparators.length; i++) {
        const comp = updatedComparators[i];
        if (comp.link && comp.link.startsWith('http')) {
          try {
            const compImg = await fetchScreenshot(comp.link);
            updatedComparators[i] = { ...comp, img: compImg };
          } catch (compErr) {
            console.warn(`Screenshot comparator ${i + 1} (${comp.vendor}) gagal:`, compErr.message);
            // Lanjutkan meski satu comparator gagal
          }
        }
      }

      // ── 3. Simpan ke surveyData ──────────────────────────────────────
      setSurveyData(prev => {
        if (!prev || !prev.products) return prev;
        const updatedProducts = prev.products.map(prod =>
          prod.id === p.id
            ? { ...prod, img: mainImg, searchImg: mainImg, comparators: updatedComparators }
            : prod
        );
        return { ...prev, products: updatedProducts };
      });

      setScreenshotStatus(prev => ({ ...prev, [p.id]: 'done' }));
    } catch (err) {
      console.error(err);
      setScreenshotStatus(prev => ({ ...prev, [p.id]: 'error' }));
      dialog.error(`Gagal mengambil screenshot untuk:\n"${p.name}"\n\nError: ${err.message}`, 'Screenshot Gagal');
    }
  };

  const captureAllScreenshots = async () => {
    const activeData = surveyData;
    if (!activeData || !activeData.products) return;
    
    const toCapture = activeData.products.filter(p => p.success && p.vendor !== 'TIDAK DITEMUKAN' && screenshotStatus[p.id] !== 'done');
    
    if (toCapture.length === 0) {
      dialog.alert('Semua screenshot produk sudah tersedia atau tidak ada produk valid.', 'Informasi', 'info');
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
    
    const category = getPacketCategory(selectedPack?.packName || '');
    const items = getPackageItems(selectedPack);
    const indicesToSearch = [];
    const requestItems = [];

    // Cari barang yang punya perubahan pada keyword, target, minPrice, atau maxPrice
    items.forEach((item, idx) => {
      const qty = item.qty === '' ? 0 : (item.qty || 0);
      const hasCustomKeyword = customKeywords[idx] && customKeywords[idx].trim() !== '';
      const hasCustomTarget = customTargets[idx] && customTargets[idx].trim() !== '';
      const hasCustomMin = customMinPrices[idx] && customMinPrices[idx].toString().trim() !== '';
      const hasCustomMax = customMaxPrices[idx] && customMaxPrices[idx].toString().trim() !== '';
      
      if (qty > 0 && (hasCustomKeyword || hasCustomTarget || hasCustomMin || hasCustomMax)) {
        let itemQuery = hasCustomKeyword ? customKeywords[idx].trim() : autoCleanKeyword(item.name);
        if (category === 'Konsolidasi' && !itemQuery.toLowerCase().includes('konsolidasi')) {
          itemQuery += ' konsolidasi';
        }

        indicesToSearch.push(idx);
        requestItems.push({
          name: item.name,
          query: itemQuery,
          isCustomKeyword: hasCustomKeyword,
          fallbackPrice: item.price || item.paguDpa,
          explicitMinPrice: customMinPrices[idx] ? parseInt(customMinPrices[idx].toString().replace(/\D/g, ''), 10) : null,
          explicitMaxPrice: customMaxPrices[idx] ? parseInt(customMaxPrices[idx].toString().replace(/\D/g, ''), 10) : null,
          priceTolerance: globalPriceTolerance,
          targetVendor: customTargets[idx] || globalTargetVendor || '',
          targetUrl: (customTargets[idx] && customTargets[idx].startsWith('http')) ? customTargets[idx] : ''
        });
      }
    });

    if (requestItems.length === 0) {
      dialog.warning('Tidak ada perubahan kustom (Kata Kunci / Target Toko / Harga Min / Harga Max) yang ditemukan pada barang apa pun.\n\nSilakan isi salah satu parameter pencarian kustom terlebih dahulu!', 'Tidak Ada Perubahan');
      return;
    }

    setIsSurveying(true);
    setSurveyProgressPercent(10);
    setSurveyProgress(`Mencari ulang ${requestItems.length} barang (Sesuai Filter Wilayah)...`);

    try {
      const geminiKey = await fetchGeminiKeyHelper();
      const response = await fetch('/api/survey/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           items: requestItems,
           useAi: false, // Matikan pencari sinonim untuk pencarian manual ini
           geminiKey: geminiKey,
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
      let failCount = 0;
      while (true) {
        await new Promise(r => setTimeout(r, 2000));
        
        try {
          const statusRes = await fetch(`/api/survey/status/${runRes.jobId}?t=${Date.now()}`, {
            headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
          });
          if (!statusRes.ok) throw new Error('Status response not OK');
          const statusData = await statusRes.json();
          failCount = 0; // reset on success

          if (statusData.status === 'completed') {
            results = statusData.results;
            break;
          } else if (statusData.status === 'failed') {
            throw new Error('Proses worker gagal: ' + statusData.error);
          } else {
            setSurveyProgressPercent(statusData.progress || 10);
            setSurveyProgress(`Mencari ulang di latar belakang (${statusData.progress || 0}% selesai)...`);
          }
        } catch (err) {
          if (err.message.includes('Proses worker gagal')) {
            throw err; // Re-throw fatal worker errors
          }
          failCount++;
          console.warn(`Gagal mengecek status job (percobaan ${failCount}/5):`, err);
          if (failCount >= 5) {
            throw new Error('Gagal mengecek status job. Silakan periksa jaringan VPS Anda.');
          }
        }
      }
      
      const updatedProducts = [...surveyData.products];
      const newHpsPrices = { ...hpsPrices };
      let successCount = 0;

      results.forEach((res, i) => {
        const originalIndex = indicesToSearch[i];
        const targetItem = items[originalIndex];

        const prodIdx = updatedProducts.findIndex(p => p.name === targetItem.name);
        const newProductObj = {
          id: 'ITEM-' + originalIndex,
          name: res.name || targetItem.name,
          vendor: res.vendor,
          price: res.price,
          link: res.link,
          vendorLink: res.vendorLink,
          img: res.img,
          searchImg: res.searchImg,
          success: res.success,
          location: res.location || res.location_name || res.address || '',
          comparators: res.comparators || [],
          minPrice: res.minPrice || null
        };

        if (prodIdx !== -1) {
          updatedProducts[prodIdx] = newProductObj;
        } else {
          updatedProducts.push(newProductObj);
        }
        
        // Reset status screenshot karena produk baru saja dicari ulang
        setScreenshotStatus(prev => ({ ...prev, [newProductObj.id]: undefined }));
        
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

          const isMamin = getPacketCategory(selectedPack?.packName || '').startsWith('Mamin');
          const targetLoc = res.location || res.location_name || res.address || '';
          const compLoc = comp.location || comp.location_name || comp.address || '';
          const DAFTAR_KECAMATAN = [
            "Bantaran", "Banyuanyar", "Besuk", "Dringu", "Gading", "Gending", "Kotaanyar", 
            "Kraksaan", "Krucil", "Kuripan", "Leces", "Lumbang", "Maron", 
            "Paiton", "Pajarakan", "Pakuniran", "Sukapura", "Sumber", "Sumberasih", 
            "Tegalsiwalan", "Tiris", "Tongas", "Wonomerto"
          ];
          const userSatker = currentUser?.department || '';
          const userSubdistrict = DAFTAR_KECAMATAN.find(kec =>
            userSatker.toLowerCase().replace(/[^a-z0-9]/g, '').includes(kec.toLowerCase().replace(/[^a-z0-9]/g, ''))
          ) || '';

          setJustifications(prev => ({
            ...prev,
            ['ITEM-' + originalIndex]: getAutoJustificationText(
              isMamin,
              res.vendor,
              res.price,
              targetLoc,
              comp.vendor,
              comp.price,
              compLoc,
              userSubdistrict
            )
          }));
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
      
      dialog.success(`${successCount} dari ${requestItems.length} barang berhasil ditemukan di e-Katalog.\n\nSelanjutnya klik "📸 Ambil Semua Screenshot" untuk bukti gambar.`, 'Pencarian Massal Selesai');
      
    } catch (err) {
      console.error(err);
      dialog.error('Terjadi kesalahan saat pencarian massal:\n' + err.message, 'Pencarian Gagal');
      setIsSurveying(false);
      setSurveyProgressPercent(0);
    }
  };



  return (
    <>
      {/* Step 3: HPS Formulation & Technical Specification */}
          <div className={`bg-white border border-slate-200 rounded-2xl p-4 sm:p-8 shadow-sm transition-all duration-300 ${step < 3 ? 'opacity-50 pointer-events-none' : 'animate-slide-up'}`}>
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
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Paket Potensial</div>
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
                          title="Jika aktif, otomatis mengisi penyedia potensial lainnya dari alternatif yang lebih mahal."
                        >
                          <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${autoComparator ? 'translate-x-5' : 'translate-x-1'}`} />
                        </button>
                        <span className="text-xs font-medium text-slate-700">
                          Auto Alternatif
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
                      <div className="flex items-center border border-slate-300 rounded-lg focus-within:ring-2 focus-within:ring-emerald-500 bg-white mt-2">
                        <span className="text-[11px] text-slate-500 pl-3">Maks. Penyedia per Barang</span>
                        <input 
                          type="number"
                          min="1" max="5"
                          value={globalMaxProviders}
                          onChange={(e) => setGlobalMaxProviders(parseInt(e.target.value) || 3)}
                          className="flex-1 text-[11px] px-2 py-2 focus:outline-none bg-transparent"
                          title="Batasi jumlah penyedia yang dicari untuk tiap barang (1 Target + n Alternatif)"
                        />
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
                      <Search className="w-3.5 h-3.5 text-white" />
                      <span>Cari Ulang</span>
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
                            setCustomKeywords({});
                            setCustomTargets({});
                            // Hapus juga dari localStorage agar tidak kembali saat direfresh
                            localStorage.removeItem('pbj_survey_data');
                            localStorage.removeItem('pbj_hps_prices');
                          }
                        }}
                        disabled={isSurveying}
                        className="text-[11px] font-bold px-6 py-2 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 transition-all flex items-center justify-center gap-1.5 active:scale-95 w-full"
                        title="Hapus semua hasil survei dan mulai ulang"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Reset Survei</span>
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
                      const exceeds = totalHps > anggaranTersedia;
                      return (
                        <div className="text-right flex flex-col items-end gap-1.5">
                          <span className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${exceeds
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                            {exceeds ? (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose-600"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                                Melebihi Kas Tersedia Bulan Ini
                              </>
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                HPS Efisien & Kas Valid
                              </>
                            )}
                          </span>
                          <div className="text-[10px] text-slate-500 flex flex-col items-end gap-0.5 mt-0.5">
                            <span>Anggaran Tersedia: <b>Rp {anggaranTersedia.toLocaleString()}</b></span>
                            <span className="opacity-70">Pagu Tahunan: Rp {totalPagu.toLocaleString()}</span>
                          </div>
                        </div>
                      )
                    })()}
                  </div>

                  <div className="w-full">
                    <table className="w-full text-xs text-left border-collapse block md:table md:min-w-[800px]">
                      <thead className="hidden md:table-header-group">
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
                      <tbody className="block md:table-row-group">
                        {(() => {
                          const items = getPackageItems(selectedPack)
                          const activeData = getActiveSurveyData()
                          return items.map((item, idx) => {
                            const dpaIdx = idx;
                            const unitHpsPrice = hpsPrices[item.name] !== undefined ? hpsPrices[item.name] : item.price;
                            const qtyNum = item.qty === '' ? 0 : (item.qty || 0);
                            const totalHpsItem = qtyNum * unitHpsPrice;
                            const isOverbudget = totalHpsItem > (qtyNum * item.price);
                            const surveyItem = activeData?.products?.find(p => p.name === item.name);
                            const isRowExpanded = expandedSurveyRows[idx];
                            
                            // Logika untuk kartu survei
                            const p = surveyItem;
                            const isFailed = p ? (!p.success || p.vendor === 'TIDAK DITEMUKAN') : false;
                            const keyword = customKeywords[dpaIdx] !== undefined ? customKeywords[dpaIdx] : (p ? p.name : item.name);
                            const isLoading = loadingProductIndex === idx;

                            return (
                              <React.Fragment key={item.no || idx}>
                              <tr className={`block md:table-row bg-white md:bg-transparent border border-slate-200 md:border-x-0 md:border-t-0 md:border-b-slate-100 rounded-xl md:rounded-none mb-4 md:mb-0 p-4 md:p-0 relative hover:bg-slate-50/60 transition-colors ${isOverbudget ? 'bg-rose-50/50' : ''}`}>
                                <td className="hidden md:table-cell py-3 px-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                                <td className="block md:table-cell py-2 md:py-3 px-0 md:px-2 text-slate-800">
                                  <div className="md:hidden flex justify-between items-center mb-2 border-b border-dashed border-slate-200 pb-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Item #{idx + 1}</span>
                                  </div>
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
                                        {aiLoadingSpecIndex === idx ? (
                                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1 inline" />
                                        ) : (
                                          <Sparkles className="w-3.5 h-3.5 mr-1 inline text-indigo-500" />
                                        )}
                                        <span>AI Bantu</span>
                                      </button>
                                    </div>
                                  </div>
                                </td>
                                <td className="block md:table-cell py-3 px-0 md:px-2 border-t border-dashed border-slate-200 md:border-0 mt-3 md:mt-0 pt-3 md:pt-0">
                                  <div className="md:hidden text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Referensi e-Katalog:</div>
                                  {surveyItem && surveyItem.success && surveyItem.vendor !== 'TIDAK DITEMUKAN' ? (
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-[10px] font-bold text-slate-700 truncate max-w-[150px] flex items-center gap-1" title={surveyItem.vendor}>
                                        <Store className="w-3 h-3 text-slate-500" />
                                        <input
                                          type="text"
                                          value={surveyItem.vendor}
                                          onChange={(e) => {
                                            const newVendor = e.target.value;
                                            const updatedProducts = surveyData.products.map(p => 
                                              p.name === item.name ? { ...p, vendor: newVendor } : p
                                            );
                                            setSurveyData({ ...surveyData, products: updatedProducts });
                                            setIsSigned(false);
                                          }}
                                          className="bg-transparent hover:bg-slate-100 border-b border-dashed border-slate-300 focus:border-indigo-500 focus:bg-white px-1 outline-none text-[10px] font-bold text-slate-700 w-full"
                                        />
                                      </span>
                                      {/* Grouped Links */}
                                      <div className="flex flex-col gap-0.5 pl-4 mb-1">
                                        {surveyItem.vendorLink && (
                                          <a href={surveyItem.vendorLink} target="_blank" rel="noopener noreferrer" className="text-[9px] text-indigo-650 hover:text-indigo-850 underline font-medium">Tautan Toko</a>
                                        )}
                                      </div>
                                      {(() => {
                                        const location = (comparisons[surveyItem.id] && comparisons[surveyItem.id].lokasi) 
                                           || (surveyItem.vendor && vendorLocationMap[surveyItem.vendor.toUpperCase().trim()]) 
                                           || surveyItem.location 
                                           || surveyItem.location_name 
                                           || surveyItem.address 
                                           || '';
                                        if (!location) return null;

                                        const cleanStr = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
                                        
                                        let foundSubdistrict = DAFTAR_KECAMATAN.find(kec => 
                                          cleanStr(location).includes(cleanStr(kec))
                                        );

                                        const userSatker = currentUser?.department || '';
                                        const userSubdistrict = DAFTAR_KECAMATAN.find(kec =>
                                          cleanStr(userSatker).includes(cleanStr(kec))
                                        ) || '';

                                        const cleanLoc = cleanStr(location);
                                        const isExplicitOutside = location === 'Luar Kabupaten Probolinggo';
                                        const isOutside = isExplicitOutside || (!foundSubdistrict && searchLocations && !searchLocations.split(',').some(loc => {
                                          const cleanL = cleanStr(loc);
                                          return cleanLoc.includes(cleanL) || cleanL.includes(cleanLoc);
                                        }));

                                        if (isOutside) {
                                          return (
                                            <span className="text-[8px] font-bold text-rose-700 bg-rose-50 px-1 py-0.5 rounded border border-rose-200 w-fit mt-0.5" title={`Produk ditemukan di ${location}, di luar target wilayah: ${searchLocations}`}>
                                              📍 Luar Wilayah ({location})
                                            </span>
                                          );
                                        }

                                        if (foundSubdistrict) {
                                          if (userSubdistrict && cleanStr(foundSubdistrict) === cleanStr(userSubdistrict)) {
                                            return (
                                              <div className="flex flex-col gap-0.5 mt-0.5">
                                                <span className="text-[8px] text-slate-500 font-medium">📍 {location}</span>
                                                <span className="text-[8px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded w-fit flex items-center gap-0.5" title="Kecamatan yang sama dengan Satuan Kerja - Prioritas Pengiriman Cepat">
                                                  🟢 Zona 1: Kec. Sama ({foundSubdistrict})
                                                </span>
                                              </div>
                                            );
                                          } else {
                                            return (
                                              <div className="flex flex-col gap-0.5 mt-0.5">
                                                <span className="text-[8px] text-slate-500 font-medium">📍 {location}</span>
                                                <span className="text-[8px] font-bold text-sky-750 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded w-fit flex items-center gap-0.5" title="Kecamatan tetangga di Kabupaten Probolinggo">
                                                  🔵 Zona 2: Kec. {foundSubdistrict}
                                                </span>
                                              </div>
                                            );
                                          }
                                        }

                                        return (
                                          <span className="text-[8px] text-slate-500 font-medium mt-0.5">
                                            📍 {location}
                                          </span>
                                        );
                                      })()}

                                      {surveyItem.isFallbackScreenshot && (
                                        <span className="text-[8px] font-bold text-amber-600 bg-amber-50 px-1 py-0.5 rounded border border-amber-200 w-fit mt-0.5" title="Menggunakan screenshot hasil pencarian karena halaman detail error/diblokir">⚠️ Mode Pencarian</span>
                                      )}

                                      {/* Tampilkan Penyedia Potensial Lainnya */}
                                      {surveyItem.comparators && surveyItem.comparators.length > 0 && (
                                        <div className="mt-1.5 flex flex-col gap-0.5 border-t border-slate-100 pt-1.5">
                                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Penyedia Potensial:</span>
                                          {surveyItem.comparators.map((comp, cIdx) => (
                                            <a key={cIdx} href={comp.link} target="_blank" rel="noopener noreferrer" className="text-[9px] text-blue-600 hover:text-blue-800 hover:underline truncate max-w-[150px] flex items-center gap-1" title={`${comp.vendor} - Rp ${(comp.price || 0).toLocaleString('id-ID')}`}>
                                              <span className="text-slate-400">↳</span> {comp.vendor}
                                            </a>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ) : surveyItem ? (
                                    <div className="flex flex-col gap-1 max-w-[150px]">
                                      <span className="text-[9px] text-rose-700 font-bold bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded w-fit flex items-center gap-1">
                                        <XCircle className="w-3 h-3 text-rose-700" />
                                        <span>Tidak Ditemukan</span>
                                      </span>
                                      <span className="text-[9px] text-rose-500 font-semibold leading-tight block">Wajib atur Qty menjadi 0 agar dikecualikan dari paket</span>
                                    </div>
                                  ) : (
                                    <span className="text-[9px] text-slate-400 italic bg-slate-100 px-1.5 py-0.5 rounded">Belum disurvei</span>
                                  )}
                                  {surveyItem && (
                                    <button 
                                      type="button" 
                                      onClick={() => setExpandedSurveyRows(prev => ({...prev, [idx]: !prev[idx]}))}
                                      className="mt-1.5 text-[9px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-2 py-0.5 rounded flex items-center gap-1 transition-colors pointer-events-auto"
                                    >
                                      {isRowExpanded ? '🔼 Tutup Detail' : '🔽 Lihat Detail Survei'}
                                    </button>
                                  )}
                                </td>
                                <td className="block md:table-cell py-2 md:py-3 px-0 md:px-2 text-left md:text-center font-bold text-slate-700">
                                  <div className="flex md:block items-center justify-between mt-2 md:mt-0 pt-2 md:pt-0 border-t border-dashed border-slate-200 md:border-0">
                                    <span className="md:hidden text-[9px] font-bold text-slate-400 uppercase tracking-wider inline-block w-32">Qty:</span>
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
                                    className="w-16 mx-0 md:mx-auto bg-slate-50 border border-slate-200 text-slate-800 rounded-lg py-1 px-2 text-xs font-bold text-center focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                    min="0"
                                    title="Ketik 0 jika item ini tidak jadi dipesan di paket ini"
                                  />
                                  </div>
                                </td>
                                <td className={`block md:table-cell py-2 md:py-3 px-0 md:px-2 text-left md:text-right font-mono transition-colors ${unitHpsPrice !== item.price ? 'text-slate-400' : 'text-slate-500'}`}>
                                  <div className="flex md:block items-center justify-between">
                                    <span className="md:hidden text-[9px] font-bold text-slate-400 uppercase tracking-wider inline-block w-32 font-sans">Pagu DPA:</span>
                                    <span>Rp&nbsp;{(item.price || 0).toLocaleString()}</span>
                                  </div>
                                </td>
                                <td className="block md:table-cell py-2 md:py-3 px-0 md:px-4 text-right mt-2 md:mt-0">
                                  <div className="md:hidden text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 text-left">Harga Tayang Survei:</div>
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
                                <td className={`block md:table-cell py-2 md:py-3 px-0 md:px-3 text-right font-mono font-bold transition-colors ${isOverbudget ? 'text-rose-600' : (unitHpsPrice < item.price ? 'text-emerald-600' : 'text-indigo-650')}`}>
                                  <div className="flex md:block items-center justify-between mt-2 md:mt-0 pt-2 md:pt-0 border-t border-dashed border-slate-200 md:border-0">
                                    <span className="md:hidden text-[9px] font-bold text-slate-400 uppercase tracking-wider font-sans">Total Tayang:</span>
                                    <span className="text-sm md:text-xs">Rp&nbsp;{totalHpsItem.toLocaleString()}</span>
                                  </div>
                                </td>
                              </tr>
                              
                              {/* EXPANDED ACCORDION ROW */}
                              {isRowExpanded && surveyItem && (
                                <tr className="block md:table-row">
                                  <td colSpan="7" className="block md:table-cell p-0 border-b border-slate-100 md:mt-0">
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
                                                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                                                    <ClipboardList className="w-3.5 h-3.5 text-slate-500" />
                                                    <span>Justifikasi Pemilihan</span>
                                                  </label>
                                                  <button
                                                    type="button"
                                                    onClick={() => enhanceJustificationWithAI(p.id, justifications[p.id] || '')}
                                                    disabled={isEnhancingJustification[p.id]}
                                                    className="text-[9px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded border border-indigo-200 transition-colors flex items-center gap-1 disabled:opacity-50"
                                                  >
                                                    {isEnhancingJustification[p.id] ? (
                                                      <>
                                                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                                        <span>Merapikan...</span>
                                                      </>
                                                    ) : (
                                                      <>
                                                        <Sparkles className="w-3 h-3 mr-1 text-indigo-650" />
                                                        <span>Rapikan Bahasa (AI)</span>
                                                      </>
                                                    )}
                                                  </button>
                                                </div>
                                                <textarea
                                                  value={justifications[p.id] || ''}
                                                  onChange={(e) => setJustifications({...justifications, [p.id]: e.target.value})}
                                                  placeholder="Ketik alasan singkat, misal: 'barang rusak bisa dikembalikan' lalu klik tombol AI di atas..."
                                                  className={`w-full px-3 py-2 bg-white border rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 min-h-[60px] resize-y transition-colors ${isEnhancingJustification[p.id] ? 'border-indigo-400 ring-1 ring-indigo-400 bg-indigo-50/30' : 'border-slate-300 focus:ring-indigo-500'}`}
                                                  disabled={isEnhancingJustification[p.id]}
                                                />
                                                <div className="flex gap-2 mt-2 flex-wrap">
                                                  <button
                                                    type="button"
                                                    onClick={() => setJustifications({ ...justifications, [p.id]: "Penyedia ini dipilih karena mampu menyediakan mayoritas (>80%) dari total item barang yang dibutuhkan, sehingga sangat mengefisienkan biaya pengiriman, mempermudah administrasi kontrak, dan memastikan seluruh barang tiba dalam satu waktu." })}
                                                    className="text-[9px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded border border-blue-200 transition-colors flex items-center gap-1"
                                                  >
                                                    <LayoutGrid className="w-3 h-3" />
                                                    <span>Template: Satu Pintu (&gt;80%)</span>
                                                  </button>
                                                  {getPacketCategory(selectedPack?.packName || '').startsWith('Mamin') && (
                                                    <button
                                                      type="button"
                                                      onClick={() => setJustifications({ ...justifications, [p.id]: "Pemilihan penyedia ini disesuaikan dengan ketentuan Surat Edaran Bupati Probolinggo Nomor 000.3/2747/426.42/2025 tentang E-Purchasing Katalog Elektronik untuk pemenuhan aspek pemerataan penyedia lokal dan efisiensi pengiriman Mamin di lingkungan Pemerintah Kabupaten Probolinggo." })}
                                                      className="text-[9px] font-bold text-amber-750 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded border border-amber-200 transition-colors flex items-center gap-1"
                                                    >
                                                      <ClipboardList className="w-3 h-3" />
                                                      <span>Template: SE Mamin (Pemerataan)</span>
                                                    </button>
                                                  )}
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      const currentJustification = justifications[p.id] || '';
                                                      if (!currentJustification.trim()) {
                                                        dialog.warning('Isi justifikasi terlebih dahulu sebelum diterapkan ke semua barang!', 'Justifikasi Kosong');
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
                                                    <span className="flex items-center gap-1">
                                                      <Sparkles className="w-3 h-3 text-emerald-600" />
                                                      <span>Terapkan ke Seluruh Barang</span>
                                                    </span>
                                                  </button>
                                                </div>
                                              </div>

                                              <div className="pt-2 border-t border-slate-200">
                                                { screenshotStatus[p.id] === 'done' ? (
                                                  <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-1.5 bg-emerald-50 w-fit px-3 py-1.5 rounded-lg border border-emerald-200">
                                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                    <span>✓ Bukti Screenshot Tersimpan</span>
                                                  </div>
                                                ) : screenshotStatus[p.id] === 'loading' ? (
                                                  <div className="text-[10px] font-bold text-amber-600 flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    <span>Mengambil screenshot...</span>
                                                  </div>
                                                ) : screenshotStatus[p.id] === 'error' ? (
                                                  <button
                                                    onClick={() => captureScreenshot(p)}
                                                    className="text-[10px] font-bold text-white bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm active:scale-95"
                                                  >
                                                    <Camera className="w-3.5 h-3.5" />
                                                    <span>Gagal — Coba Lagi</span>
                                                  </button>
                                                ) : (
                                                  <button
                                                    onClick={() => captureScreenshot(p)}
                                                    className="text-[10px] font-bold text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 shadow-sm active:scale-95 border border-indigo-400"
                                                  >
                                                    <Camera className="w-3.5 h-3.5" />
                                                    <span>📸 Ambil Screenshot Bukti</span>
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
                                              <span className="flex items-center gap-1.5">
                                                <Search className="w-3.5 h-3.5 text-slate-500" />
                                                <span>Sesuaikan Pencarian Ulang</span>
                                              </span>
                                            </h4>
                                            <div className="space-y-2.5">
                                              <div>
                                                <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Kata Kunci Pencarian</label>
                                                <div className="flex gap-1.5">
                                                  <input
                                                    type="text"
                                                    value={keyword}
                                                    onChange={(e) => setCustomKeywords({ ...customKeywords, [dpaIdx]: e.target.value })}
                                                    placeholder="Contoh: Laptop i5"
                                                    className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] focus:ring-1 focus:ring-indigo-500"
                                                    disabled={isLoading}
                                                  />
                                                  <button
                                                    type="button"
                                                    onClick={() => runSingleItemSurvey(dpaIdx, keyword)}
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
                                                    value={customTargets[dpaIdx] || ''}
                                                    onChange={(e) => setCustomTargets({ ...customTargets, [dpaIdx]: e.target.value })}
                                                    placeholder="Nama Toko"
                                                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] focus:ring-1 focus:ring-indigo-500"
                                                    disabled={isLoading}
                                                  />
                                                  {customTargets[dpaIdx] && (
                                                    <div className="mt-1 flex items-center gap-1">
                                                      <Globe className="w-3 h-3 text-indigo-500" />
                                                      <a
                                                        href={getDynamicProductLink(customTargets[dpaIdx], keyword)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[9px] text-indigo-600 hover:text-indigo-850 underline font-bold"
                                                      >
                                                        Tautan Produk
                                                      </a>
                                                    </div>
                                                  )}
                                                </div>
                                                <div className="flex gap-2">
                                                  <div className="flex-1">
                                                    <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Harga Minimal (Opsional)</label>
                                                    <input
                                                      type="number"
                                                      value={customMinPrices[dpaIdx] || ''}
                                                      onChange={(e) => setCustomMinPrices({ ...customMinPrices, [dpaIdx]: e.target.value })}
                                                      placeholder={`> ${(p.price || p.paguDpa) * 0.5}`}
                                                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] focus:ring-1 focus:ring-indigo-500"
                                                      disabled={isLoading}
                                                    />
                                                  </div>
                                                  <div className="flex-1">
                                                    <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Harga Maksimal (Opsional)</label>
                                                    <input
                                                      type="number"
                                                      value={customMaxPrices[dpaIdx] || ''}
                                                      onChange={(e) => setCustomMaxPrices({ ...customMaxPrices, [dpaIdx]: e.target.value })}
                                                      placeholder={`< ${p.price || p.paguDpa}`}
                                                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] focus:ring-1 focus:ring-indigo-500"
                                                      disabled={isLoading}
                                                    />
                                                  </div>
                                                </div>
                                              </div>
                                              
                                              {/* Spesifikasi Mutu untuk DPA raw item */}
                                              <div className="mt-3">
                                                <label className="block text-[9px] font-bold text-slate-500 mb-0.5 flex items-center gap-1">
                                                  <FileText className="w-3 h-3 text-slate-400" />
                                                  <span>Spesifikasi Komposisi / Mutu (KAK)</span>
                                                </label>
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
                                                ⚖️ Produk Alternatif 1
                                              </h4>
                                              <div className="space-y-2">
                                                <input 
                                                  type="text" placeholder="Nama Produk Alternatif 1" 
                                                  value={(comparisons[p.id] && comparisons[p.id].name) || ''}
                                                  onChange={(e) => setComparisons({...comparisons, [p.id]: {...(comparisons[p.id]||{}), name: e.target.value}})}
                                                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px]"
                                                />
                                                <div className="flex gap-2">
                                                  <input 
                                                    type="text" placeholder="Penyedia Alternatif 1" 
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
                                                <input 
                                                  type="number" placeholder="Harga Alternatif 1" 
                                                  value={(comparisons[p.id] && comparisons[p.id].price) || ''}
                                                  onChange={(e) => setComparisons({...comparisons, [p.id]: {...(comparisons[p.id]||{}), price: parseInt(e.target.value) || 0}})}
                                                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px]"
                                                />
                                              </div>
                                              
                                              <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mt-4 mb-2 flex items-center gap-1">
                                                ⚖️ Produk Alternatif 2
                                              </h4>
                                              <div className="space-y-2">
                                                <input 
                                                  type="text" placeholder="Nama Produk Alternatif 2" 
                                                  value={(comparisons[p.id+'-2'] && comparisons[p.id+'-2'].name) || ''}
                                                  onChange={(e) => setComparisons({...comparisons, [`${p.id}-2`]: {...(comparisons[`${p.id}-2`]||{}), name: e.target.value}})}
                                                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px]"
                                                />
                                                <div className="flex gap-2">
                                                  <input 
                                                    type="text" placeholder="Penyedia Alternatif 2" 
                                                    value={(comparisons[p.id+'-2'] && comparisons[p.id+'-2'].vendor) || ''}
                                                    onChange={(e) => setComparisons({...comparisons, [`${p.id}-2`]: {...(comparisons[`${p.id}-2`]||{}), vendor: e.target.value}})}
                                                    className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px]"
                                                  />
                                                  <select 
                                                    value={(comparisons[p.id+'-2'] && comparisons[p.id+'-2'].status) || 'Luar Katalog'}
                                                    onChange={(e) => setComparisons({...comparisons, [`${p.id}-2`]: {...(comparisons[`${p.id}-2`]||{}), status: e.target.value}})}
                                                    className="w-1/3 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px]"
                                                  >
                                                    <option value="Luar Katalog">Luar Katalog</option>
                                                    <option value="Toko Daring">Toko Daring</option>
                                                    <option value="E-Katalog">E-Katalog</option>
                                                  </select>
                                                </div>
                                                <input 
                                                  type="number" placeholder="Harga Alternatif 2" 
                                                  value={(comparisons[p.id+'-2'] && comparisons[p.id+'-2'].price) || ''}
                                                  onChange={(e) => setComparisons({...comparisons, [`${p.id}-2`]: {...(comparisons[`${p.id}-2`]||{}), price: parseInt(e.target.value) || 0}})}
                                                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px]"
                                                />
                                              </div>
                                              
                                              <div className="mt-3 pt-3 border-t border-slate-100">
                                                <h5 className="text-[9px] font-semibold text-slate-500 mb-2 uppercase tracking-wider">Atribut Evaluasi Tambahan (Tampil di Cetak)</h5>
                                                <div className="grid grid-cols-2 gap-2">
                                                  <select
                                                    value={(comparisons[p.id] && comparisons[p.id].lokasi) || ''}
                                                    onChange={(e) => {
                                                      const val = e.target.value;
                                                      setComparisons({...comparisons, [p.id]: {...(comparisons[p.id]||{}), lokasi: val}});
                                                      handleUpdateVendorLocation(p.vendor, val);
                                                    }}
                                                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[9px] text-slate-800"
                                                  >
                                                    <option value="">-- Deteksi Otomatis --</option>
                                                    <option value="Luar Kabupaten Probolinggo">Luar Kabupaten Probolinggo</option>
                                                    <optgroup label="24 Kecamatan Probolinggo">
                                                      {DAFTAR_KECAMATAN.map(kec => (
                                                        <option key={kec} value={kec}>{kec}</option>
                                                      ))}
                                                    </optgroup>
                                                  </select>
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
                        <div className="text-slate-500 font-medium flex flex-col sm:flex-row gap-3">
                          <span>Total Pagu Tahunan: <span className="font-bold font-mono text-slate-850 bg-slate-100 px-2 py-1 rounded-lg">Rp&nbsp;{totalPagu.toLocaleString()}</span></span>
                          <span>Anggaran Tersedia: <span className="font-bold font-mono text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100 shadow-sm">Rp&nbsp;{anggaranTersedia.toLocaleString()}</span></span>
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-3.5">
                          <span className="text-slate-600 font-semibold">Hasil Kalkulasi HPS:</span>
                          <span className="text-sm font-bold font-mono text-slate-900 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">Rp&nbsp;{totalHps.toLocaleString()}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setHpsValue(totalHps.toString())
                              dialog.success(`Nilai HPS Resmi telah disetujui:\n\nRp ${totalHps.toLocaleString('id-ID')}\n\nBerdasarkan hasil kalkulasi survei pasar e-Katalog.`, 'HPS Disetujui')
                            }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-semibold px-4 py-2 rounded-xl transition-all text-[11px] active:scale-95 flex items-center gap-1.5 shadow-sm"
                          >
                            <Check className="w-4 h-4 text-slate-600" />
                            <span>Gunakan Sebagai HPS Resmi</span>
                          </button>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}

              {surveyData && (
                <div className="mb-6 bg-slate-50/50 p-5 rounded-2xl border border-slate-200/80">
                  <div className="text-xs font-bold text-slate-800 mb-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 text-slate-900">
                      <FileText className="w-4 h-4 text-slate-600" />
                      <span>Referensi Hasil Survei e-Katalog (Kategori: {surveyData.category})</span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      {/* Hitung berapa produk sudah screenshot dan belum */}
                      {(() => {
                        const validProducts = surveyData.products.filter(p => p.success && p.vendor !== 'TIDAK DITEMUKAN');
                        const doneCount = validProducts.filter(p => screenshotStatus[p.id] === 'done').length;
                        const totalCount = validProducts.length;
                        const allDone = doneCount === totalCount && totalCount > 0;
                        const isAnyLoading = validProducts.some(p => screenshotStatus[p.id] === 'loading');
                        return (
                          <div className="flex flex-col items-end gap-1.5">
                            {/* Progress indicator */}
                            {totalCount > 0 && (
                              <div className="flex items-center gap-2">
                                <div className="flex gap-0.5">
                                  {validProducts.map(p => (
                                    <div
                                      key={p.id}
                                      className={`w-2 h-2 rounded-full transition-all ${
                                        screenshotStatus[p.id] === 'done' ? 'bg-emerald-500' :
                                        screenshotStatus[p.id] === 'loading' ? 'bg-amber-400 animate-pulse' :
                                        'bg-slate-300'
                                      }`}
                                      title={p.name}
                                    />
                                  ))}
                                </div>
                                <span className={`text-[10px] font-bold ${
                                  allDone ? 'text-emerald-600' : 'text-slate-500'
                                }`}>
                                  {doneCount}/{totalCount} screenshot
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={captureAllScreenshots}
                                disabled={isAnyLoading || allDone}
                                className={`text-[11px] font-bold px-4 py-2 rounded-xl shadow transition-all flex items-center gap-2 active:scale-95 ${
                                  allDone
                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 cursor-not-allowed'
                                    : isAnyLoading
                                    ? 'bg-amber-100 text-amber-700 border border-amber-300 cursor-wait'
                                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border border-emerald-400 cursor-pointer'
                                }`}
                                title={allDone ? 'Semua screenshot sudah diambil' : 'Ambil tangkapan layar untuk semua produk yang ditemukan (pastikan survei sudah final)'}
                              >
                                {isAnyLoading ? (
                                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Mengambil Screenshot...</span></>
                                ) : allDone ? (
                                  <><Check className="w-3.5 h-3.5" /><span>Semua Screenshot Tersimpan ✓</span></>
                                ) : (
                                  <><Camera className="w-4 h-4" /><span>📸 Ambil Semua Screenshot ({totalCount - doneCount} belum)</span></>
                                )}
                              </button>
                              <div className="text-[9px] text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded">
                                {surveyData.timestamp}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  {/* Panduan langkah untuk user */}
                  {(() => {
                    const validProducts = surveyData.products.filter(p => p.success && p.vendor !== 'TIDAK DITEMUKAN');
                    const doneCount = validProducts.filter(p => screenshotStatus[p.id] === 'done').length;
                    const allDone = doneCount === validProducts.length && validProducts.length > 0;
                    if (allDone) return null;
                    return (
                      <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
                        <span className="text-amber-500 text-lg mt-0.5">💡</span>
                        <div>
                          <p className="text-[11px] font-bold text-amber-800">Langkah selanjutnya setelah survei selesai:</p>
                          <ol className="text-[10px] text-amber-700 mt-1 space-y-0.5 list-decimal list-inside">
                            <li>Pastikan data harga & link di bawah sudah benar (klik "Lihat di e-Katalog" untuk verifikasi)</li>
                            <li>Klik tombol <strong>"📸 Ambil Semua Screenshot"</strong> di atas untuk mengambil bukti gambar</li>
                            <li>Screenshot akan otomatis tersimpan sebagai lampiran dokumen HPS</li>
                          </ol>
                        </div>
                      </div>
                    );
                  })()}
                  
                  <div className="flex gap-4 overflow-x-auto pb-3 pt-1">
                    {surveyData.products.map((p, idx) => {
                      const items = getPackageItems(selectedPack);
                      const originalIdx = items.findIndex(item => item.name === p.name);
                      const dpaIdx = originalIdx !== -1 ? originalIdx : idx;
                      const isFailed = !p.success || p.vendor === 'TIDAK DITEMUKAN';
                      const keyword = customKeywords[dpaIdx] !== undefined ? customKeywords[dpaIdx] : p.name;
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
                                  <Edit3 className="w-3 h-3 text-slate-500" />
                                  <span>Ubah</span>
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
                                    <Store className="w-3 h-3 text-slate-400" />
                                    <span className="truncate" title={p.vendor}>{p.vendor}</span>
                                  </div>
                                  {p.vendorLink && (
                                    <div className="text-[9px] text-indigo-650 hover:text-indigo-850 underline truncate pt-0.5 flex items-center gap-1">
                                      <Globe className="w-3 h-3 text-indigo-500" />
                                      <a href={p.vendorLink} target="_blank" rel="noopener noreferrer">Tautan Toko</a>
                                    </div>
                                  )}
                                  <div className="text-[9px] text-indigo-600 hover:text-indigo-700 underline truncate pt-0.5 flex items-center gap-1">
                                    <Globe className="w-3 h-3 text-indigo-500" />
                                    <a href={p.link} target="_blank" rel="noopener noreferrer">Lihat di e-Katalog</a>
                                  </div>
                                  
                                  <div className="mt-2 pt-2 border-t border-slate-100">
                                    { screenshotStatus[p.id] === 'done' ? (
                                      <div className="text-[9px] font-bold text-emerald-600 flex items-center gap-1.5 bg-emerald-50 w-fit px-2.5 py-1.5 rounded-lg border border-emerald-200">
                                        <Check className="w-3 h-3 text-emerald-600" />
                                        <span>✓ Bukti Screenshot Tersimpan</span>
                                      </div>
                                    ) : screenshotStatus[p.id] === 'loading' ? (
                                      <div className="text-[9px] font-bold text-amber-600 flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span>Mengambil screenshot...</span>
                                      </div>
                                    ) : screenshotStatus[p.id] === 'error' ? (
                                      <button
                                        onClick={() => captureScreenshot(p)}
                                        className="text-[9px] font-bold text-white bg-red-500 hover:bg-red-600 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 w-full justify-center shadow-sm"
                                      >
                                        <Camera className="w-3 h-3" />
                                        <span>Gagal — Coba Lagi</span>
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => captureScreenshot(p)}
                                        className="text-[9px] font-bold text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 w-full justify-center shadow-sm active:scale-95 border border-indigo-400"
                                      >
                                        <Camera className="w-3 h-3" />
                                        <span>📸 Ambil Screenshot Bukti</span>
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
                                  onChange={(e) => setCustomKeywords({ ...customKeywords, [dpaIdx]: e.target.value })}
                                  placeholder="Contoh: Laptop i5"
                                  className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                  disabled={isLoading}
                                />
                                <button
                                  type="button"
                                  onClick={() => runSingleItemSurvey(dpaIdx, keyword)}
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
                                  value={customTargets[dpaIdx] || ''}
                                  onChange={(e) => setCustomTargets({ ...customTargets, [dpaIdx]: e.target.value })}
                                  placeholder="Contoh: CV Maju Jaya ATAU https://katalog.inaproc.id/..."
                                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                  disabled={isLoading}
                                />
                                {customTargets[dpaIdx] && (
                                  <div className="mt-1 flex items-center gap-1">
                                    <Globe className="w-3 h-3 text-indigo-500" />
                                    <a
                                      href={getDynamicProductLink(customTargets[dpaIdx], keyword)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[9px] text-indigo-600 hover:text-indigo-850 underline font-bold"
                                    >
                                      Tautan Produk
                                    </a>
                                  </div>
                                )}
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Harga Minimal (Opsional)</label>
                                <input
                                  type="number"
                                  value={customMinPrices[dpaIdx] || ''}
                                  onChange={(e) => setCustomMinPrices({ ...customMinPrices, [dpaIdx]: e.target.value })}
                                  placeholder={`> ${(p.price || p.paguDpa) * 0.5}`}
                                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] focus:ring-1 focus:ring-indigo-500"
                                  disabled={isLoading}
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Harga Maksimal (Opsional)</label>
                                <input
                                  type="number"
                                  value={customMaxPrices[dpaIdx] || ''}
                                  onChange={(e) => setCustomMaxPrices({ ...customMaxPrices, [dpaIdx]: e.target.value })}
                                  placeholder={`< ${p.price || p.paguDpa}`}
                                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] focus:ring-1 focus:ring-indigo-500"
                                  disabled={isLoading}
                                />
                              </div>
                            </div>
                          )}

                          {/* NEW: Spesifikasi Mutu & Justifikasi & Alternatif */}
                          {!isFailed && (
                            <div className="mt-4 pt-3 border-t border-dashed border-slate-200 space-y-3">
                              <div>
                                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                                  <FileText className="w-3 h-3 text-slate-400" />
                                  <span>Spesifikasi Komposisi / Mutu (KAK)</span>
                                </label>
                                <textarea
                                  value={dppSpecs?.itemSpecs?.[p.id] || ''}
                                  onChange={(e) => setDppSpecs({...dppSpecs, itemSpecs: {...(dppSpecs.itemSpecs || {}), [p.id]: e.target.value}})}
                                  placeholder="Misal: Snack box isi 3 macam kue (manis & asin), air mineral kemasan gelas..."
                                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[40px] resize-y"
                                />
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                    <ClipboardList className="w-3 h-3 text-slate-400" />
                                    <span>Justifikasi Pemilihan</span>
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => enhanceJustificationWithAI(p.id, justifications[p.id] || '')}
                                    disabled={isEnhancingJustification[p.id]}
                                    className="text-[9px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded border border-indigo-200 transition-colors flex items-center gap-1 disabled:opacity-50"
                                    title="Gunakan AI untuk merapikan kalimat ini menjadi bahasa formal PBJ"
                                  >
                                    {isEnhancingJustification[p.id] ? (
                                      <>
                                        <Loader2 className="w-3 h-3 animate-spin mr-1 inline" />
                                        <span>Merapikan...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Sparkles className="w-3 h-3 mr-1 inline text-indigo-650" />
                                        <span>Rapikan Bahasa (AI)</span>
                                      </>
                                    )}
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
                                    className="text-[9px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded w-full text-center transition-colors border border-blue-200 flex items-center justify-center gap-1"
                                  >
                                    <LayoutGrid className="w-3 h-3" />
                                    <span>Template: Satu Pintu (&gt;80%)</span>
                                  </button>
                                  {getPacketCategory(selectedPack?.packName || '').startsWith('Mamin') && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setJustifications({ ...justifications, [p.id]: "Pemilihan penyedia ini disesuaikan dengan ketentuan Surat Edaran Bupati Probolinggo Nomor 000.3/2747/426.42/2025 tentang E-Purchasing Katalog Elektronik untuk pemenuhan aspek pemerataan penyedia lokal dan efisiensi pengiriman Mamin di lingkungan Pemerintah Kabupaten Probolinggo." });
                                      }}
                                      className="text-[9px] font-bold text-amber-750 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded w-full text-center transition-colors border border-amber-200 flex items-center justify-center gap-1"
                                    >
                                      <ClipboardList className="w-3 h-3" />
                                      <span>Template: SE Mamin (Pemerataan)</span>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const currentJustification = justifications[p.id] || '';
                                      if (!currentJustification.trim()) {
                                        dialog.warning('Isi justifikasi terlebih dahulu sebelum diterapkan ke semua barang!', 'Justifikasi Kosong');
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
                                    <span className="flex items-center gap-1 justify-center">
                                      <Sparkles className="w-3 h-3 text-emerald-600" />
                                      <span>Terapkan Alasan ini ke Seluruh Barang</span>
                                    </span>
                                  </button>
                                </div>
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">⚖️ Produk Alternatif</label>
                                <div className="space-y-1.5 p-2 bg-slate-50/80 rounded-lg border border-slate-200/60">
                                  <input 
                                    type="text" placeholder="Nama Produk Alternatif" 
                                    value={(comparisons[p.id] && comparisons[p.id].name) || ''}
                                    onChange={(e) => setComparisons({...comparisons, [p.id]: {...(comparisons[p.id]||{}), name: e.target.value}})}
                                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[9px]"
                                  />
                                  <input 
                                    type="text" placeholder="Penyedia Alternatif" 
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
                                      <select
                                        value={(comparisons[p.id] && comparisons[p.id].lokasi) || ''}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setComparisons({...comparisons, [p.id]: {...(comparisons[p.id]||{}), lokasi: val}});
                                          handleUpdateVendorLocation(p.vendor, val);
                                        }}
                                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[9px] text-slate-800"
                                      >
                                        <option value="">-- Deteksi Otomatis --</option>
                                        <option value="Luar Kabupaten Probolinggo">Luar Kabupaten Probolinggo</option>
                                        <optgroup label="24 Kecamatan Probolinggo">
                                          {DAFTAR_KECAMATAN.map(kec => (
                                            <option key={kec} value={kec}>{kec}</option>
                                          ))}
                                        </optgroup>
                                      </select>
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
                      placeholder={`Kantor ${currentUser?.department || 'Kecamatan'}`}
                      disabled={isSigned}
                    />
                  </div>
                </div>

                


                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 border-t border-slate-200 pt-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <label className="block text-[10px] font-bold text-slate-700 mb-2 uppercase tracking-wider">✍️ Metode Sertifikasi TTD PPK</label>
                    <div className="flex gap-4 mb-3">
                      {[
                        { val: 'scan', label: 'Wet/Scan TTD' },
                        { val: 'tte', label: 'TTE Elektronik (BSrE BSSN)' }
                      ].map(opt => (
                        <label key={opt.val} className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                          <input
                            type="radio"
                            name="sig_method_ppk"
                            value={opt.val}
                            checked={(docSettings.signatureMethodPpk || 'scan') === opt.val}
                            onChange={(e) => {
                              const next = { ...docSettings, signatureMethodPpk: e.target.value };
                              setDocSettings(next);
                              localStorage.setItem('pbj_doc_settings', JSON.stringify(next));
                            }}
                            className="accent-indigo-600"
                            disabled={isSigned}
                          />
                          <span className={(docSettings.signatureMethodPpk || 'scan') === opt.val ? 'font-bold text-indigo-700' : 'text-slate-600'}>{opt.label}</span>
                        </label>
                      ))}
                    </div>

                    {(docSettings.signatureMethodPpk || 'scan') === 'scan' ? (
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
                    ) : (
                      <div className="bg-indigo-50 border border-indigo-150 rounded-lg p-2.5 text-[11px] text-indigo-700 font-sans">
                        <div className="font-bold flex items-center gap-1.5 uppercase text-[9px] text-indigo-800">
                          <span>🛡️</span> Sertifikat Digital BSrE BSSN Aktif
                        </div>
                        <p className="mt-1 leading-relaxed text-[10px]">Dokumen akan ditandatangani secara elektronik (TTE) menggunakan integrasi API Otoritas Sertifikat Pemerintah BSSN.</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <label className="block text-[10px] font-bold text-slate-700 mb-2 uppercase tracking-wider">✍️ Metode Sertifikasi TTD PP</label>
                    <div className="flex gap-4 mb-3">
                      {[
                        { val: 'scan', label: 'Wet/Scan TTD' },
                        { val: 'tte', label: 'TTE Elektronik (BSrE BSSN)' }
                      ].map(opt => (
                        <label key={opt.val} className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                          <input
                            type="radio"
                            name="sig_method_pp"
                            value={opt.val}
                            checked={(docSettings.signatureMethodPp || 'scan') === opt.val}
                            onChange={(e) => {
                              const next = { ...docSettings, signatureMethodPp: e.target.value };
                              setDocSettings(next);
                              localStorage.setItem('pbj_doc_settings', JSON.stringify(next));
                            }}
                            className="accent-indigo-600"
                            disabled={isSigned}
                          />
                          <span className={(docSettings.signatureMethodPp || 'scan') === opt.val ? 'font-bold text-indigo-700' : 'text-slate-600'}>{opt.label}</span>
                        </label>
                      ))}
                    </div>

                    {(docSettings.signatureMethodPp || 'scan') === 'scan' ? (
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
                    ) : (
                      <div className="bg-indigo-50 border border-indigo-150 rounded-lg p-2.5 text-[11px] text-indigo-700 font-sans">
                        <div className="font-bold flex items-center gap-1.5 uppercase text-[9px] text-indigo-800">
                          <span>🛡️</span> Sertifikat Digital BSrE BSSN Aktif
                        </div>
                        <p className="mt-1 leading-relaxed text-[10px]">Dokumen akan ditandatangani secara elektronik (TTE) menggunakan integrasi API Otoritas Sertifikat Pemerintah BSSN.</p>
                      </div>
                    )}
      </div>
      </div>
      </div>
      </div>
      </div>
      
      {/* Action Buttons Step 3 */}
      <div className="flex justify-end mt-8 border-t border-slate-200 pt-6">
        <button
          onClick={() => setStep(4)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-2"
        >
          Lanjut ke Persiapan Dokumen &rarr;
        </button>
      </div>
    </>
  );
}
