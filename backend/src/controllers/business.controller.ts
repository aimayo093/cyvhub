import { Request, Response } from 'express';
import { prisma } from '../index';

export class BusinessController {
    // GET /api/businesses
    static async getBusinesses(req: Request, res: Response): Promise<void> {
        try {
            const businesses = await prisma.businessAccount.findMany({
                orderBy: { tradingName: 'asc' },
                include: {
                    contract: true
                }
            });
            res.status(200).json({ businesses });
        } catch (error) {
            console.error('[BusinessController] Error fetching businesses:', error);
            res.status(500).json({ error: 'Failed to fetch businesses.' });
        }
    }

    // GET /api/businesses/:id
    static async getBusiness(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const business = await prisma.businessAccount.findUnique({
                where: { id: id as string },
                include: {
                    contract: {
                        include: { rateRules: true }
                    },
                    users: {
                        select: { id: true, firstName: true, lastName: true, email: true, role: true }
                    }
                }
            });

            if (!business) {
                res.status(404).json({ error: 'Business not found.' });
                return;
            }

            res.status(200).json({ business });
        } catch (error) {
            console.error('[BusinessController] Error fetching business:', error);
            res.status(500).json({ error: 'Failed to fetch business account.' });
        }
    }

    // POST /api/businesses
    static async createBusiness(req: Request, res: Response): Promise<void> {
        try {
            // SEC-AUDIT-3: Mass Assignment Protection.
            // Previously, the entire req.body was passed to Prisma, allowing an attacker
            // to set sensitive financial fields like totalSpend, currentBalance, creditLimit.
            const {
                tradingName,
                companyName,
                contactEmail,
                contactPhone,
                billingAddress,
                billingCity,
                billingPostcode,
                industryProfile,
                billingTerms,
                creditLimit,
            } = req.body;

            if (!tradingName || !companyName || !contactEmail) {
                res.status(400).json({ error: 'Missing required fields: tradingName, companyName, contactEmail.' });
                return;
            }

            const business = await prisma.businessAccount.create({
                data: {
                    tradingName,
                    companyName,
                    contactEmail,
                    contactPhone,
                    billingAddress,
                    billingCity,
                    billingPostcode,
                    industryProfile,
                    billingTerms,
                    creditLimit: parseFloat(creditLimit) || 0,
                }
            });
            res.status(201).json({ business });
        } catch (error) {
            console.error('[BusinessController] Error creating business:', error);
            res.status(500).json({ error: 'Failed to create business account.' });
        }
    }

    // PATCH /api/businesses/:id/status
    static async updateBusinessStatus(req: Request, res: Response): Promise<void> {
        try {
            const id = req.params.id as string;
            const { status } = req.body;

            if (!status || !['ACTIVE', 'SUSPENDED', 'PENDING'].includes(status)) {
                res.status(400).json({ error: 'Invalid status provided.' });
                return;
            }

            const updated = await prisma.businessAccount.update({
                where: { id },
                data: { status }
            });
            res.status(200).json({ business: updated });
        } catch (error) {
            console.error('[BusinessController] Error updating business status:', error);
            res.status(500).json({ error: 'Failed to update business status.' });
        }
    }

    // PATCH /api/businesses/:id
    static async updateBusiness(req: Request, res: Response): Promise<void> {
        try {
            const id = req.params.id as string;
            const { billingTerms, creditLimit, contractId } = req.body;
            
            const dataToUpdate: any = {};
            if (billingTerms !== undefined) dataToUpdate.billingTerms = billingTerms;
            if (creditLimit !== undefined) dataToUpdate.creditLimit = parseFloat(creditLimit);
            if (contractId !== undefined) dataToUpdate.contractId = contractId;

            const updated = await prisma.businessAccount.update({
                where: { id },
                data: dataToUpdate
            });
            res.status(200).json({ business: updated });
        } catch (error) {
            console.error('[BusinessController] Error updating business:', error);
            res.status(500).json({ error: 'Failed to update business configuration.' });
        }
    }
}
