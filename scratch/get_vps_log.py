from ssh_command import run_ssh_command
print(run_ssh_command("43.134.166.153", "ubuntu", "nebula-57@-ocean", "cd ~/PBJv1 && docker compose logs --tail 50 survey-service > survey_logs.txt && cat survey_logs.txt"))
