import { Request, Response } from 'express';
import { prisma } from '../index';
import { PricingService } from '../services/pricing.service';
import { SuitabilityService } from '../services/suitability.service';
import { AddressService } from '../services/address.service';
import { RoutingService } from '../services/routing.service';
import { normalizeVehicleType } from '../utils/vehicleMapping';

export class QuoteController {
    // ... (getQuotes, getQuote, updateQuoteStatus remain same)

    static async calculatePrice(req: Request, res: Response): Promise<void> {
        const { pickupPostcode, dropoffPostcode, items, flags } = req.body;
        console.log(`[QUOTE_CONTROLLER] New UK-Wide Calculation: ${pickupPostcode} -> ${dropoffPostcode}`);

        try {
            if (!pickupPostcode || !dropoffPostcode || !items || !Array.isArray(items)) {
                res.status(400).json({ error: 'Missing required fields', error_code: 'MISSING_FIELDS' });
                return;
            }

            // 1. Resolve Street-Level Locations (Coords)
            const [pAddrs, dAddrs] = await Promise.all([
                AddressService.findAddresses(pickupPostcode),
                AddressService.findAddresses(dropoffPostcode)
            ]);
            const pickup = { lat: pAddrs[0].latitude, lng: pAddrs[0].longitude };
            const dropoff = { lat: dAddrs[0].latitude, lng: dAddrs[0].longitude };

            // 2. Road Routing
            const route = await RoutingService.calculateRoadRoute(pickup, dropoff);
            const miles = route.distanceMiles;

            // 3. Weight Calculation
            const { actualWeightKg, volumetricWeightKg, chargeableWeightKg } = PricingService.calculateChargeableWeight(items);

            // 4. Vehicle Suitability
            const { available, rejected } = await SuitabilityService.findSuitableVehicles(items, actualWeightKg, volumetricWeightKg);

            // 5. Generate Quotes for each available vehicle
            const globalConfig = await (prisma as any).globalConfig.findUnique({ where: { key: 'pricing_engine_config' } });
            const config = globalConfig?.config as any || {};
            const remotePrefixes = config.remote_postcode_prefixes || [];
            const isRemote = remotePrefixes.some((p: string) => pickupPostcode.toUpperCase().startsWith(p) || dropoffPostcode.toUpperCase().startsWith(p));

            const augmentedFlags = { ...flags, isRemote };
            const totalQuantity = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

            const quotes = [];
            for (const vc of available) {
                try {
                    const pricing = await PricingService.generateCustomerQuote(
                        vc.id, 
                        miles, 
                        chargeableWeightKg, 
                        augmentedFlags, 
                        totalQuantity,
                        req.body.businessId
                    );

                    quotes.push({
                        vehicleId: vc.id,
                        vehicleName: vc.name,
                        displayName: vc.displayName || vc.name,
                        distanceMiles: miles,
                        durationMinutes: route.durationMinutes,
                        chargeableWeightKg,
                        totalExVat: pricing.customerTotal,
                        totalIncVat: pricing.totalIncVat,
                        vatAmount: pricing.vatAmount,
                        lineItems: pricing.lineItems,
                        dimensions: `${vc.maxLengthCm / 100} x ${vc.maxWidthCm / 100} x ${vc.maxHeightCm / 100}m`,
                        maxWeight: `${vc.maxWeightKg}kg`
                    });
                } catch (pe) {
                    console.error(`[QUOTE_CONTROLLER] Pricing failed for ${vc.name}:`, pe);
                }
            }

            res.json({
                pickupPostcode,
                dropoffPostcode,
                miles,
                durationMinutes: route.durationMinutes,
                quotes,
                rejectedVehicles: rejected,
                isRemote
            });

        } catch (error: any) {
            console.error('[QUOTE_CONTROLLER] Fatal Error:', error.message);
            res.status(400).json({ 
                error: error.message || 'Calculation failed',
                error_code: 'CALCULATION_ERROR'
            });
        }
    }

    // ... (createQuote remains same)
}
