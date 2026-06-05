import json
import subprocess

# Read the original desc before I patched it
with open("desc_26.json", "r") as f:
    desc_str = f.read().strip()

new_desc = desc_str.replace("'", "''")

sql = f"UPDATE projects SET description = '{new_desc}' WHERE id = 26;"
with open("restore.sql", "w") as f:
    f.write(sql)

print("Generated restore.sql")
