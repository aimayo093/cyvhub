import { prisma } from '../index';
import { NotificationService } from '../utils/notification.service';

export class DispatchService {
    /**
     * Finds the nearest available drivers and notifies them of a new job.
     * This is the entry point for the automated dispatch engine.
     */
    static async dispatchJob(jobId: string) {
        try {
            const job = await prisma.job.findUnique({
                where: { id: jobId },
                include: { parcels: true, customer: true }
            });

            if (!job) {
                console.error(`[DispatchService] Job ${jobId} not found`);
                return;
            }

            if (job.status !== 'PENDING_DISPATCH') {
                console.log(`[DispatchService] Job ${job.jobNumber} is in status ${job.status}, skipping auto-dispatch.`);
                return;
            }

            // 1. Determine if it should go to a Driver or Carrier
            // Logic: If total weight > 500kg or explicitly HGV, target Carrier first.
            const totalWeight = job.parcels.reduce((sum, p) => sum + (p.weightKg * p.quantity), 0);
            const isLargeLoad = totalWeight > 500 || job.vehicleType === 'HGV';
            const targetRole = isLargeLoad ? 'carrier' : 'driver';

            // 2. Find eligible active users
            const candidates = await prisma.user.findMany({
                where: {
                    role: targetRole,
                    status: 'ACTIVE',
                }
            });

            console.log(`[DispatchService] Found ${candidates.length} potential ${targetRole}s for job ${job.jobNumber}`);

            // 3. Notify candidates
            const message = `CYVhub: New ${job.vehicleType} job available! ${job.pickupCity} -> ${job.dropoffCity}. Pay: £${job.calculatedPrice}. View in app to accept.`;
            
            for (const user of candidates) {
                if (user.phone) {
                    await NotificationService.sendSms(user.phone, message);
                }
                if (user.email) {
                    await NotificationService.sendEmail(
                        user.email, 
                        `New Job Available: ${job.jobNumber}`, 
                        `<p>${message}</p><p>Go to your dashboard to view full details and accept the job.</p>`
                    );
                }
            }

            // Create Activity Log
            await prisma.activityLog.create({
                data: {
                    type: 'dispatch_triggered',
                    title: 'Automated Dispatch Triggered',
                    message: `Notified ${candidates.length} ${targetRole}(s) for job ${job.jobNumber}`,
                    jobId: job.id,
                    severity: 'info'
                }
            });

            return { notifiedCount: candidates.length, targetRole };
        } catch (error) {
            console.error('[DispatchService] Dispatch Error:', error);
            throw error;
        }
    }
}
