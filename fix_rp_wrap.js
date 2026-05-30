const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/ProcurementPreparation.jsx', 'utf8');

// Replace standard space after Rp with a non-breaking space entity to prevent wrapping
content = content.replace(/Rp \{/g, 'Rp&nbsp;{');

fs.writeFileSync('frontend/src/components/ProcurementPreparation.jsx', content);
console.log('Fixed Rp wrapping');
