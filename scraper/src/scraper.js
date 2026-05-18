import { chromium } from 'playwright';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.SIRUP_BASE_URL || 'https://sirup.inaproc.id';
const SATKER_ID = process.env.SIRUP_SATKER_ID || '67081';
const DELAY_MS = parseInt(process.env.SCRAPE_DELAY_MS || '1000');
const MAX_PAGES = parseInt(process.env.MAX_PAGES || '10');

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function scrapeSIRUP({ onPage, onError, onDone } = {}) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();
  const packs = [];

  try {
    // Navigate to SIRUP home
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 60000 });
    await delay(2000);

    // Look for satker search / filter
    const satkerInput = await page.$('input[placeholder*="Satker"], input[name*="satker"], #satker');
    if (satkerInput) {
      await satkerInput.fill(SATKER_ID);
      await delay(1000);
      const searchBtn = await page.$('button[type="submit"], .btn-search, .btn-cari');
      if (searchBtn) await searchBtn.click();
      await delay(3000);
    }

    // Try to navigate directly to satker's procurement list
    const listUrl = `${BASE_URL}/sirup/home/filterSatker/${SATKER_ID}`;
    const response = await page.goto(listUrl, { waitUntil: 'networkidle', timeout: 60000 });
    await delay(2000);

    // Detect page structure - look for procurement table or card list
    const pageContent = await page.content();

    // Try multiple selectors for the procurement list
    const tableRows = await page.$$('table tbody tr, .table tbody tr, .data-row, .procurement-item');
    const cardItems = await page.$$('.card, .item-card, .list-item, [class*="rup"]');

    if (tableRows.length > 0) {
      // Table-based layout
      for (let pageNum = 1; pageNum <= MAX_PAGES; pageNum++) {
        const rows = await page.$$('table tbody tr, .table tbody tr');
        if (rows.length === 0) break;

        for (const row of rows) {
          try {
            const cells = await row.$$('td');
            if (cells.length < 2) continue;

            const noSirup = (await cells[0]?.textContent())?.trim();
            const packName = (await cells[1]?.textContent())?.trim();
            const procurementMethod = cells[2] ? (await cells[2].textContent())?.trim() : null;
            const budgetAllocation = cells[3] ? parseAmount(await cells[3].textContent()) : null;

            if (noSirup && packName) {
              const pack = {
                noSirup,
                packName,
                procurementMethod,
                year: new Date().getFullYear(),
                budgetSource: null,
                budgetAllocation,
                packStatus: cells[4] ? (await cells[4].textContent())?.trim() : null,
                satkerId: SATKER_ID,
                items: []
              };

              packs.push(pack);
              onPage?.(pack, pageNum);
            }
          } catch (err) {
            onError?.(`Row parse error: ${err.message}`);
          }
        }

        // Try to go to next page
        const nextBtn = await page.$('.pagination .next a, .page-item.next .page-link, a.next, button.next');
        if (!nextBtn) break;

        const isDisabled = await nextBtn.getAttribute('class');
        if (isDisabled?.includes('disabled')) break;

        await nextBtn.click();
        await delay(DELAY_MS);
      }
    } else if (cardItems.length > 0) {
      // Card-based layout
      for (const card of cardItems) {
        try {
          const text = await card.textContent();
          const noSirupMatch = text.match(/(\d{4,})/);
          const noSirup = noSirupMatch?.[1];

          if (noSirup) {
            const pack = {
              noSirup,
              packName: text.substring(0, 200).trim(),
              procurementMethod: null,
              year: new Date().getFullYear(),
              budgetSource: null,
              budgetAllocation: null,
              packStatus: null,
              satkerId: SATKER_ID,
              items: []
            };

            packs.push(pack);
            onPage?.(pack, 1);
          }
        } catch (err) {
          onError?.(`Card parse error: ${err.message}`);
        }
      }
    } else {
      // Try to extract data from JSON if the page returns API-like data
      const bodyText = await page.textContent('body');
      try {
        const jsonData = JSON.parse(bodyText);
        if (Array.isArray(jsonData)) {
          for (const item of jsonData) {
            const pack = {
              noSirup: item.no_sirup || item.noSirup || item.kode_rup || item.id?.toString(),
              packName: item.nama_paket || item.packName || item.nama || '',
              procurementMethod: item.metode_pengadaan || item.procurementMethod || null,
              year: item.tahun || item.year || new Date().getFullYear(),
              budgetSource: item.sumber_dana || item.budgetSource || null,
              budgetAllocation: parseAmount(item.pagu?.toString() || item.budgetAllocation?.toString() || '0'),
              packStatus: item.status || item.packStatus || null,
              satkerId: SATKER_ID,
              items: []
            };
            packs.push(pack);
            onPage?.(pack, 1);
          }
        }
      } catch {
        onError?.('No recognizable data structure found on page');
      }
    }

    onDone?.(packs);
  } catch (err) {
    onError?.(`Scraping failed: ${err.message}`);
    throw err;
  } finally {
    await browser.close();
  }

  return packs;
}

function parseAmount(text) {
  if (!text) return null;
  const cleaned = text.replace(/[^0-9]/g, '');
  const num = parseInt(cleaned);
  return isNaN(num) ? null : num;
}