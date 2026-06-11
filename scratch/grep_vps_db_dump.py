from ssh_command import run_ssh_command

host = "43.134.166.153"
user = "ubuntu"
password = "nebula-57@-ocean"

# Command to dump and grep for PUJASERA
cmd = 'cd ~/PBJv1 && docker compose exec db pg_dump -U postgres pbj_db | grep -i -C 3 "pujasera"'

print(f"Running: {cmd}")
res = run_ssh_command(host, user, password, cmd)
print("=== RESULT ===")
print(res)
