import re
from html.parser import HTMLParser

class JSXTagChecker(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags = []
        self.errors = []
        
    def handle_starttag(self, tag, attrs):
        # Ignore self-closing tags or void elements in HTML
        if tag in ['img', 'br', 'hr', 'input', 'link', 'meta']:
            return
        self.tags.append((tag, self.getpos()))
        
    def handle_endtag(self, tag):
        if tag in ['img', 'br', 'hr', 'input', 'link', 'meta']:
            return
        if not self.tags:
            self.errors.append(f"Unexpected end tag </{tag}> at line {self.getpos()[0]}")
            return
        last_tag, pos = self.tags.pop()
        if last_tag != tag:
            self.errors.append(f"Mismatched tag: opened <{last_tag}> at line {pos[0]}, but closed </{tag}> at line {self.getpos()[0]}")

with open("/home/beni/PBJ/frontend/src/components/ProcurementPreparation.jsx", "r") as f:
    content = f.read()

# Let's extract the part inside createPortal for activeDocPreview
# We find createPortal( and its matching closing )
start_idx = content.find("activeDocPreview && selectedPack && createPortal(")
if start_idx != -1:
    print("Found createPortal start!")
    # Let's extract from start_idx to the end of file
    subcontent = content[start_idx:]
    
    # We want to convert JSX into standard HTML for parsing
    # Let's clean up JSX curly braces and expressions to avoid confusing the HTMLParser
    # Replace {...} with standard text or attribute values
    
    # Clean JSX braces in attributes
    subcontent = re.sub(r'=\s*\{[^}]*\}', '="jsx-val"', subcontent)
    # Clean JSX braces in content
    subcontent = re.sub(r'\{[^}]*\}', 'JSX_CONTENT', subcontent)
    
    # Clean self-closing tags like <img ... /> or <input ... /> or <br /> to standard HTML void elements
    subcontent = re.sub(r'<(\w+)([^>]*)/\s*>', r'<\1\2></\1>', subcontent)
    
    parser = JSXTagChecker()
    try:
        parser.feed(subcontent)
        print("Parsing finished.")
        for err in parser.errors:
            print("ERROR:", err)
        if parser.tags:
            print("Unclosed tags remaining:")
            for tag, pos in parser.tags:
                print(f"  <{tag}> opened at position {pos}")
    except Exception as e:
        print("Parser crashed:", e)
else:
    print("createPortal not found!")
