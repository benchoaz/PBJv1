import requests

url = "http://43.134.166.153:8081/api/projects?idSatker=67081"
headers = {
    "X-User-Role": "PPK",
    "X-User-Satker": "67081"
}

response = requests.get(url, headers=headers)
print("Status Code:", response.status_code)
print("Response JSON length:", len(response.json()))
