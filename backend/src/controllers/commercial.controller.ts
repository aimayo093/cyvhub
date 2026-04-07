import { Request, Response } from 'express';
import { CommercialService } from '../services/commercial.service';

export const generateQuote = async (req: Request, res: Response) => {
    try {
        const payload = req.body;
        
        if (!payload.distanceMiles || !Array.isArray(payload.items)) {
            return res.status(400).json({ error: 'Missing req parameters: distanceMiles and items array.' });
        }

        const result = await CommercialService.requestQuote({
            pickupPostcode: payload.pickupPostcode,
            dropoffPostcode: payload.dropoffPostcode,
            distanceMiles: payload.distanceMiles,
            items: payload.items,
            flags: payload.flags || {}
        });

        if (!result.approved) {
            return res.status(422).json(result);
        }

        res.status(200).json(result);
    } catch (error) {
        console.error('Commercial Quote Error:', error);
        res.status(500).json({ error: 'Internal commercial engine error.' });
    }
};

export const getPendingReviews = async (req: Request, res: Response) => {
    try {
        const { prisma } = require('../index');
        const jobs = await prisma.job.findMany({
            where: { status: 'PENDING_REVIEW' },
            include: { quoteRequest: { include: { lineItems: true } }, customer: true }
        });
        res.status(200).json(jobs);
    } catch (error) {
        console.error('Fetch Reviews Error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

export const approveReview = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { prisma } = require('../index');
        const job = await prisma.job.update({
            where: { id },
            data: { status: 'PENDING_DISPATCH' }
        });
        res.status(200).json(job);
    } catch (error) {
        console.error('Approve Review Error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};
