import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { usePPK } from './PPKContext';
import { Settings, Printer, Download, ClipboardList, Wand2 } from 'lucide-react';
import { DEFAULT_TEMPLATES } from '../TemplateSuratManager';

export const injectSignatureHelper = (htmlContent, name, nip, imgHtml) => {
  if (!nip) return htmlContent;
  if (name) {
    const safeName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const safeNip = nip.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const sigBlockRegex = new RegExp(`(${safeName})([\\s\\r\\n]+NIP\\.\\s*${safeNip})`, 'g');
    if (htmlContent.match(sigBlockRegex)) {
      return htmlContent.replace(sigBlockRegex, `${imgHtml}$1$2`);
    }
  }
  return htmlContent.replace(new RegExp(`NIP\\.\\s*${nip.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'), `${imgHtml}NIP. ${nip}`);
};

function terbilang(angka) {
  if (!angka) return "Nol";
  const huruf = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
  let n = Math.floor(Math.abs(angka));
  if (n < 12) return huruf[n];
  if (n < 20) return terbilang(n - 10) + " Belas";
  if (n < 100) {
    const puluh = terbilang(Math.floor(n / 10)) + " Puluh";
    const sisa = terbilang(n % 10);
    return (puluh + " " + sisa).trim();
  }
  if (n < 200) {
    return ("Seratus " + terbilang(n - 100)).trim();
  }
  if (n < 1000) {
    const ratus = terbilang(Math.floor(n / 100)) + " Ratus";
    const sisa = terbilang(n % 100);
    return (ratus + " " + sisa).trim();
  }
  if (n < 2000) {
    return ("Seribu " + terbilang(n - 1000)).trim();
  }
  if (n < 1000000) {
    const ribu = terbilang(Math.floor(n / 1000)) + " Ribu";
    const sisa = terbilang(n % 1000);
    return (ribu + " " + sisa).trim();
  }
  if (n < 1000000000) {
    const juta = terbilang(Math.floor(n / 1000000)) + " Juta";
    const sisa = terbilang(n % 1000000);
    return (juta + " " + sisa).trim();
  }
  if (n < 1000000000000) {
    const milyar = terbilang(Math.floor(n / 1000000000)) + " Milyar";
    const sisa = terbilang(n % 1000000000);
    return (milyar + " " + sisa).trim();
  }
  return "Angka terlalu besar";
}

const getDynamicProductLink = (vendorName, keyword) => {
  if (!vendorName || vendorName === 'TIDAK DITEMUKAN' || vendorName === 'PENYEDIA INAPROC') {
    return `https://katalog.inaproc.id/search?keyword=${encodeURIComponent(keyword || '')}`;
  }
  const cleanVendor = vendorName.trim();
  let vendorSlug = '';
  
  if (cleanVendor.includes('katalog.inaproc.id/')) {
    try {
      const fullUrl = cleanVendor.startsWith('http') ? cleanVendor : 'https://' + cleanVendor;
      const urlObj = new URL(fullUrl);
      const pathSegments = urlObj.pathname.split('/').filter(Boolean);
      vendorSlug = pathSegments[0] ? pathSegments[0].toLowerCase() : '';
    } catch (e) {
      // ignore
    }
  }
  
  if (!vendorSlug) {
    if (cleanVendor.includes('katalog.inaproc.id/')) {
      const match = cleanVendor.match(/katalog\.inaproc\.id\/([^/?&#]+)/);
      vendorSlug = match ? match[1].toLowerCase() : cleanVendor.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    } else if (/^[a-z0-9][a-z0-9-]*[a-z0-9]$/i.test(cleanVendor) && cleanVendor.includes('-')) {
      vendorSlug = cleanVendor.toLowerCase();
    } else {
      vendorSlug = cleanVendor.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    }
  }
  
  const q = keyword || '';
  return `https://katalog.inaproc.id/${vendorSlug}?catalogueSearch=${encodeURIComponent(q)}`;
};

const getTteBadge = (name, nip) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="90" viewBox="0 0 220 90" style="border: 1px solid %23cbd5e1; border-radius: 6px; background: %23f8fafc; font-family: Arial, sans-serif; margin-top: 6px; margin-bottom: 6px; display: inline-block;">
    <rect x="0" y="0" width="220" height="90" fill="%23f8fafc" rx="6" />
    <rect x="10" y="10" width="70" height="70" fill="white" stroke="%23334155" stroke-width="1.5" />
    <path d="M15 15h10v10H15zm0 15h10v10H15zm15-15h10v10H30zm0 15h10v10H30zm15-15h10v10H45zm0 15h10v10H45zm15 0h10v10H60zm0-15h10v10H60z" fill="%23334155" />
    <path d="M20 20h20v20H20zm25 25h15v15H45z" fill="%23000" />
    <text x="90" y="22" font-size="7" font-weight="bold" fill="%230f172a" letter-spacing="0.5">TANDA TANGAN ELEKTRONIK</text>
    <text x="90" y="32" font-size="6" font-weight="bold" fill="%23475569">Sertifikat Elektronik Diterbitkan Oleh:</text>
    <text x="90" y="42" font-size="7" font-weight="black" fill="%231e3a8a">BSrE BSSN</text>
    <line x1="90" y1="48" x2="210" y2="48" stroke="%23cbd5e1" stroke-width="1" />
    <text x="90" y="58" font-size="6.5" font-weight="bold" fill="%230f172a">${name}</text>
    <text x="90" y="68" font-size="6" fill="%23475569">NIP: ${nip}</text>
    <text x="90" y="78" font-size="5" font-weight="bold" fill="%2316a34a">✓ VERIFIED &amp; SECURED BY BSSN</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${svg}`;
};

export default function Step4TemplateSurat() {
  const { 
    selectedPack, currentUser,
    docSettings, setDocSettings,
    packageMetadata, setPackageMetadata,
    dppSpecs, setDppSpecs,
    step, setStep,
    aiError, setAiError,
    hpsValue, isHpsExemptSelected,
    surveyData, hpsPrices, getPackageItems,
    selectedTplId, setSelectedTplId, autoComparator,
    selectedNdTplId, setSelectedNdTplId,
    comparisons
  } = usePPK();

  const [activeDocPreview, setActiveDocPreview] = useState(null);
  const [isEnhancingDPP, setIsEnhancingDPP] = useState({});

  const enhanceDPPTextWithAI = async (field, currentText) => {
    if (!currentText || !currentText.trim()) return;
    setIsEnhancingDPP(prev => ({ ...prev, [field]: true }));
    try {
      const response = await fetch('/api/ai/enhance-justification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: currentText })
      });
      const data = await response.json();
      if (data.success) {
        setDppSpecs(prev => ({ ...prev, [field]: data.result }));
      } else {
        alert('Gagal memproses teks dengan AI.');
      }
    } catch (err) {
      console.error('Enhance error:', err);
      alert('Terjadi kesalahan saat memproses AI.');
    } finally {
      setIsEnhancingDPP(prev => ({ ...prev, [field]: false }));
    }
  };
  
  const getPacketCategory = (packName) => {
    const name = (packName || '').toLowerCase();
    if (name.includes('prasmanan') || name.includes('katering')) return 'Mamin-Prasmanan';
    if (name.includes('nasi kotak') || name.includes('nasi bungkus')) return 'Mamin-Bungkus';
    if (name.includes('snack') || name.includes('kue')) return 'Mamin-Snack';
    if (name.includes('mamin') || name.includes('makanan')) return 'Mamin-Bungkus';
    if (name.includes('modal') || name.includes('kendaraan') || name.includes('mesin') || name.includes('elektronik') || name.includes('peralatan')) return 'Modal';
    if (name.includes('konsolidasi')) return 'Konsolidasi';
    if (name.includes('jasa')) return 'Jasa';
    return 'ATK';
  };

  const getActiveSurveyData = () => surveyData;
  const parseSmartColons = (t) => t;

  const handleExportWord = async () => {
    const printSheet = document.getElementById('print-sheet');
    if (!printSheet) return;

    // Clone the print-sheet DOM node
    const clone = printSheet.cloneNode(true);

    // 1. Convert all local images (relative paths / screenshots / local blob URLs) to Base64 asynchronously
    const imgs = Array.from(clone.querySelectorAll('img'));
    for (const img of imgs) {
      const src = img.getAttribute('src');
      if (src) {
        let absoluteSrc = src;
        // Make relative paths absolute to fetch them
        if (src.startsWith('/')) {
          absoluteSrc = window.location.origin + src;
        }

        try {
          if (src.startsWith('data:image/') && !src.includes('svg+xml')) {
            // Already a valid base64 non-svg image, skip fetch
          } else {
            const res = await fetch(absoluteSrc);
            const blob = await res.blob();
            
            if (blob.type === 'image/svg+xml' || absoluteSrc.toLowerCase().includes('.svg')) {
               // Word cannot render SVG. Convert SVG to PNG using Canvas.
               const base64Png = await new Promise((resolve, reject) => {
                   const svgUrl = URL.createObjectURL(blob);
                   const imgObj = new Image();
                   imgObj.onload = () => {
                       const canvas = document.createElement('canvas');
                       canvas.width = imgObj.width || 150;
                       canvas.height = imgObj.height || 150;
                       const ctx = canvas.getContext('2d');
                       ctx.drawImage(imgObj, 0, 0);
                       resolve(canvas.toDataURL('image/png'));
                       URL.revokeObjectURL(svgUrl);
                   };
                   imgObj.onerror = reject;
                   imgObj.src = svgUrl;
               });
               img.setAttribute('src', base64Png);
            } else {
               // Compress image to JPEG to reduce data/file size of exported Word document
               const compressedBase64 = await new Promise((resolve, reject) => {
                   const imgUrl = URL.createObjectURL(blob);
                   const imgObj = new Image();
                   imgObj.onload = () => {
                       const canvas = document.createElement('canvas');
                       // Reduce resolution: max width 600px is perfect for Word layout (keeps file size tiny)
                       const maxWidth = 600;
                       let targetWidth = imgObj.width || 600;
                       let targetHeight = imgObj.height || 400;
                       
                       if (targetWidth > maxWidth) {
                           const ratio = maxWidth / targetWidth;
                           targetWidth = maxWidth;
                           targetHeight = Math.round(targetHeight * ratio);
                       }
                       
                       canvas.width = targetWidth;
                       canvas.height = targetHeight;
                       const ctx = canvas.getContext('2d');
                       ctx.drawImage(imgObj, 0, 0, targetWidth, targetHeight);
                       
                       // Export to JPEG with 0.6 quality for excellent size reduction
                       resolve(canvas.toDataURL('image/jpeg', 0.6));
                       URL.revokeObjectURL(imgUrl);
                   };
                   imgObj.onerror = (err) => {
                       URL.revokeObjectURL(imgUrl);
                       reject(err);
                   };
                   imgObj.src = imgUrl;
               });
               img.setAttribute('src', compressedBase64);
            }
          }
        } catch (err) {
          console.warn('Failed to convert image to base64 for Word export:', src, err);
        }
      }

      // Force inline styling for compatibility in Word (Exclude Logo)
      if (!img.classList.contains('logo-instansi')) {
        img.style.width = '100%';
        img.style.maxWidth = '280px';
        img.style.height = 'auto';
        img.style.display = 'block';
        img.style.margin = '4px auto';
        img.style.border = '1px solid #cbd5e1'; // slate-300
        
        // CRITICAL FOR WORD EXPORT: Explicit width attribute prevents Word from blowing up the image
        img.setAttribute('width', '450');
      } else {
        // Keep logo compact
        img.style.width = '70px';
        img.style.height = 'auto';
        img.setAttribute('width', '70');
        img.setAttribute('height', '76');
      }
    }

    // 2. Format tables for Word Compatibility (force physical borders and spacing)
    const tables = Array.from(clone.querySelectorAll('table'));
    tables.forEach(table => {
      // Exclude layout tables like Kop Surat from receiving borders
      if (table.classList.contains('no-border')) {
        table.setAttribute('border', '0');
        table.style.border = 'none';
        const cells = Array.from(table.querySelectorAll('td, th'));
        cells.forEach(cell => { cell.style.border = 'none'; });
        return;
      }

      table.setAttribute('border', '1');
      table.setAttribute('cellspacing', '0');
      table.setAttribute('cellpadding', '6');
      table.style.borderCollapse = 'collapse';
      table.style.width = '100%';
      table.style.marginBottom = '12px';
      table.style.fontSize = '10pt';

      const cells = Array.from(table.querySelectorAll('td, th'));
      cells.forEach(cell => {
        cell.style.border = '1px solid #000000';
        cell.style.padding = '6px';
      });
    });

    // 3. Convert grid of screenshots (.grid) into a 2-column Word table
    const gridDiv = clone.querySelector('.grid');
    if (gridDiv) {
      const products = Array.from(gridDiv.children);
      const table = document.createElement('table');
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.setAttribute('border', '0');
      table.setAttribute('cellspacing', '0');
      table.setAttribute('cellpadding', '8');

      let row;
      products.forEach((p, idx) => {
        if (idx % 2 === 0) {
          row = document.createElement('tr');
          table.appendChild(row);
        }
        const td = document.createElement('td');
        td.style.width = '50%';
        td.style.padding = '8px';
        td.style.verticalAlign = 'top';
        td.style.border = '1px solid #94a3b8'; // border-slate-400
        td.style.backgroundColor = '#f8fafc'; // bg-slate-50
        td.style.textAlign = 'center';

        td.innerHTML = p.innerHTML;

        // Clean up classes inside td that might confuse Word
        const img = td.querySelector('img');
        if (img) {
          img.setAttribute('width', '250');
          img.style.width = '250px';
          img.style.height = 'auto';
          img.style.margin = '4px auto';
        }

        row.appendChild(td);
      });

      if (products.length % 2 !== 0 && row) {
        const td = document.createElement('td');
        td.style.width = '50%';
        td.style.border = '1px solid #94a3b8';
        td.style.backgroundColor = '#f8fafc';
        row.appendChild(td);
      }

      gridDiv.replaceWith(table);
    }

    // 4. Convert flex signature sections into Word table
    const flexSignatures = Array.from(clone.querySelectorAll('.signature-section.flex'));
    flexSignatures.forEach(sig => {
      const flexChildren = Array.from(sig.children);
      const table = document.createElement('table');
      table.style.width = '100%';
      table.style.marginTop = '24px';
      table.setAttribute('border', '0');
      table.setAttribute('cellspacing', '0');
      table.setAttribute('cellpadding', '0');
      table.className = 'no-border';
      
      const tr = document.createElement('tr');
      flexChildren.forEach(child => {
        const td = document.createElement('td');
        if (child.classList.contains('text-center') || child.classList.contains('w-max')) {
           td.style.width = '40%';
           td.style.textAlign = 'center';
           td.style.verticalAlign = 'bottom';
        } else {
           td.style.width = '60%';
           td.style.verticalAlign = 'bottom';
        }
        td.innerHTML = child.innerHTML;
        tr.appendChild(td);
      });
      table.appendChild(tr);
      sig.replaceWith(table);
    });

    const htmlContent = clone.innerHTML;
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Dokumen</title>
        <style>
          body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; color: black; }
          @page WordSection1 {
            size: ${docSettings.paperSize === 'F4' ? '8.5in 13in' : '8.27in 11.69in'};
            margin: ${docSettings.marginTop}mm ${docSettings.marginRight}mm ${docSettings.marginBottom}mm ${docSettings.marginLeft}mm;
            mso-page-orientation: portrait;
            mso-header-margin: 35.4pt;
            mso-footer-margin: 35.4pt;
          }
          div.WordSection1 { page: WordSection1; }
          a { color: #1d4ed8; text-decoration: underline; }
          
          /* Tailwind to MS Word CSS Mapping */
          table { width: 100%; border-collapse: collapse; margin-bottom: 1em; }
          table.border-collapse td, table.border-collapse th { border: 1px solid black; padding: 4px; vertical-align: top; }
          .font-bold, font-semibold { font-weight: bold; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .text-justify { text-align: justify; }
          .uppercase { text-transform: uppercase; }
          .italic { font-style: italic; }
          .underline { text-decoration: underline; }
          .mb-2 { margin-bottom: 0.5rem; }
          .mb-4 { margin-bottom: 1rem; }
          .mb-6 { margin-bottom: 1.5rem; }
          .mt-2 { margin-top: 0.5rem; }
          .mt-4 { margin-top: 1rem; }
          .mt-8 { margin-top: 2rem; }
          .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
          .p-1 { padding: 4px; }
          .pl-4 { padding-left: 1rem; }
          .pl-8 { padding-left: 2rem; }
          .w-full { width: 100%; }
          .w-8 { width: 2rem; }
          .w-20 { width: 5rem; }
          .w-48 { width: 12rem; }
          .space-y-1 > * + * { margin-top: 0.25rem; }
          .space-y-2 > * + * { margin-top: 0.5rem; }
          .space-y-3 > * + * { margin-top: 0.75rem; }
          .space-y-4 > * + * { margin-top: 1rem; }
          .bg-slate-100 { background-color: #f1f5f9; }
          .grid-cols-2 > div { width: 48%; display: inline-block; vertical-align: top; margin: 1%; box-sizing: border-box; }
          img { max-width: 100%; height: auto; }
          ul.list-disc { margin-left: 1.5rem; }
          .break-before-page { page-break-before: always; }
          
          /* Remove print hidden elements */
          .print\\:hidden { display: none !important; }
        </style>
      </head>
      <body>
        <div class="WordSection1">
          ${htmlContent}
        </div>
      </body>
    </html>`;
    const blob = new Blob(['\ufeff', header], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Dokumen_${activeDocPreview}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Document Generation Action Center */}
              {(hpsValue || isHpsExemptSelected) && (
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 space-y-4">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Informasi Surat &amp; Penetapan</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">Lengkapi informasi di bawah ini agar sesuai dengan paket yang dikerjakan sebelum dicetak.</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Lokasi Pekerjaan / Tujuan</label>
                      <input type="text" value={packageMetadata.lokasi_pekerjaan} onChange={(e) => setPackageMetadata({...packageMetadata, lokasi_pekerjaan: e.target.value})} placeholder={`Contoh: Kantor ${currentUser?.department || 'Kecamatan'}`} className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Waktu Pelaksanaan</label>
                      <input type="text" value={packageMetadata.waktu_penyelesaian} onChange={(e) => setPackageMetadata({...packageMetadata, waktu_penyelesaian: e.target.value})} placeholder="Contoh: 14 (empat belas) hari kalender" className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nomor Program</label>
                      <input type="text" value={packageMetadata.nomor_program || ''} onChange={(e) => setPackageMetadata({...packageMetadata, nomor_program: e.target.value})} placeholder="Contoh: 7.01..." className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nama Program</label>
                      <input type="text" value={packageMetadata.program} onChange={(e) => setPackageMetadata({...packageMetadata, program: e.target.value})} placeholder="Nama Program" className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nomor Kegiatan</label>
                      <input type="text" value={packageMetadata.nomor_kegiatan || ''} onChange={(e) => setPackageMetadata({...packageMetadata, nomor_kegiatan: e.target.value})} placeholder="Contoh: 7.01.03..." className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nama Kegiatan</label>
                      <input type="text" value={packageMetadata.kegiatan} onChange={(e) => setPackageMetadata({...packageMetadata, kegiatan: e.target.value})} placeholder="Nama Kegiatan" className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nomor Sub Kegiatan</label>
                      <input type="text" value={packageMetadata.nomor_sub_kegiatan || ''} onChange={(e) => setPackageMetadata({...packageMetadata, nomor_sub_kegiatan: e.target.value})} placeholder="Contoh: 7.01.03..." className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nama Sub Kegiatan</label>
                      <input type="text" value={packageMetadata.sub_kegiatan} onChange={(e) => setPackageMetadata({...packageMetadata, sub_kegiatan: e.target.value})} placeholder="Nama Sub Kegiatan" className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Sumber Dana</label>
                      <input type="text" value={packageMetadata.sumber_dana || ''} onChange={(e) => setPackageMetadata({...packageMetadata, sumber_dana: e.target.value})} placeholder="Sumber Dana" className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nomor DPP (Manual)</label>
                      <input type="text" value={packageMetadata.nomor_dpp || ''} onChange={(e) => setPackageMetadata({...packageMetadata, nomor_dpp: e.target.value})} placeholder="Opsional (Kosongi jika otomatis)" className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tanggal DPP</label>
                      <input type="date" value={packageMetadata.tanggal_dpp || ''} onChange={(e) => setPackageMetadata({...packageMetadata, tanggal_dpp: e.target.value})} className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nomor Nota Dinas (Manual)</label>
                      <input type="text" value={packageMetadata.nomor_nd || ''} onChange={(e) => setPackageMetadata({...packageMetadata, nomor_nd: e.target.value})} placeholder="Opsional (Kosongi jika otomatis)" className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tanggal Nota Dinas</label>
                      <input type="date" value={packageMetadata.tanggal_nd || ''} onChange={(e) => setPackageMetadata({...packageMetadata, tanggal_nd: e.target.value})} className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none transition-colors" />
                    </div>
                  </div>

                  {/* Pemilihan Template DPP */}
                  <div className="mb-6 p-4 border rounded-xl bg-blue-50 border-blue-200">
                    <div className="font-bold text-blue-900 text-sm mb-3 flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-blue-700" />
                      <span>Pilih Template Dokumen Persiapan Pengadaan (DPP)</span>
                    </div>
                    
                    <select
                      value={selectedTplId || ''}
                      onChange={(e) => setSelectedTplId(e.target.value)}
                      className="w-full bg-white text-xs px-3 py-2.5 border border-blue-300 rounded-lg focus:border-indigo-500 outline-none transition-colors"
                    >
                      <option value="">-- Pilih Manual atau Biarkan Otomatis --</option>
                      {(() => {
                          try {
                            const tStr = localStorage.getItem('pbj_templates');
                            let tpls = tStr ? JSON.parse(tStr) : [];
                            if (!tpls || tpls.length === 0) {
                              tpls = DEFAULT_TEMPLATES.filter(t => t.category === 'Tahap Persiapan');
                            }
                            return tpls.map(t => (
                              <option key={t.id} value={t.id}>{t.name} ({t.id})</option>
                            ));
                          } catch(e) { return null; }
                      })()}
                    </select>

                  </div>

                  {/* Pengaturan Khusus Kerangka Surat DPP (AI Assisted) */}
                  <div className="mb-6 p-4 border rounded-xl bg-indigo-50/50 border-indigo-200">
                    <div className="font-bold text-indigo-900 text-sm mb-4 flex items-center gap-2">
                      <Wand2 className="w-5 h-5 text-indigo-600" />
                      <span>Pengaturan Spesifik DPP & Refinement AI</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Spesifikasi Layanan Tambahan</label>
                          <button onClick={() => enhanceDPPTextWithAI('spesifikasiLayanan', dppSpecs.spesifikasiLayanan)} disabled={isEnhancingDPP['spesifikasiLayanan']} className="text-[9px] font-bold bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200 transition-colors flex items-center gap-1 disabled:opacity-50">
                            {isEnhancingDPP['spesifikasiLayanan'] ? '✨ Merapikan...' : '✨ Rapikan Bahasa (AI)'}
                          </button>
                        </div>
                        <textarea value={dppSpecs.spesifikasiLayanan || ''} onChange={(e) => setDppSpecs({...dppSpecs, spesifikasiLayanan: e.target.value})} placeholder="Contoh: Barang harus diantar beserta teknisi..." className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none min-h-[60px] resize-y"></textarea>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Justifikasi Pemilihan Merek</label>
                          <button onClick={() => enhanceDPPTextWithAI('justifikasiMerek', dppSpecs.justifikasiMerek)} disabled={isEnhancingDPP['justifikasiMerek']} className="text-[9px] font-bold bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200 transition-colors flex items-center gap-1 disabled:opacity-50">
                            {isEnhancingDPP['justifikasiMerek'] ? '✨ Merapikan...' : '✨ Rapikan Bahasa (AI)'}
                          </button>
                        </div>
                        <textarea value={dppSpecs.justifikasiMerek || ''} onChange={(e) => setDppSpecs({...dppSpecs, justifikasiMerek: e.target.value})} placeholder="Contoh: Merek ini sudah teruji kompatibilitasnya..." className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none min-h-[60px] resize-y"></textarea>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 pointer-events-auto">
                    {!isHpsExemptSelected && (
                      <button
                        onClick={() => setActiveDocPreview('hps')}
                        className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 px-5 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
                      >
                        Lihat Surat Penetapan HPS
                      </button>
                    )}
                    <button
                      onClick={() => setActiveDocPreview('nd')}
                      className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 px-5 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
                    >
                      Lihat Nota Dinas
                    </button>
                    <button
                      onClick={() => setActiveDocPreview('dpp')}
                      className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 px-5 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
                    >
                      Lihat Dokumen DPP PPK
                    </button>
                  </div>
                  
                  {/* Action Buttons Step 4 */}
                  <div className="flex justify-end mt-8 border-t border-slate-200 pt-6 print:hidden">
                    <button
                      onClick={() => setStep(5)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-2"
                    >
                      Lanjut ke TTE & Pengiriman &rarr;
                    </button>
                  </div>
                  </div>
              )}

      {/* DOCUMENT PREVIEW MODAL (A4 PAPER SIMULATION & HIGH-FIDELITY PRINT-READY VIEW) */}
      {activeDocPreview && selectedPack && createPortal(
        <div id="print-modal-parent" style={{ backgroundColor: 'rgba(15, 23, 42, 0.95)' }} className="fixed inset-0 backdrop-blur-md z-50 flex flex-col items-center overflow-y-auto p-4 animate-fade-in print:p-0 print:bg-white">

          {/* Style Injector to override print layout strictly for A4/F4 format */}
          <style dangerouslySetInnerHTML={{
            __html: `
            @media print {
              html, body {
                background: white !important;
                margin: 0 !important;
                padding: 0 !important;
                height: auto !important;
                overflow: visible !important;
              }
              
              body > #root {
                display: none !important;
              }
              
              body > #print-modal-parent {
                display: block !important;
                position: static !important;
                width: 100% !important;
                height: auto !important;
                overflow: visible !important;
                background: transparent !important;
                padding: 0 !important;
                margin: 0 !important;
                box-shadow: none !important;
                border: none !important;
                backdrop-filter: none !important;
              }
              
              .print\\:hidden {
                display: none !important;
                visibility: hidden !important;
              }
              
              #print-sheet {
                display: block !important;
                position: relative !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                box-shadow: none !important;
                border: none !important;
                min-height: auto !important;
                background: white !important;
              }
              
              /* Table formatting & pagination breaks */
              table {
                width: 100% !important;
                border-collapse: collapse !important;
                page-break-inside: auto !important;
                font-size: calc(1em - 1pt) !important;
              }
              tr {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              td, th {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              
              /* Prevent orphan headers */
              h1, h2, h3, h4, h5, h6 {
                page-break-after: avoid !important;
                break-after: avoid !important;
              }
              
              /* Avoid splitting signature blocks and table rows */
              .signature-section, tr {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              
              .break-before-page {
                page-break-before: always !important;
                break-before: page !important;
              }
              
              /* Hide scrollbars during print */
              ::-webkit-scrollbar {
                display: none !important;
              }
              
              @page {
                size: ${docSettings.paperSize === 'F4' ? '215mm 330mm' : 'A4'} portrait; 
                margin: ${docSettings.marginTop}mm ${docSettings.marginRight}mm ${docSettings.marginBottom}mm ${docSettings.marginLeft}mm !important; 
              }
            }
          `}} />
          <div className="fixed top-4 left-4 right-4 flex justify-between items-center z-50 bg-white/95 border border-slate-200/90 px-6 py-3.5 rounded-2xl shadow-2xl backdrop-blur-md max-w-7xl mx-auto print:hidden transition-all duration-300">
            <div className="text-slate-800 text-[11px] font-bold uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-800 animate-pulse"></span>
              Pratinjau Dokumen Resmi {activeDocPreview === 'hps' ? 'Surat Penetapan HPS' : activeDocPreview === 'nd' ? 'Nota Dinas Usulan' : 'Dokumen Persiapan Pengadaan (DPP)'}
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => window.location.href = '/admin/templates'}
                className="bg-sky-100 hover:bg-sky-200 text-sky-800 font-bold text-xs px-4 py-2 rounded-xl border border-sky-300 shadow-sm transition-all flex items-center gap-1.5"
                title="Atur Logo dan Kop Surat secara global"
              >
                <Settings className="w-4 h-4 text-sky-800" />
                <span>Pengaturan Kop &amp; Logo</span>
              </button>
              <button
                onClick={() => window.print()}
                className="bg-emerald-600 hover:bg-emerald-750 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-600/10"
              >
                <Printer className="w-4 h-4 text-white" />
                <span>Cetak / Unduh PDF</span>
              </button>
              <button
                onClick={handleExportWord}
                className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4 text-white" />
                <span>Export Word (.doc)</span>
              </button>
              <button
                onClick={() => setActiveDocPreview(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition-all border border-slate-200 flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                Tutup
              </button>
            </div>
          </div>

          {/* White Paper A4 Sheet */}
          <div
 id="print-sheet"

 className="bg-white text-slate-900 w-full shadow-2xl rounded-sm my-20 border border-slate-200 relative print:my-0 print:border-none print:shadow-none mx-auto flex-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-4 transition-shadow"
 style={{
 width: docSettings.paperSize === 'F4' ? '215mm' : '210mm',
 minHeight: docSettings.paperSize === 'F4' ? '330mm' : '297mm',
 paddingTop: `${docSettings.marginTop}mm`,
 paddingRight: `${docSettings.marginRight}mm`,
 paddingBottom: `${docSettings.marginBottom}mm`,
 paddingLeft: `${docSettings.marginLeft}mm`,
 fontFamily: docSettings.fontFamily === 'Bookman Old Style' 
 ? "'Bookman Old Style', Georgia, serif" 
 : docSettings.fontFamily === 'Arial' 
 ? "Arial, Helvetica, sans-serif" 
 : "'Times New Roman', Times, serif",
 fontSize: docSettings.fontSize || '12pt',
 lineHeight: docSettings.lineHeight || '1.15'
 }}
 >
 <div>
 {/* KOP SURAT DINAS / SATKER */}
 {docSettings.showKop && (
 <div className="w-full mb-6" style={{ pageBreakInside: 'avoid', fontFamily: '"Times New Roman", Times, serif' }}>
 <table className="no-border" style={{ width: '100%', borderCollapse: 'collapse', borderBottom: '3px solid black', marginBottom: '2px' }}>
 <tbody>
 <tr>
 <td style={{ width: '15%', verticalAlign: 'middle', textAlign: 'center', paddingBottom: '10px' }}>
 <img 
 className="logo-instansi"
 src={docSettings.logoType === 'pemda' ? "https://upload.wikimedia.org/wikipedia/commons/2/25/Lambang_Kabupaten_Probolinggo.png" : docSettings.logoType === 'garuda' ? "https://upload.wikimedia.org/wikipedia/commons/2/29/Garuda_Pancasila_Coat_of_Arms_of_Indonesia.svg" : docSettings.customLogo ? docSettings.customLogo : "https://upload.wikimedia.org/wikipedia/commons/2/25/Lambang_Kabupaten_Probolinggo.png"}
 alt="Logo Instansi" 
 style={{ maxHeight: '76px', maxWidth: '76px', objectFit: 'contain', display: 'inline-block' }} 
 />
 </td>
 <td style={{ width: '85%', textAlign: 'center', verticalAlign: 'middle', paddingBottom: '10px' }}>
 <div style={{ fontWeight: 'bold', fontSize: '14pt', textTransform: 'uppercase', lineHeight: '1.2' }}>{docSettings.namaPemda}</div>
 <div style={{ fontWeight: 'bold', fontSize: '18pt', textTransform: 'uppercase', lineHeight: '1.2' }}>{docSettings.namaInstansi}</div>
 <div style={{ fontSize: '10pt', marginTop: '4px', fontStyle: 'italic' }}>{docSettings.alamatLengkap}</div>
 </td>
 </tr>
 </tbody>
 </table>
 <div style={{ width: '100%', borderBottom: '1px solid black' }}></div>
 </div>
 )}

 {/* DOCUMENT CONTENT */}
 {activeDocPreview === 'hps' ? (
 // SURAT PENETAPAN HPS
 <div className="space-y-4">
 <div className="text-center font-bold uppercase underline text-[13pt] tracking-wide mt-2">
 Keputusan Pejabat Pembuat Komitmen
 </div>
 <div className="text-center font-bold font-sans -mt-3 text-slate-700">
 NOMOR: 027 / 142 / PPK / 437.82 / {new Date().getFullYear()}
 </div>
 <div className="text-center font-bold uppercase tracking-wider -mt-1">
 TENTANG<br />
 PENETAPAN HARGA PERKIRAAN SENDIRI (HPS)
 </div>
 <div className="text-center font-bold uppercase text-slate-800">
 PEKERJAAN: "{selectedPack?.packName}"
 </div>

 <div className="pt-4 space-y-3">
 <p className="text-justify">
 Menimbang bahwa untuk melaksanakan ketentuan Pasal 26 Peraturan Presiden Nomor 12 Tahun 2021 tentang Perubahan atas Peraturan Presiden Nomor 16 Tahun 2018 tentang Pengadaan Barang/Jasa Pemerintah, Pejabat Pembuat Komitmen (PPK) berkewajiban untuk menyusun dan menetapkan Harga Perkiraan Sendiri (HPS).
 </p>
 <p className="text-justify">
 Mengingat Dokumen Pelaksanaan Anggaran (DPA) Nomor: DPA/A.1/1.02.01/2026 yang bersumber dari Anggaran Pendapatan dan Belanja Daerah (APBD) Kabupaten Probolinggo Tahun Anggaran {new Date().getFullYear()}.
 </p>
 <div className="text-center font-bold uppercase py-2">MEMUTUSKAN:</div>

 <div className="pl-6 relative">
 <div className="absolute left-0 top-0 font-bold">KEDUA:</div>
 <p className="text-justify pl-1">
 Menetapkan Nilai Harga Perkiraan Sendiri (HPS) untuk pekerjaan pengadaan di bawah ini:
 </p>
 </div>

 {/* Table HPS */}
 <div className="pt-2">
 <table className="w-full border-collapse border border-slate-900 ">
 <thead>
 <tr className="bg-slate-100 font-bold text-center">
 <td className="border border-slate-900 p-2 w-8">No</td>
 <td className="border border-slate-900 p-2 text-left">Nama Barang / Uraian Rincian DPA</td>
 <td className="border border-slate-900 p-2 w-16">Jumlah</td>
 <td className="border border-slate-900 p-2 w-20">Satuan</td>
 <td className="border border-slate-900 p-2">Harga / Satuan (Rp)</td>
 <td className="border border-slate-900 p-2">Harga Total HPS (Rp)</td>
 </tr>
 </thead>
 <tbody>
 {getPackageItems(selectedPack).filter(item => (item.qty === '' ? 0 : (item.qty || 0)) > 0).map((item, idx) => {
 const unitHpsPrice = hpsPrices[item.name] !== undefined ? hpsPrices[item.name] : item.price;
 const surveyProduct = surveyData?.products?.find(p => p.name === item.name);
 const displayName = surveyProduct?.name || item.name;
 return (
 <tr key={item.no}>
 <td className="border border-slate-900 p-2 text-center">{item.no}</td>
 <td className="border border-slate-900 p-2 text-left font-medium">{displayName}</td>
 <td className="border border-slate-900 p-2 text-center font-bold">{item.qty}</td>
 <td className="border border-slate-900 p-2 text-center">{item.unit}</td>
 <td className="border border-slate-900 p-2 font-mono text-right">
   {unitHpsPrice.toLocaleString()}
 </td>
 <td className="border border-slate-900 p-2 font-mono font-bold text-right">
   {(item.qty * unitHpsPrice).toLocaleString()}
 </td>
 </tr>
 );
 })}
 <tr className="bg-slate-50 font-bold">
 <td colSpan="5" className="border border-slate-900 p-2 text-right">Jumlah Total Nilai HPS (Termasuk PPN & Pajak):</td>
 <td className="border border-slate-900 p-2 text-indigo-700 font-mono font-bold text-right">
   {parseInt(hpsValue).toLocaleString()}
 </td>
 </tr>
 </tbody>
 </table>
 </div>

 <p className="font-semibold italic bg-slate-100 p-2 rounded-sm border border-slate-300">
 Terbilang: "{terbilang(hpsValue)} Rupiah"
 </p>

 <p className="text-justify">
 HPS ini disusun secara kalkulatif dengan keahlian yang dapat dipertanggungjawabkan serta berdasarkan survei harga pasar riil di wilayah Kabupaten Probolinggo demi tercapainya asas efisiensi, efektivitas, transparansi, dan akuntabilitas keuangan daerah.
 </p>
 </div>
 </div>
 ) : activeDocPreview === 'nd' ? (
 // NOTA DINAS USULAN PENGADAAN
 <div className="space-y-4 relative">
 {(() => {
 const templatesStr = localStorage.getItem('pbj_templates');
 let templates = [];
 try { if (templatesStr) templates = JSON.parse(templatesStr); } catch (e) {}
 if (!templates || templates.length === 0) templates = DEFAULT_TEMPLATES;
 
 const ndTemplate = templates.find(t => t.id === selectedNdTplId) || templates.find(t => t.id === 'TPL-001');
 
 if (ndTemplate) {
 let content = ndTemplate.content;
 
 // Add centered title for default Nota Dinas
 if (ndTemplate.id === 'TPL-001' && !content.includes('NOTA DINAS')) {
    const dynamicNd = packageMetadata.nomor_nd || '{{nomor_nd}}';
    content = `<div class="text-center mb-6"><div class="font-bold text-lg underline leading-none mb-1">NOTA DINAS</div><div class="leading-none">Nomor : ${dynamicNd}</div></div>\n` + content;
 }
 
 // Force remove legacy signature block from cached templates to prevent duplication
 content = content.replace(/Pejabat Pembuat Komitmen \(PPK\),?[\s\S]*?\{\{nama_ppk\}\}[\s\S]*?NIP\. \{\{nip_ppk\}\}/gi, '');

 const currentDocSettingsStr = localStorage.getItem('pbj_doc_settings');
 const docSettingsFallback = currentDocSettingsStr ? JSON.parse(currentDocSettingsStr) : null;
 const nomorBase = docSettingsFallback ? (docSettingsFallback.formatNomorSurat || '027/{nomor}/BPBJ/2026') : '027/{nomor}/BPBJ/2026';
 
 const isBesuk = currentUser?.department?.toLowerCase().includes('besuk');
 const defaultAlamat = isBesuk ? 'Jl. Raya Besuk Nomor 37 Besuk Probolinggo - 67283' : (docSettingsFallback?.alamatLengkap || 'Komplek Perkantoran Pemerintah Daerah');
 const defaultTempat = isBesuk ? 'Besuk' : (currentUser?.department || 'Probolinggo');

 // Replace variables
 const replacements = {
 '{{nama_satker}}': currentUser?.department || 'Bagian Pengadaan Barang dan Jasa (BPBJ)',
 '{{nama_satker_kapital}}': (currentUser?.department || 'Bagian Pengadaan Barang dan Jasa (BPBJ)').toUpperCase(),
 '{{alamat_satker}}': docSettingsFallback ? docSettingsFallback.alamatLengkap : defaultAlamat,
 '{{nama_pekerjaan}}': (selectedPack.packName || '').replace(/\n/g, ' '),
 '{{nilai_pagu}}': `Rp ${(selectedPack.pagu || 0).toLocaleString()} (${terbilang(selectedPack.pagu || 0)} Rupiah)`,
 '{{sumber_dana}}': `${packageMetadata.sumber_dana || selectedPack.sumberDana || 'APBD'} Tahun Anggaran ${new Date().getFullYear()}`,
 '{{tahun_anggaran}}': `${new Date().getFullYear()}`,
 '{{nama_ppk}}': currentUser?.name || '',
 '{{nip_ppk}}': currentUser?.nip || '',
 '{{nomor_surat}}': nomorBase.replace('{nomor}', '045.2'),
 '{{nomor_nd}}': nomorBase.replace('{nomor}', '011/ND'),
 '{{nama_penyedia}}': '_______________________',
 '{{hari_tanggal_acara}}': '_______________________',
 '{{waktu_acara}}': '_______________________',
 '{{tempat_acara}}': '_______________________',
 '{{nama_pejabat_pengadaan}}': '_______________________',
 '{{nip_pejabat_pengadaan}}': '_______________________',
 '{{nomor_ba}}': nomorBase.replace('{nomor}', '108/BAKN'),
 '{{hari_ba}}': '_______________________',
 '{{tanggal_ba}}': '_______________________',
 '{{harga_penawaran}}': '_______________________',
 '{{harga_negosiasi}}': '_______________________',
 '{{nomor_bahp}}': nomorBase.replace('{nomor}', '112/BAHP'),
 '{{nilai_hps}}': '_______________________',
 '{{nama_penyedia_terpilih}}': '_______________________',
 '{{harga_final}}': '_______________________',
 '{{tempat_penetapan}}': defaultTempat,
 '{{nomor_sp}}': nomorBase.replace('{nomor}', '115/SP'),
 '{{alamat_penyedia}}': '_______________________',
 '{{nilai_kontrak}}': '_______________________',
 '{{waktu_penyelesaian}}': packageMetadata.waktu_penyelesaian || '14 (empat belas) hari kalender',
 '{{nomor_dpp}}': packageMetadata.nomor_dpp || '................................',
 '{{tanggal_dpp}}': new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
 '{{nomor_hps}}': nomorBase.replace('{nomor}', '014/HPS'),
 '{{tanggal_hps}}': new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
 '{{lokasi_pekerjaan}}': packageMetadata.lokasi_pekerjaan || (docSettingsFallback ? docSettingsFallback.namaInstansi : 'Komplek Perkantoran Pemerintah Daerah'),
 '{{program}}': packageMetadata.program || 'Program Penunjang Urusan Pemerintahan Daerah',
 '{{kegiatan}}': packageMetadata.kegiatan || 'Penyelenggaraan Pemerintahan dan Pelayanan Publik',
 '{{sub_kegiatan}}': packageMetadata.sub_kegiatan || 'Penyediaan Barang dan Jasa Perkantoran',
 '{{mak}}': selectedPack.mak || '',
 '{{pdn}}': 'Ya',
 '{{usaha_kecil}}': 'Ya',
 '{{pra_dipa}}': selectedPack.praDipa ? 'Ya' : 'Tidak',
 '{{volume_pekerjaan}}': selectedPack.volume || '1 Paket',
 '{{uraian_pekerjaan}}': `Pengadaan ${selectedPack.packName || ''} untuk operasional`,
 '{{kode_rup}}': selectedPack.noSirup || selectedPack.idPaket || '-'
 };
 
 Object.keys(replacements).forEach(key => {
 content = content.replace(new RegExp(key, 'g'), replacements[key]);
 });
 
  if (docSettings?.signatureMethodPpk === 'tte' && currentUser?.nip) {
    const tteBadgeSrc = getTteBadge(currentUser?.name || 'PPK', currentUser?.nip);
    const imgHtml = `<img src="${tteBadgeSrc}" alt="TTE PPK" style="display:block; max-height:85px; margin-top:6px; margin-bottom:4px;" />`;
    content = injectSignatureHelper(content, currentUser?.name, currentUser?.nip, imgHtml);
  } else if (docSettings && docSettings.ttdPpk) {
    if (currentUser?.nip) {
      const ttdPpkStyle = 'display:block; max-height:85px; max-width:250px; width:auto; height:auto; object-fit:contain; mix-blend-mode:multiply; margin-top:6px; margin-bottom:4px; filter:contrast(1.2);';
      const imgHtml = `<img src="${docSettings.ttdPpk}" alt="TTD PPK" style="${ttdPpkStyle}" />`;
      content = injectSignatureHelper(content, currentUser?.name, currentUser?.nip, imgHtml);
    } else {
      content = content.replace(/Pejabat Pembuat Komitmen,/g, `Pejabat Pembuat Komitmen,<br/><img src="${docSettings.ttdPpk}" alt="TTD PPK" style="display:block; max-height:85px; max-width:250px; width:auto; height:auto; object-fit:contain; mix-blend-mode:multiply; margin-top:6px; margin-bottom:4px; filter:contrast(1.2);" />`);
    }
  }

  if (docSettings?.signatureMethodPp === 'tte' && replacements['{{nip_pejabat_pengadaan}}'] && replacements['{{nip_pejabat_pengadaan}}'] !== '_______________________') {
    const ppName = replacements['{{nama_pejabat_pengadaan}}'];
    const ppNip = replacements['{{nip_pejabat_pengadaan}}'];
    const tteBadgeSrc = getTteBadge(ppName || 'Pejabat Pengadaan', ppNip);
    const imgHtml = `<img src="${tteBadgeSrc}" alt="TTE PP" style="display:block; max-height:85px; margin-top:6px; margin-bottom:4px;" />`;
    content = injectSignatureHelper(content, ppName, ppNip, imgHtml);
  } else if (docSettings?.ttdPp && replacements['{{nip_pejabat_pengadaan}}'] && replacements['{{nip_pejabat_pengadaan}}'] !== '_______________________') {
    const ppName = replacements['{{nama_pejabat_pengadaan}}'];
    const ppNip = replacements['{{nip_pejabat_pengadaan}}'];
    const imgHtml = `<img src="${docSettings.ttdPp}" alt="TTD PP" style="display:block; max-height:85px; max-width:250px; width:auto; height:auto; object-fit:contain; mix-blend-mode:multiply; margin-top:6px; margin-bottom:4px; filter:contrast(1.2);" />`;
    content = injectSignatureHelper(content, ppName, ppNip, imgHtml);
  }
 
 return <div style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', textAlign: 'justify', fontSize: '12pt', fontFamily: 'Arial, sans-serif' }} dangerouslySetInnerHTML={{ __html: parseSmartColons(content) }} />;
 }
 return <div className="text-center py-10">Template Nota Dinas tidak ditemukan.</div>;
 })()}
 </div>
 ) : (
 // DOKUMEN PERSIAPAN PENGADAAN (DPP)
 <div className="space-y-4 relative">
 {/* KOP SURAT DIHAPUS - KOP SURAT GLOBAL SUDAH ADA DI ATAS */}

 {(() => {
 const templatesStr = localStorage.getItem('pbj_templates');
 let templates = [];
 try { if (templatesStr) templates = JSON.parse(templatesStr); } catch (e) {}
 if (!templates || templates.length === 0) templates = DEFAULT_TEMPLATES;

 const cat = getPacketCategory(selectedPack?.packName || '');
 let tplId = 'TPL-006A';
 if (cat === 'Mamin') tplId = 'TPL-006B';
 else if (cat === 'Modal') tplId = 'TPL-006C';
 else if (cat === 'Jasa' || cat === 'Konstruksi') tplId = 'TPL-006D';
 else if (cat === 'Konsolidasi') tplId = 'TPL-006E';

 const template = templates.find(t => t.id === selectedTplId) || templates.find(t => t.id === tplId);
 
 if (template && template.content.includes('{{komponen_dinamis_dpp}}')) {
 // Template parsing logic
 let content = template.content;
 
 // Center the DPP title and Nomor
 content = content.replace(/DOKUMEN PERSIAPAN PENGADAAN \(DPP\)\s*Nomor : \{\{nomor_dpp\}\}/i, '<div class="text-center mb-6"><div class="font-bold text-lg underline leading-none mb-1">DOKUMEN PERSIAPAN PENGADAAN (DPP)</div><div class="leading-none mb-2">Nomor : {{nomor_dpp}}</div></div>');
 
 const currentDocSettingsStr = localStorage.getItem('pbj_doc_settings');
 const docSettingsFallback = currentDocSettingsStr ? JSON.parse(currentDocSettingsStr) : null;
 const nomorBase = docSettingsFallback ? (docSettingsFallback.formatNomorSurat || '027/{nomor}/BPBJ/2026') : '027/{nomor}/BPBJ/2026';
 const isBesuk = currentUser?.department?.toLowerCase().includes('besuk');
 const defaultAlamat = isBesuk ? 'Jl. Raya Besuk Nomor 37 Besuk Probolinggo - 67283' : (docSettingsFallback?.alamatLengkap || 'Komplek Perkantoran Pemerintah Daerah');
 const defaultTempat = isBesuk ? 'Besuk' : (currentUser?.department || 'Probolinggo');

 // Replace variables
 const replacements = {
 '{{nama_satker}}': currentUser?.department || 'Bagian Pengadaan Barang dan Jasa (BPBJ)',
 '{{nama_satker_kapital}}': (currentUser?.department || 'Bagian Pengadaan Barang dan Jasa (BPBJ)').toUpperCase(),
 '{{alamat_satker}}': docSettingsFallback ? docSettingsFallback.alamatLengkap : defaultAlamat,
 '{{nama_pekerjaan}}': (selectedPack.packName || '').replace(/\n/g, ' '),
 '{{nilai_pagu}}': `Rp ${(selectedPack.pagu || 0).toLocaleString()} (${terbilang(selectedPack.pagu || 0)} Rupiah)`,
 '{{sumber_dana}}': `${packageMetadata.sumber_dana || selectedPack.sumberDana || 'APBD'} Tahun Anggaran ${new Date().getFullYear()}`,
 '{{tahun_anggaran}}': `${new Date().getFullYear()}`,
 '{{nama_ppk}}': currentUser?.name || '',
 '{{nip_ppk}}': currentUser?.nip || '',
 '{{nomor_surat}}': nomorBase.replace('{nomor}', '045.2'),
 '{{nomor_nd}}': nomorBase.replace('{nomor}', '011/ND'),
 '{{nama_penyedia}}': '_______________________',
 '{{hari_tanggal_acara}}': '_______________________',
 '{{waktu_acara}}': '_______________________',
 '{{tempat_acara}}': '_______________________',
 '{{nama_pejabat_pengadaan}}': '_______________________',
 '{{nip_pejabat_pengadaan}}': '_______________________',
 '{{nomor_ba}}': nomorBase.replace('{nomor}', '108/BAKN'),
 '{{hari_ba}}': '_______________________',
 '{{tanggal_ba}}': '_______________________',
 '{{harga_penawaran}}': '_______________________',
 '{{harga_negosiasi}}': '_______________________',
 '{{nomor_bahp}}': nomorBase.replace('{nomor}', '112/BAHP'),
 '{{nilai_hps}}': '_______________________',
 '{{nama_penyedia_terpilih}}': '_______________________',
 '{{harga_final}}': '_______________________',
 '{{tempat_penetapan}}': defaultTempat,
 '{{nomor_sp}}': nomorBase.replace('{nomor}', '115/SP'),
 '{{alamat_penyedia}}': '_______________________',
 '{{nilai_kontrak}}': '_______________________',
 '{{waktu_penyelesaian}}': packageMetadata.waktu_penyelesaian || '14 (empat belas) hari kalender',
 '{{nomor_dpp}}': packageMetadata.nomor_dpp || '................................',
 '{{tanggal_dpp}}': new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
 '{{nomor_hps}}': nomorBase.replace('{nomor}', '014/HPS'),
 '{{tanggal_hps}}': new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
 '{{lokasi_pekerjaan}}': packageMetadata.lokasi_pekerjaan || (docSettingsFallback ? docSettingsFallback.namaInstansi : 'Komplek Perkantoran Pemerintah Daerah'),
 '{{program}}': packageMetadata.program || 'Program Penunjang Urusan Pemerintahan Daerah',
 '{{kegiatan}}': packageMetadata.kegiatan || 'Penyelenggaraan Pemerintahan dan Pelayanan Publik',
 '{{sub_kegiatan}}': packageMetadata.sub_kegiatan || 'Penyediaan Barang dan Jasa Perkantoran',
 '{{mak}}': selectedPack.mak || '',
 '{{pdn}}': 'Ya',
 '{{usaha_kecil}}': 'Ya',
 '{{pra_dipa}}': selectedPack.praDipa ? 'Ya' : 'Tidak',
 '{{volume_pekerjaan}}': selectedPack.volume || '1 Paket',
 '{{uraian_pekerjaan}}': `Pengadaan ${selectedPack.packName || ''} untuk operasional`,
 '{{kode_rup}}': selectedPack.noSirup || selectedPack.idPaket || '-'
 };

 Object.keys(replacements).forEach(key => {
 content = content.replace(new RegExp(key, 'g'), replacements[key]);
 });

 // Inject PPK and PP Signatures
  if (docSettings?.signatureMethodPpk === 'tte' && currentUser?.nip) {
    const tteBadgeSrc = getTteBadge(currentUser?.name || 'PPK', currentUser?.nip);
    const imgHtml = `<img src="${tteBadgeSrc}" alt="TTE PPK" style="display:block; max-height:85px; margin-top:6px; margin-bottom:4px;" />`;
    content = injectSignatureHelper(content, currentUser?.name, currentUser?.nip, imgHtml);
  } else if (docSettings && docSettings.ttdPpk) {
    if (currentUser?.nip) {
      const ttdPpkStyle = 'display:block; max-height:85px; max-width:250px; width:auto; height:auto; object-fit:contain; mix-blend-mode:multiply; margin-top:6px; margin-bottom:4px; filter:contrast(1.2);';
      const imgHtml = `<img src="${docSettings.ttdPpk}" alt="TTD PPK" style="${ttdPpkStyle}" />`;
      content = injectSignatureHelper(content, currentUser?.name, currentUser?.nip, imgHtml);
    } else {
      content = content.replace(/Pejabat Pembuat Komitmen,/g, `Pejabat Pembuat Komitmen,<br/><img src="${docSettings.ttdPpk}" alt="TTD PPK" style="display:block; max-height:85px; max-width:250px; width:auto; height:auto; object-fit:contain; mix-blend-mode:multiply; margin-top:6px; margin-bottom:4px; filter:contrast(1.2);" />`);
    }
  }

  if (docSettings?.signatureMethodPp === 'tte' && replacements['{{nip_pejabat_pengadaan}}'] && replacements['{{nip_pejabat_pengadaan}}'] !== '_______________________') {
    const ppName = replacements['{{nama_pejabat_pengadaan}}'];
    const ppNip = replacements['{{nip_pejabat_pengadaan}}'];
    const tteBadgeSrc = getTteBadge(ppName || 'Pejabat Pengadaan', ppNip);
    const imgHtml = `<img src="${tteBadgeSrc}" alt="TTE PP" style="display:block; max-height:85px; margin-top:6px; margin-bottom:4px;" />`;
    content = injectSignatureHelper(content, ppName, ppNip, imgHtml);
  } else if (docSettings?.ttdPp && replacements['{{nip_pejabat_pengadaan}}'] && replacements['{{nip_pejabat_pengadaan}}'] !== '_______________________') {
    const ppName = replacements['{{nama_pejabat_pengadaan}}'];
    const ppNip = replacements['{{nip_pejabat_pengadaan}}'];
    const imgHtml = `<img src="${docSettings.ttdPp}" alt="TTD PP" style="display:block; max-height:85px; max-width:250px; width:auto; height:auto; object-fit:contain; mix-blend-mode:multiply; margin-top:6px; margin-bottom:4px; filter:contrast(1.2);" />`;
    content = injectSignatureHelper(content, ppName, ppNip, imgHtml);
  }

 const parts = content.split('{{komponen_dinamis_dpp}}');

 return (
 <>
 <div style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', textAlign: 'justify', fontSize: '12pt', fontFamily: 'Arial, sans-serif' }} dangerouslySetInnerHTML={{ __html: parseSmartColons(parts[0].trimEnd()) }} />
 
  {/* The Dynamic Components Section */}
  <div className="py-4 text-justify text-[12pt] font-['Arial',sans-serif] leading-relaxed">
    {/* BAB I */}
    
    <table className="w-full mb-4 mt-2 border-none">
      <tbody>
        <tr><td className="w-[30%] align-top border-none p-1">Nama Paket</td><td className="w-4 align-top border-none p-1">:</td><td className="align-top border-none p-1">{replacements['{{nama_pekerjaan}}']}</td></tr>
        <tr><td className="w-[30%] align-top border-none p-1">Instansi/Satuan Kerja</td><td className="w-4 align-top border-none p-1">:</td><td className="align-top border-none p-1">{replacements['{{nama_satker}}']}</td></tr>
        <tr><td className="w-[30%] align-top border-none p-1">Tahun Anggaran</td><td className="w-4 align-top border-none p-1">:</td><td className="align-top border-none p-1">{replacements['{{tahun_anggaran}}']}</td></tr>
        <tr><td className="w-[30%] align-top border-none p-1">Pagu Anggaran</td><td className="w-4 align-top border-none p-1">:</td><td className="align-top border-none p-1">{replacements['{{nilai_pagu}}']}</td></tr>
        <tr><td className="w-[30%] align-top border-none p-1">ID RUP</td><td className="w-4 align-top border-none p-1">:</td><td className="align-top border-none p-1">{replacements['{{kode_rup}}']}</td></tr>
        
      </tbody>
    </table>

    {/* BAB II */}
    <div className="font-bold uppercase mt-8 mb-2 text-center">BAB I. PRIORITAS PENGGUNAAN PRODUK DALAM NEGERI (PDN) & UMK</div>
    <p className="indent-8 mb-2 text-justify">
      Mengacu pada Pasal 66 Peraturan Presiden Nomor 16 Tahun 2018 tentang Pengadaan Barang/Jasa Pemerintah sebagaimana telah diubah dengan Peraturan Presiden Nomor 12 Tahun 2021, serta Instruksi Presiden Nomor 2 Tahun 2022, proses pengadaan ini diwajibkan untuk mengutamakan penggunaan produk dalam negeri dan memberdayakan Pelaku Usaha Mikro, Usaha Kecil, dan Koperasi. Oleh karena itu, pemilihan produk dalam proses <em>e-Purchasing</em> ini dilakukan dengan mempedomani hierarki prioritas sebagai berikut:
    </p>
    <ol className="list-decimal pl-12 mb-6 text-justify pr-4">
      <li className="pl-1 mb-1">Barang/Jasa yang memiliki nilai Tingkat Komponen Dalam Negeri (TKDN) beserta nilai Bobot Manfaat Perusahaan (BMP) paling sedikit 40% (empat puluh persen).</li>
      <li className="pl-1 mb-1">Barang/Jasa Produk Dalam Negeri (PDN) dengan nilai TKDN kurang dari 40% (empat puluh persen).</li>
      <li className="pl-1 mb-1">Barang/Jasa Produk Dalam Negeri (PDN) yang belum memiliki sertifikat TKDN namun diakui sebagai produk lokal.</li>
      <li className="pl-1 mb-1">Barang/Jasa Impor, yang pemilihannya <strong>hanya dapat dilakukan</strong> dalam hal spesifikasi teknis tidak dapat dipenuhi oleh produk dalam negeri dan/atau volume produksi nasional tidak mencukupi, dibuktikan melalui justifikasi teknis yang memadai.</li>
    </ol>

    <div className="font-bold uppercase mt-8 mb-2 text-center">BAB II. SPESIFIKASI TEKNIS E-PURCHASING</div>
    
    <div className="font-bold mt-5 mb-1">A. Identitas Barang & Spesifikasi Mutu</div>
    <table className="w-full border-collapse border border-slate-900 mb-2">
      <thead>
        <tr className="bg-slate-100 font-bold text-center">
          <td className="border border-slate-900 p-1 w-8">No</td>
          <td className="border border-slate-900 p-1">Identitas / Nama Barang & Spesifikasi Mutu</td>
          <td className="border border-slate-900 p-1 w-16">Kuantitas</td>
          <td className="border border-slate-900 p-1 w-16">Satuan</td>
        </tr>
      </thead>
      <tbody>
        {getPackageItems(selectedPack).filter(item => (item.qty === '' ? 0 : (item.qty || 0)) > 0).map((item, idx) => {
          return (
            <tr key={item.no}>
              <td className="border border-slate-900 p-1 text-center">{idx + 1}</td>
              <td className="border border-slate-900 p-1">
                <strong>{item.name}</strong>
                {item.spesifikasi && (
                  <div style={{ marginTop: '4px', fontSize: '11px', color: '#334155' }}>
                    Spesifikasi: {item.spesifikasi}
                  </div>
                )}
              </td>
              <td className="border border-slate-900 p-1 text-center">{item.qty}</td>
              <td className="border border-slate-900 p-1 text-center">{item.unit}</td>
            </tr>
          );
        })}
      </tbody>
    </table>

    <div className="font-bold mt-4">B. Spesifikasi Waktu dan Layanan</div>
    <p className="indent-8 mb-2">Waktu pelaksanaan pengadaan maksimal selama <strong>{dppSpecs.waktu || packageMetadata.waktu_penyelesaian || '14 (Empat Belas) hari kalender'}</strong>. Lokasi tujuan akhir pengiriman berada di: <strong>{dppSpecs.tempat || packageMetadata.lokasi_pekerjaan || currentUser?.department || 'Kabupaten Probolinggo'}</strong>.</p>
    {dppSpecs.spesifikasiLayanan && (
      <div className="whitespace-pre-wrap text-justify mb-4 leading-relaxed indent-8">
        {dppSpecs.spesifikasiLayanan}
      </div>
    )}

    {dppSpecs.justifikasiMerek && (
      <>
        <div className="font-bold mt-4">C. Spesifikasi Tambahan / Catatan Kebutuhan</div>
        <p className="indent-8 mb-4 leading-relaxed whitespace-pre-wrap">{dppSpecs.justifikasiMerek}</p>
      </>
    )}

    <div className="font-bold uppercase mt-8 mb-2 text-center page-break-before-avoid">
      BAB III. DOKUMEN PENGUMPULAN REFERENSI HARGA
    </div>
    <p className="mb-2 indent-8">
      Sebagai metode pengadaan e-purchasing, dokumen Referensi Harga ini digunakan untuk membuktikan harga yang disepakati wajar.
    </p>

    <div className="pl-4 space-y-2 mb-4">
      <div className="font-bold">a. Daftar Penyedia Potensial e-Katalog</div>
      {getActiveSurveyData() ? (() => {
        const foundProducts = getActiveSurveyData().products.filter(p => p.success && p.vendor !== 'TIDAK DITEMUKAN');
        if (foundProducts.length === 0) {
          return <p className="italic text-slate-600 my-1 pb-1 ">* Seluruh item barang tidak ditemukan di e-Katalog LKPP. Referensi e-Katalog tidak terlampir.</p>
        }
        return (
          <table className="w-full border-collapse border border-slate-900 mb-2">
            <thead>
              <tr className="bg-slate-100 font-bold text-center">
                <td className="border border-slate-900 p-1 w-8">No</td>
                <td className="border border-slate-900 p-1">Nama Barang</td>
                <td className="border border-slate-900 p-1">Penyedia Katalog</td>
                <td className="border border-slate-900 p-1 text-right">Harga Katalog (Rp)</td>
              </tr>
            </thead>
            <tbody>
              {foundProducts.flatMap((p, pIdx) => {
                const rows = [];
                const totalRows = 1 + (p.comparators && p.comparators.length > 0 ? p.comparators.length : 0);
                // Target penyedia (Pemenang survei)
                // Target penyedia (Pertama)
                rows.push(
                  <tr key={`win-${pIdx}`}>
                    <td className="border border-slate-900 p-1 text-center" rowSpan={totalRows}>{pIdx + 1}</td>
                    <td className="border border-slate-900 p-1 text-sm" rowSpan={totalRows}>
                      <a href={p.link} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 break-all">{p.name}</a>
                    </td>
                    <td className="border border-slate-900 p-1 text-xs text-slate-800">
                      <div className="font-semibold">{p.vendor}</div>
                      <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 break-all text-[9px] print:text-[8px]">{p.link}</a>
                    </td>
                    <td className="border border-slate-900 p-1 text-right text-xs text-slate-800 align-top">
                      {(p.price || 0).toLocaleString('id-ID')}
                    </td>
                  </tr>
                );
                
                // Penyedia potensial lainnya (Alternatif)
                if (p.comparators && p.comparators.length > 0) {
                  p.comparators.forEach((comp, cIdx) => {
                    rows.push(
                      <tr key={`comp-${pIdx}-${cIdx}`}>
                        <td className="border border-slate-900 p-1 text-xs text-slate-800">
                          <div className="font-semibold">{comp.vendor}</div>
                          {comp.link && <a href={comp.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 break-all text-[9px] print:text-[8px]">{comp.link}</a>}
                        </td>
                        <td className="border border-slate-900 p-1 text-right text-xs text-slate-800 align-top">
                          {(comp.price || 0).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    );
                  });
                }
                return rows;
              })}
            </tbody>
          </table>
        );
      })() : <p className="italic text-slate-600 my-1 pb-1 ">* Belum ada survei yang dilakukan.</p>}
    </div>

    <div className="pl-4 space-y-2 mb-4">
      <div className="font-bold">b. Estimasi Perbandingan Harga</div>
      <p className="mb-2 indent-8">
        Berdasarkan daftar di atas, perbandingan harga (Harga DPA vs Harga Tayang e-Katalog) adalah sebagai berikut:
      </p>
    
    <table className="w-full border-collapse border border-slate-900 mb-2">
      <thead>
        {autoComparator ? (
          <tr className="bg-slate-100 font-bold text-center">
            <td className="border border-slate-900 p-1 w-8">No</td>
            <td className="border border-slate-900 p-1">Uraian Barang</td>
            <td className="border border-slate-900 p-1 w-24 text-right">Harga DPA</td>
            <td className="border border-slate-900 p-1 w-64">Daftar Penyedia Potensial</td>
            <td className="border border-slate-900 p-1">Alasan Pemilihan</td>
          </tr>
        ) : (
          <tr className="bg-slate-100 font-bold text-center">
            <td className="border border-slate-900 p-1 w-8">No</td>
            <td className="border border-slate-900 p-1">Uraian Barang</td>
            <td className="border border-slate-900 p-1 w-24 text-right">Harga DPA</td>
            <td className="border border-slate-900 p-1 w-24 text-right">Harga Tayang e-Katalog</td>
            <td className="border border-slate-900 p-1">Penyedia & Tautan e-Katalog</td>
          </tr>
        )}
      </thead>
      <tbody>
        {getPackageItems(selectedPack).filter(item => (item.qty === '' ? 0 : (item.qty || 0)) > 0).map((item, idx) => {
          const unitHpsPrice = hpsPrices[item.name] !== undefined ? hpsPrices[item.name] : item.price;
          const surveyProduct = surveyData?.products?.find(p => p.name === item.name);
          const displayName = surveyProduct?.name || item.name;
          const hargaTayang = surveyProduct?.price ? surveyProduct.price : 0;
          const compKey = 'ITEM-' + idx;
          const comp = comparisons && comparisons[compKey];
          const selisih = comp?.price ? comp.price - hargaTayang : null;

          if (autoComparator) {
            return (
              <tr key={item.no}>
                <td className="border border-slate-900 p-1 text-center">{idx + 1}</td>
                <td className="border border-slate-900 p-1 text-sm">{displayName}</td>
                <td className="border border-slate-900 p-1 text-right text-sm">Rp {(item.price || 0).toLocaleString('id-ID')}</td>
                <td className="border border-slate-900 p-1">
                  <div className="mb-2">
                    <div className="text-[10px] text-slate-800">{surveyProduct?.vendor || '-'}</div>
                    <div className="text-[11px] text-slate-700">Rp {hargaTayang.toLocaleString('id-ID')}</div>
                  </div>
                  {surveyProduct?.comparators && surveyProduct.comparators.length > 0 && (
                    <div className="pt-2 border-t border-slate-300 space-y-2">
                      {surveyProduct.comparators.map((c, cIdx) => (
                        <div key={cIdx}>
                          <div className="text-[10px] text-slate-800">{c.vendor}</div>
                          <div className="text-[11px] text-slate-700">Rp {(c.price || 0).toLocaleString('id-ID')}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </td>
                <td className="border border-slate-900 p-1 text-[9px] align-top">
                  {comp ? (comp.alasan || (hargaTayang < item.price 
                    ? 'Harga e-Katalog terindikasi efisien (di bawah pagu DPA)' 
                    : 'Harga e-Katalog wajar (sesuai pagu DPA)')) : <span className="font-semibold text-emerald-800">Satu-satunya penyedia lokal terdekat yang memenuhi kriteria teknis dan waktu layanan</span>}
                </td>
              </tr>
            );
          } else {
            const brandText = surveyProduct ? (surveyProduct.vendor || 'Sesuai Katalog') : 'Sesuai Kebutuhan DPA';
            const linkHref = surveyProduct && surveyProduct.link
              ? surveyProduct.link
              : (surveyProduct ? getDynamicProductLink(surveyProduct.vendor, surveyProduct.name) : '');
            return (
              <tr key={item.no}>
                <td className="border border-slate-900 p-1 text-center">{idx + 1}</td>
                <td className="border border-slate-900 p-1">{item.name}</td>
                <td className="border border-slate-900 p-1 text-right">Rp {(item.price || 0).toLocaleString('id-ID')}</td>
                <td className="border border-slate-900 p-1 text-right">Rp {(hargaTayang || 0).toLocaleString('id-ID')}</td>
                <td className="border border-slate-900 p-1 text-sm">
                  {surveyProduct && surveyProduct.success && surveyProduct.vendor !== 'TIDAK DITEMUKAN' ? (
                    <>
                      <strong>{brandText}</strong><br/>
                      <a href={linkHref} target="_blank" className="text-blue-600 break-all text-[10px]">{linkHref}</a>
                    </>
                  ) : (
                    <span className="text-slate-400 italic">Belum disurvei / tidak ditemukan</span>
                  )}
                </td>
              </tr>
            );
          }
        })}
      </tbody>
    </table>
    </div>
    <p className="indent-8 mb-4"><em>Catatan Analisis: Seluruh harga yang tertera sudah termasuk pajak yang berlaku dan keuntungan wajar, serta biaya kirim/instalasi (apabila dipersyaratkan). Hasil tangkapan layar produk e-Katalog terlampir di akhir dokumen ini.</em></p>

    <div className="font-bold uppercase mt-8 mb-2 text-center">BAB IV. RENCANA METODE PEMILIHAN PENYEDIA E-PURCHASING</div>
    <p className="indent-8 mb-4">
      Metode pemilihan penyedia ditetapkan menggunakan: <strong>{dppSpecs.metodePemilihan || 'Negosiasi Harga'}</strong>.
    </p>

    <div className="font-bold uppercase mt-8 mb-2 text-center">BAB V. DRAFT RANCANGAN KONTRAK (SURAT PESANAN)</div>
    <p className="indent-8 mb-4">
      Rancangan kontrak menggunakan format standar <strong>Surat Pesanan (SP)</strong> yang diterbitkan langsung dan diunduh dari Sistem E-Purchasing (Katalog Elektronik LKPP). Segala ketentuan mengenai hak, kewajiban, tata cara pembayaran, sanksi, dan denda tunduk pada Syarat-Syarat Umum/Khusus Kontrak e-Purchasing.
    </p>
  </div>

 {/* Render the second part of the template (footer/signature) */}
 {parts[1] && (
 <div className="mt-8 pt-6 signature-section" style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', textAlign: 'justify', fontFamily: 'Arial, sans-serif', pageBreakInside: 'avoid', breakInside: 'avoid' }} dangerouslySetInnerHTML={{ __html: parseSmartColons(parts[1]) }} />
 )}
 </>
 );
 }
 
 // Fallback if template fails or doesn't have the placeholder
 return (
 <div className="text-center font-bold text-rose-600 p-4 border border-rose-300 rounded bg-rose-50">
 Template DPP tidak valid. Pastikan template memiliki tag {"{{komponen_dinamis_dpp}}"}
 </div>
 );
 })()}

 <div className="pt-4 space-y-3">
 {/* Lampiran Screenshot Jika Ada */}
 {getActiveSurveyData() && (() => {
 const foundProducts = getActiveSurveyData().products.filter(p => p.success && p.vendor !== 'TIDAK DITEMUKAN');
 if (foundProducts.length === 0) return null;
 return (
 <div className="mt-8 break-before-page" style={{ pageBreakBefore: 'always', breakBefore: 'page' }}>
 <div className="font-bold uppercase mb-6 text-center border-b-2 border-slate-900 pb-2">LAMPIRAN: BUKTI TANGKAPAN LAYAR (SCREENSHOT) REFERENSI E-KATALOG LOKAL/NASIONAL</div>
 <div className="block" style={{ marginTop: '2rem' }}>
 {foundProducts.map((p, index) => {
  let imgSrc = p.searchImg || p.img;
  if (imgSrc && imgSrc.startsWith('/screenshots/')) {
    imgSrc = window.location.origin + imgSrc;
  }

  const targetLinkHref = p.link && !p.link.includes('/search?keyword=') ? p.link : getDynamicProductLink(p.vendor, p.name);

  // Kumpulkan semua penyedia: utama + comparators
  const allProviders = [
    { vendor: p.vendor, price: p.price, link: targetLinkHref, img: imgSrc, label: 'Penyedia Utama' },
    ...(p.comparators || []).map((comp, cIdx) => {
      let compImg = comp.img;
      if (compImg && compImg.startsWith('/screenshots/')) compImg = window.location.origin + compImg;
      return {
        vendor: comp.vendor,
        price: comp.price,
        link: comp.link,
        img: compImg,
        label: `Penyedia Pembanding ${cIdx + 1}`
      };
    })
  ];

  return (
  <div key={p.id} style={{ pageBreakBefore: index === 0 ? 'auto' : 'always', breakBefore: index === 0 ? 'auto' : 'page', marginBottom: '32px' }}>
    {/* Header nama barang */}
    <div style={{ fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', background: '#1e293b', color: 'white', padding: '6px 12px', marginBottom: '12px' }}>
      Barang {index + 1}: {p.name}
    </div>
    {/* Blok per penyedia — semua seragam sebagai Penyedia Potensial */}
    {allProviders.map((prov, pIdx) => (
      <div key={pIdx} style={{ border: '1.5px solid #64748b', background: '#ffffff', marginBottom: '16px', padding: '10px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
        {/* Info penyedia */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '8px' }}>
          <span style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', background: '#f1f5f9', color: '#334155', padding: '2px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
            Penyedia Potensial {pIdx + 1}
          </span>
          <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{prov.vendor} — Rp {(prov.price || 0).toLocaleString('id-ID')}</span>
        </div>
        {/* Screenshot */}
        {prov.img ? (
          <img src={prov.img} alt={prov.vendor} style={{ width: '100%', maxHeight: '420px', objectFit: 'contain', border: '1px solid #cbd5e1', display: 'block' }} />
        ) : (
          <div style={{ width: '100%', minHeight: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed #cbd5e1', background: '#f8fafc', padding: '16px', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8' }}>Screenshot Belum Tersedia</span>
            <span style={{ fontSize: '9px', color: '#94a3b8', marginTop: '4px' }}>Klik "📸 Ambil Screenshot Bukti" di halaman persiapan survei</span>
          </div>
        )}
        {/* Tautan produk */}
        <div style={{ marginTop: '6px', fontSize: '8px', color: '#475569', wordBreak: 'break-all' }}>
          🔗 <a href={prov.link} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>{prov.link}</a>
        </div>
      </div>
    ))}
  </div>
  );
 })}
 </div>
 </div>
 );
 })()}
 </div>
 </div>
 )}

 {/* SIGNATURE SECTION (FOOTER) */}
 <div className="flex justify-between items-end mt-12 pt-6 border-t border-slate-200 signature-section" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
 <div className="flex-1">
 {/* Kosong untuk memberikan ruang tanda tangan di kanan */}
 </div>
 <div className="w-max min-w-[14rem] px-4 text-center space-y-2">
  <div >
  {currentUser?.department?.toLowerCase().includes('besuk') ? 'Besuk' : (currentUser?.department || 'Probolinggo')}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
  </div>
 <div className=" font-bold uppercase">
 Pejabat Pembuat Komitmen (PPK)
 </div>

 {/* Ruang kosong untuk tanda tangan basah */}
 {(() => {
   if (docSettings?.signatureMethodPpk === 'tte' && currentUser?.nip) {
     return <img src={getTteBadge(currentUser?.name || 'PPK', currentUser?.nip)} alt="TTE PPK" style={{ display: 'block', maxHeight: '85px', margin: '6px auto 4px auto' }} />;
   } else if (docSettings?.ttdPpk) {
     return <img src={docSettings.ttdPpk} alt="TTD PPK" style={{ display: 'block', maxHeight: '85px', maxWidth: '250px', width: 'auto', height: 'auto', objectFit: 'contain', mixBlendMode: 'multiply', margin: '6px auto 4px auto', filter: 'contrast(1.2)' }} />;
   }
   return <div style={{ height: '96px', width: '100%' }}></div>;
 })()}
 
 <div className=" font-bold uppercase underline">
 {currentUser?.name}
 </div>
 <div className=" font-mono -mt-1">
 NIP. {currentUser?.nip}
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>,
 document.body
 )}

    </>
  );
}
