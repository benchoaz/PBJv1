const { Client } = require('pg');
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'pbj_db',
  password: 'pbj_secure_prod_pwd',
  port: 5432,
});
client.connect().then(async () => {
  const res = await client.query("SELECT * FROM vendor_locations;");
  console.log("Vendor Locations:");
  console.log(JSON.stringify(res.rows, null, 2));
  client.end();
}).catch(console.error);
