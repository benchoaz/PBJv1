const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');

const proxyUrl = 'http://nerezafq:h0mynmrqzc0e@38.154.203.95:5863';
const agentHttps = new HttpsProxyAgent(proxyUrl);

async function test() {
  try {
    const resp = await axios.get('https://e-katalog.lkpp.go.id/', {
      httpsAgent: agentHttps,
      timeout: 10000,
      validateStatus: () => true
    });
    console.log('Status:', resp.status);
    console.log('Headers:', resp.headers);
  } catch (err) {
    console.error('Error:', err.message);
    if (err.response) {
      console.error('Response status:', err.response.status);
    }
  }
}

test();
