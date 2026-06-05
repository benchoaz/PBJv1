import re

with open('tmp_portal.jsx') as f:
    text = f.read()

# basic regex for potential variables (not keywords)
vars = set(re.findall(r'\b[a-zA-Z_]\w*\b', text))
# print a formatted list of all possible react/state variables
possible_vars = [v for v in vars if v not in ['div', 'span', 'button', 'className', 'style', 'onClick', 'if', 'else', 'return', 'true', 'false', 'null', 'const', 'let', 'var', 'import', 'export', 'default', 'function', 'return', 'document', 'body', 'window', 'Math', 'JSON', 'parse', 'stringify', 'length', 'map', 'filter', 'reduce', 'forEach', 'includes', 'startsWith', 'endsWith', 'replace', 'split', 'join', 'toUpperCase', 'toLowerCase', 'trim', 'Date', 'toLocaleString', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'console', 'log', 'error', 'warn', 'info', 'table', 'clear']]

print(", ".join(sorted(possible_vars)))
