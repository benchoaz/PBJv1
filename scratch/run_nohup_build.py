from ssh_command import run_ssh_command
cmd = "cd ~/PBJv1 && nohup sh -c 'docker compose build api && docker compose up -d --force-recreate api' > build_bg.log 2>&1 &"
print(run_ssh_command("43.134.166.153", "ubuntu", "nebula-57@-ocean", cmd))
