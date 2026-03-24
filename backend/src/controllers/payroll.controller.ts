import { Response } from 'express';
import { prisma } from '../index';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { PayrollService } from '../services/payroll.service';

export const generatePayslip = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { driverId, periodStart, periodEnd } = req.body;

        // SEC-ROLE: Only Admins or the Carrier managing the driver should generate payslips
        if (req.user?.role !== 'admin' && req.user?.role !== 'carrier') {
            return res.status(403).json({ error: 'Forbidden: Admins or Carriers only' });
        }

        if (!driverId || !periodStart || !periodEnd) {
            return res.status(400).json({ error: 'Missing driverId, periodStart, or periodEnd' });
        }

        const start = new Date(periodStart);
        const end = new Date(periodEnd);

        const payslip = await PayrollService.generatePayslip(driverId, start, end);
        res.status(201).json({ message: 'Payslip generated', payslip });
    } catch (error) {
        console.error('Generate Payslip Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getMyPayslips = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const payslips = await (prisma as any).payslip.findMany({
            where: { userId },
            orderBy: { periodStart: 'desc' }
        });

        res.json(payslips);
    } catch (error) {
        console.error('Get Payslips Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
