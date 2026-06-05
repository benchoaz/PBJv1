import re

with open("frontend/src/components/ProcurementPanel.jsx", "r") as f:
    content = f.read()

# 1. Add import Scale
import_scale = "import { Scale } from 'lucide-react'\n"
if "import { Scale }" not in content:
    content = content.replace("import { useState, useEffect } from 'react'", "import { useState, useEffect } from 'react'\n" + import_scale)

# 2. Update the button
old_button = """                                  className="w-full text-[9px] font-bold bg-slate-800 hover:bg-slate-900 text-white py-1 rounded shadow-sm flex items-center justify-center gap-1 transition-colors"
                                >
                                  <span>⚖️</span> Cari Pembanding"""

new_button = """                                  className="w-full text-[9px] font-bold bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 py-1 rounded shadow-sm flex items-center justify-center gap-1 transition-colors"
                                >
                                  <Scale className="w-3 h-3" /> Cari Pembanding"""
                                  
content = content.replace(old_button, new_button)

# 3. Update the Modal Header (Optional, but let's do it to be consistent)
old_modal_header = """                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <span>⚖️</span> Matriks Komparasi Pejabat Pengadaan
                </h3>"""
new_modal_header = """                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <Scale className="w-5 h-5 text-indigo-600" /> Matriks Komparasi Pejabat Pengadaan
                </h3>"""

content = content.replace(old_modal_header, new_modal_header)

with open("frontend/src/components/ProcurementPanel.jsx", "w") as f:
    f.write(content)

print("Icon patched!")
