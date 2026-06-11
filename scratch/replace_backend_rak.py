import os

files_to_process = [
    '/home/beni/PBJ/backend/internal/models/budget.go',
    '/home/beni/PBJ/backend/internal/handlers/budget_handler.go',
    '/home/beni/PBJ/backend/internal/handlers/dpa.go',
    '/home/beni/PBJ/backend/cmd/server/main.go'
]

for filepath in files_to_process:
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Text replacements
    content = content.replace('RkaDocument', 'RakDocument')
    content = content.replace('RkaDocumentID', 'RakDocumentID')
    content = content.replace('rka_document_id', 'rak_document_id')
    content = content.replace('rka_documents', 'rak_documents')
    content = content.replace('IsRkaLinked', 'IsRakLinked')
    content = content.replace('is_rka_linked', 'is_rak_linked')
    content = content.replace('RkaPaguDiff', 'RakPaguDiff')
    content = content.replace('rka_pagu_diff', 'rak_pagu_diff')
    content = content.replace('ParseRka', 'ParseRak')
    content = content.replace('SaveRka', 'SaveRak')
    content = content.replace('GetRka', 'GetRak')
    content = content.replace('DeleteRka', 'DeleteRak')
    content = content.replace('/api/rka', '/api/rak')
    content = content.replace('/parse-rka', '/parse-rak')
    
    with open(filepath, 'w') as f:
        f.write(content)
        
print("Replaced RKA to RAK in backend code")
