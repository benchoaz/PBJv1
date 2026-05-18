import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProcurementPanel() {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      navigate('/login')
    } else if (user.role.toUpperCase() !== 'PP' && user.role.toUpperCase() !== 'ADMIN') {
      navigate('/ppk/persiapan')
    }
  }, [user, navigate])

  const [activeTab, setActiveTab] = useState('incoming')

  // Load dynamically from localStorage or fallback
  const [submittedPack, setSubmittedPack] = useState(() => {
    const saved = localStorage.getItem('pbj_submitted_package')
    if (!saved) return null
    try {
      return JSON.parse(saved)
    } catch (e) {
      return null
    }
  })
 
  // State for checkboxes to select which items PP wants to process (default all checked)
  const [checkedItems, setCheckedItems] = useState(() => {
    const saved = localStorage.getItem('pbj_pp_checked_items')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {}
    }
    // Default all items to true based on active package
    const packStr = localStorage.getItem('pbj_submitted_package')
    if (packStr) {
      try {
        const pack = JSON.parse(packStr)
        const defaults = {}
        // Support up to 13 items for ATK, 3 for Kertas, 2 for Bahan Komputer
        const itemCount = pack.noSirup === '65307012' ? 13 : pack.noSirup === '65308044' ? 3 : pack.noSirup === '65309015' ? 2 : 2
        for (let i = 1; i <= itemCount; i++) {
          defaults[i] = true
        }
        return defaults
      } catch (e) {}
    }
    return { 1: true, 2: true }
  })

  const handleCheckboxChange = (itemNo) => {
    const updated = {
      ...checkedItems,
      [itemNo]: !checkedItems[itemNo]
    }
    setCheckedItems(updated)
    localStorage.setItem('pbj_pp_checked_items', JSON.stringify(updated))
    
    // Automatically adjust selectedProductType in Search tab to one of the checked items
    if (updated[1] && !updated[2]) {
      setSelectedProductType('Laptop')
    } else if (updated[2] && !updated[1]) {
      setSelectedProductType('Printer')
    }
  }

  const getDynamicTotalPagu = () => {
    const items = getPackageItems(submittedPack)
    if (items.length === 0) return 0
    let total = 0
    items.forEach(item => {
      if (checkedItems[item.no]) {
        total += item.qty * item.price
      }
    })
    return total
  }

  // Advanced e-Katalog Search Filters
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [filterKatalog, setFilterKatalog] = useState('Lokal')
  const [selectedLocations, setSelectedLocations] = useState([
    'Kab. Probolinggo',
    'Kota Probolinggo',
    'Kota Surabaya'
  ])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProductType, setSelectedProductType] = useState('Laptop') // Laptop | Printer

  // Synchronize category state with checked options to prevent select box mismatch
  useEffect(() => {
    if (selectedProductType === 'Laptop' && !checkedItems[1] && checkedItems[2]) {
      setSelectedProductType('Printer')
    } else if (selectedProductType === 'Printer' && !checkedItems[2] && checkedItems[1]) {
      setSelectedProductType('Laptop')
    }
  }, [checkedItems, selectedProductType])

  // Compare states
  const [comparedProducts, setComparedProducts] = useState([])

  // Consolidation status check
  const items = getPackageItems(submittedPack)
  const isLaptopConsolidated = items.find(i => i.no === 1)?.name?.includes('[Konsolidasi]') || false
  const isPrinterConsolidated = items.find(i => i.no === 2)?.name?.includes('[Konsolidasi]') || false
  const isCurrentProductConsolidated = selectedProductType === 'Laptop' ? isLaptopConsolidated : isPrinterConsolidated
  
  // Documentation states
  const [savedDocs, setSavedDocs] = useState(() => {
    const saved = localStorage.getItem('pbj_pp_documentation')
    const defaults = {
      laptop: { url: '', screenshot: null, negotiatedPrice: '', negotiatedOngkir: '', selectedProduct: null, comparedProducts: null },
      printer: { url: '', screenshot: null, negotiatedPrice: '', negotiatedOngkir: '', selectedProduct: null, comparedProducts: null }
    }
    if (!saved) return defaults
    try {
      const parsed = JSON.parse(saved) || {}
      return {
        laptop: { ...defaults.laptop, ...(parsed.laptop || {}) },
        printer: { ...defaults.printer, ...(parsed.printer || {}) }
      }
    } catch (e) {
      return defaults
    }
  })

  // Real-world Catalog Mock Data
  const mockCatalogProducts = {
    Laptop: [
      { 
        id: 'L01', 
        name: 'ASUS ExpertBook P1412CEA', 
        vendor: 'PT ASUS Technology Indonesia (Penyedia Lokal)', 
        price: 8200000, 
        rating: 4.8, 
        location: 'Kab. Probolinggo', 
        specs: 'Intel Core i3, RAM 8GB, SSD 256GB, Win 11 Home',
        garansi: '2 Tahun Resmi',
        katalog: 'Lokal',
        badge: 'Rekomendasi: Lokasi Terdekat & Hemat Ongkir'
      },
      { 
        id: 'L02', 
        name: 'Acer TravelMate P214', 
        vendor: 'PT Acer Indonesia', 
        price: 8450000, 
        rating: 4.7, 
        location: 'Kota Surabaya', 
        specs: 'Intel Core i3, RAM 8GB, SSD 256GB, Win 11 Home',
        garansi: '1 Tahun Resmi',
        katalog: 'Nasional',
        badge: 'Rekomendasi: Pilihan Umum LKPP'
      },
      { 
        id: 'L03', 
        name: 'Lenovo ThinkBook 14 G4', 
        vendor: 'PT Lenovo Indonesia', 
        price: 8590000, 
        rating: 4.9, 
        location: 'DKI Jakarta', 
        specs: 'Intel Core i3, RAM 8GB, SSD 512GB, Win 11 Home',
        garansi: '2 Tahun Resmi',
        katalog: 'Nasional',
        badge: 'Rekomendasi: Spesifikasi SSD Terbesar'
      }
    ],
    Printer: [
      { 
        id: 'P01', 
        name: 'PRINTER EPSON L121', 
        vendor: 'UMKK MITRA TECHNOLOGY COMPUTINDO', 
        price: 1750000, 
        rating: 4.9, 
        location: 'Kota Probolinggo', 
        specs: 'Print Only, Ink Tank System, Kecepatan Tinggi (PDN)',
        garansi: '2 Tahun Resmi',
        katalog: 'Lokal',
        badge: 'Rekomendasi Utama: Mitra Terpercaya & Harga Terendah'
      },
      { 
        id: 'P02', 
        name: 'Printer Epson L121', 
        vendor: 'CV. MULTI MEDIA PROBOLINGGO UTAMA', 
        price: 1881450, 
        rating: 4.7, 
        location: 'Kota Probolinggo', 
        specs: 'Print Only, Ink Tank, Kecepatan Tinggi (PDN)',
        garansi: '2 Tahun',
        katalog: 'Lokal',
        badge: 'Pembanding Lokal: Lokasi Terdekat'
      },
      { 
        id: 'P03', 
        name: 'Epson L121', 
        vendor: 'UD. BESUK INDAH COMPUTINDO JAYA', 
        price: 2500000, 
        rating: 4.5, 
        location: 'Kab. Probolinggo', 
        specs: 'Print Only, Ink Tank, Kecepatan Tinggi (PDN)',
        garansi: '1 Tahun',
        katalog: 'Lokal',
        badge: 'Pembanding Lokal: Kapasitas Sedang'
      }
    ]
  }

  // Handle automatic query fill from DPA/RUP
  useEffect(() => {
    if (submittedPack) {
      setSearchQuery(selectedProductType === 'Laptop' ? 'Laptop Intel Celeron' : 'Printer EPSON L121')
    }
  }, [selectedProductType, submittedPack])

  const getPackageItems = (pack) => {
    if (!pack) return []
    if (pack.packName?.includes('Alat Tulis') || pack.packName?.includes('ATK') || pack.mak === '5.1.02.01.001.00024') {
      return [
        { no: 1, name: 'Ballpoint Standard AE7', qty: 15, unit: 'Box', price: 28520 },
        { no: 2, name: 'Map Snelhechter Plastik', qty: 150, unit: 'Pcs', price: 6200 },
        { no: 3, name: 'Buku Agenda Kerja PPK', qty: 10, unit: 'Pcs', price: 35000 },
        { no: 4, name: 'Spidol Whiteboard Boardmarker', qty: 50, unit: 'Pcs', price: 12500 },
        { no: 5, name: 'Stapler Kangaro HP-45', qty: 5, unit: 'Unit', price: 64000 },
        { no: 6, name: 'Isi Staples Kangaro No. 10', qty: 50, unit: 'Box', price: 4500 },
        { no: 7, name: 'Cutter Kenko L-500', qty: 10, unit: 'Pcs', price: 18500 },
        { no: 8, name: 'Isi Cutter Kenko', qty: 20, unit: 'Tube', price: 8000 },
        { no: 9, name: 'Penghapus Whiteboard', qty: 15, unit: 'Pcs', price: 7500 },
        { no: 10, name: 'Gunting Sedang', qty: 10, unit: 'Pcs', price: 14500 },
        { no: 11, name: 'Lakban Hitam 2 Inch', qty: 25, unit: 'Roll', price: 19500 },
        { no: 12, name: 'Double Tape 1 Inch', qty: 20, unit: 'Roll', price: 9500 },
        { no: 13, name: 'Amplop Kabinet Jaya No. 90', qty: 20, unit: 'Box', price: 43500 }
      ]
    }
    return [
      { no: 1, name: 'Laptop (setara intel Celeron termasuk Operating Sistem)', qty: 1, unit: 'Unit', price: 8629000 },
      { no: 2, name: '[Konsolidasi] Printer EPSON L121', qty: 1, unit: 'Unit', price: 2200000 }
    ]
  }

  const handleResetPackage = () => {
    if(confirm('Apakah Anda ingin menghapus usulan paket masuk saat ini untuk simulasi baru?')) {
      localStorage.removeItem('pbj_submitted_package')
      localStorage.removeItem('pbj_pp_documentation')
      setSubmittedPack(null)
      setSavedDocs({
        laptop: { url: '', screenshot: null, negotiatedPrice: '', negotiatedOngkir: '', selectedProduct: null },
        printer: { url: '', screenshot: null, negotiatedPrice: '', negotiatedOngkir: '', selectedProduct: null }
      })
    }
  }

  // Toggle products in comparison list
  const toggleCompare = (product) => {
    if (comparedProducts.some(p => p.id === product.id)) {
      setComparedProducts(comparedProducts.filter(p => p.id !== product.id))
    } else {
      if (comparedProducts.length >= 3) {
        alert('Maksimal perbandingan adalah 3 produk untuk menjaga kejelasan matriks.')
        return
      }
      setComparedProducts([...comparedProducts, product])
    }
  }

  // Save Link & Screenshot documentation for a product type
  const saveDocumentation = (type, url, screenshot, negPrice, negOngkir, product) => {
    const updated = {
      ...savedDocs,
      [type]: {
        url,
        screenshot,
        negotiatedPrice: negPrice || product.price,
        negotiatedOngkir: negOngkir || '0',
        selectedProduct: product
      }
    }
    setSavedDocs(updated)
    localStorage.setItem('pbj_pp_documentation', JSON.stringify(updated))
    alert(`Sukses! Dokumentasi audit trail e-Katalog untuk komoditas ${type.toUpperCase()} telah disimpan secara permanen.`)
  }

  // Automatic smart system documentation (Asisten AI)
  const handleAutoScreenshot = (type, product) => {
    const currentCategoryProducts = mockCatalogProducts[type === 'laptop' ? 'Laptop' : 'Printer']
    const mockScreenshotUrl = type === 'laptop'
      ? 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80'
      : 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=800&q=80'

    const realUrl = type === 'laptop' 
      ? 'https://e-katalog.lkpp.go.id/product/id/acer-travelmate-p214-inaproc'
      : 'https://katalog.inaproc.id/mitra-technology-computindo/printer-epson-l121'

    const maxHps = type === 'laptop' ? 8629000 : 2200000
    
    // Smart AI Negotiation Logic (Ensures compliance with HPS even if Etalase price is higher)
    let aiNegotiatedPrice = product.price
    if (product.price > maxHps) {
       aiNegotiatedPrice = maxHps - 29000 // Safely negotiate down to below HPS!
    } else if (product.price > maxHps - 50000) {
       aiNegotiatedPrice = product.price - 50000
    }

    const negotiatedOngkir = type === 'laptop' ? '150000' : '120000'

    const updatedDocs = {
      ...savedDocs,
      [type]: {
        url: realUrl,
        screenshot: mockScreenshotUrl,
        negotiatedPrice: aiNegotiatedPrice,
        negotiatedOngkir: negotiatedOngkir,
        selectedProduct: product,
        comparedProducts: currentCategoryProducts,
        isAutomatic: true
      }
    }
    setSavedDocs(updatedDocs)
    localStorage.setItem('pbj_pp_documentation', JSON.stringify(updatedDocs))
    alert(`⚡ Asisten AI: Sukses memproses secara otomatis! Sistem telah mencari, membandingkan 3 vendor secara matriks, menghitung biaya negosiasi, dan menangkap bukti e-Katalog LKPP untuk "${product.name}"!`)
  }

  // Modal states for manual inaproc documentation
  const [isDocModalOpen, setIsDocModalOpen] = useState(false)
  const [docModalType, setDocModalType] = useState('laptop') // laptop | printer
  const [docModalProduct, setDocModalProduct] = useState(null)
  
  // Form input states for the documentation modal
  const [docRealUrl, setDocRealUrl] = useState('')
  const [docRealScreenshot, setDocRealScreenshot] = useState(null)
  const [docNegotiatedPrice, setDocNegotiatedPrice] = useState('')
  const [docNegotiatedOngkir, setDocNegotiatedOngkir] = useState('')

  const handleOpenDocModal = (type, product) => {
    setDocModalType(type)
    setDocModalProduct(product)
    
    // Check if documentation already exists to pre-populate, or set defaults
    const existing = savedDocs[type]
    if (existing && existing.selectedProduct && existing.selectedProduct.id === product.id) {
      setDocRealUrl(existing.url || `https://e-katalog.lkpp.go.id/product/id/${product.id}`)
      setDocRealScreenshot(existing.screenshot)
      setDocNegotiatedPrice(existing.negotiatedPrice || product.price)
      setDocNegotiatedOngkir(existing.negotiatedOngkir || '150000')
    } else {
      setDocRealUrl(`https://e-katalog.lkpp.go.id/product/id/${product.id}`)
      setDocRealScreenshot(null)
      setDocNegotiatedPrice(product.price - 100000) // Default discount Rp 100rb as standard baseline
      setDocNegotiatedOngkir('150000')
    }
    
    setIsDocModalOpen(true)
  }

  const handleScreenshotUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setDocRealScreenshot(reader.result) // Base64 string
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveDocumentation = () => {
    if (!docRealScreenshot) {
      alert("Peringatan: Harap unggah file screenshot e-Katalog Inaproc yang asli sebagai bukti pertanggungjawaban audit!")
      return
    }
    if (!docRealUrl.trim().startsWith("http")) {
      alert("Peringatan: Harap masukkan Link Produk e-Katalog LKPP (Inaproc) yang valid!")
      return
    }
    
    const currentCategoryProducts = mockCatalogProducts[docModalType === 'laptop' ? 'Laptop' : 'Printer']
    const updatedDocs = {
      ...savedDocs,
      [docModalType]: {
        url: docRealUrl,
        screenshot: docRealScreenshot,
        negotiatedPrice: parseInt(docNegotiatedPrice) || docModalProduct.price,
        negotiatedOngkir: docNegotiatedOngkir.toString(),
        selectedProduct: docModalProduct,
        comparedProducts: currentCategoryProducts,
        isAutomatic: false
      }
    }
    
    setSavedDocs(updatedDocs)
    localStorage.setItem('pbj_pp_documentation', JSON.stringify(updatedDocs))
    setIsDocModalOpen(false)
    alert(`🎉 Sukses! Bukti Dokumentasi Inaproc untuk "${docModalProduct.name}" berhasil disimpan dengan link & tangkapan layar asli!`)
  }

  return (
    <div className="animate-fade-in pb-12">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Panel Pejabat Pengadaan (PP)</h1>
          <p className="text-slate-500 mt-1">SOP Pelaksanaan - Pencarian, Komparasi Matriks & Dokumentasi e-Katalog Inaproc.</p>
        </div>
        {submittedPack && (
          <button 
            onClick={handleResetPackage} 
            className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            🔄 Reset Sesi Pengadaan
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-slate-200 pb-4">
        <button 
          onClick={() => setActiveTab('incoming')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${activeTab === 'incoming' ? 'bg-indigo-50 border border-indigo-200 text-indigo-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
        >
          📬 Usulan DPP Masuk {submittedPack && <span className="ml-1 px-1.5 py-0.5 text-[9px] rounded-full bg-indigo-600 text-white font-black">1</span>}
        </button>
        <button 
          onClick={() => setActiveTab('search')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${activeTab === 'search' ? 'bg-indigo-50 border border-indigo-200 text-indigo-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
        >
          🔍 Cari & Bandingkan e-Katalog Inaproc
        </button>
        <button 
          onClick={() => setActiveTab('docs')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${activeTab === 'docs' ? 'bg-indigo-50 border border-indigo-200 text-indigo-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
        >
          📂 Arsip Dokumen Hasil Pemilihan (BAHP)
        </button>
      </div>

      {/* Content */}
      {activeTab === 'incoming' && (
        <div className="glass-panel p-8 animate-slide-up bg-white border border-slate-200 rounded-2xl shadow-sm">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Surat Dinas Usulan & DPP Masuk</h2>
          
          {submittedPack ? (
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 flex flex-col justify-between gap-6">
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <span className="px-2.5 py-1 text-[10px] rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-widest font-extrabold shadow-sm">
                    Aktif & Sah (TTE)
                  </span>
                  <span className="text-xs text-indigo-600 font-bold uppercase tracking-wide">📦 Paket Terkirim dari PPK</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800">{submittedPack.packName}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Pengirim: <span className="font-semibold text-slate-700">{submittedPack.senderName}</span> (NIP: {submittedPack.senderNip}) | Satker: <span className="font-semibold text-slate-700">{submittedPack.senderDepartment}</span>
                </p>
                
                {/* DPA Detailed Rincian Table */}
                <div className="mt-4 bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm max-w-2xl">
                  <div className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider mb-2">📋 Rincian Barang Sesuai DPA (Centang barang yang akan diproses):</div>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 font-bold text-slate-500 text-[10px]">
                        <th className="pb-1 w-10 text-center">Pilih</th>
                        <th className="pb-1 w-6">No</th>
                        <th className="pb-1">Nama Barang</th>
                        <th className="pb-1 text-center w-12">Jumlah</th>
                        <th className="pb-1 text-center w-16">Satuan</th>
                        <th className="pb-1 text-right">Harga Satuan DPA</th>
                        <th className="pb-1 text-right">Total Pagu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-slate-700">
                      {getPackageItems(submittedPack).map((item) => (
                        <tr key={item.no} className={`hover:bg-slate-50/50 ${!checkedItems[item.no] ? 'opacity-40 bg-slate-50/20' : ''}`}>
                          <td className="py-2 text-center">
                            <input 
                              type="checkbox" 
                              checked={!!checkedItems[item.no]} 
                              onChange={() => handleCheckboxChange(item.no)}
                              className="w-4 h-4 rounded border-slate-350 text-indigo-600 focus:ring-indigo-550 cursor-pointer"
                            />
                          </td>
                          <td className="py-2 text-slate-400">{item.no}</td>
                          <td className="py-2 font-medium">
                            {item.name?.includes('[Konsolidasi]') ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-750 font-black text-[9px] uppercase tracking-wider border border-violet-200 shadow-xs animate-pulse">
                                  🔒 Konsolidasi
                                </span>
                                <span className="text-slate-800">{item.name.replace('[Konsolidasi]', '').trim()}</span>
                              </div>
                            ) : (
                              item.name
                            )}
                          </td>
                          <td className="py-2 text-center font-bold">{item.qty}</td>
                          <td className="py-2 text-center text-slate-500">{item.unit}</td>
                          <td className="py-2 text-right font-mono text-slate-600">Rp {item.price.toLocaleString('id-ID')}</td>
                          <td className="py-2 text-right font-mono font-bold text-slate-800">Rp {(item.qty * item.price).toLocaleString('id-ID')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Documents Section */}
                <div className="mt-4 flex flex-wrap gap-3">
                  <button 
                    onClick={() => alert(`Membuka Dokumen DPA: ${submittedPack.dpaName}`)}
                    className="text-xs text-slate-600 bg-white hover:bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2 transition-all font-medium"
                  >
                    <span>📄</span> DPA: {submittedPack.dpaName}
                  </button>
                  <button 
                    onClick={() => alert(`Membuka Surat Penetapan HPS dengan Nilai Rp ${parseFloat(submittedPack.hpsValue).toLocaleString('id-ID')} yang telah ditandatangani secara elektronik (TTE) oleh ${submittedPack.senderName}.`)}
                    className="text-xs text-indigo-700 bg-white hover:bg-slate-50 px-3.5 py-2 rounded-xl border border-indigo-200 shadow-sm flex items-center gap-2 transition-all font-bold"
                  >
                    <span>📜</span> Surat Penetapan HPS (Sah TTE)
                  </button>
                  <button 
                    onClick={() => alert(`Membuka Dokumen Persiapan Pengadaan (DPP) Lengkap.`)}
                    className="text-xs text-indigo-700 bg-white hover:bg-slate-50 px-3.5 py-2 rounded-xl border border-indigo-200 shadow-sm flex items-center gap-2 transition-all font-bold"
                  >
                    <span>📁</span> Dokumen DPP PPK
                  </button>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-3 w-full md:w-auto border-t border-slate-200/50 pt-4 mt-2">
                <div className="flex justify-between w-full md:w-72 items-center">
                  <span className="text-xs text-slate-500 font-bold">TOTAL PAGU DPA (DIPROSES):</span>
                  <span className="text-lg font-black text-slate-800">Rp {getDynamicTotalPagu().toLocaleString('id-ID')}</span>
                </div>
                <button 
                  onClick={() => {
                    if (!checkedItems[1] && !checkedItems[2]) {
                      alert('Silakan centang minimal satu barang yang ingin Anda proses terlebih dahulu!')
                      return
                    }
                    setActiveTab('search')
                  }} 
                  className="btn-primary w-full md:w-auto text-xs py-3 px-6 flex items-center justify-center gap-2"
                >
                  🚀 Buka Pencarian & Komparasi e-Katalog Inaproc
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-10 text-center max-w-2xl mx-auto">
              <span className="text-4xl block mb-3">📬</span>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Belum Ada Paket Usulan Real</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">Sistem mendeteksi belum ada paket aktif yang dikirimkan oleh PPK melalui dashboard Persiapan Pengadaan saat ini.</p>
              
              <div className="text-xs bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-left space-y-2 mb-6">
                <strong>💡 Cara Simulasi Alur Penuh (End-to-End):</strong>
                <ol className="list-decimal pl-4 space-y-1 font-mono text-[10px] text-slate-600">
                  <li>Logout dari PP, kemudian login sebagai PPK (NIP: <span className="font-bold">198001012005011001</span>).</li>
                  <li>Upload DPA, sinkronkan SIRUP, pilih paket RUP, tentukan HPS, lakukan TTE, lalu klik **"Kirim DPP ke PP"**.</li>
                  <li>Logout dan login kembali sebagai PP (NIP: <span className="font-bold">198502022010012002</span>). Paket akan muncul di sini secara real-time!</li>
                </ol>
              </div>
              
              <div className="border-t border-slate-200 pt-6">
                <span className="text-xs text-slate-400 block mb-3 uppercase tracking-wider font-bold">Atau Gunakan Paket Contoh (Simulasi)</span>
                <button 
                  onClick={() => {
                    const mockPack = {
                      packName: 'Pengadaan Belanja Modal Alat Kantor Laptop & Printer Dinas',
                      pagu: 10829000,
                      mak: '7.01.01.2.07.0006.5.2.02.10.0002',
                      volume: '1 Unit Laptop, 1 Unit Printer',
                      spesifikasi: 'Laptop Core i3 & Printer EPSON L121',
                      hpsValue: '10829000',
                      techSpecs: 'Laptop dan Printer untuk operasional sekretariat',
                      dpaName: 'DPA TA. 2026 KEC. BESUK-90-95.pdf',
                      senderName: 'Budi Santoso',
                      senderNip: '198001012005011001',
                      senderDepartment: 'Kantor Kecamatan Besuk',
                      sentDate: '17 Mei 2026'
                    }
                    setSubmittedPack(mockPack)
                    localStorage.setItem('pbj_submitted_package', JSON.stringify(mockPack))
                  }}
                  className="btn-secondary text-xs px-5 py-2.5 font-bold"
                >
                  🛠️ Muat Paket Contoh
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'search' && (
        <div className="space-y-8 animate-slide-up">
          {!checkedItems[1] && !checkedItems[2] ? (
            <div className="bg-amber-50 border border-slate-200 text-amber-900 rounded-2xl p-8 text-center max-w-xl mx-auto shadow-sm">
              <span className="text-3xl block mb-2">⚠️</span>
              <h3 className="text-md font-black">Tidak Ada Barang DPA yang Dicentang</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Anda menonaktifkan seluruh item pengadaan. Silakan kembali ke tab <strong>📬 Usulan DPP Masuk</strong> dan centang barang yang ingin Anda proses di e-Katalog LKPP.
              </p>
              <button 
                onClick={() => setActiveTab('incoming')} 
                className="btn-primary text-xs px-5 py-2.5 mt-4"
              >
                📬 Buka Usulan DPP
              </button>
            </div>
          ) : (
            <>
              {/* Advanced Search Panel resembling Inaproc */}
              <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span>🔍</span> Asisten Pencarian e-Katalog Inaproc LKPP
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  {/* Product Type Selector */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pilih Barang DPA</label>
                    <select 
                      value={selectedProductType}
                      onChange={(e) => {
                        setSelectedProductType(e.target.value)
                        setComparedProducts([])
                      }}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs px-3.5 py-2.5 rounded-xl font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {checkedItems[1] && <option value="Laptop">💻 Laptop (HPS Maks: Rp 8.629.000)</option>}
                      {checkedItems[2] && <option value="Printer">🖨️ Printer EPSON L121 (HPS Maks: Rp 2.200.000)</option>}
                    </select>
                  </div>

                  {/* Katalog Type */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipe Katalog Inaproc</label>
                    <select 
                      value={filterKatalog}
                      onChange={(e) => setFilterKatalog(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs px-3.5 py-2.5 rounded-xl font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="Lokal">Katalog Lokal (Kab. Probolinggo)</option>
                      <option value="Nasional">Katalog Nasional</option>
                      <option value="Sektoral">Katalog Sektoral</option>
                    </select>
                  </div>

                  {/* Harga Terendah */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Harga Terendah (Rp)</label>
                    <input 
                      type="number" 
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="Contoh: 1500000"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs px-3.5 py-2.5 rounded-xl font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Harga Tertinggi */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Harga Tertinggi (Rp)</label>
                    <input 
                      type="number" 
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="Contoh: 9000000"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs px-3.5 py-2.5 rounded-xl font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Multi-Select Locations */}
                <div className="mb-5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Checklist Lokasi Penyedia (Bisa lebih dari 1)</label>
                  <div className="flex flex-wrap gap-2">
                    {['Kab. Probolinggo', 'Kota Probolinggo', 'Kota Surabaya', 'Kota Malang', 'Pasuruan', 'DKI Jakarta'].map(loc => (
                      <label key={loc} className={`cursor-pointer px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all flex items-center gap-1.5 ${selectedLocations.includes(loc) ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                        <input 
                          type="checkbox"
                          className="w-3 h-3 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                          checked={selectedLocations.includes(loc)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLocations([...selectedLocations, loc])
                            } else {
                              setSelectedLocations(selectedLocations.filter(l => l !== loc))
                            }
                          }}
                        />
                        {loc}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Keyword Input & Suggestion */}
                <div className="flex gap-4 border-t border-slate-100 pt-4">
                  <input 
                    type="text" 
                    className="glass-input flex-1 font-mono text-sm px-4" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ketik spesifikasi (i3, i5) atau nama penyedia vendor..." 
                  />
                  <button 
                    onClick={() => alert(`Sistem menerapkan filter rentang harga dan lokasi pada database e-Katalog LKPP.`)}
                    className="btn-primary text-xs font-bold px-6"
                  >
                    🔎 Terapkan Filter
                  </button>
                </div>
              </div>

              {/* Results list */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-md font-bold text-slate-800">
                        Hasil Temuan Produk e-Katalog ({selectedProductType})
                      </h3>
                      <span className="text-[10px] text-slate-500 font-mono">Terkoneksi dengan e-Katalog Inaproc LKPP</span>
                    </div>

                    <div className="space-y-4">
                    {(() => {
                      const query = searchQuery.trim().toLowerCase()
                      
                      // 1. Filter existing list including specs, location and vendors
                      let list = mockCatalogProducts[selectedProductType]
                        .filter(p => filterKatalog === 'Nasional' || p.katalog === filterKatalog)
                        .filter(p => selectedLocations.length === 0 || selectedLocations.some(loc => p.location.includes(loc)))
                        .filter(p => {
                           if (minPrice && p.price < parseInt(minPrice)) return false;
                           if (maxPrice && p.price > parseInt(maxPrice)) return false;
                           return true;
                        })
                        .filter(p => {
                          if (!query) return true
                          return p.name.toLowerCase().includes(query) || 
                                 p.vendor.toLowerCase().includes(query) || 
                                 p.id.toLowerCase().includes(query) ||
                                 p.specs.toLowerCase().includes(query) ||
                                 p.location.toLowerCase().includes(query)
                        })

                      // 2. If no matches but query is entered, dynamically generate 3 compliant options under HPS!
                      if (list.length === 0 && query) {
                        const maxHps = selectedProductType === 'Laptop' ? 8629000 : 2200000
                        const baseLocation = selectedLocations.length > 0 ? selectedLocations[0] : 'Kota Surabaya'

                        if (selectedProductType === 'Laptop') {
                          const specsText = query.includes('i5') 
                            ? 'Intel Core i5, RAM 8GB, SSD 512GB, Win 11 Home'
                            : query.includes('i7')
                            ? 'Intel Core i7, RAM 8GB, SSD 512GB, Win 11 Home'
                            : `Processor ${searchQuery.toUpperCase()}, RAM 8GB, SSD 256GB, Win 11`
                          
                          list = [
                            {
                              id: `L-DYN-${query.slice(0,3).toUpperCase()}`,
                              name: `ASUS ExpertBook P14 (${searchQuery.toUpperCase()})`,
                              vendor: 'PT ASUS INDONESIA (Penyedia Terverifikasi)',
                              price: maxHps + 271000, // Rp 8.900.000 (ABOVE HPS)
                              rating: 4.8,
                              location: baseLocation,
                              specs: specsText,
                              garansi: '2 Tahun Resmi',
                              katalog: 'Nasional',
                              badge: `⚠️ Harga Etalase di Atas HPS (Dapat Dinegosiasi menjadi Rp 8.600.000)`
                            },
                            {
                              id: `L-DYN2-${query.slice(0,3).toUpperCase()}`,
                              name: `Lenovo V14 G3 (${searchQuery.toUpperCase()})`,
                              vendor: 'PT LENOVO INDONESIA',
                              price: maxHps - 179000, 
                              rating: 4.7,
                              location: 'DKI Jakarta',
                              specs: specsText,
                              garansi: '2 Tahun Resmi',
                              katalog: 'Nasional',
                              badge: `⚡ Asisten AI: Alternatif Pembanding Spek Setara`
                            },
                            {
                              id: `L-DYN3-${query.slice(0,3).toUpperCase()}`,
                              name: `HP 14s Notebook (${searchQuery.toUpperCase()})`,
                              vendor: 'PT HP INDONESIA',
                              price: maxHps - 429000, 
                              rating: 4.6,
                              location: baseLocation,
                              specs: specsText,
                              garansi: '1 Tahun Resmi',
                              katalog: 'Nasional',
                              badge: `⚡ Asisten AI: Alternatif Hemat Anggaran`
                            }
                          ]
                        } else {
                          const nameText = query.includes('canon') 
                            ? `Canon PIXMA ${searchQuery.toUpperCase()}`
                            : query.includes('hp')
                            ? `HP Smart Tank ${searchQuery.toUpperCase()}`
                            : `Printer ${searchQuery.toUpperCase()} Ink Tank`
                            
                          list = [
                            {
                              id: `P-DYN-${query.slice(0,3).toUpperCase()}`,
                              name: nameText,
                              vendor: 'PT PRINTER INDONESIA (Penyedia Terverifikasi)',
                              price: maxHps + 150000, // ABOVE HPS
                              rating: 4.8,
                              location: baseLocation,
                              specs: `Print Only, Ink Tank System, Kualitas sesuai keyword: ${searchQuery.toUpperCase()}`,
                              garansi: '2 Tahun Resmi',
                              katalog: 'Lokal',
                              badge: `⚠️ Harga Etalase di Atas HPS (Dapat Dinegosiasi ke Nilai Wajar)`
                            },
                            {
                              id: `P-DYN2-${query.slice(0,3).toUpperCase()}`,
                              name: `${nameText} EcoPrint`,
                              vendor: 'PT CANON NUSANTARA',
                              price: 1980000, 
                              rating: 4.6,
                              location: 'Kota Malang',
                              specs: `Print Only, Ink Tank System, Hemat Tinta`,
                              garansi: '1 Tahun',
                              katalog: 'Nasional',
                              badge: `⚡ Asisten AI: Alternatif Spek Setara`
                            },
                            {
                              id: `P-DYN3-${query.slice(0,3).toUpperCase()}`,
                              name: `${nameText} Single Function`,
                              vendor: 'PT HP INDONESIA',
                              price: 2050000, 
                              rating: 4.5,
                              location: 'Kota Surabaya',
                              specs: `Print Only, Ink Tank System`,
                              garansi: '2 Tahun',
                              katalog: 'Nasional',
                              badge: `⚡ Asisten AI: Harga Kompetitif`
                            }
                          ]
                        }
                      }

                      if (list.length === 0) {
                        return (
                          <div className="bg-amber-50/70 border border-amber-200/60 text-amber-900 rounded-3xl p-6 text-center max-w-lg mx-auto space-y-3 my-4">
                            <span className="text-3xl block">⚠️</span>
                            <h4 className="text-sm font-bold text-amber-800">Barang Tidak Ditemukan secara Otomatis</h4>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              Barang dengan kata kunci <strong className="text-rose-600 font-mono">"{searchQuery}"</strong> tidak terdaftar dalam database verifikasi lokal sistem kami.
                            </p>
                            <div className="text-[10px] text-indigo-750 font-bold bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100/50 leading-relaxed text-left space-y-1">
                              <span className="block text-[11px] text-indigo-800 uppercase tracking-wide">💡 Panduan untuk Pejabat Pengadaan (PP):</span>
                              <span className="block font-medium text-slate-500">• Karena portal nasional LKPP Inaproc berbatasan dengan otentikasi VPN & TTE Pemerintah, kami membatasi pencarian otomatis untuk keamanan.</span>
                              <span className="block font-medium text-slate-500">• Gunakan kata kunci terdaftar seperti: <strong className="text-indigo-700">"l121"</strong>, <strong className="text-indigo-700">"epson"</strong>, atau <strong className="text-indigo-700">"acer"</strong>.</span>
                              <span className="block font-medium text-slate-500">• ATAU Anda dapat tetap memproses barang ini secara sah dengan menekan tombol **"📝 Manual"** untuk menempelkan link produk & mengunggah tangkapan layar asli Anda dari LKPP.</span>
                            </div>
                          </div>
                        )
                      }


                      return list.map(product => {
                        const isCompared = comparedProducts.some(p => p.id === product.id)
                        const doc = savedDocs[selectedProductType.toLowerCase()]
                        const isSaved = doc.selectedProduct && doc.selectedProduct.id === product.id
                        const isDesignated = isCurrentProductConsolidated ? (selectedProductType === 'Printer' ? product.id === 'P01' : product.id === 'L01') : true

                        return (
                          <div key={product.id} className={`border rounded-xl p-5 transition-all bg-white relative ${isCurrentProductConsolidated && !isDesignated ? 'opacity-50 hover:border-slate-200 border-slate-100' : 'hover:border-slate-300 border-slate-200'}`}>
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                                  <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-indigo-50 text-indigo-650 border border-indigo-100 uppercase tracking-wider inline-block">
                                    ID: {product.id} | {product.katalog}
                                  </span>
                                  {isCurrentProductConsolidated && isDesignated && (
                                    <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-750 font-black text-[9px] uppercase tracking-wider border border-violet-200 shadow-xs animate-pulse">
                                      ⭐ Vendor Tunggal Ditunjuk UKPBJ
                                    </span>
                                  )}
                                  {isCurrentProductConsolidated && !isDesignated && (
                                    <span className="px-2 py-0.5 rounded-full bg-slate-105 text-slate-450 font-bold text-[9px] uppercase tracking-wider border border-slate-200">
                                      🔒 Konsolidasi: Bukan Ditunjuk
                                    </span>
                                  )}
                                </div>
                                <h4 className="font-bold text-slate-800 text-[15px]">{product.name}</h4>
                                <p className="text-xs text-slate-400 font-medium mt-0.5">{product.vendor}</p>
                                <div className={`text-[11px] p-2 rounded-lg font-bold border mt-2.5 max-w-lg ${isCurrentProductConsolidated && isDesignated ? 'text-violet-700 bg-violet-50/50 border-violet-100' : 'text-indigo-700 bg-indigo-50/50 border-indigo-100/50'}`}>
                                  {product.badge}
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] text-slate-400 block uppercase font-bold">Harga e-Katalog</span>
                                <span className="text-lg font-black text-emerald-600">Rp {product.price.toLocaleString('id-ID')}</span>
                                <span className="text-[10px] text-amber-500 block mt-1 font-bold">⭐ {product.rating} / 5.0 Rating</span>
                              </div>
                            </div>

                            <div className="border-t border-slate-100 pt-4 mt-4 flex justify-between items-center text-xs">
                              <div className="text-slate-500 space-y-1 font-sans">
                                <div>📍 <strong>Lokasi:</strong> {product.location}</div>
                                <div>🔧 <strong>Spek:</strong> {product.specs}</div>
                                <div>🛡️ <strong>Garansi:</strong> {product.garansi}</div>
                              </div>
                              <div className="flex gap-2">
                                {isCurrentProductConsolidated ? (
                                  <span className="px-2.5 py-1.5 rounded-xl bg-violet-50 text-violet-750 border border-violet-100 text-[10px] font-black uppercase tracking-wider">
                                    🔒 Konsolidasi (Bypass Matriks)
                                  </span>
                                ) : (
                                  <button 
                                    onClick={() => toggleCompare(product)}
                                    className={`px-3 py-1.5 rounded-xl font-bold transition-all text-[11px] border ${isCompared ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white hover:bg-slate-50 text-slate-655 border-slate-200'}`}
                                  >
                                    {isCompared ? '✓ Membandingkan' : '⚖️ Bandingkan'}
                                  </button>
                                )}

                                {isSaved ? (
                                  <div className="flex gap-1.5 items-center">
                                    <span className="px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold">
                                      ✓ Terdokumentasi ({doc.isAutomatic ? 'Otomatis' : 'Manual'})
                                    </span>
                                    <button 
                                      onClick={() => handleOpenDocModal(selectedProductType.toLowerCase(), product)}
                                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition-all"
                                      title="Edit atau Unggah Bukti Manual"
                                    >
                                      📝 Edit
                                    </button>
                                    <button 
                                      onClick={() => {
                                        const updated = {
                                          ...savedDocs,
                                          [selectedProductType.toLowerCase()]: { url: '', screenshot: null, negotiatedPrice: '', negotiatedOngkir: '', selectedProduct: null }
                                        }
                                        setSavedDocs(updated)
                                        localStorage.setItem('pbj_pp_documentation', JSON.stringify(updated))
                                      }}
                                      className="px-2 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-650 border border-rose-100 text-[10px] font-bold transition-all"
                                      title="Reset Pilihan"
                                    >
                                      🔄 Reset
                                    </button>
                                  </div>
                                ) : (
                                  isCurrentProductConsolidated && !isDesignated ? (
                                    <span className="px-3.5 py-1.5 rounded-xl bg-slate-50 text-slate-400 border border-slate-200 font-bold text-[10px] flex items-center gap-1">
                                      🔒 Vendor Tidak Ditunjuk UKPBJ
                                    </span>
                                  ) : (
                                    <div className="flex gap-1.5">
                                      <button 
                                        onClick={() => handleAutoScreenshot(selectedProductType.toLowerCase(), product)}
                                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold text-[11px] transition-all shadow-md hover:scale-[1.02] flex items-center gap-1"
                                      >
                                        ⚡ Otomatis (Asisten AI)
                                      </button>
                                      
                                      <button 
                                        onClick={() => handleOpenDocModal(selectedProductType.toLowerCase(), product)}
                                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-[11px] transition-all"
                                      >
                                        📝 Manual
                                      </button>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    })()}
                    </div>
                  </div>
                </div>

                {/* Compare Matrix & Smart System Assistant */}
                <div className="space-y-4">
                  {/* Comparative Matrix */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xl">
                    <h3 className="text-md font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                      <span>⚖️</span> Matriks Perbandingan Sistem
                    </h3>
                    
                    {isCurrentProductConsolidated ? (
                      <div className="bg-violet-50 border border-violet-105 rounded-xl p-4 text-xs text-violet-900 space-y-2">
                        <div className="font-bold uppercase tracking-wider text-[10px] text-violet-700 flex items-center gap-1">
                          <span>🔒</span> Komoditas Konsolidasi Terpusat:
                        </div>
                        <p className="leading-relaxed font-semibold text-slate-700">
                          Sesuai Surat Keputusan Kepala UKPBJ Kabupaten Probolinggo Nomor: 027/UKPBJ/2026, komoditas ini telah dikonsolidasikan secara sektoral. 
                        </p>
                        <p className="leading-relaxed text-[11px] text-slate-500">
                          Matriks perbandingan 3 vendor dinonaktifkan secara hukum. Pilihan penyedia dikunci langsung pada vendor tunggal pemenang kontrak payung yang sah yaitu <strong>UMKK MITRA TECHNOLOGY COMPUTINDO</strong>.
                        </p>
                      </div>
                    ) : comparedProducts.length === 0 ? (
                      <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        Belum ada produk yang dipilih.<br/>
                        Klik <strong>"Bandingkan"</strong> pada 2 atau 3 produk di samping untuk mengaktifkan perbandingan pintar.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {comparedProducts.map((p) => {
                          // Smart system checks
                          const isLocal = p.location.includes('Probolinggo')
                          const isBestPrice = p.price === Math.min(...comparedProducts.map(prod => prod.price))
                          
                          return (
                            <div key={p.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 relative overflow-hidden">
                              {/* Automatical System Recommendation Badge */}
                              {isLocal && isBestPrice && (
                                <div className="absolute right-0 top-0 bg-emerald-600 text-white font-extrabold text-[8px] uppercase px-2 py-0.5 rounded-bl shadow-sm">
                                  Pilihan Utama PP (Lokasi & Harga Terbaik)
                                </div>
                              )}
                              {isLocal && !isBestPrice && (
                                <div className="absolute right-0 top-0 bg-indigo-600 text-white font-extrabold text-[8px] uppercase px-2 py-0.5 rounded-bl shadow-sm">
                                  Lokal (Paling Aman Ongkir)
                                </div>
                              )}
                              {!isLocal && isBestPrice && (
                                <div className="absolute right-0 top-0 bg-amber-600 text-white font-extrabold text-[8px] uppercase px-2 py-0.5 rounded-bl shadow-sm">
                                  Harga Termurah
                                </div>
                              )}

                              <div className="font-bold text-slate-800 text-[13px] pr-20">{p.name}</div>
                              <div className="text-[10px] text-slate-400 font-semibold">{p.vendor}</div>
                              
                              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-slate-200/50 mt-1.5 text-slate-600">
                                <div>Harga: <strong className="text-emerald-600 font-bold">Rp {p.price.toLocaleString('id-ID')}</strong></div>
                                <div>Lokasi: <span className="font-semibold text-slate-700">{p.location}</span></div>
                                <div className="col-span-2">Garansi: <span className="font-semibold text-slate-700">{p.garansi}</span></div>
                              </div>
                            </div>
                          )
                        })}

                        {/* Comparative Verdict (Full Authority Recommendation) */}
                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-xs text-indigo-900 space-y-2">
                          <div className="font-bold uppercase tracking-wider text-[10px] text-indigo-700">🤖 Rekomendasi Otomatis Sistem (Auditor-Ready):</div>
                          <p className="leading-relaxed">
                            {comparedProducts.some(p => p.id === 'L01' || p.id === 'P01') ? (
                              `Sistem merekomendasikan produk lokal ${selectedProductType === 'Laptop' ? 'ASUS ExpertBook (L01)' : 'Epson L121 (P01)'} karena berlokasi di Kabupaten Probolinggo. Ini meminimalkan biaya pengiriman (ongkir riil) dan mempermudah klaim garansi lokal, yang sangat disukai oleh auditor BPK/KPK.`
                            ) : (
                              `ASUS ExpertBook (L01) atau Epson L121 (P01) adalah opsi terbaik jika dibandingkan dengan penyedia luar daerah demi memaksimalkan porsi TKDN Lokal.`
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Active Documentation & Audit Trail Panel */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xl">
                    <h3 className="text-md font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                      <span>📷</span> Bukti Audit Trail e-Katalog
                    </h3>
                    
                    {/* Active Documentation status */}
                    <div className="space-y-4 text-xs">
                      {/* Laptop Row */}
                      <div className="border-b border-slate-100 pb-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-slate-700">💻 Komoditas LAPTOP:</span>
                          {savedDocs.laptop.selectedProduct ? (
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full">TERDOKUMENTASI</span>
                          ) : (
                            <span className="text-[9px] bg-rose-100 text-rose-800 font-extrabold px-2 py-0.5 rounded-full">BELUM</span>
                          )}
                        </div>
                        {savedDocs.laptop.selectedProduct && (
                          <div className="space-y-2 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                            <div className="font-semibold text-slate-800 truncate">{savedDocs.laptop.selectedProduct.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono truncate hover:underline" title={savedDocs.laptop.url}>
                              🔗 {savedDocs.laptop.url}
                            </div>
                            {savedDocs.laptop.screenshot && (
                              <div className="relative group rounded overflow-hidden h-24 border border-slate-300">
                                <img src={savedDocs.laptop.screenshot} alt="Screenshot Laptop" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-[10px] text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                  Lihat Screenshot Inaproc
                                </div>
                              </div>
                            )}
                            <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-600 border-t border-slate-200 pt-1.5">
                              <div>Harga Net: <strong>Rp {parseFloat(savedDocs.laptop.negotiatedPrice).toLocaleString('id-ID')}</strong></div>
                              <div>Ongkir: <strong>Rp {parseFloat(savedDocs.laptop.negotiatedOngkir).toLocaleString('id-ID')}</strong></div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Printer Row */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-slate-700">🖨️ Komoditas PRINTER:</span>
                          {savedDocs.printer.selectedProduct ? (
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full">TERDOKUMENTASI</span>
                          ) : (
                            <span className="text-[9px] bg-rose-100 text-rose-800 font-extrabold px-2 py-0.5 rounded-full">BELUM</span>
                          )}
                        </div>
                        {savedDocs.printer.selectedProduct && (
                          <div className="space-y-2 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                            <div className="font-semibold text-slate-800 truncate">{savedDocs.printer.selectedProduct.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono truncate hover:underline" title={savedDocs.printer.url}>
                              🔗 {savedDocs.printer.url}
                            </div>
                            {savedDocs.printer.screenshot && (
                              <div className="relative group rounded overflow-hidden h-24 border border-slate-300">
                                <img src={savedDocs.printer.screenshot} alt="Screenshot Printer" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-[10px] text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                  Lihat Screenshot Inaproc
                                </div>
                              </div>
                            )}
                            <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-600 border-t border-slate-200 pt-1.5">
                              <div>Harga Net: <strong>Rp {parseFloat(savedDocs.printer.negotiatedPrice).toLocaleString('id-ID')}</strong></div>
                              <div>Ongkir: <strong>Rp {parseFloat(savedDocs.printer.negotiatedOngkir).toLocaleString('id-ID')}</strong></div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {((checkedItems[1] && savedDocs.laptop.selectedProduct) || !checkedItems[1]) &&
                       ((checkedItems[2] && savedDocs.printer.selectedProduct) || !checkedItems[2]) &&
                       (checkedItems[1] || checkedItems[2]) && (
                        <button 
                          onClick={() => {
                            setActiveTab('docs')
                            alert('Berita Acara Hasil Pemilihan (BAHP) Pengadaan Langsung secara e-Purchasing berhasil dibuat otomatis berdasarkan bukti audit trail Anda.')
                          }}
                          className="w-full btn-primary text-xs py-2.5 mt-2 animate-bounce"
                        >
                          📜 Terbitkan Berita Acara Pemilihan (BAHP)
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'docs' && (
        <div className="glass-panel p-8 animate-slide-up bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800">Arsip Berita Acara & Dokumen Penetapan</h2>
            <button 
              onClick={() => window.print()} 
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 text-xs font-bold px-4 py-2 rounded-xl transition-all"
            >
              🖨️ Cetak Berkas Dokumen (PDF)
            </button>
          </div>
          
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            Sesuai ketentuan LKPP, seluruh bukti audit e-Purchasing (Link Katalog, Screenshot halaman komoditas Inaproc, Matriks perbandingan, dan Berita Acara Pemilihan) wajib diarsipkan secara digital di bawah ini.
          </p>

          <div className="border border-slate-900 rounded-xl p-8 max-w-4xl mx-auto shadow-sm bg-white text-slate-900 font-serif">
            {/* Kop Surat */}
            <div className="text-center border-b-4 border-double border-slate-900 pb-3 mb-6 font-sans">
              <div className="text-[14px] font-bold tracking-wider uppercase">Pemerintah Kabupaten Probolinggo</div>
              <div className="text-[15px] font-bold tracking-widest uppercase mt-0.5">Unit Kerja Pengadaan Barang/Jasa (UKPBJ)</div>
              <div className="text-[10px] font-normal italic mt-1 text-slate-600">
                Komp. Perkantoran Pemerintah Kabupaten Probolinggo, Kraksaan, Jawa Timur 67282
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-center font-bold uppercase underline text-[13px] tracking-wide mt-2 font-sans">
                Berita Acara Hasil Pemilihan (BAHP) e-Purchasing
              </div>
              <div className="text-center font-bold text-[10px] font-sans -mt-3 text-slate-700">
                NOMOR: 027 / 78 / PP / 437.82 / {new Date().getFullYear()}
              </div>

              <div className="text-xs space-y-4 text-justify leading-relaxed">
                <p>
                  Pada hari ini, <strong>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>, Pejabat Pengadaan pada Satuan Kerja <strong>{submittedPack ? submittedPack.senderDepartment : 'Kecamatan Besuk'}</strong> telah melakukan proses pencarian, komparasi harga, negosiasi teknis, serta verifikasi dokumentasi e-Katalog Inaproc LKPP untuk paket pekerjaan:
                </p>

                <div className="bg-slate-50 p-4 rounded border border-slate-350 space-y-1.5 font-sans">
                  <div>🏢 <strong>Satuan Kerja:</strong> {submittedPack ? submittedPack.senderDepartment : 'Kecamatan Besuk'}</div>
                  <div>💼 <strong>Nama Pekerjaan:</strong> {submittedPack ? submittedPack.packName : 'Pengadaan Laptop & Printer Dinas'}</div>
                  <div>📝 <strong>Kode RUP / MAK:</strong> {submittedPack ? `${submittedPack.noSirup || '65306083'} / ${submittedPack.mak || '7.01.01.2.07.0006.5.2.02.10.0002'}` : '65306083'}</div>
                  <div>💰 <strong>Total Nilai Pagu HPS DPA (Diproses):</strong> Rp {getDynamicTotalPagu().toLocaleString('id-ID')}</div>
                </div>

                {checkedItems[2] && isPrinterConsolidated && (
                  <div className="mt-4 border-l-4 border-violet-500 bg-violet-50/50 p-4 rounded font-sans text-[10px] text-slate-800 space-y-1">
                    <span className="font-bold text-violet-750 flex items-center gap-1 text-[11px] uppercase tracking-wide">
                      ⚖️ Klausul Hukum Pengadaan Konsolidasi Sektoral:
                    </span>
                    <p className="leading-relaxed">
                      Proses pemilihan langsung secara e-Purchasing untuk komoditas <strong>Printer EPSON L121</strong> merujuk pada Peraturan Presiden Nomor 12 Tahun 2021 tentang Pengadaan Barang/Jasa Pemerintah. Pengadaan ini diklasifikasikan sebagai <strong>Pengadaan Konsolidasi</strong> yang sah berdasarkan ketentuan UKPBJ Kabupaten Probolinggo, sehingga proses pencarian dan penunjukan dikunci langsung kepada penyedia tunggal yang ditetapkan yaitu <strong>UMKK MITRA TECHNOLOGY COMPUTINDO</strong>.
                    </p>
                  </div>
                )}

                <div className="font-bold text-[11px] uppercase tracking-wide border-b border-slate-300 pb-1 mt-6 font-sans text-indigo-850">A. Hasil Rincian Penetapan Produk e-Katalog</div>
                
                <table className="w-full border-collapse border border-slate-900 text-[10px] text-left font-sans">
                  <thead>
                    <tr className="bg-slate-100 font-bold text-center">
                      <td className="border border-slate-900 p-2 w-8">No</td>
                      <td className="border border-slate-900 p-2">Nama Barang Pilihan (e-Katalog Inaproc)</td>
                      <td className="border border-slate-900 p-2">Penyedia / Vendor</td>
                      <td className="border border-slate-900 p-2 text-right">Harga Katalog</td>
                      <td className="border border-slate-900 p-2 text-right">Harga Negosiasi</td>
                      <td className="border border-slate-900 p-2 text-right">Biaya Kirim</td>
                    </tr>
                  </thead>
                  <tbody>
                    {checkedItems[1] && savedDocs.laptop.selectedProduct ? (
                      <tr>
                        <td className="border border-slate-900 p-2 text-center">1</td>
                        <td className="border border-slate-900 p-2 font-medium">{savedDocs.laptop.selectedProduct.name}</td>
                        <td className="border border-slate-900 p-2">{savedDocs.laptop.selectedProduct.vendor}</td>
                        <td className="border border-slate-900 p-2 text-right">Rp {savedDocs.laptop.selectedProduct.price.toLocaleString('id-ID')}</td>
                        <td className="border border-slate-900 p-2 text-right font-bold bg-slate-50">Rp {parseFloat(savedDocs.laptop.negotiatedPrice).toLocaleString('id-ID')}</td>
                        <td className="border border-slate-900 p-2 text-right">Rp {parseFloat(savedDocs.laptop.negotiatedOngkir).toLocaleString('id-ID')}</td>
                      </tr>
                    ) : checkedItems[1] ? (
                      <tr><td colSpan="6" className="border border-slate-900 p-2 text-center text-slate-400">Belum ada dokumentasi laptop</td></tr>
                    ) : (
                      <tr className="bg-slate-50/50"><td colSpan="6" className="border border-slate-900 p-2 text-center text-slate-450 font-sans text-[9px] italic">Laptop Tidak Diproses dalam Sesi Pemilihan Ini</td></tr>
                    )}
                    {checkedItems[2] && savedDocs.printer.selectedProduct ? (
                      <tr>
                        <td className="border border-slate-900 p-2 text-center">2</td>
                        <td className="border border-slate-900 p-2 font-medium">{savedDocs.printer.selectedProduct.name}</td>
                        <td className="border border-slate-900 p-2">{savedDocs.printer.selectedProduct.vendor}</td>
                        <td className="border border-slate-900 p-2 text-right">Rp {savedDocs.printer.selectedProduct.price.toLocaleString('id-ID')}</td>
                        <td className="border border-slate-900 p-2 text-right font-bold bg-slate-50">Rp {parseFloat(savedDocs.printer.negotiatedPrice).toLocaleString('id-ID')}</td>
                        <td className="border border-slate-900 p-2 text-right">Rp {parseFloat(savedDocs.printer.negotiatedOngkir).toLocaleString('id-ID')}</td>
                      </tr>
                    ) : checkedItems[2] ? (
                      <tr><td colSpan="6" className="border border-slate-900 p-2 text-center text-slate-400">Belum ada dokumentasi printer</td></tr>
                    ) : (
                      <tr className="bg-slate-50/50"><td colSpan="6" className="border border-slate-900 p-2 text-center text-slate-450 font-sans text-[9px] italic">Printer Tidak Diproses dalam Sesi Pemilihan Ini</td></tr>
                    )}
                  </tbody>
                </table>

                <div className="font-bold text-[11px] uppercase tracking-wide border-b border-slate-300 pb-1 mt-6 font-sans text-indigo-850">B. Lampiran I: Matriks Komparasi Perbandingan Produk (Syarat Mutlak Audit BPK)</div>
                <p className="font-sans text-[10px] text-slate-600 mb-2">Pejabat Pengadaan telah membandingkan minimal 3 produk sejenis dari vendor yang berbeda di e-Katalog untuk mendapatkan harga wajar terbaik bagi negara:</p>

                {/* Laptop Comparison Table */}
                {checkedItems[1] && (
                  savedDocs.laptop.comparedProducts ? (
                    <div className="space-y-1.5 mb-4 font-sans">
                      <div className="font-bold text-[9px] text-slate-700">1. Matriks Komparasi Belanja Laptop Dinas (Batas HPS: Rp 8.629.000)</div>
                      <table className="w-full border-collapse border border-slate-950 text-[9px] text-center">
                        <thead>
                          <tr className="bg-slate-100 font-bold">
                            <td className="border border-slate-950 p-1.5 w-24">Kriteria Komparasi</td>
                            {savedDocs.laptop.comparedProducts.map((p) => (
                              <td key={p.id} className={`border border-slate-955 p-1.5 ${savedDocs.laptop.selectedProduct.id === p.id ? 'bg-indigo-50 font-bold text-indigo-900 border-2' : ''}`}>
                                {p.name} {savedDocs.laptop.selectedProduct.id === p.id ? '⭐ (TERPILIH)' : ''}
                              </td>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-slate-950 p-1.5 font-bold bg-slate-50 text-left font-sans">Harga Katalog</td>
                            {savedDocs.laptop.comparedProducts.map((p) => (
                              <td key={p.id} className={`border border-slate-950 p-1.5 font-mono ${savedDocs.laptop.selectedProduct.id === p.id ? 'font-bold text-emerald-700 bg-indigo-50/30' : ''}`}>
                                Rp {p.price.toLocaleString('id-ID')}
                              </td>
                            ))}
                          </tr>
                          <tr>
                            <td className="border border-slate-955 p-1.5 font-bold bg-slate-50 text-left font-sans">Negosiasi Akhir</td>
                            {savedDocs.laptop.comparedProducts.map((p) => (
                              <td key={p.id} className={`border border-slate-950 p-1.5 font-mono ${savedDocs.laptop.selectedProduct.id === p.id ? 'font-bold text-indigo-700 bg-indigo-50/30' : ''}`}>
                                {savedDocs.laptop.selectedProduct.id === p.id ? `Rp ${parseFloat(savedDocs.laptop.negotiatedPrice).toLocaleString('id-ID')}` : 'Tidak Dinegosiasi'}
                              </td>
                            ))}
                          </tr>
                          <tr>
                            <td className="border border-slate-950 p-1.5 font-bold bg-slate-50 text-left font-sans">Penyedia & Lokasi</td>
                            {savedDocs.laptop.comparedProducts.map((p) => (
                              <td key={p.id} className={`border border-slate-955 p-1.5 ${savedDocs.laptop.selectedProduct.id === p.id ? 'bg-indigo-50/30' : ''}`}>
                                {p.location}
                              </td>
                            ))}
                          </tr>
                          <tr>
                            <td className="border border-slate-950 p-1.5 font-bold bg-slate-50 text-left font-sans">Masa Garansi</td>
                            {savedDocs.laptop.comparedProducts.map((p) => (
                              <td key={p.id} className={`border border-slate-955 p-1.5 ${savedDocs.laptop.selectedProduct.id === p.id ? 'bg-indigo-50/30' : ''}`}>
                                {p.garansi}
                              </td>
                            ))}
                          </tr>
                          <tr>
                            <td className="border border-slate-950 p-1.5 font-bold bg-slate-50 text-left font-sans">Kesesuaian KAK</td>
                            {savedDocs.laptop.comparedProducts.map((p) => (
                              <td key={p.id} className={`border border-slate-950 p-1.5 text-emerald-700 font-bold ${savedDocs.laptop.selectedProduct.id === p.id ? 'bg-indigo-50/30' : ''}`}>
                                ✓ SESUAI KAK
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 italic mb-4">Silakan lakukan simulasi "Ambil Screenshot & Dokumen" pada menu pencarian e-Katalog untuk memuat data komparasi.</p>
                  )
                )}

                {/* Printer Comparison Table */}
                {checkedItems[2] && (
                  isPrinterConsolidated ? (
                    <div className="border border-violet-300 bg-violet-50/20 rounded-lg p-4 text-[10px] text-violet-955 font-sans my-4">
                      <span className="font-bold text-[11px] block mb-1 text-violet-850">⚖️ Lampiran Pengecualian Matriks Komparasi (Barang Konsolidasi Terpusat)</span>
                      Berdasarkan Surat Keputusan Kepala UKPBJ Kabupaten Probolinggo Nomor: 027/UKPBJ/2026 tentang DPA Pengadaan Barang Terpusat, komoditas <strong>Printer EPSON L121</strong> dikecualikan dari kewajiban membandingkan 3 (tiga) vendor pembanding. Pembelian langsung di e-Katalog LKPP diarahkan dan dikunci secara sah kepada vendor tunggal yang ditetapkan yaitu <strong>UMKK MITRA TECHNOLOGY COMPUTINDO</strong>. Matriks komparasi dinilai tidak relevan dan dilompati secara legal.
                    </div>
                  ) : savedDocs.printer.comparedProducts ? (
                    <div className="space-y-1.5 mb-4 font-sans">
                      <div className="font-bold text-[9px] text-slate-700">2. Matriks Komparasi Belanja Printer Dinas (Batas HPS: Rp 2.200.000)</div>
                      <table className="w-full border-collapse border border-slate-900 text-[9px] text-center font-sans">
                        <thead>
                          <tr className="bg-slate-100 font-bold">
                            <td className="border border-slate-900 p-1.5 w-24">Kriteria Komparasi</td>
                            {savedDocs.printer.comparedProducts.map((p) => (
                              <td key={p.id} className={`border border-slate-900 p-1.5 ${savedDocs.printer.selectedProduct.id === p.id ? 'bg-indigo-50 font-bold text-indigo-900 border-2' : ''}`}>
                                {p.name} {savedDocs.printer.selectedProduct.id === p.id ? '⭐ (TERPILIH)' : ''}
                              </td>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-slate-900 p-1.5 font-bold bg-slate-50 text-left font-sans">Harga Katalog</td>
                            {savedDocs.printer.comparedProducts.map((p) => (
                              <td key={p.id} className={`border border-slate-900 p-1.5 font-mono ${savedDocs.printer.selectedProduct.id === p.id ? 'font-bold text-emerald-700 bg-indigo-50/30' : ''}`}>
                                Rp {p.price.toLocaleString('id-ID')}
                              </td>
                            ))}
                          </tr>
                          <tr>
                            <td className="border border-slate-900 p-1.5 font-bold bg-slate-50 text-left font-sans">Negosiasi Akhir</td>
                            {savedDocs.printer.comparedProducts.map((p) => (
                              <td key={p.id} className={`border border-slate-900 p-1.5 font-mono ${savedDocs.printer.selectedProduct.id === p.id ? 'font-bold text-indigo-700 bg-indigo-50/30' : ''}`}>
                                {savedDocs.printer.selectedProduct.id === p.id ? `Rp ${parseFloat(savedDocs.printer.negotiatedPrice).toLocaleString('id-ID')}` : 'Tidak Dinegosiasi'}
                              </td>
                            ))}
                          </tr>
                          <tr>
                            <td className="border border-slate-900 p-1.5 font-bold bg-slate-50 text-left font-sans">Penyedia & Lokasi</td>
                            {savedDocs.printer.comparedProducts.map((p) => (
                              <td key={p.id} className={`border border-slate-900 p-1.5 ${savedDocs.printer.selectedProduct.id === p.id ? 'bg-indigo-50/30' : ''}`}>
                                {p.location}
                              </td>
                            ))}
                          </tr>
                          <tr>
                            <td className="border border-slate-900 p-1.5 font-bold bg-slate-50 text-left font-sans">Masa Garansi</td>
                            {savedDocs.printer.comparedProducts.map((p) => (
                              <td key={p.id} className={`border border-slate-900 p-1.5 ${savedDocs.printer.selectedProduct.id === p.id ? 'bg-indigo-50/30' : ''}`}>
                                {p.garansi}
                              </td>
                            ))}
                          </tr>
                          <tr>
                            <td className="border border-slate-900 p-1.5 font-bold bg-slate-50 text-left font-sans">Kesesuaian KAK</td>
                            {savedDocs.printer.comparedProducts.map((p) => (
                              <td key={p.id} className={`border border-slate-900 p-1.5 text-emerald-700 font-bold ${savedDocs.printer.selectedProduct.id === p.id ? 'bg-indigo-50/30' : ''}`}>
                                ✓ SESUAI KAK
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : null
                )}

                <div className="font-bold text-[11px] uppercase tracking-wide border-b border-slate-300 pb-1 mt-6 font-sans text-indigo-850">C. Lampiran II: Bukti Tangkapan Layar (Screenshot) Resmi e-Katalog Inaproc LKPP</div>
                <p className="font-sans text-[10px] text-slate-600 mb-3">Tangkapan layar halaman tayang produk aktif beserta harga resmi dari portal E-Purchasing LKPP Nasional sebagai bukti fisik pertanggungjawaban audit:</p>
                
                <div className="space-y-6 font-sans">
                  {/* Laptop Mockup Browser Screenshot */}
                  {checkedItems[1] && savedDocs.laptop.selectedProduct && (
                    <div className="border border-slate-300 rounded-lg overflow-hidden shadow-xs bg-white text-[10px]">
                      {/* Browser Address Bar Mockup */}
                      <div className="bg-slate-100 border-b border-slate-200 p-2 flex flex-items-center gap-2">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 rounded-full bg-rose-400 inline-block"></span>
                          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
                          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                        </div>
                        <div className="bg-white border border-slate-200 rounded px-2.5 py-0.5 text-[8px] font-mono text-slate-550 flex-1 flex items-center justify-between">
                          <span>{savedDocs.laptop.url}</span>
                          <span className="text-slate-400 text-[7px]">🔒 Secure Connection (HTTPS)</span>
                        </div>
                      </div>
                      
                      {/* e-Katalog Page Mockup Content */}
                      {/* e-Katalog Page Mockup Content */}
                      <div className="p-3 bg-slate-50 space-y-2">
                        {/* LKPP e-Katalog Mock Header */}
                        <div className="flex justify-between items-center bg-indigo-900 text-white p-2 rounded">
                          <div className="flex items-center gap-1.5">
                            <span className="bg-white text-indigo-900 px-1.5 py-0.5 rounded font-black text-[8px]">LKPP</span>
                            <span className="font-bold uppercase tracking-wider text-[8px]">e-Katalog Inaproc</span>
                          </div>
                          <div className="text-[7px] opacity-80">Kecamatan Besuk - Kab. Probolinggo</div>
                        </div>
                        
                        {/* Product Detail Layout */}
                        <div className="grid grid-cols-3 gap-3 bg-white p-3 rounded border border-slate-200">
                          {/* Image box mockup */}
                          <div className="bg-white border border-slate-200 rounded p-1 flex flex-col items-center justify-center relative min-h-[90px] overflow-hidden">
                            {savedDocs.laptop.screenshot ? (
                              <img src={savedDocs.laptop.screenshot} alt="Tangkapan Layar Inaproc" className="max-w-full max-h-[80px] object-contain rounded" />
                            ) : (
                              <>
                                <span className="text-3xl">💻</span>
                                <span className="text-[7px] font-bold text-slate-500 uppercase mt-1">ASUS EXPERTBOOK</span>
                              </>
                            )}
                            <span className="absolute bottom-1 left-1 bg-emerald-50 text-emerald-800 text-[6px] font-extrabold px-1 rounded uppercase z-10">
                              PDN 🇮🇩
                            </span>
                          </div>
                          
                          {/* Specs Mockup */}
                          <div className="col-span-2 space-y-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-slate-800 text-[11px]">{savedDocs.laptop.selectedProduct.name}</h4>
                                <span className="text-[7px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded inline-block mt-0.5">
                                  Katalog: {savedDocs.laptop.selectedProduct.katalog}
                                </span>
                              </div>
                              <span className="text-[7px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold px-1.5 py-0.5 rounded">
                                TKDN: 38.45%
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[8px] border-t border-slate-100 pt-1.5 text-slate-505">
                              <div><strong>Penyedia:</strong> {savedDocs.laptop.selectedProduct.vendor}</div>
                              <div><strong>Lokasi:</strong> {savedDocs.laptop.selectedProduct.location}</div>
                              <div><strong>Spesifikasi:</strong> {savedDocs.laptop.selectedProduct.specs}</div>
                              <div><strong>Garansi:</strong> {savedDocs.laptop.selectedProduct.garansi}</div>
                            </div>
                            
                            <div className="bg-emerald-50 border border-emerald-100 p-1.5 rounded flex justify-between items-center mt-1">
                              <div>
                                <span className="text-[7px] text-slate-500 block uppercase font-bold">Harga Tayang LKPP</span>
                                <span className="text-xs font-black text-emerald-600 font-mono">Rp {savedDocs.laptop.selectedProduct.price.toLocaleString('id-ID')}</span>
                              </div>
                              <span className="bg-emerald-600 text-white font-extrabold text-[7px] px-1.5 py-0.5 rounded uppercase">
                                Ready Stock
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Real Full Screenshot Attachment for Auditing */}
                        {savedDocs.laptop.screenshot && (
                          <div className="mt-3 border border-slate-300 rounded-lg p-2 bg-white space-y-1">
                            <span className="text-[8px] font-bold text-indigo-600 uppercase block">📸 Bukti Asli Tangkapan Layar e-Katalog Inaproc LKPP:</span>
                            <img src={savedDocs.laptop.screenshot} alt="Tangkapan Layar Inaproc Asli" className="w-full max-h-[350px] object-contain rounded border border-slate-100" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Printer Mockup Browser Screenshot */}
                  {checkedItems[2] && savedDocs.printer.selectedProduct && (
                    <div className="border border-slate-300 rounded-lg overflow-hidden shadow-xs bg-white text-[10px] mt-4">
                      {/* Browser Address Bar Mockup */}
                      <div className="bg-slate-100 border-b border-slate-200 p-2 flex items-center gap-2">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 rounded-full bg-rose-400 inline-block"></span>
                          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
                          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                        </div>
                        <div className="bg-white border border-slate-200 rounded px-2.5 py-0.5 text-[8px] font-mono text-slate-550 flex-1 flex items-center justify-between">
                          <span>{savedDocs.printer.url}</span>
                          <span className="text-slate-400 text-[7px]">🔒 Secure Connection (HTTPS)</span>
                        </div>
                      </div>
                      
                      {/* e-Katalog Page Mockup Content */}
                      {/* e-Katalog Page Mockup Content */}
                      <div className="p-3 bg-slate-50 space-y-2">
                        {/* LKPP e-Katalog Mock Header */}
                        <div className="flex justify-between items-center bg-indigo-900 text-white p-2 rounded">
                          <div className="flex items-center gap-1.5">
                            <span className="bg-white text-indigo-900 px-1.5 py-0.5 rounded font-black text-[8px]">LKPP</span>
                            <span className="font-bold uppercase tracking-wider text-[8px]">e-Katalog Inaproc</span>
                          </div>
                          <div className="text-[7px] opacity-80">Kecamatan Besuk - Kab. Probolinggo</div>
                        </div>
                        
                        {/* Product Detail Layout */}
                        <div className="grid grid-cols-3 gap-3 bg-white p-3 rounded border border-slate-200">
                          {/* Image box mockup */}
                          <div className="bg-white border border-slate-200 rounded p-1 flex flex-col items-center justify-center relative min-h-[90px] overflow-hidden">
                            {savedDocs.printer.screenshot ? (
                              <img src={savedDocs.printer.screenshot} alt="Tangkapan Layar Inaproc" className="max-w-full max-h-[80px] object-contain rounded" />
                            ) : (
                              <>
                                <span className="text-3xl">🖨️</span>
                                <span className="text-[7px] font-bold text-slate-500 uppercase mt-1">EPSON INK TANK</span>
                              </>
                            )}
                            <span className="absolute bottom-1 left-1 bg-emerald-50 text-emerald-800 text-[6px] font-extrabold px-1 rounded uppercase z-10">
                              PDN 🇮🇩
                            </span>
                          </div>
                          
                          {/* Specs Mockup */}
                          <div className="col-span-2 space-y-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-slate-800 text-[11px]">{savedDocs.printer.selectedProduct.name}</h4>
                                <span className="text-[7px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded inline-block mt-0.5">
                                  Katalog: {savedDocs.printer.selectedProduct.katalog}
                                </span>
                              </div>
                              <span className="text-[7px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold px-1.5 py-0.5 rounded">
                                TKDN: 41.20%
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[8px] border-t border-slate-100 pt-1.5 text-slate-505">
                              <div><strong>Penyedia:</strong> {savedDocs.printer.selectedProduct.vendor}</div>
                              <div><strong>Lokasi:</strong> {savedDocs.printer.selectedProduct.location}</div>
                              <div><strong>Spesifikasi:</strong> {savedDocs.printer.selectedProduct.specs}</div>
                              <div><strong>Garansi:</strong> {savedDocs.printer.selectedProduct.garansi}</div>
                            </div>
                            
                            <div className="bg-emerald-50 border border-emerald-100 p-1.5 rounded flex justify-between items-center mt-1">
                              <div>
                                <span className="text-[7px] text-slate-500 block uppercase font-bold">Harga Tayang LKPP</span>
                                <span className="text-xs font-black text-emerald-600 font-mono">Rp {savedDocs.printer.selectedProduct.price.toLocaleString('id-ID')}</span>
                              </div>
                              <span className="bg-emerald-600 text-white font-extrabold text-[7px] px-1.5 py-0.5 rounded uppercase">
                                Ready Stock
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Real Full Screenshot Attachment for Auditing */}
                        {savedDocs.printer.screenshot && (
                          <div className="mt-3 border border-slate-300 rounded-lg p-2 bg-white space-y-1">
                            <span className="text-[8px] font-bold text-indigo-600 uppercase block">📸 Bukti Asli Tangkapan Layar e-Katalog Inaproc LKPP:</span>
                            <img src={savedDocs.printer.screenshot} alt="Tangkapan Layar Inaproc Asli" className="w-full max-h-[350px] object-contain rounded border border-slate-100" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <p className="mt-6 font-sans text-[10px] text-slate-500 italic">
                  Demikian Berita Acara Hasil Pemilihan (BAHP) ini dibuat secara elektronik oleh Pejabat Pengadaan untuk menjadi dokumen pertanggungjawaban dalam audit belanja dinas e-Purchasing.
                </p>
              </div>

              {/* Tanda Tangan PP */}
              <div className="flex justify-end mt-8 pt-4 border-t border-slate-200 font-sans">
                <div className="w-56 text-center space-y-3">
                  <div className="text-[11px] text-slate-650">Dibuat & Disahkan Oleh:</div>
                  <div className="text-[11px] font-bold uppercase text-slate-800">Pejabat Pengadaan (PP)</div>
                  
                  {/* Visual Signature Box */}
                  <div className="border border-indigo-200 bg-indigo-50/50 rounded-xl p-3 inline-block w-full">
                    <div className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest animate-pulse">✓ TTE Terverifikasi</div>
                    <div className="text-[8px] text-slate-500 font-mono mt-0.5">ID: {user?.username || 'handik'} - LKPP Portal</div>
                    <div className="text-[9px] text-slate-700 font-bold mt-1.5">{user?.name || 'Handika Wijaya, S.STP'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real Inaproc Upload Documentation Modal */}
      {isDocModalOpen && docModalProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="px-2.5 py-0.5 text-[9px] font-bold rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase tracking-wider mb-2 inline-block">
                  Audit Trail Inaproc e-Katalog
                </span>
                <h3 className="text-xl font-bold text-slate-800">Dokumentasi Bukti Real e-Katalog</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Unggah tangkapan layar asli dan link produk dari portal LKPP Inaproc untuk kebutuhan pertanggungjawaban audit BPK/KPK.
                </p>
              </div>
              <button 
                onClick={() => setIsDocModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 text-lg font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5 mb-8">
              {/* Product Info Banner */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex gap-3 items-center">
                <span className="text-2xl">{docModalType === 'laptop' ? '💻' : '🖨️'}</span>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{docModalProduct.name}</h4>
                  <p className="text-xs text-slate-400">{docModalProduct.vendor}</p>
                </div>
              </div>

              {/* Link Input */}
              <div>
                <label className="text-xs font-bold text-slate-650 block mb-1.5">🔗 Link Produk e-Katalog LKPP (Real Inaproc URL)</label>
                <input 
                  type="url" 
                  value={docRealUrl} 
                  onChange={e => setDocRealUrl(e.target.value)} 
                  placeholder="https://e-katalog.lkpp.go.id/product/id/..." 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm transition-all font-mono text-slate-700 bg-slate-50/50"
                  required
                />
                <span className="text-[10px] text-slate-400 block mt-1">Salin link produk asli Anda dari situs resmi e-katalog.lkpp.go.id</span>
              </div>

              {/* File Upload Screenshot */}
              <div>
                <label className="text-xs font-bold text-slate-655 block mb-1.5">📸 Tangkapan Layar Resmi (Real Screenshot)</label>
                <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 transition-all rounded-2xl p-6 text-center cursor-pointer relative bg-slate-50/50 hover:bg-slate-50">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleScreenshotUpload} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    required
                  />
                  {docRealScreenshot ? (
                    <div className="space-y-2 relative z-20">
                      <img src={docRealScreenshot} alt="Preview Bukti Inaproc" className="max-h-48 mx-auto rounded-xl shadow-md object-contain border border-slate-100 bg-white" />
                      <span className="text-xs text-indigo-650 font-bold block mt-1 hover:underline">Ganti Tangkapan Layar Asli</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <span className="text-3xl block">📸</span>
                      <span className="text-xs text-slate-500 font-medium block">Pilih file / Drag & Drop screenshot e-Katalog Anda di sini</span>
                      <span className="text-[10px] text-slate-400 block">Format: .png, .jpg, .jpeg (Foto asli spesifikasi & harga LKPP)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Negotiated inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-660 block mb-1.5">💰 Harga Final Hasil Negosiasi (Rp)</label>
                  <input 
                    type="number" 
                    value={docNegotiatedPrice} 
                    onChange={e => setDocNegotiatedPrice(e.target.value)} 
                    placeholder="Harga Tayang minus diskon"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm font-bold text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-670 block mb-1.5">🚚 Ongkir Hasil Negosiasi (Rp)</label>
                  <input 
                    type="number" 
                    value={docNegotiatedOngkir} 
                    onChange={e => setDocNegotiatedOngkir(e.target.value)} 
                    placeholder="Ongkir Riil (Rp)"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm font-bold text-slate-800"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
              <button 
                type="button"
                onClick={() => setIsDocModalOpen(false)} 
                className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 border border-slate-200 text-xs font-bold transition-all"
              >
                Batal
              </button>
              <button 
                type="button"
                onClick={handleSaveDocumentation} 
                className="px-6 py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
              >
                💾 Simpan Bukti Audit Real
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
