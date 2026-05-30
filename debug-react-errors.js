const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG [' + msg.type() + ']:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  try {
    await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded', timeout: 10000 });
    
    // Fill login form
    await page.type('input[type="text"]', 'ppk_demo');
    await page.type('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
    
    console.log('Logged in, navigating to PPK Persiapan...');
    await page.goto('http://localhost:3000/ppk/persiapan', { waitUntil: 'domcontentloaded', timeout: 10000 });
    
    // Wait a bit for React to render
    await new Promise(r => setTimeout(r, 2000));
    
  } catch (e) {
    console.log('GOTO ERROR:', e.message);
  }
  
  const rootHTML = await page.evaluate(() => document.getElementById('root') ? document.getElementById('root').innerHTML : 'NO ROOT');
  console.log('ROOT HTML LENGTH:', rootHTML.length);
  if (rootHTML.length < 500) console.log('ROOT HTML:', rootHTML);
  
  await browser.close();
})();
