from ssh_command import run_ssh_command
host = "43.134.166.153"
user = "ubuntu"
password = "nebula-57@-ocean"
cmd = 'cd ~/PBJv1 && docker compose exec db psql -U postgres -d pbj_db -c "\\d projects"'
print(run_ssh_command(host, user, password, cmd))
