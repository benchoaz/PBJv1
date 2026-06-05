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

  // Indonesian number to words converter (Terbilang)
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
