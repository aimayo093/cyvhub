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
                }
            });
            res.status(201).json({ business });
        } catch (error) {
            console.error('[BusinessController] Error creating business:', error);
            res.status(500).json({ error: 'Failed to create business account.' });
        }
    }
}
