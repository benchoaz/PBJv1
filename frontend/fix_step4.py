import re

with open('src/components/ppk/DocPreviewModal.jsx', 'r') as f:
    doc_lines = f.readlines()

# Extract dynamic section from DocPreviewModal
start_idx = -1
end_idx = -1
for i, line in enumerate(doc_lines):
    if '{/* The Dynamic Components Section */}' in line:
        start_idx = i
    if '{parts[1] && (' in line and start_idx != -1:
        end_idx = i
        break

dynamic_block = doc_lines[start_idx:end_idx]

with open('src/components/ppk/Step4TemplateSurat.jsx', 'r') as f:
    step4_lines = f.readlines()

# Replace dynamic section in Step4TemplateSurat
s4_start = -1
s4_end = -1
for i, line in enumerate(step4_lines):
    if '{/* The Dynamic Components Section */}' in line:
        s4_start = i
    if '{/* Render the second part of the template (footer/signature) */}' in line and s4_start != -1:
        s4_end = i
        break

new_step4 = step4_lines[:s4_start] + dynamic_block + step4_lines[s4_end:]
step4_content = "".join(new_step4)

# Fix parseSmartColons
old_parse = """  const parseSmartColons = (text) => {
    if (!text) return text;
    const lines = text.split('\\n');
    let output = [];
    let inTable = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/^([A-Za-z0-9/ ()\\-_.,]+?)\\s*:\\s*(.*)$/);
      if (match && !line.includes('<') && match[1].length < 45) {
        if (!inTable) {
          inTable = true;
          output.push('<table style="width: 100%; border: none; margin-top: 4px; margin-bottom: 4px; border-collapse: collapse;"><tbody>');
        }
        output[output.length - 1] += `<tr><td style="width: 1%; white-space: nowrap; padding-right: 15px; vertical-align: top; border: none; padding-top: 2px;">${match[1]}</td><td style="width: 1%; padding-right: 8px; vertical-align: top; border: none; padding-top: 2px;">:</td><td style="vertical-align: top; border: none; padding-top: 2px;">${match[2]}</td></tr>`;
      } else {
        if (inTable) {
          inTable = false;
          output[output.length - 1] += '</tbody></table>';
        }
        output.push(line);
      }
    }
    if (inTable) output[output.length - 1] += '</tbody></table>';
    return output.join('\\n');
  };"""

new_parse = """  const parseSmartColons = (text) => {
    if (!text) return text;
    const lines = text.split('\\n');
    let output = [];
    let inTable = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/^([A-Za-z0-9/ ()\\-_.,]+?)\\s*:\\s*(.*)$/);
      if (match && !line.includes('<') && match[1].length < 45) {
        if (!inTable) {
          inTable = true;
          output.push('<table style="width: 100%; border: none; margin-top: 4px; margin-bottom: 4px; border-collapse: collapse;"><tbody>');
        }
        output[output.length - 1] += `<tr><td style="width: 1%; white-space: nowrap; padding-right: 15px; vertical-align: top; border: none; padding-top: 2px;">${match[1]}</td><td style="width: 1%; padding-right: 8px; vertical-align: top; border: none; padding-top: 2px;">:</td><td style="vertical-align: top; border: none; padding-top: 2px;">${match[2]}</td></tr>`;
      } else {
        if (inTable) {
          if (line.trim() === '' || line.includes('<') || line.includes('>')) {
            inTable = false;
            output[output.length - 1] += '</tbody></table>';
            output.push(line);
          } else {
            output[output.length - 1] = output[output.length - 1].replace(/<\\/td><\\/tr>$/, `<br/>${line}</td></tr>`);
          }
        } else {
          output.push(line);
        }
      }
    }
    if (inTable) output[output.length - 1] += '</tbody></table>';
    return output.join('\\n');
  };"""

step4_content = step4_content.replace(old_parse, new_parse)

# Fix signature
old_sig = """  {/* Ruang kosong untuk tanda tangan basah */}
  <div className="h-24"></div>"""

new_sig = """  {/* Ruang kosong untuk tanda tangan basah, atau tampilkan TTE jika ada */}
  {docSettings.ttdPpk ? (
    <div className="flex justify-center items-center h-24 my-2">
      <img src={docSettings.ttdPpk} alt="TTD PPK" style={{ maxHeight: '96px', objectFit: 'contain', mixBlendMode: 'multiply' }} />
    </div>
  ) : (
    <div className="h-24"></div>
  )}"""

step4_content = step4_content.replace(old_sig, new_sig)

# Fix replacements to prevent newline bugs
old_rep = "'{{nama_pekerjaan}}': selectedPack.packName || '',"
new_rep = "'{{nama_pekerjaan}}': (selectedPack.packName || '').replace(/\\n/g, ' '),"
step4_content = step4_content.replace(old_rep, new_rep)

with open('src/components/ppk/Step4TemplateSurat.jsx', 'w') as f:
    f.write(step4_content)

print('Success')
