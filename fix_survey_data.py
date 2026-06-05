fn_code = """
  const getActiveSurveyData = () => {
    // Hanya tampilkan data survei NYATA
    if (surveyData && surveyData.products && surveyData.products.length > 0) {
      return surveyData;
    }
    return null;
  };
"""

with open('frontend/src/components/ppk/DocPreviewModal.jsx') as f:
    dest_content = f.read()
    
if 'const getActiveSurveyData' not in dest_content:
    # inject it right before `export default function DocPreviewModal() {`
    dest_content = dest_content.replace('export default function DocPreviewModal() {', fn_code + '\n\nexport default function DocPreviewModal() {')
    
    with open('frontend/src/components/ppk/DocPreviewModal.jsx', 'w') as f:
        f.write(dest_content)
    print("Injected getActiveSurveyData")
else:
    print("Already injected")
