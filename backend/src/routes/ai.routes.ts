import { Router } from 'express';
import { getDispatchSuggestions, getSLARisks, getAnomalies, askAssistant } from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';
import rateLimit from 'express-rate-limit';

const router = Router();

// Apply authentication middleware to all AI routes
router.use(authenticate);

router.get('/dispatch-suggestions', getDispatchSuggestions);
router.get('/sla-risks', getSLARisks);
router.get('/anomalies', getAnomalies);

// SEC-INPUT: The assistant endpoint gets its own tight rate limiter (10 req/min)
// in addition to the global 500rpm limiter. AI queries are expensive to run.
const aiRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many AI requests. Please wait a moment before trying again.' },
});
router.post('/assistant', aiRateLimiter, askAssistant);

export default router;
