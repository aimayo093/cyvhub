import { Request, Response } from 'express';
import { prisma } from '../index';
import { calculateMiles } from '../utils/distance';
import { PricingService } from '../services/pricing.service';

export class QuoteController {
    // GET /api/quotes
    static async getQuotes(req: Request, res: Response): Promise<void> {
        try {
            const quotes = await prisma.quote.findMany({
                orderBy: { createdAt: 'desc' }
            });
            res.status(200).json({ quotes });
        } catch (error) {
            console.error('[QuoteController] Error fetching quotes:', error);
            res.status(500).json({ error: 'Failed to fetch quotes.' });
        }
    }

    // NEW: POST /api/quotes/calculate
    static async calculatePrice(req: Request, res: Response): Promise<void> {
        try {
            const { pickupPostcode, dropoffPostcode, items } = req.body;

            if (!pickupPostcode || !dropoffPostcode || !items || !Array.isArray(items)) {
                res.status(400).json({ error: 'Missing required fields: pickupPostcode, dropoffPostcode, items[]' });
                return;
            }

            // 1. Calculate Distance
            const miles = await calculateMiles(pickupPostcode, dropoffPostcode);

            // 2. Calculate Chargeable Weight
            const { actualWeightKg, volumetricWeightKg, chargeableWeightKg } = PricingService.calculateChargeableWeight(items);

            // 3. Get all active Vehicle Classes
            const vehicleClasses = await (prisma as any).vehicleClass.findMany({
                where: { isActive: true },
                include: { pricingRules: true }
            });

            // 4. Generate quotes for each vehicle
            const quotes = [];
            for (const vc of vehicleClasses) {
                // Check if items fit (LxWxH)
                const maxL = items.reduce((max, i) => Math.max(max, i.lengthCm), 0);
                const maxW = items.reduce((max, i) => Math.max(max, i.widthCm), 0);
                const maxH = items.reduce((max, i) => Math.max(max, i.heightCm), 0);

                const fits = maxL <= vc.maxLengthCm && maxW <= vc.maxWidthCm && maxH <= vc.maxHeightCm && actualWeightKg <= vc.maxWeightKg;

                if (fits) {
                    const pricing = await PricingService.generateCustomerQuote(vc.id, miles, chargeableWeightKg, req.body.flags || {});
                    quotes.push({
                        vehicleId: vc.id,
                        vehicleName: vc.name,
                        distanceMiles: miles,
                        chargeableWeightKg,
                        totalExVat: pricing.customerTotal,
                        totalIncVat: Number((pricing.customerTotal * 1.20).toFixed(2)),
                        lineItems: pricing.lineItems,
                        requiresReview: pricing.requiresReview,
                        dimensions: `${vc.maxLengthCm / 100} x ${vc.maxWidthCm / 100} x ${vc.maxHeightCm / 100}m`,
                        maxWeight: `${vc.maxWeightKg}kg`
                    });
                }
            }

            res.json({
                pickupPostcode,
                dropoffPostcode,
                distanceMiles: miles,
                chargeableWeightKg,
                quotes
            });
        } catch (error) {
            console.error('[QuoteController] Calculation Error:', error);
            res.status(500).json({ error: 'Internal server error during quote calculation.' });
        }
    }

    // POST /api/quotes
    static async createQuote(req: Request, res: Response): Promise<void> {
        try {
            // B2-SEC-6: Whitelist quote fields based on actual Prisma schema
            const {
                quoteNumber,
                customerId,
                businessId,
                pickupPostcode,
                dropoffPostcode,
                vehicleType,
                distanceKm,
                estimatedCost,
            } = req.body;

            if (!quoteNumber || !customerId || !pickupPostcode || !dropoffPostcode || !vehicleType || !distanceKm || !estimatedCost) {
                res.status(400).json({
                    error: 'Missing required quote fields: quoteNumber, customerId, pickupPostcode, dropoffPostcode, vehicleType, distanceKm, estimatedCost.'
                });
                return;
            }

            const quote = await prisma.quote.create({
                data: {
                    quoteNumber,
                    customerId,
                    businessId: businessId || undefined,
                    pickupPostcode,
                    dropoffPostcode,
                    vehicleType,
                    distanceKm: parseFloat(distanceKm),
                    estimatedCost: parseFloat(estimatedCost),
                    status: 'VALID',
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
                }
            });
            res.status(201).json({ quote });
        } catch (error) {
            console.error('[QuoteController] Error creating quote:', error);
            res.status(500).json({ error: 'Failed to create quote.' });
        }
    }
}
