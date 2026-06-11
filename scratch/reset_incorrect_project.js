const { Client } = require('pg');

async function run() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'pbj_db',
    password: 'postgres',
    port: 5432,
  });

  try {
    await client.connect();
    
    // Find projects in completed status
    const res = await client.query("SELECT id, name, status FROM projects WHERE status = 'Selesai (Arsip Lengkap)' OR status = 'Selesai'");
    
    if (res.rows.length === 0) {
      console.log("No completed projects found in database.");
      await client.end();
      return;
    }

    console.log("Found completed projects:");
    res.rows.forEach(p => {
      console.log(`- ID: ${p.id}, Name: ${p.name}, Status: ${p.status}`);
    });

    // Reset them to 'Terkirim ke PP'
    for (const p of res.rows) {
      console.log(`Resetting project ID ${p.id} to 'Terkirim ke PP'...`);
      await client.query("UPDATE projects SET status = 'Terkirim ke PP' WHERE id = $1", [p.id]);
      
      // Also clean up any associated BAHP document for this project so they can create a fresh correct one
      console.log(`Cleaning up any existing empty BAHP document for project ID ${p.id}...`);
      await client.query("DELETE FROM bahp_documents WHERE project_id = $1", [p.id]);
    }

    console.log("Success! Projects reset and empty BAHP documents removed.");
  } catch (err) {
    console.error("Database error:", err);
  } finally {
    try {
      await client.end();
    } catch(e) {}
  }
}

run();
