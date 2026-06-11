from ssh_command import run_ssh_command
host = "43.134.166.153"
user = "ubuntu"
password = "nebula-57@-ocean"
cmd = '''cd ~/PBJv1/survey-service && cat << 'INNER' > test_sirup.js
import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();
    try {
        const url = 'https://sirup.inaproc.id/sirup/datatablectr/dataruppenyediasatker?tahun=2026&idSatker=308386&sEcho=1&iColumns=7&iDisplayStart=0&iDisplayLength=10';
        console.log('Navigating to:', url);
        const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        console.log('Status:', response.status());
        const text = await response.text();
        console.log('Body snippet:', text.substring(0, 200));
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await browser.close();
    }
})();
INNER
node test_sirup.js'''
print(run_ssh_command(host, user, password, cmd))
