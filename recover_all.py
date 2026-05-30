import json
import glob
import os

target_file = '/home/beni/PBJ/survey-service/server.js'
brain_dir = '/home/beni/.gemini/antigravity-ide/brain/'

transcripts = glob.glob(os.path.join(brain_dir, '*/.system_generated/logs/transcript.jsonl'))
transcripts.sort(key=os.path.getmtime)

full_content = None

for path in transcripts:
    try:
        with open(path, 'r') as f:
            for line in f:
                if 'write_to_file' in line and 'server.js' in line:
                    try:
                        obj = json.loads(line)
                        if 'tool_calls' in obj:
                            for tc in obj['tool_calls']:
                                if tc.get('name') == 'write_to_file':
                                    args = tc.get('args', {})
                                    if 'server.js' in args.get('TargetFile', ''):
                                        full_content = args.get('CodeContent')
                    except:
                        pass
    except Exception as e:
        pass

if full_content:
    with open(target_file, 'w') as out:
        out.write(full_content)
    print("Recovered from", len(full_content), "bytes!")
else:
    print("No full write found in any conversation.")
