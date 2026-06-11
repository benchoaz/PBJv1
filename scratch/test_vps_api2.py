from ssh_command import run_ssh_command
host = "43.134.166.153"
user = "ubuntu"
password = "nebula-57@-ocean"
cmd = '''python3 -c "
import requests
url = 'http://localhost:8081/api/projects?idSatker=67081'
headers = {'X-User-Role': 'PPK', 'X-User-Satker': '67081'}
res = requests.get(url, headers=headers)
print('Status Code:', res.status_code)
if res.status_code == 200:
    print('Project Count:', len(res.json()))
"'''
print(run_ssh_command(host, user, password, cmd))
