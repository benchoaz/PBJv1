import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  
  // Fields: NIP & Password (Instansi and Role auto-detected!)
  const [nip, setNip] = useState('')
  const [password, setPassword] = useState('')
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
              placeholder="Contoh NIP: 198001012005011001"
              required
            />
            <div className="text-[10px] text-indigo-300 mt-1.5 leading-relaxed bg-indigo-500/5 p-2.5 rounded-lg border border-indigo-500/10">
              💡 <strong>Tips Demo (Password: <span className="font-bold">admin</span>):</strong>
              <div className="mt-1.5 font-mono text-[9px] text-slate-600 space-y-0.5">
                <div>- NIP: <span className="text-indigo-600 font-bold">admin</span> &rarr; Beni (Super Admin - UKPBJ)</div>
                <div>- NIP: <span className="text-indigo-600 font-bold">198001012005011001</span> &rarr; Budi (PPK - Dinas PUPR)</div>
                <div>- NIP: <span className="text-indigo-600 font-bold">198502022010012002</span> &rarr; Siti (PP - Dinas PUPR)</div>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="glass-input"
              placeholder="••••••••"
              required
            />
          </div>
          
          <button type="submit" className="btn-primary w-full py-3.5 mt-2 text-sm font-semibold tracking-wider uppercase">
            Masuk Portal
          </button>
        </form>
      </div>
    </div>
  )
}