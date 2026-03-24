import { prisma } from '../index';

export class PayoutService {
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
