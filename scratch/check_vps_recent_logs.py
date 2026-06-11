import sys
sys.path.append('scratch')
from ssh_command import run_ssh_command

host = "43.134.166.153"
user = "ubuntu"
password = "nebula-57@-ocean"

print("--- Survey Service Recent Logs ---")
print(run_ssh_command(host, user, password, "cd ~/PBJv1 && docker compose logs survey-service --since 5m"))

print("\n--- Nginx Recent Logs ---")
print(run_ssh_command(host, user, password, "cd ~/PBJv1 && docker compose logs frontend --since 5m"))

print("\n--- API Recent Logs ---")
print(run_ssh_command(host, user, password, "cd ~/PBJv1 && docker compose logs api --since 5m"))
