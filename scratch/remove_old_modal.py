import re

with open("frontend/src/components/ProcurementPanel.jsx", "r") as f:
    code = f.read()

# Remove the entire block starting with "Real Inaproc Upload Documentation Modal"
# Up to the next top-level brace or simply using regex
pattern = r'      \{\/\* Real Inaproc Upload Documentation Modal \*\/}.*?      \)}'
new_code = re.sub(pattern, '', code, flags=re.DOTALL)

with open("frontend/src/components/ProcurementPanel.jsx", "w") as f:
    f.write(new_code)

print("Old modal removed.")
