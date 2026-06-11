import React, { useState } from 'react';
import { X, UploadCloud, FileSpreadsheet, FileText, Loader2, AlertCircle } from 'lucide-react';

export default function RAKUploadModal({ onClose, onSuccess, satkerId }) {
  const [file, setFile] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer?.files[0] || e.target.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls') || droppedFile.name.endsWith('.pdf'))) {
      setFile(droppedFile);
      setError(null);
    } else {
      setError('Harap unggah file PDF atau Excel (.xlsx atau .xls)');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsParsing(true);
    setError(null);

    try {

      let activeProvider = '';
      let activeKey = '';
      let escalationProvider = '';
      let escalationKey = '';
      
      try {
        let keys = null;
        if (satkerId) {
          const resSatker = await fetch(`/api/settings/ocr_api_keys_satker_${satkerId}`);
          if (resSatker.ok) {
            const dataSatker = await resSatker.json();
            if (dataSatker.value) keys = JSON.parse(dataSatker.value);
          }
        }
        
        if (!keys) {
          const resGlobal = await fetch('/api/settings/ocr_api_keys');
          if (resGlobal.ok) {
            const dataGlobal = await resGlobal.json();
            if (dataGlobal.value) keys = JSON.parse(dataGlobal.value);
          }
        }
        
        if (keys) {
          const activeKeysList = [];
          const checkOrder = ['gemini', 'groq', 'openai', 'anthropic', 'deepseek', 'mistral', 'cohere', 'ollama'];
          for (const prov of checkOrder) {
            if (keys[prov]) {
              activeKeysList.push({ provider: prov, key: keys[prov] });
            }
          }
          
          if (activeKeysList.length > 0) {
            activeProvider = activeKeysList[0].provider;
            activeKey = activeKeysList[0].key;
          }
          if (activeKeysList.length > 1) {
            escalationProvider = activeKeysList[1].provider;
            escalationKey = activeKeysList[1].key;
          }
        }
      } catch (e) {
        console.error("Gagal mengambil kunci API OCR dari server:", e);
      }

      let aiHeaders = {};
      if (activeProvider && activeKey) {
        aiHeaders['X-AI-Provider'] = activeProvider;
        aiHeaders['X-AI-Key'] = activeKey;
      }
      if (escalationProvider && escalationKey) {
        aiHeaders['X-AI-Escalation-Provider'] = escalationProvider;
        aiHeaders['X-AI-Escalation-Key'] = escalationKey;
      }

      const formData = new FormData();
      formData.append('file', file);

      // Send raw file to backend proxy
      setUploadProgress(10);
      const aiRes = await fetch('/api/rak/parse-ai', {
        method: 'POST',
        headers: aiHeaders,
        body: formData
      });

      if (!aiRes.ok) {
        let errorText = 'Gagal menghubungi AI Parser server';
        try {
          const errData = await aiRes.text();
          if (errData) errorText = errData;
        } catch (e) {}
        throw new Error(errorText);
      }

      const jobResponse = await aiRes.json();
      let parsedDataRaw = null;

      if (jobResponse.job_id) {
        // Polling loop
        const jobId = jobResponse.job_id;
        let isDone = false;
        
        while (!isDone) {
          await new Promise(r => setTimeout(r, 3000)); // wait 3 seconds
          setUploadProgress(prev => (prev < 90 ? prev + 5 : 90));
          
          const statusRes = await fetch(`/api/rak/parse-status?job_id=${jobId}`);
          if (!statusRes.ok) continue;
          
          const statusData = await statusRes.json();
          if (statusData.status === 'completed') {
            parsedDataRaw = statusData.result;
            isDone = true;
          } else if (statusData.status === 'error') {
            throw new Error(statusData.error || 'Terjadi kesalahan saat memproses file');
          }
        }
      } else {
        // Fallback if the API returned data directly
        parsedDataRaw = jobResponse;
      }

      setUploadProgress(95);

      const parsedData = parsedDataRaw.rak_items || parsedDataRaw;
      
      if (!Array.isArray(parsedData) || parsedData.length === 0) {
        throw new Error(parsedDataRaw.pesan || "AI gagal mengekstrak data rekening dari RAK.");
      }

      console.log('Parsed RAK Data by AI:', parsedData);

      const payload = {
        satker_id: satkerId,
        tahun_anggaran: new Date().getFullYear(),
        nama_skpd: parsedDataRaw.nama_skpd || "Instansi",
        nilai_anggaran: parsedDataRaw.nilai_anggaran || 0,
        file_name: file.name,
        accounts: parsedData.map(p => ({
          kode_rekening: p.kodeRekening,
          uraian: p.uraian,
          program: p.program || "",
          kegiatan: p.kegiatan || "",
          sub_kegiatan: p.sub_kegiatan || "",
          anggaran_tahun: p.total,
          total_rak: p.total,
          bulan_jan: p['Januari'] || 0,
          bulan_feb: p['Februari'] || 0,
          bulan_mar: p['Maret'] || 0,
          bulan_apr: p['April'] || 0,
          bulan_mei: p['Mei'] || 0,
          bulan_jun: p['Juni'] || 0,
          bulan_jul: p['Juli'] || 0,
          bulan_ags: p['Agustus'] || 0,
          bulan_sep: p['September'] || 0,
          bulan_okt: p['Oktober'] || 0,
          bulan_nov: p['November'] || 0,
          bulan_des: p['Desember'] || 0
        }))
      };

      const apiRes = await fetch(`/api/rak/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const responseData = await apiRes.json();
      if (responseData.success) {
        if (onSuccess) onSuccess(parsedData);
      } else {
        throw new Error(responseData.message || 'Gagal menyimpan ke database');
      }
      
    } catch (err) {
      console.error(err);
      setError('Gagal memproses RAK: ' + err.message);
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Unggah RAK Anggaran Kas</h3>
            <p className="text-xs text-slate-500">Pilih file Excel atau PDF RAK</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {/* Upload Area */}
          <div 
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${file ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-300 hover:border-slate-400 bg-slate-50'}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
          >
            {file ? (
              <div className="flex flex-col items-center">
                <FileSpreadsheet className="w-12 h-12 text-indigo-500 mb-3" />
                <span className="text-sm font-bold text-slate-800">{file.name}</span>
                <span className="text-xs text-slate-500 mt-1">{(file.size / 1024).toFixed(1)} KB</span>
                <button 
                  onClick={() => setFile(null)}
                  className="mt-4 text-xs font-semibold text-rose-500 hover:text-rose-600 underline"
                >
                  Ganti File
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <UploadCloud className="w-12 h-12 text-slate-400 mb-3" />
                <span className="text-sm font-bold text-slate-700">Tarik & Lepas File PDF/Excel Di Sini</span>
                <span className="text-xs text-slate-500 mt-1 mb-4">atau klik untuk memilih file</span>
                <label className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer shadow-sm transition-all">
                  Pilih File
                  <input type="file" accept=".xlsx,.xls,.pdf" className="hidden" onChange={handleFileDrop} />
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || isParsing}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2"
          >
            {isParsing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Memproses... {uploadProgress > 0 && `(${uploadProgress}%)`}
              </>
            ) : (
              'Unggah & Proses RAK'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
