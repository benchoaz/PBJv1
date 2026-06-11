import psycopg2

conn = psycopg2.connect("dbname='pbjsystem' user='postgres' host='localhost' password='password'")
cur = conn.cursor()
cur.execute("DELETE FROM budget_accounts;")
conn.commit()
print("Deleted all budget_accounts")
cur.close()
conn.close()
