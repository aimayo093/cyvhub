import { Response } from 'express';
import { prisma } from '../index';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class AdminCommercialController {

    // ==========================================
    // VEHICLE CLASS ENDPOINTS
    // ==========================================

    static async getVehicleClasses(req: AuthenticatedRequest, res: Response) {
        try {
            const vehicles = await (prisma as any).vehicleClass.findMany({
                include: { 
                    pricingRules: true, 
                    payoutRules: true 
                },
                orderBy: { maxWeightKg: 'asc' }
            });
            res.json(vehicles);
        } catch (error) {
            console.error('[AdminCommercialController] Error fetching vehicles:', error);
            res.status(500).json({ error: 'Failed to fetch vehicles' });
        }
    }

    static async createVehicleClass(req: AuthenticatedRequest, res: Response) {
        try {
            const data = req.body;
            const vc = await (prisma as any).vehicleClass.create({ data });
            res.status(201).json(vc);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create vehicle class' });
        }
    }

    static async updateVehicleClass(req: AuthenticatedRequest, res: Response) {
        try {
            const { id } = req.params;
            const data = req.body;
            const vc = await (prisma as any).vehicleClass.update({
                where: { id },
                data
            });
            res.json(vc);
        } catch (error) {
            res.status(500).json({ error: 'Failed to update vehicle class' });
        }
    }

    // ==========================================
    // PRICING OR PAYOUT RULES
    // ==========================================

    static async createPricingRule(req: AuthenticatedRequest, res: Response) {
        try {
            const data = req.body;
            const rule = await (prisma as any).pricingRule.create({ data });
            res.status(201).json(rule);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create pricing rule' });
        }
    }

    static async deletePricingRule(req: AuthenticatedRequest, res: Response) {
        try {
            const { id } = req.params;
            await (prisma as any).pricingRule.delete({ where: { id } });
            res.json({ message: 'Rule successfully deleted' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete pricing rule' });
        }
    }

    static async createPayoutRule(req: AuthenticatedRequest, res: Response) {
        try {
            const data = req.body;
            const rule = await (prisma as any).payoutRule.create({ data });
            res.status(201).json(rule);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create payout rule' });
        }
    }

    static async deletePayoutRule(req: AuthenticatedRequest, res: Response) {
        try {
            const { id } = req.params;
            await (prisma as any).payoutRule.delete({ where: { id } });
            res.json({ message: 'Rule successfully deleted' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete payout rule' });
        }
    }
}
