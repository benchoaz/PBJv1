from ssh_command import run_ssh_command
cmd = "cd ~/PBJv1 && docker compose build api > build_api.log 2>&1 && docker compose up -d --force-recreate api >> build_api.log 2>&1"
print(run_ssh_command("43.134.166.153", "ubuntu", "nebula-57@-ocean", cmd))
