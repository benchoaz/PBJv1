from ssh_command import run_ssh_command
print(run_ssh_command("43.134.166.153", "ubuntu", "nebula-57@-ocean", "cat ~/PBJv1/backend/internal/handlers/sirup.go | grep -i 'Gagal menghubungi'"))
