with open('frontend/src/components/ProcurementPreparation.jsx.backup') as f:
    content = f.read()

import re
# The function goes from "function terbilang" to "return ("" + milyar + " " + sisa).trim();\n  }"
match = re.search(r'function terbilang\(angka\).*?\n  }', content, re.DOTALL)
if match:
    fn_code = match.group(0)
    
    with open('frontend/src/components/ppk/DocPreviewModal.jsx') as f:
        dest_content = f.read()
        
    if 'function terbilang' not in dest_content:
        # inject it right before `export default function DocPreviewModal() {`
        dest_content = dest_content.replace('export default function DocPreviewModal() {', fn_code + '\n\nexport default function DocPreviewModal() {')
        
        with open('frontend/src/components/ppk/DocPreviewModal.jsx', 'w') as f:
            f.write(dest_content)
        print("Injected terbilang")
    else:
        print("Already injected")
else:
    print("Could not find terbilang in backup")
