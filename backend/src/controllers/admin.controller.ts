import { Response } from 'express';
import { prisma } from '../index';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { isAdminRole } from '../utils/roles';

export const getDashboardOverview = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!isAdminRole(req.user?.role)) return res.status(403).json({ error: 'Forbidden' });

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
        if (!isAdminRole(req.user?.role)) return res.status(403).json({ error: 'Forbidden' });

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
        if (!isAdminRole(req.user?.role)) return res.status(403).json({ error: 'Forbidden' });

        const records = await (prisma as any).hRRecord.findMany({
            include: { user: { select: { firstName: true, lastName: true, email: true } } }
        });
        
        res.json(records);
    } catch (error) {
        console.error('Admin HR Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const adminUpdateCompliance = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!isAdminRole(req.user?.role)) return res.status(403).json({ error: 'Forbidden' });
        const id = req.params.id as string;
        const { status, adminNote } = req.body;

        const updated = await prisma.fleetVehicle.update({
            where: { id },
            data: { status, insuranceExpiry: req.body.insuranceExpiry } // Simple update for now
        });

        res.json({ message: 'Compliance record updated', record: updated });
    } catch (error) {
        console.error('Admin Update Compliance Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const adminUpdateHR = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!isAdminRole(req.user?.role)) return res.status(403).json({ error: 'Forbidden' });
        const id = req.params.id as string;
        const data = req.body;

        const updated = await (prisma as any).hRRecord.update({
            where: { id },
            data
        });

        res.json({ message: 'HR Record updated', record: updated });
    } catch (error) {
        console.error('Admin Update HR Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const adminUpdateUserStatus = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!isAdminRole(req.user?.role)) return res.status(403).json({ error: 'Forbidden' });
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
        if (!isAdminRole(req.user?.role)) return res.status(403).json({ error: 'Forbidden' });
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
        if (!isAdminRole(req.user?.role)) return res.status(403).json({ error: 'Forbidden' });
        
        const jobs = await prisma.job.findMany({
            include: {
                customer: { 
                    select: { 
                        firstName: true, 
                        lastName: true, 
                        email: true,
                        businessAccount: { select: { tradingName: true, companyName: true } }
                    } 
                },
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
        if (!isAdminRole(req.user?.role)) return res.status(403).json({ error: 'Forbidden' });

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

export const getBusinessesList = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!isAdminRole(req.user?.role)) return res.status(403).json({ error: 'Forbidden' });

        const businesses = await prisma.businessAccount.findMany({
            include: {
                users: { select: { firstName: true, lastName: true, email: true } },
                contract: true
            },
            orderBy: { companyName: 'asc' }
        });

        res.json(businesses);
    } catch (error) {
        console.error('Admin Businesses List Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const adminCreateJob = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!isAdminRole(req.user?.role)) return res.status(403).json({ error: 'Forbidden' });
        const payload = req.body;
        const { businessId, ...rest } = payload;

        const { CommercialService } = require('../services/commercial.service');
        const pLat = Number(rest.pickupLatitude ?? rest.pickupCoords?.lat);
        const pLng = Number(rest.pickupLongitude ?? rest.pickupCoords?.lng);
        const dLat = Number(rest.dropoffLatitude ?? rest.dropoffCoords?.lat);
        const dLng = Number(rest.dropoffLongitude ?? rest.dropoffCoords?.lng);
        const hasPickupCoords = Number.isFinite(pLat) && Number.isFinite(pLng) && (pLat !== 0 || pLng !== 0);
        const hasDropoffCoords = Number.isFinite(dLat) && Number.isFinite(dLng) && (dLat !== 0 || dLng !== 0);
        const jobItems = rest.items || [{ quantity: 1, weightKg: 10, lengthCm: 30, widthCm: 30, heightCm: 30 }];
        
        const quoteResult = await CommercialService.requestQuote({
            ...rest,
            items: jobItems,
            pickupAddress: {
                line1: rest.pickupAddressLine1,
                line2: rest.pickupAddressLine2,
                townCity: rest.pickupCity,
                county: rest.pickupCounty,
                formatted: `${rest.pickupAddressLine1 || ''}, ${rest.pickupCity || ''}, ${rest.pickupPostcode || ''}`,
            },
            dropoffAddress: {
                line1: rest.dropoffAddressLine1,
                line2: rest.dropoffAddressLine2,
                townCity: rest.dropoffCity,
                county: rest.dropoffCounty,
                formatted: `${rest.dropoffAddressLine1 || ''}, ${rest.dropoffCity || ''}, ${rest.dropoffPostcode || ''}`,
            },
            pickupCoords: hasPickupCoords ? { lat: pLat, lng: pLng } : undefined,
            dropoffCoords: hasDropoffCoords ? { lat: dLat, lng: dLng } : undefined,
            businessId,
            vehicleType: rest.vehicleType,
            flags: { 
                isReturnTrip: rest.isReturnTrip,
                extraStops: rest.extraStops,
                serviceLevel: rest.priority === 'URGENT' ? 'SAME_DAY' : 'STANDARD'
            }
        });

        if (!quoteResult.approved) {
            return res.status(422).json({ error: quoteResult.message });
        }

        const {
            items,
            pickupCoords,
            dropoffCoords,
            distanceMilesOverride,
            distanceKm,
            isReturnTrip,
            extraStops,
            ...jobFields
        } = rest;

        const { jobNumber, trackingNumber } = await prisma.$transaction(async (tx) => {
            const counter = await tx.jobCounter.upsert({
                where: { id: 1 },
                update: { current: { increment: 1 } },
                create: { id: 1, current: 1 }
            });
            const num = `CYV-ADM-${String(counter.current).padStart(6, '0')}`;
            return { jobNumber: num, trackingNumber: num.replace('CYV-ADM-', 'CYV-TRK-A-') };
        });

        const newJob = await prisma.job.create({
            data: {
                ...jobFields,
                businessAccountId: businessId,
                jobNumber,
                trackingNumber,
                status: 'ASSIGNED',
                paymentStatus: 'CONTRACT_INVOICE',
                calculatedPrice: quoteResult.quote.customerTotal,
                distanceKm: quoteResult.metrics?.distanceMiles
                    ? Number((quoteResult.metrics.distanceMiles * 1.60934).toFixed(2))
                    : undefined,
                quoteRequestId: quoteResult.quote.id,
                parcels: {
                    create: (items || jobItems).map((item: any) => ({
                        weightKg: parseFloat(item.weightKg || 0),
                        lengthCm: parseFloat(item.lengthCm || 0),
                        widthCm: parseFloat(item.widthCm || 0),
                        heightCm: parseFloat(item.heightCm || 0),
                        quantity: parseInt(item.quantity || 1, 10),
                        description: item.description || null,
                    })),
                }
            }
        });

        res.status(201).json(newJob);
    } catch (error) {
        console.error('Admin Create Job Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const adminUpdateBusiness = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!isAdminRole(req.user?.role)) return res.status(403).json({ error: 'Forbidden' });
        const id = req.params.id as string;
        const data = req.body;

        const updated = await prisma.businessAccount.update({
            where: { id },
            data,
            include: { contract: true }
        });

        res.json({ message: 'Business account updated', business: updated });
    } catch (error) {
        console.error('Admin Update Business Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
