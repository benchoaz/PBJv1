import re

with open("frontend/src/components/ProcurementPanel.jsx", "r") as f:
    content = f.read()

# 1. Replace the legacy variables at line 150
old_legacy = """  const isLaptopConsolidated = items.find(i => i.no === 1)?.name?.includes('[Konsolidasi]') || false
  const isPrinterConsolidated = items.find(i => i.no === 2)?.name?.includes('[Konsolidasi]') || false
  const isCurrentProductConsolidated = selectedProductType === 'Laptop' ? isLaptopConsolidated : isPrinterConsolidated"""
new_legacy = """  const isCurrentProductConsolidated = items.find(i => i.name === selectedProductType)?.name?.includes('[Konsolidasi]') || false"""
content = content.replace(old_legacy, new_legacy)

# 2. Rewrite savedDocs state
old_saved_docs = """  const [savedDocs, setSavedDocs] = useState(() => {
    const saved = localStorage.getItem('pbj_pp_documentation')
    const defaults = {
      laptop: { url: '', screenshot: null, negotiatedPrice: '', negotiatedOngkir: '', selectedProduct: null, comparedProducts: null },
      printer: { url: '', screenshot: null, negotiatedPrice: '', negotiatedOngkir: '', selectedProduct: null, comparedProducts: null }
    }
    if (!saved) return defaults
    try {
      const parsed = JSON.parse(saved) || {}
      return {
        laptop: { ...defaults.laptop, ...(parsed.laptop || {}) },
        printer: { ...defaults.printer, ...(parsed.printer || {}) }
      }
    } catch (e) {
      return defaults
    }
  })"""

new_saved_docs = """  const [savedDocs, setSavedDocs] = useState(() => {
    const saved = localStorage.getItem('pbj_pp_documentation')
    if (!saved) return {}
    try {
      return JSON.parse(saved) || {}
    } catch (e) {
      return {}
    }
  })"""
content = content.replace(old_saved_docs, new_saved_docs)

# 3. Fix saveDocumentation function
old_save_docs_func = """  const saveDocumentation = () => {
    if (!url || !screenshot || !negotiatedPrice) {
      alert('Mohon lengkapi URL, Screenshot, dan Harga Negosiasi sebelum menyimpan.')
      return
    }
    
    // Only save comparedProducts if a pembanding exists, otherwise save empty array to clear previous
    const type = selectedProductType.toLowerCase() // 'laptop' | 'printer'
    
    const newDocs = {
      ...savedDocs,
      [type]: {
        url,
        screenshot,
        negotiatedPrice,
        negotiatedOngkir,
        selectedProduct: productsForDocumentation.utama,
        comparedProducts: productsForDocumentation.pembanding ? [productsForDocumentation.pembanding] : []
      }
    }
    
    setSavedDocs(newDocs)
    localStorage.setItem('pbj_pp_documentation', JSON.stringify(newDocs))
    
    // Reset local form states
    setUrl('')
    setScreenshot(null)
    setNegotiatedPrice('')
    setNegotiatedOngkir('0')
    setDocModalOpen(false)
    
    alert(`Dokumentasi e-Katalog untuk ${selectedProductType} berhasil disimpan!`)
  }"""

new_save_docs_func = """  const saveDocumentation = () => {
    if (!url || !screenshot || !negotiatedPrice) {
      alert('Mohon lengkapi URL, Screenshot, dan Harga Negosiasi sebelum menyimpan.')
      return
    }
    
    const type = selectedProductType;
    
    const newDocs = {
      ...savedDocs,
      [type]: {
        url,
        screenshot,
        negotiatedPrice,
        negotiatedOngkir,
        selectedProduct: productsForDocumentation.utama,
        comparedProducts: productsForDocumentation.pembanding ? [productsForDocumentation.pembanding] : []
      }
    }
    
    setSavedDocs(newDocs)
    localStorage.setItem('pbj_pp_documentation', JSON.stringify(newDocs))
    
    setUrl('')
    setScreenshot(null)
    setNegotiatedPrice('')
    setNegotiatedOngkir('0')
    setDocModalOpen(false)
    
    alert(`Dokumentasi e-Katalog untuk ${selectedProductType} berhasil disimpan!`)
  }"""
content = content.replace(old_save_docs_func, new_save_docs_func)


# 4. Fix handleRemoveDoc
old_remove_doc = """  const handleRemoveDoc = (type) => {
    const newDocs = {
      ...savedDocs,
      [type.toLowerCase()]: { url: '', screenshot: null, negotiatedPrice: '', negotiatedOngkir: '', selectedProduct: null, comparedProducts: null }
    }
    setSavedDocs(newDocs)
    localStorage.setItem('pbj_pp_documentation', JSON.stringify(newDocs))
  }"""

new_remove_doc = """  const handleRemoveDoc = (type) => {
    const newDocs = { ...savedDocs }
    delete newDocs[type]
    setSavedDocs(newDocs)
    localStorage.setItem('pbj_pp_documentation', JSON.stringify(newDocs))
  }"""
content = content.replace(old_remove_doc, new_remove_doc)

with open("frontend/src/components/ProcurementPanel.jsx", "w") as f:
    f.write(content)
print("State and logic patched.")
