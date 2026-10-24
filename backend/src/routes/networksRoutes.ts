import { Router } from 'express';
import {
  createNetwork,
  getNetworks,
  getNetworkById,
  updateNetwork,
  updateNetworkStatus,
  deleteNetwork,
} from '../controllers/networksController';
import { validate } from '../middleware/validate';
import { CreateNetworkSchema, UpdateNetworkSchema } from '../schemas';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate, requireRole('ADMIN'));

router.post('/', validate({ body: CreateNetworkSchema }), createNetwork);
router.get('/', getNetworks);
router.get('/:id', getNetworkById);
router.put('/:id', validate({ body: UpdateNetworkSchema }), updateNetwork);
router.patch('/:id/status', updateNetworkStatus);
router.delete('/:id', deleteNetwork);

export default router;
