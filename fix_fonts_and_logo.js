const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/ProcurementPreparation.jsx', 'utf8');

// Fix Logo
content = content.replace(
  `src={docSettings.logoUrl || "https://upload.wikimedia.org/wikipedia/commons/2/29/Garuda_Pancasila_Coat_of_Arms_of_Indonesia.svg"}`,
  `src={docSettings.logoType === 'pemda' ? "https://upload.wikimedia.org/wikipedia/commons/2/25/Lambang_Kabupaten_Probolinggo.png" : docSettings.logoType === 'garuda' ? "https://upload.wikimedia.org/wikipedia/commons/2/29/Garuda_Pancasila_Coat_of_Arms_of_Indonesia.svg" : docSettings.customLogo ? docSettings.customLogo : "https://upload.wikimedia.org/wikipedia/commons/2/25/Lambang_Kabupaten_Probolinggo.png"}`
);

// Split lines to only affect the print-sheet part
const lines = content.split('\n');
let insidePrintSheet = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('id="print-sheet"')) {
    insidePrintSheet = true;
  }
  
  if (insidePrintSheet) {
    // Remove text-[...]pt and text-[...]px to allow inheritance from docSettings.fontSize
    // Note: leave some text-sizes for things like specific tiny labels if needed, but the user wants consistency.
    // We'll remove all text-[10pt], text-[11pt], text-[12pt], text-[10px], text-[11px], text-[12px]
    // EXCEPT for the "LAMPIRAN" screenshot section which might want to stay small, but let's make it consistent too.
    lines[i] = lines[i].replace(/text-\[(10|11|12)(pt|px)\]/g, '');
    
    // Clean up multiple spaces that might have been created
    lines[i] = lines[i].replace(/  +/g, ' ');
    // Clean up empty className=""
    lines[i] = lines[i].replace(/className="\s+"/g, '');
    lines[i] = lines[i].replace(/className=""/g, '');
  }
}

fs.writeFileSync('frontend/src/components/ProcurementPreparation.jsx', lines.join('\n'));
console.log('Fixed fonts and logo');
