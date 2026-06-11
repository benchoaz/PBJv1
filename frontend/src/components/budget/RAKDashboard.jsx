import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { UploadCloud, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, Info } from 'lucide-react';
import RAKUploadModal from './RAKUploadModal';

export default function RAKDashboard() {
  const { user } = useAuth();
  const [activeRka, setActiveRka] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const fetchRAK = async () => {
    setIsLoading(true);
    try {
      const idSatker = user?.idSatker || '67081'; // Fallback
      const res = await fetch(`/api/rak/accounts?satker_id=${idSatker}&tahun=${new Date().getFullYear()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.has_rak) {
          setActiveRka(data.rak_doc);
          setAccounts(data.accounts || []);
        } else {
          setActiveRka(null);
          setAccounts([]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch RAK:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRAK();
    }
  }, [user]);

  const handleUploadSuccess = () => {
    setIsUploadModalOpen(false);
    fetchRAK();
  };

  return (
    <div className="p-4 sm:p-8 w-full max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Integrasi RAK & DPA</h1>
          <p className="text-sm text-slate-500 mt-1">
            Master Data Anggaran Kas (RAK) untuk acuan pagu dan jadwal pencairan
          </p>
        </div>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm"
        >
          <UploadCloud className="w-5 h-5" />
          <span>Unggah RAK Perubahan</span>
        </button>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
          <p className="text-slate-500 font-medium">Memuat data anggaran...</p>
        </div>
      ) : !activeRka ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
            <FileSpreadsheet className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Belum Ada RAK Aktif</h3>
          <p className="text-slate-500 max-w-md mb-6">
            Anda belum mengunggah dokumen Rencana Anggaran Kas (RAK) untuk tahun ini. Unggah file Excel untuk mengaktifkan integrasi RAK ↔ DPA.
          </p>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-6 py-2.5 rounded-xl transition-colors"
          >
            Unggah RAK Excel
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Info Card */}
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-400/30 text-emerald-100 text-[10px] font-bold uppercase tracking-wider">
                    RAK AKTIF
                  </span>
                  <span className="text-indigo-100 text-xs">Tahun {activeRka.tahun_anggaran}</span>
                  {activeRka.nama_skpd && (
                    <span className="text-indigo-100 text-xs px-2 border-l border-indigo-400/50">{activeRka.nama_skpd}</span>
                  )}
                </div>
                <h2 className="text-xl font-bold mb-1 truncate max-w-2xl">Dokumen RAK Kas</h2>
                <p className="text-indigo-100 text-sm flex items-center gap-1.5 mt-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Menjadi acuan untuk {accounts.length} kode rekening
                </p>
              </div>
              <div className="text-right">
                <div className="text-indigo-100 text-xs mb-1 uppercase tracking-wider font-semibold">Total Pagu RAK</div>
                <div className="text-3xl font-extrabold tracking-tight">
                  Rp {(activeRka.nilai_anggaran || accounts.reduce((acc, curr) => acc + curr.anggaran_tahun, 0)).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-800">Daftar Rekening RAK</h3>
              <span className="text-xs text-slate-500">{accounts.length} Rekening</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-4 py-3 sticky left-0 bg-slate-50 z-10">Kode Rekening</th>
                    <th className="px-4 py-3 min-w-[200px]">Uraian</th>
                    <th className="px-4 py-3 text-right text-indigo-600">Pagu Total</th>
                    <th className="px-3 py-3 text-right">Jan</th>
                    <th className="px-3 py-3 text-right">Feb</th>
                    <th className="px-3 py-3 text-right">Mar</th>
                    <th className="px-3 py-3 text-right">Apr</th>
                    <th className="px-3 py-3 text-right">Mei</th>
                    <th className="px-3 py-3 text-right">Jun</th>
                    <th className="px-3 py-3 text-right">Jul</th>
                    <th className="px-3 py-3 text-right">Ags</th>
                    <th className="px-3 py-3 text-right">Sep</th>
                    <th className="px-3 py-3 text-right">Okt</th>
                    <th className="px-3 py-3 text-right">Nov</th>
                    <th className="px-3 py-3 text-right">Des</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {accounts.reduce((rows, acc, idx, arr) => {
                    if (idx === 0 || acc.sub_kegiatan !== arr[idx - 1].sub_kegiatan || acc.program !== arr[idx - 1].program) {
                      rows.push(
                        <tr key={`header-${idx}`} className="bg-slate-100/80 border-y border-slate-200">
                          <td colSpan="15" className="px-4 py-2 text-[11px] font-semibold text-slate-700 sticky left-0">
                            {acc.program && <span className="mr-2 px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded">{acc.program}</span>}
                            {acc.kegiatan && <span className="mr-2 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded">{acc.kegiatan}</span>}
                            {acc.sub_kegiatan && <span className="px-1.5 py-0.5 bg-sky-100 text-sky-700 rounded">{acc.sub_kegiatan}</span>}
                            {(!acc.program && !acc.kegiatan && !acc.sub_kegiatan) && <span className="text-slate-500 italic">Sub Kegiatan Tidak Terdeteksi</span>}
                          </td>
                        </tr>
                      );
                    }

                    const totalBulan = acc.bulan_jan + acc.bulan_feb + acc.bulan_mar + acc.bulan_apr + acc.bulan_mei + acc.bulan_jun + acc.bulan_jul + acc.bulan_ags + acc.bulan_sep + acc.bulan_okt + acc.bulan_nov + acc.bulan_des;
                    const isValid = totalBulan === acc.anggaran_tahun;
                    rows.push(
                    <tr key={`row-${idx}`} className={`transition-colors ${!isValid ? 'bg-red-50/80 hover:bg-red-100' : 'hover:bg-slate-50'}`}>
                      <td className="px-4 py-3 font-mono text-[11px] font-bold text-slate-700 whitespace-nowrap sticky left-0 bg-inherit">
                        {acc.kode_rekening}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 min-w-[200px]">
                        {acc.uraian}
                        {!isValid && <div className="text-[10px] text-red-500 font-semibold mt-1">⚠️ Peringatan: Total bulanan (Rp {totalBulan.toLocaleString()}) tidak sama dengan Pagu (Rp {acc.anggaran_tahun.toLocaleString()})</div>}
                      </td>
                      <td className="px-4 py-3 text-xs font-bold text-indigo-600 text-right whitespace-nowrap">
                        Rp {acc.anggaran_tahun.toLocaleString()}
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-600 text-right whitespace-nowrap">{acc.bulan_jan > 0 ? acc.bulan_jan.toLocaleString() : '-'}</td>
                      <td className="px-3 py-3 text-xs text-slate-600 text-right whitespace-nowrap">{acc.bulan_feb > 0 ? acc.bulan_feb.toLocaleString() : '-'}</td>
                      <td className="px-3 py-3 text-xs text-slate-600 text-right whitespace-nowrap">{acc.bulan_mar > 0 ? acc.bulan_mar.toLocaleString() : '-'}</td>
                      <td className="px-3 py-3 text-xs text-slate-600 text-right whitespace-nowrap">{acc.bulan_apr > 0 ? acc.bulan_apr.toLocaleString() : '-'}</td>
                      <td className="px-3 py-3 text-xs text-slate-600 text-right whitespace-nowrap">{acc.bulan_mei > 0 ? acc.bulan_mei.toLocaleString() : '-'}</td>
                      <td className="px-3 py-3 text-xs text-slate-600 text-right whitespace-nowrap">{acc.bulan_jun > 0 ? acc.bulan_jun.toLocaleString() : '-'}</td>
                      <td className="px-3 py-3 text-xs text-slate-600 text-right whitespace-nowrap">{acc.bulan_jul > 0 ? acc.bulan_jul.toLocaleString() : '-'}</td>
                      <td className="px-3 py-3 text-xs text-slate-600 text-right whitespace-nowrap">{acc.bulan_ags > 0 ? acc.bulan_ags.toLocaleString() : '-'}</td>
                      <td className="px-3 py-3 text-xs text-slate-600 text-right whitespace-nowrap">{acc.bulan_sep > 0 ? acc.bulan_sep.toLocaleString() : '-'}</td>
                      <td className="px-3 py-3 text-xs text-slate-600 text-right whitespace-nowrap">{acc.bulan_okt > 0 ? acc.bulan_okt.toLocaleString() : '-'}</td>
                      <td className="px-3 py-3 text-xs text-slate-600 text-right whitespace-nowrap">{acc.bulan_nov > 0 ? acc.bulan_nov.toLocaleString() : '-'}</td>
                      <td className="px-3 py-3 text-xs text-slate-600 text-right whitespace-nowrap">{acc.bulan_des > 0 ? acc.bulan_des.toLocaleString() : '-'}</td>
                    </tr>
                    );
                    return rows;
                  }, [])}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {isUploadModalOpen && (
        <RAKUploadModal
          onClose={() => setIsUploadModalOpen(false)}
          onSuccess={handleUploadSuccess}
          satkerId={user?.idSatker || '67081'}
        />
      )}
    </div>
  );
}
