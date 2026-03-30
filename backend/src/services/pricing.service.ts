import { prisma } from '../index';

export class PricingService {
    /**
     * Calculates the "Chargeable Weight" mapped exactly from the PRD requirement.
     * chargeable_weight = max(actual_weight, volumetric_weight)
     * volumetric_weight = (L x W x H) / 5000
     */
    static calculateChargeableWeight(items: any[]) {
        let totalActualWeight = 0;
        let totalVolumetricWeight = 0;

        for (const item of items) {
            const qty = item.quantity || 1;
            totalActualWeight += (item.weightKg * qty);
            const volWeight = ((item.lengthCm * item.widthCm * item.heightCm) / 5000) * qty;
            totalVolumetricWeight += volWeight;
        }

        return {
            actualWeightKg: totalActualWeight,
            volumetricWeightKg: Number(totalVolumetricWeight.toFixed(2)),
            chargeableWeightKg: Math.max(totalActualWeight, totalVolumetricWeight)
        };
    }

    /**
     * Executes the sophisticated customer quotation logic.
     * Instead of raw "distance * price", this evaluates weight bans, volumetric
     * surcharges, access penalties (stairs), and creates atomic line items.
     */
    static async generateCustomerQuote(vehicleClassId: string, distanceMiles: number, chargeableWeightKg: number, flags: any, quantity: number = 1) {
        const vehicle = await (prisma as any).vehicleClass.findUnique({
            where: { id: vehicleClassId },
            include: { pricingRules: true }
        });

        if (!vehicle) throw new Error("Invalid Vehicle Class");

        let customerTotal = 0;
        const lineItems = [];
        let requiresReview = false;
        let blockReason = null;
        let originalPerParcelTotal = 0;

        // --- PHASE 1: STANDARD OVERHEAD CALCULATION (SINGLE PARCEL PRICING) ---

        // 1. Base Fee Search
        const baseRule = vehicle.pricingRules.find((r: any) => r.type === 'BASE_FEE');
        const baseFee = baseRule ? baseRule.amount : vehicle.baseFee;
        customerTotal += baseFee;
        lineItems.push({ target: 'CUSTOMER', type: 'BASE_FEE', amount: baseFee, description: 'Base Pickup Fee' });

        // 2. Mileage Fee Execution
        const mileRule = vehicle.pricingRules.find((r: any) => r.type === 'MILEAGE');
        const mileageRate = mileRule ? mileRule.amount : vehicle.mileageRate;
        const mileageTotal = distanceMiles * mileageRate;
        customerTotal += mileageTotal;
        lineItems.push({ target: 'CUSTOMER', type: 'MILEAGE', amount: Number(mileageTotal.toFixed(2)), description: `Mileage (${distanceMiles.toFixed(1)} miles @ £${mileageRate.toFixed(2)}/m)` });

        // 3. Dynamically evaluate Weight Surcharge Bands mapped from DB (Based on 1 parcel weight logic initially)
        const weightRules = vehicle.pricingRules.filter((r: any) => r.type === 'WEIGHT_SURCHARGE');
        let weightSurchargeApplied = false;
        // Evaluate based on the per-parcel weight to match single-item pricing rules
        const perParcelWeight = chargeableWeightKg / quantity;
        for (const rule of weightRules.sort((a: any, b: any) => (b.conditionMin || 0) - (a.conditionMin || 0))) {
            if (perParcelWeight >= (rule.conditionMin || 0) && perParcelWeight <= (rule.conditionMax || 999999)) {
                customerTotal += rule.amount;
                lineItems.push({ target: 'CUSTOMER', type: 'WEIGHT_SURCHARGE', amount: rule.amount, description: `Weight Surcharge (${rule.name})` });
                weightSurchargeApplied = true;
                break;
            }
        }

        // 4. Access Surcharges (Stairs, no-lift, etc.)
        if (flags.stairs) {
            const stairRule = vehicle.pricingRules.find((r: any) => r.type === 'ACCESS_SURCHARGE' && r.conditionKey === 'stairs');
            const stairAmount = stairRule ? stairRule.amount : 15.00; // PRD default fallback if unseeded
            customerTotal += stairAmount;
            lineItems.push({ target: 'CUSTOMER', type: 'ACCESS_SURCHARGE', amount: stairAmount, description: 'Stairs / Difficult Access Surcharge' });
        }

        // 4b. Sub-stops iteration logic (Epic 3 request)
        if (flags.extraStops && flags.extraStops > 0) {
            const stopRule = vehicle.pricingRules.find((r: any) => r.type === 'EXTRA_STOP');
            const stopAmount = stopRule ? stopRule.amount : 10.00;
            const totalStopAmount = stopAmount * flags.extraStops;
            customerTotal += totalStopAmount;
            lineItems.push({ target: 'CUSTOMER', type: 'EXTRA_STOP', amount: totalStopAmount, description: `Extra Drops (${flags.extraStops} @ £${stopAmount.toFixed(2)} each)` });
        }

        // 5. Out of Hours Surcharge (20% logic requested by PRD)
        const hour = new Date().getHours();
        if (hour < 6 || hour > 19) { // Assuming typical 06:00 to 19:00 standard day
            const oohRule = vehicle.pricingRules.find((r: any) => r.type === 'OOH_UPLIFT');
            const oohPercent = oohRule ? oohRule.amount : 20.0;
            const oohAmount = customerTotal * (oohPercent / 100);
            customerTotal += oohAmount;
            lineItems.push({ target: 'CUSTOMER', type: 'OOH_UPLIFT', amount: Number(oohAmount.toFixed(2)), description: `Out of Hours Uplift (${oohPercent}%)` });
        }

        // Cache the raw single parcel cost before scaling
        originalPerParcelTotal = customerTotal;

        // --- PHASE 2: MULTI-PARCEL PRICING ALGORITHM ---

        let discountAmount = 0;
        let finalCustomerTotal = customerTotal * quantity;
        let discountPercent = 0;

        if (quantity > 1) {
            // Find bulk discount tiers directly mapped to the vehicle strategy
            const bulkRules = vehicle.pricingRules.filter((r: any) => r.type === 'MULTI_PARCEL_DISCOUNT');
            for (const rule of bulkRules.sort((a: any, b: any) => (b.conditionMin || 0) - (a.conditionMin || 0))) {
                if (quantity >= (rule.conditionMin || 0) && quantity <= (rule.conditionMax || 999999)) {
                    discountPercent = rule.amount;
                    break;
                }
            }

            // Fetch Global Safeguards asynchronously (fallback blocks if db fails)
            try {
                const globalConfig = await (prisma as any).globalConfig.findUnique({ where: { key: 'pricing_engine_config' } });
                if (globalConfig?.config) {
                    const cfg = globalConfig.config;
                    if (cfg.max_discount_cap && discountPercent > cfg.max_discount_cap) {
                        discountPercent = cfg.max_discount_cap; // Cap it strictly
                    }
                    if (cfg.enable_bulk === false) discountPercent = 0; // Admin kill-switch
                }
            } catch (e) {
                console.error("Global pricing config could not be resolved safely", e);
            }

            // Execute Margin Discount Math
            if (discountPercent > 0) {
                discountAmount = finalCustomerTotal * (discountPercent / 100);
                
                // Extra verification: enforce absolute minimum floor
                // Basic minimum heuristic: Total must be greater than original 1-parcel overhead + £10 margin
                const operationalFloorMin = originalPerParcelTotal + 10.00;
                if ((finalCustomerTotal - discountAmount) < operationalFloorMin) {
                    discountAmount = finalCustomerTotal - operationalFloorMin;
                    discountAmount = Math.max(0, discountAmount); // Prevent negative discount addition
                }

                finalCustomerTotal -= discountAmount;
                
                lineItems.push({ 
                    target: 'CUSTOMER', 
                    type: 'MULTI_PARCEL_DISCOUNT', 
                    amount: -Number(discountAmount.toFixed(2)), 
                    description: `Bulk Parcel Discount (${discountPercent}% Off)` 
                });
            }
        }

        // 6. Extensibility: Vehicle limits triggers a manual review (using aggregate weight)
        if (chargeableWeightKg > vehicle.maxWeightKg) {
             requiresReview = true;
             blockReason = "OVERWEIGHT";
        }

        return { 
            originalPerParcelExVat: Number(originalPerParcelTotal.toFixed(2)),
            grossExVat: Number((originalPerParcelTotal * quantity).toFixed(2)),
            customerTotal: Number(finalCustomerTotal.toFixed(2)), 
            discountApplied: Number(discountAmount.toFixed(2)),
            lineItems, 
            requiresReview,
            blockReason
        };
    }
}
