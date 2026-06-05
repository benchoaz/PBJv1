import re

with open("frontend/src/components/ppk/PPKContext.jsx", "r") as f:
    code = f.read()

replacement = """
      const savedData = {
        selectedPack, namaAcara, dpaAccounts, dpaRincian, docSettings, step, status: status,
        surveyData, hpsValue, isHpsExemptSelected, packageMetadata, dppSpecs, techSpecs, hpsPrices, tanggalSurat,
        items: getPackageItems(selectedPack)
      };
"""

start_idx = code.find("      const savedData = {")
if start_idx != -1:
    end_idx = code.find("      };", start_idx) + len("      };")
    code = code[:start_idx] + replacement.strip() + code[end_idx:]

with open("frontend/src/components/ppk/PPKContext.jsx", "w") as f:
    f.write(code)

print("Patched PPKContext.jsx savedData")
