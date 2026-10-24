import { Router } from 'express';
import {
  createPublisher,
  getPublishers,
  getPublisherById,
  updatePublisher,
  updatePublisherStatus,
  deletePublisher,
} from '../controllers/publishersController';
import { validate } from '../middleware/validate';
import {
  CreatePublisherSchema,
  UpdatePublisherSchema,
  UpdatePublisherStatusSchema,
} from '../schemas';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Publishers routes are restricted to ADMIN per RBAC Matrix (specs/backend/01-Architecture-and-Data-Models.md Section 4)
router.use(authenticate, requireRole('ADMIN'));

router.post('/', validate({ body: CreatePublisherSchema }), createPublisher);
router.get('/', getPublishers);
router.get('/:id', getPublisherById);
router.put('/:id', validate({ body: UpdatePublisherSchema }), updatePublisher);
router.patch('/:id/status', validate({ body: UpdatePublisherStatusSchema }), updatePublisherStatus);
router.delete('/:id', deletePublisher);

export default router;
