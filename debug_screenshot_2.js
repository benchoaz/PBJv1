const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/login');
  await page.evaluate(() => {
    localStorage.setItem('pbj_user', JSON.stringify({ name: 'Admin', role: 'PPK', nip: '123' }));
    localStorage.setItem('pbj_step', '4');
    localStorage.setItem('pbj_selected_pack', JSON.stringify({ packName: 'Test', pagu: 1000 }));
  });
  
  await page.goto('http://localhost:3000/ppk/persiapan', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  
  const rootText = await page.evaluate(() => document.getElementById('root') ? document.getElementById('root').innerText : 'NO ROOT');
  console.log("ROOT TEXT LENGTH:", rootText.length);
  if (rootText.length > 50) console.log(rootText.substring(0, 100));
  
  await browser.close();
})();
