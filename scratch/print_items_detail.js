const { Client } = require('pg');
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'pbj_db',
  password: 'postgres',
  port: 5432,
});
client.connect().then(async () => {
  const res = await client.query("SELECT description FROM projects WHERE id='31'");
  const parsed = JSON.parse(res.rows[0].description);
  console.log("Items details:");
  parsed.items.forEach((item, idx) => {
    console.log(`\nItem ${idx + 1}: ${item.name}`);
    console.log("  qty:", item.qty);
    console.log("  price:", item.price);
    console.log("  paguDpa:", item.paguDpa);
    console.log("  dpa_price:", item.dpa_price);
    console.log("  vendor:", item.vendor);
    console.log("  surveys:", JSON.stringify(item.surveys, null, 2));
  });
  client.end();
}).catch(console.error);
