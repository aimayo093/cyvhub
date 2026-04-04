import { Response } from 'express';
import { prisma } from '../index';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const getDashboardOverview = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

        // System Wide Snapshots
        const activeJobsCount = await prisma.job.count({ where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } } });
        const totalCarriers = await prisma.carrierProfile.count();
        const nonCompliantVehicles = await prisma.fleetVehicle.count({ where: { status: { in: ['OFFLINE', 'MAINTENANCE'] } } });
        
        // HR Data
        const pendingTimeOffRequests = await (prisma as any).timeOffRequest.count({ where: { status: 'PENDING' } }).catch(() => 0);
        
        // Settlement Queue
        const pendingSettlements = await prisma.settlementBatch.count({ where: { status: 'PENDING_APPROVAL' } });

        res.json({
            metrics: {
                activeJobs: activeJobsCount,
                carriers: totalCarriers,
                nonCompliantVehicles,
                pendingTimeOffRequests,
                pendingSettlements
            }
        });
    } catch (error) {
        console.error('Admin Dashboard Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getComplianceList = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

        // Get detailed list of all vehicles to track MOT/Insurance from Admin dashboard
        const vehicles = await prisma.fleetVehicle.findMany({
            include: { carrier: true },
            orderBy: { insuranceExpiry: 'asc' }
        });

        res.json(vehicles);
    } catch (error) {
        console.error('Admin Compliance Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getHRList = async (req: AuthenticatedRequest, res: Response) => {
   try {
        if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

        const records = await (prisma as any).hRRecord.findMany({
            include: { user: { select: { firstName: true, lastName: true, email: true } } }
        });
        
        res.json(records);
    } catch (error) {
        console.error('Admin HR Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const adminUpdateUserStatus = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
        const id = req.params.id as string;
        const { status } = req.body;

        if (!['ACTIVE', 'SUSPENDED', 'DELETED'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { status }
        });

        res.json({ message: `User status updated to ${status}`, user: updatedUser });
    } catch (error) {
        console.error('Admin Update User Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const adminAssignJob = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
        const jobId = req.params.jobId as string;
        const { assigneeId, assigneeType } = req.body;

        if (!['driver', 'carrier'].includes(assigneeType)) {
            return res.status(400).json({ error: 'Invalid assigneeType. Must be driver or carrier.' });
        }

        const data: any = {
            status: 'ASSIGNED',
            assignedDriverId: assigneeType === 'driver' ? assigneeId : null,
            assignedCarrierId: assigneeType === 'carrier' ? assigneeId : null
        };

        const job = await prisma.job.update({
            where: { id: jobId },
            data,
            include: { 
                assignedDriver: true, 
                assignedCarrier: true 
            }
        });

        // Notify assignee
        const { NotificationService } = require('../utils/notification.service');
        const assignee = (job as any).assignedDriver || (job as any).assignedCarrier;
        if (assignee?.email) {
            await NotificationService.sendEmail(assignee.email, 'Job Force Assigned', `<p>An administrator has assigned job <b>${job.jobNumber}</b> to you.</p>`);
        }

        res.json({ message: 'Job successfully assigned', job });
    } catch (error) {
        console.error('Admin Assign Job Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const adminListJobs = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
        
        const jobs = await prisma.job.findMany({
            include: {
                customer: { select: { firstName: true, lastName: true, email: true } },
                assignedDriver: { select: { firstName: true, lastName: true } },
                assignedCarrier: { select: { carrierProfile: { select: { tradingName: true } } } },
                parcels: true,
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(jobs);
    } catch (error) {
        console.error('Admin Jobs List Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getUsersList = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

        const users = await prisma.user.findMany({
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                status: true,
                createdAt: true,
                carrierProfile: { select: { companyName: true } },
                businessAccount: { select: { companyName: true } },
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(users);
    } catch (error) {
        console.error('Admin Users List Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
