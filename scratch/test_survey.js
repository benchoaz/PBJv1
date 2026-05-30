const fetch = require('node-fetch');

async function testSurvey() {
  const payload = {
    items: [
      { name: "Tinta Stempel (Spesifikasi: 50 Ml)", query: "Tinta Stempel (Spesifikasi: 50 Ml)", fallbackPrice: 32900 },
      { name: "Gunting (Spesifikasi: Besar)", query: "Gunting (Spesifikasi: Besar)", fallbackPrice: 32000 }
    ],
    useAi: true,
    locations: ["Probolinggo"]
  };

  console.log("Mengirim request ke API Survei...");
  const startTime = Date.now();
  
  try {
    const res = await fetch('http://localhost:3001/api/survey/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`\nSurvei Selesai dalam ${duration} detik!`);
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}

testSurvey();
