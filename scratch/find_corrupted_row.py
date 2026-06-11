from ssh_command import run_ssh_command
host = "43.134.166.153"
user = "ubuntu"
password = "nebula-57@-ocean"
cmd = '''cd ~/PBJv1 && docker compose exec db bash -c "
for id in \\$(psql -U postgres -d pbj_db -t -c 'SELECT id FROM projects;'); do
  psql -U postgres -d pbj_db -c \\"SELECT description FROM projects WHERE id = \\$id;\\" > /dev/null 2>&1
  if [ \\$? -ne 0 ]; then
    echo \\"Corrupted ID: \\$id\\"
  fi
done
"'''
print(run_ssh_command(host, user, password, cmd))
