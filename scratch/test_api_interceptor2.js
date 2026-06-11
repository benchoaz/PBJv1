const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('api') || url.includes('json') || url.includes('search')) {
      console.log('Intercepted:', url, response.status());
    }
  });

  await page.goto("https://katalog.inaproc.id/search?keyword=nasi%20kotak", {waitUntil: 'networkidle2'});
  await new Promise(r => setTimeout(r, 4000));
  await browser.close();
})();
