import json
import psycopg2

conn = psycopg2.connect("dbname=pbj_db user=postgres host=127.0.0.1 port=5432 sslmode=disable")
cur = conn.cursor()

cur.execute("SELECT description FROM projects WHERE id = 26")
row = cur.fetchone()
if not row:
    print("Project not found")
    exit(1)

desc = json.loads(row[0])

# Get the updated DPA Rincian
dpaRincian = desc.get('dpaRincian', {})
key = list(dpaRincian.keys())[0] if dpaRincian else None

if not key:
    print("No DPA Rincian found")
    exit(1)

items = dpaRincian[key]

# Update dppSpecs to match items exactly
# dppSpecs in JS expects { no, name, qty, unit, price, id } etc
# Let's map it:
dppSpecs = []
for idx, item in enumerate(items):
    dppSpecs.append({
        "id": f"item-{idx}",
        "no": item["no"],
        "name": item["nama"],
        "qty": item["volume"],
        "unit": item["satuan"],
        "price": item["harga_satuan"]
    })

desc['dppSpecs'] = dppSpecs

cur.execute("UPDATE projects SET description = %s WHERE id = 26", (json.dumps(desc),))
conn.commit()
print("Updated dppSpecs successfully")
