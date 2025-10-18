export function aprFromCredit(score: number, baseApr: number): number {
  if (!isFinite(score) || !isFinite(baseApr)) return baseApr;
  if (score >= 760) return Math.max(0, baseApr - 0.01);
  if (score >= 700) return Math.max(0, baseApr);
  if (score >= 640) return Math.max(0, baseApr + 0.01);
  return Math.max(0, baseApr + 0.02);
}


