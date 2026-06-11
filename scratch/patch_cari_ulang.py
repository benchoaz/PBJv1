import os

filepath = '/home/ubuntu/PBJv1/frontend/src/components/ppk/Step3RincianHPS.jsx'
with open(filepath, 'r') as f:
    code = f.read()

old_code = "if (qty > 0 && (hasCustomKeyword || hasCustomTarget)) {"
new_code = "if (qty > 0) {"

code = code.replace(old_code, new_code)

with open(filepath, 'w') as f:
    f.write(code)

print("Cari Ulang validation patched!")
