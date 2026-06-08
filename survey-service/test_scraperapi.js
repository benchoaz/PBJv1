const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: 'new', 
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--proxy-server=http://proxy-server.scraperapi.com:8001',
      '--ignore-certificate-errors'
    ] 
  });
  const page = await browser.newPage();
  
  await page.authenticate({
    username: 'scraperapi.render=true', // Try standard first, or without render=true
    password: 'eac76798a7482e157cbf55ccaa7f3bdc'
  });

  // Since we are running our own headless browser, we don't need render=true in the proxy username,
  // we just use 'scraperapi'
  await page.authenticate({
    username: 'scraperapi.country_code=id', 
    password: 'eac76798a7482e157cbf55ccaa7f3bdc'
  });

  const url = "https://katalog.inaproc.id/search?keyword=nasi%20kotak";
  console.log("Navigating to", url);
  
  try {
    const response = await page.goto(url, {waitUntil: 'networkidle2', timeout: 60000});
    console.log("Status Code:", response.status());
    
    await new Promise(r => setTimeout(r, 4000));
    
    const html = await page.evaluate(() => document.documentElement.outerHTML);
    console.log("HTML length:", html.length);
    
    // Check if Cloudflare blocked
    if (html.includes('Cloudflare') || html.includes('Akses Ditolak')) {
      console.log("WARNING: Still blocked by Cloudflare!");
    } else {
      console.log("SUCCESS: Cloudflare bypassed!");
    }
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await browser.close();
  }
})();
