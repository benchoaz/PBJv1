import re

with open("frontend/src/components/ppk/Step5Review.jsx", "r") as f:
    code = f.read()

replacement = """
                  // SAVE DIRECTLY TO DB INSTEAD OF LOCALSTORAGE
                  fetch(currentProjectId ? `/api/projects/${currentProjectId}` : '/api/projects', {
                    method: currentProjectId ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      name: submittedData.packName,
                      budget: submittedData.pagu || 0,
                      idSatker: satkerId || '',
                      status: 'Terkirim ke PP',
                      description: JSON.stringify(submittedData)
                    })
                  }).then(res => {
                    if (res.ok) {
                      setStatus('Terkirim ke PP');
                      alert('✅ Dokumen berhasil dikirim ke PP!');
                    } else {
                      alert('Gagal mengirim ke PP');
                    }
                  }).catch(e => {
                    alert('Error: ' + e.message);
                  });
"""

# Replace the localStorage block
start_idx = code.find("                  // ALso save to database with 'Terkirim ke PP'")
if start_idx != -1:
    end_idx = code.find("                  setTimeout(() => handleSimpanPaket(), 100);", start_idx)
    if end_idx != -1:
        end_idx += len("                  setTimeout(() => handleSimpanPaket(), 100);")
        code = code[:start_idx] + replacement + code[end_idx:]
        print("Patched Step5Review.jsx")
    else:
        print("Could not find end boundary")
else:
    print("Could not find start boundary")

# Add missing dependencies to Step5Review
if "currentProjectId" not in code:
    code = code.replace("dppSpecs, setDppSpecs", "dppSpecs, setDppSpecs, currentProjectId, satkerId, setStatus")

with open("frontend/src/components/ppk/Step5Review.jsx", "w") as f:
    f.write(code)
