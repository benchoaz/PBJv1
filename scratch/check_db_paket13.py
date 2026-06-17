import sqlite3
import json

db_path = '/home/beni/PBJ/backend/pbj.db'
conn = sqlite3.connect(db_path)
c = conn.cursor()

c.execute("SELECT description FROM projects WHERE id = 13")
row = c.fetchone()
if row:
    desc = json.loads(row[0])
    print("Has surveyData:", "surveyData" in desc)
    if "surveyData" in desc and desc["surveyData"]:
        print("Products length:", len(desc["surveyData"].get("products", [])))
    print("Has comparisons:", "comparisons" in desc)
    print("Has justifications:", "justifications" in desc)
else:
    print("No project found with ID 13")
conn.close()
