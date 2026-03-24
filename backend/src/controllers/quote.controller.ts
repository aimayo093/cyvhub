import { Request, Response } from 'express';
import { prisma } from '../index';

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
