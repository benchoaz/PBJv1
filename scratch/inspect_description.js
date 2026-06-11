const { Client } = require('pg');
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'pbj_db',
  password: 'postgres',
  port: 5432,
});
client.connect().then(async () => {
  const res = await client.query("SELECT id, name, status, description FROM projects");
  for (const row of res.rows) {
    console.log(`ID: ${row.id}, Name: ${row.name}, Status: ${row.status}`);
    try {
      const parsed = JSON.parse(row.description);
      console.log("  Keys:", Object.keys(parsed));
      console.log("  has comparisons:", !!parsed.comparisons);
      if (parsed.comparisons) {
        console.log("  comparisons:", JSON.stringify(parsed.comparisons, null, 2));
      }
    } catch(e) {
      console.log("  Error parsing JSON");
    }
  }
  client.end();
}).catch(console.error);
