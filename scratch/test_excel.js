const fs = require('fs');
const XLSX = require('xlsx');

// Mocking the structure of the user's Excel file as JSON to test my parser
const jsonRaw = [
  [],
  [],
  [],
  [],
  ["", "", "", "", "Semester I", "", "", "", "", "Semester II"],
  ["", "", "", "", "Triwulan I", "", "", "Triwulan II", "", "", "Triwulan III", "", "", "Triwulan IV"],
  ["", "", "", "", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"],
  [5.1, "BELANJA OPERASI", "3.500.000,00", "3.500.000,00", "250.000,00", "250.000,00", "250.000,00", "1.000.000,00", "250.000,00", "250.000,00", "250.000,00", "250.000,00", "250.000,00", "250.000,00", "250.000,00", "250.000,00"],
  ["5.1.02", "Belanja Barang", "3.500.000,00", "3.500.000,00", "250.000,00", "250.000,00", "250.000,00", "1.000.000,00", "250.000,00", "250.000,00", "250.000,00", "250.000,00", "250.000,00", "250.000,00", "250.000,00", "250.000,00"],
  ["5.1.02.01", "Belanja Barang", "3.500.000,00", "3.500.000,00", "250.000,00", "250.000,00", "250.000,00", "1.000.000,00", "250.000,00", "250.000,00", "250.000,00", "250.000,00", "250.000,00", "250.000,00", "250.000,00", "250.000,00"]
];

let monthRowIdx = -1;
const monthCols = {}; // { 'Januari': colIdx, ... }
const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

// Cari baris yang mengandung nama-nama bulan
for (let i = 0; i < Math.min(jsonRaw.length, 50); i++) {
  const row = jsonRaw[i];
  if (!row || !Array.isArray(row)) continue;
  
  let foundMonths = 0;
  row.forEach((cell, colIdx) => {
    if (typeof cell === 'string') {
      const cleanCell = cell.trim().toLowerCase();
      const matchedMonth = months.find(m => cleanCell.includes(m.toLowerCase()));
      if (matchedMonth) {
        monthCols[matchedMonth] = colIdx;
        foundMonths++;
      }
    }
  });

  if (foundMonths >= 6) { // Jika ketemu minimal 6 bulan, asumsikan ini baris bulan
    monthRowIdx = i;
    break;
  }
}

console.log("Month Row Index:", monthRowIdx);
console.log("Month Cols:", monthCols);

const parsedData = [];

// Cari data mulai dari baris setelah baris bulan
for (let i = monthRowIdx + 1; i < jsonRaw.length; i++) {
  const row = jsonRaw[i];
  if (!row || !Array.isArray(row)) continue;

  const kodeRekeningRaw = row[0] || row[1] || row[2];
  if (typeof kodeRekeningRaw === 'string' && /^\d+(\.\d+)+$/.test(kodeRekeningRaw.trim())) {
    const kodeRekening = kodeRekeningRaw.trim();
    
    const uraianRaw = row[1] || row[2] || row[3];
    const uraian = typeof uraianRaw === 'string' ? uraianRaw.trim() : '';

    const bulanData = {};
    months.forEach(m => {
      const colIdx = monthCols[m];
      if (colIdx !== undefined) {
        const val = row[colIdx];
        if (val !== undefined && val !== null && val !== '') {
          const strVal = String(val).trim();
          let cleanVal = strVal.replace(/\./g, '').split(',')[0].replace(/[^\d-]/g, '');
          const numVal = parseInt(cleanVal, 10);
          bulanData[m] = isNaN(numVal) ? 0 : numVal;
        } else {
          bulanData[m] = 0;
        }
      } else {
        bulanData[m] = 0;
      }
    });

    const total = months.reduce((sum, m) => sum + (bulanData[m] || 0), 0);
    
    if (total > 0) {
      parsedData.push({
        kodeRekening,
        uraian,
        ...bulanData,
        total
      });
    }
  } else {
    console.log("Row skipped. kodeRekeningRaw:", kodeRekeningRaw, typeof kodeRekeningRaw);
  }
}

console.log('Parsed RKA Data:', parsedData);
