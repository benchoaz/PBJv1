import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'pbj_user',
  password: process.env.DB_PASSWORD || 'pbj_password',
  database: process.env.DB_NAME || 'pbj',
});

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS procurement_packs (
      id SERIAL PRIMARY KEY,
      no_sirup VARCHAR(50) UNIQUE,
      pack_name TEXT,
      procurement_method VARCHAR(100),
      year INTEGER,
      budget_source TEXT,
      budget_allocation BIGINT,
      pack_status VARCHAR(50),
      satker_id VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS pack_items (
      id SERIAL PRIMARY KEY,
      pack_no_sirup VARCHAR(50) REFERENCES procurement_packs(no_sirup),
      item_name TEXT,
      item_quantity BIGINT,
      item_unit VARCHAR(50),
      item_price BIGINT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export async function savePack(pack) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(`
      INSERT INTO procurement_packs
        (no_sirup, pack_name, procurement_method, year, budget_source, budget_allocation, pack_status, satker_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (no_sirup) DO UPDATE SET
        pack_name = EXCLUDED.pack_name,
        procurement_method = EXCLUDED.procurement_method,
        year = EXCLUDED.year,
        budget_source = EXCLUDED.budget_source,
        budget_allocation = EXCLUDED.budget_allocation,
        pack_status = EXCLUDED.pack_status,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id
    `, [
      pack.noSirup,
      pack.packName,
      pack.procurementMethod,
      pack.year,
      pack.budgetSource,
      pack.budgetAllocation,
      pack.packStatus,
      pack.satkerId
    ]);

    for (const item of pack.items || []) {
      await client.query(`
        INSERT INTO pack_items
          (pack_no_sirup, item_name, item_quantity, item_unit, item_price)
        VALUES ($1, $2, $3, $4, $5)
      `, [pack.noSirup, item.name, item.quantity, item.unit, item.price]);
    }

    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getPackCount() {
  const result = await pool.query('SELECT COUNT(*) FROM procurement_packs');
  return parseInt(result.rows[0].count);
}