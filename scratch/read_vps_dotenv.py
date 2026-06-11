from ssh_command import run_ssh_command

host = "43.134.166.153"
user = "ubuntu"
password = "nebula-57@-ocean"

# Command to read VPS dotenv
cmd = 'cat ~/PBJv1/.env'

print(f"Running: {cmd}")
res = run_ssh_command(host, user, password, cmd)
print("=== RESULT ===")
print(res)
