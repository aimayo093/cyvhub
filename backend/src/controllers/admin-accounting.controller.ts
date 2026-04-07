import { Response } from 'express';
import { prisma } from '../index';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

/**
 * GET /api/admin/accounting/settlements
 * Lists all driver/carrier settlement batches
 */
export const listSettlements = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

        const settlements = await prisma.settlementBatch.findMany({
            orderBy: { createdAt: 'desc' }
        });

        // Parse jobIds from string back to array if needed (Prisma might handle this depending on DB)
        const formatted = settlements.map(s => ({
            ...s,
            jobIds: typeof s.jobIds === 'string' ? JSON.parse(s.jobIds) : s.jobIds,
            // Mocking deductions for the frontend UI as the schema doesn't store them separately yet
            deductions: [
                { description: 'Platform Fee (10%)', amount: s.grossAmount * 0.1 }
            ]
        }));

        res.json({ settlements: formatted });
    } catch (error) {
        console.error('List Settlements Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * GET /api/admin/accounting/ledger
 * Lists all accounting entries for the platform ledger
 */
export const listLedger = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

        const entries = await prisma.accountingEntry.findMany({
            orderBy: { date: 'desc' },
            take: 100
        });

        res.json({ ledger: entries });
    } catch (error) {
        console.error('List Ledger Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * PATCH /api/admin/accounting/settlements/:id/approve
 * Approves and natively processes the settlement in one click
 */
export const approveSettlement = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
        const id = req.params.id as string;

        const settlementCheck = await prisma.settlementBatch.findUnique({ where: { id } });
        if (!settlementCheck) return res.status(404).json({ error: 'Settlement not found' });
        if (settlementCheck.status === 'PAID') {
            return res.status(400).json({ error: 'Settlement already processed and paid' });
        }

        const settlement = await prisma.settlementBatch.update({
            where: { id },
            data: { 
                status: 'PAID', // Native direct processing
                approvedBy: req.user?.userId,
                approvedAt: new Date(),
                processedAt: new Date()
            }
        });

        // Log to ledger natively
        await prisma.accountingEntry.create({
            data: {
                type: 'debit',
                category: 'driver_payout',
                amount: settlement.netAmount,
                description: `Payout auto-processed to ${settlement.recipientName} (${settlement.reference})`,
                reference: settlement.id,
                recipientId: settlement.recipientId,
                recipientName: settlement.recipientName,
                settlementId: settlement.id
            }
        });

        res.json({ message: 'Settlement approved and processed', settlement });
    } catch (error) {
        console.error('Approve Settlement Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * GET /api/admin/accounting/invoices
 * Lists all business invoices
 */
export const listInvoices = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

        const invoices = await prisma.invoice.findMany({
            include: {
                businessAccount: { select: { companyName: true, tradingName: true, billingAddress: true, billingCity: true, billingPostcode: true } },
                jobs: { select: { id: true, jobNumber: true, calculatedPrice: true } }
            },
            orderBy: { date: 'desc' }
        });

        // Map VAT specifics required for PDF generation
        const vatRate = 20; // 20%
        const vatRegNumber = "GB123456789";

        const enrichedInvoices = invoices.map(inv => ({
            ...inv,
            vatRate,
            vatRegNumber,
            taxAmount: (inv.amount * (vatRate / 100)),
            totalWithTax: inv.amount + (inv.amount * (vatRate / 100))
        }));

        res.json({ invoices: enrichedInvoices });
    } catch (error) {
        console.error('List Invoices Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * GET /api/admin/accounting/invoices/:id
 */
export const getInvoiceDetails = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
        
        const id = req.params.id as string;
        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: {
                businessAccount: { select: { companyName: true, tradingName: true, billingAddress: true, billingCity: true, billingPostcode: true } },
                jobs: { select: { id: true, jobNumber: true, calculatedPrice: true, pickupPostcode: true, dropoffPostcode: true, createdAt: true } }
            }
        });

        if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

        const vatRate = 20; 
        const vatRegNumber = "GB123456789";

        const enrichedInvoice = {
            ...invoice,
            vatRate,
            vatRegNumber,
            taxAmount: (invoice.amount * (vatRate / 100)),
            totalWithTax: invoice.amount + (invoice.amount * (vatRate / 100))
        };

        res.json({ invoice: enrichedInvoice });
    } catch (error) {
        console.error('Get Invoice Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * PATCH /api/admin/accounting/invoices/:id/paid
 */
export const markInvoicePaid = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
        
        const id = req.params.id as string;
        const invoice = await prisma.invoice.update({
            where: { id },
            data: { status: 'PAID' }
        });
        res.json({ message: 'Invoice marked as paid', invoice });
    } catch (error) {
        console.error('Mark Invoice Paid Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
