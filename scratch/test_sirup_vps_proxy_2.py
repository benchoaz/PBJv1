import urllib.request
import json
try:
    url = 'http://43.134.166.153:8081/api/sirup/satker/308386'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    res = urllib.request.urlopen(req, timeout=60)
    data = json.loads(res.read())
    print("Success:", data.get("success"))
except Exception as e:
    print('Error:', e)
    if hasattr(e, 'read'):
        print('Body:', e.read().decode())
