import { Router } from 'express';
import { z } from 'zod';
import { aprFromCredit } from '../services/finance/rates';
import { monthlyPayment } from '../services/finance/amortization';

const router = Router();

const CalcSchema = z.object({
  carPrice: z.number().min(0),
  downPayment: z.number().min(0).optional(),
  creditScore: z.number(),
  loanMonths: z.number().int().positive(),
  leaseMonths: z.number().int().positive(),
  baseApr: z.number().min(0)
});

router.post('/calc', (req, res) => {
  const parsed = CalcSchema.safeParse(req.body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join('; ');
    return res.status(400).json({ data: null, error: { message: `Invalid request: ${message}`, status: 400 } });
  }

  const { carPrice, downPayment = 0, creditScore, loanMonths, leaseMonths, baseApr } = parsed.data;
  const principal = Math.max(0, carPrice - downPayment);
  const apr = aprFromCredit(creditScore, baseApr);
  const buyMonthly = monthlyPayment(principal, apr, loanMonths);
  const leasePrincipal = principal * (1 - 0.58);
  const leaseMonthly = monthlyPayment(leasePrincipal, apr, leaseMonths);

  return res.json({ data: { buyMonthly, leaseMonthly, apr }, error: null });
});

export default router;


