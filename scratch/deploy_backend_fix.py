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

print("\nFixing database on VPS...")
db_cmd = "docker exec pbjv1-db-1 psql -U postgres -d pbj_db -c \"ALTER TABLE budget_accounts DROP COLUMN IF EXISTS rka_document_id CASCADE;\""
run_cmd(["ssh", "-o", "StrictHostKeyChecking=no", f"{user}@{host}", db_cmd])

print("\nRebuilding API and Frontend on VPS...")
cmd_build = "cd PBJv1 && docker compose build api frontend && docker compose up -d api frontend"
run_cmd(["ssh", "-o", "StrictHostKeyChecking=no", f"{user}@{host}", cmd_build])
print("\nDone deploying fixes to VPS!")
