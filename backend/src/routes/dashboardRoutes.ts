import { Router } from 'express';
import { getDashboardSummary } from '../controllers/dashboardController';
import { validate } from '../middleware/validate';
import { DashboardQuerySchema } from '../schemas';
import { authenticate, stripPublisherFinancials } from '../middleware/auth';

const router = Router();

router.get(
  '/summary',
  authenticate,
  stripPublisherFinancials,
  validate({ query: DashboardQuerySchema }),
  getDashboardSummary
);

export default router;
