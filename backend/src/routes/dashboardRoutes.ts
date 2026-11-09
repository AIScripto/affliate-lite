import { createRouter } from '../utils/asyncRouter';
import { getDashboardSummary } from '../controllers/dashboardController';
import { validate } from '../middleware/validate';
import { DashboardQuerySchema } from '../schemas';
import { authenticate, stripPublisherFinancials } from '../middleware/auth';

const router = createRouter();

router.get(
  '/summary',
  authenticate,
  stripPublisherFinancials,
  validate({ query: DashboardQuerySchema }),
  getDashboardSummary
);

export default router;
