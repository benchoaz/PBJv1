import os

filepath = '/home/ubuntu/PBJv1/survey-service/server.js'

with open(filepath, 'r') as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    new_lines.append(line)
    if 'let detailFile = searchFile; // fallback to search screenshot' in line:
        new_lines.append("""
      // Jika autoComparator gagal, kita paksa ambil screenshot dari URL spesifik (dengan filter wilayah)
      if (!isValidMatch && item.autoComparator) {
          try {
              console.log(`  → Membuka halaman fallback wilayah untuk screenshot: ${detailUrl}`);
              await page.goto(detailUrl, { waitUntil: 'networkidle2', timeout: 45000 });
              await new Promise(r => setTimeout(r, 4000));
              detailFile = `item_${index}_${item.query.replace(/[^a-zA-Z0-9]/g, '_')}_fallback.png`;
              await page.screenshot({ path: path.join(screenshotDir, detailFile) });
              console.log(`  ✅ Screenshot fallback wilayah berhasil.`);
          } catch (e) {
              console.log(`  ⚠️ Gagal mengambil screenshot fallback wilayah: ${e.message}`);
          }
      }
""")

with open(filepath, 'w') as f:
    f.writelines(new_lines)
print("Backend patched successfully!")
