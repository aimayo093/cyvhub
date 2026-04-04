import { Router } from 'express';
import { StripeController } from '../controllers/stripe.controller';
import { optionalAuthenticate } from '../middleware/auth.middleware';

const router = Router();

// Legacy: Payment intent creation with client-provided amount (kept for backwards compatibility)
router.post('/create-payment-intent', optionalAuthenticate, StripeController.createPaymentIntent);

// NEW: Secure payment-for-job — backend fetches amount from the Job record (source of truth)
router.post('/create-payment-for-job', optionalAuthenticate, StripeController.createPaymentForJob);

// NEW: Hosted Checkout Session — Reliable for redirections
router.post('/create-checkout-session', optionalAuthenticate, StripeController.createCheckoutSession);

// Note: The webhook route is mounted separately in index.ts BEFORE express.json()
// because it requires the raw request body for Stripe signature verification.

export default router;
