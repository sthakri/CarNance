export function monthlyPayment(principal: number, apr: number, months: number): number {
  if (!isFinite(principal) || !isFinite(apr) || !isFinite(months)) return 0;
  if (principal <= 0 || months <= 0) return 0;
  const monthlyRate = apr / 12;
  if (monthlyRate === 0) return principal / months;
  const factor = Math.pow(1 + monthlyRate, -months);
  const payment = (principal * monthlyRate) / (1 - factor);
  return Number.isFinite(payment) ? payment : 0;
}

export function totalInterest(principal: number, apr: number, months: number): number {
  const payment = monthlyPayment(principal, apr, months);
  if (payment <= 0) return 0;
  const totalPaid = payment * months;
  return Math.max(0, totalPaid - principal);
}


