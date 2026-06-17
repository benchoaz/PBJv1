import psycopg2
import sys

def main():
    conn = psycopg2.connect("host=127.0.0.1 port=5433 user=postgres password=postgres dbname=pbj_db sslmode=disable")
    cur = conn.cursor()
    
    # Get all tables
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
    """)
    tables = [row[0] for row in cur.fetchall()]
    
    print(f"Searching {len(tables)} tables...")
    for table in tables:
        # Get all text/varchar columns
        cur.execute(f"""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = '{table}' AND (data_type LIKE '%char%' OR data_type = 'text')
        """)
        columns = cur.fetchall()
        for col_name, col_type in columns:
            try:
                cur.execute(f"SELECT COUNT(*) FROM \"{table}\" WHERE CAST(\"{col_name}\" AS TEXT) LIKE '%Jml Satker%'")
                count = cur.fetchone()[0]
                if count > 0:
                    print(f"FOUND in Table: '{table}' | Column: '{col_name}' | Rows: {count}")
                    # Fetch and print some info
                    cur.execute(f"SELECT * FROM \"{table}\" WHERE CAST(\"{col_name}\" AS TEXT) LIKE '%Jml Satker%' LIMIT 1")
                    row = cur.fetchone()
                    print("Example row data:")
                    print(row[:5]) # print first 5 fields
            except Exception as e:
                # ignore errors like missing column or cast errors
                pass
                
    cur.close()
    conn.close()

if __name__ == '__main__':
    main()
