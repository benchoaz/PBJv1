from ssh_command import run_ssh_command
host = "43.134.166.153"
user = "ubuntu"
password = "nebula-57@-ocean"
cmd = 'cd ~/PBJv1 && docker compose exec db psql -U postgres -d pbj_db -c "SELECT id, name, COALESCE(description, \'\') as description, budget, ministry, province, id_satker, COALESCE(source_url, \'\') as source_url, status, COALESCE(start_date::text, \'\') as start_date, COALESCE(end_date::text, \'\') as end_date, created_at, updated_at FROM projects WHERE 1=1 AND id_satker IN (\'67081\') ORDER BY created_at DESC LIMIT 20 OFFSET 0;"'
print(run_ssh_command(host, user, password, cmd))
