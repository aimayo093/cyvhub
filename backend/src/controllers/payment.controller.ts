import { Request, Response } from 'express';
import { prisma } from '../index'; // Adjusted import based on structure

import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-02-24.acacia' as Stripe.LatestApiVersion })
    : null;

export class PaymentController {

    // ------------------------------------------------------------------------
    // SINGLE PAYMENTS & REFUNDS
    // ------------------------------------------------------------------------

    // POST /api/payments/charge
    static async chargePayment(req: Request, res: Response): Promise<void> {
        try {
            const { amount, method, description, deliveryId, trackingNumber } = req.body;
            const userId = (req as any).user?.userId;

            if (!amount || !method || !description) {
                res.status(400).json({ error: 'Missing required payment fields.' });
                return;
            }

            // BUG-2: Fetch real customer details
            let customerName = 'Unknown Customer';
            let customerEmail = '';
            let businessId = undefined;

            if (userId) {
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { firstName: true, lastName: true, email: true, businessAccountId: true }
                });
                if (user) {
                    customerName = `${user.firstName} ${user.lastName}`;
                    customerEmail = user.email;
                    businessId = user.businessAccountId || undefined;
                }
            }

            // 1) Create the transaction record
            const transaction = await prisma.paymentTransaction.create({
                data: {
                    type: 'charge',
                    status: method === 'stripe' ? 'PENDING' : 'COMPLETED',
                    amount: parseFloat(amount),
                    method,
                    description,
                    deliveryId,
                    trackingNumber,
                    customerName,
                    customerEmail,
                    customerId: userId,
                    businessId,
                    stripePaymentId: method === 'stripe' ? `mock_pi_${Date.now()}` : undefined,
                    completedAt: method === 'stripe' ? null : new Date(),
                }
            });

            // 2) Write to the Ledger & update Job ONLY if not Stripe (Stripe is handled via Webhook)
            if (method !== 'stripe') {
                await prisma.accountingEntry.create({
                    data: {
                        type: 'credit',
                        category: 'delivery_payment',
                        amount: parseFloat(amount),
                        description: `Payment received — ${description}`,
                        reference: transaction.id,
                        deliveryId,
                    }
                });

                if (deliveryId) {
                    await prisma.job.update({
                        where: { id: deliveryId },
                        data: { 
                            paymentStatus: 'COMPLETED',
                            status: 'PENDING_DISPATCH'
                        }
                    });
                }
            }

            res.status(200).json({ success: true, transaction });
        } catch (error) {
            console.error('[PaymentController] Error charging payment:', error);
            res.status(500).json({ error: 'Internal server error processing payment' });
        }
    }

    // POST /api/payments/refund
    static async issueRefund(req: Request, res: Response): Promise<void> {
        try {
            const { transactionId, amount } = req.body;

            const originalTxn = await prisma.paymentTransaction.findUnique({
                where: { id: transactionId }
            });

            if (!originalTxn) {
                res.status(404).json({ error: 'Original transaction not found' });
                return;
            }

            const refundAmount = amount ? parseFloat(amount) : originalTxn.amount;

            // Trigger Real Stripe Refund API if applicable
            if (originalTxn.method === 'stripe' && originalTxn.stripePaymentId && stripe) {
                try {
                    await stripe.refunds.create({
                        payment_intent: originalTxn.stripePaymentId,
                        amount: Math.round(refundAmount * 100) // Convert to cents/pence
                    });
                } catch (stripeErr) {
                    console.error('Stripe refund failed:', stripeErr);
                    res.status(400).json({ error: 'Stripe refund object creation failed. The payment intent is likely a mock.' });
                    return;
                }
            }

            // 1) Create Refund Transaction
            const refundTxn = await prisma.paymentTransaction.create({
                data: {
                    type: 'refund',
                    status: 'COMPLETED',
                    amount: refundAmount,
                    method: originalTxn.method,
                    description: `Refund — ${originalTxn.description}`,
                    deliveryId: originalTxn.deliveryId,
                    trackingNumber: originalTxn.trackingNumber,
                    customerName: originalTxn.customerName,
                    completedAt: new Date()
                }
            });

            // 2) Add Debit to Ledger
            await prisma.accountingEntry.create({
                data: {
                    type: 'debit',
                    category: 'refund',
                    amount: refundAmount,
                    description: `Refund issued — ${originalTxn.description}`,
                    reference: refundTxn.id,
                    deliveryId: originalTxn.deliveryId,
                }
            });

            // Update Job payment status to REFUNDED
            if (originalTxn.deliveryId) {
                await prisma.job.update({
                    where: { id: originalTxn.deliveryId },
                    data: { paymentStatus: 'REFUNDED' }
                });
            }

            res.status(200).json({ success: true, transaction: refundTxn });

        } catch (error) {
            console.error('[PaymentController] Error issuing refund:', error);
            res.status(500).json({ error: 'Internal server error processing refund.' });
        }
    }


    // ------------------------------------------------------------------------
    // SETTLEMENTS (PAYOUTS)
    // ------------------------------------------------------------------------

    // GET /api/payments/settlements
    static async getSettlements(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;
            const role = (req as any).user?.role;

            let whereClause = {};
            if (role !== 'admin') {
                whereClause = { recipientId: userId };
            }

            const settlements = await prisma.settlementBatch.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' }
            });

            res.status(200).json({ settlements });
        } catch (error) {
            console.error('[PaymentController] Error fetching settlements:', error);
            res.status(500).json({ error: 'Failed to fetch settlements.' });
        }
    }

    // POST /api/payments/settlements/:id/process
    static async processSettlement(req: Request, res: Response): Promise<void> {
        try {
            const id = req.params.id as string;
            const role = (req as any).user?.role;

            // Only allow admins to process payouts (SEC-04 conceptual RBAC check)
            if (role !== 'admin') {
                res.status(403).json({ error: 'Forbidden. Only administrators can process settlements.' });
                return;
            }

            const settlement = await prisma.settlementBatch.findUnique({ where: { id: id as string } });
            if (!settlement) {
                res.status(404).json({ error: 'Settlement not found.' });
                return;
            }

            if (settlement.status === 'PAID') {
                res.status(400).json({ error: 'Settlement is already paid.' });
                return;
            }

            // Mark as PAID
            const updated = await prisma.settlementBatch.update({
                where: { id: id as string },
                data: {
                    status: 'PAID',
                    processedAt: new Date()
                }
            });

            // Log corresponding Debit to the Accounting Ledger
            await prisma.accountingEntry.create({
                data: {
                    type: 'debit',
                    category: settlement.recipientType === 'driver' ? 'driver_payout' : 'carrier_payout',
                    amount: settlement.netAmount,
                    description: `Settlement payout to ${settlement.recipientName}`,
                    reference: settlement.id,
                }
            });

            res.status(200).json({ success: true, settlement: updated });
        } catch (error) {
            console.error('[PaymentController] Error processing settlement:', error);
            res.status(500).json({ error: 'Failed to process settlement batch.' });
        }
    }

    // ------------------------------------------------------------------------
    // LEDGER & TRANSACTIONS
    // ------------------------------------------------------------------------

    // GET /api/payments/transactions
    static async getTransactions(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;
            const role = (req as any).user?.role;

            let whereClause = {};
            if (role !== 'admin' && userId) {
                // If business user, they might want to see all business transactions
                const user = await prisma.user.findUnique({ where: { id: userId }, select: { businessAccountId: true } });
                if (user?.businessAccountId) {
                    whereClause = { OR: [{ customerId: userId }, { businessId: user.businessAccountId }] };
                } else {
                    whereClause = { customerId: userId };
                }
            }

            const transactions = await prisma.paymentTransaction.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' }
            });
            res.status(200).json({ transactions });
        } catch (error) {
            console.error('[PaymentController] Error fetching transactions:', error);
            res.status(500).json({ error: 'Failed to fetch transactions.' });
        }
    }

    // GET /api/payments/ledger
    static async getLedger(req: Request, res: Response): Promise<void> {
        try {
            const ledger = await prisma.accountingEntry.findMany({
                orderBy: { date: 'desc' }
            });
            res.status(200).json({ ledger });
        } catch (error) {
            console.error('[PaymentController] Error fetching ledger:', error);
            res.status(500).json({ error: 'Failed to fetch accounting ledger.' });
        }
    }

}
