import { Router } from 'express';
import {
    distanceController,
    geocodeController,
    routePricingController,
} from '../controllers/maps.controller';
import { optionalAuthenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/geocode', optionalAuthenticate, geocodeController);
router.post('/distance', optionalAuthenticate, distanceController);
router.post('/route-pricing', optionalAuthenticate, routePricingController);

export default router;
