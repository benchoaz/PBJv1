import re

with open("frontend/src/components/ppk/Step4TemplateSurat.jsx", "r") as f:
    code = f.read()

# Add getPackageItems to destructuring
code = code.replace("tanggalSurat, setTanggalSurat", "tanggalSurat, setTanggalSurat, getPackageItems")

# Remove getPackageItems definition if it exists
start_idx = code.find("  const getPackageItems = () => [];")
if start_idx != -1:
    code = code[:start_idx] + code[start_idx+35:]
    print("Patched Step4TemplateSurat.jsx")
else:
    print("Could not find start boundary")

with open("frontend/src/components/ppk/Step4TemplateSurat.jsx", "w") as f:
    f.write(code)
