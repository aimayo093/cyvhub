import { Response } from 'express';
import { prisma } from '../index';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const getHRRecord = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const hrRecord = await (prisma as any).hRRecord.findUnique({
            where: { userId }
        });

        if (!hrRecord) {
            return res.status(404).json({ error: 'HR Record not found' });
        }

        res.json(hrRecord);
    } catch (error) {
        console.error('Get HR Record Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const upsertHRRecord = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const {
            nationalInsurance,
            taxCode,
            bankAccountName,
            bankAccountNumber,
            bankSortCode,
            employmentType
        } = req.body;

        const hrRecord = await (prisma as any).hRRecord.upsert({
            where: { userId },
            create: {
                userId,
                nationalInsurance,
                taxCode: taxCode || '1257L',
                bankAccountName,
                bankAccountNumber,
                bankSortCode,
                employmentType: employmentType || 'CONTRACTOR',
            },
            update: {
                nationalInsurance,
                taxCode,
                bankAccountName,
                bankAccountNumber,
                bankSortCode,
                employmentType,
            }
        });

        res.json({ message: 'HR Record updated successfully', hrRecord });
    } catch (error) {
        console.error('Upsert HR Record Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const requestTimeOff = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { type, startDate, endDate, reason } = req.body;

        if (!type || !startDate || !endDate) {
            return res.status(400).json({ error: 'Missing required fields: type, startDate, endDate' });
        }

        const timeOffRequest = await (prisma as any).timeOffRequest.create({
            data: {
                userId,
                type,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                reason,
                status: 'PENDING'
            }
        });

        res.status(201).json({ message: 'Time off requested successfully', timeOffRequest });
    } catch (error) {
        console.error('Request Time Off Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getTimeOffRequests = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const requests = await (prisma as any).timeOffRequest.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });

        res.json(requests);
    } catch (error) {
        console.error('Get Time Off Requests Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
