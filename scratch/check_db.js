const { Client } = require('pg');
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'pbj_db',
  password: 'postgres',
  port: 5432,
});
client.connect().then(async () => {
  const res = await client.query("SELECT description FROM projects WHERE status='Terkirim ke PP' LIMIT 1");
  const parsed = JSON.parse(res.rows[0].description);
  console.log("dpaRincian: ", JSON.stringify(parsed.dpaRincian, null, 2));
  console.log("survey products: ", JSON.stringify(parsed.surveyData.products, null, 2));
  client.end();
}).catch(console.error);
