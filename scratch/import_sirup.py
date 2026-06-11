import json
import sys
from ssh_command import run_ssh_command

def escape_sql_string(val):
    if val is None:
        return 'NULL'
    # Escape single quotes
    escaped = val.replace("'", "''")
    return f"'{escaped}'"

def main():
    # Read the scraped JSON
    with open('sirup_data.json', 'r') as f:
        data = json.load(f)
    
    packages = data.get('aaData', [])
    print(f"Loaded {len(packages)} packages from sirup_data.json")
    
    # Start transaction and delete existing bad data
    sql_statements = [
        "BEGIN;",
        "DELETE FROM procurement_packs WHERE satker_id = '67081' AND year = 2026;"
    ]
    
    for pkg in packages:
        no_sirup = pkg[0]
        pack_name = pkg[1]
        budget_allocation = int(pkg[2])
        procurement_method = pkg[3] if pkg[3] and pkg[3] != 'null' else 'Pengadaan Langsung'
        budget_source = pkg[4]
        
        # INSERT statement
        stmt = (
            f"INSERT INTO procurement_packs (no_sirup, pack_name, budget_allocation, "
            f"procurement_method, budget_source, year, satker_id, pack_status, created_at, updated_at) "
            f"VALUES ("
            f"{escape_sql_string(no_sirup)}, "
            f"{escape_sql_string(pack_name)}, "
            f"{budget_allocation}, "
            f"{escape_sql_string(procurement_method)}, "
            f"{escape_sql_string(budget_source)}, "
            f"2026, "
            f"'67081', "
            f"'Live', "
            f"NOW(), "
            f"NOW()"
            f") ON CONFLICT (no_sirup) DO UPDATE SET "
            f"pack_name = EXCLUDED.pack_name, "
            f"budget_allocation = EXCLUDED.budget_allocation, "
            f"procurement_method = EXCLUDED.procurement_method, "
            f"budget_source = EXCLUDED.budget_source, "
            f"pack_status = 'Live', "
            f"updated_at = NOW();"
        )
        sql_statements.append(stmt)
        
    sql_statements.append("COMMIT;")
    
    full_sql = "\n".join(sql_statements)
    
    # Write full_sql to a local temporary file to check or execute
    with open('import_sirup.sql', 'w') as f:
        f.write(full_sql)
    print("Generated SQL written to import_sirup.sql")
    
    # Run the SQL script on the VPS inside the pbj-db container
    # We will pass the SQL script content to psql via docker exec -i
    host = "43.134.166.153"
    user = "ubuntu"
    password = "nebula-57@-ocean"
    
    # We can write the SQL content to a file on VPS or pipe it.
    # Piping is easiest: echo 'SQL' | docker exec -i pbj-db psql ...
    # But full_sql is large (15KB), so let us write it to a file on VPS first or escape it properly.
    # To avoid shell escaping issues, let us write the SQL file to the VPS.
    # We can use ssh to write file: cat << 'EOF' > /tmp/import_sirup.sql
    write_cmd = f"cat << 'EOF' > /tmp/import_sirup.sql\n{full_sql}\nEOF"
    print("Writing SQL file to VPS...")
    run_ssh_command(host, user, password, write_cmd)
    
    # Execute the SQL file on pbj-db
    db_cmd = "docker exec -i pbj-db psql -U postgres -d pbj_db < /tmp/import_sirup.sql"
    print("Executing SQL in pbj-db container...")
    res = run_ssh_command(host, user, password, db_cmd)
    print("=== Execution Result ===")
    print(res)

if __name__ == '__main__':
    main()
