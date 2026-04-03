import { Router } from 'express';
import { StripeController } from '../controllers/stripe.controller';
import { optionalAuthenticate } from '../middleware/auth.middleware';
// We need raw express middleware for the webhook, so we export it differently
import express from 'express';

const router = Router();

// Payment intent creation — optionalAuthenticate allows guest checkout
router.post('/create-payment-intent', optionalAuthenticate, StripeController.createPaymentIntent);

// Webhook must use express.raw() to parse the body correctly for Stripe signature validation
router.post('/webhook', express.raw({ type: 'application/json' }), StripeController.handleWebhook);

export default router;
