import os
path = os.path.expanduser("~/PBJv1/docker-compose.yml")
with open(path, "r") as f:
    content = f.read()
target = "- REDIS_PORT=6379"
replacement = "- REDIS_PORT=6379\n      - PUPPETEER_EXECUTABLE_PATH=/home/pptruser/.cache/puppeteer/chrome/linux-149.0.7827.22/chrome-linux64/chrome"
if target in content and replacement not in content:
    content = content.replace(target, replacement)
    with open(path, "w") as f:
        f.write(content)
    print("YAML updated successfully")
else:
    print("Already updated or target not found")
