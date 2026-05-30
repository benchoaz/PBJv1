const fs = require('fs');
const readline = require('readline');
const path = '/home/beni/.gemini/antigravity-ide/brain/3ba8dc36-040c-458c-9541-bbd71678b420/.system_generated/logs/transcript.jsonl';

async function recover() {
  const fileStream = fs.createReadStream(path);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
  
  let lastContent = null;
  for await (const line of rl) {
    if (line.includes('write_to_file') && line.includes('server.js')) {
      try {
        const obj = JSON.parse(line);
        if (obj.tool_calls) {
          for (const tc of obj.tool_calls) {
            if (tc.name === 'write_to_file' && tc.args.TargetFile.includes('server.js')) {
              lastContent = tc.args.CodeContent;
            }
          }
        }
      } catch(e) {}
    }
  }
  
  if (lastContent) {
    fs.writeFileSync('/home/beni/PBJ/survey-service/server.js', lastContent);
    console.log('Recovered from write_to_file!');
  } else {
    console.log('No write_to_file found. Trying to reconstruct from diffs...');
  }
}
recover();
