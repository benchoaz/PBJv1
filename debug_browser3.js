const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  await page.goto('http://localhost:3000/login');
  await page.evaluate(() => {
    localStorage.setItem('pbj_user', JSON.stringify({ name: 'Admin', role: 'PPK', nip: '123' }));
    localStorage.setItem('pbj_step', '4'); // Go directly to step 4
  });
  
  await page.goto('http://localhost:3000/ppk/persiapan', { waitUntil: 'networkidle0' });
  await page.waitForTimeout(2000);
  await browser.close();
})();
