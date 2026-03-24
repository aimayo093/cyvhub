import { Router } from 'express';
import { InvoiceController } from '../controllers/invoice.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, InvoiceController.getInvoices);
router.post('/generate', authenticate, requireRole(['admin']), InvoiceController.generateInvoice);

export default router;
