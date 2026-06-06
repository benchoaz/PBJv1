import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function RealisasiAnggaranPanel() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
      };
      if (user) {
        headers['X-User-Role'] = user.role;
        headers['X-User-Satker'] = user.idSatker || '';
      }
      
      const res = await fetch('/api/reports/absorption', { headers });
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }
      const reportData = await res.json();
      setData(reportData);
    } catch (err) {
      console.error('Failed to fetch absorption report:', err);
      setError('Gagal memuat data laporan realisasi anggaran.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const formatRupiah = (val) => {
    return 'Rp ' + Number(val || 0).toLocaleString('id-ID', { minimumFractionDigits: 0 });
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <p className="text-sm font-semibold text-slate-500">Mengkalkulasi realisasi anggaran & penyerapan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center max-w-xl mx-auto my-12">
        <svg className="w-12 h-12 text-rose-500 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <h3 className="text-base font-bold text-rose-800 mb-1">Terjadi Kesalahan</h3>
        <p className="text-xs text-rose-600 mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const breakdown = data?.breakdown || [];
  const filteredBreakdown = breakdown.filter(item => 
    item.kegiatan.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.mak.includes(searchQuery) ||
    item.sub_kegiatan.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-slide-up print:bg-white print:p-0">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Laporan Realisasi Anggaran</h1>
          <p className="text-xs text-slate-400 mt-1">
            Data realisasi belanja berdasarkan paket-paket pengadaan barang/jasa yang telah berstatus selesai.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-95"
          >
            ↻ Segarkan Data
          </button>
          <button
            onClick={handlePrint}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2 active:scale-95"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            Cetak Laporan
          </button>
        </div>
      </div>

      {/* Print-Only Header */}
      <div className="hidden print:block text-center border-b-2 border-slate-800 pb-6 mb-6">
        <h2 className="text-lg font-bold uppercase text-slate-900 tracking-wide">Pemerintah Kabupaten Probolinggo</h2>
        <h3 className="text-base font-bold uppercase text-slate-800 mt-0.5">{user?.perangkatDaerah || 'Satuan Kerja Perangkat Daerah'}</h3>
        <p className="text-xs text-slate-500 font-mono mt-1">Alamat Kantor Kecamatan Besuk, Kabupaten Probolinggo, Jawa Timur</p>
        <div className="h-0.5 bg-slate-800 mt-4"></div>
        <div className="h-1 bg-slate-800 mt-0.5"></div>
        <h4 className="text-sm font-bold uppercase mt-6 tracking-wider">Laporan Realisasi Penyerapan Anggaran Belanja Barang/Jasa</h4>
        <p className="text-[10px] text-slate-500 font-medium">Periode Tahun Anggaran 2026</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Completed Packages */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full translate-x-8 -translate-y-8 -z-10 opacity-60"></div>
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1.5">Paket Selesai</div>
          <div className="text-3xl font-extrabold text-indigo-700 font-mono">{data?.total_completed_packages || 0}</div>
          <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Paket BAST/Selesai
          </div>
        </div>

        {/* Card 2: Total Pagu */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-50 rounded-full translate-x-8 -translate-y-8 -z-10 opacity-60"></div>
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1.5">Pagu DPA Pengadaan</div>
          <div className="text-xl font-bold text-slate-800 font-mono mt-1.5">{formatRupiah(data?.total_pagu)}</div>
          <div className="text-[10px] text-slate-400 mt-3 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span> Alokasi Anggaran Awal
          </div>
        </div>

        {/* Card 3: Total Realisasi */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full translate-x-8 -translate-y-8 -z-10 opacity-60"></div>
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1.5">Realisasi Belanja</div>
          <div className="text-xl font-bold text-emerald-700 font-mono mt-1.5">{formatRupiah(data?.total_realisasi)}</div>
          <div className="text-[10px] text-slate-400 mt-3 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Nilai Negosiasi + Ongkir
          </div>
        </div>

        {/* Card 4: Total Efisiensi */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full translate-x-8 -translate-y-8 -z-10 opacity-60"></div>
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1.5">Efisiensi Belanja (Sisa Pagu)</div>
          <div className="text-xl font-bold text-amber-700 font-mono mt-1.5">{formatRupiah(data?.total_efisiensi)}</div>
          <div className="text-[10px] text-slate-400 mt-3 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Efisiensi Pengadaan (Paket Selesai)
          </div>
        </div>

        {/* Card 5: Absorption Rate */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-50 rounded-full translate-x-8 -translate-y-8 -z-10 opacity-60"></div>
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1.5">Penyerapan Anggaran</div>
          <div className="text-3xl font-extrabold text-violet-700 font-mono">{(data?.overall_percentage || 0).toFixed(2)}%</div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div 
              className="bg-violet-500 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(data?.overall_percentage || 0, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Visual Progress bar list per Kegiatan */}
      {breakdown.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm print:shadow-none">
          <h2 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            Tingkat Penyerapan Tiap Kegiatan Belanja
          </h2>
          <div className="space-y-4">
            {breakdown.map((item, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex flex-wrap justify-between items-start gap-2 text-xs font-semibold text-slate-700">
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <span className="font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] self-start">{item.mak}</span>
                    <span className="text-slate-700 leading-snug break-words">{item.kegiatan}</span>
                  </div>
                  <span className="font-mono text-indigo-700 shrink-0">{item.percentage.toFixed(2)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>Realisasi: {formatRupiah(item.total_realisasi)}</span>
                  <span>Pagu: {formatRupiah(item.total_pagu)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm print:border-none print:shadow-none">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 print:hidden">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <path d="M9 9h6" />
              <path d="M9 13h6" />
              <path d="M9 17h6" />
            </svg>
            Rincian Penyerapan Per Kode Rekening Belanja
          </h2>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari MAK atau Kegiatan..."
            className="w-full sm:w-64 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 focus:border-slate-400 outline-none"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-400 uppercase font-bold text-[9px] tracking-wider border-b border-slate-200">
                <th className="px-6 py-3">Kode MAK</th>
                <th className="px-6 py-3">Kegiatan / Sub-Kegiatan</th>
                <th className="px-6 py-3 text-right">Pagu Anggaran</th>
                <th className="px-6 py-3 text-right">Realisasi Kontrak</th>
                <th className="px-6 py-3 text-right">Sisa Anggaran / Efisiensi</th>
                <th className="px-6 py-3 text-center">Paket</th>
                <th className="px-6 py-3 text-center">Persentase</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredBreakdown.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-400 font-medium">
                    Tidak ada data penyerapan anggaran yang cocok.
                  </td>
                </tr>
              ) : (
                filteredBreakdown.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-indigo-700 whitespace-nowrap">{item.mak}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{item.kegiatan}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{item.sub_kegiatan}</div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-semibold">{formatRupiah(item.total_pagu)}</td>
                    <td className="px-6 py-4 text-right font-mono font-semibold text-emerald-700">{formatRupiah(item.total_realisasi)}</td>
                    <td className="px-6 py-4 text-right font-mono font-semibold text-amber-700">{formatRupiah(item.total_efisiensi)}</td>
                    <td className="px-6 py-4 text-center font-mono font-semibold text-slate-500">{item.package_count}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                        item.percentage >= 80 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        item.percentage >= 40 ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {item.percentage.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Total Footer Row */}
            {filteredBreakdown.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-200 text-slate-800">
                  <td colSpan="2" className="px-6 py-4 text-right">TOTAL KUMULATIF</td>
                  <td className="px-6 py-4 text-right font-mono">{formatRupiah(data?.total_pagu)}</td>
                  <td className="px-6 py-4 text-right font-mono text-emerald-800">{formatRupiah(data?.total_realisasi)}</td>
                  <td className="px-6 py-4 text-right font-mono text-amber-800">{formatRupiah(data?.total_efisiensi)}</td>
                  <td className="px-6 py-4 text-center font-mono">{data?.total_completed_packages}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-0.5 rounded font-mono font-extrabold text-[10px] bg-slate-800 text-white shadow-sm">
                      {(data?.overall_percentage || 0).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Print-Only Signature Section */}
      <div className="hidden print:block mt-16">
        <div className="flex justify-between text-xs text-slate-800">
          <div className="text-center">
            <p className="mb-16">Mengetahui,<br />Kuasa Pengguna Anggaran (KPA)</p>
            <p className="font-bold underline">_________________________</p>
            <p className="text-[10px] text-slate-400 mt-1">NIP. 197909102002121004</p>
          </div>
          <div className="text-center">
            <p className="mb-16">Besuk, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br />Bendahara Pengeluaran</p>
            <p className="font-bold underline">_________________________</p>
            <p className="text-[10px] text-slate-400 mt-1">NIP. 198205192010011010</p>
          </div>
        </div>
      </div>
    </div>
  );
}
