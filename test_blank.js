const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage();
  
  // Capture console messages
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('BROWSER ERROR:', msg.text());
  });
  
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.message);
  });

  await page.goto('http://localhost:3000/ppk/persiapan');
  await page.waitForTimeout(2000);
  
  // Try to find Kunci Paket button and click it
  try {
    const buttons = await page.$$('button');
    for (let btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Kunci Paket') || text.includes('Kunci Manual')) {
        console.log('Clicking button:', text);
        await btn.click();
        break;
      }
    }
  } catch(e) {
    console.log('Could not click:', e);
  }
  
  await page.waitForTimeout(2000);
  await browser.close();
})();
