import re

with open("frontend/src/components/ProcurementPanel.jsx", "r") as f:
    code = f.read()

dangling_start = "                </div>\n              </div>\n\n              {/* Negotiated inputs */}"

start_idx = code.find(dangling_start)

if start_idx != -1:
    end_marker = "    </div>\n  )\n}\n\nexport default ProcurementPanel\n"
    code = code[:start_idx] + end_marker
    with open("frontend/src/components/ProcurementPanel.jsx", "w") as f:
        f.write(code)
    print("Dangling JSX removed successfully.")
else:
    print(f"Could not find marker. start_idx={start_idx}")
