const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`[BROWSER ERROR] ${msg.text()}`);
  });
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  await page.goto('http://localhost:3000');
  await page.evaluate(() => {
    localStorage.setItem('pbj_user', JSON.stringify({ role: 'Admin', id: '1' }));
  });
  
  await page.goto('http://localhost:3000/admin/templates', { waitUntil: 'networkidle0' });
  
  // Click Edit mode
  const editBtn = await page.$x("//button[contains(., 'Aktifkan Mode Edit')]");
  if (editBtn.length > 0) {
    await editBtn[0].click();
    await page.waitForTimeout(500);
    // Click Save
    const saveBtn = await page.$x("//button[contains(., 'Simpan Perubahan Naskah')]");
    if (saveBtn.length > 0) {
      await saveBtn[0].click();
      await page.waitForTimeout(1000);
      const html = await page.evaluate(() => document.body.innerHTML);
      console.log('HTML Length after save:', html.length);
    } else {
      console.log('Save button not found');
    }
  } else {
    console.log('Edit button not found');
  }
  
  await browser.close();
})();
