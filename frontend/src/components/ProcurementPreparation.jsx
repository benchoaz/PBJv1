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
  const [hpsValue, setHpsValue] = useState(() => {
    return localStorage.getItem('pbj_hps_value') || ''
  })
  const [techSpecs, setTechSpecs] = useState(() => {
    return localStorage.getItem('pbj_tech_specs') || ''
  })

  const [matchedDpaTypes, setMatchedDpaTypes] = useState(() => {
    const saved = localStorage.getItem('pbj_matched_dpa_types')
    return saved ? JSON.parse(saved) : ['LAPTOP', 'ATK', 'CETAK']
  })

  const [isScraping, setIsScraping] = useState(false)
  const [scrapingLogs, setScrapingLogs] = useState([])
  const [status, setStatus] = useState('Draft')
  
  // Document generation & preview states
  const [activeDocPreview, setActiveDocPreview] = useState(null) // 'hps' | 'dpp' | null
  const [isSigned, setIsSigned] = useState(() => {
    return localStorage.getItem('pbj_is_signed') === 'true'
  })

  const getPackageItems = (pack) => {
    if (!pack) return []
    if (pack.noSirup === '65307012') {
      return [
        { no: 1, name: 'Alas Triplek', qty: 6, unit: 'Biji', price: 15900 },
        { no: 2, name: 'Ballpoint / Ballpen / Pena (Ballpoint Baliner)', qty: 6, unit: 'Pack', price: 239400 },
        { no: 3, name: 'Ballpoint / Ballpen / Pena (Biasa, R6 Isi 12 Buah setara Standard)', qty: 10, unit: 'Pack', price: 38400 },
        { no: 4, name: 'Bantalan Stempel Biasa', qty: 10, unit: 'Buah', price: 17100 },
        { no: 5, name: 'Gunting Besar', qty: 5, unit: 'Buah', price: 32000 },
        { no: 6, name: 'Isi Staples No. 10-1M (setara Max)', qty: 20, unit: 'Buah', price: 4700 },
        { no: 7, name: 'Isolasi Lakban Hitam (Uk 46 mm x 12 m setara Nachi)', qty: 10, unit: 'Buah', price: 20000 },
        { no: 8, name: 'Lem 20 Ml (setara UHU)', qty: 10, unit: 'Buah', price: 17600 },
        { no: 9, name: 'Map Dinas F4', qty: 200, unit: 'Buah', price: 4800 },
        { no: 10, name: 'Snelhechter Map (5001 Isi 50 Buah setara Diamond)', qty: 5, unit: 'Dus', price: 110800 },
        { no: 11, name: 'Spidol Besar', qty: 10, unit: 'Buah', price: 11400 },
        { no: 12, name: 'Stapler/Hechmachine Kecil', qty: 10, unit: 'Buah', price: 35400 },
        { no: 13, name: 'Tinta Stempel 50 Ml (setara Artline)', qty: 10, unit: 'Buah', price: 32900 }
      ]
    }
    if (pack.noSirup === '65308044') {
      return [
        { no: 1, name: 'Amplop Dinas Coklat (15,5 x 25 Cm)', qty: 200, unit: 'Lembar', price: 2000 },
        { no: 2, name: 'Kertas HVS A4 80 Gram (setara Sinar Dunia)', qty: 10, unit: 'Rim', price: 75900 },
        { no: 3, name: 'Kertas HVS F4 70 Gram (setara Sidu)', qty: 50, unit: 'Rim', price: 69700 }
      ]
    }
    if (pack.noSirup === '65309015') {
      return [
        { no: 1, name: 'Tinta Printer Black (setara Epson 001)', qty: 6, unit: 'Buah', price: 228800 },
        { no: 2, name: 'Tinta Printer Colour (setara Epson 001)', qty: 12, unit: 'Buah', price: 137300 }
      ]
    }
    return [
      { no: 1, name: pack.packName, qty: 1, unit: 'Paket', price: pack.pagu }
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

  // Mock SIRUP Data matching screenshots and LKPP structures exactly
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

  const startScrapingSimulation = () => {
    setIsScraping(true)
    setScrapingLogs([])
    setScrapedData([])
    setSelectedPack(null)

    const logs = [
      '🚀 Menginisialisasi Playwright Scraper...',
      `🔍 Menghubungkan ke portal SIRUP LKPP: https://sirup.inaproc.id/sirup/home/penyediaSatker?idSatker=${satkerId}`,
      `📡 Memanggil DataTable Endpoint: https://sirup.inaproc.id/sirup/datatablectr/dataruppenyediasatker?tahun=2026&idSatker=${satkerId}&sEcho=1&iColumns=7&sColumns=%2CnamaPaket%2C%2C%2CsumberDana%2C%2C&iDisplayStart=0&iDisplayLength=10`,
      '🌐 Mendeteksi struktur tabel RUP dan memetakan parameter APBD...',
      '⚡ Melakukan scraping detail paket (Kode RUP, Nama Paket, Pagu, Metode)...',
      '🤖 Mengekstrak detail volume, spesifikasi, dan MAK untuk setiap paket...',
      '✅ Sukses menyinkronkan data RUP!'
    ]

    logs.forEach((log, index) => {
      setTimeout(() => {
        setScrapingLogs(prev => [...prev, log])
        if (index === logs.length - 1) {
          setIsScraping(false)
          setScrapedData(mockSirupData)
          setStep(2)
        }
      }, (index + 1) * 800)
    })
  }

  const selectPackage = (pack) => {
    setSelectedPack(pack)
    setHpsValue(pack.pagu.toString())
    setTechSpecs(`Volume: ${pack.volume}\nSpesifikasi: ${pack.spesifikasi}\nMAK: ${pack.mak}`)
    setStep(3)
  }

  const resetFlow = () => {
    if(confirm('Apakah Anda ingin mereset DPA yang tersimpan dan membuat usulan pengadaan baru?')) {
      localStorage.clear()
      setStep(1)
      setDpaName(null)
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
        {(dpaName || scrapedData.length > 0) && (
          <button 
            onClick={resetFlow} 
            className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            🔄 Reset & Buat Baru
          </button>
        )}
      </div>

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

        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Step 1: Upload DPA */}
          <div className="glass-panel p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">Dokumen Pelaksanaan Anggaran (DPA)</h2>
              <span className="px-3 py-1 text-xs rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-medium">Langkah 1 (Wajib)</span>
            </div>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">Sebagai dokumen pembuka pengadaan, PPK wajib mengunggah DPA awal bersama Formulir Identifikasi Kebutuhan.</p>
            
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-indigo-500/50 transition-colors mb-6 bg-slate-50/50">
              {dpaName ? (
                <div className="text-emerald-600">
                  <span className="text-3xl block mb-2">💾</span>
                  <span className="font-bold block text-slate-700 text-sm mb-1">{dpaName}</span>
                  <span className="text-xs text-emerald-600 font-bold block">✔️ Dokumen DPA Tersimpan dalam Sistem</span>
                  <span className="text-[11px] text-slate-500 block mt-1">Status: Siap untuk integrasi data SIRUP.</span>
                  <button onClick={() => setDpaName(null)} className="mt-4 text-xs text-rose-600 hover:text-rose-700 font-bold underline transition-colors">Hapus DPA</button>
                </div>
              ) : (
                <>
                  <div className="text-4xl mb-4">📂</div>
                  <label className="cursor-pointer">
                    <span className="btn-secondary text-sm">Pilih File DPA (PDF)</span>
                    <input type="file" className="hidden" accept=".pdf" onChange={(e) => {
                      const file = e.target.files[0]
                      if (file) {
                        setDpaName(file.name)
                        
                        // Intelligent Client-Side PDF Content Scan (Simulating OCR/AI Analysis)
                        const reader = new FileReader()
                        reader.onload = (event) => {
                          const binaryStr = event.target.result || ''
                          const scanContent = (binaryStr + ' ' + file.name).toLowerCase()
                          
                          // Scan for multiple matched accounts
                          const matchedTypes = []
                          if (scanContent.includes('alat tulis') || scanContent.includes('atk') || scanContent.includes('5.1.02.01.001.00024') || scanContent.includes('5.027.800') || scanContent.includes('79-81')) {
                            matchedTypes.push('ATK')
                          }
                          if (scanContent.includes('komputer') || scanContent.includes('laptop') || scanContent.includes('printer') || scanContent.includes('5.2.02.10.0002') || scanContent.includes('10.829.000')) {
                            matchedTypes.push('LAPTOP')
                          }
                          if (scanContent.includes('cetak') || scanContent.includes('penggandaan') || scanContent.includes('5.1.02.01.001.00012') || scanContent.includes('7.664.400')) {
                            matchedTypes.push('CETAK')
                          }
                          
                          // Fallback to all three if PDF binary is unreadable (encrypted/compressed) to give PPK full transparency
                          if (matchedTypes.length === 0) {
                            matchedTypes.push('ATK')
                            matchedTypes.push('CETAK')
                            matchedTypes.push('LAPTOP')
                          }
                          
                          setMatchedDpaTypes(matchedTypes)
                          
                          alert(`🎉 AI Engine: Sukses menganalisis DPA PDF!\nDitemukan ${matchedTypes.length} rekening belanja aktif:\n` + 
                                matchedTypes.map(t => t === 'ATK' ? '• Belanja Alat Tulis Kantor (Rek: 5.1.02.01.001.00024)' : 
                                                    t === 'LAPTOP' ? '• Belanja Modal Komputer (Rek: 5.2.02.10.0002)' : 
                                                    '• Belanja Bahan Cetak & Penggandaan (Rek: 5.1.02.01.001.00012)').join('\n') +
                                `\n\nSistem otomatis mengintegrasikan dan menyinkronkan data RUP LKPP untuk semua rekening tersebut.`);
                        }
                        reader.readAsText(file)
                      }
                    }} />
                  </label>
                </>
              )}
            </div>

            {/* Integration Search SIRUP Button */}
            {dpaName && (
              <div className="border-t border-slate-100 pt-6 animate-fade-in">
                <h3 className="text-sm font-bold text-indigo-700 mb-3 uppercase tracking-wider">Integrasi Otomatis SIRUP LKPP</h3>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  {currentUser.role === 'PPK' ? (
                    <div className="flex-1 w-full animate-fade-in">
                      <label className="block text-xs text-slate-500 font-semibold mb-1">Satker / Instansi Anda (Terkunci untuk PPK)</label>
                      <div className="glass-panel px-4 py-2 text-slate-700 text-sm font-medium flex items-center justify-between border border-indigo-100/50 bg-indigo-50/10">
                        <div className="flex items-center gap-2">
                          <span>🏛️</span>
                          <span className="font-bold text-slate-800">{currentUser.department}</span>
                        </div>
                        <span className="bg-indigo-600/10 text-indigo-700 border border-indigo-600/20 font-mono font-bold text-xs px-2.5 py-0.5 rounded-full">
                          ID Satker: {satkerId}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 w-full animate-fade-in">
                      <label className="block text-xs text-slate-500 font-semibold mb-1">ID Satker / Instansi (Akses Multi-Satker PP)</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          className="glass-input text-sm font-mono flex-1" 
                          value={satkerId} 
                          onChange={(e) => setSatkerId(e.target.value)} 
                          placeholder="Satker ID (Besuk: 67081)"
                        />
                        <select 
                          className="glass-input text-xs max-w-[220px]"
                          value={satkerId}
                          onChange={(e) => setSatkerId(e.target.value)}
                        >
                          <option value="67081">Kecamatan Besuk (67081)</option>
                          <option value="67082">Kecamatan Kraksaan (67082)</option>
                          <option value="67083">Kecamatan Paiton (67083)</option>
                          <option value="12345">Dinas PUPR Kab. Probolinggo (12345)</option>
                        </select>
                      </div>
                    </div>
                  )}
                  <button 
                    onClick={startScrapingSimulation} 
                    disabled={isScraping}
                    className="btn-primary w-full sm:w-auto h-fit mt-5 text-sm flex items-center justify-center gap-2"
                  >
                    {isScraping ? 'Mengambil Data...' : '🔍 Tarik & Sinkronisasi SIRUP'}
                  </button>
                </div>

                {/* Scraping Log Display */}
                {isScraping && (
                  <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-xs text-indigo-600 space-y-2 h-40 overflow-y-auto shadow-inner">
                    {scrapingLogs.map((log, index) => (
                      <div key={index} className="animate-fade-in">⚙️ {log}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Scraped Data Table */}
          {scrapedData.length > 0 && (
            <div className="glass-panel p-6 animate-slide-up">
              <h2 className="text-xl font-bold text-slate-800 mb-2">Hasil Scraping Paket SIRUP</h2>
              <p className="text-sm text-slate-500 mb-6">Berikut adalah paket APBD yang ditemukan untuk RUP Penyedia Kecamatan Besuk. Pilih paket untuk memuat detailnya.</p>
              
              <div className="overflow-x-auto border border-slate-100 rounded-xl shadow-sm">
                <table className="min-w-full divide-y divide-slate-100 bg-white">
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
                            {((matchedDpaTypes.includes('ATK') && pack.noSirup === '65307012') || 
                              (matchedDpaTypes.includes('LAPTOP') && pack.noSirup === '65309015') ||
                              (matchedDpaTypes.includes('CETAK') && pack.noSirup === '65308044')) && (
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
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Nilai HPS Disetujui (Rp)</label>
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
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex justify-center overflow-y-auto p-4 animate-fade-in print:p-0 print:bg-white">
          
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
                          {getPackageItems(selectedPack).map((item) => (
                            <tr key={item.no}>
                              <td className="border border-slate-900 p-2 text-center">{item.no}</td>
                              <td className="border border-slate-900 p-2 text-left font-medium">{item.name}</td>
                              <td className="border border-slate-900 p-2 text-center font-bold">{item.qty}</td>
                              <td className="border border-slate-900 p-2 text-center">{item.unit}</td>
                              <td className="border border-slate-900 p-2 text-right font-mono">Rp {item.price.toLocaleString()}</td>
                              <td className="border border-slate-900 p-2 text-right font-mono font-bold">Rp {(item.qty * item.price).toLocaleString()}</td>
                            </tr>
                          ))}
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
                            {getPackageItems(selectedPack).map((item) => (
                              <tr key={item.no}>
                                <td className="border border-slate-300 p-1 text-center">{item.no}</td>
                                <td className="border border-slate-300 p-1 text-left">{item.name}</td>
                                <td className="border border-slate-300 p-1 text-center font-bold">{item.qty}</td>
                                <td className="border border-slate-300 p-1 text-center">{item.unit}</td>
                                <td className="border border-slate-300 p-1 text-right font-mono">Rp {item.price.toLocaleString()}</td>
                                <td className="border border-slate-300 p-1 text-right font-mono font-bold">Rp {(item.qty * item.price).toLocaleString()}</td>
                              </tr>
                            ))}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/85 backdrop-blur-md p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-100 overflow-hidden animate-zoom-in my-8">
            {/* Header */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <span>🏛️</span> Detail Rencana Umum Pengadaan (RUP) Penyedia - SIRUP LKPP
                </h3>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  https://sirup.inaproc.id/sirup/home/penyediaSatker?idSatker={satkerId}
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
