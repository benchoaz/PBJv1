import os

files_to_patch = [
    '/home/ubuntu/PBJv1/frontend/src/components/ppk/DocPreviewModal.jsx',
    '/home/ubuntu/PBJv1/frontend/src/components/ppk/Step4TemplateSurat.jsx'
]

for filepath in files_to_patch:
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            code = f.read()
        
        # Patch logic
        code = code.replace("!surveyProduct.link.includes('search?keyword=')", "true")
        code = code.replace("!p.link.includes('/search?keyword=')", "true")
        code = code.replace("!p.link.includes('search?keyword=')", "true")
        
        with open(filepath, 'w') as f:
            f.write(code)
        print(f"Patched {filepath}")

