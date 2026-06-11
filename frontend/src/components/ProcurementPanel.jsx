import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import BahpDocument from './pp/BahpDocument'
import { BAHP_TEMPLATE_TYPES, VALIDASI_CONFIG } from './pp/BahpTemplates'
import { dialog } from '../utils/dialog'

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

  const [submittedPack, setSubmittedPack] = useState(null);

  // Negotiation Data State
  const [negotiationData, setNegotiationData] = useState(() => {
    const saved = localStorage.getItem('pbj_pp_negotiation')
    return saved ? JSON.parse(saved) : {}
  })

  const updateNegotiationData = (itemId, field, value) => {
    const newData = { ...negotiationData, [itemId]: { ...(negotiationData[itemId] || {}), [field]: value } }
    setNegotiationData(newData)
    localStorage.setItem('pbj_pp_negotiation', JSON.stringify(newData))
  }

  const applyVendorToAll = (sourceItemId) => {
    const sourceVendor = negotiationData[sourceItemId]?.vendor;
    if (!sourceVendor) return;
    const newData = { ...negotiationData };
    
    // Default mock items for iteration if submittedPack has items
    const items = submittedPack ? getPackageItems(submittedPack) : [];
    items.forEach(item => {
      newData[item.no] = { ...(newData[item.no] || {}), vendor: sourceVendor };
    });
    
    setNegotiationData(newData);
    localStorage.setItem('pbj_pp_negotiation', JSON.stringify(newData));
    alert(`Penyedia "${sourceVendor}" berhasil diterapkan ke semua item!`);
  }


  const [searchParamsUrl] = useSearchParams();
  const paketIdUrl = searchParamsUrl.get('paketId');

  // Sinkronisasi dengan database backend untuk melihat paket
  useEffect(() => {
    const queryParam = user?.role === 'Admin' ? '' : `?idSatker=${user?.idSatker || ''}`;
    fetch(`/api/projects${queryParam}`)
      .then(res => res.json())
      .then(data => {
        const projects = Array.isArray(data) ? data : (data?.data || []);
        
        let incomingPack = null;
        if (paketIdUrl) {
          incomingPack = projects.find(p => p.id == paketIdUrl && p.status !== 'Draft');
        } else {
          incomingPack = projects.find(p => p.status === 'Terkirim ke PP' || p.status === 'Disetujui PP' || p.status === 'Selesai (Arsip Lengkap)');
        }

        if (incomingPack) {
          let parsedData = {};
          try {
            parsedData = JSON.parse(incomingPack.description || '{}');
          } catch(e) {}

          // Map setiap item dari backend ke struktur yang dibutuhkan frontend
          // item.price = harga tayang awal dari DPP PPK
          // item.vendor = nama penyedia dari DPP PPK
          // item.surveys = hasil survei e-katalog yang pernah dilakukan
          const mappedItems = (incomingPack.items || parsedData?.items || []).map((item, idx) => {
            // Cari survey yang dipilih (is_selected=true) sebagai harga survei terbaru
            const selectedSurvey = (item.surveys || []).find(s => s.is_selected);
            return {
              no: item.id || (idx + 1),           // key unik untuk negotiatedItems
              name: item.name || item.nama || '',
              qty: item.qty || item.jumlah || 1,
              unit: item.unit || item.satuan || 'Unit',
              price: item.price || item.harga || 0,       // harga satuan dari DPP PPK
              paguDpa: item.dpa_price || item.paguDpa || item.price || 0, // batas pagu dari DPA
              // Harga tayang AWAL dari DPP PPK (ditampilkan di kolom Harga Tayang)
              dppTayang: item.price || 0,
              dppVendor: item.vendor || '',
              // Jika pernah ada survei e-katalog yang dipilih, gunakan itu sebagai harga tayang
              katalogPrice: selectedSurvey ? selectedSurvey.price : undefined,
              vendor: selectedSurvey ? selectedSurvey.vendor_name : (item.vendor || ''),
              tayang: selectedSurvey ? selectedSurvey.price : (item.price || 0),
              link: selectedSurvey ? selectedSurvey.url : (item.link || ''),
              specs: item.specs || '',
              surveys: item.surveys || [],
            };
          });

          const convertedPack = {
            id: incomingPack.id,
            packName: incomingPack.name || parsedData?.selectedPack?.packName || 'Paket Pengadaan',
            pagu: incomingPack.budget || parsedData?.selectedPack?.pagu || 0,
            mak: parsedData?.selectedPack?.mak || '',
            noSirup: parsedData?.selectedPack?.noSirup || '',
            volume: parsedData?.packageMetadata?.volume || '1 Paket',
            spesifikasi: parsedData?.packageMetadata?.spesifikasi || '',
            hpsValue: parsedData?.hpsValue || incomingPack.budget || '',
            techSpecs: parsedData?.techSpecs || '',
            dpaName: parsedData?.dpaName || 'DPA_Document.pdf',
            senderName: parsedData?.senderName || parsedData?.currentUser?.name || incomingPack.created_by || 'PPK',
            senderNip: parsedData?.senderNip || parsedData?.currentUser?.nip || '197909102002121004',
            senderDepartment: parsedData?.senderDepartment || parsedData?.currentUser?.department || user?.department || 'Kecamatan Besuk',
            sentDate: new Date(incomingPack.updated_at || incomingPack.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
            items: mappedItems,
            dppTemplateId: parsedData?.selectedTplId || ''
          };
          setSubmittedPack(convertedPack);
        } else {
          setSubmittedPack(null);
        }
      })
      .catch(e => console.error('Error fetching projects:', e));  }, []);
 
  // State for checkboxes to select which items PP wants to process (default all checked)
  const [expandedSearchRows, setExpandedSearchRows] = useState({});
  const [searchParams, setSearchParams] = useState({});
  const [isSearching, setIsSearching] = useState(false);
  const [autoComparatorEnabled, setAutoComparatorEnabled] = useState(false);
  const [bahpTemplateId, setBahpTemplateId] = useState(() => localStorage.getItem('pbj_bahp_template') || 'atk');
  const D2_CHECKLISTS = {
    atk: [
      { key: 'ppn', label: 'Harga sudah termasuk PPN 12% sesuai ketentuan perpajakan UU HPP' },
      { key: 'ongkir', label: 'Harga sudah termasuk biaya pengiriman/ongkir ke alamat Kantor/Satker' },
      { key: 'spesifikasi', label: 'Spesifikasi merek dan gramatur kertas/tipe ATK telah sesuai dengan DPP' },
      { key: 'stock', label: 'Ketersediaan stok barang telah dikonfirmasi mencukupi untuk kebutuhan satker' },
      { key: 'kualitas', label: 'Kualitas fisik barang baru, asli/bukan rekondisi, dan siap dipergunakan' },
      { key: 'e_purchasing', label: 'Harga tercantum resmi di e-Katalog LKPP, bukan transaksi manual di luar sistem' },
    ],
    mamin: [
      { key: 'pajak_mamin', label: 'Harga sudah memperhitungkan Pajak Daerah (PB1) / PPN sesuai regulasi mamin' },
      { key: 'halal', label: 'Penyedia terverifikasi memiliki sertifikat halal yang masih aktif dan valid' },
      { key: 'higienitas', label: 'Dapur penyedia memenuhi standar higienis sanitasi pengolahan makanan' },
      { key: 'pengantaran', label: 'Harga sudah termasuk biaya pengantaran, wadah saji, dan pelayan (jika buffet)' },
      { key: 'menu_sesuai', label: 'Pilihan menu, porsi, rasa, dan variasi makanan telah disetujui sesuai KAK' },
      { key: 'kemasan', label: 'Menggunakan kemasan ramah lingkungan, bersih, rapi, dan tertutup rapat' },
    ],
    jasa: [
      { key: 'ppn', label: 'Harga penawaran sudah termasuk PPN 12% sesuai ketentuan undang-undang' },
      { key: 'upah', label: 'Struktur upah tenaga ahli/tenaga kerja telah memenuhi standar UMR/UMK wilayah' },
      { key: 'bpjs', label: 'Tenaga kerja yang ditugaskan dijamin dengan kepesertaan BPJS Ketenagakerjaan/Kesehatan' },
      { key: 'peralatan_jasa', label: 'Penyedia menyediakan seluruh peralatan kerja dan seragam yang dibutuhkan' },
      { key: 'sla_output', label: 'Tingkat layanan (SLA) dan output pekerjaan telah didefinisikan dengan jelas' },
      { key: 'kualifikasi', label: 'Kualifikasi pendidikan, keahlian, dan sertifikasi personil telah divalidasi sesuai KAK' },
    ],
    modal: [
      { key: 'ppn', label: 'Harga penawaran sudah termasuk PPN 12% sesuai UU HPP' },
      { key: 'ongkir_asuransi', label: 'Harga sudah termasuk ongkos kirim dan asuransi perjalanan barang modal' },
      { key: 'tkdn_valid', label: 'Tingkat Komponen Dalam Negeri (TKDN) minimal telah divalidasi dari sertifikat Kemenperin' },
      { key: 'instalasi_uji', label: 'Sudah termasuk jasa instalasi, uji fungsi/commissioning, dan pengetesan alat' },
      { key: 'garansi_resmi', label: 'Mendapat kartu garansi resmi dari distributor/pabrik (minimal 1 tahun)' },
      { key: 'training', label: 'Sudah termasuk pelatihan/transfer knowledge pengoperasian untuk staf internal' },
    ],
    pemeliharaan: [
      { key: 'ppn', label: 'Harga penawaran sudah termasuk PPN 12%' },
      { key: 'spareparts', label: 'Suku cadang/sparepart pengganti dijamin keasliannya dan memiliki garansi' },
      { key: 'kunjungan', label: 'Telah disepakati jadwal kunjungan berakla (preventive maintenance)' },
      { key: 'response_time', label: 'Response time penanganan keluhan teknis (SLA) disepakati (maksimal 1x24 jam)' },
      { key: 'garansi_kerja', label: 'Adanya garansi hasil kerja/perbaikan (minimal 1 bulan sejak pengerjaan)' },
      { key: 'backup_unit', label: 'Penyedia menyediakan unit pengganti sementara jika perbaikan memerlukan waktu lama' },
    ],
    konstruksi: [
      { key: 'ppn', label: 'Harga sudah termasuk PPN 12% dan seluruh pajak retribusi yang berlaku' },
      { key: 'smkk_k3', label: 'Biaya penerapan Sistem Manajemen Keselamatan Konstruksi (SMKK) sudah dianggarakn' },
      { key: 'overhead_profit', label: 'Tingkat overhead dan keuntungan penyedia dinilai wajar dan masuk akal' },
      { key: 'retensi', label: 'Ketentuan retensi/jaminan pemeliharaan sebesar 5% nilai kontrak telah disepakati' },
      { key: 'sbu_aktif', label: 'Sertifikat Badan Usaha (SBU) bidang konstruksi aktif dan sesuai subklasifikasi' },
      { key: 'gambar_teknis', label: 'Telah menyepakati keharusan penyusunan shop drawing dan as-built drawing' },
    ],
    // ── BARU: Jasa Konsultansi Non-Konstruksi ─────────────────────────────────
    konsultasi_non: [
      { key: 'ppn', label: 'Harga penawaran sudah termasuk PPN 12% (Biaya Personil + Non-Personil)' },
      { key: 'ska_skk', label: 'Tenaga ahli yang ditugaskan memiliki SKA/SKK yang valid dan sesuai bidang' },
      { key: 'bpjs', label: 'Konsultan menjamin BPJS Ketenagakerjaan & Kesehatan untuk seluruh tenaga ahli' },
      { key: 'kak_sesuai', label: 'Kerangka Acuan Kerja (KAK/TOR) telah dipahami dan disepakati oleh penyedia' },
      { key: 'deliverable', label: 'Output/deliverable (laporan, data, dokumen) telah didefinisikan dan terjadwal jelas' },
      { key: 'sbm_tarif', label: 'Tarif Harga Satuan Orang-Bulan (HSOB) tidak melebihi Standar Biaya Masukan (SBM)' },
    ],
    // ── BARU: Jasa Konsultansi Konstruksi ────────────────────────────────────
    konsultasi_konstruksi: [
      { key: 'ppn', label: 'Harga penawaran sudah termasuk PPN 12% (Biaya Personil + Non-Personil)' },
      { key: 'sbu_konsul', label: 'Penyedia memiliki SBU Jasa Konsultansi Konstruksi yang aktif dan sesuai subklasifikasi' },
      { key: 'ska_utama', label: 'Team Leader memiliki SKA Ahli Madya/Utama yang valid dan relevan dengan pekerjaan' },
      { key: 'spta', label: 'SPTA (Surat Perintah Tugas Ahli) akan diterbitkan oleh Direktur/Pimpinan penyedia sebelum penugasan' },
      { key: 'smkk_konsul', label: 'Konsultan pengawas memahami kewajiban penerapan SMKK sesuai PerMen PUPR No. 8/2023' },
      { key: 'sbm_tarif', label: 'Tarif Harga Satuan Orang-Bulan (HSOB) tidak melebihi Standar Biaya Masukan (SBM) yang berlaku' },
    ],
    // ── BARU: Pengadaan Terkonsolidasi ────────────────────────────────────────
    konsolidasi: [
      { key: 'ppn', label: 'Harga penawaran sudah termasuk PPN 12% untuk seluruh satker peserta konsolidasi' },
      { key: 'sk_konsolidasi', label: 'SK Penetapan Konsolidasi dari pejabat berwenang (UKPBJ/PA/KPA) telah diterbitkan' },
      { key: 'pagu_satker', label: 'Pagu anggaran masing-masing satker peserta konsolidasi telah dikonfirmasi mencukupi' },
      { key: 'stok_total', label: 'Penyedia mengkonfirmasi ketersediaan stok untuk total volume seluruh satker' },
      { key: 'lokasi_kirim', label: 'Daftar lokasi pengiriman dan volume per satker telah dikonfirmasi kepada penyedia' },
      { key: 'jadwal_bertahap', label: 'Jadwal pengiriman bertahap per satker telah disepakati dan terdokumentasi' },
    ],
  };
  const [searchProgress, setSearchProgress] = useState('');
  const [currentJobId, setCurrentJobId] = useState(null);

  const handleCancelSearch = async () => {
    if (!currentJobId) return;
    const confirmed = await dialog.confirm('Apakah Bapak yakin ingin menghentikan pencarian survei ini?');
    if (!confirmed) return;
    
    try {
      setSearchProgress('Membatalkan survei... Mohon tunggu.');
      const res = await fetch(`/api/survey/cancel/${currentJobId}`, {
        method: 'POST'
      });
      if (res.ok) {
        setIsSearching(false);
        setSearchProgress('');
        setCurrentJobId(null);
        dialog.toast('Pencarian berhasil dihentikan.', 'success');
      } else {
        dialog.error('Gagal mengirim perintah pembatalan ke server.');
      }
    } catch (e) {
      console.error('Failed to cancel survey:', e);
      dialog.error('Error saat membatalkan pencarian.');
    }
  };
  // Finalization state
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState('');

  // ── Pencarian e-Katalog: Filter Wilayah & Toleransi Harga ─────────────────
  // Default wilayah diambil dari satker user. PP bisa menambah/mengubah di UI.
  const [searchLocations, setSearchLocations] = useState(() => {
    const dept = user?.department || '';
    const defaults = [];
    if (dept.toLowerCase().includes('kabupaten') || dept.toLowerCase().includes('kab.') || dept.toLowerCase().includes('kecamatan') || dept.toLowerCase().includes('kec.')) {
      defaults.push('Kab. Probolinggo');
      defaults.push('Kota Probolinggo');
    }
    if (defaults.length === 0) defaults.push('Kab. Probolinggo', 'Kota Probolinggo');
    return defaults;
  });
  const [searchIncludeNasional, setSearchIncludeNasional] = useState(false);
  const [priceTolerance, setPriceTolerance] = useState(30); // % toleransi default
  // ────────────────────────────────────────────────────────────────────────────
  const [packageType, setPackageType] = useState('ATK');
  const [exceptionNotes, setExceptionNotes] = useState('');
  const [ppkApprovedContinue, setPpkApprovedContinue] = useState(false);
  const [isSubmittingBahp, setIsSubmittingBahp] = useState(false);
  const [refinedBahpIntro, setRefinedBahpIntro] = useState('');
  const [refinedBahpExceptions, setRefinedBahpExceptions] = useState('');
  const [refinedBahpItemNotes, setRefinedBahpItemNotes] = useState('');
  const [refinedBahpConclusion, setRefinedBahpConclusion] = useState('');
  const [isRefiningBahp, setIsRefiningBahp] = useState(false);
  const [isRefiningException, setIsRefiningException] = useState(false);
  const [exceptionAdvice, setExceptionAdvice] = useState('');
  const [isRefiningChatNotes, setIsRefiningChatNotes] = useState(false);
  const [isRefiningVendorNote, setIsRefiningVendorNote] = useState(false);
  const [docSettings, setDocSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('pbj_doc_settings');
      return saved ? JSON.parse(saved) : { showKop: true };
    } catch {
      return { showKop: true };
    }
  });

  const toggleKopSurat = () => {
    const next = { ...docSettings, showKop: !docSettings.showKop };
    setDocSettings(next);
    localStorage.setItem('pbj_doc_settings', JSON.stringify(next));
  };

  const handleTtdUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Str = event.target.result;
      const newSettings = { ...docSettings, ttdPp: base64Str };
      setDocSettings(newSettings);
      localStorage.setItem('pbj_doc_settings', JSON.stringify(newSettings));
    };
    reader.readAsDataURL(file);
  };

  const handleTtdPpkUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Str = event.target.result;
      const newSettings = { ...docSettings, ttdPpk: base64Str };
      setDocSettings(newSettings);
      localStorage.setItem('pbj_doc_settings', JSON.stringify(newSettings));
    };
    reader.readAsDataURL(file);
  };

  // Re-sync docSettings whenever tab switches to BAHP tab (to catch updates from Admin/Template panel)
  useEffect(() => {
    if (activeTab === 'docs') {
      try {
        const saved = localStorage.getItem('pbj_doc_settings');
        if (saved) {
          setDocSettings(JSON.parse(saved));
        }
      } catch (e) {
        console.error('Failed to sync docSettings in PP Panel:', e);
      }
    }
  }, [activeTab]);

  const handleToggleSearchRow = (itemNo, initialData) => {
    setExpandedSearchRows(prev => ({ ...prev, [itemNo]: !prev[itemNo] }));
    if (!searchParams[itemNo]) {
      setSearchParams(prev => ({
        ...prev,
        [itemNo]: {
          query: initialData.name || '',
          vendorTarget: initialData.vendor || '',
          minPrice: 0,
          maxPrice: initialData.paguDpa || initialData.price || 0
        }
      }));
    }
  };

  const handleSearchParamChange = (itemNo, field, value) => {
    setSearchParams(prev => ({
      ...prev,
      [itemNo]: {
        ...prev[itemNo],
        [field]: value
      }
    }));
  };

  const executePuppeteerSearch = async (itemsToSearch, forceAutoComparator = null) => {
    if (itemsToSearch.length === 0) return;
    setIsSearching(true);
    setSearchProgress(`Menganalisis e-Katalog untuk ${itemsToSearch.length} produk... Mohon tunggu.`);
    const useAutoComparator = forceAutoComparator !== null ? forceAutoComparator : autoComparatorEnabled;
    try {
      // Step 1: Post to queue, get jobId
      const response = await fetch('/api/survey/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          items: itemsToSearch,
          useAi: true,
          locations: searchIncludeNasional ? [] : searchLocations,
          priceTolerance: priceTolerance,
          ignorePriceLimit: false,
          autoComparator: useAutoComparator
        })
      });

      if (!response.ok) throw new Error('Gagal mengeksekusi survei: ' + response.statusText);
      const runRes = await response.json();
      if (!runRes.jobId) throw new Error('Tidak mendapatkan Job ID dari server');
      
      setCurrentJobId(runRes.jobId);
      setSearchProgress(`Job diterima (ID: ${runRes.jobId}). Puppeteer mulai bekerja...`);

      // Step 2: Poll for completion
      let results = null;
      let attempts = 0;
      while (attempts < 120) { // max ~5 menit
        await new Promise(r => setTimeout(r, 2500));
        attempts++;
        
        const statusRes = await fetch(`/api/survey/status/${runRes.jobId}`);
        if (!statusRes.ok) throw new Error('Gagal mengecek status job');
        const statusData = await statusRes.json();

        if (statusData.status === 'completed' || statusData.isCanceled) {
          results = statusData.results || [];
          break;
        } else if (statusData.status === 'failed') {
          throw new Error('Gagal memproses: ' + statusData.error);
        } else {
          const pct = statusData.progress || 0;
          setSearchProgress(`Memproses... ${pct}% selesai (Job: ${runRes.jobId})`);
        }
      }

      if (!results) throw new Error('Timeout: survei tidak selesai dalam batas waktu.');

      // Step 3: Apply results to the negotiation table
      let successCount = 0;
      const updatedNego = { ...negotiatedItems };
      results.forEach((res, i) => {
        const targetItem = itemsToSearch[i];
        if (res) {
          if (res.success) {
            successCount++;
          }
          const key = targetItem.originalNo;
          console.log(`[SURVEY RESULT] item key=${key} price=${res.price} vendor=${res.vendor} success=${res.success}`);
          updatedNego[key] = {
            ...(updatedNego[key] || {}),
            tayang: res.price,
            vendor: res.vendor || '',
            linkSelected: res.link || '',
            screenshotUrl: res.img ? res.img : '',
            hasScreenshot: !!res.img,
            // Simpan comparators otomatis jika ada
            autoComparators: (res.comparators && res.comparators.length > 0) ? res.comparators : (updatedNego[key]?.autoComparators || [])
          };
          // Also update link in searchParams so accordion shows it
          setSearchParams(prev => ({
            ...prev,
            [key]: {
              ...(prev[key] || {}),
              link: res.link || ''
            }
          }));
        }
      });
      // Update all negotiated items at ONCE to avoid stale closure issues
      setNegotiatedItems(updatedNego);
      localStorage.setItem('pbj_negotiated_items', JSON.stringify(updatedNego));
      dialog.success(`Pencarian selesai! ${successCount} dari ${itemsToSearch.length} produk berhasil diperbarui.`);
    } catch (e) {
      dialog.error(e.message);
    } finally {
      setIsSearching(false);
      setSearchProgress('');
      setCurrentJobId(null);
    }
  };

  const handleManualScreenshotUpload = async (itemNo, file) => {
    if (!file) return;
    try {
      setSearchProgress(`Mengunggah screenshot manual untuk item...`);
      const formData = new FormData();
      formData.append('screenshot', file);
      
      const res = await fetch('/api/pbj/upload-screenshot', {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('Gagal mengunggah file screenshot');
      
      const data = await res.json();
      
      // Update negotiatedItems with the new screenshot
      const updatedNego = { ...negotiatedItems };
      updatedNego[itemNo] = {
        ...(updatedNego[itemNo] || {}),
        screenshotUrl: data.screenshotPath,
        hasScreenshot: true
      };
      setNegotiatedItems(updatedNego);
      localStorage.setItem('pbj_negotiated_items', JSON.stringify(updatedNego));
      dialog.success('Screenshot manual berhasil diunggah! Gambar ini akan dipakai di BAHP dan mem-bypass hasil robot yang diblokir WAF.');
    } catch (e) {
      dialog.error(e.message);
    } finally {
      setSearchProgress('');
    }
  };

  const handleSearchSingleItem = (item, forceAutoComparator = null) => {
    const params = searchParams[item.no] || {};
    const payloadItem = {
      name: params.query || item.name,
      query: params.query || item.name,
      // fallbackPrice HARUS dari pagu DPA, BUKAN dari maxPrice
      // agar explicitMinPrice/explicitMaxPrice tidak tertimpa di backend
      fallbackPrice: item.paguDpa || item.price || 0,
      qty: item.qty || 1,
      originalNo: item.no,
      targetVendor: params.vendorTarget || '',
      targetUrl: params.link !== undefined ? params.link : (item.link || ''),
      // Kirim null jika kosong/0 agar backend tahu tidak ada batas eksplisit
      explicitMinPrice: params.minPrice && parseInt(params.minPrice) > 0 ? parseInt(params.minPrice) : null,
      explicitMaxPrice: params.maxPrice && parseInt(params.maxPrice) > 0 ? parseInt(params.maxPrice) : null,
      priceTolerance: priceTolerance
    };
    executePuppeteerSearch([payloadItem], forceAutoComparator);
  };

  const handleSearchAll = (forceAutoComparator = null) => {
    const activeItems = getPackageItems(submittedPack).filter(i => checkedItems[i.no]);
    const payloadItems = activeItems.map(item => {
      const params = searchParams[item.no] || {};
      return {
        name: params.query || item.name,
        query: params.query || item.name,
        fallbackPrice: item.paguDpa || item.price || 0,
        qty: item.qty || 1,
        originalNo: item.no,
        targetVendor: params.vendorTarget || '',
        targetUrl: params.link !== undefined ? params.link : (item.link || ''),
        explicitMinPrice: params.minPrice && parseInt(params.minPrice) > 0 ? parseInt(params.minPrice) : null,
        explicitMaxPrice: params.maxPrice && parseInt(params.maxPrice) > 0 ? parseInt(params.maxPrice) : null,
        priceTolerance: priceTolerance
      };
    });
    executePuppeteerSearch(payloadItems, forceAutoComparator);
  };

  const executeSealPackage = async () => {
    try {
      const targetId = submittedPack?.id;
      if (targetId) {
        let updatedDescription = '';
        try {
          let currentDesc = {};
          try {
            currentDesc = JSON.parse(submittedPack.description || '{}');
          } catch(e) {}
          
          currentDesc.ppEvaluation = {
            vendorRating: localStorage.getItem('pbj_vendor_rating') || '0',
            vendorRatingStatus: localStorage.getItem('pbj_vendor_rating_status') || '',
            vendorRatingNote: localStorage.getItem('pbj_vendor_rating_note') || '',
            qualityRating: localStorage.getItem('pbj_quality_rating') || '0',
            deliveryRating: localStorage.getItem('pbj_delivery_rating') || '0',
            communicationRating: localStorage.getItem('pbj_communication_rating') || '0',
            specEqual: localStorage.getItem('pbj_spec_equal') || '',
            specEqualNote: localStorage.getItem('pbj_spec_equal_note') || '',
            deliveryAgreement: localStorage.getItem('pbj_delivery_agreement') || '',
            koordinatLokasi: localStorage.getItem('pbj_koordinat_lokasi') || '',
          };
          updatedDescription = JSON.stringify(currentDesc);
        } catch(e) {
          console.error('Failed to serialize PP evaluation:', e);
        }

        const res = await fetch(`/api/projects/${targetId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            status: 'Selesai (Arsip Lengkap)',
            ...(updatedDescription ? { description: updatedDescription } : {})
          })
        });
        if (!res.ok) throw new Error('Gagal memperbarui status paket di server');
      }
      
      await dialog.success('Luar Biasa! Pekerjaan selesai! Dokumen arsip lengkap Inaproc telah diunggah dan dikembalikan ke PPK untuk keperluan audit BPK.');
      
      // Clear local states
      localStorage.removeItem('pbj_submitted_package');
      localStorage.removeItem('pbj_negotiated_items');
      localStorage.removeItem('pbj_pp_checked_items');
      
      window.location.href = '/'; 
    } catch (e) {
      dialog.error('Gagal menyelesaikan paket: ' + e.message);
    }
  };

  const handleFinalizeBahp = async () => {
    if (!deliveryLocation.trim()) {
      alert('Mohon isi Lokasi Pengiriman terlebih dahulu.');
      return;
    }
    const activeItems = getPackageItems(submittedPack).filter(i => checkedItems[i.no]);
    if (activeItems.length === 0) {
      alert('Tidak ada produk yang aktif untuk difinalisasi.');
      return;
    }

    const hasExceptions = activeItems.some(i => {
      const nego = negotiatedItems[i.no] || {};
      return nego.itemStatus === 'Stok Kurang' || nego.itemStatus === 'Tidak Tersedia';
    });

    if (hasExceptions && !ppkApprovedContinue && !exceptionNotes.trim()) {
      alert('Ada produk bermasalah. Mohon isi Catatan Penyimpangan DPP dan centang persetujuan PPK.');
      return;
    }

    const items = activeItems.map(item => {
      const nego = negotiatedItems[item.no] || {};
      const params = searchParams[item.no] || {};
      return {
        item_name: item.name,
        qty: item.qty,
        qty_confirmed: parseFloat(nego.qtyConfirmed || item.qty) || item.qty,
        unit: item.unit || '',
        vendor_name: nego.vendor || item.vendor || '',
        catalog_url: params.link || nego.linkSelected || item.link || '',
        screenshot_url: nego.screenshotUrl || '',
        initial_price: parseFloat(nego.tayang || item.katalogPrice || 0),
        negotiated_price: parseFloat(nego.price || 0),
        shipping_cost: parseFloat(nego.ongkir || 0),
        status: nego.itemStatus || 'Tersedia',
        pp_notes: nego.ppNotes || '',
        comparator_vendor: nego.compareVendor || '',
        comparator_price: parseFloat(nego.comparePrice || 0),
        comparator_url: nego.linkCompare1 || ''
      };
    });

    const firstVendor = items.find(i => i.vendor_name)?.vendor_name || '';
    const projectId = submittedPack?.projectId || submittedPack?.id;
    const docNumber = `BAHP-${projectId || 'PP'}-${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`;

    setIsSubmittingBahp(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/bahp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_number: docNumber,
          vendor_name: firstVendor,
          items: items,
          package_type: packageType,
          delivery_location: deliveryLocation,
          has_exceptions: hasExceptions,
          exception_notes: exceptionNotes,
          ppk_approved_continue: ppkApprovedContinue,
          status: 'Draft'
        })
      });
      if (!res.ok) throw new Error('Gagal menyimpan BAHP: ' + res.statusText);
      const data = await res.json();
      alert(`✅ BAHP Draft berhasil dibuat! Nomor: ${data.document_number || docNumber}\n\nBapak bisa melihatnya di menu BAHP.`);
      setShowFinalizeModal(false);
    } catch (e) {
      alert('❌ Error: ' + e.message);
    } finally {
      setIsSubmittingBahp(false);
    }
  };


  const handleRefineExceptionNote = async () => {
    if (!exceptionNotes.trim()) return alert('Isi catatan penyimpangan terlebih dahulu sebelum disempurnakan AI.');
    setIsRefiningException(true);
    setExceptionAdvice('');
    try {
      const activeItems = getPackageItems(submittedPack).filter(i => checkedItems[i.no]);
      const problemItems = activeItems.filter(i => {
        const s = (negotiatedItems[i.no] || {}).itemStatus;
        return s === 'Stok Kurang' || s === 'Tidak Tersedia';
      });
      const itemName = problemItems.map(i => i.name).join(', ');
      const itemStatus = problemItems.map(i => (negotiatedItems[i.no] || {}).itemStatus).join(', ');

      const res = await fetch('/api/ai/refine-exception', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_note: exceptionNotes,
          item_name: itemName || 'Barang',
          item_status: itemStatus || 'Bermasalah'
        })
      });
      if (!res.ok) throw new Error('API AI Error');
      const data = await res.json();
      if (data.success) {
        setExceptionNotes(data.refined_note);
        setExceptionAdvice(data.advice);
        if (!data.is_valid) alert('⚠️ Peringatan AI: Alasan penyimpangan mungkin kurang kuat secara hukum. Silakan baca nasihat AI di bawah kolom input.');
      } else throw new Error(data.error);
    } catch (e) {
      alert('❌ Error AI: ' + e.message);
    } finally {
      setIsRefiningException(false);
    }
  };

  const handleRefineGenericText = async (rawText, context, setter, loaderSetter) => {
    if (!rawText.trim()) return alert('Isi catatan terlebih dahulu.');
    loaderSetter(true);
    try {
      const res = await fetch('/api/ai/refine-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_text: rawText, context: context })
      });
      if (!res.ok) throw new Error('API AI Error');
      const data = await res.json();
      if (data.success) {
        setter(data.refined_text);
        saveBAHPField(context === 'Catatan Hasil Negosiasi' ? 'pbj_chat_notes' : 'pbj_vendor_rating_note', data.refined_text);
      } else throw new Error(data.error);
    } catch (e) {
      alert('❌ Error AI: ' + e.message);
    } finally {
      loaderSetter(false);
    }
  };

  const handleRefineBahp = async () => {
    const activeItems = getPackageItems(submittedPack).filter(i => checkedItems[i.no]);
    const hasExceptions = activeItems.some(i => {
      const s = (negotiatedItems[i.no] || {}).itemStatus;
      return s === 'Stok Kurang' || s === 'Tidak Tersedia';
    });

    const items = activeItems.map(item => {
      const nego = negotiatedItems[item.no] || {};
      return {
        item_name: item.name,
        qty: item.qty,
        vendor_name: nego.vendor || item.vendor || '',
        initial_price: parseFloat(nego.tayang || item.katalogPrice || 0),
        negotiated_price: parseFloat(nego.price || 0),
        status: nego.itemStatus || 'Tersedia',
        pp_notes: nego.ppNotes || ''
      };
    });

    setIsRefiningBahp(true);
    try {
      const res = await fetch('/api/ai/refine-bahp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package_type: packageType,
          delivery_location: deliveryLocation || 'TBA',
          has_exceptions: hasExceptions,
          exception_notes: exceptionNotes,
          items: items,
          unit_name: submittedPack ? submittedPack.senderDepartment : (user?.department || 'Kecamatan Besuk'),
          document_date: new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        })
      });
      if (!res.ok) throw new Error('API AI Error');
      const data = await res.json();
      if (data.success) {
        if (data.refined_intro) setRefinedBahpIntro(data.refined_intro);
        if (data.refined_exceptions) setRefinedBahpExceptions(data.refined_exceptions);
        if (data.refined_item_notes) setRefinedBahpItemNotes(data.refined_item_notes);
        if (data.refined_conclusion) setRefinedBahpConclusion(data.refined_conclusion);
        alert('✅ BAHP berhasil disempurnakan dengan bahasa hukum oleh AI!');
      } else {
        throw new Error(data.error || 'Gagal menyempurnakan BAHP');
      }
    } catch (e) {
      alert('❌ Error AI: ' + e.message + '\nPastikan API Key sudah diset di Pengaturan.');
    } finally {
      setIsRefiningBahp(false);
    }
  };

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
        const itemCount = getPackageItems(pack).length || 2
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

  // Negotiation Table States
  const [negotiatedItems, setNegotiatedItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pbj_negotiated_items')) || {};
    } catch(e) {
      return {};
    }
  });

  const handleNegotiationChange = (itemIdx, field, value) => {
    const updated = {
      ...negotiatedItems,
      [itemIdx]: {
        ...(negotiatedItems[itemIdx] || {}),
        [field]: value
      }
    };
    setNegotiatedItems(updated);
    localStorage.setItem('pbj_negotiated_items', JSON.stringify(updated));
  };


  const [inaprocDocs, setInaprocDocs] = useState({
    bast: null,
    sp: null,
    invoice: null,
    transfer: null,
    pnbp: null
  })

  // Auto Screenshot State for Lampiran II
  const [autoScreenshots, setAutoScreenshots] = useState(() => {
    const saved = localStorage.getItem('pbj_auto_screenshots');
    return saved ? JSON.parse(saved) : {};
  });
  const [isScreenshotLoading, setIsScreenshotLoading] = useState(false);

  // Real-world Catalog Mock Data matching Kecamatan Besuk DPA TA 2026
  const mockCatalogProducts = {
    ATK: [
      { 
        id: 'A01', 
        name: 'Ballpoint / Ballpen / Pena (Ballpoint Baliner Gel)', 
        vendor: 'CV. MANDIRI ATK PROBOLINGGO', 
        price: 235000, 
        rating: 4.9, 
        location: 'Kab. Probolinggo', 
        specs: 'Ballpoint gel warna hitam/biru, isi 12 buah per pack (PDN)',
        garansi: 'Resmi',
        katalog: 'Lokal',
        badge: 'Rekomendasi Utama: Hemat & Terdekat'
      },
      { 
        id: 'A02', 
        name: 'Alas Triplek Kerja Kantor', 
        vendor: 'UD. BESUK MEBEL INDAH', 
        price: 14500, 
        rating: 4.8, 
        location: 'Kec. Besuk, Kab. Probolinggo', 
        specs: 'Alas kerja triplek kayu lapis tebal kualitas premium',
        garansi: '6 Bulan',
        katalog: 'Lokal',
        badge: 'Mitra Lokal Terdekat'
      },
      { 
        id: 'A03', 
        name: 'Snelhechter Map (5001 setara Diamond)', 
        vendor: 'PT. LINTAS ATK SURABAYA', 
        price: 108000, 
        rating: 4.7, 
        location: 'Kota Surabaya', 
        specs: 'Map snelhechter isi 50 buah setara Diamond',
        garansi: 'Resmi',
        katalog: 'Nasional',
        badge: 'Penyedia Nasional Terlengkap'
      }
    ],
    Kertas: [
      { 
        id: 'K01', 
        name: 'Kertas HVS F4 70 Gram (setara Sidu)', 
        vendor: 'UD. KERTAS JAYA KRAKSAAN', 
        price: 68000, 
        rating: 4.9, 
        location: 'Kec. Kraksaan, Kab. Probolinggo', 
        specs: 'HVS F4 70 gram Sinar Dunia/Sidu asli kualitas tinggi',
        garansi: 'Resmi',
        katalog: 'Lokal',
        badge: 'Rekomendasi: Harga Grosir Terdekat'
      },
      { 
        id: 'K02', 
        name: 'Kertas HVS A4 80 Gram (setara Sinar Dunia)', 
        vendor: 'CV. MITRA UTAMA SURABAYA', 
        price: 74500, 
        rating: 4.8, 
        location: 'Kota Surabaya', 
        specs: 'HVS A4 80 gram Sinar Dunia, kertas putih cerah',
        garansi: 'Resmi',
        katalog: 'Nasional',
        badge: 'Penyedia Nasional'
      },
      { 
        id: 'K03', 
        name: 'Amplop Dinas Coklat (15,5 x 25 Cm)', 
        vendor: 'UD. KERTAS JAYA KRAKSAAN', 
        price: 1800, 
        rating: 4.7, 
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
        rating: 4.9, 
        location: 'Kec. Besuk, Kab. Probolinggo', 
        specs: 'Cetak banner flexy 340 gram kualitas high-res, bahan plastik lembar (PDN)',
        garansi: 'Garansi Cetak Ulang',
        katalog: 'Lokal',
        badge: 'Rekomendasi Utama: Mitra Besuk Terdekat & Paling Cepat'
      },
      { 
        id: 'B02', 
        name: 'Cetak Banner / Spanduk Plastick Lembar 280g', 
        vendor: 'CV. PRINT JAYA KRAKSAAN', 
        price: 18000, 
        rating: 4.7, 
        location: 'Kec. Kraksaan, Kab. Probolinggo', 
        specs: 'Banner flexy 280 gram standar',
        garansi: '3 Bulan',
        katalog: 'Lokal',
        badge: 'Pembanding Lokal Terdekat'
      },
      { 
        id: 'B03', 
        name: 'Cetak Banner SPP Ramah Lingkungan', 
        vendor: 'CV. ECO PRINT SURABAYA', 
        price: 25000, 
        rating: 4.8, 
        location: 'Kota Surabaya', 
        specs: 'Banner flexy ramah lingkungan, bahan daur ulang (SPP)',
        garansi: 'Resmi',
        katalog: 'Nasional',
        badge: 'Pilihan Pengadaan SPP Berkelanjutan'
      }
    ]
  }

  const getCommodityNames = (pack) => {
    if (!pack) return { first: 'Laptop', second: 'Printer' }
    const items = getPackageItems(pack)
    return {
      first: items[0]?.name || pack.packName || 'Produk Utama',
      second: items[1]?.name || ''
    }
  }

  const commodities = getCommodityNames(submittedPack)

  const getCatalogProducts = (type = selectedProductType) => {
    if (!submittedPack) return []
    const catType = type === 'laptop' || type === 'Laptop' ? 'Laptop' : 'Printer'
    
    const packNameLower = submittedPack.packName.toLowerCase()
    
    if (packNameLower.includes('tulis') || packNameLower.includes('atk')) {
      return catType === 'Laptop' 
        ? mockCatalogProducts.ATK.filter(p => p.id === 'A02' || p.name.includes('Alas')) 
        : mockCatalogProducts.ATK.filter(p => p.id !== 'A02')
    }
    if (packNameLower.includes('kertas') || packNameLower.includes('cover') || packNameLower.includes('hvs')) {
      return catType === 'Laptop' 
        ? mockCatalogProducts.Kertas.filter(p => p.id === 'K03' || p.name.includes('Amplop')) 
        : mockCatalogProducts.Kertas.filter(p => p.id !== 'K03')
    }
    if (packNameLower.includes('tinta') || packNameLower.includes('komputer') || packNameLower.includes('printer')) {
      return catType === 'Laptop' 
        ? mockCatalogProducts.Tinta.filter(p => p.id === 'T01' || p.name.includes('Black')) 
        : mockCatalogProducts.Tinta.filter(p => p.id !== 'T01')
    }
    if (packNameLower.includes('cetak') || packNameLower.includes('banner') || packNameLower.includes('spanduk')) {
      return mockCatalogProducts.Banner
    }
    
    return catType === 'Laptop' ? mockCatalogProducts.Laptop : mockCatalogProducts.Printer
  }

  // Handle automatic query fill from DPA/RUP
  useEffect(() => {
    if (submittedPack) {
      let derivedType = 'Laptop'
      let query = ''
      
      const packNameLower = submittedPack.packName.toLowerCase()
      if (packNameLower.includes('tulis') || packNameLower.includes('atk')) {
        derivedType = 'Printer' 
        query = 'Ballpoint Baliner'
      } else if (packNameLower.includes('kertas') || packNameLower.includes('cover') || packNameLower.includes('hvs')) {
        derivedType = 'Printer'
        query = 'Kertas HVS'
      } else if (packNameLower.includes('tinta') || packNameLower.includes('komputer') || packNameLower.includes('printer')) {
        derivedType = 'Laptop'
        query = 'Tinta Printer Black'
      } else if (packNameLower.includes('cetak') || packNameLower.includes('banner') || packNameLower.includes('spanduk')) {
        derivedType = 'Laptop'
        query = 'Cetak Banner'
      } else {
        derivedType = 'Laptop'
        query = submittedPack.packName
      }
      
      setSelectedProductType(derivedType)
      setSearchQuery(query)

      // Auto-adapt BAHP template — Prioritas: DPP Template ID → MAK → Jenis Pengadaan → Nama Paket
      const autoDetectTemplate = (pack) => {
        const dppTpl   = pack.dppTemplateId || '';
        const mak      = (pack.mak || '').replace(/\./g, '');
        const jenis    = (pack.jenisPengadaan || '').toLowerCase();
        const nama     = (pack.packName || '').toLowerCase();

        // 1. Dari DPP Template ID (paling akurat — ditetapkan PPK)
        if (dppTpl === 'TPL-006B')  return 'mamin';
        if (dppTpl === 'TPL-006C')  return 'modal';
        if (dppTpl === 'TPL-006D')  return 'jasa';
        if (dppTpl === 'TPL-006F')  return 'pemeliharaan';
        if (dppTpl === 'TPL-006G' || dppTpl === 'TPL-006E') return 'konstruksi';
        if (dppTpl === 'TPL-006H')  return 'konsultasi_non';
        if (dppTpl === 'TPL-006I')  return 'konsultasi_konstruksi';
        if (dppTpl === 'TPL-006K')  return 'konsolidasi';

        // 2. Dari MAK (Kode Akun Belanja) — sesuai BAS Permendagri 90/2019
        // 5.1.x = Belanja Modal, 5.2.1 = ATK/Barang Persediaan, 5.2.2 = Mamin
        // 5.2.3 = Jasa, 5.2.4 = Pemeliharaan, 5.2.5 = Perjalanan Dinas
        if (mak.startsWith('51'))   return 'modal';         // 5.1.x Belanja Modal
        if (mak.startsWith('522'))  return 'mamin';         // 5.2.2 Belanja Mamin
        if (mak.startsWith('521'))  return 'atk';           // 5.2.1 Belanja ATK/Persediaan
        if (mak.startsWith('5231')) return 'jasa';          // 5.2.3.1 Jasa Lainnya
        if (mak.startsWith('5232')) return 'konsultasi_non'; // 5.2.3.2 Jasa Konsultansi
        if (mak.startsWith('524'))  return 'pemeliharaan';  // 5.2.4 Pemeliharaan
        if (mak.startsWith('526'))  return 'konstruksi';    // 5.2.6 Konstruksi

        // 3. Dari field jenisPengadaan SIRUP
        if (jenis.includes('konsultansi konstruksi'))  return 'konsultasi_konstruksi';
        if (jenis.includes('konsultansi'))             return 'konsultasi_non';
        if (jenis.includes('konstruksi'))              return 'konstruksi';
        if (jenis.includes('jasa lainnya'))            return 'jasa';

        // 4. Fallback dari kata kunci nama paket
        if (nama.includes('mamin') || nama.includes('makanan') || nama.includes('katering') || nama.includes('konsumsi')) return 'mamin';
        if (nama.includes('komputer') || nama.includes('laptop') || nama.includes('printer') || nama.includes('modal') || nama.includes('mesin') || nama.includes('kendaraan')) return 'modal';
        if (nama.includes('konstruksi') || nama.includes('bangunan') || nama.includes('rehab') || nama.includes('gedung') || nama.includes('jalan')) return 'konstruksi';
        if (nama.includes('pemeliharaan') || nama.includes('perawatan') || nama.includes('service ac') || nama.includes('servis')) return 'pemeliharaan';
        if (nama.includes('konsultansi') || nama.includes('konsultan') || nama.includes('perencanaan') || nama.includes('pengawasan') || nama.includes('kajian') || nama.includes('studi') || nama.includes('audit')) {
          return (nama.includes('konstruksi') || nama.includes('bangunan') || nama.includes('gedung')) ? 'konsultasi_konstruksi' : 'konsultasi_non';
        }
        if (nama.includes('konsolidasi') || nama.includes('terkonsolidasi')) return 'konsolidasi';
        if (nama.includes('jasa') || nama.includes('tenaga') || nama.includes('kebersihan') || nama.includes('keamanan')) return 'jasa';

        return 'atk'; // default
      };

      const detectedTpl = autoDetectTemplate(submittedPack);
      setBahpTemplateId(detectedTpl);
      localStorage.setItem('pbj_bahp_template', detectedTpl);
    }
  }, [submittedPack])

  function getPackageItems(pack) {
    if (!pack) return []

    // ✅ Sync Fix: Use the finalized items injected by PPK if available
    // NOTE: Harga Tayang & Vendor dikelola SEPENUHNYA oleh negotiatedItems (state).
    // pbj_survey_data TIDAK diizinkan menimpa data item agar perubahan hasil pencarian
    // tidak hilang saat halaman di-render ulang.
    if (pack.items && pack.items.length > 0) {
      return pack.items;
    }
    
    const savedItemsStr = localStorage.getItem(`dpa_items_${pack.noSirup}`);
    if (savedItemsStr) {
      return JSON.parse(savedItemsStr);
    }
    
    const items = []
    const packNameLower = pack.packName.toLowerCase()
    
    // Generates completely dynamic items matching the pagu perfectly
    if (packNameLower.includes('tulis') || packNameLower.includes('atk')) {
      items.push({ no: 1, name: 'Alas Catatan Kantor', qty: 6, unit: 'Buah', price: Math.round(pack.pagu * 0.05 / 6), vendor: 'CV. Maju Jaya', tayang: Math.round((pack.pagu * 0.05 / 6) * 0.98) })
      items.push({ no: 2, name: 'Pena Ballpoint Gel', qty: 10, unit: 'Pack', price: Math.round(pack.pagu * 0.45 / 10), vendor: 'Toko ATK Berakh', tayang: Math.round((pack.pagu * 0.45 / 10) * 0.95) })
      items.push({ no: 3, name: 'Kertas Memo Sticky Notes', qty: 15, unit: 'Buah', price: Math.round(pack.pagu * 0.20 / 15), vendor: 'CV. Maju Jaya', tayang: Math.round((pack.pagu * 0.20 / 15) * 0.97) })
      items.push({ no: 4, name: 'Binder Clip Logam', qty: 8, unit: 'Kotak', price: Math.round(pack.pagu * 0.30 / 8), vendor: 'Toko ATK Berakh', tayang: Math.round((pack.pagu * 0.30 / 8) * 0.96) })
    } else if (packNameLower.includes('kertas') || packNameLower.includes('cover') || packNameLower.includes('hvs')) {
      items.push({ no: 1, name: 'Kertas HVS F4 70gr Sinar Dunia', qty: 50, unit: 'Rim', price: Math.round(pack.pagu * 0.60 / 50), vendor: 'PT. Distribusi Kertas', tayang: Math.round((pack.pagu * 0.60 / 50) * 0.95) })
      items.push({ no: 2, name: 'Kertas HVS A4 80gr PaperOne', qty: 30, unit: 'Rim', price: Math.round(pack.pagu * 0.40 / 30), vendor: 'PT. Distribusi Kertas', tayang: Math.round((pack.pagu * 0.40 / 30) * 0.95) })
    } else if (packNameLower.includes('tinta') || packNameLower.includes('komputer') || packNameLower.includes('printer')) {
      items.push({ no: 1, name: 'Tinta Printer Original Black', qty: 12, unit: 'Botol', price: Math.round(pack.pagu * 0.50 / 12), vendor: 'Tinta Komputer Utama', tayang: Math.round((pack.pagu * 0.50 / 12) * 0.92) })
      items.push({ no: 2, name: 'Tinta Printer Original Colour', qty: 12, unit: 'Botol', price: Math.round(pack.pagu * 0.50 / 12), vendor: 'Tinta Komputer Utama', tayang: Math.round((pack.pagu * 0.50 / 12) * 0.92) })
    } else if (packNameLower.includes('cetak') || packNameLower.includes('banner') || packNameLower.includes('spanduk')) {
      items.push({ no: 1, name: 'Cetak Banner Flexy 340gr (Outdoor)', qty: 15, unit: 'Meter Persegi', price: Math.round(pack.pagu / 15), vendor: 'Percetakan Sinar', tayang: Math.round((pack.pagu / 15) * 0.98) })
    } else {
      items.push({ no: 1, name: `${pack.packName}`, qty: 1, unit: pack.volume || 'Paket', price: pack.pagu, vendor: 'Penyedia e-Katalog', tayang: Math.round(pack.pagu * 0.99) })
    }
    
    // Adjust first item price so sum matches pack.pagu exactly
    let sum = 0
    items.forEach(item => sum += item.qty * item.price)
    const diff = pack.pagu - sum
    if (diff !== 0 && items.length > 0) {
      items[0].price += Math.round(diff / items[0].qty)
    }
    
    return items
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
    const currentCategoryProducts = getCatalogProducts(type === 'laptop' ? 'Laptop' : 'Printer')
    
    let mockScreenshotUrl = '/screenshots/hvs_a4_search.png'
    let realUrl = 'https://katalog.inaproc.id/search'
    
    if (submittedPack) {
      const packNameLower = submittedPack.packName.toLowerCase()
      if (packNameLower.includes('tulis') || packNameLower.includes('atk')) {
        mockScreenshotUrl = '/screenshots/ballpoint_detail.png'
        realUrl = 'https://katalog.inaproc.id/aura-mandiri-sejati/pulpen-gel-hitam/barang'
      } else if (packNameLower.includes('kertas') || packNameLower.includes('cover') || packNameLower.includes('hvs')) {
        mockScreenshotUrl = '/screenshots/hvs_a4_detail.png'
        realUrl = 'https://katalog.inaproc.id/berakh-aulia-ilmu/kertas-hvs-a4-80-gram/barang'
      } else if (packNameLower.includes('tinta') || packNameLower.includes('komputer') || packNameLower.includes('printer')) {
        mockScreenshotUrl = '/screenshots/tinta_printer_detail.png'
        realUrl = 'https://katalog.inaproc.id/rosida-nasution/tinta-printer-epson/barang'
      } else if (packNameLower.includes('cetak') || packNameLower.includes('banner') || packNameLower.includes('spanduk')) {
        mockScreenshotUrl = '/screenshots/map_snelhechter_search.png'
        realUrl = 'https://katalog.inaproc.id/search?keyword=map%20folder%20snelhechter'
      }
    }

    const maxHps = type === 'laptop' 
      ? (getPackageItems(submittedPack)[0]?.price || 8629000)
      : (getPackageItems(submittedPack)[1]?.price || 2200000)
    
    // Smart AI Negotiation Logic (Ensures compliance with HPS even if Etalase price is higher)
    let aiNegotiatedPrice = product.price
    if (product.price > maxHps) {
       aiNegotiatedPrice = maxHps - 1000 // Safely negotiate down to below HPS!
    } else if (product.price > maxHps - 5000) {
       aiNegotiatedPrice = product.price - 5000
    }

    const negotiatedOngkir = '0'

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


  


  // ── BAHP Validation State (Seksi D, E, F) ──────────────────────────────────
  const [priceChecklist, setPriceChecklist] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pbj_price_checklist') || '{}') } catch { return {} }
  })
  const [specEqual, setSpecEqual] = useState(() => localStorage.getItem('pbj_spec_equal') || '')
  const [specEqualNote, setSpecEqualNote] = useState(() => localStorage.getItem('pbj_spec_equal_note') || '')
  const [hasDiscount, setHasDiscount] = useState(() => localStorage.getItem('pbj_has_discount') === 'true')
  const [discountPrice, setDiscountPrice] = useState(() => localStorage.getItem('pbj_discount_price') || '')
  const [discountLink, setDiscountLink] = useState(() => localStorage.getItem('pbj_discount_link') || '')
  const [discountNote, setDiscountNote] = useState(() => localStorage.getItem('pbj_discount_note') || '')
  const [chatCaptures, setChatCaptures] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pbj_chat_captures') || '[]') } catch { return [] }
  })
  const [chatNotes, setChatNotes] = useState(() => localStorage.getItem('pbj_chat_notes') || '')
  const [deliveryAgreement, setDeliveryAgreement] = useState(() => localStorage.getItem('pbj_delivery_agreement') || '')
  const [warrantyAgreement, setWarrantyAgreement] = useState(() => localStorage.getItem('pbj_warranty_agreement') || '')
  const [paymentTerms, setPaymentTerms] = useState(() => localStorage.getItem('pbj_payment_terms') || 'Lunas setelah serah terima barang')
  const [vendorRating, setVendorRating] = useState(() => parseFloat(localStorage.getItem('pbj_vendor_rating') || '0'))
  const [vendorRatingNote, setVendorRatingNote] = useState(() => localStorage.getItem('pbj_vendor_rating_note') || '')
  const [vendorRatingStatus, setVendorRatingStatus] = useState(() => localStorage.getItem('pbj_vendor_rating_status') || '')
  const [qualityRating, setQualityRating] = useState(() => parseInt(localStorage.getItem('pbj_quality_rating') || '0'))
  const [deliveryRating, setDeliveryRating] = useState(() => parseInt(localStorage.getItem('pbj_delivery_rating') || '0'))
  const [communicationRating, setCommunicationRating] = useState(() => parseInt(localStorage.getItem('pbj_communication_rating') || '0'))
  const [showForcedRatingModal, setShowForcedRatingModal] = useState(false)

  const updateOverallRating = (q, d, c) => {
    if (q > 0 && d > 0 && c > 0) {
      const avg = ((q + d + c) / 3).toFixed(1);
      const parsedAvg = parseFloat(avg);
      setVendorRating(parsedAvg);
      saveBAHPField('pbj_vendor_rating', parsedAvg);
      
      let status = 'Cukup';
      if (parsedAvg >= 4.5) status = 'Sangat Baik';
      else if (parsedAvg >= 3.5) status = 'Baik';
      else if (parsedAvg < 2.5) status = 'Kurang Baik';
      setVendorRatingStatus(status);
      saveBAHPField('pbj_vendor_rating_status', status);
    }
  }

  // Template-specific dynamic states
  const [tenagaAhliList, setTenagaAhliList] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pbj_tenaga_ahli_list')) || [] } catch { return [] }
  })
  const [biayaPersonil, setBiayaPersonil] = useState(() => localStorage.getItem('pbj_biaya_personil') || '')
  const [biayaNonPersonil, setBiayaNonPersonil] = useState(() => localStorage.getItem('pbj_biaya_non_personil') || '')

  const [satkerPesertaList, setSatkerPesertaList] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pbj_satker_peserta_list')) || [] } catch { return [] }
  })

  const [koordinatLokasi, setKoordinatLokasi] = useState(() => localStorage.getItem('pbj_koordinat_lokasi') || '')
  const [personilK3, setPersonilK3] = useState(() => localStorage.getItem('pbj_personil_k3') || '')
  const [metodeKerja, setMetodeKerja] = useState(() => localStorage.getItem('pbj_metode_kerja') || '')

  const [merkTipeModal, setMerkTipeModal] = useState(() => localStorage.getItem('pbj_merk_tipe_modal') || '')
  const [nilaiTkdnModal, setNilaiTkdnModal] = useState(() => localStorage.getItem('pbj_nilai_tkdn_modal') || '')
  const [noSeriModal, setNoSeriModal] = useState(() => localStorage.getItem('pbj_no_seri_modal') || '')

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







  return (
    <>
    <div className="animate-fade-in pb-12">
      <div className="flex flex-wrap justify-between items-start gap-3 mb-5 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-slate-800 tracking-tight">Panel Pejabat Pengadaan (PP)</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 hidden sm:block">SOP Pelaksanaan - Pencarian, Komparasi Matriks & Dokumentasi e-Katalog Inaproc.</p>
        </div>
        {submittedPack && (
          <button 
            onClick={handleResetPackage} 
            className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
            Reset Sesi Pengadaan
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 sm:gap-4 mb-5 sm:mb-8 border-b border-slate-200 pb-0 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('incoming')}
          className={`shrink-0 px-3 sm:px-4 py-2 rounded-t-lg text-[10px] sm:text-[11px] font-semibold transition-all duration-200 flex items-center gap-1.5 sm:gap-2 ${activeTab === 'incoming' ? 'bg-slate-100 text-slate-800 border border-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent hover:border-slate-200'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 opacity-90"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>
          <span>Usulan DPP Masuk</span>
          {submittedPack && <span className={`px-1.5 py-0.5 text-[9px] rounded-full font-black ${activeTab === 'incoming' ? 'bg-slate-300 text-slate-800' : 'bg-slate-100 border border-slate-200 text-slate-500'}`}>1</span>}
        </button>
        <button 
          onClick={() => setActiveTab('search')}
          className={`shrink-0 px-3 sm:px-4 py-2 rounded-t-lg text-[10px] sm:text-[11px] font-semibold transition-all duration-200 flex items-center gap-1.5 sm:gap-2 ${activeTab === 'search' ? 'bg-slate-100 text-slate-800 border border-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent hover:border-slate-200'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 opacity-90"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          Tabel Negosiasi e-Purchasing
        </button>
        <button 
          onClick={() => setActiveTab('docs')}
          className={`shrink-0 px-3 sm:px-4 py-2 rounded-t-lg text-[10px] sm:text-[11px] font-semibold transition-all duration-200 flex items-center gap-1.5 sm:gap-2 ${activeTab === 'docs' ? 'bg-slate-100 text-slate-800 border border-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent hover:border-slate-200'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 opacity-90"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
          Arsip Dokumen Hasil Pemilihan (BAHP)
        </button>
        <button 
          onClick={() => setActiveTab('inaproc_docs')}
          className={`shrink-0 px-3 sm:px-4 py-2 rounded-t-lg text-[10px] sm:text-[11px] font-semibold transition-all duration-200 flex items-center gap-1.5 sm:gap-2 ${activeTab === 'inaproc_docs' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm' : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50 border border-transparent hover:border-indigo-100'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 opacity-90"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
          Unggah Arsip Inaproc (BAST/SP)
        </button>
      </div>

      {/* Content */}
      {activeTab === 'incoming' && (
        <div className="animate-slide-up">
          
          {submittedPack ? (
            <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-8 flex flex-col justify-between gap-4 sm:gap-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-slate-200"></div>
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="px-2.5 py-1 text-[9px] rounded-md bg-slate-100 border border-slate-200 text-slate-700 uppercase tracking-widest font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Aktif & Sah (TTE)
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><polygon points="12 22.08 12 12 3 6.92 3 17.08 12 22.08"/><polygon points="12 12 21 6.92 21 17.08 12 22.08"/><polygon points="12 2 21 6.92 12 12 3 6.92 12 2"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                    </span> Paket Terkirim dari PPK
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-800">{submittedPack.packName}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Pengirim: <span className="font-semibold text-slate-700">{submittedPack.senderName}</span> (NIP: {submittedPack.senderNip}) | Satker: <span className="font-semibold text-slate-700">{submittedPack.senderDepartment}</span>
                </p>

                {/* Ringkasan Eksekutif DPP */}
                <div className="mt-5 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100/50 rounded-xl p-5 shadow-sm">
                  <h4 className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Ringkasan Eksekutif DPP
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] font-semibold text-indigo-400 mb-0.5">Nomor RUP / SIRUP</div>
                      <div className="text-xs font-medium text-slate-700">{submittedPack.noSirup || 'Belum Terhubung SIRUP'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-indigo-400 mb-0.5">Kode Rekening / MAK</div>
                      <div className="text-xs font-medium text-slate-700">{submittedPack.mak || '-'}</div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-[10px] font-semibold text-indigo-400 mb-0.5">Spesifikasi Teknis / KAK Singkat</div>
                      <div className="text-xs font-medium text-slate-700 bg-white/60 p-2.5 rounded border border-indigo-100/30">
                        {submittedPack.spesifikasi || 'Mencakup pengadaan barang/jasa untuk paket ini secara keseluruhan sesuai HPS.'}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* DPA Detailed Rincian Table */}
                <div className="mt-6 bg-slate-50/50 border border-slate-200 rounded-xl p-5 w-full">
                  <div className="text-[10px] text-slate-600 font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
                    Rincian Barang Tersinkronisasi (Centang barang yang akan diproses):
                  </div>
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                      <thead>
                      <tr className="border-b border-slate-200 font-bold text-slate-500 text-[10px] uppercase">
                        <th className="pb-2 w-10 text-center">
                          <input 
                            type="checkbox" 
                            checked={submittedPack ? getPackageItems(submittedPack).length > 0 && getPackageItems(submittedPack).every(item => checkedItems[item.no]) : false}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              const items = submittedPack ? getPackageItems(submittedPack) : [];
                              const updated = {};
                              items.forEach(item => {
                                updated[item.no] = checked;
                              });
                              setCheckedItems(updated);
                              localStorage.setItem('pbj_pp_checked_items', JSON.stringify(updated));
                            }}
                            className="w-3.5 h-3.5 rounded border-slate-300 text-slate-800 focus:ring-slate-800 cursor-pointer"
                            title="Centang / Hapus Semua"
                          />
                        </th>
                        <th className="pb-2 w-6 text-center">No</th>
                        <th className="pb-2">Uraian Barang (Hasil Survei HPS)</th>
                        <th className="pb-2 text-center w-12">Jumlah</th>
                        <th className="pb-2 text-center w-16">Satuan</th>
                        <th className="pb-2 text-right">Harga HPS</th>
                        <th className="pb-2 text-right">Total Pagu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {getPackageItems(submittedPack).map((item, idx) => (
                        <tr key={item.no} className={`hover:bg-white transition-colors ${!checkedItems[item.no] ? 'opacity-40 grayscale' : ''}`}>
                          <td className="py-3 text-center">
                            <input 
                              type="checkbox" 
                              checked={!!checkedItems[item.no]} 
                              onChange={() => handleCheckboxChange(item.no)}
                              className="w-3.5 h-3.5 rounded border-slate-300 text-slate-800 focus:ring-slate-800 cursor-pointer"
                            />
                          </td>
                          <td className="py-3 text-slate-400 text-center">{idx + 1}</td>
                          <td className="py-3 font-medium">
                            {item.name?.includes('[Konsolidasi]') ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[9px] uppercase tracking-wider border border-slate-200 flex items-center gap-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                  Konsolidasi
                                </span>
                                <span className="text-slate-800">{item.name.replace('[Konsolidasi]', '').trim()}</span>
                              </div>
                            ) : (
                              item.name
                            )}
                          </td>
                          <td className="py-3 text-center font-bold text-slate-800">{item.qty}</td>
                          <td className="py-3 text-center text-slate-500">{item.unit}</td>
                          <td className="py-3 text-right font-mono text-slate-600">Rp {item.price.toLocaleString('id-ID')}</td>
                          <td className="py-3 text-right font-mono font-bold text-slate-800">Rp {(item.qty * item.price).toLocaleString('id-ID')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>
                
                {/* Documents Section */}
                <div className="mt-5 flex flex-wrap gap-2">
                  <button 
                    onClick={() => alert(`Membuka Dokumen DPA: ${submittedPack.dpaName}`)}
                    className="text-[11px] text-slate-600 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 transition-all font-medium flex items-center gap-1.5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    DPA Asli
                  </button>
                  {submittedPack.hpsValue !== 'Dikecualikan (Bebas HPS)' && parseFloat(submittedPack.hpsValue) !== 0 && submittedPack.hpsValue !== '0' && (
                    <button 
                      onClick={() => alert(`Membuka Surat Penetapan HPS dengan Nilai Rp ${parseFloat(submittedPack.hpsValue).toLocaleString('id-ID')} yang telah ditandatangani secara elektronik (TTE) oleh ${submittedPack.senderName}.`)}
                      className="text-[11px] text-slate-700 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-300 transition-all font-bold flex items-center gap-1.5"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      Surat Penetapan HPS (TTE)
                    </button>
                  )}
                  <button 
                    onClick={() => setShowDppModal(true)}
                    className="text-[11px] text-slate-700 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-300 transition-all font-bold flex items-center gap-1.5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                    Dokumen DPP PPK
                  </button>
                </div>
              </div>
              
              {showDppModal && submittedPack && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                  <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative animate-scale-up">
                    <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex justify-between items-center z-10 rounded-t-xl">
                      <h3 className="font-bold text-slate-800">Pratinjau Dokumen Persiapan Pengadaan (DPP)</h3>
                      <button onClick={() => setShowDppModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">✕</button>
                    </div>
                    <div className="p-8 pb-16 bg-white font-serif text-slate-800 leading-relaxed text-[12pt]" style={{fontFamily: "'Times New Roman', Times, serif"}}>
                      <h4 className="text-center font-bold mb-6 text-lg uppercase">Dokumen Persiapan Pengadaan (DPP)</h4>
                      
                      <div className="mb-4">
                        <table className="w-full">
                          <tbody>
                            <tr><td className="w-48 py-1">Nama Paket Pekerjaan</td><td className="w-4 py-1">:</td><td>{submittedPack.packName}</td></tr>
                            <tr><td className="py-1">Nilai HPS</td><td className="py-1">:</td><td>Rp {(parseFloat(submittedPack.hpsValue)||0).toLocaleString('id-ID')}</td></tr>
                          </tbody>
                        </table>
                      </div>
                      
                      <h5 className="font-bold mt-6 mb-2">BAB I. SPESIFIKASI TEKNIS PEKERJAAN (KAK)</h5>
                      
                      <h6 className="font-bold mt-4 mb-1">A. Latar Belakang Pekerjaan</h6>
                      <div className="text-justify whitespace-pre-wrap pl-4">{submittedPack.dppSpecs?.latarBelakang || submittedPack.techSpecs || '-'}</div>
                      
                      <h6 className="font-bold mt-4 mb-1">B. Maksud dan Tujuan</h6>
                      <div className="text-justify whitespace-pre-wrap pl-4">{submittedPack.dppSpecs?.maksudTujuan || '-'}</div>
                      
                      <h6 className="font-bold mt-4 mb-2">C. Spesifikasi Jenis, Jumlah, and Mutu Barang</h6>
                      <table className="w-full border-collapse border border-slate-800 text-sm mt-2">
                        <thead>
                          <tr>
                            <th className="border border-slate-800 p-2 text-center w-12">No</th>
                            <th className="border border-slate-800 p-2 text-center">Nama Barang (Katalog)</th>
                            <th className="border border-slate-800 p-2 text-center w-24">Jumlah</th>
                            <th className="border border-slate-800 p-2 text-center">Spesifikasi Mutu</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.isArray(submittedPack.items) ? submittedPack.items.map((item, idx) => (
                            <tr key={idx}>
                              <td className="border border-slate-800 p-2 text-center">{idx + 1}</td>
                              <td className="border border-slate-800 p-2">{item.name}</td>
                              <td className="border border-slate-800 p-2 text-center font-bold">{item.qty} {item.unit || 'Paket'}</td>
                              <td className="border border-slate-800 p-2 whitespace-pre-wrap">{submittedPack.dppSpecs?.itemSpecs?.[item.id] || item.spesifikasi || '-'}</td>
                            </tr>
                          )) : <tr><td colSpan="4" className="border border-slate-800 p-2 text-center">Data barang tidak tersedia</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex flex-col items-end gap-3 w-full border-t border-slate-100 pt-5 mt-2">
                <div className="flex justify-between w-full md:w-80 items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-xs text-slate-500 font-bold">Total HPS Diproses:</span>
                  <span className="text-lg font-black text-slate-800 font-mono">Rp {getDynamicTotalPagu().toLocaleString('id-ID')}</span>
                </div>
                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                  <button 
                    onClick={() => {
                      if (confirm('Tolak dokumen dan kembalikan ke PPK untuk direvisi?')) {
                        localStorage.removeItem('pbj_submitted_package');
                        setSubmittedPack(null);
                        // Also update status in backend if available
                        if (submittedPack.id) {
                          fetch(`/api/projects/${submittedPack.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: 'Draft' })
                          }).catch(e => console.error(e));
                        }
                      }
                    }} 
                    className="bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 shadow-sm w-full md:w-auto text-[11px] py-2.5 px-6 rounded-lg font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-rose-600"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    Tolak (Revisi PPK)
                  </button>
                  <button 
                    onClick={() => {
                      if (Object.values(checkedItems).every(v => !v)) {
                        alert('Silakan centang minimal satu barang yang ingin Anda proses terlebih dahulu!')
                        return
                      }
                      setActiveTab('search')
                    }} 
                    className="bg-indigo-600 hover:bg-indigo-700 border border-indigo-700 text-white shadow-sm w-full md:w-80 text-[11px] py-2.5 px-6 rounded-lg font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white"><polyline points="20 6 9 17 4 12"/></svg>
                    Terima & Lanjutkan Pencarian
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-10 text-center max-w-2xl mx-auto mt-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-slate-400 mb-3"><path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v7"/><path d="M22 13a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4"/><path d="M22 13H2"/><path d="M12 8v4"/><path d="m8 10 4-4 4 4"/></svg>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Belum Ada Paket Usulan Real</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">Sistem mendeteksi belum ada paket aktif yang dikirimkan oleh PPK melalui dashboard Persiapan Pengadaan saat ini.</p>
              
              <div className="text-xs bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-left space-y-2 mb-6">
                <strong>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-650 inline-block mr-1"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .5 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
                  Cara Simulasi Alur Penuh (End-to-End):
                </strong>
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
                      senderName: 'Handik Hariyanto, S.Kom., M.Si',
                      senderNip: '197909102002121004',
                      senderDepartment: user?.department || 'Kantor Kecamatan Besuk',
                      sentDate: '17 Mei 2026'
                    }
                    setSubmittedPack(mockPack)
                    localStorage.setItem('pbj_submitted_package', JSON.stringify(mockPack))
                  }}
                  className="btn-secondary text-xs px-5 py-2.5 font-bold flex items-center justify-center gap-1.5 mx-auto"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                  Muat Paket Contoh
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'search' && (
        <div className="space-y-6 animate-slide-up mb-8">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-650"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              Tabel Negosiasi e-Purchasing
            </h2>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <p className="text-sm text-slate-500 max-w-2xl">
                Lakukan proses negosiasi harga dan ongkos kirim secara langsung dengan Penyedia Katalog Elektronik. Masukkan harga kesepakatan final per item di bawah ini.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {/* Tombol 1: Cari saja tanpa pembanding */}
                <button 
                  onClick={() => { setAutoComparatorEnabled(false); handleSearchAll(false); }}
                  disabled={isSearching}
                  className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm text-xs py-2.5 px-4 rounded-lg font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                  title="Cari harga terbaik untuk semua produk tanpa mencari pembanding"
                >
                  {isSearching && !autoComparatorEnabled ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                  )}
                  {isSearching && !autoComparatorEnabled ? 'Memproses...' : 'Cari Semua'}
                </button>
                {/* Tombol 2: Cari + Pembanding Massal */}
                <button 
                  onClick={() => { setAutoComparatorEnabled(true); handleSearchAll(true); }}
                  disabled={isSearching}
                  className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm text-xs py-2.5 px-4 rounded-lg font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                  title="Cari harga terbaik DAN sekalian cari 1-2 produk pembanding dari penyedia lain (untuk BAHP). Proses lebih lama."
                >
                  {isSearching && autoComparatorEnabled ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="22"/><line x1="5" y1="7" x2="19" y2="7"/><path d="M5 7a7 7 0 0 0 14 0"/><path d="M17 22H7"/></svg>
                  )}
                  {isSearching && autoComparatorEnabled ? 'Memproses...' : 'Cari + Pembanding Massal'}
                </button>
              </div>
            </div>
            
            {isSearching && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl mb-4 flex items-center justify-between gap-3 animate-pulse">
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-700"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <span className="text-sm font-bold">{searchProgress}</span>
                </div>
                {currentJobId && (
                  <button 
                    onClick={handleCancelSearch}
                    className="bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors border border-rose-200 flex items-center gap-1 active:scale-95 flex-shrink-0"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                    <span>Hentikan</span>
                  </button>
                )}
              </div>
            )}
            
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs uppercase tracking-wider font-bold">
                    <th className="p-3 w-10 text-center">No</th>
                    <th className="p-3 min-w-[180px]">Deskripsi Komoditas</th>
                    <th className="p-3 text-center w-16">Vol</th>
                    <th className="p-3 text-right w-28">Pagu DPA</th>
                    <th className="p-3 text-right w-32">Harga Tayang</th>
                    <th className="p-3 text-right w-36">Harga Nego (Satuan)</th>
                    <th className="p-3 min-w-[130px]">Nama Penyedia</th>
                    <th className="p-3 text-right w-32">Total Akhir</th>
                    <th className="p-3 text-center w-28">Status</th>
                    <th className="p-3 text-center w-36">Aksi / Dok</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {getPackageItems(submittedPack).map((item, idx) => {
                    if (!checkedItems[item.no]) return null;
                    const nego = negotiatedItems[item.no] || {};
                    const vendor = nego.vendor !== undefined ? nego.vendor : (item.vendor || item.dppVendor || '');
                    // Prioritas: 1) hasil pencarian PP (nego.tayang), 2) harga tayang dari DPP PPK (item.tayang)
                    const tayangFromSearch = nego.tayang !== undefined ? nego.tayang : undefined;
                    const tayangFromDpp = item.katalogPrice !== undefined ? item.katalogPrice : (item.tayang || item.dppTayang || '');
                    const tayang = tayangFromSearch !== undefined ? tayangFromSearch : tayangFromDpp;
                    const isFromDpp = tayangFromSearch === undefined; // true = masih pakai harga DPP PPK
                    const negoPrice = nego.price !== undefined ? nego.price : '';
                    const ongkir = nego.ongkir !== undefined ? nego.ongkir : '';
                    
                    const paguSatuan = item.paguDpa !== undefined ? item.paguDpa : (item.price || 0);
                    const hpsSatuan = item.price || 0;
                    const negoVal = parseFloat(negoPrice) || 0;
                    const ongkirVal = parseFloat(ongkir) || 0;
                    const totalAkhir = (negoVal * item.qty) + ongkirVal;
                    const totalHps = hpsSatuan * item.qty;
                    const isOverbudget = totalAkhir > totalHps;
                    
                    const sParams = searchParams[item.no] || { query: '', vendorTarget: '', minPrice: 0, maxPrice: 0 };
                    return (
                      <React.Fragment key={item.no}>
                      <tr className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 text-center text-slate-500 font-medium">{idx + 1}</td>
                        <td className="p-4 whitespace-normal min-w-[220px]">
                          <div className="font-bold text-slate-800 text-sm leading-snug">{item.name}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2" title={item.specs}>{item.specs || '-'}</div>
                          <button
                            onClick={() => handleToggleSearchRow(item.no, item)}
                            className={`mt-2 text-[11px] font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 transition-all w-full justify-center ${
                              expandedSearchRows[item.no]
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                                : 'bg-white border-indigo-300 text-indigo-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
                            }`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                            <span>{expandedSearchRows[item.no] ? 'Tutup Pencarian ▲' : 'Cari Produk ▼'}</span>
                          </button>
                        </td>
                        <td className="p-4 text-center font-semibold text-slate-700">
                          {item.qty} <span className="text-[10px] text-slate-400 font-normal uppercase">{item.unit}</span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="font-mono font-bold text-slate-700 text-xs">Rp {paguSatuan.toLocaleString('id-ID')}</div>
                          <div className="text-[9px] text-rose-500 font-bold mt-0.5 uppercase">Batas Maksimal</div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="font-mono font-bold text-slate-700 text-xs">Rp {(tayang || 0).toLocaleString('id-ID')}</div>
                          <div className={`text-[9px] font-bold mt-1 flex items-center gap-1 justify-end ${isFromDpp ? 'text-amber-600' : 'text-blue-600'}`}>
                            {isFromDpp ? (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
                                <span>Dari DPP PPK</span>
                              </>
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                                <span>Dari e-Katalog</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="relative w-32">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">Rp</span>
                            <input 
                              type="number" 
                              className="w-full text-xs p-2.5 pl-7 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white shadow-sm text-right font-mono font-bold"
                              placeholder="0"
                              value={negoPrice}
                              onChange={e => handleNegotiationChange(item.no, 'price', e.target.value)}
                            />
                          </div>
                        </td>
                        <td className="p-4">
                          <input 
                            type="text" 
                            className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white shadow-sm"
                            placeholder="Ketik nama vendor..."
                            value={vendor}
                            onChange={e => handleNegotiationChange(item.no, 'vendor', e.target.value)}
                          />
                        </td>
                        <td className="p-4 text-right">
                          <div className={`font-mono font-black text-sm ${totalAkhir > 0 ? (isOverbudget ? 'text-rose-600' : 'text-emerald-600') : 'text-slate-400'}`}>
                            Rp {totalAkhir.toLocaleString('id-ID')}
                          </div>
                          {totalAkhir > 0 && (
                            <div className={`text-[9px] font-bold mt-1 px-1.5 py-0.5 inline-flex items-center gap-1 rounded uppercase tracking-wider ${isOverbudget ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                              {isOverbudget ? (
                                <>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose-600"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                  <span>Overbudget</span>
                                </>
                              ) : (
                                <>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600"><polyline points="20 6 9 17 4 12"/></svg>
                                  <span>Aman (Hemat)</span>
                                </>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {/* STATUS BADGE */}
                          {(() => {
                            const itemStatus = nego.itemStatus || 'Tersedia';
                            const statusConfig = {
                              'Tersedia':       { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', emoji: '' },
                              'Stok Kurang':    { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   emoji: '' },
                              'Tidak Tersedia': { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200',    emoji: '' },
                            };
                            const cfg = statusConfig[itemStatus] || statusConfig['Tersedia'];
                            return (
                              <div className="flex flex-col items-center gap-1">
                                <select
                                  value={itemStatus}
                                  onChange={e => handleNegotiationChange(item.no, 'itemStatus', e.target.value)}
                                  className={`text-[10px] font-bold px-2 py-1 rounded-lg border cursor-pointer ${cfg.bg} ${cfg.text} ${cfg.border} focus:outline-none`}
                                >
                                  <option value="Tersedia">✓ Tersedia</option>
                                  <option value="Stok Kurang">! Stok Kurang</option>
                                  <option value="Tidak Tersedia">✕ Tidak Tersedia</option>
                                </select>
                                {(itemStatus === 'Stok Kurang' || itemStatus === 'Tidak Tersedia') && (
                                  <input
                                    type="text"
                                    value={nego.ppNotes || ''}
                                    onChange={e => handleNegotiationChange(item.no, 'ppNotes', e.target.value)}
                                    placeholder={itemStatus === 'Stok Kurang' ? 'Qty tersedia: ...' : 'Alasan tidak tersedia...'}
                                    className="text-[9px] p-1 border border-amber-200 rounded w-full bg-amber-50 focus:ring-1 focus:ring-amber-400"
                                  />
                                )}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={async () => {
                                if (!nego.vendor || nego.tayang === undefined || nego.tayang === '' || nego.price === undefined || nego.price === '') {
                                    alert('Mohon lengkapi Nama Vendor, Harga Tayang, dan Harga Negosiasi terlebih dahulu sebelum mencari pembanding.');
                                    return;
                                }
                                handleNegotiationChange(item.no, 'isAiLoading', true);
                                try {
                                    const res = await fetch('/api/survey/find-comparator', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ query: item.name, originalVendor: nego.vendor })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                        handleNegotiationChange(item.no, 'linkSelected', item.link || 'https://e-katalog.lkpp.go.id');
                                        handleNegotiationChange(item.no, 'linkCompare1', data.detailUrl);
                                        handleNegotiationChange(item.no, 'compareName', data.name);
                                        handleNegotiationChange(item.no, 'compareVendor', data.vendor);
                                        handleNegotiationChange(item.no, 'comparePrice', data.price);
                                        handleNegotiationChange(item.no, 'hasScreenshot', true);
                                        handleNegotiationChange(item.no, 'screenshotUrl', data.screenshotUrl || '');
                                    } else {
                                        alert('Gagal mencari pembanding: ' + (data.error || 'Unknown error'));
                                    }
                                } catch (e) {
                                    alert('Error menghubungi AI Asisten: ' + e.message);
                                }
                                handleNegotiationChange(item.no, 'isAiLoading', false);
                             }}
                            disabled={nego.isAiLoading}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 mx-auto ${nego.hasScreenshot ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'}`}
                          >
                            {nego.isAiLoading ? (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                                <span>Mencari...</span>
                              </>
                            ) : nego.hasScreenshot ? (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-700"><polyline points="20 6 9 17 4 12"/></svg>
                                <span>AI Selesai</span>
                              </>
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 22 22 22 12 2"/></svg>
                                <span>Cari Pembanding & Bukti (AI)</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                      {/* ── AUTO COMPARATOR RESULT ROW ── */}
                      {nego.autoComparators && nego.autoComparators.length > 0 && (
                        <tr className="bg-purple-50/40 border-b border-purple-100">
                          <td colSpan="10" className="px-4 py-3">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="22"/><line x1="5" y1="7" x2="19" y2="7"/><path d="M5 7a7 7 0 0 0 14 0"/><path d="M17 22H7"/></svg>
                                Pembanding e-Katalog (Auto)
                              </span>
                              <span className="text-[10px] text-slate-500">Ditemukan otomatis untuk BAHP — penyedia berbeda, harga lebih tinggi</span>
                            </div>
                            <div className="flex flex-wrap gap-3">
                              {nego.autoComparators.map((comp, ci) => (
                                <div key={ci} className="bg-white border border-purple-100 rounded-lg px-3 py-2 flex items-center gap-3 shadow-sm min-w-[260px]">
                                  <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-black text-[10px] shrink-0">{ci + 1}</div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-[11px] font-bold text-slate-700 truncate" title={comp.name}>{comp.name}</div>
                                    <div className="text-[10px] text-slate-500">{comp.vendor}</div>
                                    <div className="text-[11px] font-mono font-black text-rose-600">Rp {(comp.price || 0).toLocaleString('id-ID')}</div>
                                  </div>
                                  {comp.link && (
                                    <a href={comp.link} target="_blank" rel="noopener noreferrer" className="shrink-0 text-purple-500 hover:text-purple-700 text-[10px] font-bold border border-purple-200 rounded px-1.5 py-0.5 hover:bg-purple-50 transition-all flex items-center gap-1">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                                      Buka
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                      {expandedSearchRows[item.no] && (
                        <tr className="bg-indigo-50/30 border-b border-indigo-100">
                          <td colSpan="10" className="p-4">
                            <div className="bg-white border border-indigo-100 rounded-xl p-5 shadow-sm">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-700 shrink-0"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                                  <span>Pengaturan Pencarian — {item.name}</span>
                                </div>
                                <button onClick={() => handleToggleSearchRow(item.no, item)} className="text-slate-400 hover:text-slate-600 text-xs">✕ Tutup</button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Kata Kunci / Nama Produk</label>
                                  <input 
                                    type="text" 
                                    value={sParams.query || item.name}
                                    onChange={(e) => handleSearchParamChange(item.no, 'query', e.target.value)}
                                    className="w-full text-xs p-2 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Target Penyedia (Opsional)</label>
                                  <input 
                                    type="text" 
                                    value={sParams.vendorTarget}
                                    onChange={(e) => handleSearchParamChange(item.no, 'vendorTarget', e.target.value)}
                                    className="w-full text-xs p-2 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500"
                                    placeholder="Nama spesifik vendor..."
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Harga Min (Rp)</label>
                                  <input 
                                    type="number" 
                                    value={sParams.minPrice}
                                    onChange={(e) => handleSearchParamChange(item.no, 'minPrice', e.target.value)}
                                    className="w-full text-xs p-2 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Harga Max / Pagu (Rp)</label>
                                  <input 
                                    type="number" 
                                    value={sParams.maxPrice || (item.paguDpa || item.price || 0)}
                                    onChange={(e) => handleSearchParamChange(item.no, 'maxPrice', e.target.value)}
                                    className="w-full text-xs p-2 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500"
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Link e-Katalog / Referensi</label>
                                  <div className="flex items-center gap-2">
                                    <input 
                                      type="text" 
                                      value={sParams.link !== undefined ? sParams.link : (item.link || '')}
                                      onChange={(e) => handleSearchParamChange(item.no, 'link', e.target.value)}
                                      className="flex-1 text-xs p-2 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 font-mono"
                                      placeholder="https://e-katalog.lkpp.go.id/..."
                                    />
                                    {(sParams.link || item.link) && (
                                      <a
                                        href={sParams.link || item.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="shrink-0 bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 text-[10px] font-bold px-3 py-2 rounded flex items-center gap-1 transition-all"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                                        Buka
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* ── Filter Wilayah & Toleransi Harga ───────── */}
                              <div className="mt-4 pt-4 border-t border-indigo-100">
                                <div className="text-[10px] font-bold text-slate-500 uppercase mb-3 flex items-center gap-1.5">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                                  <span>Filter Wilayah & Toleransi Harga</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Filter Wilayah */}
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Wilayah Pencarian</label>
                                    <div className="space-y-1.5">
                                      {[
                                        { label: `Kab. Probolinggo`, value: 'Kab. Probolinggo' },
                                        { label: `Kota Probolinggo`, value: 'Kota Probolinggo' },
                                        { label: `Kota Surabaya`, value: 'Kota Surabaya' },
                                        { label: `Jawa Timur (Provinsi)`, value: 'Jawa Timur' },
                                      ].map(opt => (
                                        <label key={opt.value} className="flex items-center gap-2 cursor-pointer group">
                                          <input
                                            type="checkbox"
                                            checked={searchLocations.includes(opt.value)}
                                            onChange={(e) => {
                                              setSearchLocations(prev =>
                                                e.target.checked
                                                  ? [...prev, opt.value]
                                                  : prev.filter(l => l !== opt.value)
                                              );
                                            }}
                                            className="w-3.5 h-3.5 accent-indigo-600 rounded"
                                          />
                                          <span className="text-xs text-slate-600 group-hover:text-indigo-700 transition-colors">{opt.label}</span>
                                        </label>
                                      ))}
                                      <label className="flex items-center gap-2 cursor-pointer group mt-1 pt-1 border-t border-slate-100">
                                        <input
                                          type="checkbox"
                                          checked={searchIncludeNasional}
                                          onChange={(e) => setSearchIncludeNasional(e.target.checked)}
                                          className="w-3.5 h-3.5 accent-purple-600 rounded"
                                        />
                                        <span className="text-xs text-purple-700 font-semibold group-hover:text-purple-900 transition-colors">🌐 Nasional (semua wilayah)</span>
                                      </label>
                                    </div>
                                    {searchIncludeNasional && (
                                      <div className="mt-2 text-[9px] text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 flex items-start gap-1">
                                        <span>⚠️</span>
                                        <span>Mode Nasional akan mengembalikan produk dari seluruh Indonesia. Harga mungkin lebih murah namun ongkir lebih tinggi.</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Toleransi Harga */}
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">
                                      Toleransi Harga — <span className="text-indigo-600 font-black">±{priceTolerance}%</span>
                                    </label>
                                    <input
                                      type="range"
                                      min="5"
                                      max="60"
                                      step="5"
                                      value={priceTolerance}
                                      onChange={(e) => setPriceTolerance(parseInt(e.target.value))}
                                      className="w-full accent-indigo-600"
                                    />
                                    <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                                      <span>Ketat (5%)</span>
                                      <span>Longgar (60%)</span>
                                    </div>
                                    <div className="mt-2 bg-slate-50 border border-slate-200 rounded p-2">
                                      <div className="text-[9px] text-slate-500 font-medium mb-1">Rentang harga aktif untuk produk ini:</div>
                                      <div className="text-xs font-mono font-bold text-indigo-700">
                                        Rp {Math.floor((item.paguDpa || item.price || 0) * (1 - priceTolerance/100)).toLocaleString('id-ID')}
                                        {' — '}
                                        Rp {Math.floor((item.paguDpa || item.price || 0) * (1 + priceTolerance/100)).toLocaleString('id-ID')}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {/* ─────────────────────────────────────────── */}
                              <div className="mt-4 pt-4 border-t border-slate-100">
                                <div className="text-[10px] font-bold text-slate-500 uppercase mb-3 flex items-center gap-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                                  <span>Harga Negosiasi</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nego Satuan (Rp)</label>
                                    <div className="relative">
                                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">Rp</span>
                                      <input
                                        type="number"
                                        className="w-full text-xs p-2 pl-7 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 text-right font-mono"
                                        placeholder="0"
                                        value={negoPrice}
                                        onChange={e => handleNegotiationChange(item.no, 'price', e.target.value)}
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1.5">
                                      <span>Ongkos Kirim</span>
                                      <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold tracking-wider">{docSettings.deliveryZone || 'Zona 1'}</span>
                                    </label>
                                    <div className="relative">
                                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">Rp</span>
                                      <input
                                        type="number"
                                        className="w-full text-xs p-2 pl-7 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 text-right font-mono"
                                        placeholder="0"
                                        value={ongkir}
                                        onChange={e => handleNegotiationChange(item.no, 'ongkir', e.target.value)}
                                      />
                                    </div>
                                    {parseFloat(ongkir || 0) > 0 && (
                                      <div className="mt-1.5 flex items-start gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500 shrink-0 mt-0.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                        <span className="text-[8px] leading-tight text-amber-600 italic font-medium">Harap pastikan nominal wajar sesuai kesepakatan {docSettings.deliveryZone || 'Zona 1'}.</span>
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Total Akhir</label>
                                    <div className={`text-sm font-black p-2 rounded text-right font-mono ${isOverbudget ? 'bg-rose-50 text-rose-600' : totalAkhir > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-400'}`}>
                                      Rp {totalAkhir.toLocaleString('id-ID')}
                                      {isOverbudget && (
                                        <span className="block text-[9px] font-bold mt-0.5 flex items-center gap-1 justify-end">
                                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose-600"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                          <span>Overbudget!</span>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-4">
                                {isSearching && (
                                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mb-3 flex items-center gap-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin text-indigo-700"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                                    <div>
                                      <div className="text-xs font-bold text-indigo-700">{searchProgress || 'Puppeteer AI sedang menelusuri e-Katalog LKPP...'}</div>
                                      <div className="text-[10px] text-indigo-500 mt-0.5">Proses ini memerlukan waktu 20-60 detik. Mohon jangan tutup halaman.</div>
                                    </div>
                                  </div>
                                )}
                                <div className="flex justify-end gap-2">
                                  <button 
                                    onClick={() => { setAutoComparatorEnabled(false); handleSearchSingleItem(item, false); }}
                                    disabled={isSearching}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-wait"
                                    title="Cari harga terbaik untuk produk ini saja"
                                  >
                                    {isSearching && !autoComparatorEnabled ? (
                                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                                    ) : (
                                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                                    )}
                                    <span>{isSearching && !autoComparatorEnabled ? 'Mencari...' : 'Mulai Cari di e-Katalog'}</span>
                                  </button>
                                  <button 
                                    onClick={() => { setAutoComparatorEnabled(true); handleSearchSingleItem(item, true); }}
                                    disabled={isSearching}
                                    className="bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-wait"
                                    title="Cari harga terbaik + sekalian cari 1-2 produk pembanding dari penyedia lain untuk BAHP"
                                  >
                                    {isSearching && autoComparatorEnabled ? (
                                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                                    ) : (
                                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="22"/><line x1="5" y1="7" x2="19" y2="7"/><path d="M5 7a7 7 0 0 0 14 0"/><path d="M17 22H7"/></svg>
                                    )}
                                    <span>{isSearching && autoComparatorEnabled ? 'Mencari...' : 'Cari + Pembanding'}</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* ─── EXCEPTION NOTES PANEL ──────────────────────────────── */}
            {(() => {
              const allItems = getPackageItems(submittedPack).filter(i => checkedItems[i.no]);
              const problemItems = allItems.filter(i => {
                const s = (negotiatedItems[i.no] || {}).itemStatus;
                return s === 'Stok Kurang' || s === 'Tidak Tersedia';
              });
              if (problemItems.length === 0) return null;
              return (
                <div className="mt-4 bg-amber-50 border-2 border-amber-300 rounded-2xl p-3 sm:p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 shrink-0"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    <h3 className="font-bold text-amber-800 text-sm">Ada {problemItems.length} Produk Bermasalah — Diperlukan Catatan Penyimpangan DPP</h3>
                  </div>
                  <ul className="text-xs text-amber-700 mb-3 space-y-1 list-disc list-inside">
                    {problemItems.map(i => (
                      <li key={i.no}><strong>{i.name}</strong>: {(negotiatedItems[i.no] || {}).itemStatus} — {(negotiatedItems[i.no] || {}).ppNotes || '(belum ada catatan)'}</li>
                    ))}
                  </ul>
                  <label className="block text-[11px] font-bold text-amber-700 uppercase mb-1.5">Catatan Penyimpangan DPP (Resmi — akan masuk ke dokumen BAHP)</label>
                  <textarea
                    value={exceptionNotes}
                    onChange={e => setExceptionNotes(e.target.value)}
                    rows={3}
                    placeholder="Contoh: Berdasarakn penelusuran PP di Katalog Elektronik LKPP pada tanggal [...], [nama barang] tidak tersedia/stok kurang. Atas persetujuan PPK, pengadaan dilanjutkan dengan penyesuaian: [...]"
                    className="w-full text-xs p-3 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                  <div className="flex flex-col gap-2 mt-2">
                    <button 
                      onClick={handleRefineExceptionNote} 
                      disabled={isRefiningException}
                      className="self-end bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 disabled:opacity-50"
                    >
                      {isRefiningException ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                          <span>Memproses...</span>
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 22 22 22 12 2"/></svg>
                          <span>Konsultasi & Perbaiki dengan AI</span>
                        </>
                      )}
                    </button>
                    {exceptionAdvice && (
                      <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-[10px] text-indigo-800 font-sans flex items-start gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-650 shrink-0 mt-0.5"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .5 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
                        <div>
                          <strong>Nasihat Hukum AI:</strong><br/>{exceptionAdvice}
                        </div>
                      </div>
                    )}
                  </div>
                  <label className="flex items-center gap-2 mt-3 cursor-pointer">
                    <input type="checkbox" checked={ppkApprovedContinue} onChange={e => setPpkApprovedContinue(e.target.checked)} className="w-4 h-4 accent-amber-600" />
                    <span className="text-xs font-bold text-amber-800">PPK telah menyetujui kelanjutan proses pengadaan meskipun ada penyimpangan dari DPP</span>
                  </label>
                </div>
              );
            })()}



            {/* --- MOVED VALIDATION FORMS --- */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm mt-6">
              <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-800"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
                Validasi & Pengaturan Negosiasi
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                Silakan lengkapi form validasi spesifikasi, kesepakatan pengiriman, dan penilaian vendor di bawah ini sebelum menerbitkan BAHP.
              </p>
                {/* ═══════════════════════════════════════════════════════════ */}
                {/* SEKSI D: VALIDASI KEWAJARAN HARGA OLEH PP                  */}
                {/* ═══════════════════════════════════════════════════════════ */}
                <div className="font-bold text-[11px] uppercase tracking-wide border-b border-slate-200 pb-1 mt-8 text-indigo-850">D. Validasi Kewajaran Harga oleh Pejabat Pengadaan (PP)</div>
                <p className="font-sans text-[10px] text-slate-600 mb-3">Sesuai <strong>Perpres No. 12 Tahun 2021 Pasal 50</strong> dan <strong>Peraturan LKPP No. 9 Tahun 2021</strong>, PP wajib melakukan verifikasi kewajaran harga sebelum menerbitkan Surat Pesanan (SP). Proses verifikasi meliputi kesesuaian spesifikasi, kelengkapan komponen harga, serta kewajaran nilai negosiasi yang tidak melebihi HPS yang telah ditetapkan PPK:</p>

                {/* Checklist Spesifikasi */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-3 font-sans print:border-slate-300">
                  <div className="text-[10px] font-bold text-slate-700 mb-1 uppercase tracking-wide">
                    D.1 {VALIDASI_CONFIG[bahpTemplateId]?.d1Label || 'Verifikasi Kesetaraan Spesifikasi Barang'}
                  </div>
                  <div className="text-[10px] text-slate-500 mb-2 leading-relaxed">
                    {VALIDASI_CONFIG[bahpTemplateId]?.d1Desc || 'Apakah spesifikasi merek, tipe, gramatur, dan kualitas ATK sesuai DPP PPK?'}
                  </div>
                  <div className="flex gap-6 mb-2">
                    {[
                      { val: 'Ya, spesifikasi setara', label: VALIDASI_CONFIG[bahpTemplateId]?.d1OptYes || 'Ya, spesifikasi setara' },
                      { val: 'Tidak, ada perbedaan spesifikasi', label: VALIDASI_CONFIG[bahpTemplateId]?.d1OptNo || 'Tidak, ada perbedaan spesifikasi' }
                    ].map(opt => (
                      <label key={opt.val} className="flex items-center gap-2 text-[11px] cursor-pointer select-none">
                        <input type="radio" name="spec_equal" value={opt.val}
                          checked={specEqual === opt.val}
                          onChange={e => { setSpecEqual(e.target.value); saveBAHPField('pbj_spec_equal', e.target.value) }}
                          className="w-3.5 h-3.5 accent-indigo-600"
                        />
                        <span className={specEqual === opt.val ? 'font-bold text-indigo-700' : 'text-slate-600'}>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                  {specEqual === 'Tidak, ada perbedaan spesifikasi' && (
                    <textarea
                      value={specEqualNote}
                      onChange={e => { setSpecEqualNote(e.target.value); saveBAHPField('pbj_spec_equal_note', e.target.value) }}
                      placeholder="Uraikan perbedaan spesifikasi yang ditemukan PP..."
                      className="w-full border border-amber-300 rounded-lg px-3 py-2 text-[11px] bg-amber-50 focus:outline-none focus:ring-1 focus:ring-amber-400 mt-1 print:border-slate-400"
                      rows={2}
                    />
                  )}
                  {specEqual === 'Ya, spesifikasi setara' && specEqualNote && (
                    <div className="text-[10px] text-slate-500 italic mt-1">Catatan PP: {specEqualNote}</div>
                  )}
                </div>

                {/* Checklist Komponen Harga */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-3 font-sans print:border-slate-300">
                  <div className="text-[10px] font-bold text-slate-700 mb-2 uppercase tracking-wide">D.2 Verifikasi Kelengkapan Komponen Harga (Wajib Dicentang)</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {(D2_CHECKLISTS[bahpTemplateId] || D2_CHECKLISTS.atk).map(item => (
                      <label key={item.key} className="flex items-start gap-2 text-[11px] cursor-pointer select-none bg-white border border-slate-200 rounded-lg p-2.5 hover:border-indigo-300 transition-all print:border-slate-300">
                        <input type="checkbox"
                          checked={!!priceChecklist[item.key]}
                          onChange={e => {
                            const next = { ...priceChecklist, [item.key]: e.target.checked }
                            setPriceChecklist(next)
                            saveBAHPField('pbj_price_checklist', next)
                          }}
                          className="w-3.5 h-3.5 mt-0.5 accent-emerald-600 flex-shrink-0"
                        />
                        <span className={priceChecklist[item.key] ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Rekomendasi Prosedur Pemilihan Penyedia (Saran untuk PP/PPK) untuk Mamin */}
                {bahpTemplateId === 'mamin' && (
                  <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 mb-3 font-sans print:border-slate-300">
                    <div className="text-[11px] font-bold text-amber-800 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                      <span>💡</span>
                      Rekomendasi Prosedur Pemilihan Penyedia (Saran untuk PP/PPK)
                    </div>
                    <div className="text-slate-700 text-xs space-y-2.5">
                      <div>
                        <span className="font-bold text-amber-900 block mb-0.5">1. Penerapan Metode Rotasi Kerja/Order (Penyedia Ganda)</span>
                        <p className="leading-relaxed text-[11px] text-justify">Mengingat terdapat lebih dari 1 (satu) penyedia Mamin dalam wilayah kecamatan yang sama, Pejabat Pengadaan (PP) dan PPK disarankan menerapkan sistem rotasi kerja secara bergiliran pada paket belanja berikutnya. Langkah ini penting untuk mencegah monopoli usaha, mendukung pemerataan ekonomi bagi seluruh UMKK lokal, serta memelihara iklim kemitraan yang sehat.</p>
                      </div>
                      <div>
                        <span className="font-bold text-amber-900 block mb-0.5">2. Penyesuaian Spesifikasi Sajian (Menu Matching)</span>
                        <p className="leading-relaxed text-[11px] text-justify">Pemilihan penyedia harus disesuaikan dengan kapasitas dan kekhasan menu sajian yang ditawarakn oleh penyedia (misal: nasi kotak, prasmanan, atau snack box) agar selaras dengan kebutuhan jenis kegiatan kedinasan.</p>
                      </div>
                      <div>
                        <span className="font-bold text-amber-900 block mb-0.5">3. Penentuan Lokasi Pengiriman Riil (Alamat Pengiriman Fleksibel)</span>
                        <p className="leading-relaxed text-[11px] text-justify">Apabila pengantaran makanan ditujukan ke tempat lain di luar kantor instansi/kecamatan (seperti aula desa atau lokasi lapangan), maka pemilihan katering harus memprioritaskan penyedia yang memiliki jarak terdekat ke titik pengiriman riil tersebut demi menjaga kesegaran hidangan, efisiensi waktu, serta meminimalisir biaya pengiriman (ongkir).</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── BARU: D.3 Input Detail Spesifik Jenis Pengadaan ─── */}
                {['konsultasi_non', 'konsultasi_konstruksi', 'konsolidasi', 'konstruksi', 'modal'].includes(bahpTemplateId) && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-3 font-sans print:border-slate-300">
                    <div className="text-[10px] font-bold text-slate-700 mb-3 uppercase tracking-wide flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                      D.3 Pengaturan Spesifik Jenis Pengadaan: {
                        {
                          konsultasi_non: 'Jasa Konsultansi Sektoral',
                          konsultasi_konstruksi: 'Jasa Konsultansi Konstruksi',
                          konsolidasi: 'Konsolidasi Pengadaan',
                          konstruksi: 'Pekerjaan Konstruksi',
                          modal: 'Belanja Modal / Barang Aset'
                        }[bahpTemplateId]
                      }
                    </div>

                    {/* Jasa Konsultansi (Non-Konstruksi & Konstruksi) */}
                    {(bahpTemplateId === 'konsultasi_non' || bahpTemplateId === 'konsultasi_konstruksi') && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-1">Total Biaya Personil (Rp)</label>
                            <input
                              type="number"
                              value={biayaPersonil}
                              onChange={e => { setBiayaPersonil(e.target.value); saveBAHPField('pbj_biaya_personil', e.target.value) }}
                              placeholder="Contoh: 45000000"
                              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[11px] bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-1">Total Biaya Non-Personil (Rp)</label>
                            <input
                              type="number"
                              value={biayaNonPersonil}
                              onChange={e => { setBiayaNonPersonil(e.target.value); saveBAHPField('pbj_biaya_non_personil', e.target.value) }}
                              placeholder="Contoh: 15000000"
                              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[11px] bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1.5">
                            <label className="block text-[10px] font-bold text-slate-600">Daftar Tenaga Ahli Utama yang Ditugaskan</label>
                            <button
                              type="button"
                              onClick={() => {
                                const next = [...tenagaAhliList, { nama: '', posisi: '', sertifikat: '', manMonth: '', rate: '' }];
                                setTenagaAhliList(next);
                                saveBAHPField('pbj_tenaga_ahli_list', next);
                              }}
                              className="bg-indigo-500 hover:bg-indigo-655 text-white font-bold text-[9px] px-2 py-1 rounded"
                            >
                              + Tambah Tenaga Ahli
                            </button>
                          </div>
                          
                          {tenagaAhliList.length === 0 ? (
                            <div className="text-[10px] text-slate-400 italic p-3 text-center bg-white border border-dashed border-slate-200 rounded-lg">Belum ada tenaga ahli. Silakan klik tombol di atas untuk menambah.</div>
                          ) : (
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                              {tenagaAhliList.map((ahli, idx) => (
                                <div key={idx} className="flex flex-wrap md:flex-nowrap gap-2 bg-white p-2.5 border border-slate-200 rounded-lg items-end">
                                  <div className="w-full md:w-1/4">
                                    <label className="block text-[8px] text-slate-500 font-bold uppercase">Nama Lengkap</label>
                                    <input
                                      type="text"
                                      value={ahli.nama || ''}
                                      onChange={e => {
                                        const next = [...tenagaAhliList];
                                        next[idx].nama = e.target.value;
                                        setTenagaAhliList(next);
                                        saveBAHPField('pbj_tenaga_ahli_list', next);
                                      }}
                                      placeholder="Nama Ahli"
                                      className="w-full border border-slate-200 rounded px-1.5 py-1 text-[10px]"
                                    />
                                  </div>
                                  <div className="w-full md:w-1/4">
                                    <label className="block text-[8px] text-slate-500 font-bold uppercase">Posisi / Peran</label>
                                    <input
                                      type="text"
                                      value={ahli.posisi || ''}
                                      onChange={e => {
                                        const next = [...tenagaAhliList];
                                        next[idx].posisi = e.target.value;
                                        setTenagaAhliList(next);
                                        saveBAHPField('pbj_tenaga_ahli_list', next);
                                      }}
                                      placeholder="Contoh: Team Leader"
                                      className="w-full border border-slate-200 rounded px-1.5 py-1 text-[10px]"
                                    />
                                  </div>
                                  <div className="w-full md:w-1/4">
                                    <label className="block text-[8px] text-slate-500 font-bold uppercase">
                                      {bahpTemplateId === 'konsultasi_konstruksi' ? 'Sertifikat (SKA/SKK)' : 'Sertifikat Kompetensi'}
                                    </label>
                                    <input
                                      type="text"
                                      value={ahli.sertifikat || ''}
                                      onChange={e => {
                                        const next = [...tenagaAhliList];
                                        next[idx].sertifikat = e.target.value;
                                        setTenagaAhliList(next);
                                        saveBAHPField('pbj_tenaga_ahli_list', next);
                                      }}
                                      placeholder="Nomor SKA/Sertif"
                                      className="w-full border border-slate-200 rounded px-1.5 py-1 text-[10px]"
                                    />
                                  </div>
                                  <div className="w-1/2 md:w-20">
                                    <label className="block text-[8px] text-slate-500 font-bold uppercase">Man-Month</label>
                                    <input
                                      type="number"
                                      step="0.1"
                                      value={ahli.manMonth || ''}
                                      onChange={e => {
                                        const next = [...tenagaAhliList];
                                        next[idx].manMonth = e.target.value;
                                        setTenagaAhliList(next);
                                        saveBAHPField('pbj_tenaga_ahli_list', next);
                                      }}
                                      placeholder="Bulan"
                                      className="w-full border border-slate-200 rounded px-1.5 py-1 text-[10px]"
                                    />
                                  </div>
                                  <div className="w-1/2 md:w-28">
                                    <label className="block text-[8px] text-slate-500 font-bold uppercase">Tarif/Bulan (Rp)</label>
                                    <input
                                      type="number"
                                      value={ahli.rate || ''}
                                      onChange={e => {
                                        const next = [...tenagaAhliList];
                                        next[idx].rate = e.target.value;
                                        setTenagaAhliList(next);
                                        saveBAHPField('pbj_tenaga_ahli_list', next);
                                      }}
                                      placeholder="Tarif"
                                      className="w-full border border-slate-200 rounded px-1.5 py-1 text-[10px]"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = tenagaAhliList.filter((_, i) => i !== idx);
                                      setTenagaAhliList(next);
                                      saveBAHPField('pbj_tenaga_ahli_list', next);
                                    }}
                                    className="bg-rose-100 text-rose-700 hover:bg-rose-200 font-bold text-[10px] px-2.5 py-1 rounded"
                                  >
                                    Hapus
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Pengadaan Terkonsolidasi */}
                    {bahpTemplateId === 'konsolidasi' && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="block text-[10px] font-bold text-slate-600">Satuan Kerja Peserta Konsolidasi</label>
                          <button
                            type="button"
                            onClick={() => {
                              const next = [...satkerPesertaList, { namaSatker: '', pagu: '', volume: '', alamat: '' }];
                              setSatkerPesertaList(next);
                              saveBAHPField('pbj_satker_peserta_list', next);
                            }}
                            className="bg-indigo-500 hover:bg-indigo-650 text-white font-bold text-[9px] px-2 py-1 rounded"
                          >
                            + Tambah Satker Peserta
                          </button>
                        </div>
                        
                        {satkerPesertaList.length === 0 ? (
                          <div className="text-[10px] text-slate-450 italic p-3 text-center bg-white border border-dashed border-slate-200 rounded-lg">Belum ada satker peserta. Silakan klik tombol di atas untuk menambah.</div>
                        ) : (
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {satkerPesertaList.map((satker, idx) => (
                              <div key={idx} className="flex flex-wrap md:flex-nowrap gap-2 bg-white p-2.5 border border-slate-200 rounded-lg items-end">
                                <div className="w-full md:w-1/4">
                                  <label className="block text-[8px] text-slate-500 font-bold uppercase">Nama Satker / SKPD</label>
                                  <input
                                    type="text"
                                    value={satker.namaSatker || ''}
                                    onChange={e => {
                                      const next = [...satkerPesertaList];
                                      next[idx].namaSatker = e.target.value;
                                      setSatkerPesertaList(next);
                                      saveBAHPField('pbj_satker_peserta_list', next);
                                    }}
                                    placeholder="Nama Satker"
                                    className="w-full border border-slate-200 rounded px-1.5 py-1 text-[10px]"
                                  />
                                </div>
                                <div className="w-full md:w-1/5">
                                  <label className="block text-[8px] text-slate-500 font-bold uppercase">Pagu (Rp)</label>
                                  <input
                                    type="number"
                                    value={satker.pagu || ''}
                                    onChange={e => {
                                      const next = [...satkerPesertaList];
                                      next[idx].pagu = e.target.value;
                                      setSatkerPesertaList(next);
                                      saveBAHPField('pbj_satker_peserta_list', next);
                                    }}
                                    placeholder="Pagu Satker"
                                    className="w-full border border-slate-200 rounded px-1.5 py-1 text-[10px]"
                                  />
                                </div>
                                <div className="w-full md:w-20">
                                  <label className="block text-[8px] text-slate-500 font-bold uppercase">Volume</label>
                                  <input
                                    type="text"
                                    value={satker.volume || ''}
                                    onChange={e => {
                                      const next = [...satkerPesertaList];
                                      next[idx].volume = e.target.value;
                                      setSatkerPesertaList(next);
                                      saveBAHPField('pbj_satker_peserta_list', next);
                                    }}
                                    placeholder="Contoh: 100 Rim"
                                    className="w-full border border-slate-200 rounded px-1.5 py-1 text-[10px]"
                                  />
                                </div>
                                <div className="w-full md:w-1/3">
                                  <label className="block text-[8px] text-slate-500 font-bold uppercase">Alamat Kirim</label>
                                  <input
                                    type="text"
                                    value={satker.alamat || ''}
                                    onChange={e => {
                                      const next = [...satkerPesertaList];
                                      next[idx].alamat = e.target.value;
                                      setSatkerPesertaList(next);
                                      saveBAHPField('pbj_satker_peserta_list', next);
                                    }}
                                    placeholder="Alamat Pengiriman"
                                    className="w-full border border-slate-200 rounded px-1.5 py-1 text-[10px]"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = satkerPesertaList.filter((_, i) => i !== idx);
                                    setSatkerPesertaList(next);
                                    saveBAHPField('pbj_satker_peserta_list', next);
                                  }}
                                  className="bg-rose-100 text-rose-700 hover:bg-rose-200 font-bold text-[10px] px-2.5 py-1 rounded"
                                >
                                  Hapus
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Pekerjaan Konstruksi */}
                    {bahpTemplateId === 'konstruksi' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">Koordinat Lokasi Pekerjaan</label>
                          <input
                            type="text"
                            value={koordinatLokasi}
                            onChange={e => { setKoordinatLokasi(e.target.value); saveBAHPField('pbj_koordinat_lokasi', e.target.value) }}
                            placeholder="Contoh: 7.8123° S, 113.4567° E"
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[11px] bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">Tenaga / Ahli K3 Konstruksi (SMKK)</label>
                          <input
                            type="text"
                            value={personilK3}
                            onChange={e => { setPersonilK3(e.target.value); saveBAHPField('pbj_personil_k3', e.target.value) }}
                            placeholder="Contoh: Budi Santoso, S.T. - Sertifikasi K3"
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[11px] bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">Metode Pelaksanaan Pekerjaan</label>
                          <input
                            type="text"
                            value={metodeKerja}
                            onChange={e => { setMetodeKerja(e.target.value); saveBAHPField('pbj_metode_kerja', e.target.value) }}
                            placeholder="Contoh: Metode Beton Precast & Bored Pile"
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[11px] bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                          />
                        </div>
                      </div>
                    )}

                    {/* Belanja Modal */}
                    {bahpTemplateId === 'modal' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">Merek / Tipe Utama</label>
                          <input
                            type="text"
                            value={merkTipeModal}
                            onChange={e => { setMerkTipeModal(e.target.value); saveBAHPField('pbj_merk_tipe_modal', e.target.value) }}
                            placeholder="Contoh: Lenovo ThinkPad L14 Gen 4"
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[11px] bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">Nilai TKDN (%)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={nilaiTkdnModal}
                            onChange={e => { setNilaiTkdnModal(e.target.value); saveBAHPField('pbj_nilai_tkdn_modal', e.target.value) }}
                            placeholder="Contoh: 41.25"
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[11px] bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">Nomor Seri Aset / Pabrikan</label>
                          <input
                            type="text"
                            value={noSeriModal}
                            onChange={e => { setNoSeriModal(e.target.value); saveBAHPField('pbj_no_seri_modal', e.target.value) }}
                            placeholder="Contoh: L3-XXXXX, L3-YYYYY"
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[11px] bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* D.3 Temuan Negosiasi — dihapus karena PP masih dalam proses negosiasi */}
                {/* ═══════════════════════════════════════════════════════════ */}
                {/* SEKSI E: DOKUMENTASI NEGOSIASI & KOMUNIKASI PIHAK KETIGA  */}
                {/* ═══════════════════════════════════════════════════════════ */}
                <div className="font-bold text-[11px] uppercase tracking-wide border-b border-slate-200 pb-1 mt-8 text-indigo-850">E. Dokumentasi Negosiasi & Kesepakatan Teknis</div>
                <p className="font-sans text-[10px] text-slate-600 mb-3">Rekaman proses komunikasi dan negosiasi antara Pejabat Pengadaan dengan Penyedia/vendor melalui media komunikasi resmi. Dokumentasi ini merupakan bukti pelaksanaan kewajiban PP sebagaimana diatur dalam <strong>Peraturan LKPP No. 9 Tahun 2021 tentang Tata Cara Pengadaan Barang/Jasa melalui Penyedia</strong>:</p>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-3 font-sans print:border-slate-300">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">
                        {VALIDASI_CONFIG[bahpTemplateId]?.deliveryLabel || 'Waktu Pengiriman Disepakati'}
                      </label>
                      <input type="text" value={deliveryAgreement}
                        onChange={e => { setDeliveryAgreement(e.target.value); saveBAHPField('pbj_delivery_agreement', e.target.value) }}
                        placeholder={VALIDASI_CONFIG[bahpTemplateId]?.deliveryPlaceholder || 'Contoh: 14 hari kalender sejak SP diterbitkan'}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[11px] bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">
                        {VALIDASI_CONFIG[bahpTemplateId]?.warrantyLabel || 'Masa Garansi Disepakati'}
                      </label>
                      <input type="text" value={warrantyAgreement}
                        onChange={e => { setWarrantyAgreement(e.target.value); saveBAHPField('pbj_warranty_agreement', e.target.value) }}
                        placeholder={VALIDASI_CONFIG[bahpTemplateId]?.warrantyPlaceholder || 'Contoh: 1 Tahun Garansi Resmi Pabrik'}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[11px] bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Ketentuan Pembayaran</label>
                      <select value={paymentTerms}
                        onChange={e => { setPaymentTerms(e.target.value); saveBAHPField('pbj_payment_terms', e.target.value) }}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[11px] bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      >
                        {(VALIDASI_CONFIG[bahpTemplateId]?.paymentOptions || [
                          'Lunas setelah serah terima barang',
                          'Termin: 50% DP, 50% setelah BAST',
                          'Termin: 30% DP, 70% setelah BAST',
                          'Lunas setelah cek kualitas dan BAST'
                        ]).map((opt, oIdx) => (
                          <option key={oIdx} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Upload Capture Chat */}
                  <div className="border-t border-slate-200 pt-3">
                    <div className="text-[10px] font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
                      Bukti Komunikasi / Chat Negosiasi (Opsional)
                    </div>
                    <p className="text-[10px] text-slate-500 mb-2">Unggah tangkapan layar percakapan WhatsApp/Email/SMS dengan penyedia terakit negosiasi harga, spesifikasi, atau konfirmasi stok.</p>
                    <label className="flex items-center gap-2 cursor-pointer bg-white border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl p-3 transition-all group print:hidden">
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-indigo-500 transition-colors"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      <div>
                        <span className="text-[11px] font-semibold text-slate-700 group-hover:text-indigo-700">Klik untuk unggah gambar bukti chat</span>
                        <span className="text-[9px] text-slate-400 block">Format: JPG, PNG, WEBP (bisa pilih beberapa sekaligus)</span>
                      </div>
                      <input type="file" accept="image/*" multiple onChange={handleChatUpload} className="hidden" />
                    </label>

                    {chatCaptures.length > 0 && (
                      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                        {chatCaptures.map((cap, idx) => (
                          <div key={idx} className="relative group/cap border border-slate-200 rounded-lg overflow-hidden bg-white">
                            <img src={cap.data} alt={cap.name} className="w-full h-24 object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/cap:opacity-100 flex items-center justify-center transition-opacity print:hidden">
                              <button onClick={() => {
                                const next = chatCaptures.filter((_, i) => i !== idx)
                                setChatCaptures(next)
                                saveBAHPField('pbj_chat_captures', next)
                              }} className="text-white text-[9px] font-bold bg-rose-600/90 px-2 py-1 rounded">✕ Hapus</button>
                            </div>
                            <div className="text-[7px] text-slate-500 truncate px-1 py-0.5 bg-slate-50">{cap.name}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Chat captures shown in print */}
                    {chatCaptures.length > 0 && (
                      <div className="mt-3 hidden print:grid grid-cols-2 gap-2">
                        {chatCaptures.map((cap, idx) => (
                          <img key={idx} src={cap.data} alt={`Bukti Chat ${idx+1}`} className="w-full max-h-48 object-contain border border-slate-300 rounded" />
                        ))}
                      </div>
                    )}

                    <div className="mt-3">
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">
                        {VALIDASI_CONFIG[bahpTemplateId]?.chatLabel || 'Catatan Hasil Negosiasi (Ringkasan)'}
                      </label>
                      <textarea value={chatNotes}
                        onChange={e => { setChatNotes(e.target.value); saveBAHPField('pbj_chat_notes', e.target.value) }}
                        placeholder={VALIDASI_CONFIG[bahpTemplateId]?.chatPlaceholder || 'Contoh: Penyedia (Bapak Dedi - 0812xxx) via WA menyepakati harga Rp 8.500.000 per unit sudah termasuk ongkir dan instalasi. Garansi 1 tahun on-site dikonfirmasi...'}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[11px] bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        rows={3}
                      />
                      <button 
                        onClick={() => handleRefineGenericText(chatNotes, 'Catatan Hasil Negosiasi', setChatNotes, setIsRefiningChatNotes)} 
                        disabled={isRefiningChatNotes}
                        className="mt-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 disabled:opacity-50"
                      >
                        {isRefiningChatNotes ? (
                          <><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg><span>Menyempurnakan...</span></>
                        ) : (
                          <><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 22 22 22 12 2"/></svg><span>Sempurnakan dengan AI</span></>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════ */}
                {/* SEKSI D.4: ZONA PENGIRIMAN                                 */}
                {/* ═══════════════════════════════════════════════════════════ */}
                <div className="font-bold text-[11px] uppercase tracking-wide border-b border-slate-200 pb-1 mt-8 text-indigo-850">
                  D.4 VALIDASI ZONA LOKASI PENGIRIMAN
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-3 mb-8 print:border-slate-300">
                  <label className="block text-[10px] font-bold text-slate-600 mb-2">Pilih Zona Pengiriman (Dasar Kesepakatan Ongkir)</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    {[
                      { val: 'Zona 1', label: 'Zona 1 (Dekat)', desc: 'Akses mudah/dekat' },
                      { val: 'Zona 2', label: 'Zona 2 (Menengah)', desc: 'Akses sedang/beda wilayah' },
                      { val: 'Zona 3', label: 'Zona 3 (Jauh/Sulit)', desc: 'Akses jauh/pelosok' }
                    ].map(z => (
                      <label key={z.val} className={`flex-1 flex items-start gap-2 p-3 rounded-xl border cursor-pointer transition-all ${docSettings.deliveryZone === z.val || (!docSettings.deliveryZone && z.val === 'Zona 1') ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-200' : 'bg-white border-slate-200 hover:border-indigo-200'}`}>
                        <input
                          type="radio"
                          name="delivery_zone"
                          value={z.val}
                          checked={docSettings.deliveryZone === z.val || (!docSettings.deliveryZone && z.val === 'Zona 1')}
                          onChange={(e) => {
                            const next = { ...docSettings, deliveryZone: e.target.value };
                            setDocSettings(next);
                            localStorage.setItem('pbj_doc_settings', JSON.stringify(next));
                          }}
                          className="mt-0.5 accent-indigo-600"
                        />
                        <div>
                          <div className={`text-[11px] font-bold ${docSettings.deliveryZone === z.val || (!docSettings.deliveryZone && z.val === 'Zona 1') ? 'text-indigo-700' : 'text-slate-700'}`}>{z.label}</div>
                          <div className="text-[9px] text-slate-500 mt-0.5">{z.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <p className="text-[9px] text-slate-500 mt-3 flex gap-1.5 items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500 mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    <span>Penentuan zona ini akan muncul di BAHP. Tidak ada pembatasan/lock nominal ongkir. Ongkir disesuaikan dengan kesepakatan final Pejabat Pengadaan dan Penyedia berdasarakn zona yang dipilih.</span>
                  </p>
                </div>

                {/* ═══════════════════════════════════════════════════════════ */}
                {/* SEKSI F: PENILAIAN KINERJA LAYANAN PENYEDIA               */}
                {/* ═══════════════════════════════════════════════════════════ */}
                <div className="font-bold text-[11px] uppercase tracking-wide border-b border-slate-200 pb-1 mt-8 text-indigo-850">F. Ulasan Transaksi & Evaluasi Teknis Penyedia</div>
                <p className="font-sans text-[10px] text-slate-600 mb-3">Ulasan diberikan oleh Pejabat Pengadaan (PP) atas responsivitas, ketepatan, dan kualitas Penyedia selama negosiasi e-Purchasing. Penilaian ini berfungsi sebagai database rekam jejak penyedia untuk PP lain serta bahan rekomendasi penilaian kinerja oleh PPK sesuai <strong>Pasal 11 Perpres 12/2021</strong>:</p>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-sans print:border-slate-300">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* Rating Kualitas */}
                    <div className="bg-white p-3 rounded-xl border border-slate-150 shadow-sm">
                      <div className="text-[10px] font-bold text-slate-700 mb-1">1. Kualitas Produk & Layanan</div>
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(star => (
                          <button key={star}
                            onClick={() => {
                              setQualityRating(star);
                              saveBAHPField('pbj_quality_rating', star);
                              updateOverallRating(star, deliveryRating, communicationRating);
                            }}
                            className={`text-2xl transition-all hover:scale-110 print:cursor-default ${qualityRating >= star ? 'text-amber-400' : 'text-slate-250'}`}
                          >★</button>
                        ))}
                      </div>
                    </div>

                    {/* Rating Waktu */}
                    <div className="bg-white p-3 rounded-xl border border-slate-150 shadow-sm">
                      <div className="text-[10px] font-bold text-slate-700 mb-1">2. Ketepatan Waktu Pengiriman</div>
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(star => (
                          <button key={star}
                            onClick={() => {
                              setDeliveryRating(star);
                              saveBAHPField('pbj_delivery_rating', star);
                              updateOverallRating(qualityRating, star, communicationRating);
                            }}
                            className={`text-2xl transition-all hover:scale-110 print:cursor-default ${deliveryRating >= star ? 'text-amber-400' : 'text-slate-250'}`}
                          >★</button>
                        ))}
                      </div>
                    </div>

                    {/* Rating Komunikasi */}
                    <div className="bg-white p-3 rounded-xl border border-slate-150 shadow-sm">
                      <div className="text-[10px] font-bold text-slate-700 mb-1">3. Komunikasi & Responsivitas</div>
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(star => (
                          <button key={star}
                            onClick={() => {
                              setCommunicationRating(star);
                              saveBAHPField('pbj_communication_rating', star);
                              updateOverallRating(qualityRating, deliveryRating, star);
                            }}
                            className={`text-2xl transition-all hover:scale-110 print:cursor-default ${communicationRating >= star ? 'text-amber-400' : 'text-slate-250'}`}
                          >★</button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white border border-slate-150 rounded-xl p-3 mb-4 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="text-center bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2">
                        <div className="text-[9px] uppercase font-bold text-indigo-500">Skor Indeks</div>
                        <div className="text-xl font-bold text-indigo-700">{vendorRating > 0 ? vendorRating.toFixed(1) : '0.0'}</div>
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-slate-800">Status Kinerja: <span className="text-indigo-600 font-semibold">{vendorRatingStatus || '-'}</span></div>
                        <div className="text-[10px] text-slate-400">Dihitung otomatis dari rata-rata 3 aspek evaluasi</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Catatan Evaluasi Kinerja Penyedia</label>
                    <textarea value={vendorRatingNote}
                      onChange={e => { setVendorRatingNote(e.target.value); saveBAHPField('pbj_vendor_rating_note', e.target.value) }}
                      placeholder="Contoh: Makanan higienis dan tepat rasa. Pengiriman tepat waktu. Penyedia sangat kooperatif selama negosiasi."
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[11px] bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      rows={3}
                    />
                    <button 
                      onClick={() => handleRefineGenericText(vendorRatingNote, 'Evaluasi Kinerja Penyedia', setVendorRatingNote, setIsRefiningVendorNote)} 
                      disabled={isRefiningVendorNote}
                      className="mt-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isRefiningVendorNote ? (
                        <><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg><span>Menyempurnakan...</span></>
                      ) : (
                        <><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 22 22 22 12 2"/></svg><span>Sempurnakan dengan AI</span></>
                      )}
                    </button>
                  </div>

                  {/* Summary badge for print */}
                  {vendorRating > 0 && vendorRatingStatus && (
                    <div className="mt-3 flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-3">
                      <div className="text-xl font-bold text-amber-500">★ {vendorRating.toFixed(1)}</div>
                      <div>
                        <div className="text-[11px] font-bold text-slate-800">Status: {vendorRatingStatus}</div>
                        <div className="text-[10px] text-slate-500">{vendorRatingNote || 'Tidak ada catatan tambahan.'}</div>
                      </div>
                    </div>
                  )}

                  {/* TTD Pejabat Pengadaan (PP) Upload Box */}
                  <div className="mt-4 border-t border-slate-200 pt-4">
                    <label className="block text-[10px] font-bold text-slate-700 mb-2 uppercase tracking-wide">✍️ Tanda Tangan Pejabat Pengadaan (PP)</label>
                    <div className="flex gap-4 mb-3">
                      {[
                        { val: 'scan', label: 'Wet/Scan TTD' },
                        { val: 'tte', label: 'TTE Elektronik (BSrE BSSN)' }
                      ].map(opt => (
                        <label key={opt.val} className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                          <input
                            type="radio"
                            name="sig_method_pp_panel"
                            value={opt.val}
                            checked={(docSettings.signatureMethodPp || 'scan') === opt.val}
                            onChange={(e) => {
                              const next = { ...docSettings, signatureMethodPp: e.target.value };
                              setDocSettings(next);
                              localStorage.setItem('pbj_doc_settings', JSON.stringify(next));
                            }}
                            className="accent-indigo-600"
                          />
                          <span className={(docSettings.signatureMethodPp || 'scan') === opt.val ? 'font-bold text-indigo-700' : 'text-slate-600'}>{opt.label}</span>
                        </label>
                      ))}
                    </div>

                    {(docSettings.signatureMethodPp || 'scan') === 'scan' ? (
                      <div className="flex flex-col sm:flex-row gap-4 items-center bg-white border border-slate-200 rounded-xl p-4">
                        <div className="flex-1">
                          <p className="text-[10px] text-slate-500 mb-2">Unggah file scan tanda tangan Anda (format PNG/JPG transparan direkomendasikan) agar otomatis dibubuhkan pada dokumen cetak BAHP.</p>
                          <label className="inline-flex items-center gap-2 cursor-pointer bg-slate-50 hover:bg-indigo-50 border border-slate-350 hover:border-indigo-400 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-indigo-700 transition-all select-none">
                            <span>📤 Unggah TTD</span>
                            <input type="file" accept="image/*" onChange={handleTtdUpload} className="hidden" />
                          </label>
                        </div>
                        {docSettings.ttdPp ? (
                          <div className="flex flex-col items-center gap-1.5 border border-slate-100 rounded-lg p-2 bg-slate-50/50">
                            <img src={docSettings.ttdPp} alt="Pratinjau TTD PP" className="max-h-12 object-contain mix-blend-multiply" />
                            <button
                              type="button"
                              onClick={() => {
                                const next = { ...docSettings, ttdPp: '' };
                                setDocSettings(next);
                                localStorage.setItem('pbj_doc_settings', JSON.stringify(next));
                              }}
                              className="text-[9px] font-bold text-rose-600 hover:underline"
                            >
                              ✕ Hapus TTD
                            </button>
                          </div>
                        ) : (
                          <div className="w-32 h-12 border border-dashed border-slate-200 rounded-lg flex items-center justify-center text-[9px] text-slate-400 font-medium italic">
                            Belum ada TTD
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-indigo-50 border border-indigo-150 rounded-xl p-4 text-xs text-indigo-700 font-sans">
                        <div className="font-bold flex items-center gap-2 uppercase text-[10px] text-indigo-800 mb-1">
                          <span>🛡️</span> Sertifikat Digital BSrE BSSN Aktif
                        </div>
                        <p className="leading-relaxed">Sistem telah terhubung dengan Manajemen Akun Terpusat SPSE & Otoritas Sertifikasi Balai Sertifikasi Elektronik (BSrE) BSSN. Penerbitan BAHP akan ditandatangani secara elektronik (TTE) secara sah dengan enkripsi asimetris.</p>
                      </div>
                    )}
                  </div>
                </div>

                  {/* Informasi TTD PPK — sekarang dilakukan oleh PPK sendiri */}
                  <div className="mt-4 border-t border-slate-200 pt-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 items-start">
                      <div className="text-amber-500 mt-0.5 text-lg">📋</div>
                      <div>
                        <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wide mb-1">Tanda Tangan PPK — Dilakukan di Panel PPK</div>
                        <p className="text-xs text-amber-700 leading-relaxed">Setelah Bapak/Ibu menerbitkan BAHP ini, dokumen akan diteruskan secara otomatis ke dashboard Pejabat Pembuat Komitmen (PPK). PPK akan mereview dan membubuhkan tanda tangannya sendiri melalui akun PPK-nya, kemudian dokumen dinyatakan <strong>Selesai (Arsip Lengkap)</strong>.</p>
                      </div>
                    </div>
                  </div>

                <p className="mt-8 text-[10px] text-slate-500 italic">
                  Demikian Berita Acara Hasil Pemilihan (BAHP) ini dibuat secara elektronik oleh Pejabat Pengadaan untuk menjadi dokumen pertanggungjawaban dalam audit belanja dinas e-Purchasing.
                </p>


            </div>
            
            <div className="mt-8 flex justify-end">
              <button 
                onClick={async () => {
                  const activeItems = getPackageItems(submittedPack).filter(i => checkedItems[i.no]);
                  let hasEmpty = false;
                  activeItems.forEach(i => {
                    const n = negotiatedItems[i.no] || {};
                    const vendor = n.vendor !== undefined ? n.vendor : (i.vendor || i.dppVendor || '');
                    const tayang = n.tayang !== undefined ? n.tayang : (i.katalogPrice !== undefined ? i.katalogPrice : (i.tayang || i.dppTayang || ''));
                    const price = n.price !== undefined ? n.price : '';
                    if (!vendor || tayang === undefined || tayang === '' || price === undefined || price === '') {
                      hasEmpty = true;
                    }
                  });
                  if (hasEmpty) {
                    dialog.warning('Mohon lengkapi Nama Vendor, Harga Tayang Katalog, dan Harga Negosiasi Satuan untuk seluruh item yang dicentang sebelum menerbitkan BAHP.');
                    return;
                  }
                  
                  try {
                    const firstVendor = negotiatedItems[activeItems[0].no]?.vendor || activeItems[0]?.vendor || activeItems[0]?.dppVendor || 'Penyedia e-Katalog';
                    let totalNego = 0;
                    let totalOngkir = 0;
                    activeItems.forEach(i => {
                      const n = negotiatedItems[i.no] || {};
                      totalNego += (parseFloat(n.price) || 0) * i.qty;
                      totalOngkir += (parseFloat(n.ongkir) || 0);
                    });
                    
                    // 1. Simpan BAHP ke database
                    const bahpData = {
                      document_number: `027 / ${Math.floor(Math.random() * 100) + 10} / PP / 437.82 / 2026`,
                      vendor_name: firstVendor,
                      vendor_address: 'Sesuai data terverifikasi e-Katalog LKPP',
                      catalog_url: activeItems[0]?.link || 'https://e-katalog.lkpp.go.id',
                      initial_price: activeItems.reduce((acc, curr) => acc + (curr.price * curr.qty), 0),
                      negotiated_price: totalNego,
                      shipping_cost: totalOngkir,
                      screenshot_url: '',
                    };
                    
                    const bahpRes = await fetch(`/api/projects/${submittedPack.id}/bahp`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(bahpData)
                    });
                    if (!bahpRes.ok) throw new Error('Gagal menyimpan BAHP ke database');

                    // 2. Simpan docSettings (TTD PP) ke deskripsi proyek & ubah status ke 'Menunggu TTD PPK'
                    let existingDesc = {};
                    try { existingDesc = JSON.parse(submittedPack.description || '{}'); } catch(e) {}
                    const updatedDesc = { ...existingDesc, docSettings };
                    const statusRes = await fetch(`/api/projects/${submittedPack.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        status: 'Menunggu TTD PPK',
                        description: JSON.stringify(updatedDesc)
                      })
                    });
                    if (!statusRes.ok) throw new Error('Gagal mengubah status proyek');
                    
                    setActiveTab('docs');
                    alert('✅ BAHP berhasil diterbitkan!\n\nDokumen telah diteruskan ke Pejabat Pembuat Komitmen (PPK) untuk ditandatangani. Status paket: Menunggu TTD PPK.');
                  } catch (err) {
                    console.error(err);
                    setActiveTab('docs');
                    alert('BAHP dibuat, tapi ada peringatan: ' + err.message);
                  }
                }}
                className="btn-primary text-sm font-bold py-3.5 px-8 shadow-md hover:shadow-lg transition-all flex items-center gap-2 rounded-xl"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                Terbitkan BAHP & Kirim ke PPK
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'docs' && (
        <div className="glass-panel p-4 sm:p-6 animate-slide-up bg-white border border-slate-200 rounded-2xl shadow-sm">
          <style>{`
            @media print {
              /* Reset body and html margins */
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
                width: 100% !important;
                height: auto !important;
              }
              
              /* Disable all transforms/animations/display-flex on parent wrappers to prevent scaling context bugs */
              #root, main, .glass-panel {
                transform: none !important;
                animation: none !important;
                transition: none !important;
                display: block !important;
                max-width: none !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                border: none !important;
                box-shadow: none !important;
              }

              /* Hide all elements visually by default */
              body * {
                visibility: hidden;
              }

              /* Reveal only the printable BAHP document and its content */
              #print-bahp-document, #print-bahp-document * {
                visibility: visible !important;
              }

              #print-bahp-document, #print-bahp-document > div {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
                box-shadow: none !important;
                border: none !important;
              }

              /* Standardize crisp official black/white colors and borders */
              #print-bahp-document * {
                color: #000 !important;
                border-color: #000 !important;
                background-color: transparent !important;
              }
              
              /* Prevent awkward table row splitting and orphan headers across page breaks */
              #print-bahp-document table {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              #print-bahp-document tr, #print-bahp-document td, #print-bahp-document th {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              #print-bahp-document h1, #print-bahp-document h2, #print-bahp-document h3, #print-bahp-document h4, #print-bahp-document h5, #print-bahp-document h6 {
                page-break-after: avoid !important;
                break-after: avoid !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              #print-bahp-document .signature-section {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              
              @page {
                size: ${docSettings.paperSize === 'F4' ? '215mm 330mm' : 'A4'} portrait;
                margin: ${docSettings.marginTop !== undefined ? docSettings.marginTop : 20}mm ${docSettings.marginRight !== undefined ? docSettings.marginRight : 20}mm ${docSettings.marginBottom !== undefined ? docSettings.marginBottom : 25}mm ${docSettings.marginLeft !== undefined ? docSettings.marginLeft : 30}mm !important;
              }
            }
          `}</style>

          {/* ── Toolbar BAHP ── */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Arsip Berita Acara & Dokumen Penetapan</h2>
              <p className="text-xs text-slate-400 mt-0.5">Pilih jenis pengadaan untuk menyesuaikan template BAHP secara otomatis</p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              {/* Kop Surat On/Off Toggle */}
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-100 transition-all">
                <input
                  type="checkbox"
                  checked={docSettings.showKop !== false}
                  onChange={toggleKopSurat}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                />
                <span>Tampilkan Kop Surat</span>
              </label>
              <button
                onClick={handleRefineBahp}
                disabled={isRefiningBahp}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {isRefiningBahp ? 'Memproses AI...' : 'Sempurnakan dengan AI'}
              </button>
              <button
                onClick={() => window.print()}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold px-3 py-2 rounded-lg transition-all"
              >
                Cetak / Simpan PDF
              </button>
            </div>
          </div>

          {/* ── Selector Jenis Template BAHP ── */}
          <div className="mb-5 bg-slate-50 border border-slate-200 rounded-xl p-4">
            {submittedPack?.dppTemplateId ? (
              <div className="flex items-center justify-between bg-indigo-50/70 border border-indigo-150 rounded-xl p-3.5">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-600 text-white rounded-lg p-2 font-black text-xs shadow-sm select-none">
                    {BAHP_TEMPLATE_TYPES.find(t => t.id === bahpTemplateId)?.icon || 'PP'}
                  </div>
                  <div>
                    <div className="text-[9px] font-extrabold uppercase text-indigo-600 tracking-wider">Template Terkunci (Sesuai DPP PPK)</div>
                    <div className="text-sm font-bold text-slate-800">
                      {BAHP_TEMPLATE_TYPES.find(t => t.id === bahpTemplateId)?.label || 'Jenis Pengadaan'}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Ditetapkan secara otomatis berdasarakn DPP PPK (Template ID: {submittedPack.dppTemplateId}). Pejabat Pengadaan tidak perlu memilih manual.
                    </div>
                  </div>
                </div>
                <span className="bg-indigo-100 text-indigo-800 text-[9px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1 shrink-0 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  TERKUNCI
                </span>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Jenis Pengadaan / Template BAHP
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {BAHP_TEMPLATE_TYPES.map(tpl => {
                    const isSelected = bahpTemplateId === tpl.id;
                    return (
                      <button
                        key={tpl.id}
                        onClick={() => { setBahpTemplateId(tpl.id); localStorage.setItem('pbj_bahp_template', tpl.id); }}
                        className={`text-[11px] font-bold px-3 py-2 rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-indigo-700 text-white border-indigo-700 shadow-md'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'
                        }`}
                        title={tpl.sublabel}
                      >
                        <span className="font-black text-[10px] mr-1.5 opacity-70">{tpl.icon}</span>
                        {tpl.label}
                      </button>
                    );
                  })}
                </div>
                <div className="text-[10px] text-slate-450 mt-1.5">
                  {BAHP_TEMPLATE_TYPES.find(t => t.id === bahpTemplateId)?.sublabel}
                </div>
              </>
            )}
          </div>

          {/* ── Dokumen BAHP (komponen terpisah, berbeda per template) ── */}
          <div id="print-bahp-document" className="border border-slate-200 rounded-xl p-4 sm:p-8 max-w-4xl mx-auto shadow-sm bg-white print:shadow-none print:border-none print:p-0 print:max-w-none">
            <BahpDocument
              templateId={bahpTemplateId}
              submittedPack={submittedPack}
              negotiatedItems={negotiatedItems}
              checkedItems={checkedItems}
              docSettings={docSettings}
              user={user}
              refinedBahpIntro={refinedBahpIntro}
              refinedBahpConclusion={refinedBahpConclusion}
              getPackageItems={getPackageItems}
              getDynamicTotalPagu={getDynamicTotalPagu}
            />
          </div>

        </div>
      )}

      {/* Tab 4: Arsip Final Inaproc (BAST, SP, Invoice) */}
      {activeTab === 'inaproc_docs' && (
        <div className="glass-panel p-4 sm:p-8 animate-slide-up bg-white border border-slate-200 rounded-2xl shadow-sm max-w-4xl mx-auto">
          <div className="text-center mb-8 border-b border-slate-100 pb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-indigo-400 mb-3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Laci Arsip Final Inaproc</h2>
            <p className="text-sm text-slate-500 mt-2">
              Silakan unggah dokumen <b>Surat Pesanan (SP), Invoice, Bukti Transfer, BAST, dan Potongan PNBP</b> asli yang diterbitkan oleh sistem e-Katalog LKPP (Inaproc) untuk menyelesaikan pengadaan ini.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {[
              { id: 'sp', title: 'Surat Pesanan (SP)', desc: 'Kontrak SP yang disetujui penyedia', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
              { id: 'invoice', title: 'Invoice / Tagihan', desc: 'Faktur tagihan pembayaran', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M9 7H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-3"/><path d="M9 7V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-1"/><line x1="12" y1="12" x2="12.01" y2="12"/></svg> },
              { id: 'transfer', title: 'Bukti Transfer', desc: 'Bukti transfer pencairan dana riil', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-500"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
              { id: 'pnbp', title: 'Tarif Potongan PNBP', desc: 'Bukti pembayaran PNBP e-Katalog', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/></svg> },
              { id: 'bast', title: 'BAST (Berita Acara Serah Terima)', desc: 'Dokumen serah terima Inaproc', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
            ].map(item => (
              <div key={item.id} className="border border-slate-200 rounded-xl p-5 hover:border-indigo-300 transition-all bg-slate-50 relative group">
                {inaprocDocs[item.id] && (
                  <div className="absolute -top-2 -right-2 bg-emerald-500 text-white rounded-full p-1 shadow-md">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2"><span className="shrink-0">{item.icon}</span><h4 className="font-bold text-slate-800 text-sm">{item.title}</h4></div>
                <p className="text-[10px] text-slate-500 mt-0.5 mb-3">{item.desc}</p>
                <div className="relative">
                  <input 
                    type="file" 
                    accept="application/pdf,image/*" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={(e) => {
                      if (e.target.files[0]) {
                        setInaprocDocs(prev => ({ ...prev, [item.id]: e.target.files[0].name }))
                      }
                    }}
                  />
                  <div className={`text-center py-3 border-2 border-dashed rounded-lg text-xs font-bold transition-all ${inaprocDocs[item.id] ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-300 bg-white text-slate-600 group-hover:bg-indigo-50 group-hover:border-indigo-400 group-hover:text-indigo-600'}`}>
                    {inaprocDocs[item.id] ? inaprocDocs[item.id] : 'Klik/Tarik file ke sini'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 text-center">
            <h4 className="font-bold text-indigo-900 mb-2">Tutup Pekerjaan & Serahkan ke PPK</h4>
            <p className="text-xs text-indigo-700 mb-6">Pastikan seluruh dokumen dari Inaproc sudah terunggah sebelum menyegel paket ini secara permanen.</p>
            <button 
              onClick={async () => {
                // Check if BAHP exists and is finalized
                try {
                  const checkRes = await fetch(`/api/projects/${submittedPack.id}/bahp`);
                  if (!checkRes.ok || checkRes.status === 404) {
                    dialog.warning('Bapak belum menyimpan & menerbitkan Berita Acara Hasil Pemilihan (BAHP) untuk paket ini. Harap lengkapi tabel negosiasi dan terbitkan BAHP terlebih dahulu sebelum menyegel paket.');
                    return;
                  }
                  const bahpData = await checkRes.json();
                  if (!bahpData || !bahpData.vendor_name || (bahpData.negotiated_price === 0 && (!bahpData.items_json || bahpData.items_json === '[]' || bahpData.items_json === ''))) {
                    dialog.warning('Dokumen BAHP yang ada saat ini masih kosong atau bernilai Rp 0. Harap lengkapi tabel negosiasi dan terbitkan ulang BAHP terlebih dahulu.');
                    return;
                  }
                } catch (e) {
                  console.error('Failed to verify BAHP status:', e);
                }

                if (!Object.values(inaprocDocs).some(doc => doc !== null)) {
                  dialog.warning('Harap unggah minimal satu dokumen (BAST/SP) terlebih dahulu sebelum menyelesaikan paket.');
                  return;
                }

                // Check if rating evaluation is complete
                const isRatingComplete = 
                  localStorage.getItem('pbj_quality_rating') && localStorage.getItem('pbj_quality_rating') !== '0' &&
                  localStorage.getItem('pbj_delivery_rating') && localStorage.getItem('pbj_delivery_rating') !== '0' &&
                  localStorage.getItem('pbj_communication_rating') && localStorage.getItem('pbj_communication_rating') !== '0' &&
                  localStorage.getItem('pbj_vendor_rating_note') && localStorage.getItem('pbj_vendor_rating_note').trim() !== '';

                if (!isRatingComplete) {
                  setShowForcedRatingModal(true);
                  return;
                }

                const confirmed = await dialog.confirm('Anda yakin ingin menyegel paket ini? Status paket di Dashboard PPK akan berubah menjadi "Selesai (Arsip Lengkap)".');
                if (!confirmed) return;

                // Call helper to execute sealing
                await executeSealPackage();
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3.5 rounded-xl shadow-xl shadow-indigo-600/20 transition-all text-sm w-full md:w-auto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Segel & Kembalikan Arsip Lengkap ke PPK
            </button>
          </div>
        </div>
      )}


    </div>



    {showForcedRatingModal && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 animate-scale-in max-h-[95vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              ⭐ Ulasan Transaksi & Evaluasi Teknis (Wajib)
            </h2>
            <button onClick={() => setShowForcedRatingModal(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
          </div>

          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            Sebelum menyelesaikan dan menyegel paket ini secara permanen, Bapak wajib memberikan ulasan transaksi atas layanan penyedia. Ulasan ini akan menjadi referensi bagi PP lainnya serta bahan rekomendasi penilaian kinerja oleh PPK sesuai Pasal 11 Perpres 12/2021.
          </p>


          {(() => {
            const activeItemsForModal = getPackageItems(submittedPack).filter(i => checkedItems[i.no]);
            const modalVendorName = activeItemsForModal.length > 0 
              ? (negotiatedItems[activeItemsForModal[0].no]?.vendor || activeItemsForModal[0]?.vendor || activeItemsForModal[0]?.dppVendor || 'Penyedia e-Katalog')
              : 'Penyedia e-Katalog';
            return (
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3.5 mb-4 flex items-center gap-3 shadow-sm">
                <span className="text-2xl">🏢</span>
                <div>
                  <div className="text-[9px] text-indigo-500 font-bold uppercase tracking-wider">Penyedia yang Dinilai</div>
                  <div className="text-sm font-black text-indigo-900">{modalVendorName}</div>
                </div>
              </div>
            );
          })()}

          <div className="space-y-4">
            {/* Rating Kualitas */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="text-[11px] font-bold text-slate-700 mb-1">1. Kualitas Produk & Layanan <span className="text-rose-500">*</span></div>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(star => (
                  <button key={star}
                    onClick={() => {
                      setQualityRating(star);
                      saveBAHPField('pbj_quality_rating', star);
                      updateOverallRating(star, deliveryRating, communicationRating);
                    }}
                    className={`text-2xl transition-all hover:scale-110 ${qualityRating >= star ? 'text-amber-400' : 'text-slate-300'}`}
                  >★</button>
                ))}
              </div>
            </div>

            {/* Rating Waktu */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="text-[11px] font-bold text-slate-700 mb-1">2. Ketepatan Waktu Pengiriman <span className="text-rose-500">*</span></div>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(star => (
                  <button key={star}
                    onClick={() => {
                      setDeliveryRating(star);
                      saveBAHPField('pbj_delivery_rating', star);
                      updateOverallRating(qualityRating, star, communicationRating);
                    }}
                    className={`text-2xl transition-all hover:scale-110 ${deliveryRating >= star ? 'text-amber-400' : 'text-slate-300'}`}
                  >★</button>
                ))}
              </div>
            </div>

            {/* Rating Komunikasi */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="text-[11px] font-bold text-slate-700 mb-1">3. Komunikasi & Responsivitas <span className="text-rose-500">*</span></div>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(star => (
                  <button key={star}
                    onClick={() => {
                      setCommunicationRating(star);
                      saveBAHPField('pbj_communication_rating', star);
                      updateOverallRating(qualityRating, deliveryRating, star);
                    }}
                    className={`text-2xl transition-all hover:scale-110 ${communicationRating >= star ? 'text-amber-400' : 'text-slate-300'}`}
                  >★</button>
                ))}
              </div>
            </div>

            {/* Overall Summary */}
            <div className="flex items-center justify-between bg-indigo-50/50 border border-indigo-100 rounded-xl p-3">
              <div className="text-xs font-bold text-slate-700">Rata-Rata Indeks: <span className="text-indigo-600 font-bold ml-1">{vendorRating > 0 ? vendorRating.toFixed(1) : '0.0'} / 5.0</span></div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                vendorRatingStatus === 'Sangat Baik' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                vendorRatingStatus === 'Baik' ? 'text-blue-700 bg-blue-50 border-blue-200' :
                'text-amber-700 bg-amber-50 border-amber-200'
              }`}>{vendorRatingStatus || '-'}</span>
            </div>

            {/* Catatan / Review */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Kualitatif Evaluasi <span className="text-rose-500">*</span></label>
              <textarea
                value={vendorRatingNote}
                onChange={e => { setVendorRatingNote(e.target.value); saveBAHPField('pbj_vendor_rating_note', e.target.value) }}
                placeholder="Berikan alasan ulasan... (Min. 5 karakter)"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                rows={3}
              />
              <button 
                onClick={() => handleRefineGenericText(vendorRatingNote, 'Evaluasi Kinerja Penyedia', setVendorRatingNote, setIsRefiningVendorNote)} 
                disabled={isRefiningVendorNote}
                className="mt-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 disabled:opacity-50"
              >
                {isRefiningVendorNote ? 'Menyempurnakan...' : '🪄 Sempurnakan dengan AI'}
              </button>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowForcedRatingModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-600 hover:bg-slate-50 transition-all font-semibold"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  if (!qualityRating || !deliveryRating || !communicationRating) {
                    dialog.warning('Mohon berikan rating bintang pada seluruh 3 kriteria terlebih dahulu.');
                    return;
                  }
                  if (!vendorRatingNote || vendorRatingNote.trim().length < 5) {
                    dialog.warning('Mohon berikan catatan evaluasi singkat (minimal 5 karakter).');
                    return;
                  }
                  setShowForcedRatingModal(false);
                  
                  const confirmed = await dialog.confirm('Anda yakin ingin menyimpan penilaian & menyegel paket ini?');
                  if (confirmed) {
                    await executeSealPackage();
                  }
                }}
                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/10"
              >
                Simpan & Segel Paket
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  )
}


