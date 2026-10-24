import { Router } from 'express';
import authRoutes from './authRoutes';
import dashboardRoutes from './dashboardRoutes';
import publishersRoutes from './publishersRoutes';
import domainsRoutes from './domainsRoutes';
import networksRoutes from './networksRoutes';
import offersRoutes from './offersRoutes';
import reportsRoutes from './reportsRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/publishers', publishersRoutes);
router.use('/domains', domainsRoutes);
router.use('/networks', networksRoutes);
router.use('/offers', offersRoutes);
router.use('/reports', reportsRoutes);

export default router;
