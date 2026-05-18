#!/usr/bin/env node

/**
 * Demo script for Inaproc Catalog Scraper
 *
 * This script demonstrates the main features:
 * 1. Search products
 * 2. Filter by category/price
 * 3. Get product details
 * 4. Compare products
 * 5. Copy product links
 * 6. Take screenshots
 */

import {
  initKatalogScraper,
  searchProducts,
  getProductDetail,
  compareProducts,
  copyProductLink,
  applyFilters
} from '../src/katalog-scraper.js';

const delay = ms => new Promise(r => setTimeout(r, ms));

async function demo() {
  console.log('=== Inaproc Catalog Scraper Demo ===\n');

  const { browser, page } = await initKatalogScraper();

  try {
    // 1. Search for products
    console.log('1. Searching for "laptop"...');
    const searchResult = await searchProducts(page, 'laptop');
    console.log(`   Found ${searchResult.products.length} products\n`);
    await delay(2000);

    // 2. Filter search results
    console.log('2. Filtering with price range...');
    const filterResult = await searchProducts(page, 'komputer', {
      category: 'Elektronik',
      priceMin: 5000000,
      priceMax: 15000000,
    });
    console.log(`   Found ${filterResult.products.length} products within price range\n`);
    await delay(2000);

    // 3. Get product details
    if (searchResult.products.length > 0 && searchResult.products[0].link) {
      console.log('3. Getting product details...');
      const detail = await getProductDetail(page, searchResult.products[0].link);
      console.log(`   Product: ${detail.pageTitle}\n`);
      await delay(2000);
    }

    // 4. Copy product links
    if (searchResult.products.length > 1) {
      console.log('4. Copying product link...');
      const linkResult = await copyProductLink(page, searchResult.products[0].link);
      console.log(`   Found ${linkResult.links.length} links on page\n`);
      await delay(2000);
    }

    // 5. Compare products
    const productLinks = searchResult.products.slice(0, 3).map(p => p.link).filter(Boolean);
    if (productLinks.length >= 2) {
      console.log('5. Comparing products...');
      const comparison = await compareProducts(page, productLinks);
      console.log(`   Comparison complete with ${comparison.products.length} products`);
      console.log(`   Differences found: ${comparison.summary.differences.length}\n`);
    }

    console.log('=== Demo Complete ===');
    console.log('Screenshots saved to ./screenshots/');

  } catch (err) {
    console.error('Demo error:', err.message);
  } finally {
    await browser.close();
  }
}

demo().catch(console.error);