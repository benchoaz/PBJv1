import re

with open("frontend/src/components/ProcurementPanel.jsx", "r") as f:
    lines = f.readlines()

# find the line with "Demikian Berita Acara Hasil Pemilihan"
for i in range(len(lines)):
    if "Demikian Berita Acara Hasil Pemilihan" in lines[i]:
        # we expect line i+1 to be </p>
        # we expect line i+2 to be </div>
        if "</p>" in lines[i+1] and "</div>" in lines[i+2]:
            lines.pop(i+2)
            break

with open("frontend/src/components/ProcurementPanel.jsx", "w") as f:
    f.writelines(lines)

print("Extra div removed.")
