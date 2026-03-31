import { prisma } from '../index';
import { PricingService } from './pricing.service';
import { PayoutService } from './payout.service';

export class CommercialService {
    /**
     * The master orchestrator for Phase E Quote Generation.
     * Evaluates vehicle suitability, pricing, payouts, and margins.
     */
    static async requestQuote(payload: { pickupPostcode: string, dropoffPostcode: string, distanceMiles: number, items: any[], flags: any }) {
        // 1. Calculate the Chargeable Weight
        const totalQuantity = payload.items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
        const { actualWeightKg, volumetricWeightKg, chargeableWeightKg } = PricingService.calculateChargeableWeight(payload.items);

        // 2. Select Suitable Vehicle (Suitability Engine Layer)
        const vehicles = await (prisma as any).vehicleClass.findMany({
            where: { isActive: true },
            orderBy: { maxWeightKg: 'asc' }
        });

        const suitableVehicle = vehicles.find((v: any) => chargeableWeightKg <= v.maxWeightKg);
        if (!suitableVehicle) {
            return {
                approved: false,
                reason: 'OVERWEIGHT',
                message: 'Load exceeds all available vehicle capacities. Manual review required.'
            };
        }

        let adjustedDistanceMiles = payload.distanceMiles;
        if (payload.flags?.isReturnTrip) {
            adjustedDistanceMiles = payload.distanceMiles * 2;
        }

        // 3. Generate Pricing & Payout
        const pricing = await PricingService.generateCustomerQuote(suitableVehicle.id, adjustedDistanceMiles, chargeableWeightKg, payload.flags, totalQuantity);
        const payout = await PayoutService.generateDriverPayout(suitableVehicle.id, adjustedDistanceMiles, chargeableWeightKg, payload.flags);

        // 4. Margin Control Gate
        const rawMargin = pricing.customerTotal - payout.driverTotal;
        const marginPercentage = (rawMargin / pricing.customerTotal) * 100;

        let status = 'AUTO_APPROVED';
        let reviewReason = null;

        if (pricing.requiresReview || payout.requiresReview) {
            status = 'PENDING_REVIEW';
            reviewReason = pricing.blockReason || payout.blockReason || 'COMPLEX_LOAD';
        } else if (marginPercentage < 20.0) { // HARD PRD RULE: Flag low margins (Admin configurable threshold would be here)
            status = 'PENDING_REVIEW';
            reviewReason = 'MARGIN_TOO_LOW';
        }

        // 5. Store the immutable QuoteRequest in DB
        const quoteRequest = await (prisma as any).quoteRequest.create({
            data: {
                pickupPostcode: payload.pickupPostcode || 'UNKNOWN',
                dropoffPostcode: payload.dropoffPostcode || 'UNKNOWN',
                distanceMiles: payload.distanceMiles,
                actualWeightKg,
                volumetricWeightKg,
                chargeableWeightKg,
                recommendedVehicleId: suitableVehicle.id,
                customerTotal: pricing.customerTotal,
                driverPayoutTotal: payout.driverTotal,
                marginPercentage: Number(marginPercentage.toFixed(2)),
                status,
                parcels: {
                    create: payload.items.map((item: any) => ({
                        weightKg: parseFloat(item.weightKg) || 0,
                        lengthCm: parseFloat(item.lengthCm) || 0,
                        widthCm: parseFloat(item.widthCm) || 0,
                        heightCm: parseFloat(item.heightCm) || 0,
                        quantity: parseInt(item.quantity, 10) || 1,
                        description: item.description || null
                    }))
                },
                lineItems: {
                    create: [
                        ...pricing.lineItems.map((li: any) => ({ target: li.target, type: li.type, amount: li.amount, description: li.description })),
                        ...payout.lineItems.map((li: any) => ({ target: li.target, type: li.type, amount: li.amount, description: li.description }))
                    ]
                }
            },
            include: { lineItems: true, vehicle: true, parcels: true }
        });

        // 6. Spawn Manual Review Case if flagged
        if (status === 'PENDING_REVIEW') {
            await (prisma as any).manualReviewCase.create({
                data: {
                    quoteRequestId: quoteRequest.id,
                    reason: reviewReason || 'UNKNOWN'
                }
            });
        }

        return {
            approved: true,
            status,
            quote: quoteRequest,
            additionalMetrics: {
                quantity: totalQuantity,
                basePrice: pricing.originalPerParcelExVat,
                bulkDiscount: pricing.discountApplied
            }
        };
    }
}
