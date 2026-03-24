import { Router } from 'express';
import { generateQuote, getPendingReviews, approveReview } from '../controllers/commercial.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Public generic endpoint to allow the landing page widget to execute full margin calculations
router.post('/quote', generateQuote);

// Admin Operation Endpoints (Epic 7)
router.get('/reviews', authenticate, requireRole(['admin']), getPendingReviews);
router.post('/reviews/:id/approve', authenticate, requireRole(['admin']), approveReview);

export default router;
