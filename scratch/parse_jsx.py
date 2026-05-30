import re

with open("/home/beni/PBJ/frontend/src/components/ProcurementPreparation.jsx", "r") as f:
    lines = f.readlines()

print_sheet_started = False
depth = 0
for idx, line in enumerate(lines):
    line_num = idx + 1
    if 'id="print-sheet"' in line:
        print_sheet_started = True
        depth = 1
        print(f"[{line_num}] START OF #print-sheet, depth={depth}")
        continue
    
    if print_sheet_started:
        # Find all <div or </div in this line
        # This is a simple regex that matches <div and </div>
        opens = re.findall(r'<div\b', line)
        closes = re.findall(r'</div\b', line)
        
        for o in opens:
            depth += 1
            print(f"[{line_num}] +div: depth={depth} line='{line.strip()}'")
        for c in closes:
            depth -= 1
            print(f"[{line_num}] -div: depth={depth} line='{line.strip()}'")
            if depth == 0:
                print(f"[{line_num}] END OF #print-sheet!")
                print_sheet_started = False
                break
