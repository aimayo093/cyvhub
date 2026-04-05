import { prisma } from '../index';
import { normalizeVehicleType } from '../utils/vehicleMapping';

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
        // SEC-AUDIT: Using standard camelCase for Prisma models. 
        // We first try a direct ID lookup. If that fails (e.g., if a name was passed), we try name-based normalization.
        let vehicle;
        
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(vehicleClassId);
        
        if (isUuid) {
            vehicle = await (prisma as any).vehicleClass.findUnique({
                where: { id: vehicleClassId }
            });
        }

        if (!vehicle) {
            const normalizedName = normalizeVehicleType(vehicleClassId);
            console.log(`[SUITABILITY_DEBUG] ID lookup failed for ${vehicleClassId}. Attempting name lookup with: ${normalizedName}`);
            vehicle = await (prisma as any).vehicleClass.findUnique({
                where: { name: normalizedName }
            });
        }

        if (!vehicle) {
            console.warn(`[SUITABILITY_DEBUG] Vehicle class ${vehicleClassId} not found.`);
            return { suitable: false, reason: 'INVALID_VEHICLE', message: 'Vehicle class not found.' };
        }

        console.log(`[SUITABILITY_DEBUG] Evaluating ${vehicle.name} for ${actualWeightKg}kg (Vol: ${volumetricWeightKg}kg)`);

        // 1. Physical Weight Check
        if (actualWeightKg > vehicle.maxWeightKg) {
            const msg = `Combined weight (${actualWeightKg}kg) exceeds the ${vehicle.name} limit of ${vehicle.maxWeightKg}kg.`;
            console.log(`[SUITABILITY_REJECT] ${vehicle.name}: TOO_HEAVY - ${msg}`);
            return { suitable: false, reason: 'TOO_HEAVY', message: msg };
        }

        // 2. Individual Item Dimension Check (Each item must fit)
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.lengthCm > vehicle.maxLengthCm) {
                const msg = `Item ${i+1} length (${item.lengthCm}cm) exceeds the ${vehicle.name} limit of ${vehicle.maxLengthCm}cm.`;
                console.log(`[SUITABILITY_REJECT] ${vehicle.name}: TOO_LONG - ${msg}`);
                return { suitable: false, reason: 'TOO_LONG', message: msg };
            }
            if (item.widthCm > vehicle.maxWidthCm) {
                const msg = `Item ${i+1} width (${item.widthCm}cm) exceeds the ${vehicle.name} limit of ${vehicle.maxWidthCm}cm.`;
                console.log(`[SUITABILITY_REJECT] ${vehicle.name}: TOO_WIDE - ${msg}`);
                return { suitable: false, reason: 'TOO_WIDE', message: msg };
            }
            if (item.heightCm > vehicle.maxHeightCm) {
                const msg = `Item ${i+1} height (${item.heightCm}cm) exceeds the ${vehicle.name} limit of ${vehicle.maxHeightCm}cm.`;
                console.log(`[SUITABILITY_REJECT] ${vehicle.name}: TOO_HIGH - ${msg}`);
                return { suitable: false, reason: 'TOO_HIGH', message: msg };
            }
        }

        // 3. Volumetric Capacity Proxy
        const volumetricLimit = vehicle.maxWeightKg * 1.2;
        if (volumetricWeightKg > volumetricLimit) {
            const msg = `The total volume (${volumetricWeightKg}kg proxy) exceeds the available space (${volumetricLimit.toFixed(1)}kg proxy) in a ${vehicle.name}.`;
            console.log(`[SUITABILITY_REJECT] ${vehicle.name}: TOO_VOLUMETRIC - ${msg}`);
            return {
                suitable: false,
                reason: 'TOO_VOLUMETRIC',
                message: msg
            };
        }

        console.log(`[SUITABILITY_PASS] ${vehicle.name} is suitable.`);
        return { suitable: true };
    }

    /**
     * Finds all suitable vehicles for a given load.
     */
    static async findSuitableVehicles(items: any[], actualWeightKg: number, volumetricWeightKg: number) {
        console.log(`[SUITABILITY_START] Finding vehicles for ${items.length} items...`);
        
        const vehicles = await (prisma as any).vehicleClass.findMany({
            where: { isActive: true },
            orderBy: { maxWeightKg: 'asc' }
        });

        if (vehicles.length === 0) {
            console.error('[SUITABILITY_ERROR] No active vehicle classes found in database!');
        } else {
            console.log(`[SUITABILITY_DEBUG] Checking ${vehicles.length} active vehicle classes.`);
        }

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

        console.log(`[SUITABILITY_COMPLETE] Available: ${available.length}, Rejected: ${rejected.length}`);
        return { available, rejected };
    }
}
