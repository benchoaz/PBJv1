const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    // Test 1: Global
    const urlGlobal = "https://katalog.inaproc.id/search?keyword=Ballpoint";
    await page.goto(urlGlobal, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 4000));
    
    const globalRes = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href]'));
      return anchors.slice(0, 15).map(a => a.innerText.split('\n')[0]).filter(x => x && x.trim() !== '');
    });
    
    // Test 2: Probolinggo
    const urlProbo = "https://katalog.inaproc.id/search?keyword=Ballpoint&regionNames=Kab.+Probolinggo&regionCode=35.13";
    await page.goto(urlProbo, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 4000));
    
    const proboRes = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href]'));
      return anchors.slice(0, 15).map(a => a.innerText.split('\n')[0]).filter(x => x && x.trim() !== '');
    });
    
    console.log("=== HASIL GLOBAL ===");
    console.log(globalRes.slice(5, 10)); // sample products
    
    console.log("\n=== HASIL PROBOLINGGO ===");
    console.log(proboRes.slice(5, 10)); // sample products
    
    if (JSON.stringify(globalRes) === JSON.stringify(proboRes)) {
      console.log("\n⚠️ KESIMPULAN: INAPROC mengembalikan hasil yang SAMA PERSIS!");
    } else {
      console.log("\n✅ KESIMPULAN: INAPROC mengembalikan hasil yang BERBEDA.");
    }
    
    await browser.close();
  } catch(e) {
    console.error(e);
  }
})();
