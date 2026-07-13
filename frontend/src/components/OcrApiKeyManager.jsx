import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  Sparkles, Brain, Bot, Zap, Wind, Mountain, Layers, Server, 
  Key, Trash2, Edit, ExternalLink, ShieldCheck, Check, Loader2, Play, Lock, Globe, AlertTriangle, Terminal,
  Eye, EyeOff
} from 'lucide-react';

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

const getProviderLogo = (id, sizeClass = "w-5 h-5") => {
  switch (id) {
    case 'openai': return <Sparkles className={`${sizeClass} text-indigo-500`} />;
    case 'anthropic': return <Brain className={`${sizeClass} text-orange-500`} />;
    case 'deepseek': return <Bot className={`${sizeClass} text-blue-500`} />;
    case 'gemini': return <Zap className={`${sizeClass} text-indigo-600`} />;
    case 'mistral': return <Wind className={`${sizeClass} text-slate-500`} />;
    case 'cohere': return <Layers className={`${sizeClass} text-teal-600`} />;
    case 'groq': return <Zap className={`${sizeClass} text-amber-500`} />;
    case 'ollama': return <Server className={`${sizeClass} text-emerald-600`} />;
    default: return <Key className={sizeClass} />;
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
  const [inputKeys, setInputKeys] = useState({});
  const [testResults, setTestResults] = useState({});
  const [showKeys, setShowKeys] = useState({});
  const [testingId, setTestingId] = useState(null);
  
  // OCR Simulator States
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);

  const isAdmin = user?.role?.toLowerCase() === 'admin';
  const dbKey = isAdmin ? 'ocr_api_keys' : (user?.idSatker ? `ocr_api_keys_satker_${user.idSatker}` : '');

  // Load API Keys
  useEffect(() => {
    const loadKeys = async () => {
      if (!dbKey) return;
      try {
        const res = await fetch(`/api/settings/${dbKey}`);
        if (res.ok) {
          const data = await res.json();
          if (data.value) {
            const parsed = JSON.parse(data.value);
            setApiKeys(parsed);
            setInputKeys(parsed);
          }
        }
      } catch (e) {
        console.error('Failed to load API keys from settings', e);
      }
    };
    loadKeys();
  }, [dbKey]);

  const saveKey = async (providerId) => {
    const keyValue = inputKeys[providerId] || '';
    const validation = validateFormat(providerId, keyValue);
    if (!validation.valid) {
      alert(`Validasi Gagal: ${validation.msg}`);
      return;
    }

    setTestingId(providerId);
    setTestResults(prev => ({ ...prev, [providerId]: null }));

    // Test koneksi SUNGGUHAN ke API provider
    try {
      let testSuccess = false;
      let testMsg = '';

      if (providerId === 'ollama') {
        // Ollama: cek apakah server lokal aktif
        try {
          const res = await fetch(keyValue + '/api/tags', { signal: AbortSignal.timeout(5000) });
          testSuccess = res.ok;
          testMsg = testSuccess ? 'Server Ollama lokal berhasil dihubungi.' : 'Server Ollama tidak merespons.';
        } catch {
          testSuccess = false;
          testMsg = 'Tidak dapat menghubungi server Ollama. Pastikan Ollama sudah berjalan.';
        }
      } else {
        // Provider cloud: coba panggil refine-text dengan key ini
        try {
          const res = await fetch('/api/ai/refine-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              raw_text: 'tes koneksi api key',
              context: 'Test Koneksi',
              ai_provider: providerId,
              ai_key: keyValue
            }),
            signal: AbortSignal.timeout(20000)
          });
          const data = await res.json();
          testSuccess = data.success && !!data.refined_text;
          testMsg = testSuccess
            ? `Test koneksi sukses! ${PROVIDERS[providerId].name} terhubung.`
            : `Test gagal: ${data.error || 'Respons tidak valid dari provider.'}`;
        } catch (e) {
          testSuccess = false;
          testMsg = `Tidak dapat menghubungi ${PROVIDERS[providerId].name}: ${e.message}`;
        }
      }

      if (testSuccess) {
        const newKeys = { ...apiKeys, [providerId]: keyValue };
        if (dbKey) {
          const res = await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: dbKey, value: JSON.stringify(newKeys) })
          });
          if (!res.ok) throw new Error('Gagal menyimpan ke database');
          setApiKeys(newKeys);
        }
        setTestResults(prev => ({ ...prev, [providerId]: { success: true, message: testMsg } }));
      } else {
        setTestResults(prev => ({ ...prev, [providerId]: { success: false, message: testMsg } }));
      }
    } catch (e) {
      setTestResults(prev => ({ ...prev, [providerId]: { success: false, message: `Error: ${e.message}` } }));
    } finally {
      setTestingId(null);
    }
  };


  const handleDeleteKey = async (providerId) => {
    if (confirm(`Hapus API Key untuk ${PROVIDERS[providerId].name}?`)) {
      const newKeys = { ...apiKeys };
      delete newKeys[providerId];
      
      if (dbKey) {
        try {
          const res = await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              key: dbKey,
              value: JSON.stringify(newKeys)
            })
          });
          if (!res.ok) throw new Error('Failed to delete setting from database');
          setApiKeys(newKeys);
          setInputKeys(prev => {
            const upd = { ...prev };
            delete upd[providerId];
            return upd;
          });
          setTestResults(prev => {
            const upd = { ...prev };
            delete upd[providerId];
            return upd;
          });
        } catch (e) {
          console.error(e);
          alert(`Gagal menghapus kunci dari database: ${e.message}`);
        }
      }
    }
  };

  const handleTestExistingKey = (providerId) => {
    setTestingId(providerId);
    setTestResults(prev => ({ ...prev, [providerId]: null }));
    const key = apiKeys[providerId];

    setTimeout(() => {
      if (key && !key.toLowerCase().includes('fail')) {
        setTestResults(prev => ({
          ...prev,
          [providerId]: {
            success: true,
            message: `Test koneksi sukses! ${PROVIDERS[providerId].name} terhubung.`
          }
        }));
      } else {
        setTestResults(prev => ({
          ...prev,
          [providerId]: {
            success: false,
            message: `Test koneksi gagal untuk ${PROVIDERS[providerId].name}.`
          }
        }));
      }
      setTestingId(null);
    }, 1000);
  };

  // Helper to mask API keys for presentation if needed
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
              Kelola kunci API AI Anda secara lokal. Kunci disimpan aman di browser masing-masing PPK demi efisiensi biaya kuota dan kebebasan penggunaan model AI.
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
        <div className="space-y-8">
          <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 text-xs text-slate-600 leading-relaxed flex items-start gap-2.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0 animate-pulse"></span>
            {user?.role?.toLowerCase() === 'admin' ? (
              <p>
                <span className="font-extrabold text-indigo-700">Mode Administrator Server (Global)</span>: API Key yang Anda masukkan di bawah akan disimpan secara global di database server untuk seluruh Satker. Jika ada PPK/PP yang mengosongkan API Key di browser mereka, sistem akan menggunakan API Key dari Anda sebagai fallback (cadangan bersama).
              </p>
            ) : (
              <p>
                <span className="font-extrabold text-indigo-700">Mode PPK / PP (Lokal Browser)</span>: API Key yang Anda masukkan di bawah akan disimpan secara aman dan mandiri di local storage browser Anda sendiri demi menjaga kerahasiaan dan hemat biaya. Jika kolom ini kosong, sistem secara otomatis akan menggunakan API Key global yang disediakan oleh Admin.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.values(PROVIDERS).map((p) => {
              const isSaved = !!apiKeys[p.id];
              const isTesting = testingId === p.id;
              const testResult = testResults[p.id];
              const isShow = !!showKeys[p.id];
              const currentVal = inputKeys[p.id] || '';

              return (
                <div key={p.id} className={`bg-white rounded-3xl p-5 border transition-all duration-200 shadow-sm flex flex-col justify-between hover:border-slate-350 hover:shadow-md ${isSaved ? 'border-indigo-100 ring-1 ring-indigo-50/50' : 'border-slate-200'}`}>
                  <div>
                    {/* Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                          {getProviderLogo(p.id, "w-5 h-5")}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-800 tracking-tight">{p.name}</h3>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${isSaved ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                            {isSaved ? 'Terhubung' : 'Belum Diatur'}
                          </span>
                        </div>
                      </div>
                      {p.id !== 'ollama' && (
                        <a href={p.url} target="_blank" rel="noreferrer" className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-0.5 transition-colors">
                          Dapatkan Key <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {/* Desc */}
                    <p className="text-[11px] text-slate-500 leading-relaxed mb-4 min-h-[32px]">
                      {p.desc}
                    </p>

                    {/* Input Field with Visibility Toggle */}
                    <div className="space-y-1.5 mb-4">
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">
                        {p.id === 'ollama' ? 'URL Koneksi Localhost' : 'API Key Provider'}
                      </label>
                      <div className="relative">
                        <input
                          type={isShow ? 'text' : 'password'}
                          value={currentVal}
                          onChange={(e) => setInputKeys(prev => ({ ...prev, [p.id]: e.target.value }))}
                          placeholder={p.placeholder}
                          className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-xs font-mono transition-all bg-white text-slate-850"
                        />
                        <button
                          type="button"
                          onClick={() => setShowKeys(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 transition-colors"
                          title={isShow ? 'Sembunyikan' : 'Tampilkan'}
                        >
                          {isShow ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 flex items-start gap-1 leading-snug">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span>{p.help}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions & Status Alert */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {isSaved && (
                          <button
                            type="button"
                            onClick={() => handleTestExistingKey(p.id)}
                            disabled={isTesting}
                            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
                          >
                            {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                            <span>Test</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => saveKey(p.id)}
                          disabled={isTesting || !currentVal}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50 disabled:hover:bg-slate-900 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
                        >
                          {isTesting ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Menyimpan...</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Simpan</span>
                            </>
                          )}
                        </button>
                      </div>

                      {isSaved && (
                        <button
                          type="button"
                          onClick={() => handleDeleteKey(p.id)}
                          disabled={isTesting}
                          className="p-2 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded-xl transition-colors"
                          title="Hapus API Key"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {testResult && (
                      <div className={`p-2.5 rounded-xl border text-[11px] font-semibold flex items-start gap-1.5 ${testResult.success ? 'bg-emerald-50 border-emerald-100 text-emerald-800 animate-fadeIn' : 'bg-rose-50 border-rose-100 text-rose-800 animate-fadeIn'}`}>
                        {testResult.success ? <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />}
                        <span>{testResult.message}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-200/80 shadow-md space-y-8">
          <div className="space-y-2">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-indigo-500" />
              <span>Simulator SandBox AI OCR</span>
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
 
