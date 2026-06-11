import os
import sys
import pty
import select
from ssh_command import run_ssh_command

def run_scp(host, user, password, local_path, remote_path):
    # Command to run scp
    scp_cmd = ["scp", "-o", "StrictHostKeyChecking=no", local_path, f"{user}@{host}:{remote_path}"]
    print(f"Copying {local_path} to {remote_path}...")
    
    # Fork a pty
    pid, fd = pty.fork()
    
    if pid == 0:
        # Child process
        os.execvp(scp_cmd[0], scp_cmd)
        sys.exit(1)
    else:
        # Parent process
        output = []
        password_sent = False
        
        while True:
            r, w, e = select.select([fd], [], [], 10)
            if not r:
                break
            try:
                data = os.read(fd, 1024)
            except OSError:
                break
            if not data:
                break
                
            decoded = data.decode('utf-8', errors='ignore')
            output.append(decoded)
            
            if "password:" in decoded.lower() and not password_sent:
                os.write(fd, (password + "\n").encode())
                password_sent = True
                
        os.waitpid(pid, 0)
        return "".join(output)

def main():
    host = "43.134.166.153"
    user = "ubuntu"
    password = "nebula-57@-ocean"
    
    # Files to sync (relative to project root /home/beni/PBJ)
    files_to_sync = [
        ("backend/internal/handlers/sirup.go", "PBJv1/backend/internal/handlers/sirup.go"),
        ("backend/internal/handlers/dpa.go", "PBJv1/backend/internal/handlers/dpa.go"),
        ("backend/internal/repository/projects.go", "PBJv1/backend/internal/repository/projects.go"),
        ("backend/cmd/server/main.go", "PBJv1/backend/cmd/server/main.go"),
        ("frontend/src/components/ppk/Step1PilihPaket.jsx", "PBJv1/frontend/src/components/ppk/Step1PilihPaket.jsx"),
        ("frontend/src/components/ppk/Step2UploadDPA.jsx", "PBJv1/frontend/src/components/ppk/Step2UploadDPA.jsx"),
        ("frontend/src/components/OcrApiKeyManager.jsx", "PBJv1/frontend/src/components/OcrApiKeyManager.jsx"),
        ("frontend/nginx.conf", "PBJv1/frontend/nginx.conf"),
        ("frontend/src/components/ppk/Step3RincianHPS.jsx", "PBJv1/frontend/src/components/ppk/Step3RincianHPS.jsx"),
        ("frontend/src/components/ppk/DocPreviewModal.jsx", "PBJv1/frontend/src/components/ppk/DocPreviewModal.jsx"),
        ("dpa-parser/main.py", "PBJv1/dpa-parser/main.py"),
        ("survey-service/server.js", "PBJv1/survey-service/server.js"),
        ("docker-compose.yml", "PBJv1/docker-compose.yml")
    ]
    
    # SCP files
    for local, remote in files_to_sync:
        local_abs = os.path.join("/home/beni/PBJ", local)
        res = run_scp(host, user, password, local_abs, remote)
        print(f"SCP Result for {local}: {res.strip()}")

    # Restart & Rebuild containers on VPS
    print("Rebuilding and restarting Docker containers on VPS...")
    rebuild_cmd = "cd ~/PBJv1 && docker compose down && docker compose up -d --build"
    res = run_ssh_command(host, user, password, rebuild_cmd)
    print("=== Rebuild & Restart Result ===")
    print(res)

if __name__ == '__main__':
    main()
