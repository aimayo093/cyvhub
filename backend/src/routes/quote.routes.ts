import { Router } from 'express';
import { QuoteController } from '../controllers/quote.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', QuoteController.getQuotes);
router.post('/', QuoteController.createQuote);

export default router;
