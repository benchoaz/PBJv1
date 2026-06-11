from ssh_command import run_ssh_command
cmd = "curl -v http://localhost:3001/api/survey/sirup/308386?tahun=2026"
print(run_ssh_command("43.134.166.153", "ubuntu", "nebula-57@-ocean", cmd))
