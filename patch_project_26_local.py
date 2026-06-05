import json

with open("desc_26.json", "r") as f:
    desc_str = f.read().strip()

desc = json.loads(desc_str)

dpaRincian = desc.get('dpaRincian', {})
key = list(dpaRincian.keys())[0] if dpaRincian else '5.1.02.01.001.00025'

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
        "img": "/screenshots/mock_katalog1.png"
    },
    {
        "id": "prod-2",
        "name": "Kertas HVS (Spesifikasi: Ukuran A4 80 Gram (setara Sinar Dunia))",
        "vendor": "CV Kertas Makmur",
        "price": 58275,
        "link": "https://e-katalog.lkpp.go.id/katalog/produk/detail/2",
        "success": True,
        "img": "/screenshots/mock_katalog2.png"
    }
]

desc['hpsPrices'] = {
    "Amplop Dinas Coklat (Spesifikasi: 15,5 x 25 Cm)": 2000,
    "Kertas HVS (Spesifikasi: Ukuran A4 80 Gram (setara Sinar Dunia))": 75900
}

desc['hpsValue'] = str(20000 + 4554000)

new_desc = json.dumps(desc).replace("'", "''")

sql = f"UPDATE projects SET description = '{new_desc}' WHERE id = 26;"
with open("update.sql", "w") as f:
    f.write(sql)

print("Generated update.sql")
