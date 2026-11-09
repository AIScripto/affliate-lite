import { createRouter } from '../utils/asyncRouter';
import { getPostbackLogs } from '../controllers/postbackLogsController';
import { validate } from '../middleware/validate';
import { PostbackLogsQuerySchema } from '../schemas';
import { authenticate, requireRole } from '../middleware/auth';

const router = createRouter();

router.use(authenticate, requireRole('ADMIN'));

router.get('/', validate({ query: PostbackLogsQuerySchema }), getPostbackLogs);

export default router;
