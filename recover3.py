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
                if 'server.js' in line and 'EOF' in line:
                    try:
                        obj = json.loads(line)
                        if 'tool_calls' in obj:
                            for tc in obj['tool_calls']:
                                if tc.get('name') == 'run_command':
                                    cmd = tc.get('args', {}).get('CommandLine', '')
                                    if 'cat << \'EOF\' > /home/beni/PBJ/survey-service/server.js' in cmd or 'cat << "EOF" > /home/beni/PBJ/survey-service/server.js' in cmd:
                                        # Extract content between EOFs
                                        try:
                                            start = cmd.index('EOF') + 4
                                            end = cmd.rindex('EOF')
                                            full_content = cmd[start:end].strip()
                                        except:
                                            pass
                    except:
                        pass
    except Exception as e:
        pass

if full_content:
    with open(target_file, 'w') as out:
        out.write(full_content)
    print("Recovered from bash EOF!", len(full_content), "bytes")
else:
    print("No full write found in bash either.")
