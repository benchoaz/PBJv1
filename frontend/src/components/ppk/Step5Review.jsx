import React, { useState } from 'react';
import { usePPK } from './PPKContext';

export default function Step5Review() {
  const { 
    docSettings, setDocSettings,
    step, setStep,
    dpaName, setDpaName,
    satkerId, setSatkerId,
    scrapedData, setScrapedData,
    selectedPack, setSelectedPack,
    detailModalPack, setDetailModalPack,
    rincianModal, setRincianModal,
    hpsValue, setHpsValue,
    isHpsExemptSelected, setIsHpsExemptSelected,
    hpsPrices, setHpsPrices,
    techSpecs, setTechSpecs,
    packageMetadata, setPackageMetadata,
    selectedTplId, setSelectedTplId,
    selectedNdTplId, setSelectedNdTplId,
    matchedDpaTypes, setMatchedDpaTypes,
    dpaAccounts, setDpaAccounts,
    dpaRincian, setDpaRincian,
    sirupPackages, setSirupPackages,
    isUpdating, setIsUpdating,
    surveyLoading, setSurveyLoading,
    surveyData, setSurveyData,
    surveyLogs, setSurveyLogs,
    aiError, setAiError,
    activeDocPreview, setActiveDocPreview,
    resetAll, handleSimpanPaket, currentUser, getPackageItems,
    dppSpecs, setDppSpecs, currentProjectId
  } = usePPK();

  const [isSigned, setIsSigned] = useState(false);

  return (
    <>
      <div className="border-t border-slate-200/60 pt-4 mt-2">
                    {isSigned ? (
                      <div className="flex items-center justify-between bg-white border border-slate-200 p-5 rounded-xl animate-fade-in">
                        <div className="flex items-center gap-3">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                          <div>
                            <div className="text-xs font-semibold text-slate-800">Persiapan Selesai</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{currentUser.name} · NIP {currentUser.nip}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setIsSigned(false)
                            setStep(3)
                          }}
                          className="text-xs text-slate-400 hover:text-rose-600 font-semibold transition-colors"
                        >
                          Batal Selesai
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 border border-slate-200 p-5 rounded-xl">
                        <div className="text-xs text-slate-500 max-w-md leading-relaxed">
                          Selesaikan persiapan dokumen untuk mengirim berkas pengadaan.
                        </div>
                        <button
                          onClick={() => {
                            setIsSigned(true)
                            setStep(4)
                          }}
                          disabled={isOverBudget}
                          className={`text-white text-xs font-semibold px-5 py-3 rounded-xl flex items-center gap-2 transition-all ${isOverBudget ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-500 hover:bg-indigo-600'}`}
                        >
                          Sahkan Dokumen (TTE)
                        </button>
                      </div>
                    )}
                  </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              onClick={() => handleSimpanPaket(false)}
              disabled={isUpdating}
              className="bg-white border-2 border-slate-200 hover:border-indigo-500 text-slate-700 hover:text-indigo-600 px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 pointer-events-auto shadow-sm"
            >
              💾 Simpan Paket
            </button>
            <button
              onClick={() => {
                if (confirm('Anda yakin ingin menyerahkan dan mengunci dokumen ini untuk PP?')) {
                  const finalizedItems = getPackageItems(selectedPack)
                    .filter(item => {
                      const qty = item.qty === '' ? 0 : (item.qty || 0);
                      return qty > 0;
                    })
                    .map((item, idx) => {
                      const surveyProduct = surveyData?.products?.[idx];
                      const unitHpsPrice = surveyProduct?.price !== undefined ? surveyProduct.price : item.price;
                      return {
                        ...item,
                        qty: item.qty === '' ? 0 : (item.qty || 0),
                        name: surveyProduct?.name || item.name,
                        price: unitHpsPrice,
                        paguDpa: item.price,
                        katalogPrice: surveyProduct?.price || unitHpsPrice,
                        vendor: surveyProduct?.vendor || '',
                        link: surveyProduct?.link || '',
                        img: surveyProduct?.img || ''
                      };
                    });
                  
                  const submittedData = {
                    packName: selectedPack?.packName,
                    pagu: selectedPack?.pagu,
                    mak: selectedPack?.mak,
                    volume: selectedPack?.volume,
                    spesifikasi: selectedPack?.spesifikasi,
                    hpsValue: isHpsExemptSelected ? 'Dikecualikan (Bebas HPS)' : hpsValue,
                    techSpecs: techSpecs,
                    dpaName: dpaName,
                    items: finalizedItems,
                    senderName: currentUser.name,
                    senderNip: currentUser.nip,
                    senderDepartment: currentUser.department,
                    sentDate: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
                    dppSpecs: dppSpecs,
                    selectedTplId: selectedTplId,
                    selectedNdTplId: selectedNdTplId
                  }
                  

                  // SAVE DIRECTLY TO DB INSTEAD OF LOCALSTORAGE
                  fetch(currentProjectId ? `/api/projects/${currentProjectId}` : '/api/projects', {
                    method: currentProjectId ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      name: submittedData.packName,
                      budget: submittedData.pagu || 0,
                      idSatker: satkerId || '',
                      status: 'Terkirim ke PP',
                      description: JSON.stringify(submittedData)
                    })
                  }).then(res => {
                    if (res.ok) {
                      console.log('Terkirim');
                      alert('✅ Dokumen berhasil dikirim ke PP!');
                    } else {
                      alert('Gagal mengirim ke PP');
                    }
                  }).catch(e => {
                    alert('Error: ' + e.message);
                  });

                }
              }}
              disabled={step < 4}
            >
              Kirim DPP ke PP
            </button>
          </div>

    </>
  );
}
