const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  // Test 1: Global Search
  const url1 = 'https://katalog.inaproc.id/search?keyword=Ballpoint+Baliner';
  console.log('Testing Global:', url1);
  await page.goto(url1, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  let els1 = await page.$$eval('a', as => as.map(a => a.href).filter(h => h.includes('/product/')));
  console.log('Global found products:', els1.length);
  
  // Test 2: Local Search
  const url2 = 'https://katalog.inaproc.id/search?keyword=Ballpoint+Baliner&regionNames=Kab.+Probolinggo&regionCode=35.13';
  console.log('Testing Local:', url2);
  await page.goto(url2, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  let els2 = await page.$$eval('a', as => as.map(a => a.href).filter(h => h.includes('/product/')));
  console.log('Local found products:', els2.length);

  await browser.close();
})();
