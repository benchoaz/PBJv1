import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const PROVIDERS = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    logo: '🧠',
    desc: 'Sangat unggul dalam akurasi ekstraksi teks terstruktur dan deteksi tabel kompleks.',
    url: 'https://platform.openai.com/api-keys',
    prefix: 'sk-',
    placeholder: 'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    help: 'Gunakan GPT-4o untuk dokumen scan resolusi tinggi.'
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic Claude',
    logo: '🦉',
    desc: 'Terbaik dalam menganalisis dokumen panjang (surat keputusan, lampiran DPA tebal) dengan kepatuhan tinggi.',
    url: 'https://console.anthropic.com/',
    prefix: 'sk-ant-',
    placeholder: 'sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    help: 'Claude 3.5 Sonnet memberikan ekstraksi JSON terbaik.'
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    logo: '✨',
    desc: 'Multimodal bawaan berkecepatan tinggi, sangat efisien untuk scan foto berkas/kamera HP langsung.',
    url: 'https://aistudio.google.com/app/apikey',
    prefix: 'AIzaSy',
    placeholder: 'AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    help: 'Gemini 1.5 Pro sangat baik dalam mendeteksi tulisan tangan kasar.'
  },
  mistral: {
    id: 'mistral',
    name: 'Mistral AI',
    logo: '🔮',
    desc: 'Model open-weight yang andal untuk klasifikasi dokumen dinas berbahasa Indonesia.',
    url: 'https://console.mistral.ai/api-keys/',
    prefix: 'sk-',
    placeholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    help: 'Gunakan Mistral Large untuk performa maksimal.'
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    logo: '🌐',
    desc: 'Gerbang multi-provider AI, fleksibel menggunakan puluhan model OCR alternatif dalam satu tagihan.',
    url: 'https://openrouter.ai/keys',
    prefix: 'sk-or-',
    placeholder: 'sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    help: 'Menghubungkan model open source luar negeri dengan mudah.'
  },
  groq: {
    id: 'groq',
    name: 'Groq Cloud',
    logo: '⚡',
    desc: 'Akselerasi LPU super cepat untuk ekstraksi teks seketika setelah scan PDF/OCR lokal selesai.',
    url: 'https://console.groq.com/keys',
    prefix: 'gsk_',
    placeholder: 'gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    help: 'Gunakan Llama-3-70b untuk kecepatan ekstraksi di bawah 1 detik.'
  },
  ollama: {
    id: 'ollama',
    name: 'Ollama Lokal',
    logo: '🦙',
    desc: 'Solusi aman 100% lokal tanpa internet. Menjamin data rahasia daerah tidak bocor keluar.',
    url: 'http://localhost:11434',
    prefix: 'http',
    placeholder: 'http://localhost:11434',
    help: 'Pastikan server Ollama lokal sudah aktif di latar belakang.'
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
      "Kesesuaian Spesifikasi": "100% Sesuai Spesifikasi Teknis"
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

  // Load API Keys from LocalStorage on mount
  useEffect(() => {
    const savedKeys = localStorage.getItem('pbj_ocr_api_keys');
    if (savedKeys) {
      try {
        setApiKeys(JSON.parse(savedKeys));
      } catch (e) {
        console.error('Failed to parse saved API keys');
      }
    }
  }, []);

  const saveKeys = (newKeys) => {
    localStorage.setItem('pbj_ocr_api_keys', JSON.stringify(newKeys));
    setApiKeys(newKeys);
  };

  // Helper to mask API keys
  const maskKey = (key) => {
    if (!key) return '-';
    if (key.startsWith('http')) return key; // Ollama local URL
    if (key.length <= 8) return 'xxxxxxxx';
    const prefix = key.slice(0, 7);
    const suffix = key.slice(-4);
    return `${prefix}xxxxxxx${suffix}`;
  };

  // Validate API Key format based on provider rules
  const validateFormat = (provider, key) => {
    if (!key || key.trim() === '') return { valid: false, msg: 'API Key tidak boleh kosong.' };
    const p = PROVIDERS[provider];
    
    if (provider === 'ollama') {
      if (key.startsWith('http://') || key.startsWith('https://')) {
        return { valid: true, msg: 'Format URL Ollama lokal valid.' };
      }
      return { valid: false, msg: 'URL Ollama harus diawali dengan http:// atau https://' };
    }

    if (p.prefix && !key.startsWith(p.prefix)) {
      return { 
        valid: false, 
        msg: `Format salah! API Key ${p.name} biasanya harus diawali dengan "${p.prefix}"` 
      };
    }

    if (key.length < 15) {
      return { valid: false, msg: 'Panjang API Key terlalu pendek (minimal 15 karakter).' };
    }

    return { valid: true, msg: 'Format API Key valid.' };
  };

  const handleAddKey = (e) => {
    e.preventDefault();
    const validation = validateFormat(selectedProvider, inputKey);
    if (!validation.valid) {
      alert(`⚠️ Validasi Gagal: ${validation.msg}`);
      return;
    }

    setTestingId(selectedProvider);
    setTestResult(null);

    // Simulate connection test
    setTimeout(() => {
      // Logic simulation: If key contains word "fail" or "expired", trigger failure
      const isFailed = inputKey.toLowerCase().includes('fail') || inputKey.toLowerCase().includes('expired') || inputKey.length < 16;
      
      if (!isFailed) {
        const newKeys = { ...apiKeys, [selectedProvider]: inputKey };
        saveKeys(newKeys);
        setTestResult({
          success: true,
          provider: PROVIDERS[selectedProvider].name,
          message: `✅ API Key ${PROVIDERS[selectedProvider].name} berhasil terhubung.\nStatus OCR: AKTIF`
        });
        setInputKey('');
      } else {
        setTestResult({
          success: false,
          provider: PROVIDERS[selectedProvider].name,
          message: `❌ Koneksi Gagal: API Key tidak valid, kuota habis, atau server menolak permintaan.\nSilakan periksa kembali.`
        });
      }
      setTestingId(null);
    }, 2000);
  };

  const handleDeleteKey = (providerId) => {
    if (confirm(`Apakah Anda yakin ingin menghapus API Key untuk ${PROVIDERS[providerId].name}?`)) {
      const newKeys = { ...apiKeys };
      delete newKeys[providerId];
      saveKeys(newKeys);
      alert(`🗑️ API Key ${PROVIDERS[providerId].name} berhasil dihapus.`);
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
          provider: PROVIDERS[providerId].name,
          message: `✅ Test koneksi sukses! API Key ${PROVIDERS[providerId].name} terhubung dan siap digunakan.\nStatus OCR: AKTIF`
        });
      } else {
        setTestResult({
          success: false,
          provider: PROVIDERS[providerId].name,
          message: `❌ Test koneksi gagal: API Key tidak terdaftar atau bermasalah.\nSilakan periksa kembali.`
        });
      }
      setTestingId(null);
    }, 1500);
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
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {/* Upper header card */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-600 rounded-3xl p-8 lg:p-10 text-white shadow-xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <span className="px-3 py-1 text-xs font-bold uppercase bg-white/20 backdrop-blur-md rounded-full border border-white/10 tracking-widest">
              ⚙️ Pengaturan Canggih
            </span>
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight">
              🤖 Portal Integrasi API AI OCR
            </h1>
            <p className="text-indigo-100 max-w-2xl text-sm md:text-base leading-relaxed">
              Hubungkan kunci API AI terbaik untuk melakukan ekstraksi rekening belanja DPA, dokumen PBJ, surat dinas, dan arsip daerah dengan akurasi maksimal.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 px-5 py-4 rounded-2xl">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></div>
            <div>
              <div className="text-[10px] uppercase font-bold text-indigo-200 tracking-wider">Status OCR Sistem</div>
              <div className="text-sm font-bold text-white">
                {Object.keys(apiKeys).length > 0 ? 'AKTIF (Multi-Engine)' : 'BELUM TERHUBUNG'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 space-x-6">
        <button
          onClick={() => setActiveTab('manager')}
          className={`pb-4 text-sm font-bold transition-all relative ${
            activeTab === 'manager'
              ? 'text-indigo-600'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          🔑 Kelola API Key
          {activeTab === 'manager' && (
            <span className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('simulator')}
          className={`pb-4 text-sm font-bold transition-all relative ${
            activeTab === 'simulator'
              ? 'text-indigo-600'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          👁️ Simulator SandBox OCR
          {activeTab === 'simulator' && (
            <span className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('providers')}
          className={`pb-4 text-sm font-bold transition-all relative ${
            activeTab === 'providers'
              ? 'text-indigo-600'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          📚 Info Provider AI & Keamanan
          {activeTab === 'providers' && (
            <span className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full"></span>
          )}
        </button>
      </div>

      {/* TAB CONTENT 1: MANAGER */}
      {activeTab === 'manager' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Tambah API Key */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-200/80 shadow-md">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                ➕ Hubungkan API Key Baru
              </h2>

              <form onSubmit={handleAddKey} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                    Pilih Provider AI
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.values(PROVIDERS).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedProvider(p.id);
                          setInputKey('');
                          setTestResult(null);
                        }}
                        className={`flex flex-col items-center p-3 rounded-2xl border text-center transition-all duration-200 ${
                          selectedProvider === p.id
                            ? 'border-indigo-600 bg-indigo-50/40 text-indigo-700 shadow-sm ring-2 ring-indigo-600/10'
                            : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                        }`}
                      >
                        <span className="text-2xl mb-1">{p.logo}</span>
                        <span className="text-xs font-bold truncate w-full">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-start gap-3">
                  <span className="text-xl">💡</span>
                  <div className="text-xs leading-relaxed text-slate-600">
                    <span className="font-bold text-indigo-700">{PROVIDERS[selectedProvider].name}:</span> {PROVIDERS[selectedProvider].desc}
                    <div className="mt-1 font-medium text-slate-400">
                      Format Kunci: Dimulai dengan <code className="bg-slate-200/60 px-1 rounded font-bold text-slate-700">{PROVIDERS[selectedProvider].prefix}...</code>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                      API Key / Kunci Rahasia
                    </label>
                    {selectedProvider !== 'ollama' && (
                      <a
                        href={PROVIDERS[selectedProvider].url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
                      >
                        Dapatkan API Key Resmi ↗
                      </a>
                    )}
                  </div>
                  <input
                    type="password"
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    placeholder={PROVIDERS[selectedProvider].placeholder}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-mono placeholder-slate-300 transition-all"
                    required
                  />
                  <p className="text-[10px] text-slate-400 font-medium">
                    {PROVIDERS[selectedProvider].help}
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setInputKey('');
                      setTestResult(null);
                    }}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={testingId !== null}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/10 hover:bg-indigo-700 transition-all flex items-center gap-2"
                  >
                    {testingId === selectedProvider ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Menguji Koneksi...
                      </>
                    ) : (
                      'Simpan & Test Koneksi'
                    )}
                  </button>
                </div>
              </form>

              {/* Status Test Koneksi */}
              {testResult && (
                <div className={`mt-6 p-4 rounded-2xl border text-sm font-medium whitespace-pre-line leading-relaxed transition-all duration-300 ${
                  testResult.success 
                    ? 'bg-emerald-50/50 border-emerald-200/60 text-emerald-800' 
                    : 'bg-rose-50/50 border-rose-200/60 text-rose-800'
                }`}>
                  <div className="flex items-start gap-2">
                    <span className="text-base">{testResult.success ? '✅' : '❌'}</span>
                    <div>{testResult.message}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Panel Status API Key Terhubung */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md">
              <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                🟢 API Key Terhubung ({Object.keys(apiKeys).length})
              </h3>
              
              {Object.keys(apiKeys).length === 0 ? (
                <div className="text-center py-8 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <span className="text-3xl block mb-2">🔑</span>
                  <p className="text-xs text-slate-500 font-medium">Belum ada API Key terhubung.</p>
                  <p className="text-[10px] text-slate-400 mt-1">Masukkan API Key di sebelah kiri untuk mengaktifkan AI OCR.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(apiKeys).map(([provId, keyVal]) => {
                    const p = PROVIDERS[provId];
                    if (!p) return null;
                    return (
                      <div
                        key={provId}
                        className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-2 hover:border-slate-200 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{p.logo}</span>
                            <span className="text-xs font-bold text-slate-700">{p.name}</span>
                          </div>
                          <span className="px-2 py-0.5 text-[8px] font-bold rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/50 uppercase tracking-wide">
                            Aktif
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 bg-white px-2 py-1 rounded border border-slate-100 flex justify-between items-center">
                          <span>{maskKey(keyVal)}</span>
                        </div>
                        <div className="flex justify-end gap-1.5 pt-1 mt-1 border-t border-slate-200/50">
                          <button
                            onClick={() => {
                              setSelectedProvider(provId);
                              setInputKey(keyVal);
                              setActiveTab('manager');
                              setTestResult(null);
                            }}
                            className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-all"
                            title="Ganti API Key"
                          >
                            ✏️ Ganti
                          </button>
                          <button
                            onClick={() => handleTestExistingKey(provId)}
                            disabled={testingId === provId}
                            className="px-2 py-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-all flex items-center gap-1"
                            title="Test Koneksi Ulang"
                          >
                            {testingId === provId ? (
                              <span className="w-2.5 h-2.5 border border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                            ) : '⚡'} Test
                          </button>
                          <button
                            onClick={() => handleDeleteKey(provId)}
                            className="px-2 py-1 text-[10px] font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all"
                            title="Hapus API Key"
                          >
                            🗑️ Hapus
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Rekomendasi Dokumen */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Dokumen PBJ yang Didukung
              </h4>
              <div className="text-xs text-slate-600 space-y-2">
                <p className="flex items-center gap-2">📑 <strong>DPA APBD:</strong> Rekening belanja & pagu HPS</p>
                <p className="flex items-center gap-2">🛒 <strong>Dokumen PBJ:</strong> Kertas kerja komparasi & spesifikasi</p>
                <p className="flex items-center gap-2">✒️ <strong>Berita Acara:</strong> BAST, BAHP, & Dokumen Evaluasi</p>
                <p className="flex items-center gap-2">✉️ <strong>Surat Pengantar:</strong> Nota dinas & surat pengantar OPD</p>
                <p className="flex items-center gap-2">🗂️ <strong>Scan Arsip Lama:</strong> Berkas bersejarah dinas lama</p>
              </div>
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
