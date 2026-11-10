/**
 * ppnDetector.js
 * Utilitas deteksi & validasi status PPN Pengadaan Barang/Jasa Pemerintah Kab. Probolinggo.
 * Mendukung AI Dynamic Contextual Reasoning dengan Multi-Tier Fallback:
 * Tier 1: AI LLM Contextual Validation (/api/ai/validate-ppn)
 * Tier 2: Bagan Akun Standar (BAS) Rekening DPA (Makan Minum / Rapat / Tamu)
 * Tier 3: Multi-Factor Heuristic Contextual Scoring (Profil Usaha, Satuan Saji, Konteks Kegiatan)
 * Tier 4: User Manual Override (PPK)
 */

/**
 * Hitung komponen pajak (DPP, PPN, Total) berdasarkan status PPN
 * @param {number} rawPrice Harga acuan/tayang/target
 * @param {boolean} isExempt True jika Bebas PPN (PBJT Daerah)
 * @returns {{ dpp: number, ppn: number, total: number }}
 */
export function calculateItemTax(rawPrice, isExempt = false) {
  const price = Math.max(0, Math.round(Number(rawPrice) || 0));

  if (isExempt) {
    // Objek Pajak Daerah / PBJT: Bebas PPN Pusat (PPN = 0)
    // Nilai sebelum pajak (DPP) setara penuh dengan harga produk
    return {
      dpp: price,
      ppn: 0,
      total: price,
    };
  }

  // BKP Umum: Formula resmi INAPROC e-Katalog LKPP
  // PPN = (11/12 x DPP) x 12% = 11% Efektif
  const dpp = Math.floor(price / 1.11);
  const ppn = Math.round((11 / 12) * dpp * 0.12);
  const total = dpp + ppn;

  return { dpp, ppn, total };
}

/**
 * Deteksi alternatif lokal (Fallback saat AI Offline / Gagal / Lambat)
 * @param {object} item Data item/produk
 * @param {object} context Konteks paket & rekening DPA
 */
export function detectItemPpnFallback(item = {}, context = {}) {
  const itemName = (item.name || item.nama_barang || item.nama || '').trim();
  const vendor = (item.vendor || item.dppVendor || context.vendor || '').trim();
  const specs = (item.spesifikasi || item.specs || item.specification || '').trim();
  const unit = (item.satuan || item.unit || '').trim().toLowerCase();
  const price = Number(item.price || item.harga_satuan || 0);

  const cleanItem = itemName.toLowerCase();
  const cleanVendor = vendor.toLowerCase();
  const cleanSpecs = specs.toLowerCase();
  const cleanUraian = (context.uraianRekening || context.accountName || '').toLowerCase();
  const cleanKode = (context.kodeRekening || context.account || '').replace(/[^0-9]/g, '');

  // 1. Cek Bagan Akun Standar (BAS) Belanja Makanan & Minuman
  const isMakanMinumAccount =
    cleanKode.includes('510201010052') || // Makan Minum Rapat
    cleanKode.includes('510201010053') || // Jamuan Tamu
    cleanKode.includes('510201010054') || // Aktivitas Lapangan
    (cleanUraian.includes('makan') && cleanUraian.includes('minum')) ||
    cleanUraian.includes('jamuan') ||
    cleanUraian.includes('konsumsi');

  // Pengecualian negatif (wadah fisik kosong bukan makanan)
  const isPhysicalEquipment = /(kontainer|container|kotak mika|mika plastik|box mika|piring|gelas plastik kosong|dus kosong|sendok garpu|plastik klip)/i.test(
    cleanItem
  );

  if (isMakanMinumAccount && !isPhysicalEquipment) {
    const tax = calculateItemTax(price, true);
    return {
      isExempt: true,
      statusPpn: 'Bebas/Tidak Dikenakan PPN',
      rate: 0,
      dasarHukum:
        'Pasal 4A ayat (2) UU PPN jo. UU HKPD No. 1/2022 (Rekening Belanja Makanan & Minuman merupakan objek PBJT Pajak Daerah, bukan PPN)',
      metodeDeteksi: 'dpa_account',
      confidence: 99,
      ...tax,
    };
  }

  // 2. Multi-Factor Contextual Scoring
  let score = 0;

  // Profil Usaha Vendor Jasa Boga / Kuliner
  if (/(catering|katering|resto|restoran|warung|rumah makan|cafe|caf\u00e9|bakery|dapur)/i.test(cleanVendor)) {
    score += 40;
  }

  // Karakteristik Komoditas Konsumsi / Kudapan
  if (
    /(snack|kudapan|kue|nasi kotak|nasi bungkus|prasmanan|coffee break|tumpeng|konsumsi|makanan|minuman)/i.test(
      cleanItem
    ) ||
    /(snack|kue|nasi|konsumsi|kudapan)/i.test(cleanSpecs)
  ) {
    score += 40;
  }

  // Satuan Sajian Porsi / Kotak
  if (['kotak', 'box', 'porsi', 'dus', 'paket', 'bungkus'].includes(unit) || /(kotak|box|porsi|dus|paket)/i.test(cleanItem)) {
    score += 20;
  }

  // Hukuman jika merupakan peralatan / wadah plastik
  if (isPhysicalEquipment) {
    score -= 100;
  }

  if (score >= 60) {
    const tax = calculateItemTax(price, true);
    return {
      isExempt: true,
      statusPpn: 'Bebas/Tidak Dikenakan PPN',
      rate: 0,
      dasarHukum:
        'Pasal 4A UU PPN jo. PP 49/2022 & UU HKPD (Makanan/minuman sediaan jasa boga/katering merupakan objek PBJT Daerah)',
      metodeDeteksi: 'scoring_fallback',
      confidence: 85,
      ...tax,
    };
  }

  // 3. Default: BKP Umum (Dikenakan PPN 11%)
  const tax = calculateItemTax(price, false);
  return {
    isExempt: false,
    statusPpn: 'Dikenakan PPN',
    rate: 11,
    dasarHukum: 'Pasal 4 ayat (1) UU PPN jo. UU HPP (Barang Kena Pajak Umum)',
    metodeDeteksi: 'scoring_fallback',
    confidence: 90,
    ...tax,
  };
}

/**
 * Validasi status PPN dengan AI (Primary) dan otomatis fallback ke lokal jika AI offline/timeout.
 * @param {object} item Data item
 * @param {object} context Konteks paket & rekening
 * @returns {Promise<object>}
 */
export async function validateItemPpnWithAI(item, context = {}) {
  const fallback = detectItemPpnFallback(item, context);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 detik batas timeout AI

    const payload = {
      item_name: item.name || item.nama_barang || '',
      vendor: item.vendor || item.dppVendor || context.vendor || '',
      specification: item.spesifikasi || item.specs || '',
      price: Number(item.price || item.harga_satuan || 0),
      kode_rekening: context.kodeRekening || context.account || '',
      uraian_rekening: context.uraianRekening || context.accountName || '',
    };

    const res = await fetch('/api/ai/validate-ppn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.success) {
        const isExempt = data.status_ppn?.toLowerCase().includes('bebas') || data.tarif_ppn_persen === 0;
        const dpp = data.rekomendasi_perhitungan?.harga_sebelum_pajak_dpp ?? (isExempt ? payload.price : Math.floor(payload.price / 1.11));
        const ppn = data.rekomendasi_perhitungan?.nilai_ppn ?? (isExempt ? 0 : Math.round((11 / 12) * dpp * 0.12));
        const total = dpp + ppn;

        return {
          isExempt,
          statusPpn: data.status_ppn,
          rate: data.tarif_ppn_persen,
          dasarHukum: data.dasar_hukum,
          metodeDeteksi: data.metode_deteksi || 'ai',
          confidence: data.confidence || 95,
          dpp,
          ppn,
          total,
        };
      }
    }
  } catch (err) {
    console.warn('AI PPN validation failed/timeout, using local fallback:', err?.message || err);
  }

  // Gunakan fallback otomatis jika AI offline / timeout / error
  return fallback;
}
