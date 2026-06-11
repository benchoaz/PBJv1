const axios = require('axios');
const proxies = [
"206.123.156.224:4042",
"72.210.252.134:46164",
"66.29.128.241:12795",
"217.69.121.115:5780",
"112.86.116.24:1080"
];

axios.post('http://localhost:3001/api/survey/test-proxies', { proxies })
  .then(res => console.log(res.data))
  .catch(err => console.error(err.response ? err.response.data : err.message));
