import { Request, Response } from 'express';
import { prisma } from '../index';

export class ActivityController {

    static async getActivity(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;
            const role = (req as any).user?.role;

            let query = {};

            if (role === 'driver') {
                query = { userId };
            } else if (role === 'customer') {
                // For B2B customers, show their specific activity
                query = { userId };
            }

            const activity = await prisma.activityLog.findMany({
                where: query,
                orderBy: { timestamp: 'desc' },
                take: 50
            });

            res.status(200).json(activity);
        } catch (error) {
            console.error('[ActivityController] Error fetching activity:', error);
            res.status(500).json({ error: 'Failed to fetch activity' });
        }
    }
}
