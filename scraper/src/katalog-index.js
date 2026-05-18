import {
  initKatalogScraper,
  searchProducts,
  getProductDetail,
  compareProducts,
  copyProductLink
} from './katalog-scraper.js';

const args = process.argv.slice(2);
const command = args[0];

async function run() {
  const { browser, page } = await initKatalogScraper();

  try {
    switch (command) {
      case 'search': {
        const query = args.slice(1).join(' ') || 'komputer';
        console.log(`\n=== Searching: "${query}" ===\n`);

        const { products, screenshotPath } = await searchProducts(page, query);
        console.log(`\nResults (${products.length} found):`);
        products.forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.name} - ${p.price || 'No price'}`);
          if (p.link) console.log(`     Link: ${p.link}`);
        });
        console.log(`\nScreenshot: ${screenshotPath}`);
        break;
      }

      case 'filter': {
        const query = args[1] || 'komputer';
        const category = args[2] || '';
        const priceMin = args[3] || '';
        const priceMax = args[4] || '';

        console.log(`\n=== Filtered Search ===`);
        console.log(`Query: ${query}, Category: ${category}, Price: ${priceMin}-${priceMax}\n`);

        const { products, screenshotPath } = await searchProducts(page, query, {
          category,
          priceMin: priceMin ? parseInt(priceMin) : undefined,
          priceMax: priceMax ? parseInt(priceMax) : undefined,
        });

        console.log(`\nResults (${products.length} found):`);
        products.forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.name} - ${p.price || 'No price'}`);
        });
        console.log(`\nScreenshot: ${screenshotPath}`);
        break;
      }

      case 'detail': {
        const url = args[1];
        if (!url) {
          console.error('Usage: node katalog-index.js detail <url>');
          break;
        }

        console.log(`\n=== Product Detail ===\n`);
        const detail = await getProductDetail(page, url);
        console.log('Detail:', JSON.stringify(detail, null, 2));
        break;
      }

      case 'compare': {
        const urls = args.slice(1);
        if (urls.length < 2) {
          console.error('Usage: node katalog-index.js compare <url1> <url2> [url3...]');
          break;
        }

        console.log(`\n=== Comparing ${urls.length} Products ===\n`);
        const comparison = await compareProducts(page, urls);
        console.log('Comparison Summary:');
        console.log(JSON.stringify(comparison.summary, null, 2));
        console.log(`\nComparison Screenshot: ${comparison.screenshot}`);
        break;
      }

      case 'screenshot': {
        const url = args[1] || KATALOG_URL;
        console.log(`\n=== Taking Screenshot ===\n`);
        await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
        await delay(2000);
        const screenshotPath = `./screenshots/page-${Date.now()}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`Screenshot saved: ${screenshotPath}`);
        break;
      }

      case 'copylink': {
        const url = args[1];
        if (!url) {
          console.error('Usage: node katalog-index.js copylink <url>');
          break;
        }

        console.log(`\n=== Copy Link ===\n`);
        const result = await copyProductLink(page, url);
        console.log(`URL: ${result.url}`);
        console.log(`Links found on page:`);
        result.links.forEach((l, i) => {
          console.log(`  ${i + 1}. ${l.text}: ${l.href}`);
        });
        console.log(`\nScreenshot: ${result.screenshot}`);
        break;
      }

      default:
        console.log(`
Inaproc Catalog Scraper

Usage:
  node katalog-index.js search <query>
  node katalog-index.js filter <query> [category] [priceMin] [priceMax]
  node katalog-index.js detail <url>
  node katalog-index.js compare <url1> <url2> [url3...]
  node katalog-index.js screenshot [url]
  node katalog-index.js copylink <url>

Examples:
  node katalog-index.js search "laptop ASUS"
  node katalog-index.js filter "komputer" "Elektronik" 5000000 20000000
  node katalog-index.js detail https://katalog.inaproc.id/product/123
  node katalog-index.js compare https://katalog.inaproc.id/product/123 https://katalog.inaproc.id/product/456
        `);
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

run();