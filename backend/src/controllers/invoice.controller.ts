import { Request, Response } from 'express';
import { prisma } from '../index';

export class InvoiceController {

    static async getInvoices(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;
            const role = (req as any).user?.role;

            let query = {};

            if (role === 'customer') {
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { businessAccountId: true }
                });
                if (user?.businessAccountId) {
                    query = { businessAccountId: user.businessAccountId };
                } else {
                    res.status(200).json([]);
                    return;
                }
            } else if (role === 'carrier') {
                res.status(200).json([]);
                return;
            }

            const invoices = await prisma.invoice.findMany({
                where: query,
                include: { businessAccount: true },
                orderBy: { date: 'desc' }
            });

            res.status(200).json(invoices);
        } catch (error) {
            console.error('[InvoiceController] Error fetching invoices:', error);
            res.status(500).json({ error: 'Failed to fetch invoices' });
        }
    }

    static async generateInvoice(req: Request, res: Response): Promise<void> {
        try {
            const { businessAccountId, month } = req.body;

            if (!businessAccountId || !month) {
                res.status(400).json({ error: 'businessAccountId and month are required.' });
                return;
            }

            // QA-2: Jobs use 'COMPLETED' status (not 'DELIVERED') — fixed to match the Job schema
            const unbilledJobs = await prisma.job.findMany({
                where: {
                    businessAccountId,
                    status: 'COMPLETED',
                    invoiceId: null
                }
            });

            if (unbilledJobs.length === 0) {
                res.status(400).json({ error: 'No unbilled completed jobs found for this period.' });
                return;
            }

            const subtotal = unbilledJobs.reduce((sum, job) => sum + job.calculatedPrice, 0);
            const total = subtotal * 1.2;

            const invoice = await prisma.invoice.create({
                data: {
                    invoiceNumber: `INV-${Date.now()}`,
                    status: 'PENDING',
                    amount: total,
                    date: new Date(),
                    dueDate: new Date(Date.now() + 86400000 * 30),
                    businessAccountId,
                    description: `Billing for ${month} - ${unbilledJobs.length} jobs.`,
                    jobs: {
                        connect: unbilledJobs.map(j => ({ id: j.id }))
                    }
                }
            });

            await prisma.activityLog.create({
                data: {
                    type: 'payment',
                    title: 'Invoice Generated',
                    message: `Invoice ${invoice.invoiceNumber} for £${total.toFixed(2)} has been generated for ${month}.`,
                    severity: 'info',
                    amount: total
                }
            });

            // SEC-SYNC: Asynchronously push to established accounting software (Xero/FreeAgent)
            const { AccountingService } = require('../services/accounting.service');
            AccountingService.syncInvoice(invoice, businessAccountId).catch((err: any) => console.error("Accounting Sync Failed", err));

            res.status(201).json(invoice);
        } catch (error) {
            console.error('[InvoiceController] Error generating invoice:', error);
            res.status(500).json({ error: 'Failed to generate invoice.' });
        }
    }
}
