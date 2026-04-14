import { prisma } from '../index';
import { NotificationService } from '../utils/notification.service';
import { ComplianceService } from './compliance.service';

// ─── Haversine Formula ───────────────────────────────────────────────────────
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const OFFER_TTL_SECONDS = 30;
const MAX_RADIUS_KM = 100; // Max search radius for local drivers

export class DispatchEngineService {
    /**
     * Main dispatch entry point. Sets job to SEARCHING and finds the first candidate.
     */
    static async dispatchJob(jobId: string): Promise<void> {
        try {
            const job = await prisma.job.findUnique({
                where: { id: jobId },
                include: { parcels: true },
            });

            if (!job) {
                console.error(`[DispatchEngine] Job ${jobId} not found`);
                return;
            }

            if (job.status !== 'PENDING_DISPATCH') {
                console.log(`[DispatchEngine] Job ${job.jobNumber} is ${job.status} — skipping.`);
                return;
            }

            // Mark job as searching
            await prisma.job.update({
                where: { id: jobId },
                data: { dispatchStatus: 'SEARCHING' },
            });

            await DispatchEngineService.findAndOfferNext(jobId);
        } catch (err) {
            console.error('[DispatchEngine] dispatchJob error:', err);
        }
    }

    /**
     * Finds the nearest eligible candidate and sends them an offer.
     */
    static async findAndOfferNext(jobId: string): Promise<void> {
        const job = await prisma.job.findUnique({
            where: { id: jobId },
            include: { parcels: true, dispatchAttempts: true },
        });

        if (!job) return;

        // Already accepted or cancelled
        if (['ACCEPTED', 'EXHAUSTED', 'ESCALATED'].includes(job.dispatchStatus)) return;

        const candidates = await DispatchEngineService.findRankedCandidates(job);

        // Filter out drivers who were already offered this job
        const triedDriverIds = new Set(job.dispatchAttempts.map((a: any) => a.driverId));
        const nextCandidates = candidates.filter((c: any) => !triedDriverIds.has(c.id));

        if (nextCandidates.length === 0) {
            await DispatchEngineService.escalateToAdmin(jobId);
            return;
        }

        const chosen = nextCandidates[0];
        await DispatchEngineService.sendOffer(jobId, chosen.id, chosen.distanceKm);
    }

    /**
     * Returns drivers/carriers sorted by proximity to the job pickup.
     */
    static async findRankedCandidates(job: any): Promise<any[]> {
        const totalWeight = (job.parcels || []).reduce(
            (sum: number, p: any) => sum + p.weightKg * Number(p.quantity || 1),
            0,
        );
        const isLargeLoad = totalWeight > 500 || job.vehicleType === 'HGV';

        // Determine target roles
        const roles = isLargeLoad ? ['carrier'] : ['driver', 'carrier'];

        const users = await prisma.user.findMany({
            where: {
                role: { in: roles },
                status: 'ACTIVE',
                onlineForDispatch: true,
            },
            select: {
                id: true,
                role: true,
                email: true,
                phone: true,
                firstName: true,
                lastKnownLat: true,
                lastKnownLng: true,
            },
        });

        // Distance rank + compliance filter
        const ranked: any[] = [];

        for (const user of users) {
            // Compliance check — non-blocking
            try {
                const eligible = await ComplianceService.isEligibleForDispatch(user.id, user.role);
                if (!eligible) continue;
            } catch {
                continue;
            }

            let distanceKm = 9999;
            if (user.lastKnownLat && user.lastKnownLng) {
                distanceKm = haversineKm(
                    job.pickupLatitude,
                    job.pickupLongitude,
                    user.lastKnownLat,
                    user.lastKnownLng,
                );
            }

            // Limit to MAX_RADIUS_KM for drivers; carriers have no hard cap
            if (user.role === 'driver' && distanceKm > MAX_RADIUS_KM) continue;

            ranked.push({ ...user, distanceKm });
        }

        // Sort: nearest first; drivers before carriers at same distance
        ranked.sort((a, b) => {
            if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
            if (a.role === 'driver' && b.role !== 'driver') return -1;
            return 1;
        });

        return ranked;
    }

    /**
     * Creates a DispatchAttempt and notifies the driver.
     */
    static async sendOffer(jobId: string, driverId: string, distanceKm: number): Promise<void> {
        const job = await prisma.job.findUnique({ where: { id: jobId } });
        if (!job) return;

        const offerExpiresAt = new Date(Date.now() + OFFER_TTL_SECONDS * 1000);

        const attempt = await prisma.dispatchAttempt.create({
            data: {
                jobId,
                driverId,
                status: 'PENDING',
                offerSentAt: new Date(),
                offerExpiresAt,
                attemptNumber: job.dispatchAttemptCount + 1,
                distanceKm,
            },
        });

        // Update job counters
        await prisma.job.update({
            where: { id: jobId },
            data: {
                dispatchStatus: 'OFFER_SENT',
                dispatchAttemptCount: { increment: 1 },
            },
        });

        // Notify driver
        const driver = await prisma.user.findUnique({ where: { id: driverId } });
        if (driver) {
            const payoutAmount = job.calculatedPrice * 0.8;
            const message = `CYVhub: New job offer! ${job.pickupCity} → ${job.dropoffCity} | £${payoutAmount.toFixed(2)} payout | ${distanceKm.toFixed(1)}km away. You have ${OFFER_TTL_SECONDS}s to respond in the app.`;

            if (driver.phone) {
                NotificationService.sendSms(driver.phone, message).catch(console.error);
            }
            if (driver.email) {
                NotificationService.sendEmail(
                    driver.email,
                    `New Job Offer: ${job.jobNumber}`,
                    `<p>${message}</p><p>Open the CYVhub Driver app to accept or decline.</p>`,
                ).catch(console.error);
            }
        }

        console.log(`[DispatchEngine] Offer ${attempt.id} sent to driver ${driverId} for job ${job.jobNumber}`);
    }

    /**
     * Called by cron — marks expired PENDING offers and moves to next candidate.
     */
    static async processExpiredOffers(): Promise<{ processed: number }> {
        const now = new Date();

        const expired = await prisma.dispatchAttempt.findMany({
            where: {
                status: 'PENDING',
                offerExpiresAt: { lte: now },
            },
            select: { id: true, jobId: true },
        });

        for (const attempt of expired) {
            await DispatchEngineService.handleTimeout(attempt.id);
        }

        return { processed: expired.length };
    }

    /**
     * Marks an offer as expired and kicks off the next candidate search.
     */
    static async handleTimeout(attemptId: string): Promise<void> {
        const attempt = await prisma.dispatchAttempt.findUnique({
            where: { id: attemptId },
        });

        if (!attempt || attempt.status !== 'PENDING') return;

        await prisma.dispatchAttempt.update({
            where: { id: attemptId },
            data: { status: 'EXPIRED', respondedAt: new Date() },
        });

        console.log(`[DispatchEngine] Offer ${attemptId} expired — trying next candidate`);
        await DispatchEngineService.findAndOfferNext(attempt.jobId);
    }

    /**
     * Driver accepts the offer.
     */
    static async acceptOffer(attemptId: string, userId: string): Promise<{ job: any }> {
        const attempt = await prisma.dispatchAttempt.findUnique({
            where: { id: attemptId },
            include: { job: true },
        });

        if (!attempt) throw new Error('Offer not found');
        if (attempt.driverId !== userId) throw new Error('Forbidden: offer not addressed to you');
        if (attempt.status !== 'PENDING') throw new Error(`Offer already ${attempt.status}`);
        if (attempt.offerExpiresAt < new Date()) throw new Error('Offer has expired');

        // Mark attempt accepted
        await prisma.dispatchAttempt.update({
            where: { id: attemptId },
            data: { status: 'ACCEPTED', respondedAt: new Date() },
        });

        // Cancel all other PENDING offers for this job
        await prisma.dispatchAttempt.updateMany({
            where: { jobId: attempt.jobId, status: 'PENDING', id: { not: attemptId } },
            data: { status: 'CANCELLED', respondedAt: new Date() },
        });

        // Determine driver vs carrier role
        const driver = await prisma.user.findUnique({ where: { id: userId } });
        const isCarrier = driver?.role === 'carrier';

        // Assign job + unlock tracking
        const updatedJob = await prisma.job.update({
            where: { id: attempt.jobId },
            data: {
                status: 'ASSIGNED',
                dispatchStatus: 'ACCEPTED',
                trackingUnlocked: true,
                assignedDriverId: isCarrier ? null : userId,
                assignedCarrierId: isCarrier ? userId : null,
            },
            include: { assignedDriver: true, assignedCarrier: true },
        });

        // Activity log
        await prisma.activityLog.create({
            data: {
                type: 'dispatch_accepted',
                title: 'Driver Accepted Job',
                message: `${driver?.firstName} accepted job ${updatedJob.jobNumber} (attempt #${attempt.attemptNumber})`,
                jobId: attempt.jobId,
                userId,
                severity: 'info',
            },
        });

        console.log(`[DispatchEngine] Job ${updatedJob.jobNumber} ACCEPTED by ${userId}`);
        return { job: updatedJob };
    }

    /**
     * Driver rejects the offer — moves to next candidate.
     */
    static async rejectOffer(attemptId: string, userId: string): Promise<void> {
        const attempt = await prisma.dispatchAttempt.findUnique({
            where: { id: attemptId },
        });

        if (!attempt) throw new Error('Offer not found');
        if (attempt.driverId !== userId) throw new Error('Forbidden');
        if (attempt.status !== 'PENDING') throw new Error(`Offer already ${attempt.status}`);

        await prisma.dispatchAttempt.update({
            where: { id: attemptId },
            data: { status: 'REJECTED', respondedAt: new Date() },
        });

        console.log(`[DispatchEngine] Offer ${attemptId} rejected by ${userId} — trying next`);
        await DispatchEngineService.findAndOfferNext(attempt.jobId);
    }

    /**
     * All candidates exhausted — escalate to admin.
     */
    static async escalateToAdmin(jobId: string): Promise<void> {
        const job = await prisma.job.update({
            where: { id: jobId },
            data: { dispatchStatus: 'ESCALATED' },
        });

        await prisma.activityLog.create({
            data: {
                type: 'dispatch_escalated',
                title: 'Dispatch Escalated',
                message: `No available driver/carrier found for job ${job.jobNumber} after ${job.dispatchAttemptCount} attempt(s). Manual assignment required.`,
                jobId,
                severity: 'urgent',
            },
        });

        console.warn(`[DispatchEngine] Job ${job.jobNumber} ESCALATED — all candidates exhausted`);
    }

    /**
     * Returns the pending offer for a driver (polling fallback).
     */
    static async getPendingOfferForDriver(driverId: string): Promise<any | null> {
        return prisma.dispatchAttempt.findFirst({
            where: {
                driverId,
                status: 'PENDING',
                offerExpiresAt: { gt: new Date() },
            },
            include: {
                job: {
                    select: {
                        id: true,
                        jobNumber: true,
                        pickupCity: true,
                        pickupPostcode: true,
                        pickupAddressLine1: true,
                        dropoffCity: true,
                        dropoffPostcode: true,
                        dropoffAddressLine1: true,
                        vehicleType: true,
                        calculatedPrice: true,
                        distanceKm: true,
                        priority: true,
                        pickupWindowStart: true,
                        pickupWindowEnd: true,
                        goodsDescription: true,
                    },
                },
            },
            orderBy: { offerSentAt: 'desc' },
        });
    }

    /**
     * Returns the dispatch queue for admin console.
     */
    static async getDispatchQueue(): Promise<any[]> {
        return prisma.job.findMany({
            where: {
                dispatchStatus: { in: ['SEARCHING', 'OFFER_SENT', 'ESCALATED'] },
            },
            include: {
                dispatchAttempts: {
                    include: { driver: { select: { firstName: true, lastName: true, role: true } } },
                    orderBy: { attemptNumber: 'asc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
}
