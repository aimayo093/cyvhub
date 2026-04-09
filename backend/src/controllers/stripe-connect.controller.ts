import { Request, Response } from 'express';
import { StripeConnectService } from '../services/stripe-connect.service';
import { prisma } from '../index';
import Stripe from 'stripe';

interface AuthenticatedRequest extends Request {
    user?: { userId: string; role: string };
}

const STRIPE_API_VERSION: Stripe.LatestApiVersion = '2025-02-24.acacia' as Stripe.LatestApiVersion;
const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: STRIPE_API_VERSION })
    : null;

/**
 * POST /api/stripe-connect/onboard
 * Creates or retrieves a Stripe Express connected account and returns the onboarding URL.
 */
export const onboardConnectedAccount = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, role: true, stripeAccountId: true, stripeOnboardingComplete: true, firstName: true, lastName: true },
        });

        if (!user) return res.status(404).json({ error: 'User not found' });

        if (user.role !== 'driver' && user.role !== 'carrier') {
            return res.status(403).json({ error: 'Only drivers and carriers can onboard for payouts' });
        }

        let stripeAccountId = user.stripeAccountId;

        // Create account if not yet registered
        if (!stripeAccountId) {
            const businessType = user.role === 'carrier' ? 'company' : 'individual';
            stripeAccountId = await StripeConnectService.createConnectedAccount(userId, user.email, businessType);
        }

        // Generate onboarding link
        const baseUrl = process.env.FRONTEND_URL || 'https://cyvhub.com';
        const onboardingUrl = await StripeConnectService.generateOnboardingLink(
            stripeAccountId,
            `${baseUrl}/stripe-onboard-return`,
            `${baseUrl}/stripe-onboard-refresh`
        );

        res.json({
            onboardingUrl,
            stripeAccountId,
            onboardingComplete: user.stripeOnboardingComplete,
        });
    } catch (error: any) {
        console.error('[StripeConnect] Onboard error:', error);
        res.status(500).json({ error: error.message || 'Failed to create onboarding link' });
    }
};

/**
 * GET /api/stripe-connect/status
 * Returns the current user's Stripe Connect status.
 */
export const getConnectStatus = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { stripeAccountId: true, stripeOnboardingComplete: true, role: true },
        });

        if (!user) return res.status(404).json({ error: 'User not found' });

        // If we have an account ID, refresh its status from Stripe
        if (user.stripeAccountId && !user.stripeOnboardingComplete) {
            const status = await StripeConnectService.checkOnboardingStatus(userId, user.stripeAccountId);
            return res.json({
                hasAccount: true,
                stripeAccountId: user.stripeAccountId,
                onboardingComplete: status.complete,
                requiresAction: status.requiresAction,
            });
        }

        res.json({
            hasAccount: !!user.stripeAccountId,
            stripeAccountId: user.stripeAccountId || null,
            onboardingComplete: user.stripeOnboardingComplete,
            requiresAction: [],
        });
    } catch (error: any) {
        console.error('[StripeConnect] Status check error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * POST /api/stripe-connect/retry-payout/:batchId
 * Admin: retry a failed payout for a settlement batch.
 */
export const retryPayout = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

        const { batchId } = req.params;
        const result = await StripeConnectService.retryFailedPayout(batchId as string);

        if (result.success) {
            res.json({ message: 'Payout retry successful' });
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (error: any) {
        console.error('[StripeConnect] Retry payout error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * GET /api/stripe-connect/payouts  (ADMIN)
 * Lists all settlement batches with Stripe payout tracking fields.
 */
export const listPayouts = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

        const batches = await prisma.settlementBatch.findMany({
            orderBy: { createdAt: 'desc' },
        });

        res.json({ payouts: batches });
    } catch (error: any) {
        console.error('[StripeConnect] List payouts error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * GET /api/stripe-connect/jobs-breakdown  (ADMIN)
 * Returns per-job financial breakdown table.
 */
export const getJobsFinancialBreakdown = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

        const records = await (prisma as any).jobFinancialRecord.findMany({
            orderBy: { createdAt: 'desc' },
            take: 200,
        });

        res.json({ records });
    } catch (error: any) {
        console.error('[StripeConnect] Jobs breakdown error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * GET /api/stripe-connect/vat-records  (ADMIN)
 * Returns all VAT records for HMRC reconciliation.
 */
export const getVatRecords = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

        const records = await (prisma as any).vatRecord.findMany({
            orderBy: { createdAt: 'desc' },
        });

        const total = records.reduce((sum: number, r: any) => sum + r.vatAmount, 0);
        const unreconciled = records.filter((r: any) => !r.reconciled).reduce((sum: number, r: any) => sum + r.vatAmount, 0);

        res.json({ records, totalVatCollected: total, vatOwedToHMRC: unreconciled });
    } catch (error: any) {
        console.error('[StripeConnect] VAT records error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * PATCH /api/stripe-connect/vat-records/:id/reconcile  (ADMIN)
 * Marks a VAT record as reconciled.
 */
export const reconcileVatRecord = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

        const { id } = req.params;
        const updated = await (prisma as any).vatRecord.update({
            where: { id: id as string },
            data: {
                reconciled: true,
                reconciledAt: new Date(),
                reconciledBy: req.user?.userId,
            },
        });

        res.json({ message: 'VAT record reconciled', record: updated });
    } catch (error: any) {
        console.error('[StripeConnect] Reconcile VAT error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * GET /api/stripe-connect/tax-ni-records  (ADMIN)
 * Returns all Tax & NI records grouped by user.
 */
export const getTaxNiRecords = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

        const records = await (prisma as any).taxNiRecord.findMany({
            orderBy: { createdAt: 'desc' },
        });

        // Group by userId for summary view
        const grouped = new Map<string, any>();
        records.forEach((r: any) => {
            if (!grouped.has(r.userId)) {
                grouped.set(r.userId, {
                    userId: r.userId,
                    totalTax: 0,
                    totalNi: 0,
                    totalGross: 0,
                    totalNet: 0,
                    records: [],
                });
            }
            const g = grouped.get(r.userId)!;
            g.totalTax += r.taxAmount;
            g.totalNi += r.niAmount;
            g.totalGross += r.grossPay;
            g.totalNet += r.netPay;
            g.records.push(r);
        });

        res.json({ taxNiGroups: Array.from(grouped.values()), allRecords: records });
    } catch (error: any) {
        console.error('[StripeConnect] Tax NI records error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * POST /api/stripe-connect/webhook
 * Handles Stripe Connect account webhooks (account.updated, transfer events).
 */
export const handleConnectWebhook = async (req: Request, res: Response) => {
    if (!stripe) return res.status(400).send('Stripe not configured');

    const sig = req.headers['stripe-signature'] as string;
    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_CONNECT_WEBHOOK_SECRET || ''
        );
    } catch (err: any) {
        console.error('[StripeConnect Webhook] Signature failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        switch (event.type) {
            case 'account.updated':
                const account = event.data.object as Stripe.Account;
                await StripeConnectService.handleAccountUpdatedWebhook(account);
                break;

            case 'transfer.created':
                const transfer = event.data.object as Stripe.Transfer;
                console.log(`[StripeConnect Webhook] Transfer ${transfer.id} created: £${transfer.amount / 100}`);
                break;

            case 'payout.failed':
                const failedPayout = event.data.object as Stripe.Payout;
                console.error(`[StripeConnect Webhook] Payout ${failedPayout.id} failed for account — scheduling retry`);
                // Find and mark associated settlement batch
                await prisma.settlementBatch.updateMany({
                    where: { stripePayoutId: failedPayout.id },
                    data: { payoutStatus: 'FAILED', payoutError: failedPayout.failure_message || 'Payout failed' },
                });
                break;

            default:
                console.log(`[StripeConnect Webhook] Unhandled event: ${event.type}`);
        }

        res.send();
    } catch (error) {
        console.error('[StripeConnect Webhook] Handler error:', error);
        res.status(500).send('Handler error');
    }
};
