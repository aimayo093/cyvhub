import { prisma } from '../index';

export interface TrackingStep {
    status: string;
    label: string;
    description: string;
    timestamp: Date | string | null;
    isCompleted: boolean;
    isCurrent: boolean;
}

export class TrackingService {
    /**
     * Resolves the full tracking timeline for a given job.
     */
    static async getTrackingTimeline(jobId: string): Promise<TrackingStep[]> {
        const job = await prisma.job.findUnique({
            where: { id: jobId },
            include: { activityLogs: { orderBy: { timestamp: 'asc' } } }
        });

        if (!job) throw new Error('Job not found');

        const statusHierarchy = [
            { status: 'PENDING_PAYMENT', label: 'Booking Received', description: 'We have received your booking request.' },
            { status: 'PENDING_DISPATCH', label: 'Payment Confirmed', description: 'Payment received. Waiting for driver assignment.' },
            { status: 'ASSIGNED', label: 'Driver Assigned', description: 'A professional driver has been assigned to your job.' },
            { status: 'PICKED_UP', label: 'Items Collected', description: 'Driver has collected the items from the pickup location.' },
            { status: 'IN_TRANSIT', label: 'In Transit', description: 'Your delivery is on the way to the destination.' },
            { status: 'DELIVERED', label: 'Delivered', description: 'Items have been successfully delivered.' },
            { status: 'COMPLETED', label: 'Job Completed', description: 'The delivery process is fully completed.' }
        ];

        const currentStatusIndex = statusHierarchy.findIndex(s => s.status === job.status);

        return statusHierarchy.map((step, index) => {
            // Find activity log for this status based on the "type" field
            const log = job.activityLogs.find((l: any) => l.type === `STATUS_UPDATE_${step.status}`);

            let timestamp = log?.timestamp || null;
            
            // Fallbacks for critical timestamps already on the Job model
            if (step.status === 'PENDING_PAYMENT') timestamp = job.createdAt;
            if (step.status === 'DELIVERED' || step.status === 'COMPLETED') timestamp = job.completedAt || timestamp;

            return {
                status: step.status,
                label: step.label,
                description: step.description,
                timestamp,
                isCompleted: index <= currentStatusIndex && job.status !== 'CANCELLED',
                isCurrent: index === currentStatusIndex && job.status !== 'CANCELLED'
            };
        });
    }

    /**
     * Records a status change in the activity log for tracking purposes.
     */
    static async logStatusChange(jobId: string, oldStatus: string, newStatus: string, userId?: string) {
        await prisma.activityLog.create({
            data: {
                type: `STATUS_UPDATE_${newStatus}`,
                title: 'Job Status Updated',
                message: `Job status changed from ${oldStatus} to ${newStatus}`,
                severity: 'info',
                jobId: jobId,
                userId: userId || null
            }
        });
    }
}
