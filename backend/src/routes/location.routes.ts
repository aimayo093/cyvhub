import { Router } from 'express';
import { updateDriverLocation, getActiveDriverLocations, calculateDistance } from '../controllers/location.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

/**
 * PATCH /api/location
 * 
 * Drivers call this endpoint periodically to push their GPS coordinates.
 * The DB write triggers Supabase Realtime, broadcasting the change to all
 * subscribed tracking clients (admin dashboard, customer tracking views).
 */
router.patch('/', authenticate, updateDriverLocation);

/**
 * GET /api/location/drivers
 * 
 * Returns last-known locations of all active drivers.
 * Used to hydrate the map before Supabase Realtime subscription kicks in.
 * Accessible by admins, customers, and carriers.
 */
router.get('/drivers', authenticate, requireRole(['admin', 'customer', 'carrier']), getActiveDriverLocations);

/**
 * GET /api/location/addresses?postcode=...
 */
router.get('/addresses', authenticate, require('../controllers/location.controller').getAddressesByPostcode);

/**
 * GET /api/location/autocomplete?query=...
 */
router.get('/autocomplete', authenticate, require('../controllers/location.controller').autocompleteAddress);

/**
 * POST /api/location/distance
 */
router.post('/distance', authenticate, calculateDistance);

export default router;
