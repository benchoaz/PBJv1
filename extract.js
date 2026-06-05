const fs = require('fs');

const file = fs.readFileSync('/home/beni/PBJ/frontend/src/components/ProcurementPreparation.jsx', 'utf-8');
const lines = file.split('\n');

// Extract Step 2 JSX
const step2Lines = lines.slice(2063, 3165); // 0-indexed
let content = `import React, { useState, useRef, useEffect } from 'react';\nimport { usePPK } from './PPKContext';\nimport { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, MapPinIcon } from '@heroicons/react/24/outline';\n\nexport default function Step2UploadDPA() {\n  const { \n    selectedPack, \n    dpaName, setDpaName, \n    dpaAccounts, setDpaAccounts, \n    dpaRincian, setDpaRincian, \n    matchedDpaTypes, setMatchedDpaTypes, \n    step, setStep \n  } = usePPK();\n\n  const [isParsing, setIsParsing] = useState(false);\n  const [parseProgress, setParseProgress] = useState(0);\n  const [parseLogs, setParseLogs] = useState([]);\n  const fileInputRef = useRef(null);\n\n  const handleFileUpload = async (event) => {\n    // We will port the handleFileUpload logic here later\n    alert('Fungsi upload dipindah ke komponen Step2UploadDPA. Sedang dalam tahap refactoring.');\n  };\n\n  const confirmExtractedData = () => {\n    setStep(3);\n  };\n\n  return (\n    <>\n`;

content += step2Lines.join('\n');
content += `\n    </>\n  );\n}\n`;

fs.writeFileSync('/home/beni/PBJ/frontend/src/components/ppk/Step2UploadDPA.jsx', content);
console.log('Step 2 Extracted');
