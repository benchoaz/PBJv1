import re

with open("frontend/src/components/ProcurementPanel.jsx", "r") as f:
    code = f.read()

# 1. State
state_str = """  const [isRefiningBahp, setIsRefiningBahp] = useState(false);"""
new_state = state_str + """
  const [isRefiningException, setIsRefiningException] = useState(false);
  const [exceptionAdvice, setExceptionAdvice] = useState('');
  const [isRefiningChatNotes, setIsRefiningChatNotes] = useState(false);
  const [isRefiningVendorNote, setIsRefiningVendorNote] = useState(false);"""
if "isRefiningException" not in code:
    code = code.replace(state_str, new_state)

# 2. Handlers
func_str = """  const handleRefineBahp = async () => {"""
new_funcs = """  const handleRefineExceptionNote = async () => {
    if (!exceptionNotes.trim()) return alert('Isi catatan penyimpangan terlebih dahulu sebelum disempurnakan AI.');
    setIsRefiningException(true);
    setExceptionAdvice('');
    try {
      const activeItems = getPackageItems(submittedPack).filter(i => checkedItems[i.no]);
      const problemItems = activeItems.filter(i => {
        const s = (negotiatedItems[i.no] || {}).itemStatus;
        return s === 'Stok Kurang' || s === 'Tidak Tersedia';
      });
      const itemName = problemItems.map(i => i.name).join(', ');
      const itemStatus = problemItems.map(i => (negotiatedItems[i.no] || {}).itemStatus).join(', ');

      const res = await fetch('http://localhost:3000/api/ai/refine-exception', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_note: exceptionNotes,
          item_name: itemName || 'Barang',
          item_status: itemStatus || 'Bermasalah'
        })
      });
      if (!res.ok) throw new Error('API AI Error');
      const data = await res.json();
      if (data.success) {
        setExceptionNotes(data.refined_note);
        setExceptionAdvice(data.advice);
        if (!data.is_valid) alert('⚠️ Peringatan AI: Alasan penyimpangan mungkin kurang kuat secara hukum. Silakan baca nasihat AI di bawah kolom input.');
      } else throw new Error(data.error);
    } catch (e) {
      alert('❌ Error AI: ' + e.message);
    } finally {
      setIsRefiningException(false);
    }
  };

  const handleRefineGenericText = async (rawText, context, setter, loaderSetter) => {
    if (!rawText.trim()) return alert('Isi catatan terlebih dahulu.');
    loaderSetter(true);
    try {
      const res = await fetch('http://localhost:3000/api/ai/refine-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_text: rawText, context: context })
      });
      if (!res.ok) throw new Error('API AI Error');
      const data = await res.json();
      if (data.success) {
        setter(data.refined_text);
        saveBAHPField(context === 'Catatan Hasil Negosiasi' ? 'pbj_chat_notes' : 'pbj_vendor_rating_note', data.refined_text);
      } else throw new Error(data.error);
    } catch (e) {
      alert('❌ Error AI: ' + e.message);
    } finally {
      loaderSetter(false);
    }
  };

  const handleRefineBahp = async () => {"""
if "handleRefineExceptionNote" not in code:
    code = code.replace(func_str, new_funcs)

# 3. UI exceptionNotes (around line 1630)
exc_str = """                    className="w-full text-xs p-3 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                  <label className="flex items-center gap-2 mt-3 cursor-pointer">"""

new_exc = """                    className="w-full text-xs p-3 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                  <div className="flex flex-col gap-2 mt-2">
                    <button 
                      onClick={handleRefineExceptionNote} 
                      disabled={isRefiningException}
                      className="self-end bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 disabled:opacity-50"
                    >
                      {isRefiningException ? '⏳ Memproses...' : '🤖 Konsultasi & Perbaiki dengan AI'}
                    </button>
                    {exceptionAdvice && (
                      <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-[10px] text-indigo-800 font-sans">
                        <strong>💡 Nasihat Hukum AI:</strong><br/>{exceptionAdvice}
                      </div>
                    )}
                  </div>
                  <label className="flex items-center gap-2 mt-3 cursor-pointer">"""
code = code.replace(exc_str, new_exc)

# 4. UI chatNotes (around line 1807)
chat_str = """                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[11px] bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        rows={3}
                      />
                    </div>"""
new_chat = """                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[11px] bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        rows={3}
                      />
                      <button 
                        onClick={() => handleRefineGenericText(chatNotes, 'Catatan Hasil Negosiasi', setChatNotes, setIsRefiningChatNotes)} 
                        disabled={isRefiningChatNotes}
                        className="mt-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 disabled:opacity-50"
                      >
                        {isRefiningChatNotes ? '⏳ Menyempurnakan...' : '🤖 Sempurnakan dengan AI'}
                      </button>
                    </div>"""
code = code.replace(chat_str, new_chat)

# 5. UI vendorRatingNote (around line 1872)
vend_str = """                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[11px] bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      rows={3}
                    />
                  </div>"""
new_vend = """                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[11px] bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      rows={3}
                    />
                    <button 
                      onClick={() => handleRefineGenericText(vendorRatingNote, 'Evaluasi Kinerja Penyedia', setVendorRatingNote, setIsRefiningVendorNote)} 
                      disabled={isRefiningVendorNote}
                      className="mt-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 disabled:opacity-50"
                    >
                      {isRefiningVendorNote ? '⏳ Menyempurnakan...' : '🤖 Sempurnakan dengan AI'}
                    </button>
                  </div>"""
code = code.replace(vend_str, new_vend)

with open("frontend/src/components/ProcurementPanel.jsx", "w") as f:
    f.write(code)

print("UI buttons injected successfully.")
