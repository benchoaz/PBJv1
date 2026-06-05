import re

with open("frontend/src/components/ProcurementPanel.jsx", "r") as f:
    code = f.read()

# ─── FIX 1: Restore proper null render for D.3 Temuan Negosiasi (form view) ──
# The whole D.3 block from "D.3 Dihapus" comment to the closing </div> that ended it
# We need to find the start marker we just inserted and replace with just null

# Find and remove the D.3 Temuan block entirely (form view)
# The block starts with "/* D.3 Dihapus" and then has broken JSX 
# Let's find the proper region to delete

old_d3_form = """{/* D.3 Dihapus — PP masih dalam proses negosiasi */}
                {"""

# Find what came right after it up to the closing </div>
# Strategy: find the broken block and remove it entirely
# The correct target is everything from the comment to the next section comment

# Build the replacement: just a comment, no JSX
new_d3_form = """{/* D.3 Dihapus — PP masih dalam proses negosiasi, akan diisi setelah nego selesai */}"""

# We need to find and replace the broken block 
# which currently starts with {/* D.3 Dihapus */ { <p>... and ends with </div> before E.
# The full broken block (lines 1663-1718 area) was replaced with broken { open 
# Let's reconstruct: find old pattern and cut it

# Pattern to find - the broken fragment that starts from our comment 
import re

# Find the broken block
pattern = r'\{/\* D\.3 Dihapus.*?PP masih dalam proses negosiasi \*/\}\s*\{.*?(?=\{/\* ═══════════════════|{/\*.*?SEKSI E|<div className="font-bold text-\[11px\] uppercase.*?E\. Dokumentasi)'

match = re.search(pattern, code, re.DOTALL)
if match:
    print(f"Found D3 form block at {match.start()}-{match.end()}")
    code = code[:match.start()] + '{/* D.3 Temuan Negosiasi — dihapus karena PP masih dalam proses negosiasi */}\n                ' + code[match.end():]
    print("✅ D3 form block removed")
else:
    print("❌ D3 form block pattern not found, trying manual fix")
    # Manual: find everything between the two markers
    start_marker = '{/* D.3 Dihapus — PP masih dalam proses negosiasi */}'
    end_marker = '{/* ═══════════════════════════════════════════════════════════ */}\n                {/* SEKSI E'
    
    idx_start = code.find(start_marker)
    idx_end = code.find(end_marker)
    if idx_start != -1 and idx_end != -1:
        code = code[:idx_start] + '{/* D.3 dihapus — tahap negosiasi belum selesai */}\n                ' + code[idx_end:]
        print(f"✅ Manual D3 removal done (chars {idx_start}-{idx_end})")
    else:
        print(f"  start={idx_start}, end={idx_end}")

# ─── FIX 2: Remove Asisten Lampiran block ─────────────────────────────────────
# Find the broken {  that we left and remove it properly
asisten_start = '{/* Asisten Lampiran dihapus — tombol Cari Ulang tidak diperlukan di BAHP */}\n                {'
asisten_end_marker = '{/* PBJ Loading Indicator */}'
asisten_end_close = '</div>\n\n                <div className="font-bold text-[11px] uppercase tracking-wide border-b border-slate-300 pb-1 mt-6 font-sans text-indigo-850 break-before-page">C.'

idx_as_start = code.find(asisten_start)
idx_as_end = code.find(asisten_end_close)

if idx_as_start != -1 and idx_as_end != -1:
    # Find the end of the loading indicator block closing div
    # Remove everything from asisten_start to (but not including) "C. Lampiran"
    code = code[:idx_as_start] + '{/* Asisten Lampiran e-Katalog dihapus — tidak diperlukan di BAHP */}\n                ' + code[idx_as_end:]
    print(f"✅ Asisten Lampiran block removed")
else:
    print(f"❌ Asisten block: start={idx_as_start}, end={idx_as_end}")
    # Try simpler approach  
    alt_start = '{/* Asisten Lampiran dihapus'
    idx_as_start2 = code.find(alt_start)
    print(f"  Alt start: {idx_as_start2}")

with open("frontend/src/components/ProcurementPanel.jsx", "w") as f:
    f.write(code)

print("Done.")
