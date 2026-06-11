const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    const url = "https://katalog.inaproc.id/search?keyword=Nasi%20Kotak&minPrice=27600&maxPrice=32400&regionNames=Kab.%20Probolinggo&regionCode=35.13";
    console.log("Navigating to:", url);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(r => setTimeout(r, 4000));
    
    // Attempt extraction
    const candidates = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a[href]'));
        const list = [];
        for (const a of anchors) {
            const href = a.getAttribute('href') || '';
            const text = a.innerText || '';
            if (href.startsWith('/') && text.includes('Rp')) {
                list.push({ href, text: text.replace(/\n/g, ' ') });
            }
        }
        return list;
    });
    
    console.log("Candidates found with 'Rp' in anchor:", candidates.length);
    if (candidates.length > 0) {
        console.log(candidates[0]);
    } else {
        // Let's dump all text on the page to see if products exist
        const pageText = await page.evaluate(() => document.body.innerText);
        console.log("Page Text Snippet:");
        console.log(pageText.substring(0, 1000));
        
        // Let's dump all anchor tags without 'Rp' filter
        const allAnchors = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a[href]')).map(a => a.innerText.replace(/\n/g, ' ')).filter(t => t.toLowerCase().includes('nasi'));
        });
        console.log("Anchors containing 'nasi':", allAnchors);
    }
    
    await browser.close();
})();
