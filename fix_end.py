with open('frontend/src/components/ppk/DocPreviewModal.jsx') as f:
    content = f.read()

# Find NIP. {currentUser.nip}
import re

match = re.search(r'NIP\.\s*\{currentUser\.nip\}\s*</div>', content)
if match:
    start_idx = match.end()
    
    new_end = """
 </div>
 </div>
 </div>
 </div>
 </div>,
 document.body
  );
}
"""
    new_content = content[:start_idx] + new_end
    
    with open('frontend/src/components/ppk/DocPreviewModal.jsx', 'w') as f:
        f.write(new_content)
    print("Fixed ending")
else:
    print("Could not find NIP")
