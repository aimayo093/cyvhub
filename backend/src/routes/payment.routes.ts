import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Transactions & Ledger
router.get('/transactions', authenticate, requireRole(['admin']), PaymentController.getTransactions);
router.get('/ledger', authenticate, requireRole(['admin']), PaymentController.getLedger);

// Payments & Refunds
// SEC-AUDIT-1: Restrict manual charge creation to admins only.
// Any authenticated user could previously forge cash/manual payments to mark jobs as paid.
router.post('/charge', authenticate, requireRole(['admin']), PaymentController.chargePayment);
router.post('/refund', authenticate, requireRole(['admin']), PaymentController.issueRefund);

// Settlements (Payouts)
router.get('/settlements', authenticate, PaymentController.getSettlements);
router.post('/settlements/:id/process', authenticate, requireRole(['admin']), PaymentController.processSettlement);

export default router;
