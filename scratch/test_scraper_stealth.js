
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
(async () => {
  const browser = await puppeteer.launch({ 
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'] 
  });
  const page = await browser.newPage();
  await page.goto('https://katalog.inaproc.id/dwi-ratna-anggraeni/paket-nasi-kotak-pujasera99', { waitUntil: 'networkidle2' });
  await page.screenshot({path: '/home/beni/PBJ/scratch/test_screenshot2.png'});
  console.log('Done');
  await browser.close();
})();
