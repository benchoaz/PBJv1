import re

with open("frontend/src/components/ProcurementPanel.jsx", "r") as f:
    content = f.read()

# Replace the dummy mockCatalogProducts with empty
content = re.sub(r'const mockCatalogProducts = \{.*?\n  \}\n\n', '', content, flags=re.DOTALL)
content = re.sub(r'const getCommodityNames = \(pack\) => \{.*?\n  \}\n\n', '', content, flags=re.DOTALL)
content = re.sub(r'const commodities = getCommodityNames\(submittedPack\)\n\n', '', content, flags=re.DOTALL)
content = re.sub(r'const getCatalogProducts = \(type = selectedProductType\) => \{.*?\n  \}\n\n', '', content, flags=re.DOTALL)

with open("frontend/src/components/ProcurementPanel.jsx", "w") as f:
    f.write(content)
