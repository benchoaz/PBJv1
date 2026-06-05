import re

filepath = "/home/beni/PBJ/frontend/src/components/pp/BahpDocument.jsx"

with open(filepath, "r") as f:
    content = f.read()

# Replace slate colors with solid black/neutral for print
content = re.sub(r'border-slate-\d+', 'border-black', content)
content = re.sub(r'text-slate-\d+', 'text-black', content)
content = re.sub(r'bg-slate-\d+/\d+', '', content)
content = re.sub(r'bg-slate-\d+', 'bg-gray-50', content)
content = re.sub(r'border-slate-800', 'border-black', content)
content = re.sub(r'border-slate-400', 'border-black', content)
content = re.sub(r'border-slate-350', 'border-black', content)
content = re.sub(r'border-slate-250', 'border-black', content)
content = re.sub(r'border-slate-300', 'border-black', content)
content = re.sub(r'border-slate-200', 'border-black', content)
content = re.sub(r'text-slate-800', 'text-black', content)
content = re.sub(r'text-slate-900', 'text-black', content)
content = re.sub(r'text-slate-700', 'text-black', content)
content = re.sub(r'text-slate-600', 'text-black', content)
content = re.sub(r'text-slate-500', 'text-black', content)
content = re.sub(r'text-indigo-700', 'text-black', content)
content = re.sub(r'bg-slate-100', 'bg-gray-100', content)
content = re.sub(r'bg-indigo-50', 'bg-gray-100', content)

with open(filepath, "w") as f:
    f.write(content)

print("Colors cleaned up successfully!")
