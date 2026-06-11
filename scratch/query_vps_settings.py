from ssh_command import run_ssh_command

host = "43.134.166.153"
user = "ubuntu"
password = "nebula-57@-ocean"

# Command to query app_settings
cmd = 'cd ~/PBJv1 && docker compose exec db psql -U postgres -d pbj_db -c "SELECT * FROM app_settings;"'

print(f"Running: {cmd}")
res = run_ssh_command(host, user, password, cmd)
print("=== RESULT ===")
print(res)
