import os

files_to_process = [
    '/home/beni/PBJ/frontend/src/components/budget/RAKDashboard.jsx',
    '/home/beni/PBJ/frontend/src/components/budget/RAKUploadModal.jsx',
    '/home/beni/PBJ/frontend/src/App.jsx',
    '/home/beni/PBJ/frontend/src/components/ProcurementPanel.jsx',
    '/home/beni/PBJ/frontend/src/components/Header.jsx'
]

for filepath in files_to_process:
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Text replacements
    content = content.replace('Rencana Kerja dan Anggaran (RKA) Kas', 'Rencana Anggaran Kas (RAK)')
    content = content.replace('RKA', 'RAK')
    content = content.replace('rka', 'rak')
    
    with open(filepath, 'w') as f:
        f.write(content)
        
print("Replaced RKA to RAK in frontend components")
