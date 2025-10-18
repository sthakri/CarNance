import { Router } from 'express';
import calcRouter from './calc';
import recommendRouter from './recommend';
import predictRouter from './predict';
import planRouter from './plan';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ data: { ok: true }, error: null });
});

router.use('/api', calcRouter);
router.use('/api', recommendRouter);
router.use('/api', predictRouter);
router.use('/api', planRouter);

export default router;


