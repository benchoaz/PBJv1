import subprocess
import re

def check_build():
    result = subprocess.run(['npx', 'esbuild', 'frontend/src/components/ppk/DocPreviewModal.jsx'], capture_output=True, text=True)
    return result.returncode == 0

with open('frontend/src/components/ppk/DocPreviewModal.jsx') as f:
    original = f.read()

# Base logic: find the block of ending divs and try reducing them
end_pattern = re.compile(r'(</div>\s*)+,\s*document\.body')

match = end_pattern.search(original)
if match:
    # Try different counts of </div>
    for i in range(1, 10):
        test_content = original[:match.start()] + ('</div>\n' * i) + '    document.body\n  );\n}\n'
        with open('frontend/src/components/ppk/DocPreviewModal.jsx', 'w') as f:
            f.write(test_content)
        if check_build():
            print(f"Fixed! Required {i} closing divs.")
            exit(0)
    
    print("Could not find a valid number of closing divs!")
    with open('frontend/src/components/ppk/DocPreviewModal.jsx', 'w') as f:
        f.write(original)
else:
    print("Pattern not found!")
