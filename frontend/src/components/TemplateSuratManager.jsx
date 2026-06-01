import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  FileText, 
  Settings, 
  Printer, 
  Download, 
  Copy, 
  Trash2, 
  RefreshCw, 
  Sparkles,
  Info,
  Layers,
  ChevronRight,
  ChevronDown,
  Search,
  CheckCircle,
  Edit3,
  BookOpen,
  Image as ImageIcon,
  Lock as LockIcon,
  Eye,
  EyeOff
} from 'lucide-react';

const DEFAULT_TEMPLATES = [
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
    isDefault: true
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
    isDefault: true
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
    isDefault: true
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
    isDefault: true
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
    isDefault: true
  },
  {
    id: 'TPL-006D',
    category: 'Tahap Persiapan',
    name: 'Dokumen Persiapan Pengadaan (Jasa Lainnya / Konstruksi)',
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
    isDefault: true
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
    isDefault: true
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
    isDefault: true
  }
];

// High-fidelity SVG of the Indonesian Garuda Emblem
const LogoGarudaPlaceholder = () => (
  <svg width="65" height="65" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm select-none">
    <path d="M50 8 C58 20 85 24 90 28 C90 45 82 72 50 94 C18 72 10 45 10 28 C15 24 42 20 50 8 Z" fill="#D97706" opacity="0.1" />
    <path d="M50 8 C58 20 85 24 90 28 C90 45 82 72 50 94 C18 72 10 45 10 28 C15 24 42 20 50 8 Z" stroke="#8F5C12" strokeWidth="2.5" strokeLinejoin="round" />
    
    <path d="M50 35 C35 32 18 36 12 44 C16 52 24 58 35 56 C33 62 25 68 20 72 C30 72 38 68 42 60" stroke="#8F5C12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M50 35 C65 32 82 36 88 44 C84 52 76 58 65 56 C67 62 75 68 80 72 C70 72 62 68 58 60" stroke="#8F5C12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    
    <path d="M43 62 L43 78 C43 82 50 84 50 84 C50 84 57 82 57 78 L57 62 Z" fill="#8F5C12" opacity="0.2"/>
    <path d="M46 62 V76 M50 62 V80 M54 62 V76" stroke="#8F5C12" strokeWidth="1.8" strokeLinecap="round"/>
    
    <rect x="42" y="38" width="16" height="20" rx="3" fill="#B91C1C" stroke="#8F5C12" strokeWidth="2" />
    <path d="M42 48 H58" stroke="#8F5C12" strokeWidth="1.5" />
    <path d="M50 38 V58" stroke="#8F5C12" strokeWidth="1.5" />
    <circle cx="50" cy="48" r="3" fill="#D97706" />
    
    <path d="M50 18 C52 14 55 12 58 14 C58 17 56 20 53 22 Z" fill="#8F5C12" stroke="#8F5C12" strokeWidth="1" />
    <circle cx="53" cy="17" r="1" fill="#FFFFFF" />
  </svg>
);

export default function TemplateSuratManager() {
  const { user } = useAuth();
  
  const [templates, setTemplates] = useState(() => {
    const saved = localStorage.getItem('pbj_templates');
    if (saved) {
      try { 
        let parsed = JSON.parse(saved);
        // Force update TPL-006 templates to new structure
        parsed = parsed.map(pt => {
          if (pt.id && pt.id.startsWith('TPL-006')) {
            const dt = DEFAULT_TEMPLATES.find(d => d.id === pt.id);
            if (dt) return dt;
          }
          return pt;
        });
        
        const hasNewTemplate = parsed.some(t => t.id === 'TPL-006A');
        if (!hasNewTemplate) {
          const newDefaults = DEFAULT_TEMPLATES.filter(dt => !parsed.some(pt => pt.id === dt.id));
          parsed = [...parsed, ...newDefaults];
        }
        localStorage.setItem('pbj_templates', JSON.stringify(parsed));
        return parsed; 
      } catch (e) { return DEFAULT_TEMPLATES; }
    }
    return DEFAULT_TEMPLATES;
  });

  const [docSettings, setDocSettings] = useState(() => {
    const saved = localStorage.getItem('pbj_doc_settings');
    const defaultSettings = {
      showKop: true,
      logoType: 'pemda', // 'pemda' (Probolinggo), 'garuda' (Nasional), 'custom' (Unggah)
      namaPemda: 'PEMERINTAH KABUPATEN PROBOLINGGO',
      namaInstansi: 'DINAS KOPERASI, USAHA MIKRO, PERDAGANGAN DAN PERINDUSTRIAN',
      alamatLengkap: 'Jl. Jenderal Ahmad Yani No. 23 Probolinggo – Probolinggo - 67219. Laman: https://probolinggokab.go.id, Pos-el: dkuppkabprobolinggo@gmail.com',
      paperSize: 'A4',
      marginTop: 20,      // 20 mm (2 cm) Permendagri 1/2023
      marginBottom: 25,   // 25 mm (2.5 cm) Permendagri 1/2023
      marginLeft: 30,     // 30 mm (3 cm) Permendagri 1/2023
      marginRight: 20,    // 20 mm (2 cm) Permendagri 1/2023
      fontFamily: 'Arial', // Arial (Permendagri 1/2023)
      fontSize: '12pt',    
      lineHeight: '1.15',  // 1.15 (Permendagri 1/2023)
      formatNomorSurat: '027/{nomor}/DKUPP/2026',
      customLogo: null
    };
    if (saved) {
      const parsed = JSON.parse(saved);
      parsed.showKop = true; // FORCE SHOW KOP SURAT
      return { ...defaultSettings, ...parsed };
    }
    return defaultSettings;
  });

  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id || null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showMargins, setShowMargins] = useState(true);
  const [controlTab, setControlTab] = useState('variables'); // 'variables', 'settings', 'editor'
  
  const [editMode, setEditMode] = useState(false);
  const [activeTemplateContent, setActiveTemplateContent] = useState('');
  const [activeTemplateName, setActiveTemplateName] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tahap Persiapan');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState('');

  // Active projects list for dynamic dropdown connection (Out of the Box feature!)
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  
  // Accordion state for categories
  const [expandedCategories, setExpandedCategories] = useState({
    'Tahap Persiapan': true,
    'Tahap Pemilihan': true,
    'Tahap Kontrak': true
  });

  // Simulated variable fields for real-time document filling
  const [previewVars, setPreviewVars] = useState({
    nama_satker: user?.department || 'Bagian Pengadaan Barang dan Jasa (BPBJ)',
    nama_satker_kapital: (user?.department || 'Bagian Pengadaan Barang dan Jasa (BPBJ)').toUpperCase(),
    alamat_satker: 'Gedung Sekretariat Daerah Lt. 2, Jl. Raya Dringu No. 81, Probolinggo',
    nama_pekerjaan: 'Pengadaan Laptop Core i7 Dinas Kesehatan',
    nilai_pagu: 'Rp 148.500.000',
    sumber_dana: 'APBD Kabupaten Probolinggo TA 2026',
    nama_ppk: 'Handik Hariyanto, S.Kom., M.Si',
    nip_ppk: '197909102002121004',
    nomor_surat: (docSettings?.formatNomorSurat || '027/{nomor}/BPBJ/2026').replace('{nomor}', '045.2'),
    nama_penyedia: 'PT. Mandiri Solusindo Tekno',
    hari_tanggal_acara: 'Kamis, 28 Mei 2026',
    waktu_acara: '10:00 WIB',
    tempat_acara: 'Ruang Rapat Utama UKPBJ',
    nama_pejabat_pengadaan: 'Beni Trisna Wijaya, S.Kom',
    nip_pejabat_pengadaan: '198205192010011010',
    nomor_ba: (docSettings?.formatNomorSurat || '027/{nomor}/BPBJ/2026').replace('{nomor}', '108/BAKN'),
    hari_ba: 'Kamis',
    tanggal_ba: '28 Mei 2026',
    harga_penawaran: 'Rp 147.200.000',
    harga_negosiasi: 'Rp 144.500.000',
    nomor_bahp: (docSettings?.formatNomorSurat || '027/{nomor}/BPBJ/2026').replace('{nomor}', '112/BAHP'),
    nilai_hps: 'Rp 148.000.000',
    nama_penyedia_terpilih: 'PT. Mandiri Solusindo Tekno',
    harga_final: 'Rp 144.500.000',
    tempat_penetapan: 'Kecamatan Kraksaan',
    nomor_sp: (docSettings?.formatNomorSurat || '027/{nomor}/BPBJ/2026').replace('{nomor}', '115/SP'),
    alamat_penyedia: 'Ruko Surya Harmoni Kav. 12, Probolinggo',
    nilai_kontrak: 'Rp 144.500.000',
    waktu_penyelesaian: '14 (empat belas) hari kalender',
    nomor_dpp: (docSettings?.formatNomorSurat || '027/{nomor}/BPBJ/2026').replace('{nomor}', '012/DPP'),
    tanggal_dpp: '25 Mei 2026',
    nomor_hps: (docSettings?.formatNomorSurat || '027/{nomor}/BPBJ/2026').replace('{nomor}', '014/HPS'),
    tanggal_hps: '26 Mei 2026',
    lokasi_pekerjaan: 'Komp. Perkantoran Pemerintah Daerah',
    program: 'Program Penunjang Urusan Pemerintahan Daerah',
    kegiatan: 'Penyelenggaraan Pemerintahan dan Pelayanan Publik',
    sub_kegiatan: 'Penyediaan Barang dan Jasa Perkantoran',
    volume_pekerjaan: '1 Paket',
    uraian_pekerjaan: 'Pengadaan Belanja Alat/Bahan untuk Kegiatan Kantor-Alat Tulis Kantor pada Sub Giat Penyediaan Peralatan dan Perlengkapan Kantor untuk operasional',
    pdn: 'Ya',
    usaha_kecil: 'Ya',
    pra_dipa: 'Tidak',
    mak: '5.1.02.01.001.00024',
  });

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
  const printRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('pbj_templates', JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    localStorage.setItem('pbj_doc_settings', JSON.stringify(docSettings));
  }, [docSettings]);

  useEffect(() => {
    if (selectedTemplate) {
      setActiveTemplateContent(selectedTemplate.content);
      setActiveTemplateName(selectedTemplate.name);
      setActiveCategory(selectedTemplate.category);
      setEditMode(false);
    }
  }, [selectedTemplateId]);

  // Load actual procurement projects list from DB on mount
  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        setProjects(Array.isArray(data) ? data : (data?.data || []));
      })
      .catch(err => console.error('Failed to load active packages:', err));
  }, []);

  // Database Nomenklatur & Alamat Resmi Satker Kabupaten Probolinggo
  const SATKER_DATABASE = {
    "Dinas Koperasi, Usaha Mikro, Perdagangan dan Perindustrian": {
      singkatan: "DKUPP",
      alamat: "Jl. Jenderal Ahmad Yani No. 23 Probolinggo – Probolinggo - 67219. Laman: https://probolinggokab.go.id, Pos-el: dkuppkabprobolinggo@gmail.com"
    },
    "Bagian Pengadaan Barang dan Jasa (BPBJ)": {
      singkatan: "BPBJ",
      alamat: "Gedung Sekretariat Daerah Lt. 2, Jl. Raya Dringu No. 81, Probolinggo. Telp: (0335) 422118, Email: bpbj@probolinggokab.go.id, Kode Pos: 67271"
    },
    "Dinas Kesehatan": {
      singkatan: "DINKES",
      alamat: "Jl. Raya Dringu No. 90, Dringu, Probolinggo. Telp: (0335) 421234, Email: dinkes@probolinggokab.go.id, Kode Pos: 67271"
    },
    "Dinas Pekerjaan Umum & Penataan Ruang (PUPR)": {
      singkatan: "DPUPR",
      alamat: "Jl. Raya Dringu No. 85, Dringu, Probolinggo. Telp: (0335) 425678, Email: dpupr@probolinggokab.go.id, Kode Pos: 67271"
    },
    "Dinas Pendidikan dan Kebudayaan": {
      singkatan: "DISPENDIKBUD",
      alamat: "Jl. Raya Dringu No. 88, Dringu, Probolinggo. Telp: (0335) 423344, Email: dispendik@probolinggokab.go.id, Kode Pos: 67271"
    },
    "Dinas Lingkungan Hidup (DLH)": {
      singkatan: "DLH",
      alamat: "Jl. Raya Dringu No. 102, Dringu, Probolinggo. Telp: (0335) 424455, Email: dlh@probolinggokab.go.id, Kode Pos: 67271"
    },
    "RSUD Waluyo Jati Kraksaan (BLU)": {
      singkatan: "RSUD-WJ",
      alamat: "Jl. Dr. Soetomo No. 1, Kraksaan, Probolinggo. Telp: (0335) 841118, Email: rsudwaluyojati@probolinggokab.go.id, Kode Pos: 67282"
    },
    "Kecamatan Besuk": {
      singkatan: "KEC-BESUK",
      alamat: "Jl. Raya Besuk No. 1, Besuk, Probolinggo. Telp: (0335) 511001, Email: kec.besuk@probolinggokab.go.id, Kode Pos: 67281"
    },
    "Kecamatan Kraksaan": {
      singkatan: "KEC-KRAKSAAN",
      alamat: "Jl. Raya Panglima Sudirman No. 12, Kraksaan, Probolinggo. Telp: (0335) 841234, Email: kec.kraksaan@probolinggokab.go.id, Kode Pos: 67282"
    }
  };

  // Re-populate Kop settings and variables dynamically when active user changes
  useEffect(() => {
    if (user && user.department) {
      const deptName = user.department;
      const matched = SATKER_DATABASE[deptName] || {
        singkatan: deptName.replace(/[^A-Z]/g, '') || 'PBJ',
        alamat: "Jl. Raya Probolinggo No. 81, Probolinggo. Telp: (0335) 422118, Email: info@probolinggokab.go.id, Kode Pos: 67271"
      };

      // 1. Auto-Adapt Kop Surat & Nomenklatur Nomor Surat
      setDocSettings(prev => ({
        ...prev,
        namaPemda: user.perangkatDaerah || 'PEMERINTAH KABUPATEN PROBOLINGGO',
        namaInstansi: deptName.toUpperCase(),
        alamatLengkap: matched.alamat,
        formatNomorSurat: `027/{nomor}/${matched.singkatan}/2026`
      }));

      // 2. Auto-Adapt Preview Variables (Isi Variabel)
      setPreviewVars(prev => {
        const updated = {
          ...prev,
          nama_satker: deptName,
          nama_satker_kapital: deptName.toUpperCase(),
          alamat_satker: matched.alamat.split('. ')[0] // Ambil bagian alamat saja
        };

        // Jika user yang login adalah PPK, otomatis isi variabel PPK
        if (user.role === 'PPK') {
          updated.nama_ppk = user.name;
          updated.nip_ppk = user.nip;
        }

        // Jika user yang login adalah PP, otomatis isi variabel PP
        if (user.role === 'PP') {
          updated.nama_pejabat_pengadaan = user.name;
          updated.nip_pejabat_pengadaan = user.nip;
        }

        // Sinkronisasi otomatis nomor-nomor dinas dengan singkatan satker baru
        const currentFormat = `027/{nomor}/${matched.singkatan}/2026`;
        updated.nomor_surat = currentFormat.replace('{nomor}', '045.2');
        updated.nomor_ba = currentFormat.replace('{nomor}', '108/BAKN');
        updated.nomor_bahp = currentFormat.replace('{nomor}', '112/BAHP');
        updated.nomor_sp = currentFormat.replace('{nomor}', '115/SP');
        updated.nomor_dpp = currentFormat.replace('{nomor}', '012/DPP');
        updated.nomor_hps = currentFormat.replace('{nomor}', '014/HPS');

        return updated;
      });
      
      setNotification(`Tata naskah dinas & variabel disesuaikan otomatis untuk Satker: ${deptName}!`);
      setTimeout(() => setNotification(''), 4000);
    }
  }, [user]);

  const handleConnectProject = (projectId) => {
    setSelectedProjectId(projectId);
    if (!projectId) return;

    const project = projects.find(p => p.id === parseInt(projectId) || p.id === projectId);
    if (project) {
      let parsed = {};
      try {
        parsed = JSON.parse(project.description || '{}');
      } catch (e) {}

      const budgetVal = project.budget || 0;
      const hpsVal = parsed.totalHps || 0;
      const negoVal = parsed.hargaNegosiasi || parsed.negotiatedPrice || hpsVal * 0.98; // fallback to 2% discount if not negotiated
      const vendorName = parsed.vendorName || parsed.supplierName || 'CV. Karya Probolinggo Mandiri';

      setPreviewVars(prev => ({
        ...prev,
        nama_pekerjaan: project.name || prev.nama_pekerjaan,
        nilai_pagu: `Rp ${budgetVal.toLocaleString('id-ID')}`,
        nilai_hps: `Rp ${hpsVal.toLocaleString('id-ID')}`,
        harga_penawaran: `Rp ${(hpsVal * 1.01).toLocaleString('id-ID')}`,
        harga_negosiasi: `Rp ${negoVal.toLocaleString('id-ID')}`,
        harga_final: `Rp ${negoVal.toLocaleString('id-ID')}`,
        nilai_kontrak: `Rp ${negoVal.toLocaleString('id-ID')}`,
        nama_penyedia: vendorName,
        nama_penyedia_terpilih: vendorName,
        tempat_penetapan: project.location || 'Kabupaten Probolinggo',
        sumber_dana: 'APBD Kabupaten Probolinggo TA 2026'
      }));

      setNotification(`✓ Data Paket "${project.name}" berhasil dihubungkan ke variabel surat dinas!`);
      setTimeout(() => setNotification(''), 4000);
    }
  };

  const toggleCategory = (cat) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleSaveTemplate = () => {
    setTemplates(prev => prev.map(t => {
      if (t.id === selectedTemplateId) {
        return { 
          ...t, 
          content: activeTemplateContent, 
          name: activeTemplateName, 
          category: activeCategory,
          isDefault: false 
        };
      }
      return t;
    }));
    setEditMode(false);
    
    setNotification('Template surat berhasil disimpan ke database lokal!');
    setTimeout(() => setNotification(''), 3000);
  };

  const handleResetTemplate = () => {
    if(window.confirm('Kembalikan template ini ke tata naskah dinas bawaan sistem?')) {
      const defaultTpl = DEFAULT_TEMPLATES.find(t => t.id === selectedTemplateId);
      if(defaultTpl) {
        setTemplates(prev => prev.map(t => t.id === selectedTemplateId ? defaultTpl : t));
        setActiveTemplateContent(defaultTpl.content);
        setActiveTemplateName(defaultTpl.name);
        setActiveCategory(defaultTpl.category);
        setEditMode(false);
        
        setNotification('Template berhasil di-reset ke standard resmi!');
        setTimeout(() => setNotification(''), 3000);
      }
    }
  };

  const handleDuplicate = () => {
    const newId = 'TPL-CSTM-' + Date.now();
    const newTpl = {
      ...selectedTemplate,
      id: newId,
      name: selectedTemplate.name + ' (Kustom)',
      isDefault: false
    };
    setTemplates(prev => [...prev, newTpl]);
    setSelectedTemplateId(newId);
    setControlTab('editor');
    setEditMode(true);
    
    setNotification('Template berhasil digandakan!');
    setTimeout(() => setNotification(''), 3000);
  };

  // Function to insert formatting tags at cursor in textarea
  const insertFormatting = (prefix, suffix = '') => {
    const textarea = document.getElementById('template-editor-textarea');
    if (!textarea) return;
    
    textarea.focus();
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = activeTemplateContent;
    const selectedText = text.substring(start, end);
    const newText = prefix + selectedText + suffix;
    
    // Use execCommand to preserve the native browser Undo/Redo stack!
    const success = document.execCommand('insertText', false, newText);
    
    if (!success) {
      const updatedText = text.substring(0, start) + newText + text.substring(end);
      setActiveTemplateContent(updatedText);
    }
    
    setTimeout(() => {
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 10);
  };

  const handleDelete = () => {
    if(window.confirm('Hapus template surat dinas ini secara permanen dari sistem?')) {
      setTemplates(prev => prev.filter(t => t.id !== selectedTemplateId));
      const remaining = templates.filter(t => t.id !== selectedTemplateId);
      setSelectedTemplateId(remaining[0]?.id || null);
      
      setNotification('Template berhasil dihapus!');
      setTimeout(() => setNotification(''), 3000);
    }
  };

  const handleVarChange = (key, value) => {
    setPreviewVars(prev => ({ ...prev, [key]: value }));
  };

  const handleSettingChange = (key, value) => {
    setDocSettings(prev => ({ ...prev, [key]: value }));
  };

  const formatAlamatKop = (alamat) => {
    if (!alamat) return '';
    let formatted = alamat;
    
    // Replace URL
    const urlRegex = /(https?:\/\/[^\s,]+)/g;
    formatted = formatted.replace(urlRegex, '<a href="$1" target="_blank" class="text-blue-600 underline hover:text-blue-800 transition-colors" style="color: #2563eb; text-decoration: underline;">$1</a>');
    
    // Replace Email
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;
    formatted = formatted.replace(emailRegex, '<a href="mailto:$1" class="text-blue-600 underline hover:text-blue-800 transition-colors" style="color: #2563eb; text-decoration: underline;">$1</a>');
    
    return formatted;
  };

  const renderPreviewHTML = (content) => {
    let result = content;
    const regex = /{{(.*?)}}/g;
    
    result = result.replace(regex, (match, p1) => {
      const key = p1.trim();
      const val = previewVars[key];
      if (val !== undefined && val.trim() !== '') {
        return `<span class="bg-amber-50/80 text-amber-900 border-b border-amber-300 font-semibold px-1 rounded hover:bg-amber-100 transition-colors select-all cursor-help" title="Variabel: ${key}">${val}</span>`;
      }
      return `<span class="bg-rose-100 text-rose-800 border border-rose-300 font-bold px-1.5 py-0.5 rounded text-[10px] select-all cursor-help tracking-wide" title="Wajib Diisi: ${key}">[ ${key.toUpperCase()} BELUM DIISI ]</span>`;
    });
    
    return result;
  };

  const getPlaceholders = (content) => {
    const regex = /{{(.*?)}}/g;
    let matches;
    const placeholders = new Set();
    while ((matches = regex.exec(content)) !== null) {
      placeholders.add(matches[1].trim());
    }
    return Array.from(placeholders);
  };

  const currentPlaceholders = getPlaceholders(activeTemplateContent);

  const handlePrint = () => {
    window.print();
  };

  const handleExportWord = () => {
    if (!printRef.current) return;
    
    const htmlContent = printRef.current.innerHTML;
    const cleanHtml = htmlContent.replace(/<span class="bg-amber-50.*?>/g, '').replace(/<\/span>/g, '');
    
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${activeTemplateName}</title>
        <style>
          body { 
            font-family: ${docSettings.fontFamily === 'Bookman Old Style' ? "'Bookman Old Style', Georgia, serif" : docSettings.fontFamily === 'Arial' ? "Arial, Helvetica, sans-serif" : "'Times New Roman', Times, serif"}; 
            font-size: ${docSettings.fontSize || '12pt'}; 
            line-height: ${docSettings.lineHeight || '1.15'};
          }
          @page WordSection1 {
            size: ${docSettings.paperSize === 'F4' ? '8.5in 13in' : '8.27in 11.69in'};
            margin: ${docSettings.marginTop}mm ${docSettings.marginRight}mm ${docSettings.marginBottom}mm ${docSettings.marginLeft}mm;
          }
          div.WordSection1 { page: WordSection1; }
        </style>
      </head>
      <body>
        <div class="WordSection1">
          ${cleanHtml}
        </div>
      </body>
    </html>`;
    
    const blob = new Blob(['\ufeff', header], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeTemplateName.replace(/\s+/g, '_')}_PBJ_SAE.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredTemplates = templates.filter(tpl => 
    tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    tpl.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = ['Tahap Persiapan', 'Tahap Pemilihan', 'Tahap Kontrak'];

  const isPermendagriCompliant = 
    docSettings.fontFamily === 'Arial' && 
    docSettings.marginTop === 20 && 
    docSettings.marginBottom === 25 && 
    docSettings.marginLeft === 30 && 
    docSettings.marginRight === 20 &&
    docSettings.lineHeight === '1.15';

  return (
    <div id="pbk-template-root" className="animate-fade-in pb-16 font-sans relative">
      
      {/* Top Banner / Breadcrumb */}
      <div className="print:hidden mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Government Document Builder</span>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <span>🏛️</span>
            <span>TATA NASKAH & TEMPLATE SURAT PBJ SAE</span>
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">Generator dan Editor Surat Dinas Standardisasi Administrasi Pengadaan Barang/Jasa.</p>
        </div>

        {/* Global Action Notifications */}
        {notification && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm animate-fade-in">
            <CheckCircle size={14} className="text-emerald-600" />
            {notification}
          </div>
        )}
      </div>

      {/* TOP-BAR DASHBOARD & BOTTOM FULL-WIDTH PREVIEW WORKSPACE */}
      <div id="pbk-template-layout" className="flex flex-col gap-6 w-full print:block print:w-full print:gap-0 print:m-0">
        
        {/* ================= TOP COLUMN: CONSOLIDATED CONTROL DASHBOARD (100% Width) ================= */}
        <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden print:hidden animate-fade-in flex flex-col">
          
          {/* Permanent Toolbar Row */}
          <div className="bg-slate-50 border-b border-slate-200 p-4 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
            
            {/* Left side: Naskah Dinas & Connected Project selectors */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
              {/* Naskah Dinas Select */}
              <div className="flex-1 max-w-sm relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Layers size={14} className="text-indigo-600" />
                </span>
                <select
                  value={selectedTemplateId || ''}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#0f2942] focus:outline-none focus:border-indigo-500 shadow-sm appearance-none cursor-pointer hover:border-slate-300 transition-colors"
                >
                  {categories.map(cat => {
                    const catTemplates = templates.filter(t => t.category === cat);
                    if (catTemplates.length === 0) return null;
                    return (
                      <optgroup key={cat} label={cat.toUpperCase()} className="font-extrabold text-[10px] text-indigo-900 bg-slate-50 py-1">
                        {catTemplates.map(t => (
                          <option key={t.id} value={t.id} className="font-semibold text-xs text-slate-800 bg-white py-1">
                            🏛️ {t.name} {t.isDefault ? '(Bawaan)' : '(Kustom)'}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                  <ChevronDown size={14} />
                </div>
              </div>

              {/* Hubungkan Paket Select */}
              <div className="flex-1 max-w-sm relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-indigo-600">
                  <Sparkles size={14} className="animate-pulse" />
                </span>
                <select
                  value={selectedProjectId}
                  onChange={(e) => handleConnectProject(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 shadow-sm appearance-none cursor-pointer hover:border-slate-300 transition-colors"
                >
                  <option value="">📂 Hubungkan Paket Pengadaan Aktif...</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                  <ChevronDown size={14} />
                </div>
              </div>

              {/* Quick Create template button for admin */}
              {user?.role === 'Admin' && (
                <button 
                  onClick={() => {
                    const newId = 'TPL-NEW-' + Date.now();
                    setTemplates(prev => [...prev, { 
                      id: newId, 
                      category: 'Tahap Persiapan', 
                      name: 'Naskah Kustom Baru (' + (templates.length + 1) + ')', 
                      content: 'Nomor     : {{nomor_surat}}\nYth. Pejabat Pengadaan\n\nIsi surat resmi kustomisasi Anda disini...', 
                      isDefault: false 
                    }]);
                    setSelectedTemplateId(newId);
                    setControlTab('editor');
                    setEditMode(true);
                    setNotification('✓ Naskah dinas baru berhasil dibuat!');
                    setTimeout(() => setNotification(''), 3000);
                  }} 
                  className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black tracking-wider rounded-xl transition-all flex items-center justify-center gap-1 shadow-sm shrink-0"
                >
                  <span>➕</span> BUAT NASKAH
                </button>
              )}
            </div>

            {/* Right side: Tabs switcher & Open/Close drawer toggle */}
            <div className="flex items-center gap-3 justify-end shrink-0">
              
              {/* Tab Pills */}
              <div className="bg-slate-100/80 p-1 rounded-xl flex gap-0.5 border border-slate-200/50">
                <button
                  onClick={() => { setControlTab('variables'); setSidebarOpen(true); }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    controlTab === 'variables' && sidebarOpen
                      ? 'bg-white text-indigo-700 shadow-sm border border-slate-100' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FileText size={13} />
                  VARIABEL
                </button>
                
                <button
                  onClick={() => { setControlTab('settings'); setSidebarOpen(true); }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    controlTab === 'settings' && sidebarOpen
                      ? 'bg-white text-indigo-700 shadow-sm border border-slate-100' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Settings size={13} />
                  KOP & MARGIN
                </button>

                <button
                  onClick={() => { setControlTab('editor'); setSidebarOpen(true); }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    controlTab === 'editor' && sidebarOpen
                      ? 'bg-white text-indigo-700 shadow-sm border border-slate-100' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Edit3 size={13} />
                  EDIT NASKAH
                </button>
              </div>

              {/* Collapsible toggle */}
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`p-2.5 rounded-xl border text-xs font-black transition-all flex items-center justify-center gap-1 ${
                  sidebarOpen 
                    ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                }`}
                title={sidebarOpen ? "Sembunyikan Panel Input" : "Tampilkan Panel Input"}
              >
                {sidebarOpen ? <EyeOff size={14} /> : <Eye size={14} />}
                <span className="hidden sm:inline">{sidebarOpen ? "Tutup Panel" : "Buka Panel"}</span>
              </button>

            </div>
          </div>

          {/* Collapsible Inputs Drawer (Grid Layout) */}
          {sidebarOpen && (
            <div className="p-5 border-t border-slate-100/60 bg-white overflow-y-auto max-h-[380px] scrollbar-thin">
              
              {/* TAB 1: VARIABLE FILLER IN RESPONSIVE GRID */}
              {controlTab === 'variables' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">📝 Variabel Pengadaan Terdeteksi</span>
                    <span className="text-[9px] text-slate-400 font-medium italic">Hubungkan paket diatas untuk mengisi variabel otomatis dari database.</span>
                  </div>
                  
                  {currentPlaceholders.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 italic text-xs">
                      Tidak ada variabel terdeteksi pada naskah ini.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                      {currentPlaceholders.map(ph => (
                        <div key={ph} className="group bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all duration-200">
                          <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 transition-colors group-focus-within:text-indigo-600">
                            {ph.replace(/_/g, ' ')}
                          </label>
                          <input 
                            type="text"
                            value={previewVars[ph] || ''}
                            onChange={(e) => handleVarChange(ph, e.target.value)}
                            placeholder={`Ketik ${ph.replace(/_/g, ' ')}...`}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500 transition-all text-slate-800 font-semibold shadow-sm"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-end mt-4 pt-3 border-t border-slate-100">
                    <button type="button" onClick={() => { localStorage.setItem('pbj_doc_settings', JSON.stringify(docSettings)); setNotification('✅ Variabel Naskah berhasil diterapkan ke preview!'); setTimeout(() => setNotification(''), 3000); }} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition-all shadow-sm flex items-center gap-1.5">
                      💾 Simpan & Terapkan Variabel
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: TATA NASKAH & KOP DINAS */}
              {controlTab === 'settings' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-stretch">
                  
                  {/* Card 1: Logo & Upload */}
                  <div className="bg-slate-50/50 border border-slate-200/50 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider block border-b border-slate-100 pb-2 mb-3">🏛️ Lambang/Logo Kop</span>
                      <div className="space-y-3">
                        <div>
                          <select
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500 font-semibold"
                            value={docSettings.logoType || 'pemda'}
                            onChange={(e) => handleSettingChange('logoType', e.target.value)}
                          >
                            <option value="pemda">Lambang Daerah (Kab. Probolinggo)</option>
                            <option value="garuda">Lambang Negara (Garuda)</option>
                            <option value="custom">Logo Kustom (Unggah File)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Prominent Upload Zone - Always Visible for UX ease */}
                    <div className="p-3 bg-gradient-to-br from-indigo-50/50 to-slate-50 border border-dashed border-indigo-200 rounded-lg text-slate-800 text-xs shadow-inner space-y-2.5 mt-3">
                      <label className="block text-[9px] font-black text-indigo-800 uppercase tracking-widest flex items-center gap-1">
                        <span>📤</span> UNGGAH LOGO BARU
                      </label>
                      <div 
                        className="bg-white border-2 border-dashed border-slate-200 hover:border-indigo-500 rounded-lg p-2.5 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-1 group/upload"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <ImageIcon size={20} className="text-indigo-500 group-hover/upload:scale-110 transition-transform duration-200" />
                        <span className="text-[10px] font-extrabold text-[#0f2942] block leading-none">Pilih File Image</span>
                        
                        {docSettings.customLogo ? (
                          <div className="mt-1 flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[8px] font-extrabold px-1.5 py-0.5 rounded border border-emerald-100">
                            <span className="text-emerald-500">✓</span> Logo Aktif
                          </div>
                        ) : (
                          <span className="text-[8px] text-slate-400 font-medium">PNG/JPG komputer</span>
                        )}
                      </div>
                      
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              handleSettingChange('customLogo', event.target.result);
                              handleSettingChange('logoType', 'custom'); // switch logo type to custom automatically!
                              setNotification('✓ Logo Kop Surat berhasil diunggah!');
                              setTimeout(() => setNotification(''), 4000);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      {docSettings.customLogo && (
                        <button 
                          type="button" 
                          onClick={() => {
                            handleSettingChange('customLogo', null);
                            handleSettingChange('logoType', 'pemda');
                          }} 
                          className="w-full text-center text-rose-600 text-[9px] font-extrabold block hover:underline"
                        >
                          Reset ke Logo Daerah
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Card 2: Naskah Texts */}
                  <div className="bg-slate-50/50 border border-slate-200/50 rounded-xl p-4 space-y-3">
                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider block border-b border-slate-100 pb-2 mb-1">🏢 Teks Kop Surat</span>
                    <div>
                      <label className="block text-[8px] font-black text-slate-400 uppercase mb-0.5">Nama Pemda (Baris 1)</label>
                      <input 
                        type="text" 
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-500"
                        value={docSettings.namaPemda}
                        onChange={(e) => handleSettingChange('namaPemda', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black text-slate-400 uppercase mb-0.5">Nama Satker (Baris 2)</label>
                      <input 
                        type="text" 
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                        value={docSettings.namaInstansi}
                        onChange={(e) => handleSettingChange('namaInstansi', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black text-slate-400 uppercase mb-0.5">Kontak (Kaki Kop)</label>
                      <input 
                        type="text" 
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                        value={docSettings.alamatLengkap}
                        onChange={(e) => handleSettingChange('alamatLengkap', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Card 3: Margins & Dimensions */}
                  <div className="bg-slate-50/50 border border-slate-200/50 rounded-xl p-4 space-y-3">
                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider block border-b border-slate-100 pb-2 mb-1">📄 Dimensi & Margin</span>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[8px] font-black text-slate-400 uppercase mb-0.5">Ukuran Kertas</label>
                        <select 
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] focus:outline-none font-semibold"
                          value={docSettings.paperSize}
                          onChange={(e) => handleSettingChange('paperSize', e.target.value)}
                        >
                          <option value="A4">A4</option>
                          <option value="F4">F4 / Folio</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[8px] font-black text-slate-400 uppercase mb-0.5">Preset Tata Naskah</label>
                        <select 
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] focus:outline-none font-bold text-indigo-700"
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'pemda') {
                              handleSettingChange('marginTop', 20);
                              handleSettingChange('marginBottom', 25);
                              handleSettingChange('marginLeft', 30);
                              handleSettingChange('marginRight', 20);
                              handleSettingChange('fontFamily', 'Arial');
                              handleSettingChange('lineHeight', '1.15');
                            } else if (val === 'pusat') {
                              handleSettingChange('marginTop', 40);
                              handleSettingChange('marginBottom', 30);
                              handleSettingChange('marginLeft', 40);
                              handleSettingChange('marginRight', 20);
                              handleSettingChange('fontFamily', 'Times New Roman');
                              handleSettingChange('lineHeight', '1.5');
                            }
                          }}
                        >
                          <option value="">Preset...</option>
                          <option value="pemda">🏛️ Pemda</option>
                          <option value="pusat">📂 Pusat (ANRI)</option>
                        </select>
                      </div>
                    </div>

                    {/* Custom Margins Input */}
                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      <div>
                        <span className="text-[7px] uppercase text-slate-400 font-extrabold block text-center">Atas</span>
                        <input type="number" className="w-full px-1 py-1 border border-slate-200 rounded-md text-[11px] text-center font-bold" value={docSettings.marginTop} onChange={(e) => handleSettingChange('marginTop', parseInt(e.target.value) || 0)} />
                      </div>
                      <div>
                        <span className="text-[7px] uppercase text-slate-400 font-extrabold block text-center">Bawah</span>
                        <input type="number" className="w-full px-1 py-1 border border-slate-200 rounded-md text-[11px] text-center font-bold" value={docSettings.marginBottom} onChange={(e) => handleSettingChange('marginBottom', parseInt(e.target.value) || 0)} />
                      </div>
                      <div>
                        <span className="text-[7px] uppercase text-slate-400 font-extrabold block text-center">Kiri</span>
                        <input type="number" className="w-full px-1 py-1 border border-slate-200 rounded-md text-[11px] text-center font-bold" value={docSettings.marginLeft} onChange={(e) => handleSettingChange('marginLeft', parseInt(e.target.value) || 0)} />
                      </div>
                      <div>
                        <span className="text-[7px] uppercase text-slate-400 font-extrabold block text-center">Kanan</span>
                        <input type="number" className="w-full px-1 py-1 border border-slate-200 rounded-md text-[11px] text-center font-bold" value={docSettings.marginRight} onChange={(e) => handleSettingChange('marginRight', parseInt(e.target.value) || 0)} />
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Typography & Penomoran */}
                  <div className="bg-slate-50/50 border border-slate-200/50 rounded-xl p-4 space-y-3">
                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider block border-b border-slate-100 pb-2 mb-1">✒️ Huruf & Penomoran</span>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[8px] font-black text-slate-500 uppercase mb-0.5">Font</label>
                        <select 
                          className="w-full px-1.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-semibold"
                          value={docSettings.fontFamily || 'Arial'}
                          onChange={(e) => handleSettingChange('fontFamily', e.target.value)}
                        >
                          <option value="Arial">Arial</option>
                          <option value="Bookman Old Style">Bookman OS</option>
                          <option value="Times New Roman">Times NR</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[8px] font-black text-slate-500 uppercase mb-0.5">Ukuran</label>
                        <select 
                          className="w-full px-1.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-semibold"
                          value={docSettings.fontSize || '12pt'}
                          onChange={(e) => handleSettingChange('fontSize', e.target.value)}
                        >
                          <option value="11pt">11 pt</option>
                          <option value="12pt">12 pt</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[8px] font-black text-slate-500 uppercase mb-0.5">Spasi</label>
                        <select 
                          className="w-full px-1.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-semibold"
                          value={docSettings.lineHeight || '1.15'}
                          onChange={(e) => handleSettingChange('lineHeight', e.target.value)}
                        >
                          <option value="1.0">1.0</option>
                          <option value="1.15">1.15</option>
                          <option value="1.5">1.5</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[8px] font-black text-slate-500 uppercase mb-0.5">Format Nomor Surat</label>
                      <input 
                        type="text" 
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-mono text-slate-800"
                        value={docSettings.formatNomorSurat || ''}
                        onChange={(e) => handleSettingChange('formatNomorSurat', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                {/* Save button for settings tab */}
                <div className="flex justify-end mt-2 pt-3 border-t border-slate-100">
                    <button type="button" onClick={() => { localStorage.setItem('pbj_doc_settings', JSON.stringify(docSettings)); setNotification('✅ Pengaturan Kop & Margin berhasil disimpan ke sistem!'); setTimeout(() => setNotification(''), 3000); }} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition-all shadow-sm flex items-center gap-1.5">
                      💾 Simpan Pengaturan Naskah
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: TEMPLATE TEXT/MARKDOWN RAW EDITOR */}
              {controlTab === 'editor' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-fade-in items-stretch flex-1">
                  
                  {/* Metadata left column (1/3 width) */}
                  <div className="space-y-4 bg-slate-50/50 p-4 rounded-xl border border-slate-200/50 flex flex-col justify-start">
                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider block border-b border-slate-100 pb-2 mb-1">📝 Metadata Naskah</span>
                    <div>
                      <label className="block text-[8px] font-black text-slate-500 uppercase mb-0.5">Nama Dokumen Resmi</label>
                      <input 
                        type="text"
                        value={activeTemplateName}
                        onChange={e => setActiveTemplateName(e.target.value)}
                        readOnly={user?.role !== 'Admin' || !editMode}
                        className={`w-full px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-indigo-500 font-bold border transition-all ${
                          user?.role === 'Admin' && editMode ? 'bg-white border-slate-200' : 'bg-slate-100 border-slate-200 text-slate-700 cursor-not-allowed'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[8px] font-black text-slate-500 uppercase mb-0.5">Kategori Tahap Pengadaan</label>
                      <select 
                        value={activeCategory}
                        onChange={e => setActiveCategory(e.target.value)}
                        disabled={user?.role !== 'Admin' || !editMode}
                        className={`w-full px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-indigo-500 font-semibold border transition-all ${
                          user?.role === 'Admin' && editMode ? 'bg-white border-slate-200' : 'bg-slate-100 border-slate-200 text-slate-700 cursor-not-allowed'
                        }`}
                      >
                        {categories.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    {user?.role !== 'Admin' ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[10px] text-amber-800 flex items-start gap-2 shadow-inner mt-2">
                        <LockIcon size={14} className="text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-extrabold block text-xs mb-0.5">🔒 Read-Only Draft</span>
                          Perubahan struktur induk surat dinas resmi hanya dapat disimpan oleh **Administrator UKPBJ / BPBJ** demi legalitas hukum.
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-end mt-4">
                        {editMode ? (
                          <button onClick={handleSaveTemplate} className="w-full py-2 bg-emerald-600 text-white hover:bg-emerald-700 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 shadow-sm">
                            💾 Simpan Perubahan Naskah
                          </button>
                        ) : (
                          <button onClick={() => setEditMode(true)} className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg border border-indigo-100 transition-all flex items-center justify-center gap-1">
                            ✏️ Aktifkan Mode Edit
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Text/code editor right column (2/3 width) */}
                  <div className="lg:col-span-2 flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm min-h-[550px]">
                    <div className="bg-slate-50 text-slate-500 text-[10px] px-3.5 py-2 font-mono border-b border-slate-200 flex justify-between select-none items-center flex-wrap gap-2">
                      <div className="flex gap-1.5 items-center flex-wrap">
                        {/* Undo / Redo */}
                        <button type="button" onClick={() => { document.getElementById('template-editor-textarea')?.focus(); document.execCommand('undo'); }} className="p-1 px-1.5 hover:bg-slate-200 rounded text-slate-700 font-bold" title="Undo (Ctrl+Z)">↩️</button>
                        <button type="button" onClick={() => { document.getElementById('template-editor-textarea')?.focus(); document.execCommand('redo'); }} className="p-1 px-1.5 hover:bg-slate-200 rounded text-slate-700 font-bold" title="Redo (Ctrl+Y)">↪️</button>
                        <div className="w-px h-4 bg-slate-300 mx-1"></div>

                        {/* Text Styles */}
                        <button type="button" onClick={() => insertFormatting('<b>', '</b>')} className="p-1.5 hover:bg-slate-200 rounded text-slate-700 font-bold" title="Tebal (Bold)">B</button>
                        <button type="button" onClick={() => insertFormatting('<i>', '</i>')} className="p-1.5 hover:bg-slate-200 rounded text-slate-700 italic font-serif" title="Miring (Italic)">I</button>
                        <button type="button" onClick={() => insertFormatting('<u>', '</u>')} className="p-1.5 hover:bg-slate-200 rounded text-slate-700 underline" title="Garis Bawah (Underline)">U</button>
                        <button type="button" onClick={() => insertFormatting('<s>', '</s>')} className="p-1.5 hover:bg-slate-200 rounded text-slate-700 line-through" title="Coret (Strikethrough)">S</button>
                        
                        <div className="w-px h-4 bg-slate-300 mx-1"></div>
                        
                        {/* Headers */}
                        <button type="button" onClick={() => insertFormatting('<h1 style="font-size: 18pt; font-weight: bold; margin-bottom: 10px;">\n', '\n</h1>')} className="p-1 px-1.5 hover:bg-slate-200 rounded text-slate-700 font-bold text-[9px]" title="Heading 1">H1</button>
                        <button type="button" onClick={() => insertFormatting('<h2 style="font-size: 14pt; font-weight: bold; margin-bottom: 8px;">\n', '\n</h2>')} className="p-1 px-1.5 hover:bg-slate-200 rounded text-slate-700 font-bold text-[9px]" title="Heading 2">H2</button>
                        <button type="button" onClick={() => insertFormatting('<h3 style="font-size: 12pt; font-weight: bold; margin-bottom: 6px;">\n', '\n</h3>')} className="p-1 px-1.5 hover:bg-slate-200 rounded text-slate-700 font-bold text-[9px]" title="Heading 3">H3</button>

                        <div className="w-px h-4 bg-slate-300 mx-1"></div>

                        {/* Alignments */}
                        <button type="button" onClick={() => insertFormatting('<div style="text-align: left;">\n', '\n</div>')} className="p-1.5 hover:bg-slate-200 rounded text-slate-700 flex flex-col gap-0.5 w-6 items-center" title="Rata Kiri">
                          <div className="w-3.5 h-[1.5px] bg-slate-600 self-start"></div><div className="w-2.5 h-[1.5px] bg-slate-600 self-start"></div><div className="w-3.5 h-[1.5px] bg-slate-600 self-start"></div>
                        </button>
                        <button type="button" onClick={() => insertFormatting('<div style="text-align: center;">\n', '\n</div>')} className="p-1.5 hover:bg-slate-200 rounded text-slate-700 flex flex-col gap-0.5 w-6 items-center" title="Rata Tengah">
                          <div className="w-3.5 h-[1.5px] bg-slate-600"></div><div className="w-2.5 h-[1.5px] bg-slate-600"></div><div className="w-3.5 h-[1.5px] bg-slate-600"></div>
                        </button>
                        <button type="button" onClick={() => insertFormatting('<div style="text-align: right;">\n', '\n</div>')} className="p-1.5 hover:bg-slate-200 rounded text-slate-700 flex flex-col gap-0.5 w-6 items-center" title="Rata Kanan">
                          <div className="w-3.5 h-[1.5px] bg-slate-600 self-end"></div><div className="w-2.5 h-[1.5px] bg-slate-600 self-end"></div><div className="w-3.5 h-[1.5px] bg-slate-600 self-end"></div>
                        </button>
                        <button type="button" onClick={() => insertFormatting('<div style="text-align: justify;">\n', '\n</div>')} className="p-1.5 hover:bg-slate-200 rounded text-slate-700 flex flex-col gap-0.5 w-6 items-center" title="Rata Kiri Kanan (Justify)">
                          <div className="w-3.5 h-[1.5px] bg-slate-600"></div><div className="w-3.5 h-[1.5px] bg-slate-600"></div><div className="w-3.5 h-[1.5px] bg-slate-600"></div>
                        </button>
                        
                        <div className="w-px h-4 bg-slate-300 mx-1"></div>
                        
                        {/* Lists & Tables */}
                        <button type="button" onClick={() => insertFormatting('<ol style="padding-left: 20px;">\n  <li>', '</li>\n</ol>')} className="p-1 px-1.5 hover:bg-slate-200 rounded text-slate-700 text-[9px] font-bold" title="Numbering">1.</button>
                        <button type="button" onClick={() => insertFormatting('<ul style="padding-left: 20px;">\n  <li>', '</li>\n</ul>')} className="p-1 px-1.5 hover:bg-slate-200 rounded text-slate-700 text-[9px] font-bold" title="Bullets">•</button>
                        <button type="button" onClick={() => insertFormatting('<table border="1" style="width: 100%; border-collapse: collapse;">\n  <tbody>\n    <tr>\n      <td style="padding: 4px 8px;">Kolom 1</td>\n      <td style="padding: 4px 8px;">Kolom 2</td>\n    </tr>\n  </tbody>\n</table>\n', '')} className="p-1 px-1.5 hover:bg-slate-200 rounded text-slate-700 text-[10px]" title="Sisipkan Tabel">📊</button>
                      </div>
                      <span>Format: {'{{nama_variabel}}'}</span>
                    </div>
                    <textarea
                      id="template-editor-textarea"
                      value={activeTemplateContent}
                      onChange={(e) => setActiveTemplateContent(e.target.value)}
                      readOnly={user?.role !== 'Admin' || !editMode}
                      spellCheck="false"
                      className="w-full flex-1 p-3 text-[11px] font-mono text-slate-700 bg-transparent resize-none outline-none leading-relaxed overflow-y-auto"
                      placeholder="Isi surat resmi disini..."
                    ></textarea>
                  </div>

                </div>
              )}

            </div>
          )}
        </div>

        {/* ================= BOTTOM COLUMN: Centered centered preview sheet (100% Width) ================= */}
        <div id="pbk-template-right-panel" className="w-full flex flex-col print:w-full print:h-auto items-center transition-all duration-300">
          {selectedTemplate ? (
            <div className="bg-slate-200/80 border border-slate-300/40 rounded-2xl shadow-sm overflow-hidden flex flex-col w-full min-h-[700px] print:border-none print:shadow-none print:bg-white print:overflow-visible">
              
              {/* Paper Top Toolbar (Hidden when printing) */}
              <div className="bg-white border-b border-slate-300/60 p-3.5 flex items-center justify-between print:hidden shadow-sm z-10 shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 border border-emerald-600 animate-pulse"></span>
                  <span className="text-[10px] font-black text-slate-700 tracking-wider uppercase">Live Official Paper Sheet</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Toggle Margins Guideline */}
                  <button 
                    onClick={() => setShowMargins(!showMargins)}
                    className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all flex items-center gap-1 ${
                      showMargins 
                        ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-sm' 
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                    title={showMargins ? "Sembunyikan Garis Batas Margin" : "Tampilkan Garis Batas Margin"}
                  >
                    <span>📏</span>
                    <span>{showMargins ? "Batas Margin Aktif" : "Tampilkan Margin"}</span>
                  </button>

                  {/* Focus mode toggle */}
                  <button 
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all flex items-center gap-1.5 ${
                      sidebarOpen 
                        ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200' 
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700 shadow-sm animate-pulse'
                    }`}
                    title={sidebarOpen ? "Sembunyikan Panel Kontrol" : "Tampilkan Panel Kontrol"}
                  >
                    {sidebarOpen ? <EyeOff size={11} className="text-slate-600" /> : <Eye size={11} className="text-white" />}
                    <span className={sidebarOpen ? "text-slate-700" : "text-white"}>{sidebarOpen ? "Tutup Pilihan" : "Buka Pilihan"}</span>
                  </button>
                  {user?.role === 'Admin' && selectedTemplate.isDefault && selectedTemplate.content !== DEFAULT_TEMPLATES.find(t=>t.id === selectedTemplate.id)?.content && (
                    <button 
                      onClick={handleResetTemplate} 
                      className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 text-[10px] font-bold rounded-lg border border-amber-100 transition-colors flex items-center gap-1"
                      title="Kembalikan ke standar resmi sistem"
                    >
                      <RefreshCw size={11} />
                      Reset Standard
                    </button>
                  )}

                  {/* Duplicate template */}
                  <button 
                    onClick={handleDuplicate} 
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 transition-colors flex items-center gap-1"
                    title="Ganda / salin kustomisasi"
                  >
                    <Copy size={11} />
                    Copy
                  </button>

                  {/* Print and Export Actions */}
                  <button 
                    onClick={handlePrint} 
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1"
                  >
                    <Printer size={11} className="safe-white-text" />
                    <span className="safe-white-text">Cetak PDF</span>
                  </button>
                  
                  <button 
                    onClick={handleExportWord} 
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1"
                  >
                    <Download size={11} className="safe-white-text" />
                    <span className="safe-white-text">Word</span>
                  </button>

                  {/* Delete if custom */}
                  {user?.role === 'Admin' && !selectedTemplate.isDefault && (
                    <button onClick={handleDelete} className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg border border-rose-100 transition-colors" title="Hapus Template Kustom">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Local Sheet Print CSS Override - MOVED OUTSIDE print-container to prevent bleeding */}
              <style>
                {`
                  .margin-guideline::before {
                    content: '';
                    position: absolute;
                    top: ${docSettings.marginTop}mm;
                    left: ${docSettings.marginLeft}mm;
                    right: ${docSettings.marginRight}mm;
                    bottom: ${docSettings.marginBottom}mm;
                    border: 1px dashed rgba(99, 102, 241, 0.4) !important;
                    pointer-events: none;
                    z-index: 99;
                  }
                  @media print {
                    .margin-guideline::before {
                      display: none !important;
                    }
                    html, body {
                      background: white !important;
                      margin: 0 !important;
                      padding: 0 !important;
                      height: auto !important;
                      overflow: visible !important;
                    }
                    body * {
                      visibility: hidden !important;
                    }
                    #root,
                    main,
                    #pbk-template-root,
                    #pbk-template-layout,
                    #pbk-template-right-panel,
                    .print-container, 
                    .print-container * {
                      visibility: visible !important;
                      position: static !important;
                      overflow: visible !important;
                      height: auto !important;
                      width: auto !important;
                      min-height: auto !important;
                      margin: 0 !important;
                      padding: 0 !important;
                      box-shadow: none !important;
                      border: none !important;
                      display: block !important;
                      background: none !important;
                    }
                    .print\\:hidden { 
                      display: none !important; 
                    }
                    .print-container {
                      visibility: visible !important;
                      position: relative !important;
                      left: 0 !important;
                      top: 0 !important;
                      width: 100% !important;
                      max-width: 100% !important;
                      display: block !important;
                      padding: ${docSettings.marginTop}mm ${docSettings.marginRight}mm ${docSettings.marginBottom}mm ${docSettings.marginLeft}mm !important;
                      margin: 0 !important;
                      background: white !important;
                      font-family: ${docSettings.fontFamily === 'Bookman Old Style' ? "'Bookman Old Style', Georgia, serif" : docSettings.fontFamily === 'Arial' ? "Arial, Helvetica, sans-serif" : "'Times New Roman', Times, serif"} !important;
                      font-size: ${docSettings.fontSize || '12pt'} !important;
                      line-height: ${docSettings.lineHeight || '1.15'} !important;
                    }
                    @page { 
                      size: ${docSettings.paperSize === 'F4' ? '215mm 330mm' : 'A4'} portrait; 
                      margin: 0 !important; 
                    }
                    .print-container span {
                      background: transparent !important;
                      color: black !important;
                      border: none !important;
                      padding: 0 !important;
                    }
                  }
                `}
              </style>

              {/* The Desk / Workspace where the sheet lies */}
              <div 
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto p-6 md:p-8 flex justify-center print:w-full print:bg-white print:p-0 print:overflow-visible print:block scrollbar-thin shadow-inner bg-slate-300/40"
              >
                {/* Visual A4/F4 Paper Sheet */}
                <div 
                  ref={printRef}
                  className={`print-container bg-white shadow-xl print:shadow-none text-black relative select-text transition-all duration-300 rounded-[4px] ${
                    showMargins ? 'margin-guideline' : ''
                  }`}
                  style={{
                    width: docSettings.paperSize === 'F4' ? '215mm' : '210mm',
                    minHeight: docSettings.paperSize === 'F4' ? '330mm' : '297mm',
                    paddingTop: `${docSettings.marginTop}mm`,
                    paddingRight: `${docSettings.marginRight}mm`,
                    paddingBottom: `${docSettings.marginBottom}mm`,
                    paddingLeft: `${docSettings.marginLeft}mm`,
                    fontFamily: docSettings.fontFamily === 'Bookman Old Style' 
                      ? "'Bookman Old Style', Georgia, serif" 
                      : docSettings.fontFamily === 'Arial' 
                        ? "Arial, Helvetica, sans-serif" 
                        : "'Times New Roman', Times, serif",
                    fontSize: docSettings.fontSize || '12pt',
                    lineHeight: docSettings.lineHeight || '1.15'
                  }}
                >
                  
                  {/* Paper Size floating badge - print-hidden */}
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[9px] font-black px-3.5 py-1.5 rounded-full shadow-md border border-indigo-700/35 print:hidden z-50 flex items-center gap-1.5 select-none tracking-wider whitespace-nowrap">
                    <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                    <span>STANDAR {docSettings.paperSize === 'F4' ? 'F4 / FOLIO (215x330mm)' : 'A4 (210x297mm)'}</span>
                    <span className="text-slate-500">|</span>
                    <span className="text-indigo-200">Preset Pemda</span>
                  </div>

                  {/* OFFICIAL KOP SURAT GOVT PRESET */}
                  {docSettings.showKop && (
                    <div className="w-full mb-6 select-none relative group/kop" style={{ 
                      pageBreakInside: 'avoid',
                      borderBottom: '4.5px solid black',
                      paddingBottom: '10px',
                      marginBottom: '20px'
                    }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                          <tr>
                            {/* Emblem Left Column - Clickable for Instant Upload! */}
                            <td 
                              style={{ width: '15%', verticalAlign: 'middle', textAlign: 'center', paddingRight: '12px', cursor: 'pointer' }}
                              className="relative group/logo cursor-pointer hover:opacity-95 transition-all duration-200"
                              onClick={() => fileInputRef.current?.click()}
                              title="Klik untuk ganti/unggah logo daerah"
                            >
                              <div className="relative inline-block">
                                {docSettings.logoType === 'pemda' ? (
                                  <img 
                                    src="https://upload.wikimedia.org/wikipedia/commons/2/25/Lambang_Kabupaten_Probolinggo.png" 
                                    alt="Logo Daerah" 
                                    style={{ maxHeight: '76px', maxWidth: '76px', objectFit: 'contain', display: 'inline-block' }} 
                                  />
                                ) : docSettings.logoType === 'garuda' ? (
                                  <LogoGarudaPlaceholder />
                                ) : docSettings.customLogo ? (
                                  <img 
                                    src={docSettings.customLogo} 
                                    alt="Logo Kustom" 
                                    style={{ maxHeight: '80px', maxWidth: '80px', objectFit: 'contain', display: 'inline-block' }} 
                                  />
                                ) : (
                                  <LogoGarudaPlaceholder />
                                )}
                                
                                {/* Hover overlay for WYSIWYG Upload - hidden during print */}
                                <div className="absolute inset-0 bg-indigo-900/85 opacity-0 group-hover/logo:opacity-100 rounded-lg flex flex-col items-center justify-center transition-all duration-200 print:hidden text-white p-1 text-center border border-indigo-300/30">
                                  <span className="text-[12px]">📤</span>
                                  <span className="text-[8px] font-black tracking-wider leading-none mt-1 uppercase">UNGGAH<br/>LOGO</span>
                                </div>
                              </div>
                              {/* Small print-hidden floating badge */}
                              <div className="mt-1 print:hidden text-[7px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full px-1.5 py-0.5 inline-flex items-center gap-0.5 hover:bg-indigo-100 transition-all select-none">
                                <span>✏️</span> GANTI LOGO
                              </div>
                            </td>
                            {/* Text Header Middle Column */}
                            <td style={{ width: '85%', textAlign: 'center', verticalAlign: 'middle' }}>
                              <div style={{ fontWeight: 'bold', fontSize: '11pt', textTransform: 'uppercase', lineHeight: '1.2', letterSpacing: '0.04em', color: 'black' }}>
                                {docSettings.namaPemda}
                              </div>
                              <div style={{ fontWeight: 'bold', fontSize: '13pt', textTransform: 'uppercase', lineHeight: '1.25', marginTop: '4px', color: 'black', whiteSpace: 'pre-line' }}>
                                {docSettings.namaInstansi.split(', ').map((part, idx, arr) => (
                                  <React.Fragment key={idx}>
                                    {part}{idx < arr.length - 1 ? ',' : ''}
                                    {idx < arr.length - 1 && <br />}
                                  </React.Fragment>
                                ))}
                              </div>
                              <div 
                                style={{ fontSize: '8.5pt', marginTop: '6px', lineHeight: '1.35', color: '#0f172a' }}
                                dangerouslySetInnerHTML={{ __html: formatAlamatKop(docSettings.alamatLengkap) }}
                              />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* DOCUMENT BODY CONTENT */}
                  <div className="document-body-content text-justify text-black" style={{ color: 'black' }}>
                    {(() => {
                      const parseSmartColons = (text) => {
                        if (!text) return text;
                        const lines = text.split('\n');
                        let output = [];
                        let inTable = false;
                        for (let i = 0; i < lines.length; i++) {
                          const line = lines[i];
                          const match = line.match(/^([A-Za-z0-9/ ()\-_.,]+?)\s*:\s*(.*)$/);
                          if (match && !line.includes('<') && match[1].length < 45) {
                            if (!inTable) {
                              inTable = true;
                              output.push('<table style="width: 100%; border: none; margin-top: 4px; margin-bottom: 4px; border-collapse: collapse;"><tbody>');
                            }
                            output[output.length - 1] += `<tr><td style="width: 1%; white-space: nowrap; padding-right: 15px; vertical-align: top; border: none; padding-top: 2px;">${match[1]}</td><td style="width: 1%; padding-right: 8px; vertical-align: top; border: none; padding-top: 2px;">:</td><td style="vertical-align: top; border: none; padding-top: 2px;">${match[2]}</td></tr>`;
                          } else {
                            if (inTable) {
                              inTable = false;
                              output[output.length - 1] += '</tbody></table>';
                            }
                            output.push(line);
                          }
                        }
                        if (inTable) output[output.length - 1] += '</tbody></table>';
                        return output.join('\n');
                      };

                      return parseSmartColons(activeTemplateContent).split(/\n\s*\n/).map((para, i) => {
                      if (!para.trim()) return null;
                      return (
                        <div 
                          key={i} 
                          className="document-paragraph text-justify" 
                          style={{ 
                            lineHeight: docSettings.lineHeight || '1.15',
                            fontFamily: docSettings.fontFamily === 'Bookman Old Style' 
                              ? "'Bookman Old Style', Georgia, serif" 
                              : docSettings.fontFamily === 'Arial' 
                                ? "Arial, Helvetica, sans-serif" 
                                : "'Times New Roman', Times, serif",
                            fontSize: docSettings.fontSize || '12pt',
                            whiteSpace: 'pre-wrap',
                            textAlign: 'justify',
                            textJustify: 'inter-word',
                            marginBottom: '1.15em',
                            color: 'black'
                          }}
                          dangerouslySetInnerHTML={{ __html: renderPreviewHTML(para) }}
                        />
                      );
                    })})()}
                  </div>
                  
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-slate-200 border border-slate-300/40 rounded-2xl h-[calc(100vh-140px)] flex flex-col items-center justify-center text-slate-400 print:hidden shadow-inner">
              <BookOpen size={48} className="text-slate-400/80 mb-3" />
              <p className="text-sm font-semibold">Silakan pilih template naskah dinas di kolom kiri.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
