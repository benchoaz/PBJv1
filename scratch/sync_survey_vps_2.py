import base64
from ssh_command import run_ssh_command

def upload_file(local_path, remote_path):
    with open(local_path, "rb") as f:
        content = f.read()
    b64 = base64.b64encode(content).decode("utf-8")
    cmd = f"echo '{b64}' | base64 -d > {remote_path}"
    run_ssh_command("43.134.166.153", "ubuntu", "nebula-57@-ocean", cmd)
    print(f"Uploaded {local_path} to {remote_path}")

try:
    upload_file("/home/beni/PBJ/survey-service/server.js", "/home/ubuntu/PBJv1/survey-service/server.js")
    
    cmd = "cd ~/PBJv1 && docker compose restart survey-service"
    print(run_ssh_command("43.134.166.153", "ubuntu", "nebula-57@-ocean", cmd))
except Exception as e:
    print(f"Error: {e}")
