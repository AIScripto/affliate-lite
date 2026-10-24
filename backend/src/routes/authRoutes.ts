import { Router } from 'express';
import { login, getMe } from '../controllers/authController';
import { validate } from '../middleware/validate';
import { LoginSchema } from '../schemas';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/login', validate({ body: LoginSchema }), login);
router.get('/me', authenticate, getMe);

export default router;
