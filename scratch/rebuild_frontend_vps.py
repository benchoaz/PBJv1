import base64
from ssh_command import run_ssh_command

cmd = "cd ~/PBJv1 && nohup sh -c 'docker compose build --no-cache frontend && docker compose up -d --force-recreate frontend' > build_frontend.log 2>&1 &"
try:
    print("Rebuilding frontend on VPS...")
    print(run_ssh_command("43.134.166.153", "ubuntu", "nebula-57@-ocean", cmd))
except Exception as e:
    print(f"Error: {e}")
