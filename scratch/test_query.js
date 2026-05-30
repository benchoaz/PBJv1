const fs = require('fs');

function advancedCleanQuery(name) {
  if (!name) return '';
  let cleaned = name.trim();
  cleaned = cleaned.replace(/\([^)]*\)/g, '');
  cleaned = cleaned.replace(/\[[^\]]*\]/g, '');
  cleaned = cleaned.replace(/(spesifikasi|spesifikasi\s*:|merk|merk\s*:|tipe|tipe\s*:|ukuran|ukuran\s*:|warna|warna\s*:)/gi, '');
  cleaned = cleaned.replace(/^(belanja|penyediaan|pengadaan|pembelian|jasa|pengadaan\s+barang|sewa)\s+/gi, '');
  const stopwordsAkhir = /\s+(rim|pak|box|pcs|lusin|buah|rol|roll|unit|meter|lembar|kodi|kg|gram|botol|pack|slop|dus|tube|set)$/i;
  cleaned = cleaned.replace(stopwordsAkhir, '');
  cleaned = cleaned.replace(/[^a-zA-Z0-9\s]/g, ' ');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
}

function expandWithSynonyms(query) {
  // Mock function assuming no synonyms for ballpoint baliner
  return [query];
}

function getQueryAttempts(originalName) {
  let specText = "";
  const keywordSplitMatch = originalName.match(/(.*?)\b(spesifikasi|spek|merk|tipe|type|ukuran|warna)\s*[:\-]?\s*(.+)/i);
  if (keywordSplitMatch) {
    specText = keywordSplitMatch[3].trim();
  }
  specText = advancedCleanQuery(specText);
  let mainString = originalName.replace(/\([^)]*\)/g, ''); 
  mainString = mainString.split(/\b(spesifikasi|spek|merk|tipe|type|ukuran|warna)\b/i)[0];
  const options = mainString.split('/').map(s => advancedCleanQuery(s)).filter(s => s.length >= 2);
  const attempts = [];
  const seen = new Set();
  const addAttempts = (sources) => {
    for (const src of sources) {
      if (!src || src.trim().length < 3) continue;
      const variants = expandWithSynonyms(src);
      for (const v of variants) {
        const trimmed = v.trim();
        if (trimmed.length >= 3 && !seen.has(trimmed.toLowerCase())) {
           const isGeneric = /^(besar|kecil|sedang|biasa|hitam|putih|merah|biru|kuning|hijau|panjang|pendek|tebal|tipis|murah|mahal)$/i.test(trimmed);
           const isJustUnit = /^(\d+(\.\d+)?)\s*(ml|gr|kg|cm|mm|m|liter|l|pcs|buah|lusin|rim|lembar|pack|box|dus|roll|rol|set)$/i.test(trimmed);
           if (!isGeneric && !isJustUnit) {
              seen.add(trimmed.toLowerCase());
              attempts.push(trimmed);
           }
        }
      }
    }
  };
  if (specText) addAttempts([specText]);
  addAttempts(options);
  if (specText) {
    for (const opt of options) {
       addAttempts([`${opt} ${specText}`]);
    }
  }
  return attempts;
}

console.log("Attempts for 'Ballpoint Baliner':", getQueryAttempts('Ballpoint Baliner'));
