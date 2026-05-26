export const syncPackageToDB = async (satkerId, selectedPack, items) => {
  if (!selectedPack || !items || items.length === 0) return null;
  try {
    const payload = {
      satker_id: satkerId?.toString() || "",
      sirup_id: selectedPack.noSirup?.toString() || "",
      nama_paket: selectedPack.packName || "",
      pagu_total: selectedPack.pagu || 0,
      mak: selectedPack.mak || "",
      items: items.map(i => ({
        nama_barang: i.name || "",
        qty: i.qty || 0,
        satuan: i.unit || "",
        harga_pagu_satuan: i.price || 0,
        no_urut: i.no || 0
      }))
    };
    const res = await fetch('/api/pbj/packages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (err) {
    console.error("DB Sync Package error:", err);
  }
};

export const syncSurveyToDB = async (selectedPack, items, surveyData, hpsPrices) => {
  if (!selectedPack || !items) return null;
  try {
    const sirupId = selectedPack.noSirup;
    const payload = {
      items: items.map(i => {
        const productSurvey = surveyData?.products?.find(p => p.name === i.name);
        return {
          nama_barang: i.name,
          survey_result: {
            vendor: productSurvey?.vendor || "",
            harga_ekatalog: productSurvey?.price || 0,
            url_produk: productSurvey?.link || "",
            screenshot_path: productSurvey?.screenshot || "",
            is_selected: true,
            harga_hps_final: hpsPrices?.[i.name] !== undefined ? hpsPrices[i.name] : i.price,
            status_survey: productSurvey?.success ? "success" : "failed"
          }
        }
      })
    };
    const res = await fetch(`/api/pbj/packages/${sirupId}/survey`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (err) {
    console.error("DB Sync Survey error:", err);
  }
};

export const fetchPackageFromDB = async (sirupId) => {
  try {
    const res = await fetch(`/api/pbj/packages/${sirupId}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error("DB Fetch Package error:", err);
  }
  return null;
};
