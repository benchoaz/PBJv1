import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const KATALOG_URL = 'https://katalog.inaproc.id/';
const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR || './screenshots';
const DELAY_MS = parseInt(process.env.SCRAPE_DELAY_MS || '1000');

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));

}

export async function initKatalogScraper() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  return { browser, context, page };
}

export async function searchProducts(page, query, filters = {}) {
  console.log(`Searching for: "${query}"`);

  await page.goto(KATALOG_URL, { waitUntil: 'networkidle', timeout: 60000 });
  await delay(2000);

  // Find and fill search input
  const searchInput = await page.$(
    'input[type="search"], input[placeholder*="cari"], input[placeholder*="search"], ' +
    'input[name*="search"], input[name*="cari"], #search, .search-input, ' +
    'input.form-control[type="text"]'
  );

  if (searchInput) {
    await searchInput.click();
    await searchInput.fill(query);
    await delay(500);

    // Try pressing Enter or clicking search button
    await page.keyboard.press('Enter');
    await delay(3000);

    // Alternative: click search button
    const searchBtn = await page.$('button[type="submit"], .btn-search, .btn-cari, button[aria-label*="search"]');
    if (searchBtn) {
      const isVisible = await searchBtn.isVisible();
      if (isVisible) {
        await searchBtn.click();
        await delay(3000);
      }
    }
  }

  // Apply filters if provided
  if (filters.category || filters.priceMin || filters.priceMax || filters.region) {
    await applyFilters(page, filters);
  }

  await delay(2000);

  // Take screenshot of search results
  const screenshotPath = path.join(SCREENSHOT_DIR, `search-${sanitizeFilename(query)}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot saved: ${screenshotPath}`);

  // Extract products from results
  const products = await extractProducts(page);
  console.log(`Found ${products.length} products`);

  return { products, screenshotPath };
}

export async function applyFilters(page, filters) {
  console.log('Applying filters:', JSON.stringify(filters));

  // Category filter
  if (filters.category) {
    const categorySelect = await page.$('select[name*="kategori"], select[name*="category"], #category');
    if (categorySelect) {
      await categorySelect.selectOption({ label: filters.category });
      await delay(DELAY_MS);
    } else {
      // Try clicking category checkboxes
      const categoryCheckboxes = await page.$$('input[type="checkbox"], .category-item');
      for (const cb of categoryCheckboxes) {
        const label = await cb.textContent() || await cb.getAttribute('value') || '';
        if (label.toLowerCase().includes(filters.category.toLowerCase())) {
          await cb.click();
          await delay(DELAY_MS);
          break;
        }
      }
    }
  }

  // Price range filter
  if (filters.priceMin || filters.priceMax) {
    const minInput = await page.$('input[name*="min"], input[placeholder*="min"], input[name*="dari"]');
    const maxInput = await page.$('input[name*="max"], input[placeholder*="max"], input[name*="sampai"]');

    if (minInput && filters.priceMin) {
      await minInput.fill(filters.priceMin.toString());
    }
    if (maxInput && filters.priceMax) {
      await maxInput.fill(filters.priceMax.toString());
    }

    await delay(DELAY_MS);
  }

  // Region filter
  if (filters.region) {
    const regionSelect = await page.$('select[name*="wilayah"], select[name*="region"], select[name*="provinsi"]');
    if (regionSelect) {
      await regionSelect.selectOption({ label: filters.region });
      await delay(DELAY_MS);
    }
  }

  // Apply filter button
  const applyBtn = await page.$('button:has-text("Filter"), button:has-text("Terapkan"), .btn-filter');
  if (applyBtn) {
    await applyBtn.click();
    await delay(3000);
  }
}

async function extractProducts(page) {
  const products = [];

  // Try multiple product card selectors
  const productSelectors = [
    '.product-card', '.item-card', '.product-item', '.catalog-item',
    '[class*="product"]', '[class*="item"]', '.card', '.result-item',
    'article', '.list-group-item'
  ];

  let elements = [];
  for (const selector of productSelectors) {
    elements = await page.$$(selector);
    if (elements.length > 0) {
      console.log(`Found products using selector: ${selector}`);
      break;
    }
  }

  for (const el of elements) {
    try {
      const product = await extractSingleProduct(el);
      if (product && (product.name || product.title)) {
        products.push(product);
      }
    } catch (err) {
      // Skip unparseable elements
    }
  }

  // Also try table-based layout
  if (products.length === 0) {
    const rows = await page.$$('table tbody tr');
    for (const row of rows) {
      try {
        const cells = await row.$$('td');
        if (cells.length >= 2) {
          const product = {
            name: (await cells[0]?.textContent())?.trim(),
            price: (await cells[1]?.textContent())?.trim(),
            link: await cells[0]?.$('a')?.then(a => a.getAttribute('href')),
          };
          if (product.name) products.push(product);
        }
      } catch {}
    }
  }

  return products;
}

async function extractSingleProduct(element) {
  const nameEl = await element.$('h2, h3, h4, h5, .title, .product-name, .item-name, .nama');
  const priceEl = await element.$('.price, .harga, [class*="price"], [class*="harga"]');
  const linkEl = await element.$('a[href]');
  const imgEl = await element.$('img');

  const name = nameEl ? (await nameEl.textContent())?.trim() : (await element.textContent())?.trim()?.substring(0, 100);
  const price = priceEl ? (await priceEl.textContent())?.trim() : null;
  const link = linkEl ? await linkEl.getAttribute('href') : null;
  const image = imgEl ? await imgEl.getAttribute('src') : null;

  return { name, price, link, image };
}

export async function getProductDetail(page, productUrl) {
  console.log(`Getting product detail: ${productUrl}`);

  await page.goto(productUrl, { waitUntil: 'networkidle', timeout: 60000 });
  await delay(2000);

  const screenshotPath = path.join(SCREENSHOT_DIR, `detail-${Date.now()}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const detail = await page.evaluate(() => {
    const data = {};

    // Try to get all visible text fields from detail page
    const labels = document.querySelectorAll('label, th, dt, .label, .field-label, strong');
    labels.forEach(label => {
      const key = label.textContent?.trim().toLowerCase();
      const value = label.nextElementSibling?.textContent?.trim()
        || label.closest('tr')?.querySelector('td')?.textContent?.trim()
        || label.closest('.row, .field')?.querySelector('.value, dd, td')?.textContent?.trim();
      if (key && value) {
        data[key.replace(/[^a-z0-9]/g, '_')] = value;
      }
    });

    // Get page title
    data.pageTitle = document.title;

    // Get all links
    data.links = Array.from(document.querySelectorAll('a[href]'))
      .map(a => ({ text: a.textContent?.trim(), href: a.href }))
      .filter(l => l.text && l.href);

    return data;
  });

  detail.url = productUrl;
  detail.screenshot = screenshotPath;

  return detail;
}

export async function compareProducts(page, productUrls) {
  if (productUrls.length < 2) {
    throw new Error('Need at least 2 products to compare');
  }

  console.log(`Comparing ${productUrls.length} products`);

  const details = [];

  for (const url of productUrls) {
    const detail = await getProductDetail(page, url);
    details.push(detail);
    await delay(DELAY_MS);
  }

  // Generate comparison screenshot
  const comparisonHtml = generateComparisonHtml(details);
  const comparisonPage = await page.context().newPage();
  await comparisonPage.setContent(comparisonHtml, { waitUntil: 'networkidle' });

  const comparisonScreenshot = path.join(SCREENSHOT_DIR, `comparison-${Date.now()}.png`);
  await comparisonPage.screenshot({ path: comparisonScreenshot, fullPage: true });
  await comparisonPage.close();

  // Generate structured comparison
  const comparison = {
    products: details,
    screenshot: comparisonScreenshot,
    summary: generateComparisonSummary(details),
  };

  return comparison;
}

function generateComparisonHtml(products) {
  const allKeys = new Set();
  products.forEach(p => {
    Object.keys(p).forEach(k => {
      if (!['links', 'screenshot', 'url'].includes(k)) allKeys.add(k);
    });
  });

  const rows = Array.from(allKeys).map(key => {
    const cells = products.map(p => `<td style="border: 1px solid #ddd; padding: 8px;">${p[key] || '-'}</td>`).join('');
    return `<tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">${key}</td>${cells}</tr>`;
  }).join('');

  const headers = products.map(p =>
    `<th style="border: 1px solid #ddd; padding: 8px;">${p.pageTitle || p.url}</th>`
  ).join('');

  return `
    <html>
    <head><style>body { font-family: Arial, sans-serif; } table { border-collapse: collapse; width: 100%; }</style></head>
    <body>
      <h2>Product Comparison</h2>
      <table>
        <tr><th style="border: 1px solid #ddd; padding: 8px;">Field</th>${headers}</tr>
        ${rows}
      </table>
    </body>
    </html>
  `;
}

function generateComparisonSummary(products) {
  const summary = {
    productCount: products.length,
    fields: {},
    differences: [],
  };

  const allKeys = new Set();
  products.forEach(p => {
    Object.keys(p).forEach(k => {
      if (!['links', 'screenshot', 'url'].includes(k)) allKeys.add(k);
    });
  });

  for (const key of allKeys) {
    const values = products.map(p => p[key]);
    const unique = [...new Set(values)];
    summary.fields[key] = {
      values,
      hasDifference: unique.length > 1,
    };

    if (unique.length > 1 && key !== 'pageTitle') {
      summary.differences.push({
        field: key,
        values: unique,
      });
    }
  }

  return summary;
}

export async function copyProductLink(page, productUrl) {
  console.log(`Copying link: ${productUrl}`);

  await page.goto(productUrl, { waitUntil: 'networkidle', timeout: 60000 });
  await delay(1000);

  const screenshotPath = path.join(SCREENSHOT_DIR, `link-copy-${Date.now()}.png`);
  await page.screenshot({ path: screenshotPath });

  // Extract all relevant links from the page
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href]'))
      .map(a => ({ text: a.textContent?.trim(), href: a.href }))
      .filter(l => l.text && l.href && !l.href.startsWith('javascript:'));
  });

  return {
    url: productUrl,
    screenshot: screenshotPath,
    links,
  };
}

function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 50);
}