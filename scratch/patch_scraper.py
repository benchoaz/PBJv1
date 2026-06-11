
import sys

with open('/home/ubuntu/PBJv1/survey-service/server.js', 'r') as f:
    code = f.read()

# Modify puppeteer.launch
launch_code = """
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1280,900',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--proxy-server=proxy-server.scraperapi.com:8001',
        '--ignore-certificate-errors'
      ]
"""
if '--proxy-server=proxy-server.scraperapi.com' not in code:
    code = code.replace("""
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1280,900',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
""", launch_code.strip('
'))

# Add authentication and setRequestInterception right after browser.newPage()
interception_code = """
    const page = await browser.newPage();
    await page.authenticate({ username: 'scraperapi', password: process.env.SCRAPERAPI_KEY || 'eac76798a7482e157cbf55ccaa7f3bdc' });
    
    // Blokir resource berat agar tidak tembus limit 5 concurrency ScraperAPI
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        const type = req.resourceType();
        if (['image', 'stylesheet', 'font', 'media'].includes(type)) {
            req.abort();
        } else {
            req.continue();
        }
    });
"""

if 'page.authenticate' not in code:
    code = code.replace('const page = await browser.newPage();', interception_code.strip('
'))

with open('/home/ubuntu/PBJv1/survey-service/server.js', 'w') as f:
    f.write(code)
