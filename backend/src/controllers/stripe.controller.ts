import { Request, Response } from 'express';
import Stripe from 'stripe';
import { prisma } from '../index'; // BUG-1: Use shared Prisma singleton — no extra connection pool

// BUG-3: Unified Stripe API version across the codebase
const STRIPE_API_VERSION: Stripe.LatestApiVersion = '2025-02-24.acacia' as Stripe.LatestApiVersion;

// Initialize Stripe if secret key is present
const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: STRIPE_API_VERSION })
    : null;

export class StripeController {

    // POST /api/stripe/create-payment-intent
    static async createPaymentIntent(req: Request, res: Response): Promise<void> {
        try {
            if (!stripe) {
                // If no Stripe API Key, fallback to a mocked client secret for testing
                res.status(200).json({
                    clientSecret: 'pi_mocked_secret',
                    warning: 'Stripe API Key missing. Returning mocked secret.'
                });
                return;
            }

            const { amount, currency = 'gbp', description, deliveryId } = req.body;
            const userId = (req as any).user?.userId;

            if (!amount) {
                res.status(400).json({ error: 'Amount is required' });
                return;
            }

            // Create a PaymentIntent with the order amount and currency
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(amount * 100), // Stripe expects amounts in cents/pence
                currency: currency,
                description: description || 'CYVhub Service Payment',
                metadata: {
                    userId: userId || 'guest',
                    deliveryId: deliveryId || 'none'
                },
                automatic_payment_methods: {
                    enabled: true,
                },
            });

            res.status(200).json({
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id
            });
        } catch (error: any) {
            console.error('[StripeController] Error creating payment intent:', error);
            res.status(500).json({ error: error.message || 'Failed to create payment intent' });
        }
    }

    // POST /api/stripe/webhook
    static async handleWebhook(req: Request, res: Response): Promise<void> {
        if (!stripe) {
            res.status(400).send('Stripe is not configured');
            return;
        }

        const sig = req.headers['stripe-signature'] as string;
        let event: Stripe.Event;

        try {
            // Validate the webhook signature using the raw body
            event = stripe.webhooks.constructEvent(
                req.body, // This MUST be the raw buffer, configured in index.ts
                sig,
                process.env.STRIPE_WEBHOOK_SECRET || ''
            );
        } catch (err: any) {
            console.error(`⚠️  Webhook signature verification failed.`, err.message);
            res.status(400).send(`Webhook Error: ${err.message}`);
            return;
        }

        try {
            // Handle the event
            switch (event.type) {
                case 'payment_intent.succeeded':
                    const paymentIntent = event.data.object as Stripe.PaymentIntent;
                    console.log(`💰 PaymentIntent for ${paymentIntent.amount} was successful!`);

                    const deliveryId = paymentIntent.metadata?.deliveryId;

                    if (deliveryId && deliveryId !== 'none') {
                        // 1. Mark Job as Paid and move to PENDING_DISPATCH
                        // State enforcement: Job only becomes active for dispatch after payment
                        await prisma.job.update({
                            where: { id: deliveryId },
                            data: { 
                                paymentStatus: 'COMPLETED',
                                status: 'PENDING_DISPATCH',
                                paymentIntentId: paymentIntent.id
                            }
                        });
                        
                        // 1b. Trigger Automated Dispatch Engine
                        const { DispatchService } = require('../services/dispatch.service');
                        await DispatchService.dispatchJob(deliveryId);

                        // 2. Mark PaymentTransaction as Completed (if exists) or create one
                        const existingTxn = await prisma.paymentTransaction.findFirst({
                            where: { deliveryId, status: 'PENDING' }
                        });

                        if (existingTxn) {
                            await prisma.paymentTransaction.update({
                                where: { id: existingTxn.id },
                                data: {
                                    status: 'COMPLETED',
                                    stripePaymentId: paymentIntent.id,
                                    completedAt: new Date()
                                }
                            });

                            // Write to ledger
                            await prisma.accountingEntry.create({
                                data: {
                                    type: 'credit',
                                    category: 'delivery_payment',
                                    amount: existingTxn.amount,
                                    description: `Stripe Webhook Payment Confirmed — ${existingTxn.description}`,
                                    reference: existingTxn.id,
                                    deliveryId: deliveryId
                                }
                            });
                        }
                    }
                    break;
                case 'payment_intent.payment_failed':
                    const failedIntent = event.data.object as Stripe.PaymentIntent;
                    console.log(`❌ Payment failed: ${failedIntent.last_payment_error?.message}`);
                    break;
                default:
                    console.log(`Unhandled event type ${event.type}`);
            }

            // Return a 200 res to acknowledge receipt of the event
            res.send();
        } catch (error) {
            console.error('[StripeController] Error processing webhook event:', error);
            res.status(500).send('Webhook handler failed');
        }
    }
}
