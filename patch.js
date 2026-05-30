const fs = require('fs');
const file = '/home/beni/PBJ/frontend/src/components/ProcurementPreparation.jsx';
let content = fs.readFileSync(file, 'utf8');

// Add import
if (!content.includes('import { syncPackageToDB, syncSurveyToDB, fetchPackageFromDB }')) {
  content = content.replace(
    "import { useAuth } from '../hooks/useAuth'",
    "import { useAuth } from '../hooks/useAuth'\nimport { syncPackageToDB, syncSurveyToDB, fetchPackageFromDB } from '../utils/dbSync'"
  );
}

// Add sync effects right after getPackageItems declaration
if (!content.includes('EFEK SINKRONISASI DATABASE')) {
  const syncCode = `
  // ========== EFEK SINKRONISASI DATABASE (AUTO-SAVE) ==========
  useEffect(() => {
    if (step >= 3 && selectedPack && getPackageItems(selectedPack).length > 0) {
      syncPackageToDB(satkerId, selectedPack, getPackageItems(selectedPack));
    }
  }, [step, selectedPack, dpaAccounts, dpaRincian]);

  useEffect(() => {
    if (step >= 3 && selectedPack && surveyData) {
      syncSurveyToDB(selectedPack, getPackageItems(selectedPack), surveyData, hpsPrices);
    }
  }, [surveyData, hpsPrices]);

  const handleSelectPackDb = async (pack) => {
    setSelectedPack(pack);
    setStep(2);
    setSearchQuery('');
    setSurveyData(null);
    setHpsPrices({});
    setIsSigned(false);

    const dbPack = await fetchPackageFromDB(pack.noSirup);
    if (dbPack && dbPack.items && dbPack.items.length > 0) {
      console.log("Memulihkan paket dari DB:", dbPack);
      const rincianItems = dbPack.items.map((i, idx) => ({
        no: i.no_urut || idx + 1,
        nama: i.nama_barang,
        volume: i.qty,
        satuan: i.satuan,
        harga_satuan: i.harga_pagu_satuan,
        harga_total: i.qty * i.harga_pagu_satuan
      }));
      setDpaAccounts([{ account: dbPack.mak, name: pack.packName, pagu: pack.pagu, confidence: 100, verified: true }]);
      setDpaRincian({ [dbPack.mak]: rincianItems });
      
      const restoredSurveyData = { products: [] };
      const restoredHpsPrices = {};
      let hasSurvey = false;

      dbPack.items.forEach(item => {
        if (item.surveys && item.surveys.length > 0) {
          hasSurvey = true;
          const s = item.surveys[0];
          restoredSurveyData.products.push({
            name: item.nama_barang,
            vendor: s.vendor,
            price: s.harga_ekatalog,
            link: s.url_produk,
            screenshot: s.screenshot_path,
            success: s.status_survey === 'success'
          });
          restoredHpsPrices[item.nama_barang] = s.harga_hps_final;
        }
      });

      if (hasSurvey) {
        setSurveyData(restoredSurveyData);
        setHpsPrices(restoredHpsPrices);
      }
      setStep(3);
    }
  };
`;

  // Find a good place to inject. e.g. before "const handleManualSearch = (e) => {"
  content = content.replace("  const handleManualSearch = (e) => {", syncCode + "\n  const handleManualSearch = (e) => {");
}

// Replace the inline onClick with handleSelectPackDb
content = content.replace(/onClick=\{\(\) => \{\n\s*setSelectedPack\(pack\)\n\s*setStep\(2\)\n\s*setSearchQuery\(''\)\n\s*setSurveyData\(null\)\n\s*setHpsPrices\(\{\}\)\n\s*setIsSigned\(false\)\n\s*\}\}/g, "onClick={() => handleSelectPackDb(pack)}");

fs.writeFileSync(file, content);
console.log("Patched successfully");
