import { Router, Request, Response } from 'express';
import { ComplianceService } from '../services/compliance.service';
import { PayoutService } from '../services/payout.service';
import { DispatchEngineService } from '../services/dispatch.service';

const router = Router();

const authorizeCronRequest = (req: Request, res: Response): boolean => {
    const authHeader = req.headers.authorization;
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
        res.status(503).json({ error: 'Cron execution is not configured.' });
        return false;
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
        res.status(401).json({ error: 'Unauthorized Cron Execution' });
        return false;
    }

    return true;
};

/**
 * Endpoint triggered by Vercel Cron.
 * It is secured by requiring the CRON_SECRET environment variable.
 */
router.get('/compliance', async (req: Request, res: Response) => {
    try {
        if (!authorizeCronRequest(req, res)) return;

        const result = await ComplianceService.scanExpiries();
        res.json({ success: true, message: 'Compliance scan completed', result });
    } catch (error) {
        console.error('Compliance Cron Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * End-of-week cron endpoint to execute Stripe Connect marketplace payouts.
 */
router.get('/payouts', async (req: Request, res: Response) => {
    try {
        if (!authorizeCronRequest(req, res)) return;

        const result = await PayoutService.processWeeklyBatches();
        res.json({ success: true, message: 'Payout workflow completed', result });
    } catch (error) {
        console.error('Payout Cron Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Dispatch offer expiry sweeper — call every 30 seconds from Vercel Cron.
 * Marks timed-out PENDING offers as EXPIRED and advances the offer queue.
 */
router.get('/dispatch', async (req: Request, res: Response) => {
    try {
        if (!authorizeCronRequest(req, res)) return;

        const result = await DispatchEngineService.processExpiredOffers();
        res.json({ success: true, message: 'Dispatch expiry sweep completed', result });
    } catch (error) {
        console.error('Dispatch Cron Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
