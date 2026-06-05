import re

with open("frontend/src/components/ProcurementPanel.jsx", "r") as f:
    code = f.read()

# 1. Remove the docRealUrl states
code = re.sub(r'  // Form input states for the documentation modal.*?const \[docNegotiatedOngkir, setDocNegotiatedOngkir] = useState\(\'\'\)', '', code, flags=re.DOTALL)

# 2. Remove handleOpenDocModal
code = re.sub(r'  const handleOpenDocModal = \(type, product\) => \{.*?    setIsDocModalOpen\(true\)\n  \}', '', code, flags=re.DOTALL)

# 3. Remove handleScreenshotUpload
code = re.sub(r'  const handleScreenshotUpload = \(e\) => \{.*?    \}\n  \}', '', code, flags=re.DOTALL)

# 4. Remove handleSaveDocumentation
code = re.sub(r'  const handleSaveDocumentation = \(\) => \{.*?    alert\(`🎉 Sukses! Bukti Dokumentasi Inaproc untuk "\$\{docModalProduct\.name\}" berhasil disimpan dengan link & tangkapan layar asli!`\)\n  \}', '', code, flags=re.DOTALL)

with open("frontend/src/components/ProcurementPanel.jsx", "w") as f:
    f.write(code)

print("Old functions and states removed.")
