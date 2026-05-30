import json

path = '/home/beni/.gemini/antigravity-ide/brain/3ba8dc36-040c-458c-9541-bbd71678b420/.system_generated/logs/transcript.jsonl'
target_file = '/home/beni/PBJ/survey-service/server.js'

full_content = None

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
                                if args.get('TargetFile', '') == target_file:
                                    full_content = args.get('CodeContent')
                except:
                    pass
            elif 'replace_file_content' in line and 'server.js' in line:
                pass # We only care about the full file if it was ever written fully
                
    if full_content:
        with open(target_file, 'w') as out:
            out.write(full_content)
        print("Recovered from write_to_file!")
    else:
        print("No full write found.")
except Exception as e:
    print(e)
