import re

with open("survey-service/server.js", "r") as f:
    code = f.read()

endpoint_code = """
app.post('/api/survey/find-comparator', async (req, res) => {
  const { query, originalVendor } = req.body;
  if (!query) return res.status(400).json({ error: 'Query is required' });
  
  const jobId = Date.now().toString() + '_' + Math.floor(Math.random() * 1000);
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
    
    console.log(`[Comparator] Searching for: ${query}`);
    await page.goto(`https://katalog.inaproc.id/search?keyword=${encodeURIComponent(query)}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(r => setTimeout(r, 4000));
    
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
                const text = container.innerText.replace(/\\n/g, ' | ');
                
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
    console.log(`[Comparator] Found: ${detailUrl}`);
    
    await page.goto(detailUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 4000));
    
    await injectWatermark(page);
    
    const screenshotName = `comparator_${jobId}.png`;
    const screenshotPath = path.join(screenshotDir, screenshotName);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    
    await browser.close();
    
    res.json({
       success: true,
       name: bestResult.name,
       vendor: bestResult.vendor,
       price: bestResult.price,
       detailUrl: detailUrl,
       screenshotUrl: `/screenshots/${screenshotName}`
    });
    
  } catch (error) {
    if (browser) await browser.close().catch(() => {});
    console.error('[Comparator] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to find comparator' });
  }
});
"""

# Inject before app.post('/api/survey/screenshot'
if "app.post('/api/survey/screenshot'" in code:
    code = code.replace("app.post('/api/survey/screenshot',", endpoint_code + "\napp.post('/api/survey/screenshot',")
else:
    print("Could not find insertion point!")

with open("survey-service/server.js", "w") as f:
    f.write(code)

print("Endpoint injected.")
