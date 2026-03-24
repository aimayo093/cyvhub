import { Router } from 'express';
import { BusinessController } from '../controllers/business.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Require auth for all business routes
router.use(authenticate);

router.get('/', BusinessController.getBusinesses);
router.get('/:id', BusinessController.getBusiness);

// Only admins can create businesses
router.post('/', requireRole(['admin']), BusinessController.createBusiness);

export default router;
