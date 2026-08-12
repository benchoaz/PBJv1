import React, { useState, useEffect } from 'react';
import { Copy, Check, Calculator, ShieldCheck, AlertTriangle, Sparkles, Info } from 'lucide-react';

export default function InaprocTaxHelper({
  dpaPrice = 15900,
  qty = 1,
  unit = 'Biji',
  itemName = '',
  onApplyPrice = null,
  compact = false
}) {
  // Mode PPN INAPROC:
  // 'inaproc_12': Golongan PPN 12% Resmi INAPROC (11/12 x DPP x 12% = 11% Efektif)
  // 'pure_12': PPN 12% Murni (12% Efektif)
  // 'pure_11': PPN 11% Murni (11% Efektif)
  // 'non_pkp': Non-PKP (0%)
  const [taxMode, setTaxMode] = useState('inaproc_12');
  const [customDpaPrice, setCustomDpaPrice] = useState(dpaPrice);
  const [copiedKey, setCopiedKey] = useState(null);

  useEffect(() => {
    setCustomDpaPrice(dpaPrice);
  }, [dpaPrice]);

  const priceNum = parseFloat(customDpaPrice) || 0;
  const qtyNum = parseFloat(qty) || 1;

  // Hitung multiplier & PPN berdasarkan taxMode
  let effectiveRate = 11;
  let labelFormula = '(11/12 x DPP) x 12% = 11% Efektif';

  if (taxMode === 'inaproc_12') {
    effectiveRate = 11;
    labelFormula = 'Golongan PPN 12% INAPROC (DPP Lain: 11/12 x 12% = 11% Efektif)';
  } else if (taxMode === 'pure_12') {
    effectiveRate = 12;
    labelFormula = 'PPN 12% Murni (12% Efektif)';
  } else if (taxMode === 'pure_11') {
    effectiveRate = 11;
    labelFormula = 'PPN 11% Murni (11% Efektif)';
  } else if (taxMode === 'non_pkp') {
    effectiveRate = 0;
    labelFormula = 'Non-PKP / Bebas Pajak (0%)';
  }

  const multiplier = 1 + (effectiveRate / 100);
  const maxDpp = Math.floor(priceNum / multiplier);
  const maxPpn = maxDpp * (effectiveRate / 100);
  const maxTotalSatuan = maxDpp + maxPpn;
  const maxGrandTotal = maxTotalSatuan * qtyNum;
  const dpaGrandTotal = priceNum * qtyNum;

  // Skenario penawaran hemat
  const dpp2pct = Math.floor((priceNum * 0.98) / multiplier);
  const total2pctSatuan = dpp2pct * multiplier;

  const dpp5pct = Math.floor((priceNum * 0.95) / multiplier);
  const total5pctSatuan = dpp5pct * multiplier;

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text.toString());
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (compact) {
    return (
      <div className="bg-slate-900 text-white rounded-xl p-3 shadow-lg border border-slate-700 text-xs space-y-2">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="font-extrabold flex items-center gap-1.5 text-indigo-300">
            <Calculator className="w-3.5 h-3.5 text-indigo-400" />
            <span>Kalkulator INAPROC</span>
          </div>
          <select
            value={taxMode}
            onChange={(e) => setTaxMode(e.target.value)}
            className="bg-slate-800 text-[10px] font-bold text-slate-200 border border-slate-700 rounded px-1.5 py-0.5"
          >
            <option value="inaproc_12">INAPROC 12% (11/12)</option>
            <option value="pure_12">PPN 12% Murni</option>
            <option value="pure_11">PPN 11%</option>
            <option value="non_pkp">Non-PKP (0%)</option>
          </select>
        </div>

        <div className="flex items-center justify-between bg-slate-800/80 p-2 rounded-lg border border-slate-700">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Ketik di INAPROC:</div>
            <div className="text-sm font-mono font-black text-emerald-400">
              Rp {maxDpp.toLocaleString('id-ID')}
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleCopy(maxDpp, 'compact_dpp')}
            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow transition-all active:scale-95 cursor-pointer"
          >
            {copiedKey === 'compact_dpp' ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3 text-white" />}
            <span>{copiedKey === 'compact_dpp' ? 'Tersalin!' : 'Salin Angka'}</span>
          </button>
        </div>

        <div className="text-[10px] text-slate-400 flex justify-between font-mono pt-0.5">
          <span>PPN INAPROC: Rp {Math.round(maxPpn).toLocaleString('id-ID')}</span>
          <span className="text-emerald-400 font-bold">Total Akhir: Rp {Math.round(maxTotalSatuan).toLocaleString('id-ID')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-indigo-100 rounded-2xl shadow-xl overflow-hidden animate-fade-in my-3">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="bg-indigo-600/30 p-2 rounded-xl border border-indigo-500/40 shrink-0">
            <Calculator className="w-5 h-5 text-indigo-300" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-indigo-100 flex items-center gap-1.5">
              <span>Kalkulator Tax Guide INAPROC E-Katalog</span>
              <span className="bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 text-[9px] px-2 py-0.5 rounded-full font-mono">
                Anti-Melebihi DPA
              </span>
            </h4>
            <p className="text-[10.5px] text-slate-300 font-normal">
              {itemName ? `Panduan Nego untuk: ${itemName}` : 'Hitung otomatis nilai DPP sebelum pajak agar total akhir aman dari temuan audit.'}
            </p>
          </div>
        </div>

        {/* Jenis Pajak Selector */}
        <div className="flex items-center gap-1.5 bg-slate-800/90 p-1.5 rounded-xl border border-slate-700 shrink-0 self-start sm:self-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Metode Pajak:</span>
          {[
            { id: 'inaproc_12', label: 'Golongan PPN 12% INAPROC (Resmi)' },
            { id: 'pure_12', label: 'PPN 12% Murni' },
            { id: 'pure_11', label: 'PPN 11%' },
            { id: 'non_pkp', label: 'Non-PKP (0%)' }
          ].map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTaxMode(item.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all ${
                taxMode === item.id
                  ? 'bg-indigo-600 text-white shadow-sm scale-102'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Formula Info Banner */}
      <div className="bg-indigo-900/90 text-indigo-100 text-[11px] px-4 py-2 flex items-center gap-2 border-b border-indigo-800">
        <Info className="w-4 h-4 text-indigo-300 shrink-0" />
        <span>Formula Resmi Portal INAPROC: <strong className="font-mono text-emerald-300">{labelFormula}</strong></span>
      </div>

      {/* Body Content */}
      <div className="p-5 space-y-4 bg-slate-50/50">
        {/* Banner Rekomendasi Utama */}
        <div className="bg-emerald-50 border-2 border-emerald-300/80 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-xs font-black text-emerald-900 uppercase tracking-wider">
                ANGKA EKSAT HARUS DIKETIK DI INAPROC (SEBELUM PAJAK / DPP)
              </span>
            </div>
            <div className="text-2xl font-black font-mono text-emerald-700 flex items-baseline gap-2">
              <span>Rp {maxDpp.toLocaleString('id-ID')}</span>
              <span className="text-xs font-sans font-bold text-slate-500">/ {unit}</span>
            </div>
            <p className="text-[11px] text-emerald-800 font-medium leading-relaxed">
              Ketik angka <strong className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-300">{maxDpp}</strong> pada kolom <em>"Nego Harga Sebelum Pajak"</em> di portal INAPROC.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto shrink-0">
            <button
              type="button"
              onClick={() => handleCopy(maxDpp, 'main_dpp')}
              className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              {copiedKey === 'main_dpp' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedKey === 'main_dpp' ? 'Tersalin ke Clipboard!' : 'Salin Angka DPP'}</span>
            </button>
            {onApplyPrice && (
              <button
                type="button"
                onClick={() => onApplyPrice(maxDpp, maxTotalSatuan)}
                className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Gunakan di Form</span>
              </button>
            )}
          </div>
        </div>

        {/* Detail Rincian Komponen & Skenario */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Kolom Kiri: Breakdown Pajak */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5 shadow-sm">
            <h5 className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
              Breakdown Komponen Pajak INAPROC
            </h5>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Harga DPA (Nett / Pas):</span>
                <strong className="text-slate-800">Rp {priceNum.toLocaleString('id-ID')}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Nego DPP Sebelum Pajak:</span>
                <strong className="text-emerald-700">Rp {maxDpp.toLocaleString('id-ID')}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>PPN INAPROC:</span>
                <strong className="text-slate-700">Rp {Math.round(maxPpn).toLocaleString('id-ID')}</strong>
              </div>
              <div className="border-t border-dashed border-slate-200 pt-1.5 flex justify-between font-bold text-slate-900">
                <span>Total Satuan Setelah Pajak:</span>
                <span className="text-indigo-950 font-black">Rp {Math.round(maxTotalSatuan).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                <span>Total Grand ({qtyNum} {unit}):</span>
                <strong className="text-slate-900 font-mono">Rp {Math.round(maxGrandTotal).toLocaleString('id-ID')}</strong>
              </div>
            </div>
            <div className="pt-1">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold ${
                maxGrandTotal <= dpaGrandTotal ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {maxGrandTotal <= dpaGrandTotal ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> : <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                <span>{maxGrandTotal <= dpaGrandTotal ? '✅ 100% Sesuai DPA (Safe Audit)' : '⚠️ Melebihi Pagu DPA'}</span>
              </span>
            </div>
          </div>

          {/* Kolom Kanan: Skenario Penawaran Hemat */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5 shadow-sm">
            <h5 className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
              Pilihan Skenario Penawaran Tambahan
            </h5>

            <div className="space-y-2">
              {/* Opsi 1: Pas DPA */}
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="font-bold text-slate-800 block">1. Pas Batas DPA (100%)</span>
                  <span className="text-[10px] text-slate-500 font-mono">DPP: Rp {maxDpp.toLocaleString('id-ID')}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(maxDpp, 'opt_max')}
                  className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-[11px] font-bold text-slate-700 flex items-center gap-1 transition-all cursor-pointer"
                >
                  {copiedKey === 'opt_max' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
                  <span>{copiedKey === 'opt_max' ? 'Salin' : 'Salin'}</span>
                </button>
              </div>

              {/* Opsi 2: Hemat 2% */}
              <div className="flex items-center justify-between bg-indigo-50/60 p-2.5 rounded-lg border border-indigo-100 text-xs">
                <div>
                  <span className="font-bold text-indigo-950 block">2. Target Hemat 2%</span>
                  <span className="text-[10px] text-slate-500 font-mono">DPP: Rp {dpp2pct.toLocaleString('id-ID')} (Hasil: Rp {Math.round(total2pctSatuan).toLocaleString('id-ID')})</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(dpp2pct, 'opt_2pct')}
                  className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                >
                  {copiedKey === 'opt_2pct' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'opt_2pct' ? 'Salin' : 'Salin'}</span>
                </button>
              </div>

              {/* Opsi 3: Hemat 5% */}
              <div className="flex items-center justify-between bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100 text-xs">
                <div>
                  <span className="font-bold text-emerald-950 block">3. Target Hemat 5%</span>
                  <span className="text-[10px] text-slate-500 font-mono">DPP: Rp {dpp5pct.toLocaleString('id-ID')} (Hasil: Rp {Math.round(total5pctSatuan).toLocaleString('id-ID')})</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(dpp5pct, 'opt_5pct')}
                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                >
                  {copiedKey === 'opt_5pct' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'opt_5pct' ? 'Salin' : 'Salin'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
