import re

with open("frontend/src/components/ppk/PPKContext.jsx", "r") as f:
    code = f.read()

replacement = """        description: JSON.stringify({
          selectedPack,
          namaAcara: namaAcara?.trim() || '',
          dpaAccounts,
          dpaRincian,
          docSettings,
          step,
          status: 'Draft',
          surveyData,
          hpsValue,
          isHpsExemptSelected,
          packageMetadata,
          dppSpecs,
          techSpecs,
          hpsPrices,
          tanggalSurat,
          items: getPackageItems(selectedPack)
        })
"""

# Find the start of description: JSON.stringify
start_idx = code.find("        description: JSON.stringify({")
if start_idx != -1:
    end_idx = code.find("        })", start_idx) + len("        })")
    code = code[:start_idx] + replacement.strip() + code[end_idx:]
else:
    print("Could not find start boundary")

with open("frontend/src/components/ppk/PPKContext.jsx", "w") as f:
    f.write(code)

print("Patched PPKContext.jsx autosave payload")
