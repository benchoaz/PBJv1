import re

with open("frontend/src/components/ppk/Step5Review.jsx", "r") as f:
    code = f.read()

# Fix destructuring
if "currentProjectId" not in code[:code.find(" = usePPK();")]:
    code = code.replace("dppSpecs, setDppSpecs", "dppSpecs, setDppSpecs, currentProjectId, satkerId")

# Remove setStatus
code = code.replace("setStatus('Terkirim ke PP');", "console.log('Terkirim');")

with open("frontend/src/components/ppk/Step5Review.jsx", "w") as f:
    f.write(code)

print("Patched Step5Review.jsx destructuring")
