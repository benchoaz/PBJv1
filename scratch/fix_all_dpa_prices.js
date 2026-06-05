const { Client } = require('pg');
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'pbj_db',
  password: 'postgres',
  port: 5432,
});

client.connect().then(async () => {
  const res = await client.query("SELECT id, name, description FROM projects");
  for (const row of res.rows) {
    if (!row.description) continue;
    let parsed;
    try {
      parsed = JSON.parse(row.description);
    } catch (e) {
      continue;
    }
    if (!parsed.items) continue;

    // Find all items in dpaRincian
    const allDpaItems = [];
    if (parsed.dpaRincian) {
      Object.values(parsed.dpaRincian).forEach(list => {
        if (Array.isArray(list)) {
          allDpaItems.push(...list);
        }
      });
    }

    // Map each item in items to its correct DPA price from dpaRincian
    parsed.items = parsed.items.map(item => {
      const cleanName = (n) => n.toLowerCase().replace(/[^a-z0-9]/g, '');
      const itemClean = cleanName(item.name);
      
      let matched = allDpaItems.find(d => cleanName(d.nama) === itemClean);
      if (!matched) {
        matched = allDpaItems.find(d => cleanName(d.nama).includes(itemClean) || itemClean.includes(cleanName(d.nama)));
      }

      // If matched, use the DPA unit price (harga_satuan)
      const dpaPrice = matched ? matched.harga_satuan : (item.paguDpa || item.price || 0);
      return {
        ...item,
        dpa_price: dpaPrice,
        paguDpa: dpaPrice
      };
    });

    // Update the project description in DB
    const updatedDesc = JSON.stringify(parsed);
    await client.query("UPDATE projects SET description=$1 WHERE id=$2", [updatedDesc, row.id]);
    console.log(`Updated project ${row.id} description with correct dpa_price mapping.`);

    // Delete existing project items to avoid constraints conflicts
    await client.query("DELETE FROM project_items WHERE project_id=$1", [row.id]);

    // Insert into project_items table
    for (const item of parsed.items) {
      await client.query(
        "INSERT INTO project_items (project_id, name, qty, unit, price, dpa_price, vendor) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [row.id, item.name, item.qty || 0, item.unit || 'Unit', item.price || 0, item.dpa_price || 0, item.vendor || '']
      );
    }
    console.log(`Inserted ${parsed.items.length} items into project_items table for project ${row.id}.`);
  }
  client.end();
}).catch(console.error);
