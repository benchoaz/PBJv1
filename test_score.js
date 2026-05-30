function getSimilarityScore(target, candidate) {
  if (!target || !candidate) return 0;
  const tClean = target.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  const cClean = candidate.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  if (tClean.length === 0 || cClean.length === 0) return 0;

  const tSet = new Set(tClean);
  const cSet = new Set(cClean);

  let overlapCount = 0;
  tClean.forEach(word => { if (cSet.has(word)) overlapCount++; });
  const overlapScore = overlapCount / tClean.length;

  let intersection = 0;
  tSet.forEach(word => { if (cSet.has(word)) intersection++; });
  const union = new Set([...tClean, ...cClean]).size;
  const jaccardScore = intersection / union;

  const lengthRatio = Math.min(tClean.length / cClean.length, cClean.length / tClean.length);
  const lengthPenalty = 0.8 + (0.2 * lengthRatio); 

  let positionBonus = 1.0;
  if (tClean.length > 0 && cClean.indexOf(tClean[0]) === 0) {
    positionBonus = 1.1; 
  }

  const baseScore = (overlapScore * 0.6) + (jaccardScore * 0.4);
  return baseScore * lengthPenalty * positionBonus;
}

const target = "L121";
const cands = [
  "PRINTER L121",
  "Printer EPSON L121",
  "Printer L121 Epson",
  "EPSON PRINTER EPSON L121",
  "Printer Epson L121",
  "PRINTER EPSON L121",
  "PRINTER EPSON L121",
  "Epson L121",
  "EPSON Printer L121",
  "Printer ink tank L121"
];

cands.forEach(c => {
  console.log(`Score for "${c}" = ${getSimilarityScore(target, c).toFixed(3)}`);
});
