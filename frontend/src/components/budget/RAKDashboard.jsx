import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { UploadCloud, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, Info, CheckCircle } from 'lucide-react';
import RAKUploadModal from './RAKUploadModal';

export default function RAKDashboard() {
  const { user } = useAuth();
  const [activeRka, setActiveRka] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1); // 1-12

  const fetchRAK = async () => {
    setIsLoading(true);
    try {
      const idSatker = user?.idSatker || '67081'; // Fallback
      const res = await fetch(`/api/rak/accounts?satker_id=${idSatker}&tahun=${new Date().getFullYear()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.has_rka) {
          setActiveRka(data.rka_doc);
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

  return (
    <div className="p-4 sm:p-8 w-full max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Master RAK</h1>
          <p className="text-sm text-slate-500 mt-1">
            Master Data Anggaran Kas (RAK) hasil distribusi dari Tahap 2 (PPK Persiapan)
          </p>
        </div>
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
          <h3 className="text-lg font-bold text-slate-800 mb-2">Belum Ada Master RAK Aktif</h3>
          <p className="text-slate-500 max-w-md mb-6">
            Data Rencana Anggaran Kas (RAK) masih kosong. Distribusi RAK sekarang dilakukan secara otomatis dan interaktif oleh PPK pada <b>Tahap 2 (Upload DPA)</b> saat persiapan paket pengadaan.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Info Card */}
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 border border-emerald-300 text-emerald-950 flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
                    <CheckCircle className="w-3 h-3" />
                    TERVALIDASI
                  </span>
                  <span className="text-indigo-100 text-xs font-semibold">Tahun {activeRka.tahun_anggaran}</span>
                  {activeRka.nama_skpd && (
                    <span className="text-indigo-100 text-xs px-2 border-l border-indigo-400/50">{activeRka.nama_skpd}</span>
                  )}
                </div>
                <h2 className="text-xl font-bold mb-1 truncate max-w-2xl">Dokumen Master RAK</h2>
                <p className="text-indigo-100 text-sm flex items-center gap-1.5 mt-2">
                  <Info className="w-4 h-4 text-indigo-300" />
                  Menjadi acuan ketersediaan anggaran untuk {accounts.length} kode rekening
                </p>
              </div>
              <div className="text-right">
                <div className="text-indigo-100 text-xs mb-1 uppercase tracking-wider font-semibold">Total Pagu Pengadaan</div>
                <div className="text-3xl font-extrabold tracking-tight">
                  Rp {(activeRka.nilai_anggaran || accounts.reduce((acc, curr) => acc + curr.anggaran_tahun, 0)).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Buku Kas & Anggaran Tersedia</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Sistem SIPD: Anggaran tersedia otomatis berakumulasi dari RAK bulan sebelumnya yang belum direalisasikan.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Simulasi Bulan Berjalan:</span>
                <select 
                  value={currentMonth}
                  onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
                  className="text-sm border-2 border-indigo-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white font-extrabold text-indigo-800 outline-none shadow-sm cursor-pointer transition-all hover:border-indigo-300"
                >
                  {['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'].map((m, i) => (
                    <option key={i+1} value={i+1}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-4 py-3 sticky left-0 bg-slate-50 z-10 w-80 border-r border-slate-200 shadow-[1px_0_0_0_#e2e8f0]">Kode Rekening & Uraian</th>
                    <th className="px-3 py-3 text-right border-r border-slate-200">Pagu Total RAK</th>
                    <th className="px-4 py-3 text-right text-indigo-700 bg-indigo-50/50 border-r border-indigo-100">Anggaran Tersedia (Akumulatif)</th>
                    <th className="px-3 py-3 text-right text-amber-600 border-r border-slate-200">Komitmen Belanja</th>
                    <th className="px-3 py-3 text-right text-rose-600 border-r border-slate-200">Realisasi Belanja</th>
                    <th className="px-4 py-3 text-right text-emerald-700">Sisa Anggaran Aktif</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {accounts.reduce((rows, acc, idx, arr) => {
                    if (idx === 0 || acc.sub_kegiatan !== arr[idx - 1].sub_kegiatan || acc.program !== arr[idx - 1].program) {
                      
                      let displaySubKeg = acc.sub_kegiatan || '';
                      let sumberDana = '';
                      if (displaySubKeg.includes('Sumber Pendanaan')) {
                        const parts = displaySubKeg.split('Sumber Pendanaan');
                        displaySubKeg = parts[0].trim();
                        sumberDana = 'Sumber Pendanaan ' + parts[1].trim();
                      }

                      rows.push(
                        <tr key={`header-${idx}`} className="bg-slate-100/80 border-y border-slate-200">
                          <td colSpan="6" className="px-4 py-3 sticky left-0 space-y-1.5">
                            {(acc.program || acc.kegiatan) && (
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                {acc.program && <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded shadow-sm">Program: {acc.program}</span>}
                                {acc.kegiatan && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded shadow-sm">Kegiatan: {acc.kegiatan}</span>}
                              </div>
                            )}
                            <div className="flex flex-wrap items-center gap-2">
                              {displaySubKeg && <span className="px-2 py-1 bg-sky-100 text-sky-700 text-[11px] font-extrabold rounded-md shadow-sm border border-sky-200">{displaySubKeg}</span>}
                              {sumberDana && <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-md shadow-sm border border-amber-200 flex items-center gap-1">💰 {sumberDana}</span>}
                              {(!acc.program && !acc.kegiatan && !displaySubKeg) && <span className="text-slate-500 text-[11px] italic">Sub Kegiatan Tidak Terdeteksi</span>}
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    const totalBulan = acc.bulan_jan + acc.bulan_feb + acc.bulan_mar + acc.bulan_apr + acc.bulan_mei + acc.bulan_jun + acc.bulan_jul + acc.bulan_ags + acc.bulan_sep + acc.bulan_okt + acc.bulan_nov + acc.bulan_des;
                    const isValid = totalBulan === acc.anggaran_tahun;
                    
                    const months = ['bulan_jan','bulan_feb','bulan_mar','bulan_apr','bulan_mei','bulan_jun','bulan_jul','bulan_ags','bulan_sep','bulan_okt','bulan_nov','bulan_des'];
                    const anggaranTersedia = months.slice(0, currentMonth).reduce((sum, m) => sum + (acc[m] || 0), 0);
                    const komitmen = acc.total_komitmen || 0;
                    const realisasi = acc.total_realisasi || 0;
                    const sisa = anggaranTersedia - komitmen - realisasi;

                    rows.push(
                    <tr key={`row-${idx}`} className={`transition-colors ${!isValid ? 'bg-rose-50/80 hover:bg-rose-100' : 'hover:bg-slate-50'}`}>
                      <td className="px-4 py-3 sticky left-0 bg-inherit border-r border-slate-100 shadow-[1px_0_0_0_#f1f5f9]">
                        <div className="font-mono text-[11px] font-bold text-slate-800">{acc.kode_rekening}</div>
                        <div className="text-[11.5px] text-slate-600 leading-tight mt-0.5 max-w-sm">{acc.uraian}</div>
                        {!isValid && <div className="text-[10px] text-rose-600 font-semibold mt-1">⚠️ Peringatan: Total RAK (Rp {totalBulan.toLocaleString()}) tidak sama dengan Pagu (Rp {acc.anggaran_tahun.toLocaleString()})</div>}
                      </td>
                      <td className="px-3 py-3 text-xs font-bold text-slate-600 text-right whitespace-nowrap border-r border-slate-100">
                        Rp {acc.anggaran_tahun.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-extrabold text-indigo-700 text-right whitespace-nowrap bg-indigo-50/30 border-r border-indigo-100/50">
                        Rp {anggaranTersedia.toLocaleString()}
                      </td>
                      <td className="px-3 py-3 text-xs font-semibold text-amber-500 text-right whitespace-nowrap border-r border-slate-100">
                        Rp {komitmen.toLocaleString()}
                      </td>
                      <td className="px-3 py-3 text-xs font-semibold text-rose-500 text-right whitespace-nowrap border-r border-slate-100">
                        Rp {realisasi.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-emerald-600 text-right whitespace-nowrap">
                        Rp {sisa.toLocaleString()}
                      </td>
                    </tr>
                    );
                    return rows;
                  }, [])}
                </tbody>
              </table>
            </div>
            
            <div className="bg-amber-50 border-t border-amber-100 px-6 py-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                <div className="text-xs text-amber-800 leading-relaxed">
                  <span className="font-bold block mb-0.5">Catatan Penting SIPD:</span>
                  Anggaran Tersedia pada bulan <b>{['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'][currentMonth-1]}</b> merupakan akumulasi RAK dari bulan Januari hingga bulan tersebut (prinsip Rollover Kas). Pastikan ketersediaan anggaran sebelum menerbitkan Surat Penetapan / SPPBJ.
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
