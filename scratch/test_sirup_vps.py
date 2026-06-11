from ssh_command import run_ssh_command
host = "43.134.166.153"
user = "ubuntu"
password = "nebula-57@-ocean"
cmd = '''python3 -c "
import urllib.request
try:
    url = 'https://sirup.inaproc.id/sirup/datatablectr/dataruppenyediasatker?tahun=2026&idSatker=308386&sEcho=1&iColumns=7&iDisplayStart=0&iDisplayLength=10'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    res = urllib.request.urlopen(req, timeout=10)
    print('Status:', res.getcode())
    print('Response length:', len(res.read()))
except Exception as e:
    print('Error:', e)
"'''
print(run_ssh_command(host, user, password, cmd))
