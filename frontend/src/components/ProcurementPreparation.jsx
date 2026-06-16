import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PPKProvider, usePPK } from './ppk/PPKContext';
import Step1PilihPaket from './ppk/Step1PilihPaket';
import Step2UploadDPA from './ppk/Step2UploadDPA';
import Step3RincianHPS from './ppk/Step3RincianHPS';
import Step4TemplateSurat from './ppk/Step4TemplateSurat';
import Step5Review from './ppk/Step5Review';
import { useAuth } from '../hooks/useAuth';

function ProcurementPreparationContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    step,
    dpaName,
    scrapedData,
    dpaAccounts,
    resetAll,
    silentReset,
    status = 'Draft',
    currentProjectId,
    loadProjectData
  } = usePPK();

  const [searchParams] = useSearchParams();
  const paketId = searchParams.get('paketId');
  const fetchedIdRef = useRef(null);

  useEffect(() => {
    // ALWAYS fetch from DB when navigating here with a paketId
    // We use a ref to prevent infinite loops caused by loadProjectData changing
    if (paketId) {
      if (fetchedIdRef.current !== paketId) {
        fetchedIdRef.current = paketId;
        fetch(`/api/projects/${paketId}`)
          .then(res => {
            if (!res.ok) throw new Error('Paket tidak ditemukan');
            return res.json();
          })
          .then(data => {
            loadProjectData(data);
          })
          .catch(err => {
            console.error(err);
            alert('Gagal memuat paket: ' + err.message);
          });
      }
    } else {
      // Clear fetching ref and reset context storage so it doesn't carry over a locked project
      fetchedIdRef.current = null;
      silentReset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paketId]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (user.role.toUpperCase() !== 'PPK' && user.role.toUpperCase() !== 'ADMIN') {
      if (user.role.toUpperCase() === 'PP' && paketId) {
        // Allow PP to view existing packages in read-only mode
      } else {
        navigate('/pp/panel');
      }
    }
  }, [user, navigate, paketId]);

  return (
    <div id="pbk-persiapan-root" className="animate-fade-in pb-12">
      {/* LOCK ALERT OVERLAY FOR READ-ONLY MODE */}
      {status !== 'Draft' && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-6 mb-8 rounded-r-xl shadow-sm pointer-events-auto relative z-10 animate-fade-in">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-2xl">🔒</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-bold text-amber-800">
                Dokumen Terkunci (Status: {status})
              </h3>
              <p className="text-amber-700 mt-1">
                Paket pengadaan ini sudah diproses ke tahap lanjut. Sistem secara otomatis <b>menggembok</b> seluruh isian agar tidak terjadi perubahan data secara sepihak. Anda masih bisa melihat rincian, mengunduh PDF, atau melakukan tanda tangan digital (jika diperlukan).
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-start mb-8 pb-6 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Persiapan Pengadaan</h1>
          <p className="text-slate-400 mt-1 text-sm">Langkah persiapan dokumen pembuka pengadaan dengan integrasi data SIRUP.</p>
        </div>
        {(dpaName || scrapedData?.length > 0 || dpaAccounts?.length > 0) && (
          <button
            onClick={resetAll}
            className="text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 hover:bg-rose-50 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
          >
            ↺ Reset &amp; Buat Baru
          </button>
        )}
      </div>

      <div className={status !== 'Draft' ? 'pointer-events-none opacity-90' : ''}>
        <Step1PilihPaket />
        {step >= 2 && <Step2UploadDPA />}
        {step >= 3 && <Step3RincianHPS />}
        {step >= 4 && <Step4TemplateSurat />}
        {step >= 5 && <Step5Review />}
      </div>
    </div>
  );
}

export default function ProcurementPreparation() {
  return (
    <PPKProvider>
      <ProcurementPreparationContent />
    </PPKProvider>
  );
}
