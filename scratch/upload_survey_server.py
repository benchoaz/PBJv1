import os, sys, pty, select

def run_scp_upload(host, user, password, local_path, remote_path):
    scp_cmd = ["scp", "-o", "StrictHostKeyChecking=no", "-o", "UserKnownHostsFile=/dev/null", local_path, f"{user}@{host}:{remote_path}"]
    pid, fd = pty.fork()
    if pid == 0:
        os.execvp(scp_cmd[0], scp_cmd)
    output, password_sent = [], False
    while True:
        try:
            r, _, _ = select.select([fd], [], [], 0.5)
            if fd in r:
                data = os.read(fd, 1024).decode('utf-8')
                if not data: break
                output.append(data)
                if "assword:" in data and not password_sent:
                    os.write(fd, (password + "\n").encode('utf-8'))
                    password_sent = True
        except OSError: break
    _, status = os.waitpid(pid, 0)
    print("".join(output))
    return os.WEXITSTATUS(status)

host, user, password = '43.134.166.153', 'ubuntu', 'nebula-57@-ocean'
files = [
    ('/home/beni/PBJ/survey-service/server.js', '/home/ubuntu/PBJv1/survey-service/server.js'),
]
for local, remote in files:
    print(f"Uploading {local}...")
    st = run_scp_upload(host, user, password, local, remote)
    print("✅ Sukses" if st == 0 else f"❌ Gagal: {st}")
