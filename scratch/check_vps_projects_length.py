from ssh_command import run_ssh_command

host = "43.134.166.153"
user = "ubuntu"
password = "nebula-57@-ocean"

# Command to query the project details (excluding corrupted rows if any, using a query on projects where description is not null)
cmd = 'cd ~/PBJv1 && docker compose exec db psql -U postgres -d pbj_db -c "SELECT id, name, status, length(description::text) FROM projects;"'

print(f"Running: {cmd}")
res = run_ssh_command(host, user, password, cmd)
print("=== RESULT ===")
print(res)
