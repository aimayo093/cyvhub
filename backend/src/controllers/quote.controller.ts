import { Request, Response } from 'express';
import { prisma } from '../index';
import { PricingService } from '../services/pricing.service';
import { SuitabilityService } from '../services/suitability.service';
import { AddressService } from '../services/address.service';
import { RoutingService } from '../services/routing.service';
import { normalizeVehicleType } from '../utils/vehicleMapping';
import { CommercialService } from '../services/commercial.service';
import { Logger } from '../utils/logger';

export class QuoteController {
    private static readonly logger = new Logger(QuoteController.name);

    static async getQuotes(req: any, res: Response): Promise<void> {
        try {
            const quotes = await prisma.quoteRequest.findMany({
                where: req.user?.role === 'admin' ? {} : { customerId: req.user?.userId },
                include: { vehicle: true, customer: true },
                orderBy: { createdAt: 'desc' }
            });
            res.json(quotes);
        } catch (error: any) {
            this.logger.error('[Fetch Quotes] Error:', error.stack);
            res.status(500).json({ error: 'Failed to fetch quotes', message: error.message });
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
            if (req.user?.role !== 'admin' && quote.customerId !== req.user?.userId) {
                res.status(403).json({ error: 'Forbidden. You do not own this quote.' });
                return;
            }
            res.json(quote);
        } catch (error: any) {
            this.logger.error(`[Fetch Quote] Error for ID ${req.params.id}:`, error.stack);
            res.status(500).json({ error: 'Failed to fetch quote', message: error.message });
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
            const userId = req.user?.userId;
            const user = userId
                ? await prisma.user.findUnique({ where: { id: userId }, select: { businessAccountId: true } })
                : null;
            const effectiveBusinessId = req.user?.role === 'admin'
                ? businessId
                : user?.businessAccountId;

            const result = await CommercialService.requestQuote({
                pickupPostcode,
                dropoffPostcode,
                pickupAddress,
                dropoffAddress,
                pickupCoords,
                dropoffCoords,
                items,
                flags: flags || {},
                businessId: effectiveBusinessId || undefined,
                customerId: userId
            });
            res.json(result);
        } catch (error: any) {
            this.logger.error('[Create Quote] Fatal Error:', error.stack);
            res.status(500).json({ error: 'Failed to create quote', message: error.message });
        }
    }

    static async calculatePrice(req: Request, res: Response): Promise<void> {
        const { pickupPostcode, dropoffPostcode, items, flags } = req.body;
        
        try {
            if (!pickupPostcode || !dropoffPostcode || !items || !Array.isArray(items)) {
                res.status(400).json({ success: false, error: 'Missing required fields' });
                return;
            }

            const miles = await RoutingService.calculateDistance(pickupPostcode, dropoffPostcode);
            const { actualWeightKg, volumetricWeightKg, chargeableWeightKg } = PricingService.calculateChargeableWeight(items);
            const { available, rejected } = await SuitabilityService.findSuitableVehicles(items, actualWeightKg, volumetricWeightKg);

            if (miles === null || available.length === 0) {
                res.json({
                    success: true,
                    canAutoPrice: false,
                    estimatedPrice: null,
                    distanceMiles: miles,
                    quotes: [],
                    rejectedVehicles: rejected
                });
                return;
            }

            const quotes = [];
            for (const vc of available) {
                try {
                    const pricing = await PricingService.generateCustomerQuote(vc.id, miles, chargeableWeightKg, { ...flags }, 1, req.body.businessId);
                    quotes.push({
                        vehicleId: vc.id,
                        vehicleName: vc.name,
                        totalExVat: pricing.customerTotal,
                        totalIncVat: pricing.totalIncVat,
                        vatAmount: pricing.vatAmount,
                        dimensions: `${vc.maxLengthCm / 100}m x ${vc.maxWidthCm / 100}m x ${vc.maxHeightCm / 100}m`,
                        maxWeight: `${vc.maxWeightKg}kg`
                    });
                } catch (e: any) {
                    this.logger.error(`Pricing failed: ${e.message}`);
                }
            }

            res.json({
                success: true,
                canAutoPrice: quotes.length > 0,
                estimatedPrice: quotes[0]?.totalExVat || null,
                distanceMiles: miles,
                quotes,
                rejectedVehicles: rejected,
                currency: 'GBP'
            });

        } catch (error: any) {
            this.logger.error('[Calculate Price] Fatal Error:', error.stack);
            res.json({ success: false, canAutoPrice: false, estimatedPrice: null, distanceMiles: null });
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
        } catch (error: any) {
            this.logger.error(`[Update Quote Status] Error for ID ${req.params.id}:`, error.stack);
            res.status(500).json({ error: 'Failed to update quote status', message: error.message });
        }
    }
}
