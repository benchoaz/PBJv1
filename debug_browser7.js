const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  await page.evaluateOnNewDocument(() => {
    window.addEventListener('error', e => {
      console.log('WIN_ERROR:', e.message, e.filename, e.lineno, e.colno, e.error ? e.error.stack : '');
    });
    window.addEventListener('unhandledrejection', e => {
      console.log('PROMISE_ERROR:', e.reason);
    });
  });
  
  await page.goto('http://localhost:3000/login');
  await page.evaluate(() => {
    localStorage.setItem('pbj_user', JSON.stringify({ name: 'Admin', role: 'PPK', nip: '123' }));
    localStorage.setItem('pbj_step', '4');
    localStorage.setItem('pbj_selected_pack', JSON.stringify({ packName: 'Test', pagu: 1000 }));
  });
  
  await page.goto('http://localhost:3000/ppk/persiapan', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  
  const rootHtml = await page.evaluate(() => document.getElementById('root') ? document.getElementById('root').innerHTML : 'NO ROOT');
  console.log("ROOT HTML LENGTH:", rootHtml.length);
  
  await browser.close();
})();
