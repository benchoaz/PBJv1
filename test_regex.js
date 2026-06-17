const strings = [
  "Belanja Modal Personal Computer Nama FAKHRURROZI, SE, MM ROY ISKANDAR.S.PD.M.Pd SAPTORINI PAMUNGKAS, ST.M.Si ANNA RATNAWATI, SP.M.FSc M. ABDI UTOYO, S.T., M.Si Tolak Ukur Kerja Dana Yang Dibutuhkan Jumlah Laporan Penyediaan Jasa Komunikasi, Sumber Daya Air dan Listrik yang Disediakan",
  "Papan Nama Instansi",
  "Belanja Alat Tulis Kantor Tolak Ukur Kinerja",
  "Belanja Pemeliharaan Papan Nama Proyek",
  "Honorarium Narasumber Nama Budi, S.E."
];

const cleanUraian = (uraian) => {
  if (!uraian) return '';
  const junkRegex = /(Nama\s+[A-Z\s]+,\s*(SE|ST|MM|M\.Si|S\.Pd|M\.Pd|S\.E\.|S\.T\.|S\.Kom)|Tolak Ukur|Dana Yang|Jumlah Laporan|Kinerja|Indikator|Sumber Dana).*/i;
  
  let match = uraian.match(junkRegex);
  if (match) {
    // We want to cut BEFORE the matched part, but if it matched 'Nama Budi, S.E.', we cut at 'Nama '
    const idx = uraian.search(junkRegex);
    return uraian.substring(0, idx).trim();
  }
  return uraian.trim();
};

strings.forEach(s => console.log(`Original: ${s}\nCleaned: ${cleanUraian(s)}\n`));
