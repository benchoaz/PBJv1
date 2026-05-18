import { scrapeSIRUP } from './scraper.js';
import { initDb, savePack, getPackCount, pool } from './db.js';

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000;

async function run() {
  console.log('SIRUP Scraper starting...');

  await initDb();
  console.log('Database initialized');

  let successCount = 0;
  let errorCount = 0;
  const packsToScrape = [];

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`Attempt ${attempt}/${MAX_RETRIES}...`);

    try {
      await scrapeSIRUP({
        onPage: (pack, pageNum) => {
          console.log(`[${pageNum}] ${pack.noSirup}: ${pack.packName.substring(0, 50)}...`);
          packsToScrape.push(pack);
        },
        onError: (err) => console.error('Error:', err),
        onDone: async (packs) => {
          console.log(`Found ${packs.length} packs`);

          for (const pack of packs) {
            try {
              await savePack(pack);
              successCount++;
            } catch (err) {
              if (err.message?.includes('duplicate')) {
                console.log(`  Skipping duplicate: ${pack.noSirup}`);
              } else {
                console.error(`  Save error for ${pack.noSirup}:`, err.message);
                errorCount++;
              }
            }
          }

          const total = await getPackCount();
          console.log(`\nSummary: ${successCount} saved, ${errorCount} errors. Total in DB: ${total}`);
        }
      });

      break;
    } catch (err) {
      console.error(`Attempt ${attempt} failed:`, err.message);
      if (attempt < MAX_RETRIES) {
        console.log(`Retrying in ${RETRY_DELAY / 1000}s...`);
        await new Promise(r => setTimeout(r, RETRY_DELAY));
      }
    }
  }
}

// Check if we should run in interval mode or once
const intervalMs = parseInt(process.env.SCRAPE_INTERVAL || '0');

if (intervalMs > 0) {
  console.log(`Running in scheduler mode. Interval: ${intervalMs}ms`);
  // Run once immediately
  run().catch(err => console.error('Error in initial run:', err));
  
  // Set interval
  setInterval(() => {
    console.log('Scheduled run starting...');
    run().catch(err => console.error('Error in scheduled run:', err));
  }, intervalMs);
} else {
  console.log('Running once...');
  run()
    .then(() => pool.end())
    .catch(err => {
      console.error('Fatal error:', err);
      pool.end();
    });
}