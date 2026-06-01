const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null
});

const surveyQueue = new Queue('survey-jobs', { connection });


const app = express();
app.use(cors());
app.use(express.json());

const screenshotDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

// BUKA AKSES: Izinkan peramban mengakses folder screenshot secara publik
app.use('/screenshots', express.static(screenshotDir));

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
    if (trimmed.length >= 2 && !uniqueAttempts.includes(trimmed)) {
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
      console.log(`  → BYPASS: Mengunjungi URL langsung: ${item.targetUrl}`);
      try {
        await page.goto(item.targetUrl, { waitUntil: 'networkidle2', timeout: 45000 });
        await new Promise(r => setTimeout(r, 4000));
        const detailFile = path.join(screenshotDir, safeId + '_detail.png');
        await injectWatermark(page);
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

    let searchScenarios = [];
    
    // ── Vendor page scenarios ──
    if (item.targetVendor) {
      // Mendukung 3 format input target vendor:
      // 1. URL penuh: https://katalog.inaproc.id/sultoni-wza2
      // 2. Slug langsung: sultoni-wza2
      // 3. Nama biasa: SULTONI → sultoni (mungkin salah, tapi dicoba)
      let vendorSlug;
      const rawVendor = item.targetVendor.trim();
      if (rawVendor.includes('katalog.inaproc.id/')) {
        // Format URL penuh → ekstrak path pertama
        const match = rawVendor.match(/katalog\.inaproc\.id\/([^/?&#]+)/);
        vendorSlug = match ? match[1].toLowerCase() : rawVendor.toLowerCase().replace(/[^a-z0-9-]/g, '-');
        console.log(`  ℹ️ [VENDOR] URL penuh dideteksi, slug: ${vendorSlug}`);
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
      });
    }

    // ── Global search scenarios ──
    attempts.forEach(q => {
      let sUrl = 'https://katalog.inaproc.id/search?keyword=' + encodeURIComponent(q);
      
      // ── FIX: Jika ignorePriceLimit=true, JANGAN kirim filter harga ke inaproc sama sekali
      // (sebelumnya maxPrice tetap terkirim ke URL meski toggle "Abaikan Harga" aktif,
      //  sehingga inaproc memblokir produk di atas pagu sebelum logika scoring kita melihatnya)
      if (item.fallbackPrice && item.fallbackPrice > 0 && !item.ignorePriceLimit) {
        const tolerance = item.priceTolerance !== undefined ? parseFloat(item.priceTolerance) / 100 : 0.025;
        // Hanya terapkan minPrice jika TIDAK ada target penyedia
        // (produk vendor target bisa lebih murah dari pagu)
        if (!item.targetVendor) {
          const minPrice = Math.floor(item.fallbackPrice * (1 - tolerance));
          sUrl += `&minPrice=${minPrice}`;
        }
        // maxPrice = pagu adalah batas ATAS yang tidak boleh dilanggar (saat mode normal)
        const maxPrice = Math.floor(item.fallbackPrice * (1 + tolerance));
        sUrl += `&maxPrice=${maxPrice}`;
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

    // ── STEP 1: Multi-Stage Search Loop ───────────────────────────────
    for (let i = 0; i < searchScenarios.length; i++) {
      const scenario = searchScenarios[i];
      const query = scenario.query;
      let searchUrl = scenario.url;
      
      console.log(`  → [Mencari #${i + 1} - ${scenario.type.toUpperCase()}] Membuka: ${searchUrl}`);
      
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
          if (scenario.type === 'global-noprice') {
            const hasTargetVendor = candidates.some(c => 
              item.targetVendor && c.vendor.toLowerCase().includes(item.targetVendor.toLowerCase())
            );
            if (!hasTargetVendor) {
              console.log(`    ℹ️ Fallback global (tanpa harga) tidak menemukan produk dari ${item.targetVendor}, dilewati.`);
              continue;
            }
            if (searchData.length > 0) {
              const newVendorProducts = candidates.filter(c => 
                item.targetVendor && c.vendor.toLowerCase().includes(item.targetVendor.toLowerCase())
              );
              searchData = [...searchData, ...newVendorProducts.filter(nc => 
                !searchData.some(sd => sd.productHref === nc.productHref)
              )];
              console.log(`    ✅ Menggabungkan ${newVendorProducts.length} produk ${item.targetVendor} dari fallback ke searchData.`);
              break;
            }
            searchData = candidates;
            successfulQuery = query;
            await injectWatermark(page);
            await page.screenshot({ path: searchFile, fullPage: false });
          } else {
            // Merge results to ensure we have enough data for autoComparator
            searchData = [...searchData, ...candidates.filter(nc => 
              !searchData.some(sd => sd.productHref === nc.productHref)
            )];
            successfulQuery = query;
            await injectWatermark(page);
            await page.screenshot({ path: searchFile, fullPage: false });
            console.log(`    ✅ Berhasil menemukan ${candidates.length} produk dengan query: "${query}"`);
            
            // Break if we don't need comparator or if it's already a global search
            if (!item.autoComparator || scenario.type === 'global') {
              break;
            } else {
               console.log(`    ℹ️ Auto Comparator aktif, lanjut mencari referensi global...`);
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
        // Ambil bagian pertama sebelum tanda hubung (misal 'sultoni' dari 'sultoni-wza2')
        const firstPart = slug.split('-')[0];
        return firstPart.length >= 3 ? firstPart : slug;
      })();
      searchData.forEach(cand => {
        // HUKUM BATAS PAGU (PRICE CEILING) — berlaku mutlak
        const isTargetMatch = vendorMatchKeyword && cand.vendor.toLowerCase().includes(vendorMatchKeyword.toLowerCase());
        
        if (!item.ignorePriceLimit && item.fallbackPrice && cand.price && cand.price > item.fallbackPrice) {
          console.log(`    🚫 [TOLAK] Harga Rp ${cand.price} melampaui PAGU DPA (Rp ${item.fallbackPrice}): ${cand.title}`);
          return; // Lompati kandidat ini
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

    let autoComparator = null;
    const isValidMatch = bestCandidate && highestScore >= 0.01;
    if (isValidMatch) {
      console.log(`  🌟 Produk Terpilih: "${bestCandidate.title}" dengan skor ${highestScore.toFixed(3)}`);
      
      // AUTO-COMPARATOR LOGIC
      const otherCandidates = searchData.filter(c => c !== bestCandidate && c.price && c.price > bestCandidate.price);
      if (otherCandidates.length > 0) {
        otherCandidates.sort((a, b) => a.price - b.price);
        let diffVendor = otherCandidates.find(c => c.vendor !== bestCandidate.vendor);
        let chosenComp = diffVendor || otherCandidates[0];
        autoComparator = {
          name: chosenComp.title,
          vendor: chosenComp.vendor,
          price: chosenComp.price,
          status: 'Dalam Katalog'
        };
        console.log(`  ⚖️ Auto-Comparator Ditemukan: ${autoComparator.vendor} - Rp ${autoComparator.price}`);
      }
    } else {
      if (bestCandidate) {
        console.log(`  ⚠️ Produk terdekat "${bestCandidate.title}" memiliki skor terlalu rendah (${highestScore.toFixed(3)}).`);
      }
      console.log(`  ⚠️ Tidak menemukan produk yang cocok di e-Katalog, menggunakan fallback default.`);
    }

    // ── STEP 3: Navigate to product detail (Direct clean link) ─────────
    let detailUrl = 'https://katalog.inaproc.id/search?keyword=' + encodeURIComponent(successfulQuery || searchTarget);
    if (item.fallbackPrice && item.fallbackPrice > 0) {
      const tolerance = item.priceTolerance !== undefined ? parseFloat(item.priceTolerance) / 100 : 0.025;
      const minPrice = Math.floor(item.fallbackPrice * (1 - tolerance));
      const maxPrice = Math.floor(item.fallbackPrice * (1 + tolerance));
      detailUrl += `&minPrice=${minPrice}&maxPrice=${maxPrice}`;
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
      success: true,
      comparator: autoComparator
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

  const ignorePriceLimit = req.body.ignorePriceLimit === true;
  const autoComparator = req.body.autoComparator === true;

  // Pasangkan wilayah pencarian dan opsi ke tiap barang
  items.forEach(item => {
    if (!item.locations) item.locations = globalLocations;
    item.ignorePriceLimit = ignorePriceLimit;
    item.autoComparator = autoComparator;
  });

  // Tambahkan job ke antrean Redis
  const job = await surveyQueue.add('survey', { items });
  console.log(`[Queue] Diterima Job ID: ${job.id} untuk ${items.length} item.`);
  
  res.json({ jobId: job.id });
});

app.get('/api/survey/status/:id', async (req, res) => {
  const job = await surveyQueue.getJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  
  const state = await job.getState();
  const progress = job.progress || 0;
  const isCanceled = await connection.get(`cancel_job_${req.params.id}`);
  
  res.json({ 
    status: state, 
    progress: progress, 
    results: job.returnvalue || null,
    error: job.failedReason || null,
    isCanceled: !!isCanceled
  });
});

app.post('/api/survey/cancel/:id', async (req, res) => {
  const jobId = req.params.id;
  await connection.setex(`cancel_job_${jobId}`, 3600, '1'); // set flag to expire in 1 hour
  res.json({ success: true, message: `Job ${jobId} cancellation requested` });
});

// ── REDIS WORKER (BACKGROUND PROCESS) ──────────────────────────────────────────
const worker = new Worker('survey-jobs', async job => {
  const items = job.data.items;
  console.log(`\n========================================`);
  console.log(`🚀 [Worker] Memulai job ${job.id} untuk ${items.length} item`);
  console.log(`========================================`);

  let browser;
  try {
    browser = await puppeteer.launch({
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
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    const results = [];
    for (let i = 0; i < items.length; i++) {
      const isCanceled = await connection.get(`cancel_job_${job.id}`);
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
    if (browser) await browser.close();
  }
}, { connection, concurrency: 1 }); // concurrency 1: hanya buka 1 browser sekaligus agar RAM hemat

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job.id} gagal:`, err);
});


app.get('/health', (req, res) => res.json({ status: 'ok', service: 'pbj-survey-service' }));

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`\n🟢 Survey service berjalan di port ${PORT}`);
  console.log(`📁 Screenshot tersimpan di: ${screenshotDir}`);
});
