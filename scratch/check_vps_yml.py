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
                data = os.read(fd, 4096).decode('utf-8', errors='ignore')
                if not data: break
                output.append(data)
                print(data, end='')
                if "assword:" in data.lower() and not password_sent:
                    os.write(fd, ('nebula-57@-ocean\n').encode('utf-8'))
                    password_sent = True
        except OSError: break
    _, status = os.waitpid(pid, 0)
    return os.WEXITSTATUS(status)

host, user = '43.134.166.153', 'ubuntu'
run_cmd(["ssh", "-o", "StrictHostKeyChecking=no", f"{user}@{host}", "cat /home/ubuntu/PBJv1/docker-compose.yml"])
