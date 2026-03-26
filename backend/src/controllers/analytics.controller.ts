import { Request, Response } from 'express';
import { prisma } from '../index'; // B2-BUG-1: Use shared singleton — no extra connection pool

export const getPlatformAnalytics = async (req: Request, res: Response) => {
    try {
        // B2-BUG-2: Real DB queries replacing 100% hardcoded mock data

        // --- Job Volume (last 3 months) ---
        const now = new Date();
        const months: { label: string; start: Date; end: Date }[] = [];
        for (let i = 2; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({
                label: d.toLocaleString('en-GB', { month: 'short' }),
                start: new Date(d.getFullYear(), d.getMonth(), 1),
                end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999),
            });
        }

        const jobVolume = await Promise.all(months.map(async (m) => ({
            month: m.label,
            count: await prisma.job.count({ where: { createdAt: { gte: m.start, lte: m.end } } }),
        })));

        // --- SLA Compliance (average from all carrier profiles) ---
        const carrierProfiles = await prisma.carrierProfile.findMany({ select: { slaScore: true } });
        const avgSla = carrierProfiles.length > 0
            ? carrierProfiles.reduce((sum, c) => sum + c.slaScore, 0) / carrierProfiles.length
            : 100;

        // --- Total revenue from accounting ledger ---
        const revenueAgg = await prisma.accountingEntry.aggregate({
            where: { type: 'credit' },
            _sum: { amount: true },
        });

        // --- Real client list from DB ---
        const clients = await prisma.businessAccount.findMany({
            select: {
                id: true,
                tradingName: true,
                totalSpend: true,
                totalJobs: true,
                currentBalance: true,
                slaCompliance: true,
                industryProfile: true,
                status: true,
            },
            orderBy: { totalSpend: 'desc' },
            take: 10,
        });

        const stats = {
            slaComplianceRate: parseFloat(avgSla.toFixed(1)),
            totalRevenue: revenueAgg._sum.amount || 0,
        };

        const analytics = {
            jobVolume,
            slaCompliance: months.map((m, i) => ({ month: m.label, rate: jobVolume[i].count > 0 ? parseFloat(avgSla.toFixed(1)) : 100 })),
        };

        res.json({ stats, analytics, clients });
    } catch (error) {
        console.error('Error fetching platform analytics:', error);
        res.status(500).json({ error: 'Failed to fetch platform analytics' });
    }
};

export const getEarnings = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const role = (req as any).user?.role || 'driver';
        const period = req.query.period || 'week'; // 'week' | 'month'

        if (role === 'carrier') {
            // Real carrier earnings from DB
            const user = await prisma.user.findUnique({ where: { id: userId } });
            const carrierId = user?.carrierProfileId;

            const carrierJobs = await prisma.job.findMany({
                where: { assignedCarrierId: userId, status: 'COMPLETED' },
                select: { calculatedPrice: true, completedAt: true },
            });

            const totalRevenue = carrierJobs.reduce((sum, j) => sum + j.calculatedPrice, 0);
            const completedJobs = carrierJobs.length;
            const avgPerJob = completedJobs > 0 ? totalRevenue / completedJobs : 0;

            const settlementsRes = await prisma.settlementBatch.findMany({
                where: { recipientId: userId, status: 'PAID' },
                select: { netAmount: true },
            });
            const paidOut = settlementsRes.reduce((sum, s) => sum + s.netAmount, 0);

            return res.json({
                role: 'carrier',
                data: {
                    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
                    paidOut: parseFloat(paidOut.toFixed(2)),
                    pendingPayment: parseFloat((totalRevenue - paidOut).toFixed(2)),
                    completedJobs,
                    avgPerJob: parseFloat(avgPerJob.toFixed(2)),
                }
            });
        } else {
            // Real driver earnings from DB
            const now = new Date();
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            weekStart.setHours(0, 0, 0, 0);

            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

            const since = period === 'week' ? weekStart : monthStart;

            const driverJobs = await prisma.job.findMany({
                where: {
                    assignedDriverId: userId,
                    status: 'COMPLETED',
                    completedAt: { gte: since },
                },
                select: { calculatedPrice: true, completedAt: true },
            });

            const grossPay = driverJobs.reduce((sum, j) => sum + (j.calculatedPrice * 0.8), 0);
            const deductions = grossPay * 0.085; // NI + platform fee
            const netPay = grossPay - deductions;

            const summary = {
                netPay: parseFloat(netPay.toFixed(2)),
                grossPay: parseFloat(grossPay.toFixed(2)),
                deductions: parseFloat(deductions.toFixed(2)),
                jobsCompleted: driverJobs.length,
                hoursWorked: 0,   // Placeholder until time-tracking is implemented
                milesDriven: 0,   // Placeholder until route tracking is implemented
            };

            return res.json({ role: 'driver', data: { summary, weeklyEarnings: [] } });

        }
    } catch (error) {
        console.error('Error fetching earnings analytics:', error);
        res.status(500).json({ error: 'Failed to fetch earnings' });
    }
};
