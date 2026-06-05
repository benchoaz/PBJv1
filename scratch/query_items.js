const { Client } = require('pg');
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'pbj_db',
  password: 'postgres',
  port: 5432,
});
client.connect().then(async () => {
  const res = await client.query("SELECT id, name, status, budget FROM projects ORDER BY id DESC");
  console.log("=== PROJECTS ===");
  console.log(res.rows);
  for (const row of res.rows) {
    const itemsRes = await client.query("SELECT id, name, qty, price, dpa_price, vendor FROM project_items WHERE project_id=$1", [row.id]);
    console.log(`\nItems for Project ID ${row.id} (${row.name}):`);
    console.log(itemsRes.rows);
  }
  client.end();
}).catch(console.error);
