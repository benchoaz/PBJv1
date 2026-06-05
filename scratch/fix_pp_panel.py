import re

with open("frontend/src/components/ProcurementPanel.jsx", "r") as f:
    code = f.read()

# 1. Remove mockPack completely
start_idx = code.find("  const mockPack = {")
if start_idx != -1:
    end_idx = code.find("  const [submittedPack, setSubmittedPack]", start_idx)
    if end_idx != -1:
        code = code[:start_idx] + code[end_idx:]
        print("Removed mockPack")

# 2. Rewrite submittedPack logic to NOT use localStorage
start_idx = code.find("  const [submittedPack, setSubmittedPack] = useState(() => {")
if start_idx != -1:
    end_idx = code.find("  })", start_idx) + 4
    if end_idx != -1:
        replacement = "  const [submittedPack, setSubmittedPack] = useState(null);"
        code = code[:start_idx] + replacement + code[end_idx:]
        print("Removed localStorage from submittedPack")

# 3. Rewrite the fetch project logic to setSubmittedPack from DB
fetch_idx = code.find("    fetch('/api/projects')")
if fetch_idx != -1:
    end_fetch_idx = code.find("  }, []);", fetch_idx)
    if end_fetch_idx != -1:
        new_fetch = """    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        const projects = Array.isArray(data) ? data : (data?.data || []);
        const incomingPack = projects.find(p => p.status === 'Terkirim ke PP');
        if (incomingPack) {
          let parsedData = {};
          try {
            parsedData = JSON.parse(incomingPack.description || '{}');
          } catch(e) {}
          
          const convertedPack = {
            id: incomingPack.id,
            packName: incomingPack.name || parsedData?.selectedPack?.packName || 'Paket Pengadaan',
            pagu: incomingPack.budget || parsedData?.selectedPack?.pagu || 0,
            mak: parsedData?.selectedPack?.mak || '',
            noSirup: parsedData?.selectedPack?.noSirup || '',
            volume: parsedData?.packageMetadata?.volume || '1 Paket',
            spesifikasi: parsedData?.packageMetadata?.spesifikasi || '',
            hpsValue: parsedData?.hpsValue || incomingPack.budget || '',
            techSpecs: parsedData?.techSpecs || '',
            dpaName: parsedData?.dpaName || 'DPA_Document.pdf',
            senderName: parsedData?.currentUser?.name || incomingPack.created_by || 'PPK',
            senderNip: parsedData?.currentUser?.nip || '',
            senderDepartment: parsedData?.currentUser?.department || 'Instansi Terkait',
            sentDate: new Date(incomingPack.updated_at || incomingPack.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
            items: parsedData?.items || [] // USE ITEMS FROM PPK
          };
          setSubmittedPack(convertedPack);
        } else {
          setSubmittedPack(null);
        }
      })
      .catch(e => console.error('Error fetching projects:', e));"""
        code = code[:fetch_idx] + new_fetch + code[end_fetch_idx:]
        print("Updated fetch projects logic")

# 4. Remove getPackageItems from ProcurementPanel completely
start_idx = code.find("  function getPackageItems(pack) {")
if start_idx != -1:
    end_idx = code.find("  const handleTakeScreenshot = async () => {", start_idx)
    if end_idx != -1:
        replacement = """  const items = submittedPack?.items || [];
  const getPackageItems = (pack) => pack?.items || [];
"""
        code = code[:start_idx] + replacement + "\n" + code[end_idx:]
        print("Removed getPackageItems fake generator")

with open("frontend/src/components/ProcurementPanel.jsx", "w") as f:
    f.write(code)
