import { Router } from 'express';
import { z } from 'zod';
import { loadModels } from '../services/recommend/dataset';
import { recommendModels } from '../services/recommend/recommender';

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

router.post('/recommend', async (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
    return res.status(400).json({ data: null, error: { message: `Invalid request: ${message}`, status: 400 } });
  }

  const models = await loadModels();
  const recommendations = recommendModels(parsed.data, models);
  return res.json({ data: { models: recommendations }, error: null });
});

export default router;


