import { Router } from 'express';
import { CarrierController } from '../controllers/carrier.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Retrieve all carriers
router.get('/', authenticate, CarrierController.getCarriers);

// Carrier specific dashboards (Before /:id to prevent matching as id)
router.get('/my/profile', authenticate, CarrierController.getMyProfile);
router.get('/my/fleet', authenticate, CarrierController.getMyFleet);
router.post('/my/fleet', authenticate, CarrierController.addVehicle);
router.patch('/my/fleet/:id', authenticate, CarrierController.updateVehicle);
router.get('/my/drivers', authenticate, CarrierController.getMyDrivers);

// Retrieve a specific carrier block by ID
router.get('/:id', authenticate, CarrierController.getCarrierById);

// Add a new carrier (Requires Admin)
router.post('/', authenticate, requireRole(['admin']), CarrierController.createCarrier);

export default router;
