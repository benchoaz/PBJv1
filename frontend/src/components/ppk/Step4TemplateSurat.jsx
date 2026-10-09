import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { usePPK } from './PPKContext';
import { 
  Settings, Printer, Download, ClipboardList, Wand2, ShieldCheck, AlertTriangle, Loader2,
  Car, Building2, Wrench, Plus, Trash2, RotateCcw, PlusCircle, CheckCircle2, FileSpreadsheet, Info, Clock
} from 'lucide-react';
import { DEFAULT_TEMPLATES } from '../TemplateSuratManager';
import BahpDocument from '../pp/BahpDocument';
import { SpkMaintenanceDocument, SkpMaintenanceDocument } from './MaintenanceContracts';
import {
  MAINTENANCE_TYPES,
  getMaintenanceConfig,
  interpolateMaintenanceText,
  formatRupiahIndo,
  formatSatuanClean,
  formatTitleCase
} from '../../config/maintenanceConfig';
import { getTimeConfigForPackage, getDefaultWaktuForPackage } from '../../config/procurementTimeConfig';

export const injectSignatureHelper = (htmlContent, name, nip, imgHtml) => {
  if (!nip) return htmlContent;
  if (name) {
    const safeName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const safeNip = nip.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const sigBlockRegex = new RegExp(`(${safeName})([\\s\\r\\n]+NIP\\.\\s*${safeNip})`, 'g');
    if (htmlContent.match(sigBlockRegex)) {
      return htmlContent.replace(sigBlockRegex, `${imgHtml}$1$2`);
    }
  }
  return htmlContent.replace(new RegExp(`NIP\\.\\s*${nip.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'), `${imgHtml}NIP. ${nip}`);
};

function terbilangHelper(angka) {
  const n = Math.floor(Math.abs(Number(angka) || 0));
  if (n === 0) return "";
  const huruf = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
  if (n < 12) return huruf[n];
  if (n < 20) return (terbilangHelper(n - 10) + " Belas").trim();
  if (n < 100) {
    const puluh = terbilangHelper(Math.floor(n / 10)) + " Puluh";
    const sisa = terbilangHelper(n % 10);
    return (puluh + " " + sisa).trim();
  }
  if (n < 200) {
    return ("Seratus " + terbilangHelper(n - 100)).trim();
  }
  if (n < 1000) {
    const ratus = terbilangHelper(Math.floor(n / 100)) + " Ratus";
    const sisa = terbilangHelper(n % 100);
    return (ratus + " " + sisa).trim();
  }
  if (n < 2000) {
    return ("Seribu " + terbilangHelper(n - 1000)).trim();
  }
  if (n < 1000000) {
    const ribu = terbilangHelper(Math.floor(n / 1000)) + " Ribu";
    const sisa = terbilangHelper(n % 1000);
    return (ribu + " " + sisa).trim();
  }
  if (n < 1000000000) {
    const juta = terbilangHelper(Math.floor(n / 1000000)) + " Juta";
    const sisa = terbilangHelper(n % 1000000);
    return (juta + " " + sisa).trim();
  }
  if (n < 1000000000000) {
    const milyar = terbilangHelper(Math.floor(n / 1000000000)) + " Milyar";
    const sisa = terbilangHelper(n % 1000000000);
    return (milyar + " " + sisa).trim();
  }
  return "Angka terlalu besar";
}

function terbilang(angka) {
  const n = Math.floor(Math.abs(Number(angka) || 0));
  if (n === 0) return "Nol";
  return terbilangHelper(n).replace(/\s+/g, ' ').trim();
}

const getSafeNoSirup = (pack, metadata) => {
  const metaRup = metadata?.id_rup;
  if (metaRup && !String(metaRup).includes('.')) return String(metaRup).trim();

  const packRup = pack?.noSirup || pack?.idPaket;
  if (packRup && !String(packRup).includes('.')) return String(packRup).trim();

  try {
    const raw = localStorage.getItem('pbj_sirup_packages');
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list) && pack?.packName) {
        const cleanPName = pack.packName.toLowerCase().trim();
        const found = list.find(p => {
          const pName = (p.packName || '').toLowerCase().trim();
          return pName === cleanPName || (p.pagu && pack.pagu && Number(p.pagu) === Number(pack.pagu) && (pName.includes(cleanPName) || cleanPName.includes(pName)));
        });
        if (found?.noSirup && !String(found.noSirup).includes('.')) {
          return String(found.noSirup).trim();
        }
      }
    }
  } catch (e) {}

  return '-';
};

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

const formatTanggalIndo = (tglStr, fallbackDateStr) => {
  const dStr = tglStr || fallbackDateStr;
  if (!dStr) return new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  try {
    const str = String(dStr).trim();
    const parts = str.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    return new Date(str).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return String(dStr); }
};

const getTteBadge = (name, nip) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="90" viewBox="0 0 220 90" style="border: 1px solid %23cbd5e1; border-radius: 6px; background: %23f8fafc; font-family: Arial, sans-serif; margin-top: 6px; margin-bottom: 6px; display: inline-block;">
    <rect x="0" y="0" width="220" height="90" fill="%23f8fafc" rx="6" />
    <rect x="10" y="10" width="70" height="70" fill="white" stroke="%23334155" stroke-width="1.5" />
    <path d="M15 15h10v10H15zm0 15h10v10H15zm15-15h10v10H30zm0 15h10v10H30zm15-15h10v10H45zm0 15h10v10H45zm15 0h10v10H60zm0-15h10v10H60z" fill="%23334155" />
    <path d="M20 20h20v20H20zm25 25h15v15H45z" fill="%23000" />
    <text x="90" y="22" font-size="7" font-weight="bold" fill="%230f172a" letter-spacing="0.5">TANDA TANGAN ELEKTRONIK</text>
    <text x="90" y="32" font-size="6" font-weight="bold" fill="%23475569">Sertifikat Elektronik Diterbitkan Oleh:</text>
    <text x="90" y="42" font-size="7" font-weight="black" fill="%231e3a8a">BSrE BSSN</text>
    <line x1="90" y1="48" x2="210" y2="48" stroke="%23cbd5e1" stroke-width="1" />
    <text x="90" y="58" font-size="6.5" font-weight="bold" fill="%230f172a">${name}</text>
    <text x="90" y="68" font-size="6" fill="%23475569">NIP: ${nip}</text>
    <text x="90" y="78" font-size="5" font-weight="bold" fill="%2316a34a">✓ VERIFIED &amp; SECURED BY BSSN</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${svg}`;
};

export default function Step4TemplateSurat() {
  const { 
    selectedPack, currentUser,
    docSettings, setDocSettings,
    packageMetadata, setPackageMetadata,
    dppSpecs, setDppSpecs,
    step, setStep,
    aiError, setAiError,
    hpsValue, isHpsExemptSelected,
    surveyData, hpsPrices, negotiatedPrices, getPackageItems,
    tanggalSurat, setTanggalSurat,
    selectedTplId, setSelectedTplId, autoComparator,
    selectedNdTplId, setSelectedNdTplId,
    comparisons, currentProjectId, status, loadProjectData, handleSimpanPaket
  } = usePPK();

  // Load daftar user dari backend secara dinamis agar data PP & PPK selalu akurat
  const [usersList, setUsersList] = useState(() => {
    try {
      const cached = localStorage.getItem('pbj_users_cache');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setUsersList(data);
          try { localStorage.setItem('pbj_users_cache', JSON.stringify(data)); } catch {}
        }
      })
      .catch(err => console.error('Error fetching users in Step4TemplateSurat:', err));
  }, []);

  const satkerId = selectedPack?.idSatker || currentUser?.idSatker || '';
  const packDept = (selectedPack?.senderDepartment || currentUser?.department || '').toLowerCase();

  const ppUser = useMemo(() => {
    if (!usersList || usersList.length === 0) return null;
    const match = usersList.find(u => {
      if (u.role !== 'PP') return false;
      if (satkerId && u.idSatker && (u.idSatker === satkerId || u.idSatker.includes(satkerId))) return true;
      if (packDept && u.department && (u.department.toLowerCase().includes(packDept) || packDept.includes(u.department.toLowerCase()))) return true;
      return false;
    });
    return match || usersList.find(u => u.role === 'PP') || null;
  }, [usersList, satkerId, packDept]);

  const ppkUser = useMemo(() => {
    if (currentUser && currentUser.role === 'PPK') return currentUser;
    if (!usersList || usersList.length === 0) return null;
    const match = usersList.find(u => {
      if (u.role !== 'PPK') return false;
      if (satkerId && u.idSatker && (u.idSatker === satkerId || u.idSatker.includes(satkerId))) return true;
      if (packDept && u.department && (u.department.toLowerCase().includes(packDept) || packDept.includes(u.department.toLowerCase()))) return true;
      return false;
    });
    return match || currentUser;
  }, [usersList, currentUser, satkerId, packDept]);

  const [activeDocPreview, setActiveDocPreview] = useState(null);
  const [isEnhancingDPP, setIsEnhancingDPP] = useState({});
  const [isFinalizing, setIsFinalizing] = useState(false);

  const handleFinalizeBudget = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const targetId = currentProjectId || selectedPack?.id || urlParams.get('paketId');

    if (!targetId) {
      alert('Simpan draft terlebih dahulu sebelum memfinalisasi.');
      return;
    }
    const isLock = status !== 'Final';
    const confirmMsg = isLock
      ? 'Apakah Anda yakin ingin memfinalisasi DPP dan mengunci komitmen anggaran untuk paket ini?\n\nSeluruh Rincian DPA, Hasil Survei, dan Bukti Screenshot akan disimpan permanen ke Database Sentral. Anggaran HPS paket akan dipotong dari RAK Dashboard.'
      : 'Apakah Anda yakin ingin membuka kunci anggaran?\n\nStatus paket akan kembali menjadi Draft.';
      
    if (!confirm(confirmMsg)) return;

    setIsFinalizing(true);
    try {
      // 💡 CRITICAL PERMANENCE FIX: Simpan 100% data Rincian DPA, Hasil Survei & Bukti Screenshot ke Database Server DULU sebelum mengunci!
      if (isLock && handleSimpanPaket) {
        await handleSimpanPaket(true);
      }

      let res;
      if (isLock) {
        res = await fetch(`/api/projects/${targetId}/finalize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        res = await fetch(`/api/projects/${targetId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Draft' })
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      alert(isLock ? '🔒 Anggaran berhasil dikunci!' : '🔓 Kunci anggaran dibuka kembali. Paket kembali menjadi Draft.');
      if (loadProjectData) {
        await loadProjectData(targetId);
      }
    } catch (err) {
      console.error('Error finalizing/unlocking budget:', err);
      alert('Gagal memproses kunci anggaran: ' + err.message);
    } finally {
      setIsFinalizing(false);
    }
  };


  const enhanceDPPTextWithAI = async (field, currentText) => {
    if (!currentText || !currentText.trim()) return;
    setIsEnhancingDPP(prev => ({ ...prev, [field]: true }));
    try {
      const contextLabel = isMaintenanceDoc
        ? (field === 'spesifikasiLayanan'
            ? `Spesifikasi Layanan & Prosedur Pelaksanaan (${mConfig.label})`
            : field === 'justifikasiMerek'
            ? mConfig.justifikasiLabel
            : `Ketentuan Penyelesaian Pekerjaan & BAST (${mConfig.label})`)
        : (field === 'spesifikasiLayanan'
            ? 'Spesifikasi Layanan Tambahan DPP'
            : field === 'justifikasiMerek'
            ? 'Justifikasi Pemilihan Merek DPP'
            : 'Ketentuan Penyelesaian Pekerjaan & BAST DPP');

      // Ambil SEMUA API key yang tersedia dari DB (satker-specific + global)
      const checkOrder = ['deepseek', 'cohere', 'gemini', 'groq', 'openai', 'anthropic', 'mistral'];
      const providersList = [];
      try {
        const satker = currentUser?.idSatker;
        const keySources = [];

        if (satker) {
          const resSatker = await fetch(`/api/settings/ocr_api_keys_satker_${satker}`);
          if (resSatker.ok) {
            const dataSatker = await resSatker.json();
            if (dataSatker.value) keySources.push(JSON.parse(dataSatker.value));
          }
        }
        const resGlobal = await fetch('/api/settings/ocr_api_keys');
        if (resGlobal.ok) {
          const dataGlobal = await resGlobal.json();
          if (dataGlobal.value) keySources.push(JSON.parse(dataGlobal.value));
        }

        const seen = new Set();
        for (const prov of checkOrder) {
          for (const keys of keySources) {
            if (keys[prov] && !seen.has(prov)) {
              providersList.push({ provider: prov, key: keys[prov] });
              seen.add(prov);
              break;
            }
          }
        }
      } catch (keyErr) {
        console.warn('Gagal mengambil AI key dari DB:', keyErr);
      }

      if (providersList.length === 0) {
        alert('Tidak ada AI API key tersedia. Silakan atur di menu Pemindai Dokumen (AI).');
        return;
      }

      // Coba tiap provider satu per satu hingga berhasil
      let lastError = '';
      for (const { provider, key } of providersList) {
        try {
          const response = await fetch('/api/ai/refine-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              raw_text: currentText,
              context: contextLabel,
              ai_provider: provider,
              ai_key: key,
              maintenance_type: isMaintenanceDoc ? currentJenis : ''
            })
          });
          const data = await response.json();
          if (data.success && data.refined_text) {
            setDppSpecs(prev => ({ ...prev, [field]: data.refined_text }));
            return; // Berhasil, hentikan loop
          }
          lastError = data.error || `Provider ${provider} gagal`;
          console.warn(`[AI Fallback] ${provider} gagal:`, lastError);
        } catch (provErr) {
          lastError = provErr.message;
          console.warn(`[AI Fallback] ${provider} error:`, provErr);
        }
      }
      // Semua provider gagal
      alert(`Gagal memproses teks: ${lastError}`);
    } catch (err) {
      console.error('Enhance error:', err);
      alert('Terjadi kesalahan saat memproses AI.');
    } finally {
      setIsEnhancingDPP(prev => ({ ...prev, [field]: false }));
    }
  };


  
  const getPacketCategory = (packName) => {
    const name = (packName || '').toLowerCase();
    if (name.includes('pemeliharaan') || name.includes('perawatan') || name.includes('servis') || name.includes('service')) return 'Pemeliharaan';
    if (name.includes('prasmanan') || name.includes('katering')) return 'Mamin-Prasmanan';
    if (name.includes('nasi kotak') || name.includes('nasi bungkus')) return 'Mamin-Bungkus';
    if (name.includes('snack') || name.includes('kue')) return 'Mamin-Snack';
    if (name.includes('mamin') || name.includes('makanan')) return 'Mamin-Bungkus';
    if (name.includes('modal') || name.includes('mesin') || name.includes('elektronik') || name.includes('peralatan')) return 'Modal';
    if (name.includes('konsolidasi')) return 'Konsolidasi';
    if (name.includes('jasa')) return 'Jasa';
    return 'ATK';
  };

  const cat = getPacketCategory(selectedPack?.packName || '');
  let defaultTplId = 'TPL-006A';
  if (cat === 'Mamin') defaultTplId = 'TPL-006B';
  else if (cat === 'Modal') defaultTplId = 'TPL-006C';
  else if (cat === 'Pemeliharaan') defaultTplId = 'TPL-006F';
  else if (cat === 'Jasa' || cat === 'Konstruksi') defaultTplId = 'TPL-006D';
  else if (cat === 'Konsolidasi') defaultTplId = 'TPL-006E';

  const isMaintenanceDoc = selectedTplId === 'TPL-006F' ||
    (!selectedTplId && (cat === 'Pemeliharaan' || defaultTplId === 'TPL-006F')) ||
    (selectedPack?.packName || '').toLowerCase().includes('pemeliharaan') ||
    (selectedPack?.packName || '').toLowerCase().includes('perawatan') ||
    (selectedPack?.packName || '').toLowerCase().includes('servis');

  const currentJenis = dppSpecs.jenisPemeliharaan || 'kendaraan';
  const mConfig = getMaintenanceConfig(currentJenis);

  const handleSelectJenisPemeliharaan = (newJenisId) => {
    const cfg = getMaintenanceConfig(newJenisId);
    const prevJenis = dppSpecs.jenisPemeliharaan;
    const isChanged = prevJenis !== newJenisId;
    
    const nextObjects = (!dppSpecs.maintenanceObjects || dppSpecs.maintenanceObjects.length === 0 || isChanged)
      ? JSON.parse(JSON.stringify(cfg.sampleObjects || []))
      : dppSpecs.maintenanceObjects;
      
    const nextParams = {
      ...(cfg.defaultParams || {}),
      ...(dppSpecs.maintenanceParams || {})
    };

    setDppSpecs(prev => ({
      ...prev,
      jenisPemeliharaan: newJenisId,
      maintenanceObjects: nextObjects,
      maintenanceParams: nextParams,
      spesifikasiLayanan: interpolateMaintenanceText(cfg.defaultSpesifikasiLayanan, nextParams),
      justifikasiMerek: cfg.defaultJustifikasiMerek,
      ketentuanBAST: cfg.defaultKetentuanBAST,
      metodePemilihan: nextParams.metodePemilihan || 'E-Purchasing'
    }));
  };

  const handleAddMaintenanceObject = () => {
    const newRow = { id: Date.now() };
    mConfig.objekColumns.forEach(col => {
      newRow[col.key] = col.default || '';
    });
    setDppSpecs(prev => ({
      ...prev,
      maintenanceObjects: [...(prev.maintenanceObjects || []), newRow]
    }));
  };

  const handleUpdateMaintenanceObject = (idx, key, val) => {
    setDppSpecs(prev => {
      const list = [...(prev.maintenanceObjects || [])];
      if (list[idx]) {
        list[idx] = { ...list[idx], [key]: val };
      }
      return { ...prev, maintenanceObjects: list };
    });
  };

  const handleDeleteMaintenanceObject = (idx) => {
    setDppSpecs(prev => {
      const list = (prev.maintenanceObjects || []).filter((_, i) => i !== idx);
      return { ...prev, maintenanceObjects: list };
    });
  };

  const handleResetSampleObjects = () => {
    setDppSpecs(prev => ({
      ...prev,
      maintenanceObjects: JSON.parse(JSON.stringify(mConfig.sampleObjects || []))
    }));
  };

  const handleAddHpsItem = (kategori = 'Jasa/Upah') => {
    const newItem = {
      id: Date.now(),
      kategori,
      nama: '',
      volume: 1,
      satuan: kategori === 'Jasa/Upah' ? 'Kegiatan' : 'Pcs',
      hargaSatuan: 0
    };
    setDppSpecs(prev => ({
      ...prev,
      maintenanceHpsItems: [...(prev.maintenanceHpsItems || []), newItem]
    }));
  };

  const handleUpdateHpsItem = (idx, key, val) => {
    setDppSpecs(prev => {
      const list = [...(prev.maintenanceHpsItems || [])];
      if (list[idx]) {
        list[idx] = { ...list[idx], [key]: val };
      }
      return { ...prev, maintenanceHpsItems: list };
    });
  };

  const handleDeleteHpsItem = (idx) => {
    setDppSpecs(prev => {
      const list = (prev.maintenanceHpsItems || []).filter((_, i) => i !== idx);
      return { ...prev, maintenanceHpsItems: list };
    });
  };

  const handleLoadHpsFromDpa = () => {
    const dpaItems = getPackageItems(selectedPack).filter(item => (item.qty === '' ? 0 : (item.qty || 0)) > 0);
    if (!dpaItems || dpaItems.length === 0) {
      alert('Tidak ada item DPA pada paket ini.');
      return;
    }
    const converted = dpaItems.map((it, idx) => {
      const lower = (it.name || '').toLowerCase();
      const isJasa = lower.includes('jasa') || lower.includes('upah') || lower.includes('ongkos') || lower.includes('servis') || lower.includes('service') || lower.includes('tune');
      return {
        id: Date.now() + idx,
        kategori: isJasa ? 'Jasa/Upah' : 'Bahan/Suku Cadang',
        nama: it.name,
        volume: it.qty || 1,
        satuan: formatSatuanClean(it.unit, it.name),
        hargaSatuan: hpsPrices[it.name] !== undefined ? hpsPrices[it.name] : (it.price || 0)
      };
    });
    setDppSpecs(prev => ({
      ...prev,
      maintenanceHpsItems: converted
    }));
  };

  // Perhitungan Anggaran HPS Jasa Pemeliharaan
  const jasaHpsItems = (dppSpecs.maintenanceHpsItems || []).filter(item => item.kategori === 'Jasa/Upah');
  const bahanHpsItems = (dppSpecs.maintenanceHpsItems || []).filter(item => item.kategori !== 'Jasa/Upah');
  const subtotalJasa = jasaHpsItems.reduce((acc, it) => acc + ((parseFloat(it.volume) || 0) * (parseFloat(it.hargaSatuan) || 0)), 0);
  const subtotalBahan = bahanHpsItems.reduce((acc, it) => acc + ((parseFloat(it.volume) || 0) * (parseFloat(it.hargaSatuan) || 0)), 0);
  const subtotalHpsBeforeTax = subtotalJasa + subtotalBahan;
  const includePpn = dppSpecs.maintenanceParams?.includePpn !== false;
  const nilaiPpn = includePpn ? Math.round(subtotalHpsBeforeTax * 0.11) : 0;
  const totalHpsPemeliharaan = subtotalHpsBeforeTax + nilaiPpn;

  const getActiveSurveyData = () => surveyData;
  const parseSmartColons = (t) => t;

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
          if (src.startsWith('data:image/') && !src.includes('svg+xml')) {
            // Already a valid base64 non-svg image, skip fetch
          } else {
            const res = await fetch(absoluteSrc);
            const blob = await res.blob();
            
            if (blob.type === 'image/svg+xml' || absoluteSrc.toLowerCase().includes('.svg')) {
               // Word cannot render SVG. Convert SVG to PNG using Canvas.
               const base64Png = await new Promise((resolve, reject) => {
                   const svgUrl = URL.createObjectURL(blob);
                   const imgObj = new Image();
                   imgObj.onload = () => {
                       const canvas = document.createElement('canvas');
                       canvas.width = imgObj.width || 150;
                       canvas.height = imgObj.height || 150;
                       const ctx = canvas.getContext('2d');
                       ctx.drawImage(imgObj, 0, 0);
                       resolve(canvas.toDataURL('image/png'));
                       URL.revokeObjectURL(svgUrl);
                   };
                   imgObj.onerror = reject;
                   imgObj.src = svgUrl;
               });
               img.setAttribute('src', base64Png);
            } else {
               // Compress image to JPEG to reduce data/file size of exported Word document
               const compressedBase64 = await new Promise((resolve, reject) => {
                   const imgUrl = URL.createObjectURL(blob);
                   const imgObj = new Image();
                   imgObj.onload = () => {
                       const canvas = document.createElement('canvas');
                       // Reduce resolution: max width 600px is perfect for Word layout (keeps file size tiny)
                       const maxWidth = 600;
                       let targetWidth = imgObj.width || 600;
                       let targetHeight = imgObj.height || 400;
                       
                       if (targetWidth > maxWidth) {
                           const ratio = maxWidth / targetWidth;
                           targetWidth = maxWidth;
                           targetHeight = Math.round(targetHeight * ratio);
                       }
                       
                       canvas.width = targetWidth;
                       canvas.height = targetHeight;
                       const ctx = canvas.getContext('2d');
                       ctx.drawImage(imgObj, 0, 0, targetWidth, targetHeight);
                       
                       // Export to JPEG with 0.6 quality for excellent size reduction
                       resolve(canvas.toDataURL('image/jpeg', 0.6));
                       URL.revokeObjectURL(imgUrl);
                   };
                   imgObj.onerror = (err) => {
                       URL.revokeObjectURL(imgUrl);
                       reject(err);
                   };
                   imgObj.src = imgUrl;
               });
               img.setAttribute('src', compressedBase64);
            }
          }
        } catch (err) {
          console.warn('Failed to convert image to base64 for Word export:', src, err);
        }
      }

      // Force inline styling for compatibility in Word (Exclude Logo)
      if (!img.classList.contains('logo-instansi')) {
        img.style.width = '100%';
        img.style.maxWidth = '280px';
        img.style.height = 'auto';
        img.style.display = 'block';
        img.style.margin = '4px auto';
        img.style.border = '1px solid #cbd5e1'; // slate-300
        
        // CRITICAL FOR WORD EXPORT: Explicit width attribute prevents Word from blowing up the image
        img.setAttribute('width', '450');
      } else {
        // Keep logo compact
        img.style.width = '70px';
        img.style.height = 'auto';
        img.setAttribute('width', '70');
        img.setAttribute('height', '76');
      }
    }

    // 2. Format tables for Word Compatibility (force physical borders and spacing)
    const tables = Array.from(clone.querySelectorAll('table'));
    tables.forEach(table => {
      // Exclude layout tables like Kop Surat from receiving borders
      if (table.classList.contains('no-border')) {
        table.setAttribute('border', '0');
        table.style.border = 'none';
        const cells = Array.from(table.querySelectorAll('td, th'));
        cells.forEach(cell => { cell.style.border = 'none'; });
        return;
      }

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

    // 4. Convert flex signature sections into Word table
    const flexSignatures = Array.from(clone.querySelectorAll('.signature-section.flex'));
    flexSignatures.forEach(sig => {
      const flexChildren = Array.from(sig.children);
      const table = document.createElement('table');
      table.style.width = '100%';
      table.style.marginTop = '24px';
      table.setAttribute('border', '0');
      table.setAttribute('cellspacing', '0');
      table.setAttribute('cellpadding', '0');
      table.className = 'no-border';
      
      const tr = document.createElement('tr');
      flexChildren.forEach(child => {
        const td = document.createElement('td');
        if (child.classList.contains('text-center') || child.classList.contains('w-max')) {
           td.style.width = '40%';
           td.style.textAlign = 'center';
           td.style.verticalAlign = 'bottom';
        } else {
           td.style.width = '60%';
           td.style.verticalAlign = 'bottom';
        }
        td.innerHTML = child.innerHTML;
        tr.appendChild(td);
      });
      table.appendChild(tr);
      sig.replaceWith(table);
    });

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
            mso-page-orientation: portrait;
            mso-header-margin: 35.4pt;
            mso-footer-margin: 35.4pt;
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
    <>
      {/* Document Generation Action Center */}
              {(hpsValue || isHpsExemptSelected) && (
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 space-y-4">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Informasi Surat &amp; Penetapan</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">Lengkapi informasi di bawah ini agar sesuai dengan paket yang dikerjakan sebelum dicetak.</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Lokasi Pekerjaan / Tujuan</label>
                      <input type="text" value={packageMetadata.lokasi_pekerjaan} onChange={(e) => setPackageMetadata({...packageMetadata, lokasi_pekerjaan: e.target.value})} placeholder={`Contoh: Kantor ${currentUser?.department || 'Kecamatan'}`} className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Waktu Pelaksanaan</label>
                      <input type="text" value={packageMetadata.waktu_penyelesaian} onChange={(e) => setPackageMetadata({...packageMetadata, waktu_penyelesaian: e.target.value})} placeholder="Contoh: 14 (empat belas) hari kalender" className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nomor Program</label>
                      <input type="text" value={packageMetadata.nomor_program || ''} onChange={(e) => setPackageMetadata({...packageMetadata, nomor_program: e.target.value})} placeholder="Contoh: 7.01..." className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nama Program</label>
                      <input type="text" value={packageMetadata.program} onChange={(e) => setPackageMetadata({...packageMetadata, program: e.target.value})} placeholder="Nama Program" className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nomor Kegiatan</label>
                      <input type="text" value={packageMetadata.nomor_kegiatan || ''} onChange={(e) => setPackageMetadata({...packageMetadata, nomor_kegiatan: e.target.value})} placeholder="Contoh: 7.01.03..." className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nama Kegiatan</label>
                      <input type="text" value={packageMetadata.kegiatan} onChange={(e) => setPackageMetadata({...packageMetadata, kegiatan: e.target.value})} placeholder="Nama Kegiatan" className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nomor Sub Kegiatan</label>
                      <input type="text" value={packageMetadata.nomor_sub_kegiatan || ''} onChange={(e) => setPackageMetadata({...packageMetadata, nomor_sub_kegiatan: e.target.value})} placeholder="Contoh: 7.01.03..." className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nama Sub Kegiatan</label>
                      <input type="text" value={packageMetadata.sub_kegiatan} onChange={(e) => setPackageMetadata({...packageMetadata, sub_kegiatan: e.target.value})} placeholder="Nama Sub Kegiatan" className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Sumber Dana</label>
                      <input type="text" value={packageMetadata.sumber_dana || ''} onChange={(e) => setPackageMetadata({...packageMetadata, sumber_dana: e.target.value})} placeholder="Sumber Dana" className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nomor DPP (Manual)</label>
                      <input type="text" value={packageMetadata.nomor_dpp || ''} onChange={(e) => setPackageMetadata({...packageMetadata, nomor_dpp: e.target.value})} placeholder="Opsional (Kosongi jika otomatis)" className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tanggal DPP</label>
                      <input type="date" value={packageMetadata.tanggal_dpp || ''} onChange={(e) => setPackageMetadata({...packageMetadata, tanggal_dpp: e.target.value})} className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nomor Nota Dinas (Manual)</label>
                      <input type="text" value={packageMetadata.nomor_nd || ''} onChange={(e) => setPackageMetadata({...packageMetadata, nomor_nd: e.target.value})} placeholder="Opsional (Kosongi jika otomatis)" className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tanggal Nota Dinas</label>
                      <input type="date" value={packageMetadata.tanggal_nd || ''} onChange={(e) => setPackageMetadata({...packageMetadata, tanggal_nd: e.target.value})} className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">ID RUP (SiRUP LKPP)</label>
                      <input 
                        type="text" 
                        value={packageMetadata.id_rup ?? (selectedPack?.noSirup && !selectedPack.noSirup.includes('.') ? selectedPack.noSirup : '')}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPackageMetadata(prev => ({ ...prev, id_rup: val }));
                          setSelectedPack(prev => prev ? ({ ...prev, noSirup: val }) : prev);
                        }} 
                        placeholder="Contoh: 65302934" 
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none transition-colors" 
                      />
                    </div>
                    {isMaintenanceDoc && (
                      <>
                        <div>
                          <label className="block text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1">Nomor SPK Pemeliharaan (Manual)</label>
                          <input 
                            type="text" 
                            value={packageMetadata.nomor_spk || ''} 
                            onChange={(e) => setPackageMetadata({...packageMetadata, nomor_spk: e.target.value})} 
                            placeholder="Contoh: 000.3.1/029/SPK/KEC.BESUK/2026 (Opsional)" 
                            className="w-full text-xs px-3 py-2 border border-amber-300 rounded-lg focus:border-amber-500 bg-amber-50/30 outline-none transition-colors" 
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1">Nomor SKP Kesanggupan (Manual)</label>
                          <input 
                            type="text" 
                            value={packageMetadata.nomor_skp || ''} 
                            onChange={(e) => setPackageMetadata({...packageMetadata, nomor_skp: e.target.value})} 
                            placeholder="Contoh: 001/SKP/BENGKEL/X/2026 (Opsional)" 
                            className="w-full text-xs px-3 py-2 border border-emerald-300 rounded-lg focus:border-emerald-500 bg-emerald-50/30 outline-none transition-colors" 
                          />
                        </div>
                      </>
                    )}

                  </div>

                  {/* Pemilihan Template DPP */}
                  <div className="mb-6 p-4 border rounded-xl bg-blue-50 border-blue-200">
                    <div className="font-bold text-blue-900 text-sm mb-3 flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-blue-700" />
                      <span>Pilih Template Dokumen Persiapan Pengadaan (DPP)</span>
                    </div>
                    
                    <select
                      value={selectedTplId || ''}
                      onChange={(e) => setSelectedTplId(e.target.value)}
                      className="w-full bg-white text-xs px-3 py-2.5 border border-blue-300 rounded-lg focus:border-indigo-500 outline-none transition-colors"
                    >
                      <option value="">-- Pilih Manual atau Biarkan Otomatis --</option>
                      {(() => {
                          try {
                            const tStr = localStorage.getItem('pbj_templates');
                            let tpls = tStr ? JSON.parse(tStr) : [];
                            if (!tpls || tpls.length === 0) {
                              tpls = DEFAULT_TEMPLATES.filter(t => t.category === 'Tahap Persiapan');
                            }
                            return tpls.map(t => (
                              <option key={t.id} value={t.id}>{t.name} ({t.id})</option>
                            ));
                          } catch(e) { return null; }
                      })()}
                    </select>

                  </div>

                  {/* Status Komitmen Anggaran */}
                  <div className={`mb-6 p-4 border rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pointer-events-auto relative z-20 ${status === 'Final' ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${status === 'Final' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                        {status === 'Final' ? <ShieldCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Status Komitmen Anggaran</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {status === 'Final' 
                            ? 'Anggaran terkunci. Nilai HPS dipotong dari RAK Dashboard.' 
                            : 'Anggaran belum dikunci. Lakukan finalisasi agar terintegrasi ke RAK.'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleFinalizeBudget}
                      disabled={isFinalizing}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm hover:scale-105 active:scale-95 shrink-0 cursor-pointer ${
                        status === 'Final' 
                          ? 'bg-rose-500 hover:bg-rose-600 text-white border border-rose-600 shadow-md' 
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50'
                      }`}
                    >
                      {isFinalizing ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Memproses...
                        </>
                      ) : status === 'Final' ? (
                        <>
                          🔓 Buka Kunci Anggaran
                        </>
                      ) : (
                        <>
                          🔒 Finalisasi & Kunci Anggaran
                        </>
                      )}
                    </button>
                  </div>

                  {/* Pengaturan Khusus Kerangka Surat DPP */}
                  {isMaintenanceDoc ? (
                    <div className="mb-6 p-4 border rounded-xl bg-gradient-to-br from-indigo-50/70 via-blue-50/50 to-slate-50 border-indigo-200 space-y-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-indigo-100">
                        <div className="font-bold text-indigo-900 text-sm flex items-center gap-2">
                          <Wand2 className="w-5 h-5 text-indigo-600" />
                          <span>Pengaturan Spesifik DPP Jasa Pemeliharaan & AI Refinement</span>
                        </div>
                        <span className="text-[11px] font-semibold px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-full border border-indigo-200">
                          Template: TPL-006F (Jasa Pemeliharaan)
                        </span>
                      </div>

                      {/* 1. Selector Jenis Pemeliharaan */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                          Pilih Jenis Pemeliharaan
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {MAINTENANCE_TYPES.map(mType => {
                            const isSelected = (dppSpecs.jenisPemeliharaan || 'kendaraan') === mType.id;
                            const IconComponent = mType.id === 'kendaraan' ? Car : mType.id === 'gedung' ? Building2 : Wrench;
                            return (
                              <button
                                key={mType.id}
                                type="button"
                                disabled={status === 'Final'}
                                onClick={() => handleSelectJenisPemeliharaan(mType.id)}
                                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                                  isSelected
                                    ? 'bg-white border-indigo-600 shadow-md ring-2 ring-indigo-500/20'
                                    : 'bg-white/70 border-slate-200 hover:border-indigo-300 hover:bg-white text-slate-700'
                                }`}
                              >
                                <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                  <IconComponent className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-xs text-slate-900 leading-tight">{mType.label}</div>
                                  <div className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{mType.description}</div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Warning Regulasi Jika Gedung/Bangunan */}
                      {mConfig.warningClassification && (
                        <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-xs flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div className="leading-relaxed">{mConfig.warningClassification}</div>
                        </div>
                      )}

                      {/* 2. Tabel Objek Pemeliharaan Dinamis */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                              <span>{mConfig.objekTitle}</span>
                              <span className="text-[11px] font-normal text-slate-500">({(dppSpecs.maintenanceObjects || []).length} entri)</span>
                            </h4>
                            <p className="text-[11px] text-slate-500">Tabel ini akan otomatis terlampir pada BAB II Spesifikasi Teknis DPP.</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={status === 'Final'}
                              onClick={handleResetSampleObjects}
                              className="text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Muat contoh data kendaraan/gedung standar"
                            >
                              <RotateCcw className="w-3 h-3 text-slate-500" />
                              <span>Muat Data Contoh</span>
                            </button>
                            <button
                              type="button"
                              disabled={status === 'Final'}
                              onClick={handleAddMaintenanceObject}
                              className="text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg shadow-sm transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Tambah Objek</span>
                            </button>
                          </div>
                        </div>

                        <div className="overflow-x-auto border border-slate-200 rounded-lg">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
                              <tr>
                                <th className="p-2 w-10 text-center">No</th>
                                {mConfig.objekColumns.map(col => (
                                  <th key={col.key} className={`p-2 ${col.width || ''}`}>{col.label}</th>
                                ))}
                                <th className="p-2 w-12 text-center">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {(dppSpecs.maintenanceObjects || []).length === 0 ? (
                                <tr>
                                  <td colSpan={mConfig.objekColumns.length + 2} className="p-4 text-center text-slate-400 italic">
                                    Belum ada objek pemeliharaan. Klik "Tambah Objek" atau "Muat Data Contoh".
                                  </td>
                                </tr>
                              ) : (
                                (dppSpecs.maintenanceObjects || []).map((obj, idx) => (
                                  <tr key={obj.id || idx} className="hover:bg-slate-50/50">
                                    <td className="p-2 text-center font-semibold text-slate-500">{idx + 1}</td>
                                    {mConfig.objekColumns.map(col => (
                                      <td key={col.key} className="p-1.5">
                                        {col.type === 'select' ? (
                                          <select
                                            disabled={status === 'Final'}
                                            value={obj[col.key] || col.default || ''}
                                            onChange={(e) => handleUpdateMaintenanceObject(idx, col.key, e.target.value)}
                                            className="w-full text-xs px-2 py-1 border border-slate-200 rounded focus:border-indigo-500 outline-none bg-white"
                                          >
                                            {col.options.map(opt => (
                                              <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                          </select>
                                        ) : (
                                          <input
                                            type="text"
                                            disabled={status === 'Final'}
                                            value={obj[col.key] || ''}
                                            placeholder={col.placeholder || ''}
                                            onChange={(e) => handleUpdateMaintenanceObject(idx, col.key, e.target.value)}
                                            className="w-full text-xs px-2 py-1 border border-slate-200 rounded focus:border-indigo-500 outline-none"
                                          />
                                        )}
                                      </td>
                                    ))}
                                    <td className="p-1.5 text-center">
                                      <button
                                        type="button"
                                        disabled={status === 'Final'}
                                        onClick={() => handleDeleteMaintenanceObject(idx)}
                                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors disabled:opacity-30 cursor-pointer"
                                        title="Hapus baris"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* 3. Parameter Pelaksanaan & SLA */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                        <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                          Parameter Pelaksanaan, SLA & Legalitas Penyedia
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                          {dppSpecs.jenisPemeliharaan === 'kendaraan' && (
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                Radius Maksimal Bengkel
                              </label>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  disabled={status === 'Final'}
                                  value={dppSpecs.maintenanceParams?.jarakMaksimalBengkelKm ?? 15}
                                  onChange={(e) => setDppSpecs({
                                    ...dppSpecs,
                                    maintenanceParams: { ...dppSpecs.maintenanceParams, jarakMaksimalBengkelKm: Number(e.target.value) }
                                  })}
                                  className="w-20 text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none"
                                />
                                <span className="text-[11px] text-slate-500">km dari Besuk</span>
                              </div>
                            </div>
                          )}

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Waktu Pelaksanaan
                              </label>
                              <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                                {dppSpecs.jenisPemeliharaan === 'gedung' ? 'Gedung' : 'Kendaraan'}
                              </span>
                            </div>
                            <input
                              type="text"
                              disabled={status === 'Final'}
                              value={dppSpecs.waktu || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setDppSpecs({ ...dppSpecs, waktu: val });
                                setPackageMetadata(prev => ({ ...prev, waktu_penyelesaian: val }));
                              }}
                              placeholder={dppSpecs.jenisPemeliharaan === 'gedung' ? '30 (tiga puluh) hari kalender' : '7 (tujuh) hari kalender'}
                              className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none"
                            />
                            {/* Preset chips */}
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(dppSpecs.jenisPemeliharaan === 'gedung' 
                                ? ['14 Hari', '30 Hari (1 Bulan)', '45 Hari']
                                : ['3 Hari', '7 Hari', '14 Hari']
                              ).map((lbl, idx) => {
                                const fullVal = dppSpecs.jenisPemeliharaan === 'gedung'
                                  ? (lbl === '14 Hari' ? '14 (empat belas) hari kalender' : lbl === '45 Hari' ? '45 (empat puluh lima) hari kalender' : '30 (tiga puluh) hari kalender')
                                  : (lbl === '3 Hari' ? '3 (tiga) hari kalender' : lbl === '14 Hari' ? '14 (empat belas) hari kalender' : '7 (tujuh) hari kalender');
                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    disabled={status === 'Final'}
                                    onClick={() => {
                                      setDppSpecs({ ...dppSpecs, waktu: fullVal });
                                      setPackageMetadata(prev => ({ ...prev, waktu_penyelesaian: fullVal }));
                                    }}
                                    className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                                      (dppSpecs.waktu || '').includes(lbl.split(' ')[0])
                                        ? 'bg-indigo-600 text-white border-indigo-700 font-bold'
                                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                                    }`}
                                  >
                                    {lbl}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                              Masa Garansi / Servis
                            </label>
                            <input
                              type="text"
                              disabled={status === 'Final'}
                              value={dppSpecs.maintenanceParams?.masaGaransi || dppSpecs.maintenanceParams?.masaPemeliharaanHasilPekerjaan || (dppSpecs.jenisPemeliharaan === 'gedung' ? '30 (tiga puluh) hari kalender' : '1 (satu) bulan atau 1.000 km')}
                              onChange={(e) => setDppSpecs({
                                ...dppSpecs,
                                maintenanceParams: {
                                  ...dppSpecs.maintenanceParams,
                                  masaGaransi: e.target.value,
                                  masaPemeliharaanHasilPekerjaan: e.target.value
                                }
                              })}
                              className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                              Metode Pemilihan
                            </label>
                            <select
                              disabled={status === 'Final'}
                              value={dppSpecs.metodePemilihan || 'E-Purchasing'}
                              onChange={(e) => setDppSpecs({ ...dppSpecs, metodePemilihan: e.target.value })}
                              className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none bg-white"
                            >
                              <option value="E-Purchasing">E-Purchasing (Katalog)</option>
                              <option value="Pengadaan Langsung">Pengadaan Langsung</option>
                              <option value="Negosiasi Harga">Negosiasi Harga</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            KBLI / Kualifikasi Usaha Penyedia
                          </label>
                          <input
                            type="text"
                            disabled={status === 'Final'}
                            value={dppSpecs.maintenanceParams?.kbli || mConfig.defaultKbli || ''}
                            onChange={(e) => setDppSpecs({
                              ...dppSpecs,
                              maintenanceParams: { ...dppSpecs.maintenanceParams, kbli: e.target.value }
                            })}
                            className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none"
                          />
                        </div>
                      </div>

                      {/* 4. Rincian HPS Jasa Pemeliharaan (Jasa/Upah vs Suku Cadang/Bahan) */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
                              <span>Rincian HPS: Jasa/Upah vs Suku Cadang/Bahan</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                                Total: Rp {formatRupiahIndo(totalHpsPemeliharaan)}
                              </span>
                            </h4>
                            <p className="text-[11px] text-slate-500">
                              Memisahkan komponen biaya jasa dan material/suku cadang secara transparan untuk audit HPS.
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              disabled={status === 'Final'}
                              onClick={handleLoadHpsFromDpa}
                              className="text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <FileSpreadsheet className="w-3 h-3 text-slate-500" />
                              <span>Salin dari DPA</span>
                            </button>
                            <button
                              type="button"
                              disabled={status === 'Final'}
                              onClick={() => handleAddHpsItem('Jasa/Upah')}
                              className="text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <Plus className="w-3 h-3" />
                              <span>+ Jasa/Upah</span>
                            </button>
                            <button
                              type="button"
                              disabled={status === 'Final'}
                              onClick={() => handleAddHpsItem('Bahan/Suku Cadang')}
                              className="text-[10px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <Plus className="w-3 h-3" />
                              <span>+ Suku Cadang/Bahan</span>
                            </button>
                          </div>
                        </div>

                        <div className="overflow-x-auto border border-slate-200 rounded-lg">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
                              <tr>
                                <th className="p-2 w-8 text-center">No</th>
                                <th className="p-2 w-28">Kategori</th>
                                <th className="p-2">Uraian Pekerjaan / Komponen</th>
                                <th className="p-2 w-20 text-center">Volume</th>
                                <th className="p-2 w-20 text-center">Satuan</th>
                                <th className="p-2 w-32 text-right">Harga Satuan (Rp)</th>
                                <th className="p-2 w-32 text-right">Total (Rp)</th>
                                <th className="p-2 w-10 text-center">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {(dppSpecs.maintenanceHpsItems || []).length === 0 ? (
                                <tr>
                                  <td colSpan={8} className="p-4 text-center text-slate-400 italic">
                                    Belum ada rincian HPS pemeliharaan. Klik "+ Jasa/Upah", "+ Suku Cadang/Bahan", atau "Salin dari DPA".
                                  </td>
                                </tr>
                              ) : (
                                (dppSpecs.maintenanceHpsItems || []).map((it, idx) => {
                                  const rowTotal = (parseFloat(it.volume) || 0) * (parseFloat(it.hargaSatuan) || 0);
                                  return (
                                    <tr key={it.id || idx} className="hover:bg-slate-50/50">
                                      <td className="p-2 text-center font-semibold text-slate-500">{idx + 1}</td>
                                      <td className="p-1.5">
                                        <select
                                          disabled={status === 'Final'}
                                          value={it.kategori || 'Jasa/Upah'}
                                          onChange={(e) => handleUpdateHpsItem(idx, 'kategori', e.target.value)}
                                          className={`w-full text-[11px] font-semibold px-2 py-1 rounded border outline-none ${
                                            it.kategori === 'Jasa/Upah'
                                              ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                          }`}
                                        >
                                          <option value="Jasa/Upah">Jasa / Upah</option>
                                          <option value="Bahan/Suku Cadang">Suku Cadang / Bahan</option>
                                        </select>
                                      </td>
                                      <td className="p-1.5">
                                        <input
                                          type="text"
                                          disabled={status === 'Final'}
                                          value={it.nama || ''}
                                          placeholder="Nama pekerjaan atau suku cadang..."
                                          onChange={(e) => handleUpdateHpsItem(idx, 'nama', e.target.value)}
                                          className="w-full text-xs px-2 py-1 border border-slate-200 rounded focus:border-indigo-500 outline-none"
                                        />
                                      </td>
                                      <td className="p-1.5">
                                        <input
                                          type="number"
                                          step="any"
                                          disabled={status === 'Final'}
                                          value={it.volume ?? 1}
                                          onChange={(e) => handleUpdateHpsItem(idx, 'volume', e.target.value)}
                                          className="w-full text-xs px-2 py-1 border border-slate-200 rounded focus:border-indigo-500 outline-none text-center"
                                        />
                                      </td>
                                      <td className="p-1.5">
                                        <input
                                          type="text"
                                          disabled={status === 'Final'}
                                          value={it.satuan || ''}
                                          placeholder="Paket/Unit/Pcs"
                                          onChange={(e) => handleUpdateHpsItem(idx, 'satuan', e.target.value)}
                                          className="w-full text-xs px-2 py-1 border border-slate-200 rounded focus:border-indigo-500 outline-none text-center"
                                        />
                                      </td>
                                      <td className="p-1.5">
                                        <input
                                          type="number"
                                          disabled={status === 'Final'}
                                          value={it.hargaSatuan ?? 0}
                                          onChange={(e) => handleUpdateHpsItem(idx, 'hargaSatuan', e.target.value)}
                                          className="w-full text-xs px-2 py-1 border border-slate-200 rounded focus:border-indigo-500 outline-none text-right font-mono"
                                        />
                                      </td>
                                      <td className="p-2 text-right font-mono font-semibold text-slate-800">
                                        Rp {formatRupiahIndo(rowTotal)}
                                      </td>
                                      <td className="p-1.5 text-center">
                                        <button
                                          type="button"
                                          disabled={status === 'Final'}
                                          onClick={() => handleDeleteHpsItem(idx)}
                                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors disabled:opacity-30 cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                            {(dppSpecs.maintenanceHpsItems || []).length > 0 && (
                              <tfoot className="bg-slate-50 text-xs font-semibold text-slate-700 border-t border-slate-300">
                                <tr>
                                  <td colSpan={6} className="p-2 text-right">Subtotal Jasa / Upah Tenaga Kerja:</td>
                                  <td className="p-2 text-right font-mono text-indigo-700">Rp {formatRupiahIndo(subtotalJasa)}</td>
                                  <td></td>
                                </tr>
                                <tr>
                                  <td colSpan={6} className="p-2 text-right">Subtotal Suku Cadang / Bahan Material:</td>
                                  <td className="p-2 text-right font-mono text-emerald-700">Rp {formatRupiahIndo(subtotalBahan)}</td>
                                  <td></td>
                                </tr>
                                <tr>
                                  <td colSpan={6} className="p-2 text-right flex items-center justify-end gap-2">
                                    <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] font-normal text-slate-600">
                                      <input
                                        type="checkbox"
                                        disabled={status === 'Final'}
                                        checked={includePpn}
                                        onChange={(e) => setDppSpecs({
                                          ...dppSpecs,
                                          maintenanceParams: { ...dppSpecs.maintenanceParams, includePpn: e.target.checked }
                                        })}
                                        className="rounded border-slate-300 text-indigo-600"
                                      />
                                      <span>PPN 11%</span>
                                    </label>
                                  </td>
                                  <td className="p-2 text-right font-mono text-slate-600">Rp {formatRupiahIndo(nilaiPpn)}</td>
                                  <td></td>
                                </tr>
                                <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                                  <td colSpan={6} className="p-2 text-right">TOTAL HPS PEMELIHARAAN:</td>
                                  <td className="p-2 text-right font-mono text-indigo-900 text-sm">Rp {formatRupiahIndo(totalHpsPemeliharaan)}</td>
                                  <td></td>
                                </tr>
                              </tfoot>
                            )}
                          </table>
                        </div>

                        {/* Indikator Pagu */}
                        <div className="flex flex-wrap items-center justify-between text-xs pt-1">
                          <span className="text-slate-500">
                            Pagu Anggaran Paket: <strong>Rp {formatRupiahIndo(selectedPack?.pagu || 0)}</strong>
                          </span>
                          {totalHpsPemeliharaan > (selectedPack?.pagu || 0) && (selectedPack?.pagu || 0) > 0 ? (
                            <span className="text-rose-600 font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Total HPS melebihi pagu sebesar Rp {formatRupiahIndo(totalHpsPemeliharaan - (selectedPack?.pagu || 0))}
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              HPS sesuai batas pagu (Sisa pagu: Rp {formatRupiahIndo((selectedPack?.pagu || 0) - totalHpsPemeliharaan)})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 5. Tiga Textarea AI Refinement */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Spesifikasi Layanan & Prosedur Pelaksanaan
                              </label>
                              <button
                                type="button"
                                onClick={() => enhanceDPPTextWithAI('spesifikasiLayanan', dppSpecs.spesifikasiLayanan)}
                                disabled={isEnhancingDPP['spesifikasiLayanan'] || status === 'Final'}
                                className="text-[9px] font-bold bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200 transition-colors flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                              >
                                {isEnhancingDPP['spesifikasiLayanan'] ? '✨ Merapikan...' : '✨ Rapikan Bahasa (AI)'}
                              </button>
                            </div>
                            <textarea
                              disabled={status === 'Final'}
                              value={dppSpecs.spesifikasiLayanan || ''}
                              onChange={(e) => setDppSpecs({...dppSpecs, spesifikasiLayanan: e.target.value})}
                              placeholder="Mekanisme pelaksanaan servis, SLA penanganan, garansi hasil pekerjaan..."
                              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none min-h-[90px] resize-y disabled:bg-slate-50 disabled:text-slate-500"
                            ></textarea>
                          </div>

                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                {mConfig.justifikasiLabel}
                              </label>
                              <button
                                type="button"
                                onClick={() => enhanceDPPTextWithAI('justifikasiMerek', dppSpecs.justifikasiMerek)}
                                disabled={isEnhancingDPP['justifikasiMerek'] || status === 'Final'}
                                className="text-[9px] font-bold bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200 transition-colors flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                              >
                                {isEnhancingDPP['justifikasiMerek'] ? '✨ Merapikan...' : '✨ Rapikan Bahasa (AI)'}
                              </button>
                            </div>
                            <textarea
                              disabled={status === 'Final'}
                              value={dppSpecs.justifikasiMerek || ''}
                              onChange={(e) => setDppSpecs({...dppSpecs, justifikasiMerek: e.target.value})}
                              placeholder={mConfig.justifikasiPlaceholder}
                              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none min-h-[90px] resize-y disabled:bg-slate-50 disabled:text-slate-500"
                            ></textarea>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              Ketentuan Penyelesaian Pekerjaan & BAST (Syarat Pelunasan)
                            </label>
                            <button
                              type="button"
                              onClick={() => enhanceDPPTextWithAI('ketentuanBAST', dppSpecs.ketentuanBAST)}
                              disabled={isEnhancingDPP['ketentuanBAST'] || status === 'Final'}
                              className="text-[9px] font-bold bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200 transition-colors flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                            >
                              {isEnhancingDPP['ketentuanBAST'] ? '✨ Merapikan...' : '✨ Rapikan Bahasa (AI)'}
                            </button>
                          </div>
                          <textarea
                            disabled={status === 'Final'}
                            value={dppSpecs.ketentuanBAST || ''}
                            onChange={(e) => setDppSpecs({...dppSpecs, ketentuanBAST: e.target.value})}
                            placeholder="Persyaratan BAST, dokumen lampiran faktur, bukti fisik pergantian suku cadang..."
                            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none min-h-[75px] resize-y disabled:bg-slate-50 disabled:text-slate-500"
                          ></textarea>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Pengaturan Khusus Kerangka Surat DPP Standar (Barang) */
                    <div className="mb-6 p-4 border rounded-xl bg-indigo-50/50 border-indigo-200">
                      <div className="font-bold text-indigo-900 text-sm mb-4 flex items-center gap-2">
                        <Wand2 className="w-5 h-5 text-indigo-600" />
                        <span>Pengaturan Spesifik DPP & Refinement AI</span>
                      </div>

                      {(() => {
                        const timeConfig = getTimeConfigForPackage(selectedPack, selectedTplId, dppSpecs);
                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 bg-white/70 p-3 rounded-xl border border-indigo-100">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>Spesifikasi Waktu Pelaksanaan</span>
                                </label>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${timeConfig.badgeColor}`}>
                                  {timeConfig.label}
                                </span>
                              </div>
                              <input
                                type="text"
                                disabled={status === 'Final'}
                                value={dppSpecs.waktu || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setDppSpecs({ ...dppSpecs, waktu: val });
                                  setPackageMetadata(prev => ({ ...prev, waktu_penyelesaian: val }));
                                }}
                                placeholder={timeConfig.defaultWaktu}
                                className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none font-semibold bg-white"
                              />
                              {timeConfig.presets && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {timeConfig.presets.map((ps, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      disabled={status === 'Final'}
                                      onClick={() => {
                                        setDppSpecs({ ...dppSpecs, waktu: ps.value });
                                        setPackageMetadata(prev => ({ ...prev, waktu_penyelesaian: ps.value }));
                                      }}
                                      className={`text-[9px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                                        (dppSpecs.waktu || '').trim() === ps.value.trim()
                                          ? 'bg-indigo-600 text-white border-indigo-700 font-bold'
                                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                                      }`}
                                    >
                                      {ps.label}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                                  Tempat Tujuan Akhir Pengiriman
                                </label>
                                <button
                                  type="button"
                                  disabled={status === 'Final'}
                                  onClick={() => setDppSpecs({ ...dppSpecs, tempat: `Kantor ${currentUser?.department || 'Kecamatan Besuk'}` })}
                                  className="text-[9px] font-semibold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                                >
                                  Reset Satker
                                </button>
                              </div>
                              <input
                                type="text"
                                disabled={status === 'Final'}
                                value={dppSpecs.tempat || ''}
                                onChange={(e) => setDppSpecs({ ...dppSpecs, tempat: e.target.value })}
                                onBlur={(e) => {
                                  if (e.target.value) setDppSpecs({ ...dppSpecs, tempat: formatTitleCase(e.target.value) });
                                }}
                                placeholder={`Kantor ${currentUser?.department || 'Kecamatan Besuk'}`}
                                className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none font-semibold bg-white"
                              />
                            </div>
                          </div>
                        );
                      })()}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Spesifikasi Layanan Tambahan</label>
                            <button onClick={() => enhanceDPPTextWithAI('spesifikasiLayanan', dppSpecs.spesifikasiLayanan)} disabled={isEnhancingDPP['spesifikasiLayanan'] || status === 'Final'} className="text-[9px] font-bold bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200 transition-colors flex items-center gap-1 disabled:opacity-50 cursor-pointer">
                              {isEnhancingDPP['spesifikasiLayanan'] ? '✨ Merapikan...' : '✨ Rapikan Bahasa (AI)'}
                            </button>
                          </div>
                          <textarea disabled={status === 'Final'} value={dppSpecs.spesifikasiLayanan || ''} onChange={(e) => setDppSpecs({...dppSpecs, spesifikasiLayanan: e.target.value})} placeholder="Contoh: Barang harus diantar beserta teknisi..." className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none min-h-[60px] resize-y disabled:bg-slate-50 disabled:text-slate-500"></textarea>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Justifikasi Pemilihan Merek</label>
                            <button onClick={() => enhanceDPPTextWithAI('justifikasiMerek', dppSpecs.justifikasiMerek)} disabled={isEnhancingDPP['justifikasiMerek'] || status === 'Final'} className="text-[9px] font-bold bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200 transition-colors flex items-center gap-1 disabled:opacity-50 cursor-pointer">
                              {isEnhancingDPP['justifikasiMerek'] ? '✨ Merapikan...' : '✨ Rapikan Bahasa (AI)'}
                            </button>
                          </div>
                          <textarea disabled={status === 'Final'} value={dppSpecs.justifikasiMerek || ''} onChange={(e) => setDppSpecs({...dppSpecs, justifikasiMerek: e.target.value})} placeholder="Contoh: Merek ini sudah teruji kompatibilitasnya..." className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none min-h-[60px] resize-y disabled:bg-slate-50 disabled:text-slate-500"></textarea>
                        </div>
                      </div>

                      <div className="mb-2">
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ketentuan Penyelesaian Pekerjaan & BAST (Syarat Pelunasan)</label>
                          <button onClick={() => enhanceDPPTextWithAI('ketentuanBAST', dppSpecs.ketentuanBAST)} disabled={isEnhancingDPP['ketentuanBAST'] || status === 'Final'} className="text-[9px] font-bold bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200 transition-colors flex items-center gap-1 disabled:opacity-50 cursor-pointer">
                            {isEnhancingDPP['ketentuanBAST'] ? '✨ Merapikan...' : '✨ Rapikan Bahasa (AI)'}
                          </button>
                        </div>
                        <textarea disabled={status === 'Final'} value={dppSpecs.ketentuanBAST || ''} onChange={(e) => setDppSpecs({...dppSpecs, ketentuanBAST: e.target.value})} placeholder="Penyelesaian paket pengadaan dan pencairan pembayaran 100% dilaksanakan setelah seluruh hasil pekerjaan diterima dengan baik serta ditandatangani Berita Acara Serah Terima (BAST) oleh PPK." className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none min-h-[60px] resize-y disabled:bg-slate-50 disabled:text-slate-500"></textarea>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 pointer-events-auto">
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
                      className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 px-5 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
                    >
                      Lihat Dokumen DPP PPK
                    </button>
                    <button
                      onClick={() => setActiveDocPreview('bahp')}
                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 hover:border-indigo-300 px-5 py-3 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
                    >
                      📜 Lihat & Download BAHP (Hasil Pemilihan)
                    </button>
                    {isMaintenanceDoc && (
                      <>
                        <button
                          onClick={() => setActiveDocPreview('spk')}
                          className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 px-5 py-3 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
                        >
                          🛠️ Lihat SPK (Surat Perintah Kerja)
                        </button>
                        <button
                          onClick={() => setActiveDocPreview('skp')}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-5 py-3 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
                        >
                          🛡️ Lihat SKP (Kesanggupan Pemeliharaan)
                        </button>
                      </>
                    )}
                  </div>
                  
                  {/* Action Buttons Step 4 */}
                  <div className="flex justify-end mt-8 border-t border-slate-200 pt-6 print:hidden">
                    <button
                      onClick={() => setStep(5)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-2"
                    >
                      Lanjut ke TTE & Pengiriman &rarr;
                    </button>
                  </div>
                  </div>
              )}

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
              .bahp-sheet, #bahp-sheet {
                padding: 0 !important;
                margin: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
              }
              
              /* Table formatting & pagination breaks */
              table {
                width: 100% !important;
                border-collapse: collapse !important;
                page-break-inside: auto !important;
                font-size: calc(1em - 1pt) !important;
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
          <div className="fixed top-4 left-4 right-4 flex flex-col md:flex-row justify-between items-center z-50 bg-white/95 border border-slate-200/90 px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-md max-w-7xl mx-auto print:hidden transition-all duration-300 gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-slate-800 text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 mr-2">
                <span className="w-2 h-2 rounded-full bg-slate-800 animate-pulse"></span>
                {activeDocPreview === 'hps' ? 'Surat Penetapan HPS' : activeDocPreview === 'nd' ? 'Nota Dinas Usulan' : activeDocPreview === 'bahp' ? 'BAHP' : activeDocPreview === 'spk' ? 'Surat Perintah Kerja (SPK)' : activeDocPreview === 'skp' ? 'Surat Kesanggupan (SKP)' : 'DPP PPK'}
              </div>
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 gap-1">
                <button
                  type="button"
                  onClick={() => setActiveDocPreview('dpp')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeDocPreview === 'dpp' ? 'bg-white text-indigo-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  DPP
                </button>
                {!isHpsExemptSelected && (
                  <button
                    type="button"
                    onClick={() => setActiveDocPreview('hps')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeDocPreview === 'hps' ? 'bg-white text-indigo-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    HPS
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveDocPreview('nd')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeDocPreview === 'nd' ? 'bg-white text-indigo-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Nota Dinas
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDocPreview('bahp')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeDocPreview === 'bahp' ? 'bg-white text-indigo-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  BAHP
                </button>
                {isMaintenanceDoc && (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveDocPreview('spk')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${activeDocPreview === 'spk' ? 'bg-amber-500 text-white shadow-sm' : 'text-amber-800 bg-amber-50 hover:bg-amber-100'}`}
                    >
                      🛠️ SPK
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveDocPreview('skp')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${activeDocPreview === 'skp' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100'}`}
                    >
                      🛡️ SKP
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => window.location.href = '/admin/templates'}
                className="bg-sky-100 hover:bg-sky-200 text-sky-800 font-bold text-xs px-4 py-2 rounded-xl border border-sky-300 shadow-sm transition-all flex items-center gap-1.5"
                title="Atur Logo dan Kop Surat secara global"
              >
                <Settings className="w-4 h-4 text-sky-800" />
                <span>Pengaturan Kop &amp; Logo</span>
              </button>
              <button
                onClick={() => window.print()}
                className="bg-emerald-600 hover:bg-emerald-750 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-600/10"
              >
                <Printer className="w-4 h-4 text-white" />
                <span>Cetak / Unduh PDF</span>
              </button>
              <button
                onClick={handleExportWord}
                className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4 text-white" />
                <span>Export Word (.doc)</span>
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

 className="bg-white text-slate-900 w-full shadow-2xl rounded-sm my-20 border border-slate-200 relative print:my-0 print:border-none print:shadow-none mx-auto flex-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-4 transition-shadow"
 style={{
 width: docSettings.paperSize === 'F4' ? '215mm' : '210mm',
 minHeight: docSettings.paperSize === 'F4' ? '330mm' : '297mm',
 paddingTop: activeDocPreview === 'bahp' ? '0mm' : `${docSettings.marginTop}mm`,
 paddingRight: activeDocPreview === 'bahp' ? '0mm' : `${docSettings.marginRight}mm`,
 paddingBottom: activeDocPreview === 'bahp' ? '0mm' : `${docSettings.marginBottom}mm`,
 paddingLeft: activeDocPreview === 'bahp' ? '0mm' : `${docSettings.marginLeft}mm`,
 fontFamily: docSettings.fontFamily === 'Bookman Old Style' 
 ? "'Bookman Old Style', Georgia, serif" 
 : docSettings.fontFamily === 'Arial' 
 ? "Arial, Helvetica, sans-serif" 
 : "'Times New Roman', Times, serif",
 fontSize: docSettings.fontSize || '12pt',
 lineHeight: docSettings.lineHeight || '1.15'
 }}
 >
 <div>
 {/* KOP SURAT DINAS / SATKER */}
 {docSettings.showKop && activeDocPreview !== 'bahp' && activeDocPreview !== 'skp' && (
 <div className="w-full mb-6" style={{ pageBreakInside: 'avoid', fontFamily: '"Times New Roman", Times, serif' }}>
 <table className="no-border" style={{ width: '100%', borderCollapse: 'collapse', borderBottom: '3px solid black', marginBottom: '2px' }}>
 <tbody>
 <tr>
 <td style={{ width: '15%', verticalAlign: 'middle', textAlign: 'center', paddingBottom: '10px' }}>
 <img 
 className="logo-instansi"
 src={docSettings.logoType === 'pemda' ? "https://upload.wikimedia.org/wikipedia/commons/2/25/Lambang_Kabupaten_Probolinggo.png" : docSettings.logoType === 'garuda' ? "https://upload.wikimedia.org/wikipedia/commons/2/29/Garuda_Pancasila_Coat_of_Arms_of_Indonesia.svg" : docSettings.customLogo ? docSettings.customLogo : "https://upload.wikimedia.org/wikipedia/commons/2/25/Lambang_Kabupaten_Probolinggo.png"}
 alt="Logo Instansi" 
 style={{ maxHeight: '76px', maxWidth: '76px', objectFit: 'contain', display: 'inline-block' }} 
 />
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
 <div className="text-center font-bold font-sans -mt-3 text-slate-700">
 NOMOR: 027 / 142 / PPK / 437.82 / {new Date().getFullYear()}
 </div>
 <div className="text-center font-bold uppercase tracking-wider -mt-1">
 TENTANG<br />
 PENETAPAN HARGA PERKIRAAN SENDIRI (HPS)
 </div>
 <div className="text-center font-bold uppercase text-slate-800">
 PEKERJAAN: "{selectedPack?.packName}"
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
 <table className="w-full border-collapse border border-slate-900 ">
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
 {getPackageItems(selectedPack).filter(item => (item.qty === '' ? 0 : (item.qty || 0)) > 0).map((item, idx) => {
 const unitHpsPrice = hpsPrices[item.name] !== undefined ? hpsPrices[item.name] : item.price;
 const surveyProduct = surveyData?.products?.find(p => p.name === item.name);
 const displayName = surveyProduct?.name || item.name;
 return (
 <tr key={item.no}>
 <td className="border border-slate-900 p-2 text-center">{item.no}</td>
 <td className="border border-slate-900 p-2 text-left font-medium">{displayName}</td>
 <td className="border border-slate-900 p-2 text-center font-bold">{item.qty}</td>
 <td className="border border-slate-900 p-2 text-center">{item.unit}</td>
 <td className="border border-slate-900 p-2 font-mono text-right">
   {unitHpsPrice.toLocaleString()}
 </td>
 <td className="border border-slate-900 p-2 font-mono font-bold text-right">
   {(item.qty * unitHpsPrice).toLocaleString()}
 </td>
 </tr>
 );
 })}
 <tr className="bg-slate-50 font-bold">
 <td colSpan="5" className="border border-slate-900 p-2 text-right">Jumlah Total Nilai HPS (Termasuk PPN & Pajak):</td>
 <td className="border border-slate-900 p-2 text-indigo-700 font-mono font-bold text-right">
   {parseInt(hpsValue).toLocaleString()}
 </td>
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
 ) : activeDocPreview === 'bahp' ? (
  // BERITA ACARA HASIL PEMILIHAN (BAHP E-PURCHASING)
  <BahpDocument
    templateId={(() => {
      const name = (selectedPack?.packName || '').toLowerCase();
      if (name.includes('pemeliharaan') || name.includes('servis')) return 'pemeliharaan';
      if (name.includes('mamin') || name.includes('snack') || name.includes('makan')) return 'mamin';
      if (name.includes('laptop') || name.includes('printer') || name.includes('komputer') || name.includes('mesin') || name.includes('modal')) return 'modal';
      if (name.includes('jasa') || name.includes('konstruksi')) return 'jasa';
      if (name.includes('seragam') || name.includes('konsolidasi')) return 'seragam';
      return 'atk';
    })()}
    submittedPack={selectedPack}
    negotiatedItems={(() => {
      const map = {};
      const sData = getActiveSurveyData();
      const sProducts = sData?.products || [];
      const items = getPackageItems(selectedPack);
      items.forEach((item, idx) => {
        const matchedProd = sProducts.find(p => p.id === item.id || p.name === item.name) || sProducts[idx] || {};
        const tayangPrice = hpsPrices[item.name] !== undefined ? hpsPrices[item.name] : (matchedProd.price || item.price);
        const negoPrice = (negotiatedPrices && negotiatedPrices[item.name] !== undefined)
          ? negotiatedPrices[item.name]
          : tayangPrice;
        
        let sImg = matchedProd.img || matchedProd.searchImg || item.img || null;
        if (sImg && typeof sImg === 'string' && sImg.startsWith('/screenshots/')) {
          sImg = window.location.origin + sImg;
        }

        const autoComps = (matchedProd.comparators || []).map(c => {
          let cImg = c.img || c.screenshot || c.screenshotUrl || null;
          if (cImg && typeof cImg === 'string' && cImg.startsWith('/screenshots/')) {
            cImg = window.location.origin + cImg;
          }
          return {
            name: c.name || item.name,
            vendor: c.vendor || '-',
            price: c.price,
            link: c.link || c.url || 'https://e-katalog.lkpp.go.id',
            screenshotUrl: cImg
          };
        });

        const vendorName = (matchedProd.vendor && matchedProd.vendor !== 'TIDAK DITEMUKAN')
          ? matchedProd.vendor
          : (item.vendor || item.dppVendor || '-');

        const prodLink = matchedProd.link || item.link || 'https://e-katalog.lkpp.go.id';

        map[item.no] = {
          price: negoPrice,
          tayang: tayangPrice,
          vendor: vendorName,
          linkSelected: prodLink,
          screenshotUrl: sImg,
          screenshot: sImg,
          autoComparators: autoComps,
          note: 'Sesuai Hasil survei & negosiasi E-Purchasing'
        };
      });
      return map;
    })()}
    checkedItems={(() => {
      const map = {};
      const items = getPackageItems(selectedPack);
      items.forEach(item => { map[item.no] = true; });
      return map;
    })()}
    docSettings={docSettings || {}}
    user={currentUser}
    ppUser={ppUser}
    ppkUser={ppkUser}
    getPackageItems={getPackageItems}
  />
  ) : activeDocPreview === 'nd' ? (
 // NOTA DINAS USULAN PENGADAAN
 <div className="space-y-4 relative">
 {(() => {
 const templatesStr = localStorage.getItem('pbj_templates');
 let templates = [];
 try { if (templatesStr) templates = JSON.parse(templatesStr); } catch (e) {}
 if (!templates || templates.length === 0) templates = DEFAULT_TEMPLATES;
 
 const ndTemplate = templates.find(t => t.id === selectedNdTplId) || templates.find(t => t.id === 'TPL-001');
 
 if (ndTemplate) {
 let content = ndTemplate.content;
 
 // Add centered title for default Nota Dinas
 if (ndTemplate.id === 'TPL-001' && !content.includes('NOTA DINAS')) {
    const dynamicNd = packageMetadata.nomor_nd || '{{nomor_nd}}';
    content = `<div class="text-center mb-6"><div class="font-bold text-lg underline leading-none mb-1">NOTA DINAS</div><div class="leading-none">Nomor : ${dynamicNd}</div></div>\n` + content;
 }
 
 // Force remove legacy signature block from cached templates to prevent duplication
 content = content.replace(/Pejabat Pembuat Komitmen \(PPK\),?[\s\S]*?\{\{nama_ppk\}\}[\s\S]*?NIP\. \{\{nip_ppk\}\}/gi, '');

 const currentDocSettingsStr = localStorage.getItem('pbj_doc_settings');
 const docSettingsFallback = currentDocSettingsStr ? JSON.parse(currentDocSettingsStr) : null;
 const nomorBase = docSettingsFallback ? (docSettingsFallback.formatNomorSurat || '027/{nomor}/BPBJ/2026') : '027/{nomor}/BPBJ/2026';
 
 const isBesuk = currentUser?.department?.toLowerCase().includes('besuk');
 const defaultAlamat = isBesuk ? 'Jl. Raya Besuk Nomor 37 Besuk Probolinggo - 67283' : (docSettingsFallback?.alamatLengkap || 'Komplek Perkantoran Pemerintah Daerah');
 const defaultTempat = isBesuk ? 'Besuk' : (currentUser?.department || 'Probolinggo');

 // Replace variables
 const replacements = {
 '{{nama_satker}}': currentUser?.department || 'Bagian Pengadaan Barang dan Jasa (BPBJ)',
 '{{nama_satker_kapital}}': (currentUser?.department || 'Bagian Pengadaan Barang dan Jasa (BPBJ)').toUpperCase(),
 '{{alamat_satker}}': docSettingsFallback ? docSettingsFallback.alamatLengkap : defaultAlamat,
 '{{nama_pekerjaan}}': (selectedPack.packName || '').replace(/\n/g, ' '),
 '{{nilai_pagu}}': `Rp ${(selectedPack.pagu || 0).toLocaleString()} (${terbilang(selectedPack.pagu || 0)} Rupiah)`,
 '{{sumber_dana}}': `${packageMetadata.sumber_dana || selectedPack.sumberDana || 'APBD'} Tahun Anggaran ${new Date().getFullYear()}`,
 '{{tahun_anggaran}}': `${new Date().getFullYear()}`,
 '{{nama_ppk}}': ppkUser?.name || currentUser?.name || 'Handik Hariyanto, S.Kom., M.Si',
 '{{nip_ppk}}': ppkUser?.nip || currentUser?.nip || '197909102002121004',
 '{{nomor_surat}}': nomorBase.replace('{nomor}', '045.2'),
 '{{nomor_nd}}': nomorBase.replace('{nomor}', '011/ND'),
 '{{nama_penyedia}}': '_______________________',
 '{{hari_tanggal_acara}}': '_______________________',
 '{{waktu_acara}}': '_______________________',
 '{{tempat_acara}}': '_______________________',
 '{{nama_pejabat_pengadaan}}': ppUser?.name || 'Beni Trisna Wijaya, S.Kom',
 '{{nip_pejabat_pengadaan}}': ppUser?.nip || '198205192010011010',
 '{{nomor_ba}}': nomorBase.replace('{nomor}', '108/BAKN'),
 '{{hari_ba}}': '_______________________',
 '{{tanggal_ba}}': '_______________________',
 '{{harga_penawaran}}': '_______________________',
 '{{harga_negosiasi}}': '_______________________',
 '{{nomor_bahp}}': nomorBase.replace('{nomor}', '112/BAHP'),
 '{{nilai_hps}}': '_______________________',
 '{{nama_penyedia_terpilih}}': '_______________________',
 '{{harga_final}}': '_______________________',
 '{{tempat_penetapan}}': defaultTempat,
 '{{nomor_sp}}': nomorBase.replace('{nomor}', '115/SP'),
 '{{alamat_penyedia}}': '_______________________',
 '{{nilai_kontrak}}': '_______________________',
 '{{waktu_penyelesaian}}': dppSpecs.waktu || packageMetadata.waktu_penyelesaian || '14 (empat belas) hari kalender',
 '{{nomor_dpp}}': packageMetadata.nomor_dpp || '................................',
 '{{tanggal_dpp}}': formatTanggalIndo(packageMetadata.tanggal_dpp, tanggalSurat),
 '{{nomor_hps}}': nomorBase.replace('{nomor}', '014/HPS'),
 '{{tanggal_hps}}': formatTanggalIndo(packageMetadata.tanggal_hps || packageMetadata.tanggal_dpp, tanggalSurat),
 '{{lokasi_pekerjaan}}': packageMetadata.lokasi_pekerjaan || (docSettingsFallback ? docSettingsFallback.namaInstansi : 'Komplek Perkantoran Pemerintah Daerah'),
 '{{program}}': packageMetadata.program || 'Program Penunjang Urusan Pemerintahan Daerah',
 '{{kegiatan}}': packageMetadata.kegiatan || 'Penyelenggaraan Pemerintahan dan Pelayanan Publik',
 '{{sub_kegiatan}}': packageMetadata.sub_kegiatan || 'Penyediaan Barang dan Jasa Perkantoran',
 '{{mak}}': selectedPack.mak || '',
 '{{pdn}}': 'Ya',
 '{{usaha_kecil}}': 'Ya',
 '{{pra_dipa}}': selectedPack.praDipa ? 'Ya' : 'Tidak',
 '{{volume_pekerjaan}}': selectedPack.volume || '1 Paket',
 '{{uraian_pekerjaan}}': `Pengadaan ${selectedPack.packName || ''} untuk operasional`,
 '{{kode_rup}}': getSafeNoSirup(selectedPack, packageMetadata)
 };
 
 Object.keys(replacements).forEach(key => {
 content = content.replace(new RegExp(key, 'g'), replacements[key]);
 });
 
  if (docSettings?.signatureMethodPpk === 'tte' && currentUser?.nip) {
    const tteBadgeSrc = getTteBadge(currentUser?.name || 'PPK', currentUser?.nip);
    const imgHtml = `<img src="${tteBadgeSrc}" alt="TTE PPK" style="display:block; max-height:85px; margin-top:6px; margin-bottom:4px;" />`;
    content = injectSignatureHelper(content, currentUser?.name, currentUser?.nip, imgHtml);
  } else if (docSettings && docSettings.ttdPpk) {
    if (currentUser?.nip) {
      const ttdPpkStyle = 'display:block; max-height:85px; max-width:250px; width:auto; height:auto; object-fit:contain; mix-blend-mode:multiply; margin-top:6px; margin-bottom:4px; filter:contrast(1.2);';
      const imgHtml = `<img src="${docSettings.ttdPpk}" alt="TTD PPK" style="${ttdPpkStyle}" />`;
      content = injectSignatureHelper(content, currentUser?.name, currentUser?.nip, imgHtml);
    } else {
      content = content.replace(/Pejabat Pembuat Komitmen,/g, `Pejabat Pembuat Komitmen,<br/><img src="${docSettings.ttdPpk}" alt="TTD PPK" style="display:block; max-height:85px; max-width:250px; width:auto; height:auto; object-fit:contain; mix-blend-mode:multiply; margin-top:6px; margin-bottom:4px; filter:contrast(1.2);" />`);
    }
  }

  if (docSettings?.signatureMethodPp === 'tte' && replacements['{{nip_pejabat_pengadaan}}'] && replacements['{{nip_pejabat_pengadaan}}'] !== '_______________________') {
    const ppName = replacements['{{nama_pejabat_pengadaan}}'];
    const ppNip = replacements['{{nip_pejabat_pengadaan}}'];
    const tteBadgeSrc = getTteBadge(ppName || 'Pejabat Pengadaan', ppNip);
    const imgHtml = `<img src="${tteBadgeSrc}" alt="TTE PP" style="display:block; max-height:85px; margin-top:6px; margin-bottom:4px;" />`;
    content = injectSignatureHelper(content, ppName, ppNip, imgHtml);
  } else if (docSettings?.ttdPp && replacements['{{nip_pejabat_pengadaan}}'] && replacements['{{nip_pejabat_pengadaan}}'] !== '_______________________') {
    const ppName = replacements['{{nama_pejabat_pengadaan}}'];
    const ppNip = replacements['{{nip_pejabat_pengadaan}}'];
    const imgHtml = `<img src="${docSettings.ttdPp}" alt="TTD PP" style="display:block; max-height:85px; max-width:250px; width:auto; height:auto; object-fit:contain; mix-blend-mode:multiply; margin-top:6px; margin-bottom:4px; filter:contrast(1.2);" />`;
    content = injectSignatureHelper(content, ppName, ppNip, imgHtml);
  }
 
 return <div style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', textAlign: 'justify', fontSize: '12pt', fontFamily: 'Arial, sans-serif' }} dangerouslySetInnerHTML={{ __html: parseSmartColons(content) }} />;
 }
 return <div className="text-center py-10">Template Nota Dinas tidak ditemukan.</div>;
 })()}
 </div>
 ) : activeDocPreview === 'spk' ? (
  <SpkMaintenanceDocument
    selectedPack={selectedPack}
    packageMetadata={packageMetadata}
    dppSpecs={dppSpecs}
    currentUser={currentUser}
    docSettings={docSettings}
    tanggalSurat={tanggalSurat}
  />
 ) : activeDocPreview === 'skp' ? (
  <SkpMaintenanceDocument
    selectedPack={selectedPack}
    packageMetadata={packageMetadata}
    dppSpecs={dppSpecs}
    currentUser={currentUser}
    docSettings={docSettings}
    tanggalSurat={tanggalSurat}
  />
 ) : (
 // DOKUMEN PERSIAPAN PENGADAAN (DPP)
 <div className="space-y-4 relative">
 {/* KOP SURAT DIHAPUS - KOP SURAT GLOBAL SUDAH ADA DI ATAS */}

 {(() => {
 const templatesStr = localStorage.getItem('pbj_templates');
 let templates = [];
 try { if (templatesStr) templates = JSON.parse(templatesStr); } catch (e) {}
 if (!templates || templates.length === 0) templates = DEFAULT_TEMPLATES;

 const cat = getPacketCategory(selectedPack?.packName || '');
 let tplId = 'TPL-006A';
 if (cat === 'Mamin') tplId = 'TPL-006B';
 else if (cat === 'Modal') tplId = 'TPL-006C';
 else if (cat === 'Pemeliharaan') tplId = 'TPL-006F';
 else if (cat === 'Jasa' || cat === 'Konstruksi') tplId = 'TPL-006D';
 else if (cat === 'Konsolidasi') tplId = 'TPL-006E';

 const template = templates.find(t => t.id === selectedTplId) || templates.find(t => t.id === tplId);
 
 if (template && template.content.includes('{{komponen_dinamis_dpp}}')) {
 // Template parsing logic
 let content = template.content;
 
 // Center the DPP title and Nomor
 content = content.replace(/DOKUMEN PERSIAPAN PENGADAAN \(DPP\)\s*Nomor : \{\{nomor_dpp\}\}/i, '<div class="text-center mb-6"><div class="font-bold text-lg underline leading-none mb-1">DOKUMEN PERSIAPAN PENGADAAN (DPP)</div><div class="leading-none mb-2">Nomor : {{nomor_dpp}}</div></div>');
 
 const currentDocSettingsStr = localStorage.getItem('pbj_doc_settings');
 const docSettingsFallback = currentDocSettingsStr ? JSON.parse(currentDocSettingsStr) : null;
 const nomorBase = docSettingsFallback ? (docSettingsFallback.formatNomorSurat || '027/{nomor}/BPBJ/2026') : '027/{nomor}/BPBJ/2026';
 const isBesuk = currentUser?.department?.toLowerCase().includes('besuk');
 const defaultAlamat = isBesuk ? 'Jl. Raya Besuk Nomor 37 Besuk Probolinggo - 67283' : (docSettingsFallback?.alamatLengkap || 'Komplek Perkantoran Pemerintah Daerah');
 const defaultTempat = isBesuk ? 'Besuk' : (currentUser?.department || 'Probolinggo');

 // Replace variables
 const replacements = {
 '{{nama_satker}}': currentUser?.department || 'Bagian Pengadaan Barang dan Jasa (BPBJ)',
 '{{nama_satker_kapital}}': (currentUser?.department || 'Bagian Pengadaan Barang dan Jasa (BPBJ)').toUpperCase(),
 '{{alamat_satker}}': docSettingsFallback ? docSettingsFallback.alamatLengkap : defaultAlamat,
 '{{nama_pekerjaan}}': (selectedPack.packName || '').replace(/\n/g, ' '),
 '{{nilai_pagu}}': `Rp ${(selectedPack.pagu || 0).toLocaleString()} (${terbilang(selectedPack.pagu || 0)} Rupiah)`,
 '{{sumber_dana}}': `${packageMetadata.sumber_dana || selectedPack.sumberDana || 'APBD'} Tahun Anggaran ${new Date().getFullYear()}`,
 '{{tahun_anggaran}}': `${new Date().getFullYear()}`,
 '{{nama_ppk}}': ppkUser?.name || currentUser?.name || 'Handik Hariyanto, S.Kom., M.Si',
 '{{nip_ppk}}': ppkUser?.nip || currentUser?.nip || '197909102002121004',
 '{{nomor_surat}}': nomorBase.replace('{nomor}', '045.2'),
 '{{nomor_nd}}': nomorBase.replace('{nomor}', '011/ND'),
 '{{nama_penyedia}}': '_______________________',
 '{{hari_tanggal_acara}}': '_______________________',
 '{{waktu_acara}}': '_______________________',
 '{{tempat_acara}}': '_______________________',
 '{{nama_pejabat_pengadaan}}': ppUser?.name || 'Beni Trisna Wijaya, S.Kom',
 '{{nip_pejabat_pengadaan}}': ppUser?.nip || '198205192010011010',
 '{{nomor_ba}}': nomorBase.replace('{nomor}', '108/BAKN'),
 '{{hari_ba}}': '_______________________',
 '{{tanggal_ba}}': '_______________________',
 '{{harga_penawaran}}': '_______________________',
 '{{harga_negosiasi}}': '_______________________',
 '{{nomor_bahp}}': nomorBase.replace('{nomor}', '112/BAHP'),
 '{{nilai_hps}}': '_______________________',
 '{{nama_penyedia_terpilih}}': '_______________________',
 '{{harga_final}}': '_______________________',
 '{{tempat_penetapan}}': defaultTempat,
 '{{nomor_sp}}': nomorBase.replace('{nomor}', '115/SP'),
 '{{alamat_penyedia}}': '_______________________',
 '{{nilai_kontrak}}': '_______________________',
 '{{waktu_penyelesaian}}': dppSpecs.waktu || packageMetadata.waktu_penyelesaian || '14 (empat belas) hari kalender',
 '{{nomor_dpp}}': packageMetadata.nomor_dpp || '................................',
 '{{tanggal_dpp}}': formatTanggalIndo(packageMetadata.tanggal_dpp, tanggalSurat),
 '{{nomor_hps}}': nomorBase.replace('{nomor}', '014/HPS'),
 '{{tanggal_hps}}': formatTanggalIndo(packageMetadata.tanggal_hps || packageMetadata.tanggal_dpp, tanggalSurat),
 '{{lokasi_pekerjaan}}': packageMetadata.lokasi_pekerjaan || (docSettingsFallback ? docSettingsFallback.namaInstansi : 'Komplek Perkantoran Pemerintah Daerah'),
 '{{program}}': packageMetadata.program || 'Program Penunjang Urusan Pemerintahan Daerah',
 '{{kegiatan}}': packageMetadata.kegiatan || 'Penyelenggaraan Pemerintahan dan Pelayanan Publik',
 '{{sub_kegiatan}}': packageMetadata.sub_kegiatan || 'Penyediaan Barang dan Jasa Perkantoran',
 '{{mak}}': selectedPack.mak || '',
 '{{pdn}}': 'Ya',
 '{{usaha_kecil}}': 'Ya',
 '{{pra_dipa}}': selectedPack.praDipa ? 'Ya' : 'Tidak',
 '{{volume_pekerjaan}}': selectedPack.volume || '1 Paket',
 '{{uraian_pekerjaan}}': (selectedPack.packName || '').toLowerCase().includes('pemeliharaan') ? `Pelaksanaan pekerjaan ${selectedPack.packName || ''} untuk mendukung kelancaran operasional kedinasan` : `Pengadaan ${selectedPack.packName || ''} untuk operasional`,
 '{{kode_rup}}': getSafeNoSirup(selectedPack, packageMetadata)
 };

 Object.keys(replacements).forEach(key => {
 content = content.replace(new RegExp(key, 'g'), replacements[key]);
 });

 content = content.replace(/melalui metode E-Purchasing/gi, `melalui metode ${dppSpecs.metodePemilihan || 'E-Purchasing'}`);

 // Inject PPK and PP Signatures
  if (docSettings?.signatureMethodPpk === 'tte' && currentUser?.nip) {
    const tteBadgeSrc = getTteBadge(currentUser?.name || 'PPK', currentUser?.nip);
    const imgHtml = `<img src="${tteBadgeSrc}" alt="TTE PPK" style="display:block; max-height:85px; margin-top:6px; margin-bottom:4px;" />`;
    content = injectSignatureHelper(content, currentUser?.name, currentUser?.nip, imgHtml);
  } else if (docSettings && docSettings.ttdPpk) {
    if (currentUser?.nip) {
      const ttdPpkStyle = 'display:block; max-height:85px; max-width:250px; width:auto; height:auto; object-fit:contain; mix-blend-mode:multiply; margin-top:6px; margin-bottom:4px; filter:contrast(1.2);';
      const imgHtml = `<img src="${docSettings.ttdPpk}" alt="TTD PPK" style="${ttdPpkStyle}" />`;
      content = injectSignatureHelper(content, currentUser?.name, currentUser?.nip, imgHtml);
    } else {
      content = content.replace(/Pejabat Pembuat Komitmen,/g, `Pejabat Pembuat Komitmen,<br/><img src="${docSettings.ttdPpk}" alt="TTD PPK" style="display:block; max-height:85px; max-width:250px; width:auto; height:auto; object-fit:contain; mix-blend-mode:multiply; margin-top:6px; margin-bottom:4px; filter:contrast(1.2);" />`);
    }
  }

  if (docSettings?.signatureMethodPp === 'tte' && replacements['{{nip_pejabat_pengadaan}}'] && replacements['{{nip_pejabat_pengadaan}}'] !== '_______________________') {
    const ppName = replacements['{{nama_pejabat_pengadaan}}'];
    const ppNip = replacements['{{nip_pejabat_pengadaan}}'];
    const tteBadgeSrc = getTteBadge(ppName || 'Pejabat Pengadaan', ppNip);
    const imgHtml = `<img src="${tteBadgeSrc}" alt="TTE PP" style="display:block; max-height:85px; margin-top:6px; margin-bottom:4px;" />`;
    content = injectSignatureHelper(content, ppName, ppNip, imgHtml);
  } else if (docSettings?.ttdPp && replacements['{{nip_pejabat_pengadaan}}'] && replacements['{{nip_pejabat_pengadaan}}'] !== '_______________________') {
    const ppName = replacements['{{nama_pejabat_pengadaan}}'];
    const ppNip = replacements['{{nip_pejabat_pengadaan}}'];
    const imgHtml = `<img src="${docSettings.ttdPp}" alt="TTD PP" style="display:block; max-height:85px; max-width:250px; width:auto; height:auto; object-fit:contain; mix-blend-mode:multiply; margin-top:6px; margin-bottom:4px; filter:contrast(1.2);" />`;
    content = injectSignatureHelper(content, ppName, ppNip, imgHtml);
  }

 const parts = content.split('{{komponen_dinamis_dpp}}');

 return (
 <>
 <div style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', textAlign: 'justify', fontSize: '12pt', fontFamily: 'Arial, sans-serif' }} dangerouslySetInnerHTML={{ __html: parseSmartColons(parts[0].trimEnd()) }} />
 
  {/* The Dynamic Components Section */}
  <div className="py-4 text-justify text-[12pt] font-['Arial',sans-serif] leading-relaxed">
    {/* BAB I */}
    
    <table className="w-full mb-4 mt-2 border-none">
      <tbody>
        <tr><td className="w-[30%] align-top border-none p-1">Nama Paket</td><td className="w-4 align-top border-none p-1">:</td><td className="align-top border-none p-1">{replacements['{{nama_pekerjaan}}']}</td></tr>
        <tr><td className="w-[30%] align-top border-none p-1">Instansi/Satuan Kerja</td><td className="w-4 align-top border-none p-1">:</td><td className="align-top border-none p-1">{replacements['{{nama_satker}}']}</td></tr>
        <tr><td className="w-[30%] align-top border-none p-1">Tahun Anggaran</td><td className="w-4 align-top border-none p-1">:</td><td className="align-top border-none p-1">{replacements['{{tahun_anggaran}}']}</td></tr>
        <tr><td className="w-[30%] align-top border-none p-1">Pagu Anggaran</td><td className="w-4 align-top border-none p-1">:</td><td className="align-top border-none p-1">{replacements['{{nilai_pagu}}']}</td></tr>
        <tr><td className="w-[30%] align-top border-none p-1">ID RUP</td><td className="w-4 align-top border-none p-1">:</td><td className="align-top border-none p-1">{replacements['{{kode_rup}}']}</td></tr>
        
      </tbody>
    </table>

    {isMaintenanceDoc ? (
      <>
        {/* BAB I JASA PEMELIHARAAN */}
        <div className="font-bold uppercase mt-8 mb-2 text-center">BAB I. PRIORITAS PENGGUNAAN PRODUK DALAM NEGERI (PDN) & UMK</div>
        <p className="indent-8 mb-2 text-justify">
          Mengacu pada ketentuan Pasal 66 Peraturan Presiden tentang Pengadaan Barang/Jasa Pemerintah beserta petunjuk teknis yang berlaku, serta Instruksi Presiden Nomor 2 Tahun 2022 tentang Percepatan Peningkatan Penggunaan Produk Dalam Negeri dan Produk Usaha Mikro, Usaha Kecil, dan Koperasi, proses pengadaan Jasa Pemeliharaan ini diwajibkan untuk mengutamakan penyedia jasa lokal dan penggunaan suku cadang/bahan produksi dalam negeri dengan mempedomani ketentuan sebagai berikut:
        </p>
        <ol className="list-decimal pl-12 mb-6 text-justify pr-4">
          <li className="pl-1 mb-1">Mengutamakan penyedia jasa pemeliharaan/bengkel/pelaksana teknis dari kalangan Pelaku Usaha Mikro, Usaha Kecil, dan Koperasi (UMK-Koperasi) di wilayah Kabupaten Probolinggo dan sekitarnya yang memiliki izin berusaha resmi.</li>
          <li className="pl-1 mb-1">Mengutamakan penggunaan suku cadang, pelumas, dan/atau bahan material produksi dalam negeri yang memiliki nilai Tingkat Komponen Dalam Negeri (TKDN) atau bersertifikat Standar Nasional Indonesia (SNI).</li>
          <li className="pl-1 mb-1">Penggunaan suku cadang asli pabrikan (Original Equipment Manufacturer/OEM) yang beredar resmi di Indonesia diwajibkan guna menjamin keselamatan kerja, keandalan operasional, dan garansi resmi hasil pekerjaan.</li>
        </ol>

        {/* BAB II JASA PEMELIHARAAN */}
        <div className="font-bold uppercase mt-8 mb-2 text-center">BAB II. SPESIFIKASI TEKNIS JASA PEMELIHARAAN</div>
        
        <div className="font-bold mt-5 mb-1">A. {mConfig.objekTitle}</div>
        <table className="w-full border-collapse border border-slate-900 mb-2">
          <thead>
            <tr className="bg-slate-100 font-bold text-center">
              <td className="border border-slate-900 p-1 w-8">No</td>
              {mConfig.objekColumns.map(col => (
                <td key={col.key} className="border border-slate-900 p-1">{col.label}</td>
              ))}
            </tr>
          </thead>
          <tbody>
            {(!dppSpecs.maintenanceObjects || dppSpecs.maintenanceObjects.length === 0) ? (
              <tr>
                <td colSpan={mConfig.objekColumns.length + 1} className="border border-slate-900 p-2 text-center italic text-slate-500">
                  Belum ada data objek pemeliharaan yang diinput.
                </td>
              </tr>
            ) : (
              dppSpecs.maintenanceObjects.map((obj, idx) => (
                <tr key={obj.id || idx}>
                  <td className="border border-slate-900 p-1 text-center align-top">{idx + 1}</td>
                  {mConfig.objekColumns.map(col => (
                    <td key={col.key} className="border border-slate-900 p-1 align-top">
                      {obj[col.key] || '-'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="font-bold mt-4">B. Standar Teknis Pelaksanaan & Service Level Agreement (SLA)</div>
        <div className="pl-4 space-y-1 mb-2">
          {dppSpecs.jenisPemeliharaan === 'kendaraan' && (
            <p className="mb-1 text-justify">
              1. <strong>Lokasi Pengerjaan & Radius Bengkel:</strong> Dilaksanakan di tempat usaha/bengkel rekanan/resmi penyedia dengan jarak maksimal <strong>{dppSpecs.maintenanceParams?.jarakMaksimalBengkelKm ?? 15} km</strong> dari Kantor Kecamatan Besuk guna efisiensi mobilitas dan percepatan respon perbaikan.
            </p>
          )}
          <p className="mb-1 text-justify">
            {dppSpecs.jenisPemeliharaan === 'kendaraan' ? '2' : '1'}. <strong>Waktu & Jangka Waktu Pelaksanaan:</strong> Maksimal selama <strong>{dppSpecs.waktu || packageMetadata.waktu_penyelesaian || '14 (Empat Belas) hari kalender'}</strong>. Lokasi tujuan akhir pekerjaan berada di: <strong>{formatTitleCase(dppSpecs.tempat || packageMetadata.lokasi_pekerjaan || currentUser?.department || 'Kantor Kecamatan Besuk')}</strong>.
          </p>
          <p className="mb-1 text-justify">
            {dppSpecs.jenisPemeliharaan === 'kendaraan' ? '3' : '2'}. <strong>Jaminan Garansi Hasil Pekerjaan:</strong> Penyedia wajib memberikan jaminan/garansi hasil pemeliharaan minimal selama <strong>{dppSpecs.maintenanceParams?.masaGaransi || (dppSpecs.jenisPemeliharaan === 'gedung' ? '30 (tiga puluh) hari kalender' : '1 (satu) bulan atau 1.000 km')}</strong> terhitung sejak tanggal Berita Acara Serah Terima (BAST).
          </p>
          <p className="mb-1 text-justify">
            {dppSpecs.jenisPemeliharaan === 'kendaraan' ? '4' : '3'}. <strong>Kualifikasi Usaha Penyedia:</strong> Memiliki Nomor Induk Berusaha (NIB) dengan Klasifikasi Baku Lapangan Usaha Indonesia (KBLI): <strong>{dppSpecs.maintenanceParams?.kbli || mConfig.defaultKbli}</strong> serta NPWP valid.
          </p>
        </div>

        {dppSpecs.spesifikasiLayanan && (
          <div className="whitespace-pre-wrap text-justify mb-4 leading-relaxed indent-8">
            {dppSpecs.spesifikasiLayanan}
          </div>
        )}

        <div className="font-bold mt-4">C. {mConfig.justifikasiLabel}</div>
        <p className="indent-8 mb-4 leading-relaxed whitespace-pre-wrap text-justify">
          {dppSpecs.justifikasiMerek || mConfig.defaultJustifikasiMerek}
        </p>

        {/* BAB III JASA PEMELIHARAAN */}
        <div className="font-bold uppercase mt-8 mb-2 text-center page-break-before-avoid">
          BAB III. DOKUMEN PENGUMPULAN REFERENSI HARGA & RINCIAN HPS
        </div>
        <p className="mb-2 indent-8 text-justify">
          Dalam penyusunan Harga Perkiraan Sendiri (HPS) untuk Jasa Pemeliharaan ini, PPK mengumpulkan referensi harga yang dapat dipertanggungjawabkan melalui survei pasar, daftar harga resmi suku cadang pabrikan (pricelist OEM), standar upah/jasa servis berkala, dan/atau perbandingan harga tayang pada Katalog Elektronik (e-Katalog LKPP).
        </p>

        {(() => {
          const validItems = (dppSpecs.maintenanceHpsItems || []).filter(
            it => (it.nama && it.nama.trim() !== '') || ((parseFloat(it.hargaSatuan) || 0) > 0)
          );
          if (validItems.length === 0) {
            return (
              <p className="indent-8 mb-4 italic text-slate-700 text-justify">
                Catatan Analisis: Rincian upah tenaga kerja/mekanik tidak dicantumkan secara terpisah dalam tabel karena harga satuan jasa pemeliharaan/servis yang ditetapkan telah mencakup (termasuk) upah tenaga mekanik/teknisi terampil, biaya peralatan kerja pendukung, suku cadang dan bahan habis pakai berstandar OEM/SNI, mobilisasi, keuntungan wajar penyedia, serta seluruh pajak yang berlaku sesuai ketentuan perundang-undangan (paket servis all-in).
              </p>
            );
          }

          return (
            <>
              <div className="font-bold mb-1">
                Rincian Perhitungan HPS {subtotalJasa > 0 ? '(Jasa/Upah Tenaga Kerja & Suku Cadang/Bahan Material)' : '(Suku Cadang & Bahan Material)'}:
              </div>
              <table className="w-full border-collapse border border-slate-900 mb-2">
                <thead>
                  <tr className="bg-slate-100 font-bold text-center">
                    <td className="border border-slate-900 p-1 w-8">No</td>
                    <td className="border border-slate-900 p-1 w-28">Kategori</td>
                    <td className="border border-slate-900 p-1">Uraian Pekerjaan / Komponen</td>
                    <td className="border border-slate-900 p-1 w-16 text-center">Vol</td>
                    <td className="border border-slate-900 p-1 w-16 text-center">Satuan</td>
                    <td className="border border-slate-900 p-1 w-28 text-right">Harga Satuan (Rp)</td>
                    <td className="border border-slate-900 p-1 w-32 text-right">Total Harga (Rp)</td>
                  </tr>
                </thead>
                <tbody>
                  {validItems.map((it, idx) => {
                    const rowTotal = (parseFloat(it.volume) || 0) * (parseFloat(it.hargaSatuan) || 0);
                    return (
                      <tr key={it.id || idx}>
                        <td className="border border-slate-900 p-1 text-center align-top">{idx + 1}</td>
                        <td className="border border-slate-900 p-1 align-top text-xs font-semibold">
                          {it.kategori || 'Jasa/Upah'}
                        </td>
                        <td className="border border-slate-900 p-1 align-top">
                          <strong>{it.nama || '-'}</strong>
                        </td>
                        <td className="border border-slate-900 p-1 text-center align-top">{it.volume || 1}</td>
                        <td className="border border-slate-900 p-1 text-center align-top">{formatSatuanClean(it.satuan, it.nama)}</td>
                        <td className="border border-slate-900 p-1 text-right align-top font-mono">
                          {formatRupiahIndo(it.hargaSatuan || 0)}
                        </td>
                        <td className="border border-slate-900 p-1 text-right align-top font-mono font-semibold">
                          {formatRupiahIndo(rowTotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  {subtotalJasa > 0 && (
                    <tr className="bg-slate-50 font-semibold">
                      <td colSpan={6} className="border border-slate-900 p-1 text-right">Subtotal Jasa / Upah Tenaga Kerja:</td>
                      <td className="border border-slate-900 p-1 text-right font-mono">Rp {formatRupiahIndo(subtotalJasa)}</td>
                    </tr>
                  )}
                  {subtotalBahan > 0 && (
                    <tr className="bg-slate-50 font-semibold">
                      <td colSpan={6} className="border border-slate-900 p-1 text-right">Subtotal Suku Cadang / Bahan Material:</td>
                      <td className="border border-slate-900 p-1 text-right font-mono">Rp {formatRupiahIndo(subtotalBahan)}</td>
                    </tr>
                  )}
                  {includePpn && (
                    <tr className="bg-slate-50 font-semibold">
                      <td colSpan={6} className="border border-slate-900 p-1 text-right">PPN 11%:</td>
                      <td className="border border-slate-900 p-1 text-right font-mono">Rp {formatRupiahIndo(nilaiPpn)}</td>
                    </tr>
                  )}
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-900">
                    <td colSpan={6} className="border border-slate-900 p-1 text-right">TOTAL HARGA PERKIRAAN SENDIRI (HPS):</td>
                    <td className="border border-slate-900 p-1 text-right font-mono">Rp {formatRupiahIndo(totalHpsPemeliharaan)}</td>
                  </tr>
                </tfoot>
              </table>
              <p className="indent-8 mb-4 italic text-slate-700 text-justify">
                Catatan Analisis: {subtotalJasa === 0
                  ? 'Biaya upah tenaga kerja/mekanik tidak dicantumkan secara terpisah karena seluruh biaya jasa servis/pemeliharaan telah mencakup (termasuk) upah tenaga mekanik/teknisi terampil, biaya peralatan kerja pendukung, suku cadang dan bahan habis pakai berstandar OEM/SNI, mobilisasi, keuntungan wajar penyedia, serta seluruh pajak yang berlaku sesuai ketentuan perundang-undangan (paket servis all-in).'
                  : 'Seluruh harga yang tertera pada HPS telah memperhitungkan upah tenaga mekanik/teknisi terampil, biaya peralatan kerja pendukung, suku cadang dan bahan habis pakai berstandar OEM/SNI, mobilisasi, keuntungan wajar penyedia, serta seluruh pajak yang berlaku sesuai ketentuan perundang-undangan.'
                }
              </p>
            </>
          );
        })()}

        {/* BAB IV JASA PEMELIHARAAN */}
        <div className="font-bold uppercase mt-8 mb-2 text-center">BAB IV. RENCANA METODE PEMILIHAN PENYEDIA</div>
        <p className="indent-8 mb-4 text-justify">
          {(() => {
            const cleanMtd = (dppSpecs.metodePemilihan || 'E-Purchasing')
              .replace(/^dilakukan\s+melalui\s+metode\s+/i, '')
              .replace(/\.+$/, '')
              .trim();
            if (cleanMtd.toLowerCase().includes('purchasing')) {
              return (
                <>Metode pemilihan penyedia ditetapkan menggunakan: <strong>E-Purchasing melalui Katalog Elektronik (Katalog Lokal / Nasional)</strong>. Pemilihan penyedia dilakukan dengan memanfaatkan etalase produk/jasa pemeliharaan e-Katalog LKPP secara transparan, efektif, dan akuntabel sesuai ketentuan pengadaan barang/jasa pemerintah.</>
              );
            } else if (cleanMtd.toLowerCase().includes('langsung')) {
              return (
                <>Metode pemilihan penyedia ditetapkan menggunakan: <strong>Pengadaan Langsung kepada Pelaku Usaha Mikro, Usaha Kecil, dan Koperasi setempat</strong> yang memiliki kualifikasi izin usaha bengkel/pemeliharaan representatif sesuai regulasi pengadaan barang/jasa pemerintah daerah yang berlaku.</>
              );
            }
            return (
              <>Metode pemilihan penyedia ditetapkan menggunakan: <strong>{cleanMtd}</strong>.</>
            );
          })()}
        </p>

        {/* BAB V JASA PEMELIHARAAN */}
        <div className="font-bold uppercase mt-8 mb-2 text-center">
          BAB V. DRAFT RANCANGAN KONTRAK & KETENTUAN BAST
        </div>
        <p className="indent-8 mb-3 text-justify">
          {(() => {
            const isEPurchasing = (dppSpecs.metodePemilihan || 'E-Purchasing').toLowerCase().includes('purchasing');
            if (isEPurchasing) {
              return <>Rancangan kontrak menggunakan format standar <strong>Surat Pesanan (SP)</strong> yang diterbitkan langsung dan diunduh dari Sistem E-Purchasing (Katalog Elektronik LKPP). Segala hak, kewajiban, ketentuan garansi, sanksi, dan denda tunduk pada Syarat-Syarat Umum/Khusus Kontrak e-Purchasing.</>;
            }
            return <>Rancangan kontrak menggunakan format standar <strong>Surat Perintah Kerja (SPK) / Surat Perjanjian</strong> pengadaan langsung pemeliharaan yang memuat rincian lingkup pekerjaan, waktu pelaksanaan, serta jaminan mutu hasil pekerjaan.</>;
          })()}
        </p>
        <p className="indent-8 mb-4 text-justify">
          <strong>Ketentuan Penyelesaian Pekerjaan & BAST:</strong> {dppSpecs.ketentuanBAST || 'Penyelesaian pekerjaan dan pencairan pembayaran 100% (seratus persen) dilaksanakan setelah seluruh hasil pekerjaan pemeliharaan selesai dilaksanakan, dilakukan pengujian fisik/fungsi dengan hasil baik, penyerahan suku cadang bekas (untuk kendaraan), serta ditandatangani Berita Acara Serah Terima (BAST) pekerjaan oleh Pejabat Pembuat Komitmen (PPK).'}
        </p>
      </>
    ) : (
      <>
        {/* BAB I BARANG */}
        <div className="font-bold uppercase mt-8 mb-2 text-center">BAB I. PRIORITAS PENGGUNAAN PRODUK DALAM NEGERI (PDN) & UMK</div>
        <p className="indent-8 mb-2 text-justify">
          Mengacu pada Pasal 66 Peraturan Presiden Nomor 16 Tahun 2018 tentang Pengadaan Barang/Jasa Pemerintah sebagaimana telah diubah dengan Peraturan Presiden Nomor 12 Tahun 2021, serta Instruksi Presiden Nomor 2 Tahun 2022, proses pengadaan ini diwajibkan untuk mengutamakan penggunaan produk dalam negeri dan memberdayakan Pelaku Usaha Mikro, Usaha Kecil, dan Koperasi. Oleh karena itu, pemilihan produk dalam proses <em>e-Purchasing</em> ini dilakukan dengan mempedomani hierarki prioritas sebagai berikut:
        </p>
        <ol className="list-decimal pl-12 mb-6 text-justify pr-4">
          <li className="pl-1 mb-1">Barang/Jasa yang memiliki nilai Tingkat Komponen Dalam Negeri (TKDN) beserta nilai Bobot Manfaat Perusahaan (BMP) paling sedikit 40% (empat puluh persen).</li>
          <li className="pl-1 mb-1">Barang/Jasa Produk Dalam Negeri (PDN) dengan nilai TKDN kurang dari 40% (empat puluh persen).</li>
          <li className="pl-1 mb-1">Barang/Jasa Produk Dalam Negeri (PDN) yang belum memiliki sertifikat TKDN namun diakui sebagai produk lokal.</li>
          <li className="pl-1 mb-1">Barang/Jasa Impor, yang pemilihannya <strong>hanya dapat dilakukan</strong> dalam hal spesifikasi teknis tidak dapat dipenuhi oleh produk dalam negeri dan/atau volume produksi nasional tidak mencukupi, dibuktikan melalui justifikasi teknis yang memadai.</li>
        </ol>

        {/* BAB II BARANG */}
        <div className="font-bold uppercase mt-8 mb-2 text-center">BAB II. SPESIFIKASI TEKNIS E-PURCHASING</div>
        
        <div className="font-bold mt-5 mb-1">A. Identitas Barang & Spesifikasi Mutu</div>
        <table className="w-full border-collapse border border-slate-900 mb-2">
          <thead>
            <tr className="bg-slate-100 font-bold text-center">
              <td className="border border-slate-900 p-1 w-8">No</td>
              <td className="border border-slate-900 p-1">Identitas / Nama Barang & Spesifikasi Mutu</td>
              <td className="border border-slate-900 p-1 w-16">Kuantitas</td>
              <td className="border border-slate-900 p-1 w-16">Satuan</td>
            </tr>
          </thead>
          <tbody>
            {getPackageItems(selectedPack).filter(item => (item.qty === '' ? 0 : (item.qty || 0)) > 0).map((item, idx) => {
              return (
                <tr key={item.no}>
                  <td className="border border-slate-900 p-1 text-center">{idx + 1}</td>
                  <td className="border border-slate-900 p-1">
                    <strong>{item.name}</strong>
                    {item.spesifikasi && (
                      <div style={{ marginTop: '4px', fontSize: '11px', color: '#334155' }}>
                        Spesifikasi: {item.spesifikasi}
                      </div>
                    )}
                  </td>
                  <td className="border border-slate-900 p-1 text-center">{item.qty}</td>
                  <td className="border border-slate-900 p-1 text-center">{formatSatuanClean(item.unit, item.name)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="font-bold mt-4">B. Spesifikasi Waktu dan Layanan</div>
        <p className="indent-8 mb-2">Waktu pelaksanaan pengadaan maksimal selama <strong>{dppSpecs.waktu || packageMetadata.waktu_penyelesaian || '14 (Empat Belas) hari kalender'}</strong>. Lokasi tujuan akhir pengiriman berada di: <strong>{formatTitleCase(dppSpecs.tempat || packageMetadata.lokasi_pekerjaan || currentUser?.department || 'Kabupaten Probolinggo')}</strong>.</p>
        {dppSpecs.spesifikasiLayanan && (
          <div className="whitespace-pre-wrap text-justify mb-4 leading-relaxed indent-8">
            {dppSpecs.spesifikasiLayanan}
          </div>
        )}

        {dppSpecs.justifikasiMerek && (
          <>
            <div className="font-bold mt-4">C. Spesifikasi Tambahan / Catatan Kebutuhan</div>
            <p className="indent-8 mb-4 leading-relaxed whitespace-pre-wrap">{dppSpecs.justifikasiMerek}</p>
          </>
        )}

        {/* BAB III BARANG */}
        <div className="font-bold uppercase mt-8 mb-2 text-center page-break-before-avoid">
          BAB III. DOKUMEN PENGUMPULAN REFERENSI HARGA
        </div>
        <p className="mb-2 indent-8">
          Sebagai metode pengadaan e-purchasing, dokumen Referensi Harga ini digunakan untuk membuktikan harga yang disepakati wajar.
        </p>

        <div className="pl-4 space-y-2 mb-4">
          <div className="font-bold">a. Daftar Penyedia Potensial e-Katalog</div>
          {(() => {
            const activePackItems = (getPackageItems(selectedPack) || []).filter(item => (item.qty === '' ? 0 : Number(item.qty || 0)) > 0);
            if (activePackItems.length === 0) {
              return <p className="italic text-slate-600 my-1 pb-1 ">* Seluruh item barang aktif tidak ditemukan di e-Katalog LKPP atau kuantitas dinolkan. Referensi e-Katalog tidak terlampir.</p>;
            }
            const sProducts = getActiveSurveyData()?.products || [];

            return (
              <table className="w-full border-collapse border border-slate-900 mb-2">
                <thead>
                  <tr className="bg-slate-100 font-bold text-center">
                    <td className="border border-slate-900 p-1 w-8">No</td>
                    <td className="border border-slate-900 p-1">Nama Barang</td>
                    <td className="border border-slate-900 p-1">Penyedia Katalog</td>
                    <td className="border border-slate-900 p-1 text-right">Harga Katalog (Rp)</td>
                  </tr>
                </thead>
                <tbody>
                  {activePackItems.flatMap((item, pIdx) => {
                    const p = sProducts.find(prod => (prod.name || '').trim().toLowerCase() === (item.name || '').trim().toLowerCase())
                           || sProducts.find(prod => prod.id === item.id)
                           || null;
                    const isFound = p && p.success && p.vendor && p.vendor !== 'TIDAK DITEMUKAN';

                    if (!isFound) {
                      return [
                        <tr key={`item-${pIdx}`}>
                          <td className="border border-slate-900 p-1 text-center font-bold">{pIdx + 1}</td>
                          <td className="border border-slate-900 p-1 text-sm font-semibold">{item.name}</td>
                          <td className="border border-slate-900 p-1 text-xs text-rose-600 italic">
                            Tidak ditemukan di e-Katalog LKPP / Belum Disurvei
                          </td>
                          <td className="border border-slate-900 p-1 text-right text-xs text-slate-400 font-mono italic">
                            -
                          </td>
                        </tr>
                      ];
                    }

                    const rows = [];
                    const totalRows = 1 + (p.comparators && p.comparators.length > 0 ? p.comparators.length : 0);
                    const effectiveKatalogPrice = (hpsPrices && hpsPrices[item.name] !== undefined && Number(hpsPrices[item.name]) > 0)
                      ? Number(hpsPrices[item.name])
                      : (p.price || 0);
                    rows.push(
                      <tr key={`win-${pIdx}`}>
                        <td className="border border-slate-900 p-1 text-center font-bold" rowSpan={totalRows}>{pIdx + 1}</td>
                        <td className="border border-slate-900 p-1 text-sm font-semibold" rowSpan={totalRows}>
                          <a href={p.link} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 break-all">{p.name || item.name}</a>
                        </td>
                        <td className="border border-slate-900 p-1 text-xs text-slate-800">
                          <div className="font-semibold">{p.vendor}</div>
                          {p.link && <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 break-all text-[9px] print:text-[8px]">{p.link}</a>}
                        </td>
                        <td className="border border-slate-900 p-1 text-right text-xs text-slate-800 align-top font-mono">
                          {formatRupiahIndo(effectiveKatalogPrice)}
                        </td>
                      </tr>
                    );
                    
                    if (p.comparators && p.comparators.length > 0) {
                      p.comparators.forEach((comp, cIdx) => {
                        rows.push(
                          <tr key={`comp-${pIdx}-${cIdx}`}>
                            <td className="border border-slate-900 p-1 text-xs text-slate-800">
                              <div className="font-semibold">{comp.vendor}</div>
                              {comp.link && <a href={comp.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 break-all text-[9px] print:text-[8px]">{comp.link}</a>}
                            </td>
                            <td className="border border-slate-900 p-1 text-right text-xs text-slate-800 align-top font-mono">
                              {formatRupiahIndo(comp.price || 0)}
                            </td>
                          </tr>
                        );
                      });
                    }
                    return rows;
                  })}
                </tbody>
              </table>
            );
          })()}
        </div>

        <div className="pl-4 space-y-2 mb-4">
          <div className="font-bold">b. Estimasi Perbandingan Harga</div>
          <p className="mb-2 indent-8">
            Berdasarkan daftar di atas, perbandingan harga (Harga DPA vs Harga Tayang e-Katalog) adalah sebagai berikut:
          </p>
        
        <table className="w-full border-collapse border border-slate-900 mb-2">
          <thead>
            {autoComparator ? (
              <tr className="bg-slate-100 font-bold text-center">
                <td className="border border-slate-900 p-1 w-8">No</td>
                <td className="border border-slate-900 p-1">Uraian Barang</td>
                <td className="border border-slate-900 p-1 w-24 text-right">Harga DPA</td>
                <td className="border border-slate-900 p-1 w-64">Daftar Penyedia Potensial</td>
                <td className="border border-slate-900 p-1">Alasan Pemilihan</td>
              </tr>
            ) : (
              <tr className="bg-slate-100 font-bold text-center">
                <td className="border border-slate-900 p-1 w-8">No</td>
                <td className="border border-slate-900 p-1">Uraian Barang</td>
                <td className="border border-slate-900 p-1 w-24 text-right">Harga DPA</td>
                <td className="border border-slate-900 p-1 w-24 text-right">Harga Tayang e-Katalog</td>
                <td className="border border-slate-900 p-1">Penyedia & Tautan e-Katalog</td>
              </tr>
            )}
          </thead>
          <tbody>
            {getPackageItems(selectedPack).filter(item => (item.qty === '' ? 0 : (item.qty || 0)) > 0).map((item, idx) => {
              const unitHpsPrice = hpsPrices[item.name] !== undefined ? hpsPrices[item.name] : item.price;
              const surveyProduct = surveyData?.products?.find(p => p.name === item.name);
              const displayName = surveyProduct?.name || item.name;
              const hargaTayang = surveyProduct?.price ? surveyProduct.price : 0;
              const compKey = 'ITEM-' + idx;
              const comp = comparisons && comparisons[compKey];

              if (autoComparator) {
                return (
                  <tr key={item.no}>
                    <td className="border border-slate-900 p-1 text-center">{idx + 1}</td>
                    <td className="border border-slate-900 p-1 text-sm">{displayName}</td>
                    <td className="border border-slate-900 p-1 text-right text-sm font-mono">Rp {formatRupiahIndo(item.price || 0)}</td>
                    <td className="border border-slate-900 p-1">
                      <div className="mb-2">
                        <div className="text-[10px] text-slate-800">{surveyProduct?.vendor || '-'}</div>
                        <div className="text-[11px] text-slate-700 font-mono">Rp {formatRupiahIndo(hargaTayang)}</div>
                      </div>
                      {surveyProduct?.comparators && surveyProduct.comparators.length > 0 && (
                        <div className="pt-2 border-t border-slate-300 space-y-2">
                          {surveyProduct.comparators.map((c, cIdx) => (
                            <div key={cIdx}>
                              <div className="text-[10px] text-slate-800">{c.vendor}</div>
                              <div className="text-[11px] text-slate-700 font-mono">Rp {formatRupiahIndo(c.price || 0)}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="border border-slate-900 p-1 text-[9px] align-top">
                      {comp ? (comp.alasan || (hargaTayang < item.price 
                        ? 'Harga e-Katalog terindikasi efisien (di bawah pagu DPA)' 
                        : 'Harga e-Katalog wajar (sesuai pagu DPA)')) : <span className="font-semibold text-emerald-800">Satu-satunya penyedia lokal terdekat yang memenuhi kriteria teknis dan waktu layanan</span>}
                    </td>
                  </tr>
                );
              } else {
                const brandText = surveyProduct ? (surveyProduct.vendor || 'Sesuai Katalog') : 'Sesuai Kebutuhan DPA';
                const linkHref = surveyProduct && surveyProduct.link
                  ? surveyProduct.link
                  : (surveyProduct ? getDynamicProductLink(surveyProduct.vendor, surveyProduct.name) : '');
                return (
                  <tr key={item.no}>
                    <td className="border border-slate-900 p-1 text-center">{idx + 1}</td>
                    <td className="border border-slate-900 p-1">{item.name}</td>
                    <td className="border border-slate-900 p-1 text-right font-mono">Rp {formatRupiahIndo(item.price || 0)}</td>
                    <td className="border border-slate-900 p-1 text-right font-mono">Rp {formatRupiahIndo(hargaTayang || 0)}</td>
                    <td className="border border-slate-900 p-1 text-sm">
                      {surveyProduct && surveyProduct.success && surveyProduct.vendor !== 'TIDAK DITEMUKAN' ? (
                        <>
                          <strong>{brandText}</strong><br/>
                          <a href={linkHref} target="_blank" className="text-blue-600 break-all text-[10px]">{linkHref}</a>
                        </>
                      ) : (
                        <span className="text-slate-400 italic">Belum disurvei / tidak ditemukan</span>
                      )}
                    </td>
                  </tr>
                );
              }
            })}
          </tbody>
        </table>
        </div>
        <p className="indent-8 mb-4"><em>Catatan Analisis: Seluruh harga yang tertera sudah termasuk pajak yang berlaku dan keuntungan wajar, serta biaya kirim/instalasi (apabila dipersyaratkan). Hasil tangkapan layar produk e-Katalog terlampir di akhir dokumen ini.</em></p>

        {/* BAB IV BARANG */}
        <div className="font-bold uppercase mt-8 mb-2 text-center">BAB IV. RENCANA METODE PEMILIHAN PENYEDIA E-PURCHASING</div>
        <p className="indent-8 mb-4">
          Metode pemilihan penyedia ditetapkan menggunakan: <strong>{(dppSpecs.metodePemilihan || 'Negosiasi Harga').replace(/^dilakukan\s+melalui\s+metode\s+/i, '').replace(/\.+$/, '').trim()}</strong>.
        </p>

        {/* BAB V BARANG */}
        <div className="font-bold uppercase mt-8 mb-2 text-center">BAB V. DRAFT RANCANGAN KONTRAK (SURAT PESANAN)</div>
        <p className="indent-8 mb-3">
          Rancangan kontrak menggunakan format standar <strong>Surat Pesanan (SP)</strong> yang diterbitkan langsung dan diunduh dari Sistem E-Purchasing (Katalog Elektronik LKPP). Segala ketentuan mengenai hak, kewajiban, tata cara pembayaran, sanksi, dan denda tunduk pada Syarat-Syarat Umum/Khusus Kontrak e-Purchasing.
        </p>
        <p className="indent-8 mb-4">
          <strong>Ketentuan Penyelesaian Pekerjaan & BAST:</strong> {dppSpecs.ketentuanBAST || 'Penyelesaian paket pengadaan dan pencairan pembayaran 100% (seratus persen) dilaksanakan setelah seluruh hasil pekerjaan diterima dengan baik serta ditandatangani Berita Acara Serah Terima (BAST) oleh Pejabat Pembuat Komitmen (PPK).'}
        </p>
      </>
    )}
  </div>

 {/* Render the second part of the template (footer/signature) */}
 {parts[1] && (
 <div className="mt-8 pt-6 signature-section" style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', textAlign: 'justify', fontFamily: 'Arial, sans-serif', pageBreakInside: 'avoid', breakInside: 'avoid' }} dangerouslySetInnerHTML={{ __html: parseSmartColons(parts[1]) }} />
 )}
 </>
 );
 }
 
 // Fallback if template fails or doesn't have the placeholder
 return (
 <div className="text-center font-bold text-rose-600 p-4 border border-rose-300 rounded bg-rose-50">
 Template DPP tidak valid. Pastikan template memiliki tag {"{{komponen_dinamis_dpp}}"}
 </div>
 );
 })()}

 <div className="pt-4 space-y-3">
 {/* Lampiran Screenshot Jika Ada */}
 {getActiveSurveyData() && (() => {
 const activePackItems = (getPackageItems(selectedPack) || []).filter(item => (item.qty === '' ? 0 : Number(item.qty || 0)) > 0);
 const activeItemNames = new Set(activePackItems.map(i => (i.name || '').trim().toLowerCase()));
 const foundProducts = getActiveSurveyData().products.filter(p => {
   if (!p.success || p.vendor === 'TIDAK DITEMUKAN') return false;
   if (!activeItemNames.has((p.name || '').trim().toLowerCase())) return false;
   const hasAnyImg = !!(p.img || p.searchImg || (p.comparators && p.comparators.some(c => c.img)));
   return hasAnyImg;
 });
 if (foundProducts.length === 0) return null;
 return (
 <div className="mt-8 break-before-page" style={{ pageBreakBefore: 'always', breakBefore: 'page' }}>
 <div className="font-bold uppercase mb-6 text-center border-b-2 border-slate-900 pb-2">LAMPIRAN: BUKTI TANGKAPAN LAYAR (SCREENSHOT) REFERENSI E-KATALOG LOKAL/NASIONAL</div>
 <div className="block" style={{ marginTop: '2rem' }}>
 {foundProducts.map((p, index) => {
  let imgSrc = p.searchImg || p.img;
  if (imgSrc && imgSrc.startsWith('/screenshots/')) {
    imgSrc = window.location.origin + imgSrc;
  }

  const targetLinkHref = p.link && !p.link.includes('/search?keyword=') ? p.link : getDynamicProductLink(p.vendor, p.name);

  const matchedItem = activePackItems.find(i => (i.name || '').trim().toLowerCase() === (p.name || '').trim().toLowerCase() || i.id === p.id);
  const effectivePrice = (matchedItem && hpsPrices && hpsPrices[matchedItem.name] !== undefined && Number(hpsPrices[matchedItem.name]) > 0)
    ? Number(hpsPrices[matchedItem.name])
    : ((hpsPrices && hpsPrices[p.name] !== undefined && Number(hpsPrices[p.name]) > 0) ? Number(hpsPrices[p.name]) : (p.price || 0));

  // Kumpulkan semua penyedia: utama + comparators
  const allProviders = [
    { vendor: p.vendor, price: effectivePrice, link: targetLinkHref, img: imgSrc, label: 'Penyedia Utama' },
    ...(p.comparators || []).map((comp, cIdx) => {
      let compImg = comp.img;
      if (compImg && compImg.startsWith('/screenshots/')) compImg = window.location.origin + compImg;
      return {
        vendor: comp.vendor,
        price: comp.price,
        link: comp.link,
        img: compImg,
        label: `Penyedia Pembanding ${cIdx + 1}`
      };
    })
  ];

  return (
  <div key={p.id} style={{ pageBreakBefore: index === 0 ? 'auto' : 'always', breakBefore: index === 0 ? 'auto' : 'page', marginBottom: '32px' }}>
    {/* Header nama barang */}
    <div style={{ fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', background: '#1e293b', color: 'white', padding: '6px 12px', marginBottom: '12px' }}>
      Barang {index + 1}: {p.name}
    </div>
    {/* Blok per penyedia — semua seragam sebagai Penyedia Potensial */}
    {allProviders.map((prov, pIdx) => (
      <div key={pIdx} style={{ border: '1.5px solid #64748b', background: '#ffffff', marginBottom: '16px', padding: '10px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
        {/* Info penyedia */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '8px' }}>
          <span style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', background: '#f1f5f9', color: '#334155', padding: '2px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
            Penyedia Potensial {pIdx + 1}
          </span>
          <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{prov.vendor} — Rp {(prov.price || 0).toLocaleString('id-ID')}</span>
        </div>
        {/* Screenshot */}
        {prov.img ? (
          <img src={prov.img} alt={prov.vendor} style={{ width: '100%', maxHeight: '420px', objectFit: 'contain', border: '1px solid #cbd5e1', display: 'block' }} />
        ) : (
          <div style={{ width: '100%', minHeight: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed #cbd5e1', background: '#f8fafc', padding: '16px', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8' }}>Screenshot Belum Tersedia</span>
            <span style={{ fontSize: '9px', color: '#94a3b8', marginTop: '4px' }}>Klik "📸 Ambil Screenshot Bukti" di halaman persiapan survei</span>
          </div>
        )}
        {/* Tautan produk */}
        <div style={{ marginTop: '6px', fontSize: '8px', color: '#475569', wordBreak: 'break-all' }}>
          🔗 <a href={prov.link} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>{prov.link}</a>
        </div>
      </div>
    ))}
  </div>
  );
 })}
 </div>
 </div>
 );
 })()}
 </div>
 </div>
 )}

 {/* SIGNATURE SECTION (FOOTER) */}
 {activeDocPreview !== 'bahp' && activeDocPreview !== 'spk' && activeDocPreview !== 'skp' && (
 <div className="flex justify-between items-end mt-12 pt-6 border-t border-slate-200 signature-section" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
 <div className="flex-1">
 {/* Kosong untuk memberikan ruang tanda tangan di kanan */}
 </div>
 <div className="w-max min-w-[14rem] px-4 text-center space-y-2">
  <div>
    {(docSettings?.kotaSurat || (currentUser?.department?.toLowerCase().includes('besuk') ? 'Besuk' : (currentUser?.department || 'Probolinggo')))}, {
     activeDocPreview === 'nd'
       ? formatTanggalIndo(packageMetadata.tanggal_nd, tanggalSurat)
       : (activeDocPreview === 'hps'
           ? formatTanggalIndo(packageMetadata.tanggal_hps || packageMetadata.tanggal_dpp, tanggalSurat)
           : formatTanggalIndo(packageMetadata.tanggal_dpp, tanggalSurat))
   }
  </div>
 <div className=" font-bold uppercase">
 Pejabat Pembuat Komitmen (PPK)
 </div>

 {/* Ruang kosong untuk tanda tangan basah */}
 {(() => {
   if (docSettings?.signatureMethodPpk === 'tte' && currentUser?.nip) {
     return <img src={getTteBadge(currentUser?.name || 'PPK', currentUser?.nip)} alt="TTE PPK" style={{ display: 'block', maxHeight: '85px', margin: '6px auto 4px auto' }} />;
   } else if (docSettings?.ttdPpk) {
     return <img src={docSettings.ttdPpk} alt="TTD PPK" style={{ display: 'block', maxHeight: '85px', maxWidth: '250px', width: 'auto', height: 'auto', objectFit: 'contain', mixBlendMode: 'multiply', margin: '6px auto 4px auto', filter: 'contrast(1.2)' }} />;
   }
   return <div style={{ height: '96px', width: '100%' }}></div>;
 })()}
 
 <div className=" font-bold uppercase underline">
 {currentUser?.name}
 </div>
 <div className=" font-mono -mt-1">
 NIP. {currentUser?.nip}
 </div>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>,
 document.body
 )}

    </>
  );
}
