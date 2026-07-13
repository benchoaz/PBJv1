import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SmartRAKGrid({ dpaAccounts = [], satkerId, packageMetadata, dpaRincian }) {
  const { user } = useAuth();
  const [rakAccounts, setRakAccounts] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize RAK data
  useEffect(() => {
    const fetchRak = async () => {
      setIsLoading(true);
      try {
        const idSatker = satkerId || user?.idSatker || '67081';
        const res = await fetch(`/api/rak/accounts?satker_id=${idSatker}&tahun=${new Date().getFullYear()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.accounts) {
            const rakMap = {};
            const fallbackMap = {};
            data.accounts.forEach(acc => {
              const key = `${acc.kode_rekening}-${acc.sub_kegiatan || ''}`.trim();
              rakMap[key] = acc;
              fallbackMap[acc.kode_rekening] = acc;
            });
            
            // Merge with current DPA accounts
            const initialRak = {};
            dpaAccounts.forEach(acc => {
              const targetSubKegiatan = packageMetadata?.sub_kegiatan || acc.sub_kegiatan || '';
              const key = `${acc.account}-${targetSubKegiatan}`.trim();
              const existing = rakMap[key] || fallbackMap[acc.account];
              
              if (existing) {
                initialRak[acc.account] = { 
                  ...existing,
                  anggaran_tahun: acc.pagu, // ensure pagu matches current DPA
                  program: packageMetadata?.program || existing.program || '',
                  kegiatan: packageMetadata?.kegiatan || existing.kegiatan || '',
                  sub_kegiatan: targetSubKegiatan
                };
              } else {
                initialRak[acc.account] = {
                  kode_rekening: acc.account,
                  uraian: acc.name,
                  anggaran_tahun: acc.pagu,
                  program: packageMetadata?.program || acc.program || '',
                  kegiatan: packageMetadata?.kegiatan || acc.kegiatan || '',
                  sub_kegiatan: packageMetadata?.sub_kegiatan || acc.sub_kegiatan || '', // Will be grouped by this
                  bulan_jan: 0, bulan_feb: 0, bulan_mar: 0,
                  bulan_apr: 0, bulan_mei: 0, bulan_jun: 0,
                  bulan_jul: 0, bulan_ags: 0, bulan_sep: 0,
                  bulan_okt: 0, bulan_nov: 0, bulan_des: 0,
                };
              }
            });
            setRakAccounts(initialRak);
          }
        }
      } catch (err) {
        console.error('Failed to load RAK:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (dpaAccounts.length > 0) {
      fetchRak();
    }
  }, [dpaAccounts, satkerId, user]);

  const handleInputChange = (accountCode, field, value) => {
    setRakAccounts(prev => ({
      ...prev,
      [accountCode]: {
        ...prev[accountCode],
        [field]: value
      }
    }));
  };

  // Auto-save mechanism (Debounced)
  useEffect(() => {
    if (Object.keys(rakAccounts).length === 0 || isLoading || isSaving) return;

    const timeoutId = setTimeout(() => {
      const idSatker = satkerId || user?.idSatker || '67081';
      const payload = {
        satker_id: idSatker,
        tahun_anggaran: new Date().getFullYear(),
        nama_skpd: user?.department || 'Satuan Kerja',
        nilai_anggaran: dpaAccounts.reduce((sum, acc) => sum + (acc.pagu || 0), 0),
        file_name: 'DPA-Integrasi-SmartRAK',
        accounts: Object.values(rakAccounts).map(acc => ({
          ...acc,
          bulan_jan: parseFloat(acc.bulan_jan) || 0,
          bulan_feb: parseFloat(acc.bulan_feb) || 0,
          bulan_mar: parseFloat(acc.bulan_mar) || 0,
          bulan_apr: parseFloat(acc.bulan_apr) || 0,
          bulan_mei: parseFloat(acc.bulan_mei) || 0,
          bulan_jun: parseFloat(acc.bulan_jun) || 0,
          bulan_jul: parseFloat(acc.bulan_jul) || 0,
          bulan_ags: parseFloat(acc.bulan_ags) || 0,
          bulan_sep: parseFloat(acc.bulan_sep) || 0,
          bulan_okt: parseFloat(acc.bulan_okt) || 0,
          bulan_nov: parseFloat(acc.bulan_nov) || 0,
          bulan_des: parseFloat(acc.bulan_des) || 0,
        }))
      };

      fetch('/api/rak/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(err => console.error('Auto-save RAK failed:', err));
    }, 1500); // 1.5 seconds debounce

    return () => clearTimeout(timeoutId);
  }, [rakAccounts, isLoading, isSaving, satkerId, user, dpaAccounts]);

  const cleanUraian = (uraian) => {
    if (!uraian) return '';
    const junkRegex = /(Nama\s+[A-Z\s]+,\s*(SE|ST|MM|M\.Si|S\.Pd|M\.Pd|S\.E\.|S\.T\.|S\.Kom)|Tolak Ukur|Dana Yang|Jumlah Laporan|Kinerja|Indikator|Sumber Dana).*/i;
    let match = uraian.match(junkRegex);
    if (match) {
      const idx = uraian.search(junkRegex);
      return uraian.substring(0, idx).trim();
    }
    return uraian.trim();
  };

  const bagiRata12Bulan = (accountCode) => {
    const acc = rakAccounts[accountCode];
    if (!acc || acc.anggaran_tahun <= 0) return;
    
    const perBulan = Math.floor(acc.anggaran_tahun / 12);
    const sisa = acc.anggaran_tahun - (perBulan * 12);
    
    setRakAccounts(prev => ({
      ...prev,
      [accountCode]: {
        ...prev[accountCode],
        bulan_jan: perBulan + sisa, // Tambahkan sisa pembagian ke Januari
        bulan_feb: perBulan, bulan_mar: perBulan, bulan_apr: perBulan,
        bulan_mei: perBulan, bulan_jun: perBulan, bulan_jul: perBulan,
        bulan_ags: perBulan, bulan_sep: perBulan, bulan_okt: perBulan,
        bulan_nov: perBulan, bulan_des: perBulan,
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const idSatker = satkerId || user?.idSatker || '67081';
      const payload = {
        satker_id: idSatker,
        tahun_anggaran: new Date().getFullYear(),
        nama_skpd: user?.department || 'Satuan Kerja',
        nilai_anggaran: dpaAccounts.reduce((sum, acc) => sum + (acc.pagu || 0), 0),
        file_name: 'DPA-Integrasi-SmartRAK',
        accounts: Object.values(rakAccounts).map(acc => ({
          ...acc,
          bulan_jan: parseFloat(acc.bulan_jan) || 0,
          bulan_feb: parseFloat(acc.bulan_feb) || 0,
          bulan_mar: parseFloat(acc.bulan_mar) || 0,
          bulan_apr: parseFloat(acc.bulan_apr) || 0,
          bulan_mei: parseFloat(acc.bulan_mei) || 0,
          bulan_jun: parseFloat(acc.bulan_jun) || 0,
          bulan_jul: parseFloat(acc.bulan_jul) || 0,
          bulan_ags: parseFloat(acc.bulan_ags) || 0,
          bulan_sep: parseFloat(acc.bulan_sep) || 0,
          bulan_okt: parseFloat(acc.bulan_okt) || 0,
          bulan_nov: parseFloat(acc.bulan_nov) || 0,
          bulan_des: parseFloat(acc.bulan_des) || 0,
        }))
      };

      const res = await fetch('/api/rak/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        alert('Master Data RAK berhasil disimpan/diperbarui!');
      } else {
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData.error || errData.message || `HTTP ${res.status}`;
        alert(`Gagal menyimpan Master Data RAK: ${errMsg}`);
      }
    } catch (err) {
      console.error(err);
      alert(`Terjadi kesalahan: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Group by Sub Kegiatan
  const groupedAccounts = Object.values(rakAccounts).reduce((acc, curr) => {
    const sub = curr.sub_kegiatan || packageMetadata?.sub_kegiatan || 'Sub Kegiatan Belum Ditentukan';
    if (!acc[sub]) acc[sub] = [];
    acc[sub].push(curr);
    return acc;
  }, {});

  if (dpaAccounts.length === 0) return null;

  return (
    <div className="mt-8 border-t border-slate-200 pt-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Distribusi Rencana Anggaran Kas (RAK)</h3>
          <p className="text-xs text-slate-500">Tentukan jadwal pencairan kas per bulan berdasarkan Pagu DPA untuk diintegrasikan ke SIPD/Master Data RAK.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl flex items-center gap-2"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Simpan Master RAK
        </button>
      </div>

      {/* Informasi Metadata */}
      <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-3">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Kode Program</div>
            <div className="text-[11px] font-semibold text-slate-800">{packageMetadata?.nomor_program || '-'}</div>
          </div>
          <div className="md:col-span-9">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Nama Program</div>
            <div className="text-[11px] font-semibold text-slate-800">{packageMetadata?.program || '-'}</div>
          </div>
          <div className="md:col-span-3">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Kode Kegiatan</div>
            <div className="text-[11px] font-semibold text-slate-800">{packageMetadata?.nomor_kegiatan || '-'}</div>
          </div>
          <div className="md:col-span-9">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Nama Kegiatan</div>
            <div className="text-[11px] font-semibold text-slate-800">{packageMetadata?.kegiatan || '-'}</div>
          </div>
          <div className="md:col-span-3">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Kode Sub Kegiatan</div>
            <div className="text-[11px] font-semibold text-slate-800">{packageMetadata?.nomor_sub_kegiatan || '-'}</div>
          </div>
          <div className="md:col-span-4">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Nama Sub Kegiatan</div>
            <div className="text-[11px] font-semibold text-slate-800">{packageMetadata?.sub_kegiatan || '-'}</div>
          </div>
          <div className="md:col-span-3">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Sumber Dana</div>
            <div className="text-[11px] font-semibold text-slate-800">{packageMetadata?.sumber_dana || '-'}</div>
          </div>
          <div className="md:col-span-2 border-l border-slate-200 pl-4">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Nilai Anggaran</div>
            <div className="text-sm font-bold text-indigo-700">Rp {dpaAccounts.reduce((sum, acc) => sum + (acc.pagu || 0), 0).toLocaleString()}</div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin text-indigo-500 mx-auto" /></div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedAccounts).map(([subKegiatan, accounts]) => (
            <div key={subKegiatan} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 w-full">
                  <span className="text-lg">📁</span>
                  <input
                    type="text"
                    placeholder="Nama Sub Kegiatan..."
                    value={subKegiatan === 'Sub Kegiatan Belum Ditentukan' ? '' : subKegiatan}
                    onChange={(e) => {
                      const newSub = e.target.value;
                      accounts.forEach(acc => handleInputChange(acc.kode_rekening, 'sub_kegiatan', newSub));
                    }}
                    className="font-bold text-slate-800 text-sm bg-transparent border-b border-dashed border-slate-300 focus:border-indigo-500 focus:outline-none px-1 w-full"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-[10px] font-bold text-slate-600 uppercase text-center border-b border-slate-200">
                      <th rowSpan={3} className="px-3 py-2 text-left align-middle border-r border-slate-200 min-w-[200px]">Kode & Uraian</th>
                      <th rowSpan={3} className="px-3 py-2 text-right align-middle border-r border-slate-200">Anggaran Tahun Ini</th>
                      <th colSpan={6} className="px-2 py-1.5 border-b border-r border-slate-200 bg-indigo-50/60 text-indigo-800">Semester I</th>
                      <th colSpan={6} className="px-2 py-1.5 border-b border-r border-slate-200 bg-emerald-50/60 text-emerald-800">Semester II</th>
                      <th rowSpan={3} className="px-3 py-2 text-right align-middle border-r border-slate-200">Sisa Belum</th>
                      <th rowSpan={3} className="px-3 py-2 text-center align-middle">Aksi</th>
                    </tr>
                    <tr className="bg-slate-50 text-[9px] font-bold text-slate-500 uppercase text-center border-b border-slate-200">
                      <th colSpan={3} className="px-2 py-1 border-b border-r border-slate-200 bg-indigo-50/30">Triwulan I</th>
                      <th colSpan={3} className="px-2 py-1 border-b border-r border-slate-200 bg-indigo-50/30">Triwulan II</th>
                      <th colSpan={3} className="px-2 py-1 border-b border-r border-slate-200 bg-emerald-50/30">Triwulan III</th>
                      <th colSpan={3} className="px-2 py-1 border-b border-r border-slate-200 bg-emerald-50/30">Triwulan IV</th>
                    </tr>
                    <tr className="bg-white text-[9px] font-semibold text-slate-500 uppercase text-center border-b border-slate-200">
                      <th className="px-1 py-1.5 border-r border-slate-100 w-16">Jan</th>
                      <th className="px-1 py-1.5 border-r border-slate-100 w-16">Feb</th>
                      <th className="px-1 py-1.5 border-r border-slate-200 w-16 bg-slate-50/50">Mar</th>
                      <th className="px-1 py-1.5 border-r border-slate-100 w-16">Apr</th>
                      <th className="px-1 py-1.5 border-r border-slate-100 w-16">Mei</th>
                      <th className="px-1 py-1.5 border-r border-slate-200 w-16 bg-slate-50/50">Jun</th>
                      <th className="px-1 py-1.5 border-r border-slate-100 w-16">Jul</th>
                      <th className="px-1 py-1.5 border-r border-slate-100 w-16">Ags</th>
                      <th className="px-1 py-1.5 border-r border-slate-200 w-16 bg-slate-50/50">Sep</th>
                      <th className="px-1 py-1.5 border-r border-slate-100 w-16">Okt</th>
                      <th className="px-1 py-1.5 border-r border-slate-100 w-16">Nov</th>
                      <th className="px-1 py-1.5 border-r border-slate-200 w-16 bg-slate-50/50">Des</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {accounts.map(acc => {
                      const totalBulan = parseFloat(acc.bulan_jan||0) + parseFloat(acc.bulan_feb||0) + parseFloat(acc.bulan_mar||0) + parseFloat(acc.bulan_apr||0) + parseFloat(acc.bulan_mei||0) + parseFloat(acc.bulan_jun||0) + parseFloat(acc.bulan_jul||0) + parseFloat(acc.bulan_ags||0) + parseFloat(acc.bulan_sep||0) + parseFloat(acc.bulan_okt||0) + parseFloat(acc.bulan_nov||0) + parseFloat(acc.bulan_des||0);
                      const sisa = acc.anggaran_tahun - totalBulan;
                      const isMinus = sisa < 0;
                      const rincianItems = dpaRincian?.[acc.kode_rekening] || [];
                      
                      return (
                        <React.Fragment key={acc.kode_rekening}>
                          <tr className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-3 py-3 border-r border-slate-100">
                              <div className="font-mono text-[10px] font-bold text-slate-700">{acc.kode_rekening}</div>
                              <div className="text-[11px] text-slate-600 w-48 leading-tight mt-0.5">{cleanUraian(acc.uraian)}</div>
                            </td>
                            <td className="px-3 py-3 text-right text-[11px] font-bold text-indigo-700 border-r border-slate-100">
                              Rp {(acc.anggaran_tahun||0).toLocaleString()}
                            </td>
                            
                            {/* TW 1 */}
                            <td className="px-1 py-2 text-center"><input type="number" className="w-[60px] text-right text-[10px] border border-slate-200 rounded px-1 py-1 focus:ring-1 focus:ring-indigo-500 outline-none" value={acc.bulan_jan === 0 ? 0 : (acc.bulan_jan || '')} onChange={(e) => handleInputChange(acc.kode_rekening, 'bulan_jan', e.target.value === '' ? '' : Number(e.target.value))} /></td>
                            <td className="px-1 py-2 text-center"><input type="number" className="w-[60px] text-right text-[10px] border border-slate-200 rounded px-1 py-1 focus:ring-1 focus:ring-indigo-500 outline-none" value={acc.bulan_feb === 0 ? 0 : (acc.bulan_feb || '')} onChange={(e) => handleInputChange(acc.kode_rekening, 'bulan_feb', e.target.value === '' ? '' : Number(e.target.value))} /></td>
                            <td className="px-1 py-2 text-center border-r border-slate-200 bg-slate-50/30"><input type="number" className="w-[60px] text-right text-[10px] border border-slate-200 rounded px-1 py-1 focus:ring-1 focus:ring-indigo-500 outline-none" value={acc.bulan_mar === 0 ? 0 : (acc.bulan_mar || '')} onChange={(e) => handleInputChange(acc.kode_rekening, 'bulan_mar', e.target.value === '' ? '' : Number(e.target.value))} /></td>
                            
                            {/* TW 2 */}
                            <td className="px-1 py-2 text-center"><input type="number" className="w-[60px] text-right text-[10px] border border-slate-200 rounded px-1 py-1 focus:ring-1 focus:ring-indigo-500 outline-none" value={acc.bulan_apr === 0 ? 0 : (acc.bulan_apr || '')} onChange={(e) => handleInputChange(acc.kode_rekening, 'bulan_apr', e.target.value === '' ? '' : Number(e.target.value))} /></td>
                            <td className="px-1 py-2 text-center"><input type="number" className="w-[60px] text-right text-[10px] border border-slate-200 rounded px-1 py-1 focus:ring-1 focus:ring-indigo-500 outline-none" value={acc.bulan_mei === 0 ? 0 : (acc.bulan_mei || '')} onChange={(e) => handleInputChange(acc.kode_rekening, 'bulan_mei', e.target.value === '' ? '' : Number(e.target.value))} /></td>
                            <td className="px-1 py-2 text-center border-r border-slate-200 bg-slate-50/30"><input type="number" className="w-[60px] text-right text-[10px] border border-slate-200 rounded px-1 py-1 focus:ring-1 focus:ring-indigo-500 outline-none" value={acc.bulan_jun === 0 ? 0 : (acc.bulan_jun || '')} onChange={(e) => handleInputChange(acc.kode_rekening, 'bulan_jun', e.target.value === '' ? '' : Number(e.target.value))} /></td>
                            
                            {/* TW 3 */}
                            <td className="px-1 py-2 text-center"><input type="number" className="w-[60px] text-right text-[10px] border border-slate-200 rounded px-1 py-1 focus:ring-1 focus:ring-indigo-500 outline-none" value={acc.bulan_jul === 0 ? 0 : (acc.bulan_jul || '')} onChange={(e) => handleInputChange(acc.kode_rekening, 'bulan_jul', e.target.value === '' ? '' : Number(e.target.value))} /></td>
                            <td className="px-1 py-2 text-center"><input type="number" className="w-[60px] text-right text-[10px] border border-slate-200 rounded px-1 py-1 focus:ring-1 focus:ring-indigo-500 outline-none" value={acc.bulan_ags === 0 ? 0 : (acc.bulan_ags || '')} onChange={(e) => handleInputChange(acc.kode_rekening, 'bulan_ags', e.target.value === '' ? '' : Number(e.target.value))} /></td>
                            <td className="px-1 py-2 text-center border-r border-slate-200 bg-slate-50/30"><input type="number" className="w-[60px] text-right text-[10px] border border-slate-200 rounded px-1 py-1 focus:ring-1 focus:ring-indigo-500 outline-none" value={acc.bulan_sep === 0 ? 0 : (acc.bulan_sep || '')} onChange={(e) => handleInputChange(acc.kode_rekening, 'bulan_sep', e.target.value === '' ? '' : Number(e.target.value))} /></td>
                            
                            {/* TW 4 */}
                            <td className="px-1 py-2 text-center"><input type="number" className="w-[60px] text-right text-[10px] border border-slate-200 rounded px-1 py-1 focus:ring-1 focus:ring-indigo-500 outline-none" value={acc.bulan_okt === 0 ? 0 : (acc.bulan_okt || '')} onChange={(e) => handleInputChange(acc.kode_rekening, 'bulan_okt', e.target.value === '' ? '' : Number(e.target.value))} /></td>
                            <td className="px-1 py-2 text-center"><input type="number" className="w-[60px] text-right text-[10px] border border-slate-200 rounded px-1 py-1 focus:ring-1 focus:ring-indigo-500 outline-none" value={acc.bulan_nov === 0 ? 0 : (acc.bulan_nov || '')} onChange={(e) => handleInputChange(acc.kode_rekening, 'bulan_nov', e.target.value === '' ? '' : Number(e.target.value))} /></td>
                            <td className="px-1 py-2 text-center border-r border-slate-200 bg-slate-50/30"><input type="number" className="w-[60px] text-right text-[10px] border border-slate-200 rounded px-1 py-1 focus:ring-1 focus:ring-indigo-500 outline-none" value={acc.bulan_des === 0 ? 0 : (acc.bulan_des || '')} onChange={(e) => handleInputChange(acc.kode_rekening, 'bulan_des', e.target.value === '' ? '' : Number(e.target.value))} /></td>

                            <td className="px-3 py-2 text-right text-[11px] font-bold border-r border-slate-100">
                              <span className={isMinus ? 'text-rose-600' : sisa === 0 ? 'text-emerald-600' : 'text-amber-600'}>
                                Rp {sisa.toLocaleString()}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                onClick={() => bagiRata12Bulan(acc.kode_rekening)}
                                className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold px-2.5 py-1.5 rounded-lg transition-colors w-full"
                              >
                                Bagi 12
                              </button>
                            </td>
                          </tr>
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
