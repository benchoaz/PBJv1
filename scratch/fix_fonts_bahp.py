import re

filepath = "/home/beni/PBJ/frontend/src/components/pp/BahpDocument.jsx"

with open(filepath, "r") as f:
    content = f.read()

# Replace variables
content = content.replace("text-[8.5px]", "text-[0.85em]")
content = content.replace("text-[9px]", "text-[0.95em]")
content = content.replace("text-[9.5px]", "text-[1.05em]")
content = content.replace("text-[10.5px]", "text-[1.1em]")
content = content.replace("text-[11.5px]", "text-[1.25em]")
content = content.replace("text-[7px]", "text-[0.75em]")
content = content.replace("text-[7.5px]", "text-[0.8em]")
content = content.replace("text-[8px]", "text-[0.85em]")

# Clean up font-sans and font-serif class overrides so the whole document uses the custom font family
content = re.sub(r'\bfont-sans\b', '', content)
content = re.sub(r'\bfont-serif\b', '', content)
# Clean up duplicate whitespace in className
content = re.sub(r'className="([^"]*?)\s{2,}([^"]*?)"', r'className="\1 \2"', content)

with open(filepath, "w") as f:
    f.write(content)

print("Replacement complete successfully!")
