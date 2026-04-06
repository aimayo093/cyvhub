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
            const qty = Number(item.quantity) || 1;
            const w = Number(item.weightKg) || 0;
            const l = Number(item.lengthCm) || 0;
            const wd = Number(item.widthCm) || 0;
            const h = Number(item.heightCm) || 0;

            totalActualWeight += (w * qty);
            const volWeight = ((l * wd * h) / 5000) * qty;
            totalVolumetricWeight += volWeight;
        }

        return {
            actualWeightKg: Number(totalActualWeight.toFixed(2)),
            volumetricWeightKg: Number(totalVolumetricWeight.toFixed(2)),
            chargeableWeightKg: Number(Math.max(totalActualWeight, totalVolumetricWeight).toFixed(2))
        };
    }

    /**
     * Executes the sophisticated customer quotation logic.
     * Instead of raw "distance * price", this evaluates weight bans, volumetric
     * surcharges, access penalties (stairs), and creates atomic line items.
     */
    static async generateCustomerQuote(vehicleClassId: string, distanceMiles: number, chargeableWeightKg: number, flags: any = {}, quantity: number = 1, businessId?: string) {
        console.log(`[PRICING_DEBUG] Starting quote for vehicle ${vehicleClassId}, dist ${distanceMiles}m, weight ${chargeableWeightKg}kg, businessId: ${businessId}`);
        
        const vehicle = await (prisma as any).vehicleClass.findUnique({
            where: { id: vehicleClassId },
            include: { pricingRules: true }
        });

        if (!vehicle) {
            console.error(`[PRICING_ERROR] Vehicle Class ${vehicleClassId} not found in database.`);
            throw new Error("Invalid Vehicle Class");
        }

        // --- CONTRACT OVERRIDE LAYER ---
        let contractRateRules: any[] = [];
        let contractDiscounts = { baseRate: 1.0, mileageRate: 1.0 };

        if (businessId) {
            const business = await prisma.businessAccount.findUnique({
                where: { id: businessId },
                include: { contract: { include: { rateRules: true } } }
            });

            if (business?.contract && business.contract.status === 'ACTIVE') {
                 contractRateRules = business.contract.rateRules;
                 contractDiscounts.baseRate = 1 - (business.contract.baseRateDiscount / 100);
                 contractDiscounts.mileageRate = business.contract.mileageRateFactor;
                 console.log(`[PRICING_DEBUG] Active Contract Found: ${business.contract.contractRef}. Base Discount: ${business.contract.baseRateDiscount}%. Mileage Factor: ${business.contract.mileageRateFactor}`);
            }
        }

        let customerTotal = 0;
        const lineItems = [];
        let requiresReview = false;
        let blockReason = null;
        let originalPerParcelTotal = 0;

        // --- PHASE 1: STANDARD OVERHEAD CALCULATION (SINGLE PARCEL PRICING) ---

        // 1. Base Fee Search
        const contractBaseRule = contractRateRules.find(r => r.vehicleType === vehicle.name && r.baseRate > 0);
        const baseRule = vehicle.pricingRules?.find((r: any) => r.type === 'BASE_FEE');
        
        let baseFee = contractBaseRule ? Number(contractBaseRule.baseRate) : 
                     (baseRule ? Number(baseRule.amount) : (Number(vehicle.baseFee) || 25.00));
        
        // Apply global contract discount if no specific rule
        if (!contractBaseRule && contractDiscounts.baseRate < 1.0) {
            baseFee *= contractDiscounts.baseRate;
        }

        customerTotal += baseFee;
        lineItems.push({ target: 'CUSTOMER', type: 'BASE_FEE', amount: Number(baseFee.toFixed(2)), description: 'Base Pickup Fee (Contracted)' });
        console.log(`[PRICING_DEBUG] Base Fee: £${baseFee}`);

        // 2. Mileage Fee Execution
        const contractMileRule = contractRateRules.find(r => r.vehicleType === vehicle.name && r.perMileRate > 0);
        const mileRule = vehicle.pricingRules?.find((r: any) => r.type === 'MILEAGE');
        
        let mileageRate = contractMileRule ? Number(contractMileRule.perMileRate) : 
                         (mileRule ? Number(mileRule.amount) : (Number(vehicle.mileageRate) || 1.50));
        
        // Apply global contract factor
        if (!contractMileRule) {
            mileageRate *= contractDiscounts.mileageRate;
        }

        const distanceVal = Math.max(0, Number(distanceMiles) || 0);
        const mileageTotal = distanceVal * mileageRate;
        customerTotal += mileageTotal;
        lineItems.push({ 
            target: 'CUSTOMER', 
            type: 'MILEAGE', 
            amount: Number(mileageTotal.toFixed(2)), 
            description: `Mileage (${distanceVal.toFixed(1)} miles @ £${mileageRate.toFixed(2)}/m)${businessId ? ' [Contracted]' : ''}` 
        });
        console.log(`[PRICING_DEBUG] Mileage: ${distanceVal}m @ £${mileageRate} = £${mileageTotal.toFixed(2)}`);

        // 3. Dynamically evaluate Weight Surcharge Bands mapped from DB
        const weightRules = (vehicle.pricingRules || []).filter((r: any) => r.type === 'WEIGHT_SURCHARGE');
        const perParcelWeight = Number(chargeableWeightKg) / (Number(quantity) || 1);
        
        for (const rule of weightRules.sort((a: any, b: any) => (Number(b.conditionMin) || 0) - (Number(a.conditionMin) || 0))) {
            const min = Number(rule.conditionMin) || 0;
            const max = Number(rule.conditionMax) || 999999;
            if (perParcelWeight >= min && perParcelWeight <= max) {
                const amt = Number(rule.amount) || 0;
                if (amt > 0) {
                    customerTotal += amt;
                    lineItems.push({ target: 'CUSTOMER', type: 'WEIGHT_SURCHARGE', amount: amt, description: `Weight Surcharge (${rule.name || 'Heavy Item'})` });
                    console.log(`[PRICING_DEBUG] Weight Surcharge Applied: ${rule.name} (£${amt})`);
                }
                break;
            }
        }

        // 4. Access Surcharges (Stairs, no-lift, etc.)
        if (flags?.stairs) {
            const stairRule = vehicle.pricingRules?.find((r: any) => r.type === 'ACCESS_SURCHARGE' && r.conditionKey === 'stairs');
            const stairAmount = stairRule ? Number(stairRule.amount) : 15.00;
            customerTotal += stairAmount;
            lineItems.push({ target: 'CUSTOMER', type: 'ACCESS_SURCHARGE', amount: stairAmount, description: 'Stairs / Difficult Access Surcharge' });
            console.log(`[PRICING_DEBUG] Access Surcharge: £${stairAmount}`);
        }

        // 4b. Sub-stops iteration logic
        const extraStops = Number(flags?.extraStops) || 0;
        if (extraStops > 0) {
            const stopRule = vehicle.pricingRules?.find((r: any) => r.type === 'EXTRA_STOP');
            const stopAmount = stopRule ? Number(stopRule.amount) : 10.00;
            const totalStopAmount = stopAmount * extraStops;
            customerTotal += totalStopAmount;
            lineItems.push({ target: 'CUSTOMER', type: 'EXTRA_STOP', amount: totalStopAmount, description: `Extra Drops (${extraStops} @ £${stopAmount.toFixed(2)} each)` });
            console.log(`[PRICING_DEBUG] Extra Stops: ${extraStops} @ £${stopAmount} = £${totalStopAmount}`);
        }

        // 5. Out of Hours Surcharge
        const hour = new Date().getHours();
        if (hour < 6 || hour > 19) {
            const oohRule = vehicle.pricingRules?.find((r: any) => r.type === 'OOH_UPLIFT');
            const oohPercent = oohRule ? Number(oohRule.amount) : 20.0;
            const oohAmount = customerTotal * (oohPercent / 100);
            customerTotal += oohAmount;
            lineItems.push({ target: 'CUSTOMER', type: 'OOH_UPLIFT', amount: Number(oohAmount.toFixed(2)), description: `Out of Hours Uplift (${oohPercent}%)` });
            console.log(`[PRICING_DEBUG] OOH Surcharge: ${oohPercent}% (£${oohAmount.toFixed(2)})`);
        }

        // Cache the raw single parcel cost before scaling
        originalPerParcelTotal = customerTotal;

        // --- PHASE 2: MULTI-PARCEL PRICING ALGORITHM ---

        let discountAmount = 0;
        const qCount = Number(quantity) || 1;
        let finalCustomerTotal = customerTotal * qCount;
        let discountPercent = 0;

        if (qCount > 1) {
            const bulkRules = (vehicle.pricingRules || []).filter((r: any) => r.type === 'MULTI_PARCEL_DISCOUNT');
            for (const rule of bulkRules.sort((a: any, b: any) => (Number(b.conditionMin) || 0) - (Number(a.conditionMin) || 0))) {
                if (qCount >= (Number(rule.conditionMin) || 0) && qCount <= (Number(rule.conditionMax) || 999999)) {
                    discountPercent = Number(rule.amount);
                    break;
                }
            }

            try {
                // SEC-AUDIT: Using standard camelCase for Prisma models.
                const globalConfig = await (prisma as any).globalConfig.findUnique({ where: { key: 'pricing_engine_config' } });
                if (globalConfig && typeof globalConfig.config === 'object' && globalConfig.config !== null) {
                    const cfg = globalConfig.config as any;
                    if (cfg.max_discount_cap !== undefined && discountPercent > Number(cfg.max_discount_cap)) {
                        discountPercent = Number(cfg.max_discount_cap);
                    }
                    if (cfg.enable_bulk === false) {
                        console.log(`[PRICING_DEBUG] Bulk discounts globally disabled via config.`);
                        discountPercent = 0;
                    }
                }
            } catch (e) {
                console.warn("[PRICING_WARN] Global pricing config could not be resolved safely", e);
            }

            if (discountPercent > 0) {
                discountAmount = finalCustomerTotal * (discountPercent / 100);
                const operationalFloorMin = originalPerParcelTotal + 10.00;
                if ((finalCustomerTotal - discountAmount) < operationalFloorMin) {
                    discountAmount = Math.max(0, finalCustomerTotal - operationalFloorMin);
                }

                finalCustomerTotal -= discountAmount;
                lineItems.push({ 
                    target: 'CUSTOMER', 
                    type: 'MULTI_PARCEL_DISCOUNT', 
                    amount: -Number(discountAmount.toFixed(2)), 
                    description: `Bulk Parcel Discount (${discountPercent}% Off)` 
                });
                console.log(`[PRICING_DEBUG] Multi-parcel Discount: ${discountPercent}% (£${discountAmount.toFixed(2)})`);
            }
        }

        // 6. Extensibility: Vehicle limits triggers a manual review (using aggregate weight)
        if (Number(chargeableWeightKg) > (Number(vehicle.maxWeightKg) || 0)) {
             requiresReview = true;
             blockReason = "OVERWEIGHT";
             console.log(`[PRICING_DEBUG] Quote requires review: OVERWEIGHT`);
        }

        console.log(`[PRICING_COMPLETE] Final Total: £${finalCustomerTotal.toFixed(2)}`);

        return { 
            originalPerParcelExVat: Number(originalPerParcelTotal.toFixed(2)),
            grossExVat: Number((originalPerParcelTotal * qCount).toFixed(2)),
            customerTotal: Number(finalCustomerTotal.toFixed(2)), 
            discountApplied: Number(discountAmount.toFixed(2)),
            lineItems, 
            requiresReview,
            blockReason
        };
    }
}
