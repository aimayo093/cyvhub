import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
    onboardConnectedAccount,
    getConnectStatus,
    retryPayout,
    listPayouts,
    getJobsFinancialBreakdown,
    getVatRecords,
    reconcileVatRecord,
    getTaxNiRecords,
    handleConnectWebhook,
} from '../controllers/stripe-connect.controller';
import express from 'express';

const router = Router();

// Webhook must receive raw body — mount before JSON parser via raw bodyParser
router.post('/webhook', express.raw({ type: 'application/json' }), handleConnectWebhook);

// Authenticated endpoints
router.use(authenticate);

// Driver/Carrier onboarding
router.post('/onboard', onboardConnectedAccount);
router.get('/status', getConnectStatus);

// Admin endpoints
router.get('/payouts', listPayouts);
router.post('/retry-payout/:batchId', retryPayout);
router.get('/jobs-breakdown', getJobsFinancialBreakdown);
router.get('/vat-records', getVatRecords);
router.patch('/vat-records/:id/reconcile', reconcileVatRecord);
router.get('/tax-ni-records', getTaxNiRecords);

export default router;
