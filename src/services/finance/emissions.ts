// Rough CO2 per mile factors (kg CO2/mile)
// Gas/Hybrid uses tailpipe; EV uses US grid average.
const CO2_PER_MILE = {
  Gas: 0.404, // ~404 g/mile
  Hybrid: 0.25, // better than gas
  EV: 0.18 // grid dependent
} as const;

export function co2PerMonth(milesPerMonth: number, type: 'Gas' | 'Hybrid' | 'EV', overrideKgPerMile?: number): number {
  if (!isFinite(milesPerMonth) || milesPerMonth <= 0) return 0;
  const kgPerMile = overrideKgPerMile ?? CO2_PER_MILE[type];
  return milesPerMonth * kgPerMile;
}


