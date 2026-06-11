import os
import sys
import pty
import select

def run_ssh_command(host, user, password, command):
    ssh_cmd = ["ssh", "-o", "StrictHostKeyChecking=no", f"{user}@{host}", command]
    pid, fd = pty.fork()
    if pid == 0:
        os.execvp(ssh_cmd[0], ssh_cmd)
        sys.exit(1)
    else:
        output = []
        password_sent = False
        while True:
            r, w, e = select.select([fd], [], [], 10)
            if not r: break
            try:
                data = os.read(fd, 4096)
            except OSError:
                break
            if not data: break
            decoded = data.decode('utf-8', errors='ignore')
            output.append(decoded)
            if "password:" in decoded.lower() and not password_sent:
                os.write(fd, (password + "\n").encode())
                password_sent = True
        os.waitpid(pid, 0)
        return "".join(output)

if __name__ == "__main__":
    cmd = "ls -la && echo '---' && ls -la PBJv1"
    print(run_ssh_command("43.134.166.153", "ubuntu", "nebula-57@-ocean", cmd))
