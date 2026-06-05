import sys

backup_file = "/home/beni/PBJ/frontend/src/components/ProcurementPreparation.jsx.backup"
target_file = "/home/beni/PBJ/frontend/src/components/ppk/Step3RincianHPS.jsx"

with open(backup_file, "r") as f:
    backup = f.read()

start_str = "  const handleBatchCustomSearch = async () => {"
start_idx = backup.find(start_str)
if start_idx == -1:
    print("Could not find handleBatchCustomSearch in backup")
    sys.exit(1)

open_braces = 0
end_idx = -1
for i in range(start_idx, len(backup)):
    if backup[i] == '{':
        open_braces += 1
    elif backup[i] == '}':
        open_braces -= 1
        if open_braces == 0:
            end_idx = i + 1
            break

if end_idx == -1:
    print("Could not find end of handleBatchCustomSearch in backup")
    sys.exit(1)

real_fn = backup[start_idx:end_idx] + ";\n"

with open(target_file, "r") as f:
    target = f.read()

target_start_idx = target.find(start_str)
if target_start_idx == -1:
    print("Could not find handleBatchCustomSearch in target")
    sys.exit(1)

open_braces = 0
target_end_idx = -1
for i in range(target_start_idx, len(target)):
    if target[i] == '{':
        open_braces += 1
    elif target[i] == '}':
        open_braces -= 1
        if open_braces == 0:
            target_end_idx = i + 1
            break

if target_end_idx == -1:
    print("Could not find end of handleBatchCustomSearch in target")
    sys.exit(1)

new_target = target[:target_start_idx] + real_fn + target[target_end_idx+1:]
with open(target_file, "w") as f:
    f.write(new_target)

print("Successfully applied REAL handleBatchCustomSearch!")
