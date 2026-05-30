const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage();
  
  await page.evaluateOnNewDocument(() => {
    window.addEventListener('error', e => {
      console.log('UNCAUGHT ERROR:', e.message, e.error?.stack);
    });
    window.addEventListener('unhandledrejection', e => {
      console.log('UNHANDLED PROMISE:', e.reason);
    });
    const originalConsoleError = console.error;
    console.error = function(...args) {
      console.log('CONSOLE ERROR:', ...args.map(a => typeof a === 'object' ? JSON.stringify(a, Object.getOwnPropertyNames(a)) : a));
      originalConsoleError.apply(console, args);
    };
  });

  page.on('console', msg => {
    console.log('[BROWSER]', msg.text());
  });

  await page.goto('http://localhost:3000/ppk/persiapan');
  await new Promise(r => setTimeout(r, 2000));
  
  // Try to find Kunci Paket button and click it
  try {
    const buttons = await page.$$('button');
    let clicked = false;
    for (let btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Kunci Manual')) {
        console.log('Clicking button:', text);
        
        // Fill the input first
        await page.evaluate(() => {
          if (document.getElementById('manual_no_rup')) document.getElementById('manual_no_rup').value = '12345';
          if (document.getElementById('manual_nama_paket')) document.getElementById('manual_nama_paket').value = 'Test Paket';
        });
        
        await btn.click();
        clicked = true;
        break;
      }
    }
    if (!clicked) console.log('Button not found');
  } catch(e) {
    console.log('Could not click:', e);
  }
  
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
