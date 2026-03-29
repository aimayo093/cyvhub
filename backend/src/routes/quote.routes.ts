import { Router } from 'express';
import { QuoteController } from '../controllers/quote.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public route for guest quotes
router.post('/calculate', QuoteController.calculatePrice);

router.use(authenticate);

router.get('/', QuoteController.getQuotes);
router.post('/', QuoteController.createQuote);

export default router;
