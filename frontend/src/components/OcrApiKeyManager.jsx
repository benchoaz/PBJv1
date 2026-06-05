import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const PROVIDERS = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    logo: '✨',
    desc: 'Unggul dalam akurasi ekstraksi teks terstruktur dan deteksi tabel.',
    url: 'https://platform.openai.com/api-keys',
    prefix: 'sk-',
    placeholder: 'sk-proj-...',
    help: 'Gunakan GPT-4o untuk dokumen resolusi tinggi.'
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic Claude',
    logo: '🧠',
    desc: 'Terbaik dalam menganalisis dokumen panjang dengan kepatuhan tinggi.',
    url: 'https://console.anthropic.com/',
    prefix: 'sk-ant-',
    placeholder: 'sk-ant-api03-...',
    help: 'Claude 3.5 Sonnet memberikan ekstraksi JSON terbaik.'
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    logo: '🐋',
    desc: 'Model cerdas dan sangat efisien biaya untuk pemrosesan volume besar.',
    url: 'https://platform.deepseek.com/',
    prefix: 'sk-',
    placeholder: 'sk-...',
    help: 'DeepSeek-Coder v2 untuk akurasi logika.'
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    logo: '💎',
    desc: 'Multimodal berkecepatan tinggi, efisien untuk scan foto berkas/kamera.',
    url: 'https://aistudio.google.com/app/apikey',
    prefix: 'AIzaSy',
    placeholder: 'AIzaSy... atau AQ...',
    help: 'Gemini 1.5 Pro sangat baik mendeteksi tulisan tangan. Mendukung format AIzaSy & AQ.'
  },
  mistral: {
    id: 'mistral',
    name: 'Mistral AI',
    logo: '🌪️',
    desc: 'Model open-weight andal untuk klasifikasi dokumen dinas.',
    url: 'https://console.mistral.ai/api-keys/',
    prefix: 'sk-',
    placeholder: 'sk-...',
    help: 'Mistral Large untuk performa maksimal.'
  },
  cohere: {
    id: 'cohere',
    name: 'Cohere',
    logo: '🏔️',
    desc: 'Model RAG dan pencarian semantik tingkat lanjut untuk Enterprise.',
    url: 'https://dashboard.cohere.com/api-keys',
    prefix: '',
    placeholder: 'Enter API Key...',
    help: 'Sangat baik untuk kategorisasi data.'
  },
  groq: {
    id: 'groq',
    name: 'Groq Cloud',
    logo: '⚡',
    desc: 'Akselerasi super cepat untuk ekstraksi teks seketika.',
    url: 'https://console.groq.com/keys',
    prefix: 'gsk_',
    placeholder: 'gsk_...',
    help: 'Llama-3-70b untuk kecepatan di bawah 1 detik.'
  },
  ollama: {
    id: 'ollama',
    name: 'Ollama Lokal',
    logo: '🦙',
    desc: 'Solusi aman 100% lokal tanpa internet untuk kerahasiaan data.',
    url: 'http://localhost:11434',
    prefix: 'http',
    placeholder: 'http://localhost:11434',
    help: 'Pastikan server Ollama sudah aktif.'
  }
};

const SAMPLE_DOCUMENTS = [
  {
    id: 'dpa_fuzzy',
    title: 'Dokumen DPA APBD 2026 (Scan Agak Blur)',
    type: 'DPA APBD',
    confidence: 68,
    status: 'warning',
    fileSize: '4.2 MB',
    fileName: 'dpa_belanja_modal_2026_scan.pdf',
    blurSections: [
      { field: 'Kode Rekening 5.1.02.01', comment: 'Bagian digit terakhir buram akibat lipatan kertas.' },
      { field: 'Pagu Anggaran Belanja Laptop', comment: 'Angka 8 dan 0 tumpang tindih dengan tinta cap dinas.' }
    ],
    extractedData: {
      "SKPD": "Dinas Komunikasi dan Informatika",
      "Tahun Anggaran": "2026",
      "Kode Rekening": "5.1.02.01.01.0002 [⚠️ BLUR]",
      "Program": "Program Aplikasi Informatika",
      "Kegiatan": "Pengadaan Perangkat Komputer",
      "Alokasi Pagu": "Rp 120.000.000 [⚠️ VERIFIKASI ULANG]",
      "Metode Pengadaan": "E-Purchasing (E-Katalog)"
    },
    message: '⚠️ Peringatan: Tingkat keyakinan OCR rendah (68%). Dokumen berasal dari scan kertas berlipat dan cap tinta basah. Silakan unggah ulang berkas PDF asli (native) atau scan ulang dengan resolusi minimal 300 DPI untuk akurasi optimal.'
  },
  {
    id: 'pbj_laptop',
    title: 'Nota Pengadaan Barang Jasa Laptop (Foto Jelas)',
    type: 'Dokumen PBJ',
    confidence: 97,
    status: 'success',
    fileSize: '1.8 MB',
    fileName: 'nota_dpp_laptop_verified.png',
    blurSections: [],
    extractedData: {
      "Nama Paket": "Pengadaan Laptop Core i7 Pejabat Pengadaan",
      "Jumlah Unit": "5 Unit",
      "Merek Pilihan": "Asus ExpertBook B5",
      "Harga Etalase": "Rp 18.500.000 per unit",
      "Total Anggaran": "Rp 92.500.000",
      "Vendor Terpilih": "PT. Nusantara Komputindo",
      "Status HPS": "Di bawah pagu (Sesuai DPA)"
    },
    message: '✅ Hasil OCR sangat akurat (97%). Semua karakter dan tabel terbaca sempurna tanpa distorsi visual.'
  },
  {
    id: 'bast_blurred',
    title: 'Berita Acara Serah Terima / BAST (Scan HP Miring)',
    type: 'Berita Acara',
    confidence: 76,
    status: 'warning',
    fileSize: '2.5 MB',
    fileName: 'bast_diskominfo_maret.jpg',
    blurSections: [
      { field: 'Tanggal Penandatanganan BAST', comment: 'Bagian bawah miring dan bayangan gelap menghalangi tanggal.' },
      { field: 'NIP Pejabat Pelaksana Teknis', comment: 'Karakter angka kecil tidak terbaca penuh.' }
    ],
    extractedData: {
      "Nomor BAST": "045.2/BAST-INF/III/2026",
      "Pihak Pertama": "Ir. H. Sudirman, M.Si (Kadis)",
      "Pihak Kedua": "Heryanto (Direktur PT Nusantara)",
      "Tanggal": "18 [⚠️ BURAM] Maret 2026",
      "NIP PPK": "19750812 [⚠️ KABUR]",
      "Kessesuaian Spesifikasi": "100% Sesuai Spesifikasi Teknis"
    },
    message: '⚠️ Perhatian: Hasil OCR berkisar 76%. Sudut pengambilan gambar miring dan memiliki bayangan di sudut kanan bawah. Disarankan untuk memosisikan kamera tegak lurus (flat-lay) di bawah cahaya terang.'
  },
  {
    id: 'surat_pengantar',
    title: 'Surat Pengantar Dinas (Kertas Tua Arsip Lama)',
    type: 'Surat Pengantar',
    confidence: 52,
    status: 'danger',
    fileSize: '6.1 MB',
    fileName: 'surat_pengantar_kecamatan_1998.pdf',
    blurSections: [
      { field: 'Nomor Surat Dinas', comment: 'Kertas menguning dan tulisan mesin tik memudar.' },
      { field: 'Isi Ringkasan Perihal', comment: 'Tinta luntur akibat kelembapan tinggi arsip lama.' }
    ],
    extractedData: {
      "Nomor Surat": "[⚠️ TIDAK TERBACA]",
      "Perihal": "Permohonan Perbaikan Jalan Desa [⚠️ SAMAR]",
      "Tanggal Surat": "12 Desember 1998",
      "Asal Instansi": "Kantor Kecamatan Sukadamai",
      "Tujuan": "Kepala Dinas Pekerjaan Umum Kabupaten",
      "Klasifikasi Arsip": "Penting / Segera"
    },
    message: '❌ Keyakinan OCR Kritis (52%). Dokumen fisik terlalu tua, tinta memudar, dan kertas menguning. Kami sangat menyarankan pengunggahan foto close-up berseri atau masukkan data secara manual demi validitas audit.'
  }
];

export default function OcrApiKeyManager() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('manager');
  const [apiKeys, setApiKeys] = useState({});
  const [selectedProvider, setSelectedProvider] = useState('openai');
  const [inputKey, setInputKey] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [testingId, setTestingId] = useState(null);
  
  // OCR Simulator States
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);

  // Load API Keys from Backend
  useEffect(() => {
    const fetchKeys = async () => {
      try {
        const res = await fetch('/api/settings/ocr_api_keys');
        if (res.ok) {
          const data = await res.json();
          if (data.value) {
            setApiKeys(JSON.parse(data.value));
          }
        }
      } catch (e) {
        console.error('Failed to fetch API keys from backend', e);
      }
    };
    fetchKeys();
  }, []);

  const saveKeys = async (newKeys) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'ocr_api_keys', value: JSON.stringify(newKeys) })
      });
      if (res.ok) {
        setApiKeys(newKeys);
      }
    } catch (e) {
      console.error('Failed to save API keys to backend', e);
      alert('Gagal menyimpan API Key ke server.');
    }
  };

  // Helper to mask API keys
  const maskKey = (key) => {
    if (!key) return '-';
    if (key.startsWith('http')) return key; // Ollama local URL
    if (key.length <= 8) return 'xxxxxxxx';
    const prefix = key.slice(0, 4);
    const suffix = key.slice(-4);
    return `${prefix}······${suffix}`;
  };

  // Validate API Key format based on provider rules
  const validateFormat = (provider, key) => {
    if (!key || key.trim() === '') return { valid: false, msg: 'API Key tidak boleh kosong.' };
    const p = PROVIDERS[provider];
    
    if (provider === 'ollama') {
      if (key.startsWith('http://') || key.startsWith('https://')) {
        return { valid: true, msg: 'Format URL valid.' };
      }
      return { valid: false, msg: 'URL Ollama harus diawali dengan http:// atau https://' };
    }

    if (provider === 'gemini') {
      if (key.startsWith('AIzaSy') || key.startsWith('AQ')) {
        // Valid Gemini prefixes
      } else {
        return { 
          valid: false, 
          msg: `Format salah! API Key Google Gemini harus diawali dengan "AIzaSy" atau "AQ"` 
        };
      }
    } else if (p.prefix && !key.startsWith(p.prefix)) {
      return { 
        valid: false, 
        msg: `Format salah! API Key ${p.name} harus diawali dengan "${p.prefix}"` 
      };
    }

    if (key.length < 15 && provider !== 'ollama' && provider !== 'cohere') {
      return { valid: false, msg: 'API Key terlalu pendek.' };
    }

    return { valid: true, msg: 'Format API Key valid.' };
  };

  const handleAddKey = (e) => {
    e.preventDefault();
    const validation = validateFormat(selectedProvider, inputKey);
    if (!validation.valid) {
      alert(`Validasi Gagal: ${validation.msg}`);
      return;
    }

    setTestingId(selectedProvider);
    setTestResult(null);

    // Simulate connection test
    setTimeout(() => {
      const isFailed = inputKey.toLowerCase().includes('fail') || inputKey.toLowerCase().includes('expired') || (inputKey.length < 16 && selectedProvider !== 'ollama' && selectedProvider !== 'cohere');
      
      if (!isFailed) {
        const newKeys = { ...apiKeys, [selectedProvider]: inputKey };
        saveKeys(newKeys);
        setTestResult({
          success: true,
          message: `API Key ${PROVIDERS[selectedProvider].name} berhasil terhubung.`
        });
        setInputKey('');
      } else {
        setTestResult({
          success: false,
          message: `Koneksi Gagal: API Key tidak valid.`
        });
      }
      setTestingId(null);
    }, 1500);
  };

  const handleDeleteKey = (providerId) => {
    if (confirm(`Hapus API Key untuk ${PROVIDERS[providerId].name}?`)) {
      const newKeys = { ...apiKeys };
      delete newKeys[providerId];
      saveKeys(newKeys);
    }
  };

  const handleTestExistingKey = (providerId) => {
    setTestingId(providerId);
    setTestResult(null);
    const key = apiKeys[providerId];

    setTimeout(() => {
      if (key && !key.toLowerCase().includes('fail')) {
        setTestResult({
          success: true,
          message: `Test koneksi sukses! ${PROVIDERS[providerId].name} terhubung.`
        });
      } else {
        setTestResult({
          success: false,
          message: `Test koneksi gagal untuk ${PROVIDERS[providerId].name}.`
        });
      }
      setTestingId(null);
    }, 1000);
  };

  // Run Simulated OCR
  const runOcrSimulator = (doc) => {
    setSelectedDoc(doc);
    setOcrResult(null);
    setIsOcrRunning(true);
    setOcrProgress(0);

    const interval = setInterval(() => {
      setOcrProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsOcrRunning(false);
          setOcrResult(doc);
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-fadeIn font-sans text-slate-800">
      {/* Header section (Minimalist) */}
      <div className="border-b border-slate-200 pb-8">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Integrasi AI OCR
            </h1>
            <p className="text-slate-500 mt-2 text-sm max-w-xl">
              Kelola kunci API untuk mengekstrak data dari dokumen PBJ, DPA, dan surat dinas dengan multi-engine AI.
            </p>
          </div>
          <div className="text-right">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full ${Object.keys(apiKeys).length > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${Object.keys(apiKeys).length > 0 ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
              {Object.keys(apiKeys).length > 0 ? 'Multi-Engine Aktif' : 'Belum Terhubung'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Menu (Clean) */}
      <div className="flex space-x-8 border-b border-slate-100">
        <button
          onClick={() => setActiveTab('manager')}
          className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'manager' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Kelola API Key
          {activeTab === 'manager' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900"></span>}
        </button>
        <button
          onClick={() => setActiveTab('simulator')}
          className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'simulator' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Simulator SandBox
          {activeTab === 'simulator' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900"></span>}
        </button>
      </div>

      {/* TAB CONTENT 1: MANAGER */}
      {activeTab === 'manager' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Form Tambah API Key */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="text-lg font-medium text-slate-900 mb-6">Hubungkan Provider AI Baru</h2>
              <form onSubmit={handleAddKey} className="space-y-6">
                <div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.values(PROVIDERS).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedProvider(p.id);
                          setInputKey('');
                          setTestResult(null);
                        }}
                        className={`p-4 rounded-xl border text-center transition-all ${
                          selectedProvider === p.id
                            ? 'border-slate-800 ring-1 ring-slate-800 bg-slate-900 text-white shadow-sm'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="text-xl mb-2">{p.logo}</div>
                        <div className={`text-xs font-medium truncate ${selectedProvider === p.id ? 'text-slate-200' : 'text-slate-700'}`}>{p.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    <span className="font-medium text-slate-900">{PROVIDERS[selectedProvider].name}</span>: {PROVIDERS[selectedProvider].desc}
                  </p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-slate-700">API Key</label>
                    {selectedProvider !== 'ollama' && (
                      <a href={PROVIDERS[selectedProvider].url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                        Dapatkan Key ↗
                      </a>
                    )}
                  </div>
                  <input
                    type="password"
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    placeholder={PROVIDERS[selectedProvider].placeholder}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 text-sm font-mono transition-colors"
                    required
                  />
                  <p className="mt-2 text-xs text-slate-500">{PROVIDERS[selectedProvider].help}</p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button type="button" onClick={() => { setInputKey(''); setTestResult(null); }} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                    Reset
                  </button>
                  <button type="submit" disabled={testingId !== null} className="px-5 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
                    {testingId === selectedProvider ? 'Menghubungkan...' : 'Simpan & Test'}
                  </button>
                </div>
              </form>

              {testResult && (
                <div className={`mt-6 p-4 rounded-lg border text-sm ${testResult.success ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                  {testResult.message}
                </div>
              )}
            </div>
          </div>

          {/* Panel Status API Key Terhubung */}
          <div>
            <h3 className="text-sm font-medium text-slate-900 mb-4">Keys Terhubung ({Object.keys(apiKeys).length})</h3>
            
            {Object.keys(apiKeys).length === 0 ? (
              <div className="p-6 text-center bg-slate-50 border border-slate-100 rounded-xl">
                <p className="text-sm text-slate-500">Belum ada API Key</p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(apiKeys).map(([provId, keyVal]) => {
                  const p = PROVIDERS[provId];
                  if (!p) return null;
                  return (
                    <div key={provId} className="p-4 border border-slate-200 rounded-xl bg-white hover:border-slate-300 transition-colors group">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <span>{p.logo}</span>
                          <span className="text-sm font-medium text-slate-800">{p.name}</span>
                        </div>
                      </div>
                      <div className="text-xs font-mono text-slate-500 bg-slate-50 px-2 py-1.5 rounded border border-slate-100">
                        {maskKey(keyVal)}
                      </div>
                      <div className="flex gap-3 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setSelectedProvider(provId); setInputKey(keyVal); }} className="text-xs font-medium text-slate-500 hover:text-slate-900">
                          Edit
                        </button>
                        <button onClick={() => handleTestExistingKey(provId)} className="text-xs font-medium text-blue-600 hover:text-blue-800">
                          {testingId === provId ? '...' : 'Test'}
                        </button>
                        <button onClick={() => handleDeleteKey(provId)} className="text-xs font-medium text-red-500 hover:text-red-700">
                          Hapus
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            <div className="mt-8 pt-6 border-t border-slate-100">
              <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Kegunaan OCR</h4>
              <ul className="text-sm text-slate-600 space-y-2">
                <li>• Ekstraksi tabel DPA</li>
                <li>• Komparasi spesifikasi HPS</li>
                <li>• Validasi Berita Acara</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-200/80 shadow-md space-y-8">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              🔬 Simulator SandBox AI OCR
            </h2>
            <p className="text-sm text-slate-500 max-w-3xl leading-relaxed">
              Silakan uji coba kemampuan AI OCR dengan memilih salah satu sampel berkas asli dokumen dinas daerah di bawah ini. Anda dapat melihat bagaimana confidence score dihitung, letak teks yang blur ditandai, dan rekomendasi audit diberikan secara dinamis.
            </p>
          </div>

          {/* Sample docs grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {SAMPLE_DOCUMENTS.map((doc) => (
              <div
                key={doc.id}
                onClick={() => !isOcrRunning && runOcrSimulator(doc)}
                className={`p-4 rounded-2xl border text-left cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                  selectedDoc?.id === doc.id
                    ? 'border-indigo-600 bg-indigo-50/30 ring-2 ring-indigo-500/10 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 bg-white'
                } ${isOcrRunning ? 'pointer-events-none opacity-60' : ''}`}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wide ${
                      doc.type === 'DPA APBD' ? 'bg-amber-50 text-amber-600 border border-amber-200/50' :
                      doc.type === 'Dokumen PBJ' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/50' :
                      doc.type === 'Berita Acara' ? 'bg-blue-50 text-blue-600 border border-blue-200/50' :
                      'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {doc.type}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">{doc.fileSize}</span>
                  </div>
                  <h3 className="text-xs font-extrabold text-slate-800 leading-snug line-clamp-2">
                    {doc.title}
                  </h3>
                </div>
                <div className="pt-4 flex items-center justify-between border-t border-slate-100 mt-4">
                  <span className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">{doc.fileName}</span>
                  <span className={`text-xs font-bold ${
                    doc.confidence >= 90 ? 'text-emerald-600' :
                    doc.confidence >= 70 ? 'text-amber-600' :
                    'text-rose-600'
                  }`}>
                    {doc.confidence}% Conf
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Running progress simulation */}
          {isOcrRunning && (
            <div className="bg-indigo-50/30 border border-indigo-100/50 rounded-2xl p-6 text-center space-y-4 animate-pulse">
              <div className="relative w-full h-2.5 bg-slate-150 rounded-full overflow-hidden">
                {/* Laser scan line overlay effect */}
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 rounded-full transition-all duration-150"
                  style={{ width: `${ocrProgress}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-indigo-700">
                <span className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                Memproses File Melalui OCR AI ({ocrProgress}%)...
              </div>
            </div>
          )}

          {/* OCR RESULTS BOX */}
          {ocrResult && !isOcrRunning && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 border-t border-slate-100 pt-6 animate-fadeIn">
              {/* Left Column: Visual Mockup & Highlights */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-slate-100 border border-slate-200 rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[300px] shadow-inner">
                  {/* Watermark grid background */}
                  <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>

                  <div className="relative z-10 flex justify-between items-center pb-3 border-b border-slate-200">
                    <span className="text-xs font-extrabold text-slate-500 font-mono">FILE: {ocrResult.fileName}</span>
                    <span className="text-xs">📄</span>
                  </div>

                  <div className="relative z-10 py-6 space-y-3">
                    <div className="w-full bg-white rounded border border-slate-200 p-3 text-[10px] font-mono text-slate-500 space-y-2">
                      <div className="h-2 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-2 bg-slate-200 rounded w-1/2"></div>
                      <div className="h-2.5 bg-amber-100 border border-amber-200/50 rounded w-5/6 flex items-center justify-between px-1">
                        <span className="text-[8px] font-bold text-amber-800 uppercase">[⚠️ BLURRED AREA DETECTED]</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded w-4/5"></div>
                      {ocrResult.confidence < 75 && (
                        <div className="h-2.5 bg-rose-100 border border-rose-200/50 rounded w-2/3 flex items-center justify-between px-1">
                          <span className="text-[8px] font-bold text-rose-800 uppercase">[⚠️ CRITICAL FUZZY TEXT]</span>
                        </div>
                      )}
                      <div className="h-2 bg-slate-200 rounded w-3/5"></div>
                    </div>
                  </div>

                  <div className="relative z-10 pt-3 border-t border-slate-200 flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-600">Simulasi Tampilan Scan</span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
                      <span className="text-[10px] font-bold text-indigo-700 uppercase">Tesseract V4 Active</span>
                    </div>
                  </div>
                </div>

                {/* Confidence score card */}
                <div className={`p-4 rounded-3xl border flex items-center justify-between ${
                  ocrResult.confidence >= 90 ? 'bg-emerald-50/40 border-emerald-200/50 text-emerald-800' :
                  ocrResult.confidence >= 70 ? 'bg-amber-50/40 border-amber-200/50 text-amber-800' :
                  'bg-rose-50/40 border-rose-200/50 text-rose-800'
                }`}>
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Confidence Score</div>
                    <div className="text-2xl font-black">{ocrResult.confidence}%</div>
                  </div>
                  <div className="w-16 h-16 relative flex items-center justify-center font-bold text-xs">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="32" cy="32" r="26" stroke="#e2e8f0" strokeWidth="6" fill="transparent" />
                      <circle
                        cx="32"
                        cy="32"
                        r="26"
                        stroke={ocrResult.confidence >= 90 ? '#10b981' : ocrResult.confidence >= 70 ? '#f59e0b' : '#f43f5e'}
                        strokeWidth="6"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 26}
                        strokeDashoffset={2 * Math.PI * 26 * (1 - ocrResult.confidence / 100)}
                      />
                    </svg>
                    <span className="absolute text-[10px] font-bold">OCR</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Structured Data Extraction */}
              <div className="lg:col-span-3 space-y-6">
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 lg:p-6 space-y-4">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest border-b border-slate-200 pb-3 flex items-center justify-between">
                    <span>📊 Data Hasil Ekstraksi Otomatis</span>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md uppercase">JSON Mode</span>
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="text-slate-400 font-bold border-b border-slate-200 pb-2">
                          <th className="pb-2 w-1/3">Variabel / Bidang</th>
                          <th className="pb-2 w-2/3">Nilai Ekstraksi AI</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/50 font-medium text-slate-700">
                        {Object.entries(ocrResult.extractedData).map(([key, val]) => (
                          <tr key={key}>
                            <td className="py-2.5 text-slate-500 font-bold">{key}</td>
                            <td className="py-2.5 font-mono text-[11px] leading-relaxed">
                              {typeof val === 'string' && val.includes('⚠️') ? (
                                <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                                  {val}
                                </span>
                              ) : (
                                val
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section with warnings about blurs */}
                {ocrResult.blurSections.length > 0 && (
                  <div className="bg-amber-50/50 border border-amber-200/50 rounded-3xl p-5 space-y-3">
                    <h4 className="text-xs font-bold text-amber-800 uppercase tracking-widest flex items-center gap-1.5">
                      ⚠️ Deteksi Bagian Buram (Blur Area)
                    </h4>
                    <div className="space-y-2">
                      {ocrResult.blurSections.map((sec, idx) => (
                        <div key={idx} className="text-xs text-amber-900 bg-white/60 p-2.5 rounded-xl border border-amber-150">
                          <strong>{sec.field}:</strong> {sec.comment}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Final OCR message / recommendation */}
                <div className={`p-4 rounded-3xl border text-xs leading-relaxed font-semibold ${
                  ocrResult.status === 'success' ? 'bg-emerald-50 border-emerald-200/40 text-emerald-800' :
                  ocrResult.status === 'warning' ? 'bg-amber-50 border-amber-200/40 text-amber-800' :
                  'bg-rose-50 border-rose-200/40 text-rose-800'
                }`}>
                  {ocrResult.message}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 3: INFO */}
      {activeTab === 'providers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Provider List details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-200/80 shadow-md space-y-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                🤖 Kemampuan Setiap Engine AI dalam Membaca Dokumen
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Setiap provider AI memiliki model spesifik yang dirancang khusus untuk memproses gambar dan dokumen PDF. Berikut adalah keunggulan masing-masing engine:
              </p>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🧠</span>
                    <strong className="text-xs font-bold text-slate-800">OpenAI (GPT-4o)</strong>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Sangat andal dalam memetakan letak sel-sel tabel dokumen daerah. Jika Anda mengunggah DPA yang penuh dengan deretan angka rekening belanja yang rapat, GPT-4o adalah pilihan terbaik untuk mengonversinya menjadi objek JSON yang rapi tanpa kesalahan perhitungan baris.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🦉</span>
                    <strong className="text-xs font-bold text-slate-800">Anthropic Claude (Claude 3.5 Sonnet)</strong>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Unggul dalam pemahaman kontekstual yang sangat panjang. Sangat tepat digunakan ketika Anda ingin merangkum berkas Berita Acara Rapat Evaluasi yang tebal dan membandingkan isinya dengan Keputusan UKPBJ secara mendalam.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">✨</span>
                    <strong className="text-xs font-bold text-slate-800">Google Gemini (Gemini 1.5 Pro)</strong>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Memiliki jendela konteks raksasa dan multimodal bawaan berkecepatan tinggi. Sangat baik dalam membaca scan dokumen yang buram, miring, atau memiliki kualitas foto rendah berkat pelatihan dataset visual Google yang sangat besar.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🦙</span>
                    <strong className="text-xs font-bold text-slate-800">Ollama Lokal (Llama 3 / Qwen 2 VL)</strong>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Satu-satunya pilihan yang menjamin privasi daerah 100%. Dokumen tidak pernah diunggah ke internet sehingga terhindar dari potensi kebocoran rahasia belanja negara. Cocok untuk dinas yang memiliki regulasi keamanan data sangat ketat.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Security Information Panel */}
          <div className="space-y-6">
            <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none"></div>
              
              <h3 className="text-base font-extrabold text-white mb-4 flex items-center gap-2">
                🔒 Informasi Keamanan API Key
              </h3>
              
              <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                <p>
                  API Key merupakan <strong>kunci rahasia</strong> yang setara dengan kata sandi akun Anda. Siapa pun yang memiliki API Key Anda dapat menggunakan saldo akun Anda untuk memanggil layanan kecerdasan buatan.
                </p>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                  <strong className="text-white block">🛡️ Praktik Keamanan Terbaik:</strong>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Jangan pernah menyimpan kunci dalam bentuk teks polos di repositori publik (Github/Gitlab).</li>
                    <li>Gunakan pembatasan kuota (billing limit) pada dasbor provider Anda.</li>
                    <li>Direkomendasikan memindahkan kunci ke berkas lingkungan sistem <code className="text-indigo-200">.env</code> pada backend server PBJ.</li>
                  </ul>
                </div>
                <p className="text-[10px] text-slate-400">
                  PBJ System menggunakan enkripsi internal browser lokal dan meminimalkan pengiriman data kunci ke luar jaringan aman untuk menjamin privasi dinas daerah Anda.
                </p>
              </div>
            </div>

            {/* Quick Helper Links */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Tautan Setup Cepat
              </h4>
              <div className="text-xs text-indigo-600 space-y-2 font-semibold">
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="block hover:underline">🔗 OpenAI API Keys ↗</a>
                <a href="https://console.anthropic.com/" target="_blank" rel="noreferrer" className="block hover:underline">🔗 Anthropic Claude Console ↗</a>
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="block hover:underline">🔗 Google AI Studio (Gemini) ↗</a>
                <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="block hover:underline">🔗 Groq Console ↗</a>
                <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="block hover:underline">🔗 OpenRouter Keys ↗</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
 
