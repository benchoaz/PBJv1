import re

with open("frontend/src/components/ppk/Step3RincianHPS.jsx", "r") as f:
    code = f.read()

# 1. accWords = acc.name.toLowerCase() -> accWords = (acc.name || '').toLowerCase()
code = code.replace("acc.name.toLowerCase()", "(acc.name || '').toLowerCase()")

# 2. t.name.toLowerCase() -> (t.name || '').toLowerCase()
code = code.replace("t.name.toLowerCase()", "(t.name || '').toLowerCase()")

# 3. selectedPack.method.toLowerCase() -> (selectedPack.method || '').toLowerCase()
code = code.replace("selectedPack.method.toLowerCase()", "(selectedPack.method || '').toLowerCase()")

with open("frontend/src/components/ppk/Step3RincianHPS.jsx", "w") as f:
    f.write(code)

print("Safeguarded toLowerCase calls")
