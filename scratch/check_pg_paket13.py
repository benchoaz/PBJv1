import psycopg2
import json

try:
    conn = psycopg2.connect("host=127.0.0.1 port=5433 user=postgres password=postgres dbname=pbj_db")
    c = conn.cursor()
    c.execute("SELECT description FROM projects WHERE id = 13")
    row = c.fetchone()
    if row:
        desc = json.loads(row[0])
        print("Has surveyData:", "surveyData" in desc)
        if "surveyData" in desc and desc["surveyData"]:
            print("Products length:", len(desc["surveyData"].get("products", [])))
        print("Has comparisons:", "comparisons" in desc)
        if "comparisons" in desc:
            print("Comparisons size:", len(desc["comparisons"]))
        print("Has justifications:", "justifications" in desc)
        if "justifications" in desc:
            print("Justifications size:", len(desc["justifications"]))
    else:
        print("No project found with ID 13")
    conn.close()
except Exception as e:
    print(e)
