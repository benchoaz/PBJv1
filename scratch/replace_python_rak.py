import os

files_to_process = [
    '/home/beni/PBJ/dpa-parser/main.py',
    '/home/beni/PBJ/dpa-parser/rak_parser.py',
    '/home/beni/PBJ/dpa-parser/Dockerfile'
]

for filepath in files_to_process:
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Text replacements
    content = content.replace('rka_parser', 'rak_parser')
    content = content.replace('RkaItem', 'RakItem')
    content = content.replace('Rka', 'Rak')
    content = content.replace('rka', 'rak')
    content = content.replace('RKA', 'RAK')
    
    with open(filepath, 'w') as f:
        f.write(content)
        
print("Replaced RKA to RAK in Python parser")
