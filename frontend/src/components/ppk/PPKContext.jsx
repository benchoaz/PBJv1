import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

const PPKContext = createContext();

export function usePPK() {
  return useContext(PPKContext);
}

export function PPKProvider({ children }) {
  const { user: currentUser } = useAuth();
  
  // -- State declarations from ProcurementPreparation --
  const [docSettings, setDocSettings] = useState(() => {
    const saved = localStorage.getItem('pbj_doc_settings');
    const defaultSettings = { showKop: true, marginTop: 40, marginLeft: 40, marginBottom: 30, marginRight: 20, formatNomorSurat: '027/{nomor}/DKUPP/2026' };
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.marginTop === 15 && parsed.marginLeft === 25 && parsed.marginBottom === 20 && parsed.marginRight === 20) {
        parsed.marginTop = 40; parsed.marginLeft = 40; parsed.marginBottom = 30; parsed.marginRight = 20;
        localStorage.setItem('pbj_doc_settings', JSON.stringify(parsed));
      }
      parsed.showKop = true;
      return { ...defaultSettings, ...parsed };
    }
    return defaultSettings;
  });

  const [step, setStep] = useState(() => parseInt(localStorage.getItem('pbj_step') || '1'));
  const [dpaName, setDpaName] = useState(() => localStorage.getItem('pbj_dpa_name') || null);
  const [satkerId, setSatkerId] = useState(() => localStorage.getItem('pbj_satker_id') || currentUser?.idSatker || '67081');
  const [scrapedData, setScrapedData] = useState(() => { const s = localStorage.getItem('pbj_scraped_data'); return s ? JSON.parse(s) : []; });
  const [selectedPack, setSelectedPack] = useState(() => { const s = localStorage.getItem('pbj_selected_pack'); return s ? JSON.parse(s) : null; });
  const [detailModalPack, setDetailModalPack] = useState(null);
  const [rincianModal, setRincianModal] = useState(null);
  const [hpsValue, setHpsValue] = useState(() => localStorage.getItem('pbj_hps_value') || '');
  const [isHpsExemptSelected, setIsHpsExemptSelected] = useState(() => localStorage.getItem('pbj_hps_exempt_selected') === 'true');
  const [hpsPrices, setHpsPrices] = useState(() => { const s = localStorage.getItem('pbj_hps_prices'); return s ? JSON.parse(s) : {}; });
  const [techSpecs, setTechSpecs] = useState(() => localStorage.getItem('pbj_tech_specs') || '');
  const [dppSpecs, setDppSpecs] = useState(() => { const s = localStorage.getItem('pbj_dpp_specs'); return s ? JSON.parse(s) : { waktu: '1 (Satu) hari kerja', tempat: '', spesifikasiLayanan: '', justifikasiMerek: '', metodePemilihan: 'Negosiasi Harga' }; });
  const [packageMetadata, setPackageMetadata] = useState(() => { const s = localStorage.getItem('pbj_package_metadata'); return s ? JSON.parse(s) : { lokasi_pekerjaan: '', waktu_penyelesaian: '14 (empat belas) hari kalender', program: '', kegiatan: '', sub_kegiatan: '', nomor_dpp: '' }; });
  const [selectedTplId, setSelectedTplId] = useState('');
  const [selectedNdTplId, setSelectedNdTplId] = useState('');
  const [matchedDpaTypes, setMatchedDpaTypes] = useState(() => { const s = localStorage.getItem('pbj_matched_dpa_types'); return s ? JSON.parse(s) : []; });
  const [dpaAccounts, setDpaAccounts] = useState(() => { const s = localStorage.getItem('pbj_dpa_accounts'); return s ? JSON.parse(s) : []; });
  const [dpaRincian, setDpaRincian] = useState(() => { const s = localStorage.getItem('pbj_dpa_rincian'); return s ? JSON.parse(s) : {}; });
  const [sirupPackages, setSirupPackages] = useState(() => { const s = localStorage.getItem('pbj_sirup_packages'); return s ? JSON.parse(s) : []; });
  const [namaAcara, setNamaAcara] = useState(() => localStorage.getItem('pbj_nama_acara') || '');
  const [tanggalSurat, setTanggalSurat] = useState(() => localStorage.getItem('pbj_tanggal_surat') || new Date().toISOString().split('T')[0]);
  
  // Loading states
  const [isUpdating, setIsUpdating] = useState(false);
  const [surveyLoading, setSurveyLoading] = useState(false);
  const [surveyData, setSurveyData] = useState(() => { const s = localStorage.getItem('pbj_survey_data'); return s ? JSON.parse(s) : null; });
  const [surveyLogs, setSurveyLogs] = useState([]);
  const [aiError, setAiError] = useState('');
  const [activeDocPreview, setActiveDocPreview] = useState(null);

  // Load state and Project tracking
  const [currentProjectId, setCurrentProjectId] = useState(() => localStorage.getItem('pbj_current_project_id') || null);
  const [status, setStatus] = useState(() => localStorage.getItem('pbj_status') || 'Draft');

  // Persist effects
  useEffect(() => { if (currentProjectId) localStorage.setItem('pbj_current_project_id', currentProjectId); else localStorage.removeItem('pbj_current_project_id'); }, [currentProjectId]);
  useEffect(() => { localStorage.setItem('pbj_status', status); }, [status]);
  useEffect(() => { localStorage.setItem('pbj_step', step.toString()); }, [step]);
  useEffect(() => { if (dpaName) localStorage.setItem('pbj_dpa_name', dpaName); else localStorage.removeItem('pbj_dpa_name'); }, [dpaName]);
  useEffect(() => { if (currentUser) { const id = currentUser.idSatker || '67081'; setSatkerId(id); localStorage.setItem('pbj_satker_id', id); } }, [currentUser?.idSatker]);
  useEffect(() => { localStorage.setItem('pbj_doc_settings', JSON.stringify(docSettings)); }, [docSettings]);
  useEffect(() => { localStorage.setItem('pbj_scraped_data', JSON.stringify(scrapedData)); }, [scrapedData]);
  useEffect(() => { if (selectedPack) localStorage.setItem('pbj_selected_pack', JSON.stringify(selectedPack)); else localStorage.removeItem('pbj_selected_pack'); }, [selectedPack]);
  useEffect(() => { localStorage.setItem('pbj_hps_exempt_selected', isHpsExemptSelected.toString()); }, [isHpsExemptSelected]);
  useEffect(() => { localStorage.setItem('pbj_hps_prices', JSON.stringify(hpsPrices)); }, [hpsPrices]);
  useEffect(() => { localStorage.setItem('pbj_hps_value', hpsValue); }, [hpsValue]);
  useEffect(() => { localStorage.setItem('pbj_tech_specs', techSpecs); }, [techSpecs]);
  useEffect(() => { localStorage.setItem('pbj_dpp_specs', JSON.stringify(dppSpecs)); }, [dppSpecs]);
  useEffect(() => { localStorage.setItem('pbj_package_metadata', JSON.stringify(packageMetadata)); }, [packageMetadata]);
  useEffect(() => { localStorage.setItem('pbj_matched_dpa_types', JSON.stringify(matchedDpaTypes)); }, [matchedDpaTypes]);
  useEffect(() => { localStorage.setItem('pbj_dpa_accounts', JSON.stringify(dpaAccounts)); }, [dpaAccounts]);
  useEffect(() => { localStorage.setItem('pbj_dpa_rincian', JSON.stringify(dpaRincian)); }, [dpaRincian]);
  useEffect(() => { localStorage.setItem('pbj_sirup_packages', JSON.stringify(sirupPackages)); }, [sirupPackages]);
  useEffect(() => { localStorage.setItem('pbj_nama_acara', namaAcara); }, [namaAcara]);
  useEffect(() => { localStorage.setItem('pbj_tanggal_surat', tanggalSurat); }, [tanggalSurat]);
  useEffect(() => { if (surveyData) localStorage.setItem('pbj_survey_data', JSON.stringify(surveyData)); }, [surveyData]);

  const resetAll = () => {
    if (!confirm('Anda yakin ingin mereset semua data? Proses ini tidak dapat dibatalkan.')) return;
    localStorage.removeItem('pbj_dpa_name');
    localStorage.removeItem('pbj_scraped_data');
    localStorage.removeItem('pbj_matched_dpa_types');
    localStorage.removeItem('pbj_selected_pack');
    localStorage.removeItem('pbj_step');
    localStorage.removeItem('pbj_hps_value');
    localStorage.removeItem('pbj_hps_prices');
    localStorage.removeItem('pbj_tech_specs');
    localStorage.removeItem('pbj_dpa_accounts');
    localStorage.removeItem('pbj_dpa_rincian');
    localStorage.removeItem('pbj_sirup_packages');
    localStorage.removeItem('pbj_hps_exempt_selected');
    localStorage.removeItem('pbj_survey_data');
    localStorage.removeItem('pbj_package_metadata');
    localStorage.removeItem('pbj_nama_acara');
    localStorage.removeItem('pbj_tanggal_surat');
    localStorage.removeItem('pbj_current_project_id');
    localStorage.removeItem('pbj_status');
    
    setDpaName(null);
    setScrapedData([]);
    setMatchedDpaTypes([]);
    setSelectedPack(null);
    setStep(1);
    setHpsValue('');
    setHpsPrices({});
    setTechSpecs('');
    setDpaAccounts([]);
    setDpaRincian({});
    setSirupPackages([]);
    setIsHpsExemptSelected(false);
    setSurveyData(null);
    setPackageMetadata({ lokasi_pekerjaan: '', waktu_penyelesaian: '14 (empat belas) hari kalender', program: '', kegiatan: '', sub_kegiatan: '', nomor_dpp: '' });
    setNamaAcara('');
    setCurrentProjectId(null);
    setStatus('Draft');
  };

  const loadProjectData = (project) => {
    try {
      const parsed = JSON.parse(project.description || '{}');
      setCurrentProjectId(project.id.toString());
      setStatus(project.status || 'Draft');
      
      if (parsed.selectedPack) setSelectedPack(parsed.selectedPack);
      if (parsed.namaAcara) setNamaAcara(parsed.namaAcara);
      if (parsed.dpaAccounts) setDpaAccounts(parsed.dpaAccounts);
      if (parsed.dpaRincian) setDpaRincian(parsed.dpaRincian);
      if (parsed.docSettings) setDocSettings(parsed.docSettings);
      if (parsed.step) setStep(parsed.step);
      if (parsed.surveyData) setSurveyData(parsed.surveyData);
      if (parsed.hpsValue) setHpsValue(parsed.hpsValue);
      if (parsed.isHpsExemptSelected !== undefined) setIsHpsExemptSelected(parsed.isHpsExemptSelected);
      if (parsed.dppSpecs) setDppSpecs(parsed.dppSpecs);
      if (parsed.packageMetadata) setPackageMetadata(parsed.packageMetadata);
      if (parsed.techSpecs) setTechSpecs(parsed.techSpecs);
      if (parsed.hpsPrices) setHpsPrices(parsed.hpsPrices);
      if (parsed.tanggalSurat) setTanggalSurat(parsed.tanggalSurat);
    } catch(e) {
      console.error('Failed to load project data:', e);
    }
  };

  const handleSimpanPaket = async () => {
    try {
      setIsUpdating(true);
      let totalPagu = 0;
      if (selectedPack && selectedPack.pagu) {
        totalPagu = selectedPack.pagu;
      } else {
        Object.values(dpaRincian).forEach(r => { totalPagu += r.pagu || 0; });
      }

      const namaPaket = selectedPack
        ? (selectedPack.namaPaket || selectedPack.packName || `Pengadaan ${Object.keys(dpaRincian).join(', ')}`)
        : `Pengadaan ${Object.keys(dpaRincian).join(', ')}`;

      // Gunakan Nama Acara sebagai identitas utama DPP, fallback ke nama SIRUP
      const namaUtamaDpp = namaAcara?.trim() || namaPaket || 'Paket Pengadaan';

      const submissionPayload = {
        name: namaUtamaDpp,
        budget: totalPagu,
        status: 'Draft',
        description: JSON.stringify({
          selectedPack,
          namaAcara: namaAcara?.trim() || '',
          dpaAccounts,
          dpaRincian,
          docSettings,
          step,
          status: 'Draft',
          surveyData,
          hpsValue,
          isHpsExemptSelected,
          packageMetadata,
          dppSpecs,
          techSpecs,
          hpsPrices,
          tanggalSurat
        })
      };

      const res = await fetch(currentProjectId ? `/api/projects/${currentProjectId}` : '/api/projects', {
        method: currentProjectId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionPayload)
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `HTTP ${res.status}`);
      }
      
      const savedData = await res.json();
      if (!currentProjectId && savedData.id) {
        setCurrentProjectId(savedData.id.toString());
      }
      
      alert(currentProjectId ? '✅ Draft DPP berhasil diperbarui di Database Sentral!' : '✅ Draft DPP berhasil disimpan ke Database Sentral!');
    } catch (e) {
      console.error('Simpan paket error:', e);
      alert('Gagal menyimpan ke database: ' + e.message + '\n\n(Data tetap tersimpan di localStorage browser Anda)');
    } finally {
      setIsUpdating(false);
    }
  };

  const value = {
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
    dppSpecs, setDppSpecs,
    packageMetadata, setPackageMetadata,
    selectedTplId, setSelectedTplId,
    selectedNdTplId, setSelectedNdTplId,
    matchedDpaTypes, setMatchedDpaTypes,
    dpaAccounts, setDpaAccounts,
    dpaRincian, setDpaRincian,
    sirupPackages, setSirupPackages,
    namaAcara, setNamaAcara,
    isUpdating, setIsUpdating,
    surveyLoading, setSurveyLoading,
    surveyData, setSurveyData,
    surveyLogs, setSurveyLogs,
    aiError, setAiError,
    activeDocPreview, setActiveDocPreview,
    resetAll, handleSimpanPaket, loadProjectData, currentUser,
    tanggalSurat, setTanggalSurat,
    currentProjectId, status
  };

  return <PPKContext.Provider value={value}>{children}</PPKContext.Provider>;
}
