import os
from ssh_command import run_ssh_command
from sync_and_restart import run_scp

def main():
    host = "43.134.166.153"
    user = "ubuntu"
    password = "nebula-57@-ocean"
    
    # 1. SCP the script to VPS
    local_script = "/home/beni/PBJ/scratch/update_compose_vps.py"
    remote_script = "/tmp/update_compose_vps.py"
    res = run_scp(host, user, password, local_script, remote_script)
    print(f"SCP Result: {res.strip()}")
    
    # 2. Run the script on VPS
    run_cmd = "python3 /tmp/update_compose_vps.py"
    res = run_ssh_command(host, user, password, run_cmd)
    print("=== Update Script Output ===")
    print(res)
    
    # 3. Restart survey-service
    restart_cmd = "cd ~/PBJv1 && docker compose up -d --force-recreate survey-service"
    res = run_ssh_command(host, user, password, restart_cmd)
    print("=== Recreate Container Output ===")
    print(res)

if __name__ == '__main__':
    main()
