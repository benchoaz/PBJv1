import re

with open("frontend/src/components/ppk/PPKContext.jsx", "r") as f:
    code = f.read()

# Replace the primitive getMatchingDpaAccount with the robust one from Step3RincianHPS
robust_matcher = """  // Helper to match DPA Account
  const areAccountsCompatible = (dpaAcc, sirupMak) => {
    if (!dpaAcc || !sirupMak) return true;
    const indexFive = sirupMak.indexOf('5.');
    let cleanSirup = '';
    if (indexFive !== -1) {
      const makAccountPart = sirupMak.substring(indexFive);
      cleanSirup = makAccountPart.replace(/[^0-9]/g, '');
    } else {
      cleanSirup = sirupMak.replace(/[^0-9]/g, '');
    }
    const cleanDpa = dpaAcc.replace(/[^0-9]/g, '');
    if (!cleanDpa || !cleanSirup) return true;
    if (cleanSirup.includes(cleanDpa) || cleanDpa.includes(cleanSirup)) return true;
    const prefixDpa = cleanDpa.substring(0, 6);
    const prefixSirup = cleanSirup.substring(0, 6);
    if (prefixDpa && prefixSirup && prefixDpa === prefixSirup) return true;
    return false;
  };

  const getMatchingDpaAccount = (pack) => {
    if (!pack || !dpaAccounts || dpaAccounts.length === 0) return null;
    const stopWords = ['belanja', 'dan', 'untuk', 'kegiatan', 'bahan', 'alat', 'kantor', 'sub', 'penyediaan', 'jasa', 'modal'];

    return dpaAccounts.find(acc => {
      if (pack.mak && acc.account && !areAccountsCompatible(acc.account, pack.mak)) return false;
      const paguDifference = Math.abs((acc.pagu || 0) - (pack.pagu || 0));
      if (paguDifference < 1000) return true;

      const accWords = (acc.name || '').toLowerCase().split(/[\\s/.,()-]+/);
      const keywords = accWords.filter(w => w.length > 2 && !stopWords.includes(w));
      const packNameLower = (pack.packName || '').toLowerCase();
      const hasKeywordMatch = keywords.some(kw => packNameLower.includes(kw));
      if (hasKeywordMatch && (pack.pagu || 0) <= (acc.pagu || 0)) return true;

      return false;
    });
  };
"""

start_idx = code.find("  // Helper to match DPA Account")
if start_idx != -1:
    end_idx = code.find("  const getPackageItems = (pack) => {", start_idx)
    if end_idx != -1:
        code = code[:start_idx] + robust_matcher + "\n" + code[end_idx:]

with open("frontend/src/components/ppk/PPKContext.jsx", "w") as f:
    f.write(code)

print("Patched PPKContext.jsx with robust getMatchingDpaAccount")
