import { prisma } from '../index';
import { PricingService } from './pricing.service';
import { PayoutService } from './payout.service';
import { RoutingService } from './routing.service';

export class CommercialService {
    /**
     * The master orchestrator for UK-Wide Quote Generation.
     */
    static async requestQuote(payload: { 
        pickupPostcode: string, 
        dropoffPostcode: string, 
        pickupCoords?: { lat: number, lng: number },
        dropoffCoords?: { lat: number, lng: number },
        items: any[], 
        flags: any, 
        vehicleType?: string, 
        businessId?: string 
    }) {
        const totalQuantity = payload.items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
        const { actualWeightKg, volumetricWeightKg, chargeableWeightKg } = PricingService.calculateChargeableWeight(payload.items);
        
        // 1. Select Suitable Vehicle
        const { SuitabilityService } = require('./suitability.service');
        const { available, rejected } = await SuitabilityService.findSuitableVehicles(payload.items, actualWeightKg, volumetricWeightKg);

        let suitableVehicle;
        if (payload.vehicleType) {
            const normalizedType = payload.vehicleType.trim().toUpperCase().replace(/\s+/g, '_');
            suitableVehicle = available.find((v: any) => v.name === normalizedType || v.name === payload.vehicleType);
            
            if (!suitableVehicle) {
                const rejection = rejected.find((r: any) => r.name === normalizedType || r.name === payload.vehicleType);
                return {
                    approved: false,
                    reason: rejection?.reason || 'VEHICLE_UNAVAILABLE',
                    message: rejection?.message || `The selected ${payload.vehicleType} is not suitable for this load.`
                };
            }
        } else {
            suitableVehicle = available[0];
        }

        if (!suitableVehicle) {
            return {
                approved: false,
                reason: 'OVERWEIGHT_OR_OVERSIZE',
                message: 'Load exceeds all available vehicle capacities. Manual review required.'
            };
        }

        // 2. Resolve Road Routing & Distance
        // If coords weren't provided (legacy/simple calls), we might need to resolve them, 
        // but typically the frontend/controller will provide them.
        let distanceMiles = 0;
        let durationMinutes = 0;

        if (payload.pickupCoords && payload.dropoffCoords) {
            const route = await RoutingService.calculateRoadRoute(payload.pickupCoords, payload.dropoffCoords);
            distanceMiles = route.distanceMiles;
            durationMinutes = route.durationMinutes;
        } else {
            // Fallback for missing coords (using legacy postcode distance tool if available)
            distanceMiles = 10; // Dummy fallback to prevent crash
        }

        if (payload.flags?.isReturnTrip) {
            distanceMiles = distanceMiles * 2;
        }

        // 3. Remote Area Detection
        const globalConfig = await (prisma as any).globalConfig.findUnique({ where: { key: 'pricing_engine_config' } });
        const config = globalConfig?.config as any || {};
        const remotePrefixes = config.remote_postcode_prefixes || [];
        
        const isPickupRemote = remotePrefixes.some((p: string) => payload.pickupPostcode.toUpperCase().startsWith(p));
        const isDropoffRemote = remotePrefixes.some((p: string) => payload.dropoffPostcode.toUpperCase().startsWith(p));
        const isRemote = isPickupRemote || isDropoffRemote;

        const augmentedFlags = { ...payload.flags, isRemote };

        // 4. Generate Pricing & Payout
        const pricing = await PricingService.generateCustomerQuote(
            suitableVehicle.id, 
            distanceMiles, 
            chargeableWeightKg, 
            augmentedFlags, 
            totalQuantity, 
            payload.businessId
        );

        const payout = await PayoutService.generateDriverPayout(
            suitableVehicle.id, 
            distanceMiles, 
            totalQuantity, 
            augmentedFlags
        );

        // 5. Margin Control Gate
        const rawMargin = pricing.customerTotal - payout.driverTotal;
        const marginPercentage = (rawMargin / pricing.customerTotal) * 100;

        let status = 'AUTO_APPROVED';
        let reviewReason = null;

        if (pricing.requiresReview || payout.requiresReview) {
            status = 'PENDING_REVIEW';
            reviewReason = pricing.blockReason || payout.blockReason || 'COMPLEX_LOAD';
        } else if (marginPercentage < 15.0) { // Safety margin trigger
            status = 'PENDING_REVIEW';
            reviewReason = 'MARGIN_TOO_LOW';
        }

        // 6. Store QuoteRequest
        const quoteRequest = await (prisma as any).quoteRequest.create({
            data: {
                pickupPostcode: payload.pickupPostcode,
                dropoffPostcode: payload.dropoffPostcode,
                distanceMiles,
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
                        ...pricing.lineItems.map((li: any) => ({ 
                            target: li.target, 
                            type: li.type, 
                            amount: li.amount, 
                            description: li.description 
                        })),
                        ...payout.lineItems.map((li: any) => ({ 
                            target: li.target, 
                            type: li.type, 
                            amount: li.amount, 
                            description: li.description 
                        }))
                    ]
                }
            },
            include: { lineItems: true, vehicle: true, parcels: true }
        });

        return {
            approved: true,
            status,
            quote: quoteRequest,
            metrics: {
                distanceMiles,
                durationMinutes,
                isRemote,
                vatAmount: pricing.vatAmount,
                totalIncVat: pricing.totalIncVat
            }
        };
    }
}
