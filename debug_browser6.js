const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log(msg.type().toUpperCase() + ':', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  await page.goto('http://localhost:3000/login');
  await page.evaluate(() => {
    localStorage.setItem('pbj_user', JSON.stringify({ name: 'Admin', role: 'PPK', nip: '123' }));
    localStorage.setItem('pbj_step', '4');
    localStorage.setItem('pbj_selected_pack', JSON.stringify({ packName: 'Test', pagu: 1000 }));
  });
  
  await page.goto('http://localhost:3000/ppk/persiapan', { waitUntil: 'networkidle0' });
  await page.waitForTimeout(2000);
  
  // Also dump the inner text of the root
  const rootText = await page.evaluate(() => document.getElementById('root') ? document.getElementById('root').innerText : 'NO ROOT');
  console.log("ROOT TEXT:", rootText.substring(0, 500));
  
  await browser.close();
})();
