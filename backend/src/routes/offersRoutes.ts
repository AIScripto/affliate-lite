import { Router } from 'express';
import {
  createOffer,
  getOffers,
  getOfferById,
  updateOffer,
  updateOfferStatus,
  deleteOffer,
  duplicateOffer,
} from '../controllers/offersController';
import {
  getOfferAffiliates,
  assignOfferAffiliate,
  unassignOfferAffiliate,
} from '../controllers/affiliatesController';
import { validate } from '../middleware/validate';
import { UpsertOfferSchema } from '../schemas';
import { authenticate, requireRole, stripPublisherFinancials } from '../middleware/auth';

const router = Router();

// Read operations accessible to both ADMIN and PUBLISHER (with financial stripping)
router.get('/', authenticate, stripPublisherFinancials, getOffers);
router.get('/:id', authenticate, stripPublisherFinancials, getOfferById);

// Dual-list affiliate assignment operations (ADMIN only)
router.get('/:id/affiliates', authenticate, requireRole('ADMIN'), getOfferAffiliates);
router.post('/:id/affiliates/:publisherId', authenticate, requireRole('ADMIN'), assignOfferAffiliate);
router.delete('/:id/affiliates/:publisherId', authenticate, requireRole('ADMIN'), unassignOfferAffiliate);

// Administrative Offer mutations (ADMIN only)
router.post('/', authenticate, requireRole('ADMIN'), validate({ body: UpsertOfferSchema }), createOffer);
router.put('/:id', authenticate, requireRole('ADMIN'), validate({ body: UpsertOfferSchema }), updateOffer);
router.patch('/:id/status', authenticate, requireRole('ADMIN'), updateOfferStatus);
router.delete('/:id', authenticate, requireRole('ADMIN'), deleteOffer);
router.post('/:id/duplicate', authenticate, requireRole('ADMIN'), duplicateOffer);

export default router;
