import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  
  // Fields: NIP & Password (Instansi and Role auto-detected!)
  const [nip, setNip] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

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
      await login(nip, password)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Login gagal. Silakan periksa NIP dan Password Anda.')
    }
  }

  return (
    <div className="flex items-center justify-center animate-fade-in mt-12">
      <div className="glass-panel p-10 max-w-md w-full animate-slide-up border border-white/20 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 tracking-tight">
            Portal PBJ
          </h1>
          <p className="text-slate-400 mt-2 text-sm">Sistem Informasi Pengadaan Barang & Jasa Daerah</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl text-sm text-center animate-fade-in">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">NIP (Nomor Induk Pegawai)</label>
            <input
              type="text"
              value={nip}
              onChange={e => setNip(e.target.value)}
              className="glass-input font-mono"
              placeholder="Contoh NIP: 197909102002121004"
              required
            />
            <div className="text-[10px] text-indigo-300 mt-1.5 leading-relaxed bg-indigo-500/5 p-2.5 rounded-lg border border-indigo-500/10">
              💡 <strong>Tips Demo (Password: <span className="font-bold">admin</span>):</strong>
              <div className="mt-1.5 font-mono text-[9px] text-slate-600 space-y-0.5">
                <div>- NIP: <span className="text-indigo-600 font-bold">admin</span> &rarr; Beni (Super Admin - UKPBJ)</div>
                <div>- NIP: <span className="text-indigo-600 font-bold">197909102002121004</span> &rarr; Handik (PPK - Kecamatan Besuk)</div>
                <div>- NIP: <span className="text-indigo-600 font-bold">198205192010011010</span> &rarr; Beni Trisna (PP - Kecamatan Besuk)</div>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="glass-input pr-10"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          <button type="submit" className="btn-primary w-full py-3.5 mt-2 text-sm font-semibold tracking-wider uppercase">
            Masuk Portal
          </button>
        </form>
      </div>
    </div>
  )
}