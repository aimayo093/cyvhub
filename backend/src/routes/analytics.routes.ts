import { Router } from 'express';
import { getPlatformAnalytics, getEarnings } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all analytics routes
router.use(authenticate);

router.get('/platform', getPlatformAnalytics);
router.get('/earnings', getEarnings);

export default router;
