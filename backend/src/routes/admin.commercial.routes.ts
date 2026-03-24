import { Router } from 'express';
import { AdminCommercialController } from '../controllers/admin.commercial.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Superadmin Protection Guard
router.use(authenticate, requireRole(['admin']));

// Vehicles
router.get('/vehicles', AdminCommercialController.getVehicleClasses);
router.post('/vehicles', AdminCommercialController.createVehicleClass);
router.put('/vehicles/:id', AdminCommercialController.updateVehicleClass);

// Rules
router.post('/pricing-rules', AdminCommercialController.createPricingRule);
router.delete('/pricing-rules/:id', AdminCommercialController.deletePricingRule);

router.post('/payout-rules', AdminCommercialController.createPayoutRule);
router.delete('/payout-rules/:id', AdminCommercialController.deletePayoutRule);

export default router;
