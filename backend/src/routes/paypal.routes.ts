import { Router } from 'express';
import { PaypalController } from '../controllers/paypal.controller';
import { optionalAuthenticate } from '../middleware/auth.middleware';

const router = Router();

// POST /api/paypal/create-order
// Requires jobId to fetch server-side pricing
router.post('/create-order', optionalAuthenticate, PaypalController.createOrder);

// POST /api/paypal/capture-order
router.post('/capture-order', optionalAuthenticate, PaypalController.captureOrder);

export default router;
