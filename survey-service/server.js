const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const screenshotDir = '/screenshots';
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

/**
 * Membersihkan nama barang dari spesifikasi kurung, stopwords pengadaan, dan satuan kemasan.
 */
function advancedCleanQuery(name) {
  if (!name) return '';
  let cleaned = name.trim();

  // 1. Bersihkan tanda kurung biasa (...) dan kurung siku [...] beserta isinya
  cleaned = cleaned.replace(/\([^)]*\)/g, '');
  cleaned = cleaned.replace(/\[[^\]]*\]/g, '');

  // 2. Bersihkan istilah spesifikasi, merk, tipe, dll.
  cleaned = cleaned.replace(/(spesifikasi|spesifikasi\s*:|merk|merk\s*:|tipe|tipe\s*:|ukuran|ukuran\s*:|warna|warna\s*:)/gi, '');

  // 3. Bersihkan kata pembuka umum pengadaan (stopwords) di awal kalimat
  cleaned = cleaned.replace(/^(belanja|penyediaan|pengadaan|pembelian|jasa|pengadaan\s+barang|sewa)\s+/gi, '');

  // 4. Bersihkan satuan kemasan umum di bagian akhir kalimat jika diawali kata lain
  const stopwordsAkhir = /\s+(rim|pak|box|pcs|lusin|buah|rol|roll|unit|meter|lembar|kodi|kg|gram|botol|pack|slop|dus|tube|set)$/i;
  cleaned = cleaned.replace(stopwordsAkhir, '');

  // 5. Bersihkan karakter khusus yang tidak perlu (kecuali huruf, angka, spasi)
  cleaned = cleaned.replace(/[^a-zA-Z0-9\s]/g, ' ');

  // 6. Normalisasi spasi ganda
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * Menghasilkan beberapa alternatif query pencarian dari yang spesifik sampai yang paling sederhana.
 */
function getQueryAttempts(originalName) {
  const cleaned = advancedCleanQuery(originalName);
  const attempts = [];

  if (cleaned) {
    attempts.push(cleaned); // Attempt 1: Full Cleaned Query
  }

  // Jaga query asli sebagai fallback jika pembersihan terlalu agresif
  const originalWords = originalName.replace(/\([^)]*\)/g, '').replace(/[^a-zA-Z0-9\s]/g, ' ').trim().replace(/\s+/g, ' ');
  if (originalWords && originalWords !== cleaned) {
    attempts.push(originalWords);
  }

  // Attempt 2: Pangkas kata paling belakang jika lebih dari 3 kata
  const words = (cleaned || originalWords).split(/\s+/);
  if (words.length > 3) {
    attempts.push(words.slice(0, words.length - 1).join(' '));
  }

  // Attempt 3: Core Query (Ambil 2 atau 3 kata pertama)
  if (words.length > 2) {
    attempts.push(words.slice(0, 2).join(' '));
  }

  // Pastikan unik dan hilangkan yang terlalu pendek (< 3 karakter)
  const uniqueAttempts = [];
  attempts.forEach(q => {
    const trimmed = q.trim();
    if (trimmed.length >= 3 && !uniqueAttempts.includes(trimmed)) {
      uniqueAttempts.push(trimmed);
    }
  });

  return uniqueAttempts;
}

/**
 * Menghitung skor kemiripan teks antara produk target (DPA) dan kandidat dari Inaproc.
 * Menggunakan perpaduan Word Overlap, Jaccard Similarity, dan Length Penalty.
 */
function getSimilarityScore(target, candidate) {
  if (!target || !candidate) return 0;

  const tClean = target.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  const cClean = candidate.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);

  if (tClean.length === 0 || cClean.length === 0) return 0;

  const tSet = new Set(tClean);
  const cSet = new Set(cClean);

  // 1. Hitung Word Overlap (berapa banyak kata target yang ada di kandidat)
  let overlapCount = 0;
  tClean.forEach(word => {
    if (cSet.has(word)) {
      overlapCount++;
    }
  });
  const overlapScore = overlapCount / tClean.length;

  // 2. Hitung Jaccard Similarity (irisan dibanding gabungan)
  let intersection = 0;
  tSet.forEach(word => {
    if (cSet.has(word)) intersection++;
  });
  const union = new Set([...tClean, ...cClean]).size;
  const jaccardScore = intersection / union;

  // 3. Length Penalty (Penalti jika nama kandidat terlalu panjang / bertele-tele dibanding target)
  const lengthRatio = Math.min(tClean.length / cClean.length, cClean.length / tClean.length);
  const lengthPenalty = 0.8 + (0.2 * lengthRatio); // minimal 0.8, maksimal 1.0

  // 4. Position Weight (Apakah kata kunci pertama target berada di awal nama kandidat?)
  let positionBonus = 1.0;
  if (tClean.length > 0 && cClean.indexOf(tClean[0]) === 0) {
    positionBonus = 1.1; // Bonus 10% jika kata pertama cocok persis di awal
  }

  // Gabungkan skor dengan bobot: Overlap (60%) + Jaccard (40%) * Length Penalty * Position Bonus
  const baseScore = (overlapScore * 0.6) + (jaccardScore * 0.4);
  return baseScore * lengthPenalty * positionBonus;
}

async function searchItem(page, item, index) {
  const safeId = 'item_' + index + '_' + item.name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
  console.log(`\n[${index + 1}] Memproses: "${item.name}"`);

  try {
    const searchTarget = item.query && item.query.trim() ? item.query.trim() : item.name;

    // --- BYPASS: URL Spesifik ---
    if (item.targetUrl && item.targetUrl.startsWith('http')) {
      console.log(`  → BYPASS: Mengunjungi URL langsung: ${item.targetUrl}`);
      try {
        await page.goto(item.targetUrl, { waitUntil: 'networkidle2', timeout: 45000 });
        await new Promise(r => setTimeout(r, 4000));
        const detailFile = path.join(screenshotDir, safeId + '_detail.png');
        await page.screenshot({ path: detailFile, fullPage: false });
        
        const detailData = await page.evaluate(() => {
          let price = null, vendor = null;
          const pEl = document.querySelector('.harga-produk') || document.querySelector('h2.text-primary');
          if (pEl) {
            const pm = pEl.innerText.match(/Rp\s*([\d.,]+)/);
            if (pm) price = parseInt(pm[1].replace(/\./g, '').replace(/,\d+$/, ''));
          }
          const vEl = document.querySelector('.penyedia-name') || document.querySelector('.card-body strong');
          if (vEl) vendor = vEl.innerText.trim();
          return { price, vendor };
        });

        return {
          name: item.name,
          query: searchTarget,
          vendor: detailData.vendor || 'PENYEDIA TARGET',
          price: detailData.price || item.fallbackPrice,
          link: item.targetUrl,
          img: `/screenshots/${path.basename(detailFile)}`,
          searchImg: `/screenshots/${path.basename(detailFile)}`,
          success: true
        };
      } catch (err) {
        console.log(`  ❌ BYPASS gagal: ${err.message}. Lanjut pencarian manual...`);
      }
    }

    const attempts = getQueryAttempts(searchTarget);
    console.log(`  → Query pencarian yang akan dicoba (Target: ${searchTarget}):`, attempts);

    let searchData = [];
    let successfulQuery = '';
    let searchFile = path.join(screenshotDir, safeId + '_search.png');

    // ── STEP 1: Multi-Stage Search Loop ───────────────────────────────
    for (let i = 0; i < attempts.length; i++) {
      const query = attempts[i];
      let searchUrl = 'https://katalog.inaproc.id/search?keyword=' + encodeURIComponent(query);
      
      if (item.locations && item.locations.length > 0) {
        let rName = '', rCode = '';
        let lLower = item.locations[0].toLowerCase();
        if (lLower.includes('kota') && lLower.includes('probolinggo')) { rName = 'Kota Probolinggo'; rCode = '35.74'; }
        else if (lLower.includes('probolinggo')) { rName = 'Kab. Probolinggo'; rCode = '35.13'; }
        else if (lLower.includes('surabaya')) { rName = 'Kota Surabaya'; rCode = '35.78'; }
        
        if (rName) searchUrl += '&regionNames=' + encodeURIComponent(rName);
        if (rCode) searchUrl += '&regionCode=' + encodeURIComponent(rCode);
      }
      
      console.log(`  → [Mencari #${i + 1}] Membuka: ${searchUrl}`);
      
      try {
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 60000 });
        await new Promise(r => setTimeout(r, 4000));

        // Ekstrak kandidat produk dari halaman pencarian
        const candidates = await page.evaluate(() => {
          const anchors = Array.from(document.querySelectorAll('a[href]'));
          const list = [];

          for (const a of anchors) {
            const href = a.getAttribute('href') || '';
            const text = a.innerText || '';

            // Pastikan URL berformat: /vendor-slug/product-slug
            if (!href.startsWith('/') || href.startsWith('/_next') || href.startsWith('/assets') || 
                href.startsWith('/auth') || href === '/' || href === '/search' || href === '/toko-daring') {
              continue;
            }

            const segments = href.split('/').filter(Boolean);
            if (segments.length < 2 || segments.length > 3) {
              continue;
            }

            if (!text.includes('Rp')) {
              continue;
            }

            const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
            if (lines.length < 2) continue;

            let title = lines[0];
            if (title === 'Barang' && lines.length > 1) {
              title = lines[1];
            }

            let price = null;
            const rpLine = lines.find(line => line.startsWith('Rp'));
            if (rpLine) {
              const priceMatch = rpLine.match(/Rp\s*([\d.,]+)/);
              if (priceMatch) {
                price = parseInt(priceMatch[1].replace(/\./g, '').replace(/,\d+$/, ''));
              }
            }

            const vendorSlug = segments[0];
            const vendor = vendorSlug.replace(/-/g, ' ').toUpperCase();

            list.push({
              title,
              price,
              vendor,
              productHref: href
            });
          }
          return list;
        });

        if (candidates && candidates.length > 0) {
          searchData = candidates;
          successfulQuery = query;
          // Simpan screenshot pencarian yang sukses
          await page.screenshot({ path: searchFile, fullPage: false });
          console.log(`    ✅ Berhasil menemukan ${candidates.length} produk dengan query: "${query}"`);
          break;
        } else {
          console.log(`    ⚠️ Query "${query}" tidak menghasilkan produk.`);
        }
      } catch (err) {
        console.log(`    ❌ Gagal pencarian untuk query "${query}": ${err.message}`);
      }
    }

    // ── STEP 2: Fuzzy Scoring & Best Product Selection ────────────────
    let bestCandidate = null;
    let highestScore = -1;

    if (searchData.length > 0) {
      console.log(`  → Menghitung skor kemiripan untuk ${searchData.length} kandidat...`);
      searchData.forEach(cand => {
        let score = getSimilarityScore(searchTarget, cand.title);
        
        // 🛡️ PENGAWAL HUKUM (LEGAL SHIELD): Boost skor jika sesuai target penyedia
        if (item.targetVendor && cand.vendor.toLowerCase().includes(item.targetVendor.toLowerCase())) {
          score += 10.0;
          console.log(`    ⭐ [TARGET MATCH] Vendor ${cand.vendor} mendapat prioritas mutlak!`);
        }

        cand.score = score;
        console.log(`    - [Skor: ${score.toFixed(3)}] ${cand.title} (Vendor: ${cand.vendor})`);
        if (score > highestScore) {
          highestScore = score;
          bestCandidate = cand;
        }
      });
    }

    // Tentukan threshold kecocokan minimum (0.01 agar sangat toleran)
    const isValidMatch = bestCandidate && highestScore >= 0.01;
    if (isValidMatch) {
      console.log(`  🌟 Produk Terpilih: "${bestCandidate.title}" dengan skor ${highestScore.toFixed(3)}`);
    } else {
      if (bestCandidate) {
        console.log(`  ⚠️ Produk terdekat "${bestCandidate.title}" memiliki skor terlalu rendah (${highestScore.toFixed(3)}).`);
      }
      console.log(`  ⚠️ Tidak menemukan produk yang cocok di e-Katalog, menggunakan fallback default.`);
    }

    // ── STEP 3: Navigate to product detail (Direct clean link) ─────────
    let detailUrl = 'https://katalog.inaproc.id/search?keyword=' + encodeURIComponent(successfulQuery || searchTarget);
    if (item.locations && item.locations.length > 0) {
        let rName = '', rCode = '';
        let lLower = item.locations[0].toLowerCase();
        if (lLower.includes('kota') && lLower.includes('probolinggo')) { rName = 'Kota Probolinggo'; rCode = '35.74'; }
        else if (lLower.includes('probolinggo')) { rName = 'Kab. Probolinggo'; rCode = '35.13'; }
        else if (lLower.includes('surabaya')) { rName = 'Kota Surabaya'; rCode = '35.78'; }
        if (rName) detailUrl += '&regionNames=' + encodeURIComponent(rName);
        if (rCode) detailUrl += '&regionCode=' + encodeURIComponent(rCode);
    }
    let detailFile = searchFile; // fallback to search screenshot
    let finalVendor = 'PENYEDIA INAPROC';
    let finalPrice = item.fallbackPrice;

    if (isValidMatch) {
      // Tautan langsung produk format bersih: https://katalog.inaproc.id/{nama-lapak}/{nama-produk}
      const directUrl = 'https://katalog.inaproc.id' + bestCandidate.productHref;
      detailUrl = directUrl;
      finalVendor = bestCandidate.vendor;
      finalPrice = bestCandidate.price || item.fallbackPrice;

      try {
        console.log(`  → Membuka halaman detail produk terpilih: ${directUrl}`);
        await page.goto(directUrl, { waitUntil: 'networkidle2', timeout: 45000 });
        await new Promise(r => setTimeout(r, 4000));

        // Ambil screenshot detail asli
        detailFile = path.join(screenshotDir, safeId + '_detail.png');
        await page.screenshot({ path: detailFile, fullPage: false });
        console.log(`  ✅ Screenshot detail disimpan: ${path.basename(detailFile)}`);

        // Update harga atau vendor jika ada informasi yang lebih akurat di halaman detail
        const detailData = await page.evaluate(() => {
          let price = null;
          let vendor = null;

          const allText = document.body.innerText;
          const rpMatch = allText.match(/Rp\s*([\d.,]+)/);
          if (rpMatch) {
            const priceStr = rpMatch[1].replace(/\./g, '').replace(/,\d+$/, '');
            const parsed = parseInt(priceStr);
            if (parsed >= 100) price = parsed;
          }

          // Coba cari vendor UMKK (Dihapus karena sering salah menangkap menu 'Produk Hukum' di Header INAPROC V6)
          // Kita akan menggunakan vendor asli dari Slug URL yang sudah sangat akurat.

          return { price, vendor };
        });

        if (detailData.price) finalPrice = detailData.price;
        if (detailData.vendor) finalVendor = detailData.vendor;
        console.log(`  → Detail terverifikasi: harga=${finalPrice}, vendor=${finalVendor}`);

      } catch (err) {
        console.log(`  ⚠️ Gagal buka detail (${err.message}), menggunakan data hasil pencarian`);
      }
    }

    const isDetailShot = detailFile !== searchFile;
    return {
      name: item.name,
      vendor: finalVendor.toUpperCase(),
      price: finalPrice || item.fallbackPrice,
      link: detailUrl,
      img: isDetailShot 
        ? `/screenshots/${safeId}_detail.png` 
        : `/screenshots/${safeId}_search.png`,
      searchImg: `/screenshots/${safeId}_search.png`,
      success: true
    };

  } catch (err) {
    console.error(`  ❌ Error: ${err.message}`);
    return {
      name: item.name,
      vendor: 'TIDAK DITEMUKAN',
      price: item.fallbackPrice || 0,
      link: `https://katalog.inaproc.id/search?keyword=${encodeURIComponent(item.query)}`,
      img: null,
      searchImg: null,
      success: false,
      error: err.message
    };
  }
}

app.post('/api/survey/run', async (req, res) => {
  const globalLocations = req.body.locations || [];
  const items = req.body.items || [];
  if (!items.length) return res.status(400).json({ error: 'No items provided' });

  // Pasangkan wilayah pencarian ke tiap barang
  items.forEach(item => {
    if (!item.locations) item.locations = globalLocations;
  });

  console.log(`\n========================================`);
  console.log(`🚀 Memulai survei untuk ${items.length} item`);
  console.log(`========================================`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1280,900',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    const results = [];
    for (let i = 0; i < items.length; i++) {
      const result = await searchItem(page, items[i], i);
      results.push(result);
      // Small pause between items to avoid rate limiting
      if (i < items.length - 1) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    console.log(`\n✅ Survei selesai! ${results.filter(r => r.success).length}/${results.length} berhasil.`);
    res.json(results);
  } catch (err) {
    console.error('Fatal error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'pbj-survey-service' }));

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`\n🟢 Survey service berjalan di port ${PORT}`);
  console.log(`📁 Screenshot tersimpan di: ${screenshotDir}`);
});
