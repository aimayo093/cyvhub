import { Request, Response } from 'express';
import { prisma } from '../index';
import { NotificationService } from '../utils/notification.service';

export class CheckoutController {

    /**
     * POST /api/checkout/invoice
     * Restricted to authenticated users with a linked businessAccountId.
     * Marks the job as AWAITING_PAYMENT (Invoice Pending).
     */
    static async checkoutInvoice(req: Request, res: Response): Promise<void> {
        try {
            const { jobId } = req.body;
            const userId = (req as any).user?.userId;

            if (!jobId) {
                res.status(400).json({ error: 'jobId is required for invoice checkout.' });
                return;
            }

            // 1. Verify user exists and has a business account
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { businessAccountId: true, email: true, firstName: true }
            });

            if (!user?.businessAccountId) {
                res.status(403).json({ error: 'Invoice billing is only available for registered business dashboard accounts.' });
                return;
            }

            // 2. Fetch job and verify ownership
            const job = await prisma.job.findUnique({
                where: { id: jobId }
            });

            if (!job) {
                res.status(404).json({ error: 'Booking not found.' });
                return;
            }

            if (job.customerId !== userId) {
                res.status(403).json({ error: 'Forbidden. You do not own this booking.' });
                return;
            }

            if (job.paymentStatus === 'COMPLETED') {
                res.status(400).json({ error: 'This booking has already been paid.' });
                return;
            }

            // 3. Update Job status to reflect Invoice Billing
            const updatedJob = await prisma.job.update({
                where: { id: jobId },
                data: {
                    status: 'AWAITING_PAYMENT',
                    paymentStatus: 'INVOICE_PENDING',
                    businessAccountId: user.businessAccountId // Ensure link is solid
                }
            });

            // 4. Create a PaymentTransaction record for tracking
            const totalWithVat = job.calculatedPrice * 1.2;
            await prisma.paymentTransaction.create({
                data: {
                    type: 'charge',
                    status: 'PENDING',
                    amount: totalWithVat,
                    currency: 'GBP',
                    method: 'invoice',
                    description: `Invoice Billing for ${job.jobNumber}`,
                    deliveryId: jobId,
                    customerEmail: user.email
                }
            });

            // 5. Trigger Confirmation Email via Resend
            await NotificationService.sendBookingConfirmation(user.email, user.firstName, updatedJob);

            res.status(200).json({ 
                message: 'Invoice checkout successful.', 
                data: updatedJob 
            });

        } catch (error: any) {
            console.error('[CheckoutController] Invoice error:', error);
            res.status(500).json({ error: 'Failed to process invoice checkout.' });
        }
    }

    /**
     * POST /api/checkout/complete
     * Manual completion for edge cases (e.g. admin manual override).
     */
    static async manualComplete(req: Request, res: Response): Promise<void> {
        try {
            const { jobId } = req.body;
            // Restricted to Admin
            if ((req as any).user?.role !== 'admin') {
                res.status(403).json({ error: 'Admin only.' });
                return;
            }

            const updatedJob = await prisma.job.update({
                where: { id: jobId },
                data: { status: 'PENDING_DISPATCH', paymentStatus: 'COMPLETED' },
                include: { customer: true }
            });

            if (updatedJob.customer?.email) {
                await NotificationService.sendBookingConfirmation(updatedJob.customer.email, updatedJob.customer.firstName, updatedJob);
            }

            res.status(200).json({ data: updatedJob });
        } catch (error) {
            res.status(500).json({ error: 'Failed to complete job manually.' });
        }
    }
}
