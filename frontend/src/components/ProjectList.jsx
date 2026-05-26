import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProjectList() {
  const [projects, setProjects] = useState([])
  const [isUpdating, setIsUpdating] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  const fetchProjects = () => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        setProjects(Array.isArray(data) ? data : (data?.data || []))
      })
      .catch(err => console.error('Failed to fetch projects:', err))
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const handleKirimPP = async (projectId) => {
    if (!confirm('Anda yakin ingin mengirim paket ini ke Pejabat Pengadaan? Setelah dikirim, dokumen ini akan DIGEMBOK dan Anda tidak bisa mengubahnya lagi kecuali PP merevisinya.')) return;
    
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Terkirim ke PP' })
      })
      if (!response.ok) throw new Error('Gagal mengirim ke PP')
      alert('Paket berhasil dikirim dan digembok!')
      fetchProjects()
    } catch (err) {
      console.error(err)
      alert('Terjadi kesalahan: ' + err.message)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="animate-fade-in text-slate-800">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Pusat Kendali Pengadaan</h1>
          <p className="text-slate-500 mt-1">Daftar Paket Pekerjaan (DPP) & Riwayat HPS Anda.</p>
        </div>
        <button 
          onClick={() => navigate('/ppk/persiapan')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2"
        >
          <span className="text-xl leading-none">+</span> Buat DPP Baru
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center animate-slide-up shadow-sm">
          <div className="text-5xl mb-4">📁</div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">Belum ada Paket Pekerjaan</h3>
          <p className="text-slate-500 mb-6">Anda belum menyimpan Dokumen Persiapan Pengadaan apapun.</p>
          <button 
            onClick={() => navigate('/ppk/persiapan')}
            className="text-indigo-600 font-bold hover:underline"
          >
            Mulai Survei HPS Pertama Anda &rarr;
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-slide-up">
          {projects.map(project => {
            let parsedData = {};
            try { parsedData = JSON.parse(project.description || '{}') } catch (e) {}
            
            const totalHps = parsedData?.totalHps || 0;
            const pagu = project.budget || 0;
            const efisiensi = pagu - totalHps;
            const isCompleted = project.status === 'Selesai (Arsip Lengkap)';
            const isLocked = project.status === 'Terkirim ke PP' || isCompleted;

            return (
              <div key={project.id} className={`bg-white border ${isCompleted ? 'border-indigo-200 shadow-indigo-100' : 'border-slate-200'} rounded-2xl p-6 hover:shadow-xl transition-all duration-300 relative overflow-hidden group`}>
                {/* Decorative Status Bar */}
                <div className={`absolute top-0 left-0 w-full h-1.5 ${isCompleted ? 'bg-indigo-500' : isLocked ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>

                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-lg font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
                    {project.name || 'Paket Tanpa Nama'}
                  </h2>
                  <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border ${isCompleted ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : isLocked ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                    {project.status || 'Draft'}
                  </span>
                </div>
                
                <div className="space-y-3 mb-6 bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-0.5">Total Pagu DPA</div>
                    <div className="font-mono text-sm font-semibold text-slate-700">Rp {pagu.toLocaleString('id-ID')}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-0.5">Realisasi Survei HPS</div>
                    <div className="font-mono text-sm font-semibold text-slate-800">Rp {totalHps.toLocaleString('id-ID')}</div>
                  </div>
                  <div className="pt-2 border-t border-slate-200">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-0.5">Potensi Efisiensi</div>
                    <div className="font-mono text-sm font-bold text-emerald-600">Rp {efisiensi > 0 ? efisiensi.toLocaleString('id-ID') : '0'}</div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-auto pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/ppk/persiapan?paketId=${project.id}`)}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-lg transition-colors border border-slate-200"
                    >
                      {isCompleted ? '👀 Lihat DPP' : isLocked ? '🔒 Lihat Arsip DPP' : '📝 Lanjutkan Edit'}
                    </button>
                    
                    {!isLocked && (
                      <button
                        onClick={() => handleKirimPP(project.id)}
                        disabled={isUpdating}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded-lg shadow-md shadow-indigo-600/20 transition-all"
                      >
                        🚀 Kirim ke PP
                      </button>
                    )}
                  </div>
                  
                  {isCompleted && (
                    <button
                      onClick={() => alert('Mengekstrak dan mengunduh berkas ZIP Arsip Lengkap INAPROC (BAST, SP, Invoice, Bukti Transfer, dan Potongan PNBP)...')}
                      className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <span>📥</span> Unduh Arsip Final Inaproc
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}