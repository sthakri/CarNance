import { CarModel } from '../../types/domain';
import { RecommendInput, RecommendedModel } from '../../types/api';
import { monthlyPayment } from '../finance/amortization';
import { aprFromCredit } from '../finance/rates';

export function recommendModels(input: RecommendInput, models: CarModel[]): RecommendedModel[] {
  const totalIncome = input.financials.monthlyIncome + (input.financials.spouseIncome ?? 0);
  const targetBudget = input.financials.monthlyBudget ?? totalIncome * 0.15;
  const downPayment = input.financials.downPayment ?? 0;
  const loanMonths = input.driving.loanTermMonths ?? 60;

  const preferredType = input.driving.preferredType;
  const preferredSize = input.driving.size;

  const scored = models.map((m) => {
    const apr = aprFromCredit(input.financials.creditScore, m.aprBase);
    const principal = Math.max(0, m.msrp - downPayment);
    const monthly = monthlyPayment(principal, apr, loanMonths);

    let score = 0;
    const budgetDiff = Math.abs(monthly - targetBudget);
    score -= budgetDiff; // closer is better

    if (m.type === preferredType) score += 50;
    if (preferredSize && m.size === preferredSize) score += 25;

    if (input.financials.goal === 'eco') {
      if (m.type === 'Hybrid') score += 10;
      if (m.type === 'EV') score += 20;
    }

    const rationaleParts: string[] = [];
    rationaleParts.push(`Est. monthly ~ $${monthly.toFixed(0)} vs budget $${targetBudget.toFixed(0)}`);
    if (m.type === preferredType) rationaleParts.push('matches preferred powertrain');
    if (preferredSize && m.size === preferredSize) rationaleParts.push('matches preferred size');

    return {
      model: m,
      monthly,
      score,
      rationale: rationaleParts.join('; ')
    };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((s) => ({ name: s.model.name, type: s.model.type, msrp: s.model.msrp, monthlyEstimate: s.monthly, rationale: s.rationale }));
}


