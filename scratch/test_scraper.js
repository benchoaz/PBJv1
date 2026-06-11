
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('https://katalog.inaproc.id/dwi-ratna-anggraeni', { waitUntil: 'networkidle2' });
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a')).map(a => ({href: a.getAttribute('href'), text: a.innerText})).filter(a => a.text.includes('Rp'));
  });
  console.log(JSON.stringify(links, null, 2));
  await browser.close();
})();
