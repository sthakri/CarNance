// Simple depreciation curve: assume value decays faster early, using exponential decay
// and mileage impact scaling.
export function depreciationByMonth(msrp: number, month: number, months: number, annualMileage: number): number {
  if (msrp <= 0 || month <= 0 || months <= 0) return 0;
  const usageFactor = Math.min(2, 1 + (annualMileage - 12000) / 12000 * 0.2); // +/-20% per 12k deviation, capped
  const decayRate = 0.18 * usageFactor; // 18% annualized baseline
  const monthlyRate = 1 - Math.pow(1 - decayRate, 1 / 12);
  const valueNow = msrp * Math.pow(1 - monthlyRate, month);
  const depreciation = Math.max(0, msrp - valueNow);
  return depreciation;
}


