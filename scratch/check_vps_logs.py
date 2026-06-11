import sys
sys.path.append('scratch')
from ssh_command import run_ssh_command

host = "43.134.166.153"
user = "ubuntu"
password = "nebula-57@-ocean"

print("--- Survey Service Logs ---")
print(run_ssh_command(host, user, password, "cd ~/PBJv1 && docker compose logs survey-service --tail 30"))

print("\n--- API Service Logs ---")
print(run_ssh_command(host, user, password, "cd ~/PBJv1 && docker compose logs api --tail 30"))
