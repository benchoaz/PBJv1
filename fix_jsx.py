import re

with open('frontend/src/components/ppk/Step3RincianHPS.jsx', 'r') as f:
    text = f.read()

# I will find the end starting from "Serahkan ke Pejabat Pengadaan"
# and replace everything after it with the correct closing tags.

# The button is:
#             >
#               Serahkan ke Pejabat Pengadaan →
#             </button>

idx = text.rfind("Serahkan ke Pejabat Pengadaan")
if idx != -1:
    end_btn = text.find("</button>", idx) + len("</button>")
    new_text = text[:end_btn] + "\n          </div>\n        </div>\n      </div>\n    </>\n  );\n}"
    with open('frontend/src/components/ppk/Step3RincianHPS.jsx', 'w') as f:
        f.write(new_text)
    print("Fixed!")
else:
    print("Not found")

