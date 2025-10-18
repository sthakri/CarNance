import { monthlyPayment, totalInterest } from '../src/services/finance/amortization';

describe('amortization', () => {
  test('monthlyPayment is within reasonable range for sample numbers', () => {
    const principal = 30000; // $30k car
    const apr = 0.06; // 6% APR
    const months = 60; // 5 years
    const pmt = monthlyPayment(principal, apr, months);
    // For 30k @ 6%/60mo, expected around $580-$600
    expect(pmt).toBeGreaterThan(550);
    expect(pmt).toBeLessThan(650);
  });

  test('totalInterest is non-negative and plausible', () => {
    const interest = totalInterest(30000, 0.06, 60);
    expect(interest).toBeGreaterThan(0);
    expect(interest).toBeLessThan(10000);
  });
});


