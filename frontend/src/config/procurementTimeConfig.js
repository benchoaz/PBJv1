/**
 * procurementTimeConfig.js
 * Konfigurasi Spesifikasi Waktu Pelaksanaan Pengadaan Berbasis Domain / Kategori.
 * 
 * Aturan Bisnis & Tata Naskah Pengadaan:
 * 1. Mamin (Makanan & Minuman / Jamuan Rapat):
 *    - Default: "1 (satu) hari kalender pada saat pelaksanaan kegiatan"
 *    - Makanan cepat rusak/basi, disajikan langsung saat acara.
 * 2. Jasa Pemeliharaan Gedung & Bangunan:
 *    - Default: "30 (tiga puluh) hari kalender" atau "14 (empat belas) hari kalender"
 *    - Memerlukan waktu perbaikan fisik, pengeringan cat/plester, dan perapian.
 * 3. Jasa Pemeliharaan Kendaraan Dinas:
 *    - Default: "7 (tujuh) hari kalender"
 *    - Dikerjakan bertahap per unit (rolling) agar operasional tidak terganggu.
 * 4. Jasa Pemeliharaan Aset / Peralatan Lainnya (AC, Genset):
 *    - Default: "7 (tujuh) hari kalender"
 * 5. Belanja ATK & Bahan Cetak Kantor:
 *    - Default: "7 (tujuh) hari kalender"
 * 6. Belanja Modal & Peralatan Elektronik / Komputer:
 *    - Default: "14 (empat belas) hari kalender"
 *    - Membutuhkan waktu perakitan, instalasi software, uji fungsi (commissioning).
 * 7. Jasa Lainnya / Kebersihan / Event:
 *    - Default: "Sesuai jadwal pelaksanaan kegiatan terlampir" atau "30 (tiga puluh) hari kalender"
 * 8. Pengadaan Konsolidasi Sektoral:
 *    - Default: "14 (empat belas) hari kalender"
 * 9. Pekerjaan Konstruksi:
 *    - Default: "30 (tiga puluh) hari kalender"
 */

export const PROCUREMENT_CATEGORIES = {
  MAMIN: 'mamin',
  MAINTENANCE_GEDUNG: 'maintenance_gedung',
  MAINTENANCE_KENDARAAN: 'maintenance_kendaraan',
  MAINTENANCE_LAINNYA: 'maintenance_lainnya',
  MODAL: 'modal',
  ATK: 'atk',
  JASA_LAINNYA: 'jasa_lainnya',
  KONSOLIDASI: 'konsolidasi',
  KONSTRUKSI: 'konstruksi'
};

export const TIME_CONFIG_BY_CATEGORY = {
  [PROCUREMENT_CATEGORIES.MAMIN]: {
    key: PROCUREMENT_CATEGORIES.MAMIN,
    label: 'Makanan & Minuman (Konsumsi Rapat / Acara)',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    defaultWaktu: '1 (satu) hari kalender pada saat pelaksanaan kegiatan',
    keterangan: 'Makanan disajikan tepat pada hari H acara/kegiatan rapat dinas.',
    presets: [
      { label: '1 Hari (Hari H Acara)', value: '1 (satu) hari kalender pada saat pelaksanaan kegiatan' },
      { label: '2 Hari Kalender', value: '2 (dua) hari kalender sesuai jadwal kegiatan' },
      { label: '3 Hari Kalender', value: '3 (tiga) hari kalender sesuai jadwal kegiatan' },
      { label: 'Sesuai Jadwal Rapat', value: 'Sesuai jadwal pelaksanaan rapat dinas terlampir' }
    ]
  },
  [PROCUREMENT_CATEGORIES.MAINTENANCE_GEDUNG]: {
    key: PROCUREMENT_CATEGORIES.MAINTENANCE_GEDUNG,
    label: 'Jasa Pemeliharaan Gedung & Bangunan',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    defaultWaktu: '30 (tiga puluh) hari kalender',
    keterangan: 'Memberi waktu yang cukup untuk perbaikan fisik, pengeringan, dan perapian.',
    presets: [
      { label: '14 Hari Kalender', value: '14 (empat belas) hari kalender' },
      { label: '21 Hari Kalender', value: '21 (dua puluh satu) hari kalender' },
      { label: '30 Hari (1 Bulan)', value: '30 (tiga puluh) hari kalender' },
      { label: '45 Hari Kalender', value: '45 (empat puluh lima) hari kalender' }
    ]
  },
  [PROCUREMENT_CATEGORIES.MAINTENANCE_KENDARAAN]: {
    key: PROCUREMENT_CATEGORIES.MAINTENANCE_KENDARAAN,
    label: 'Jasa Pemeliharaan Kendaraan Dinas',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    defaultWaktu: '7 (tujuh) hari kalender',
    keterangan: 'Pengerjaan servis berkala dan penggantian suku cadang bertahap per unit.',
    presets: [
      { label: '3 Hari Kalender', value: '3 (tiga) hari kalender' },
      { label: '7 Hari Kalender', value: '7 (tujuh) hari kalender' },
      { label: '14 Hari Kalender', value: '14 (empat belas) hari kalender' },
      { label: 'Bertahap Per Unit', value: '14 (empat belas) hari kalender dilaksanakan secara bertahap per unit' }
    ]
  },
  [PROCUREMENT_CATEGORIES.MAINTENANCE_LAINNYA]: {
    key: PROCUREMENT_CATEGORIES.MAINTENANCE_LAINNYA,
    label: 'Jasa Pemeliharaan Peralatan & Aset Kantor',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-300',
    defaultWaktu: '7 (tujuh) hari kalender',
    keterangan: 'Perawatan rutin on-site (cuci AC, servis genset, dsb).',
    presets: [
      { label: '3 Hari Kalender', value: '3 (tiga) hari kalender' },
      { label: '7 Hari Kalender', value: '7 (tujuh) hari kalender' },
      { label: '14 Hari Kalender', value: '14 (empat belas) hari kalender' },
      { label: '30 Hari Kalender', value: '30 (tiga puluh) hari kalender' }
    ]
  },
  [PROCUREMENT_CATEGORIES.MODAL]: {
    key: PROCUREMENT_CATEGORIES.MODAL,
    label: 'Belanja Modal & Peralatan Elektronik/Mesin',
    badgeColor: 'bg-violet-100 text-violet-800 border-violet-300',
    defaultWaktu: '14 (empat belas) hari kalender',
    keterangan: 'Waktu pengiriman, instalasi, dan uji fungsi perangkat elektronik/mesin.',
    presets: [
      { label: '7 Hari Kalender', value: '7 (tujuh) hari kalender' },
      { label: '14 Hari Kalender', value: '14 (empat belas) hari kalender' },
      { label: '21 Hari Kalender', value: '21 (dua puluh satu) hari kalender' },
      { label: '30 Hari Kalender', value: '30 (tiga puluh) hari kalender' }
    ]
  },
  [PROCUREMENT_CATEGORIES.ATK]: {
    key: PROCUREMENT_CATEGORIES.ATK,
    label: 'Belanja ATK, Cetak & Bahan Operasional',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    defaultWaktu: '7 (tujuh) hari kalender',
    keterangan: 'Kebutuhan barang pakai habis siap kirim atau cetak formulir.',
    presets: [
      { label: '3 Hari Kerja', value: '3 (tiga) hari kerja' },
      { label: '7 Hari Kalender', value: '7 (tujuh) hari kalender' },
      { label: '10 Hari Kalender', value: '10 (sepuluh) hari kalender' },
      { label: '14 Hari Kalender', value: '14 (empat belas) hari kalender' }
    ]
  },
  [PROCUREMENT_CATEGORIES.JASA_LAINNYA]: {
    key: PROCUREMENT_CATEGORIES.JASA_LAINNYA,
    label: 'Jasa Lainnya & Pelayanan Operasional',
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    defaultWaktu: '30 (tiga puluh) hari kalender',
    keterangan: 'Pelaksanaan kegiatan jasa sesuai periode kontrak atau tanggal acara.',
    presets: [
      { label: 'Sesuai Jadwal Acara', value: 'Sesuai jadwal pelaksanaan kegiatan terlampir' },
      { label: '14 Hari Kalender', value: '14 (empat belas) hari kalender' },
      { label: '30 Hari (1 Bulan)', value: '30 (tiga puluh) hari kalender' },
      { label: 'Sepanjang Tahun Anggaran', value: 'Sesuai jangka waktu Surat Pesanan / Tahun Anggaran Berjalan' }
    ]
  },
  [PROCUREMENT_CATEGORIES.KONSOLIDASI]: {
    key: PROCUREMENT_CATEGORIES.KONSOLIDASI,
    label: 'Pengadaan Konsolidasi Sektoral',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    defaultWaktu: '14 (empat belas) hari kalender',
    keterangan: 'Pengiriman massal bertahap ke kantor kecamatan.',
    presets: [
      { label: '14 Hari Kalender', value: '14 (empat belas) hari kalender' },
      { label: '21 Hari Kalender', value: '21 (dua puluh satu) hari kalender' },
      { label: '30 Hari Kalender', value: '30 (tiga puluh) hari kalender' },
      { label: 'Sesuai Jadwal Drop', value: 'Sesuai jadwal pengiriman konsolidasi terlampir' }
    ]
  },
  [PROCUREMENT_CATEGORIES.KONSTRUKSI]: {
    key: PROCUREMENT_CATEGORIES.KONSTRUKSI,
    label: 'Pekerjaan Konstruksi / Rehab Fisik',
    badgeColor: 'bg-orange-100 text-orange-800 border-orange-300',
    defaultWaktu: '30 (tiga puluh) hari kalender',
    keterangan: 'Pekerjaan fisik terikat kurva S dan masa pelaksanaan.',
    presets: [
      { label: '30 Hari Kalender', value: '30 (tiga puluh) hari kalender' },
      { label: '45 Hari Kalender', value: '45 (empat puluh lima) hari kalender' },
      { label: '60 Hari Kalender', value: '60 (enam puluh) hari kalender' },
      { label: '90 Hari Kalender', value: '90 (sembilan puluh) hari kalender' }
    ]
  }
};

/**
 * Mendeteksi kategori pengadaan berdasarkan paket, templateId, dan dppSpecs.
 */
export function detectProcurementCategory(pack, templateId = '', dppSpecs = {}) {
  const packName = ((pack?.packName || pack?.namaPaket || pack?.name || '') + '').toLowerCase();
  const subGiat = ((pack?.subKegiatan || pack?.sub_kegiatan || '') + '').toLowerCase();
  const tpl = (templateId || '').toUpperCase();
  const jenisMaint = dppSpecs?.jenisPemeliharaan || 'kendaraan';

  // 1. Cek Pemeliharaan dahulu
  const isMaintenance = tpl === 'TPL-006F' || 
    packName.includes('pemeliharaan') || 
    packName.includes('perawatan') || 
    packName.includes('servis') || 
    packName.includes('service') ||
    subGiat.includes('pemeliharaan');

  if (isMaintenance) {
    if (jenisMaint === 'gedung' || packName.includes('gedung') || packName.includes('bangunan') || packName.includes('kantor')) {
      return PROCUREMENT_CATEGORIES.MAINTENANCE_GEDUNG;
    }
    if (jenisMaint === 'lainnya' || packName.includes('ac') || packName.includes('genset') || packName.includes('pompa')) {
      return PROCUREMENT_CATEGORIES.MAINTENANCE_LAINNYA;
    }
    return PROCUREMENT_CATEGORIES.MAINTENANCE_KENDARAAN;
  }

  // 2. Cek Makanan & Minuman
  const isMamin = tpl === 'TPL-006B' ||
    packName.includes('makan') ||
    packName.includes('minum') ||
    packName.includes('mamin') ||
    packName.includes('snack') ||
    packName.includes('prasmanan') ||
    packName.includes('katering') ||
    packName.includes('catering') ||
    packName.includes('konsumsi') ||
    packName.includes('natura');

  if (isMamin) {
    return PROCUREMENT_CATEGORIES.MAMIN;
  }

  // 3. Cek Konstruksi Fisik
  const isKonstruksi = tpl === 'TPL-006G' ||
    packName.includes('konstruksi') ||
    packName.includes('pembangunan') ||
    packName.includes('rehabilitasi') ||
    packName.includes('rehab') ||
    packName.includes('renovasi');

  if (isKonstruksi) {
    return PROCUREMENT_CATEGORIES.KONSTRUKSI;
  }

  // 4. Cek Belanja Modal
  const isModal = tpl === 'TPL-006C' ||
    packName.includes('laptop') ||
    packName.includes('komputer') ||
    packName.includes('pc') ||
    packName.includes('printer') ||
    packName.includes('proyektor') ||
    packName.includes('mesin') ||
    packName.includes('elektronik') ||
    packName.includes('modal') ||
    (packName.includes('kendaraan') && !packName.includes('pemeliharaan') && !packName.includes('servis'));

  if (isModal) {
    return PROCUREMENT_CATEGORIES.MODAL;
  }

  // 5. Cek Konsolidasi Sektoral
  const isKonsolidasi = tpl === 'TPL-006E' ||
    packName.includes('konsolidasi') ||
    packName.includes('kertas sektoral') ||
    packName.includes('seragam dinas');

  if (isKonsolidasi) {
    return PROCUREMENT_CATEGORIES.KONSOLIDASI;
  }

  // 6. Cek Jasa Lainnya
  const isJasaLainnya = tpl === 'TPL-006D' ||
    packName.includes('jasa') ||
    packName.includes('kebersihan') ||
    packName.includes('keamanan') ||
    packName.includes('tenaga') ||
    packName.includes('event');

  if (isJasaLainnya) {
    return PROCUREMENT_CATEGORIES.JASA_LAINNYA;
  }

  // Default: ATK / Barang Umum
  return PROCUREMENT_CATEGORIES.ATK;
}

/**
 * Mendapatkan konfigurasi spesifikasi waktu untuk paket.
 */
export function getTimeConfigForPackage(pack, templateId = '', dppSpecs = {}) {
  const cat = detectProcurementCategory(pack, templateId, dppSpecs);
  return TIME_CONFIG_BY_CATEGORY[cat] || TIME_CONFIG_BY_CATEGORY[PROCUREMENT_CATEGORIES.ATK];
}

/**
 * Mendapatkan default string waktu pelaksanaan untuk paket.
 */
export function getDefaultWaktuForPackage(pack, templateId = '', dppSpecs = {}) {
  const cfg = getTimeConfigForPackage(pack, templateId, dppSpecs);
  return cfg.defaultWaktu;
}
