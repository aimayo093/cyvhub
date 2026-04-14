import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { DispatchEngineService } from '../services/dispatch.service';
import { prisma } from '../index';

// ─── Admin: Manually trigger dispatch for a job ─────────────────────────────
export const runDispatch = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const { jobId } = req.params;

        const job = await prisma.job.findUnique({ where: { id: jobId } });
        if (!job) return res.status(404).json({ error: 'Job not found' });

        // Allow re-triggering if SEARCHING or ESCALATED (force retry)
        if (!['PENDING_DISPATCH', 'IDLE', 'SEARCHING', 'ESCALATED', 'EXHAUSTED'].includes(job.dispatchStatus || 'IDLE')) {
            return res.status(400).json({ error: `Cannot dispatch job with status ${job.dispatchStatus}` });
        }

        // Reset dispatch status so engine starts fresh
        await prisma.job.update({
            where: { id: jobId },
            data: { dispatchStatus: 'IDLE', status: 'PENDING_DISPATCH' },
        });

        // Fire-and-forget — don't block the HTTP response
        DispatchEngineService.dispatchJob(jobId).catch(console.error);

        res.json({ message: `Dispatch triggered for job ${job.jobNumber}` });
    } catch (err) {
        console.error('runDispatch error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── Driver: Accept an offer ─────────────────────────────────────────────────
export const acceptOffer = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { attemptId } = req.params;
        const result = await DispatchEngineService.acceptOffer(attemptId, userId);

        res.json({ message: 'Job accepted successfully', job: result.job });
    } catch (err: any) {
        const status = err.message?.includes('not found') ? 404
            : err.message?.includes('Forbidden') ? 403
            : err.message?.includes('expired') ? 410
            : 400;
        res.status(status).json({ error: err.message || 'Failed to accept offer' });
    }
};

// ─── Driver: Reject an offer ─────────────────────────────────────────────────
export const rejectOffer = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { attemptId } = req.params;
        await DispatchEngineService.rejectOffer(attemptId, userId);

        res.json({ message: 'Offer declined' });
    } catch (err: any) {
        const status = err.message?.includes('not found') ? 404
            : err.message?.includes('Forbidden') ? 403
            : 400;
        res.status(status).json({ error: err.message || 'Failed to reject offer' });
    }
};

// ─── Driver: Poll for their pending offer ───────────────────────────────────
export const getPendingOffer = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const role = req.user?.role;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        if (!['driver', 'carrier'].includes(role || '')) {
            return res.status(403).json({ error: 'Only drivers/carriers can poll for offers' });
        }

        const offer = await DispatchEngineService.getPendingOfferForDriver(userId);

        if (!offer) {
            return res.json({ offer: null });
        }

        // Mask calculatedPrice — return only driverPayout
        const masked = {
            ...offer,
            job: offer.job ? {
                ...offer.job,
                payoutAmount: parseFloat((offer.job.calculatedPrice * 0.8).toFixed(2)),
                calculatedPrice: undefined,
            } : null,
        };

        res.json({ offer: masked });
    } catch (err) {
        console.error('getPendingOffer error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── Admin: Get dispatch queue ───────────────────────────────────────────────
export const getDispatchQueue = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

        const queue = await DispatchEngineService.getDispatchQueue();
        res.json({ queue });
    } catch (err) {
        console.error('getDispatchQueue error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── Driver: Toggle online/offline for dispatch ──────────────────────────────
export const updateAvailability = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const role = req.user?.role;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        if (!['driver', 'carrier'].includes(role || '')) {
            return res.status(403).json({ error: 'Only drivers/carriers can update availability' });
        }

        const { online } = req.body;
        if (typeof online !== 'boolean') {
            return res.status(400).json({ error: '`online` must be a boolean' });
        }

        await prisma.user.update({
            where: { id: userId },
            data: { onlineForDispatch: online },
        });

        res.json({ message: online ? 'You are now online for dispatch' : 'You are now offline', online });
    } catch (err) {
        console.error('updateAvailability error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// ─── Admin: Get online drivers ───────────────────────────────────────────────
export const getOnlineDrivers = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

        const drivers = await prisma.user.findMany({
            where: {
                role: { in: ['driver', 'carrier'] },
                onlineForDispatch: true,
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
                lastKnownLat: true,
                lastKnownLng: true,
            },
        });

        res.json({ drivers });
    } catch (err) {
        console.error('getOnlineDrivers error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
