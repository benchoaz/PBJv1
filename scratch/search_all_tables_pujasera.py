from ssh_command import run_ssh_command

host = "43.134.166.153"
user = "ubuntu"
password = "nebula-57@-ocean"

# Python script to search all tables in postgres for the word 'PUJASERA'
search_script = """
import psycopg2

conn = psycopg2.connect("host=db port=5432 user=postgres password=pbj_secure_prod_pwd dbname=pbj_db")
cur = conn.cursor()

# Get all tables and columns
cur.execute(\"\"\"
    SELECT table_name, column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND data_type IN ('character', 'character varying', 'text');
\"\"\")
columns = cur.fetchall()

for table, col in columns:
    try:
        # Check if table has any row matching PUJASERA
        cur.execute(f"SELECT COUNT(*) FROM {table} WHERE {col}::text ILIKE '%PUJASERA%';")
        count = cur.fetchone()[0]
        if count > 0:
            print(f"Table {table}, Column {col} has {count} matches:")
            cur.execute(f"SELECT * FROM {table} WHERE {col}::text ILIKE '%PUJASERA%' LIMIT 5;")
            rows = cur.fetchall()
            for r in rows:
                print(r)
            print("-" * 50)
    except Exception as e:
        conn.rollback()
        # print(f"Error searching {table}.{col}: {e}")

cur.close()
conn.close()
"""

# Run it on the api container (which has python/psycopg2) or db container if python is available
# Since api container runs Go, let's run it by executing python on the scraper container or dpa-parser container
# Let's run it inside the scraper container on the VPS!
# Write search script to a file on host first, then copy to VPS, then copy into container
with open('/home/beni/PBJ/scratch/search_script.py', 'w') as f:
    f.write(search_script)

from sync_and_restart import run_scp
res_scp = run_scp(host, user, password, '/home/beni/PBJ/scratch/search_script.py', 'PBJv1/search_script.py')
print("SCP:", res_scp)

# Copy it into container and execute it
exec_cmd = 'cd ~/PBJv1 && docker compose cp search_script.py dpa-parser:/tmp/search_script.py && docker compose exec dpa-parser python /tmp/search_script.py'
print("Running search script on VPS...")
res = run_ssh_command(host, user, password, exec_cmd)
print("=== RESULT ===")
print(res)
