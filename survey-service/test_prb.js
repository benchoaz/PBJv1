const { connect } = require('puppeteer-real-browser');

async function run() {
  console.log("Starting real browser...");
  try {
    const { browser, page } = await connect({
      headless: true, // We must use true or false. 'true' might not bypass as well, but WSL might not have GUI. Let's try false with disableXvfb
      disableXvfb: true, // we don't have xvfb installed, so disable it and let WSLg handle it or fail
      turnstile: true
    });
    console.log("Browser connected! Navigating...");
    await page.goto('https://katalog.inaproc.id/dwi-ratna-anggraeni/paket-nasi-kotak-pujasera99', { waitUntil: 'domcontentloaded' });
    const content = await page.content();
    console.log("Content length:", content.length);
    if (content.includes("Access denied") || content.includes("Cloudflare")) {
      console.log("BLOCKED BY WAF!");
    } else {
      console.log("SUCCESSFULLY BYPASSED WAF!");
    }
    await browser.close();
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
