from ssh_command import run_ssh_command
host = "43.134.166.153"
user = "ubuntu"
password = "nebula-57@-ocean"
cmd = 'cat ~/PBJv1/backend/internal/handlers/projects.go | grep -C 5 idSatkerFilter'
print(run_ssh_command(host, user, password, cmd))
