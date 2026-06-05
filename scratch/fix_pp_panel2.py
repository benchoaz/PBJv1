import re

with open("frontend/src/components/ProcurementPanel.jsx", "r") as f:
    code = f.read()

# Remove mockPack
start_idx = code.find("  const mockPack = {")
if start_idx != -1:
    end_idx = code.find("  const [submittedPack, setSubmittedPack]", start_idx)
    if end_idx != -1:
        code = code[:start_idx] + code[end_idx:]

# Remove getPackageItems
start_idx = code.find("  function getPackageItems(pack) {")
if start_idx != -1:
    end_idx = code.find("  const executeAnalysis = async () => {", start_idx)
    if end_idx != -1:
        replacement = """  const items = submittedPack?.items || [];
  const getPackageItems = (pack) => pack?.items || [];
"""
        code = code[:start_idx] + replacement + "\n" + code[end_idx:]
    else:
        # Fallback if executeAnalysis is not found
        end_idx = code.find("  const handleTakeScreenshot", start_idx)
        if end_idx != -1:
            replacement = """  const items = submittedPack?.items || [];
  const getPackageItems = (pack) => pack?.items || [];
"""
            code = code[:start_idx] + replacement + "\n" + code[end_idx:]

with open("frontend/src/components/ProcurementPanel.jsx", "w") as f:
    f.write(code)
