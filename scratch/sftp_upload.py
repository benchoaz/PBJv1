"""Upload file ke VPS menggunakan SCP via pty (sama seperti ssh_command.py)"""
import os
import sys
import pty
import select

def run_scp_upload(host, user, password, local_path, remote_path):
    scp_cmd = [
        "scp",
        "-o", "StrictHostKeyChecking=no",
        local_path,
        f"{user}@{host}:{remote_path}"
    ]

    pid, fd = pty.fork()

    if pid == 0:
        os.execvp(scp_cmd[0], scp_cmd)
        sys.exit(1)
    else:
        output = []
        password_sent = False

        while True:
            r, _, _ = select.select([fd], [], [], 60)
            if not r:
                break
            try:
                data = os.read(fd, 4096)
            except OSError:
                break
            if not data:
                break
            decoded = data.decode('utf-8', errors='ignore')
            output.append(decoded)
            if "password:" in decoded.lower() and not password_sent:
                os.write(fd, (password + "\n").encode())
                password_sent = True

        _, status = os.waitpid(pid, 0)
        return "".join(output), status

if __name__ == "__main__":
    host = "43.134.166.153"
    user = "ubuntu"
    password = "nebula-57@-ocean"

    local = "/home/beni/PBJ/frontend/src/components/ProcurementPanel.jsx"
    remote = "/home/ubuntu/PBJv1/frontend/src/components/ProcurementPanel.jsx"

    print(f"Uploading {local} → {remote}")
    out, status = run_scp_upload(host, user, password, local, remote)
    print("Output:", out)
    print("Status:", status)
    if status == 0:
        print("✅ Upload berhasil!")
    else:
        print("❌ Upload gagal!")
