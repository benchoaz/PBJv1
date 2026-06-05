import re

with open("frontend/src/components/ppk/Step3RincianHPS.jsx", "r") as f:
    code = f.read()

# Add getPackageItems to destructuring
code = code.replace("resetAll, currentUser, dppSpecs, setDppSpecs", "resetAll, currentUser, dppSpecs, setDppSpecs, getPackageItems")

# Remove getPackageItems definition
start_idx = code.find("  const getPackageItems = (pack) => {")
if start_idx != -1:
    end_idx = code.find("  const autoCleanKeyword = (name) => {", start_idx)
    if end_idx != -1:
        code = code[:start_idx] + code[end_idx:]
        print("Patched Step3RincianHPS.jsx")
    else:
        print("Could not find end boundary")
else:
    print("Could not find start boundary")

with open("frontend/src/components/ppk/Step3RincianHPS.jsx", "w") as f:
    f.write(code)
