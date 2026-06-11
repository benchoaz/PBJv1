import os, sys, pty, select, time

def ssh(host, user, password, command):
    ssh_cmd = ["ssh", "-o", "StrictHostKeyChecking=no", "-o", "ServerAliveInterval=30", f"{user}@{host}", command]
    pid, fd = pty.fork()
    if pid == 0:
        os.execvp(ssh_cmd[0], ssh_cmd)
    output, password_sent = [], False
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

def scp(host, user, password, local, remote):
    cmd = ["scp", "-o", "StrictHostKeyChecking=no", local, f"{user}@{host}:{remote}"]
    pid, fd = pty.fork()
    if pid == 0:
        os.execvp(cmd[0], cmd)
    output, password_sent = [], False
    while True:
        r, _, _ = select.select([fd], [], [], 5.0)
        if not r: break
        try:
            data = os.read(fd, 4096)
        except OSError: break
        if not data: break
        decoded = data.decode('utf-8', errors='ignore')
        output.append(decoded)
        if "password:" in decoded.lower() and not password_sent:
            os.write(fd, (password + "\n").encode())
            password_sent = True
    os.waitpid(pid, 0)
    return "".join(output)

h, u, p = "43.134.166.153", "ubuntu", "nebula-57@-ocean"

# Upload package files terbaru
print("Uploading package files...")
scp(h, u, p, '/home/beni/PBJ/survey-service/package.json', '/home/ubuntu/PBJv1/survey-service/package.json')
scp(h, u, p, '/home/beni/PBJ/survey-service/package-lock.json', '/home/ubuntu/PBJv1/survey-service/package-lock.json')

# Force rebuild tanpa cache
print("\n=== Force rebuild --no-cache ===")
print(ssh(h, u, p, "cd PBJv1 && docker compose build --no-cache survey-service"))
print(ssh(h, u, p, "cd PBJv1 && docker compose up -d survey-service"))
time.sleep(5)
print("\n=== Status Akhir ===")
print(ssh(h, u, p, "cd PBJv1 && docker compose ps survey-service"))
print(ssh(h, u, p, "cd PBJv1 && docker compose logs --tail=5 survey-service"))
