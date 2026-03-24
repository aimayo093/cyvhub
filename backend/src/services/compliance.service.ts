import { prisma } from '../index';
import { NotificationService } from '../utils/notification.service';

export class ComplianceService {
    /**
     * Daily scan for expiring MOTs, Insurances, and Operator Licences.
     * Updates data states and triggers warning notifications to Carriers and Admins.
     */
    static async scanExpiries() {
        const now = new Date();
        const in30Days = new Date();
        in30Days.setDate(now.getDate() + 30);
        
        const in7Days = new Date();
        in7Days.setDate(now.getDate() + 7);

        // Fetch admins for oversight notification
        const admins = await prisma.user.findMany({
            where: { role: 'admin' },
            select: { email: true }
        });
        const adminEmails = admins.map(a => a.email).filter(Boolean) as string[];
        
        const notifyAdmins = (subject: string, html: string) => {
            adminEmails.forEach(email => {
                NotificationService.sendEmail(email, subject, html).catch(e => console.error("Admin notif failed", e));
            });
        };

        // 1. SUSPEND EXPIRED VEHICLES
        const expiredVehicles = await prisma.fleetVehicle.findMany({
            where: {
                OR: [
                    { motExpiry: { lt: now } },
                    { insuranceExpiry: { lt: now } }
                ],
                status: 'ACTIVE' // Only grab active ones so we don't spam repeatedly
            },
            include: { carrier: true }
        });

        for (const vehicle of expiredVehicles) {
            await prisma.fleetVehicle.update({
                where: { id: vehicle.id },
                data: { status: 'OFFLINE' }
            });
            await prisma.carrierProfile.update({
                where: { id: vehicle.carrierId },
                data: { status: 'SUSPENDED' }
            });

            const msg = `Vehicle ${vehicle.registration} has EXPIRED compliance documents. The account is suspended.`;
            if (vehicle.carrier.email) {
                NotificationService.sendEmail(vehicle.carrier.email, 'URGENT: Fleet Suspended Due to Expired Compliance', `<p>${msg}</p>`).catch(console.error);
            }
            notifyAdmins(`[Admin] Fleet Suspended: ${vehicle.carrier.companyName}`, `<p>${msg}</p>`);
        }

        // 2. 7-DAY WARNINGS
        const warning7Days = await prisma.fleetVehicle.findMany({
            where: {
                OR: [
                    { motExpiry: { gte: now, lte: in7Days } },
                    { insuranceExpiry: { gte: now, lte: in7Days } }
                ],
                status: 'ACTIVE'
            },
            include: { carrier: true }
        });

        for (const vehicle of warning7Days) {
            const msg = `CRITICAL WARNING: Vehicle ${vehicle.registration} compliance expires in less than 7 days! Immediate action required to avoid suspension.`;
            if (vehicle.carrier.email) {
                NotificationService.sendEmail(vehicle.carrier.email, 'Warning: Compliance Expiring in 7 Days', `<p>${msg}</p>`).catch(console.error);
            }
            notifyAdmins(`[Admin] 7-Day Expiry Warning: ${vehicle.carrier.companyName}`, `<p>${msg}</p>`);
        }

        // 3. 30-DAY HEADS UP
        const warning30Days = await prisma.fleetVehicle.findMany({
            where: {
                OR: [
                    // Find ones expiring between 29 and 30 days to only warn once automatically
                    { motExpiry: { gt: new Date(in30Days.getTime() - 86400000), lte: in30Days } },
                    { insuranceExpiry: { gt: new Date(in30Days.getTime() - 86400000), lte: in30Days } }
                ],
                status: 'ACTIVE'
            },
            include: { carrier: true }
        });

        for (const vehicle of warning30Days) {
            const msg = `Heads up: Vehicle ${vehicle.registration} compliance will expire in 30 days. Please arrange renewals.`;
            if (vehicle.carrier.email) {
                NotificationService.sendEmail(vehicle.carrier.email, 'Notice: Compliance Expiring in 30 Days', `<p>${msg}</p>`).catch(console.error);
            }
            notifyAdmins(`[Admin] 30-Day Expiry Notice: ${vehicle.carrier.companyName}`, `<p>${msg}</p>`);
        }

        return { 
            suspendedVehiclesCount: expiredVehicles.length,
            warnings7DayCount: warning7Days.length,
            warnings30DayCount: warning30Days.length
        };
    }

    /**
     * Checks if a user or their carrier fleet is legally allowed to accept a dispatch job.
     */
    static async isEligibleForDispatch(userId: string, role: string): Promise<boolean> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { carrierProfile: true }
        });

        if (!user) return false;
        
        // Strict universal user suspension check
        if (user.status === 'SUSPENDED') return false;

        // Carrier level compliance check
        if (role === 'carrier' || role === 'driver') {
            if (user.carrierProfile?.status === 'SUSPENDED') {
                return false;
            }
        }

        return true;
    }
}
