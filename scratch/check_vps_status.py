import sys
sys.path.append('scratch')
from ssh_command import run_ssh_command

host = "43.134.166.153"
user = "ubuntu"
password = "nebula-57@-ocean"

print("Checking docker compose ps...")
res = run_ssh_command(host, user, password, "cd ~/PBJv1 && docker compose ps")
print(res)
