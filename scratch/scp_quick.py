import subprocess, sys

h, u, p = "43.134.166.153", "ubuntu", "nebula-57@-ocean"

def run(cmd, timeout=600):
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout)
    out = (r.stdout + r.stderr).strip()
    if out: print(out[-3000:])
    return r.returncode

# Upload files
files = [
    ('/home/beni/PBJ/frontend/src/pages/ProxyTester.jsx', '/home/ubuntu/PBJv1/frontend/src/pages/ProxyTester.jsx'),
    ('/home/beni/PBJ/survey-service/package.json', '/home/ubuntu/PBJv1/survey-service/package.json'),
]

for local, remote in files:
    cmd = f"scp -o StrictHostKeyChecking=no -o BatchMode=no -o PasswordAuthentication=yes '{local}' {u}@{h}:'{remote}'"
    # Use SSH key if available, else try password via expect
    print(f"Upload {local}...")
    r = subprocess.run(['scp', '-o', 'StrictHostKeyChecking=no', local, f'{u}@{h}:{remote}'], 
                      capture_output=True, text=True, timeout=30)
    if r.returncode != 0:
        print(f"  FAILED: {r.stderr[:200]}")
    else:
        print("  OK")

# Rebuild survey-service dengan --no-cache via SSH
print("\n=== Rebuild survey-service --no-cache ===")
run(f"ssh -o StrictHostKeyChecking=no {u}@{h} 'cd PBJv1 && docker compose build --no-cache survey-service 2>&1'")
run(f"ssh -o StrictHostKeyChecking=no {u}@{h} 'cd PBJv1 && docker compose up -d survey-service'")
print("\n=== Status ===")
run(f"ssh -o StrictHostKeyChecking=no {u}@{h} 'cd PBJv1 && docker compose ps survey-service'")
