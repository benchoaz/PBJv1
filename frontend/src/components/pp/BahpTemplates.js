/**
 * BahpTemplates.js
 * Template BAHP profesional per jenis pengadaan — disusun berdasarkan:
 * - Perpres 12/2021 tentang Pengadaan Barang/Jasa Pemerintah
 * - Perlem LKPP 9/2021 tentang Toko Daring dan Katalog Elektronik
 * - Perlem LKPP 11/2021 tentang Perencanaan Pengadaan
 * - Perlem LKPP 12/2021 tentang Pelaksanaan Pengadaan
 * - PP 22/2020 jo PP 14/2021 tentang Jasa Konstruksi
 * - SE LKPP dan Juklak terkait masing-masing jenis pengadaan
 *
 * Setiap template benar-benar berbeda dan mencerminkan praktik nyata PP di lapangan.
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
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. KRITERIA EVALUASI / KOMPARASI — sangat berbeda per jenis pengadaan
// ─────────────────────────────────────────────────────────────────────────────
export const KOMPARASI_KRITERIA = {
  // ATK: fokus harga satuan, stok, PDN, TKDN, status UMKK/Koperasi
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

  // MAMIN: fokus menu, halal, kapasitas, waktu penyajian, lokasi
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

  // JASA: fokus kualifikasi, output, jangka waktu, metode kerja
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

  // MODAL: fokus spek teknis detail, garansi, purna jual, TKDN, pencatatan aset
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

  // PEMELIHARAAN: fokus objek, kondisi awal, pekerjaan, SLA, garansi pekerjaan
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

  // KONSTRUKSI: paling kompleks — SBU, K3, tenaga ahli, metode, retensi
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
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. KLAUSUL KHUSUS — klausul yang hanya muncul di template tertentu
// ─────────────────────────────────────────────────────────────────────────────
export const KLAUSUL_KHUSUS = {
  atk: {
    judul: 'Klausul Preferensi Harga dan PDN/UMKM',
    isi: `Dalam pelaksanaan e-Purchasing melalui Katalog Elektronik, Pejabat Pengadaan telah 
memprioritaskan pemilihan penyedia yang merupakan Usaha Mikro, Kecil, dan Koperasi (UMKK) sesuai 
amanat Pasal 65 Perpres 12/2021, serta memberikan preferensi kepada Produk Dalam Negeri (PDN) 
dengan nilai TKDN minimal sesuai ketentuan yang berlaku.

Pemilihan penyedia dilakukan berdasarkan pertimbangan: (1) harga satuan terbaik sesuai pagu DPA; 
(2) ketersediaan stok yang cukup; (3) kesesuaian spesifikasi dengan kebutuhan; dan (4) lokasi penyedia 
yang memungkinkan pengiriman tepat waktu.`,
  },
  mamin: {
    judul: 'Klausul Kegiatan, Halal, dan Keamanan Pangan',
    isi: `Pengadaan makanan dan minuman ini diperuntukkan bagi pelaksanaan kegiatan dinas sebagaimana 
tercantum dalam DPA Satuan Kerja. Pejabat Pengadaan memastikan bahwa:
(1) Penyedia yang dipilih memiliki izin edar/izin usaha katering/restoran yang masih berlaku;
(2) Produk makanan dan minuman yang disajikan telah memenuhi standar keamanan pangan sesuai 
    ketentuan Badan Pengawas Obat dan Makanan (BPOM);
(3) Penyedia telah memiliki atau sedang dalam proses sertifikasi halal dari Badan Penyelenggara 
    Jaminan Produk Halal (BPJPH) sesuai amanat UU Nomor 33 Tahun 2014;
(4) Menu yang disajikan telah disesuaikan dengan Standar Biaya Masukan (SBM) Kementerian Keuangan 
    untuk rapat/pertemuan dinas.`,
  },
  jasa: {
    judul: 'Klausul Output, Pembayaran, dan Sanksi',
    isi: `Pekerjaan jasa ini dilaksanakan berdasarkan lingkup pekerjaan (scope of work) yang telah 
ditetapkan dalam Kerangka Acuan Kerja (KAK). Pembayaran dilakukan setelah penyedia menyelesaikan 
pekerjaan dan menyerahkan output/deliverable yang telah diperiksa dan diterima oleh Pejabat 
Pembuat Komitmen (PPK). Keterlambatan penyelesaian pekerjaan dikenakan denda keterlambatan 
sebesar 1‰ (satu permil) per hari dari nilai kontrak, maksimal 5% dari nilai kontrak 
sebagaimana diatur dalam Perpres 12/2021 Pasal 78.`,
  },
  modal: {
    judul: 'Klausul Garansi, TKDN, dan Pencatatan Aset',
    isi: `Barang modal yang diadakan wajib dilengkapi dengan: (1) dokumen garansi resmi dari 
pabrikan/produsen yang mencantumkan nomor seri, masa garansi, dan service center resmi terdekat; 
(2) sertifikat TKDN yang diterbitkan oleh Kementerian Perindustrian untuk produk yang 
dipersyaratkan; (3) faktur pembelian asli dan bukti serah terima barang (BAST).

Setelah diterima, barang modal ini akan dicatat dalam Daftar Inventaris Barang Milik Daerah 
(BMD) sesuai ketentuan PP 28/2020 tentang Pengelolaan BMN/BMD, dan dilaporkan dalam 
neraca SKPD pada periode pelaporan keuangan berikutnya.`,
  },
  pemeliharaan: {
    judul: 'Klausul Kondisi Awal, Pekerjaan, dan Garansi Hasil',
    isi: `Sebelum pelaksanaan pekerjaan pemeliharaan, Pejabat Pengadaan bersama penyedia telah 
melakukan pemeriksaan kondisi awal objek yang akan dipelihara. Seluruh pekerjaan pemeliharaan 
dilaksanakan sesuai standar teknis yang berlaku, menggunakan suku cadang/bahan asli (genuine) 
atau yang setara (equivalent) sesuai spesifikasi.

Penyedia memberikan garansi atas hasil pekerjaan selama paling sedikit 30 (tiga puluh) hari 
kalender sejak tanggal serah terima hasil pekerjaan. Apabila dalam masa garansi ditemukan 
kerusakan/kecacatan akibat kesalahan pengerjaan, penyedia wajib memperbaiki tanpa biaya tambahan.`,
  },
  konstruksi: {
    judul: 'Klausul SBU, K3 Konstruksi, Retensi, dan Pengawasan',
    isi: `Penyedia pekerjaan konstruksi yang dipilih telah memenuhi persyaratan kualifikasi sebagai berikut:
(1) Memiliki Sertifikat Badan Usaha (SBU) dengan subklasifikasi yang sesuai, masih berlaku;
(2) Memiliki tenaga kerja konstruksi bersertifikat (SKK Konstruksi) sesuai jenis pekerjaan;
(3) Menyusun dan menerapkan Rencana K3 Konstruksi sesuai Peraturan Menteri PUPR Nomor 8 Tahun 2023 
    tentang Sistem Manajemen Keselamatan Konstruksi (SMKK);
(4) Pelaksanaan pekerjaan wajib didampingi pengawas lapangan yang memiliki kompetensi sesuai bidang.

Retensi sebesar 5% (lima persen) dari nilai kontrak akan ditahan hingga masa pemeliharaan 
pekerjaan selesai (minimal 6 bulan setelah serah terima pertama/PHO), kemudian akan dibayarkan 
setelah Final Hand Over (FHO) dinyatakan selesai dengan baik.`,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. PERNYATAAN PENUTUP — sesuai karakteristik masing-masing pengadaan
// ─────────────────────────────────────────────────────────────────────────────
export const PENUTUP_TEMPLATE = {
  atk: `Berdasarkan hasil penelusuran Katalog Elektronik, komparasi harga dari beberapa penyedia, 
dan proses negosiasi yang telah dilakukan, Pejabat Pengadaan menetapkan penyedia sebagaimana 
tercantum dalam Lampiran I berita acara ini sebagai penyedia terpilih. Penetapan didasarkan pada 
pertimbangan harga satuan terbaik, kesesuaian spesifikasi dengan kebutuhan satuan kerja, 
ketersediaan stok, status UMKK/PDN, serta kemampuan pengiriman sesuai jadwal yang diperlukan.

Seluruh dokumen pendukung termasuk tangkapan layar e-Katalog, riwayat negosiasi, dan bukti 
perbandingan harga telah terdokumentasi dan merupakan lampiran yang tidak terpisahkan dari 
berita acara ini.`,

  mamin: `Berdasarkan hasil penelusuran dan komparasi penyedia makanan dan minuman melalui e-Katalog 
LKPP serta konfirmasi langsung kepada penyedia, Pejabat Pengadaan menetapkan penyedia katering/makanan 
sebagaimana tercantum dalam berita acara ini. Penetapan mempertimbangkan: kewajaran harga per porsi 
sesuai SBM yang berlaku, sertifikasi halal, kapasitas produksi, reputasi/pengalaman penyedia, 
dan kesesuaian menu dengan spesifikasi kegiatan dinas.

Penyedia yang dipilih bertanggung jawab atas kualitas, kebersihan, keamanan pangan, dan ketepatan 
waktu penyajian selama pelaksanaan kegiatan.`,

  jasa: `Berdasarkan hasil evaluasi teknis dan komparasi harga penawaran dari beberapa penyedia jasa 
yang terdaftar dalam Katalog Elektronik LKPP, Pejabat Pengadaan menetapkan penyedia jasa 
sebagaimana tercantum dalam berita acara ini. Penyedia dinilai memenuhi seluruh persyaratan 
kualifikasi, memiliki pengalaman yang relevan, dan memberikan penawaran harga yang wajar sesuai 
dengan ruang lingkup pekerjaan yang ditetapkan dalam KAK.

Surat Pesanan (SP) akan diterbitkan oleh PPK setelah berita acara ini ditandatangani, 
sebagai dasar pelaksanaan pekerjaan jasa.`,

  modal: `Berdasarkan hasil penelusuran Katalog Elektronik, verifikasi spesifikasi teknis secara 
menyeluruh, dan proses negosiasi harga, Pejabat Pengadaan menetapkan penyedia barang modal 
sebagaimana tercantum dalam berita acara ini. Pertimbangan utama penetapan meliputi: 
kesesuaian spesifikasi teknis dengan KAK secara penuh, nilai TKDN yang memenuhi ambang batas, 
garansi resmi dari pabrikan, ketersediaan service center resmi di wilayah Jawa Timur, 
dan efisiensi anggaran yang dicapai melalui negosiasi.

Barang yang diadakan akan diinventarisasi sebagai Barang Milik Daerah sesuai peraturan 
perundang-undangan yang berlaku.`,

  pemeliharaan: `Berdasarkan hasil survei kondisi, analisis kebutuhan pemeliharaan, dan komparasi 
penawaran dari beberapa penyedia jasa pemeliharaan, Pejabat Pengadaan menetapkan penyedia 
sebagaimana tercantum dalam berita acara ini. Penyedia yang dipilih memiliki kualifikasi 
teknis yang sesuai, pengalaman menangani objek pemeliharaan sejenis, dan memberikan 
penawaran harga yang wajar disertai jaminan garansi hasil pekerjaan.

Seluruh pekerjaan pemeliharaan harus diselesaikan sesuai jadwal yang ditetapkan, 
dan hasilnya akan diperiksa bersama oleh Pejabat Pengadaan/PPK sebelum pembayaran dilakukan.`,

  konstruksi: `Berdasarkan hasil evaluasi dokumen penawaran, verifikasi kualifikasi penyedia, 
pemeriksaan lapangan, dan klarifikasi teknis, Pejabat Pengadaan menetapkan penyedia 
pekerjaan konstruksi sebagaimana tercantum dalam berita acara ini. Penyedia telah memenuhi 
seluruh persyaratan administrasi, teknis, dan keuangan yang ditetapkan dalam dokumen pengadaan.

Kontrak pekerjaan akan diterbitkan oleh PPK setelah penetapan ini mendapat persetujuan. 
Masa pelaksanaan pekerjaan, retensi, dan mekanisme PHO/FHO dilaksanakan sesuai ketentuan 
Perlem LKPP 12/2021 Lampiran V dan kontrak yang akan ditandatangani.`,
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. FIELD TAMBAHAN KHAS per template — untuk header tabel Seksi A
// ─────────────────────────────────────────────────────────────────────────────
export const KOLOM_TAMBAHAN_SEKSI_A = {
  atk:          ['Status PDN', 'Status UMKK'],
  mamin:        ['Menu/Sajian', 'Halal'],
  jasa:         ['Output/Deliverable', 'Jangka Waktu'],
  modal:        ['Merk/Tipe', 'Garansi', 'TKDN (%)'],
  pemeliharaan: ['Objek Pelihara', 'Garansi Kerja'],
  konstruksi:   ['SBU', 'Jangka Waktu (HK)', 'Retensi'],
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. HELPER — resolusi nilai sel pada matriks komparasi
// ─────────────────────────────────────────────────────────────────────────────
export function resolveCritVal(kritKey, col, isSelected) {
  switch (kritKey) {
    case 'harga_tayang':  return `Rp ${(col.harga_tayang || 0).toLocaleString('id-ID')}`;
    case 'harga_nego':    return isSelected ? `Rp ${(col.harga_nego || 0).toLocaleString('id-ID')}` : '—';
    case 'penyedia':      return col.vendor || '—';
    case 'status_pilih':  return isSelected ? 'TERPILIH' : 'Pembanding';
    case 'kesesuaian':    return isSelected ? 'Sesuai KAK/DPP' : '—';
    case 'stok':          return isSelected ? 'Tersedia' : '—';
    case 'status_pdn':    return col.extra?.status_pdn    || (isSelected ? 'PDN / TKDN' : '—');
    case 'status_umkk':   return col.extra?.status_umkk   || (isSelected ? 'UMKK'       : '—');
    case 'jenis_katalog': return col.extra?.jenis_katalog || (isSelected ? 'Lokal'       : '—');
    case 'jenis_menu':    return col.extra?.jenis_menu    || '—';
    case 'sertif_halal':  return col.extra?.sertif_halal  || (isSelected ? 'Halal'       : '—');
    case 'kapasitas':     return col.extra?.kapasitas      || '—';
    case 'waktu_sajian':  return col.extra?.waktu_sajian   || '—';
    case 'kualifikasi':   return col.extra?.kualifikasi    || (isSelected ? 'Memenuhi'   : '—');
    case 'ruang_lingkup': return col.extra?.ruang_lingkup  || '—';
    case 'output':        return col.extra?.output         || '—';
    case 'jangka_waktu':  return col.extra?.jangka_waktu   || '—';
    case 'pengalaman':    return col.extra?.pengalaman     || (isSelected ? 'Berpengalaman' : '—');
    case 'merk_tipe':     return col.extra?.merk_tipe      || '—';
    case 'spek_teknis':   return col.extra?.spek_teknis    || (isSelected ? 'Sesuai KAK' : '—');
    case 'tkdn_pct':      return col.extra?.tkdn_pct       || '—';
    case 'garansi':       return col.extra?.garansi        || (isSelected ? 'Garansi Resmi' : '—');
    case 'purna_jual':    return col.extra?.purna_jual     || (isSelected ? 'Ada'         : '—');
    case 'kualif_teknis': return col.extra?.kualif_teknis  || (isSelected ? 'Tersertifikasi' : '—');
    case 'cakupan':       return col.extra?.cakupan        || '—';
    case 'spare_part':    return col.extra?.spare_part     || '—';
    case 'sla':           return col.extra?.sla            || '—';
    case 'garansi_kerja': return col.extra?.garansi_kerja  || (isSelected ? 'Dijamin'    : '—');
    case 'sbu':           return col.extra?.sbu            || (isSelected ? 'Memiliki SBU' : '—');
    case 'tenaga_ahli':   return col.extra?.tenaga_ahli    || (isSelected ? 'SKK Tersedia' : '—');
    case 'metode':        return col.extra?.metode         || '—';
    case 'jadwal':        return col.extra?.jadwal         || '—';
    case 'k3':            return col.extra?.k3             || (isSelected ? 'SMKK Tersusun' : '—');
    default:              return col.extra?.[kritKey]      || '—';
  }
}
