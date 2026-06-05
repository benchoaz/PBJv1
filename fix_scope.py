with open('frontend/src/components/ppk/DocPreviewModal.jsx') as f:
    content = f.read()

import re

# Find the function outside the component
match = re.search(r'\s*const getActiveSurveyData = \(\) => \{\n\s*// Hanya tampilkan data survei NYATA\n\s*if \(surveyData && surveyData\.products && surveyData\.products\.length > 0\) \{\n\s*return surveyData;\n\s*\}\n\s*return null;\n\s*\};\n', content)

if match:
    # Remove it from outside
    content = content[:match.start()] + content[match.end():]
    
    # Insert it inside, right after `} = usePPK();`
    insert_match = re.search(r'\} = usePPK\(\);\n', content)
    if insert_match:
        insert_idx = insert_match.end()
        content = content[:insert_idx] + match.group(0) + content[insert_idx:]
        
        with open('frontend/src/components/ppk/DocPreviewModal.jsx', 'w') as f:
            f.write(content)
        print("Moved getActiveSurveyData inside component scope")
    else:
        print("Could not find usePPK")
else:
    print("Could not find getActiveSurveyData outside")
