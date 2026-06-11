
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('https://katalog.inaproc.id/dwi-ratna-anggraeni', { waitUntil: 'networkidle2' });
  await page.screenshot({path: '/home/beni/PBJ/scratch/test_screenshot.png'});
  console.log('Screenshot saved');
  await browser.close();
})();
