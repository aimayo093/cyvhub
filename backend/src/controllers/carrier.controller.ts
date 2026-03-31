import { Request, Response } from 'express';
import { prisma } from '../index';

export class CarrierController {
    // GET /api/carriers
    static async getCarriers(req: Request, res: Response): Promise<void> {
        try {
            const carriers = await prisma.carrierProfile.findMany({
                include: {
                    vehicles: true,
                    complianceDocs: true
                }
            });
            res.status(200).json({ carriers });
        } catch (error) {
            console.error('[CarrierController] Error fetching carriers:', error);
            res.status(500).json({ error: 'Failed to fetch carriers.' });
        }
    }

    // GET /api/carriers/:id
    static async getCarrierById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const carrier = await prisma.carrierProfile.findUnique({
                where: { id: id as string },
                include: {
                    vehicles: true,
                    complianceDocs: true
                }
            });
            if (!carrier) {
                res.status(404).json({ error: 'Carrier not found' });
                return;
            }
            res.status(200).json({ carrier });
        } catch (error) {
            console.error('[CarrierController] Error fetching carrier by ID:', error);
            res.status(500).json({ error: 'Failed to fetch carrier details.' });
        }
    }

    // POST /api/carriers — Admin only (enforced in route)
    static async createCarrier(req: Request, res: Response): Promise<void> {
        try {
            // B2-SEC-1: Whitelist allowed fields — prevent mass-assignment
            const {
                companyName, tradingName, contactFirstName, contactLastName,
                email, phone, registrationNumber, vatNumber, insuranceExpiry,
                operatorLicence, operatorLicenceExpiry, coverageRegions, avatar,
            } = req.body;

            if (!companyName || !tradingName || !contactFirstName || !contactLastName ||
                !email || !phone || !registrationNumber || !insuranceExpiry ||
                !operatorLicence || !operatorLicenceExpiry) {
                res.status(400).json({ error: 'Missing required carrier fields.' });
                return;
            }

            const carrier = await prisma.carrierProfile.create({
                data: {
                    companyName,
                    tradingName,
                    contactFirstName,
                    contactLastName,
                    email,
                    phone,
                    avatar,
                    registrationNumber,
                    vatNumber,
                    insuranceExpiry: new Date(insuranceExpiry),
                    operatorLicence,
                    operatorLicenceExpiry: new Date(operatorLicenceExpiry),
                    coverageRegions: Array.isArray(coverageRegions)
                        ? JSON.stringify(coverageRegions)
                        : (coverageRegions || '[]'),
                }
            });
            res.status(201).json({ carrier });
        } catch (error) {
            console.error('[CarrierController] Error creating carrier:', error);
            res.status(500).json({ error: 'Failed to create carrier profile.' });
        }
    }

    // GET /api/carriers/my-profile
    static async getMyProfile(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;
            const user = await prisma.user.findUnique({ where: { id: userId }, include: { carrierProfile: true } });
            if (!user || !user.carrierProfileId) {
                res.status(404).json({ error: 'Carrier profile not linked.' });
                return;
            }
            const carrier = await prisma.carrierProfile.findUnique({
                where: { id: user.carrierProfileId },
                include: { vehicles: true, complianceDocs: true }
            });
            res.status(200).json({ data: carrier });
        } catch (error) {
            console.error('[CarrierController] Error fetching my profile:', error);
            res.status(500).json({ error: 'Failed to fetch profile' });
        }
    }

    // GET /api/carriers/my-fleet
    static async getMyFleet(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user || !user.carrierProfileId) {
                res.status(400).json({ data: [] });
                return;
            }
            const fleet = await prisma.fleetVehicle.findMany({
                where: { carrierId: user.carrierProfileId }
            });
            res.status(200).json({ data: fleet });
        } catch (error) {
            console.error('[CarrierController] Error fetching fleet:', error);
            res.status(500).json({ error: 'Failed to fetch fleet' });
        }
    }

    // POST /api/carriers/my-fleet
    static async addVehicle(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user || !user.carrierProfileId) {
                res.status(403).json({ error: 'Carrier profile not found' });
                return;
            }

            // B2-SEC-2: Whitelist fleet vehicle fields — prevent mass-assignment
            const { registration, type, make, model, year, capacity, motExpiry, insuranceExpiry, lastService } = req.body;

            if (!registration || !type || !make || !model || !year || !capacity || !motExpiry || !insuranceExpiry || !lastService) {
                res.status(400).json({ error: 'Missing required vehicle fields.' });
                return;
            }

            const vehicle = await prisma.fleetVehicle.create({
                data: {
                    registration,
                    type,
                    make,
                    model,
                    year: parseInt(year),
                    capacity,
                    motExpiry: new Date(motExpiry),
                    insuranceExpiry: new Date(insuranceExpiry),
                    lastService: new Date(lastService),
                    carrierId: user.carrierProfileId,
                }
            });
            res.status(201).json({ data: vehicle });
        } catch (error) {
            console.error('[CarrierController] Error creating vehicle:', error);
            res.status(500).json({ error: 'Failed to add vehicle' });
        }
    }

    // PATCH /api/carriers/my-fleet/:id
    static async updateVehicle(req: Request, res: Response): Promise<void> {
        try {
            const id = req.params.id as string;
            const userId = (req as any).user?.userId;
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user || !user.carrierProfileId) {
                res.status(403).json({ error: 'Carrier profile not found' });
                return;
            }
            const existing = await prisma.fleetVehicle.findUnique({ where: { id } });
            if (!existing || existing.carrierId !== user.carrierProfileId) {
                res.status(404).json({ error: 'Vehicle not found in your fleet' });
                return;
            }

            // B2-SEC-3: Whitelist updatable vehicle fields — prevent mass-assignment
            const { type, make, model, year, capacity, status, motExpiry, insuranceExpiry, lastService, currentDriverId } = req.body;

            const dataToUpdate: any = {};
            if (type !== undefined) dataToUpdate.type = type;
            if (make !== undefined) dataToUpdate.make = make;
            if (model !== undefined) dataToUpdate.model = model;
            if (year !== undefined) dataToUpdate.year = parseInt(year);
            if (capacity !== undefined) dataToUpdate.capacity = capacity;
            if (status !== undefined) dataToUpdate.status = status;
            if (motExpiry !== undefined) dataToUpdate.motExpiry = new Date(motExpiry);
            if (insuranceExpiry !== undefined) dataToUpdate.insuranceExpiry = new Date(insuranceExpiry);
            if (lastService !== undefined) dataToUpdate.lastService = new Date(lastService);
            if (currentDriverId !== undefined) dataToUpdate.currentDriverId = currentDriverId;

            const updated = await prisma.fleetVehicle.update({ where: { id }, data: dataToUpdate });
            res.status(200).json({ data: updated });
        } catch (error) {
            console.error('[CarrierController] Error updating vehicle:', error);
            res.status(500).json({ error: 'Failed to update vehicle' });
        }
    }

    // GET /api/carriers/my/drivers
    static async getMyDrivers(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user || !user.carrierProfileId) {
                res.status(400).json({ data: [] });
                return;
            }
            const drivers = await prisma.user.findMany({
                where: {
                    carrierProfileId: user.carrierProfileId,
                    role: 'driver'
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    status: true,
                    lastKnownLat: true,
                    lastKnownLng: true
                }
            });
            res.status(200).json({ data: drivers });
        } catch (error) {
            console.error('[CarrierController] Error fetching drivers:', error);
            res.status(500).json({ error: 'Failed to fetch drivers' });
        }
    }

    // GET /api/carriers/my/rates
    static async getMyRates(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user || !user.carrierProfileId) {
                res.status(400).json({ data: [] });
                return;
            }
            const rates = await prisma.carrierRate.findMany({
                where: { carrierId: user.carrierProfileId },
                orderBy: { createdAt: 'desc' }
            });
            res.status(200).json({ data: rates });
        } catch (error) {
            console.error('[CarrierController] Error fetching rates:', error);
            res.status(500).json({ error: 'Failed' });
        }
    }

    // POST /api/carriers/my/rates
    static async addRate(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user || !user.carrierProfileId) {
                res.status(403).json({ error: 'No profile' });
                return;
            }

            const { vehicleType, baseRate, perKmRate, perStopRate, weekendSurcharge, outOfHoursSurcharge, heavyGoodsSurcharge } = req.body;
            const rate = await prisma.carrierRate.create({
                data: {
                    carrierId: user.carrierProfileId,
                    vehicleType,
                    baseRate: parseFloat(baseRate),
                    perKmRate: parseFloat(perKmRate),
                    perStopRate: parseFloat(perStopRate || 0),
                    weekendSurcharge: parseFloat(weekendSurcharge || 0),
                    outOfHoursSurcharge: parseFloat(outOfHoursSurcharge || 0),
                    heavyGoodsSurcharge: parseFloat(heavyGoodsSurcharge || 0),
                    status: 'ACTIVE'
                }
            });
            res.status(201).json({ data: rate });
        } catch (error) {
            console.error('[CarrierController] Error submiitng rate:', error);
            res.status(500).json({ error: 'Failed' });
        }
    }

    // PATCH /api/carriers/my/rates/:id
    static async updateRate(req: Request, res: Response): Promise<void> {
        try {
            const id = req.params.id as string;
            const userId = (req as any).user?.userId;
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user || !user.carrierProfileId) {
                res.status(403).json({ error: 'No profile' });
                return;
            }

            const existing = await prisma.carrierRate.findUnique({ where: { id } });
            if (!existing || existing.carrierId !== user.carrierProfileId) {
                res.status(404).json({ error: 'Rate card not found' });
                return;
            }

            const updated = await prisma.carrierRate.update({
                where: { id },
                data: req.body
            });
            res.status(200).json({ data: updated });
        } catch (error) {
            console.error('[CarrierController] Error updating rate:', error);
            res.status(500).json({ error: 'Failed' });
        }
    }
}
