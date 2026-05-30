import re

with open('frontend/src/components/ProcurementPreparation.jsx', 'r') as f:
    content = f.read()

original = content

# Fix: selectedPack.packName -> selectedPack?.packName (for display/render contexts)
# But keep selectedPack.packName || '' patterns as they already have guards

# Fix patterns where selectedPack.packName is used without optional chaining
# Pattern 1: selectedPack.packName) used inside getPacketCategory calls in JSX
content = re.sub(r'getPacketCategory\(selectedPack\.packName\)', 'getPacketCategory(selectedPack?.packName || \'\')', content)

# Pattern 2: {selectedPack.packName} direct renders  
content = re.sub(r'\{selectedPack\.packName\}', '{selectedPack?.packName}', content)

# Pattern 3: name: selectedPack.packName, (in objects) 
content = re.sub(r'name: selectedPack\.packName,', 'name: selectedPack?.packName,', content)

# Pattern 4: uraian: selectedPack.packName
content = re.sub(r'uraian: selectedPack\.packName', 'uraian: selectedPack?.packName', content)

# Pattern 5: title={selectedPack.packName}
content = re.sub(r'title=\{selectedPack\.packName\}', 'title={selectedPack?.packName}', content)

# Fix pack.packName used in map callbacks - only lines we haven't fixed
# {pack.packName} in JSX render
content = re.sub(r'\{pack\.packName\}', '{pack?.packName}', content)
content = re.sub(r'title=\{pack\.packName\}', 'title={pack?.packName}', content)

# linked.packName in JSX 
content = re.sub(r'\{linked\.packName\}', '{linked?.packName}', content)

# autoMatch.packName in JSX
content = re.sub(r'\{autoMatch\.packName\}', '{autoMatch?.packName}', content)

# detailModalPack.packName in JSX
content = re.sub(r'\{detailModalPack\.packName\}', '{detailModalPack?.packName}', content)

# p.packName in JSX render (non-filter contexts)
content = re.sub(r'\{p\.packName\}', '{p?.packName}', content)

# PEKERJAAN: "{selectedPack.packName}"  - in template strings
content = content.replace('PEKERJAAN: "{selectedPack.packName}"', 'PEKERJAAN: "{selectedPack?.packName}"')

changed = (content != original)
print(f"Changed: {changed}")

with open('frontend/src/components/ProcurementPreparation.jsx', 'w') as f:
    f.write(content)

# Verify remaining unsafe direct accesses
lines = content.split('\n')
for i, line in enumerate(lines, 1):
    if 'selectedPack.packName' in line and "|| ''" not in line and 'optional' not in line:
        print(f"Line {i}: {line.strip()[:100]}")

