import { Router } from 'express';
import { DeliveryController } from '../controllers/delivery.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';

const router = Router();

// GET /api/deliveries (Filter based on customer vs driver vs carrier)
router.get('/', authenticate, DeliveryController.getDeliveries);

// POST /api/deliveries (Create a new delivery/job)
router.post('/', optionalAuthenticate, DeliveryController.createDelivery);

// PATCH /api/deliveries/:id/cancel
router.patch('/:id/cancel', authenticate, DeliveryController.cancelDelivery);

// PATCH /api/deliveries/:id (General update)
router.patch('/:id', authenticate, DeliveryController.updateDelivery);

export default router;
