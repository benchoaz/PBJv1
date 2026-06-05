import re

with open('frontend/src/components/ProcurementPreparation.jsx.backup', 'r') as f:
    backup_lines = f.readlines()

# Find the start of the missing block in backup
# It starts at: <div><label className="block text-[10px] font-semibold text-slate-500 mb-2 uppercase tracking-wider">Formulir Spesifikasi Teknis Pekerjaan (KAK)</label>
start_idx = -1
for i, line in enumerate(backup_lines):
    if "Formulir Spesifikasi Teknis Pekerjaan (KAK)" in line:
        start_idx = i - 1 # Include the <div>
        break

# The end of the block in backup is the end of the Step 3 div
end_idx = -1
for i in range(start_idx, len(backup_lines)):
    if "Kirim DPP ke PP" in backup_lines[i]:
        # Include a few more lines to close the div and fragments
        end_idx = i + 5
        break

missing_code = backup_lines[start_idx:end_idx]

# Read current Step3RincianHPS.jsx
with open('frontend/src/components/ppk/Step3RincianHPS.jsx', 'r') as f:
    current_lines = f.readlines()

# Find the same start in current code
current_start_idx = -1
for i, line in enumerate(current_lines):
    if "Formulir Spesifikasi Teknis Pekerjaan (KAK)" in line:
        current_start_idx = i - 1
        break

# Keep everything before it, and append the missing code from backup
new_lines = current_lines[:current_start_idx] + missing_code

# Make sure we declare isOverBudget at the top of the component
is_over_budget_line = "  const isOverBudget = !isHpsExemptSelected && selectedPack?.pagu > 0 && parseInt(hpsValue || 0) > selectedPack.pagu;\n"

# Insert isOverBudget after the useStore destructuring block
insert_idx = -1
for i, line in enumerate(new_lines):
    if "const cancelSurvey" in line:
        insert_idx = i
        break

if insert_idx != -1:
    new_lines.insert(insert_idx, is_over_budget_line)

with open('frontend/src/components/ppk/Step3RincianHPS.jsx', 'w') as f:
    f.writelines(new_lines)
print("Done")
