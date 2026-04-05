import { Request, Response } from 'express';
import { prisma } from '../index';
import { calculateMiles } from '../utils/distance';
import { PricingService } from '../services/pricing.service';
import { SuitabilityService } from '../services/suitability.service';
import { normalizeVehicleType } from '../utils/vehicleMapping';

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
        const { pickupPostcode, dropoffPostcode, items } = req.body;
        console.log(`[QUOTE_CONTROLLER] New request: ${pickupPostcode} -> ${dropoffPostcode}, items: ${items?.length}`);

        try {
            if (!pickupPostcode || !dropoffPostcode || !items || !Array.isArray(items)) {
                res.status(400).json({ 
                    error: 'Missing required fields: pickupPostcode, dropoffPostcode, items[]',
                    error_code: 'MISSING_FIELDS'
                });
                return;
            }

            // 1. Calculate Distance
            let miles = 0;
            try {
                miles = await calculateMiles(pickupPostcode, dropoffPostcode);
                console.log(`[QUOTE_CONTROLLER] Distance calculated: ${miles} miles`);
            } catch (distError) {
                console.error(`[QUOTE_CONTROLLER] Distance calculation failed for ${pickupPostcode} to ${dropoffPostcode}:`, distError);
                // We continue with fallback logic if distError is non-fatal, 
                // but if calculateMiles throws, it might hit the outer catch.
                throw distError; 
            }

            // 2. Calculate Chargeable Weight
            const { actualWeightKg, volumetricWeightKg, chargeableWeightKg } = PricingService.calculateChargeableWeight(items);
            console.log(`[QUOTE_CONTROLLER] Weights - Actual: ${actualWeightKg}kg, Vol: ${volumetricWeightKg}kg, Chargeable: ${chargeableWeightKg}kg`);

            // 3. Find Suitable Vehicles
            const { available, rejected } = await SuitabilityService.findSuitableVehicles(items, actualWeightKg, volumetricWeightKg);
            console.log(`[QUOTE_CONTROLLER] Availability - Suitable: ${available.length}, Rejected: ${rejected.length}`);

            // 4. Generate quotes for each available vehicle
            const totalQuantity = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
            const quotes = [];
            
            for (const vc of available) {
                try {
                    const pricing = await PricingService.generateCustomerQuote(vc.id, miles, chargeableWeightKg, req.body.flags || {}, totalQuantity);
                    quotes.push({
                        vehicleId: vc.id,
                        vehicleName: vc.name,
                        distanceMiles: miles,
                        chargeableWeightKg,
                        quantity: totalQuantity,
                        originalPerParcelExVat: pricing.originalPerParcelExVat,
                        discountApplied: pricing.discountApplied,
                        totalExVat: pricing.customerTotal,
                        totalIncVat: Number((pricing.customerTotal * 1.20).toFixed(2)),
                        lineItems: pricing.lineItems,
                        requiresReview: pricing.requiresReview,
                        dimensions: `${vc.maxLengthCm / 100} x ${vc.maxWidthCm / 100} x ${vc.maxHeightCm / 100}m`,
                        maxWeight: `${vc.maxWeightKg}kg`
                    });
                } catch (pricingError) {
                    console.error(`[QUOTE_CONTROLLER] Pricing generation failed for vehicle ${vc.name}:`, pricingError);
                    // We don't fail the whole request if one vehicle fails pricing
                }
            }

            // 5. Build response
            let finalErrorCode = null;
            let finalErrorMessage = null;

            if (quotes.length === 0) {
                if (rejected.length > 0) {
                    finalErrorCode = 'NO_SUITABLE_VEHICLE';
                    finalErrorMessage = `We couldn't find a vehicle that fits your items. Common reasons: ${rejected[0].message}`;
                } else if (!available || available.length === 0) {
                    finalErrorCode = 'SYSTEM_CONFIGURATION_ERROR';
                    finalErrorMessage = 'Our pricing engine is currently undergoing maintenance for this vehicle type.';
                }
            }

            res.json({
                pickupPostcode,
                dropoffPostcode,
                distanceMiles: miles,
                actualWeightKg,
                volumetricWeightKg,
                chargeableWeightKg,
                quotes,
                rejectedVehicles: rejected,
                error: finalErrorMessage,
                error_code: finalErrorCode
            });
        } catch (error: any) {
            console.error('[QUOTE_CONTROLLER] Calculation Error:', error.message);
            
            // Handle known distance service errors as 400
            if (error.message.includes('postcodes could not be found')) {
                res.status(400).json({
                    error: error.message,
                    error_code: 'INVALID_POSTCODE'
                });
                return;
            }

            res.status(500).json({ 
                error: 'We encountered an error while calculating your quote.',
                error_code: 'CALCULATION_FATAL',
                details: error.message
            });
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
                quantity,
                basePrice,
                bulkDiscount,
            } = req.body;

            if (!quoteNumber || !customerId || !pickupPostcode || !dropoffPostcode || !vehicleType || !distanceKm || !estimatedCost) {
                res.status(400).json({
                    error: 'Missing required quote fields: quoteNumber, customerId, pickupPostcode, dropoffPostcode, vehicleType, distanceKm, estimatedCost.'
                });
                return;
            }

            const normalizedVehicleType = normalizeVehicleType(vehicleType);

            const quote = await prisma.quote.create({
                data: {
                    quoteNumber,
                    customerId,
                    businessId: businessId || undefined,
                    pickupPostcode,
                    dropoffPostcode,
                    vehicleType: normalizedVehicleType,
                    distanceKm: parseFloat(distanceKm),
                    estimatedCost: parseFloat(estimatedCost),
                    quantity: quantity ? parseInt(quantity, 10) : 1,
                    basePrice: basePrice ? parseFloat(basePrice) : null,
                    bulkDiscount: bulkDiscount ? parseFloat(bulkDiscount) : 0,
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
