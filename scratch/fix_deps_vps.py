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
    os.waitpid(pid, 0)
    return "".join(output)

host, user = '43.134.166.153', 'ubuntu'
files = [
    ('/home/beni/PBJ/survey-service/package.json', '/home/ubuntu/PBJv1/survey-service/package.json'),
    ('/home/beni/PBJ/survey-service/package-lock.json', '/home/ubuntu/PBJv1/survey-service/package-lock.json'),
]

for local, remote in files:
    print(f"Uploading {local}...")
    run_cmd(["scp", "-o", "StrictHostKeyChecking=no", local, f"{user}@{host}:{remote}"])

print("Rebuilding survey-service on VPS...")
cmd_build = "cd PBJv1 && docker compose build survey-service && docker compose up -d survey-service"
run_cmd(["ssh", "-o", "StrictHostKeyChecking=no", f"{user}@{host}", cmd_build])
print("Done!")
