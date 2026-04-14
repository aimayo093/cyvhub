import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
    runDispatch,
    acceptOffer,
    rejectOffer,
    getPendingOffer,
    getDispatchQueue,
    updateAvailability,
    getOnlineDrivers,
} from '../controllers/dispatch.controller';

const router = Router();

// All dispatch routes require authentication
router.use(authenticate);

// ─── Admin endpoints ─────────────────────────────────────────────────────────
// Manually (re-)trigger automated dispatch for a specific job
router.post('/run/:jobId', runDispatch);

// View jobs currently searching/with active offers
router.get('/queue', getDispatchQueue);

// View online drivers/carriers
router.get('/drivers/online', getOnlineDrivers);

// ─── Driver / Carrier endpoints ───────────────────────────────────────────────
// Poll for a pending offer (replaces WebSocket for the MVP; call every 5s)
router.get('/offer/pending', getPendingOffer);

// Accept a specific offer
router.post('/offer/:attemptId/accept', acceptOffer);

// Reject a specific offer
router.post('/offer/:attemptId/reject', rejectOffer);

// Toggle online/offline status
router.patch('/availability', updateAvailability);

export default router;
