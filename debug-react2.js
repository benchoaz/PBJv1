const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  
  // Set localStorage first
  await page.goto('http://localhost:3000');
  await page.evaluate(() => {
    localStorage.setItem('pbj_user', JSON.stringify({ role: 'PPK', id: '1' }));
  });
  
  await page.goto('http://localhost:3000/ppk/persiapan', { waitUntil: 'networkidle0' });
  await browser.close();
})();
