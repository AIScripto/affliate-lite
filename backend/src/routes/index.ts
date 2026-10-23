import { Router } from 'express';
import { handleRedirect } from '../controllers/redirectController';
import { handlePostback } from '../controllers/postbackController';
import { getBrandParams, saveBrandParam, deleteBrandParam } from '../controllers/brandParamsController';
import { getMasterReports } from '../controllers/reportsController';
import { getSubAffiliateStats, requestPayout } from '../controllers/portalController';
import { getProducts, createProduct, updateProduct, deleteProduct, toggleProductStatus } from '../controllers/productsController';
import { getUsers, registerSubAffiliate, toggleUserStatus, updateUser, deleteUser } from '../controllers/authController';

const router = Router();

// Public Shopper Inbound Traffic Redirector (<50ms target)
router.get('/go/:product_slug', handleRedirect);

// Brand S2S Postback Webhook
router.all('/api/v1/postback', handlePostback);

// Brand Parameter Registry Management (Admin)
router.get('/api/admin/brand-params', getBrandParams);
router.post('/api/admin/brand-params', saveBrandParam);
router.delete('/api/admin/brand-params/:id', deleteBrandParam);

// Master Reporting & Analytics (Admin)
router.get('/api/reports/master', getMasterReports);

// Partner Portal & Scoped Statistics (Sub-Affiliate)
router.get('/api/portal/my-stats', getSubAffiliateStats);
router.post('/api/portal/payout-request', requestPayout);

// Products Catalog Configuration
router.get('/api/products', getProducts);
router.post('/api/products', createProduct);
router.put('/api/products/:id', updateProduct);
router.delete('/api/products/:id', deleteProduct);
router.patch('/api/products/:id/status', toggleProductStatus);

// User Accounts & Role Management
router.get('/api/auth/users', getUsers);
router.post('/api/auth/register-sub', registerSubAffiliate);
router.put('/api/auth/users/:id', updateUser);
router.delete('/api/auth/users/:id', deleteUser);
router.patch('/api/auth/users/:id/status', toggleUserStatus);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
