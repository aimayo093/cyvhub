import { prisma } from '../index';
import { StripeConnectService } from './stripe-connect.service';

export class PayoutService {
    /**
     * Processes all unpaid settlement batches.
     * This should be called by the weekly scheduler to clear balances
     * and wire money to fully-KYC verified connected accounts.
     */
    static async processWeeklyBatches() {
        console.log('[PAYOUT_SERVICE] Starting weekly payout batch processing...');
        
        try {
            // Find all pending batches ready to be paid
            const pendingBatches = await prisma.settlementBatch.findMany({
                where: {
                    status: 'PENDING_APPROVAL'
                },
                include: {
                    recipientUser: {
                        select: {
                            id: true,
                            stripeAccountId: true,
                            stripeOnboardingComplete: true
                        }
                    }
                }
            });

            console.log(`[PAYOUT_SERVICE] Found ${pendingBatches.length} pending batches.`);

            const results = {
                successful: 0,
                failed: 0,
                kyc_blocked: 0
            };

            for (const batch of pendingBatches) {
                const user = batch.recipientUser;
                const batchId = batch.id;
                const amount = batch.netAmount;

                // 1. Verify KYC & Connectivity
                if (!user || !user.stripeAccountId || !user.stripeOnboardingComplete) {
                    console.log(`[PAYOUT_SERVICE] Blocked transfer for Batch ${batchId}. Recipient ${batch.recipientId} is not KYC verified.`);
                    await prisma.settlementBatch.update({
                        where: { id: batchId },
                        data: {
                            payoutStatus: 'FAILED',
                            notes: 'Blocked: Recipient has not completed Stripe Express KYC onboarding.'
                        }
                    });
                    results.kyc_blocked++;
                    continue;
                }

                // 2. Issue Transfer
                try {
                    const txResult = await StripeConnectService.executeTransfer(
                        amount,
                        user.stripeAccountId,
                        batchId,
                        `Batch payout for ${batch.reference}` // dummy representation
                    );

                    if (txResult.success) {
                        await prisma.settlementBatch.update({
                            where: { id: batchId },
                            data: {
                                status: 'APPROVED',
                                payoutStatus: 'TRANSFERRED',
                                stripeTransferId: txResult.transferId,
                                processedAt: new Date()
                            }
                        });
                        results.successful++;
                    } else {
                        throw new Error('Stripe returned failure without explicit catch block');
                    }
                } catch (txErr: any) {
                    console.error(`[PAYOUT_SERVICE] Transfer failed for Batch ${batchId}:`, txErr.message);
                    
                    // Increment payout attempts
                    await prisma.settlementBatch.update({
                        where: { id: batchId },
                        data: {
                            payoutAttempts: { increment: 1 },
                            payoutStatus: batch.payoutAttempts >= 3 ? 'FAILED' : 'PENDING'
                        }
                    });
                    results.failed++;
                }
            }

            console.log(`[PAYOUT_SERVICE] Run complete. Success: ${results.successful}, Failed: ${results.failed}, KYC Blocked: ${results.kyc_blocked}`);
            return results;

        } catch (error) {
            console.error('[PAYOUT_SERVICE] Critical failure during batch processing:', error);
            throw error;
        }
    }
}
