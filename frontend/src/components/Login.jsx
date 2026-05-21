import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

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

  const satkerOptions = [
    "Bagian Pengadaan Barang dan Jasa (BPBJ)",
    "Dinas Kesehatan",
    "Dinas Pekerjaan Umum & Penataan Ruang (PUPR)",
    "Dinas Pendidikan dan Kebudayaan",
    "Dinas Lingkungan Hidup (DLH)",
    "RSUD Waluyo Jati Kraksaan (BLU)",
    "Kecamatan Besuk",
    "Kecamatan Kraksaan"
  ]

  useEffect(() => {
    if (user) {
      navigate('/')
    }
  }, [user, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    
    if (!nip.trim() || !password.trim()) {
      setError('NIP dan Password wajib diisi!')
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
    <div className="flex h-screen w-full bg-white font-sans overflow-hidden">
      
      {/* LEFT SIDE (50%) - Illustration & Branding */}
      <div className="hidden lg:flex flex-col w-1/2 bg-[#837AE6] justify-center items-center p-16 text-center relative overflow-hidden">
        
        {/* Abstract Vector Illustration (SVG) */}
        <div className="relative mb-12 w-80 h-80 flex items-center justify-center animate-fade-in">
          <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-2xl">
            {/* Background elements */}
            <circle cx="200" cy="200" r="160" fill="#9991EA" opacity="0.4" />
            <circle cx="200" cy="200" r="120" fill="#AEAAF0" opacity="0.6" />
            
            {/* Globe */}
            <circle cx="120" cy="140" r="50" stroke="#1E1B4B" strokeWidth="6" fill="#C7D2FE" />
            <path d="M120 90C140 90 155 110 155 140C155 170 140 190 120 190C100 190 85 170 85 140C85 110 100 90 120 90Z" stroke="#1E1B4B" strokeWidth="4" />
            <path d="M70 140H170" stroke="#1E1B4B" strokeWidth="4" />
            <path d="M85 115H155" stroke="#1E1B4B" strokeWidth="4" />
            <path d="M85 165H155" stroke="#1E1B4B" strokeWidth="4" />
            
            {/* Cursor */}
            <path d="M150 160L180 190M180 190L165 195M180 190L175 175" stroke="#1E1B4B" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            
            {/* Lightbulb */}
            <path d="M260 90C280 90 295 105 295 125C295 140 285 150 280 160V170H240V160C235 150 225 140 225 125C225 105 240 90 260 90Z" stroke="#1E1B4B" strokeWidth="6" fill="#FEF08A" />
            <path d="M245 180H275" stroke="#1E1B4B" strokeWidth="6" strokeLinecap="round" />
            <path d="M250 190H270" stroke="#1E1B4B" strokeWidth="6" strokeLinecap="round" />
            
            {/* Handshake */}
            <path d="M80 250L130 220C140 215 155 215 165 225L180 240L230 200C240 190 255 190 265 200L320 250" stroke="#1E1B4B" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M80 230L170 290L230 250" stroke="#1E1B4B" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M140 215L190 250" stroke="#1E1B4B" strokeWidth="6" strokeLinecap="round" />
            
            {/* Padlock */}
            <rect x="250" y="240" width="60" height="50" rx="8" stroke="#1E1B4B" strokeWidth="6" fill="#C7D2FE" />
            <path d="M265 240V220C265 205 295 205 295 220V240" stroke="#1E1B4B" strokeWidth="6" strokeLinecap="round" />
            <circle cx="280" cy="265" r="8" fill="#1E1B4B" />
            <path d="M280 265V280" stroke="#1E1B4B" strokeWidth="4" strokeLinecap="round" />
            
            {/* Tech Nodes/Lines */}
            <circle cx="330" cy="120" r="6" fill="#1E1B4B" />
            <path d="M295 120H330" stroke="#1E1B4B" strokeWidth="4" strokeLinecap="round" />
            <circle cx="90" cy="80" r="6" fill="#1E1B4B" />
            <path d="M90 80V90" stroke="#1E1B4B" strokeWidth="4" strokeLinecap="round" />
            <path d="M220 280H190V310H150" stroke="#1E1B4B" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="150" cy="310" r="6" fill="#1E1B4B" />
            <path d="M280 320H310V290" stroke="#1E1B4B" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="280" cy="320" r="6" fill="#1E1B4B" />
          </svg>
        </div>

        <h1 className="text-4xl font-bold text-white tracking-tight mb-4 animate-slide-up">
          PORTAL PBJ: Sistem Informasi<br />Pengadaan Barang & Jasa Daerah
        </h1>
        <p className="text-indigo-100 text-lg font-medium animate-slide-up" style={{ animationDelay: '0.1s' }}>
          Akses Aman Untuk Efisiensi Pengadaan
        </p>
      </div>

      {/* RIGHT SIDE (50%) - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-md animate-fade-in">
          
          {/* Logo & Header */}
          <div className="text-center mb-10">
            <div className="inline-block bg-[#837AE6]/10 p-3 rounded-2xl mb-4">
               <span className="text-5xl font-black text-[#837AE6] tracking-tighter shadow-sm">PBJ</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">LOGIN PORTAL</h2>
            <p className="text-slate-500 mt-2 text-sm">Silakan masuk dengan akun Anda.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-4 rounded text-sm shadow-sm">
                {error}
              </div>
            )}
            
            {/* NIP Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">NIP</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  {/* ID Card Icon */}
                  <svg className="h-5 w-5 text-slate-400 group-focus-within:text-[#837AE6] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={nip}
                  onChange={e => setNip(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-[#837AE6]/20 focus:border-[#837AE6] transition-all text-slate-800"
                  placeholder="Masukkan NIP (18 Digit)"
                  required
                />
              </div>
              <p className="mt-2 text-xs text-slate-400">Contoh: 197909102002121004</p>
            </div>
            
            {/* Password Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">PASSWORD</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  {/* Padlock Icon */}
                  <svg className="h-5 w-5 text-slate-400 group-focus-within:text-[#837AE6] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-[#837AE6]/20 focus:border-[#837AE6] transition-all text-slate-800"
                  placeholder="Masukkan Password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {/* Eye Icon */}
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Optional Satker Override (Maintained from previous requirement) */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 mb-2">LINGKUNGAN SATKER (Opsional)</label>
              <div className="relative group">
                <input 
                  type="text"
                  list="satker-datalist"
                  className="w-full px-4 py-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-[#837AE6]/20 focus:border-[#837AE6] transition-all text-slate-800" 
                  value={department} 
                  onChange={e => setDepartment(e.target.value)} 
                  placeholder="Bawaan (Default)"
                />
                <datalist id="satker-datalist">
                  {satkerOptions.map((opt, i) => (
                    <option key={i} value={opt} />
                  ))}
                </datalist>
              </div>
              <p className="mt-1 text-[10px] text-slate-400">Pilih jika merangkap jabatan di instansi lain.</p>
            </div>
            
            {/* Submit Button & Links */}
            <div className="pt-4 flex flex-col items-end gap-3">
              <button 
                type="submit" 
                className="w-full py-4 bg-[#837AE6] hover:bg-[#6c62df] text-white text-sm font-bold tracking-wider rounded-xl shadow-lg shadow-[#837AE6]/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                MASUK PORTAL
              </button>
              <a href="#" className="text-xs text-slate-500 hover:text-[#837AE6] transition-colors font-medium">Lupa Password?</a>
            </div>

            {/* Demo Helpers (Hidden strictly, only text hints) */}
            <div className="mt-8 pt-6 border-t border-slate-100">
               <h4 className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-1">
                 <span>💡</span> Akun Demo
               </h4>
               <div className="space-y-1.5 text-[11px] text-slate-500 font-mono bg-slate-50 p-3 rounded-lg border border-slate-100">
                 <div><span className="font-bold text-[#837AE6]">admin</span> : Super Admin (UKPBJ)</div>
                 <div><span className="font-bold text-[#837AE6]">197909102002121004</span> : PPK</div>
                 <div><span className="font-bold text-[#837AE6]">198205192010011010</span> : PP</div>
                 <div className="mt-2 text-[10px] italic">Password untuk semua akun: admin</div>
               </div>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}