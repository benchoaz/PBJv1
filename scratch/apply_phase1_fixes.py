"""
Fase 1 Quick Wins - Modifikasi server.js:
1. Browser Pool (singleton + context isolation)
2. Request Interception (blokir analytics/font/media)
3. Fix user-agent statis di SIRUP endpoint
4. Cleanup cron untuk screenshot lama
5. Hapus --disable-web-security (flag berbahaya)
"""

with open('/home/beni/PBJ/survey-service/server.js', 'r') as f:
    code = f.read()

# ==========================================================
# 1. Tambahkan Browser Pool setelah ANTI-BOT HELPERS
# ==========================================================
BROWSER_POOL = """
// --- BROWSER POOL (Singleton + Isolated Context) ---
let _sharedBrowser = null;

async function getSharedBrowser() {
  if (_sharedBrowser && _sharedBrowser.isConnected()) return _sharedBrowser;
  console.log('[BrowserPool] Meluncurkan browser instance baru...');
  _sharedBrowser = await puppeteer.launch({
    headless: 'new',
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1280,900',
      '--disable-blink-features=AutomationControlled',
      '--max_old_space_size=512',
    ]
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
async function createIsolatedPage() {
  const browser = await getSharedBrowser();
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.setUserAgent(USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]);

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
"""

# Sisipkan Browser Pool setelah blok ANTI-BOT HELPERS
POOL_MARKER = '// -----------------------\n\nconst app = express();'
if POOL_MARKER in code and '--- BROWSER POOL' not in code:
    code = code.replace(POOL_MARKER, '// -----------------------\n' + BROWSER_POOL + '\nconst app = express();')
    print('✅ Browser Pool ditambahkan')
else:
    print('ℹ️  Browser Pool sudah ada atau marker tidak ditemukan')

# ==========================================================
# 2. Cleanup Cron untuk screenshot lama (simpan 30 hari)
# ==========================================================
CLEANUP_CRON = """
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
"""

# Sisipkan cleanup setelah static middleware screenshots
CLEANUP_MARKER = "// BUKA AKSES: Izinkan peramban mengakses folder screenshot secara publik\napp.use('/screenshots', express.static(screenshotDir));"
if CLEANUP_MARKER in code and 'AUTO CLEANUP SCREENSHOTS' not in code:
    code = code.replace(CLEANUP_MARKER, CLEANUP_MARKER + '\n' + CLEANUP_CRON)
    print('✅ Cleanup cron ditambahkan')
else:
    print('ℹ️  Cleanup cron sudah ada atau marker tidak ditemukan')

# ==========================================================
# 3. Refactor Worker BullMQ: pakai createIsolatedPage()
# ==========================================================
OLD_WORKER_BROWSER = """  let browser;
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
      , '--disable-blink-features=AutomationControlled']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    const results = [];
    for (let i = 0; i < items.length; i++) {"""

NEW_WORKER_BROWSER = """  let context;
  try {
    const { page: workerPage, context: workerContext } = await createIsolatedPage();
    context = workerContext;
    // Alias agar kompatibel dengan kode searchItem yang menerima 'page'
    const page = workerPage;

    const results = [];
    for (let i = 0; i < items.length; i++) {"""

if OLD_WORKER_BROWSER in code:
    code = code.replace(OLD_WORKER_BROWSER, NEW_WORKER_BROWSER)
    print('✅ Worker BullMQ direfaktor ke Browser Pool')
else:
    print('⚠️  Marker worker tidak ditemukan, skip refactor worker')

# Fix finally block worker: ganti browser.close() dengan closePage(context)
OLD_WORKER_FINALLY = """  } catch (err) {
    console.error(`[Worker] Fatal error on job ${job.id}:`, err);
    throw err;
  } finally {
    if (browser) await browser.close();
  }
}, { connection, concurrency: 1 }); // concurrency 1: hanya buka 1 browser sekaligus agar RAM hemat"""

NEW_WORKER_FINALLY = """  } catch (err) {
    console.error(`[Worker] Fatal error on job ${job.id}:`, err);
    throw err;
  } finally {
    if (context) await closePage(context);
  }
}, { connection, concurrency: 1 }); // concurrency 1: hanya buka 1 context sekaligus"""

if OLD_WORKER_FINALLY in code:
    code = code.replace(OLD_WORKER_FINALLY, NEW_WORKER_FINALLY)
    print('✅ Worker finally block diperbarui')
else:
    print('⚠️  Marker worker finally tidak ditemukan')

# ==========================================================
# 4. Fix find-comparator: pakai createIsolatedPage()
# ==========================================================
OLD_COMPARATOR_BROWSER = """  const jobId = Date.now().toString() + '_' + Math.floor(Math.random() * 1000);
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
      , '--disable-blink-features=AutomationControlled']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );"""

NEW_COMPARATOR_BROWSER = """  const jobId = Date.now().toString() + '_' + Math.floor(Math.random() * 1000);
  let context;
  try {
    const { page, context: _ctx } = await createIsolatedPage();
    context = _ctx;"""

if OLD_COMPARATOR_BROWSER in code:
    code = code.replace(OLD_COMPARATOR_BROWSER, NEW_COMPARATOR_BROWSER)
    print('✅ find-comparator direfaktor ke Browser Pool')
else:
    print('⚠️  Marker find-comparator tidak ditemukan')

# Fix find-comparator close browser
OLD_COMPARATOR_CLOSE = """    await browser.close();
    
    res.json({
       success: true,
       name: bestResult.name,
       vendor: bestResult.vendor,
       price: bestResult.price,
       detailUrl: finalUrl,
       screenshotUrl: `/screenshots/${screenshotName}`
    });
    
  } catch (error) {
    if (browser) await browser.close().catch(() => {});
    console.error('[Comparator] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to find comparator' });
  }
});"""

NEW_COMPARATOR_CLOSE = """    await closePage(context);
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
});"""

if OLD_COMPARATOR_CLOSE in code:
    code = code.replace(OLD_COMPARATOR_CLOSE, NEW_COMPARATOR_CLOSE)
    print('✅ find-comparator close browser diperbarui')
else:
    print('⚠️  Marker close comparator tidak ditemukan')

# ==========================================================
# 5. Fix SIRUP endpoint: pakai createIsolatedPage() dan
#    user-agent acak
# ==========================================================
OLD_SIRUP_BROWSER = """  let browser = null;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-blink-features=AutomationControlled'],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');"""

NEW_SIRUP_BROWSER = """  let context = null;
  try {
    const { page, context: _ctx } = await createIsolatedPage();
    context = _ctx;"""

if OLD_SIRUP_BROWSER in code:
    code = code.replace(OLD_SIRUP_BROWSER, NEW_SIRUP_BROWSER)
    print('✅ SIRUP endpoint direfaktor ke Browser Pool')
else:
    print('⚠️  Marker SIRUP tidak ditemukan')

# Fix SIRUP finally block
OLD_SIRUP_FINALLY = """  } catch (err) {
    console.error('[SIRUP] Error fetching data:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (browser) await browser.close();
  }
});"""

NEW_SIRUP_FINALLY = """  } catch (err) {
    console.error('[SIRUP] Error fetching data:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (context) await closePage(context);
  }
});"""

if OLD_SIRUP_FINALLY in code:
    code = code.replace(OLD_SIRUP_FINALLY, NEW_SIRUP_FINALLY)
    print('✅ SIRUP finally block diperbarui')
else:
    print('⚠️  Marker SIRUP finally tidak ditemukan')

# ==========================================================
# Simpan hasil
# ==========================================================
with open('/home/beni/PBJ/survey-service/server.js', 'w') as f:
    f.write(code)

print('\n✅ Semua modifikasi Fase 1 berhasil diterapkan!')
