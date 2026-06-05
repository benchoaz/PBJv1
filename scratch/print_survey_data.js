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
  console.log("surveyData:", JSON.stringify(parsed.surveyData, null, 2));
  console.log("hpsPrices:", JSON.stringify(parsed.hpsPrices, null, 2));
  client.end();
}).catch(console.error);
