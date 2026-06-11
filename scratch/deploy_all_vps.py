import os, sys, pty, select

def run_cmd(cmd):
    pid, fd = pty.fork()
    if pid == 0:
        os.execvp(cmd[0], cmd)
    output, password_sent = [], False
    while True:
        try:
            r, _, _ = select.select([fd], [], [], 2.0)
            if fd in r:
                data = os.read(fd, 4096).decode('utf-8')
                if not data: break
                output.append(data)
                if "assword:" in data and not password_sent:
                    os.write(fd, ('nebula-57@-ocean\n').encode('utf-8'))
                    password_sent = True
        except OSError: break
    _, status = os.waitpid(pid, 0)
    return os.WEXITSTATUS(status)

host, user = '43.134.166.153', 'ubuntu'
files = [
    ('/home/beni/PBJ/survey-service/server.js', '/home/ubuntu/PBJv1/survey-service/server.js'),
    ('/home/beni/PBJ/frontend/src/App.jsx', '/home/ubuntu/PBJv1/frontend/src/App.jsx'),
    ('/home/beni/PBJ/frontend/src/components/Header.jsx', '/home/ubuntu/PBJv1/frontend/src/components/Header.jsx'),
    ('/home/beni/PBJ/frontend/src/components/ProjectList.jsx', '/home/ubuntu/PBJv1/frontend/src/components/ProjectList.jsx'),
    ('/home/beni/PBJ/frontend/src/pages/ProxyTester.jsx', '/home/ubuntu/PBJv1/frontend/src/pages/ProxyTester.jsx'),
    ('/home/beni/PBJ/frontend/src/components/ppk/Step3RincianHPS.jsx', '/home/ubuntu/PBJv1/frontend/src/components/ppk/Step3RincianHPS.jsx'),
]

# Create directories if they don't exist
run_cmd(["ssh", "-o", "StrictHostKeyChecking=no", f"{user}@{host}", "mkdir -p /home/ubuntu/PBJv1/frontend/src/pages"])

for local, remote in files:
    print(f"Uploading {local}...")
    st = run_cmd(["scp", "-o", "StrictHostKeyChecking=no", local, f"{user}@{host}:{remote}"])
    print("✅ Sukses" if st == 0 else f"❌ Gagal: {st}")

# Remove old ProxyTesterModal.jsx on VPS
run_cmd(["ssh", "-o", "StrictHostKeyChecking=no", f"{user}@{host}", "rm -f /home/ubuntu/PBJv1/frontend/src/components/ProxyTesterModal.jsx"])

print("Rebuilding on VPS...")
cmd_build = "cd PBJv1 && docker compose build frontend survey-service && docker compose up -d frontend survey-service"
run_cmd(["ssh", "-o", "StrictHostKeyChecking=no", f"{user}@{host}", cmd_build])
print("Done!")
