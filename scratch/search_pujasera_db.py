import json
from ssh_command import run_ssh_command

host = "43.134.166.153"
user = "ubuntu"
password = "nebula-57@-ocean"

# We will execute a python script inside the db/api container or write a SQL query to search row by row
# Since we have psql, we can run a PL/pgSQL block or query row by row using a python loop over project IDs.
# Let's get the list of project IDs first.
get_ids_cmd = 'cd ~/PBJv1 && docker compose exec db psql -U postgres -d pbj_db -t -c "SELECT id FROM projects ORDER BY id DESC;"'
print("Getting project IDs...")
ids_res = run_ssh_command(host, user, password, get_ids_cmd)
ids = [int(x.strip()) for x in ids_res.split('\n') if x.strip().isdigit()]
print("Project IDs:", ids)

for pid in ids:
    # Query description for each project id and catch errors
    query_cmd = f'cd ~/PBJv1 && docker compose exec db psql -U postgres -d pbj_db -t -c "SELECT description FROM projects WHERE id={pid};"'
    res = run_ssh_command(host, user, password, query_cmd)
    if "ERROR" in res or "missing chunk" in res:
        print(f"Project ID {pid}: Corrupted TOAST block (error)")
    else:
        if "PUJASERA99" in res or "pujasera99" in res:
            print(f"Project ID {pid} contains PUJASERA99!")
            # Print a snippet
            print(res[:500])
