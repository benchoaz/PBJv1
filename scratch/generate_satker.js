const fs = require('fs');

const userMgmt = fs.readFileSync('/home/beni/PBJ/frontend/src/components/UserManagement.jsx', 'utf-8');
const match = userMgmt.match(/const satkerOptions = \[([\s\S]*?)\]/);

if (match) {
  const optionsString = match[1];
  const lines = optionsString.split('\n');
  const satkers = [];
  
  lines.forEach(line => {
    const m = line.match(/"(.*?)"/);
    if (m) satkers.push(m[1]);
  });
  
  const mapObj = {};
  const arrayObj = [];
  let idCounter = 50001;
  
  satkers.forEach(s => {
    const lower = s.toLowerCase();
    let idStr = '';
    
    // Legacy mapping
    if (lower.includes('besuk')) idStr = '67081';
    else if (lower.includes('kraksaan')) idStr = '67082';
    else if (lower.includes('paiton')) idStr = '67083';
    else if (lower.includes('gending')) idStr = '67084';
    else if (lower.includes('dringu')) idStr = '67085';
    else if (lower.includes('leces')) idStr = '67086';
    else if (lower.includes('pupr') || lower.includes('pekerjaan umum')) idStr = '12345';
    else {
      idStr = idCounter.toString();
      idCounter++;
    }
    
    mapObj[s] = idStr;
    arrayObj.push({ name: s, id: idStr });
  });

  const output = `// Auto-generated mapping file
export const satkerMap = ${JSON.stringify(mapObj, null, 2)};

export const satkerArray = ${JSON.stringify(arrayObj, null, 2)};

export function getSatkerIdFromName(name) {
  if (!name) return '67081'; // Default
  return satkerMap[name] || '67081'; // Return map or default if not found
}
`;

  fs.writeFileSync('/home/beni/PBJ/frontend/src/utils/satkerMap.js', output);
  console.log("satkerMap.js generated successfully!");
}
