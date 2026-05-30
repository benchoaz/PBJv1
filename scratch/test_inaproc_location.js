const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  // Test 1: Only regionNames
  const url1 = "https://katalog.inaproc.id/search?keyword=cutter+besar&regionNames=Probolinggo";
  await page.goto(url1, {waitUntil: 'domcontentloaded'});
  await new Promise(r => setTimeout(r, 2000));
  const html1 = await page.evaluate(() => document.body.innerText);
  console.log("=== URL 1 (Only regionNames) ===");
  console.log(html1.includes("Fata Abdul Mujtama") ? "DITEMUKAN Fata Abdul Mujtama" : "TIDAK DITEMUKAN");
  
  // Test 2: With regionNames and regionCode
  const url2 = "https://katalog.inaproc.id/search?keyword=cutter+besar&regionNames=Kab.+Probolinggo%2CKota+Probolinggo&regionCode=35.13%2C35.74";
  await page.goto(url2, {waitUntil: 'domcontentloaded'});
  await new Promise(r => setTimeout(r, 2000));
  const html2 = await page.evaluate(() => document.body.innerText);
  console.log("\n=== URL 2 (With regionCode) ===");
  console.log(html2.includes("Fata Abdul Mujtama") ? "DITEMUKAN Fata Abdul Mujtama" : "TIDAK DITEMUKAN");
  
  await browser.close();
})();
