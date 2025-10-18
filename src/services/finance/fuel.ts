// Calculates monthly fuel or energy cost based on provided efficiency metrics.
// If mpge is provided (and mpg is not), use EV energy cost: 33.7 kWh per gallon equivalent.
export function monthlyFuelCost(
  milesPerMonth: number,
  mpg?: number,
  mpge?: number,
  fuelPrice: number = 3.5,
  kwhPrice: number = 0.13
): number {
  if (!isFinite(milesPerMonth) || milesPerMonth <= 0) return 0;

  if ((mpg === undefined || mpg <= 0) && mpge && mpge > 0) {
    const kwhPerMile = 33.7 / mpge;
    return milesPerMonth * kwhPerMile * kwhPrice;
  }

  const effectiveMpg = mpg && mpg > 0 ? mpg : 25; // fallback assumption
  const gallons = milesPerMonth / effectiveMpg;
  return gallons * fuelPrice;
}


