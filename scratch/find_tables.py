import re
import sys

def analyze_file(filepath):
    print(f"\nAnalyzing {filepath}...")
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find all table tags
    tables = [m.start() for m in re.finditer(r'<table', content)]
    print(f"Found {len(tables)} tables.")
    
    # We want to see if the div wrapping the table has overflow-x-auto
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if '<table' in line:
            print(f"\n--- Table at line {i+1} ---")
            # Print 3 lines before and 2 lines after
            start = max(0, i-3)
            end = min(len(lines), i+3)
            for j in range(start, end):
                print(f"{j+1}: {lines[j]}")

analyze_file('/home/beni/PBJ/frontend/src/components/ppk/Step3RincianHPS.jsx')
analyze_file('/home/beni/PBJ/frontend/src/components/ProcurementPanel.jsx')
