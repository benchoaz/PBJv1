/**
 * maintenanceConfig.js
 * Data-driven configuration for Jasa Pemeliharaan (TPL-006F)
 * Mendukung jenis pemeliharaan: Kendaraan Dinas (R2 & R4), Gedung/Bangunan, dan Lainnya.
 * Memudahkan penambahan jenis baru tanpa mengubah kode secara tersebar.
 */

export const MAINTENANCE_TYPES = [
  {
    id: 'kendaraan',
    label: 'Kendaraan Dinas (Roda 2 & Roda 4)',
    shortLabel: 'Kendaraan Dinas',
    icon: 'Car',
    description: 'Pemeliharaan berkala, servis rutin, tune-up, ganti oli, aki, ban, dan perbaikan kendaraan roda 2 dan roda 4.',
    defaultKbli: '45201 (Reparasi dan Perawatan Mobil) / 45407 (Reparasi dan Perawatan Sepeda Motor)',
    objekTitle: 'Daftar Objek Pemeliharaan (Kendaraan Dinas)',
    justifikasiLabel: 'Justifikasi Standar Suku Cadang & Oli',
    justifikasiPlaceholder: 'Contoh: Suku cadang dan pelumas yang digunakan mengacu pada suku cadang asli (OEM/Genuine Parts) atau setara mutu pabrikan demi keandalan, keselamatan, dan mempertahankan umur pakai kendaraan dinas.',
    defaultParams: {
      jarakMaksimalBengkelKm: 15,
      slaServisRingan: '1 (satu) hari kerja',
      slaServisBerat: '3 (tiga) hingga 7 (tujuh) hari kerja',
      masaGaransi: '1 (satu) bulan atau 1.000 km',
      metodePemilihan: 'E-Purchasing', // 'E-Purchasing' | 'Pengadaan Langsung'
      sistemKontrak: 'Harga Satuan', // 'Harga Satuan' | 'Lumsum' | 'On-Call'
      dasarHukum: 'Peraturan Presiden tentang Pengadaan Barang/Jasa Pemerintah beserta petunjuk teknis yang berlaku',
      regulasiThresholdText: 'Sesuai dengan ketentuan ambang batas nilai pengadaan barang/jasa pemerintah daerah yang berlaku',
      dendaKeterlambatanPermil: 1, // 1/1000 per hari keterlambatan
      jumlahPembandingSurvei: 3,
    },
    objekColumns: [
      { key: 'jenis', label: 'Jenis', type: 'select', options: ['Roda 2', 'Roda 4'], default: 'Roda 2', width: 'w-24' },
      { key: 'merekTipe', label: 'Merek / Tipe', type: 'text', placeholder: 'Contoh: Honda Vario 125 / Toyota Avanza', default: '' },
      { key: 'tahun', label: 'Tahun', type: 'text', placeholder: '2020', default: '', width: 'w-20' },
      { key: 'nopol', label: 'Nomor Polisi (Nopol)', type: 'text', placeholder: 'N 1234 NP', default: '', width: 'w-28' },
      { key: 'jenisLayanan', label: 'Jenis Layanan', type: 'text', placeholder: 'Servis rutin, ganti oli, tune up', default: 'Servis berkala & ganti oli' },
      { key: 'frekuensi', label: 'Frekuensi / Tahun', type: 'text', placeholder: '4 kali / tahun', default: '4 Kali/Tahun', width: 'w-28' },
    ],
    sampleObjects: [
      { id: 1, jenis: 'Roda 2', merekTipe: 'Honda Vario 125', tahun: '2021', nopol: 'N 2841 NP', jenisLayanan: 'Servis berkala, ganti oli mesin & gardan, tune up', frekuensi: '4 Kali/Tahun' },
      { id: 2, jenis: 'Roda 2', merekTipe: 'Yamaha Jupiter Z', tahun: '2019', nopol: 'N 3190 NP', jenisLayanan: 'Servis berkala, ganti oli, kampas rem', frekuensi: '4 Kali/Tahun' },
      { id: 3, jenis: 'Roda 4', merekTipe: 'Toyota Avanza 1.3 G', tahun: '2020', nopol: 'N 1054 NP', jenisLayanan: 'Servis rutin berkala, oli mesin, filter, tune up, spooring', frekuensi: '3 Kali/Tahun' },
      { id: 4, jenis: 'Roda 4', merekTipe: 'Mitsubishi Colt L300', tahun: '2018', nopol: 'N 8042 NP', jenisLayanan: 'Servis mesin, sistem rem, kelistrikan, ganti oli', frekuensi: '3 Kali/Tahun' },
    ],
    defaultSpesifikasiLayanan: `1. Lokasi Bengkel Penyedia memiliki jarak maksimal {jarakMaksimalBengkelKm} km dari Kantor Kecamatan Besuk guna efisiensi mobilitas dan percepatan respon perbaikan.
2. Mekanisme Pelaksanaan:
   a. Pemeriksaan awal (diagnosa) kondisi kendaraan bersama pejabat/petugas pemegang kendaraan.
   b. Penyedia menyusun estimasi biaya tertulis (rincian jasa dan suku cadang) untuk disetujui oleh PPK/PPTK.
   c. Penerbitan Surat Perintah Kerja (Work Order) per unit kendaraan sebelum pengerjaan dimulai.
   d. Penyedia tidak diperkenankan menambah pekerjaan atau mengganti komponen di luar SPK tanpa persetujuan tertulis dari PPK.
   e. Pelaksanaan pengerjaan oleh tenaga mekanik yang kompeten dan berpengalaman.
   f. Uji hasil pekerjaan (test drive) dan serah terima kendaraan.
3. Service Level Agreement (SLA):
   - Servis ringan/rutin diselesaikan maksimal dalam {slaServisRingan}.
   - Perbaikan sedang/berat diselesaikan maksimal dalam {slaServisBerat}.
4. Jaminan dan Garansi:
   - Garansi pekerjaan servis minimal selama {masaGaransi} terhitung sejak tanggal BAST pekerjaan.
   - Garansi suku cadang sesuai dengan ketentuan resmi pabrikan.
   - Suku cadang lama/rusak yang telah diganti wajib diserahkan kembali kepada PPK sebagai bukti fisik pertanggungjawaban.
5. Kualifikasi Penyedia: Memiliki Nomor Induk Berusaha (NIB) dengan KBLI {defaultKbli}, memiliki NPWP aktif, serta tempat usaha bengkel tetap yang representatif.`,
    defaultJustifikasiMerek: `Suku cadang, oli mesin, dan pelumas yang dipergunakan dalam pemeliharaan kendaraan dinas wajib mengacu pada standar suku cadang asli pabrikan (OEM / Genuine Parts) atau produk berkualitas setara yang direkomendasikan pabrikan kendaraan bermotor terkait. Standar mutu ini ditetapkan demi menjamin keselamatan berkendara operasional kedinasan, menjaga garansi resmi kendaraan, mencegah kerusakan fatal mesin, serta mempertahankan umur ekonomis aset dinas Pemerintah Daerah.`,
    defaultKetentuanBAST: `Penyelesaian pekerjaan dan pembayaran dilaksanakan berdasarkan Berita Acara Serah Terima (BAST) yang dilampiri dokumen pendukung sah, meliputi:
1. Nota/Faktur rincian biaya yang memisahkan komponen jasa perbaikan dan penggantian suku cadang;
2. Surat Perintah Kerja (Work Order) pemeliharaan kendaraan yang ditandatangani pengemudi/pejabat pemegang kendaraan dan disetujui PPK;
3. Dokumentasi foto fisik kendaraan dan penggantian suku cadang (kondisi sebelum dan sesudah pengerjaan);
4. Penyerahan fisik komponen bekas/rusak yang telah diganti kepada Pengurus Barang / PPK.`
  },
  {
    id: 'gedung',
    label: 'Gedung / Bangunan',
    shortLabel: 'Gedung/Bangunan',
    icon: 'Building2',
    description: 'Pemeliharaan rutin gedung kantor, pengecatan, atap/plafon, lantai, sanitasi/plumbing, instalasi listrik, AC, dan taman.',
    defaultKbli: '43303 (Pengecatan dan Pemasangan Kaca) / 43211 (Instalasi Listrik) / 43221 (Instalasi Saluran Air/Plumbing) / 81210 (Jasa Kebersihan Umum Bangunan)',
    objekTitle: 'Daftar Objek Pemeliharaan (Gedung & Bangunan)',
    justifikasiLabel: 'Justifikasi Standar Bahan',
    justifikasiPlaceholder: 'Contoh: Bahan material yang digunakan mengacu pada standar mutu SNI atau setara dengan spesifikasi teknis bangunan gedung dinas demi ketahanan struktur dan estetika perkantoran.',
    defaultParams: {
      jadwalKerja: 'Senin s.d. Jumat (di luar jam pelayanan) atau Sabtu-Minggu atas izin PPK',
      waktuPelaksanaanHari: 30,
      masaPemeliharaanHasilPekerjaan: '30 (tiga puluh) hari kalender',
      metodePemilihan: 'Pengadaan Langsung', // 'E-Purchasing' | 'Pengadaan Langsung'
      sistemKontrak: 'Lumsum', // 'Harga Satuan' | 'Lumsum' | 'On-Call'
      dasarHukum: 'Peraturan Presiden tentang Pengadaan Barang/Jasa Pemerintah beserta petunjuk teknis yang berlaku',
      regulasiThresholdText: 'Sesuai dengan ketentuan ambang batas nilai pengadaan barang/jasa pemerintah daerah yang berlaku',
      dendaKeterlambatanPermil: 1,
      jumlahPembandingSurvei: 3,
    },
    objekColumns: [
      { key: 'gedungRuang', label: 'Gedung / Ruang / Area', type: 'text', placeholder: 'Contoh: Ruang Pelayanan Terpadu / Pendopo', default: '' },
      { key: 'lokasi', label: 'Lokasi', type: 'text', placeholder: 'Kantor Kecamatan Besuk Lt. 1', default: 'Kantor Kecamatan Besuk' },
      { key: 'luasVolume', label: 'Luas / Volume', type: 'text', placeholder: '120 m2 / 1 Paket', default: '', width: 'w-28' },
      { key: 'kondisiAwal', label: 'Kondisi Awal', type: 'text', placeholder: 'Cat mengelupas, plafon bocor', default: 'Cat kusam & sebagian retak rambut' },
      { key: 'uraianPekerjaan', label: 'Uraian Pekerjaan', type: 'text', placeholder: 'Pembersihan, plamir, pengecatan 2 lapis', default: 'Pengecatan dan perapihan' },
    ],
    sampleObjects: [
      { id: 1, gedungRuang: 'Ruang Pelayanan Paten', lokasi: 'Kantor Kecamatan Besuk Lantai 1', luasVolume: '96 m2', kondisiAwal: 'Cat dinding kusam dan terkelupas di beberapa titik', uraianPekerjaan: 'Pengerokan cat lama, plamir, dan pengecatan ulang dinding interior 2 lapis' },
      { id: 2, gedungRuang: 'Plafon Selasar Depan', lokasi: 'Kantor Kecamatan Besuk', luasVolume: '35 m2', kondisiAwal: 'Rembesan air hujan dan plafon gypsum melandai', uraianPekerjaan: 'Perbaikan titik kebocoran talang atap dan penggantian lembar gypsum plafon yang rusak' },
      { id: 3, gedungRuang: 'Toilet Publik & Musholla', lokasi: 'Area Pelayanan Kecamatan Besuk', luasVolume: '1 Unit', kondisiAwal: 'Kran bocor dan kran pelampung tandon macet', uraianPekerjaan: 'Penggantian stop kran, perbaikan pipa saluran sanitasi/plumbing, pembersihan lantai' },
    ],
    defaultSpesifikasiLayanan: `1. Jadwal dan Waktu Pelaksanaan:
   - Pelaksanaan pekerjaan selama {waktuPelaksanaanHari} hari kalender terhitung sejak SPMK/Surat Pesanan.
   - Pekerjaan di area publik/pelayanan wajib dikoordinasikan agar tidak mengganggu operasional pelayanan kepada masyarakat.
2. Prosedur dan Metode Kerja:
   a. Sebelum pekerjaan fisik dimulai, Penyedia bersama PPK/Pengawas Lapangan wajib melakukan survei lokasi bersama untuk mencocokkan kondisi riil lapangan dan menentukan titik prioritas penanganan.
   b. Dokumentasi visual kondisi awal (titik nol / 0%) wajib diambil dari sudut yang jelas dan representatif.
   c. Rencana Anggaran Biaya (RAB) / Bill of Quantities (BoQ) yang mencantumkan rincian volume x harga satuan menjadi acuan pelaksanaan.
   d. Penyedia menyediakan tenaga kerja terampil yang berpengalaman di bidang pekerjaan terkait.
   e. Penyedia wajib menerapkan standar Keselamatan dan Kesehatan Kerja (K3), mencakup pemakaian Alat Pelindung Diri (APD) standar dan pengamanan area kerja.
   f. Penyedia tidak diperkenankan mengubah denah, konstruksi struktural, atau fungsi ruang tanpa izin tertulis dari PPK.
   g. Penyedia bertanggung jawab penuh atas kebersihan area kerja selama dan sesudah pekerjaan, termasuk pembuangan sisa puing/material ke luar area kantor.
3. Masa Pemeliharaan Hasil Pekerjaan:
   - Ditetapkan selama {masaPemeliharaanHasilPekerjaan} sejak tanggal serah terima pekerjaan (BAST).
   - Selama masa pemeliharaan, penyedia wajib memperbaiki setiap cacat mutu hasil pekerjaan atas biaya penyedia sendiri selambat-lambatnya 3 (tiga) hari kerja sejak pemberitahuan PPK.
4. Kualifikasi Penyedia: Memiliki Nomor Induk Berusaha (NIB) dengan KBLI {defaultKbli}, memiliki NPWP aktif, serta pengalaman pekerjaan pemeliharaan gedung/fasilitas umum.`,
    defaultJustifikasiMerek: `Bahan material yang digunakan dalam pemeliharaan gedung kantor harus memenuhi standar mutu Standar Nasional Indonesia (SNI) atau standar teknis konstruksi yang berlaku. Penyebutan merek dagang pada dokumen perencanaan atau HPS hanya berfungsi sebagai acuan standar mutu teknis ("atau setara"), sehingga penyedia dapat menawarkan bahan bermutu minimal setara atau lebih baik dengan persetujuan PPK/Tim Teknis.`,
    defaultKetentuanBAST: `Penyelesaian pekerjaan dan pembayaran 100% (seratus persen) dilaksanakan setelah pekerjaan dinyatakan selesai dengan baik melalui mekanisme:
1. Berita Acara Pemeriksaan Pekerjaan / Hasil Opname Fisik 100% yang ditandatangani bersama oleh PPK/Pengawas Lapangan dan Penyedia;
2. Dokumentasi foto komparasi progres fisik berurutan (kondisi 0%, 50%, dan 100%);
3. Berita Acara Serah Terima (BAST) pekerjaan yang ditandatangani PPK dan Penyedia;
4. Surat Pernyataan Kesanggupan Pemeliharaan selama masa pemeliharaan yang dipersyaratkan.`,
    warningClassification: '⚠️ Pengingat Regulasi: Pastikan lingkup pekerjaan tergolong pemeliharaan rutin/berkala gedung (masuk kategori Jasa Lainnya), bukan renovasi struktural, penambahan ruang, atau pembangunan kembali yang masuk ranah Pekerjaan Konstruksi. Verifikasi terhadap pedoman teknis dinas terkait.'
  },
  {
    id: 'lainnya',
    label: 'Lainnya (Peralatan Kantor, AC, Kebersihan, Taman, dll.)',
    shortLabel: 'Lainnya / Umum',
    icon: 'Wrench',
    description: 'Pemeliharaan umum peralatan kantor, mesin pendingin (AC), genset, penataan taman, dan jasa kebersihan berkala.',
    defaultKbli: 'Sesuai dengan bidang pemeliharaan yang dilaksanakan',
    objekTitle: 'Daftar Objek Pemeliharaan',
    justifikasiLabel: 'Justifikasi Standar Teknis Bahan / Suku Cadang',
    justifikasiPlaceholder: 'Contoh: Bahan/suku cadang yang digunakan mengacu pada spesifikasi teknis pabrikan demi keandalan fungsi peralatan.',
    defaultParams: {
      waktuPelaksanaanHari: 14,
      masaGaransi: '14 (empat belas) hari kalender',
      metodePemilihan: 'E-Purchasing',
      sistemKontrak: 'Harga Satuan',
      dasarHukum: 'Peraturan Presiden tentang Pengadaan Barang/Jasa Pemerintah beserta petunjuk teknis yang berlaku',
      regulasiThresholdText: 'Sesuai dengan ketentuan ambang batas nilai pengadaan barang/jasa pemerintah daerah yang berlaku',
      dendaKeterlambatanPermil: 1,
      jumlahPembandingSurvei: 3,
    },
    objekColumns: [
      { key: 'uraianObjek', label: 'Uraian Objek', type: 'text', placeholder: 'Contoh: Unit AC Split 1.5 PK / Genset Kantor', default: '' },
      { key: 'lokasi', label: 'Lokasi / Spesifikasi', type: 'text', placeholder: 'Ruang Kerja Kecamatan Besuk', default: 'Kantor Kecamatan Besuk' },
      { key: 'volume', label: 'Volume', type: 'text', placeholder: '2', default: '1', width: 'w-20' },
      { key: 'satuan', label: 'Satuan', type: 'text', placeholder: 'Unit / Titik', default: 'Unit', width: 'w-24' },
      { key: 'uraianPekerjaan', label: 'Uraian Pekerjaan', type: 'text', placeholder: 'Pembersihan evaporator, cek freon, perbaikan filter', default: 'Servis berkala dan pembersihan' },
    ],
    sampleObjects: [
      { id: 1, uraianObjek: 'AC Split Panasonic 1.5 PK', lokasi: 'Ruang Camat', volume: '1', satuan: 'Unit', uraianPekerjaan: 'Servis cuci AC berkala, penambahan refrigeran/freon R32, pembersihan outdoor' },
      { id: 2, uraianObjek: 'AC Split Daikin 1 PK', lokasi: 'Ruang Pelayanan Terpadu', volume: '2', satuan: 'Unit', uraianPekerjaan: 'Servis cuci AC, perbaikan drainase pembuangan air kondensasi' },
    ],
    defaultSpesifikasiLayanan: `1. Penyedia wajib menyediakan tenaga kerja ahli yang kompeten dan membawa peralatan kerja yang memadai serta aman.
2. Pemeriksaan awal terhadap objek pemeliharaan dilakukan bersama pejabat/petugas yang ditunjuk PPK sebelum pekerjaan dimulai.
3. Seluruh pekerjaan pemeliharaan dilakukan secara tuntas dan tidak menimbulkan gangguan pada lingkungan kantor.
4. Apabila terdapat penggantian suku cadang, penyedia wajib mengonfirmasikan kepada PPK sebelum pemasangan.
5. Garansi purna jual atas hasil pekerjaan pemeliharaan berlaku minimal {masaGaransi} sejak serah terima.`,
    defaultJustifikasiMerek: `Suku cadang dan bahan pemeliharaan yang digunakan mengacu pada standar spesifikasi teknis peralatan terpasang atau rekomendasi pabrikan demi menjaga kinerja peralatan tetap optimal dan aman digunakan.`,
    defaultKetentuanBAST: `Penyelesaian pekerjaan dan pembayaran dilaksanakan setelah seluruh pekerjaan selesai, diuji fungsi dengan hasil baik, dan ditandatangani Berita Acara Serah Terima (BAST) oleh PPK yang dilampiri laporan rincian pekerjaan dan foto dokumentasi.`
  }
];

/**
 * Format string rupiah resmi Indonesia: titik sebagai pemisah ribuan
 */
export function formatRupiahIndo(val) {
  const num = typeof val === 'number' ? val : parseFloat(val) || 0;
  return num.toLocaleString('id-ID');
}

/**
 * Pembersih satuan jika terpotong "Per" atau diawali "Per "
 */
export function formatSatuanClean(unit, itemName = '') {
  if (!unit || typeof unit !== 'string') return 'Unit';
  const u = unit.trim();
  if (u.toLowerCase() === 'per') {
    const lowerName = (itemName || '').toLowerCase();
    if (lowerName.includes('kertas') || lowerName.includes('hvs') || lowerName.includes('folio')) return 'Rim';
    if (lowerName.includes('amplop') || lowerName.includes('blanko') || lowerName.includes('surat') || lowerName.includes('cetak')) return 'Lembar';
    if (lowerName.includes('listrik') || lowerName.includes('air') || lowerName.includes('internet') || lowerName.includes('langganan')) return 'Bulan';
    return 'Unit';
  }
  if (u.toLowerCase().startsWith('per ') && u.length > 4) {
    const cleanSub = u.substring(4).trim();
    return cleanSub.charAt(0).toUpperCase() + cleanSub.slice(1);
  }
  return u;
}

/**
 * Normalisasi dan kapitalisasi nama lokasi / instansi secara formal (Title Case)
 */
export function formatTitleCase(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => {
      if (['dan', 'atau', 'pada', 'di', 'ke', 'dari', 'untuk'].includes(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ')
    .replace(/^./, c => c.toUpperCase());
}

/**
 * Dapatkan konfigurasi jenis pemeliharaan berdasarkan ID
 */
export function getMaintenanceConfig(typeId) {
  return MAINTENANCE_TYPES.find(t => t.id === typeId) || MAINTENANCE_TYPES[2]; // default 'lainnya'
}

/**
 * Substitusi placeholder dinamis pada template teks pemeliharaan
 */
export function interpolateMaintenanceText(templateText, params = {}) {
  if (!templateText) return '';
  let result = templateText;
  Object.keys(params).forEach(k => {
    const val = params[k] !== undefined && params[k] !== null ? params[k] : '';
    result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), String(val));
  });
  return result;
}
