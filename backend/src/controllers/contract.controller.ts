import { Request, Response } from 'express';
import { prisma } from '../index';

export class ContractController {
    // GET /api/contracts
    static async getContracts(req: Request, res: Response): Promise<void> {
        try {
            const contracts = await prisma.contract.findMany({
                include: { rateRules: true, businessAccount: true }
            });
            res.status(200).json({ contracts });
        } catch (error) {
            console.error('[ContractController] Error fetching contracts:', error);
            res.status(500).json({ error: 'Failed to fetch contracts.' });
        }
    }

    // POST /api/contracts — Admin only (enforced in route)
    static async createContract(req: Request, res: Response): Promise<void> {
        try {
            // B2-SEC-5: Whitelist contract fields based on actual Prisma schema
            const {
                contractName,
                contractRef,
                clientId,
                clientName,
                startDate,
                endDate,
                status,
                paymentTerms,
                monthlyVolumeTier,
                baseRateDiscount,
                mileageRateFactor,
                specialSlaParams,
                rateRules,
            } = req.body;

            if (!contractName || !contractRef || !clientId || !clientName || !startDate) {
                res.status(400).json({ error: 'Missing required contract fields: contractName, contractRef, clientId, clientName, startDate.' });
                return;
            }

            const contract = await prisma.contract.create({
                data: {
                    contractName,
                    contractRef,
                    clientId,
                    clientName,
                    startDate: new Date(startDate),
                    endDate: endDate ? new Date(endDate) : undefined,
                    status: status || 'ACTIVE',
                    paymentTerms: paymentTerms || 'Net 30',
                    monthlyVolumeTier: monthlyVolumeTier || 'tier_1',
                    baseRateDiscount: baseRateDiscount ? parseFloat(baseRateDiscount) : 0,
                    mileageRateFactor: mileageRateFactor ? parseFloat(mileageRateFactor) : 1.0,
                    specialSlaParams: specialSlaParams || 'standard',
                    rateRules: {
                        create: Array.isArray(rateRules) ? rateRules : []
                    }
                },
                include: { rateRules: true }
            });
            res.status(201).json({ contract });
        } catch (error) {
            console.error('[ContractController] Error creating contract:', error);
            res.status(500).json({ error: 'Failed to create contract.' });
        }
    }
}
