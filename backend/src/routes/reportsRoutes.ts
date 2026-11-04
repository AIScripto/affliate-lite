import { Router } from 'express';
import {
  getReportsOverview,
  getNetworksReport,
  getOffersReport,
  getPublishersReport,
  getConversionsReport,
  getTrafficReport,
} from '../controllers/reportsController';
import { authenticate, stripPublisherFinancials } from '../middleware/auth';

const router = Router();

router.use(authenticate, stripPublisherFinancials);

router.get('/overview', getReportsOverview);
router.get('/networks', getNetworksReport);
router.get('/offers', getOffersReport);
router.get('/publishers', getPublishersReport);
router.get('/conversions', getConversionsReport);
router.get('/traffic', getTrafficReport);

export default router;
