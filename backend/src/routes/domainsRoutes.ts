import { Router } from 'express';
import {
  createDomain,
  getDomains,
  updateDomainStatus,
  deleteDomain,
} from '../controllers/domainsController';
import { validate } from '../middleware/validate';
import { CreateDomainSchema, UpdateDomainStatusSchema } from '../schemas';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate, requireRole('ADMIN'));

router.post('/', validate({ body: CreateDomainSchema }), createDomain);
router.get('/', getDomains);
router.patch('/:id/status', validate({ body: UpdateDomainStatusSchema }), updateDomainStatus);
router.delete('/:id', deleteDomain);

export default router;
