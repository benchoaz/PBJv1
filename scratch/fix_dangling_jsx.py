import re

with open("frontend/src/components/ProcurementPanel.jsx", "r") as f:
    code = f.read()

# The dangling part starts with:
dangling_start = "                </div>\n              </div>\n\n              {/* Negotiated inputs */}"
end_marker = "    </div>\n  )\n}\n\nexport default ProcurementPanel"

start_idx = code.find(dangling_start)
end_idx = code.find(end_marker)

if start_idx != -1 and end_idx != -1:
    code = code[:start_idx] + end_marker
    with open("frontend/src/components/ProcurementPanel.jsx", "w") as f:
        f.write(code)
    print("Dangling JSX removed successfully.")
else:
    print(f"Could not find markers. start_idx={start_idx}, end_idx={end_idx}")
