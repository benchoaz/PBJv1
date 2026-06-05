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

# Find the active DPA account key
dpaRincian = desc.get('dpaRincian', {})
# Usually there is only 1 key or we can just pick the first one
key = list(dpaRincian.keys())[0] if dpaRincian else '5.1.02.01.001.00025'

# Update items
dpaRincian[key] = [
    {
        "no": 1,
        "nama": "Amplop Dinas Coklat (Spesifikasi: 15,5 x 25 Cm)",
        "volume": 10,
        "satuan": "Box",
        "harga_satuan": 2000,
        "harga_total": 20000,
        "isDefault": False
    },
    {
        "no": 2,
        "nama": "Kertas HVS (Spesifikasi: Ukuran A4 80 Gram (setara Sinar Dunia))",
        "volume": 60,
        "satuan": "Rim",
        "harga_satuan": 75900,
        "harga_total": 4554000,
        "isDefault": False
    }
]

desc['dpaRincian'] = dpaRincian

# Update surveyData
if 'surveyData' not in desc or not desc['surveyData']:
    desc['surveyData'] = {"products": []}

desc['surveyData']['products'] = [
    {
        "id": "prod-1",
        "name": "Amplop Dinas Coklat (Spesifikasi: 15,5 x 25 Cm)",
        "vendor": "PT Sinar Harapan",
        "price": 2500,
        "link": "https://e-katalog.lkpp.go.id/katalog/produk/detail/1",
        "success": True,
        "img": "/images/mock_katalog1.png"
    },
    {
        "id": "prod-2",
        "name": "Kertas HVS (Spesifikasi: Ukuran A4 80 Gram (setara Sinar Dunia))",
        "vendor": "CV Kertas Makmur",
        "price": 58275,
        "link": "https://e-katalog.lkpp.go.id/katalog/produk/detail/2",
        "success": True,
        "img": "/images/mock_katalog2.png"
    }
]

# Update hpsPrices (if HPS exempt is false, it uses hpsPrices for unit prices)
desc['hpsPrices'] = {
    "Amplop Dinas Coklat (Spesifikasi: 15,5 x 25 Cm)": 2000,
    "Kertas HVS (Spesifikasi: Ukuran A4 80 Gram (setara Sinar Dunia))": 75900
}

desc['hpsValue'] = str(20000 + 4554000)

cur.execute("UPDATE projects SET description = %s WHERE id = 26", (json.dumps(desc),))
conn.commit()
print("Updated successfully")
