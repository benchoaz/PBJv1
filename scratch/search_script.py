
import psycopg2

conn = psycopg2.connect("host=db port=5432 user=postgres password=pbj_secure_prod_pwd dbname=pbj_db")
cur = conn.cursor()

# Get all tables and columns
cur.execute("""
    SELECT table_name, column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND data_type IN ('character', 'character varying', 'text');
""")
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
