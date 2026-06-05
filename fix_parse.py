with open('frontend/src/components/ProcurementPreparation.jsx.backup') as f:
    content = f.read()

import re
match = re.search(r'const parseSmartColons.*?\n}', content, re.DOTALL)
if match:
    parse_fn = match.group(0)
    
    with open('frontend/src/components/ppk/DocPreviewModal.jsx') as f:
        dest_content = f.read()
        
    if 'const parseSmartColons' not in dest_content:
        # inject it right before `export default function DocPreviewModal() {`
        dest_content = dest_content.replace('export default function DocPreviewModal() {', parse_fn + '\n\nexport default function DocPreviewModal() {')
        
        with open('frontend/src/components/ppk/DocPreviewModal.jsx', 'w') as f:
            f.write(dest_content)
        print("Injected parseSmartColons")
    else:
        print("Already injected")
else:
    print("Could not find parseSmartColons in backup")
