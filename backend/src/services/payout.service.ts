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
                }
            });

            console.log(`[PAYOUT_SERVICE] Found ${pendingBatches.length} pending batches.`);

            const results = {
                successful: 0,
                failed: 0,
                kyc_blocked: 0
            };

            for (const batch of pendingBatches) {
                const batchId = batch.id;
                const amount = batch.netAmount;
                const recipientId = batch.recipientId;

                const user = await prisma.user.findUnique({
                    where: { id: recipientId },
                    select: { stripeAccountId: true, stripeOnboardingComplete: true }
                });

                // 1. Verify KYC & Connectivity
                if (!user || !user.stripeAccountId || !user.stripeOnboardingComplete) {
                    console.log(`[PAYOUT_SERVICE] Blocked transfer for Batch ${batchId}. Recipient ${recipientId} is not KYC verified.`);
                    await prisma.settlementBatch.update({
                        where: { id: batchId },
                        data: {
                            payoutStatus: 'FAILED',
                            payoutError: 'Blocked: Recipient has not completed Stripe Express KYC onboarding.'
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

    /**
     * Executes the driver payout calculation logic.
     * Mirrors the customer pricing engine but protects CYVhub margins by utilizing entirely separate 
     * `PayoutRule` rows natively seeded for drivers instead of customers.
     */
    static async generateDriverPayout(vehicleClassId: string, distanceMiles: number, chargeableWeightKg: number, flags: any) {
        const vehicle = await (prisma as any).vehicleClass.findUnique({
            where: { id: vehicleClassId },
            include: { payoutRules: true }
        });

        if (!vehicle) throw new Error("Invalid Vehicle Class");

        let driverTotal = 0;
        const lineItems = [];
        let requiresReview = false;
        let blockReason = null;

        // 1. Base Pickup Fee
        const baseRule = vehicle.payoutRules.find((r: any) => r.type === 'PICKUP_FEE');
        const baseFee = baseRule ? baseRule.amount : vehicle.driverPickupFee;
        driverTotal += baseFee;
        lineItems.push({ target: 'DRIVER', type: 'PICKUP_FEE', amount: baseFee, description: 'Base Pickup Fee' });

        // 2. Mileage Fee Execution
        const mileRule = vehicle.payoutRules.find((r: any) => r.type === 'MILEAGE');
        const mileageRate = mileRule ? mileRule.amount : vehicle.driverMileageRate;
        const mileageTotal = distanceMiles * mileageRate;
        driverTotal += mileageTotal;
        lineItems.push({ target: 'DRIVER', type: 'MILEAGE', amount: Number(mileageTotal.toFixed(2)), description: `Loaded Mileage (${distanceMiles.toFixed(1)} miles @ £${mileageRate.toFixed(2)}/m)` });

        // 3. Weight Bonus Bands
        const weightRules = vehicle.payoutRules.filter((r: any) => r.type === 'WEIGHT_BONUS');
        for (const rule of weightRules.sort((a: any, b: any) => (b.conditionMin || 0) - (a.conditionMin || 0))) {
            if (chargeableWeightKg >= (rule.conditionMin || 0) && chargeableWeightKg <= (rule.conditionMax || 999999)) {
                driverTotal += rule.amount;
                lineItems.push({ target: 'DRIVER', type: 'WEIGHT_BONUS', amount: rule.amount, description: `Weight Bonus (${rule.name})` });
                break;
            }
        }

        // 4. Access Bonus (Stairs passing through)
        if (flags.stairs) {
            const stairRule = vehicle.payoutRules.find((r: any) => r.type === 'ACCESS_BONUS' && r.conditionKey === 'stairs');
            const stairAmount = stairRule ? stairRule.amount : 5.00; // Small kicker default passing onto driver
            driverTotal += stairAmount;
            lineItems.push({ target: 'DRIVER', type: 'ACCESS_BONUS', amount: stairAmount, description: 'Stairs / Difficult Access Bonus' });
        }

        // 4b. Sub-stops bonus logic
        if (flags.extraStops && flags.extraStops > 0) {
            const stopRule = vehicle.payoutRules.find((r: any) => r.type === 'EXTRA_STOP');
            const stopAmount = stopRule ? stopRule.amount : 5.00;
            const totalStopAmount = stopAmount * flags.extraStops;
            driverTotal += totalStopAmount;
            lineItems.push({ target: 'DRIVER', type: 'EXTRA_STOP', amount: totalStopAmount, description: `Extra Drops Bonus (${flags.extraStops} drops)` });
        }

        // 5. Out of Hours Bonus 
        const hour = new Date().getHours();
        if (hour < 6 || hour > 19) {
            const oohRule = vehicle.payoutRules.find((r: any) => r.type === 'OOH_BONUS');
            const oohPercent = oohRule ? oohRule.amount : 20.0;
            const oohAmount = driverTotal * (oohPercent / 100);
            driverTotal += oohAmount;
            lineItems.push({ target: 'DRIVER', type: 'OOH_BONUS', amount: Number(oohAmount.toFixed(2)), description: `Out of Hours Uplift Bonus (${oohPercent}%)` });
        }

        return { 
            driverTotal: Number(driverTotal.toFixed(2)), 
            lineItems, 
            requiresReview,
            blockReason
        };
    }
}
