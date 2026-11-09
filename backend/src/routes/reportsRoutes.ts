import { createRouter } from '../utils/asyncRouter';
import {
  getReportsOverview,
  getNetworksReport,
  getOffersReport,
  getPublishersReport,
  getConversionsReport,
  getTrafficReport,
} from '../controllers/reportsController';
import { authenticate, stripPublisherFinancials } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { ReportsQuerySchema } from '../schemas';

const router = createRouter();

router.use(authenticate, stripPublisherFinancials, validate({ query: ReportsQuerySchema }));

router.get('/overview', getReportsOverview);
router.get('/networks', getNetworksReport);
router.get('/offers', getOffersReport);
router.get('/publishers', getPublishersReport);
router.get('/conversions', getConversionsReport);
router.get('/traffic', getTrafficReport);

export default router;
