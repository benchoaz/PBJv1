import re

with open('tmp_portal.jsx') as f:
    portal_jsx = f.read()

# handleExportWord from backup
with open('frontend/src/components/ProcurementPreparation.jsx.backup') as f:
    backup_text = f.read()

# Extract handleExportWord
start_export = backup_text.find("const handleExportWord = async () => {")
end_export = backup_text.find("  const handleSimpanPaket = async () => {")
handle_export_str = backup_text[start_export:end_export].strip()

# Create DocPreviewModal.jsx
modal_content = f"""import React from 'react';
import {{ createPortal }} from 'react-dom';
import {{ usePPK }} from './PPKContext';
import {{ getPackageItems, getPacketCategory }} from '../../utils/formatters';

export default function DocPreviewModal() {{
  const {{
    activeDocPreview, setActiveDocPreview,
    selectedPack,
    hpsValue, hpsPrices,
    currentUser,
    docSettings,
    dppSpecs,
    surveyData,
    comparisons,
    justifications,
    packageMetadata
  }} = usePPK();

  {handle_export_str}

  if (!activeDocPreview || !selectedPack) return null;

  return (
    <>
      {portal_jsx}
    </>
  );
}}
"""

with open('frontend/src/components/ppk/DocPreviewModal.jsx', 'w') as f:
    f.write(modal_content)
    
print("Created DocPreviewModal.jsx")
