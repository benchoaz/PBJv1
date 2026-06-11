import os, sys, pty, select

def ssh(host, user, password, command):
    ssh_cmd = ["ssh", "-o", "StrictHostKeyChecking=no", "-o", "ServerAliveInterval=30", f"{user}@{host}", command]
    pid, fd = pty.fork()
    if pid == 0:
        os.execvp(ssh_cmd[0], ssh_cmd)
    output = []
    password_sent = False
    while True:
        r, _, _ = select.select([fd], [], [], 5.0)
        if not r: break
        try:
            data = os.read(fd, 4096)
        except OSError: break
        if not data: break
        decoded = data.decode('utf-8', errors='ignore')
        output.append(decoded)
        print(decoded, end='', flush=True)
        if "password:" in decoded.lower() and not password_sent:
            os.write(fd, (password + "\n").encode())
            password_sent = True
    os.waitpid(pid, 0)
    return "".join(output)

h, u, p = "43.134.166.153", "ubuntu", "nebula-57@-ocean"
# Force npm install di container langsung (lebih cepat dari rebuild)
print("=== Menjalankan npm install di container ===")
cmd = "docker exec pbjv1-survey-service-1 npm install --prefix /app 2>&1 || docker run --rm -v /home/ubuntu/PBJv1/survey-service:/app -w /app node:20-alpine sh -c 'npm install && cp -r node_modules /app/node_modules_new'"
print(ssh(h, u, p, cmd))

print("=== Restarting survey-service ===")
print(ssh(h, u, p, "cd PBJv1 && docker compose restart survey-service"))
print("=== Final Status ===")
print(ssh(h, u, p, "cd PBJv1 && docker compose logs --tail=5 survey-service"))
