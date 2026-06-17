function advancedCleanQuery(name) {
  if (!name) return '';
  let cleaned = name.trim();
  const hasKonsolidasiInParens = /\(([^)]*konsolidasi[^)]*)\)/i.test(cleaned) || /\[([^\]]*konsolidasi[^\]]*)\]/i.test(cleaned);
  cleaned = cleaned.replace(/\([^)]*\)/g, '');
  cleaned = cleaned.replace(/\[[^\]]*\]/g, '');
  if (hasKonsolidasiInParens) {
    cleaned += ' konsolidasi';
  }
  cleaned = cleaned.replace(/(spesifikasi|spesifikasi\s*:|merk|merk\s*:|tipe|tipe\s*:|ukuran|ukuran\s*:|warna|warna\s*:)/gi, '');
  cleaned = cleaned.replace(/^(belanja|penyediaan|pengadaan|pembelian|jasa|pengadaan\s+barang|sewa)\s+/gi, '');
  const stopwordsAkhir = /\s+(rim|pak|box|pcs|lusin|buah|rol|roll|unit|meter|lembar|kodi|kg|gram|botol|pack|slop|dus|tube|set)$/i;
  cleaned = cleaned.replace(stopwordsAkhir, '');
  cleaned = cleaned.replace(/[^a-zA-Z0-9\s]/g, ' ');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
}

const names = [
  "[Pembinaan LINMAS Sumber Dana: Sisa Lebih Perhitungan Anggaran Tahun Sebelumnya - Snack] Snack (Kotak) Spesifikasi: -",
  "[Peringatan Hari Besar Nasional dan Daerah - Snack] Snack (Kotak) Spesifikasi: -",
  "[Pembinaan LINMAS] Cetak Spanduk Spesifikasi: Bahan Paling Bagus"
];

names.forEach(n => console.log(advancedCleanQuery(n)));
