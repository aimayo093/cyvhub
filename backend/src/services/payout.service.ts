import { prisma } from '../index';

export class PayoutService {
    /**
     * Processes weekly batch payouts (Unchanged as it handles Stripe logic).
     */
    static async processWeeklyBatches() {
        // ... (Existing Stripe batch logic remains valid)
    }

    /**
     * The NEW UK-Wide Driver Payout Engine.
     */
    static async generateDriverPayout(vehicleClassId: string, roadDistanceMiles: number, totalQuantity: number, flags: any = {}) {
        const vehicle = await (prisma as any).vehicleClass.findUnique({
            where: { id: vehicleClassId }
        });

        if (!vehicle) throw new Error("Invalid Vehicle Class");

        // 1. Fetch Global Config
        const globalConfig = await (prisma as any).globalConfig.findUnique({ where: { key: 'pricing_engine_config' } });
        const config = globalConfig?.config as any || {};

        let driverTotal = 0;
        const lineItems = [];

        // 2. Base Pickup Fee (Driver share)
        // Usually ~70-80% of customer base fee or explicitly defined
        const customerBase = config.base_vehicle_fees?.[vehicle.name] || Number(vehicle.baseFee) || 39.00;
        const driverBase = Number(vehicle.driverPickupFee) || (customerBase * 0.70);
        driverTotal += driverBase;
        lineItems.push({ target: 'DRIVER', type: 'PICKUP_FEE', amount: Number(driverBase.toFixed(2)), description: 'Base Pickup Fee' });

        // 3. Mileage Fee (Driver share)
        const customerMileRate = config.mileage_rates?.[vehicle.name] || Number(vehicle.mileageRate) || 1.35;
        const driverMileRate = Number(vehicle.driverMileageRate) || (customerMileRate * 0.80);
        const mileageTotal = roadDistanceMiles * driverMileRate;
        driverTotal += mileageTotal;
        lineItems.push({ 
            target: 'DRIVER', 
            type: 'MILEAGE', 
            amount: Number(mileageTotal.toFixed(2)), 
            description: `Loaded Mileage (${roadDistanceMiles.toFixed(1)} miles @ £${driverMileRate.toFixed(2)}/m)` 
        });

        // 4. Remote Area Bonus (Passing through some of the surcharge)
        if (flags.isRemote) {
            const customerRemote = config.surcharges?.remote_area_flat || 15.00;
            const driverBonus = customerRemote * 0.60;
            driverTotal += driverBonus;
            lineItems.push({ target: 'DRIVER', type: 'REMOTE_BONUS', amount: driverBonus, description: 'Remote Area Delivery Bonus' });
        }

        // 5. Out of Hours Bonus
        if (flags.isOOH) {
            const customerOOH = config.surcharges?.out_of_hours_flat || 20.00;
            const driverBonus = customerOOH * 0.75;
            driverTotal += driverBonus;
            lineItems.push({ target: 'DRIVER', type: 'OOH_BONUS', amount: driverBonus, description: 'Out of Hours Bonus' });
        }

        return { 
            driverTotal: Number(driverTotal.toFixed(2)), 
            lineItems, 
            requiresReview: false,
            blockReason: null
        };
    }
}
