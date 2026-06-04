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
  const [isDeleting, setIsDeleting] = useState(false)
  const [view, setView]           = useState('table') // 'table' | 'card'
  const { user } = useAuth()
  const navigate = useNavigate()

  const fetchProjects = () => {
    setLoading(true)
    const queryParam = user?.role === 'Admin' ? '' : `?idSatker=${user?.idSatker || ''}`
    fetch(`/api/projects${queryParam}`)
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
      // 1. Ambil data saat ini
      const targetPack = projects.find(p => p.id === projectId);
      if (!targetPack) throw new Error('Paket tidak ditemukan');

      let parsedData = {};
      try { parsedData = JSON.parse(targetPack.description || '{}'); } catch(e) {}
      
      // 2. Bentuk daftar barang (items)
      let finalItems = [];
      if (parsedData?.surveyData?.products?.length > 0) {
         finalItems = parsedData.surveyData.products.map((p, idx) => {
             let qty = 1;
             let unit = 'Paket';
             let dpaPrice = 0;
             if (parsedData.dpaRincian) {
                Object.values(parsedData.dpaRincian).forEach(rArray => {
                    if (Array.isArray(rArray)) {
                       const m = rArray.find(r => {
                          const rName = r.nama || r.name || '';
                          return rName.toLowerCase() === p.name.toLowerCase() || (p.name && p.name.toLowerCase().includes(rName.toLowerCase()));
                       });
                       if (m) { qty = m.volume || m.qty || qty; unit = m.satuan || m.unit || unit; dpaPrice = m.harga_satuan || m.price || dpaPrice; }
                    }
                });
             }
             const price = (parsedData.hpsPrices && parsedData.hpsPrices[p.name]) ? parsedData.hpsPrices[p.name] : (p.price || 0);
             return { no: idx + 1, name: p.name, qty, unit, price, dpaPrice, vendor: p.vendor || '' };
         });
      } else if (parsedData?.dpaRincian) {
         const sirupMak = parsedData?.selectedPack?.mak || '';
         let targetKey = null;
         
         if (sirupMak) {
             const cleanSirup = sirupMak.replace(/[^0-9]/g, '');
             for (const key of Object.keys(parsedData.dpaRincian)) {
                 const cleanDpa = key.replace(/[^0-9]/g, '');
                 if (cleanSirup.includes(cleanDpa) || cleanDpa.includes(cleanSirup)) {
                     targetKey = key;
                     break;
                 }
             }
         }
         
         if (targetKey && Array.isArray(parsedData.dpaRincian[targetKey])) {
             parsedData.dpaRincian[targetKey].forEach(r => {
                 finalItems.push({
                     no: finalItems.length + 1,
                     name: r.nama || r.name || 'Barang DPA',
                     qty: r.volume || r.qty || 1,
                     unit: r.satuan || r.unit || 'Paket',
                     price: (parsedData?.hpsPrices && parsedData.hpsPrices[r.nama || r.name]) ? parsedData.hpsPrices[r.nama || r.name] : (r.harga_satuan || r.price || 0),
                     dpaPrice: r.harga_satuan || r.price || 0,
                     vendor: ''
                 });
             });
         } else {
             Object.values(parsedData.dpaRincian).forEach(rArray => {
                 if (Array.isArray(rArray)) {
                     rArray.forEach(r => {
                         finalItems.push({
                             no: finalItems.length + 1,
                             name: r.nama || r.name || 'Barang DPA',
                             qty: r.volume || r.qty || 1,
                             unit: r.satuan || r.unit || 'Paket',
                             price: (parsedData?.hpsPrices && parsedData.hpsPrices[r.nama || r.name]) ? parsedData.hpsPrices[r.nama || r.name] : (r.harga_satuan || r.price || 0),
                             dpaPrice: r.harga_satuan || r.price || 0,
                             vendor: ''
                         });
                     });
                 }
             });
         }
      }

      parsedData.items = finalItems;

      // 3. Kirim status dan description baru ke backend
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'Terkirim ke PP',
          description: JSON.stringify(parsedData)
        })
      })
      if (!res.ok) throw new Error('Gagal mengirim ke PP')
      
      // Sinkronisasi ke localStorage untuk backward compatibility
      const convertedPack = {
        id: targetPack.id,
        packName: targetPack.name || parsedData?.selectedPack?.packName || 'Paket Pengadaan',
        pagu: targetPack.budget || parsedData?.selectedPack?.pagu || 0,
        mak: parsedData?.selectedPack?.mak || '',
        noSirup: parsedData?.selectedPack?.noSirup || '',
        volume: parsedData?.packageMetadata?.volume || '1 Paket',
        spesifikasi: parsedData?.packageMetadata?.spesifikasi || '',
        hpsValue: parsedData?.hpsValue || targetPack.budget || '',
        techSpecs: parsedData?.techSpecs || '',
        dpaName: parsedData?.dpaName || 'DPA_Document.pdf',
        senderName: parsedData?.currentUser?.name || targetPack.created_by || 'PPK',
        senderNip: parsedData?.currentUser?.nip || '',
        senderDepartment: parsedData?.currentUser?.department || 'Instansi Terkait',
        sentDate: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        items: finalItems
      };
      localStorage.setItem('pbj_submitted_package', JSON.stringify(convertedPack));
      
      alert('Paket berhasil dikirim!')
      fetchProjects()
    } catch (err) {
      alert('Kesalahan: ' + err.message)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleHapus = async (projectId, projectName) => {
    if (!confirm(`Anda yakin ingin MENGHAPUS paket "${projectName}"?\n\nTindakan ini TIDAK DAPAT dibatalkan dan semua data DPP pada paket ini akan hilang permanen.`)) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' })
      if (!res.ok && res.status !== 204) throw new Error('Gagal menghapus paket')
      fetchProjects()
    } catch (err) {
      alert('Kesalahan: ' + err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const visibleProjects = user?.role === 'PP' ? projects.filter(p => p.status !== 'Draft') : projects;

  const statusList = user?.role === 'PP' 
    ? ['Semua', 'Terkirim ke PP', 'Disetujui PP', 'Selesai (Arsip Lengkap)'] 
    : ['Semua', 'Draft', 'Terkirim ke PP', 'Disetujui PP', 'Selesai (Arsip Lengkap)'];

  const filtered = visibleProjects.filter(p => {
    const matchStatus = filterStatus === 'Semua' || p.status === filterStatus
    const matchSearch = !search || (p.name || '').toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  let totalPagu = 0;
  let processedRups = new Set();
  const rupUtilization = {};

  visibleProjects.forEach(p => {
    let parsedData = {};
    try { parsedData = JSON.parse(p.description || '{}'); } catch(e) {}
    const noSirup = parsedData?.selectedPack?.noSirup;
    
    if (noSirup) {
      if (!rupUtilization[noSirup]) {
        rupUtilization[noSirup] = { pagu: p.budget || 0, used: 0 };
      }
      const hps = parseFloat(parsedData.hpsValue || 0);
      rupUtilization[noSirup].used += (isNaN(hps) ? 0 : hps);

      if (!processedRups.has(noSirup)) {
        totalPagu += (p.budget || 0);
        processedRups.add(noSirup);
      }
    } else {
      totalPagu += (p.budget || 0);
    }
  });
  
  let filteredPaguUnik = 0;
  let processedFilteredRups = new Set();
  filtered.forEach(p => {
    let parsedData = {};
    try { parsedData = JSON.parse(p.description || '{}'); } catch(e) {}
    const noSirup = parsedData?.selectedPack?.noSirup;
    if (noSirup) {
       if (!processedFilteredRups.has(noSirup)) {
          filteredPaguUnik += (p.budget || 0);
          processedFilteredRups.add(noSirup);
       }
    } else {
       filteredPaguUnik += (p.budget || 0);
    }
  });

  const totalDraft = visibleProjects.filter(p => p.status === 'Draft').length
  const totalKirim = visibleProjects.filter(p => p.status === 'Terkirim ke PP').length

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
          {user?.role !== 'PP' && (
            <button
              onClick={() => {
                localStorage.removeItem('pbj_current_project_id');
                navigate('/ppk/persiapan');
              }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Buat DPP Baru
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-12">

        {/* ── SUMMARY CARDS ──────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Card 1: Total Paket */}
          <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-xl p-4 flex items-center gap-3.5">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Total Paket</div>
              <div className="text-xl font-bold text-slate-800 leading-tight">{visibleProjects.length}</div>
              <div className="text-[10px] text-slate-400">Semua status</div>
            </div>
          </div>
          {/* Card 2: Total Pagu */}
          <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-xl p-4 flex items-center gap-3.5">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Total Pagu DPA</div>
              <div className="text-xl font-bold text-slate-800 leading-tight">{fmt(totalPagu)}</div>
              <div className="text-[10px] text-slate-400">Seluruh paket</div>
            </div>
          </div>
          {/* Card 3: Menunggu Review */}
          <div className="bg-gradient-to-br from-amber-50 to-white border border-amber-100 rounded-xl p-4 flex items-center gap-3.5">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Menunggu Review</div>
              <div className="text-xl font-bold text-slate-800 leading-tight">{totalDraft + totalKirim}</div>
              <div className="text-[10px] text-slate-400">Draft + Terkirim PP</div>
            </div>
          </div>
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
                {s === 'Semua' ? `Semua (${visibleProjects.length})` : s}
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
            <div className="inline-block w-8 h-8 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 text-sm font-medium">Memuat data paket...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-16 text-center shadow-sm">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-1">
              {search || filterStatus !== 'Semua' ? 'Tidak ada paket ditemukan' : 'Belum ada Paket Pekerjaan'}
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              {search || filterStatus !== 'Semua'
                ? 'Coba ubah filter atau kata kunci pencarian.'
                : 'Mulai dengan membuat Dokumen Persiapan Pengadaan pertama Anda.'}
            </p>
            {!search && filterStatus === 'Semua' && (
              <button onClick={() => navigate('/ppk/persiapan')} className="text-indigo-600 font-bold text-sm hover:underline flex items-center gap-1 mx-auto">
                Mulai Survei HPS Pertama Anda
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
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
                      <td className="px-4 py-4 text-right whitespace-nowrap align-top">
                        <div className="flex justify-between items-center mb-1 gap-4">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">Pagu DPA</span>
                          <span className="font-mono text-[13px] font-bold text-slate-700">{fmt(project.budget)}</span>
                        </div>
                        {parsedData?.selectedPack?.noSirup && rupUtilization[parsedData.selectedPack.noSirup] && (() => {
                          const hpsPaketIni = parseFloat(parsedData.hpsValue || 0) || 0;
                          const util = rupUtilization[parsedData.selectedPack.noSirup];
                          const sisa = util.pagu - util.used;
                          return (
                            <div className="text-[10px] mt-2 text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200 shadow-sm text-left">
                              <div className="flex justify-between items-center mb-1">
                                <span>HPS Paket Ini:</span>
                                <span className="font-mono font-medium text-slate-700">{fmt(hpsPaketIni)}</span>
                              </div>
                              <div className="flex justify-between items-center mb-1 text-slate-500 border-b border-slate-200 pb-1 border-dashed">
                                <span>HPS Semua Paket (di RUP ini):</span>
                                <span className="font-mono">{fmt(util.used)}</span>
                              </div>
                              <div className="flex justify-between items-center pt-0.5">
                                <span className="font-semibold text-slate-600">Sisa Pagu RUP:</span>
                                <span className={`font-mono font-bold ${sisa < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{fmt(sisa)}</span>
                              </div>
                            </div>
                          )
                        })()}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
                          <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                          E-Purchasing
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold border px-2.5 py-1 rounded-full ${cfg.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></span>
                          {user?.role === 'PP' && project.status === 'Terkirim ke PP' ? 'Usulan Masuk' : cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center text-xs text-slate-500 whitespace-nowrap">{tgl}</td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              if (user?.role === 'PP') {
                                navigate(`/pp/panel?paketId=${project.id}`)
                              } else {
                                navigate(`/ppk/persiapan?paketId=${project.id}`)
                              }
                            }}
                            title={isLocked ? 'Lihat Arsip DPP' : 'Edit Dokumen'}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200"
                          >
                            {isLocked ? (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                            )}
                            {user?.role === 'PP' ? (project.status === 'Terkirim ke PP' ? 'Proses Usulan' : 'Lihat') : (isLocked ? 'Lihat' : 'Edit')}
                          </button>
                          {!isLocked && (
                            <button
                              onClick={() => handleKirimPP(project.id)}
                              disabled={isUpdating || isDeleting}
                              title="Kirim ke PP"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors border border-indigo-200 disabled:opacity-40"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7"/></svg>
                              Kirim
                            </button>
                          )}
                          {!isLocked && (
                            <button
                              onClick={() => handleHapus(project.id, project.name)}
                              disabled={isDeleting || isUpdating}
                              title="Hapus Paket"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors border border-rose-200 disabled:opacity-40"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                              Hapus
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
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-bold text-slate-700 font-mono">{fmt(filteredPaguUnik)}</span>
                      <span className="text-[9px] text-slate-400 font-normal uppercase tracking-wider mt-0.5">Total Pagu (RUP Unik)</span>
                    </div>
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
                      {user?.role === 'PP' && project.status === 'Terkirim ke PP' ? 'Usulan Masuk' : cfg.label}
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
                      onClick={() => {
                        if (user?.role === 'PP') {
                          navigate(`/pp/panel?paketId=${project.id}`)
                        } else {
                          navigate(`/ppk/persiapan?paketId=${project.id}`)
                        }
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 text-[11px] font-semibold py-2 rounded-lg transition-all"
                    >
                      {isLocked ? (
                        <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg> {user?.role === 'PP' && project.status === 'Terkirim ke PP' ? 'Proses Usulan' : 'Lihat DPP'}</>
                      ) : (
                        <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg> Edit</>  
                      )}
                    </button>
                    {!isLocked && (
                      <button
                        onClick={() => handleKirimPP(project.id)}
                        disabled={isUpdating}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold py-2 rounded-lg shadow-sm shadow-indigo-200 transition-all disabled:opacity-50"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7"/></svg>
                        Kirim ke PP
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