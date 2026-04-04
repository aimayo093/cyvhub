import { Response } from 'express';
import { prisma } from '../index';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { NotificationService } from '../utils/notification.service';

export const getJobs = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const userRole = req.user?.role;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        let jobs;

        if (userRole === 'driver') {
            // Drivers see jobs assigned to them OR jobs available for pickup
            jobs = await prisma.job.findMany({
                where: {
                    OR: [
                        { assignedDriverId: userId },
                        { status: 'PENDING_DISPATCH' }
                    ]
                },
                include: { quoteRequest: { include: { lineItems: true } } }
            });
        } else if (userRole === 'carrier') {
            // Carriers see jobs assigned to their fleet OR available for pickup
            jobs = await prisma.job.findMany({
                where: {
                    OR: [
                        { assignedCarrierId: userId },
                        { status: 'PENDING_DISPATCH' }
                    ]
                },
                include: { quoteRequest: { include: { lineItems: true } } }
            });
        } else if (userRole === 'customer') {
            // Customers see deliveries they requested
            jobs = await prisma.job.findMany({
                where: { customerId: userId },
                include: { quoteRequest: { include: { lineItems: true } } }
            });
        } else if (userRole === 'admin') {
            // Admins see everything
            jobs = await prisma.job.findMany({
                include: { quoteRequest: { include: { lineItems: true } } }
            });
        } else {
            return res.status(403).json({ error: 'Forbidden' });
        }

        res.json({ jobs });
    } catch (error) {
        console.error('Get Jobs Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateJobStatus = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const jobId = req.params.id as string;
        const { status, podUrl, signatureUrl, receiverName } = req.body;
        const userId = req.user?.userId;
        const role = req.user?.role;

        const job = await prisma.job.findUnique({ where: { id: jobId } });
        if (!job) return res.status(404).json({ error: 'Job not found' });

        // IDOR Protection: Drivers can only update their own jobs, UNLESS accepting a new job
        if (role === 'driver' && job.assignedDriverId !== userId) {
            if (!(job.status === 'PENDING_DISPATCH' && status === 'ASSIGNED')) {
                return res.status(403).json({ error: 'Forbidden: You cannot update a job not assigned to you' });
            }
        }

        // Carriers can only update jobs assigned to their fleet, UNLESS accepting a new job
        if (role === 'carrier' && job.assignedCarrierId !== userId) {
            if (!(job.status === 'PENDING_DISPATCH' && status === 'ASSIGNED')) {
                return res.status(403).json({ error: 'Forbidden: Job not assigned to your fleet' });
            }
        }

        // Customers cannot update Job statuses explicitly
        if (role === 'customer') {
            return res.status(403).json({ error: 'Forbidden: Customers cannot update job status' });
        }

        const dataToUpdate: any = {
            status,
            completedAt: (status === 'DELIVERED' || status === 'COMPLETED') ? new Date() : undefined,
            podUrl: podUrl || job.podUrl,
            signatureUrl: signatureUrl || job.signatureUrl,
            receiverName: receiverName || job.receiverName
        };

        // If a driver or carrier just accepted it, assign ownership
        if (job.status === 'PENDING_DISPATCH' && status === 'ASSIGNED') {
            // SEC-COMPLIANCE: Verify fleet/driver is currently allowed to operate
            const { ComplianceService } = require('../services/compliance.service');
            const isEligible = await ComplianceService.isEligibleForDispatch(userId, role);
            
            if (!isEligible) {
                return res.status(403).json({ error: 'Compliance Error: You or your fleet are currently suspended and cannot accept new jobs. Please update your compliance documents.' });
            }

            if (role === 'driver') dataToUpdate.assignedDriverId = userId;
            if (role === 'carrier') dataToUpdate.assignedCarrierId = userId;
        }

        // If a driver or carrier declined/failed it, release ownership
        if (status === 'PENDING_DISPATCH' && (job.assignedDriverId === userId || job.assignedCarrierId === userId)) {
             dataToUpdate.assignedDriverId = null;
             dataToUpdate.assignedCarrierId = null;
        }

        const updatedJob = await prisma.job.update({
            where: { id: jobId },
            data: dataToUpdate,
            include: {
                assignedDriver: true,
                assignedCarrier: true,
                quoteRequest: true
            }
        });

        // ==========================================
        // AUTOMATED SETTLEMENT BATCH LOGIC
        // ==========================================
        if (status === 'DELIVERED' || status === 'COMPLETED') {
            const recipient = updatedJob.assignedDriver || updatedJob.assignedCarrier;

            if (recipient) {
                const recipientType = updatedJob.assignedDriver ? 'driver' : 'carrier';
                const recipientName = updatedJob.assignedDriver
                    ? `${recipient.firstName} ${recipient.lastName}`
                    : (recipient as any).companyName || recipient.firstName;

                // Calculate driver/carrier cut using the precise Commercial Payout Engine computation
                const payoutAmount = updatedJob.quoteRequest ? updatedJob.quoteRequest.driverPayoutTotal : (updatedJob.calculatedPrice * 0.8);

                // Find an existing pending batch for this recipient
                const existingBatch = await prisma.settlementBatch.findFirst({
                    where: {
                        recipientId: recipient.id,
                        status: 'PENDING_APPROVAL'
                    }
                });

                if (existingBatch) {
                    // Append jobId to existing JSON array
                    let updatedJobIds = [];
                    try {
                        updatedJobIds = JSON.parse(existingBatch.jobIds || '[]');
                    } catch (e) {
                        updatedJobIds = [];
                    }
                    if (!updatedJobIds.includes(jobId)) {
                        updatedJobIds.push(jobId);

                        // Update existing batch
                        await prisma.settlementBatch.update({
                            where: { id: existingBatch.id },
                            data: {
                                jobsCount: existingBatch.jobsCount + 1,
                                jobIds: JSON.stringify(updatedJobIds),
                                grossAmount: existingBatch.grossAmount + payoutAmount,
                                netAmount: existingBatch.netAmount + payoutAmount,
                            }
                        });
                    }
                } else {
                    // Create new batch for the week
                    const now = new Date();
                    const periodStart = new Date(now);
                    periodStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
                    periodStart.setHours(0, 0, 0, 0);

                    const periodEnd = new Date(periodStart);
                    periodEnd.setDate(periodStart.getDate() + 6); // End of week (Saturday)
                    periodEnd.setHours(23, 59, 59, 999);

                    await prisma.settlementBatch.create({
                        data: {
                            recipientId: recipient.id,
                            recipientName: recipientName || 'Unknown',
                            recipientType,
                            status: 'PENDING_APPROVAL',
                            periodStart,
                            periodEnd,
                            jobIds: JSON.stringify([jobId]),
                            reference: `STL-${Date.now()}-${jobId.substring(0, 4)}`,
                            jobsCount: 1,
                            grossAmount: payoutAmount,
                            totalDeductions: 0,
                            netAmount: payoutAmount,
                            method: 'stripe'
                        }
                    });
                }
            }
        }

        // ==========================================
        // NOTIFICATIONS
        // ==========================================
        try {
            const settings = await NotificationService.getSettings();
            
            // Job Assigned => Notify Driver/Carrier
            if (status === 'ASSIGNED' && settings.notifyOnJobAssigned) {
                const assignee = updatedJob.assignedDriver || updatedJob.assignedCarrier;
                if (assignee) {
                    if (assignee.email) {
                        NotificationService.sendEmail(assignee.email, 'New Job Assigned', `<p>You have been assigned a new job: <b>${updatedJob.jobNumber}</b></p>`);
                    }
                    if (assignee.phone) {
                        NotificationService.sendSms(assignee.phone, `CYVhub: You have been assigned job ${updatedJob.jobNumber}`);
                    }
                }
            }

            // Job Delivered => Notify Customer
            if (status === 'COMPLETED' && settings.notifyOnJobDelivered && updatedJob.customerId) {
                const customer = await prisma.user.findUnique({ where: { id: updatedJob.customerId } });
                if (customer) {
                    if (customer.email) {
                        NotificationService.sendEmail(customer.email, 'Job Delivered', `<p>Your job <b>${updatedJob.jobNumber}</b> has been completed successfully.</p>`);
                    }
                    if (customer.phone) {
                        NotificationService.sendSms(customer.phone, `CYVhub: Your job ${updatedJob.jobNumber} has been completed.`);
                    }
                }
            }
        } catch (notifErr) {
            console.error('Failed to send notifications for job update:', notifErr);
        }

        res.json({ message: 'Job status updated', job: updatedJob });
    } catch (error) {
        console.error('Update Job Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
