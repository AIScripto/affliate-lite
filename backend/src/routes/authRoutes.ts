import { createRouter } from '../utils/asyncRouter';
import { login, getMe } from '../controllers/authController';
import { validate } from '../middleware/validate';
import { LoginSchema } from '../schemas';
import { authenticate } from '../middleware/auth';

const router = createRouter();

router.post('/login', validate({ body: LoginSchema }), login);
router.get('/me', authenticate, getMe);

export default router;
