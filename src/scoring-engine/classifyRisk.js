/**
 * Map a numeric score to a risk label using configured ranges.
 * Ranges are inclusive on both ends; first match wins.
 */
export function classifyRiskFromRanges(score, riskRanges = []) {
  if (!Number.isFinite(score)) return "Medium";

  for (const range of riskRanges) {
    const min = Number(range.min);
    const max = Number(range.max);
    if (Number.isFinite(min) && Number.isFinite(max) && score >= min && score <= max) {
      return range.label ?? "Medium";
    }
  }

  if (score <= 2) return "High";
  if (score <= 3) return "Medium";
  return "Low";
}
