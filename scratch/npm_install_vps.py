import os, sys, pty, select, time, subprocess

h, u, p = "43.134.166.153", "ubuntu", "nebula-57@-ocean"

def scp_file(local, remote):
    cmd = f"sshpass -p '{p}' scp -o StrictHostKeyChecking=no {local} {u}@{h}:{remote}"
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)
    print(f"SCP {local}: {'OK' if result.returncode == 0 else result.stderr}")

def ssh_run(command, timeout=300):
    cmd = f"sshpass -p '{p}' ssh -o StrictHostKeyChecking=no {u}@{h} \"{command}\""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout)
    print(result.stdout[-2000:] if result.stdout else "(no output)")
    if result.stderr: print("STDERR:", result.stderr[-500:])
    return result.returncode

# 1. Upload package.json terbaru
scp_file('/home/beni/PBJ/survey-service/package.json', '/home/ubuntu/PBJv1/survey-service/package.json')

# 2. Stop container
print("=== Stop survey-service ===")
ssh_run("cd PBJv1 && docker compose stop survey-service")

# 3. Build ulang tanpa cache  
print("=== Build --no-cache (bisa 3-5 menit) ===")
ssh_run("cd PBJv1 && docker compose build --no-cache survey-service 2>&1", timeout=600)

# 4. Start ulang
print("=== Start survey-service ===")
ssh_run("cd PBJv1 && docker compose up -d survey-service")

time.sleep(8)

# 5. Cek status
print("=== Final Status ===")
ssh_run("cd PBJv1 && docker compose ps survey-service && docker compose logs --tail=8 survey-service")
