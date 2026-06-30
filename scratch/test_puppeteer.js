const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto('https://katalog.inaproc.id/search?keyword=Laptop&maxPrice=8511400&minPrice=8300000&regionCode=35.13', { waitUntil: 'networkidle2' });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'test_inaproc.png' });
  await browser.close();
  console.log('Screenshot saved to test_inaproc.png');
})();
