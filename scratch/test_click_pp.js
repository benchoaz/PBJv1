import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  await page.goto('http://localhost:3000/login');
  await page.type('input[placeholder="NIP"]', '198502022010012002');
  await page.type('input[placeholder="Password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForNavigation();
  
  console.log("Logged in. At:", page.url());
  
  // Wait for the inbox list to load
  await page.waitForSelector('button', { timeout: 5000 });
  
  const buttons = await page.$$('button');
  for (const btn of buttons) {
      const text = await page.evaluate(el => el.innerText, btn);
      if (text && text.includes('Proses Paket Ini')) {
          console.log("Clicking Proses Paket Ini button...");
          await btn.click();
          await new Promise(r => setTimeout(r, 2000));
          break;
      }
  }
  
  console.log("Done checking.");
  await browser.close();
})();
