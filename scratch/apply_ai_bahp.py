import re

with open("frontend/src/components/ProcurementPanel.jsx", "r") as f:
    code = f.read()

# 1. State
state_str = """  const [isSubmittingBahp, setIsSubmittingBahp] = useState(false);"""
new_state = state_str + """
  const [refinedBahpIntro, setRefinedBahpIntro] = useState('');
  const [refinedBahpExceptions, setRefinedBahpExceptions] = useState('');
  const [refinedBahpItemNotes, setRefinedBahpItemNotes] = useState('');
  const [refinedBahpConclusion, setRefinedBahpConclusion] = useState('');
  const [isRefiningBahp, setIsRefiningBahp] = useState(false);"""
code = code.replace(state_str, new_state)

# 2. Function
func_str = """  const [checkedItems, setCheckedItems] = useState(() => {"""
new_func = """  const handleRefineBahp = async () => {
    const activeItems = getPackageItems(submittedPack).filter(i => checkedItems[i.no]);
    const hasExceptions = activeItems.some(i => {
      const s = (negotiatedItems[i.no] || {}).itemStatus;
      return s === 'Stok Kurang' || s === 'Tidak Tersedia';
    });

    const items = activeItems.map(item => {
      const nego = negotiatedItems[item.no] || {};
      return {
        item_name: item.name,
        qty: item.qty,
        vendor_name: nego.vendor || item.vendor || '',
        initial_price: parseFloat(nego.tayang || item.katalogPrice || 0),
        negotiated_price: parseFloat(nego.price || 0),
        status: nego.itemStatus || 'Tersedia',
        pp_notes: nego.ppNotes || ''
      };
    });

    setIsRefiningBahp(true);
    try {
      const res = await fetch('http://localhost:3000/api/ai/refine-bahp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package_type: packageType,
          delivery_location: deliveryLocation || 'TBA',
          has_exceptions: hasExceptions,
          exception_notes: exceptionNotes,
          items: items,
          unit_name: submittedPack ? submittedPack.senderDepartment : 'Kecamatan Besuk',
          document_date: new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        })
      });
      if (!res.ok) throw new Error('API AI Error');
      const data = await res.json();
      if (data.success) {
        if (data.refined_intro) setRefinedBahpIntro(data.refined_intro);
        if (data.refined_exceptions) setRefinedBahpExceptions(data.refined_exceptions);
        if (data.refined_item_notes) setRefinedBahpItemNotes(data.refined_item_notes);
        if (data.refined_conclusion) setRefinedBahpConclusion(data.refined_conclusion);
        alert('✅ BAHP berhasil disempurnakan dengan bahasa hukum oleh AI!');
      } else {
        throw new Error(data.error || 'Gagal menyempurnakan BAHP');
      }
    } catch (e) {
      alert('❌ Error AI: ' + e.message + '\\nPastikan API Key sudah diset di Pengaturan.');
    } finally {
      setIsRefiningBahp(false);
    }
  };

  const [checkedItems, setCheckedItems] = useState(() => {"""
code = code.replace(func_str, new_func)

# 3. UI Button
btn_str = """            <button 
              onClick={() => window.print()} """
new_btn = """            <button 
              onClick={handleRefineBahp} 
              disabled={isRefiningBahp}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isRefiningBahp ? '⏳ Memproses AI...' : '🤖 Sempurnakan dengan AI'}
            </button>
            <button 
              onClick={() => window.print()} """
code = code.replace(btn_str, new_btn)

# 4. Intro text
intro_old = """                <p>
                  Pada hari ini, <strong>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>, Pejabat Pengadaan pada Satuan Kerja <strong>{submittedPack ? submittedPack.senderDepartment : 'Kecamatan Besuk'}</strong> telah melakukan proses pencarian, komparasi harga, negosiasi teknis, serta verifikasi dokumentasi e-Katalog Inaproc LKPP untuk paket pekerjaan:
                </p>"""
intro_new = """                {refinedBahpIntro ? (
                  <p className="whitespace-pre-wrap">{refinedBahpIntro}</p>
                ) : (
                  <p>
                    Pada hari ini, <strong>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>, Pejabat Pengadaan pada Satuan Kerja <strong>{submittedPack ? submittedPack.senderDepartment : 'Kecamatan Besuk'}</strong> telah melakukan proses pencarian, komparasi harga, negosiasi teknis, serta verifikasi dokumentasi e-Katalog Inaproc LKPP untuk paket pekerjaan:
                  </p>
                )}"""
code = code.replace(intro_old, intro_new)

# 5. Conclusion text
conc_old = """                <p className="mt-8 font-sans text-[10px] text-slate-500 italic">
                  Demikian Berita Acara Hasil Pemilihan (BAHP) ini dibuat secara elektronik oleh Pejabat Pengadaan untuk menjadi dokumen pertanggungjawaban dalam audit belanja dinas e-Purchasing.
                </p>"""
conc_new = """                {refinedBahpExceptions && (
                  <>
                    <div className="font-bold text-[11px] uppercase tracking-wide border-b border-slate-300 pb-1 mt-6 font-sans text-rose-800">Catatan Penyimpangan DPP / Pengecualian</div>
                    <div className="text-[10px] font-sans mt-2 whitespace-pre-wrap text-justify bg-rose-50 border border-rose-200 p-3 rounded text-rose-900">{refinedBahpExceptions}</div>
                  </>
                )}

                {refinedBahpItemNotes && (
                  <>
                    <div className="font-bold text-[11px] uppercase tracking-wide border-b border-slate-300 pb-1 mt-6 font-sans text-indigo-850">Ringkasan Hasil Negosiasi</div>
                    <div className="text-[10px] font-sans mt-2 whitespace-pre-wrap text-justify bg-indigo-50/50 p-3 rounded">{refinedBahpItemNotes}</div>
                  </>
                )}

                {refinedBahpConclusion ? (
                  <p className="mt-8 font-sans text-[10px] text-slate-800 text-justify whitespace-pre-wrap border-t border-slate-300 pt-4">
                    {refinedBahpConclusion}
                  </p>
                ) : (
                  <p className="mt-8 font-sans text-[10px] text-slate-500 italic border-t border-slate-300 pt-4">
                    Demikian Berita Acara Hasil Pemilihan (BAHP) ini dibuat secara elektronik oleh Pejabat Pengadaan untuk menjadi dokumen pertanggungjawaban dalam audit belanja dinas e-Purchasing.
                  </p>
                )}"""
code = code.replace(conc_old, conc_new)


with open("frontend/src/components/ProcurementPanel.jsx", "w") as f:
    f.write(code)

print("Applied AI BAHP refinement successfully!")
