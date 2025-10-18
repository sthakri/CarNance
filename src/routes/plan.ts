import { Router } from 'express';
import { z } from 'zod';
import { loadModels } from '../services/recommend/dataset';
import { recommendModels } from '../services/recommend/recommender';
import { buildScenarioSeries } from '../services/finance';
import { generateNarration } from '../services/ai/narrate';

const router = Router();

const RecommendSchema = z.object({
  financials: z.object({
    monthlyIncome: z.number(),
    spouseIncome: z.number().optional(),
    monthlyBudget: z.number().optional(),
    creditScore: z.number(),
    downPayment: z.number().min(0).optional(),
    goal: z.enum(['lowest-monthly', 'ownership', 'eco']).optional()
  }),
  driving: z.object({
    avgMonthlyMileage: z.number(),
    preferredType: z.enum(['Gas', 'Hybrid', 'EV']),
    size: z.enum(['Compact', 'Sedan', 'SUV', 'Truck']).optional(),
    leaseTermMonths: z.number().int().positive().optional(),
    loanTermMonths: z.number().int().positive().optional()
  })
});

router.post('/plan', async (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    const details = parsed.error.issues.map((e) => ({ path: e.path, message: e.message }));
    return res.status(400).json({ data: null, error: { message: 'ValidationError', details, status: 400 } });
  }

  const allModels = await loadModels();
  const models = recommendModels(parsed.data, allModels);
  const chosen = models[0];

  if (!chosen) {
    return res.json({ data: { models: [], chosen: null, scenarios: { lease: [], buy: [], creditBoost: [] }, headline: null, summary: 'No models available.' }, error: null });
  }

  const scenarios = buildScenarioSeries(parsed.data, { ...allModels.find(m => m.name === chosen.name)! });
  const leaseTotal = scenarios.lease.reduce((sum, p) => sum + p.totalCost, 0);
  const buyTotal = scenarios.buy.reduce((sum, p) => sum + p.totalCost, 0);
  const leaseMonths = parsed.data.driving.leaseTermMonths ?? 36;
  const baseSummary = `If you lease the ${chosen.name}, your total cost after ${leaseMonths} months is around $${leaseTotal.toFixed(0)} — saving ~$${(buyTotal - leaseTotal).toFixed(0)} compared to buying.`;

  const aiPrompt = `User profile:\n- Credit Score: ${parsed.data.financials.creditScore}\n- Monthly Income: $${parsed.data.financials.monthlyIncome}\nCar: ${chosen.name}\nLease Total: $${leaseTotal.toFixed(0)}\nBuy Total: $${buyTotal.toFixed(0)}\nGoal: Explain to a normal person what this means and which is smarter.`;
  const narration = await generateNarration(aiPrompt);

  return res.json({
    data: {
      models,
      chosen,
      scenarios: { lease: scenarios.lease, buy: scenarios.buy, creditBoost: scenarios.creditBoost },
      headline: scenarios.headline,
      summary: narration
    },
    error: null
  });
});

export default router;


