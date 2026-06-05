const fs = require('fs');

const file = fs.readFileSync('/home/beni/PBJ/frontend/src/components/ProcurementPreparation.jsx', 'utf-8');
const lines = file.split('\n');

// 1. Extract Step 3
const step3Lines = lines.slice(3159, 4272);
let content3 = `import React, { useState } from 'react';\nimport { usePPK } from './PPKContext';\nimport { CheckCircleIcon, ExclamationTriangleIcon, DocumentTextIcon } from '@heroicons/react/24/outline';\n\nexport default function Step3RincianHPS() {\n  const { \n    selectedPack, \n    dpaAccounts, \n    dpaRincian, setDpaRincian, \n    step, setStep, \n    hpsValue, setHpsValue, \n    isHpsExemptSelected, setIsHpsExemptSelected,\n    hpsPrices, setHpsPrices,\n    techSpecs, setTechSpecs,\n    rincianModal, setRincianModal\n  } = usePPK();\n\n  return (\n    <>\n`;
content3 += step3Lines.join('\n');
content3 += `\n    </>\n  );\n}\n`;
fs.writeFileSync('/home/beni/PBJ/frontend/src/components/ppk/Step3RincianHPS.jsx', content3);

// 2. Extract Step 4
const step4Lines = lines.slice(4272, 5133);
let content4 = `import React, { useState } from 'react';\nimport { usePPK } from './PPKContext';\n\nexport default function Step4TemplateSurat() {\n  const { \n    selectedPack, \n    docSettings, setDocSettings,\n    packageMetadata, setPackageMetadata,\n    dppSpecs, setDppSpecs,\n    step, setStep,\n    aiError, setAiError\n  } = usePPK();\n\n  return (\n    <>\n`;
content4 += step4Lines.join('\n');
content4 += `\n    </>\n  );\n}\n`;
fs.writeFileSync('/home/beni/PBJ/frontend/src/components/ppk/Step4TemplateSurat.jsx', content4);

// 3. Extract Step 5
const step5Lines = lines.slice(5133, 5451);
let content5 = `import React, { useState } from 'react';\nimport { usePPK } from './PPKContext';\n\nexport default function Step5Review() {\n  const { \n    selectedPack, \n    dpaRincian, \n    step, setStep,\n    handleSimpanPaket,\n    isUpdating\n  } = usePPK();\n\n  return (\n    <>\n`;
content5 += step5Lines.join('\n');
content5 += `\n    </>\n  );\n}\n`;
fs.writeFileSync('/home/beni/PBJ/frontend/src/components/ppk/Step5Review.jsx', content5);

console.log("Steps 3, 4, 5 Extracted.");
