from ssh_command import run_ssh_command
cmd = "cd ~/PBJv1 && docker compose up -d --force-recreate api"
print(run_ssh_command("43.134.166.153", "ubuntu", "nebula-57@-ocean", cmd))
