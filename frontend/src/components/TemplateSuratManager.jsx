import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';

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

Demikian disampaikan, atas perhatian dan kerjasamanya diucapkan terima kasih.

Pejabat Pembuat Komitmen (PPK),

{{nama_ppk}}
NIP. {{nip_ppk}}`,
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
    id: 'TPL-006',
    category: 'Tahap Persiapan',
    name: 'Dokumen Persiapan Pengadaan (DPP)',
    content: `DOKUMEN PERSIAPAN PENGADAAN (DPP)
Nomor: {{nomor_dpp}}
Tanggal: {{tanggal_dpp}}

Berdasarkan Peraturan Presiden tentang Pengadaan Barang/Jasa Pemerintah beserta perubahannya, Pejabat Pembuat Komitmen (PPK) telah menyusun Dokumen Persiapan Pengadaan (DPP) untuk paket pekerjaan berikut:

Nama Pekerjaan  : {{nama_pekerjaan}}
Lokasi Pekerjaan: {{tempat_penetapan}}
Nilai Pagu      : {{nilai_pagu}}
Sumber Dana     : {{sumber_dana}}

Dokumen Persiapan Pengadaan ini terdiri dari:
1. Spesifikasi Teknis / Kerangka Acuan Kerja (KAK)
2. Harga Perkiraan Sendiri (HPS)
3. Rancangan Kontrak (Surat Pesanan)

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

const LogoGarudaPlaceholder = () => (
  <svg width="70" height="70" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 5 L90 25 L90 60 C90 85 50 100 50 100 C50 100 10 85 10 60 L10 25 Z" stroke="#1e293b" strokeWidth="3" fill="transparent"/>
    <circle cx="50" cy="45" r="15" fill="#1e293b"/>
    <path d="M50 60 L50 80" stroke="#1e293b" strokeWidth="3"/>
    <path d="M35 45 L20 45" stroke="#1e293b" strokeWidth="3"/>
    <path d="M65 45 L80 45" stroke="#1e293b" strokeWidth="3"/>
    <path d="M40 25 L60 25" stroke="#1e293b" strokeWidth="3"/>
  </svg>
);

export default function TemplateSuratManager() {
  const { user } = useAuth();
  
  const [templates, setTemplates] = useState(() => {
    const saved = localStorage.getItem('pbj_templates');
    if (saved) {
      const parsed = JSON.parse(saved);
      const newTemplates = [...parsed];
      DEFAULT_TEMPLATES.forEach(defTpl => {
        if (!parsed.find(t => t.id === defTpl.id)) {
          newTemplates.push(defTpl);
        }
      });
      return newTemplates;
    }
    return DEFAULT_TEMPLATES;
  });

  const [docSettings, setDocSettings] = useState(() => {
    const saved = localStorage.getItem('pbj_doc_settings');
    const defaultSettings = {
      showKop: true,
      namaPemda: 'PEMERINTAH KABUPATEN PROBOLINGGO',
      namaInstansi: 'DINAS KOPERASI, USAHA MIKRO, PERDAGANGAN DAN PERINDUSTRIAN',
      alamatLengkap: 'Jl. Raya Dringu No. 81, Probolinggo. Telp: (0335) 422118, Email: dkupp@probolinggokab.go.id, Kode Pos: 67271',
      paperSize: 'A4',
      marginTop: 20,      // 20 mm (2 cm) Permendagri 1/2023 standard
      marginBottom: 25,   // 25 mm (2.5 cm) Permendagri 1/2023 standard
      marginLeft: 30,     // 30 mm (3 cm) Permendagri 1/2023 standard
      marginRight: 20,    // 20 mm (2 cm) Permendagri 1/2023 standard
      fontFamily: 'Arial', // Default font standard korespondensi Permendagri 1/2023
      fontSize: '12pt',    // Default ukuran huruf isi
      lineHeight: '1.5',   // Default tinggi baris
      formatNomorSurat: '027/{nomor}/DKUPP/2026'
    };
    if (saved) {
      const parsed = JSON.parse(saved);
      // Auto-migrate old defaults (15, 25, 20, 20) or (40, 30, 40, 20) to new Permendagri 1/2023
      if (
        (parsed.marginTop === 15 && parsed.marginLeft === 25 && parsed.marginBottom === 20 && parsed.marginRight === 20) ||
        (parsed.marginTop === 40 && parsed.marginLeft === 40 && parsed.marginBottom === 30 && parsed.marginRight === 20 && !parsed.fontFamily)
      ) {
        parsed.marginTop = 20;
        parsed.marginLeft = 30;
        parsed.marginBottom = 25;
        parsed.marginRight = 20;
        parsed.fontFamily = 'Arial';
        parsed.fontSize = '12pt';
        parsed.lineHeight = '1.5';
        localStorage.setItem('pbj_doc_settings', JSON.stringify(parsed));
      }
      return { ...defaultSettings, ...parsed };
    }
    return defaultSettings;
  });

  const [activeTab, setActiveTab] = useState('edit'); // 'edit', 'preview', 'settings'
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id || null);
  
  const [editMode, setEditMode] = useState(false);
  const [activeTemplateContent, setActiveTemplateContent] = useState('');
  const [activeTemplateName, setActiveTemplateName] = useState('');
  
  // Simulated form variables for preview
  const [previewVars, setPreviewVars] = useState({
    nama_satker: user?.department || 'Dinas Contoh Pemerintah Daerah',
    nama_satker_kapital: (user?.department || 'Dinas Contoh Pemerintah Daerah').toUpperCase(),
    alamat_satker: 'Jl. Pemuda No. 1, Pusat Pemerintahan',
    nama_pekerjaan: 'Pengadaan Laptop Perkantoran',
    nilai_pagu: 'Rp 150.000.000',
    sumber_dana: 'APBD 2026',
    nama_ppk: 'Handik Hariyanto, S.Kom., M.Si',
    nip_ppk: '197909102002121004',
    nomor_surat: (docSettings?.formatNomorSurat || '027/{nomor}/DKUPP/2026').replace('{nomor}', '123'),
    nama_penyedia: 'PT. Teknologi Maju Bersama',
    hari_tanggal_acara: 'Senin, 25 Mei 2026',
    waktu_acara: '09:00 WIB',
    tempat_acara: 'Ruang Rapat UKPBJ',
    nama_pejabat_pengadaan: 'Beni Trisna Wijaya, S.Kom',
    nip_pejabat_pengadaan: '198205192010011010',
    nomor_ba: (docSettings?.formatNomorSurat || '027/{nomor}/DKUPP/2026').replace('{nomor}', '124'),
    hari_ba: 'Selasa',
    tanggal_ba: '26 Mei 2026',
    harga_penawaran: 'Rp 148.000.000',
    harga_negosiasi: 'Rp 145.000.000',
    nomor_bahp: (docSettings?.formatNomorSurat || '027/{nomor}/DKUPP/2026').replace('{nomor}', '125'),
    nilai_hps: 'Rp 149.500.000',
    nama_penyedia_terpilih: 'PT. Teknologi Maju Bersama',
    harga_final: 'Rp 145.000.000',
    tempat_penetapan: 'Kabupaten Probolinggo',
    nomor_sp: (docSettings?.formatNomorSurat || '027/{nomor}/DKUPP/2026').replace('{nomor}', '126'),
    alamat_penyedia: 'Gedung Cyber, Lt 3. Jakarta',
    nilai_kontrak: 'Rp 145.000.000',
    waktu_penyelesaian: '30 (tiga puluh) hari kalender',
    nomor_dpp: (docSettings?.formatNomorSurat || '027/{nomor}/DKUPP/2026').replace('{nomor}', '120'),
    tanggal_dpp: '20 Mei 2026',
    nomor_hps: (docSettings?.formatNomorSurat || '027/{nomor}/DKUPP/2026').replace('{nomor}', '121'),
    tanggal_hps: '21 Mei 2026',
    lokasi_pekerjaan: 'Dinas Koperasi UKM, Kota Probolinggo',
  });

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
  const printRef = useRef(null);

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
      setEditMode(false);
    }
  }, [selectedTemplateId, selectedTemplate]);

  const handleSaveTemplate = () => {
    setTemplates(prev => prev.map(t => {
      if (t.id === selectedTemplateId) {
        return { ...t, content: activeTemplateContent, name: activeTemplateName, isDefault: false };
      }
      return t;
    }));
    setEditMode(false);
    alert('Template berhasil disimpan.');
  };

  const handleResetTemplate = () => {
    if(window.confirm('Apakah Anda yakin ingin mengembalikan template ini ke default bawaan sistem?')) {
      const defaultTpl = DEFAULT_TEMPLATES.find(t => t.id === selectedTemplateId);
      if(defaultTpl) {
        setTemplates(prev => prev.map(t => t.id === selectedTemplateId ? defaultTpl : t));
        setActiveTemplateContent(defaultTpl.content);
        setActiveTemplateName(defaultTpl.name);
        setEditMode(false);
      }
    }
  };

  const handleDuplicate = () => {
    const newId = 'TPL-CSTM-' + Date.now();
    const newTpl = {
      ...selectedTemplate,
      id: newId,
      name: selectedTemplate.name + ' (Copy)',
      isDefault: false
    };
    setTemplates(prev => [...prev, newTpl]);
    setSelectedTemplateId(newId);
  };

  const handleDelete = () => {
    if(window.confirm('Hapus template ini secara permanen?')) {
      setTemplates(prev => prev.filter(t => t.id !== selectedTemplateId));
      setSelectedTemplateId(templates[0]?.id);
    }
  };

  const handleVarChange = (key, value) => {
    setPreviewVars(prev => ({ ...prev, [key]: value }));
  };

  const handleSettingChange = (key, value) => {
    setDocSettings(prev => ({ ...prev, [key]: value }));
  };

  const renderPreview = (content) => {
    let result = content;
    // Replace all placeholders {{key}} with values from previewVars
    const regex = /{{(.*?)}}/g;
    result = result.replace(regex, (match, p1) => {
      const key = p1.trim();
      return previewVars[key] || match;
    });
    return result;
  };

  // Find all placeholders in current template
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
    
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${activeTemplateName}</title>
        <style>
          body { 
            font-family: ${docSettings.fontFamily === 'Bookman Old Style' ? "'Bookman Old Style', Georgia, serif" : docSettings.fontFamily === 'Arial' ? "Arial, Helvetica, sans-serif" : "'Times New Roman', Times, serif"}; 
            font-size: ${docSettings.fontSize || '12pt'}; 
            line-height: ${docSettings.lineHeight || '1.5'};
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
          ${htmlContent}
        </div>
      </body>
    </html>`;
    
    const blob = new Blob(['\ufeff', header], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeTemplateName.replace(/\s+/g, '_')}_${docSettings.formatNomorSurat ? 'Surat' : 'Doc'}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div id="pbk-template-root" className="animate-fade-in pb-12">
      
      {/* Header section */}
      <div className="print:hidden">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Manajemen Template Surat</h1>
            <p className="text-slate-400 mt-1">Kelola dan sesuaikan tata naskah dokumen E-Purchasing (BAKN, BAHP, SP).</p>
          </div>
          {user?.role === 'Admin' && (
            <button onClick={() => {
              const newId = 'TPL-NEW-' + Date.now();
              setTemplates(prev => [...prev, { id: newId, category: 'Lainnya', name: 'Template Baru', content: '', isDefault: false }]);
              setSelectedTemplateId(newId);
              setActiveTab('edit');
              setEditMode(true);
            }} className="btn-primary text-sm flex items-center gap-2">
              <span>➕</span> Buat Template Baru
            </button>
          )}
        </div>
      </div>

      <div id="pbk-template-layout" className="flex flex-col lg:flex-row gap-6 print:block print:w-full print:gap-0 print:m-0">
        
        {/* LEFT SIDEBAR - TEMPLATE LIST */}
        <div className="w-full lg:w-1/4 flex flex-col gap-4 print:hidden">
          <div className="glass-panel p-4 h-[calc(100vh-140px)] flex flex-col">
            <h3 className="font-semibold text-slate-800 mb-4 px-2">Daftar Template</h3>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {templates.map(tpl => (
                <button
                  key={tpl.id}
                  onClick={() => setSelectedTemplateId(tpl.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all duration-200 border ${selectedTemplateId === tpl.id ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-100 hover:border-indigo-100 hover:bg-slate-50'}`}
                >
                  <div className="text-xs text-indigo-500 font-semibold mb-1">{tpl.category}</div>
                  <div className="font-medium text-slate-800 text-sm leading-tight">{tpl.name}</div>
                  <div className="mt-2 flex gap-2">
                    {tpl.isDefault ? (
                      <span className="px-2 py-0.5 text-[9px] uppercase tracking-wider font-bold rounded bg-slate-100 text-slate-500">Default Sistem</span>
                    ) : (
                      <span className="px-2 py-0.5 text-[9px] uppercase tracking-wider font-bold rounded bg-emerald-50 text-emerald-600 border border-emerald-100">Kustomisasi</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - EDITOR & PREVIEW & SETTINGS */}
        <div id="pbk-template-right-panel" className="w-full lg:w-3/4 flex flex-col print:w-full print:h-auto">
          {selectedTemplate ? (
            <div id="pbk-template-glass-panel" className="glass-panel overflow-hidden flex flex-col h-[calc(100vh-140px)] print:h-auto print:border-none print:shadow-none print:bg-white print:overflow-visible">
              
              {/* Header Tab & Actions */}
              <div className="bg-slate-50 border-b border-slate-200 p-4 flex flex-wrap gap-4 items-center justify-between print:hidden">
                <div className="flex gap-2">
                  <button 
                    onClick={() => setActiveTab('edit')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'edit' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                  >
                    📝 Editor Konten
                  </button>
                  <button 
                    onClick={() => setActiveTab('settings')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                  >
                    ⚙️ Pengaturan Dokumen
                  </button>
                  <button 
                    onClick={() => setActiveTab('preview')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'preview' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                  >
                    👁️ Pratinjau (Preview)
                  </button>
                </div>
                
                {user?.role === 'Admin' && (
                  <div className="flex gap-2">
                    {activeTab === 'edit' && editMode && (
                      <button onClick={handleSaveTemplate} className="btn-primary py-1.5 px-4 text-xs">💾 Simpan Perubahan</button>
                    )}
                    {activeTab === 'edit' && !editMode && (
                      <button onClick={() => setEditMode(true)} className="btn-secondary py-1.5 px-4 text-xs">✏️ Edit Mode</button>
                    )}
                    {activeTab === 'preview' && (
                      <>
                        <button onClick={handlePrint} className="bg-emerald-600 text-white hover:bg-emerald-500 px-4 py-1.5 rounded-lg text-xs font-semibold shadow-md transition-all">🖨️ Cetak PDF</button>
                        <button onClick={handleExportWord} className="bg-blue-600 text-white hover:bg-blue-500 px-4 py-1.5 rounded-lg text-xs font-semibold shadow-md transition-all">📥 Export Word (.doc)</button>
                      </>
                    )}
                    {(activeTab === 'edit' || activeTab === 'settings') && (
                      <button onClick={handleDuplicate} className="btn-secondary py-1.5 px-3 text-xs" title="Duplikat Template">📋 Copy</button>
                    )}
                    {!selectedTemplate.isDefault && (
                      <button onClick={handleDelete} className="bg-rose-100 text-rose-600 hover:bg-rose-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">🗑️ Hapus</button>
                    )}
                    {selectedTemplate.isDefault && !editMode && selectedTemplate.content !== DEFAULT_TEMPLATES.find(t=>t.id === selectedTemplate.id)?.content && (
                       <button onClick={handleResetTemplate} className="text-amber-500 hover:text-amber-600 px-3 py-1.5 text-xs font-bold transition-colors">🔄 Reset Default</button>
                    )}
                  </div>
                )}
              </div>

              {/* EDITOR TAB */}
              {activeTab === 'edit' && (
                <div className="flex-1 overflow-y-auto p-6 bg-slate-100/50 print:hidden flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-3/4 flex flex-col gap-4">
                    {editMode ? (
                      <input 
                        className="glass-input text-xl font-bold"
                        value={activeTemplateName}
                        onChange={e => setActiveTemplateName(e.target.value)}
                        placeholder="Nama Template Surat"
                      />
                    ) : (
                      <h2 className="text-xl font-bold text-slate-800 px-2">{activeTemplateName}</h2>
                    )}
                    
                    {docSettings.showKop && (
                      <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-xs text-indigo-700 flex items-center gap-2">
                        <span>ℹ️</span> <span>Kop Surat Elektronik otomatis disisipkan saat mencetak. Anda tidak perlu menyertakan teks KOP SURAT di editor ini.</span>
                      </div>
                    )}
                    
                    <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-inner relative overflow-hidden flex flex-col">
                      <div className="bg-slate-800 text-slate-300 text-xs px-4 py-2 font-mono border-b border-slate-700 flex justify-between">
                        <span>Markdown / Text Editor</span>
                        <span>Variabel: {'{{nama_variabel}}'}</span>
                      </div>
                      <textarea
                        className="w-full h-full min-h-[400px] p-6 text-sm font-mono text-slate-700 resize-none outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500/50 leading-relaxed"
                        value={activeTemplateContent}
                        onChange={(e) => setActiveTemplateContent(e.target.value)}
                        readOnly={!editMode}
                        spellCheck="false"
                      ></textarea>
                    </div>
                  </div>
                  
                  <div className="w-full md:w-1/4">
                     <div className="bg-white border border-slate-200 rounded-xl p-4 sticky top-0 shadow-sm">
                        <h4 className="font-bold text-slate-800 text-sm mb-3">🏷️ Variabel Ditemukan</h4>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                           {currentPlaceholders.length === 0 ? (
                             <p className="text-xs text-slate-400 italic">Tidak ada variabel terdeteksi.</p>
                           ) : (
                             currentPlaceholders.map(ph => (
                               <div key={ph} className="bg-slate-50 border border-slate-100 p-2 rounded text-[11px] font-mono text-indigo-600 break-all">
                                 {'{'}{'{'}{ph}{'}'}{'}'}
                               </div>
                             ))
                           )}
                        </div>
                     </div>
                  </div>
                </div>
              )}

              {/* SETTINGS TAB */}
              {activeTab === 'settings' && (
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 print:hidden flex flex-col md:flex-row gap-8">
                  
                  {/* Left Column - Paper & Typo Settings */}
                  <div className="w-full md:w-1/3 space-y-6">
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                      <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">📄 Pengaturan Kertas</h3>
                      
                      <div className="mb-4">
                        <label className="block text-xs font-bold text-slate-600 mb-2">Ukuran Kertas</label>
                        <select 
                          className="w-full glass-input py-2 text-sm"
                          value={docSettings.paperSize}
                          onChange={(e) => handleSettingChange('paperSize', e.target.value)}
                        >
                          <option value="A4">A4 (210 x 297 mm)</option>
                          <option value="F4">F4 / Folio (215 x 330 mm)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-2">Margin (milimeter)</label>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-[10px] uppercase text-slate-400 font-bold">Atas</span>
                            <input type="number" className="w-full glass-input py-1.5 text-sm" value={docSettings.marginTop} onChange={(e) => handleSettingChange('marginTop', parseInt(e.target.value) || 0)} />
                          </div>
                          <div>
                            <span className="text-[10px] uppercase text-slate-400 font-bold">Bawah</span>
                            <input type="number" className="w-full glass-input py-1.5 text-sm" value={docSettings.marginBottom} onChange={(e) => handleSettingChange('marginBottom', parseInt(e.target.value) || 0)} />
                          </div>
                          <div>
                            <span className="text-[10px] uppercase text-slate-400 font-bold">Kiri (Jilid)</span>
                            <input type="number" className="w-full glass-input py-1.5 text-sm" value={docSettings.marginLeft} onChange={(e) => handleSettingChange('marginLeft', parseInt(e.target.value) || 0)} />
                          </div>
                          <div>
                            <span className="text-[10px] uppercase text-slate-400 font-bold">Kanan</span>
                            <input type="number" className="w-full glass-input py-1.5 text-sm" value={docSettings.marginRight} onChange={(e) => handleSettingChange('marginRight', parseInt(e.target.value) || 0)} />
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-3 leading-relaxed">
                          Sistem menggunakan <i>native browser pagination</i>. Teks yang melebihi batas halaman bawah akan otomatis mengalir ke halaman berikutnya sesuai margin yang Anda tentukan di sini tanpa terpotong.
                        </p>
                        
                        <div className="mt-4 border-t border-slate-100 pt-4">
                          <span className="block text-xs font-bold text-slate-600 mb-2">Preset Margin Resmi</span>
                          <div className="flex flex-col gap-2">
                            <button 
                              type="button" 
                              onClick={() => {
                                handleSettingChange('marginTop', 20);
                                handleSettingChange('marginBottom', 25);
                                handleSettingChange('marginLeft', 30);
                                handleSettingChange('marginRight', 20);
                              }}
                              className="w-full px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-100 transition-colors text-left flex items-center justify-between"
                            >
                              <span>🏛️ Pemda (Permendagri 1/2023)</span>
                              <span className="text-[10px] text-indigo-500 font-mono">20, 25, 30, 20 mm</span>
                            </button>
                            <button 
                              type="button" 
                              onClick={() => {
                                handleSettingChange('marginTop', 40);
                                handleSettingChange('marginBottom', 30);
                                handleSettingChange('marginLeft', 40);
                                handleSettingChange('marginRight', 20);
                              }}
                              className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors text-left flex items-center justify-between"
                            >
                              <span>📂 Pusat (ANRI / Klasik)</span>
                              <span className="text-[10px] text-slate-500 font-mono">40, 30, 40, 20 mm</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Typo & Spacing Settings */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mt-6">
                      <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">✒️ Tipografi & Spasi</h3>
                      
                      <div className="mb-4">
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">Jenis Huruf (Font Family)</label>
                        <select 
                          className="w-full glass-input py-2 text-sm"
                          value={docSettings.fontFamily || 'Arial'}
                          onChange={(e) => handleSettingChange('fontFamily', e.target.value)}
                        >
                          <option value="Arial">Arial (Standard Korespondensi Pemda)</option>
                          <option value="Bookman Old Style">Bookman Old Style (Standard Peraturan)</option>
                          <option value="Times New Roman">Times New Roman (Standard Klasik)</option>
                        </select>
                      </div>

                      <div className="mb-4">
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">Ukuran Huruf (Font Size)</label>
                        <select 
                          className="w-full glass-input py-2 text-sm"
                          value={docSettings.fontSize || '12pt'}
                          onChange={(e) => handleSettingChange('fontSize', e.target.value)}
                        >
                          <option value="11pt">11 pt (Kompak)</option>
                          <option value="12pt">12 pt (Standard Resmi)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">Spasi Baris (Line Height)</label>
                        <select 
                          className="w-full glass-input py-2 text-sm"
                          value={docSettings.lineHeight || '1.5'}
                          onChange={(e) => handleSettingChange('lineHeight', e.target.value)}
                        >
                          <option value="1.0">1.0 (Tunggal)</option>
                          <option value="1.15">1.15 (Kompak - Permendagri 1/2023)</option>
                          <option value="1.25">1.25 (Sedang)</option>
                          <option value="1.5">1.5 (Standard - Permendagri / ANRI)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Kop Surat Settings */}
                  <div className="w-full md:w-2/3">
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-4">
                        <h3 className="font-bold text-slate-800">🏛️ Tata Naskah Dinas (Kop Surat)</h3>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 text-indigo-600 rounded"
                            checked={docSettings.showKop}
                            onChange={(e) => handleSettingChange('showKop', e.target.checked)}
                          />
                          <span className="text-sm font-semibold text-slate-700">Gunakan Kop Resmi</span>
                        </label>
                      </div>

                      <div className={`transition-opacity duration-300 ${!docSettings.showKop ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Nama Pemerintah Daerah / Level 1</label>
                            <input 
                              type="text" 
                              className="w-full glass-input py-2 text-sm font-semibold"
                              value={docSettings.namaPemda}
                              onChange={(e) => handleSettingChange('namaPemda', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Nama Satuan Kerja / Dinas / Level 2</label>
                            <input 
                              type="text" 
                              className="w-full glass-input py-2 text-sm font-bold"
                              value={docSettings.namaInstansi}
                              onChange={(e) => handleSettingChange('namaInstansi', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Alamat Lengkap & Kontak (Baris Bawah)</label>
                            <textarea 
                              className="w-full glass-input py-2 text-sm resize-none h-20"
                              value={docSettings.alamatLengkap}
                              onChange={(e) => handleSettingChange('alamatLengkap', e.target.value)}
                            ></textarea>
                          </div>

                          <div className="border-t border-slate-100 pt-4 mt-4">
                            <label className="block text-xs font-bold text-slate-600 mb-2">Lambang / Logo Instansi</label>
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                                {docSettings.customLogo ? (
                                  <img src={docSettings.customLogo} alt="Logo Instansi" className="max-w-full max-h-full object-contain" />
                                ) : (
                                  <div className="flex flex-col items-center justify-center text-slate-300">
                                    <span className="text-xl">🏛️</span>
                                    <span className="text-[8px] font-bold mt-0.5">GARUDA</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 space-y-1.5">
                                <div className="flex gap-2">
                                  <label className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-100 transition-colors cursor-pointer flex items-center gap-1.5">
                                    <span>📤 Pilih Gambar</span>
                                    <input 
                                      type="file" 
                                      accept="image/*" 
                                      className="hidden" 
                                      onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                          if (file.size > 2 * 1024 * 1024) {
                                            alert("Ukuran file terlalu besar. Maksimal 2MB agar penyimpanan lokal lancar.");
                                            return;
                                          }
                                          const reader = new FileReader();
                                          reader.onload = (event) => {
                                            handleSettingChange('customLogo', event.target.result);
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                    />
                                  </label>
                                  {docSettings.customLogo && (
                                    <button 
                                      type="button" 
                                      onClick={() => handleSettingChange('customLogo', null)}
                                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold rounded-lg border border-rose-100 transition-colors"
                                    >
                                      ❌ Hapus Logo
                                    </button>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-500">Mendukung file PNG, JPG, JPEG, atau SVG (Maks. 2MB). Jika tidak ada logo yang diunggah, kop surat akan secara otomatis menggunakan Lambang Garuda default.</p>
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mt-6">
                      <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">🔢 Format Penomoran Surat</h3>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Format Penomoran Global</label>
                        <input 
                          type="text" 
                          className="w-full glass-input py-2 text-sm font-mono"
                          value={docSettings.formatNomorSurat || ''}
                          onChange={(e) => handleSettingChange('formatNomorSurat', e.target.value)}
                          placeholder="e.g. 027/{nomor}/DKUPP/2026"
                        />
                        <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                          Gunakan <b>{'{nomor}'}</b> sebagai placeholder nomor urut. Format ini akan menjadi default untuk penomoran dokumen di sistem.
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* PREVIEW TAB */}
              {activeTab === 'preview' && (
                <div id="pbk-template-inner-body" className="flex-1 flex overflow-hidden print:overflow-visible bg-slate-100">
                  {/* Left Side: Data Input for Preview (Hidden when printing) */}
                  <div className="w-[300px] border-r border-slate-200 bg-white p-4 overflow-y-auto print:hidden hidden lg:block shrink-0 shadow-[4px_0_15px_-3px_rgba(0,0,0,0.05)] z-10">
                     <h3 className="font-bold text-slate-800 text-sm mb-4">🔧 Dummy Data Pratinjau</h3>
                     <p className="text-xs text-slate-500 mb-4">Data ini digunakan untuk mengisi variabel di pratinjau.</p>
                     <div className="space-y-4">
                        {currentPlaceholders.map(ph => (
                          <div key={ph}>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{ph.replace(/_/g, ' ')}</label>
                            <input 
                              type="text"
                              className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400"
                              value={previewVars[ph] || ''}
                              onChange={(e) => handleVarChange(ph, e.target.value)}
                            />
                          </div>
                        ))}
                     </div>
                  </div>
                  
                  {/* Right Side: Render Physical Page (This is the only thing printed!) */}
                  <div id="print-sheet-surat-parent" className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center print:w-full print:bg-white print:p-0 print:overflow-visible print:block">
                     
                     <div 
                        ref={printRef}
                        className="print-container bg-white shadow-xl print:shadow-none text-black relative animate-fade-in"
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
                          lineHeight: docSettings.lineHeight || '1.5'
                        }}
                     >
                       <style>
                         {`
                           @media print {
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
                              #pbk-template-glass-panel,
                              #pbk-template-inner-body,
                              #print-sheet-surat-parent,
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
                              
                              /* Re-apply basic visual rules to print-container in block flow */
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
                                line-height: ${docSettings.lineHeight || '1.5'} !important;
                              }
                              
                              /* Table and list rules */
                              table {
                                width: 100% !important;
                                border-collapse: collapse !important;
                                page-break-inside: auto !important;
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
                              
                              /* Avoid splitting signature blocks */
                              .signature-section {
                                page-break-inside: avoid !important;
                                break-inside: avoid !important;
                              }
                              
                              /* Hide scrollbars during print */
                              ::-webkit-scrollbar {
                                display: none !important;
                              }

                              /* Inject dynamic page size and margins for native pagination */
                              @page { 
                                size: ${docSettings.paperSize === 'F4' ? '215mm 330mm' : 'A4'} portrait; 
                                margin: 0 !important; 
                              }
                            }
                         `}
                       </style>

                       {/* TATA NASKAH DINAS KOP SURAT */}
                       {docSettings.showKop && (
                         <div className="w-full mb-6" style={{ 
                            pageBreakInside: 'avoid', 
                            fontFamily: docSettings.fontFamily === 'Bookman Old Style' 
                              ? "'Bookman Old Style', Georgia, serif" 
                              : docSettings.fontFamily === 'Arial' 
                                ? "Arial, Helvetica, sans-serif" 
                                : "'Times New Roman', Times, serif"
                         }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', borderBottom: '3px solid black', marginBottom: '2px' }}>
                              <tbody>
                                <tr>
                                  <td style={{ width: '18%', verticalAlign: 'middle', textAlign: 'center', paddingBottom: '10px', paddingRight: '15px' }}>
                                     {docSettings.customLogo ? (
                                       <img 
                                         src={docSettings.customLogo} 
                                         alt="Logo Instansi" 
                                         style={{ 
                                           maxHeight: '80px', 
                                           maxWidth: '95px', 
                                           objectFit: 'contain',
                                           display: 'inline-block' 
                                         }} 
                                       />
                                     ) : (
                                       <LogoGarudaPlaceholder />
                                     )}
                                  </td>
                                  <td style={{ width: '82%', textAlign: 'center', verticalAlign: 'middle', paddingBottom: '10px' }}>
                                     <div style={{ fontWeight: 'bold', fontSize: '13pt', textTransform: 'uppercase', lineHeight: '1.2' }}>{docSettings.namaPemda}</div>
                                     <div style={{ fontWeight: 'bold', fontSize: '16pt', textTransform: 'uppercase', lineHeight: '1.2', marginTop: '2px' }}>{docSettings.namaInstansi}</div>
                                     <div style={{ fontSize: '9pt', marginTop: '6px', lineHeight: '1.3' }}>{docSettings.alamatLengkap}</div>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            <div style={{ width: '100%', borderBottom: '1px solid black' }}></div>
                         </div>
                       )}

                       {/* DYNAMIC DOCUMENT CONTENT */}
                       <div className="document-content">
                          {renderPreview(activeTemplateContent).split(/\n\s*\n/).map((para, i) => {
                            if (!para.trim()) return null;
                            return (
                              <div 
                                key={i} 
                                className="document-paragraph text-justify" 
                                style={{ 
                                  lineHeight: docSettings.lineHeight || '1.5',
                                  fontFamily: docSettings.fontFamily === 'Bookman Old Style' 
                                    ? "'Bookman Old Style', Georgia, serif" 
                                    : docSettings.fontFamily === 'Arial' 
                                      ? "Arial, Helvetica, sans-serif" 
                                      : "'Times New Roman', Times, serif",
                                  fontSize: docSettings.fontSize || '12pt',
                                  whiteSpace: 'pre-wrap',
                                  textAlign: 'justify',
                                  textJustify: 'inter-word',
                                  marginBottom: '1.25em'
                                }}
                              >
                                {para}
                              </div>
                            );
                          })}
                       </div>
                       
                     </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
             <div className="glass-panel h-[calc(100vh-140px)] flex flex-col items-center justify-center text-slate-400 print:hidden">
                <span className="text-4xl mb-4">📄</span>
                <p>Pilih template dari daftar di sebelah kiri.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
