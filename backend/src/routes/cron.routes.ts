import { Router, Request, Response } from 'express';
import { ComplianceService } from '../services/compliance.service';

const router = Router();

/**
 * Endpoint triggered by Vercel Cron.
 * It is secured by requiring the CRON_SECRET environment variable.
 */
router.get('/compliance', async (req: Request, res: Response) => {
    try {
        // SEC-CRON: Vercel sends the cron secret in the Authorization header
        const authHeader = req.headers.authorization;
        const cronSecret = process.env.CRON_SECRET;

        // If a secret is configured in the environment, enforce it
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return res.status(401).json({ error: 'Unauthorized Cron Execution' });
        }

        const result = await ComplianceService.scanExpiries();
        res.json({ success: true, message: 'Compliance scan completed', result });
    } catch (error) {
        console.error('Compliance Cron Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
