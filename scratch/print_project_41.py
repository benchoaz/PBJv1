import json
from ssh_command import run_ssh_command

host = "43.134.166.153"
user = "ubuntu"
password = "nebula-57@-ocean"

# Command to query description of project 41
cmd = 'cd ~/PBJv1 && docker compose exec db psql -U postgres -d pbj_db -t -c "SELECT description FROM projects WHERE id=1;"'
res = run_ssh_command(host, user, password, cmd)

try:
    data = json.loads(res.strip())
    print("=== dpaRincian ===")
    print(json.dumps(data.get("dpaRincian"), indent=2))
    print("\n=== surveyData ===")
    print(json.dumps(data.get("surveyData"), indent=2))
except Exception as e:
    print("Error parsing JSON:", e)
    print("Raw output:", res[:1000])
