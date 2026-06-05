import re
import sys

backup_file = "/home/beni/PBJ/frontend/src/components/ProcurementPreparation.jsx.backup"
target_file = "/home/beni/PBJ/frontend/src/components/ppk/Step3RincianHPS.jsx"

with open(backup_file, "r") as f:
    backup = f.read()

# Extract runAiSurvey
start_str = "  const runAiSurvey = async () => {\n    if (!selectedPack) return;\n    setIsSurveying(true);"
start_idx = backup.find(start_str)
if start_idx == -1:
    print("Could not find runAiSurvey in backup")
    sys.exit(1)

# Find the matching closing brace for runAiSurvey
end_idx = -1
open_braces = 0
for i in range(start_idx, len(backup)):
    if backup[i] == '{':
        open_braces += 1
    elif backup[i] == '}':
        open_braces -= 1
        if open_braces == 0:
            end_idx = i + 1
            break

if end_idx == -1:
    print("Could not find end of runAiSurvey in backup")
    sys.exit(1)

real_run_ai_survey = backup[start_idx:end_idx] + ";\n"

with open(target_file, "r") as f:
    target = f.read()

target_start_idx = target.find("  const runAiSurvey = () => {\n    if (!selectedPack) return;")
if target_start_idx == -1:
    print("Could not find runAiSurvey in target")
    sys.exit(1)

target_end_idx = -1
open_braces = 0
for i in range(target_start_idx, len(target)):
    if target[i] == '{':
        open_braces += 1
    elif target[i] == '}':
        open_braces -= 1
        if open_braces == 0:
            target_end_idx = i + 1
            break

# We also need to add cancelJobId and comparisons states
state_injection = """  const [loadingProductIndex, setLoadingProductIndex] = useState(null);
  const [expandedEditCardIndex, setExpandedEditCardIndex] = useState(null);
  const [expandedSurveyRows, setExpandedSurveyRows] = useState({});
  const [cancelJobId, setCancelJobId] = useState(null);
  const [comparisons, setComparisons] = useState({});
  const [useAiMode, setUseAiMode] = useState(true);
  const [globalPriceTolerance, setGlobalPriceTolerance] = useState(8);
  const [globalTargetVendor, setGlobalTargetVendor] = useState('SULTONI');
  const [searchLocations, setSearchLocations] = useState('Kab.Probolinggo');
  const [customTargets, setCustomTargets] = useState({});"""

target = re.sub(
    r"  const \[loadingProductIndex, setLoadingProductIndex\] = useState\(null\);\n  const \[expandedEditCardIndex, setExpandedEditCardIndex\] = useState\(null\);\n  const \[expandedSurveyRows, setExpandedSurveyRows\] = useState\(\{\}\);",
    state_injection,
    target
)

target_start_idx = target.find("  const runAiSurvey = () => {\n    if (!selectedPack) return;")
if target_start_idx == -1:
    print("Could not find runAiSurvey in target after regex")
    sys.exit(1)

target_end_idx = -1
open_braces = 0
for i in range(target_start_idx, len(target)):
    if target[i] == '{':
        open_braces += 1
    elif target[i] == '}':
        open_braces -= 1
        if open_braces == 0:
            target_end_idx = i + 1
            break

new_target = target[:target_start_idx] + real_run_ai_survey + target[target_end_idx+2:]
with open(target_file, "w") as f:
    f.write(new_target)

print("Successfully applied REAL runAiSurvey!")
