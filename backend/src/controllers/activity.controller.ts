import { Response } from 'express';
import { prisma } from '../index';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

// Maps job statuses to human-readable activity event types
function jobStatusToActivity(status: string) {
    const map: Record<string, { type: string; title: string; severity: string }> = {
        ASSIGNED:              { type: 'job_assigned',       title: 'Job Assigned',            severity: 'info' },
        DRIVER_ACCEPTED:       { type: 'job_accepted',       title: 'Job Accepted',             severity: 'info' },
        DRIVER_REJECTED:       { type: 'job_rejected',       title: 'Job Rejected',            severity: 'warning' },
        EN_ROUTE_TO_PICKUP:    { type: 'job_started',        title: 'En Route to Pickup',      severity: 'info' },
        ARRIVED_PICKUP:        { type: 'arrived_pickup',     title: 'Arrived at Pickup',        severity: 'info' },
        PICKED_UP:             { type: 'job_picked_up',      title: 'Package Picked Up',        severity: 'info' },
        EN_ROUTE_TO_DROPOFF:   { type: 'job_in_transit',     title: 'In Transit to Dropoff',   severity: 'info' },
        ARRIVED_DROPOFF:       { type: 'arrived_dropoff',    title: 'Arrived at Dropoff',       severity: 'info' },
        DELIVERED:             { type: 'job_completed',      title: 'Delivery Completed',       severity: 'info' },
        COMPLETED:             { type: 'job_completed',      title: 'Job Completed',            severity: 'info' },
        CANCELLED:             { type: 'job_cancelled',      title: 'Job Cancelled',            severity: 'warning' },
        FAILED:                { type: 'job_failed',         title: 'Job Failed',               severity: 'danger' },
    };
    return map[status] || { type: 'job_update', title: `Status Updated: ${status}`, severity: 'info' };
}

export class ActivityController {

    static async getActivity(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            const role = req.user?.role;

            const activities: any[] = [];

            if (role === 'driver') {
                // 1. Fetch driver's jobs (both active and historical)
                const jobs = await prisma.job.findMany({
                    where: { assignedDriverId: userId },
                    orderBy: { updatedAt: 'desc' },
                    take: 50,
                    select: {
                        id: true,
                        jobNumber: true,
                        status: true,
                        pickupCity: true,
                        dropoffCity: true,
                        calculatedPrice: true,
                        createdAt: true,
                        updatedAt: true,
                    }
                });

                // Generate a synthetic activity entry per job
                for (const job of jobs) {
                    const ev = jobStatusToActivity(job.status);
                    activities.push({
                        id: `job-${job.id}-${job.status}`,
                        type: ev.type,
                        title: ev.title,
                        message: `Job ${job.jobNumber}: ${job.pickupCity} → ${job.dropoffCity}`,
                        severity: ev.severity,
                        jobId: job.id,
                        amount: job.calculatedPrice,
                        timestamp: job.updatedAt,
                        read: false,
                    });
                }

                // 2. Fetch settlement batches for payout events
                const settlements = await prisma.settlementBatch.findMany({
                    where: { recipientId: userId as string },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                });

                for (const s of settlements) {
                    activities.push({
                        id: `settlement-${s.id}`,
                        type: s.status === 'PAID' ? 'payout_received' : 'settlement_pending',
                        title: s.status === 'PAID' ? '💸 Payout Received' : '⏳ Settlement Pending',
                        message: `Payout of £${s.netAmount.toFixed(2)} ${s.status === 'PAID' ? 'transferred to your account.' : 'is pending approval.'}`,
                        severity: s.status === 'PAID' ? 'info' : 'warning',
                        amount: s.netAmount,
                        timestamp: s.createdAt,
                        read: false,
                    });
                }

                // 3. Fetch any compliance document events (last 5)
                const complianceDocs = await prisma.driverComplianceDocument.findMany({
                    where: { driverId: userId as string },
                    orderBy: { updatedAt: 'desc' },
                    take: 5,
                });

                for (const doc of complianceDocs) {
                    const title = doc.status === 'verified' ? '✅ Document Verified'
                                : doc.status === 'rejected' ? '❌ Document Rejected'
                                : '📎 Document Submitted';
                    activities.push({
                        id: `doc-${doc.id}`,
                        type: 'compliance_update',
                        title,
                        message: `${doc.documentType.replace(/_/g, ' ')} — ${title.replace(/[^a-zA-Z\s]/g, '').trim()}`,
                        severity: doc.status === 'rejected' ? 'danger' : 'info',
                        timestamp: doc.updatedAt,
                        read: false,
                    });
                }

            } else if (role === 'carrier') {
                const jobs = await prisma.job.findMany({
                    where: { assignedCarrierId: userId },
                    orderBy: { updatedAt: 'desc' },
                    take: 50,
                    select: {
                        id: true,
                        jobNumber: true,
                        status: true,
                        pickupCity: true,
                        dropoffCity: true,
                        calculatedPrice: true,
                        updatedAt: true,
                    }
                });

                for (const job of jobs) {
                    const ev = jobStatusToActivity(job.status);
                    activities.push({
                        id: `job-${job.id}-${job.status}`,
                        type: ev.type,
                        title: ev.title,
                        message: `Job ${job.jobNumber}: ${job.pickupCity} → ${job.dropoffCity}`,
                        severity: ev.severity,
                        jobId: job.id,
                        amount: job.calculatedPrice,
                        timestamp: job.updatedAt,
                        read: false,
                    });
                }

                const settlements = await prisma.settlementBatch.findMany({
                    where: { recipientId: userId as string },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                });

                for (const s of settlements) {
                    activities.push({
                        id: `settlement-${s.id}`,
                        type: s.status === 'PAID' ? 'payout_received' : 'settlement_pending',
                        title: s.status === 'PAID' ? '💸 Payout Received' : '⏳ Settlement Pending',
                        message: `Payout of £${s.netAmount.toFixed(2)} ${s.status === 'PAID' ? 'transferred to your account.' : 'is pending approval.'}`,
                        severity: s.status === 'PAID' ? 'info' : 'warning',
                        amount: s.netAmount,
                        timestamp: s.createdAt,
                        read: false,
                    });
                }

            } else {
                // admin / customer – return ActivityLog as before
                const logs = await prisma.activityLog.findMany({
                    where: role === 'customer' ? { userId: userId } : {},
                    orderBy: { timestamp: 'desc' },
                    take: 50
                });
                activities.push(...logs.map((l: any) => ({
                    ...l,
                    description: l.message,
                })));
            }

            // Sort by timestamp DESC and return top 50
            activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

            res.status(200).json(activities.slice(0, 50));
        } catch (error) {
            console.error('[ActivityController] Error fetching activity:', error);
            res.status(500).json({ error: 'Failed to fetch activity' });
        }
    }

    /**
     * GET /api/activity/driver - Driver-specific activity with pagination
     */
    static async getDriverActivity(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
            
            const jobs = await prisma.job.findMany({
                where: {
                    OR: [
                        { assignedDriverId: userId },
                        { assignedCarrierId: userId }
                    ]
                },
                orderBy: { updatedAt: 'desc' },
                take: 30,
                select: {
                    id: true, jobNumber: true, status: true,
                    pickupCity: true, dropoffCity: true,
                    calculatedPrice: true, updatedAt: true, createdAt: true,
                }
            });

            const activities = jobs.map(job => {
                const ev = jobStatusToActivity(job.status);
                return {
                    id: `job-${job.id}`,
                    type: ev.type,
                    title: ev.title,
                    message: `${job.pickupCity} → ${job.dropoffCity}`,
                    jobNumber: job.jobNumber,
                    severity: ev.severity,
                    amount: job.calculatedPrice,
                    timestamp: job.updatedAt,
                };
            });

            res.status(200).json({ activities });
        } catch (error) {
            console.error('[ActivityController] getDriverActivity error:', error);
            res.status(500).json({ error: 'Failed to load activity' });
        }
    }
}
