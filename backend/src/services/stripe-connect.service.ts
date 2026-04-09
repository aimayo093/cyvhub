import Stripe from 'stripe';
import { prisma } from '../index';

const STRIPE_API_VERSION: Stripe.LatestApiVersion = '2025-02-24.acacia' as Stripe.LatestApiVersion;

const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: STRIPE_API_VERSION })
    : null;

export class StripeConnectService {

    /**
     * Creates a Stripe Express Connected Account for a driver or carrier.
     * Stores the account ID in the User record.
     */
    static async createConnectedAccount(userId: string, email: string, businessType: 'individual' | 'company' = 'individual'): Promise<string> {
        if (!stripe) throw new Error('Stripe not configured');

        const acct = await stripe.accounts.create({
            type: 'express',
            country: 'GB',
            email,
            business_type: businessType,
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
            },
            settings: {
                payouts: {
                    schedule: {
                        interval: 'weekly',
                        weekly_anchor: 'friday',
                    },
                },
            },
            metadata: { userId },
        });

        // Persist the Stripe account ID to the User record
        await prisma.user.update({
            where: { id: userId },
            data: { stripeAccountId: acct.id },
        });

        console.log(`[StripeConnect] Created account ${acct.id} for user ${userId}`);
        return acct.id;
    }

    /**
     * Generates a Stripe Express onboarding URL.
     * The user must complete this KYC flow before transfers can be made.
     */
    static async generateOnboardingLink(stripeAccountId: string, returnUrl: string, refreshUrl: string): Promise<string> {
        if (!stripe) throw new Error('Stripe not configured');

        const link = await stripe.accountLinks.create({
            account: stripeAccountId,
            refresh_url: refreshUrl,
            return_url: returnUrl,
            type: 'account_onboarding',
        });

        return link.url;
    }

    /**
     * Checks onboarding completion status for a connected account.
     * Updates the DB if now complete.
     */
    static async checkOnboardingStatus(userId: string, stripeAccountId: string): Promise<{ complete: boolean; requiresAction: string[] }> {
        if (!stripe) return { complete: false, requiresAction: ['Stripe not configured'] };

        const acct = await stripe.accounts.retrieve(stripeAccountId);
        const complete = !!acct.details_submitted && !acct.requirements?.currently_due?.length;

        if (complete) {
            await prisma.user.update({
                where: { id: userId },
                data: { stripeOnboardingComplete: true },
            });
        }

        return {
            complete,
            requiresAction: acct.requirements?.currently_due || [],
        };
    }

    /**
     * Executes a Stripe Connect transfer from the platform account
     * to the connected account of the recipient (driver or carrier).
     * Returns the Transfer object ID.
     */
    static async executeTransfer(
        amountGBP: number,
        stripeAccountId: string,
        settlementBatchId: string,
        jobId: string
    ): Promise<{ transferId: string; success: boolean; error?: string }> {
        if (!stripe) {
            // In test environment without Stripe, log as mock
            console.warn(`[StripeConnect] MOCK: Would transfer £${amountGBP} to ${stripeAccountId}`);
            return { transferId: `tr_mock_${Date.now()}`, success: true };
        }

        try {
            const transfer = await stripe.transfers.create({
                amount: Math.round(amountGBP * 100), // pence
                currency: 'gbp',
                destination: stripeAccountId,
                metadata: {
                    settlementBatchId,
                    jobId,
                    platform: 'cyvhub',
                },
                description: `CYVhub payout — Batch ${settlementBatchId}`,
            });

            // Update settlement batch with transfer details
            await prisma.settlementBatch.update({
                where: { id: settlementBatchId },
                data: {
                    stripeTransferId: transfer.id,
                    payoutStatus: 'PAID',
                    payoutAttempts: { increment: 1 },
                    lastPayoutAt: new Date(),
                    status: 'PAID',
                    processedAt: new Date(),
                },
            });

            console.log(`[StripeConnect] Transfer ${transfer.id} completed for batch ${settlementBatchId}`);
            return { transferId: transfer.id, success: true };
        } catch (err: any) {
            console.error(`[StripeConnect] Transfer failed for batch ${settlementBatchId}:`, err.message);

            // Log failure back to the settlement batch
            await prisma.settlementBatch.update({
                where: { id: settlementBatchId },
                data: {
                    payoutStatus: 'FAILED',
                    payoutError: err.message,
                    payoutAttempts: { increment: 1 },
                },
            });

            return { transferId: '', success: false, error: err.message };
        }
    }

    /**
     * Retries a failed payout for a specific settlement batch.
     * Uses exponential backoff awareness (caller responsible for scheduling).
     */
    static async retryFailedPayout(settlementBatchId: string): Promise<{ success: boolean; error?: string }> {
        const batch = await prisma.settlementBatch.findUnique({
            where: { id: settlementBatchId },
        });

        if (!batch) return { success: false, error: 'Settlement batch not found' };
        if (batch.payoutStatus === 'PAID') return { success: false, error: 'Already paid' };
        if (batch.payoutAttempts >= 5) return { success: false, error: 'Maximum retry attempts reached' };

        // Get the recipient's Stripe account ID
        const recipient = await prisma.user.findUnique({
            where: { id: batch.recipientId },
            select: { stripeAccountId: true, stripeOnboardingComplete: true },
        });

        if (!recipient?.stripeAccountId) {
            return { success: false, error: 'Recipient has no Stripe connected account' };
        }

        if (!recipient.stripeOnboardingComplete) {
            return { success: false, error: 'Stripe onboarding not complete for recipient' };
        }

        // Mark as retrying
        await prisma.settlementBatch.update({
            where: { id: settlementBatchId },
            data: { payoutStatus: 'RETRYING' },
        });

        const result = await StripeConnectService.executeTransfer(
            batch.netAmount,
            recipient.stripeAccountId,
            settlementBatchId,
            batch.jobIds // Just reference
        );

        return { success: result.success, error: result.error };
    }

    /**
     * Handles `account.updated` webhook from Stripe to sync onboarding status.
     */
    static async handleAccountUpdatedWebhook(account: Stripe.Account): Promise<void> {
        const userId = account.metadata?.userId;
        if (!userId) return;

        const complete = !!account.details_submitted && !account.requirements?.currently_due?.length;

        await prisma.user.updateMany({
            where: { stripeAccountId: account.id },
            data: { stripeOnboardingComplete: complete },
        });

        console.log(`[StripeConnect] Account ${account.id} onboarding updated: complete=${complete}`);
    }
}
