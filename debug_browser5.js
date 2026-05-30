const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.evaluateOnNewDocument(() => {
    window.addEventListener('error', e => {
      console.log('WIN_ERROR:', e.message);
    });
    window.addEventListener('unhandledrejection', e => {
      console.log('PROMISE_ERROR:', e.reason);
    });
  });

  page.on('console', msg => console.log('LOG:', msg.text()));
  
  await page.goto('http://localhost:3000/login');
  await page.evaluate(() => {
    localStorage.setItem('pbj_user', JSON.stringify({ name: 'Admin', role: 'PPK', nip: '123' }));
    localStorage.setItem('pbj_step', '4');
    localStorage.setItem('pbj_selected_pack', JSON.stringify({ packName: 'Test' }));
  });
  
  await page.goto('http://localhost:3000/ppk/persiapan', { waitUntil: 'networkidle0' });
  await page.waitForTimeout(2000);
  await browser.close();
})();
