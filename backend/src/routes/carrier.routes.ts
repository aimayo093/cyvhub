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
router.get('/my/rates', authenticate, CarrierController.getMyRates);
router.post('/my/rates', authenticate, CarrierController.addRate);
router.patch('/my/rates/:id', authenticate, CarrierController.updateRate);

// Retrieve a specific carrier block by ID
router.get('/:id', authenticate, CarrierController.getCarrierById);

// Update status of a specific carrier (Admin Only)
router.patch('/:id/status', authenticate, requireRole(['admin']), CarrierController.updateCarrierStatus);

// Add a new carrier (Requires Admin)
router.post('/', authenticate, requireRole(['admin']), CarrierController.createCarrier);

export default router;
