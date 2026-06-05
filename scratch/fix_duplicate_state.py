import re

with open("frontend/src/components/ProcurementPanel.jsx", "r") as f:
    code = f.read()

# 1. Remove my injected state
injection_to_remove = """  // Inaproc final documents state
  const [isDocModalOpen, setIsDocModalOpen] = useState(null);
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);
"""
code = code.replace(injection_to_remove, "")

# 2. Remove the old states around line 593
old_states_to_remove = """  // Modal states for manual inaproc documentation
  const [isDocModalOpen, setIsDocModalOpen] = useState(false)
  const [docModalType, setDocModalType] = useState('laptop') // laptop | printer
  const [docModalProduct, setDocModalProduct] = useState(null)"""
code = code.replace(old_states_to_remove, "")

with open("frontend/src/components/ProcurementPanel.jsx", "w") as f:
    f.write(code)

print("Duplicate states removed.")
