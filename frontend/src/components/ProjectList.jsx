import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const STATUS_CONFIG = {
  'Draft':         { color: 'text-sky-700 bg-sky-50 border-sky-200',       dot: 'bg-sky-400',      label: 'Draft' },
  'Terkirim ke PP':{ color: 'text-amber-700 bg-amber-50 border-amber-200', dot: 'bg-amber-400',    label: 'Terkirim ke PP' },
  'Disetujui PP':  { color: 'text-emerald-700 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-400', label: 'Disetujui PP' },
  'Selesai (Arsip Lengkap)': { color: 'text-violet-700 bg-violet-50 border-violet-200', dot: 'bg-violet-400', label: 'Selesai' },
}

const fmt = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID')

export default function ProjectList() {
  const [projects, setProjects]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filterStatus, setFilterStatus] = useState('Semua')
  const [isUpdating, setIsUpdating] = useState(false)
  const [view, setView]           = useState('table') // 'table' | 'card'
  const { user } = useAuth()
  const navigate = useNavigate()

  const fetchProjects = () => {
    setLoading(true)
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => setProjects(Array.isArray(data) ? data : (data?.data || [])))
      .catch(err => console.error('Failed to fetch projects:', err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchProjects() }, [])

  const handleKirimPP = async (projectId) => {
    if (!confirm('Anda yakin ingin mengirim paket ini ke Pejabat Pengadaan? Setelah dikirim, dokumen ini akan DIGEMBOK.')) return
    setIsUpdating(true)
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Terkirim ke PP' })
      })
      if (!res.ok) throw new Error('Gagal mengirim ke PP')
      alert('Paket berhasil dikirim!')
      fetchProjects()
    } catch (err) {
      alert('Kesalahan: ' + err.message)
    } finally {
      setIsUpdating(false)
    }
  }

  const statusList = ['Semua', 'Draft', 'Terkirim ke PP', 'Disetujui PP', 'Selesai (Arsip Lengkap)']

  const filtered = projects.filter(p => {
    const matchStatus = filterStatus === 'Semua' || p.status === filterStatus
    const matchSearch = !search || (p.name || '').toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const totalPagu = projects.reduce((s, p) => s + (p.budget || 0), 0)
  const totalDraft = projects.filter(p => p.status === 'Draft').length
  const totalKirim = projects.filter(p => p.status === 'Terkirim ke PP').length

  return (
    <div className="animate-fade-in min-h-screen bg-gray-50/50">

      {/* ── PAGE HEADER ─────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 mb-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* PBJ Badge */}
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-500 shadow-md shadow-indigo-200">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Daftar Paket Pekerjaan</h1>
              <p className="text-xs text-slate-500 mt-0.5">Dokumen Persiapan Pengadaan (DPP) &amp; Riwayat Survei HPS</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/ppk/persiapan')}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Buat DPP Baru
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-12">

        {/* ── SUMMARY CARDS ──────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Paket',     value: projects.length,           sub: 'Semua status',        icon: '📋', color: 'from-slate-50 to-white border-slate-200' },
            { label: 'Total Pagu DPA',  value: fmt(totalPagu),            sub: 'Seluruh paket',       icon: '💰', color: 'from-blue-50 to-white border-blue-100' },
            { label: 'Menunggu Review', value: totalDraft + totalKirim,   sub: 'Draft + Terkirim PP', icon: '⏳', color: 'from-amber-50 to-white border-amber-100' },
          ].map((c, i) => (
            <div key={i} className={`bg-gradient-to-br ${c.color} border rounded-xl p-4 flex items-center gap-3`}>
              <span className="text-2xl">{c.icon}</span>
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{c.label}</div>
                <div className="text-lg font-bold text-slate-800 leading-tight">{c.value}</div>
                <div className="text-[10px] text-slate-400">{c.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── FILTER & SEARCH BAR ────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 mb-4 flex flex-wrap items-center gap-3 shadow-sm">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 flex-wrap">
            {statusList.map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterStatus === s
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {s === 'Semua' ? `Semua (${projects.length})` : s}
              </button>
            ))}
          </div>

          <div className="flex-1 flex items-center gap-2 justify-end flex-wrap">
            {/* Search */}
            <div className="relative">
              <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
              </svg>
              <input
                type="text"
                placeholder="Cari nama paket..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 w-48"
              />
            </div>

            {/* View Toggle */}
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
              <button onClick={() => setView('table')} className={`px-2.5 py-1.5 transition-colors ${view === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
              </button>
              <button onClick={() => setView('card')} className={`px-2.5 py-1.5 transition-colors ${view === 'card' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
              </button>
            </div>
          </div>
        </div>

        {/* ── CONTENT ─────────────────────────────────────── */}
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-xl p-16 text-center">
            <div className="inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 text-sm">Memuat data paket...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-16 text-center shadow-sm">
            <div className="text-5xl mb-4">📁</div>
            <h3 className="text-lg font-bold text-slate-700 mb-1">
              {search || filterStatus !== 'Semua' ? 'Tidak ada paket ditemukan' : 'Belum ada Paket Pekerjaan'}
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              {search || filterStatus !== 'Semua'
                ? 'Coba ubah filter atau kata kunci pencarian.'
                : 'Mulai dengan membuat Dokumen Persiapan Pengadaan pertama Anda.'}
            </p>
            {!search && filterStatus === 'Semua' && (
              <button onClick={() => navigate('/ppk/persiapan')} className="text-indigo-600 font-bold text-sm hover:underline">
                Mulai Survei HPS Pertama Anda →
              </button>
            )}
          </div>
        ) : view === 'table' ? (
          /* ── TABLE VIEW ── */
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="text-left px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 w-10">No</th>
                  <th className="text-left px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Nama Paket Pekerjaan</th>
                  <th className="text-right px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Pagu (Rp.)</th>
                  <th className="text-center px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Metode</th>
                  <th className="text-center px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="text-center px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Tanggal</th>
                  <th className="text-center px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((project, idx) => {
                  let parsedData = {}
                  try { parsedData = JSON.parse(project.description || '{}') } catch (e) {}
                  const isLocked = project.status === 'Terkirim ke PP' || project.status === 'Selesai (Arsip Lengkap)'
                  const cfg = STATUS_CONFIG[project.status] || STATUS_CONFIG['Draft']
                  const tgl = project.created_at ? new Date(project.created_at).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' }) : '-'

                  return (
                    <tr key={project.id} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="px-5 py-4 text-slate-400 font-mono text-xs">{idx + 1}</td>
                      <td className="px-4 py-4 max-w-xs">
                        <button
                          onClick={() => navigate(`/ppk/persiapan?paketId=${project.id}`)}
                          className="text-indigo-600 hover:text-indigo-800 font-medium text-left leading-snug hover:underline line-clamp-2"
                        >
                          {project.name || 'Paket Tanpa Nama'}
                        </button>
                        {parsedData?.selectedPack?.noSirup && (
                          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">RUP: {parsedData.selectedPack.noSirup}</div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-sm font-semibold text-slate-700 whitespace-nowrap">
                        {fmt(project.budget)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center gap-1 text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
                          🛒 E-Purchasing
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold border px-2.5 py-1 rounded-full ${cfg.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></span>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center text-xs text-slate-500 whitespace-nowrap">{tgl}</td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => navigate(`/ppk/persiapan?paketId=${project.id}`)}
                            title={isLocked ? 'Lihat Arsip DPP' : 'Lanjutkan Edit'}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              {isLocked
                                ? <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                : <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                              }
                            </svg>
                          </button>
                          {!isLocked && (
                            <button
                              onClick={() => handleKirimPP(project.id)}
                              disabled={isUpdating}
                              title="Kirim ke PP"
                              className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 transition-colors disabled:opacity-40"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t border-slate-200">
                  <td colSpan={2} className="px-5 py-3 text-xs text-slate-500 font-semibold">
                    Menampilkan {filtered.length} dari {projects.length} paket
                  </td>
                  <td className="px-4 py-3 text-right text-xs font-bold text-slate-700 font-mono">
                    {fmt(filtered.reduce((s, p) => s + (p.budget || 0), 0))}
                  </td>
                  <td colSpan={4}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          /* ── CARD VIEW ── */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((project, idx) => {
              let parsedData = {}
              try { parsedData = JSON.parse(project.description || '{}') } catch (e) {}
              const totalHps = parsedData?.totalHps || 0
              const pagu = project.budget || 0
              const efisiensi = pagu - totalHps
              const isLocked = project.status === 'Terkirim ke PP' || project.status === 'Selesai (Arsip Lengkap)'
              const cfg = STATUS_CONFIG[project.status] || STATUS_CONFIG['Draft']

              return (
                <div key={project.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group relative overflow-hidden">
                  {/* Accent line */}
                  <div className={`absolute top-0 left-0 w-full h-1 ${
                    project.status === 'Selesai (Arsip Lengkap)' ? 'bg-violet-500'
                    : project.status === 'Terkirim ke PP' ? 'bg-amber-400'
                    : 'bg-indigo-500'
                  }`}/>

                  <div className="flex justify-between items-start mb-3 mt-1">
                    <div className="text-[10px] font-mono text-slate-400">#{String(idx+1).padStart(3,'0')}</div>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold border px-2 py-0.5 rounded-full ${cfg.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></span>
                      {cfg.label}
                    </span>
                  </div>

                  <button
                    onClick={() => navigate(`/ppk/persiapan?paketId=${project.id}`)}
                    className="text-left mb-4 block"
                  >
                    <h2 className="font-bold text-slate-800 text-sm leading-snug line-clamp-3 group-hover:text-indigo-600 transition-colors">
                      {project.name || 'Paket Tanpa Nama'}
                    </h2>
                    {parsedData?.selectedPack?.noSirup && (
                      <div className="text-[10px] text-slate-400 mt-1 font-mono">RUP: {parsedData.selectedPack.noSirup}</div>
                    )}
                  </button>

                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2 mb-4 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Pagu DPA</span>
                      <span className="font-mono font-semibold text-slate-700">{fmt(pagu)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Survei HPS</span>
                      <span className="font-mono text-slate-600">{fmt(totalHps)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-2">
                      <span className="text-slate-500 font-medium">Efisiensi</span>
                      <span className={`font-mono font-bold ${efisiensi > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>{fmt(efisiensi > 0 ? efisiensi : 0)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/ppk/persiapan?paketId=${project.id}`)}
                      className="flex-1 border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 text-[11px] font-bold py-2 rounded-lg transition-all"
                    >
                      {isLocked ? '👀 Lihat DPP' : '📝 Edit'}
                    </button>
                    {!isLocked && (
                      <button
                        onClick={() => handleKirimPP(project.id)}
                        disabled={isUpdating}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold py-2 rounded-lg shadow-sm shadow-indigo-200 transition-all disabled:opacity-50"
                      >
                        🚀 Kirim ke PP
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Footer info */}
        <div className="mt-6 text-center text-[11px] text-slate-400">
          Sistem Manajemen PBJ — E-Purchasing Katalog Elektronik LKPP
        </div>
      </div>
    </div>
  )
}