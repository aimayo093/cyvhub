import { prisma } from '../index';
import { RoutingService } from './routing.service';
import { Logger } from '../utils/logger';

export class PricingService {
    private static readonly logger = new Logger(PricingService.name);
    /**
     * Calculates the "Chargeable Weight" (unchanged from previous version as it follows PRD).
     */
    static calculateChargeableWeight(items: any[]) {
        if (!items || !Array.isArray(items) || items.length === 0) {
            this.logger.error('[Weight Calc] No items provided for weight calculation');
            throw new Error('No items provided for weight calculation');
        }
        let totalActualWeight = 0;
        let totalVolumetricWeight = 0;

        for (const item of items) {
            const qty = Number(item.quantity) || 1;
            const w = Number(item.weightKg) || 0;
            const l = Number(item.lengthCm) || 0;
            const wd = Number(item.widthCm) || 0;
            const h = Number(item.heightCm) || 0;

            totalActualWeight += (w * qty);
            const volWeight = ((l * wd * h) / 5000) * qty;
            totalVolumetricWeight += volWeight;

            if (isNaN(w) || isNaN(l) || isNaN(wd) || isNaN(h)) {
                this.logger.error(`[Weight Calc] Invalid dimensions found in item: ${JSON.stringify(item)}`);
                throw new Error(`Invalid dimensions found in one or more items.`);
            }
        }

        return {
            actualWeightKg: Number(totalActualWeight.toFixed(2)),
            volumetricWeightKg: Number(totalVolumetricWeight.toFixed(2)),
            chargeableWeightKg: Number(Math.max(totalActualWeight, totalVolumetricWeight).toFixed(2))
        };
    }

    /**
     * The NEW UK-Wide Consignment-First Pricing Engine.
     */
    static async generateCustomerQuote(vehicleClassId: string, roadDistanceMiles: number, chargeableWeightKg: number, flags: any = {}, totalQuantity: number = 1, businessId?: string) {
        this.logger.log(`Starting quote for ${vehicleClassId}, Dist: ${roadDistanceMiles}m, Qty: ${totalQuantity}`);

        if (!vehicleClassId) throw new Error('Missing vehicleClassId for pricing');
        if (typeof roadDistanceMiles !== 'number' || roadDistanceMiles < 0) throw new Error(`Invalid road distance: ${roadDistanceMiles}`);
        if (typeof chargeableWeightKg !== 'number' || chargeableWeightKg < 0) throw new Error(`Invalid chargeable weight: ${chargeableWeightKg}`);

        // 1. Fetch Global Config
        const globalConfig = await (prisma as any).globalConfig.findUnique({ where: { key: 'pricing_engine_config' } });
        const config = globalConfig?.config as any || {};

        const vehicle = await (prisma as any).vehicleClass.findUnique({
            where: { id: vehicleClassId }
        });

        if (!vehicle) {
            throw new Error("Invalid Vehicle Class");
        }

        const vehicleKey = vehicle.name; // e.g., SMALL_VAN
        let lineItems = [];
        let subtotal = 0;

        // 2. Base Vehicle Fee
        const baseFee = config.base_vehicle_fees?.[vehicleKey] || Number(vehicle.baseFee) || 39.00;
        subtotal += baseFee;
        lineItems.push({ target: 'CUSTOMER', type: 'BASE_FEE', amount: baseFee, description: `Vehicle Base Fee (${vehicle.displayName || vehicle.name})` });

        // 3. Loaded Mileage Fee
        const mileRate = config.mileage_rates?.[vehicleKey] || Number(vehicle.mileageRate) || 1.35;
        const mileageCost = roadDistanceMiles * mileRate;
        subtotal += mileageCost;
        lineItems.push({ 
            target: 'CUSTOMER', 
            type: 'MILEAGE', 
            amount: Number(mileageCost.toFixed(2)), 
            description: `Road Mileage (${roadDistanceMiles.toFixed(1)} miles @ £${mileRate.toFixed(2)}/m)` 
        });

        // 4. Multi-Parcel Handling Fee (Consignment Logic)
        if (totalQuantity > 1) {
            const hConfig = config.parcel_handling_fees || { tier_1_max: 5, tier_1_fee: 2.50, tier_2_fee: 1.50 };
            let handlingFee = 0;
            const extraParcels = totalQuantity - 1;

            if (extraParcels <= (hConfig.tier_1_max - 1)) {
                handlingFee = extraParcels * hConfig.tier_1_fee;
            } else {
                const tier1Count = hConfig.tier_1_max - 1;
                const tier2Count = extraParcels - tier1Count;
                handlingFee = (tier1Count * hConfig.tier_1_fee) + (tier2Count * hConfig.tier_2_fee);
            }

            if (handlingFee > 0) {
                subtotal += handlingFee;
                lineItems.push({ target: 'CUSTOMER', type: 'HANDLING_FEE', amount: Number(handlingFee.toFixed(2)), description: `Additional Item Handling (${extraParcels} items)` });
            }
        }

        // 5. Service Level Uplift (SLA)
        const slaLevel = flags.serviceLevel || 'STANDARD';
        const sla = config.service_levels?.find((s: any) => s.id === slaLevel) || { multiplier: 1.0 };
        if (sla.multiplier !== 1.0) {
            const uplift = subtotal * (sla.multiplier - 1);
            subtotal += uplift;
            lineItems.push({ target: 'CUSTOMER', type: 'SLA_UPLIFT', amount: Number(uplift.toFixed(2)), description: `Service Level: ${sla.name || slaLevel}` });
        }

        // 6. Remote Area Surcharge
        const isRemote = flags.isRemote || false;
        if (isRemote) {
            const remoteFee = config.surcharges?.remote_area_flat || 15.00;
            subtotal += remoteFee;
            lineItems.push({ target: 'CUSTOMER', type: 'REMOTE_SURCHARGE', amount: remoteFee, description: 'Remote Area Surcharge' });
        }

        // 7. Out of Hours Surcharge
        const hour = new Date().getHours();
        if (hour < 6 || hour > 19 || flags.isOOH) {
            const oohFee = config.surcharges?.out_of_hours_flat || 20.00;
            subtotal += oohFee;
            lineItems.push({ target: 'CUSTOMER', type: 'OOH_SURCHARGE', amount: oohFee, description: 'Out of Hours Surcharge' });
        }

        // 8. Weight Surcharges (Vehicle Limits)
        if (chargeableWeightKg > Number(vehicle.maxWeightKg)) {
            const overweightFee = 25.00; // Default flat penalty for manual heavy handling
            subtotal += overweightFee;
            lineItems.push({ target: 'CUSTOMER', type: 'WEIGHT_SURCHARGE', amount: overweightFee, description: 'Heavy Load Handling Surcharge' });
        }

        // 9. VAT Calculation (Final Layer)
        const vatRate = config.surcharges?.vat_percentage || 20.0;
        const totalExVat = subtotal;
        const vatAmount = totalExVat * (vatRate / 100);
        const totalIncVat = totalExVat + vatAmount;

        console.log(`[PRICING_ENGINE] Success. Total Ex VAT: £${totalExVat.toFixed(2)}, Total Inc VAT: £${totalIncVat.toFixed(2)}`);

        return {
            originalPerParcelExVat: Number((totalExVat / totalQuantity).toFixed(2)),
            grossExVat: Number(totalExVat.toFixed(2)),
            customerTotal: Number(totalExVat.toFixed(2)), // We store ExVat as the primary "price" in many places, but include breakdown
            totalIncVat: Number(totalIncVat.toFixed(2)),
            vatAmount: Number(vatAmount.toFixed(2)),
            lineItems,
            requiresReview: subtotal < 50 && roadDistanceMiles > 100, // Example safety check
            blockReason: null
        };
    }
}
