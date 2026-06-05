const { Client } = require('pg');
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'pbj_db',
  password: 'postgres',
  port: 5432,
});
client.connect().then(async () => {
  const res = await client.query("SELECT id, name, description FROM projects ORDER BY id DESC LIMIT 2");
  for (const row of res.rows) {
    console.log(`\n================= Project ID ${row.id} (${row.name}) =================`);
    const parsed = JSON.parse(row.description);
    console.log("Keys in description:", Object.keys(parsed));
    if (parsed.items) {
      console.log("Items in description:", parsed.items.map(item => ({
        name: item.name,
        qty: item.qty,
        price: item.price,
        paguDpa: item.paguDpa,
        dpa_price: item.dpa_price
      })));
    }
  }
  client.end();
}).catch(console.error);
