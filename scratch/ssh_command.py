import os, sys, pty, select
def run_ssh_command(host, user, password, command):
    ssh_cmd = ["ssh", "-o", "StrictHostKeyChecking=no", f"{user}@{host}", command]
    pid, fd = pty.fork()
    if pid == 0:
        os.execvp(ssh_cmd[0], ssh_cmd)
    output = []
    password_sent = False
    while True:
        r, w, e = select.select([fd], [], [], 2.0)
        if not r: break
        try:
            data = os.read(fd, 4096)
        except OSError: break
        if not data: break
        decoded = data.decode('utf-8', errors='ignore')
        output.append(decoded)
        print(decoded, end='')
        if "password:" in decoded.lower() and not password_sent:
            os.write(fd, (password + "\n").encode())
            password_sent = True
    os.waitpid(pid, 0)
    return "".join(output)

host, user, password = "43.134.166.153", "ubuntu", "nebula-57@-ocean"
cmd = "cd PBJv1 && docker compose build survey-service && docker compose up -d survey-service"
run_ssh_command(host, user, password, cmd)
