import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getDashboardOverview, getComplianceList, getHRList, getUsersList } from '../controllers/admin.controller';

const router = Router();

// Fully shielded behind authentication
router.use(authenticate);

router.get('/dashboard', getDashboardOverview);
router.get('/compliance', getComplianceList);
router.get('/hr-records', getHRList);
router.get('/users', getUsersList);

export default router;
