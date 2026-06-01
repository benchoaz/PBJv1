import React from 'react';
import { createPortal } from 'react-dom';
import { usePPK } from './PPKContext';


const parseSmartColons = (text) => {
  if (!text) return text;
  const lines = text.split('\n');
  let output = [];
  let inTable = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^([A-Za-z0-9/ ()\-_.,]+?)\s*:\s*(.*)$/);
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
  return output.join('\n');
}

function terbilang(angka) {
    const bil = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
    const n = parseInt(angka);
    if (isNaN(n)) return "";

    if (n < 12) {
      return bil[n];
    } else if (n < 20) {
      return (bil[n - 10] + " Belas").trim();
    } else if (n < 100) {
      const puluh = bil[Math.floor(n / 10)] + " Puluh";
      const sisa = bil[n % 10];
      return (puluh + " " + sisa).trim();
    } else if (n < 200) {
      return ("Seratus " + terbilang(n - 100)).trim();
    } else if (n < 1000) {
      const ratus = terbilang(Math.floor(n / 100)) + " Ratus";
      const sisa = terbilang(n % 100);
      return (ratus + " " + sisa).trim();
    } else if (n < 2000) {
      return ("Seribu " + terbilang(n - 1000)).trim();
    } else if (n < 1000000) {
      const ribu = terbilang(Math.floor(n / 1000)) + " Ribu";
      const sisa = terbilang(n % 1000);
      return (ribu + " " + sisa).trim();
    } else if (n < 1000000000) {
      const juta = terbilang(Math.floor(n / 1000000)) + " Juta";
      const sisa = terbilang(n % 1000000);
      return (juta + " " + sisa).trim();
    } else if (n < 1000000000000) {
      const milyar = terbilang(Math.floor(n / 1000000000)) + " Milyar";
      const sisa = terbilang(n % 1000000000);
      return (milyar + " " + sisa).trim();
    }
    return "";
  }

export default function DocPreviewModal({ isHpsExemptSelected, comparisons, justifications }) {
  const {
    activeDocPreview, setActiveDocPreview,
    selectedPack,
    hpsValue, hpsPrices,
    currentUser,
    docSettings,
    dppSpecs,
    surveyData,
    packageMetadata,
    dpaRincian,
    dpaAccounts,
    selectedNdTplId,
    selectedTplId,
    tanggalSurat
  } = usePPK();

  const formatTanggalIndo = (tglStr) => {
    if (!tglStr) return '';
    try {
      return new Date(tglStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return tglStr; }
  };

  const getActiveSurveyData = () => {
    // Hanya tampilkan data survei NYATA
    if (surveyData && surveyData.products && surveyData.products.length > 0) {
      return surveyData;
    }
    return null;
  };

  const getPacketCategory = (packName) => {
    if (!packName) return 'ATK';
    const name = packName.toLowerCase();
    if (name.includes('laptop') || name.includes('printer') || name.includes('komputer') || name.includes('kendaraan') || name.includes('mesin') || name.includes('elektronik') || name.includes('modal')) return 'Modal';
    if (name.includes('kertas sektoral') || name.includes('seragam dinas') || name.includes('konsolidasi')) return 'Konsolidasi';
    if (name.includes('prasmanan') || name.includes('katering') || name.includes('catering')) return 'Mamin-Prasmanan';
    if (name.includes('nasi kotak') || name.includes('nasi bungkus') || name.includes('kotak')) return 'Mamin-Bungkus';
    if (name.includes('snack') || name.includes('kudapan')) return 'Mamin-Snack';
    if (name.includes('makan') || name.includes('minum') || name.includes('mamin') || name.includes('konsumsi')) return 'Mamin-Bungkus';
    if (name.includes('jasa') || name.includes('pemeliharaan') || name.includes('service')) return 'Jasa';
    return 'ATK';
  };

    const areAccountsCompatible = (dpaAcc, sirupMak) => {
    if (!dpaAcc || !sirupMak) return true

    // Temukan index angka 5 yang merupakan bagian awal kode rekening belanja (5.x.xx...)
    const indexFive = sirupMak.indexOf('5.')
    let cleanSirup = ''
    if (indexFive !== -1) {
      // Ambil dari angka 5 ke belakang
      const makAccountPart = sirupMak.substring(indexFive)
      cleanSirup = makAccountPart.replace(/[^0-9]/g, '')
    } else {
      cleanSirup = sirupMak.replace(/[^0-9]/g, '')
    }

    const cleanDpa = dpaAcc.replace(/[^0-9]/g, '')
    if (!cleanDpa || !cleanSirup) return true

    // Cocokkan apakah kode DPA terkandung di dalam bagian rekening MAK
    if (cleanSirup.includes(cleanDpa) || cleanDpa.includes(cleanSirup)) return true

    // Bandingkan kategori utama (6 digit pertama, misal 520205 vs 520210)
    const prefixDpa = cleanDpa.substring(0, 6)
    const prefixSirup = cleanSirup.substring(0, 6)
    if (prefixDpa && prefixSirup && prefixDpa === prefixSirup) return true

    return false
  }

  const isPackageMatchedWithDpa = (pack) => {
    if (!pack || !dpaAccounts || dpaAccounts.length === 0) return false

    // Stop words to filter out common terms from government accounts
    const stopWords = ['belanja', 'dan', 'untuk', 'kegiatan', 'bahan', 'alat', 'kantor', 'sub', 'penyediaan', 'jasa', 'modal']

    return dpaAccounts.some(acc => {
      // If MAK and account are incompatible, they cannot be a match!
      if (pack.mak && acc.account && !areAccountsCompatible(acc.account, pack.mak)) {
        return false
      }

      // 1. Direct Pagu Match (common in regional budget systems)
      const paguDifference = Math.abs(acc.pagu - pack.pagu)
      if (paguDifference < 1000) return true

      // 2. Dynamic Keyword Matching
      const accWords = acc.name.toLowerCase().split(/[\s/.,()-]+/)
      const keywords = accWords.filter(w => w.length > 2 && !stopWords.includes(w))

      const packNameLower = (pack.packName || '').toLowerCase()
      const hasKeywordMatch = keywords.some(kw => packNameLower.includes(kw))

      // If we have keyword overlap and the package pagu is valid, it's a match!
      if (hasKeywordMatch && pack.pagu <= acc.pagu) {
        return true
      }

      return false
    })
  }

  const getMatchingDpaAccount = (pack) => {
    if (!pack || !dpaAccounts || dpaAccounts.length === 0) return null

    const stopWords = ['belanja', 'dan', 'untuk', 'kegiatan', 'bahan', 'alat', 'kantor', 'sub', 'penyediaan', 'jasa', 'modal']

    return dpaAccounts.find(acc => {
      // If MAK and account are incompatible, they cannot be a match!
      if (pack.mak && acc.account && !areAccountsCompatible(acc.account, pack.mak)) {
        return false
      }

      // 1. Direct Pagu Match (common in regional budget systems)
      const paguDifference = Math.abs(acc.pagu - pack.pagu)
      if (paguDifference < 1000) return true

      // 2. Dynamic Keyword Matching
      const accWords = acc.name.toLowerCase().split(/[\s/.,()-]+/)
      const keywords = accWords.filter(w => w.length > 2 && !stopWords.includes(w))

      const packNameLower = (pack.packName || '').toLowerCase()
      const hasKeywordMatch = keywords.some(kw => packNameLower.includes(kw))

      if (hasKeywordMatch && pack.pagu <= acc.pagu) {
        return true
      }

      return false
    })
  }

  /**
   * getPackageItems — ambil rincian item dari DPA Ground Truth (hasil parser + koreksi PPK).
   * Prioritas: (1) dpaRincian[kode_rekening cocok], (2) dpaRincian['manual_nosirup_xxx'],
   * (3) item placeholder agar tabel tidak kosong.
   */
  const getPackageItems = (pack) => {
    if (!pack) return []

    // Cari kode rekening DPA yang cocok dengan paket ini (by pagu atau keyword)
    const matchedAcc = getMatchingDpaAccount(pack)
    const kodeRekening = matchedAcc?.account

    // 1. Ambil rincian dari DPA Ground Truth berdasarkan kode rekening
    if (kodeRekening && dpaRincian[kodeRekening] && dpaRincian[kodeRekening].length > 0) {
      return dpaRincian[kodeRekening].map((r, i) => ({
        no: i + 1,
        name: r.nama,
        qty: r.volume,
        unit: r.satuan,
        price: r.harga_satuan,
      }))
    }

    // 2. Coba kunci noSirup langsung
    const keyNoSirup = `nosirup_${pack.noSirup}`
    if (dpaRincian[keyNoSirup] && dpaRincian[keyNoSirup].length > 0) {
      return dpaRincian[keyNoSirup].map((r, i) => ({
        no: i + 1, name: r.nama, qty: r.volume, unit: r.satuan, price: r.harga_satuan,
      }))
    }

    // 3. Placeholder — PPK perlu isi manual rincian
    return [
      { no: 1, name: '⚠️ Rincian belum tersedia — klik "Edit Rincian" pada tabel DPA di atas', qty: 1, unit: 'Paket', price: pack.pagu }
    ]
  }



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
               const base64 = await new Promise((resolve, reject) => {
                 const reader = new FileReader();
                 reader.onloadend = () => resolve(reader.result);
                 reader.onerror = reject;
                 reader.readAsDataURL(blob);
               });
               img.setAttribute('src', base64);
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

  if (!activeDocPreview || !selectedPack) return null;

  return createPortal(
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
                ⚙️ Pengaturan Kop & Logo
              </button>
              <button
                onClick={() => window.print()}
                className="bg-emerald-600 hover:bg-emerald-750 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-600/10"
              >
                🖨️ Cetak / Unduh PDF
              </button>
              <button
                onClick={handleExportWord}
                className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
              >
                📥 Export Word (.doc)
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
 width="76" height="76"
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
 NOMOR: 027 / 142 / PPK / 437.82 / {new Date(tanggalSurat).getFullYear()}
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
 Mengingat Dokumen Pelaksanaan Anggaran (DPA) Nomor: DPA/A.1/1.02.01/2026 yang bersumber dari Anggaran Pendapatan dan Belanja Daerah (APBD) Kabupaten Probolinggo Tahun Anggaran {new Date(tanggalSurat).getFullYear()}.
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
 {getPackageItems(selectedPack).map((item, idx) => {
 const unitHpsPrice = hpsPrices[item.name] !== undefined ? hpsPrices[item.name] : item.price;
 const surveyProduct = surveyData?.products?.[idx];
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
 
 const ndTemplate = templates.find(t => t.id === selectedNdTplId) || templates.find(t => t.id === 'TPL-001');
 
 if (ndTemplate) {
 let content = ndTemplate.content;
 
 // Add centered title for default Nota Dinas
 if (ndTemplate.id === 'TPL-001' && !content.includes('NOTA DINAS')) {
    content = `<div class="text-center mb-6"><div class="font-bold text-lg underline leading-none mb-1">NOTA DINAS</div><div class="leading-none">Nomor : {{nomor_nd}}</div></div>\n` + content;
 }
 
 // Force remove legacy signature block from cached templates to prevent duplication
 content = content.replace(/Pejabat Pembuat Komitmen \(PPK\),?[\s\S]*?\{\{nama_ppk\}\}[\s\S]*?NIP\. \{\{nip_ppk\}\}/gi, '');

 const currentDocSettingsStr = localStorage.getItem('pbj_doc_settings');
 const docSettingsFallback = currentDocSettingsStr ? JSON.parse(currentDocSettingsStr) : null;
 const nomorBase = docSettingsFallback ? (docSettingsFallback.formatNomorSurat || '027/{nomor}/BPBJ/2026') : '027/{nomor}/BPBJ/2026';
 // Replace variables
 const replacements = {
 '{{tahun_anggaran}}': new Date(tanggalSurat).getFullYear(),
  '{{nama_satker}}': currentUser.department || 'Bagian Pengadaan Barang dan Jasa (BPBJ)',
 '{{nama_satker_kapital}}': (currentUser.department || 'Bagian Pengadaan Barang dan Jasa (BPBJ)').toUpperCase(),
 '{{alamat_satker}}': docSettingsFallback ? docSettingsFallback.alamatLengkap : 'Jl. Raya Besuk Nomor 37 Besuk Probolinggo - 67283',
 '{{nama_pekerjaan}}': selectedPack.packName || '',
 '{{nilai_pagu}}': `Rp ${(selectedPack.pagu || 0).toLocaleString()} (${terbilang(selectedPack.pagu || 0)} Rupiah)`,
 '{{sumber_dana}}': `${selectedPack.sumberDana || 'APBD'} Tahun Anggaran ${new Date(tanggalSurat).getFullYear()}`,
 '{{nama_ppk}}': currentUser.name || '',
 '{{nip_ppk}}': currentUser.nip || '',
 '{{nomor_surat}}': nomorBase.replace('{nomor}', '045.2'),
 '{{nomor_nd}}': packageMetadata.nomor_nd || nomorBase.replace('{nomor}', '011/ND'),
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
 '{{tempat_penetapan}}': 'Besuk',
 '{{nomor_sp}}': nomorBase.replace('{nomor}', '115/SP'),
 '{{alamat_penyedia}}': '_______________________',
 '{{nilai_kontrak}}': '_______________________',
 '{{waktu_penyelesaian}}': packageMetadata.waktu_penyelesaian || '14 (empat belas) hari kalender',
 '{{nomor_dpp}}': packageMetadata.nomor_dpp || '................................',
 '{{tanggal_dpp}}': formatTanggalIndo(tanggalSurat),
 '{{nomor_hps}}': nomorBase.replace('{nomor}', '014/HPS'),
 '{{tanggal_hps}}': formatTanggalIndo(tanggalSurat),
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
 
 // Clean up excessive empty lines before signature section
 content = content.replace(/(?:<p>\s*<br\s*\/?>\s*<\/p>|\s*<br\s*\/?>){2,}/g, '<br/>');

 // Inject PPK and PP Signatures
 if (docSettingsFallback && docSettingsFallback.ttdPpk && currentUser.nip) {
   const ppkNipLine = `NIP. ${currentUser.nip}`;
   const ttdPpkStyle = 'display:block; max-height:75px; max-width:200px; width:auto; height:auto; object-fit:contain; mix-blend-mode:multiply; margin-top:6px; margin-bottom:4px; filter:contrast(1.1);';
   content = content.replace(new RegExp(ppkNipLine, 'g'), `<img src="${docSettingsFallback.ttdPpk}" alt="TTD PPK" style="${ttdPpkStyle}" />${ppkNipLine}`);
 }
 if (docSettingsFallback && docSettingsFallback.ttdPp && replacements['{{nip_pejabat_pengadaan}}'] && replacements['{{nip_pejabat_pengadaan}}'] !== '_______________________') {
   const ppNipLine = `NIP. ${replacements['{{nip_pejabat_pengadaan}}']}`;
   content = content.replace(new RegExp(ppNipLine, 'g'), `<img src="${docSettingsFallback.ttdPp}" alt="TTD PP" style="display:block; max-height:75px; max-width:200px; width:auto; height:auto; object-fit:contain; mix-blend-mode:multiply; margin-top:6px; margin-bottom:4px; filter:contrast(1.1);" />${ppNipLine}`);
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
 
 // Center the DPP title and Nomor (and entirely strip Tanggal if it was added manually at the top, to enforce Tata Naskah)
 content = content.replace(/DOKUMEN PERSIAPAN PENGADAAN \(DPP\)[\r\n]+(Nomor\s*:.*?)[\r\n]+(Tanggal\s*:.*?)?[\r\n]+/, function(match, p1, p2) {
   return `<div class="text-center mb-6"><div class="font-bold text-lg underline leading-none mb-1">DOKUMEN PERSIAPAN PENGADAAN (DPP)</div><div class="leading-none mb-6">${p1}</div></div><br/>`;
 });

 const currentDocSettingsStr = localStorage.getItem('pbj_doc_settings');
 const docSettingsFallback = currentDocSettingsStr ? JSON.parse(currentDocSettingsStr) : null;
 const nomorBase = docSettingsFallback ? (docSettingsFallback.formatNomorSurat || '027/{nomor}/BPBJ/2026') : '027/{nomor}/BPBJ/2026';
 // Replace variables
 const replacements = {
 '{{nama_satker}}': currentUser.department || 'Bagian Pengadaan Barang dan Jasa (BPBJ)',
 '{{nama_satker_kapital}}': (currentUser.department || 'Bagian Pengadaan Barang dan Jasa (BPBJ)').toUpperCase(),
 '{{alamat_satker}}': docSettingsFallback ? docSettingsFallback.alamatLengkap : 'Jl. Raya Besuk Nomor 37 Besuk Probolinggo - 67283',
 '{{nama_pekerjaan}}': selectedPack.packName || '',
 '{{nilai_pagu}}': `Rp ${(selectedPack.pagu || 0).toLocaleString()} (${terbilang(selectedPack.pagu || 0)} Rupiah)`,
 '{{sumber_dana}}': `${selectedPack.sumberDana || 'APBD'} Tahun Anggaran ${new Date(tanggalSurat).getFullYear()}`,
 '{{nama_ppk}}': currentUser.name || '',
 '{{nip_ppk}}': currentUser.nip || '',
 '{{nomor_surat}}': nomorBase.replace('{nomor}', '045.2'),
 '{{nomor_nd}}': packageMetadata.nomor_nd || nomorBase.replace('{nomor}', '011/ND'),
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
 '{{tempat_penetapan}}': 'Besuk',
 '{{nomor_sp}}': nomorBase.replace('{nomor}', '115/SP'),
 '{{alamat_penyedia}}': '_______________________',
 '{{nilai_kontrak}}': '_______________________',
 '{{waktu_penyelesaian}}': packageMetadata.waktu_penyelesaian || '14 (empat belas) hari kalender',
 '{{nomor_dpp}}': packageMetadata.nomor_dpp || '................................',
 '{{tanggal_dpp}}': formatTanggalIndo(tanggalSurat),
 '{{nomor_hps}}': nomorBase.replace('{nomor}', '014/HPS'),
 '{{tanggal_hps}}': formatTanggalIndo(tanggalSurat),
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
 if (docSettingsFallback && docSettingsFallback.ttdPpk && currentUser.nip) {
   const ppkNipLine = `NIP. ${currentUser.nip}`;
   content = content.replace(new RegExp(ppkNipLine, 'g'), `<img src="${docSettingsFallback.ttdPpk}" alt="TTD PPK" style="display:block; max-height:75px; max-width:200px; width:auto; height:auto; object-fit:contain; mix-blend-mode:multiply; margin-top:6px; margin-bottom:4px; filter:contrast(1.1);" />${ppkNipLine}`);
 }
 if (docSettingsFallback && docSettingsFallback.ttdPp && replacements['{{nip_pejabat_pengadaan}}'] && replacements['{{nip_pejabat_pengadaan}}'] !== '_______________________') {
   const ppNipLine = `NIP. ${replacements['{{nip_pejabat_pengadaan}}']}`;
   content = content.replace(new RegExp(ppNipLine, 'g'), `<img src="${docSettingsFallback.ttdPp}" alt="TTD PP" style="display:block; max-height:75px; max-width:200px; width:auto; height:auto; object-fit:contain; mix-blend-mode:multiply; margin-top:6px; margin-bottom:4px; filter:contrast(1.1);" />${ppNipLine}`);
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
    <p className="indent-8 mb-2">Berdasarkan Peraturan Presiden tentang Pengadaan Barang/Jasa Pemerintah, PPK mengutamakan penyedia dengan kualifikasi usaha kecil/koperasi serta produk dalam negeri berdasarkan tingkatan prioritas berikut:</p>
    <ol className="list-decimal pl-12 mb-6">
      <li>Produk Dalam Negeri (PDN) dengan nilai TKDN &ge; 25%.</li>
      <li>PDN dengan nilai TKDN &lt; 25%.</li>
      <li>Produk berlabel PDN namun belum memiliki nilai TKDN.</li>
      <li>Produk Impor (jika tidak ada pilihan lokal dan disertai justifikasi).</li>
    </ol>

    <div className="font-bold uppercase mt-8 mb-2 text-center">BAB II. SPESIFIKASI TEKNIS E-PURCHASING</div>
    
    <div className="font-bold mt-5 mb-1">A. Tautan (Link) Produk & Spesifikasi Mutu</div>
    <table className="w-full border-collapse border border-slate-900 mb-2">
      <thead>
        <tr className="bg-slate-100 font-bold text-center">
          <td className="border border-slate-900 p-1 w-8">No</td>
          <td className="border border-slate-900 p-1">Identitas/Jenis Barang & Merek</td>
          <td className="border border-slate-900 p-1 w-16">Kuantitas</td>
          <td className="border border-slate-900 p-1 w-16">Satuan</td>
        </tr>
      </thead>
      <tbody>
        {getPackageItems(selectedPack).map((item, idx) => {
          const surveyProduct = surveyData?.products?.[idx];
          const displayName = surveyProduct?.name || item.name;
          const brandText = surveyProduct ? (surveyProduct.vendor || 'Sesuai Katalog') : 'Sesuai Kebutuhan DPA';
          const linkHref = surveyProduct ? surveyProduct.link : '#';
          return (
            <tr key={item.no}>
              <td className="border border-slate-900 p-1 text-center">{idx + 1}</td>
              <td className="border border-slate-900 p-1">
                <strong>{displayName}</strong><br/>
                Merek/Penyedia: {brandText}<br/>
                <a href={linkHref} target="_blank" className="text-blue-600 break-all text-[10px]">{linkHref}</a>
              </td>
              <td className="border border-slate-900 p-1 text-center">{item.qty}</td>
              <td className="border border-slate-900 p-1 text-center">{item.unit}</td>
            </tr>
          );
        })}
      </tbody>
    </table>

    <div className="font-bold mt-4">B. Spesifikasi Waktu dan Layanan</div>
    <p className="indent-8 mb-2">Waktu pelaksanaan pengadaan maksimal selama <strong>{dppSpecs.waktu || packageMetadata.waktu_penyelesaian || '14 (Empat Belas) hari kalender'}</strong>. Lokasi tujuan akhir pengiriman berada di: <strong>{dppSpecs.tempat || packageMetadata.lokasi_pekerjaan || currentUser.department || 'Kabupaten Probolinggo'}</strong>.</p>
    {dppSpecs.spesifikasiLayanan && (
      <div className="whitespace-pre-wrap text-justify mb-4 leading-relaxed indent-8">
        {dppSpecs.spesifikasiLayanan}
      </div>
    )}

    {dppSpecs.justifikasiMerek && (
      <>
        <div className="font-bold mt-4">C. Justifikasi Teknis Merek</div>
        <p className="indent-8 mb-4 leading-relaxed whitespace-pre-wrap">{dppSpecs.justifikasiMerek}</p>
      </>
    )}

    <div className="font-bold uppercase mt-8 mb-2 text-center page-break-before-avoid">
      BAB III. DOKUMEN PENGUMPULAN REFERENSI HARGA
    </div>
    <p className="mb-2 indent-8">
      Sebagai metode pengadaan e-purchasing, dokumen Referensi Harga ini digunakan untuk membuktikan harga yang disepakati wajar. Estimasi perbandingan harga (Harga HPS/SHS vs Harga Tayang Katalog) adalah sebagai berikut:
    </p>
    
    <table className="w-full border-collapse border border-slate-900 mb-2">
      <thead>
        <tr className="bg-slate-100 font-bold text-center">
          <td className="border border-slate-900 p-1 w-8">No</td>
          <td className="border border-slate-900 p-1">Uraian Barang</td>
          <td className="border border-slate-900 p-1 w-32 text-right">Harga HPS/SHS</td>
          <td className="border border-slate-900 p-1 w-32 text-right">Harga Tayang Katalog</td>
        </tr>
      </thead>
      <tbody>
        {getPackageItems(selectedPack).map((item, idx) => {
          const unitHpsPrice = hpsPrices[item.name] !== undefined ? hpsPrices[item.name] : item.price;
          const surveyProduct = surveyData?.products?.[idx];
          const displayName = surveyProduct?.name || item.name;
          const hargaTayang = surveyProduct?.price ? surveyProduct.price : 0;
          return (
            <tr key={item.no}>
              <td className="border border-slate-900 p-1 text-center">{idx + 1}</td>
              <td className="border border-slate-900 p-1">{displayName}</td>
              <td className="border border-slate-900 p-1 text-right">Rp {unitHpsPrice.toLocaleString('id-ID')}</td>
              <td className="border border-slate-900 p-1 text-right">Rp {hargaTayang.toLocaleString('id-ID')}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
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

  {parts[1] && (
    <div className="mt-8 pt-6 signature-section" style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', textAlign: 'justify', fontSize: '12pt', fontFamily: 'Arial, sans-serif', pageBreakInside: 'avoid', breakInside: 'avoid' }} dangerouslySetInnerHTML={{ __html: parseSmartColons(parts[1]) }} />
  )}

  {/* LAMPIRAN SCREENSHOT - selalu halaman baru, setelah konten utama dan TTD pertama */}
  <div className="mt-8 break-before-page" style={{ pageBreakBefore: 'always', breakBefore: 'page' }}>
    <div className="font-bold uppercase mb-6 text-center border-b-2 border-slate-900 pb-2">LAMPIRAN: BUKTI TANGKAPAN LAYAR (SCREENSHOT) REFERENSI E-KATALOG LOKAL/NASIONAL</div>
    <p className="text-justify mb-4">Seluruh lampiran produk dari e-Katalog dan bukti tangkapan layar (screenshot) di bawah ini merupakan satu kesatuan dan bagian yang tidak terpisahkan dari dokumen Spesifikasi Teknis/DPP ini, serta menjadi lampiran Surat Pesanan apabila terjadi kesepakatan negosiasi.</p>
    
    {getActiveSurveyData() ? (() => {
      const foundProducts = getActiveSurveyData().products.filter(p => p.success && p.vendor !== 'TIDAK DITEMUKAN');
      if (foundProducts.length === 0) {
        return <p className="italic text-slate-600 text-center py-4 border border-dashed border-slate-300">Seluruh item barang tidak ditemukan di e-Katalog LKPP. Referensi e-Katalog tidak terlampir.</p>
      }
      return (
        <div className="space-y-8">
          {foundProducts.map((p, idx) => {
            let imgSrc = p.searchImg || p.img;
            if (imgSrc && imgSrc.startsWith('/screenshots/')) {
              imgSrc = `http://localhost:3001${imgSrc}`;
            }
            return (
              <div key={p.id} className="border border-slate-400 p-4 bg-slate-50" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <div className="font-bold text-lg mb-2 border-b border-slate-300 pb-2">Item {idx + 1}: {p.name}</div>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div><strong>Penyedia:</strong> {p.vendor}</div>
                  <div><strong>Harga Tayang:</strong> Rp {(p.price || 0).toLocaleString('id-ID')}</div>
                  <div className="col-span-2"><strong>Tautan (Link):</strong> <a href={p.link} target="_blank" className="text-blue-600 break-all">{p.link}</a></div>
                </div>
                {imgSrc && (
                  <div className="mt-2 text-center">
                    <div className="text-xs font-semibold text-slate-500 mb-1">Bukti Tangkapan Layar Katalog</div>
                    <img src={imgSrc} alt="Tangkapan Layar" className="max-w-full h-auto max-h-[800px] mx-auto border border-slate-200 shadow-sm" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    })() : (
      <p className="italic text-slate-500 text-center py-8 border border-dashed border-slate-300">Riwayat survei kosong. Silakan lakukan Survei Pasar Otomatis pada panel PPK untuk melampirkan data e-Katalog.</p>
    )}
  </div>

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
 </div>
 )}

 {/* TTD PPK GLOBAL - Muncul di akhir semua dokumen (HPS, Nota Dinas, dan DPP setelah lampiran) */}
 <div className="flex justify-end mt-12 pt-6 border-t-2 border-slate-900" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
   <div className="w-max min-w-[14rem] px-4 text-center space-y-1">
     <div>{(docSettings?.kotaSurat || 'Besuk')}, {formatTanggalIndo(tanggalSurat)}</div>
     <div className="font-bold uppercase">Pejabat Pembuat Komitmen,</div>
     {docSettings.ttdPpk ? (
       <div className="flex justify-center items-center h-24 my-2">
         <img src={docSettings.ttdPpk} alt="TTD PPK" style={{ maxHeight: '96px', objectFit: 'contain', mixBlendMode: 'multiply' }} />
       </div>
     ) : (
       <div className="h-24"></div>
     )}
     <div className="font-bold uppercase underline">{currentUser.name}</div>
     <div className="font-mono">NIP. {currentUser.nip}</div>
   </div>
 </div>

 </div>
 </div>
 </div>,
 document.body
  );
}
