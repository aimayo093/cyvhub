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

    // ─────────────────────────────────────────────────────────────────────
    // POST /api/stripe/create-payment-for-job   (PREFERRED — server-side source of truth)
    // Frontend sends ONLY the jobId/deliveryId. Backend looks up the
    // payable amount from the Job record — never trusts the client.
    // ─────────────────────────────────────────────────────────────────────
    static async createPaymentForJob(req: Request, res: Response): Promise<void> {
        try {
            // Defensive: ensure req.body exists
            const body = req.body || {};
            const { jobId } = body;
            const userId = (req as any).user?.userId;

            if (!jobId) {
                res.status(400).json({ error: 'jobId is required to initialize payment.' });
                return;
            }

            // Fetch the job/booking from the database — source of truth for amount
            const job = await prisma.job.findUnique({ where: { id: jobId } });

            if (!job) {
                res.status(404).json({ error: 'Booking not found. Please create a booking first.' });
                return;
            }

            if (job.paymentStatus === 'COMPLETED') {
                res.status(400).json({ error: 'Payment has already been completed for this booking.' });
                return;
            }

            // Derive amount from the server-side record
            const calculatedPrice = job.calculatedPrice;
            if (!calculatedPrice || calculatedPrice <= 0) {
                res.status(400).json({ error: 'Booking has no valid price. Please contact support.' });
                return;
            }

            // Add 20% VAT to get the total payable amount
            const totalWithVat = calculatedPrice * 1.2;
            const currency = 'gbp';
            const description = `CYVhub Delivery ${job.jobNumber || job.trackingNumber}`;

            if (!stripe) {
                // If no Stripe API Key, fallback to a mocked client secret for testing
                res.status(200).json({
                    clientSecret: 'pi_mocked_secret',
                    paymentIntentId: `pi_mock_${Date.now()}`,
                    amount: totalWithVat,
                    currency,
                    warning: 'Stripe API Key missing. Returning mocked secret.'
                });
                return;
            }

            // Create a PaymentIntent with the server-derived amount
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(totalWithVat * 100), // Stripe expects amounts in pence
                currency,
                description,
                metadata: {
                    userId: userId || 'guest',
                    jobId: jobId,
                    jobNumber: job.jobNumber || '',
                    trackingNumber: job.trackingNumber || '',
                },
                automatic_payment_methods: {
                    enabled: true,
                },
            });

            // Create a PENDING transaction record in the DB so the webhook can fulfill it
            await prisma.paymentTransaction.create({
                data: {
                    type: 'charge',
                    status: 'PENDING',
                    amount: totalWithVat,
                    currency: currency.toUpperCase(),
                    method: 'stripe',
                    description,
                    deliveryId: jobId,
                    stripePaymentId: paymentIntent.id
                }
            });

            // Update job to indicate payment is being processed
            await prisma.job.update({
                where: { id: jobId },
                data: { paymentIntentId: paymentIntent.id }
            });

            res.status(200).json({
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id,
                amount: totalWithVat,
                currency,
            });
        } catch (error: any) {
            console.error('[StripeController] Error creating payment for job:', error);
            res.status(500).json({ error: error.message || 'Failed to initialize payment.' });
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // POST /api/stripe/create-payment-intent   (LEGACY — client provides amount)
    // Kept for backwards compatibility. Has defensive validation.
    // ─────────────────────────────────────────────────────────────────────
    static async createPaymentIntent(req: Request, res: Response): Promise<void> {
        try {
            // Defensive: ensure req.body exists before destructuring
            const body = req.body || {};
            const { amount, currency = 'gbp', description, deliveryId } = body;
            const userId = (req as any).user?.userId;

            if (!amount || typeof amount !== 'number' || amount <= 0) {
                res.status(400).json({ 
                    error: 'A valid payment amount is required.',
                    hint: 'Use POST /api/stripe/create-payment-for-job with a jobId for secure server-side pricing.'
                });
                return;
            }

            if (!stripe) {
                // If no Stripe API Key, fallback to a mocked client secret for testing
                res.status(200).json({
                    clientSecret: 'pi_mocked_secret',
                    paymentIntentId: `pi_mock_${Date.now()}`,
                    warning: 'Stripe API Key missing. Returning mocked secret.'
                });
                return;
            }

            // Create a PaymentIntent with the order amount and currency
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(amount * 100), // Stripe expects amounts in cents/pence
                currency: currency,
                description: description || 'CYVhub Service Payment',
                metadata: {
                    userId: userId || 'guest',
                    jobId: deliveryId || 'none'
                },
                automatic_payment_methods: {
                    enabled: true,
                },
            });

            // Create a PENDING transaction record in the DB so the webhook can fulfill it
             if (deliveryId && deliveryId !== 'none') {
                  await prisma.paymentTransaction.create({
                      data: {
                          type: 'charge',
                          status: 'PENDING',
                          amount: amount,
                          currency: currency.toUpperCase(),
                          method: 'stripe',
                          description: description || `Stripe Payment for Delivery ${deliveryId}`,
                          deliveryId: deliveryId,
                          stripePaymentId: paymentIntent.id
                      }
                  });
             }

            res.status(200).json({
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id
            });
        } catch (error: any) {
            console.error('[StripeController] Error creating payment intent:', error);
            res.status(500).json({ error: error.message || 'Failed to create payment intent' });
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // POST /api/stripe/webhook
    // ─────────────────────────────────────────────────────────────────────
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
                case 'checkout.session.completed':
                    const session = event.data.object as Stripe.Checkout.Session;
                    const jobIdFromSession = session.metadata?.jobId;
                    console.log(`💰 Checkout Session fulfilled for jobId: ${jobIdFromSession}`);
                    if (jobIdFromSession) {
                        await StripeController._fulfillOrder(jobIdFromSession, session.payment_intent as string);
                    }
                    break;
                case 'payment_intent.succeeded':
                    const paymentIntent = event.data.object as Stripe.PaymentIntent;
                    console.log(`💰 PaymentIntent for ${paymentIntent.amount} was successful!`);
                    const jobIdFromPI = paymentIntent.metadata?.jobId;
                    if (jobIdFromPI && jobIdFromPI !== 'none') {
                        await StripeController._fulfillOrder(jobIdFromPI, paymentIntent.id);
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

    // ─────────────────────────────────────────────────────────────────────
    // POST /api/stripe/create-checkout-session
    // Creates a Stripe-hosted payment page URL. Reliable for redirections.
    // ─────────────────────────────────────────────────────────────────────
    static async createCheckoutSession(req: Request, res: Response): Promise<void> {
        try {
            const { jobId } = req.body;
            const origin = req.headers.origin || 'https://cyvhub.com';

            if (!jobId) {
                res.status(400).json({ error: 'jobId is required for checkout.' });
                return;
            }

            const job = await prisma.job.findUnique({ where: { id: jobId } });
            if (!job) {
                res.status(404).json({ error: 'Booking not found.' });
                return;
            }

            if (!stripe) {
                res.status(500).json({ error: 'Stripe is not configured on this server.' });
                return;
            }

            // Derive amounts from the server-side record
            const calculatedPrice = job.calculatedPrice;
            const totalWithVat = calculatedPrice * 1.2;
            const unitAmount = Math.round(calculatedPrice * 100);
            const vatAmount = Math.round(calculatedPrice * 0.2 * 100);

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        price_data: {
                            currency: 'gbp',
                            product_data: {
                                name: `Delivery ${job.jobNumber}`,
                                description: `Courier service: ${job.vehicleType}`,
                            },
                            unit_amount: unitAmount,
                        },
                        quantity: 1,
                    },
                    {
                        price_data: {
                            currency: 'gbp',
                            product_data: {
                                name: 'VAT (20%)',
                            },
                            unit_amount: vatAmount,
                        },
                        quantity: 1,
                    }
                ],
                mode: 'payment',
                success_url: `${origin}/checkout?status=success&jobId=${jobId}`,
                cancel_url: `${origin}/checkout?status=canceled&jobId=${jobId}`,
                metadata: {
                    jobId: jobId,
                    jobNumber: job.jobNumber,
                },
            });

            res.status(200).json({ url: session.url, sessionId: session.id, amount: totalWithVat });
        } catch (error: any) {
            console.error('[StripeController] Checkout session error:', error);
            res.status(500).json({ error: error.message || 'Failed to create checkout session.' });
        }
    }

    /**
     * Internal helper to finalize a job after successful payment.
     * Transitions status to PENDING_DISPATCH and triggers notifications.
     */
    private static async _fulfillOrder(jobId: string, stripePaymentId: string): Promise<void> {
        try {
            console.log(`[Stripe Fulfill] Processing fulfillment for Job: ${jobId}`);
            
            // 1. Mark Job as Paid and move to PENDING_DISPATCH
            const updatedJob = await prisma.job.update({
                where: { id: jobId },
                data: { 
                    paymentStatus: 'COMPLETED',
                    status: 'PENDING_DISPATCH',
                    paymentIntentId: stripePaymentId
                },
                include: { customer: true }
            });
            
            // 2. Trigger Automated Dispatch Engine
            const { DispatchService } = require('../services/dispatch.service');
            await DispatchService.dispatchJob(jobId);

            // 3. Trigger Branded Confirmation Email
            const { NotificationService } = require('../utils/notification.service');
            let targetEmail = updatedJob.customer?.email;
            let targetName = updatedJob.customer?.firstName || updatedJob.pickupContactName;

            if (targetEmail) {
                await NotificationService.sendBookingConfirmation(targetEmail, targetName, updatedJob);
            }

            // 4. Mark PaymentTransaction as Completed (if exists) or create one
            const existingTxn = await prisma.paymentTransaction.findFirst({
                where: { deliveryId: jobId, status: 'PENDING' }
            });

            if (existingTxn) {
                await prisma.paymentTransaction.update({
                    where: { id: existingTxn.id },
                    data: {
                        status: 'COMPLETED',
                        stripePaymentId: stripePaymentId,
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
                        deliveryId: jobId
                    }
                });
            }
        } catch (error) {
            console.error(`[Stripe Fulfill] Error fulfilling jobId ${jobId}:`, error);
        }
    }
}
