import os, sys, pty, select, time

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
                print(data, end='', flush=True)
                if "assword:" in data and not password_sent:
                    os.write(fd, ('nebula-57@-ocean\n').encode('utf-8'))
                    password_sent = True
        except OSError: break
    _, status = os.waitpid(pid, 0)
    return os.WEXITSTATUS(status)

host, user = '43.134.166.153', 'ubuntu'

print("Uploading update.tar.gz...")
run_cmd(["scp", "-o", "StrictHostKeyChecking=no", "/home/beni/PBJ/update.tar.gz", f"{user}@{host}:/home/ubuntu/PBJv1/update.tar.gz"])

print("Extracting and building...")
run_cmd(["ssh", "-o", "StrictHostKeyChecking=no", f"{user}@{host}", "cd ~/PBJv1 && tar xzf update.tar.gz && rm update.tar.gz && rm -f frontend/src/components/budget/RKADashboard.jsx frontend/src/components/budget/RKAUploadModal.jsx && nohup sh -c 'docker compose build --no-cache api frontend dpa-parser && docker compose up -d --force-recreate api frontend dpa-parser' > rebuild.log 2>&1 &"])
print("Deployment triggered on VPS!")
