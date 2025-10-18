import { Router } from 'express';
import { z } from 'zod';
import { loadModels } from '../services/recommend/dataset';
import { buildScenarioSeries } from '../services/finance';

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

const PredictSchema = z.object({
  user: RecommendSchema,
  modelName: z.string()
});

router.post('/predict', async (req, res) => {
  const parsed = PredictSchema.safeParse(req.body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
    return res.status(400).json({ data: null, error: { message: `Invalid request: ${message}`, status: 400 } });
  }

  const models = await loadModels();
  const model = models.find(m => m.name.toLowerCase() === parsed.data.modelName.toLowerCase());
  if (!model) {
    return res.status(404).json({ data: null, error: { message: 'Model not found', status: 404 } });
  }

  const result = buildScenarioSeries(parsed.data.user, model);
  return res.json({ data: { scenarios: { lease: result.lease, buy: result.buy, creditBoost: result.creditBoost }, headline: result.headline }, error: null });
});

export default router;


