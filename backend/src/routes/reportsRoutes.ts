import { Router } from 'express';
import {
  getNetworksReport,
  getOffersReport,
  getPublishersReport,
} from '../controllers/reportsController';
import { authenticate, stripPublisherFinancials } from '../middleware/auth';

const router = Router();

router.use(authenticate, stripPublisherFinancials);

router.get('/networks', getNetworksReport);
router.get('/offers', getOffersReport);
router.get('/publishers', getPublishersReport);

export default router;
