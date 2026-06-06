import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function VendorPerformance() {
  const { user } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [filterRating, setFilterRating] = useState('Semua');

  const fetchVendorData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/reports/vendor-performance');
      if (!res.ok) throw new Error('Gagal memuat rapor kinerja penyedia.');
      const data = await res.json();
      setVendors(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorData();
  }, []);

  const filteredVendors = vendors.filter(v => {
    const matchSearch = v.vendor_name.toLowerCase().includes(search.toLowerCase()) ||
                        v.served_satkers.some(s => s.toLowerCase().includes(search.toLowerCase()));
    
    if (filterRating === 'Semua') return matchSearch;
    if (filterRating === 'Sangat Baik') return matchSearch && v.average_rating >= 4.5;
    if (filterRating === 'Baik') return matchSearch && v.average_rating >= 3.5 && v.average_rating < 4.5;
    if (filterRating === 'Cukup') return matchSearch && v.average_rating >= 2.5 && v.average_rating < 3.5;
    if (filterRating === 'Kurang') return matchSearch && v.average_rating > 0 && v.average_rating < 2.5;
    return matchSearch;
  });

  // Calculate statistics
  const totalVendors = vendors.length;
  const averageOverallRating = vendors.reduce((acc, curr) => acc + (curr.average_rating || 0), 0) / (vendors.filter(v => v.average_rating > 0).length || 1);
  const topVendor = [...vendors].sort((a, b) => b.average_rating - a.average_rating)[0];

  return (
    <div className="space-y-8 animate-slide-up pb-12 font-sans">
      
      {/* HEADER PANEL */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Rapor Evaluasi & Kinerja Penyedia</h1>
          <p className="text-xs text-slate-400 mt-1">
            Riwayat penilaian bintang, ulasan kualitas, dan zona pelayanan dari seluruh Pejabat Pengadaan (PP).
          </p>
        </div>
        <button
          onClick={fetchVendorData}
          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-95"
        >
          ↻ Segarkan Data
        </button>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Vendors */}
        <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-2xl p-5 shadow-sm">
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Total Penyedia Dinilai</div>
          <div className="text-3xl font-extrabold text-indigo-700 font-mono">{totalVendors}</div>
          <p className="text-[10px] text-slate-400 mt-2">Penyedia UMKM/Katering aktif</p>
        </div>

        {/* Average Rating */}
        <div className="bg-gradient-to-br from-amber-50 to-white border border-amber-100 rounded-2xl p-5 shadow-sm">
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Rata-Rata Penilaian</div>
          <div className="text-3xl font-extrabold text-amber-600 font-mono flex items-baseline gap-1">
            <span>{averageOverallRating > 0 ? averageOverallRating.toFixed(1) : '0.0'}</span>
            <span className="text-lg">/ 5.0</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Skor kepuasan layanan dinas</p>
        </div>

        {/* Top Vendor */}
        <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-2xl p-5 shadow-sm">
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Penyedia Terbaik</div>
          <div className="text-lg font-bold text-slate-800 truncate mt-1">{topVendor ? topVendor.vendor_name : '-'}</div>
          <p className="text-[10px] text-emerald-600 font-semibold mt-2.5 flex items-center gap-1">
            <span>★</span>
            <span>{topVendor ? topVendor.average_rating.toFixed(1) : '0.0'} ({topVendor ? topVendor.total_packages : 0} Paket)</span>
          </p>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 shadow-sm">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {['Semua', 'Sangat Baik', 'Baik', 'Cukup', 'Kurang'].map(s => (
            <button
              key={s}
              onClick={() => setFilterRating(s)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterRating === s
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-0 sm:ml-auto">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
          <input
            type="text"
            placeholder="Cari penyedia atau kecamatan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 w-full sm:w-64"
          />
        </div>
      </div>

      {/* DATA TABLE */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-16 text-center">
          <div className="inline-block w-8 h-8 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-400 text-sm font-medium">Menganalisis kinerja penyedia...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-8 text-center text-rose-700 text-xs font-semibold">
          Error: {error}
        </div>
      ) : filteredVendors.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 text-xs">
          Tidak ada data penyedia ditemukan.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="text-left px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Nama Penyedia</th>
                  <th className="text-center px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 w-36">Rating Rata-Rata</th>
                  <th className="text-center px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 w-32">Jumlah Paket</th>
                  <th className="text-center px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 w-36">Status Kinerja</th>
                  <th className="text-left px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Wilayah Layanan</th>
                  <th className="text-center px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVendors.map((v, idx) => (
                  <tr key={idx} className="hover:bg-indigo-50/20 transition-colors">
                    <td className="px-5 py-4 font-bold text-slate-800 text-xs tracking-wide">{v.vendor_name}</td>
                    <td className="px-4 py-4 text-center">
                      {v.average_rating > 0 ? (
                        <div className="flex items-center justify-center gap-1 font-mono font-bold text-amber-500 text-xs">
                          <span>★</span>
                          <span>{v.average_rating.toFixed(1)}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400">Belum Dinilai</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center font-mono font-bold text-xs text-slate-600">{v.total_packages} Paket</td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold border px-2.5 py-0.5 rounded-full ${
                        v.status === 'Sangat Baik' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                        v.status === 'Baik' ? 'text-blue-700 bg-blue-50 border-blue-200' :
                        v.status === 'Cukup' ? 'text-amber-700 bg-amber-50 border-amber-200' :
                        v.status === 'Kurang' ? 'text-rose-700 bg-rose-50 border-rose-200' :
                        'text-slate-400 bg-slate-50 border-slate-200'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500 max-w-xs truncate" title={v.served_satkers.join(', ')}>
                      {v.served_satkers.join(', ')}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => setSelectedVendor(v)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        Lihat Ulasan
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL MODAL (REVIEWS TIMELINE) */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedVendor(null)} />
          
          {/* Card */}
          <div className="relative bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl backdrop-blur-xl animate-scale-in max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800 tracking-tight">{selectedVendor.vendor_name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-400">Rata-Rata Kinerja:</span>
                  <span className="text-xs font-bold text-amber-500">★ {selectedVendor.average_rating.toFixed(1)} / 5.0</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedVendor(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center transition-all"
              >
                ✕
              </button>
            </div>

            {/* Sub-Score Dashboard */}
            <div className="grid grid-cols-3 gap-3 mb-6 bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
              <div className="text-center">
                <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Kualitas Produk</div>
                <div className="text-sm font-extrabold text-slate-700 mt-1">★ {selectedVendor.average_quality > 0 ? selectedVendor.average_quality.toFixed(1) : '-'}</div>
              </div>
              <div className="text-center border-x border-slate-200">
                <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Ketepatan Waktu</div>
                <div className="text-sm font-extrabold text-slate-700 mt-1">★ {selectedVendor.average_delivery > 0 ? selectedVendor.average_delivery.toFixed(1) : '-'}</div>
              </div>
              <div className="text-center">
                <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Komunikasi</div>
                <div className="text-sm font-extrabold text-slate-700 mt-1">★ {selectedVendor.average_comm > 0 ? selectedVendor.average_comm.toFixed(1) : '-'}</div>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Riwayat Ulasan Pejabat Pengadaan</h4>
              
              {selectedVendor.reviews.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Belum ada ulasan detail yang ditulis untuk penyedia ini.</p>
              ) : (
                <div className="space-y-4">
                  {selectedVendor.reviews.map((r, i) => (
                    <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <div className="text-xs font-bold text-slate-700">{r.project_name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{r.pp_name} • {new Date(r.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                        </div>
                        <div className="flex items-center gap-1 font-mono font-bold text-amber-500 text-xs shrink-0">
                          <span>★ {r.rating.toFixed(1)}</span>
                        </div>
                      </div>

                      {/* Detail Metrics Breakdown */}
                      <div className="grid grid-cols-3 gap-2 py-1.5 px-3 bg-white border border-slate-150 rounded-lg text-[9px] text-slate-500">
                        <div className="flex items-center gap-1 justify-between">
                          <span>Kualitas:</span>
                          <span className="font-bold text-slate-700">★ {r.quality_rating || 0}</span>
                        </div>
                        <div className="flex items-center gap-1 justify-between border-x border-slate-150 px-2">
                          <span>Waktu:</span>
                          <span className="font-bold text-slate-700">★ {r.delivery_rating || 0}</span>
                        </div>
                        <div className="flex items-center gap-1 justify-between">
                          <span>Komunikasi:</span>
                          <span className="font-bold text-slate-700">★ {r.communication_rating || 0}</span>
                        </div>
                      </div>
                      
                      <div className="text-xs text-slate-600 bg-white border border-slate-150 p-3 rounded-lg leading-relaxed italic">
                        "{r.note || 'Tidak ada catatan tertulis.'}"
                      </div>
                      
                      <div className="flex items-center gap-1 text-[9px] font-semibold text-slate-500">
                        <span>Status Respon:</span>
                        <span className="text-indigo-600 font-bold">{r.status || 'Normal'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
