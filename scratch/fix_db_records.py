import psycopg2

conn = psycopg2.connect("host=localhost dbname=pbj user=postgres password=postgres")
cur = conn.cursor()

# Check what is in the DB
cur.execute("SELECT id, kode_rekening, program, kegiatan, sub_kegiatan FROM budget_accounts;")
rows = cur.fetchall()
print("BEFORE:")
for r in rows:
    print(r)

# Delete Test
cur.execute("DELETE FROM budget_accounts WHERE program = 'Test' OR kegiatan = 'Test' OR sub_kegiatan = 'Test' OR kode_rekening = '12345';")
print("Deleted test rows:", cur.rowcount)

# Check again
cur.execute("SELECT id, kode_rekening, program, kegiatan, sub_kegiatan FROM budget_accounts;")
rows = cur.fetchall()
print("AFTER:")
for r in rows:
    print(r)

conn.commit()
conn.close()
