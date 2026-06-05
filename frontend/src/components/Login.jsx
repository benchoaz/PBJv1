import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  Building, 
  Check, 
  Sparkles, 
  LogIn, 
  AlertCircle,
  HelpCircle
} from 'lucide-react'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  
  const [nip, setNip] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  
  // Custom Role and Satker Overrides for Demo
  const [role, setRole] = useState('')
  const [department, setDepartment] = useState('')
  
  // Quick-fill helper states
  const [activeDemo, setActiveDemo] = useState(null)
  const [notification, setNotification] = useState('')

  const satkerOptions = [
    "Unit Kerja Pengadaan Barang/Jasa (UKPBJ)",
    "Bagian Pengadaan Barang dan Jasa (BPBJ)",
    "Kecamatan Besuk",
    "Kecamatan Kraksaan",
    "Kecamatan Dringu",
    "Kecamatan Paiton",
    "Kecamatan Gending",
    "Kecamatan Banyuanyar",
    "Kecamatan Maron",
    "Kecamatan Leces",
    "Kecamatan Tongas",
    "Kecamatan Sumberasih",
    "Kecamatan Wonomerto",
    "Kecamatan Kuripan",
    "Kecamatan Bantaran",
    "Kecamatan Sukapura",
    "Kecamatan Sumber",
    "Kecamatan Tegalsiwalan",
    "Kecamatan Gading",
    "Kecamatan Pakuniran",
    "Kecamatan Kotaanyar",
    "Kecamatan Pajarakan",
    "Kecamatan Tiris",
    "Kecamatan Krucil",
    "Dinas Kesehatan",
    "Dinas Pekerjaan Umum & Penataan Ruang (PUPR)",
    "Dinas Pendidikan dan Kebudayaan",
    "Dinas Lingkungan Hidup (DLH)",
    "RSUD Waluyo Jati Kraksaan (BLU)",
    "Dinas Koperasi, Usaha Mikro, Perdagangan dan Perindustrian",
    "Badan Perencanaan Pembangunan, Penelitian dan Pengembangan Daerah (Bapelitbangda)",
    "Badan Pengelolaan Keuangan dan Pendapatan Daerah (BPKPD)",
    "Dinas Perhubungan",
    "Dinas Pertanian dan Ketahanan Pangan",
    "Dinas Sosial",
    "Dinas Pemberdayaan Masyarakat dan Desa (DPMD)",
    "Satuan Polisi Pamong Praja (Satpol PP)",
    "Dinas Pariwisata dan Kebudayaan",
    "Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu (DPMPTSP)",
    "Badan Kepegawaian dan Pengembangan Sumber Daya Manusia (BKPSDM)",
    "Dinas Komunikasi, Informatika, Statistik dan Persandian",
    "Dinas Perpustakaan dan Kearsipan",
    "Dinas Ketahanan Pangan",
    "Dinas Perikanan",
    "Dinas Perindustrian dan Perdagangan",
    "Badan Penanggulangan Bencana Daerah (BPBD)",
    "Badan Kesatuan Bangsa dan Politik (Bakesbangpol)",
    "RSUD Tongas",
    "Sekretariat Daerah",
    "Sekretariat DPRD",
    "Inspektorat Daerah"
  ]

  const demoAccounts = [
    {
      id: 'admin',
      nip: 'admin',
      name: 'Beni (Admin)',
      role: 'Admin',
      department: 'Unit Kerja Pengadaan Barang/Jasa (UKPBJ)',
      badgeBg: 'bg-indigo-100 text-indigo-700 border-indigo-200'
    },
    {
      id: 'ppk',
      nip: '197909102002121004',
      name: 'Handik H., M.Si (PPK)',
      role: 'PPK',
      department: 'Kecamatan Besuk',
      badgeBg: 'bg-emerald-100 text-emerald-700 border-emerald-200'
    },
    {
      id: 'pp',
      nip: '198205192010011010',
      name: 'Beni T. W., S.Kom (PP)',
      role: 'PP',
      department: 'Kecamatan Kraksaan',
      badgeBg: 'bg-purple-100 text-purple-700 border-purple-200'
    }
  ]

  const [kopLogo, setKopLogo] = useState('/img/logo-kab.png')

  useEffect(() => {
    if (user) {
      navigate('/')
    }
    
    // Sync logo with Kop Surat settings
    const settingsStr = localStorage.getItem('pbj_doc_settings');
    if (settingsStr) {
      try {
        const settings = JSON.parse(settingsStr);
        if (settings.customLogo) {
          setKopLogo(settings.customLogo);
        } else if (settings.logoType === 'garuda') {
          setKopLogo('https://upload.wikimedia.org/wikipedia/commons/2/29/Garuda_Pancasila_Coat_of_Arms_of_Indonesia.svg');
        }
      } catch(e) {}
    }
  }, [user, navigate])

  const handleQuickFill = (account) => {
    setActiveDemo(account.id)
    setNip(account.nip)
    setPassword('admin')
    setRole(account.role)
    setDepartment(account.department)
    
    setNotification(`Peran ${account.role} diisi otomatis!`)
    setTimeout(() => {
      setNotification('')
    }, 2500)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    
    if (!nip.trim() || !password.trim()) {
      setError('Username / NIP dan Password wajib diisi!')
      return
    }

    try {
      await login(nip, password, role, department)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Login gagal. Silakan periksa NIP dan Password Anda.')
    }
  }

  return (
    <div 
      className="min-h-screen w-full flex flex-col items-center justify-start sm:justify-center p-3 sm:p-4 bg-cover bg-center overflow-y-auto font-sans relative"
      style={{ 
        backgroundImage: "url('/bromo-bg2.jpg')",
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Background Overlay for Perfect Contrast */}
      <div className="absolute inset-0 bg-slate-900/15 backdrop-blur-[1px] pointer-events-none z-0"></div>

      {/* Dynamic Style Injection for Floating Visual Delighters */}
      <style>{`
        .input-focus-glow:focus-within {
          box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.15);
          border-color: #1e3a8a;
        }
        .btn-navy-shimmer::after {
          content: '';
          position: absolute;
          top: 0; right: 0; bottom: 0; left: 0;
          transform: translateX(-100%);
          background-image: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.15) 20%,
            rgba(255, 255, 255, 0.3) 60%,
            rgba(255, 255, 255, 0) 100%
          );
          animation: btnShimmer 3s infinite;
        }
        @keyframes btnShimmer {
          100% { transform: translateX(100%); }
        }
        .custom-glass {
          background: rgba(255, 255, 255, 0.72) !important;
          backdrop-filter: blur(16px) !important;
          -webkit-backdrop-filter: blur(16px) !important;
          border: 1px solid rgba(255, 255, 255, 0.45) !important;
        }
        .custom-glass-sub {
          background: rgba(255, 255, 255, 0.6) !important;
          backdrop-filter: blur(10px) !important;
          border: 1px solid rgba(255, 255, 255, 0.3) !important;
        }
        .system-text-override {
          color: #0f2942 !important;
        }
      `}</style>

      {/* MAIN CONTAINER (Centered Card) */}
      <div className="w-full max-w-[380px] custom-glass rounded-2xl p-5 sm:p-6 shadow-2xl z-10 transition-all duration-300 mt-4 sm:mt-0">
        
        {/* Government Emblem */}
        <div className="flex justify-center mb-2">
          <img 
            src={kopLogo}
            alt="Logo Kabupaten Probolinggo" 
            className="h-12 w-auto object-contain drop-shadow-md"
          />
        </div>

        {/* Brand Headers */}
        <div className="text-center mb-4">
          <span className="text-[9px] lg:text-[10px] font-extrabold tracking-[0.16em] text-slate-800 uppercase block mb-0.5">
            Pemerintah Kabupaten Probolinggo
          </span>
          <h1 className="text-xl sm:text-2xl font-black tracking-wide mb-0.5 flex justify-center items-center gap-1.5">
            <span className="text-[#0f2942]">PBJ</span>
            <span className="text-[#d97706]">SAE</span>
          </h1>
          <span className="text-[10px] font-bold tracking-[0.2em] text-[#0f2942] uppercase block mb-1">
            Dashboard Gateway
          </span>
          <div className="w-12 h-[2px] bg-gradient-to-r from-blue-900 via-indigo-900 to-amber-500 mx-auto mb-2"></div>
          
          <p className="text-slate-700 text-[10px] font-bold">
            PBJ SAE: Sinergi, Aman, Efisien
          </p>
          <p className="text-slate-500 text-[9px] mt-0.5 font-medium">
            Login Sistem Informasi Terintegrasi
          </p>
        </div>

        {/* Small Elegant Divider */}
        <hr className="border-slate-200/60 my-4" />

        {/* Status / Notifications */}
        {notification && (
          <div className="mb-4 bg-indigo-50 border border-indigo-100 px-3.5 py-2.5 rounded-xl text-indigo-800 text-[11px] font-bold flex items-center gap-2 shadow-sm animate-fade-in">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
            </span>
            {notification}
          </div>
        )}

        {error && (
          <div className="mb-4 bg-rose-50 border border-rose-100 p-3.5 rounded-xl text-rose-800 text-xs flex items-start gap-2.5 shadow-sm animate-fade-in">
            <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-rose-900 mb-0.5">Kesalahan Login</span>
              {error}
            </div>
          </div>
        )}

        {/* The Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-left">
            <span className="text-xs font-bold text-slate-800 tracking-wide block mb-2">
              Login Pengguna
            </span>

            {/* Username/NIP Input */}
            <div className="relative rounded-xl border border-slate-300 bg-white group input-focus-glow transition-all duration-300 flex items-center shadow-inner">
              <div className="pl-3.5 text-slate-400 group-focus-within:text-blue-900 transition-colors">
                <User size={16} />
              </div>
              <input
                type="text"
                value={nip}
                onChange={e => setNip(e.target.value)}
                className="w-full pl-2.5 pr-4 py-3 bg-transparent border-0 rounded-xl text-xs focus:outline-none focus:ring-0 text-slate-800 placeholder-slate-400 font-semibold"
                placeholder="Username / NIP / NIK"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="relative rounded-xl border border-slate-300 bg-white group input-focus-glow transition-all duration-300 flex items-center shadow-inner">
            <div className="pl-3.5 text-slate-400 group-focus-within:text-blue-900 transition-colors">
              <Lock size={16} />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full pl-2.5 pr-10 py-3 bg-transparent border-0 rounded-xl text-xs focus:outline-none focus:ring-0 text-slate-800 placeholder-slate-400 font-semibold"
              placeholder="Password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Optional Satker Override Input */}
          <div className="relative rounded-xl border border-slate-300 bg-white group input-focus-glow transition-all duration-300 flex items-center shadow-inner">
            <div className="pl-3.5 text-slate-400 group-focus-within:text-blue-900 transition-colors">
              <Building size={16} />
            </div>
            <input 
              type="text"
              list="satker-datalist"
              className="w-full pl-2.5 pr-4 py-3 bg-transparent border-0 rounded-xl text-xs focus:outline-none focus:ring-0 text-slate-800 placeholder-slate-400 font-semibold" 
              value={department} 
              onChange={e => setDepartment(e.target.value)} 
              placeholder="Lingkungan Satker (Opsional)"
            />
            <datalist id="satker-datalist">
              {satkerOptions.map((opt, i) => (
                <option key={i} value={opt} />
              ))}
            </datalist>
          </div>

          {/* Utilities Row */}
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 px-0.5">
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-800 transition-colors">
              <input 
                type="checkbox" 
                className="rounded border-slate-300 text-blue-900 focus:ring-blue-900/30"
              />
              <span>Ingat Saya</span>
            </label>
            <a href="#" className="hover:text-blue-900 transition-colors">Lupa Password?</a>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="w-full relative py-3 bg-[#0f2942] hover:bg-[#1b3d5c] text-white text-xs font-bold tracking-widest rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform active:scale-[0.99] flex items-center justify-center gap-2 overflow-hidden btn-navy-shimmer"
          >
            <LogIn size={14} className="safe-white-text" />
            <span className="safe-white-text">MASUK</span>
          </button>

          {/* Footer Register Link */}
          <div className="text-center text-[11px] text-slate-500 pt-2">
            Belum punya akun? <a href="#" className="font-extrabold text-[#0f2942] hover:underline">Daftar Sekarang</a>
          </div>
        </form>
      </div>
    </div>
  )
}