import { Router } from 'express';
import { StripeController } from '../controllers/stripe.controller';
import { authenticate } from '../middleware/auth.middleware';
// We need raw express middleware for the webhook, so we export it differently
import express from 'express';

const router = Router();

// Protected intent creation
router.post('/create-payment-intent', authenticate, StripeController.createPaymentIntent);

// Webhook must use express.raw() to parse the body correctly for Stripe signature validation
router.post('/webhook', express.raw({ type: 'application/json' }), StripeController.handleWebhook);

export default router;
