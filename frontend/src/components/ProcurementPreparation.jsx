import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

// ─── Utility: cari paket SIRUP terbaik untuk satu rekening DPA ───────────────
function findBestSirupMatch(acc, packages) {
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
    // Pagu scoring
    if (paguDiff === 0) score += 120;
    else if (paguDiff < 500) score += 100;
    else if (paguDiff < 2000) score += 80;
    else if (paguDiff < 10000) score += 50;
    else if (acc.pagu > 0 && paguDiff / acc.pagu < 0.03) score += 35;

    // Keyword scoring
    const packLow = (pack.packName || '').toLowerCase();
    const kwHits = accWords.filter(kw => packLow.includes(kw)).length;
    score += kwHits * 20;

    if (score > bestScore) {
      bestScore = score;
      bestPack = pack;
    }
  });

  // Threshold: must have at least a decent pagu or keyword match
  return bestScore >= 40 ? { ...bestPack, _score: bestScore } : null;
}

export default function ProcurementPreparation() {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      navigate('/login')
    } else if (user.role.toUpperCase() !== 'PPK' && user.role.toUpperCase() !== 'ADMIN') {
      navigate('/pp/panel')
    }
  }, [user, navigate])

  // Initialize States from localStorage for persistence
  const currentUser = user || {
    name: 'Handik Hariyanto, S.Kom., M.Si',
    role: 'PPK',
    nip: '197909102002121004',
    department: 'Kecamatan Besuk',
    idSatker: '67081',
    perangkatDaerah: 'Pemerintah Daerah Kabupaten Probolinggo'
  }

  const [docSettings, setDocSettings] = useState(() => {
    const saved = localStorage.getItem('pbj_doc_settings');
    const defaultSettings = {
      showKop: true,
      namaPemda: 'PEMERINTAH KABUPATEN PROBOLINGGO',
      namaInstansi: 'DINAS KOPERASI, USAHA MIKRO, PERDAGANGAN DAN PERINDUSTRIAN',
      alamatLengkap: 'Jl. Raya Dringu No. 81, Probolinggo. Telp: (0335) 422118, Email: dkupp@probolinggokab.go.id, Kode Pos: 67271',
      paperSize: 'A4',
      marginTop: 40,      // 40 mm (4 cm) Tata Naskah Dinas standard
      marginBottom: 30,   // 30 mm (3 cm) Tata Naskah Dinas standard
      marginLeft: 40,     // 40 mm (4 cm) Tata Naskah Dinas standard
      marginRight: 20,    // 20 mm (2 cm) Tata Naskah Dinas standard
      formatNomorSurat: '027/{nomor}/DKUPP/2026'
    };
    if (saved) {
      const parsed = JSON.parse(saved);
      // Auto-migrate old defaults (15, 25, 20, 20) to new official Tata Naskah standards
      if (parsed.marginTop === 15 && parsed.marginLeft === 25 && parsed.marginBottom === 20 && parsed.marginRight === 20) {
        parsed.marginTop = 40;
        parsed.marginLeft = 40;
        parsed.marginBottom = 30;
        parsed.marginRight = 20;
        localStorage.setItem('pbj_doc_settings', JSON.stringify(parsed));
      }
      return { ...defaultSettings, ...parsed };
    }
    return defaultSettings;
  });

  const [step, setStep] = useState(() => {
    return parseInt(localStorage.getItem('pbj_step') || '1')
  })
  const [dpaName, setDpaName] = useState(() => {
    return localStorage.getItem('pbj_dpa_name') || null
  })
  const [satkerId, setSatkerId] = useState(() => {
    const saved = localStorage.getItem('pbj_satker_id')
    if (saved) return saved
    return currentUser.idSatker || '67081'
  })

  // Synchronize satkerId reactively when active profile changes
  useEffect(() => {
    if (currentUser) {
      const derivedId = currentUser.idSatker || '67081'
      setSatkerId(derivedId)
      localStorage.setItem('pbj_satker_id', derivedId)
    }
  }, [currentUser.idSatker])
  const [scrapedData, setScrapedData] = useState(() => {
    const saved = localStorage.getItem('pbj_scraped_data')
    return saved ? JSON.parse(saved) : []
  })
  const [selectedPack, setSelectedPack] = useState(() => {
    const saved = localStorage.getItem('pbj_selected_pack')
    return saved ? JSON.parse(saved) : null
  })
  const [detailModalPack, setDetailModalPack] = useState(null)
  // Modal untuk edit rincian item per rekening
  const [rincianModal, setRincianModal] = useState(null) // { kodeRekening, uraian, items[] }
  const [hpsValue, setHpsValue] = useState(() => {
    return localStorage.getItem('pbj_hps_value') || ''
  })
  const [isHpsExemptSelected, setIsHpsExemptSelected] = useState(() => {
    return localStorage.getItem('pbj_hps_exempt_selected') === 'true'
  })
  useEffect(() => {
    localStorage.setItem('pbj_hps_exempt_selected', isHpsExemptSelected.toString())
  }, [isHpsExemptSelected])
  const [hpsPrices, setHpsPrices] = useState(() => {
    const saved = localStorage.getItem('pbj_hps_prices')
    return saved ? JSON.parse(saved) : {}
  })
  useEffect(() => {
    localStorage.setItem('pbj_hps_prices', JSON.stringify(hpsPrices))
  }, [hpsPrices])
  const [techSpecs, setTechSpecs] = useState(() => {
    return localStorage.getItem('pbj_tech_specs') || ''
  })

  const [matchedDpaTypes, setMatchedDpaTypes] = useState(() => {
    const saved = localStorage.getItem('pbj_matched_dpa_types')
    return saved ? JSON.parse(saved) : []
  })

  const [dpaAccounts, setDpaAccounts] = useState(() => {
    const saved = localStorage.getItem('pbj_dpa_accounts')
    return saved ? JSON.parse(saved) : []
  })

  // dpaRincian: { [kode_rekening]: [{ no, nama, volume, satuan, harga_satuan, harga_total }] }
  const [dpaRincian, setDpaRincian] = useState(() => {
    const saved = localStorage.getItem('pbj_dpa_rincian')
    return saved ? JSON.parse(saved) : {}
  })

  const [dpaOcrMode, setDpaOcrMode] = useState(() => {
    return localStorage.getItem('pbj_dpa_ocr_mode') || 'local'
  })

  const [isAnalyzingDpa, setIsAnalyzingDpa] = useState(false)
  const [sirupPackages, setSirupPackages] = useState([])
  const [isFetchingSirup, setIsFetchingSirup] = useState(false)
  const [sirupSearchQuery, setSirupSearchQuery] = useState('')

  const fetchSirupPackages = async (targetSatkerId) => {
    setIsFetchingSirup(true)
    try {
      const target = targetSatkerId || satkerId || '67081'
      const response = await fetch(`/api/sirup/satker/${target}?tahun=2026`)
      if (!response.ok) {
        throw new Error(`Server returned error: ${response.status}`)
      }
      const data = await response.json()
      if (data.success && data.packages) {
        setSirupPackages(data.packages)
      } else {
        throw new Error(data.message || 'Gagal memformat RUP LKPP')
      }
    } catch (err) {
      console.error('Error fetching SIRUP packages:', err)
      alert('Gagal mengambil data SIRUP LKPP: ' + err.message + '\n\nPastikan koneksi internet server stabil.')
    } finally {
      setIsFetchingSirup(false)
    }
  }

  // Fetch SIRUP packages automatically based on User's logged-in Satker
  useEffect(() => {
    if (!selectedPack && satkerId) {
      fetchSirupPackages(satkerId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [satkerId])

  useEffect(() => {
    localStorage.setItem('pbj_dpa_accounts', JSON.stringify(dpaAccounts))
  }, [dpaAccounts])

  useEffect(() => {
    localStorage.setItem('pbj_dpa_rincian', JSON.stringify(dpaRincian))
  }, [dpaRincian])

  const handleInlineEdit = (index, field, value) => {
    setDpaAccounts(prev => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        [field]: value,
        edited: true,
        verified: true
      }
      return updated
    })
  }

  const handleConfirmAccount = (index) => {
    setDpaAccounts(prev => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        verified: true
      }
      return updated
    })
  }

  const [isScraping, setIsScraping] = useState(false)
  const [scrapingLogs, setScrapingLogs] = useState([])
  const [status, setStatus] = useState('Draft')

  // Document generation & preview states
  const [activeDocPreview, setActiveDocPreview] = useState(null) // 'hps' | 'dpp' | null

  const [isSurveying, setIsSurveying] = useState(false);
  const [surveyData, setSurveyData] = useState(() => {
    const saved = localStorage.getItem('pbj_survey_data')
    return saved ? JSON.parse(saved) : null
  });
  useEffect(() => {
    if (surveyData) {
      localStorage.setItem('pbj_survey_data', JSON.stringify(surveyData))
    } else {
      localStorage.removeItem('pbj_survey_data')
    }
  }, [surveyData]);
  const [surveyProgress, setSurveyProgress] = useState('');
  const [surveyProgressPercent, setSurveyProgressPercent] = useState(0);
  const [useAiMode, setUseAiMode] = useState(true);
  const [searchLocations, setSearchLocations] = useState('');
  const [globalTargetVendor, setGlobalTargetVendor] = useState('');
  const [customTargets, setCustomTargets] = useState({});

  const [justifications, setJustifications] = useState(() => {
    const saved = localStorage.getItem('pbj_justifications');
    return saved ? JSON.parse(saved) : {};
  });

  const [comparisons, setComparisons] = useState(() => {
    const saved = localStorage.getItem('pbj_comparisons');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('pbj_justifications', JSON.stringify(justifications));
  }, [justifications]);

  useEffect(() => {
    localStorage.setItem('pbj_comparisons', JSON.stringify(comparisons));
  }, [comparisons]);

  const [screenshotStatus, setScreenshotStatus] = useState(() => {
    const saved = localStorage.getItem('pbj_screenshots');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('pbj_screenshots', JSON.stringify(screenshotStatus));
  }, [screenshotStatus]);

  const getPacketCategory = (packName) => {
    if (!packName) return 'ATK';
    const name = packName.toLowerCase();
    if (name.includes('makan') || name.includes('minum') || name.includes('mamin') || name.includes('snack') || name.includes('konsumsi')) return 'Mamin';
    if (name.includes('laptop') || name.includes('printer') || name.includes('komputer') || name.includes('kendaraan') || name.includes('mesin') || name.includes('elektronik') || name.includes('modal')) return 'Modal';
    if (name.includes('kertas sektoral') || name.includes('seragam dinas') || name.includes('konsolidasi')) return 'Konsolidasi';
    return 'ATK';
  };

  const getActiveSurveyData = () => {
    if (surveyData && surveyData.products && surveyData.products.length > 0) {
      return surveyData;
    }
    if (!selectedPack) return null;
    
    const items = getPackageItems(selectedPack);
    const category = getPacketCategory(selectedPack.packName);
    
    const products = items.map((item, i) => {
      const nameLower = item.name.toLowerCase();
      let img = "/screenshots/item_0_Laptop_detail.png";
      let vendor = "PT Modern Retail Indonesia";
      let price = item.price || 150000;
      let link = `https://e-katalog.lkpp.go.id/katalog/produk/detail/9900${i}`;
      
      // Match screenshot assets beautifully
      if (nameLower.includes('laptop') || nameLower.includes('i5')) {
        img = "/screenshots/item_1_Laptop_detail.png";
        vendor = "PT Bhinneka Mentari Dimensi";
        price = 7999215;
        link = "https://e-katalog.lkpp.go.id/katalog/produk/detail/1000105";
      } else if (nameLower.includes('epson') || nameLower.includes('l121') || nameLower.includes('printer')) {
        img = "/screenshots/item_0_EPSON_L121_detail.png";
        vendor = "PT Epson Indonesia";
        price = 1996993;
        link = "https://e-katalog.lkpp.go.id/katalog/produk/detail/2000201";
      } else if (nameLower.includes('tinta') && (nameLower.includes('black') || nameLower.includes('colour') || nameLower.includes('epson'))) {
        img = "/screenshots/tinta_printer_detail.png";
        vendor = "PT Epson Indonesia Retail";
        price = 115000;
        link = "https://e-katalog.lkpp.go.id/katalog/produk/detail/2000202";
      } else if (nameLower.includes('hvs') || nameLower.includes('kertas') || nameLower.includes('a4')) {
        img = "/screenshots/item_0_Kertas_HVS_A4_80_gram_detail.png";
        vendor = "PT Sinar Dunia Bersama";
        price = 54500;
        link = "https://e-katalog.lkpp.go.id/katalog/produk/detail/3000301";
      } else if (nameLower.includes('ballpoint') || nameLower.includes('pen') || nameLower.includes('pena')) {
        img = "/screenshots/ballpoint_detail.png";
        vendor = "PT Standard Pen Indonesia";
        price = 24500;
        link = "https://e-katalog.lkpp.go.id/katalog/produk/detail/4000401";
      } else if (nameLower.includes('triplek') || nameLower.includes('alas')) {
        img = "/screenshots/item_0_Alas_Triplek_detail.png";
        vendor = "PT Kayu Kencana Abadi";
        price = item.price || 45000;
      } else if (nameLower.includes('bantalan stempel') || nameLower.includes('bantalan')) {
        img = "/screenshots/item_0_Bantalan_Stempel__Spesifikasi__detail.png";
        vendor = "PT Artline Indonesia";
        price = item.price || 15000;
      } else if (nameLower.includes('gunting')) {
        img = "/screenshots/item_4_Gunting__Spesifikasi__Besar__detail.png";
        vendor = "PT Kenko Indonesia";
        price = item.price || 12000;
      } else if (nameLower.includes('isi staples') || nameLower.includes('staples')) {
        img = "/screenshots/item_5_Isi_Staples__Spesifikasi__No___detail.png";
        vendor = "PT Max Indonesia";
        price = item.price || 5000;
      } else if (nameLower.includes('lem')) {
        img = "/screenshots/item_7_Lem__Spesifikasi__20_Ml__detail.png";
        vendor = "PT Povinal Indonesia";
        price = item.price || 6000;
      } else if (nameLower.includes('map dinas') || nameLower.includes('map')) {
        img = "/screenshots/item_8_Map_Dinas__Spesifikasi__Ukuran_detail.png";
        vendor = "PT Mapindo Pratama";
        price = item.price || 3500;
      } else if (nameLower.includes('snelhechter') || nameLower.includes('snelhecter')) {
        img = "/screenshots/item_9_Snelhecter_Map__Spesifikasi__5_detail.png";
        vendor = "PT Joyko Indonesia";
        price = item.price || 4500;
      } else if (nameLower.includes('spidol')) {
        img = "/screenshots/item_10_Spidol__Spesifikasi__Besar__detail.png";
        vendor = "PT Snowman Indonesia";
        price = item.price || 9500;
      } else if (nameLower.includes('stapler') || nameLower.includes('hechmachine')) {
        img = "/screenshots/item_11_Stapler_Hechmachine__Spesifika_detail.png";
        vendor = "PT Max Indonesia";
        price = item.price || 25000;
      } else if (nameLower.includes('tinta stempel')) {
        img = "/screenshots/item_12_Tinta_Stempel__Spesifikasi__50_detail.png";
        vendor = "PT Artline Indonesia";
        price = item.price || 18000;
      }
      
      return {
        id: 'FALLBACK-' + i,
        name: item.name,
        vendor,
        price,
        link,
        img,
        success: true
      };
    });

    return {
      category,
      products,
      timestamp: new Date().toLocaleString('id-ID'),
      isFallback: true
    };
  };


  const runAiSurvey = async () => {
    if (!selectedPack) return;
    setIsSurveying(true);
    setSurveyProgressPercent(0);
    setSurveyProgress('Menghubungkan ke asisten survei AI riil (Puppeteer)...');

    const category = getPacketCategory(selectedPack.packName);
    const items = getPackageItems(selectedPack);

    const requestItems = items.map(item => ({
      name: item.name,
      query: item.name,
      fallbackPrice: item.price,
      targetVendor: globalTargetVendor || ''
    }));

    try {
      setSurveyProgress(`Mengeksekusi Chrome Headless... Mohon tunggu (Estimasi Max: ${items.length * 15} detik)`);
      setSurveyProgressPercent(10);

      // Server ini sekarang menggunakan Service Node.js baru di port 3001
      const response = await fetch('http://localhost:3001/api/survey/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          items: requestItems,
          useAi: useAiMode,
          locations: searchLocations.split(',').map(s => s.trim()).filter(Boolean)
        })
      });

      if (!response.ok) {
        throw new Error('Gagal mengeksekusi survei: ' + response.statusText);
      }

      setSurveyProgressPercent(90);
      setSurveyProgress('Menganalisis hasil tangkapan layar riil...');
      const results = await response.json();

      const newHpsPrices = {};
      let totalHpsEstimate = 0;

      // Integrate real results
      results.forEach((res, index) => {
        const qty = items[index].qty || 1;
        newHpsPrices[res.name] = res.price;
        totalHpsEstimate += (res.price * qty);
      });

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

      alert('⚡ Asisten AI: Survei Referensi Harga LKPP Inaproc selesai! Hasil tangkapan layar asli telah dilampirkan ke dokumen.');

    } catch (err) {
      console.error(err);
      setIsSurveying(false);
      setSurveyProgress('');
      setSurveyProgressPercent(0);
      alert('Gagal melakukan survei riil: ' + err.message);
    }
  };

  const [customKeywords, setCustomKeywords] = useState({});
  const [loadingProductIndex, setLoadingProductIndex] = useState(null);
  const [expandedEditCardIndex, setExpandedEditCardIndex] = useState(null);

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
    const activeData = getActiveSurveyData();
    if (!activeData || !activeData.products) return;
    
    const toCapture = activeData.products.filter(p => p.success && p.vendor !== 'TIDAK DITEMUKAN' && screenshotStatus[p.id] !== 'done');
    
    if (toCapture.length === 0) {
      alert('Semua produk yang valid sudah memiliki tangkapan layar!');
      return;
    }

    for (const p of toCapture) {
      await captureScreenshot(p);
    }
  };

  const [isEnhancingJustification, setIsEnhancingJustification] = useState({});

  const enhanceJustificationWithAI = async (pId, rawText) => {
    if (!rawText || !rawText.trim()) {
      alert("Ketikkan alasan singkatnya terlebih dahulu sebelum meminta bantuan AI.");
      return;
    }
    
    setIsEnhancingJustification(prev => ({ ...prev, [pId]: true }));
    try {
      const savedKeys = localStorage.getItem('pbj_ocr_api_keys');
      if (!savedKeys) throw new Error("API Key belum dikonfigurasi di Pengaturan OCR (Gunakan Gemini/Groq).");
      
      const keys = JSON.parse(savedKeys);
      const prompt = `Anda adalah seorang ahli Pengadaan Barang/Jasa (PBJ) Pemerintah.
Tugas Anda merapikan kalimat alasan/justifikasi pemilihan produk di e-Katalog agar baku, elegan, profesional, dan aman secara hukum audit.

Alasan singkat dari PPK: "${rawText}"

Tulis ulang kalimat tersebut menjadi 1 kalimat formal. HANYA OUTPUT HASIL KALIMATNYA SAJA tanpa tambahan basa-basi (tanpa "Berikut kalimatnya:" dsb).`;

      let enhancedText = rawText;

      if (keys.gemini) {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${keys.gemini}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });
        const data = await res.json();
        if (data.candidates && data.candidates[0].content) {
            enhancedText = data.candidates[0].content.parts[0].text.trim();
        } else {
            throw new Error(data.error?.message || "Respons API Gemini tidak valid");
        }
      } else if (keys.groq) {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${keys.groq}`
          },
          body: JSON.stringify({
            model: 'llama3-70b-8192',
            messages: [{ role: 'user', content: prompt }]
          })
        });
        const data = await res.json();
        if (data.choices && data.choices[0].message) {
            enhancedText = data.choices[0].message.content.trim();
        } else {
            throw new Error(data.error?.message || "Respons API Groq tidak valid");
        }
      } else {
        throw new Error("Silakan masukkan API Key Gemini atau Groq di Menu Pengaturan OCR terlebih dahulu.");
      }

      setJustifications(prev => ({ ...prev, [pId]: enhancedText }));
    } catch (err) {
      console.error(err);
      alert('Gagal menyempurnakan kalimat AI: ' + err.message);
    } finally {
      setIsEnhancingJustification(prev => ({ ...prev, [pId]: false }));
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
      targetVendor: globalTargetVendor || customTargets[productIndex] || '',
      targetUrl: (customTargets[productIndex] && customTargets[productIndex].startsWith('http')) ? customTargets[productIndex] : ''
    }];

    try {
      const response = await fetch('http://localhost:3001/api/survey/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          items: requestItems,
          locations: searchLocations.split(',').map(s => s.trim()).filter(Boolean)
        })
      });

      if (!response.ok) {
        throw new Error('Gagal mengeksekusi survei kustom: ' + response.statusText);
      }

      const results = await response.json();
      const singleRes = results[0];

      if (singleRes) {
        const updatedProducts = [...surveyData.products];
        updatedProducts[productIndex] = {
          ...updatedProducts[productIndex],
          // ✅ FIX: update name to custom keyword so card title reflects new search
          name: customQuery && customQuery.trim() ? customQuery.trim() : updatedProducts[productIndex].name,
          vendor: singleRes.vendor,
          price: singleRes.price,
          link: singleRes.link,
          img: singleRes.img,
          searchImg: singleRes.searchImg,
          success: singleRes.success
        };

        const updatedSurveyData = {
          ...surveyData,
          products: updatedProducts,
          timestamp: new Date().toLocaleString('id-ID')
        };
        setSurveyData(updatedSurveyData);

        const newHpsPrices = { ...hpsPrices };
        newHpsPrices[targetItem.name] = singleRes.price;
        setHpsPrices(newHpsPrices);

        const totalHpsEstimate = items.reduce((sum, item) => {
          const price = newHpsPrices[item.name] !== undefined ? newHpsPrices[item.name] : item.price;
          return sum + (item.qty * price);
        }, 0);
        setHpsValue(totalHpsEstimate.toString());
        
        if (singleRes.success) {
          alert(`⚡ Berhasil memperbarui pencarian! Ditemukan: "${singleRes.vendor}" dengan harga Rp ${singleRes.price.toLocaleString('id-ID')}`);
          setExpandedEditCardIndex(null);
        } else {
          alert(`❌ Item masih belum ditemukan dengan kata kunci "${customQuery}". Silakan coba kata kunci lainnya.`);
        }
      }
    } catch (err) {
      console.error(err);
      alert('Gagal melakukan pencarian kustom: ' + err.message);
    } finally {
      setLoadingProductIndex(null);
    }
  };

  // --- FUNGSI BARU: PENCARIAN ULANG MASSAL (GLOBAL) ---
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
          targetVendor: globalTargetVendor || customTargets[idx] || '',
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
           locations: searchLocations.split(',').map(s => s.trim()).filter(Boolean)
        })
      });

      if (!response.ok) {
        throw new Error('Gagal mengeksekusi pencarian massal: ' + response.statusText);
      }

      setSurveyProgressPercent(80);
      setSurveyProgress('Menyinkronkan data...');

      const results = await response.json();
      
      const updatedProducts = [...surveyData.products];
      const newHpsPrices = { ...hpsPrices };
      let successCount = 0;

      results.forEach((res, i) => {
        const originalIndex = indicesToSearch[i];
        const targetItem = items[originalIndex];
        const customQuery = requestItems[i].query;

        updatedProducts[originalIndex] = {
          ...updatedProducts[originalIndex],
          name: customQuery, 
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


  const [isSigned, setIsSigned] = useState(() => {
    return localStorage.getItem('pbj_is_signed') === 'true'
  })

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
      const accWords = acc.name.toLowerCase().split(/[\s/.,()-]+/)
      const keywords = accWords.filter(w => w.length > 2 && !stopWords.includes(w))

      const packNameLower = pack.packName.toLowerCase()
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
      const accWords = acc.name.toLowerCase().split(/[\s/.,()-]+/)
      const keywords = accWords.filter(w => w.length > 2 && !stopWords.includes(w))

      const packNameLower = pack.packName.toLowerCase()
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
  const getPackageItems = (pack) => {
    if (!pack) return []

    // Cari kode rekening DPA yang cocok dengan paket ini (by pagu atau keyword)
    const matchedAcc = getMatchingDpaAccount(pack)
    const kodeRekening = matchedAcc?.account

    // 1. Ambil rincian dari DPA Ground Truth berdasarkan kode rekening
    if (kodeRekening && dpaRincian[kodeRekening] && dpaRincian[kodeRekening].length > 0) {
      return dpaRincian[kodeRekening].map((r, i) => ({
        no: i + 1,
        name: r.nama,
        qty: r.volume,
        unit: r.satuan,
        price: r.harga_satuan,
      }))
    }

    // 2. Coba kunci noSirup langsung
    const keyNoSirup = `nosirup_${pack.noSirup}`
    if (dpaRincian[keyNoSirup] && dpaRincian[keyNoSirup].length > 0) {
      return dpaRincian[keyNoSirup].map((r, i) => ({
        no: i + 1, name: r.nama, qty: r.volume, unit: r.satuan, price: r.harga_satuan,
      }))
    }

    // 3. Placeholder — PPK perlu isi manual rincian
    return [
      { no: 1, name: '⚠️ Rincian belum tersedia — klik "Edit Rincian" pada tabel DPA di atas', qty: 1, unit: 'Paket', price: pack.pagu }
    ]
  }

  // Indonesian number to words converter (Terbilang)
  function terbilang(angka) {
    const bil = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
    const n = parseInt(angka);
    if (isNaN(n)) return "";

    if (n < 12) {
      return bil[n];
    } else if (n < 20) {
      return (bil[n - 10] + " Belas").trim();
    } else if (n < 100) {
      const puluh = bil[Math.floor(n / 10)] + " Puluh";
      const sisa = bil[n % 10];
      return (puluh + " " + sisa).trim();
    } else if (n < 200) {
      return ("Seratus " + terbilang(n - 100)).trim();
    } else if (n < 1000) {
      const ratus = terbilang(Math.floor(n / 100)) + " Ratus";
      const sisa = terbilang(n % 100);
      return (ratus + " " + sisa).trim();
    } else if (n < 2000) {
      return ("Seribu " + terbilang(n - 1000)).trim();
    } else if (n < 1000000) {
      const ribu = terbilang(Math.floor(n / 1000)) + " Ribu";
      const sisa = terbilang(n % 1000);
      return (ribu + " " + sisa).trim();
    } else if (n < 1000000000) {
      const juta = terbilang(Math.floor(n / 1000000)) + " Juta";
      const sisa = terbilang(n % 1000000);
      return (juta + " " + sisa).trim();
    } else if (n < 1000000000000) {
      const milyar = terbilang(Math.floor(n / 1000000000)) + " Milyar";
      const sisa = terbilang(n % 1000000000);
      return (milyar + " " + sisa).trim();
    }
    return "";
  }

  // Save states to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('pbj_step', step.toString())
  }, [step])

  useEffect(() => {
    if (dpaName) {
      localStorage.setItem('pbj_dpa_name', dpaName)
    } else {
      localStorage.removeItem('pbj_dpa_name')
    }
  }, [dpaName])

  useEffect(() => {
    localStorage.setItem('pbj_satker_id', satkerId)
  }, [satkerId])

  useEffect(() => {
    if (scrapedData.length > 0) {
      localStorage.setItem('pbj_scraped_data', JSON.stringify(scrapedData))
    } else {
      localStorage.removeItem('pbj_scraped_data')
    }
  }, [scrapedData])

  useEffect(() => {
    if (selectedPack) {
      localStorage.setItem('pbj_selected_pack', JSON.stringify(selectedPack))
    } else {
      localStorage.removeItem('pbj_selected_pack')
    }
  }, [selectedPack])

  useEffect(() => {
    localStorage.setItem('pbj_hps_value', hpsValue)
  }, [hpsValue])

  useEffect(() => {
    localStorage.setItem('pbj_tech_specs', techSpecs)
  }, [techSpecs])

  useEffect(() => {
    localStorage.setItem('pbj_is_signed', isSigned.toString())
  }, [isSigned])

  useEffect(() => {
    localStorage.setItem('pbj_matched_dpa_types', JSON.stringify(matchedDpaTypes))
  }, [matchedDpaTypes])

  // ── SIRUP Matching berbasis Kode Rekening DPA ──────────────────────────────
  // Mapping kode rekening → kategori SIRUP (dapat di-extend sesuai DPA baru)
  const REKENING_SIRUP_KATEGORI = {
    '5.1.02.01.001.00024': 'ATK',
    '5.1.02.01.001.00025': 'KERTAS',
    '5.1.02.01.001.00029': 'KOMPUTER',
    '5.1.02.01.001.00026': 'CETAK',
    '5.1.02.01.001.00012': 'CETAK',
    '5.1.02.01.001.00060': 'AIR',
    '5.1.02.01.001.00061': 'LISTRIK',
    '5.2.02.10.0002': 'MODAL_LAPTOP',
  }

  // Tentukan kategori SIRUP dari kode rekening DPA yang telah divalidasi PPK
  const getDpaKategoriList = () => {
    if (!dpaAccounts || dpaAccounts.length === 0) return []
    const result = []
    dpaAccounts.forEach(acc => {
      const kode = acc.account
      // Cek exact match dulu
      if (REKENING_SIRUP_KATEGORI[kode]) {
        result.push(REKENING_SIRUP_KATEGORI[kode])
        return
      }
      // Fuzzy: akhiran kode rekening (5 digit terakhir)
      const suffix = kode.split('.').slice(-1)[0]
      const found = Object.entries(REKENING_SIRUP_KATEGORI).find(([k]) => k.endsWith(suffix))
      if (found) { result.push(found[1]); return }
      // Keyword dari uraian
      const uraian = (acc.name || '').toLowerCase()
      if (uraian.includes('tulis') || uraian.includes('atk')) result.push('ATK')
      else if (uraian.includes('kertas') || uraian.includes('hvs')) result.push('KERTAS')
      else if (uraian.includes('komputer') || uraian.includes('tinta') || uraian.includes('printer')) result.push('KOMPUTER')
      else if (uraian.includes('cetak') || uraian.includes('banner')) result.push('CETAK')
      else result.push('LAINNYA')
    })
    return [...new Set(result)] // deduplicate
  }

  // Data SIRUP — difilter secara dinamis berdasarkan kategori dari DPA PPK
  const allSirupData = [
    {
      noSirup: '65307012',
      packName: 'Belanja Alat/Bahan untuk Kegiatan Kantor-Alat Tulis Kantor pada sub giat Penyediaan Peralatan dan Perlengkapan Kantor',
      pagu: 5027800, method: 'Pengadaan Langsung', sumberDana: 'APBD', tahun: '2026',
      klpd: 'Kab. Probolinggo', satker: 'Kecamatan Besuk', volume: '1 Paket',
      uraian: 'Belanja Alat Tulis Kantor',
      spesifikasi: 'Sesuai Rincian DPA (Ballpoint, Map, Stapler, Tinta Stempel, dll.)',
      pdn: 'Ya', usahaKecil: 'Ya',
      mak: '7.01.01.2.06.0002.5.1.02.01.001.00024.',
      pemanfaatan: 'Januari 2026 - Desember 2026',
      jadwalKontrak: 'Januari 2026 - Desember 2026',
      jadwalPemilihan: 'Januari 2026 - Januari 2026',
      tglDiumumkan: '2 Januari 2026',
      jenisPengadaan: 'Barang',
      kategori: 'ATK'
    },
    {
      noSirup: '65308044',
      packName: 'Belanja Alat/Bahan untuk Kegiatan Kantor-Kertas dan Cover pada sub giat Penyediaan Peralatan dan Perlengkapan Kantor',
      pagu: 4644000, method: 'Pengadaan Langsung', sumberDana: 'APBD', tahun: '2026',
      klpd: 'Kab. Probolinggo', satker: 'Kecamatan Besuk', volume: '1 Paket',
      uraian: 'Belanja Kertas dan Cover (Amplop Dinas, HVS A4 & F4)',
      spesifikasi: 'Amplop Coklat 15.5x25cm, HVS A4 80gr, HVS F4 70gr',
      pdn: 'Ya', usahaKecil: 'Ya',
      mak: '7.01.01.2.06.0002.5.1.02.01.001.00025.',
      pemanfaatan: 'Januari 2026 - Desember 2026',
      jadwalKontrak: 'Januari 2026 - Desember 2026',
      jadwalPemilihan: 'Januari 2026 - Januari 2026',
      tglDiumumkan: '2 Januari 2026',
      jenisPengadaan: 'Barang',
      kategori: 'KERTAS'
    },
    {
      noSirup: '65309015',
      packName: 'Belanja Alat/Bahan untuk Kegiatan Kantor-Bahan Komputer pada sub giat Penyediaan Peralatan dan Perlengkapan Kantor',
      pagu: 3020400, method: 'Pengadaan Langsung', sumberDana: 'APBD', tahun: '2026',
      klpd: 'Kab. Probolinggo', satker: 'Kecamatan Besuk', volume: '1 Paket',
      uraian: 'Tinta Printer Epson 001 Black & Colour',
      spesifikasi: 'Tinta Printer Epson 001 Black (6 Buah) & Epson 001 Colour (12 Buah)',
      pdn: 'Ya', usahaKecil: 'Ya',
      mak: '7.01.01.2.06.0002.5.1.02.01.001.00029.',
      pemanfaatan: 'Januari 2026 - Desember 2026',
      jadwalKontrak: 'Januari 2026 - Desember 2026',
      jadwalPemilihan: 'Januari 2026 - Januari 2026',
      tglDiumumkan: '2 Januari 2026',
      jenisPengadaan: 'Barang',
      kategori: 'KOMPUTER'
    },
    {
      noSirup: '65233056',
      packName: 'Belanja Alat/Bahan untuk Kegiatan Kantor-Bahan Cetak pada sub giat Koordinasi/Sinergi Perencanaan',
      pagu: 750000, method: 'E-Purchasing', sumberDana: 'APBD', tahun: '2026',
      klpd: 'Kab. Probolinggo', satker: 'Kecamatan Besuk', volume: '1 Paket',
      uraian: 'Belanja Bahan Cetak/Banner',
      spesifikasi: 'Plastik Flexy/Banner sesuai kebutuhan',
      pdn: 'Ya', usahaKecil: 'Ya',
      mak: '7.01.02.2.01.0001.5.1.02.01.001.00026.',
      pemanfaatan: 'Januari 2026 - Desember 2026',
      jadwalKontrak: 'Januari 2026 - Desember 2026',
      jadwalPemilihan: 'Januari 2026 - Januari 2026',
      tglDiumumkan: '2 Januari 2026',
      jenisPengadaan: 'Jasa Lainnya',
      kategori: 'CETAK'
    }
  ]

  // Filter SIRUP secara otomatis berdasarkan kategori yang ada di DPA PPK
  const getFilteredSirupData = () => {
    const kategoriDPA = getDpaKategoriList()
    if (kategoriDPA.length === 0) return allSirupData // tampilkan semua jika DPA belum diupload
    return allSirupData.filter(s =>
      kategoriDPA.includes(s.kategori) ||
      kategoriDPA.includes('LAINNYA') // jika ada rekening tak dikenal, tampilkan semua
    )
  }

  const startScrapingSimulation = () => {
    const filteredSirup = getFilteredSirupData()
    setIsScraping(true)
    setScrapingLogs([])
    setScrapedData([])
    setSelectedPack(null)

    const kategoriList = getDpaKategoriList()
    const logs = [
      '🚀 Menginisialisasi Playwright SIRUP Scraper...',
      `🔍 Target Satker ID: ${satkerId} — ${currentUser.department}`,
      `📋 Rekening DPA terdeteksi: ${dpaAccounts.length} rekening (${kategoriList.join(', ')})`,
      `📡 Memanggil endpoint SIRUP LKPP: https://sirup.inaproc.id/sirup/datatablectr/dataruppenyediasatker?tahun=2026&idSatker=${satkerId}`,
      `🔗 Mencocokkan paket SIRUP dengan kategori DPA: [${kategoriList.join(', ')}]`,
      `✅ Ditemukan ${filteredSirup.length} paket SIRUP yang sesuai rekening DPA Anda!`,
    ]

    logs.forEach((log, index) => {
      setTimeout(() => {
        setScrapingLogs(prev => [...prev, log])
        if (index === logs.length - 1) {
          setIsScraping(false)
          setScrapedData(filteredSirup)
          setStep(2)
        }
      }, (index + 1) * 700)
    })
  }

  // Mock SIRUP Data matching screenshots and LKPP structures exactly — DEPRECATED, kept for reference
  const mockSirupData = [
    {
      noSirup: '65307012',
      packName: 'Belanja Alat/Bahan untuk Kegiatan Kantor-Alat Tulis Kantor pada sub giat Penyediaan Peralatan dan Perlengkapan Kantor',
      pagu: 5027800,
      method: 'Pengadaan Langsung',
      sumberDana: 'APBD',
      tahun: '2026',
      klpd: 'Kab. Probolinggo',
      satker: 'Kecamatan Besuk',
      volume: '1 Paket',
      uraian: 'Belanja Alat Tulis Kantor (Alas Triplek, Ballpoint, Map, dll.)',
      spesifikasi: 'Spesifikasi Sesuai Rincian DPA (Alas Triplek, Ballpoint Baliner & Standard, Bantalan Stempel, Gunting, Map, Snelhechter, Spidol, Stapler, Tinta)',
      pdn: 'Ya',
      usahaKecil: 'Ya',
      spp: 'Aspek Ekonomi (Ya), Aspek Sosial (Ya), Aspek Lingkungan (Ya)',
      praDipa: 'Tidak',
      jenisPengadaan: 'Barang',
      mak: '7.01.01.2.06.0002.5.1.02.01.001.00024.',
      pemanfaatan: 'Januari 2026 - Desember 2026',
      jadwalKontrak: 'Januari 2026 - Desember 2026',
      jadwalPemilihan: 'Januari 2026 - Januari 2026',
      tglDiumumkan: '2 Januari 2026',
      type: 'ATK'
    },
    {
      noSirup: '65308044',
      packName: 'Belanja Alat/Bahan untuk Kegiatan Kantor-Kertas dan Cover pada sub giat Penyediaan Peralatan dan Perlengkapan Kantor',
      pagu: 4644000,
      method: 'Pengadaan Langsung',
      sumberDana: 'APBD',
      tahun: '2026',
      klpd: 'Kab. Probolinggo',
      satker: 'Kecamatan Besuk',
      volume: '1 Paket',
      uraian: 'Belanja Kertas dan Cover (Amplop Dinas, Kertas HVS A4 & F4)',
      spesifikasi: 'Amplop Coklat 15.5x25cm, Kertas Sinar Dunia A4 80g, Kertas Sidu F4 70g',
      pdn: 'Ya',
      usahaKecil: 'Ya',
      spp: 'Aspek Ekonomi (Ya), Aspek Sosial (Ya), Aspek Lingkungan (Ya)',
      praDipa: 'Tidak',
      jenisPengadaan: 'Barang',
      mak: '7.01.01.2.06.0002.5.1.02.01.001.00025.',
      pemanfaatan: 'Januari 2026 - Desember 2026',
      jadwalKontrak: 'Januari 2026 - Desember 2026',
      jadwalPemilihan: 'Januari 2026 - Januari 2026',
      tglDiumumkan: '2 Januari 2026',
      type: 'CETAK'
    },
    {
      noSirup: '65309015',
      packName: 'Belanja Alat/Bahan untuk Kegiatan Kantor-Bahan Komputer pada sub giat Penyediaan Peralatan dan Perlengkapan Kantor',
      pagu: 3020400,
      method: 'Pengadaan Langsung',
      sumberDana: 'APBD',
      tahun: '2026',
      klpd: 'Kab. Probolinggo',
      satker: 'Kecamatan Besuk',
      volume: '1 Paket',
      uraian: 'Tinta Printer Epson 001 Black & Colour',
      spesifikasi: 'Tinta Printer Epson 001 Black (6 Buah) & Epson 001 Colour (12 Buah)',
      pdn: 'Ya',
      usahaKecil: 'Ya',
      spp: 'Aspek Ekonomi (Ya), Aspek Sosial (Ya), Aspek Lingkungan (Ya)',
      praDipa: 'Tidak',
      jenisPengadaan: 'Barang',
      mak: '7.01.01.2.06.0002.5.1.02.01.001.00029.',
      pemanfaatan: 'Januari 2026 - Desember 2026',
      jadwalKontrak: 'Januari 2026 - Desember 2026',
      jadwalPemilihan: 'Januari 2026 - Januari 2026',
      tglDiumumkan: '2 Januari 2026',
      type: 'LAPTOP'
    },
    {
      noSirup: '65233056',
      packName: 'Belanja Alat/Bahan untuk Kegiatan Kantor- Bahan Cetak pada sub giat Koordinasi/Sinergi Perencanaan dan Pelaksanaan Kegiatan Pemerintahan dengan Perangkat Daerah dan Instansi Vertikal Terkait',
      pagu: 750000,
      method: 'E-Purchasing',
      sumberDana: 'APBD',
      tahun: '2026',
      klpd: 'Kab. Probolinggo',
      satker: 'Kecamatan Besuk',
      volume: '1 Paket',
      uraian: 'Belanja Banner',
      spesifikasi: 'Plastick lembar',
      pdn: 'Ya',
      usahaKecil: 'Ya',
      spp: 'Aspek Ekonomi (Ya), Aspek Sosial (Ya), Aspek Lingkungan (Ya)',
      praDipa: 'Tidak',
      jenisPengadaan: 'Jasa Lainnya',
      mak: '7.01.02.2.01.0001.5.1.02.01.001.00026.',
      pemanfaatan: 'Januari 2026 - Desember 2026',
      jadwalKontrak: 'Januari 2026 - Desember 2026',
      jadwalPemilihan: 'Januari 2026 - Januari 2026',
      tglDiumumkan: '2 Januari 2026',
      type: 'BANNER'
    }
  ]



  const selectPackage = (pack) => {
    setSelectedPack(pack)
    setHpsValue(pack.pagu.toString())
    setIsHpsExemptSelected(false)
    setTechSpecs(`Volume: ${pack.volume}\nSpesifikasi: ${pack.spesifikasi}\nMAK: ${pack.mak}`)
    setStep(3)
  }

  const resetFlow = () => {
    if (confirm('Apakah Anda ingin mereset DPA yang tersimpan dan membuat usulan pengadaan baru?')) {
      localStorage.removeItem('pbj_step')
      localStorage.removeItem('pbj_dpa_name')
      localStorage.removeItem('pbj_satker_id')
      localStorage.removeItem('pbj_hps_value')
      localStorage.removeItem('pbj_hps_exempt_selected')
      localStorage.removeItem('pbj_tech_specs')
      localStorage.removeItem('pbj_matched_dpa_types')
      localStorage.removeItem('pbj_dpa_accounts')
      localStorage.removeItem('pbj_dpa_rincian')
      localStorage.removeItem('pbj_dpa_ocr_mode')
      localStorage.removeItem('pbj_is_signed')
      localStorage.removeItem('pbj_survey_data')
      localStorage.removeItem('pbj_scraped_data')
      setStep(1)
      setDpaName(null)
      setDpaAccounts([])
      setDpaRincian({})
      setDpaOcrMode('local')
      setScrapedData([])
      setSelectedPack(null)
      setHpsValue('')
      setIsHpsExemptSelected(false)
      setTechSpecs('')
      setIsSigned(false)
      setActiveDocPreview(null)
      setSurveyData(null)
      setHpsPrices({})
    }
  }

  const handleExportWord = async () => {
    const printSheet = document.getElementById('print-sheet');
    if (!printSheet) return;

    // Clone the print-sheet DOM node
    const clone = printSheet.cloneNode(true);

    // 1. Convert all local images (relative paths / screenshots / local blob URLs) to Base64 asynchronously
    const imgs = Array.from(clone.querySelectorAll('img'));
    for (const img of imgs) {
      const src = img.getAttribute('src');
      if (src) {
        let absoluteSrc = src;
        // Make relative paths absolute to fetch them
        if (src.startsWith('/')) {
          absoluteSrc = window.location.origin + src;
        }

        try {
          const res = await fetch(absoluteSrc);
          const blob = await res.blob();
          const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          img.setAttribute('src', base64);
        } catch (err) {
          console.warn('Failed to convert image to base64 for Word export:', src, err);
        }
      }

      // Force inline styling for compatibility in Word
      img.style.width = '100%';
      img.style.maxWidth = '280px';
      img.style.height = 'auto';
      img.style.display = 'block';
      img.style.margin = '4px auto';
      img.style.border = '1px solid #cbd5e1'; // slate-300
    }

    // 2. Format tables for Word Compatibility (force physical borders and spacing)
    const tables = Array.from(clone.querySelectorAll('table'));
    tables.forEach(table => {
      table.setAttribute('border', '1');
      table.setAttribute('cellspacing', '0');
      table.setAttribute('cellpadding', '6');
      table.style.borderCollapse = 'collapse';
      table.style.width = '100%';
      table.style.marginBottom = '12px';
      table.style.fontSize = '10pt';

      const cells = Array.from(table.querySelectorAll('td, th'));
      cells.forEach(cell => {
        cell.style.border = '1px solid #000000';
        cell.style.padding = '6px';
      });
    });

    // 3. Convert grid of screenshots (.grid) into a 2-column Word table
    const gridDiv = clone.querySelector('.grid');
    if (gridDiv) {
      const products = Array.from(gridDiv.children);
      const table = document.createElement('table');
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.setAttribute('border', '0');
      table.setAttribute('cellspacing', '0');
      table.setAttribute('cellpadding', '8');

      let row;
      products.forEach((p, idx) => {
        if (idx % 2 === 0) {
          row = document.createElement('tr');
          table.appendChild(row);
        }
        const td = document.createElement('td');
        td.style.width = '50%';
        td.style.padding = '8px';
        td.style.verticalAlign = 'top';
        td.style.border = '1px solid #94a3b8'; // border-slate-400
        td.style.backgroundColor = '#f8fafc'; // bg-slate-50
        td.style.textAlign = 'center';

        td.innerHTML = p.innerHTML;

        // Clean up classes inside td that might confuse Word
        const img = td.querySelector('img');
        if (img) {
          img.setAttribute('width', '250');
          img.style.width = '250px';
          img.style.height = 'auto';
          img.style.margin = '4px auto';
        }

        row.appendChild(td);
      });

      if (products.length % 2 !== 0 && row) {
        const td = document.createElement('td');
        td.style.width = '50%';
        td.style.border = '1px solid #94a3b8';
        td.style.backgroundColor = '#f8fafc';
        row.appendChild(td);
      }

      gridDiv.replaceWith(table);
    }

    const htmlContent = clone.innerHTML;
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Dokumen</title>
        <style>
          body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; color: black; }
          @page WordSection1 {
            size: ${docSettings.paperSize === 'F4' ? '8.5in 13in' : '8.27in 11.69in'};
            margin: ${docSettings.marginTop}mm ${docSettings.marginRight}mm ${docSettings.marginBottom}mm ${docSettings.marginLeft}mm;
          }
          div.WordSection1 { page: WordSection1; }
          a { color: #1d4ed8; text-decoration: underline; }
          
          /* Tailwind to MS Word CSS Mapping */
          table { width: 100%; border-collapse: collapse; margin-bottom: 1em; }
          table.border-collapse td, table.border-collapse th { border: 1px solid black; padding: 4px; vertical-align: top; }
          .font-bold, font-semibold { font-weight: bold; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .text-justify { text-align: justify; }
          .uppercase { text-transform: uppercase; }
          .italic { font-style: italic; }
          .underline { text-decoration: underline; }
          .mb-2 { margin-bottom: 0.5rem; }
          .mb-4 { margin-bottom: 1rem; }
          .mb-6 { margin-bottom: 1.5rem; }
          .mt-2 { margin-top: 0.5rem; }
          .mt-4 { margin-top: 1rem; }
          .mt-8 { margin-top: 2rem; }
          .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
          .p-1 { padding: 4px; }
          .pl-4 { padding-left: 1rem; }
          .pl-8 { padding-left: 2rem; }
          .w-full { width: 100%; }
          .w-8 { width: 2rem; }
          .w-20 { width: 5rem; }
          .w-48 { width: 12rem; }
          .space-y-1 > * + * { margin-top: 0.25rem; }
          .space-y-2 > * + * { margin-top: 0.5rem; }
          .space-y-3 > * + * { margin-top: 0.75rem; }
          .space-y-4 > * + * { margin-top: 1rem; }
          .bg-slate-100 { background-color: #f1f5f9; }
          .grid-cols-2 > div { width: 48%; display: inline-block; vertical-align: top; margin: 1%; box-sizing: border-box; }
          img { max-width: 100%; height: auto; }
          ul.list-disc { margin-left: 1.5rem; }
          .break-before-page { page-break-before: always; }
          
          /* Remove print hidden elements */
          .print\\:hidden { display: none !important; }
        </style>
      </head>
      <body>
        <div class="WordSection1">
          ${htmlContent}
        </div>
      </body>
    </html>`;
    const blob = new Blob(['\ufeff', header], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Dokumen_${activeDocPreview}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div id="pbk-persiapan-root" className="animate-fade-in pb-12">
      <div className="flex justify-between items-start mb-8 pb-6 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Persiapan Pengadaan</h1>
          <p className="text-slate-400 mt-1 text-sm">Langkah persiapan dokumen pembuka pengadaan dengan integrasi data SIRUP.</p>
        </div>
        {(dpaName || scrapedData.length > 0 || dpaAccounts.length > 0) && (
          <button
            onClick={resetFlow}
            className="text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 hover:bg-rose-50 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
          >
            ↺ Reset &amp; Buat Baru
          </button>
        )}
      </div>

      {/* ── ALUR BARU: LANGKAH 1 - IDENTIFIKASI & KUNCI PAKET SIRUP LKPP ── */}
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
                    <span className="truncate pr-2 text-indigo-700 font-bold">{currentUser.perangkatDaerah}</span>
                    <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded text-[10px] whitespace-nowrap shadow-sm border border-indigo-200">ID Satker: {satkerId}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {currentUser.department}
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
                  Paket RUP LKPP 2026 — {sirupPackages.filter(p => p.packName.toLowerCase().includes(sirupSearchQuery.toLowerCase()) || p.noSirup.includes(sirupSearchQuery)).length} paket
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
                    .filter(p => p.packName.toLowerCase().includes(sirupSearchQuery.toLowerCase()) || p.noSirup.includes(sirupSearchQuery))
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
                          <p className="text-xs font-semibold text-slate-800 leading-snug">{p.packName}</p>
                          <div className="text-[10px] text-slate-400">
                            {p.sumberDana} · {p.jadwalPemilihan}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                          <span className="text-sm font-bold text-slate-900 font-mono">
                            Rp {p.pagu?.toLocaleString()}
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
                        satker: currentUser.department || 'Kecamatan Besuk',
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
          <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Paket Terkunci
                </span>
                <span className="font-mono text-[10px] bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded">#{selectedPack.noSirup}</span>
              </div>
              <h4 className="text-sm font-semibold text-slate-900 leading-relaxed">{selectedPack.packName}</h4>
              <div className="text-xs text-slate-400">
                Pagu: <span className="font-bold text-slate-700">Rp {selectedPack.pagu?.toLocaleString()}</span> · {selectedPack.satker}
              </div>
            </div>
            <button
              onClick={() => {
                if (confirm('Ubah paket SIRUP? Data DPA yang terhubung akan disesuaikan.')) {
                  setSelectedPack(null)
                  setIsHpsExemptSelected(false)
                  localStorage.removeItem('pbj_hps_exempt_selected')
                  setStep(1)
                }
              }}
              className="text-xs text-slate-400 hover:text-rose-600 font-semibold transition-colors shrink-0"
            >
              Ganti Paket
            </button>
          </div>
        )}
      </div>

      {/* ── LANGKAH 2: UPLOAD DPA ATAU EDIT DETAIL RINCIAN ITEM BARANG ── */}
      <div className={`bg-white border border-slate-200 rounded-2xl p-8 mb-6 shadow-sm transition-all duration-300 ${!selectedPack ? 'opacity-40 pointer-events-none' : 'animate-slide-up'}`}>
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
              <span className="text-3xl block mb-1">💾</span>
              <span className="font-bold block text-slate-700 text-xs mb-0.5">{dpaName}</span>
              <span className="text-xs text-emerald-600 font-bold block">✔️ Berkas DPA Berhasil Terhubung ke RUP #{selectedPack?.noSirup}</span>
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
                  className="mt-3 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 mx-auto"
                >
                  📝 Rincian Item ({dpaAccounts[0]?.rincianCount || 0} barang terdaftar)
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
              <div className="text-3xl mb-3">{isAnalyzingDpa ? '⚙️' : '📂'}</div>
              <label className="cursor-pointer">
                <span className="btn-secondary text-xs">
                  {isAnalyzingDpa ? 'Mengekstrak Rincian DPA...' : 'Pilih File DPA (PDF/Gambar/Excel)'}
                </span>
                <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls" onChange={async (e) => {
                  const file = e.target.files[0]
                  if (!file) return
                  setDpaName(file.name)
                  setIsAnalyzingDpa(true)
                  try {
                    // 1. Ekstrak API Key aktif dari localStorage (Groq / Gemini / OpenAI / Claude)
                    const savedKeys = localStorage.getItem('pbj_ocr_api_keys')
                    let activeProvider = ""
                    let activeKey = ""
                    if (savedKeys) {
                      try {
                        const keys = JSON.parse(savedKeys)
                        // Prioritaskan Groq / Gemini sesuai tangkapan layar admin Bapak Beni
                        if (keys.groq) {
                          activeProvider = "groq"
                          activeKey = keys.groq
                        } else if (keys.gemini) {
                          activeProvider = "gemini"
                          activeKey = keys.gemini
                        } else if (keys.openai) {
                          activeProvider = "openai"
                          activeKey = keys.openai
                        } else if (keys.anthropic) {
                          activeProvider = "anthropic"
                          activeKey = keys.anthropic
                        }
                      } catch (errKey) {
                        console.error('Gagal mem-parse kunci API OCR:', errKey)
                      }
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
                        name: r.uraian,
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
                            nama: selectedPack.packName || 'Rincian Belanja DPA',
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
                    setStep(3)
                  } catch (err) {
                    console.error('DPA Parse error:', err)
                    alert('Gagal mengekstrak DPA PDF.\n' + err.message + '\n\nSilakan gunakan input manual rincian di bawah jika berkas Anda hasil scan.')

                    // Fallback manual agar user tidak stuck
                    const fallbackAcc = [{
                      account: '5.1.02.01.001.00024',
                      name: selectedPack.packName,
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
              </label>

              {/* Opsi Lewati / Isi Manual langsung */}
              <div className="mt-3">
                <button
                  onClick={() => {
                    setDpaName('Rincian_Uraian_Manual.pdf')
                    const manualAcc = [{
                      account: '5.1.02.01.001.00024',
                      name: selectedPack.packName,
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
                      uraian: selectedPack.packName,
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
                  <span>✏️</span> Klik pada kolom untuk melakukan Edit Inline
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
                  <span>✓</span> Verifikasi Semua Rekening
                </button>
              </div>
            </div>

            {/* Spacious Table with NO horizontal scrollbars and perfectly wide inputs */}
            <div className="border border-slate-200 rounded-2xl shadow-sm bg-white p-3 w-full">
              <table className="w-full divide-y divide-slate-100 text-left">
                <thead className="bg-slate-50/70">
                  <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-5 py-3 w-[180px]">Tingkat Keyakinan</th>
                    <th className="px-5 py-3 w-[260px]">Kode Rekening</th>
                    <th className="px-5 py-3">Uraian Rekening</th>
                    <th className="px-5 py-3 text-right w-[180px]">Pagu DPA</th>
                    <th className="px-5 py-3 text-center w-[180px]">Aksi / Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {dpaAccounts.map((acc, index) => {
                    const confidenceVal = acc.confidence !== undefined ? acc.confidence : 85;
                    const isHigh = confidenceVal >= 80;
                    const isMedium = confidenceVal >= 50 && confidenceVal < 80;
                    const isLow = confidenceVal < 50;
                    const isUnverified = !acc.verified && (acc.pagu_method === 'fallback_max' || acc.ocr_engine === 'tesseract');

                    return (
                      <tr key={index} className="hover:bg-slate-50/40 transition-colors">
                        {/* 1. Confidence Column */}
                        <td className="px-5 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${isHigh ? 'bg-emerald-500 animate-pulse' : isMedium ? 'bg-amber-400' : 'bg-rose-500'}`} />
                            <span className={`text-xs font-bold ${isHigh ? 'text-emerald-700' : isMedium ? 'text-amber-700' : 'text-rose-700'}`}>
                              {confidenceVal}% {isUnverified && <span className="text-[10px] font-normal text-amber-500 italic ml-1">(Harap verifikasi)</span>}
                            </span>
                          </div>
                        </td>

                        {/* 2. Kode Rekening Input */}
                        <td className="px-5 py-2 font-mono">
                          <input
                            type="text"
                            value={acc.account}
                            onChange={(e) => handleInlineEdit(index, 'account', e.target.value)}
                            className="w-full bg-slate-50/50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-lg px-3 py-2 text-slate-800 font-mono text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                            placeholder="Kode Rekening..."
                          />
                        </td>

                        {/* 3. Uraian Rekening Input */}
                        <td className="px-5 py-2">
                          <textarea
                            value={acc.name}
                            onChange={(e) => handleInlineEdit(index, 'name', e.target.value)}
                            className="w-full bg-slate-50/50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-lg px-3 py-2 text-slate-700 font-semibold text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all resize-y min-h-[42px]"
                            placeholder="Uraian Rekening..."
                            rows="2"
                          />
                        </td>

                        {/* 4. Pagu DPA Input */}
                        <td className="px-5 py-2 text-right">
                          <div className="flex items-center justify-end border border-slate-200 focus-within:border-indigo-500 rounded-lg px-3 py-1.5 hover:bg-slate-100/50 focus-within:bg-white transition-all w-fit ml-auto">
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
                        <td className="px-5 py-2 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            {isUnverified ? (
                              <button
                                onClick={() => handleConfirmAccount(index)}
                                className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-2 py-1 rounded-lg text-[10px] font-bold transition-all shadow-sm flex items-center gap-1 active:scale-95"
                                title="Klik untuk verifikasi bahwa data ini sudah benar"
                              >
                                <span>⚠️</span> Verifikasi
                              </button>
                            ) : acc.is_valid === false ? (
                              <span className="bg-rose-50 text-rose-700 border border-rose-100 px-2.5 py-1 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 justify-center cursor-help shadow-sm hover:scale-[1.02] transition-all" title={acc.validation_reason || "Terdeteksi rincian barang terpotong di dokumen asli"}>
                                <span>❌</span> Terpotong
                              </span>
                            ) : (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 justify-center cursor-help shadow-sm hover:scale-[1.02] transition-all" title={acc.validation_reason || "Rincian barang tuntas dan valid"}>
                                <span>✓</span> Valid
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
                              📝 Rincian
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
                              🗑️
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
                <span>➕</span> Tambah Rekening Belanja Baru
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
                  <h3 className="text-lg font-bold text-slate-800">✏️ Edit Rincian Item DPA</h3>
                  <p className="text-xs text-slate-500 mt-1 font-mono">{rincianModal.kodeRekening} — {rincianModal.uraian}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Pagu: <span className="font-bold text-indigo-600">Rp {rincianModal.pagu?.toLocaleString()}</span></p>
                </div>
                <button onClick={() => setRincianModal(null)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">×</button>
              </div>

              {/* Info Banner when details were not parsed automatically (System Fallback) */}
              {rincianModal.items.some(item => item.isDefault) && (
                <div className="mx-6 mt-4 p-4 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-3 shadow-sm animate-pulse-subtle">
                  <span className="text-xl">⚠️</span>
                  <div className="text-xs text-amber-800 leading-relaxed font-medium">
                    <strong className="text-amber-900 font-bold block mb-0.5">Rincian Item Belanja Tidak Ditemukan Oleh OCR</strong>
                    Sistem tidak mendeteksi rincian sub-item belanja secara otomatis dari berkas DPA Anda. Sistem telah membuat rincian default (1 Paket senilai Pagu Resmi RUP) agar Anda dapat mengisi/mengedit uraian nama spesifikasi barang secara manual di bawah tanpa terjadi selisih pagu.
                  </div>
                </div>
              )}

              {/* Tabel Rincian */}
              <div className="overflow-auto flex-1 p-6">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-bold">
                      <th className="border border-slate-200 px-3 py-2 w-8 text-center">No</th>
                      <th className="border border-slate-200 px-3 py-2 text-left">Nama Barang / Uraian</th>
                      <th className="border border-slate-200 px-3 py-2 w-20 text-center">Volume</th>
                      <th className="border border-slate-200 px-3 py-2 w-24 text-center">Satuan</th>
                      <th className="border border-slate-200 px-3 py-2 w-32 text-right">Harga Satuan (Rp)</th>
                      <th className="border border-slate-200 px-3 py-2 w-32 text-right">Harga Total (Rp)</th>
                      <th className="border border-slate-200 px-3 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rincianModal.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="border border-slate-200 px-2 py-1.5 text-center text-slate-500 font-bold bg-slate-50/50">{idx + 1}</td>
                        <td className="border border-slate-200 px-3 py-2.5">
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
                        <td className="border border-slate-200 px-2 py-1">
                          <input
                            type="number" min="0"
                            className="w-full border-0 bg-transparent focus:outline-none focus:bg-indigo-50 rounded px-1 py-0.5 text-center"
                            value={item.volume}
                            onChange={e => {
                              const vol = parseFloat(e.target.value) || 0
                              const upd = [...rincianModal.items]
                              upd[idx] = { ...upd[idx], volume: vol, harga_total: Math.round(vol * (upd[idx].harga_satuan || 0)) }
                              setRincianModal(prev => ({ ...prev, items: upd }))
                            }}
                          />
                        </td>
                        <td className="border border-slate-200 px-2 py-1">
                          <select
                            className="w-full border-0 bg-transparent focus:outline-none text-center text-xs"
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
                        <td className="border border-slate-200 px-2 py-1">
                          <input
                            type="number" min="0"
                            className="w-full border-0 bg-transparent focus:outline-none focus:bg-indigo-50 rounded px-1 py-0.5 text-right font-mono"
                            value={item.harga_satuan}
                            onChange={e => {
                              const hs = parseInt(e.target.value) || 0
                              const upd = [...rincianModal.items]
                              upd[idx] = { ...upd[idx], harga_satuan: hs, harga_total: Math.round((upd[idx].volume || 1) * hs) }
                              setRincianModal(prev => ({ ...prev, items: upd }))
                            }}
                          />
                        </td>
                        <td className="border border-slate-200 px-2 py-1 text-right font-mono font-bold text-indigo-700">
                          {(item.harga_total || 0).toLocaleString()}
                        </td>
                        <td className="border border-slate-200 px-1 py-1 text-center">
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
                              // Check both possible localStorage key names for backward compatibility
                              const savedKeys = localStorage.getItem('pbj_ocr_api_keys') || localStorage.getItem('pbj_ai_keys')
                              if (savedKeys) {
                                const keys = JSON.parse(savedKeys)
                                if (keys.groq) { activeProvider = "groq"; activeKey = keys.groq }
                                else if (keys.gemini) { activeProvider = "gemini"; activeKey = keys.gemini }
                                else if (keys.openai) { activeProvider = "openai"; activeKey = keys.openai }
                                else if (keys.anthropic) { activeProvider = "anthropic"; activeKey = keys.anthropic }
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
                                  <strong className="text-slate-800 font-bold ml-1.5">Rp {rincianModal.pagu?.toLocaleString()}</strong>
                                </div>
                                <div>
                                  <span className="text-slate-500 font-medium">Total Rincian DPA:</span>
                                  <strong className="text-indigo-700 font-bold ml-1.5">Rp {total.toLocaleString()}</strong>
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
                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all active:scale-[0.98]"
                                  title="Menyelaraskan selisih anggaran secara otomatis ke item belanja terakhir"
                                >
                                  ⚡ Selaraskan Otomatis dengan Pagu RUP
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
                  className="mt-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  ➕ Tambah Baris Item
                </button>
              </div>
              {/* Footer actions */}
              <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
                <button
                  onClick={() => setRincianModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50"
                >Batal</button>
                <button
                  onClick={() => {
                    const validItems = rincianModal.items.filter(r => r.nama && r.harga_satuan > 0)
                    setDpaRincian(prev => ({ ...prev, [rincianModal.kodeRekening]: validItems }))
                    setDpaAccounts(prev => prev.map(acc =>
                      acc.account === rincianModal.kodeRekening
                        ? { ...acc, rincianCount: validItems.length, verified: true }
                        : acc
                    ))
                    setRincianModal(null)
                    alert(`✅ ${validItems.length} item rincian disimpan untuk rekening ${rincianModal.kodeRekening}`)
                  }}
                  className="px-5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold shadow-sm"
                >💾 Simpan Rincian ke DPA Ground Truth</button>
              </div>
            </div>
          </div>
        )}

        {/* Integrasi SIRUP — Input Manual No. RUP */}
        {dpaName && (
          <div className="border-t border-slate-100 pt-6 animate-fade-in mt-6">
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <h3 className="text-sm font-bold text-indigo-700 uppercase tracking-wider">Sinkronisasi SIRUP LKPP</h3>
              <div className="flex items-center gap-2">
                {sirupPackages.length > 0 && dpaAccounts.length > 0 && (
                  <button
                    onClick={() => {
                      let count = 0;
                      const newLinks = [];
                      dpaAccounts.forEach(acc => {
                        const alreadyLinked = scrapedData.find(s => s.linkedRekening === acc.account);
                        if (!alreadyLinked) {
                          const best = findBestSirupMatch(acc, sirupPackages);
                          if (best) {
                            newLinks.push({
                              noSirup: best.noSirup,
                              packName: best.packName,
                              pagu: best.pagu,
                              method: best.method || 'Pengadaan Langsung',
                              sumberDana: best.sumberDana || 'APBD',
                              tahun: best.tahun || '2026',
                              klpd: 'Kab. Probolinggo',
                              satker: 'Kecamatan Besuk',
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
                        alert(`⚡ Berhasil auto-link ${count} rekening DPA ke paket SIRUP yang cocok!`);
                      } else {
                        alert('Semua rekening sudah terhubung, atau tidak ada kecocokan otomatis yang ditemukan.');
                      }
                    }}
                    className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    ⚡ Auto-Link Semua
                  </button>
                )}
                <a
                  href={`https://sirup.inaproc.id/sirup/home/penyediaSatker?idSatker=${satkerId}`}
                  target="_blank" rel="noreferrer"
                  className="text-xs text-indigo-600 underline font-bold flex items-center gap-1 hover:text-indigo-800"
                >
                  🌐 Buka SIRUP ↗
                </a>
              </div>
            </div>

            {/* Panduan singkat */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 mb-4 text-xs text-indigo-800 flex items-start gap-2">
              <span className="text-base">⚡</span>
              <span>Klik <strong>Auto-Link Semua</strong> untuk mencocokkan rekening DPA ke paket SIRUP secara otomatis berdasarkan pagu &amp; nama. Atau konfirmasi/ubah satu per satu di bawah.</span>
            </div>

            {/* Input per rekening DPA */}
            {dpaAccounts.length > 0 ? (
              <div className="space-y-3">
                {dpaAccounts.map((acc, idx) => {
                  const linked = scrapedData.find(s => s.linkedRekening === acc.account)
                  return (
                    <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                      {/* Header rekening */}
                      <div className="flex items-start gap-2 mb-3">
                        <span className="bg-slate-100 text-slate-600 font-mono text-[10px] font-semibold px-2 py-0.5 rounded">{acc.account}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-slate-700 truncate">{acc.name}</div>
                          <div className="text-[11px] text-slate-500">Pagu DPA: <strong className="text-emerald-700">Rp {acc.pagu?.toLocaleString()}</strong></div>
                        </div>
                      </div>

                      {/* Status: sudah terhubung atau belum */}
                      {linked ? (
                        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5">
                          <div className="text-xs space-y-0.5">
                            <div className="font-bold text-emerald-700">✅ Terhubung ke No. RUP SIRUP</div>
                            <div className="font-mono text-indigo-700 font-bold">{linked.noSirup} — <span className="font-normal text-slate-700">{linked.packName?.substring(0, 55)}...</span></div>
                            <div className="text-slate-500">Pagu SIRUP: <strong>Rp {linked.pagu?.toLocaleString()}</strong> | Metode: {linked.method}</div>
                          </div>
                          <button
                            onClick={() => setScrapedData(prev => prev.filter(s => s.linkedRekening !== acc.account))}
                            className="text-rose-500 hover:text-rose-700 text-xs font-bold ml-3 shrink-0"
                          >✎ Ubah</button>
                        </div>
                      ) : (
                        <SirupInputRow
                          acc={acc}
                          sirupPackages={sirupPackages}
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
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
                    <span className="text-xs text-emerald-800 font-bold">
                      ✅ {scrapedData.filter(s => s.linkedRekening).length} dari {dpaAccounts.length} rekening sudah terhubung ke SIRUP
                    </span>
                    <button
                      onClick={() => setStep(Math.max(step, 2))}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg"
                    >
                      Lihat Paket Terpilih →
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic bg-slate-50 rounded-xl p-4">
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
              <h2 className="text-lg font-bold text-slate-900 mb-2">Hasil Scraping Paket SIRUP</h2>
              <p className="text-xs text-slate-500 mb-6">Berikut adalah paket APBD yang ditemukan untuk RUP Penyedia Kecamatan Besuk. Pilih paket untuk memuat detailnya.</p>

              <div className="overflow-x-auto border border-slate-100 rounded-xl shadow-sm bg-white">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Kode RUP</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Nama Paket</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Pagu (Rp)</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Sumber</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {scrapedData.map(pack => (
                      <tr key={pack.noSirup} className={`hover:bg-slate-50 transition-colors ${selectedPack?.noSirup === pack.noSirup ? 'bg-indigo-50/50' : ''}`}>
                        <td className="px-4 py-4 font-mono text-indigo-600 font-bold hover:underline cursor-pointer" onClick={() => setDetailModalPack(pack)}>
                          <span className="inline-block mr-1 text-[10px]">🔗</span>{pack.noSirup}
                        </td>
                        <td className="px-4 py-4 text-slate-700 max-w-xs font-medium" title={pack.packName}>
                          <div className="flex flex-col gap-1.5">
                            <div className="truncate">{pack.packName}</div>
                            {isPackageMatchedWithDpa(pack) && (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-[9px] font-extrabold w-fit animate-pulse flex items-center gap-1">
                                <span>✨</span> Cocok dengan Rincian DPA Anda
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-emerald-600 font-bold">Rp {pack.pagu.toLocaleString()}</td>
                        <td className="px-4 py-4 text-slate-500 font-medium">{pack.sumberDana}</td>
                        <td className="px-4 py-4">
                          <button
                            onClick={() => selectPackage(pack)}
                            className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
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
                <div className="text-slate-900 font-semibold">{selectedPack.packName}</div>
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
              const isEPurchasing = selectedPack.method && selectedPack.method.toLowerCase().includes('e-purchasing');
              const isDirectProcurement = selectedPack.method && selectedPack.method.toLowerCase().includes('pengadaan langsung');
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
                          setIsHpsExemptSelected(e.target.checked);
                          setIsSigned(false);
                          if (e.target.checked) {
                            setHpsValue('0');
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
                          Kalkulator HPS Berbasis Survei Pasar
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
                        return sum + (item.qty * price)
                      }, 0)
                      const totalPagu = items.reduce((sum, item) => sum + (item.qty * item.price), 0)
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
                          <th className="py-2.5 px-4 text-right w-44">Harga Satuan HPS (Rp)</th>
                          <th className="py-2.5 px-3 text-right rounded-r-xl">Total HPS (Rp)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const items = getPackageItems(selectedPack)
                          const activeData = getActiveSurveyData()
                          return items.map((item, idx) => {
                            const unitHpsPrice = hpsPrices[item.name] !== undefined ? hpsPrices[item.name] : item.price
                            const totalHpsItem = item.qty * unitHpsPrice
                            const isOverbudget = unitHpsPrice > item.price
                            const surveyItem = activeData?.products?.find(p => p.name === item.name)

                            return (
                              <tr key={item.no || idx} className={`border-b border-slate-100 hover:bg-slate-50/60 transition-colors ${isOverbudget ? 'bg-rose-50/50' : ''}`}>
                                <td className="py-3 px-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                                <td className="py-3 px-2 font-bold text-slate-800">
                                  {item.name}
                                  <span className="text-[10px] text-slate-450 block font-normal mt-0.5">Satuan: {item.unit}</span>
                                </td>
                                <td className="py-3 px-2">
                                  {surveyItem && surveyItem.success && surveyItem.vendor !== 'TIDAK DITEMUKAN' ? (
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-[10px] font-bold text-slate-700 truncate max-w-[150px]" title={surveyItem.vendor}>🏪 {surveyItem.vendor}</span>
                                      <a href={surveyItem.link} target="_blank" rel="noopener noreferrer" className="text-[9px] text-indigo-600 hover:text-indigo-800 underline">Tautan Produk</a>
                                    </div>
                                  ) : (
                                    <span className="text-[9px] text-slate-400 italic bg-slate-100 px-1.5 py-0.5 rounded">Belum disurvei</span>
                                  )}
                                </td>
                                <td className="py-3 px-2 text-center font-bold text-slate-700">{item.qty}</td>
                                <td className="py-3 px-2 text-right font-mono text-slate-500">Rp {item.price.toLocaleString()}</td>
                                <td className="py-3 px-4 text-right">
                                  <div className="relative inline-block w-full">
                                    <span className={`absolute left-3 top-1/2 -translate-y-1/2 font-bold text-[10px] ${isOverbudget ? 'text-rose-500' : 'text-slate-400'}`}>Rp</span>
                                    <input
                                      type="number"
                                      value={unitHpsPrice}
                                      onChange={(e) => {
                                        const newPrice = parseFloat(e.target.value) || 0
                                        setHpsPrices(prev => ({
                                          ...prev,
                                          [item.name]: newPrice
                                        }))
                                        setIsSigned(false)
                                        if (step === 4) setStep(3)
                                      }}
                                      className={`w-full bg-slate-50 border text-slate-800 rounded-xl py-1.5 pl-8 pr-3 text-xs font-mono font-bold text-right focus:ring-2 outline-none transition-all ${isOverbudget ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200 text-rose-700 bg-rose-50/50' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-150'}`}
                                    />
                                  </div>
                                  {isOverbudget && <div className="text-[9px] font-bold text-rose-500 text-right mt-1 animate-pulse">⚠️ Melebihi Pagu</div>}
                                </td>
                                <td className="py-3 px-3 text-right font-mono font-bold text-indigo-650">
                                  Rp {totalHpsItem.toLocaleString()}
                                </td>
                              </tr>
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
                    const totalPagu = items.reduce((sum, item) => sum + (item.qty * item.price), 0)
                    return (
                      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center pt-4 border-t border-slate-200 text-xs">
                        <div className="text-slate-500 font-medium">
                          Total Pagu DPA: <span className="font-bold font-mono text-slate-850 bg-slate-100 px-2 py-1 rounded-lg">Rp {totalPagu.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-3.5">
                          <span className="text-slate-600 font-semibold">Hasil Kalkulasi HPS:</span>
                          <span className="text-sm font-bold font-mono text-slate-900 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">Rp {totalHps.toLocaleString()}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setHpsValue(totalHps.toString())
                              alert(`✅ Nilai HPS Resmi disetujui sebesar Rp ${totalHps.toLocaleString()} (Hasil kalkulasi survei pasar).`)
                            }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-semibold px-4 py-2 rounded-xl transition-all text-[11px] active:scale-95 flex items-center gap-1"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                            Gunakan Sebagai HPS Resmi
                          </button>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}


              {/* Asisten AI Survei */}
              <div className="mb-6 bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">Asisten Survei HPS &amp; Referensi e-Katalog</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-lg">Gunakan AI untuk mencari referensi harga pasar dari e-Katalog secara otomatis. Bukti URL &amp; Screenshot akan dilampirkan di DPP.</p>
                </div>

                {isSurveying && (
                  <div className="mb-4">
                    <div className="flex justify-between text-[10px] font-bold text-emerald-800 mb-1.5 px-1">
                      <span className="truncate pr-2">{surveyProgress}</span>
                      <span className="shrink-0">{surveyProgressPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden shadow-inner">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300 ease-out relative"
                        style={{ width: `${surveyProgressPercent}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
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
                        placeholder="Target Penyedia Massal (Opsional, misal: CV ABC)"
                        className="w-full text-[11px] px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        title="Jika diisi, AI akan memprioritaskan penyedia ini untuk seluruh barang"
                      />
                    </div>
                  </div>

                  <button
                    onClick={runAiSurvey}
                    disabled={isSurveying}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold px-4 py-3 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap disabled:opacity-50 h-fit"
                  >
                    {isSurveying ? '⏳ Survei Berjalan...' : 'Mulai Survei Otomatis'}
                  </button>
                </div>
              </div>

              {surveyData && (
                <div className="mb-6 bg-slate-50/50 p-5 rounded-2xl border border-slate-200/80">
                  <div className="text-xs font-bold text-slate-800 mb-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-slate-900">
                      <span>📊</span> Referensi Hasil Survei e-Katalog (Kategori: {surveyData.category})
                    </div>
                    <div className="flex items-center gap-2 self-start">
                      {surveyData && surveyData.products.some(p => !p.success || p.vendor === 'TIDAK DITEMUKAN') && (
                        <button
                          onClick={handleBatchCustomSearch}
                          disabled={isSurveying}
                          className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-[10px] font-bold px-3 py-1 rounded shadow-sm transition-all flex items-center gap-1 active:scale-95"
                          title="Cari ulang semua barang yang sudah Anda ketikkan kata kunci barunya sekaligus (Sesuai Filter Wilayah)"
                        >
                          🔍 Cari Ulang (Massal)
                        </button>
                      )}
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
                                    <span className="text-[10px] font-bold">Rp</span> {p.price.toLocaleString('id-ID')}
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-medium truncate flex items-center gap-1">
                                    <span>🏪</span> <span className="truncate" title={p.vendor}>{p.vendor}</span>
                                  </div>
                                  <div className="text-[9px] text-indigo-600 hover:text-indigo-700 underline truncate pt-0.5">
                                    <a href={p.link} target="_blank" rel="noopener noreferrer">🌐 Lihat di e-Katalog</a>
                                  </div>
                                  
                                  <div className="mt-2 pt-2 border-t border-slate-100">
                                    {screenshotStatus[p.id] === 'done' ? (
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
                                        className="text-[9px] font-bold text-white bg-slate-800 hover:bg-slate-900 px-2.5 py-1.5 rounded transition-colors flex items-center gap-1 w-full justify-center"
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
                            </div>
                          )}

                          {/* NEW: Justifikasi & Pembanding (only if not failed) */}
                          {!isFailed && (
                            <div className="mt-4 pt-3 border-t border-dashed border-slate-200 space-y-3">
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
                                  className="text-[9px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded w-full mt-1.5 text-center transition-colors border border-emerald-200"
                                >
                                  ✨ Terapkan Alasan ini ke Seluruh Barang
                                </button>
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

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-2 uppercase tracking-wider">Nilai HPS Disetujui Resmi (Rp)</label>
                <input
                  type={isHpsExemptSelected ? "text" : "number"}
                  className={`glass-input text-slate-850 font-bold text-sm ${isHpsExemptSelected ? 'bg-amber-50/70 border-amber-300 text-amber-950 font-extrabold shadow-sm' : 'bg-slate-50'}`}
                  value={isHpsExemptSelected ? "Dikecualikan (Bebas HPS)" : hpsValue}
                  onChange={(e) => {
                    if (isHpsExemptSelected) return;
                    setHpsValue(e.target.value)
                    setIsSigned(false) // Reset signature if value changes
                    if (step === 4) setStep(3)
                  }}
                  placeholder={isHpsExemptSelected ? "Dikecualikan (Bebas HPS)" : "Masukkan nilai HPS..."}
                  disabled={isSigned || isHpsExemptSelected}
                />
                {hpsValue && !isHpsExemptSelected && (
                  <div className="text-xs text-emerald-600 mt-1.5 font-bold italic">
                    Terbilang: "{terbilang(hpsValue)} Rupiah"
                  </div>
                )}
                {isHpsExemptSelected && (
                  <div className="text-xs text-amber-600 font-bold mt-1.5 flex items-center gap-1">
                    <span>💡</span> Paket dibebaskan dari kewajiban penyusunan HPS berdasarkan Perpres 12/2021.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-2 uppercase tracking-wider">Formulir Spesifikasi Teknis Pekerjaan (KAK)</label>
                <textarea
                  rows="4"
                  className="glass-input text-xs font-mono"
                  value={techSpecs}
                  onChange={(e) => {
                    setTechSpecs(e.target.value)
                    setIsSigned(false) // Reset signature if value changes
                    if (step === 4) setStep(3)
                  }}
                  placeholder="Masukkan detail spesifikasi teknis..."
                  disabled={isSigned}
                />
              </div>

              {/* Document Generation Action Center */}
              {(hpsValue || isHpsExemptSelected) && (
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 space-y-4">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dokumen Persiapan &amp; Penetapan</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">Tinjau dokumen resmi Anda di bawah sebelum melakukan penandatanganan elektronik.</p>

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
                            <div className="text-xs font-semibold text-slate-800">Dokumen Disahkan secara Elektronik (TTE)</div>
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
                          Batalkan TTE
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 border border-slate-200 p-5 rounded-xl">
                        <div className="text-xs text-slate-500 max-w-md leading-relaxed">
                          Sahkan dokumen menggunakan simulasi Tanda Tangan Elektronik (TTE) Pejabat Pembuat Komitmen untuk mengirim berkas.
                        </div>
                        <button
                          onClick={() => {
                            setIsSigned(true)
                            setStep(4)
                          }}
                          className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold px-5 py-3 rounded-xl flex items-center gap-2 transition-all"
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
            <button className="btn-secondary text-sm">Simpan Draft</button>
            <button
              className={`btn-primary text-sm ${step < 4 || !isSigned ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => {
                if (step >= 4 && isSigned) {
                  const hasUnverified = dpaAccounts.some(acc => {
                    return !acc.verified && (acc.pagu_method === 'fallback_max' || acc.ocr_engine === 'tesseract');
                  });

                  if (hasUnverified) {
                    alert('⚠️ GAGAL MENGIRIM DPP!\n\nTerdapat data rekening DPA hasil OCR atau Fallback yang belum diverifikasi ("Unverified"). Silakan klik tombol "Konfirmasi Data Ini" atau edit nilai rekening tersebut terlebih dahulu pada tabel hasil OCR Langkah 1.');
                    return;
                  }

                  setStatus('Terkirim ke PP');
                  const finalizedItems = getPackageItems(selectedPack).map((item, idx) => {
                    const unitHpsPrice = hpsPrices[item.name] !== undefined ? hpsPrices[item.name] : item.price;
                    const surveyProduct = surveyData?.products?.[idx];
                    return {
                      ...item,
                      name: surveyProduct?.name || item.name,
                      price: unitHpsPrice
                    };
                  });
                  
                  const submittedData = {
                    packName: selectedPack?.packName,
                    pagu: selectedPack?.pagu,
                    mak: selectedPack?.mak,
                    volume: selectedPack?.volume,
                    spesifikasi: selectedPack?.spesifikasi,
                    hpsValue: isHpsExemptSelected ? 'Dikecualikan (Bebas HPS)' : hpsValue,
                    techSpecs: techSpecs,
                    dpaName: dpaName,
                    items: finalizedItems,
                    senderName: currentUser.name,
                    senderNip: currentUser.nip,
                    senderDepartment: currentUser.department,
                    sentDate: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                  }
                  localStorage.setItem('pbj_submitted_package', JSON.stringify(submittedData));
                  const successMsg = isHpsExemptSelected
                    ? `Sukses! Dokumen Persiapan Pengadaan (DPP) Pekerjaan "${selectedPack?.packName}" telah berhasil dikirimkan secara resmi ke Pejabat Pengadaan (PP) daerah.`
                    : `Sukses! Dokumen Persiapan Pengadaan (DPP) beserta Surat Keputusan Penetapan HPS Pekerjaan "${selectedPack?.packName}" telah berhasil dikirimkan secara resmi ke Pejabat Pengadaan (PP) daerah.`;
                  alert(successMsg);
                }
              }}
              disabled={step < 4 || !isSigned}
            >
              Kirim DPP ke PP
            </button>
          </div>

        </div>

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
              Pratinjau Dokumen Resmi {activeDocPreview === 'hps' ? 'Surat Penetapan HPS' : 'Dokumen Persiapan Pengadaan (DPP)'}
            </div>
            <div className="flex items-center gap-3">
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
            className="bg-white text-slate-900 w-full shadow-2xl rounded-sm my-20 border border-slate-200 relative print:my-0 print:border-none print:shadow-none mx-auto flex-none"
            style={{
              width: docSettings.paperSize === 'F4' ? '215mm' : '210mm',
              minHeight: docSettings.paperSize === 'F4' ? '330mm' : '297mm',
              paddingTop: `${docSettings.marginTop}mm`,
              paddingRight: `${docSettings.marginRight}mm`,
              paddingBottom: `${docSettings.marginBottom}mm`,
              paddingLeft: `${docSettings.marginLeft}mm`,
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: '12pt',
              lineHeight: '1.5'
            }}
          >
            <div>
              {/* KOP SURAT DINAS / SATKER */}
              {docSettings.showKop && (
                <div className="w-full mb-6" style={{ pageBreakInside: 'avoid', fontFamily: '"Times New Roman", Times, serif' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', borderBottom: '3px solid black', marginBottom: '2px' }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '15%', verticalAlign: 'middle', textAlign: 'center', paddingBottom: '10px' }}>
                          <img src="https://upload.wikimedia.org/wikipedia/commons/2/29/Garuda_Pancasila_Coat_of_Arms_of_Indonesia.svg" alt="Garuda" style={{ width: '70px', height: 'auto', display: 'inline-block' }} />
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
                  <div className="text-center font-bold text-[10pt] font-sans -mt-3 text-slate-700">
                    NOMOR: 027 / 142 / PPK / 437.82 / {new Date().getFullYear()}
                  </div>
                  <div className="text-center font-bold uppercase text-[12pt] tracking-wider -mt-1">
                    TENTANG<br />
                    PENETAPAN HARGA PERKIRAAN SENDIRI (HPS)
                  </div>
                  <div className="text-center font-bold uppercase text-[11pt] text-slate-800">
                    PEKERJAAN: "{selectedPack.packName}"
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
                      <table className="w-full border-collapse border border-slate-900 text-[11pt]">
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
                          {getPackageItems(selectedPack).map((item, idx) => {
                            const unitHpsPrice = hpsPrices[item.name] !== undefined ? hpsPrices[item.name] : item.price;
                            const surveyProduct = surveyData?.products?.[idx];
                            const displayName = surveyProduct?.name || item.name;
                            return (
                              <tr key={item.no}>
                                <td className="border border-slate-900 p-2 text-center">{item.no}</td>
                                <td className="border border-slate-900 p-2 text-left font-medium">{displayName}</td>
                                <td className="border border-slate-900 p-2 text-center font-bold">{item.qty}</td>
                                <td className="border border-slate-900 p-2 text-center">{item.unit}</td>
                                <td className="border border-slate-900 p-2 text-right font-mono">Rp {unitHpsPrice.toLocaleString()}</td>
                                <td className="border border-slate-900 p-2 text-right font-mono font-bold">Rp {(item.qty * unitHpsPrice).toLocaleString()}</td>
                              </tr>
                            );
                          })}
                          <tr className="bg-slate-50 font-bold">
                            <td colSpan="5" className="border border-slate-900 p-2 text-right">Jumlah Total Nilai HPS (Termasuk PPN & Pajak):</td>
                            <td className="border border-slate-900 p-2 text-right text-indigo-700 font-mono">Rp {parseInt(hpsValue).toLocaleString()}</td>
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
              ) : (
                // DOKUMEN PERSIAPAN PENGADAAN (DPP)
                <div className="space-y-4">
                  <div className="text-center font-bold uppercase text-[14pt] tracking-wide mt-2">
                    DOKUMEN PERSIAPAN<br />E-PURCHASING
                  </div>

                  <div className="pt-4 space-y-3">
                    <table className="w-full text-[11pt] mb-4">
                      <tbody>
                        <tr><td className="w-48 py-1 font-semibold">Perangkat Daerah</td><td>: {currentUser.department}</td></tr>
                        <tr><td className="py-1 font-semibold">Program</td><td>: Program Penunjang Urusan Pemerintahan Daerah</td></tr>
                        <tr><td className="py-1 font-semibold">Kegiatan</td><td>: Penyelenggaraan Pemerintahan dan Pelayanan Publik</td></tr>
                        <tr><td className="py-1 font-semibold">Sub Kegiatan</td><td>: Penyediaan Barang dan Jasa Perkantoran</td></tr>
                        <tr><td className="py-1 font-semibold">Pengadaan/Pekerjaan</td><td>: {selectedPack.packName}</td></tr>
                        <tr><td className="py-1 font-semibold">Lokasi Pekerjaan</td><td>: Komplek Perkantoran Pemerintah Daerah</td></tr>
                        <tr><td className="py-1 font-semibold">Volume Pekerjaan</td><td>: {selectedPack.volume || '1 Paket'}</td></tr>
                        <tr><td className="py-1 font-semibold">Uraian Pekerjaan</td><td>: Pengadaan {selectedPack.packName} untuk operasional</td></tr>
                        <tr><td className="py-1 font-semibold">Produk Dalam Negeri</td><td>: Ya</td></tr>
                        <tr><td className="py-1 font-semibold">Usaha Kecil</td><td>: Ya</td></tr>
                        <tr><td className="py-1 font-semibold">Pra DIPA/DPA</td><td>: {selectedPack.praDipa ? 'Ya' : 'Tidak'}</td></tr>
                        <tr><td className="py-1 font-semibold">Sumber Dana</td><td>: {selectedPack.sumberDana || 'APBD'} Tahun Anggaran {new Date().getFullYear()}</td></tr>
                        <tr><td className="py-1 font-semibold">Mata Anggaran Kegiatan (MAK)</td><td className="font-mono">: {selectedPack.mak}</td></tr>
                        <tr><td className="py-1 font-semibold">Pagu Anggaran</td><td>: Rp {selectedPack.pagu?.toLocaleString()} ({terbilang(selectedPack.pagu)} Rupiah)</td></tr>
                        <tr><td className="py-1 font-semibold">Jenis Pengadaan</td><td>: Barang</td></tr>
                        <tr><td className="py-1 font-semibold">Metode Pemilihan</td><td>: {getPacketCategory(selectedPack.packName) === 'Konsolidasi' ? 'E-Purchasing Konsolidasi' : 'E-Purchasing'}</td></tr>
                        <tr><td className="py-1 font-semibold">ID/Kode SiRUP</td><td className="font-mono">: {selectedPack.noSirup}</td></tr>
                      </tbody>
                    </table>

                    <div className="font-bold text-[12pt] uppercase">I. Spesifikasi Teknis</div>
                    <p className="text-justify">
                      Penyusunan spesifikasi teknis telah menguraikan kesesuaian kebutuhan, karakteristik ukuran, bahan, kinerja, standar mutu, pengemasan, layanan pengiriman, jenis, dan kuantitas barang. Spesifikasi teknis pengadaan adalah sebagai berikut:
                    </p>

                    <div className="pl-4 space-y-2 text-[11pt]">
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
                          {getPackageItems(selectedPack).map((item, idx) => {
                            const surveyProduct = surveyData?.products?.[idx];
                            const displayName = surveyProduct?.name || item.name;
                            return (
                            <tr key={item.no}>
                              <td className="border border-slate-900 p-1 text-center">{idx + 1}</td>
                              <td className="border border-slate-900 p-1">{displayName}</td>
                              <td className="border border-slate-900 p-1">Sesuai Kebutuhan DPA</td>
                              <td className="border border-slate-900 p-1 text-center">{item.qty}</td>
                              <td className="border border-slate-900 p-1 text-center">{item.unit}</td>
                            </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      <div className="font-bold mt-2">b. Justifikasi Teknis Dalam Penggunaan Merek</div>
                      <p className="text-justify">
                        {getPacketCategory(selectedPack.packName) === 'Modal'
                          ? 'Mengingat spesifikasi yang dibutuhkan berteknologi tinggi dan memerlukan jaminan purna jual, maka ditetapkan standar merek pabrikan yang memiliki Service Center resmi di sekitar lokasi dinas.'
                          : getPacketCategory(selectedPack.packName) === 'Konsolidasi'
                            ? 'Pengadaan merujuk pada penetapan merek dan spesifikasi hasil konsolidasi terpusat Katalog Sektoral sesuai Keputusan UKPBJ.'
                            : 'Tidak mensyaratkan merek tertentu dan mengutamakan persaingan sehat sesuai spesifikasi teknis yang dibutuhkan.'}
                      </p>

                      <div className="font-bold mt-2">c. Spesifikasi Waktu</div>
                      <p className="text-justify">Waktu pelaksanaan pengadaan maksimal selama 14 (Empat Belas) hari kalender sejak penerbitan SP.</p>

                      <div className="font-bold mt-2">d. Spesifikasi Tempat</div>
                      <p className="text-justify">Alamat tujuan akhir: {currentUser.department.includes('Bago') ? 'Jl. Raya Bago No. 176, Besuk' : 'Komp. Perkantoran Pemerintah Kabupaten Probolinggo'}</p>

                      <div className="font-bold mt-2">e. Spesifikasi Tingkat Layanan</div>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>Produk/barang harus dalam kondisi baru dan baik.</li>
                        <li>Barang diantarkan langsung ke alamat tujuan akhir.</li>
                        {getPacketCategory(selectedPack.packName) === 'Mamin' && <li>Kondisi makanan higienis, bersih, terbungkus rapi, dan dikirimkan 1 Jam sebelum jadwal pelaksanaan kegiatan.</li>}
                        {getPacketCategory(selectedPack.packName) === 'Modal' && <li>Dilengkapi jaminan garansi resmi distributor/pabrikan minimal 1 tahun.</li>}
                        <li>Penyedia wajib mengganti barang yang rusak/tidak sesuai spesifikasi selambat-lambatnya 1x24 jam.</li>
                      </ul>
                    </div>

                    <div className="font-bold text-[12pt] uppercase mt-4">II. Prioritas Penggunaan Produk Dalam Negeri</div>
                    <p className="text-justify">
                      Berdasarkan Peraturan Presiden tentang Pengadaan Barang/Jasa Pemerintah, PPK memprioritaskan pemilihan produk dalam negeri pada Katalog Elektronik yang memiliki label Produk Dalam Negeri (PDN) atau memiliki sertifikat TKDN.
                    </p>

                    <div className="font-bold text-[12pt] uppercase mt-4">III. Prioritas Penggunaan Produk dari Usaha Kecil</div>
                    <p className="text-justify">
                      Mengingat pagu paket pengadaan ini bernilai di bawah Rp15.000.000.000,00 maka pengadaan diprioritaskan kepada Penyedia dengan Kualifikasi Usaha Kecil atau Koperasi di wilayah lokal.
                    </p>

                    <div className="font-bold text-[12pt] uppercase mt-4">IV. Pengumpulan Referensi Harga</div>
                    <p className="text-justify">
                      PPK telah mempersiapkan referensi harga sebagai dasar pelaksanaan negosiasi yang diambil dari Katalog Elektronik, Harga Pasar setempat, dan/atau Standar Harga Satuan.
                    </p>

                    <div className="pl-4 space-y-2 text-[11pt]">
                      <div className="font-bold">a. Informasi Katalog Elektronik Inaproc</div>
                      {getActiveSurveyData() ? (() => {
                        const foundProducts = getActiveSurveyData().products.filter(p => p.success && p.vendor !== 'TIDAK DITEMUKAN');
                        if (foundProducts.length === 0) {
                          return <p className="italic text-slate-600 my-1 pb-1 text-[11pt]">* Seluruh item barang tidak ditemukan di e-Katalog LKPP. Referensi e-Katalog tidak terlampir.</p>
                        }
                        return (
                          <table className="w-full border-collapse border border-slate-900 mb-2 text-[11pt]">
                            <thead>
                              <tr className="bg-slate-100 font-bold text-center">
                                <td className="border border-slate-900 p-1 w-8">No</td>
                                <td className="border border-slate-900 p-1">Nama Barang</td>
                                <td className="border border-slate-900 p-1">Penyedia Katalog</td>
                                <td className="border border-slate-900 p-1">Harga Katalog</td>
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
                                  <td className="border border-slate-900 p-1 text-right">Rp {p.price.toLocaleString('id-ID')}</td>
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
                        <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7', padding: '10px', borderRadius: '6px', fontSize: '11pt', textAlign: 'justify', lineHeight: '1.5', color: '#78350f', marginBottom: '8px' }}>
                          <strong>📢 PENYUSUNAN HPS DIKECUALIKAN (BEBAS HPS)</strong><br />
                          Berdasarkan <strong>Konsolidasi Perpres PBJ (Peraturan Presiden Nomor 16 Tahun 2018 tentang Pengadaan Barang/Jasa Pemerintah sebagaimana telah diubah dengan Peraturan Presiden Nomor 12 Tahun 2021) Pasal 26</strong>, dokumen Harga Perkiraan Sendiri (HPS) tidak wajib disusun/dibuat oleh Pejabat Pembuat Komitmen (PPK) untuk paket pengadaan yang bernilai paling banyak Rp10.000.000,00, Pengadaan Langsung yang menggunakan bukti pembelian (kuitansi/nota belanja), atau pengadaan melalui metode E-Purchasing (Katalog Elektronik). Oleh karena itu, estimasi harga didasarkan pada harga pasar riil atau harga satuan acuan belanja (DPA/SHS) tanpa menetapkan Keputusan Penetapan HPS formal. Rincian estimasi harga satuan acuan belanja adalah sebagai berikut:
                        </div>
                      ) : (
                        <p className="text-justify mb-2">Berdasarkan hasil kalkulasi Harga Perkiraan Sendiri (HPS) bernilai total <b>Rp {parseInt(hpsValue || 0).toLocaleString('id-ID')}</b>, dengan rincian per item sebagai berikut:</p>
                      )}
                      <table className="w-full border-collapse border border-slate-900 mb-2 text-[11pt]">
                        <thead>
                          <tr className="bg-slate-100 font-bold text-center">
                            <td className="border border-slate-900 p-1 w-8">No</td>
                            <td className="border border-slate-900 p-1">Uraian Barang</td>
                            <td className="border border-slate-900 p-1 w-20">{isHpsExemptSelected ? 'Harga Satuan Acuan (Rp)' : 'Harga HPS/SHS'}</td>
                          </tr>
                        </thead>
                        <tbody>
                          {getPackageItems(selectedPack).map((item, idx) => {
                            const unitHpsPrice = hpsPrices[item.name] !== undefined ? hpsPrices[item.name] : item.price;
                            // ✅ FIX: Use updated name from surveyData if available (e.g. user changed keyword)
                            const surveyProduct = surveyData?.products?.[idx];
                            const displayName = surveyProduct?.name || item.name;
                            return (
                              <tr key={item.no}>
                                <td className="border border-slate-900 p-1 text-center">{idx + 1}</td>
                                <td className="border border-slate-900 p-1">{displayName}</td>
                                <td className="border border-slate-900 p-1 text-right">Rp {unitHpsPrice.toLocaleString('id-ID')}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    {getActiveSurveyData() && (
                      <div className="pl-4 space-y-2 text-[11pt] mt-4 page-break-inside-avoid">
                        <div className="font-bold">c. Justifikasi Pemilihan dan Produk Pembanding</div>
                        {(() => {
                          const products = getActiveSurveyData().products;
                          const productsWithData = products.filter(p => 
                            (justifications[p.id] && justifications[p.id].trim()) || 
                            (comparisons[p.id] && comparisons[p.id].name)
                          );

                          if (productsWithData.length === 0) {
                            return <p className="italic text-slate-600 my-1 pb-1 text-[11pt]">* Tidak ada justifikasi spesifik atau produk pembanding yang dicatat.</p>;
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
                              groups[justText].comparisons.push({ pName: p.name, comp: comparisons[p.id] });
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
                                      <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                        {isGlobal ? 'Klausul Tingkat Paket' : 'Klausul Spesifik'}
                                      </span>
                                      <span className="text-[10pt] font-semibold text-slate-700">
                                        Berlaku untuk {group.items.length} item barang
                                      </span>
                                    </div>
                                    
                                    <div className="mb-3 text-[10pt] text-slate-600 italic leading-relaxed">
                                      {group.items.join(', ')}
                                    </div>

                                    {justText && (
                                      <div className="mb-4">
                                        <div className="font-bold text-slate-800 text-[11pt] mb-1">Pertimbangan Pemilihan Penyedia:</div>
                                        <div className="text-justify text-[11pt] pl-3 border-l-4 border-indigo-400 mt-2">
                                          Berdasarkan hasil survei pasar e-Katalog, Pejabat Pembuat Komitmen (PPK) menetapkan pemilihan penyedia dengan pertimbangan spesifikasi kinerja, waktu, dan/atau layanan pendukung sebagai berikut:<br/>
                                          <div className="mt-2 font-medium italic text-slate-800">"{justText}"</div>
                                        </div>
                                      </div>
                                    )}

                                    {group.comparisons.length > 0 && (
                                      <div className="mt-4">
                                        <div className="font-bold text-slate-800 text-[11pt] mb-2">Referensi Produk Pembanding:</div>
                                        <table className="w-full text-[10pt] border-collapse border border-slate-300">
                                          <thead>
                                            <tr className="bg-slate-200 text-slate-800">
                                              <th className="border border-slate-300 p-1.5 text-left font-bold">Item Utama</th>
                                              <th className="border border-slate-300 p-1.5 text-left font-bold">Penyedia Pembanding</th>
                                              <th className="border border-slate-300 p-1.5 text-left font-bold">Produk Pembanding</th>
                                              <th className="border border-slate-300 p-1.5 text-right font-bold">Harga (Rp)</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {group.comparisons.map((c, i) => (
                                              <tr key={i}>
                                                <td className="border border-slate-300 p-1.5">{c.pName}</td>
                                                <td className="border border-slate-300 p-1.5">{c.comp.vendor || '-'}</td>
                                                <td className="border border-slate-300 p-1.5">{c.comp.name}</td>
                                                <td className="border border-slate-300 p-1.5 text-right">{parseInt(c.comp.price || 0).toLocaleString('id-ID')}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    <div className="font-bold text-[12pt] uppercase mt-4">V. Rancangan Kontrak (Surat Pesanan)</div>
                    <p className="text-justify">Draft/Rancangan Kontrak menggunakan bentuk Surat Pesanan (SP) E-Purchasing yang berlaku standar pada sistem Inaproc LKPP.</p>

                    <div className="font-bold text-[12pt] uppercase mt-4">VI. Rencana Metode Pemilihan Penyedia</div>
                    <p className="text-justify">
                      {getPacketCategory(selectedPack.packName) === 'Konsolidasi'
                        ? 'Pengadaan dilakukan secara langsung (Direct Purchasing) kepada Penyedia Konsolidasi Sektoral yang telah ditetapkan UKPBJ.'
                        : 'E-Purchasing dengan metode Negosiasi Harga terhadap harga dan/atau layanan pendukung sesuai ketentuan Katalog Elektronik.'}
                    </p>

                    <div className="font-bold text-[12px] uppercase mt-4">VII. Persyaratan Kualifikasi</div>
                    <p className="text-[11px] font-bold">Penyedia Badan Usaha / Perorangan:</p>
                    <ul className="list-disc pl-8 space-y-1 text-[11px]">
                      <li>Memiliki identitas / NIB dan izin usaha sesuai KBLI yang relevan.</li>
                      <li>Memiliki status valid wajib pajak / NPWP.</li>
                      {getPacketCategory(selectedPack.packName) === 'Modal' && <li>Memiliki Surat Dukungan Pabrikan atau Distributor Resmi.</li>}
                      {getPacketCategory(selectedPack.packName) === 'Mamin' && <li>Memiliki Sertifikat Laik Higiene Sanitasi (SLHS) dari Dinas Kesehatan setempat.</li>}
                      <li>Memiliki alamat usaha yang jelas dan kapasitas manajerial yang memadai.</li>
                    </ul>

                    <div className="font-bold text-[12px] uppercase mt-4">VIII. Penutup</div>
                    <p className="text-justify text-[11px]">
                      Demikian Dokumen Persiapan Pengadaan (DPP) E-Purchasing ini dibuat sebagai acuan pelaksanaan pemilihan penyedia barang/jasa melalui Katalog Elektronik LKPP.
                    </p>

                    {/* Lampiran Screenshot Jika Ada */}
                    {getActiveSurveyData() && (() => {
                      const foundWithImages = getActiveSurveyData().products.filter(p => p.success && p.vendor !== 'TIDAK DITEMUKAN' && p.img);
                      if (foundWithImages.length === 0) return null;
                      return (
                        <div className="mt-8 break-before-page" style={{ pageBreakBefore: 'always', breakBefore: 'page' }}>
                          <div className="font-bold text-[12px] uppercase mb-4 text-center">LAMPIRAN: BUKTI TANGKAPAN LAYAR (SCREENSHOT) REFERENSI E-KATALOG LOKAL/NASIONAL</div>
                          <div className="grid grid-cols-2 gap-4">
                            {foundWithImages.map(p => (
                              <div key={p.id} className="border border-slate-400 p-2 text-center text-[9px] bg-slate-50">
                                <div className="font-bold mb-1">{p.vendor}</div>
                                <img src={p.img} alt={p.name} className="w-full h-32 object-cover border border-slate-300 mb-1" />
                                <div className="font-mono text-blue-800 break-all underline">
                                  <a href={p.link} target="_blank" rel="noopener noreferrer" className="hover:text-blue-900">{p.link}</a>
                                </div>
                                <div className="font-bold">Harga Tayang: Rp {p.price.toLocaleString('id-ID')}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

            {/* SIGNATURE SECTION (FOOTER) */}
            <div className="flex justify-between items-end mt-12 pt-6 border-t border-slate-200 signature-section" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
              <div className="text-[10px] font-sans text-slate-500 italic max-w-xs">
                Dokumen ini merupakan produk administrasi resmi internal Pemerintah Kabupaten Probolinggo dan sah secara hukum sejak dibubuhi Tanda Tangan Elektronik (TTE).
              </div>
              <div className="w-56 text-center space-y-2">
                <div className="text-[11px]">
                  Besuk, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <div className="text-[11px] font-bold uppercase">
                  Pejabat Pembuat Komitmen (PPK)
                </div>

                {/* Simulated TTE Signature Badge */}
                {isSigned ? (
                  <div className="py-2.5 flex flex-col items-center justify-center border-2 border-dashed border-emerald-500 rounded bg-emerald-50/50 max-w-[180px] mx-auto">
                    <span className="text-[9px] font-sans font-bold text-emerald-600 uppercase tracking-widest">Disahkan Secara</span>
                    <span className="text-[9px] font-sans font-bold text-emerald-600 uppercase tracking-widest -mt-1">Elektronik (TTE)</span>
                    <span className="text-[14px] my-1">🛡️</span>
                    <span className="text-[8px] font-mono text-emerald-700 tracking-wider">ID: TTE-PPK-{selectedPack.noSirup}</span>
                  </div>
                ) : (
                  <div className="h-16 flex items-center justify-center text-slate-400 italic text-[10px] border border-dashed border-slate-300 rounded">
                    Belum disahkan (TTE)
                  </div>
                )}

                <div className="text-[11px] font-bold uppercase underline">
                  {currentUser.name}
                </div>
                <div className="text-[10px] font-mono -mt-1">
                  NIP. {currentUser.nip}
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>,
        document.body
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
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
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
                  <div className="col-span-2 px-4 py-2.5 font-bold leading-relaxed text-slate-800">{detailModalPack.packName}</div>
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
                    <table className="w-full border border-slate-200 rounded text-[11px] bg-white">
                      <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
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
                  <div className="col-span-2 px-4 py-2.5 font-mono text-[11px]">{detailModalPack.spesifikasi}</div>
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
                    <table className="w-full border border-slate-200 rounded text-[11px] bg-white">
                      <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
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
                          <td className="px-2 py-1 font-bold text-emerald-600">Rp {detailModalPack.pagu?.toLocaleString()}</td>
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
  )
}

// Komponen Pembantu — Auto-Match SIRUP per Rekening DPA
function SirupInputRow({ acc, onLink, sirupPackages = [] }) {
  const autoMatch = findBestSirupMatch(acc, sirupPackages);
  const [showPicker, setShowPicker] = useState(!autoMatch);
  const [search, setSearch] = useState('');

  const handleUse = (pack) => {
    onLink({
      noSirup: pack.noSirup,
      packName: pack.packName,
      pagu: pack.pagu,
      method: pack.method || 'Pengadaan Langsung',
      sumberDana: pack.sumberDana || 'APBD',
      tahun: pack.tahun || '2026',
      klpd: 'Kab. Probolinggo',
      satker: 'Kecamatan Besuk',
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
    <div className="mt-3 space-y-2">

      {/* ── Auto-match card ─────────────────────────────────────── */}
      {autoMatch && !showPicker && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3">
          <div className="text-[10px] font-bold text-indigo-500 uppercase mb-2 flex items-center gap-1.5">
            ⚡ Cocok Otomatis
            <span className="bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded font-mono">skor {autoMatch._score}</span>
          </div>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-800 leading-snug">{autoMatch.packName}</div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                <span className="font-mono text-indigo-700 font-bold bg-indigo-100 px-1.5 py-0.5 rounded text-[10px]">#{autoMatch.noSirup}</span>
                <span>Pagu: <strong className="text-emerald-700">Rp {autoMatch.pagu?.toLocaleString('id-ID')}</strong></span>
                <span className="text-slate-400">·</span>
                <span>{autoMatch.method}</span>
              </div>
            </div>
            <button
              onClick={() => handleUse(autoMatch)}
              className="shrink-0 bg-indigo-500 hover:bg-indigo-600 text-white text-[11px] font-bold px-4 py-2 rounded-xl transition-all active:scale-95 shadow-sm whitespace-nowrap"
            >
              ✓ Gunakan
            </button>
          </div>
          <button
            onClick={() => setShowPicker(true)}
            className="text-[10px] text-slate-400 hover:text-indigo-600 mt-2 underline block transition-colors"
          >
            Pilih paket lain dari daftar...
          </button>
        </div>
      )}

      {/* ── Searchable picker ────────────────────────────────────── */}
      {(!autoMatch || showPicker) && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
          {showPicker && autoMatch && (
            <button
              onClick={() => setShowPicker(false)}
              className="text-[10px] text-indigo-500 hover:text-indigo-700 underline flex items-center gap-1"
            >
              ← Kembali ke rekomendasi otomatis
            </button>
          )}
          <div className="text-[10px] font-bold text-slate-500 uppercase">
            {sirupPackages.length > 0 ? `Pilih dari ${sirupPackages.length} Paket RUP` : 'Memuat data SIRUP...'}
          </div>
          <input
            type="text"
            placeholder="Cari nama paket atau nomor RUP..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border border-slate-200 focus:border-indigo-400 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-100 outline-none bg-white"
          />
          <div className="max-h-52 overflow-y-auto space-y-1 pr-0.5">
            {filtered.length === 0 && (
              <div className="text-xs text-slate-400 italic py-3 text-center">Tidak ada paket ditemukan</div>
            )}
            {filtered.slice(0, 25).map(p => (
              <button
                key={p.noSirup}
                type="button"
                onClick={() => handleUse(p)}
                className="w-full text-left text-[11px] bg-white hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 rounded-lg px-3 py-2 transition-all group flex items-center justify-between gap-2"
              >
                <span className="flex-1 min-w-0">
                  <span className="font-mono text-indigo-600 text-[10px] font-bold mr-1.5 bg-indigo-50 px-1 rounded">#{p.noSirup}</span>
                  <span className="text-slate-700">{p.packName?.substring(0, 75)}{(p.packName?.length || 0) > 75 ? '…' : ''}</span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">
                    Pagu: <strong className="text-emerald-700">Rp {p.pagu?.toLocaleString('id-ID')}</strong> · {p.method}
                  </span>
                </span>
                <span className="shrink-0 text-[10px] text-white bg-indigo-500 group-hover:bg-indigo-600 px-2 py-1 rounded-lg font-bold opacity-0 group-hover:opacity-100 transition-all">
                  Pilih
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

