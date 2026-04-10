import { Request, Response } from 'express';
import { prisma } from '../index';
import { PricingService } from '../services/pricing.service';
import { SuitabilityService } from '../services/suitability.service';
import { AddressService } from '../services/address.service';
import { RoutingService } from '../services/routing.service';
import { normalizeVehicleType } from '../utils/vehicleMapping';
import { CommercialService } from '../services/commercial.service';

export class QuoteController {
    static async getQuotes(req: any, res: Response): Promise<void> {
        try {
            const quotes = await prisma.quoteRequest.findMany({
                where: req.user?.role === 'admin' ? {} : { customerId: req.user?.id },
                include: { vehicle: true, customer: true },
                orderBy: { createdAt: 'desc' }
            });
            res.json(quotes);
        } catch (error) {
            console.error('[QUOTE_CONTROLLER] Fetch Quotes Error:', error);
            res.status(500).json({ error: 'Failed to fetch quotes' });
        }
    }

    static async getQuote(req: any, res: Response): Promise<void> {
        try {
            const quote = await prisma.quoteRequest.findUnique({
                where: { id: req.params.id as string },
                include: { vehicle: true, customer: true, parcels: true, lineItems: true }
            });
            if (!quote) {
                res.status(404).json({ error: 'Quote not found' });
                return;
            }
            res.json(quote);
        } catch (error) {
            console.error('[QUOTE_CONTROLLER] Fetch Quote Error:', error);
            res.status(500).json({ error: 'Failed to fetch quote' });
        }
    }

    static async createQuote(req: any, res: Response): Promise<void> {
        try {
            const { 
                pickupPostcode, 
                dropoffPostcode, 
                pickupAddress,
                dropoffAddress,
                pickupCoords,
                dropoffCoords,
                items, 
                flags, 
                businessId 
            } = req.body;

            const result = await CommercialService.requestQuote({
                pickupPostcode,
                dropoffPostcode,
                pickupAddress,
                dropoffAddress,
                pickupCoords,
                dropoffCoords,
                items,
                flags: flags || {},
                businessId: businessId || req.user?.id
            });
            res.json(result);
        } catch (error) {
            console.error('[QUOTE_CONTROLLER] Create Quote Error:', error);
            res.status(500).json({ error: 'Failed to create quote' });
        }
    }

    static async calculatePrice(req: Request, res: Response): Promise<void> {
        const { 
            pickupPostcode, 
            dropoffPostcode, 
            pickupCoords, 
            dropoffCoords,
            items, 
            flags 
        } = req.body;
        
        console.log(`[QUOTE_CONTROLLER] New UK-Wide Calculation: ${pickupPostcode} -> ${dropoffPostcode}`);

        try {
            if (!pickupPostcode || !dropoffPostcode || !items || !Array.isArray(items)) {
                res.status(400).json({ error: 'Missing required fields', error_code: 'MISSING_FIELDS' });
                return;
            }

            // 1. Resolve Street-Level Locations (Coords) if not provided
            let pickup = pickupCoords;
            let dropoff = dropoffCoords;

            if (!pickup || !dropoff) {
                const [pAddrs, dAddrs] = await Promise.all([
                    AddressService.findAddresses(pickupPostcode),
                    AddressService.findAddresses(dropoffPostcode)
                ]);
                if (!pickup) pickup = { lat: pAddrs[0].latitude, lng: pAddrs[0].longitude };
                if (!dropoff) dropoff = { lat: dAddrs[0].latitude, lng: dAddrs[0].longitude };
            }

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

    static async updateQuoteStatus(req: Request, res: Response): Promise<void> {
        try {
            const { status } = req.body;
            const quote = await prisma.quoteRequest.update({
                where: { id: req.params.id as string },
                data: { status }
            });
            res.json(quote);
        } catch (error) {
            res.status(500).json({ error: 'Failed to update quote status' });
        }
    }
}
