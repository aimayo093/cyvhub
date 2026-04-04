import { prisma } from '../index';

export interface SuitabilityResult {
    suitable: boolean;
    reason?: 'TOO_HEAVY' | 'TOO_LONG' | 'TOO_WIDE' | 'TOO_HIGH' | 'TOO_VOLUMETRIC' | 'INVALID_VEHICLE';
    message?: string;
}

export class SuitabilityService {
    /**
     * Evaluates if a collection of items fits within a specific vehicle class.
     * @param vehicleClassId The ID of the vehicle class to check.
     * @param items Array of items with dimensions (cm) and weight (kg).
     * @param actualWeightKg Total physical weight of all items.
     * @param volumetricWeightKg Total volumetric weight (calculation proxy for space).
     */
    static async evaluateSuitability(vehicleClassId: string, items: any[], actualWeightKg: number, volumetricWeightKg: number): Promise<SuitabilityResult> {
        const vehicle = await (prisma as any).vehicleClass.findUnique({
            where: { id: vehicleClassId }
        });

        if (!vehicle) return { suitable: false, reason: 'INVALID_VEHICLE', message: 'Vehicle class not found.' };

        // 1. Physical Weight Check
        if (actualWeightKg > vehicle.maxWeightKg) {
            return { 
                suitable: false, 
                reason: 'TOO_HEAVY', 
                message: `Combined weight (${actualWeightKg}kg) exceeds the ${vehicle.name} limit of ${vehicle.maxWeightKg}kg.` 
            };
        }

        // 2. Individual Item Dimension Check (Each item must fit)
        for (const item of items) {
            if (item.lengthCm > vehicle.maxLengthCm) {
                return { 
                    suitable: false, 
                    reason: 'TOO_LONG', 
                    message: `Item length (${item.lengthCm}cm) exceeds the ${vehicle.name} limit of ${vehicle.maxLengthCm}cm.` 
                };
            }
            if (item.widthCm > vehicle.maxWidthCm) {
                return { 
                    suitable: false, 
                    reason: 'TOO_WIDE', 
                    message: `Item width (${item.widthCm}cm) exceeds the ${vehicle.name} limit of ${vehicle.maxWidthCm}cm.` 
                };
            }
            if (item.heightCm > vehicle.maxHeightCm) {
                return { 
                    suitable: false, 
                    reason: 'TOO_HIGH', 
                    message: `Item height (${item.heightCm}cm) exceeds the ${vehicle.name} limit of ${vehicle.maxHeightCm}cm.` 
                };
            }
        }

        // 3. Volumetric Capacity Proxy
        // If volumetric weight is significantly higher than physical capacity, it likely won't fit floor space.
        // We use a 1.2 buffer over maxWeightKg as a volumetric limit for van floor space.
        const volumetricLimit = vehicle.maxWeightKg * 1.2;
        if (volumetricWeightKg > volumetricLimit) {
            return {
                suitable: false,
                reason: 'TOO_VOLUMETRIC',
                message: `The total volume of these items exceeds the available space in a ${vehicle.name}.`
            };
        }

        return { suitable: true };
    }

    /**
     * Finds all suitable vehicles for a given load.
     */
    static async findSuitableVehicles(items: any[], actualWeightKg: number, volumetricWeightKg: number) {
        const vehicles = await (prisma as any).vehicleClass.findMany({
            where: { isActive: true },
            orderBy: { maxWeightKg: 'asc' }
        });

        const available = [];
        const rejected = [];

        for (const vc of vehicles) {
            const result = await this.evaluateSuitability(vc.id, items, actualWeightKg, volumetricWeightKg);
            if (result.suitable) {
                available.push(vc);
            } else {
                rejected.push({
                    vehicleId: vc.id,
                    name: vc.name,
                    reason: result.reason,
                    message: result.message
                });
            }
        }

        return { available, rejected };
    }
}
