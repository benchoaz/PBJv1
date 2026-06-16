export const DEFAULT_TEMPLATES = [
  {
    id: 'TPL-001',
    category: 'Tahap Persiapan',
    name: 'Nota Dinas Usulan Pengadaan',
    content: `Yth. Pejabat Pengadaan Barang/Jasa
Di Lingkungan {{nama_satker}}

Sehubungan dengan kebutuhan operasional di lingkungan {{nama_satker}}, bersama ini kami sampaikan usulan pengadaan barang/jasa melalui metode E-Purchasing (e-Katalog) dengan rincian sebagai berikut:

Nama Pekerjaan : {{nama_pekerjaan}}
Nilai Pagu     : {{nilai_pagu}}
Sumber Dana    : {{sumber_dana}}

Berkenaan dengan hal tersebut, mohon bantuan Saudara untuk dapat memproses pengadaan dimaksud sesuai dengan ketentuan perundang-undangan yang berlaku.

Demikian disampaikan, atas perhatian dan kerjasamanya diucapkan terima kasih.`,
    isDefault: true
  },
  {
    id: 'TPL-002',
    category: 'Tahap Pemilihan',
    name: 'Surat Undangan Klarifikasi & Negosiasi',
    content: `Nomor     : {{nomor_surat}}
Sifat     : Penting
Lampiran  : 1 (satu) Berkas
Hal       : Undangan Klarifikasi Teknis dan Negosiasi Harga

Yth. Direktur/Pimpinan {{nama_penyedia}}
di Tempat

Sehubungan dengan penawaran Saudara pada sistem E-Purchasing untuk paket pekerjaan {{nama_pekerjaan}}, bersama ini kami mengundang Saudara untuk hadir pada acara Klarifikasi Teknis dan Negosiasi Harga yang akan dilaksanakan pada:

Hari/Tanggal : {{hari_tanggal_acara}}
Waktu        : {{waktu_acara}}
Tempat       : {{tempat_acara}}

Mengingat pentingnya acara tersebut, Saudara diminta hadir tepat waktu dan membawa kelengkapan dokumen pendukung yang diperlukan.

Demikian undangan ini kami sampaikan. Atas perhatian dan kehadirannya, kami ucapkan terima kasih.

Pejabat Pengadaan,

{{nama_pejabat_pengadaan}}
NIP. {{nip_pejabat_pengadaan}}`,
    isDefault: true
  },
  {
    id: 'TPL-003',
    category: 'Tahap Pemilihan',
    name: 'Berita Acara Klarifikasi & Negosiasi Harga (BAKN)',
    content: `BERITA ACARA KLARIFIKASI TEKNIS DAN NEGOSIASI HARGA
Nomor: {{nomor_ba}}

Pada hari ini {{hari_ba}} tanggal {{tanggal_ba}}, bertempat di {{nama_satker}}, kami yang bertanda tangan di bawah ini:

1. Nama: {{nama_pejabat_pengadaan}}
   Jabatan: Pejabat Pengadaan
   Selanjutnya disebut PIHAK PERTAMA

2. Nama: Pimpinan {{nama_penyedia}}
   Jabatan: Wakil Sah Penyedia
   Selanjutnya disebut PIHAK KEDUA

Telah melakukan klarifikasi teknis dan negosiasi harga untuk paket pekerjaan {{nama_pekerjaan}}, dengan hasil kesepakatan sebagai berikut:
1. Harga Penawaran Awal : {{harga_penawaran}}
2. Harga Hasil Negosiasi: {{harga_negosiasi}}

Demikian Berita Acara ini dibuat dalam rangkap secukupnya untuk dipergunakan sebagaimana mestinya.

PIHAK KEDUA,                             PIHAK PERTAMA,
Penyedia                                 Pejabat Pengadaan


(Pimpinan {{nama_penyedia}})             ({{nama_pejabat_pengadaan}})
                                         NIP. {{nip_pejabat_pengadaan}}`,
    isDefault: true
  },
  {
    id: 'TPL-004',
    category: 'Tahap Pemilihan',
    name: 'Berita Acara Hasil Pemilihan (BAHP)',
    content: `BERITA ACARA HASIL PEMILIHAN (BAHP)
Nomor: {{nomor_bahp}}

Berdasarkan Berita Acara Klarifikasi dan Negosiasi Harga Nomor {{nomor_ba}} tanggal {{tanggal_ba}}, Pejabat Pengadaan pada {{nama_satker}} menetapkan hasil pemilihan penyedia untuk paket pekerjaan:

Nama Pekerjaan : {{nama_pekerjaan}}
Nilai HPS      : {{nilai_hps}}

Maka ditetapkan penyedia:
Nama Perusahaan: {{nama_penyedia_terpilih}}
Harga Final    : {{harga_final}}

Demikian Berita Acara Hasil Pemilihan ini dibuat untuk disampaikan kepada Pejabat Pembuat Komitmen (PPK) sebagai dasar penerbitan Surat Pesanan.

Ditetapkan di : {{tempat_penetapan}}
Tanggal       : {{tanggal_bahp}}

Pejabat Pengadaan,


{{nama_pejabat_pengadaan}}
NIP. {{nip_pejabat_pengadaan}}`,
    isDefault: true,
    panelRedirect: 'Panel Pejabat Pengadaan (/pp/panel) → Klik "Cetak BAHP"'
  },
  {
    id: 'TPL-005',
    category: 'Tahap Kontrak',
    name: 'Surat Pesanan (SP)',
    content: `SURAT PESANAN (SP)
Nomor: {{nomor_sp}}

Paket Pekerjaan: {{nama_pekerjaan}}

Yang bertanda tangan di bawah ini:
Nama  : {{nama_ppk}}
NIP   : {{nip_ppk}}
Dalam hal ini bertindak untuk dan atas nama {{nama_satker}}, selanjutnya disebut sebagai PEJABAT PEMBUAT KOMITMEN (PPK).

Berdasarkan Berita Acara Hasil Pemilihan (BAHP) Nomor {{nomor_bahp}}, bersama ini memerintahkan kepada:
Nama Perusahaan : {{nama_penyedia}}
Alamat          : {{alamat_penyedia}}

Untuk mengirimkan/mengerjakan pesanan berupa {{nama_pekerjaan}} dengan Nilai Kontrak sebesar {{nilai_kontrak}}.
Waktu Penyelesaian pekerjaan selambat-lambatnya {{waktu_penyelesaian}}.

Demikian Surat Pesanan ini dibuat dan ditandatangani untuk dilaksanakan.

Tanggal: {{tanggal_sp}}

Menerima dan Menyetujui,                 PEJABAT PEMBUAT KOMITMEN,
Penyedia,


(Pimpinan {{nama_penyedia}})             ({{nama_ppk}})
                                         NIP. {{nip_ppk}}`,
    isDefault: true,
    panelRedirect: 'Panel PPK (/ppk) → Langkah 5 Review → Cetak SP'
  },
  {
    id: 'TPL-006A',
    category: 'Tahap Persiapan',
    name: 'Dokumen Persiapan Pengadaan (ATK / Barang Umum)',
    content: `DOKUMEN PERSIAPAN PENGADAAN (DPP)
Nomor : {{nomor_dpp}}

Yang bertanda tangan di bawah ini:
Nama   : {{nama_ppk}}
Selaku : Pejabat Pembuat Komitmen (PPK) pada {{nama_satker}}

Pada hari ini, tanggal {{tanggal_dpp}}, menetapkan Dokumen Persiapan Pengadaan (DPP) sebagai berikut:



{{komponen_dinamis_dpp}}

Demikian Dokumen Persiapan Pengadaan ini ditetapkan untuk dipergunakan sebagai dasar pelaksanaan proses pengadaan melalui metode E-Purchasing.

Ditetapkan di: {{tempat_penetapan}}

Pejabat Pembuat Komitmen,


{{nama_ppk}}
NIP. {{nip_ppk}}`,
    isDefault: true,
    panelRedirect: 'Panel PPK (/ppk) → Langkah 2 DPA → Cetak DPP'
  },
  {
    id: 'TPL-006B',
    category: 'Tahap Persiapan',
    name: 'Dokumen Persiapan Pengadaan (Makanan dan Minuman)',
    content: `DOKUMEN PERSIAPAN PENGADAAN (DPP)
Nomor : {{nomor_dpp}}

Yang bertanda tangan di bawah ini:
Nama   : {{nama_ppk}}
Selaku : Pejabat Pembuat Komitmen (PPK) pada {{nama_satker}}

Pada hari ini, tanggal {{tanggal_dpp}}, menetapkan Dokumen Persiapan Pengadaan (DPP) sebagai berikut:



{{komponen_dinamis_dpp}}

Demikian Dokumen Persiapan Pengadaan ini ditetapkan untuk dipergunakan sebagai dasar pelaksanaan proses pengadaan melalui metode E-Purchasing.

Ditetapkan di: {{tempat_penetapan}}

Pejabat Pembuat Komitmen,


{{nama_ppk}}
NIP. {{nip_ppk}}`,
    isDefault: true,
    panelRedirect: 'Panel PPK (/ppk) → Langkah 2 DPA → Cetak DPP'
  },
  {
    id: 'TPL-006C',
    category: 'Tahap Persiapan',
    name: 'Dokumen Persiapan Pengadaan (Peralatan Modal / Teknologi)',
    content: `DOKUMEN PERSIAPAN PENGADAAN (DPP)
Nomor : {{nomor_dpp}}

Yang bertanda tangan di bawah ini:
Nama   : {{nama_ppk}}
Selaku : Pejabat Pembuat Komitmen (PPK) pada {{nama_satker}}

Pada hari ini, tanggal {{tanggal_dpp}}, menetapkan Dokumen Persiapan Pengadaan (DPP) sebagai berikut:



{{komponen_dinamis_dpp}}

Demikian Dokumen Persiapan Pengadaan ini ditetapkan untuk dipergunakan sebagai dasar pelaksanaan proses pengadaan melalui metode E-Purchasing.

Ditetapkan di: {{tempat_penetapan}}

Pejabat Pembuat Komitmen,


{{nama_ppk}}
NIP. {{nip_ppk}}`,
    isDefault: true,
    panelRedirect: 'Panel PPK (/ppk) → Langkah 2 DPA → Cetak DPP'
  },
  {
    id: 'TPL-006D',
    category: 'Tahap Persiapan',
    name: 'Dokumen Persiapan Pengadaan (Jasa Lainnya)',
    content: `DOKUMEN PERSIAPAN PENGADAAN (DPP)
Nomor : {{nomor_dpp}}

Yang bertanda tangan di bawah ini:
Nama   : {{nama_ppk}}
Selaku : Pejabat Pembuat Komitmen (PPK) pada {{nama_satker}}

Pada hari ini, tanggal {{tanggal_dpp}}, menetapkan Dokumen Persiapan Pengadaan (DPP) sebagai berikut:



{{komponen_dinamis_dpp}}

Demikian Dokumen Persiapan Pengadaan ini ditetapkan untuk dipergunakan sebagai dasar pelaksanaan proses pengadaan melalui metode E-Purchasing.

Ditetapkan di: {{tempat_penetapan}}

Pejabat Pembuat Komitmen,


{{nama_ppk}}
NIP. {{nip_ppk}}`,
    isDefault: true,
    panelRedirect: 'Panel PPK (/ppk) → Langkah 2 DPA → Cetak DPP'
  },
  {
    id: 'TPL-006E',
    category: 'Tahap Persiapan',
    name: 'Dokumen Persiapan Pengadaan (Konsolidasi Sektoral)',
    content: `DOKUMEN PERSIAPAN PENGADAAN (DPP)
Nomor : {{nomor_dpp}}

Yang bertanda tangan di bawah ini:
Nama   : {{nama_ppk}}
Selaku : Pejabat Pembuat Komitmen (PPK) pada {{nama_satker}}

Pada hari ini, tanggal {{tanggal_dpp}}, menetapkan Dokumen Persiapan Pengadaan (DPP) sebagai berikut:



{{komponen_dinamis_dpp}}

Demikian Dokumen Persiapan Pengadaan ini ditetapkan untuk dipergunakan sebagai dasar pelaksanaan proses pengadaan melalui metode E-Purchasing.

Ditetapkan di: {{tempat_penetapan}}

Pejabat Pembuat Komitmen,


{{nama_ppk}}
NIP. {{nip_ppk}}`,
    isDefault: true,
    panelRedirect: 'Panel PPK (/ppk) → Langkah 2 DPA → Cetak DPP'
  },
  {
    id: 'TPL-006F',
    category: 'Tahap Persiapan',
    name: 'Dokumen Persiapan Pengadaan (Jasa Pemeliharaan)',
    content: `DOKUMEN PERSIAPAN PENGADAAN (DPP)
Nomor : {{nomor_dpp}}

Yang bertanda tangan di bawah ini:
Nama   : {{nama_ppk}}
Selaku : Pejabat Pembuat Komitmen (PPK) pada {{nama_satker}}

Pada hari ini, tanggal {{tanggal_dpp}}, menetapkan Dokumen Persiapan Pengadaan (DPP) sebagai berikut:



{{komponen_dinamis_dpp}}

Demikian Dokumen Persiapan Pengadaan ini ditetapkan untuk dipergunakan sebagai dasar pelaksanaan proses pengadaan melalui metode E-Purchasing.

Ditetapkan di: {{tempat_penetapan}}

Pejabat Pembuat Komitmen,


{{nama_ppk}}
NIP. {{nip_ppk}}`,
    isDefault: true,
    panelRedirect: 'Panel PPK (/ppk) → Langkah 2 DPA → Cetak DPP'
  },
  {
    id: 'TPL-006G',
    category: 'Tahap Persiapan',
    name: 'Dokumen Persiapan Pengadaan (Pekerjaan Konstruksi)',
    content: `DOKUMEN PERSIAPAN PENGADAAN (DPP)
Nomor : {{nomor_dpp}}

Yang bertanda tangan di bawah ini:
Nama   : {{nama_ppk}}
Selaku : Pejabat Pembuat Komitmen (PPK) pada {{nama_satker}}

Pada hari ini, tanggal {{tanggal_dpp}}, menetapkan Dokumen Persiapan Pengadaan (DPP) sebagai berikut:



{{komponen_dinamis_dpp}}

Demikian Dokumen Persiapan Pengadaan ini ditetapkan untuk dipergunakan sebagai dasar pelaksanaan proses pengadaan melalui metode E-Purchasing.

Ditetapkan di: {{tempat_penetapan}}

Pejabat Pembuat Komitmen,


{{nama_ppk}}
NIP. {{nip_ppk}}`,
    isDefault: true,
    panelRedirect: 'Panel PPK (/ppk) → Langkah 2 DPA → Cetak DPP'
  },
  {
    id: 'TPL-007',
    category: 'Tahap Persiapan',
    name: 'Penetapan Harga Perkiraan Sendiri (HPS)',
    content: `PENETAPAN HARGA PERKIRAAN SENDIRI (HPS)
Nomor: {{nomor_hps}}

Berdasarkan hasil survei harga pasar dan/atau informasi lainnya yang dapat dipertanggungjawabkan, serta berdasarkan hasil perhitungan kewajaran harga, bersama ini Pejabat Pembuat Komitmen (PPK) menetapkan Harga Perkiraan Sendiri (HPS) untuk:

Nama Pekerjaan : {{nama_pekerjaan}}
Sumber Dana    : {{sumber_dana}}
Nilai Pagu     : {{nilai_pagu}}

Nilai HPS Ditetapkan Sebesar: {{nilai_hps}} 
(Termasuk pajak-pajak yang berlaku dan biaya pengiriman)

Demikian penetapan HPS ini dibuat untuk digunakan sebagai acuan dalam evaluasi penawaran/negosiasi harga pada proses pengadaan barang/jasa.

Ditetapkan di: {{tempat_penetapan}}
Tanggal      : {{tanggal_hps}}

Pejabat Pembuat Komitmen (PPK),


{{nama_ppk}}
NIP. {{nip_ppk}}`,
    isDefault: true,
    panelRedirect: 'Panel PPK (/ppk) → Langkah 3 HPS → Cetak Penetapan HPS'
  }
];
