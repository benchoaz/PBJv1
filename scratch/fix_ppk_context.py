import re

with open("frontend/src/components/ppk/PPKContext.jsx", "r") as f:
    code = f.read()

# I will add getPackageItems inside PPKProvider

get_package_items_code = """
  // Helper to match DPA Account
  const getMatchingDpaAccount = (pack) => {
    if (!pack) return null;
    const paguStr = pack.pagu.toString();
    const kw = pack.packName.toLowerCase();
    
    return dpaAccounts.find(acc => {
      if (acc.pagu_total && acc.pagu_total.toString() === paguStr) return true;
      const nm = acc.nama_rekening.toLowerCase();
      if (kw.includes('atk') && (nm.includes('alat tulis kantor') || nm.includes('atk'))) return true;
      if ((kw.includes('mamin') || kw.includes('makan')) && (nm.includes('makanan') || nm.includes('minuman'))) return true;
      if ((kw.includes('kertas') || kw.includes('cover')) && nm.includes('kertas')) return true;
      if (kw.includes('komputer') && nm.includes('komputer')) return true;
      if (kw.includes('cetak') && nm.includes('cetak')) return true;
      return false;
    });
  };

  const getPackageItems = (pack) => {
    if (!pack) return [];

    const matchedAcc = getMatchingDpaAccount(pack);
    const kodeRekening = matchedAcc?.account;

    if (kodeRekening && dpaRincian[kodeRekening] && dpaRincian[kodeRekening].length > 0) {
      return dpaRincian[kodeRekening].map((r, i) => ({
        no: i + 1, name: r.nama, qty: r.volume, unit: r.satuan, price: r.harga_satuan,
      }));
    }

    const keyNoSirup = `nosirup_${pack.noSirup}`;
    if (dpaRincian[keyNoSirup] && dpaRincian[keyNoSirup].length > 0) {
      return dpaRincian[keyNoSirup].map((r, i) => ({
        no: i + 1, name: r.nama, qty: r.volume, unit: r.satuan, price: r.harga_satuan,
      }));
    }

    return [
      { no: 1, name: '⚠️ Rincian belum tersedia — klik "Edit Rincian" pada tabel DPA di atas', qty: 1, unit: 'Paket', price: pack.pagu }
    ];
  };
"""

# Insert before "const resetAll = () => {"
reset_idx = code.find("const resetAll = () => {")
new_code = code[:reset_idx] + get_package_items_code + "\n  " + code[reset_idx:]

# Also export it in `value`
value_idx = new_code.find("const value = {")
if value_idx != -1:
    end_value_idx = new_code.find("};", value_idx)
    inner_val = new_code[value_idx:end_value_idx]
    new_code = new_code[:value_idx] + inner_val + ", getPackageItems" + new_code[end_value_idx:]

with open("frontend/src/components/ppk/PPKContext.jsx", "w") as f:
    f.write(new_code)
print("Updated PPKContext.jsx")
