const fetch = require('node-fetch');

async function run() {
  const payload = {
    items: [
      {
        name: 'Pulpen Standard Boldliner',
        query: 'Pulpen Standard Boldliner',
        fallbackPrice: 250000,
        qty: 1,
        originalNo: 2,
        targetVendor: 'sultoni-wza2',
        targetUrl: 'https://katalog.inaproc.id/sultoni-wza2/pulpen-standard-boldliner'
      }
    ],
    useAi: true,
    locations: [],
    ignorePriceLimit: false,
    autoComparator: false
  };

  const res = await fetch('http://localhost:3001/api/survey/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  console.log("Job ID:", data.jobId);
  
  while(true) {
    const statusRes = await fetch('http://localhost:3001/api/survey/status/' + data.jobId);
    const status = await statusRes.json();
    console.log("Status:", status.status);
    if (status.status === 'completed') {
      console.log(JSON.stringify(status.results, null, 2));
      break;
    }
    if (status.status === 'failed') break;
    await new Promise(r => setTimeout(r, 2000));
  }
}

run();
