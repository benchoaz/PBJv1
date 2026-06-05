with open('frontend/src/components/ProcurementPreparation.jsx.backup') as f:
    lines = f.readlines()

# Extract from 963 to 1089 (the functions we need)
code_to_insert = "".join(lines[962:1089])

def fix_file(filename):
    with open(filename) as f:
        content = f.read()
    
    # Find the bad getPackageItems
    start_idx = content.find("const getPackageItems = (pack) => {")
    end_idx = content.find("};", start_idx) + 2
    
    if start_idx == -1:
        return
        
    new_content = content[:start_idx] + code_to_insert + content[end_idx:]
    
    # need to also pass dpaAccounts from usePPK if it's not there!
    # for Step3RincianHPS.jsx it's already there. 
    # for DocPreviewModal.jsx we might need to add dpaAccounts.
    if filename == 'frontend/src/components/ppk/DocPreviewModal.jsx':
        if 'dpaAccounts' not in new_content:
            new_content = new_content.replace('dpaRincian', 'dpaRincian, dpaAccounts')

    with open(filename, 'w') as f:
        f.write(new_content)

fix_file('frontend/src/components/ppk/Step3RincianHPS.jsx')
fix_file('frontend/src/components/ppk/DocPreviewModal.jsx')
print("Fixed!")
