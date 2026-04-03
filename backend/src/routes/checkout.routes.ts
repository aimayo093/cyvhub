import { Router } from 'express';
import { CheckoutController } from '../controllers/checkout.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

// POST /api/checkout/invoice
// Restricted to authenticated users (who will be checked for businessAccountId in controller)
router.post('/invoice', authenticate, CheckoutController.checkoutInvoice);

// POST /api/checkout/manual-complete
// Restricted to Admin
router.post('/manual-complete', authenticate, requireRole(['admin']), CheckoutController.manualComplete);

export default router;
