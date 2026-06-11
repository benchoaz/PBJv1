import requests
url = "http://43.134.166.153:8081/api/projects?idSatker=67081"
headers = {"X-User-Role": "PPK", "X-User-Satker": "67081"}
res = requests.get(url, headers=headers)
print(res.text)
