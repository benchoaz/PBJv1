import re

with open('frontend/src/components/ppk/DocPreviewModal.jsx') as f:
    content = f.read()

# Find all lines with className containing flex
lines = content.split('\n')
for i, line in enumerate(lines):
    if 'className=' in line and 'flex' in line:
        print(f"Line {i+1}: {line.strip()}")
