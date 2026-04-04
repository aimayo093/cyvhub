import { Request, Response } from 'express';
import { prisma } from '../index';

export class PaypalController {
    /**
     * POST /api/paypal/create-order
     * Creates a PayPal order and returns the approval URL.
     */
    static async createOrder(req: Request, res: Response): Promise<void> {
        try {
            const { jobId } = req.body;
            const origin = req.headers.origin || 'https://cyvhub.com';

            if (!jobId) {
                res.status(400).json({ error: 'jobId is required.' });
                return;
            }

            const job = await prisma.job.findUnique({ where: { id: jobId } });
            if (!job) {
                res.status(404).json({ error: 'Booking not found.' });
                return;
            }

            // Derive total from server-side record (with 20% VAT)
            const totalWithVat = (job.calculatedPrice * 1.2).toFixed(2);
            const currency = 'GBP';

            // In a real production app, we would use the PayPal Checkout SDK 
            // or fetch() to call https://api-m.sandbox.paypal.com/v2/checkout/orders.
            // For this implementation, we simulate the order creation and return 
            // a correctly formatted approval URL for the frontend to open.
            
            console.log(`[PaypalController] Creating order for Job ${job.jobNumber} — Amount: £${totalWithVat}`);

            // MOck PayPal Order ID
            const orderId = `PP-ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
            
            // In Sandbox/Production, this URL would be returned by PayPal API
            // redirecting to https://www.paypal.com/checkoutnow?token=...
            const approvalUrl = `https://www.sandbox.paypal.com/checkoutnow?token=${orderId}&jobId=${jobId}&return_url=${origin}/checkout?status=success&orderId=${orderId}&jobId=${jobId}&cancel_url=${origin}/checkout?status=cancel`;

            // Record a PENDING transaction
            await prisma.paymentTransaction.create({
                data: {
                    type: 'charge',
                    status: 'PENDING',
                    amount: parseFloat(totalWithVat),
                    currency,
                    method: 'paypal',
                    description: `PayPal Payment for Delivery ${job.jobNumber}`,
                    deliveryId: jobId,
                    paypalOrderId: orderId
                }
            });

            res.status(200).json({ 
                orderId, 
                approvalUrl,
                amount: totalWithVat 
            });
        } catch (error: any) {
            console.error('[PaypalController] Error creating PayPal order:', error);
            res.status(500).json({ error: 'Failed to initialize PayPal payment.' });
        }
    }

    /**
     * POST /api/paypal/capture-order
     * Finalizes the PayPal order after the user returns from redirect.
     */
    static async captureOrder(req: Request, res: Response): Promise<void> {
        try {
            const { orderId, jobId } = req.body;

            if (!orderId || !jobId) {
                res.status(400).json({ error: 'orderId and jobId are required for capture.' });
                return;
            }

            console.log(`[PaypalController] Capturing order: ${orderId}`);

            // 1. Update Job Status
            const updatedJob = await prisma.job.update({
                where: { id: jobId },
                data: { 
                    paymentStatus: 'COMPLETED',
                    status: 'PENDING_DISPATCH'
                }
            });

            // 2. Update Transaction
            const transaction = await prisma.paymentTransaction.findFirst({
                where: { paypalOrderId: orderId, deliveryId: jobId }
            });

            if (transaction) {
                await prisma.paymentTransaction.update({
                    where: { id: transaction.id },
                    data: { 
                        status: 'COMPLETED',
                        completedAt: new Date()
                    }
                });

                // Write to ledger
                await prisma.accountingEntry.create({
                    data: {
                        type: 'credit',
                        category: 'delivery_payment',
                        amount: transaction.amount,
                        description: `PayPal Payment Confirmed — ${orderId}`,
                        reference: transaction.id,
                        deliveryId: jobId
                    }
                });
            }

            res.status(200).json({ success: true, job: updatedJob });
        } catch (error: any) {
            console.error('[PaypalController] Error capturing PayPal order:', error);
            res.status(500).json({ error: 'Failed to capture PayPal payment.' });
        }
    }
}
