import re

with open("frontend/src/components/ppk/PPKContext.jsx", "r") as f:
    code = f.read()

code = code.replace("pack.packName.toLowerCase()", "(pack.packName || '').toLowerCase()")
code = code.replace("acc.nama_rekening.toLowerCase()", "(acc.nama_rekening || '').toLowerCase()")

with open("frontend/src/components/ppk/PPKContext.jsx", "w") as f:
    f.write(code)

print("Safeguarded toLowerCase calls in PPKContext")
