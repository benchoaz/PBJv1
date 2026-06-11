from ssh_command import run_ssh_command
host = "43.134.166.153"
user = "ubuntu"
password = "nebula-57@-ocean"
cmd = '''cd ~/PBJv1/survey-service && docker compose exec survey-service node test_sirup.js'''
print(run_ssh_command(host, user, password, cmd))
