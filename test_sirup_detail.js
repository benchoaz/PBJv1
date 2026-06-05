const https = require('https');

https.get('https://sirup.inaproc.id/sirup/ro/penyedia/detailPaketPenyedia2020?idPaket=49626354', {
  headers: {
    'User-Agent': 'Mozilla/5.0'
  }
}, (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => {
    console.log(data);
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
