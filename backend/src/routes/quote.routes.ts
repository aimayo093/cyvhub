import { Router } from 'express';
import { QuoteController } from '../controllers/quote.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public route for guest quotes
router.post('/calculate', QuoteController.calculatePrice);

router.use(authenticate);

import { requireRole } from '../middleware/auth.middleware';

router.get('/', QuoteController.getQuotes);
router.get('/:id', QuoteController.getQuote);
router.post('/', QuoteController.createQuote);
router.patch('/:id/status', requireRole(['admin']), QuoteController.updateQuoteStatus);

export default router;
