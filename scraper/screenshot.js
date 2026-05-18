#!/usr/bin/env node

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read URLs from arguments or stdin
async function getUrls() {
  if (process.argv.length > 2) {
    return process.argv.slice(2);
  }

  // Try to read from stdin
  const input = await new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => data += chunk);
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', () => resolve(''));
  });

  if (input.trim()) {
    return input.trim().split('\n').filter(line => line.trim());
  }

  return [];
}

function sanitizeFilename(url) {
  return url
    .replace(/^https?:\/\//, '')
    .replace(/[^a-zA-Z0-9-_.]/g, '_')
    .slice(0, 100);
}

async function takeScreenshot(url, outputPath) {
  console.log(`Taking screenshot of: ${url}`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.screenshot({ path: outputPath, fullPage: true });
    console.log(`Saved screenshot to: ${outputPath}`);
  } finally {
    await browser.close();
  }
}

async function main() {
  const urls = await getUrls();

  if (urls.length === 0) {
    console.error('Usage: node screenshot.js <url1> <url2> ...');
    console.error('   or: cat urls.txt | node screenshot.js');
    process.exit(1);
  }

  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  for (const url of urls) {
    const filename = `${sanitizeFilename(url)}.png`;
    const outputPath = path.join(screenshotsDir, filename);
    await takeScreenshot(url.trim(), outputPath);
  }

  console.log(`\nCompleted ${urls.length} screenshot(s)`);
}

main().catch(console.error);