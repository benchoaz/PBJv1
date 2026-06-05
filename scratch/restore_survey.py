import re
import sys

backup_file = "/home/beni/PBJ/frontend/src/components/ProcurementPreparation.jsx.backup"
target_file = "/home/beni/PBJ/frontend/src/components/ppk/Step3RincianHPS.jsx"

with open(backup_file, "r") as f:
    backup = f.read()

def extract_func(name, is_async=False):
    pattern = r"const " + name + r" = " + (r"async " if is_async else r"") + r"\(.*?\) => \{[\s\S]*?\n  \};\n"
    match = re.search(pattern, backup)
    if not match and name == "runAiSurvey":
        # Maybe it's defined differently
        pattern = r"const " + name + r" = async \(\) => \{[\s\S]*?\n  \};\n"
        match = re.search(pattern, backup)
    return match.group(0) if match else f"// COULD NOT EXTRACT {name}\n"

def extract_named_func(name):
    pattern = r"function " + name + r"\(.*?\) \{[\s\S]*?\n  \}\n"
    match = re.search(pattern, backup)
    return match.group(0) if match else f"// COULD NOT EXTRACT {name}\n"

funcs = []
funcs.append(extract_named_func("areAccountsCompatible"))
funcs.append(extract_func("getMatchingDpaAccount"))
funcs.append(extract_func("getPackageItems"))
funcs.append(extract_func("getPacketCategory"))
funcs.append(extract_func("autoCleanKeyword"))
funcs.append(extract_func("cancelSurvey", is_async=True))
funcs.append(extract_func("runAiSurvey", is_async=True))

with open(target_file, "r") as f:
    target = f.read()

# Replace the stubs
stubs_start = target.find("  const getActiveSurveyData = () => surveyData;")
if stubs_start == -1:
    stubs_start = target.find("  const getPackageItems = () => [];")
    
if stubs_start != -1:
    stubs_end = target.find("  const runSingleItemSurvey = async (idx, keyword) => {")
    if stubs_end != -1:
        new_helpers = "  const getActiveSurveyData = () => surveyData;\n\n"
        new_helpers += "\n".join(funcs)
        new_helpers += "\n\n"
        
        new_target = target[:stubs_start] + new_helpers + target[stubs_end:]
        with open(target_file, "w") as f:
            f.write(new_target)
        print("Successfully injected helper functions into Step3RincianHPS.jsx")
    else:
        print("Could not find end of stubs in target file")
else:
    print("Could not find stubs in target file")
