from ssh_command import run_ssh_command
import subprocess

def scp_file(local_path, remote_path):
    cmd = ["sshpass", "-p", "nebula-57@-ocean", "scp", "-o", "StrictHostKeyChecking=no", local_path, f"ubuntu@43.134.166.153:{remote_path}"]
    subprocess.run(cmd, check=True)
    print(f"Uploaded {local_path} to {remote_path}")

try:
    scp_file("/home/beni/PBJ/backend/internal/handlers/sirup.go", "/home/ubuntu/PBJv1/backend/internal/handlers/sirup.go")
    scp_file("/home/beni/PBJ/survey-service/server.js", "/home/ubuntu/PBJv1/survey-service/server.js")
    
    # Restart services
    cmd = "cd ~/PBJv1 && docker compose restart api survey-service"
    print(run_ssh_command("43.134.166.153", "ubuntu", "nebula-57@-ocean", cmd))
except Exception as e:
    print(f"Error: {e}")
