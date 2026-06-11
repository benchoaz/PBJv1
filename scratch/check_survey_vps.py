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
cmd = "cd PBJv1 && docker compose ps && docker compose logs --tail=20 survey-service"
print(run_cmd(["ssh", "-o", "StrictHostKeyChecking=no", f"{user}@{host}", cmd]))
