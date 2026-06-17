import os, sys, pty, select, time

def run_ssh_command(host, user, password, command):
    ssh_cmd = ["ssh", "-o", "StrictHostKeyChecking=no", "-o", "ServerAliveInterval=30", f"{user}@{host}", command]
    pid, fd = pty.fork()
    if pid == 0:
        os.execvp(ssh_cmd[0], ssh_cmd)
    output = []
    password_sent = False
    while True:
        r, w, e = select.select([fd], [], [], 5.0)
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

print("Triggering quick deploy on background...")
cmd = "nohup sh -c 'cd ~/PBJv1 && git fetch origin main && git reset --hard origin/main && docker compose build --no-cache api frontend dpa-parser && docker compose up -d --force-recreate api frontend dpa-parser' > /home/ubuntu/rebuild.log 2>&1 &"
run_ssh_command(h, u, p, cmd)
print("Deploy script launched on VPS background!")
