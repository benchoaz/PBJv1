const puppeteer = require('puppeteer');
const fs = require('fs');

async function testPage(name) {
  console.log(`\n--- Testing ${name} ---`);
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
  
  await browser.close();
}

(async () => {
  await testPage('CURRENT (REVERTED)');
})();
