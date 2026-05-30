const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

(async function example() {
  let options = new chrome.Options();
  options.addArguments('--headless');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  
  let driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();
    
  try {
    await driver.get('http://localhost:3000/ppk/persiapan');
    await driver.sleep(2000);
    const logs = await driver.manage().logs().get('browser');
    logs.forEach(log => console.log(`[${log.level.name}] ${log.message}`));
  } finally {
    await driver.quit();
  }
})();
