import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const Icons = {
  FolderOpen: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
  Ticket: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
      <path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>
    </svg>
  ),
  TrendingUp: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
      <polyline points="16 7 22 7 22 13"/>
    </svg>
  ),
  ClipboardEdit: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5.5"/>
      <path d="M4 13.5V6a2 2 0 0 1 2-2h2"/>
      <path d="M13.378 15.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/>
    </svg>
  ),
  Repeat: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m17 2 4 4-4 4"/>
      <path d="M3 11v-1a4 4 0 0 1 4-4h14"/>
      <path d="m7 22-4-4 4-4"/>
      <path d="M21 13v1a4 4 0 0 1-4 4H3"/>
    </svg>
  ),
  ScanText: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/>
      <path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
      <line x1="7" x2="8" y1="12" y2="12"/><line x1="12" x2="17" y1="12" y2="12"/>
      <line x1="7" x2="17" y1="8" y2="8"/><line x1="7" x2="13" y1="16" y2="16"/>
    </svg>
  ),
  FileText: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
      <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
      <line x1="10" x2="10" y1="13" y2="17"/><line x1="14" x2="14" y1="13" y2="17"/><line x1="8" x2="16" y1="11" y2="11"/>
    </svg>
  ),
  Users: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  LogOut: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" x2="9" y1="12" y2="12"/>
    </svg>
  ),
  Login: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
      <polyline points="10 17 15 12 10 7"/>
      <line x1="15" x2="3" y1="12" y2="12"/>
    </svg>
  ),
  X: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
}

export default function Header({ sidebarOpen, setSidebarOpen, onNavClick }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path) => location.pathname === path

  const handleLogout = async () => {
    if (confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
      await logout()
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
    { path: '/reports/absorption', label: 'Laporan Realisasi', Icon: Icons.TrendingUp, roles: ['Admin', 'PPK', 'PP'] },
    { path: '/', label: 'Daftar Paket', Icon: Icons.FolderOpen, roles: ['Admin', 'PPK', 'PP'] },
    { path: '/ppk/persiapan', label: 'PPK Persiapan', Icon: Icons.ClipboardEdit, roles: ['Admin', 'PPK'] },
    { path: '/pp/panel', label: 'Panel Pejabat Pengadaan', Icon: Icons.Repeat, roles: ['Admin', 'PP'] },
    { path: '/admin/ocr', label: 'Pemindai Dokumen (AI)', Icon: Icons.ScanText, roles: ['Admin', 'PPK', 'PP'] },
    { path: '/admin/templates', label: 'Template Surat', Icon: Icons.FileText, roles: ['Admin', 'PPK', 'PP'] },
    { path: '/users', label: 'Users', Icon: Icons.Users, roles: ['Admin'] },
  ]

  const SidebarContent = () => (
    <div className="flex flex-col h-full justify-between py-6 px-4">
      <div className="space-y-7">
        {/* Brand Logo */}
        <div className="flex items-center justify-between px-3 py-1 mb-2">
          <Link to="/" onClick={onNavClick} className="flex items-center gap-3">
            <img src="/img/image-pbj.svg" alt="Logo PBJ" className="w-12 h-12 drop-shadow-md" />
            <div>
              <div className="text-[13px] font-bold text-slate-800 leading-tight tracking-tight">PBJ System</div>
              <div className="text-[9px] text-slate-400 font-medium tracking-widest uppercase">e-Procurement</div>
            </div>
          </Link>
          {/* Close button — only visible on mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
            aria-label="Tutup Menu"
          >
            <Icons.X />
          </button>
        </div>

        {/* User Card */}
        {user && (
          <div className="mx-1 bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Online</span>
              </div>
              <span className="px-2 py-0.5 text-[8px] font-bold rounded-md bg-indigo-500 text-white uppercase tracking-wider shadow-sm">
                {user.role}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold shrink-0">
                {(user.name || user.username || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-slate-800 truncate text-xs leading-tight" title={user.name || user.username}>
                  {user.name || user.username}
                </div>
                {user.department && (
                  <div className="text-[9px] text-slate-500 truncate" title={user.department}>
                    {user.department}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <div>
          <div className="px-3 mb-2">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Menu Utama</span>
          </div>
          <nav className="space-y-0.5">
            {user ? (
              menuItems
                .filter((item) => !item.roles || item.roles.some(r => r.toLowerCase() === user.role.toLowerCase()))
                .map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onNavClick}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 ${
                      isActive(item.path)
                        ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/25'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`shrink-0 ${isActive(item.path) ? 'text-white' : 'text-slate-400'}`}>
                      <item.Icon />
                    </span>
                    <span>{item.label}</span>
                  </Link>
                ))
            ) : (
              <div className="text-center py-6 text-xs text-slate-400 px-3">
                Silakan login terlebih dahulu untuk mengakses menu.
              </div>
            )}
          </nav>
        </div>
      </div>

      {/* Footer / Logout */}
      <div className="border-t border-slate-100 pt-4 mx-1">
        {user ? (
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-all duration-150 group"
          >
            <span className="text-slate-400 group-hover:text-rose-400 transition-colors">
              <Icons.LogOut />
            </span>
            <span>Keluar / Logout</span>
          </button>
        ) : (
          <Link
            to="/login"
            onClick={onNavClick}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-indigo-600 hover:bg-indigo-50 transition-all duration-150"
          >
            <Icons.Login />
            <span>Login Masuk</span>
          </Link>
        )}
        <div className="text-center mt-4">
          <span className="text-[9px] text-slate-300 font-medium">PBJ System v1.0 · 2026</span>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar — always visible on lg+ */}
      <aside className="hidden lg:flex w-64 h-screen bg-white border-r border-slate-100 sticky top-0 flex-col justify-between shadow-[1px_0_20px_rgba(0,0,0,0.04)] shrink-0 print:hidden overflow-y-auto">
        <SidebarContent />
      </aside>

      {/* Mobile drawer — slides in from left */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out print:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>
    </>
  )
}