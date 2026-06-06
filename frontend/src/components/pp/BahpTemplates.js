/**
 * BahpTemplates.js
 * Template BAHP profesional per jenis pengadaan — disusun berdasarkan:
 * - Perpres 12/2021 tentang Pengadaan Barang/Jasa Pemerintah
 * - Perlem LKPP 9/2021 tentang Toko Daring dan Katalog Elektronik
 * - Perlem LKPP 11/2021 tentang Perencanaan Pengadaan
 * - Perlem LKPP 12/2021 tentang Pelaksanaan Pengadaan (Lamp. IV, V, VI)
 * - PP 22/2020 jo PP 14/2021 tentang Jasa Konstruksi
 * - SE LKPP 22/2021 tentang Konsultansi Perencanaan & Pengawasan
 * - SE LKPP 3/2022 tentang Pengadaan Makanan dan Minuman
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. DAFTAR TEMPLATE
// ─────────────────────────────────────────────────────────────────────────────
export const BAHP_TEMPLATE_TYPES = [
  {
    id: 'atk',
    label: 'Barang ATK / Habis Pakai',
    sublabel: 'e-Purchasing Katalog Lokal/Nasional',
    icon: 'ATK',
    metodePemilihan: 'e-Purchasing Katalog Elektronik',
    jenisPengadaan: 'Barang',
  },
  {
    id: 'mamin',
    label: 'Makanan & Minuman (Mamin)',
    sublabel: 'Konsumsi Kegiatan/Rapat Dinas',
    icon: 'MN',
    metodePemilihan: 'e-Purchasing Katalog Elektronik',
    jenisPengadaan: 'Barang',
  },
  {
    id: 'jasa',
    label: 'Jasa Lainnya',
    sublabel: 'Non-Konstruksi, Non-Konsultansi',
    icon: 'JS',
    metodePemilihan: 'e-Purchasing / Pengadaan Langsung',
    jenisPengadaan: 'Jasa Lainnya',
  },
  {
    id: 'modal',
    label: 'Belanja Modal',
    sublabel: 'Alat, Mesin, Peralatan, TI, Kendaraan',
    icon: 'BM',
    metodePemilihan: 'e-Purchasing Katalog Elektronik',
    jenisPengadaan: 'Barang',
  },
  {
    id: 'pemeliharaan',
    label: 'Pemeliharaan / Perawatan',
    sublabel: 'Aset Tetap, Kendaraan, Infrastruktur',
    icon: 'PM',
    metodePemilihan: 'Pengadaan Langsung / e-Purchasing',
    jenisPengadaan: 'Jasa Lainnya',
  },
  {
    id: 'konstruksi',
    label: 'Konstruksi / Pekerjaan Fisik',
    sublabel: 'Pembangunan, Renovasi, Rehabilitasi',
    icon: 'KS',
    metodePemilihan: 'Pengadaan Langsung / Tender',
    jenisPengadaan: 'Pekerjaan Konstruksi',
  },
  {
    id: 'konsultasi_non',
    label: 'Konsultansi Non-Konstruksi',
    sublabel: 'IT, Audit, Studi, Kajian, Pelatihan',
    icon: 'KN',
    metodePemilihan: 'Seleksi / Pengadaan Langsung Konsultansi',
    jenisPengadaan: 'Jasa Konsultansi Non-Konstruksi',
  },
  {
    id: 'konsultasi_konstruksi',
    label: 'Konsultansi Konstruksi',
    sublabel: 'Perencanaan, Pengawasan, Manajemen Konstruksi',
    icon: 'KK',
    metodePemilihan: 'Seleksi / Pengadaan Langsung Konsultansi',
    jenisPengadaan: 'Jasa Konsultansi Konstruksi',
  },
  {
    id: 'konsolidasi',
    label: 'Pengadaan Terkonsolidasi',
    sublabel: 'Multi-Satker / Multi-PPK (Perpres 12/2021 Psl 20)',
    icon: 'KSL',
    metodePemilihan: 'e-Purchasing Katalog Elektronik (Konsolidasi)',
    jenisPengadaan: 'Barang/Jasa (Konsolidasi)',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 2. DASAR HUKUM — berbeda per jenis pengadaan
// ─────────────────────────────────────────────────────────────────────────────
export const DASAR_HUKUM = {
  atk: [
    'Peraturan Presiden Nomor 16 Tahun 2018 sebagaimana telah diubah dengan Peraturan Presiden Nomor 12 Tahun 2021 tentang Pengadaan Barang/Jasa Pemerintah;',
    'Peraturan Lembaga Kebijakan Pengadaan Barang/Jasa Pemerintah Nomor 9 Tahun 2021 tentang Toko Daring dan Katalog Elektronik dalam Pengadaan Barang/Jasa Pemerintah;',
    'Peraturan Lembaga Kebijakan Pengadaan Barang/Jasa Pemerintah Nomor 11 Tahun 2021 tentang Pedoman Perencanaan Pengadaan Barang/Jasa Pemerintah;',
    'Keputusan Kepala LKPP tentang Penyelenggaraan Katalog Elektronik Sektoral Pemerintah Daerah;',
    'Peraturan Daerah/Peraturan Kepala Daerah tentang Anggaran Pendapatan dan Belanja Daerah (APBD) Tahun Anggaran berjalan.',
  ],
  mamin: [
    'Peraturan Presiden Nomor 16 Tahun 2018 sebagaimana telah diubah dengan Peraturan Presiden Nomor 12 Tahun 2021 tentang Pengadaan Barang/Jasa Pemerintah;',
    'Peraturan Lembaga Kebijakan Pengadaan Barang/Jasa Pemerintah Nomor 9 Tahun 2021 tentang Toko Daring dan Katalog Elektronik;',
    'Peraturan Menteri Dalam Negeri Nomor 77 Tahun 2020 tentang Pedoman Teknis Pengelolaan Keuangan Daerah, khususnya terkait belanja barang pakai habis;',
    'Surat Edaran Kepala LKPP Nomor 3 Tahun 2022 tentang Pelaksanaan Pengadaan Makanan dan Minuman melalui e-Purchasing Katalog Elektronik;',
    'Undang-Undang Nomor 33 Tahun 2014 tentang Jaminan Produk Halal jo. Peraturan Pemerintah Nomor 39 Tahun 2021 (persyaratan halal wajib bagi penyedia makanan berupa produk olahan);',
    'Peraturan Daerah/Peraturan Kepala Daerah tentang APBD Tahun Anggaran berjalan.',
  ],
  jasa: [
    'Peraturan Presiden Nomor 16 Tahun 2018 sebagaimana telah diubah dengan Peraturan Presiden Nomor 12 Tahun 2021 tentang Pengadaan Barang/Jasa Pemerintah;',
    'Peraturan Lembaga Kebijakan Pengadaan Barang/Jasa Pemerintah Nomor 9 Tahun 2021 tentang Toko Daring dan Katalog Elektronik;',
    'Peraturan Lembaga Kebijakan Pengadaan Barang/Jasa Pemerintah Nomor 12 Tahun 2021 tentang Pedoman Pelaksanaan Pengadaan Barang/Jasa Pemerintah Melalui Penyedia;',
    'Peraturan Lembaga Kebijakan Pengadaan Barang/Jasa Pemerintah Nomor 7 Tahun 2021 tentang Sumber Daya Manusia Pengadaan Barang/Jasa;',
    'Peraturan Daerah/Peraturan Kepala Daerah tentang APBD Tahun Anggaran berjalan.',
  ],
  modal: [
    'Peraturan Presiden Nomor 16 Tahun 2018 sebagaimana telah diubah dengan Peraturan Presiden Nomor 12 Tahun 2021 tentang Pengadaan Barang/Jasa Pemerintah;',
    'Peraturan Lembaga Kebijakan Pengadaan Barang/Jasa Pemerintah Nomor 9 Tahun 2021 tentang Toko Daring dan Katalog Elektronik;',
    'Peraturan Menteri Keuangan tentang Standar Biaya Masukan (SBM) Tahun Anggaran berjalan;',
    'Peraturan Menteri Perindustrian Nomor 46 Tahun 2022 tentang Ketentuan dan Tata Cara Penghitungan Nilai Tingkat Komponen Dalam Negeri (TKDN) Produk Barang;',
    'Peraturan Pemerintah Nomor 27 Tahun 2014 sebagaimana telah diubah dengan PP Nomor 28 Tahun 2020 tentang Pengelolaan Barang Milik Negara/Daerah (kewajiban pencatatan sebagai aset tetap);',
    'Peraturan Daerah/Peraturan Kepala Daerah tentang APBD Tahun Anggaran berjalan.',
  ],
  pemeliharaan: [
    'Peraturan Presiden Nomor 16 Tahun 2018 sebagaimana telah diubah dengan Peraturan Presiden Nomor 12 Tahun 2021 tentang Pengadaan Barang/Jasa Pemerintah;',
    'Peraturan Lembaga Kebijakan Pengadaan Barang/Jasa Pemerintah Nomor 12 Tahun 2021 tentang Pedoman Pelaksanaan Pengadaan Barang/Jasa Pemerintah Melalui Penyedia;',
    'Peraturan Pemerintah Nomor 27 Tahun 2014 sebagaimana telah diubah dengan PP Nomor 28 Tahun 2020 tentang Pengelolaan Barang Milik Negara/Daerah (kewajiban pemeliharaan aset tetap pemerintah);',
    'Peraturan Menteri Dalam Negeri Nomor 19 Tahun 2016 tentang Pedoman Pengelolaan Barang Milik Daerah, khususnya terkait belanja pemeliharaan;',
    'Peraturan Daerah/Peraturan Kepala Daerah tentang APBD Tahun Anggaran berjalan.',
  ],
  konstruksi: [
    'Peraturan Presiden Nomor 16 Tahun 2018 sebagaimana telah diubah dengan Peraturan Presiden Nomor 12 Tahun 2021 tentang Pengadaan Barang/Jasa Pemerintah;',
    'Peraturan Lembaga Kebijakan Pengadaan Barang/Jasa Pemerintah Nomor 12 Tahun 2021 tentang Pedoman Pelaksanaan Pengadaan Barang/Jasa Pemerintah Melalui Penyedia, Lampiran V Pekerjaan Konstruksi;',
    'Undang-Undang Nomor 2 Tahun 2017 tentang Jasa Konstruksi sebagaimana telah diubah dengan Undang-Undang Nomor 11 Tahun 2020 tentang Cipta Kerja;',
    'Peraturan Pemerintah Nomor 22 Tahun 2020 sebagaimana telah diubah dengan PP Nomor 14 Tahun 2021 tentang Peraturan Pelaksanaan UU Jasa Konstruksi;',
    'Peraturan Menteri PUPR Nomor 8 Tahun 2023 tentang Pedoman Sistem Manajemen Keselamatan Konstruksi (SMKK);',
    'Peraturan Daerah/Peraturan Kepala Daerah tentang APBD Tahun Anggaran berjalan.',
  ],
  konsultasi_non: [
    'Peraturan Presiden Nomor 16 Tahun 2018 sebagaimana telah diubah dengan Peraturan Presiden Nomor 12 Tahun 2021 tentang Pengadaan Barang/Jasa Pemerintah, khususnya Pasal 3 huruf c tentang Jasa Konsultansi;',
    'Peraturan Lembaga Kebijakan Pengadaan Barang/Jasa Pemerintah Nomor 12 Tahun 2021 tentang Pedoman Pelaksanaan Pengadaan Barang/Jasa Pemerintah Melalui Penyedia, Lampiran VI Jasa Konsultansi Non-Konstruksi;',
    'Peraturan Lembaga Kebijakan Pengadaan Barang/Jasa Pemerintah Nomor 7 Tahun 2021 tentang Sumber Daya Manusia Pengadaan Barang/Jasa;',
    'Surat Edaran Kepala LKPP Nomor 22 Tahun 2021 tentang Pengadaan Jasa Konsultansi Perencanaan dan Pengawasan Konstruksi melalui Pengadaan Langsung;',
    'Standar Biaya Masukan (SBM) yang ditetapkan Menteri Keuangan untuk tahun anggaran berjalan (acuan tarif tenaga ahli konsultansi);',
    'Peraturan Daerah/Peraturan Kepala Daerah tentang APBD Tahun Anggaran berjalan.',
  ],
  konsultasi_konstruksi: [
    'Peraturan Presiden Nomor 16 Tahun 2018 sebagaimana telah diubah dengan Peraturan Presiden Nomor 12 Tahun 2021 tentang Pengadaan Barang/Jasa Pemerintah, Pasal 3 huruf c;',
    'Peraturan Lembaga Kebijakan Pengadaan Barang/Jasa Pemerintah Nomor 12 Tahun 2021, Lampiran VI Jasa Konsultansi, khususnya bagian Konsultansi Konstruksi;',
    'Undang-Undang Nomor 2 Tahun 2017 tentang Jasa Konstruksi sebagaimana diubah dengan UU Nomor 11 Tahun 2020 (persyaratan SKA/SKK perencana/pengawas konstruksi);',
    'Peraturan Pemerintah Nomor 22 Tahun 2020 jo PP Nomor 14 Tahun 2021 tentang Peraturan Pelaksanaan UU Jasa Konstruksi;',
    'Peraturan Menteri PUPR Nomor 8 Tahun 2023 tentang SMKK (wajib diterapkan oleh konsultan pengawas);',
    'Surat Edaran Kepala LKPP Nomor 22 Tahun 2021 tentang Pengadaan Jasa Konsultansi Perencanaan dan Pengawasan Konstruksi;',
    'Standar Biaya Masukan (SBM) Tahun Anggaran berjalan (acuan tarif tenaga ahli);',
    'Peraturan Daerah/Peraturan Kepala Daerah tentang APBD Tahun Anggaran berjalan.',
  ],
  konsolidasi: [
    'Peraturan Presiden Nomor 16 Tahun 2018 sebagaimana telah diubah dengan Peraturan Presiden Nomor 12 Tahun 2021 tentang Pengadaan Barang/Jasa Pemerintah, khususnya Pasal 20 tentang Konsolidasi Pengadaan Barang/Jasa;',
    'Peraturan Lembaga Kebijakan Pengadaan Barang/Jasa Pemerintah Nomor 11 Tahun 2021 tentang Pedoman Perencanaan Pengadaan Barang/Jasa Pemerintah (pengaturan konsolidasi dalam perencanaan);',
    'Peraturan Lembaga Kebijakan Pengadaan Barang/Jasa Pemerintah Nomor 9 Tahun 2021 tentang Toko Daring dan Katalog Elektronik;',
    'Surat Keputusan Penetapan Penyedia Terkonsolidasi dari Pejabat yang berwenang (UKPBJ/PA/KPA);',
    'Peraturan Daerah/Peraturan Kepala Daerah tentang APBD Tahun Anggaran berjalan untuk masing-masing Satuan Kerja peserta konsolidasi.',
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. KRITERIA EVALUASI / KOMPARASI — sangat berbeda per jenis pengadaan
// ─────────────────────────────────────────────────────────────────────────────
export const KOMPARASI_KRITERIA = {
  atk: [
    { key: 'harga_tayang',  label: 'Harga Tayang e-Katalog (Rp/Satuan)' },
    { key: 'harga_nego',    label: 'Harga Negosiasi Akhir (Rp/Satuan)' },
    { key: 'penyedia',      label: 'Nama Penyedia' },
    { key: 'jenis_katalog', label: 'Jenis Katalog' },
    { key: 'status_pdn',    label: 'Status PDN / TKDN' },
    { key: 'status_umkk',   label: 'Status UMKK/Koperasi' },
    { key: 'stok',          label: 'Ketersediaan Stok' },
    { key: 'kesesuaian',    label: 'Kesesuaian Spesifikasi DPP' },
    { key: 'status_pilih',  label: 'Hasil Evaluasi' },
  ],
  mamin: [
    { key: 'harga_tayang',  label: 'Harga Penawaran (Rp/Porsi atau Paket)' },
    { key: 'harga_nego',    label: 'Harga Negosiasi Akhir' },
    { key: 'penyedia',      label: 'Nama Penyedia / Katering' },
    { key: 'jenis_menu',    label: 'Jenis Menu / Sajian' },
    { key: 'sertif_halal',  label: 'Sertifikasi Halal (MUI/BPJPH)' },
    { key: 'kapasitas',     label: 'Kapasitas Layanan (maks. porsi/hari)' },
    { key: 'waktu_sajian',  label: 'Waktu Penyajian' },
    { key: 'kesesuaian',    label: 'Kesesuaian Spesifikasi Menu DPP' },
    { key: 'status_pilih',  label: 'Hasil Evaluasi' },
  ],
  jasa: [
    { key: 'harga_tayang',  label: 'Harga Penawaran / Harga Tayang (Rp)' },
    { key: 'harga_nego',    label: 'Harga Negosiasi Akhir (Rp)' },
    { key: 'penyedia',      label: 'Nama Penyedia Jasa' },
    { key: 'kualifikasi',   label: 'Kualifikasi / Sertifikasi Penyedia' },
    { key: 'ruang_lingkup', label: 'Ruang Lingkup Pekerjaan' },
    { key: 'output',        label: 'Output / Deliverable' },
    { key: 'jangka_waktu',  label: 'Jangka Waktu Layanan' },
    { key: 'pengalaman',    label: 'Pengalaman Pekerjaan Sejenis' },
    { key: 'status_pilih',  label: 'Hasil Evaluasi' },
  ],
  modal: [
    { key: 'harga_tayang',  label: 'Harga Tayang e-Katalog (Rp/Unit)' },
    { key: 'harga_nego',    label: 'Harga Negosiasi Akhir (Rp/Unit)' },
    { key: 'penyedia',      label: 'Nama Penyedia / Authorized Dealer' },
    { key: 'merk_tipe',     label: 'Merk / Tipe / Seri Barang' },
    { key: 'spek_teknis',   label: 'Spesifikasi Teknis Utama' },
    { key: 'tkdn_pct',      label: 'Nilai TKDN (%)' },
    { key: 'garansi',       label: 'Masa Garansi Resmi (Bulan/Tahun)' },
    { key: 'purna_jual',    label: 'Layanan Purna Jual / Service Center' },
    { key: 'kesesuaian',    label: 'Kesesuaian Spesifikasi KAK' },
    { key: 'status_pilih',  label: 'Hasil Evaluasi' },
  ],
  pemeliharaan: [
    { key: 'harga_tayang',  label: 'Harga Penawaran (Rp)' },
    { key: 'harga_nego',    label: 'Harga Negosiasi Akhir (Rp)' },
    { key: 'penyedia',      label: 'Nama Penyedia / Bengkel / Teknisi' },
    { key: 'kualif_teknis', label: 'Kualifikasi Teknisi / Mekanik' },
    { key: 'cakupan',       label: 'Cakupan Pekerjaan Pemeliharaan' },
    { key: 'spare_part',    label: 'Spare Part / Suku Cadang Termasuk' },
    { key: 'sla',           label: 'Waktu Pengerjaan / SLA (Hari Kerja)' },
    { key: 'garansi_kerja', label: 'Garansi Hasil Pekerjaan' },
    { key: 'status_pilih',  label: 'Hasil Evaluasi' },
  ],
  konstruksi: [
    { key: 'harga_tayang',  label: 'Harga Penawaran (Rp)' },
    { key: 'harga_nego',    label: 'Harga Negosiasi / Kontrak (Rp)' },
    { key: 'penyedia',      label: 'Nama Penyedia / Kontraktor' },
    { key: 'sbu',           label: 'Sertifikat Badan Usaha (SBU) / Kualifikasi' },
    { key: 'tenaga_ahli',   label: 'Tenaga Ahli / SKK Konstruksi' },
    { key: 'metode',        label: 'Metode Pelaksanaan Pekerjaan' },
    { key: 'jadwal',        label: 'Jangka Waktu Pelaksanaan (Hari Kalender)' },
    { key: 'k3',            label: 'Rencana K3 Konstruksi (SMKK)' },
    { key: 'pengalaman',    label: 'Pengalaman Pekerjaan Sejenis (5 Tahun)' },
    { key: 'status_pilih',  label: 'Hasil Evaluasi' },
  ],
  konsultasi_non: [
    { key: 'harga_tayang',    label: 'Total Penawaran Biaya (Rp)' },
    { key: 'harga_nego',      label: 'Biaya Kontrak Disepakati (Rp)' },
    { key: 'penyedia',        label: 'Nama Penyedia / Konsultan' },
    { key: 'kualifikasi',     label: 'Kualifikasi Badan Usaha / NIB' },
    { key: 'tenaga_ahli',     label: 'Tenaga Ahli Utama & SKA/SKK' },
    { key: 'biaya_personil',  label: 'Komponen Biaya Personil' },
    { key: 'biaya_nonpers',   label: 'Komponen Biaya Non-Personil' },
    { key: 'output',          label: 'Output / Laporan yang Dihasilkan' },
    { key: 'jangka_waktu',    label: 'Jangka Waktu Penugasan (Bulan)' },
    { key: 'pengalaman',      label: 'Pengalaman Pekerjaan Sejenis' },
    { key: 'status_pilih',    label: 'Hasil Evaluasi' },
  ],
  konsultasi_konstruksi: [
    { key: 'harga_tayang',    label: 'Total Biaya Konsultansi (Rp)' },
    { key: 'harga_nego',      label: 'Biaya Konsultansi Disepakati (Rp)' },
    { key: 'penyedia',        label: 'Nama Konsultan / Badan Usaha' },
    { key: 'sbu',             label: 'SBU Konsultansi Konstruksi' },
    { key: 'tenaga_ahli',     label: 'Tenaga Ahli Utama + SKA Konstruksi' },
    { key: 'biaya_personil',  label: 'Biaya Personil (Man-Month × Tarif)' },
    { key: 'biaya_nonpers',   label: 'Biaya Non-Personil (Laporan, Transport)' },
    { key: 'pengalaman',      label: 'Pengalaman Pekerjaan Sejenis (5 Tahun)' },
    { key: 'k3',              label: 'Penerapan SMKK oleh Konsultan Pengawas' },
    { key: 'jadwal',          label: 'Jangka Waktu Penugasan (Hari Kalender)' },
    { key: 'status_pilih',    label: 'Hasil Evaluasi' },
  ],
  konsolidasi: [
    { key: 'harga_tayang',  label: 'Harga Tayang e-Katalog (Rp/Satuan)' },
    { key: 'harga_nego',    label: 'Harga Negosiasi Terkonsolidasi (Rp)' },
    { key: 'penyedia',      label: 'Nama Penyedia Terkonsolidasi' },
    { key: 'jenis_katalog', label: 'Jenis Katalog' },
    { key: 'status_pdn',    label: 'Status PDN / TKDN' },
    { key: 'stok',          label: 'Ketersediaan Stok (Total Volume)' },
    { key: 'kesesuaian',    label: 'Kesesuaian Spesifikasi Seluruh Satker' },
    { key: 'status_pilih',  label: 'Hasil Evaluasi' },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. KLAUSUL KHUSUS — berbeda per jenis pengadaan
// ─────────────────────────────────────────────────────────────────────────────
export const KLAUSUL_KHUSUS = {
  atk: {
    judul: 'Klausul Preferensi Harga dan PDN/UMKM',
    isi: `Dalam pelaksanaan e-Purchasing melalui Katalog Elektronik, Pejabat Pengadaan telah memprioritaskan pemilihan penyedia yang merupakan Usaha Mikro, Kecil, dan Koperasi (UMKK) sesuai amanat Pasal 65 Perpres 12/2021, serta memberikan preferensi kepada Produk Dalam Negeri (PDN) dengan nilai TKDN minimal sesuai ketentuan yang berlaku.

Pemilihan penyedia dilakukan berdasarkan pertimbangan: (1) harga satuan terbaik sesuai pagu DPA; (2) ketersediaan stok yang cukup; (3) kesesuaian spesifikasi dengan kebutuhan; dan (4) lokasi penyedia yang memungkinkan pengiriman tepat waktu.`,
  },
  mamin: {
    judul: 'Klausul Kegiatan, Halal, dan Keamanan Pangan',
    isi: `Pengadaan makanan dan minuman ini diperuntukkan bagi pelaksanaan kegiatan dinas sebagaimana tercantum dalam DPA Satuan Kerja. Pejabat Pengadaan memastikan bahwa:
(1) Penyedia yang dipilih memiliki izin edar/izin usaha katering/restoran yang masih berlaku;
(2) Produk makanan dan minuman yang disajikan telah memenuhi standar keamanan pangan sesuai ketentuan Badan Pengawas Obat dan Makanan (BPOM);
(3) Penyedia telah memiliki atau sedang dalam proses sertifikasi halal dari Badan Penyelenggara Jaminan Produk Halal (BPJPH) sesuai amanat UU Nomor 33 Tahun 2014;
(4) Menu yang disajikan telah disesuaikan dengan Standar Biaya Masukan (SBM) Kementerian Keuangan untuk rapat/pertemuan dinas.`,
  },
  jasa: {
    judul: 'Klausul Output, Pembayaran, dan Sanksi',
    isi: `Pekerjaan jasa ini dilaksanakan berdasarkan lingkup pekerjaan (scope of work) yang telah ditetapkan dalam Kerangka Acuan Kerja (KAK). Pembayaran dilakukan setelah penyedia menyelesaikan pekerjaan dan menyerahkan output/deliverable yang telah diperiksa dan diterima oleh Pejabat Pembuat Komitmen (PPK). Keterlambatan penyelesaian pekerjaan dikenakan denda keterlambatan sebesar 1‰ (satu permil) per hari dari nilai kontrak, maksimal 5% dari nilai kontrak sebagaimana diatur dalam Perpres 12/2021 Pasal 78.`,
  },
  modal: {
    judul: 'Klausul Garansi, TKDN, dan Pencatatan Aset',
    isi: `Barang modal yang diadakan wajib dilengkapi dengan: (1) dokumen garansi resmi dari pabrikan/produsen yang mencantumkan nomor seri, masa garansi, dan service center resmi terdekat; (2) sertifikat TKDN yang diterbitkan oleh Kementerian Perindustrian untuk produk yang dipersyaratkan; (3) faktur pembelian asli dan bukti serah terima barang (BAST).

Setelah diterima, barang modal ini akan dicatat dalam Daftar Inventaris Barang Milik Daerah (BMD) sesuai ketentuan PP 28/2020 tentang Pengelolaan BMN/BMD, dan dilaporkan dalam neraca SKPD pada periode pelaporan keuangan berikutnya.`,
  },
  pemeliharaan: {
    judul: 'Klausul Kondisi Awal, Pekerjaan, dan Garansi Hasil',
    isi: `Sebelum pelaksanaan pekerjaan pemeliharaan, Pejabat Pengadaan bersama penyedia telah melakukan pemeriksaan kondisi awal objek yang akan dipelihara. Seluruh pekerjaan pemeliharaan dilaksanakan sesuai standar teknis yang berlaku, menggunakan suku cadang/bahan asli (genuine) atau yang setara (equivalent) sesuai spesifikasi.

Penyedia memberikan garansi atas hasil pekerjaan selama paling sedikit 30 (tiga puluh) hari kalender sejak tanggal serah terima hasil pekerjaan. Apabila dalam masa garansi ditemukan kerusakan/kecacatan akibat kesalahan pengerjaan, penyedia wajib memperbaiki tanpa biaya tambahan.`,
  },
  konstruksi: {
    judul: 'Klausul SBU, K3 Konstruksi, Retensi, dan Pengawasan',
    isi: `Penyedia pekerjaan konstruksi yang dipilih telah memenuhi persyaratan kualifikasi sebagai berikut:
(1) Memiliki Sertifikat Badan Usaha (SBU) dengan subklasifikasi yang sesuai, masih berlaku;
(2) Memiliki tenaga kerja konstruksi bersertifikat (SKK Konstruksi) sesuai jenis pekerjaan;
(3) Menyusun dan menerapkan Rencana K3 Konstruksi sesuai Peraturan Menteri PUPR Nomor 8 Tahun 2023 tentang Sistem Manajemen Keselamatan Konstruksi (SMKK);
(4) Pelaksanaan pekerjaan wajib didampingi pengawas lapangan yang memiliki kompetensi sesuai bidang.

Retensi sebesar 5% (lima persen) dari nilai kontrak akan ditahan hingga masa pemeliharaan pekerjaan selesai (minimal 6 bulan setelah serah terima pertama/PHO), kemudian akan dibayarkan setelah Final Hand Over (FHO) dinyatakan selesai dengan baik.`,
  },
  konsultasi_non: {
    judul: 'Klausul Biaya Personil, Deliverable, dan Kualifikasi Tenaga Ahli',
    isi: `Pekerjaan jasa konsultansi non-konstruksi ini dilaksanakan berdasarkan Kerangka Acuan Kerja (KAK/TOR) yang menjadi bagian tidak terpisahkan dari perjanjian. Struktur biaya terdiri dari:
(1) Biaya Personil — dihitung berdasarkan Man-Month × Tarif Harga Satuan Orang-Bulan (HSOB) sesuai Standar Biaya Masukan (SBM) yang berlaku;
(2) Biaya Non-Personil — mencakup biaya perjalanan dinas, transportasi, akomodasi, dan penyusunan laporan.

Seluruh tenaga ahli yang ditugaskan wajib memiliki Sertifikat Keahlian (SKA) atau Sertifikat Kompetensi Kerja (SKK) yang sesuai dan masih berlaku. Pembayaran dilakukan berdasarkan penyelesaian output/deliverable yang telah diverifikasi oleh PPK, bukan berdasarkan kehadiran semata.`,
  },
  konsultasi_konstruksi: {
    judul: 'Klausul SBU Konsultansi, Penugasan Tenaga Ahli, dan SPTA',
    isi: `Penyedia jasa konsultansi konstruksi yang dipilih wajib memenuhi persyaratan sebagai berikut:
(1) Memiliki Sertifikat Badan Usaha (SBU) Jasa Konsultansi Konstruksi yang sesuai dengan subklasifikasi pekerjaan, masih berlaku;
(2) Tenaga Ahli Utama (Team Leader) wajib memiliki SKA Ahli Madya/Utama yang relevan;
(3) Surat Perintah Tugas (SPTA) wajib diterbitkan oleh Direktur/Pimpinan Penyedia sebelum penugasan dimulai;
(4) Konsultan Pengawas wajib menerapkan SMKK (Peraturan Menteri PUPR Nomor 8 Tahun 2023) selama pelaksanaan konstruksi.

Biaya personil dihitung berdasarkan Tarif Harga Satuan Orang-Bulan (HSOB) sesuai SBM. Biaya non-personil mencakup laporan pendahuluan, antara, akhir, dan dokumentasi foto. Pembayaran dilakukan berdasarkan kemajuan pekerjaan/deliverable yang diverifikasi.`,
  },
  konsolidasi: {
    judul: 'Klausul Konsolidasi Pengadaan dan SK Penetapan Penyedia',
    isi: `Pengadaan ini merupakan Pengadaan Terkonsolidasi sebagaimana diatur dalam Pasal 20 Peraturan Presiden Nomor 12 Tahun 2021, yang dilaksanakan atas dasar Surat Keputusan Penetapan Penyedia Terkonsolidasi dari pejabat yang berwenang. Konsolidasi dilakukan untuk menggabungkan kebutuhan yang sejenis dari beberapa Satuan Kerja/PPK dalam satu proses pengadaan, sehingga diperoleh efisiensi harga dan kemudahan pengelolaan.

Penyedia yang ditetapkan bertanggung jawab untuk memenuhi kebutuhan seluruh Satuan Kerja peserta konsolidasi sesuai volume dan jadwal pengiriman/layanan yang telah ditetapkan. Masing-masing PPK Satuan Kerja peserta menerbitkan Surat Pesanan (SP) secara terpisah berdasarkan BAHP Terkonsolidasi ini.`,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. PERNYATAAN PENUTUP — sesuai karakteristik masing-masing pengadaan
// ─────────────────────────────────────────────────────────────────────────────
export const PENUTUP_TEMPLATE = {
  atk: `Berdasarkan hasil penelusuran Katalog Elektronik, komparasi harga dari beberapa penyedia, dan proses negosiasi yang telah dilakukan, Pejabat Pengadaan menetapkan penyedia sebagaimana tercantum dalam Lampiran I berita acara ini sebagai penyedia terpilih. Penetapan didasarkan pada pertimbangan harga satuan terbaik, kesesuaian spesifikasi dengan kebutuhan satuan kerja, ketersediaan stok, status UMKK/PDN, serta kemampuan pengiriman sesuai jadwal yang diperlukan.

Seluruh dokumen pendukung termasuk tangkapan layar e-Katalog, riwayat negosiasi, dan bukti perbandingan harga telah terdokumentasi dan merupakan lampiran yang tidak terpisahkan dari berita acara ini.`,

  mamin: `Berdasarkan hasil penelusuran dan komparasi penyedia makanan dan minuman melalui e-Katalog LKPP serta konfirmasi langsung kepada penyedia, Pejabat Pengadaan menetapkan penyedia katering/makanan sebagaimana tercantum dalam berita acara ini. Penetapan mempertimbangkan: kewajaran harga per porsi sesuai SBM yang berlaku, sertifikasi halal, kapasitas produksi, reputasi/pengalaman penyedia, dan kesesuaian menu dengan spesifikasi kegiatan dinas.

Penyedia yang dipilih bertanggung jawab atas kualitas, kebersihan, keamanan pangan, dan ketepatan waktu penyajian selama pelaksanaan kegiatan.`,

  jasa: `Berdasarkan hasil evaluasi teknis dan komparasi harga penawaran dari beberapa penyedia jasa yang terdaftar dalam Katalog Elektronik LKPP, Pejabat Pengadaan menetapkan penyedia jasa sebagaimana tercantum dalam berita acara ini. Penyedia dinilai memenuhi seluruh persyaratan kualifikasi, memiliki pengalaman yang relevan, dan memberikan penawaran harga yang wajar sesuai dengan ruang lingkup pekerjaan yang ditetapkan dalam KAK.

Surat Pesanan (SP) akan diterbitkan oleh PPK setelah berita acara ini ditandatangani, sebagai dasar pelaksanaan pekerjaan jasa.`,

  modal: `Berdasarkan hasil penelusuran Katalog Elektronik, verifikasi spesifikasi teknis secara menyeluruh, dan proses negosiasi harga, Pejabat Pengadaan menetapkan penyedia barang modal sebagaimana tercantum dalam berita acara ini. Pertimbangan utama penetapan meliputi: kesesuaian spesifikasi teknis dengan KAK secara penuh, nilai TKDN yang memenuhi ambang batas, garansi resmi dari pabrikan, ketersediaan service center resmi di wilayah Jawa Timur, dan efisiensi anggaran yang dicapai melalui negosiasi.

Barang yang diadakan akan diinventarisasi sebagai Barang Milik Daerah sesuai peraturan perundang-undangan yang berlaku.`,

  pemeliharaan: `Berdasarkan hasil survei kondisi, analisis kebutuhan pemeliharaan, dan komparasi penawaran dari beberapa penyedia jasa pemeliharaan, Pejabat Pengadaan menetapkan penyedia sebagaimana tercantum dalam berita acara ini. Penyedia yang dipilih memiliki kualifikasi teknis yang sesuai, pengalaman menangani objek pemeliharaan sejenis, dan memberikan penawaran harga yang wajar disertai jaminan garansi hasil pekerjaan.

Seluruh pekerjaan pemeliharaan harus diselesaikan sesuai jadwal yang ditetapkan, dan hasilnya akan diperiksa bersama oleh Pejabat Pengadaan/PPK sebelum pembayaran dilakukan.`,

  konstruksi: `Berdasarkan hasil evaluasi dokumen penawaran, verifikasi kualifikasi penyedia, pemeriksaan lapangan, dan klarifikasi teknis, Pejabat Pengadaan menetapkan penyedia pekerjaan konstruksi sebagaimana tercantum dalam berita acara ini. Penyedia telah memenuhi seluruh persyaratan administrasi, teknis, dan keuangan yang ditetapkan dalam dokumen pengadaan.

Kontrak pekerjaan akan diterbitkan oleh PPK setelah penetapan ini mendapat persetujuan. Masa pelaksanaan pekerjaan, retensi, dan mekanisme PHO/FHO dilaksanakan sesuai ketentuan Perlem LKPP 12/2021 Lampiran V dan kontrak yang akan ditandatangani.`,

  konsultasi_non: `Berdasarkan hasil evaluasi teknis terhadap Kerangka Acuan Kerja (KAK/TOR), komparasi kualifikasi dan biaya dari beberapa penyedia jasa konsultansi, serta klarifikasi teknis yang dilakukan, Pejabat Pengadaan menetapkan penyedia jasa konsultansi non-konstruksi sebagaimana tercantum dalam berita acara ini. Penyedia dinilai memenuhi seluruh persyaratan kualifikasi badan usaha, memiliki tenaga ahli dengan SKA/SKK yang relevan, dan menawarkan biaya yang wajar sesuai SBM yang berlaku.

Surat Perintah Kerja (SPK)/Kontrak akan diterbitkan oleh PPK setelah BAHP ini ditandatangani. Pembayaran dilakukan secara bertahap berdasarkan penyelesaian deliverable sebagaimana diatur dalam KAK.`,

  konsultasi_konstruksi: `Berdasarkan hasil evaluasi administrasi, teknis, dan biaya terhadap penawaran penyedia jasa konsultansi konstruksi, verifikasi SBU dan SKA tenaga ahli, serta klarifikasi teknis terkait metodologi kerja dan rencana penugasan, Pejabat Pengadaan menetapkan penyedia konsultansi konstruksi sebagaimana tercantum dalam berita acara ini.

Penyedia dinilai memiliki SBU yang sesuai, tenaga ahli dengan SKA yang relevan dan masih berlaku, pengalaman pekerjaan sejenis yang cukup, serta menawarkan biaya yang wajar sesuai SBM. Surat Perintah Mulai Kerja (SPMK) akan diterbitkan oleh PPK setelah kontrak ditandatangani.`,

  konsolidasi: `Berdasarkan hasil penelusuran Katalog Elektronik, verifikasi kemampuan penyedia untuk memenuhi kebutuhan seluruh Satuan Kerja peserta konsolidasi, komparasi harga, dan proses negosiasi terkonsolidasi yang telah dilakukan, Pejabat Pengadaan menetapkan penyedia sebagaimana tercantum dalam berita acara ini sebagai Penyedia Terkonsolidasi. Penetapan mengacu pada Surat Keputusan Konsolidasi yang diterbitkan UKPBJ/PA/KPA yang berwenang.

Masing-masing PPK Satuan Kerja peserta selanjutnya menerbitkan Surat Pesanan (SP) secara individual berdasarkan berita acara ini, sesuai volume kebutuhan masing-masing satker yang telah dikonfirmasi.`,
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. FIELD TAMBAHAN KHAS per template — untuk header tabel Seksi A
// ─────────────────────────────────────────────────────────────────────────────
export const KOLOM_TAMBAHAN_SEKSI_A = {
  atk:                   ['Status PDN', 'Status UMKK'],
  mamin:                 ['Menu/Sajian', 'Halal'],
  jasa:                  ['Output/Deliverable', 'Jangka Waktu'],
  modal:                 ['Merk/Tipe', 'Garansi', 'TKDN (%)'],
  pemeliharaan:          ['Objek Pelihara', 'Garansi Kerja'],
  konstruksi:            ['SBU', 'Jangka Waktu (HK)', 'Retensi'],
  konsultasi_non:        ['Tenaga Ahli', 'Jangka Waktu', 'Output'],
  konsultasi_konstruksi: ['SBU Konsultansi', 'Tenaga Ahli', 'SPTA'],
  konsolidasi:           ['Status PDN', 'Volume Total', 'Jml Satker'],
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. KONFIGURASI FORM VALIDASI — Label & placeholder adaptif per jenis
// ─────────────────────────────────────────────────────────────────────────────
export const VALIDASI_CONFIG = {
  atk: {
    d1Label: 'Verifikasi Kesetaraan Spesifikasi Barang',
    d1Desc: 'Apakah spesifikasi merek, tipe, gramatur, dan kualitas ATK sesuai DPP PPK?',
    d1OptYes: 'Ya, spesifikasi merek/tipe sesuai DPP dan tidak ada perbedaan',
    d1OptNo: 'Tidak, ada perbedaan spesifikasi barang',
    d3Section: null,
    deliveryLabel: 'Waktu Pengiriman Disepakati',
    deliveryPlaceholder: 'Contoh: 14 hari kalender sejak SP diterbitkan',
    warrantyLabel: 'Ketentuan Retur / Ganti Baru',
    warrantyPlaceholder: 'Contoh: Penggantian produk rusak maksimal 3 hari kerja',
    paymentOptions: [
      'Lunas setelah serah terima barang dan BAST',
      'Termin: 50% DP, 50% setelah BAST',
      'Lunas setelah cek kualitas dan BAST',
    ],
    chatLabel: 'Bukti Komunikasi / Chat Negosiasi dengan Penyedia ATK',
    chatPlaceholder: 'Contoh: Penyedia (Bapak Dedi - 0812xxx) via WA menyepakati harga Rp 8.500.000 per unit sudah termasuk ongkir. Stok tersedia dan bisa kirim dalam 7 hari kerja...',
  },
  mamin: {
    d1Label: 'Verifikasi Menu & Standar Penyajian',
    d1Desc: 'Apakah menu, porsi, standar penyajian, dan higienitas telah sesuai KAK dan SBM?',
    d1OptYes: 'Ya, menu dan standar penyajian sesuai KAK dan SBM',
    d1OptNo: 'Tidak, ada perbedaan dari spesifikasi menu yang diminta',
    d3Section: null,
    deliveryLabel: 'Waktu Pengantaran Makanan',
    deliveryPlaceholder: 'Contoh: Setiap jam 11:30 WIB di lokasi rapat, H-1 konfirmasi jumlah',
    warrantyLabel: 'Ketentuan Higienitas & Penggantian Menu',
    warrantyPlaceholder: 'Contoh: Makanan tidak sesuai/basi diganti dalam 1 jam tanpa biaya tambahan',
    paymentOptions: [
      'Lunas setelah selesai kegiatan dan BAST',
      'Lunas per termin kegiatan',
      'Termin bulanan sesuai realisasi pengantaran',
    ],
    chatLabel: 'Konfirmasi Pesanan & Komunikasi dengan Penyedia Mamin',
    chatPlaceholder: 'Contoh: Penyedia (Ibu Sari Katering - 0813xxx) via WA menyepakati menu prasmanan 50 porsi @ Rp 75.000 sudah termasuk air mineral dan peralatan makan. Konfirmasi H-1 pesanan...',
  },
  jasa: {
    d1Label: 'Verifikasi Ruang Lingkup & Output Jasa',
    d1Desc: 'Apakah scope of work, kualifikasi penyedia, dan output/deliverable sesuai KAK?',
    d1OptYes: 'Ya, ruang lingkup dan output jasa sesuai KAK yang ditetapkan',
    d1OptNo: 'Tidak, ada perbedaan ruang lingkup atau output dari KAK',
    d3Section: null,
    deliveryLabel: 'Jangka Waktu Layanan Jasa',
    deliveryPlaceholder: 'Contoh: 12 Bulan sejak SPMK diterbitkan / Sampai dengan 31 Desember 2026',
    warrantyLabel: 'Jaminan Layanan (SLA) yang Disepakati',
    warrantyPlaceholder: 'Contoh: SLA Kehadiran minimal 95%, Respons keluhan maksimal 1x24 jam',
    paymentOptions: [
      'Lunas setelah serah terima hasil pekerjaan (BAST)',
      'Termin bulanan sesuai kemajuan pekerjaan',
      'Termin: 30% awal, 70% setelah selesai',
      'Termin per milestone / output deliverable',
    ],
    chatLabel: 'Bukti Komunikasi Negosiasi dengan Penyedia Jasa',
    chatPlaceholder: 'Contoh: Penyedia jasa (PT. ABC - Bpk Joko - 0821xxx) via email menyepakati biaya jasa Rp 15.000.000/bulan sudah termasuk transportasi lokal dan laporan bulanan. SLA kehadiran 22 hari kerja/bulan...',
  },
  modal: {
    d1Label: 'Verifikasi Spesifikasi Teknis & TKDN Barang Modal',
    d1Desc: 'Apakah spesifikasi teknis, TKDN, garansi, dan service center sesuai KAK?',
    d1OptYes: 'Ya, spesifikasi teknis sesuai KAK dan TKDN memenuhi ambang batas',
    d1OptNo: 'Tidak, ada perbedaan spesifikasi teknis atau TKDN tidak terpenuhi',
    d3Section: 'bmd',
    deliveryLabel: 'Waktu Pengiriman & Instalasi / Uji Fungsi',
    deliveryPlaceholder: 'Contoh: Maksimal 30 hari kalender termasuk instalasi dan uji fungsi/commissioning',
    warrantyLabel: 'Masa Garansi Resmi & Layanan Purna Jual',
    warrantyPlaceholder: 'Contoh: 3 Tahun Garansi Sparepart & Service On-Site, Service Center di Surabaya',
    paymentOptions: [
      'Lunas setelah serah terima barang, instalasi, dan BAST',
      'Termin: 50% DP, 50% setelah BAST dan uji fungsi',
      'Termin: 30% DP, 70% setelah BAST dan komisioning',
      'Lunas setelah cek kualitas, komisioning, dan BAST',
    ],
    chatLabel: 'Bukti Negosiasi Barang Modal dengan Authorized Dealer',
    chatPlaceholder: 'Contoh: Distributor resmi (PT. XYZ - Bpk Anton) via email menyepakati harga Rp 85.000.000/unit sudah termasuk ongkir, instalasi, dan garansi 3 tahun on-site. Nomor seri akan dicatat saat BAST...',
  },
  pemeliharaan: {
    d1Label: 'Verifikasi Kondisi Awal & Cakupan Pekerjaan Pemeliharaan',
    d1Desc: 'Apakah kondisi awal objek, cakupan pekerjaan, dan spare part telah sesuai kesepakatan?',
    d1OptYes: 'Ya, kondisi awal dan cakupan pekerjaan sudah disepakati bersama',
    d1OptNo: 'Tidak, ada perbedaan kondisi atau cakupan dari yang direncanakan',
    d3Section: null,
    deliveryLabel: 'Jangka Waktu Pemeliharaan / Penyelesaian',
    deliveryPlaceholder: 'Contoh: 1 Tahun sejak kontrak ditandatangani / Selesai dalam 7 hari kerja per kunjungan',
    warrantyLabel: 'Response Time & Garansi Hasil Pekerjaan',
    warrantyPlaceholder: 'Contoh: Garansi perbaikan 3 bulan, emergency response maksimal 4 jam',
    paymentOptions: [
      'Lunas setelah selesai pekerjaan dan BAST',
      'Termin per kunjungan/service yang terlaksana',
      'Termin bulanan untuk kontrak berlangganan',
      'Termin: 50% saat mulai, 50% setelah selesai dan BAST',
    ],
    chatLabel: 'Konfirmasi Jadwal & Komunikasi dengan Penyedia Pemeliharaan',
    chatPlaceholder: 'Contoh: Teknisi (CV. Maju Teknik - Bpk Rian - 0878xxx) via WA menyepakati jadwal service AC 12 unit @ Rp 150.000 termasuk freon. Garansi 3 bulan. Jadwal: Selasa 10 Juni 2026...',
  },
  konstruksi: {
    d1Label: 'Verifikasi Gambar Teknis, RAB & Metode Pelaksanaan',
    d1Desc: 'Apakah gambar teknis, RAB, metode kerja, dan rencana K3/SMKK sudah sesuai?',
    d1OptYes: 'Ya, gambar teknis, RAB, dan metode pelaksanaan sesuai dokumen pengadaan',
    d1OptNo: 'Tidak, ada perbedaan gambar teknis, RAB, atau metode dari dokumen',
    d3Section: 'lokasi_konstruksi',
    deliveryLabel: 'Waktu Pelaksanaan Pekerjaan (Kurva S)',
    deliveryPlaceholder: 'Contoh: 90 Hari Kalender sejak SPMK diterbitkan',
    warrantyLabel: 'Masa Pemeliharaan / Retensi Konstruksi',
    warrantyPlaceholder: 'Contoh: 180 Hari Kalender sejak PHO (Serah Terima Pertama) — Retensi 5%',
    paymentOptions: [
      'Termin sesuai kemajuan pekerjaan (progress payment)',
      'Termin: 30% awal, 60% kemajuan 80%, 10% setelah FHO',
      'Lunas setelah PHO dikurangi 5% retensi hingga FHO',
      'Termin bulanan sesuai Berita Acara Kemajuan Pekerjaan',
    ],
    chatLabel: 'Dokumentasi Klarifikasi Teknis & Negosiasi dengan Kontraktor',
    chatPlaceholder: 'Contoh: Kontraktor (CV. Karya Mandiri - Bpk Hendra) via rapat klarifikasi menyepakati metode pelaksanaan, RAB revisi, dan jadwal kurva S. SBU aktif hingga Desember 2026. RKK akan diserahkan sebelum SPMK...',
  },
  konsultasi_non: {
    d1Label: 'Verifikasi KAK/TOR & Kualifikasi Tenaga Ahli',
    d1Desc: 'Apakah Kerangka Acuan Kerja (KAK), kualifikasi tenaga ahli, dan komponen biaya sudah sesuai?',
    d1OptYes: 'Ya, KAK/TOR dipahami dan kualifikasi tenaga ahli sesuai persyaratan',
    d1OptNo: 'Tidak, ada perbedaan pemahaman KAK atau kualifikasi tenaga ahli kurang',
    d3Section: 'biaya_personil',
    deliveryLabel: 'Jangka Waktu Penugasan Konsultan',
    deliveryPlaceholder: 'Contoh: 6 Bulan (180 Hari Kalender) sejak SPK diterbitkan',
    warrantyLabel: 'Deliverable / Output yang Wajib Diserahkan',
    warrantyPlaceholder: 'Contoh: Laporan Pendahuluan (Bln 1), Antara (Bln 3), Akhir (Bln 6) + Softcopy',
    paymentOptions: [
      'Termin per deliverable/laporan yang diserahkan',
      'Termin bulanan berdasarkan kemajuan pekerjaan',
      'Termin: 20% Lap. Pendahuluan, 50% Lap. Antara, 30% Lap. Akhir',
      'Lunas setelah seluruh laporan diterima dan disetujui PPK',
    ],
    chatLabel: 'Dokumentasi Klarifikasi Teknis dengan Konsultan',
    chatPlaceholder: 'Contoh: Konsultan (PT. Arsitek Maju - Ibu Dewi - 0811xxx) via rapat klarifikasi menyepakati KAK, struktur tim ahli, dan biaya personil. CV tenaga ahli sudah diserahkan. SPTA akan diterbitkan setelah kontrak...',
  },
  konsultasi_konstruksi: {
    d1Label: 'Verifikasi SBU, SKA Tenaga Ahli & Metodologi Kerja',
    d1Desc: 'Apakah SBU konsultansi, SKA tenaga ahli, metodologi, dan biaya sudah sesuai persyaratan?',
    d1OptYes: 'Ya, SBU aktif, SKA tenaga ahli valid, dan metodologi kerja sesuai KAK',
    d1OptNo: 'Tidak, ada kekurangan SBU, SKA, atau metodologi tidak memenuhi syarat',
    d3Section: 'biaya_personil',
    deliveryLabel: 'Jangka Waktu Penugasan Konsultan Konstruksi',
    deliveryPlaceholder: 'Contoh: Sesuai masa pelaksanaan konstruksi + 30 hari after FHO',
    warrantyLabel: 'Laporan & Deliverable yang Wajib Diserahkan',
    warrantyPlaceholder: 'Contoh: Laporan Bulanan, Laporan Akhir, Gambar As-Built, Dokumentasi Foto per Fase',
    paymentOptions: [
      'Termin bulanan berdasarkan laporan kemajuan pengawasan',
      'Termin per tahap konstruksi (fondasi, struktur, finishing)',
      'Termin: 20% awal, 60% berkala, 20% setelah FHO',
      'Sesuai kemajuan konstruksi yang diawasi (progress payment)',
    ],
    chatLabel: 'Dokumentasi Rapat Klarifikasi dengan Konsultan Konstruksi',
    chatPlaceholder: 'Contoh: Konsultan pengawas (PT. Supervisi - Bpk Agus SKA Utama - 0856xxx) via rapat klarifikasi menyepakati penugasan tim, jadwal pelaporan, dan fee bulanan. SBU Konsultansi Konstruksi aktif hingga Maret 2027. SPTA akan diterbitkan direktur...',
  },
  konsolidasi: {
    d1Label: 'Verifikasi Pagu Per Satker & Kesesuaian Spesifikasi Konsolidasi',
    d1Desc: 'Apakah pagu masing-masing satker, total volume, dan spesifikasi terkonsolidasi sudah dikonfirmasi?',
    d1OptYes: 'Ya, pagu dan spesifikasi seluruh satker peserta telah dikonfirmasi dan sesuai',
    d1OptNo: 'Tidak, ada perbedaan pagu atau spesifikasi antara satker peserta',
    d3Section: 'satker_peserta',
    deliveryLabel: 'Jadwal Pengiriman / Layanan Terkonsolidasi',
    deliveryPlaceholder: 'Contoh: Bertahap per satker sesuai SK Konsolidasi, total selesai dalam 30 hari sejak SP',
    warrantyLabel: 'Ketentuan Retur & Penggantian Barang',
    warrantyPlaceholder: 'Contoh: Penggantian produk rusak/tidak sesuai maksimal 5 hari kerja per satker',
    paymentOptions: [
      'Masing-masing satker membayar setelah BAST per satker',
      'Satu pembayaran terpusat setelah seluruh satker menerima',
      'Termin per satker sesuai jadwal pengiriman masing-masing',
    ],
    chatLabel: 'Konfirmasi Penyedia Terkonsolidasi & Koordinasi Pengiriman',
    chatPlaceholder: 'Contoh: Penyedia terkonsolidasi (CV. Anugrah - Bpk Rudi) via koordinasi menyepakati jadwal pengiriman bertahap ke 5 satker. Total volume 500 rim kertas. Pengiriman mulai Senin, konfirmasi per WA Grup Koordinasi...',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. HELPER — resolusi nilai sel pada matriks komparasi
// ─────────────────────────────────────────────────────────────────────────────
export function resolveCritVal(kritKey, col, isSelected) {
  switch (kritKey) {
    case 'harga_tayang':    return `Rp ${(col.harga_tayang || 0).toLocaleString('id-ID')}`;
    case 'harga_nego':      return isSelected ? `Rp ${(col.harga_nego || 0).toLocaleString('id-ID')}` : '—';
    case 'penyedia':        return col.vendor || '—';
    case 'status_pilih':    return isSelected ? 'TERPILIH' : 'Pembanding';
    case 'kesesuaian':      return isSelected ? 'Sesuai KAK/DPP' : '—';
    case 'stok':            return isSelected ? 'Tersedia' : '—';
    case 'status_pdn':      return col.extra?.status_pdn    || (isSelected ? 'PDN / TKDN' : '—');
    case 'status_umkk':     return col.extra?.status_umkk   || (isSelected ? 'UMKK'       : '—');
    case 'jenis_katalog':   return col.extra?.jenis_katalog || (isSelected ? 'Lokal'       : '—');
    case 'jenis_menu':      return col.extra?.jenis_menu    || '—';
    case 'sertif_halal':    return col.extra?.sertif_halal  || (isSelected ? 'Halal'       : '—');
    case 'kapasitas':       return col.extra?.kapasitas      || '—';
    case 'waktu_sajian':    return col.extra?.waktu_sajian   || '—';
    case 'kualifikasi':     return col.extra?.kualifikasi    || (isSelected ? 'Memenuhi'   : '—');
    case 'ruang_lingkup':   return col.extra?.ruang_lingkup  || '—';
    case 'output':          return col.extra?.output         || '—';
    case 'jangka_waktu':    return col.extra?.jangka_waktu   || '—';
    case 'pengalaman':      return col.extra?.pengalaman     || (isSelected ? 'Berpengalaman' : '—');
    case 'merk_tipe':       return col.extra?.merk_tipe      || '—';
    case 'spek_teknis':     return col.extra?.spek_teknis    || (isSelected ? 'Sesuai KAK' : '—');
    case 'tkdn_pct':        return col.extra?.tkdn_pct       || '—';
    case 'garansi':         return col.extra?.garansi        || (isSelected ? 'Garansi Resmi' : '—');
    case 'purna_jual':      return col.extra?.purna_jual     || (isSelected ? 'Ada'         : '—');
    case 'kualif_teknis':   return col.extra?.kualif_teknis  || (isSelected ? 'Tersertifikasi' : '—');
    case 'cakupan':         return col.extra?.cakupan        || '—';
    case 'spare_part':      return col.extra?.spare_part     || '—';
    case 'sla':             return col.extra?.sla            || '—';
    case 'garansi_kerja':   return col.extra?.garansi_kerja  || (isSelected ? 'Dijamin'    : '—');
    case 'sbu':             return col.extra?.sbu            || (isSelected ? 'Memiliki SBU' : '—');
    case 'tenaga_ahli':     return col.extra?.tenaga_ahli    || (isSelected ? 'SKA/SKK Tersedia' : '—');
    case 'metode':          return col.extra?.metode         || '—';
    case 'jadwal':          return col.extra?.jadwal         || '—';
    case 'k3':              return col.extra?.k3             || (isSelected ? 'SMKK Tersusun' : '—');
    case 'biaya_personil':  return col.extra?.biaya_personil || (isSelected ? 'Terinci' : '—');
    case 'biaya_nonpers':   return col.extra?.biaya_nonpers  || (isSelected ? 'Terinci' : '—');
    default:                return col.extra?.[kritKey]      || '—';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. REKOMENDASI PROSEDUR PEMILIHAN PENYEDIA — saran untuk PP/PPK
// ─────────────────────────────────────────────────────────────────────────────
export const REKOMENDASI_PP_PPK = {
  atk: {
    judul: 'Rekomendasi Prosedur Pemilihan Penyedia (Saran untuk PP/PPK)',
    isi: `1. Pejabat Pengadaan (PP) dan PPK disarankan melakukan komparasi harga minimal terhadap 2 (dua) atau lebih penyedia sejenis di e-Katalog untuk memastikan kewajaran harga.
2. Memprioritaskan penyedia lokal terdekat untuk meminimalkan waktu pengiriman dan mempermudah layanan purna jual.`
  },
  mamin: {
    judul: 'Rekomendasi Prosedur Pemilihan Penyedia (Saran untuk PP/PPK)',
    isi: `1. Penerapan Metode Rotasi Kerja/Order: Mengingat terdapat lebih dari 1 (satu) penyedia Mamin dalam wilayah kecamatan yang sama, Pejabat Pengadaan (PP) dan PPK disarankan menerapkan sistem rotasi kerja secara bergiliran pada paket belanja berikutnya. Langkah ini penting untuk mencegah monopoli usaha, mendukung pemerataan ekonomi bagi seluruh UMKK lokal, serta memelihara iklim kemitraan yang sehat.
2. Penyesuaian Spesifikasi Sajian (Menu Matching): Pemilihan penyedia harus disesuaikan dengan kapasitas dan kekhasan menu sajian yang ditawarkan oleh penyedia (misal: nasi kotak, prasmanan, atau snack box) agar selaras dengan kebutuhan jenis kegiatan kedinasan.
3. Penentuan Lokasi Pengiriman Riil: Apabila pengantaran makanan ditujukan ke tempat lain di luar kantor instansi/kecamatan (seperti aula desa atau lokasi lapangan), maka pemilihan katering harus memprioritaskan penyedia yang memiliki jarak terdekat ke titik pengiriman riil tersebut demi menjaga kesegaran hidangan, efisiensi waktu, serta meminimalisir biaya pengiriman (ongkir).`
  },
  jasa: {
    judul: 'Rekomendasi Prosedur Pemilihan Penyedia (Saran untuk PP/PPK)',
    isi: `1. Memastikan ruang lingkup pekerjaan dalam KAK telah terdefinisi dengan jelas sebelum mengundang penyedia jasa sejenis.
2. Memverifikasi portofolio dan pengalaman pekerjaan sejenis dari personil yang ditugaskan oleh penyedia jasa.`
  },
  modal: {
    judul: 'Rekomendasi Prosedur Pemilihan Penyedia (Saran untuk PP/PPK)',
    isi: `1. Selalu melakukan negosiasi harga tayang e-Katalog, terutama untuk pembelian dalam jumlah volume besar (grosir).
2. Memastikan ketersediaan suku cadang dan garansi resmi minimal 1 tahun yang dapat diklaim melalui service center terdekat.`
  },
  pemeliharaan: {
    judul: 'Rekomendasi Prosedur Pemilihan Penyedia (Saran untuk PP/PPK)',
    isi: `1. Melakukan inventarisasi kerusakan awal secara mendetail agar estimasi biaya perbaikan logis dan efisien.
2. Menggunakan penyedia yang mampu memberikan jaminan respons cepat (Response Time) apabila terjadi kendala teknis.`
  },
  konstruksi: {
    judul: 'Rekomendasi Prosedur Pemilihan Penyedia (Saran untuk PP/PPK)',
    isi: `1. Melakukan evaluasi mendalam terhadap metode pelaksanaan kerja dan kurva S yang diajukan kontraktor untuk mencegah keterlambatan.
2. Memastikan seluruh personil inti kontraktor memiliki sertifikat kompetensi konstruksi yang valid.`
  },
  konsultasi_non: {
    judul: 'Rekomendasi Prosedur Pemilihan Penyedia (Saran untuk PP/PPK)',
    isi: `1. Melakukan klarifikasi teknis tatap muka untuk memastikan pemahaman konsultan terhadap KAK.
2. Memastikan komponen non-personil dihitung secara wajar sesuai kebutuhan riil di lapangan.`
  },
  konsultasi_konstruksi: {
    judul: 'Rekomendasi Prosedur Pemilihan Penyedia (Saran untuk PP/PPK)',
    isi: `1. Memprioritaskan konsultan pengawas yang memiliki integritas tinggi dan pengalaman pengawasan proyek sejenis.
2. Memastikan konsultan pengawas aktif menyerahkan laporan berkala mengenai progres pekerjaan fisik.`
  },
  konsolidasi: {
    judul: 'Rekomendasi Prosedur Pemilihan Penyedia (Saran untuk PP/PPK)',
    isi: `1. Mengkoordinasikan jadwal kebutuhan masing-masing satker agar penyedia dapat mengoptimalkan jalur distribusi.
2. Memantau konsistensi kualitas barang yang dikirimkan ke berbagai titik lokasi satker.`
  }
};
