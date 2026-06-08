const { connect } = require('puppeteer-real-browser');

async function run() {
  console.log("Starting real browser...");
  try {
    const { browser, page } = await connect({
      headless: "new", 
      disableXvfb: true,
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
