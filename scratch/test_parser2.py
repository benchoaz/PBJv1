import re
line = "Ballpoint / Ballpen / Pena 10 Pack Pak Rp38.400,00 0% Rp384.000,00"
NOMINAL = re.compile(r'\b\d{1,3}(?:\.\d{3})+\b')
print("Nominals:", NOMINAL.findall(line))
