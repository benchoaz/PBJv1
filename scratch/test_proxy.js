const axios = require('axios');
const { HttpProxyAgent } = require('http-proxy-agent');

async function testProxy(proxyStr) {
    const agent = new HttpProxyAgent(`http://${proxyStr}`);
    try {
        console.log(`Testing ${proxyStr}...`);
        const res = await axios.get('https://e-katalog.lkpp.go.id/', {
            httpAgent: agent,
            httpsAgent: agent,
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        console.log('Success! Status:', res.status);
    } catch (err) {
        console.log('Failed:', err.message);
        if (err.response) {
            console.log('Status:', err.response.status);
        }
    }
}

testProxy('206.123.156.224:4042');
