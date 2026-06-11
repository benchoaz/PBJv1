import os, sys, pty, select, time

def ssh(host, user, password, command):
    ssh_cmd = ["ssh", "-o", "StrictHostKeyChecking=no", "-o", "ConnectTimeout=10", f"{user}@{host}", command]
    pid, fd = pty.fork()
    if pid == 0:
        os.execvp(ssh_cmd[0], ssh_cmd)
    output = []
    password_sent = False
    while True:
        r, _, _ = select.select([fd], [], [], 3.0)
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
print("=== Docker Compose PS ===")
print(ssh(h, u, p, "cd PBJv1 && docker compose ps"))
print("=== Survey-Service Last 5 Logs ===")
print(ssh(h, u, p, "cd PBJv1 && docker compose logs --tail=5 survey-service"))
