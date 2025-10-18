import { CarModel } from '../../types/domain';
import { RecommendInput } from '../../types/api';
import { aprFromCredit } from './rates';
import { monthlyPayment, totalInterest } from './amortization';
import { monthlyFuelCost } from './fuel';
import { co2PerMonth } from './emissions';
import { depreciationByMonth } from './depreciation';

export interface PredictionPoint {
  month: number;
  totalCost: number;
  payment: number;
  fuelOrEnergyCost: number;
  maintenanceCost: number;
  depreciation: number;
  co2: number;
}

export function buildScenarioSeries(userInput: RecommendInput, car: CarModel): {
  lease: PredictionPoint[];
  buy: PredictionPoint[];
  creditBoost: PredictionPoint[];
  headline: { buyMonthly: number; leaseMonthly: number; totalInterestBuy: number };
} {
  const loanMonths = userInput.driving.loanTermMonths ?? 60;
  const leaseMonths = userInput.driving.leaseTermMonths ?? 36;
  const milesPerMonth = userInput.driving.avgMonthlyMileage;
  const downPayment = userInput.financials.downPayment ?? 0;
  const apr = aprFromCredit(userInput.financials.creditScore, car.aprBase);

  const principal = Math.max(0, car.msrp - downPayment);

  const buyMonthly = monthlyPayment(principal, apr, loanMonths);
  const leasePrincipal = principal * (1 - car.leaseResidualPct);
  const leaseMonthly = monthlyPayment(leasePrincipal, apr, leaseMonths);
  const totalInterestBuy = totalInterest(principal, apr, loanMonths);

  const maxMonths = Math.max(loanMonths, leaseMonths, 60);

  const fuelCostFor = () => monthlyFuelCost(milesPerMonth, car.mpg, car.mpge);
  const co2For = () => co2PerMonth(milesPerMonth, car.type);

  const makePoint = (month: number, payment: number): PredictionPoint => {
    const fuel = fuelCostFor();
    const maint = 0;
    const dep = depreciationByMonth(car.msrp, month, maxMonths, milesPerMonth * 12);
    const co2 = co2For();
    return {
      month,
      totalCost: payment + fuel + maint,
      payment,
      fuelOrEnergyCost: fuel,
      maintenanceCost: maint,
      depreciation: dep,
      co2
    };
  };

  const leaseSeries: PredictionPoint[] = [];
  for (let m = 1; m <= leaseMonths; m++) leaseSeries.push(makePoint(m, leaseMonthly));

  const buySeries: PredictionPoint[] = [];
  for (let m = 1; m <= loanMonths; m++) buySeries.push(makePoint(m, buyMonthly));

  const creditBoostSeries: PredictionPoint[] = [];
  // 12 months wait: payment = 0, then improved APR by 15%
  const improvedApr = Math.max(0, apr * 0.85);
  const boostedMonthly = monthlyPayment(principal, improvedApr, loanMonths);
  for (let m = 1; m <= 12; m++) creditBoostSeries.push(makePoint(m, 0));
  for (let m = 13; m <= 12 + loanMonths; m++) creditBoostSeries.push(makePoint(m, boostedMonthly));

  return {
    lease: leaseSeries,
    buy: buySeries,
    creditBoost: creditBoostSeries,
    headline: { buyMonthly, leaseMonthly, totalInterestBuy }
  };
}


