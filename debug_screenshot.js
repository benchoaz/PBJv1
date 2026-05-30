const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  page.on('console', msg => console.log('LOG:', msg.text()));
  
  await page.goto('http://localhost:3000/login');
  await page.evaluate(() => {
    localStorage.setItem('pbj_user', JSON.stringify({ name: 'Admin', role: 'PPK', nip: '123' }));
    localStorage.setItem('pbj_step', '4');
    localStorage.setItem('pbj_selected_pack', JSON.stringify({ packName: 'Test', pagu: 1000 }));
  });
  
  await page.goto('http://localhost:3000/ppk/persiapan', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'puppeteer_debug.png' });
  console.log('Screenshot saved to puppeteer_debug.png');
  
  const bodyHtml = await page.evaluate(() => document.body.innerHTML);
  console.log('BODY HTML:', bodyHtml.substring(0, 500));
  
  await browser.close();
})();
