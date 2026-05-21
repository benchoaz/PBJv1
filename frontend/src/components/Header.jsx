import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Header() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path) => location.pathname === path

  const handleLogout = async () => {
    if (confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
      await logout()
      // Full session and state reset
      localStorage.removeItem('pbj_user')
      localStorage.removeItem('pbj_step')
      localStorage.removeItem('pbj_dpa')
      localStorage.removeItem('pbj_scraped')
      localStorage.removeItem('pbj_selected_pack')
      localStorage.removeItem('pbj_hps')
      localStorage.removeItem('pbj_tech_specs')
      localStorage.removeItem('pbj_is_signed')
      navigate('/login')
    }
  }

  const menuItems = [
    { path: '/', label: 'Projects', icon: '📂', roles: ['Admin', 'PPK', 'PP'] },
    { path: '/tickets', label: 'Tickets', icon: '🎫', roles: ['Admin', 'PPK', 'PP'] },
    { path: '/ppk/persiapan', label: 'PPK Persiapan', icon: '✍️', roles: ['Admin', 'PPK'] },
    { path: '/pp/panel', label: 'PP Panel', icon: '⚙️', roles: ['Admin', 'PP'] },
    { path: '/admin/ocr', label: 'API AI OCR', icon: '🤖', roles: ['Admin', 'PPK', 'PP'] },
    { path: '/admin/templates', label: 'Template Surat', icon: '📝', roles: ['Admin'] },
    { path: '/users', label: 'Users', icon: '👥', roles: ['Admin'] },
  ]

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-slate-200 sticky top-0 flex flex-col justify-between p-6 shadow-sm shadow-slate-100/30 shrink-0">
      <div className="space-y-8">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 px-2">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-600/20">
            P
          </span>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight">
            PBJ System
          </span>
        </Link>

        {/* User Card */}
        {user && (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Online</span>
            </div>
            <div className="font-semibold text-slate-800 truncate text-sm" title={user.name || user.username}>
              👤 {user.name || user.username}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 uppercase tracking-wider">
                {user.role}
              </span>
            </div>
            {user.department && (
              <div className="text-[10px] text-slate-500 font-medium truncate pt-1 border-t border-slate-200/50 mt-1" title={user.department}>
                🏢 {user.department}
              </div>
            )}
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="space-y-1">
          {user ? (
            menuItems
              .filter((item) => !item.roles || item.roles.some(r => r.toLowerCase() === user.role.toLowerCase()))
              .map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-indigo-500/10 text-indigo-600 border-l-4 border-indigo-600'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))
          ) : (
            <div className="text-center py-6 text-xs text-slate-400">
              Silakan login terlebih dahulu untuk mengakses menu pengadaan.
            </div>
          )}
        </nav>
      </div>

      {/* Footer / Logout */}
      <div className="border-t border-slate-100 pt-4">
        {user ? (
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-all duration-200"
          >
            <span className="text-base">🚪</span>
            <span>Keluar / Logout</span>
          </button>
        ) : (
          <Link
            to="/login"
            className="w-full btn-primary text-sm flex items-center justify-center gap-2"
          >
            <span>🔑</span> Login Masuk
          </Link>
        )}
      </div>
    </aside>
  )
}