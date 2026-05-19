import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

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
    department: 'Kecamatan Besuk'
  }

  const getSatkerIdFromName = (name) => {
    if (!name) return '67081' // Default to Kecamatan Besuk
    const lower = name.toLowerCase()
    if (lower.includes('besuk')) return '67081'
    if (lower.includes('kraksaan')) return '67082'
    if (lower.includes('paiton')) return '67083'
    if (lower.includes('gending')) return '67084'
    if (lower.includes('dringu')) return '67085'
    if (lower.includes('leces')) return '67086'
    if (lower.includes('pupr') || lower.includes('pekerjaan umum')) return '12345'
    return '67081' // Fallback
  }

  const [step, setStep] = useState(() => {
    return parseInt(localStorage.getItem('pbj_step') || '1')
  })
  const [dpaName, setDpaName] = useState(() => {
    return localStorage.getItem('pbj_dpa_name') || null
  })
  const [satkerId, setSatkerId] = useState(() => {
    const saved = localStorage.getItem('pbj_satker_id')
    if (saved) return saved
    return getSatkerIdFromName(currentUser.department)
  })

  // Synchronize satkerId reactively when active profile changes
  useEffect(() => {
    if (currentUser) {
      const derivedId = getSatkerIdFromName(currentUser.department)
      setSatkerId(derivedId)
      localStorage.setItem('pbj_satker_id', derivedId)
    }
  }, [currentUser.department])
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

  // Fetch SIRUP packages automatically on mount if we don't have a package locked yet
  useEffect(() => {
    if (!selectedPack) {
      fetchSirupPackages('67081') // default Kecamatan Besuk
    }
  }, [])

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
    setTechSpecs(`Volume: ${pack.volume}\nSpesifikasi: ${pack.spesifikasi}\nMAK: ${pack.mak}`)
    setStep(3)
  }

  const resetFlow = () => {
    if(confirm('Apakah Anda ingin mereset DPA yang tersimpan dan membuat usulan pengadaan baru?')) {
      localStorage.removeItem('pbj_step')
      localStorage.removeItem('pbj_dpa_name')
      localStorage.removeItem('pbj_satker_id')
      localStorage.removeItem('pbj_scraped_data')
      localStorage.removeItem('pbj_selected_pack')
      localStorage.removeItem('pbj_hps_value')
      localStorage.removeItem('pbj_tech_specs')
      localStorage.removeItem('pbj_matched_dpa_types')
      localStorage.removeItem('pbj_dpa_accounts')
      localStorage.removeItem('pbj_dpa_rincian')
      localStorage.removeItem('pbj_dpa_ocr_mode')
      localStorage.removeItem('pbj_is_signed')
      setStep(1)
      setDpaName(null)
      setDpaAccounts([])
      setDpaRincian({})
      setDpaOcrMode('local')
      setScrapedData([])
      setSelectedPack(null)
      setHpsValue('')
      setTechSpecs('')
      setIsSigned(false)
      setActiveDocPreview(null)
    }
  }

  return (
    <div className="animate-fade-in pb-12">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Persiapan Pengadaan (PPK)</h1>
          <p className="text-slate-500 mt-1">Langkah 1 - Persiapan Dokumen Pembuka Pengadaan dengan Integrasi Data SIRUP.</p>
        </div>
        {(dpaName || scrapedData.length > 0 || dpaAccounts.length > 0) && (
          <button 
            onClick={resetFlow} 
            className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-4 py-2.5 rounded-xl text-xs font-bold"
          >
            🔄 Reset &amp; Buat Baru
          </button>
        )}
      </div>
      
      {/* ── ALUR BARU: LANGKAH 1 - IDENTIFIKASI & KUNCI PAKET SIRUP LKPP ── */}
      <div className="glass-panel p-8 mb-6 animate-slide-up">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span>🏛️</span> Langkah 1: Kunci Rencana Umum Pengadaan (SIRUP LKPP Resmi)
          </h2>
          <span className="px-3 py-1 text-xs rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold">Langkah 1 (Jangkar Anggaran)</span>
        </div>
        
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          Pilih paket pengadaan resmi Bapak yang terdaftar di portal SIRUP LKPP untuk mengunci pagu total anggaran. Jika data tidak muncul, gunakan form input manual di bawah.
        </p>

        {!selectedPack ? (
          <div className="space-y-6">
            {/* Filter Satker & Fetch Action */}
            <div className="flex flex-col sm:flex-row gap-4 items-end bg-slate-50 p-5 rounded-2xl border border-slate-200/60">
              <div className="flex-1">
                <label className="block text-[11px] text-slate-400 font-bold uppercase mb-1.5">PILIH SATUAN KERJA (SATKER)</label>
                <select 
                  value={satkerId} 
                  onChange={(e) => {
                    setSatkerId(e.target.value)
                    fetchSirupPackages(e.target.value)
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="67081">Kecamatan Besuk (ID: 67081)</option>
                  <option value="67082">Kecamatan Kraksaan (ID: 67082)</option>
                  <option value="67083">Kecamatan Paiton (ID: 67083)</option>
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-[11px] text-slate-400 font-bold uppercase mb-1.5">CARI NAMA PAKET ATAU NO. RUP</label>
                <input 
                  type="text"
                  value={sirupSearchQuery}
                  onChange={(e) => setSirupSearchQuery(e.target.value)}
                  placeholder="Ketik untuk memfilter paket..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-medium text-slate-700 shadow-sm focus:border-indigo-500"
                />
              </div>

              <button
                onClick={() => fetchSirupPackages(satkerId)}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-5 py-2.5 rounded-xl border border-indigo-200 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                {isFetchingSirup ? '⚙️ Menarik Data...' : '🔄 Tarik Ulang LKPP'}
              </button>
            </div>

            {/* List of Live LKPP Packages */}
            <div className="border border-slate-200/80 rounded-2xl bg-white overflow-hidden shadow-sm">
              <div className="bg-slate-50/80 px-5 py-3.5 border-b border-slate-150 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Daftar Paket RUP Resmi LKPP Tahun 2026 ({sirupPackages.filter(p => p.packName.toLowerCase().includes(sirupSearchQuery.toLowerCase()) || p.noSirup.includes(sirupSearchQuery)).length} paket cocok)
                </span>
                <span className="px-2 py-0.5 text-[10px] rounded bg-emerald-100 text-emerald-800 font-bold font-mono">LIVE CONNECTION</span>
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
                      <div key={p.noSirup} className="p-4 hover:bg-slate-50/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-colors">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded">
                              RUP ID: #{p.noSirup}
                            </span>
                            <span className="text-[10px] bg-indigo-50 border border-indigo-150 text-indigo-600 font-bold px-2 py-0.5 rounded">
                              {p.method}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-800 pr-4">{p.packName}</p>
                          <div className="text-[10px] text-slate-450">
                            Sumber Dana: {p.sumberDana} | Jadwal: {p.jadwalPemilihan}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                          <span className="text-sm font-extrabold text-emerald-600 font-mono">
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
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all shadow-sm hover:scale-[1.03] active:scale-[0.97]"
                          >
                            🔒 Kunci Paket
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
                    className="bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm uppercase shrink-0"
                  >
                    Kunci Manual
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono font-bold text-xs px-2.5 py-0.5 rounded-full">
                  RUP LOCKED: #{selectedPack.noSirup}
                </span>
                <span className="text-xs text-emerald-600 font-bold">✓ Pagu &amp; Nama Paket Terkunci</span>
              </div>
              <h4 className="text-sm font-bold text-slate-800 leading-relaxed">{selectedPack.packName}</h4>
              <div className="text-xs text-slate-500">
                Pagu Resmi: <strong className="text-emerald-700 text-sm">Rp {selectedPack.pagu?.toLocaleString()}</strong> | Satker: {selectedPack.satker}
              </div>
            </div>
            <button
              onClick={() => {
                if (confirm('Ubah paket SIRUP? Data DPA yang terhubung akan disesuaikan.')) {
                  setSelectedPack(null)
                  setStep(1)
                }
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-bold underline transition-colors shrink-0"
            >
              🔒 Buka Kunci / Ganti Paket
            </button>
          </div>
        )}
      </div>

      {/* ── LANGKAH 2: UPLOAD DPA ATAU EDIT DETAIL RINCIAN ITEM BARANG ── */}
      <div className={`glass-panel p-8 mb-6 transition-all duration-300 ${!selectedPack ? 'opacity-40 pointer-events-none' : 'animate-slide-up'}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span>📄</span> Langkah 2: Dokumen Pelaksanaan Anggaran (DPA) - Rincian Item
          </h2>
          <span className="px-3 py-1 text-xs rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-semibold">Langkah 2 (Rincian Item)</span>
        </div>

        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          Unggah file DPA PDF Bapak untuk diekstrak rincian itemnya secara otomatis, atau input manual jika file DPA merupakan hasil pemindaian (scan gambar).
        </p>

        {/* Upload Zone */}
        <div className="border-2 border-dashed border-indigo-200/80 rounded-2xl p-6 text-center hover:border-indigo-500/50 transition-colors mb-6 bg-slate-50/50">
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
                        items: existing.length > 0 ? existing.map((r,i) => ({...r, no: i+1})) : [
                          { no: 1, nama: '', volume: 1, satuan: 'Buah', harga_satuan: 0, harga_total: 0 }
                        ]
                      })
                    }
                  }}
                  className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 mx-auto"
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
                  className="text-xs text-indigo-600 font-bold hover:underline"
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
              <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 flex items-start gap-3.5 shadow-sm">
                <span className="text-2xl mt-0.5 animate-pulse">✨</span>
                <div className="text-xs text-slate-700 leading-relaxed">
                  <div className="font-extrabold text-emerald-800 flex items-center gap-1.5">
                    <span>AI OCR Refinement Aktif</span>
                    <span className="bg-emerald-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider animate-pulse">
                      Engine Aktif
                    </span>
                  </div>
                  <p className="mt-1 text-slate-500 font-medium">
                    Sub-item rincian belanja di DPA ini berhasil dibaca, diperbaiki typonya, diselaraskan matematisnya secara cerdas oleh model kecerdasan buatan (AI) yang dihubungkan melalui Dashboard Admin.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/0 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3.5 shadow-sm">
                <span className="text-2xl mt-0.5">⚠️</span>
                <div className="text-xs text-slate-700 leading-relaxed">
                  <div className="font-extrabold text-amber-800 flex items-center gap-1.5">
                    <span>Parser Lokal Aktif (Tanpa AI)</span>
                    <span className="bg-amber-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">
                      Mode Standar
                    </span>
                  </div>
                  <p className="mt-1 text-slate-500 font-medium">
                    Proses pembacaan DPA saat ini menggunakan Parser Regex Lokal (Tanpa AI) karena API Key belum dikonfigurasi di menu Admin. Untuk hasil pembacaan rincian sub-item yang otomatis, rapi, dan bebas typo, silakan hubungkan API Key AI Anda di menu Admin Dashboard.
                  </p>
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
                                  items: existing.length > 0 ? existing.map((r,i) => ({...r, no: i+1})) : [
                                    { no: 1, nama: '', volume: 1, satuan: 'Buah', harga_satuan: 0, harga_total: 0 }
                                  ]
                                })
                              }}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1"
                              title="Edit rincian item barang untuk rekening ini"
                            >
                              📝 Rincian
                            </button>
                            <button
                              onClick={() => {
                                if(confirm('Hapus rekening belanja ini?')) {
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
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
              >
                <span>➕</span> Tambah Rekening Belanja Baru
              </button>
            </div>
          </div>
        )}

        {/* ── MODAL EDIT RINCIAN ITEM ───────────────────────────────── */}
        {rincianModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
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
                            {['Buah','Unit','Rim','Lembar','Paket','Set','Pcs','Box','Botol','Dus','Kg','Meter','Roll','Pack','Biji','Lusin','Kaleng','Eksemplar'].map(s => (
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
                        {rincianModal.items.reduce((s,r) => s + (r.harga_total || 0), 0).toLocaleString()}
                      </td>
                      <td className="border border-slate-200"></td>
                    </tr>
                    <tr>
                      <td colSpan="7" className="px-3 py-4 bg-slate-50/50">
                        {(() => {
                          const total = rincianModal.items.reduce((s,r) => s + (r.harga_total || 0), 0)
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
                                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
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
                    setRincianModal(prev => ({ ...prev, items: [...prev.items, {
                      no: prev.items.length + 1,
                      nama: '', volume: 1, satuan: lastItem?.satuan || 'Buah',
                      harga_satuan: 0, harga_total: 0
                    }]}))
                  }}
                  className="mt-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"
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
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-lg shadow-indigo-600/20"
                >💾 Simpan Rincian ke DPA Ground Truth</button>
              </div>
            </div>
          </div>
        )}

        {/* Integrasi SIRUP — Input Manual No. RUP */}
        {dpaName && (
          <div className="border-t border-slate-100 pt-6 animate-fade-in mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-indigo-700 uppercase tracking-wider">Sinkronisasi SIRUP LKPP</h3>
              <a
                href={`https://sirup.inaproc.id/sirup/home/penyediaSatker?idSatker=${satkerId}`}
                target="_blank" rel="noreferrer"
                className="text-xs text-indigo-600 underline font-bold flex items-center gap-1 hover:text-indigo-800"
              >
                🌐 Buka SIRUP LKPP ↗
              </a>
            </div>

            {/* Panduan */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5 text-xs text-blue-800 leading-relaxed">
              <strong>Cara pakai:</strong> Buka SIRUP LKPP (link di atas) → cari paket yang sesuai rekening DPA Anda → salin <strong>No. RUP</strong> dan <strong>Pagu</strong> → paste ke kolom di bawah ini per rekening.
              <br/>Ini memastikan No. SIRUP yang tercantum di dokumen HPS &amp; DPP adalah data yang <strong>benar sesuai RUP resmi</strong> Bapak.
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
                        <span className="bg-indigo-100 text-indigo-700 font-mono text-[10px] font-bold px-2 py-0.5 rounded">{acc.account}</span>
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
                            <div className="font-mono text-indigo-700 font-bold">{linked.noSirup} — <span className="font-normal text-slate-700">{linked.packName?.substring(0,55)}...</span></div>
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

      {/* Grid container for subsequent steps - 3-column layout where Sidebar takes 1, Main Area takes 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Sidebar */}
        <div className="glass-panel p-6 h-fit space-y-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">SOP Tahap Persiapan</h3>
          <ul className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-indigo-500/30 before:to-transparent">
            <li className="relative flex items-center gap-4">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 ${step >= 1 ? 'bg-indigo-600 shadow-lg shadow-indigo-600/35 text-white' : 'bg-slate-200 text-slate-500'}`}>
                <span className="text-xs font-bold">1</span>
              </div>
              <span className={`text-sm ${step >= 1 ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>Upload DPA & Tarik SIRUP</span>
            </li>
            <li className="relative flex items-center gap-4">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 ${step >= 2 ? 'bg-indigo-600 shadow-lg shadow-indigo-600/35 text-white' : 'bg-slate-200 text-slate-500'}`}>
                <span className="text-xs font-bold">2</span>
              </div>
              <span className={`text-sm ${step >= 2 ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>Pilih Paket Hasil Scraping</span>
            </li>
            <li className="relative flex items-center gap-4">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 ${step >= 3 ? 'bg-indigo-600 shadow-lg shadow-indigo-600/35 text-white' : 'bg-slate-200 text-slate-500'}`}>
                <span className="text-xs font-bold">3</span>
              </div>
              <span className={`text-sm ${step >= 3 ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>Penetapan HPS & Spesifikasi</span>
            </li>
            <li className="relative flex items-center gap-4">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 ${step >= 4 ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30 text-white' : 'bg-slate-200 text-slate-500'}`}>
                <span className="text-xs font-bold">4</span>
              </div>
              <span className={`text-sm ${step >= 4 ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>Kirim DPP ke PP</span>
            </li>
          </ul>
        </div>

        {/* Main Content Area for Steps 2, 3, and 4 */}
        <div className="lg:col-span-2 space-y-6">

          {/* Step 2: Scraped Data Table */}
          {scrapedData.length > 0 && (
            <div className="glass-panel p-6 animate-slide-up mt-6">
              <h2 className="text-xl font-bold text-slate-800 mb-2">Hasil Scraping Paket SIRUP</h2>
              <p className="text-sm text-slate-500 mb-6">Berikut adalah paket APBD yang ditemukan untuk RUP Penyedia Kecamatan Besuk. Pilih paket untuk memuat detailnya.</p>
              
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
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors shadow-sm shadow-indigo-600/10"
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
          <div className={`glass-panel p-8 transition-all duration-300 ${step < 3 ? 'opacity-50 pointer-events-none' : 'animate-slide-up'}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Penetapan Nilai HPS & Spesifikasi Teknis</h2>
              <span className="px-3 py-1 text-xs rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">Langkah 3</span>
            </div>
            
            {selectedPack && (
              <div className="mb-6 bg-indigo-50/50 border border-indigo-100 rounded-xl p-5 text-sm space-y-2">
                <div className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Detail Paket Terpilih</div>
                <div className="text-slate-800 font-bold">{selectedPack.packName}</div>
                <div className="grid grid-cols-2 gap-4 mt-3 text-xs text-slate-500">
                  <div>📍 Instansi: <span className="text-slate-700 font-medium">{selectedPack.klpd} ({selectedPack.satker})</span></div>
                  <div>📋 Kode MAK: <span className="text-slate-700 font-mono font-medium">{selectedPack.mak}</span></div>
                  <div>📦 Volume: <span className="text-slate-700 font-medium">{selectedPack.volume}</span></div>
                  <div>🔧 Spesifikasi RUP: <span className="text-slate-700 font-medium">{selectedPack.spesifikasi}</span></div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* KALKULATOR HPS INTERAKTIF */}
              {selectedPack && (
                <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 space-y-4 shadow-lg">
                  <div className="flex justify-between items-center border-b border-slate-700 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                        <span>📊</span> Kalkulator HPS Berbasis Survei Pasar
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">Sesuaikan harga satuan berdasarkan survei harga pasar riil. Total HPS tidak boleh melebihi Pagu DPA.</p>
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
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                            exceeds 
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' 
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          }`}>
                            {exceeds ? '⚠️ Melebihi Pagu DPA' : '✅ HPS Efisien & Valid'}
                          </span>
                        </div>
                      )
                    })()}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="text-slate-450 border-b border-slate-700 font-bold uppercase text-[9px] tracking-wider">
                          <th className="py-2 pr-2">No</th>
                          <th className="py-2">Nama Barang / Rincian DPA</th>
                          <th className="py-2 text-center w-12">Qty</th>
                          <th className="py-2 text-right">Pagu DPA (Rp)</th>
                          <th className="py-2 text-right pl-4 w-44">Harga Satuan HPS (Rp)</th>
                          <th className="py-2 text-right">Total HPS (Rp)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const items = getPackageItems(selectedPack)
                          return items.map((item, idx) => {
                            const unitHpsPrice = hpsPrices[item.name] !== undefined ? hpsPrices[item.name] : item.price
                            const totalHpsItem = item.qty * unitHpsPrice
                            return (
                              <tr key={item.no || idx} className="border-b border-slate-700/50 hover:bg-slate-750/30">
                                <td className="py-2.5 text-slate-400">{idx + 1}</td>
                                <td className="py-2.5 font-medium text-slate-200">
                                  {item.name}
                                  <span className="text-[10px] text-slate-400 block font-normal">Satuan: {item.unit}</span>
                                </td>
                                <td className="py-2.5 text-center font-bold text-slate-300">{item.qty}</td>
                                <td className="py-2.5 text-right font-mono text-slate-400">Rp {item.price.toLocaleString()}</td>
                                <td className="py-2.5 text-right pl-4">
                                  <div className="relative">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px]">Rp</span>
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
                                      className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg py-1 pl-7 pr-2 text-xs font-mono font-bold text-right focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                    />
                                  </div>
                                </td>
                                <td className="py-2.5 text-right font-mono font-bold text-indigo-350">
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
                      <div className="flex justify-between items-center pt-3 border-t border-slate-700 text-xs">
                        <div className="text-slate-450 font-medium">
                          Total Pagu DPA: <span className="font-bold font-mono text-slate-300">Rp {totalPagu.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400 font-medium">Hasil Kalkulasi HPS:</span>
                          <span className="text-sm font-extrabold font-mono text-indigo-400">Rp {totalHps.toLocaleString()}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setHpsValue(totalHps.toString())
                              alert(`✅ Nilai HPS Resmi disetujui sebesar Rp ${totalHps.toLocaleString()} (Hasil kalkulasi survei pasar).`)
                            }}
                            className="bg-indigo-600 hover:bg-indigo-750 text-white font-bold px-3 py-1.5 rounded-lg transition-all text-[10px] active:scale-95 shadow-md shadow-indigo-600/10"
                          >
                            💾 Gunakan Sebagai HPS Resmi
                          </button>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Nilai HPS Disetujui Resmi (Rp)</label>
                <input 
                  type="number" 
                  className="glass-input" 
                  value={hpsValue} 
                  onChange={(e) => {
                    setHpsValue(e.target.value)
                    setIsSigned(false) // Reset signature if value changes
                    if (step === 4) setStep(3)
                  }} 
                  placeholder="Masukkan nilai HPS..."
                  disabled={isSigned}
                />
                {hpsValue && (
                  <div className="text-xs text-emerald-600 mt-1.5 font-bold italic">
                    Terbilang: "{terbilang(hpsValue)} Rupiah"
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Formulir Spesifikasi Teknis Pekerjaan (KAK)</label>
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
              {hpsValue && (
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 space-y-4 shadow-sm">
                  <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-2">📄 Dokumen Persiapan & Penetapan</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">Sistem mendeteksi formulir HPS & Spesifikasi Teknis siap diproses. Anda dapat meninjau lembar dokumen resmi Anda di bawah ini sebelum melakukan penandatanganan elektronik:</p>
                  
                  <div className="flex flex-wrap gap-4">
                    <button 
                      onClick={() => setActiveDocPreview('hps')}
                      className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm hover:border-slate-300 px-5 py-3 rounded-xl text-xs font-bold flex items-center gap-2 transition-all duration-200"
                    >
                      <span>📜</span> Lihat Surat Penetapan HPS
                    </button>
                    <button 
                      onClick={() => setActiveDocPreview('dpp')}
                      className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm hover:border-slate-300 px-5 py-3 rounded-xl text-xs font-bold flex items-center gap-2 transition-all duration-200"
                    >
                      <span>📁</span> Lihat Dokumen DPP PPK
                    </button>
                  </div>

                  <div className="border-t border-slate-200/60 pt-4 mt-2">
                    {isSigned ? (
                      <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-5 rounded-2xl animate-fade-in">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🛡️</span>
                          <div>
                            <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Dokumen Disahkan secara Elektronik (TTE)</div>
                            <div className="text-[10px] text-slate-600 font-mono mt-0.5">Penandatangan: {currentUser.name} (NIP: {currentUser.nip})</div>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            setIsSigned(false)
                            setStep(3)
                          }}
                          className="text-xs text-rose-600 hover:text-rose-700 font-bold transition-colors"
                        >
                          Batalkan TTE
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-indigo-50/50 border border-indigo-100 p-5 rounded-2xl">
                        <div className="text-xs text-slate-600 max-w-md leading-relaxed">
                          Sahkan dokumen di atas secara hukum menggunakan simulasi **Tanda Tangan Elektronik (TTE)** Pejabat Pembuat Komitmen (PPK) untuk mengirim berkas.
                        </div>
                        <button 
                          onClick={() => {
                            setIsSigned(true)
                            setStep(4)
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-3 rounded-xl shadow-md shadow-emerald-600/10 flex items-center gap-2 transition-all duration-200"
                        >
                          ✍️ Sahkan Dokumen (TTE)
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
            <button className="btn-secondary">Simpan Draft</button>
            <button 
              className={`btn-primary ${step < 4 || !isSigned ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => {
                if(step >= 4 && isSigned) {
                  const hasUnverified = dpaAccounts.some(acc => {
                    return !acc.verified && (acc.pagu_method === 'fallback_max' || acc.ocr_engine === 'tesseract');
                  });

                  if (hasUnverified) {
                    alert('⚠️ GAGAL MENGIRIM DPP!\n\nTerdapat data rekening DPA hasil OCR atau Fallback yang belum diverifikasi ("Unverified"). Silakan klik tombol "Konfirmasi Data Ini" atau edit nilai rekening tersebut terlebih dahulu pada tabel hasil OCR Langkah 1.');
                    return;
                  }

                  setStatus('Terkirim ke PP');
                  const submittedData = {
                    packName: selectedPack?.packName,
                    pagu: selectedPack?.pagu,
                    mak: selectedPack?.mak,
                    volume: selectedPack?.volume,
                    spesifikasi: selectedPack?.spesifikasi,
                    hpsValue: hpsValue,
                    techSpecs: techSpecs,
                    dpaName: dpaName,
                    senderName: currentUser.name,
                    senderNip: currentUser.nip,
                    senderDepartment: currentUser.department,
                    sentDate: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                  }
                  localStorage.setItem('pbj_submitted_package', JSON.stringify(submittedData));
                  alert(`Sukses! Dokumen Persiapan Pengadaan (DPP) beserta Surat Keputusan Penetapan HPS Pekerjaan "${selectedPack?.packName}" telah berhasil dikirimkan secara resmi ke Pejabat Pengadaan (PP) daerah.`);
                }
              }}
              disabled={step < 4 || !isSigned}
            >
              Kirim DPP ke PP
            </button>
          </div>

        </div>
      </div>

      {/* DOCUMENT PREVIEW MODAL (A4 PAPER SIMULATION & HIGH-FIDELITY PRINT-READY VIEW) */}
      {activeDocPreview && selectedPack && (
        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.45)' }} className="fixed inset-0 backdrop-blur-md z-50 flex justify-center overflow-y-auto p-4 animate-fade-in print:p-0 print:bg-white">
          
          {/* Style Injector to override print layout strictly for A4 format */}
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              body * {
                visibility: hidden !important;
              }
              #print-sheet, #print-sheet * {
                visibility: visible !important;
              }
              #print-sheet {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 210mm !important;
                min-height: 297mm !important;
                margin: 0 !important;
                padding: 20mm !important;
                box-shadow: none !important;
                border: none !important;
              }
            }
          `}} />

          {/* Modal Header controls (Hidden during print) */}
          <div className="fixed top-4 left-4 right-4 flex justify-between items-center z-50 bg-slate-900/90 border border-white/10 px-6 py-3.5 rounded-2xl shadow-xl backdrop-blur-md max-w-4xl mx-auto print:hidden">
            <div className="text-white text-xs font-semibold uppercase tracking-wider">
              Pratinjau Dokumen Resmi {activeDocPreview === 'hps' ? 'Surat Penetapan HPS' : 'Dokumen Persiapan Pengadaan (DPP)'}
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => window.print()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-lg shadow-indigo-600/20"
              >
                🖨️ Cetak / Unduh PDF
              </button>
              <button 
                onClick={() => setActiveDocPreview(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2 rounded-xl transition-colors border border-slate-700"
              >
                Tutup
              </button>
            </div>
          </div>

          {/* White Paper A4 Sheet */}
          <div 
            id="print-sheet" 
            className="bg-white text-slate-900 w-full max-w-[21cm] min-h-[29.7cm] p-[2cm] shadow-2xl rounded-sm my-20 font-serif leading-relaxed text-[12px] flex flex-col justify-between border border-slate-200 relative print:my-0 print:border-none print:shadow-none"
          >
            <div>
              {/* KOP SURAT DINAS / SATKER */}
              <div className="text-center border-b-4 border-double border-slate-900 pb-3 mb-6 relative">
                <div className="text-[14px] font-bold tracking-wider uppercase">Pemerintah Kabupaten Probolinggo</div>
                <div className="text-[15px] font-bold tracking-widest uppercase mt-0.5">{currentUser.department}</div>
                <div className="text-[10px] font-normal italic mt-1 text-slate-600 font-sans">
                  {currentUser.department.includes('Bago') ? 'Jl. Raya Bago No. 176, Besuk, Kabupaten Probolinggo, Jawa Timur 67281' : 
                   currentUser.department.includes('PUPR') ? 'Jl. Raya Panglima Sudirman No. 45, Kraksaan, Kabupaten Probolinggo, Jawa Timur 67282' :
                   'Komp. Perkantoran Pemerintah Kabupaten Probolinggo, Jawa Timur 67282'}
                </div>
              </div>

              {/* DOCUMENT CONTENT */}
              {activeDocPreview === 'hps' ? (
                // SURAT PENETAPAN HPS
                <div className="space-y-4">
                  <div className="text-center font-bold uppercase underline text-[13px] tracking-wide mt-2">
                    Keputusan Pejabat Pembuat Komitmen
                  </div>
                  <div className="text-center font-bold text-[10px] font-sans -mt-3 text-slate-700">
                    NOMOR: 027 / 142 / PPK / 437.82 / {new Date().getFullYear()}
                  </div>
                  <div className="text-center font-bold uppercase text-[11px] tracking-wider -mt-1">
                    TENTANG<br/>
                    PENETAPAN HARGA PERKIRAAN SENDIRI (HPS)
                  </div>
                  <div className="text-center font-bold uppercase text-[10px] text-slate-800">
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
                      <table className="w-full border-collapse border border-slate-900 text-[11px]">
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
                          {getPackageItems(selectedPack).map((item) => {
                            const unitHpsPrice = hpsPrices[item.name] !== undefined ? hpsPrices[item.name] : item.price;
                            return (
                              <tr key={item.no}>
                                <td className="border border-slate-900 p-2 text-center">{item.no}</td>
                                <td className="border border-slate-900 p-2 text-left font-medium">{item.name}</td>
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
                  <div className="text-center font-bold uppercase underline text-[13px] tracking-wide mt-2">
                    Dokumen Persiapan Pengadaan (DPP) PPK
                  </div>
                  <div className="text-center font-bold text-[10px] font-sans -mt-3 text-slate-700">
                    LAMPIRAN DOKUMEN PERSIAPAN PENGADAAN BARANG/JASA PEMERINTAH
                  </div>
                  
                  <div className="pt-4 space-y-3">
                    <p className="text-justify">
                      Yang bertanda tangan di bawah ini, selaku Pejabat Pembuat Komitmen (PPK) pada Satuan Kerja **{currentUser.department}**, menyerahkan berkas administrasi Dokumen Persiapan Pengadaan (DPP) kepada Pejabat Pengadaan (PP) untuk segera ditindaklanjuti proses pemilihannya melalui portal E-Purchasing LKPP:
                    </p>

                    <div className="bg-slate-50 p-4 rounded-sm border border-slate-300 space-y-2 mt-4">
                      <div className="font-bold text-[11px] uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-2">A. Informasi Paket Rencana Umum Pengadaan (RUP)</div>
                      <div className="grid grid-cols-3 gap-2 text-slate-700">
                        <div className="font-semibold">Nama Paket</div><div className="col-span-2">: {selectedPack.packName}</div>
                        <div className="font-semibold">Kode RUP</div><div className="col-span-2 font-mono">: {selectedPack.noSirup}</div>
                        <div className="font-semibold">Metode Pengadaan</div><div className="col-span-2">: {selectedPack.method || 'E-Purchasing'}</div>
                        <div className="font-semibold">Kode Rekening (MAK)</div><div className="col-span-2 font-mono">: {selectedPack.mak}</div>
                        <div className="font-semibold">Pagu Anggaran</div><div className="col-span-2">: Rp {selectedPack.pagu.toLocaleString()} ({selectedPack.sumberDana})</div>
                        <div className="font-semibold">Nilai HPS Tetap</div><div className="col-span-2 font-bold text-slate-900">: Rp {parseInt(hpsValue).toLocaleString()}</div>
                      </div>
                      
                      <div className="mt-3 border-t border-slate-200 pt-3">
                        <div className="font-bold text-[10px] text-slate-700 uppercase tracking-wide mb-1.5">Rincian Barang Sesuai DPA & RUP:</div>
                        <table className="w-full border-collapse border border-slate-300 text-[10px]">
                          <thead>
                            <tr className="bg-slate-100 font-bold text-center">
                              <td className="border border-slate-300 p-1">No</td>
                              <td className="border border-slate-300 p-1 text-left">Nama Barang</td>
                              <td className="border border-slate-300 p-1">Jumlah</td>
                              <td className="border border-slate-300 p-1">Satuan</td>
                              <td className="border border-slate-300 p-1">Harga / Satuan</td>
                              <td className="border border-slate-300 p-1">Total</td>
                            </tr>
                          </thead>
                          <tbody>
                            {getPackageItems(selectedPack).map((item) => {
                              const unitHpsPrice = hpsPrices[item.name] !== undefined ? hpsPrices[item.name] : item.price;
                              return (
                                <tr key={item.no}>
                                  <td className="border border-slate-300 p-1 text-center">{item.no}</td>
                                  <td className="border border-slate-300 p-1 text-left">{item.name}</td>
                                  <td className="border border-slate-300 p-1 text-center font-bold">{item.qty}</td>
                                  <td className="border border-slate-300 p-1 text-center">{item.unit}</td>
                                  <td className="border border-slate-300 p-1 text-right font-mono">Rp {unitHpsPrice.toLocaleString()}</td>
                                  <td className="border border-slate-300 p-1 text-right font-mono font-bold">Rp {(item.qty * unitHpsPrice).toLocaleString()}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="space-y-2 mt-4">
                      <div className="font-bold text-[11px] uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-2">B. Kelengkapan Berkas Persiapan (Checklist Lampiran)</div>
                      
                      <table className="w-full border-collapse border border-slate-900 text-[11px]">
                        <thead>
                          <tr className="bg-slate-100 font-bold text-center">
                            <td className="border border-slate-900 p-2 w-8">No</td>
                            <td className="border border-slate-900 p-2">Jenis Berkas Persiapan</td>
                            <td className="border border-slate-900 p-2 w-28">Status Lampiran</td>
                            <td className="border border-slate-900 p-2">Keterangan Teknis</td>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-slate-900 p-2 text-center">1</td>
                            <td className="border border-slate-900 p-2 font-medium">Dokumen Pelaksanaan Anggaran (DPA)</td>
                            <td className="border border-slate-900 p-2 text-center text-emerald-700 font-bold">✔️ ADA (PDF)</td>
                            <td className="border border-slate-900 p-2 text-slate-600 font-mono text-[10px]">{dpaName}</td>
                          </tr>
                          <tr>
                            <td className="border border-slate-900 p-2 text-center">2</td>
                            <td className="border border-slate-900 p-2 font-medium">Surat Keputusan Penetapan HPS Resmi</td>
                            <td className="border border-slate-900 p-2 text-center text-emerald-700 font-bold">✔️ ADA (TTE)</td>
                            <td className="border border-slate-900 p-2 text-slate-600 text-[10px]">Nilai: Rp {parseInt(hpsValue).toLocaleString()}</td>
                          </tr>
                          <tr>
                            <td className="border border-slate-900 p-2 text-center">3</td>
                            <td className="border border-slate-900 p-2 font-medium">Form Spesifikasi Teknis Pekerjaan (KAK)</td>
                            <td className="border border-slate-900 p-2 text-center text-emerald-700 font-bold">✔️ ADA (TTE)</td>
                            <td className="border border-slate-900 p-2 text-slate-600 font-mono text-[9px] whitespace-pre-line">{techSpecs}</td>
                          </tr>
                          <tr>
                            <td className="border border-slate-900 p-2 text-center">4</td>
                            <td className="border border-slate-900 p-2 font-medium">Rancangan Kontrak & Klausul Syarat Ketentuan</td>
                            <td className="border border-slate-900 p-2 text-center text-emerald-700 font-bold">✔️ TERSEDIA</td>
                            <td className="border border-slate-900 p-2 text-slate-600 text-[10px]">Surat Dinas Pemesanan e-Purchasing</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SIGNATURE SECTION (FOOTER) */}
            <div className="flex justify-between items-end mt-12 pt-6 border-t border-slate-200">
              <div className="text-[10px] font-sans text-slate-500 italic max-w-xs">
                Dokumen ini merupakan produk administrasi resmi internal Pemerintah Kabupaten Probolinggo dan sah secara hukum sejak dibubuhi Tanda Tangan Elektronik (TTE).
              </div>
              <div className="w-56 text-center space-y-2">
                <div className="text-[11px]">
                  Besuk, {new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}
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
      )}

      {/* RUP LKPP Detail Sheet Modal */}
      {detailModalPack && (
        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.4)' }} className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-100 overflow-hidden animate-zoom-in my-8">
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
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-indigo-600/20"
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

// Komponen Pembantu untuk Input Manual & Otomatis No. SIRUP per Rekening DPA
function SirupInputRow({ acc, onLink, sirupPackages = [] }) {
  const [noSirup, setNoSirup] = useState('')
  const [packName, setPackName] = useState('')
  const [pagu, setPagu] = useState(acc.pagu || 0)
  const [method, setMethod] = useState('Pengadaan Langsung')

  // Auto-suggest: Cari paket SIRUP yang memiliki MAK cocok dengan kode rekening DPA ini
  const cleanDpa = acc.account ? acc.account.replace(/[^0-9]/g, '') : ''
  const suggestions = sirupPackages ? sirupPackages.filter(p => {
    if (!p.mak) return false
    const cleanSirup = p.mak.replace(/[^0-9]/g, '')
    return cleanSirup.includes(cleanDpa) || cleanDpa.includes(cleanSirup)
  }) : []

  const handleSelectPackage = (pack) => {
    setNoSirup(pack.noSirup || pack.no || '')
    setPackName(pack.packName || pack.nama || '')
    setPagu(pack.pagu || 0)
    setMethod(pack.method || 'Pengadaan Langsung')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!noSirup) {
      alert('Silakan isi Nomor RUP SIRUP terlebih dahulu.')
      return
    }
    if (!packName) {
      alert('Silakan isi Nama Paket sesuai yang ada di portal SIRUP.')
      return
    }

    onLink({
      noSirup,
      packName,
      pagu: parseInt(pagu) || acc.pagu,
      method,
      sumberDana: 'APBD',
      tahun: '2026',
      klpd: 'Kab. Probolinggo',
      satker: 'Kecamatan Besuk',
      volume: '1 Paket',
      uraian: packName,
      spesifikasi: 'Spesifikasi Sesuai Rincian DPA',
      pdn: 'Ya',
      usahaKecil: 'Ya',
      jenisPengadaan: acc.account?.includes('5.2.') ? 'Modal' : 'Barang',
      mak: acc.account
    })
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3.5 shadow-sm transition-all focus-within:border-indigo-400">
      <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center justify-between">
        <span>Hubungkan RUP SIRUP:</span>
        {sirupPackages.length > 0 && (
          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 animate-pulse-subtle">
            📡 Terkoneksi ke {sirupPackages.length} Data RUP Resmi
          </span>
        )}
      </div>

      {/* 💡 REKOMENDASI CERDAS DARI MAK DPA */}
      {suggestions.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-xs">
          <div className="font-bold text-indigo-800 flex items-center gap-1.5 mb-1.5">
            <span>💡</span> Rekomendasi RUP SIRUP yang Cocok:
          </div>
          <div className="space-y-1.5">
            {suggestions.map((s) => (
              <button
                key={s.noSirup}
                type="button"
                onClick={() => handleSelectPackage(s)}
                className="w-full text-left bg-white hover:bg-indigo-600 hover:text-white text-[11px] p-2 rounded-lg border border-indigo-150 transition-all font-sans flex justify-between items-center shadow-sm active:scale-[0.99]"
              >
                <span>
                  <strong className="font-mono bg-indigo-50 text-indigo-700 px-1 py-0.5 rounded text-[9px] mr-1">#{s.noSirup}</strong>
                  {s.packName} (Pagu: <strong>Rp {s.pagu?.toLocaleString()}</strong>)
                </span>
                <span className="bg-indigo-600 text-white font-bold px-2 py-0.5 rounded-md text-[9px] uppercase hover:bg-indigo-700">
                  Pilih
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SEARCHABLE SELECT DROPDOWN */}
      {sirupPackages.length > 0 && (
        <div className="text-xs">
          <label className="block text-[10px] text-slate-500 font-bold mb-1">Pilih RUP dari Daftar Resmi Satker (Instan):</label>
          <select
            onChange={(e) => {
              const selected = sirupPackages.find(p => p.noSirup === e.target.value)
              if (selected) handleSelectPackage(selected)
            }}
            className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs cursor-pointer focus:ring-2 focus:ring-indigo-150 outline-none"
            value={noSirup}
          >
            <option value="">-- Cari & Pilih Paket RUP SIRUP --</option>
            {sirupPackages.map(p => (
              <option key={p.noSirup} value={p.noSirup}>
                #{p.noSirup} - {p.packName?.substring(0, 70)}... (Rp {p.pagu?.toLocaleString()})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* INPUT FORM MANUAL/EDITABLE */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Nomor RUP SIRUP</label>
          <input
            type="text"
            required
            className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded px-2 py-1 text-xs font-mono font-bold"
            placeholder="Contoh: 65307012"
            value={noSirup}
            onChange={(e) => setNoSirup(e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Nama Paket di SIRUP</label>
          <input
            type="text"
            required
            className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded px-2 py-1 text-xs"
            placeholder="Belanja ATK Kantor..."
            value={packName}
            onChange={(e) => setPackName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Pagu RUP (Rp)</label>
          <input
            type="number"
            required
            className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded px-2 py-1 text-xs font-bold text-indigo-700"
            value={pagu}
            onChange={(e) => setPagu(e.target.value)}
          />
        </div>
      </div>
      <div className="flex justify-between items-center pt-1.5 border-t border-slate-100">
        <div>
          <label className="inline-flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold mr-3">
            Metode:
            <select
              className="bg-transparent border-0 font-extrabold text-indigo-600 focus:ring-0 p-0 text-[10.5px] cursor-pointer"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              <option value="Pengadaan Langsung">Pengadaan Langsung</option>
              <option value="E-Purchasing">E-Purchasing</option>
              <option value="Penunjukan Langsung">Penunjukan Langsung</option>
              <option value="Tender">Tender</option>
            </select>
          </label>
        </div>
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-lg shadow-md shadow-indigo-600/10 transition-all flex items-center gap-1"
        >
          <span>✓</span> Hubungkan Ke Rekening Ini
        </button>
      </div>
    </form>
  )
}

