import React, { useState, useEffect, Fragment } from 'react'
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
  const [showDppModal, setShowDppModal] = useState(false)
  const [showHpsModal, setShowHpsModal] = useState(false)
  const [showDpaModal, setShowDpaModal] = useState(false)

  const [submittedPack, setSubmittedPack] = useState(() => {
    const saved = localStorage.getItem('pbj_submitted_package')
    if (!saved) return null
    try {
      return JSON.parse(saved)
    } catch (e) {
      return null
    }
  })

  // Sinkronisasi dengan database backend untuk melihat paket yang "Terkirim ke PP"
  useEffect(() => {
    const queryParam = user?.role === 'Admin' ? '' : `?idSatker=${user?.idSatker || ''}`
    fetch(`/api/projects${queryParam}`)
      .then(res => res.json())
      .then(data => {
        const projects = Array.isArray(data) ? data : (data?.data || []);
        const incomingPack = projects.find(p => p.status === 'Terkirim ke PP');
        if (incomingPack) {
          let parsedData 










































































































































  const [activeAnalysisItem, setActiveAnalysisItem] = useState(null);
  const [imgErrors, setImgErrors] = useState({});
  const [useKopSurat, setUseKopSurat] = useState(false);

  const [analysisForms, setAnalysisForms] = useState({});

  const handleOpenAnalysisModal = (item) => {
    if (activeAnalysisItem?.no === item.no) {
      setActiveAnalysisItem(null);
      return;
    }
    setActiveAnalysisItem(item);
    
    if (!analysisForms[item.no]) {
      const existingResult = marketAnalysisData[item.no] || {};
      const basePagu = parseInt(getDynamicTotalPagu()) / (item.qty || 1);
      setAnalysisForms(prev => ({
        ...prev,
        [item.no]: {
          targetVendor: savedDocs[item.name]?.selectedProduct?.vendor || item.vendor || '',
          name: item.name || '',
          minPrice: existingResult.minPrice || Math.floor(basePagu * 0.8),
          maxPrice: existingResult.maxPrice || basePagu,
          link: existingResult.link || '',
          screenshot: existingResult.img || ''
        }
      }));
    }
  };

  const handleBulkAnalysis = async () => {
    const itemsToAnalyze = getPackageItems(submittedPack).filter(item => checkedItems[item.no]);
    if (itemsToAnalyze.length === 0) {
      alert('Tidak ada produk untuk dianalisis.');
      return;
    }

    await Promise.all(itemsToAnalyze.map(async (item) => {
      const form = analysisForms[item.no] |































        location: 'Kec. Kraksaan, Kab. Probolinggo', 
        specs: 'Amplop dinas coklat ukuran 15.5 x 25 cm, isi 100 lembar per pack',
        garansi: 'Resmi',
        katalog: 'Lokal',
        badge: 'Pilihan Lokal Tercepat'
      }
    ],
    Tinta: [
      { 
        id: 'T01', 
        name: 'Tinta Printer Black (setara Epson 001)', 
        vendor: 'UMKK MITRA TECHNOLOGY COMPUTINDO', 
        price: 210000, 
        rating: 4.9, 
        location: 'Kota Probolinggo', 
        specs: 'Tinta hitam 127ml original Epson 001 (PDN)',
        garansi: '2 Tahun Resmi Epson',
        katalog: 'Lokal',
        badge: 'Rekomendasi Utama: Mitra Terpercaya & Harga Terendah'
      },
      { 
        id: 'T02', 
        name: 'Tinta Printer Colour (setara Epson 001 C/M/Y)', 
        vendor: 'CV. MULTI MEDIA PROBOLINGGO UTAMA', 
        price: 125000, 
        rating: 4.8, 
        location: 'Kota Probolinggo', 
        specs: 'Tinta warna original Epson 001 (PDN)',
        garansi: '2 Tahun Resmi',
        katalog: 'Lokal',
        badge: 'Pembanding Lokal Terdekat'
      },
      { 
        id: 'T03', 
        name: 'Paket Tinta Printer Epson 001 (Black + 3 Colour)', 
        vendor: 'UD. KRAKSAAN INDAH COMPUTER', 
        price: 580000, 
        rating: 4.6, 
        location: 'Kec. Kraksaan, Kab. Probolinggo', 
        specs: 'Paket hemat tinta printer Epson 001 lengkap',
        garansi: '1 Tahun',
        katalog: 'Lokal',
        badge: 'Pembanding Lokal: Kapasitas Lengkap'
      }
    ],
    Banner: [
      { 
        id: 'B01', 
        name: 'Cetak Banner Flexy 340g (Plastick lembar)', 
        vendor: 'UD. BESUK CETAK MANDIRI', 
        price: 20000, 

  const handleTakeScreenshot = async (item, doc, currentUrl) => {
    if (!currentUrl) {
      alert('Harap isi Link URL Produk terlebih dahulu sebelum mengambil screenshot.');
      return;
    }
    setSurveyingItemNo(item.no);
    try {
      const response = await fetch('http://localhost:3001/api/survey/screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: currentUrl })
      });

      if (!response.ok) throw new Error('Gagal mengambil screenshot');
      const result = await response.json();
      
      if (result.success) {
        setSavedDocs(prev => ({
          ...prev,
          [item.name]: {
            ...doc,
            url: currentUrl,
            screenshot: result.img
          }
        }));
        setImgErrors(prev => ({...prev, [item.no]: false}));
        alert('✅ Screenshot berhasil diambil dan disimpan!');
      } else {
        alert('Maaf, gagal mengambil screenshot.');












































































































































































































































































































































































































































  const [vendorRatingStatus, setVendorRatingStatus] = useState(() => localStorage.getItem('pbj_vendor_rating_status') || '')

  const saveBAHPField = (key, value) => {
    localStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
  }
  const handleChatUpload = (e) => {
    const files = Array.from(e.target.files)
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setChatCaptures(prev => {
          const next = [...prev, { name: file.name, data: reader.result }]
          saveBAHPField('pbj_chat_captures', next)
          return next
        })
      }
      reader.readAsDataURL(file)
    })
  }

  const handleOpenDocModal = (type, product) => {
    setDocModalType(type)
    setDocModalProduct(product)
    
    // Check if documentation already exists to pre-populate, or set defaults
    const existing = savedDocs[type]
    if (existing && existing.selectedProduct && existing.selectedProduct.id === product.id) {
      setDocRealUrl(existing.url || `https://katalog.lkpp.go.id/search?q=${product.id}`)
      setDocRealScreenshot(existing.screenshot)
      setDocNegotiatedPrice(existing.negotiatedPrice || product.price)
      setDocNegotiatedOngkir(existing.negotiatedOngkir || '150000')
    } else {
      setDocRealUrl(`https://katalog.lkpp.go.id/search?q=${product.id}`)
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
    
    const currentCategoryProducts = getCatalogProducts(docModalType === 'laptop' ? 'Laptop' : 'Printer')
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




























































































































































































































































































































































































































































































































































































































                                  }}
                                />
                              </div>
                            </td>
                            <td className="p-3 text-slate-700 font-bold text-center">
                              {qty}
                            </td>
                            <td className="p-3 font-black text-indigo-700 whitespace-nowrap">
                              Rp {(parseInt(finalPrice) * qty).toLocaleString('id-ID')}
                            </td>
                            <td className="p-3 text-center min-w-[150px]">
                              {isCocok ? (
                                <button 
                                  onClick={() => {
                                    setSavedDocs({
                                      ...savedDocs,
                                      [item.name]: {
                                        ...doc,
                                        url: link,
                                        screenshot: screenshot,
                                        negotiatedPrice: finalPrice,
                                        selectedProduct: {
                                          ...(doc.selectedProduct || item),
                                          vendor: vendor
                                        }
                                      }
                                    });
                                    alert('Data produk disimpan! Harga cocok dengan pilihan PPK.');
                                  }}
                                  className={`px-3 py-1.5 font-bold text-[10px] rounded-lg transition-colors w-ful

















































































































































































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
                            {s









































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
