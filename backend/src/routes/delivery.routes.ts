import { Router } from 'express';
import { DeliveryController } from '../controllers/delivery.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// GET /api/deliveries (Filter based on customer vs driver vs carrier)
router.get('/', authenticate, DeliveryController.getDeliveries);

// POST /api/deliveries (Create a new delivery/job)
router.post('/', authenticate, DeliveryController.createDelivery);

// PATCH /api/deliveries/:id/cancel
router.patch('/:id/cancel', authenticate, DeliveryController.cancelDelivery);

export default router;
