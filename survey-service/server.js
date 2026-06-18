const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { HttpProxyAgent } = require('http-proxy-agent');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { SocksProxyAgent } = require('socks-proxy-agent');






// IN-MEMORY QUEUE REPLACEMENT
const surveyJobs = new Map();
let currentJobId = 1;
const surveyQueue = {
  add: async (name, data) => {
    const jobId = currentJobId++;
    surveyJobs.set(jobId.toString(), {
      id: jobId.toString(),
      data: data,
      progress: 0,
      status: 'waiting',
      results: null,
      error: null
    });
    // Mulai proses secara asinkron
    setTimeout(() => processJob(jobId.toString(), data), 100);
    return { id: jobId.toString() };
  }
};

async function processJob(jobId, data) {
  const job = surveyJobs.get(jobId);
  job.status = 'active';
  
  const updateProgress = async (percent) => {
     job.progress = percent;
  };
  
  try {
     const results = await runSurveyTask(data, updateProgress);
     job.results = results;
     job.status = 'completed';
     job.progress = 100;
  } catch (err) {
     job.error = err.message;
     job.status = 'failed';
  }
}

// --- ANTI-BOT HELPERS ---
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
];

async function randomDelay(min, max) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(r => setTimeout(r, ms));
}

async function autoScroll(page) {
  try {
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        let distance = 150;
        let timer = setInterval(() => {
          let scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= scrollHeight - window.innerHeight || totalHeight > 5000) {
            clearInterval(timer);
            resolve();
          }
        }, 120);
      });
    });
  } catch (e) {
    // Ignore scroll errors
  }
}
// -----------------------

// --- BROWSER POOL (Singleton + Isolated Context) ---
let _sharedBrowser = null;
let _currentProxy = null; // Menyimpan status proxy saat ini

async function getSharedBrowser(proxyStr = null) {
  let proxyHostPort = proxyStr;
  
  // Deteksi format IP:PORT:USER:PASS
  if (proxyStr && proxyStr.split(':').length === 4) {
    const parts = proxyStr.split(':');
    proxyHostPort = `${parts[0]}:${parts[1]}`;
  }

  // Jika browser sudah jalan tapi setting proxynya BERBEDA, kita matikan dulu
  if (_sharedBrowser && _sharedBrowser.isConnected() && _currentProxy !== proxyStr) {
    console.log(`[BrowserPool] Mengganti proxy dari ${_currentProxy || 'TIDAK ADA'} menjadi ${proxyStr || 'TIDAK ADA'}. Mematikan browser lama...`);
    try { await _sharedBrowser.close(); } catch(e) {}
    _sharedBrowser = null;
  }

  if (_sharedBrowser && _sharedBrowser.isConnected()) return _sharedBrowser;
  
  console.log(`[BrowserPool] Meluncurkan browser instance baru... (Proxy: ${proxyHostPort || 'TIDAK ADA'})`);
  _currentProxy = proxyStr;
  
  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--window-size=1280,900',
    '--disable-blink-features=AutomationControlled',
    '--max_old_space_size=512',
  ];

  if (proxyHostPort) {
    args.push(`--proxy-server=${proxyHostPort}`);
  }

  _sharedBrowser = await puppeteer.launch({
    headless: 'new',
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    args: args
  });
  _sharedBrowser.on('disconnected', () => {
    console.warn('[BrowserPool] Browser terputus, akan diluncurkan ulang saat diperlukan.');
    _sharedBrowser = null;
  });
  return _sharedBrowser;
}

/**
 * Buat halaman terisolasi (incognito context) dari shared browser.
 * Setiap context memiliki cookie, cache, dan storage sendiri.
 * Panggil closePage(context) setelah selesai untuk membebaskan memori.
 */
async function createIsolatedPage(proxyStr = null) {
  const browser = await getSharedBrowser(proxyStr);
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 900, height: 650, deviceScaleFactor: 2.0 });
  await page.setUserAgent(USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]);

  if (proxyStr && proxyStr.split(':').length === 4) {
    const parts = proxyStr.split(':');
    await page.authenticate({ username: parts[2], password: parts[3] });
  }

  // Request Interception: Blokir aset tidak relevan untuk mempercepat loading
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const type = req.resourceType();
    const url = req.url();
    const blockedDomains = [
      'google-analytics', 'googletagmanager', 'gtag', 'hotjar',
      'facebook.net', 'clarity.ms', 'doubleclick.net'
    ];
    const isBlockedType = ['font', 'media'].includes(type);
    const isBlockedDomain = blockedDomains.some(d => url.includes(d));
    if (isBlockedType || isBlockedDomain) {
      req.abort();
    } else {
      req.continue();
    }
  });

  return { page, context };
}

async function closePage(context) {
  try { await context.close(); } catch (e) { /* ignore */ }
}
// ---------------------------------------------------

const app = express();
app.use(cors());
app.use(express.json());

const screenshotDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

// BUKA AKSES: Izinkan peramban mengakses folder screenshot secara publik
app.use('/screenshots', express.static(screenshotDir));

// --- AUTO CLEANUP SCREENSHOTS (> 30 hari) ---
setInterval(() => {
  try {
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 hari dalam ms
    const now = Date.now();
    const files = fs.readdirSync(screenshotDir);
    let deleted = 0;
    for (const file of files) {
      const filePath = path.join(screenshotDir, file);
      const stat = fs.statSync(filePath);
      if (now - stat.mtimeMs > maxAge) {
        fs.unlinkSync(filePath);
        deleted++;
      }
    }
    if (deleted > 0) console.log(`[Cleanup] Menghapus ${deleted} screenshot lama (> 30 hari).`);
  } catch (e) {
    console.error('[Cleanup] Error:', e.message);
  }
}, 24 * 60 * 60 * 1000); // Jalankan setiap 24 jam
// -------------------------------------------


/**
 * Membersihkan nama barang dari spesifikasi kurung, stopwords pengadaan, dan satuan kemasan.
 */
function advancedCleanQuery(name) {
  if (!name) return '';
  let cleaned = name.trim();

  // 1. Cek jika di dalam tanda kurung ada kata 'konsolidasi', pertahankan sebelum menghapusnya
  const hasKonsolidasiInParens = /\(([^)]*konsolidasi[^)]*)\)/i.test(cleaned) || /\[([^\]]*konsolidasi[^\]]*)\]/i.test(cleaned);

  // Bersihkan tanda kurung biasa (...) dan kurung siku [...] beserta isinya
  cleaned = cleaned.replace(/\([^)]*\)/g, '');
  cleaned = cleaned.replace(/\[[^\]]*\]/g, '');

  if (hasKonsolidasiInParens) {
    cleaned += ' konsolidasi';
  }

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
    if (trimmed.length >= 2 && !uniqueAttempts.includes(trimmed)) {
      uniqueAttempts.push(trimmed);
    }
  });

  return uniqueAttempts;
}

/**
 * Menentukan batas harga min/max untuk filtering kandidat produk.
 * 
 * LOGIKA:
 * - Jika PP mengisi explicitMinPrice DAN/ATAU explicitMaxPrice → gunakan KETAT (mode per-produk)
 * - Jika keduanya kosong/null → hitung otomatis dari fallbackPrice ± toleransi % (mode massal)
 * 
 * @param {object} item - item dari payload pencarian
 * @returns {{ minPrice: number|null, maxPrice: number|null, isExplicit: boolean }}
 */
function resolvePriceRange(item) {
  const hasExplicitMin = item.explicitMinPrice !== null && item.explicitMinPrice !== undefined && item.explicitMinPrice > 0;
  const hasExplicitMax = item.explicitMaxPrice !== null && item.explicitMaxPrice !== undefined && item.explicitMaxPrice > 0;

  if (hasExplicitMin || hasExplicitMax) {
    // Mode per-produk: pakai batas yang diisi PP secara ketat
    return {
      minPrice: hasExplicitMin ? item.explicitMinPrice : null,
      maxPrice: hasExplicitMax ? item.explicitMaxPrice : null,
      isExplicit: true
    };
  }

  // Mode massal: hitung dari fallbackPrice ± toleransi %
  // Default 30% agar cakupan pencarian cukup lebar untuk variasi harga di e-Katalog
  if (item.fallbackPrice && item.fallbackPrice > 0) {
    const tolerance = item.priceTolerance !== undefined ? parseFloat(item.priceTolerance) / 100 : 0.30;
    return {
      minPrice: Math.floor(item.fallbackPrice * (1 - tolerance)),
      maxPrice: Math.floor(item.fallbackPrice * (1 + tolerance)),
      isExplicit: false
    };
  }

  return { minPrice: null, maxPrice: null, isExplicit: false };
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

async function injectWatermark(page) {
  try {
    await page.evaluate(() => {
      // Hapus watermark lama jika ada
      const oldWm = document.getElementById('pbj-watermark');
      if (oldWm) oldWm.remove();

      const wm = document.createElement('div');
      wm.id = 'pbj-watermark';
      wm.style.position = 'fixed';
      wm.style.bottom = '15px';
      wm.style.right = '15px';
      wm.style.backgroundColor = 'rgba(220, 38, 38, 0.85)';
      wm.style.color = 'white';
      wm.style.padding = '8px 16px';
      wm.style.fontSize = '13px';
      wm.style.fontWeight = 'bold';
      wm.style.fontFamily = 'monospace';
      wm.style.zIndex = '9999999';
      wm.style.borderRadius = '6px';
      wm.style.pointerEvents = 'none';
      wm.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.3)';
      wm.style.border = '2px solid rgba(255,255,255,0.2)';
      
      const now = new Date();
      wm.innerText = '🔒 BUKTI SURVEI E-KATALOG\\n' + now.toLocaleString('id-ID');
      
      document.body.appendChild(wm);

      // Sembunyikan elemen pengganggu (footer, sticky nav) agar fokus pada produk
      const style = document.createElement('style');
      style.innerHTML = `
        footer, .footer, #footer, .site-footer, .global-footer, .main-footer { display: none !important; }
        header, .header, #header, .navbar, .top-nav { position: static !important; }
      `;
      document.head.appendChild(style);
    });
  } catch (err) {
    console.error('Gagal menyuntikkan watermark:', err);
  }
}


async function searchItem(page, item, index) {
  const safeId = 'item_' + index + '_' + item.name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
  console.log(`\n[${index + 1}] Memproses: "${item.name}"`);

  try {
    const searchTarget = item.query && item.query.trim() ? item.query.trim() : item.name;

    // --- BYPASS: URL Spesifik ---
    if (item.targetUrl && item.targetUrl.startsWith('http')) {
      let urlPath = '';
      try { urlPath = new URL(item.targetUrl).pathname; } catch(e) {}
      const pathSegments = urlPath.split('/').filter(Boolean);
      
      const isSearchUrl = urlPath.startsWith('/search') || item.targetUrl.includes('?keyword=') || item.targetUrl.includes('catalogueSearch=');
      // LKPP V6 Product URL is usually /{vendor-slug}/{product-slug} -> length 2. Or /produk/...
      const isProductUrl = (!isSearchUrl && pathSegments.length >= 2) || urlPath.includes('/produk/') || urlPath.includes('/product/');
      const isStoreUrl = !isSearchUrl && !isProductUrl && pathSegments.length === 1 && !['login', 'register', 'dashboard'].includes(pathSegments[0].toLowerCase());

      if (isProductUrl) {
        // BYPASS: Jika user memasukkan link produk langsung
        console.log(`  → BYPASS (Produk): Mengunjungi URL referensi langsung: ${item.targetUrl}`);
        try {
          await page.goto(item.targetUrl, { waitUntil: 'networkidle2', timeout: 45000 });
          await randomDelay(3500, 6500); await autoScroll(page);
          // [SCREENSHOT ON-DEMAND] Tidak ada screenshot di sini. Gambar diambil oleh user via tombol di frontend.
          
          const detailData = await page.evaluate(() => {
            let price = null, vendor = null;
            const allText = document.body.innerText || '';
            const rpMatch = allText.match(/Rp\s*([\d.,]+)/);
            if (rpMatch) {
              const priceStr = rpMatch[1].replace(/\./g, '').replace(/,\d+$/, '');
              const parsed = parseInt(priceStr);
              if (parsed >= 100) price = parsed;
            }
            const vEl = document.querySelector('.penyedia-name') || document.querySelector('.card-body strong');
            if (vEl) vendor = vEl.innerText.trim();
            return { price, vendor };
          });

          // Validasi harga
          const { minPrice: bpMin, maxPrice: bpMax } = resolvePriceRange(item);
          const bpPrice = detailData.price || item.fallbackPrice;
          if (bpMin !== null && bpMin !== undefined && bpPrice < bpMin) {
            console.log(`  ⚠️ [BYPASS] Harga Rp ${bpPrice} di bawah min (Rp ${bpMin}). Lanjut pencarian manual...`);
          } else if (bpMax !== null && bpMax !== undefined && bpPrice > bpMax) {
            console.log(`  ⚠️ [BYPASS] Harga Rp ${bpPrice} melampaui max (Rp ${bpMax}). Lanjut pencarian manual...`);
          } else {
            return {
              name: item.name,
              query: searchTarget,
              vendor: detailData.vendor ? detailData.vendor : (item.targetVendor ? item.targetVendor.toUpperCase() : 'PENYEDIA TARGET'),
              price: bpPrice,
              link: item.targetUrl,
              img: null,
              searchImg: null,
              success: true
            };
          }
        } catch (err) {
          console.log(`  ❌ BYPASS gagal: ${err.message}. Lanjut pencarian manual...`);
        }
      } else if (isStoreUrl) {
        // URL toko penyedia (/{slug})
        const storeSlug = pathSegments[0].toLowerCase();
        console.log(`  ℹ️ [BYPASS] URL toko terdeteksi (/${storeSlug}), digunakan sebagai target vendor`);
        if (!item.targetVendor || !item.targetVendor.trim()) {
          item.targetVendor = storeSlug;
        }
      }
    }


    const attempts = getQueryAttempts(searchTarget);
    console.log(`  → Query pencarian yang akan dicoba (Target: ${searchTarget}):`, attempts);

    let searchData = [];
    let successfulQuery = '';
    // [SCREENSHOT ON-DEMAND] searchFile tidak lagi digunakan - screenshot diambil oleh frontend

    let searchScenarios = [];
    
    // ── Vendor page scenarios ──
    if (item.targetVendor) {
      // Mendukung 3 format input target vendor:
      // 1. URL penuh: https://katalog.inaproc.id/sultoni-wza2
      // 2. Slug langsung: sultoni-wza2
      // 3. Nama biasa: SULTONI → sultoni (mungkin salah, tapi dicoba)
      let vendorSlug;
      const rawVendor = item.targetVendor.trim();

      
      // Deteksi Cerdas Alias Vendor untuk vendor langganan lokal OPD
      const VENDOR_SLUG_ALIASES = {
        'sultoni': 'sultoni-wza2',
        'cv sultoni': 'sultoni-wza2',
        'cv. sultoni': 'sultoni-wza2',
        'cv.sultoni': 'sultoni-wza2'
      };

      const vendorLower = rawVendor.toLowerCase().trim();
      const normalizedVendorKey = vendorLower.replace(/[^a-z0-9]/g, ' ').trim().replace(/\s+/g, ' ');

      if (rawVendor.includes('katalog.inaproc.id/')) {
        // Format URL penuh → ekstrak path pertama
        const match = rawVendor.match(/katalog\.inaproc\.id\/([^/?&#]+)/);
        vendorSlug = match ? match[1].toLowerCase() : rawVendor.toLowerCase().replace(/[^a-z0-9-]/g, '-');
        console.log(`  ℹ️ [VENDOR] URL penuh dideteksi, slug: ${vendorSlug}`);
      } else if (VENDOR_SLUG_ALIASES[vendorLower]) {
        vendorSlug = VENDOR_SLUG_ALIASES[vendorLower];
        console.log(`  ℹ️ [VENDOR] Alias terdeteksi, memetakan ke slug asli: ${vendorSlug}`);
      } else if (VENDOR_SLUG_ALIASES[normalizedVendorKey]) {
        vendorSlug = VENDOR_SLUG_ALIASES[normalizedVendorKey];
        console.log(`  ℹ️ [VENDOR] Alias ternormalisasi terdeteksi, memetakan ke slug asli: ${vendorSlug}`);
      } else if (/^[a-z0-9][a-z0-9-]*[a-z0-9]$/i.test(rawVendor) && rawVendor.includes('-')) {
        // Sudah berupa slug (mengandung tanda hubung, alfanumerik saja)
        vendorSlug = rawVendor.toLowerCase();
        console.log(`  ℹ️ [VENDOR] Slug langsung digunakan: ${vendorSlug}`);
      } else {
        // Nama biasa → generate slug sederhana
        vendorSlug = rawVendor.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        console.log(`  ℹ️ [VENDOR] Nama biasa, slug dibuat: ${vendorSlug} (mungkin perlu URL lengkap jika gagal)`);
      }
      item._resolvedVendorSlug = vendorSlug; // Simpan untuk digunakan di isTargetMatch
      attempts.forEach(q => {
        searchScenarios.push({
          url: `https://katalog.inaproc.id/${vendorSlug}?catalogueSearch=${encodeURIComponent(q)}`,
          query: q,
          type: 'vendor'
        });
        searchScenarios.push({
          url: `https://katalog.inaproc.id/${vendorSlug}?keyword=${encodeURIComponent(q)}`,
          query: q,
          type: 'vendor'
        });
      });
      // Fallback: Kunjungi halaman utama toko tanpa parameter pencarian (memindai etalase terdepan)
      searchScenarios.push({
        url: `https://katalog.inaproc.id/${vendorSlug}`,
        query: item.query,
        type: 'vendor'
      });
    }

    // ── Global search scenarios ──
    attempts.forEach(q => {
      let sUrl = 'https://katalog.inaproc.id/search?keyword=' + encodeURIComponent(q);
      
      // ── FIX: Jika ignorePriceLimit=true, JANGAN kirim filter harga ke inaproc sama sekali
      // (sebelumnya maxPrice tetap terkirim ke URL meski toggle "Abaikan Harga" aktif,
      //  sehingga inaproc memblokir produk di atas pagu sebelum logika scoring kita melihatnya)
      if (!item.ignorePriceLimit) {
        // Gunakan fungsi terpusat: eksplisit PP diprioritaskan, fallback hanya jika tidak ada
        const { minPrice, maxPrice } = resolvePriceRange(item);
        if (minPrice !== null && minPrice !== undefined) sUrl += `&minPrice=${minPrice}`;
        if (maxPrice !== null && maxPrice !== undefined) sUrl += `&maxPrice=${maxPrice}`;
      }
      
      if (item.locations && item.locations.length > 0) {
        let rNames = [];
        let rCodes = [];
        item.locations.forEach(loc => {
          let lLower = loc.toLowerCase();
          if (lLower.includes('kota') && lLower.includes('probolinggo')) { 
            if (!rNames.includes('Kota Probolinggo')) { rNames.push('Kota Probolinggo'); rCodes.push('35.74'); }
          }
          else if (lLower.includes('probolinggo')) { 
            if (!rNames.includes('Kab. Probolinggo')) { rNames.push('Kab. Probolinggo'); rCodes.push('35.13'); }
          }
          else if (lLower.includes('surabaya')) { 
            if (!rNames.includes('Kota Surabaya')) { rNames.push('Kota Surabaya'); rCodes.push('35.78'); }
          }
        });
        if (rNames.length > 0) sUrl += '&regionNames=' + encodeURIComponent(rNames.join(','));
        if (rCodes.length > 0) sUrl += '&regionCode=' + encodeURIComponent(rCodes.join(','));
      }
      searchScenarios.push({ url: sUrl, query: q, type: 'global' });
    });

    // ── BUG FIX #3: Jika ada targetVendor, tambahkan fallback global tanpa filter harga SAMA SEKALI
    // Ini memastikan produk murah dari vendor target (misal SULTONI di harga 20rb saat pagu 32rb) tetap bisa muncul
    if (item.targetVendor) {
      attempts.forEach(q => {
        let sFallbackUrl = 'https://katalog.inaproc.id/search?keyword=' + encodeURIComponent(q);
        if (item.locations && item.locations.length > 0) {
          let rNames = [];
          let rCodes = [];
          item.locations.forEach(loc => {
            let lLower = loc.toLowerCase();
            if (lLower.includes('kota') && lLower.includes('probolinggo')) { 
              if (!rNames.includes('Kota Probolinggo')) { rNames.push('Kota Probolinggo'); rCodes.push('35.74'); }
            }
            else if (lLower.includes('probolinggo')) { 
              if (!rNames.includes('Kab. Probolinggo')) { rNames.push('Kab. Probolinggo'); rCodes.push('35.13'); }
            }
            else if (lLower.includes('surabaya')) { 
              if (!rNames.includes('Kota Surabaya')) { rNames.push('Kota Surabaya'); rCodes.push('35.78'); }
            }
          });
          if (rNames.length > 0) sFallbackUrl += '&regionNames=' + encodeURIComponent(rNames.join(','));
          if (rCodes.length > 0) sFallbackUrl += '&regionCode=' + encodeURIComponent(rCodes.join(','));
        }
        searchScenarios.push({ url: sFallbackUrl, query: q, type: 'global-noprice' });
      });
    }

    // ── FALLBACK NASIONAL ──
    // Jika user menginput lokasi, tapi di lokasi tersebut kosong, kita fallback cari secara nasional (tanpa region)
    if (item.locations && item.locations.length > 0) {
      attempts.forEach(q => {
        let sNasionalUrl = 'https://katalog.inaproc.id/search?keyword=' + encodeURIComponent(q);
        if (!item.ignorePriceLimit) {
          const { minPrice, maxPrice } = resolvePriceRange(item);
          if (minPrice !== null && minPrice !== undefined) sNasionalUrl += `&minPrice=${minPrice}`;
          if (maxPrice !== null && maxPrice !== undefined) sNasionalUrl += `&maxPrice=${maxPrice}`;
        }
        searchScenarios.push({ url: sNasionalUrl, query: q, type: 'fallback-nasional' });
      });
    }

    // ── STEP 1: Multi-Stage Search Loop ───────────────────────────────
    for (let i = 0; i < searchScenarios.length; i++) {
      const scenario = searchScenarios[i];
      const query = scenario.query;
      let searchUrl = scenario.url;
      
      console.log(`  → [Mencari #${i + 1} - ${scenario.type.toUpperCase()}] Membuka: ${searchUrl}`);
      
      try {
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 60000 });
        await randomDelay(3500, 6500); await autoScroll(page);

        // Ekstrak kandidat produk dari halaman pencarian
        const scenarioType = scenario.type;
        const currentTargetSlug = item._resolvedVendorSlug ? item._resolvedVendorSlug.replace(/-/g, ' ').toUpperCase() : (item.targetVendor ? item.targetVendor.toUpperCase() : 'PENYEDIA INAPROC');

        const candidates = await page.evaluate(({ type, defaultVendor }) => {
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
            if ((title.toLowerCase() === 'barang' || title.toLowerCase() === 'jasa') && lines.length > 1) {
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

            let vendor = defaultVendor;
            if (type !== 'vendor') {
               // Pada halaman pencarian global LKPP, URL bisa jadi /vendor-slug/product-slug
               // Tapi bisa juga /produk/id/slug, jika /produk/ maka kita harus mengekstrak vendor dari elemen card jika ada
               const vendorSlug = segments[0];
               if (vendorSlug.toLowerCase() === 'produk' || vendorSlug.toLowerCase() === 'product') {
                  // Coba cari elemen vendor di dalam card, biasanya ada di elemen div atau text biasa
                  const vendorLine = lines.find(l => !l.includes('Rp') && !l.includes('Kab.') && !l.includes('Kota') && !l.includes('Prov.') && l.length > 5 && l !== title);
                  vendor = vendorLine ? vendorLine.trim().toUpperCase() : 'PENYEDIA INAPROC';
               } else {
                  vendor = vendorSlug.replace(/-/g, ' ').toUpperCase();
               }
            }

            const locationLine = lines.find(line => line.includes('Kab.') || line.includes('Kota') || line.includes('Prov.'));
            const location = locationLine ? locationLine.trim() : '';

            list.push({
              title,
              price,
              vendor,
              productHref: href,
              location: location
            });
          }
          return list;
        }, { type: scenarioType, defaultVendor: currentTargetSlug });

        if (candidates && candidates.length > 0) {
          if (scenario.type === 'global-noprice') {
            const vendorMatchKeyword = item._resolvedVendorSlug ? item._resolvedVendorSlug.replace(/-/g, ' ') : (item.targetVendor ? item.targetVendor.replace(/-/g, ' ') : null);
            const hasTargetVendor = vendorMatchKeyword && candidates.some(c => 
              c.vendor.toLowerCase().includes(vendorMatchKeyword.toLowerCase())
            );
            if (!hasTargetVendor) {
              console.log(`    ℹ️ Fallback global (tanpa harga) tidak menemukan produk dari ${vendorMatchKeyword}, dilewati.`);
              continue;
            }
            if (searchData.length > 0) {
              const newVendorProducts = candidates.filter(c => 
                vendorMatchKeyword && c.vendor.toLowerCase().includes(vendorMatchKeyword.toLowerCase())
              );
              searchData = [...searchData, ...newVendorProducts.filter(nc => 
                !searchData.some(sd => sd.productHref === nc.productHref)
              )];
              console.log(`    ✅ Menggabungkan ${newVendorProducts.length} produk ${vendorMatchKeyword} dari fallback ke searchData.`);
              break;
            }
            searchData = candidates;
            successfulQuery = query;
            // [SCREENSHOT ON-DEMAND] Tidak ada screenshot pencarian di sini.
          } else {
            // Merge results to ensure we have enough data for autoComparator
            searchData = [...searchData, ...candidates.filter(nc => 
              !searchData.some(sd => sd.productHref === nc.productHref)
            )];
            successfulQuery = query;
            // [SCREENSHOT ON-DEMAND] Tidak ada screenshot pencarian di sini.
            console.log(`    ✅ Berhasil menemukan ${candidates.length} produk dengan query: "${query}"`);
            
            // Break if we don't need comparator or if we have found at least one candidate from a different vendor
            let hasComparator = false;
            if (item.autoComparator && searchData.length > 0) {
              const baseVendor = item.targetVendor 
                ? item.targetVendor.toLowerCase().trim() 
                : searchData[0].vendor.toLowerCase().trim();
              const baseSlug = item._resolvedVendorSlug 
                ? item._resolvedVendorSlug.toLowerCase().trim() 
                : baseVendor.replace(/[^a-z0-9]/g, '-');
              hasComparator = searchData.some(c => {
                const vendorLower = c.vendor.toLowerCase().trim();
                return vendorLower !== baseVendor && 
                       (!baseSlug || !vendorLower.includes(baseSlug.replace(/-/g, ' ')));
              });
            }

            if (!item.autoComparator || (scenario.type === 'global' && hasComparator)) {
              break;
            } else {
               console.log(`    ℹ️ Auto Comparator aktif (Comparator ditemukan: ${hasComparator}), lanjut mencari referensi lain...`);
            }
          }
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
      // Tentukan kata kunci pencocokan vendor: gunakan bagian pertama dari slug (sebelum '-')
      // Contoh: slug 'sultoni-wza2' → kata kunci 'sultoni'
      // Ini memastikan vendor 'SULTONI WZA2' tetap cocok jika user ketik 'SULTONI'
      const vendorMatchKeyword = (() => {
        if (!item.targetVendor) return null;
        const slug = item._resolvedVendorSlug || item.targetVendor;
        // Jangan dipotong '-' jika slug sudah spesifik (misal sultoni-wza2)
        // Cukup ganti '-' dengan spasi agar cocok dengan nama vendor (SULTONI WZA2)
        return slug.replace(/-/g, ' ');
      })();
      searchData.forEach(cand => {
        // HUKUM BATAS PAGU (PRICE CEILING) — berlaku mutlak
        const isTargetMatch = vendorMatchKeyword && cand.vendor.toLowerCase().includes(vendorMatchKeyword.toLowerCase());
        
        if (!item.ignorePriceLimit) {
          const { minPrice, maxPrice, isExplicit } = resolvePriceRange(item);
          
          if (minPrice !== undefined && minPrice !== null && cand.price < minPrice) {
            console.log(`    🚫 [TOLAK] Harga Rp ${cand.price} terlalu murah (di bawah batas Rp ${minPrice}): ${cand.title}`);
            return;
          }
          if (maxPrice !== undefined && maxPrice !== null && cand.price > maxPrice) {
            if (isTargetMatch && !isExplicit) {
              console.log(`    ⚠️ [TOLERANSI TARGET] Harga Rp ${cand.price} melampaui batas atas (Rp ${maxPrice}) TAPI diizinkan karena ini dari Target Penyedia (bisa dinego)`);
            } else {
              console.log(`    🚫 [TOLAK] Harga Rp ${cand.price} melampaui batas atas (Rp ${maxPrice}) kustom/pagu: ${cand.title}`);
              return;
            }
          }
        }

        let score = getSimilarityScore(searchTarget, cand.title);
        
        // 🛡️ LEGAL SHIELD: Boost skor jika sesuai target penyedia
        if (isTargetMatch) {
          score += 10.0;
          console.log(`    ⭐ [TARGET MATCH] Vendor ${cand.vendor} mendapat prioritas mutlak!`);
        }

        cand.score = score;
        console.log(`    - [Skor: ${score.toFixed(3)}] ${cand.title} (Vendor: ${cand.vendor}, Rp ${cand.price})`);
        if (score > highestScore) {
          highestScore = score;
          bestCandidate = cand;
        } else if (Math.abs(score - highestScore) < 0.001 && bestCandidate) {
          // ── BUG FIX #5: TIE-BREAKER yang lebih cerdas
          // Jika keduanya dari target vendor → pilih yang lebih murah (hemat anggaran)
          // Jika hanya salah satu dari target vendor → target vendor menang tanpa syarat
          const candIsTarget = vendorMatchKeyword && cand.vendor.toLowerCase().includes(vendorMatchKeyword.toLowerCase());
          const bestIsTarget = vendorMatchKeyword && bestCandidate.vendor.toLowerCase().includes(vendorMatchKeyword.toLowerCase());
          
          if (candIsTarget && bestIsTarget) {
            // Keduanya target vendor → pilih lebih murah
            if (cand.price && bestCandidate.price && cand.price < bestCandidate.price) {
              console.log(`    ⚖️ [TIE-BREAKER TARGET] Keduanya SULTONI, pilih lebih murah: Rp ${cand.price}`);
              bestCandidate = cand;
            }
          } else if (candIsTarget && !bestIsTarget) {
            // Kandidat baru dari target vendor → menang
            console.log(`    ⚖️ [TIE-BREAKER TARGET] ${cand.vendor} adalah target vendor, menang atas ${bestCandidate.vendor}`);
            highestScore = score;
            bestCandidate = cand;
          } else if (!candIsTarget && !bestIsTarget) {
            // Tidak ada yang target vendor → pilih lebih murah
            if (cand.price && bestCandidate.price && cand.price < bestCandidate.price) {
              console.log(`    ⚖️ [TIE-BREAKER HARGA] Memilih harga lebih murah: Rp ${cand.price} vs Rp ${bestCandidate.price}`);
              highestScore = score;
              bestCandidate = cand;
            }
          }
          // (candIsTarget=false && bestIsTarget=true) → bestCandidate tetap menang, tidak perlu action
        }
      });
    }

    let comparators = [];
    const isValidMatch = bestCandidate && highestScore >= 0.01;
    if (isValidMatch) {
      console.log(`  🌟 Produk Terpilih: "${bestCandidate.title}" dengan skor ${highestScore.toFixed(3)}`);
      
      // AUTO-COMPARATOR LOGIC
      // Aturan ketat: Penyedia pembanding TIDAK BOLEH sama dengan penyedia target.
      const limitComparators = item.maxProviders === undefined ? 2 : (item.maxProviders === 0 ? Infinity : Math.max(0, item.maxProviders - 1));

      if (item.autoComparator && limitComparators > 0) {
        const otherCandidates = searchData.filter(c => 
          c !== bestCandidate && 
          c.price && 
          c.price >= bestCandidate.price &&
          c.vendor !== bestCandidate.vendor
        );
        
        if (otherCandidates.length > 0) {
          otherCandidates.sort((a, b) => a.price - b.price);
          
          for (let i = 0; i < Math.min(otherCandidates.length, limitComparators); i++) {
            comparators.push({
              name: otherCandidates[i].title,
              vendor: otherCandidates[i].vendor,
              price: otherCandidates[i].price,
              link: 'https://katalog.inaproc.id' + otherCandidates[i].productHref,
              alasan: i === 0 ? 'Harga e-Katalog lebih efisien dari penyedia potensial lainnya' : 'Alternatif penyedia potensial e-Katalog dengan harga lebih tinggi',
              status: 'Dalam Katalog'
            });
            console.log(`  ⚖️ Auto-Comparator ${i+1} Ditemukan: ${comparators[i].vendor} - Rp ${comparators[i].price}`);
          }
        }

        if (comparators.length < limitComparators) {
          console.log(`  🔍 Memulai pencarian spesifik untuk Pembanding tanpa batas maxPrice...`);
          let compUrl = 'https://katalog.inaproc.id/search?keyword=' + encodeURIComponent(successfulQuery || searchTarget);
          
          if (item.locations && item.locations.length > 0) {
            let rNames = [];
            let rCodes = [];
            item.locations.forEach(loc => {
              let lLower = (typeof loc === 'string' ? loc : loc.name || '').toLowerCase();
              if (lLower.includes('kota') && lLower.includes('probolinggo')) { 
                if (!rNames.includes('Kota Probolinggo')) { rNames.push('Kota Probolinggo'); rCodes.push('35.74'); }
              } else if (lLower.includes('probolinggo')) { 
                if (!rNames.includes('Kab. Probolinggo')) { rNames.push('Kab. Probolinggo'); rCodes.push('35.13'); }
              } else if (lLower.includes('surabaya')) { 
                if (!rNames.includes('Kota Surabaya')) { rNames.push('Kota Surabaya'); rCodes.push('35.78'); }
              }
            });
            if (rNames.length > 0) {
              compUrl += `&regionNames=${encodeURIComponent(rNames.join(','))}&regionCode=${encodeURIComponent(rCodes.join(','))}`;
            }
          }
          
          // JANGAN include maxPrice agar menemukan produk kompetitor yang lebih mahal
          if (!item.ignorePriceLimit) {
            const { minPrice } = resolvePriceRange(item);
            if (minPrice !== null && minPrice !== undefined) compUrl += `&minPrice=${minPrice}`;
          }

          try {
            await page.goto(compUrl, { waitUntil: 'networkidle2', timeout: 45000 });
            await randomDelay(3500, 6500); await autoScroll(page);
            
            const extraCandidates = await page.evaluate(() => {
              const cards = document.querySelectorAll('.card');
              return Array.from(cards).map(card => {
                const titleEl = card.querySelector('.card-title');
                const priceEl = card.querySelector('.price');
                const aEl = card.querySelector('a');
                const vendorEl = card.querySelector('.card-text');
                
                let p = 0;
                if (priceEl && priceEl.textContent) {
                  const cleaned = priceEl.textContent.replace(/Rp\.?|rp\.?|,00/g, '').replace(/\./g, '').trim();
                  p = parseInt(cleaned, 10) || 0;
                }
                let vendor = vendorEl ? vendorEl.textContent.trim() : '';
                const parts = vendor.split(/[\r\n]+/);
                if (parts.length > 0) {
                  vendor = parts[0].trim().toUpperCase();
                }
                return {
                  title: titleEl ? titleEl.textContent.trim() : '',
                  price: p,
                  productHref: aEl ? aEl.getAttribute('href') : '',
                  vendor: vendor
                };
              });
            });
            
            for (let c of extraCandidates) {
              if (c.title && c.vendor && c.vendor !== bestCandidate.vendor && c.price >= bestCandidate.price) {
                if (!comparators.find(comp => comp.vendor === c.vendor)) {
                  comparators.push({
                    name: c.title,
                    vendor: c.vendor,
                    price: c.price,
                    link: 'https://katalog.inaproc.id' + c.productHref,
                    alasan: 'Alternatif penyedia potensial e-Katalog',
                    status: 'Dalam Katalog'
                  });
                  console.log(`  ⚖️ Extra Auto-Comparator Ditemukan: ${c.vendor} - Rp ${c.price}`);
                  if (comparators.length >= limitComparators) break;
                }
              }
            }
          } catch (e) {
            console.log(`  ⚠️ Gagal mencari extra comparator: ${e.message}`);
          }
        }
      }

    } else {
      if (bestCandidate) {
        console.log(`  ⚠️ Produk terdekat "${bestCandidate.title}" memiliki skor terlalu rendah (${highestScore.toFixed(3)}).`);
      }
      console.log(`  ⚠️ Tidak menemukan produk yang cocok di e-Katalog, menggunakan fallback default.`);
    }

    // ── STEP 3: Navigate to product detail (Direct clean link) ─────────
    let detailUrl = 'https://katalog.inaproc.id/search?keyword=' + encodeURIComponent(successfulQuery || searchTarget);
    if (!item.ignorePriceLimit) {
      const { minPrice: dMin, maxPrice: dMax } = resolvePriceRange(item);
      if (dMin !== null && dMin !== undefined) detailUrl += `&minPrice=${dMin}`;
      if (dMax !== null && dMax !== undefined) detailUrl += `&maxPrice=${dMax}`;
    }
    if (item.locations && item.locations.length > 0) {
        let rNames = [];
        let rCodes = [];
        item.locations.forEach(loc => {
          let lLower = loc.toLowerCase();
          if (lLower.includes('kota') && lLower.includes('probolinggo')) { 
            if (!rNames.includes('Kota Probolinggo')) { rNames.push('Kota Probolinggo'); rCodes.push('35.74'); }
          }
          else if (lLower.includes('probolinggo')) { 
            if (!rNames.includes('Kab. Probolinggo')) { rNames.push('Kab. Probolinggo'); rCodes.push('35.13'); }
          }
          else if (lLower.includes('surabaya')) { 
            if (!rNames.includes('Kota Surabaya')) { rNames.push('Kota Surabaya'); rCodes.push('35.78'); }
          }
        });
        if (rNames.length > 0) detailUrl += '&regionNames=' + encodeURIComponent(rNames.join(','));
        if (rCodes.length > 0) detailUrl += '&regionCode=' + encodeURIComponent(rCodes.join(','));
    }
    let finalVendor = 'PENYEDIA INAPROC';
    let finalPrice = item.fallbackPrice;
    const originalSearchUrl = detailUrl;

    if (isValidMatch) {
      // Tautan langsung produk format bersih: https://katalog.inaproc.id/{nama-lapak}/{nama-produk}
      const directUrl = 'https://katalog.inaproc.id' + bestCandidate.productHref;
      detailUrl = directUrl;
      finalVendor = bestCandidate.vendor;
      finalPrice = bestCandidate.price || item.fallbackPrice;

      try {
        console.log(`  → Membuka halaman detail produk terpilih: ${directUrl}`);
        await page.goto(directUrl, { waitUntil: 'networkidle2', timeout: 45000 });
        await randomDelay(3500, 6500); await autoScroll(page);

        // --- SMART VALIDATION (Deteksi Soft 404) ---
        const isSoft404 = await page.evaluate(() => {
          const bodyText = document.body.innerText || '';
          if (bodyText.includes('Produk Tidak Ditemukan') || bodyText.includes('Page Not Found') || !bodyText.includes('Rp')) {
            return true;
          }
          return false;
        });

        if (isSoft404) {
          throw new Error('Halaman detail kosong atau produk tidak ditemukan (Soft 404)');
        }
        // -------------------------------------------

        // [SCREENSHOT ON-DEMAND] Screenshot tidak diambil di sini.
        // Gambar diambil oleh user via tombol di frontend setelah survei selesai.
        console.log(`  ✅ Detail produk diverifikasi: ${directUrl}`);

        // Update harga atau vendor jika ada informasi yang lebih akurat di halaman detail
        const detailData = await page.evaluate(() => {
          let price = null;
          let vendor = null;
          let location = null;

          const allText = document.body.innerText;
          const rpMatch = allText.match(/Rp\s*([\d.,]+)/);
          if (rpMatch) {
            const priceStr = rpMatch[1].replace(/\./g, '').replace(/,\d+$/, '');
            const parsed = parseInt(priceStr);
            if (parsed >= 100) price = parsed;
          }

          // Ekstrak Alamat Lengkap Perusahaan / Toko dari halaman detail
          // Biasanya ada label 'Alamat Perusahaan' atau sejenisnya di Profil Penyedia
          const textLines = allText.split('\n').map(l => l.trim()).filter(Boolean);
          const addressIndex = textLines.findIndex(line => 
            line.toLowerCase().includes('alamat perusahaan') || 
            line.toLowerCase().includes('alamat toko')
          );
          
          if (addressIndex !== -1 && addressIndex + 1 < textLines.length) {
            // Ambil baris berikutnya yang berisi teks alamat lengkap
            const potentialAddress = textLines[addressIndex + 1];
            if (potentialAddress.length > 5) {
              location = potentialAddress.replace(/^:\s*/, '').trim();
            }
          }

          if (!location) {
            // Fallback: Cari baris yang mengandung 'kecamatan' atau 'kabupaten'
            const subdistrictLine = textLines.find(line => 
              (line.toLowerCase().includes('kecamatan') || line.toLowerCase().includes('kabupaten')) && 
              line.toLowerCase().includes('probolinggo')
            );
            if (subdistrictLine) {
              location = subdistrictLine.replace(/^:\s*/, '').trim();
            }
          }

          return { price, vendor, location };
        });

        if (detailData.price) finalPrice = detailData.price;
        if (detailData.vendor) finalVendor = detailData.vendor;
        if (detailData.location) {
          bestCandidate.location = detailData.location;
          console.log(`  → Menemukan alamat detail penyedia: ${detailData.location}`);
        }
        console.log(`  → Detail terverifikasi: harga=${finalPrice}, vendor=${finalVendor}`);

      } catch (err) {
        console.log(`  ⚠️ Gagal buka detail (${err.message}), menggunakan data hasil pencarian`);
        // detailUrl = originalSearchUrl; // DIHAPUS: Tetap pertahankan link produk asli agar tidak terjadi mismatch di dokumen!
        
        // --- VISUAL HIGHLIGHT FALLBACK ---
        console.log(`  → Menyuntikkan KOTAK MERAH pada hasil pencarian global...`);
        try {
           await page.goto(originalSearchUrl, { waitUntil: 'networkidle2', timeout: 45000 });
           await randomDelay(3500, 6500); await autoScroll(page);
           
           await page.evaluate((targetHref) => {
              const anchors = Array.from(document.querySelectorAll('a[href]'));
              let targetElement = null;
              
              // Cari kartu yang secara spesifik memiliki URL/Link persis produk ini (menghindari produk kembar)
              for (const a of anchors) {
                const href = a.getAttribute('href');
                // Abaikan link header/footer
                if (!href || !href.startsWith('/') || href === '/' || href === '/search') continue;
                
                if (href.includes(targetHref)) {
                   targetElement = a;
                   break;
                }
              }
              
              if (targetElement) {
                // Beri efek blur pada semua kartu lain agar auditor fokus ke target
                anchors.forEach(card => {
                  if (card.getAttribute('href') && card.getAttribute('href').startsWith('/') && card.getAttribute('href') !== '/' && card.getAttribute('href') !== '/search') {
                    card.style.opacity = '0.35';
                    card.style.filter = 'blur(1px)';
                    card.style.transition = 'all 0.3s';
                  }
                });
                
                // Highlight targetElement
                targetElement.style.opacity = '1';
                targetElement.style.filter = 'none';
                targetElement.style.border = '4px solid #ef4444';
                targetElement.style.borderRadius = '8px';
                targetElement.style.boxShadow = '0 0 20px rgba(239,68,68,0.8)';
                targetElement.style.position = 'relative';
                targetElement.style.zIndex = '9999';
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
               }
            }, bestCandidate.productHref);
           
           // [SCREENSHOT ON-DEMAND] Highlight dilakukan tapi tidak di-screenshot di sini.
           console.log(`  ✅ Detail gagal dibuka, link pencarian akan digunakan sebagai fallback.`);
        } catch (highlighterr) {
           console.log(`  ⚠️ Gagal melakukan highlight fallback: ${highlighterr.message}`);
        }
        // ---------------------------------
      }
    }

    const isSuccess = !!bestCandidate;

    return {
      name: item.name,
      vendor: isSuccess ? finalVendor.toUpperCase() : 'TIDAK TERSEDIA',
      price: isSuccess ? (finalPrice || item.fallbackPrice) : 0,
      link: detailUrl,
      location: bestCandidate ? bestCandidate.location : '',
      img: null,        // [SCREENSHOT ON-DEMAND] Gambar diambil oleh user via tombol di frontend
      searchImg: null,  // [SCREENSHOT ON-DEMAND] Gambar diambil oleh user via tombol di frontend
      success: isSuccess,
      comparators: comparators,
      minPrice: item.explicitMinPrice || null
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
      error: err.message,
      minPrice: item.explicitMinPrice || null
    };
  }
}

app.post('/api/survey/run', async (req, res) => {
  const globalLocations = req.body.locations || [];
  const items = req.body.items || [];
  if (!items.length) return res.status(400).json({ error: 'No items provided' });

  const ignorePriceLimit = req.body.ignorePriceLimit === true;
  const autoComparator = req.body.autoComparator === true;
  const maxProviders = req.body.maxProviders !== undefined ? req.body.maxProviders : 3;

  // Pasangkan wilayah pencarian dan opsi ke tiap barang
  items.forEach(item => {
    if (!item.locations) item.locations = globalLocations;
    item.ignorePriceLimit = ignorePriceLimit;
    item.autoComparator = autoComparator;
    item.maxProviders = maxProviders;
  });

  // Tambahkan job ke antrean Redis
  console.log('Received payload items:', items);
  const job = await surveyQueue.add('survey', { items });
  console.log(`[Queue] Diterima Job ID: ${job.id} untuk ${items.length} item.`);
  
  res.json({ jobId: job.id });
});

app.get('/api/survey/status/:id', async (req, res) => {
  const job = surveyJobs.get(req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  let state = job.status;
  if (state === 'completed') {
    return res.json({ status: 'completed', results: job.results, isCanceled: false });
  } else if (state === 'failed') {
    return res.json({ status: 'failed', error: job.error, isCanceled: false });
  } else {
    return res.json({ status: state, progress: job.progress, isCanceled: false });
  }
});

app.post('/api/survey/find-comparator', async (req, res) => {
  const { query, originalVendor } = req.body;
  if (!query) return res.status(400).json({ error: 'Query is required' });
  
  const jobId = Date.now().toString() + '_' + Math.floor(Math.random() * 1000);
  let context;
  try {
    const { page, context: _ctx } = await createIsolatedPage();
    context = _ctx;
    
    console.log(`[Comparator] Searching for: ${query}`);
    await page.goto(`https://katalog.inaproc.id/search?keyword=${encodeURIComponent(query)}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await randomDelay(3500, 6500); await autoScroll(page);
    
    const extractCandidates = () => {
        const rpElements = Array.from(document.querySelectorAll('*')).filter(el => {
            return el.children.length === 0 && el.textContent.includes('Rp');
        });
        
        const list = [];
        for (const rpEl of rpElements) {
            let curr = rpEl;
            let aTag = null;
            let card = null;
            while (curr && curr !== document.body) {
                if (curr.tagName === 'A' && !aTag) aTag = curr;
                if (curr.className && typeof curr.className === 'string' && curr.className.includes('card')) card = curr;
                curr = curr.parentElement;
            }
            
            const container = card || aTag || rpEl.parentElement.parentElement;
            if (container) {
                const href = aTag ? aTag.getAttribute('href') : (container.querySelector('a') ? container.querySelector('a').getAttribute('href') : '');
                const text = container.innerText.replace(/\n/g, ' | ');
                
                if (!list.some(item => item.href === href)) {
                    // Extract Vendor from text heuristically (usually 3rd or 4th item after split by |)
                    const parts = text.split(' | ');
                    const name = parts[0] || 'Produk';
                    let price = 0;
                    const pricePart = parts.find(p => p.includes('Rp'));
                    if (pricePart) {
                       price = parseInt(pricePart.replace(/[^0-9]/g, '')) || 0;
                    }
                    
                    let vendor = 'Vendor e-Katalog';
                    if (parts.length > 2) {
                       vendor = parts[2];
                    }
                    
                    list.push({ text, href, name, price, vendor });
                }
            }
        }
        return list;
    };
    
    const results = await page.evaluate(extractCandidates);
    let bestResult = null;
    
    // Find a comparator that is preferably a DIFFERENT vendor
    for (const r of results) {
       if (r.href && r.href.startsWith('/') && (!originalVendor || !r.vendor.toLowerCase().includes(originalVendor.toLowerCase()))) {
           bestResult = r;
           break;
       }
    }
    
    if (!bestResult && results.length > 0 && results[0].href && results[0].href.startsWith('/')) {
        bestResult = results[0];
    }
    
    if (!bestResult) {
        throw new Error('Tidak ditemukan pembanding yang sesuai di halaman pertama');
    }
    
    const detailUrl = `https://katalog.inaproc.id${bestResult.href}`;
    let finalUrl = detailUrl;
    console.log(`[Comparator] Found: ${detailUrl}`);
    
    try {
        await page.goto(detailUrl, { waitUntil: 'networkidle2', timeout: 45000 });
        await randomDelay(3500, 6500); await autoScroll(page);
        
        // --- SMART VALIDATION (Deteksi Soft 404) ---
        const isSoft404 = await page.evaluate(() => {
          const bodyText = document.body.innerText || '';
          if (bodyText.includes('Produk Tidak Ditemukan') || bodyText.includes('Page Not Found') || !bodyText.includes('Rp')) {
            return true;
          }
          return false;
        });

        if (isSoft404) {
          throw new Error('Halaman detail kosong atau produk tidak ditemukan (Soft 404)');
        }
    } catch (err) {
        console.log(`[Comparator] ⚠️ Gagal buka detail (${err.message}), menggunakan data hasil pencarian`);
        const searchUrl = `https://katalog.inaproc.id/search?keyword=${encodeURIComponent(query)}`;
        finalUrl = searchUrl;
        
        // --- VISUAL HIGHLIGHT FALLBACK ---
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 45000 });
        await randomDelay(3500, 6500); await autoScroll(page);
        
        await page.evaluate((targetHref) => {
            const anchors = Array.from(document.querySelectorAll('a[href]'));
            let targetElement = null;
            
            for (const a of anchors) {
                if (a.getAttribute('href') === targetHref) {
                    targetElement = a;
                    break;
                }
            }
            
            if (targetElement) {
                anchors.forEach(card => {
                    if (card.getAttribute('href') && card.getAttribute('href').startsWith('/') && card.getAttribute('href') !== '/' && card.getAttribute('href') !== '/search') {
                        card.style.opacity = '0.35';
                        card.style.filter = 'blur(1px)';
                        card.style.transition = 'all 0.3s';
                    }
                });
                
                targetElement.style.opacity = '1';
                targetElement.style.filter = 'none';
                targetElement.style.border = '4px solid #ef4444';
                targetElement.style.borderRadius = '8px';
                targetElement.style.boxShadow = '0 0 20px rgba(239,68,68,0.8)';
                targetElement.style.position = 'relative';
                targetElement.style.zIndex = '9999';
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, bestResult.href);
        
        await new Promise(r => setTimeout(r, 1500)); // Tunggu render efek css
    }
    
    await injectWatermark(page);
    
    const screenshotName = `comparator_${jobId}.png`;
    const screenshotPath = path.join(screenshotDir, screenshotName);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    
    await closePage(context);
    context = null;
    
    res.json({
       success: true,
       name: bestResult.name,
       vendor: bestResult.vendor,
       price: bestResult.price,
       detailUrl: finalUrl,
       screenshotUrl: `/screenshots/${screenshotName}`
    });
    
  } catch (error) {
    if (context) await closePage(context).catch(() => {});
    console.error('[Comparator] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to find comparator' });
  }
});

app.post('/api/survey/screenshot', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  // Deteksi apakah ini URL detail produk (path: /vendor/produk) atau URL pencarian
  const isDetailUrl = (() => {
    try {
      const u = new URL(url);
      return !u.pathname.startsWith('/search') && !u.search.includes('keyword=') && u.pathname.split('/').filter(Boolean).length >= 2;
    } catch { return false; }
  })();
  
  const jobId = Date.now().toString() + '_' + Math.floor(Math.random() * 1000);
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1280,900',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-blink-features=AutomationControlled'
      ]
    });

    const page = await browser.newPage();
    // Viewport 1280px agar layout desktop e-Katalog terbuka penuh (2 kolom: gambar kiri, info kanan)
    await page.setViewport({ width: 1280, height: 850, deviceScaleFactor: 1.5 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    console.log(`[Screenshot] Membuka URL (${isDetailUrl ? 'Detail Produk' : 'Pencarian'}): ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    // Tunggu gambar produk selesai loading (lazy-load)
    await randomDelay(4000, 6000);

    if (isDetailUrl) {
      // ─── Mode Detail Produk ─────────────────────────────────────────────
      // Sembunyikan HANYA popup/cookie banner yang mengganggu, BUKAN header utama
      // Header e-Katalog (logo INAPROC + menu) harus tetap terlihat agar tampak resmi
      await page.evaluate(() => {
        const toHide = [
          '[class*="cookie"]', '[id*="cookie"]',
          '[class*="popup"]',  '[id*="popup"]',
          '[class*="chat"]',   '[id*="chat"]',
          '[class*="whatsapp"]',
          'footer', '.footer', '#footer',
          '[class*="toast"]',  '[class*="notification"]'
        ];
        toHide.forEach(sel => {
          try {
            document.querySelectorAll(sel).forEach(el => {
              if (el && el.style) el.style.setProperty('display', 'none', 'important');
            });
          } catch(e) {}
        });
      });

      // Scroll ke area konten produk (gambar + harga) — di bawah header navbar
      await page.evaluate(() => {
        // Cari elemen gambar produk utama (biasanya tag img di area kiri)
        const imgEl = document.querySelector('img[src*="inaproc"], img[alt*="produk"], img[class*="product"], .product-image img, .detail-image img');
        if (imgEl) {
          const rect = imgEl.getBoundingClientRect();
          // Scroll agar gambar ada di 1/5 bagian atas viewport
          window.scrollTo({ top: Math.max(0, window.scrollY + rect.top - 80), behavior: 'instant' });
        } else {
          // Fallback: scroll sedikit ke bawah melewati breadcrumb
          window.scrollTo({ top: 100, behavior: 'instant' });
        }
      });

      await randomDelay(1500, 2000);

    } else {
      // ─── Mode Pencarian / Grid ─────────────────────────────────────────
      await autoScroll(page);
      await page.evaluate(() => window.scrollTo(0, 0));
      await randomDelay(800, 1200);
    }

    // Inject watermark resmi
    await injectWatermark(page);

    const screenshotPath = path.join(screenshotDir, `manual_${jobId}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });

    await browser.close();
    console.log(`[Screenshot] Berhasil disimpan: manual_${jobId}.png`);

    res.json({ success: true, img: `/screenshots/manual_${jobId}.png` });
  } catch (err) {
    console.error('Manual screenshot error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/survey/analyze', async (req, res) => {
  const { keyword, targetVendor, pagu } = req.body;
  if (!keyword) return res.status(400).json({ error: 'Keyword is required' });

  const numPagu = parseInt(pagu) || 0;
  
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1280,900',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      , '--disable-blink-features=AutomationControlled']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 900, height: 650, deviceScaleFactor: 2.0 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    await page.goto(`https://katalog.inaproc.id/search?keyword=${encodeURIComponent(keyword)}`, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Tunggu render
    await new Promise(r => setTimeout(r, 3000));
    
    const extractCandidates = () => {
      const rpElements = Array.from(document.querySelectorAll('*')).filter(el => {
          return el.children.length === 0 && el.textContent.includes('Rp');
      });
      
      const list = [];
      for (const rpEl of rpElements) {
          let curr = rpEl;
          let aTag = null;
          let card = null;
          while (curr && curr !== document.body) {
              if (curr.tagName === 'A' && !aTag) aTag = curr;
              if (curr.className && typeof curr.className === 'string' && curr.className.includes('card')) card = curr;
              curr = curr.parentElement;
          }
          
          const container = card || aTag || rpEl.parentElement.parentElement;
          if (container) {
              const href = aTag ? aTag.getAttribute('href') : (container.querySelector('a') ? container.querySelector('a').getAttribute('href') : '');
              const textLines = container.innerText.split('\n').map(t => t.trim()).filter(t => t);
              
              if (!list.some(item => item.href === href)) {
                  let price = 0;
                  let vendor = '';
                  let name = textLines[0] || '';
                  
                  // Simple heuristic to extract price and vendor
                  for(let i=0; i<textLines.length; i++) {
                    if (textLines[i].includes('Rp')) {
                       const pStr = textLines[i].replace(/[^0-9]/g, '');
                       if (pStr) price = parseInt(pStr);
                       // Usually vendor is the line right after price or near it
                       if (i + 1 < textLines.length && !textLines[i+1].includes('Kab.') && !textLines[i+1].includes('Kota')) {
                          vendor = textLines[i+1];
                       }
                    }
                  }
                  
                  if (price > 0 && vendor) {
                    list.push({ name, vendor, price, href });
                  }
              }
          }
      }
      return list;
    };
    
    const results = await page.evaluate(extractCandidates);
    await browser.close();

    if (results.length === 0) {
      return res.json({ success: false, error: 'Tidak ada produk ditemukan di e-Katalog' });
    }

    // Hitung Min Max
    const prices = results.map(r => r.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    // Cari Target Vendor
    const currentVendorItem = results.find(r => r.vendor.toLowerCase().includes((targetVendor || '').toLowerCase()));
    
    // Cari Alternatif Murah (Di bawah Pagu, beda vendor)
    let alternative = null;
    const cheaperOptions = results.filter(r => 
       r.price <= numPagu && 
       (!targetVendor || !r.vendor.toLowerCase().includes(targetVendor.toLowerCase()))
    );
    if (cheaperOptions.length > 0) {
       cheaperOptions.sort((a, b) => a.price - b.price);
       alternative = cheaperOptions[0]; // Termurah
    }

    // Cari Produk Pembanding (Lebih mahal)
    let comparator = null;
    const expensiveOptions = results.filter(r => 
       (!targetVendor || !r.vendor.toLowerCase().includes(targetVendor.toLowerCase())) &&
       (currentVendorItem ? r.price > currentVendorItem.price : true) &&
       (alternative ? r.vendor !== alternative.vendor : true)
    );
    if (expensiveOptions.length > 0) {
       expensiveOptions.sort((a, b) => b.price - a.price);
       comparator = expensiveOptions[0]; // Termahal
    }

    res.json({
      success: true,
      data: {
        keyword,
        targetVendor,
        pagu: numPagu,
        minPrice,
        maxPrice,
        currentVendorItem: currentVendorItem || null,
        alternative: alternative || null,
        comparator: comparator || null,
        totalFound: results.length
      }
    });
    
  } catch (err) {
    console.error('Market analysis error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/survey/cancel/:id', async (req, res) => {
  const jobId = req.params.id;
  await connection.setex(`cancel_job_${jobId}`, 3600, '1'); // set flag to expire in 1 hour
  res.json({ success: true, message: `Job ${jobId} cancellation requested` });
});

async function runSurveyTask(data, updateProgress) {
  const job = { data, updateProgress, id: 'in-memory' };
  const items = job.data.items;
  console.log(`\n========================================`);
  console.log(`🚀 [Worker] Memulai job ${job.id} untuk ${items.length} item`);
  console.log(`========================================`);

  const proxyUrl = job.data.proxy || null; // Ambil proxy dari payload jika ada

  let context;
  try {
    const { page: workerPage, context: workerContext } = await createIsolatedPage(proxyUrl);
    context = workerContext;
    // Alias agar kompatibel dengan kode searchItem yang menerima 'page'
    const page = workerPage;

    const results = [];
    for (let i = 0; i < items.length; i++) {
      const isCanceled = false; // await connection.get(`cancel_job_${job.id}`);
      if (isCanceled) {
        console.log(`\n🛑 [Worker] Job ${job.id} dibatalkan oleh pengguna pada item ke-${i+1}`);
        break; // Stop immediately, return what we have so far
      }

      const result = await searchItem(page, items[i], i);
      results.push(result);
      
      // Laporkan progress ke antrean (1-100%)
      const percentage = Math.floor(((i + 1) / items.length) * 100);
      await job.updateProgress(percentage);
      
      // Jeda kecil antar item untuk menghindari pemblokiran server LKPP
      if (i < items.length - 1) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    console.log(`\n✅ [Worker] Job ${job.id} selesai! ${results.filter(r => r.success).length}/${results.length} berhasil.`);
    return results;
  } catch (err) {
    console.error(`[Worker] Fatal error on job ${job.id}:`, err);
    throw err;
  } finally {
    if (context) await closePage(context);
  }
}

app.post('/api/survey/test-proxies', async (req, res) => {
  const { proxies } = req.body;
  if (!proxies || !Array.isArray(proxies)) {
    return res.status(400).json({ error: 'Array proxies dibutuhkan' });
  }

  const proxiesToTest = proxies.slice(0, 20); // Batasi 20 untuk menghindari timeout
  console.log(`[Proxy Tester] Menguji ${proxiesToTest.length} proxy terhadap E-Katalog + INAPROC...`);

  const categorizeSpeed = (latency) => {
    if (latency < 1500) return 'fast';
    if (latency < 4000) return 'medium';
    return 'slow';
  };

  const getCountry = async (ip) => {
    try {
      const r = await axios.get(`http://ip-api.com/json/${ip}?fields=countryCode`, { timeout: 3000 });
      return r.data && r.data.countryCode ? r.data.countryCode : '--';
    } catch (e) { return '--'; }
  };

  const testProxy = async (proxyStr) => {
    const cleanProxy = proxyStr.trim();
    if (!cleanProxy) return null;

    const parts = cleanProxy.split(':');
    const ip = parts[0];
    const port = parts[1] || '80';
    const user = parts[2] || '';
    const pass = parts[3] || '';

    let proxyUrl = `http://${ip}:${port}`;
    if (user && pass) {
      proxyUrl = `http://${user}:${pass}@${ip}:${port}`;
    }

    let agentHttp, agentHttps;
    try {
      if (cleanProxy.startsWith('socks')) {
        agentHttp = new SocksProxyAgent(cleanProxy);
        agentHttps = new SocksProxyAgent(cleanProxy);
      } else {
        agentHttp = new HttpProxyAgent(proxyUrl);
        agentHttps = new HttpsProxyAgent(proxyUrl);
      }
    } catch (e) {
      return { proxy: cleanProxy, ip, port, status: 'invalid', level: '-', speed: '-', country: '--', https: false, inaproc: false, latency: 0 };
    }

    const reqHeaders = {
      'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
    };

    let ekatalogStatus = 'dead';
    let latency = 9999;
    let httpsOk = false;

    const start = Date.now();
    try {
      const resp = await axios.get('https://e-katalog.lkpp.go.id/', {
        httpsAgent: agentHttps, httpAgent: agentHttp,
        timeout: 5000, headers: reqHeaders, validateStatus: () => true,
      });
      latency = Date.now() - start;
      if (resp.status === 200) { ekatalogStatus = 'alive'; httpsOk = true; }
      else if (resp.status === 403) { ekatalogStatus = 'blocked_waf'; }
      else { ekatalogStatus = 'dead'; }
    } catch (err) {
      latency = Date.now() - start;
      if (err.response && err.response.status === 403) ekatalogStatus = 'blocked_waf';
      else ekatalogStatus = 'dead';
    }

    let inaprocStatus = false;
    try {
      const iResp = await axios.get('https://inaproc.lkpp.go.id/', {
        httpsAgent: agentHttps, httpAgent: agentHttp,
        timeout: 5000, headers: reqHeaders, validateStatus: () => true,
      });
      inaprocStatus = (iResp.status === 200 || iResp.status === 302);
    } catch (e) { inaprocStatus = false; }

    const country = '--'; // Country lookup dinonaktifkan untuk mengurangi waktu

    const level = ekatalogStatus === 'alive' ? 'Anonymous' : (ekatalogStatus === 'blocked_waf' ? 'Detected' : '-');
    return {
      proxy: cleanProxy, ip, port,
      status: ekatalogStatus,
      level,
      speed: latency < 9999 ? categorizeSpeed(latency) : '-',
      country, https: httpsOk, inaproc: inaprocStatus,
      latency: latency < 9999 ? latency : null,
    };
  };

  const results = [];
  const batchSize = 10;
  for (let i = 0; i < proxiesToTest.length; i += batchSize) {
    const batch = proxiesToTest.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(testProxy));
    results.push(...batchResults.filter(Boolean));
  }

  results.sort((a, b) => {
    const score = (r) => {
      if (r.inaproc && r.status === 'alive') return 4;
      if (r.status === 'alive') return 3;
      if (r.status === 'blocked_waf') return 2;
      if (r.status === 'dead') return 1;
      return 0;
    };
    return score(b) - score(a) || (a.latency || 9999) - (b.latency || 9999);
  });

  res.json({ results });
});

app.get('/api/survey/sirup/:satkerId', async (req, res) => {
  const { satkerId } = req.params;
  const tahun = req.query.tahun || new Date().getFullYear();
  let context = null;
  try {
    const { page, context: _ctx } = await createIsolatedPage();
    context = _ctx;
    const url = `https://sirup.inaproc.id/sirup/datatablectr/dataruppenyediasatker?tahun=${tahun}&idSatker=${satkerId}&sEcho=1&iColumns=7&iDisplayStart=0&iDisplayLength=2000`;
    console.log(`[SIRUP] Fetching via Puppeteer: ${url}`);
    
    const response = await page.goto(url, { waitUntil: 'networkidle0', timeout: 45000 });
    const text = await response.text();
    // Inaproc might wrap json inside pre tag if viewed as HTML, but since it's a JSON endpoint, text should be pure JSON
    let cleanText = text;
    if (text.includes('<pre')) {
      const match = text.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
      if (match) cleanText = match[1];
    }
    
    try {
      const data = JSON.parse(cleanText);
      res.json(data);
    } catch (parseErr) {
      console.error(`[SIRUP] Error parsing JSON. Response body starts with: \n\n${text.substring(0, 1000)}`);
      await page.screenshot({ path: `/app/screenshots/sirup-error-${Date.now()}.png` });
      throw new Error(`Invalid JSON received: ${parseErr.message}`);
    }
  } catch (err) {
    console.error('[SIRUP] Error fetching data:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (context) await closePage(context);
  }
});

app.get('/api/survey/sirup/package/:paketId', async (req, res) => {
  const { paketId } = req.params;
  let context = null;
  try {
    const { page, context: _ctx } = await createIsolatedPage();
    context = _ctx;
    const url = `https://sirup.inaproc.id/sirup/home/detailPaketPenyediaPublic2017?idPaket=${paketId}`;
    console.log(`[SIRUP] Fetching detail via Puppeteer: ${url}`);
    
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 45000 });
    
    const data = await page.evaluate(() => {
      const details = {};
      const dts = Array.from(document.querySelectorAll('dt'));
      dts.forEach(dt => {
        const key = dt.innerText.trim();
        if (!key) return;
        const dd = dt.nextElementSibling;
        if (dd && dd.tagName === 'DD') {
          let val = dd.innerText.trim();
          if (val.startsWith(':')) {
            val = val.substring(1).trim();
          }
          details[key] = val;
        }
      });
      
      // Parse table contents for Sumber Dana
      const sumberDanaRows = [];
      const tables = Array.from(document.querySelectorAll('table'));
      const sDanaTable = tables.find(t => t.innerText.includes('MAK') && t.innerText.includes('Sumber Dana'));
      if (sDanaTable) {
        const rows = Array.from(sDanaTable.querySelectorAll('tr'));
        rows.forEach(tr => {
          const cells = Array.from(tr.querySelectorAll('td, th')).map(c => c.innerText.trim());
          if (cells.length >= 6 && cells[0] !== 'No.') {
            sumberDanaRows.push({
              sumberDana: cells[1],
              tahun: cells[2],
              klpd: cells[3],
              mak: cells[4],
              pagu: parseInt(cells[5].replace(/\D/g, '')) || 0
            });
          }
        });
      }
      
      details['_sumberDanaList'] = sumberDanaRows;
      return details;
    });

    if (!data['Kode RUP']) {
      throw new Error('Kode RUP not found in page details. Page might have failed to load or got blocked.');
    }

    const firstDana = data['_sumberDanaList'] && data['_sumberDanaList'][0] ? data['_sumberDanaList'][0] : {};
    const responseData = {
      noSirup: data['Kode RUP'] || paketId,
      packName: data['Nama Paket'] || '',
      pagu: parseInt(data['Total Pagu'] || firstDana.pagu || 0) || 0,
      method: data['Metode Pemilihan'] || 'Pengadaan Langsung',
      sumberDana: firstDana.sumberDana || data['Sumber Dana'] || 'APBD',
      tahun: data['Tahun Anggaran'] || firstDana.tahun || new Date().getFullYear().toString(),
      mak: firstDana.mak || '',
      satkerId: '',
      satker: data['Satuan Kerja'] || ''
    };

    res.json(responseData);
  } catch (err) {
    console.error('[SIRUP-Detail] Error fetching data:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (context) await closePage(context);
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'pbj-survey-service' }));

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🟢 Survey service berjalan di port ${PORT}`);
  console.log(`📁 Screenshot tersimpan di: ${screenshotDir}`);
});
