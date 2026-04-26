import { Request, Response } from 'express';
import { prisma } from '../index';
import { calculateRouteDistance } from '../lib/google/distance';
import { geocodeAddress } from '../lib/google/geocode';
import {
    GoogleMapsConfigError,
    GoogleMapsProviderError,
    GoogleMapsValidationError,
    sanitizeLocationInput,
} from '../lib/google/mapsClient';
import { PricingService } from '../services/pricing.service';
import { SuitabilityService } from '../services/suitability.service';
import { normalizeVehicleType } from '../utils/vehicleMapping';
import { Logger } from '../utils/logger';
import { isAdminRole } from '../utils/roles';

const logger = new Logger('MapsController');

type PriceLine = {
    type: string;
    amount: number;
};

type RoutePricingItem = {
    lengthCm: number;
    widthCm: number;
    heightCm: number;
    weightKg: number;
    quantity: number;
};

function sendMapsError(res: Response, error: unknown) {
    if (error instanceof GoogleMapsValidationError) {
        return res.status(400).json({ success: false, error: error.message });
    }

    if (error instanceof GoogleMapsConfigError) {
        logger.error(error.message);
        return res.status(503).json({
            success: false,
            error: 'Maps service is not configured. Please contact support.',
        });
    }

    if (error instanceof GoogleMapsProviderError) {
        logger.warn(error.message);
        return res.status(502).json({
            success: false,
            error: 'Route data is temporarily unavailable. Please try again.',
        });
    }

    const message = error instanceof Error ? error.message : 'Unknown maps error';
    logger.error(message, error instanceof Error ? error.stack : undefined);
    return res.status(500).json({
        success: false,
        error: 'Maps request failed. Please try again.',
    });
}

function toNumber(value: unknown, fallback = 0): number {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
}

function normalizeDimensions(body: any): RoutePricingItem[] {
    const explicitDimensions = Array.isArray(body.dimensions) ? body.dimensions : [];
    const parcelCount = Math.max(1, Math.floor(toNumber(body.parcelCount, explicitDimensions.length || 1)));

    if (explicitDimensions.length > 0) {
        return explicitDimensions.map((item: any) => ({
            lengthCm: Math.max(0, toNumber(item.lengthCm)),
            widthCm: Math.max(0, toNumber(item.widthCm)),
            heightCm: Math.max(0, toNumber(item.heightCm)),
            weightKg: Math.max(0, toNumber(item.weightKg)),
            quantity: Math.max(1, Math.floor(toNumber(item.quantity, 1))),
        }));
    }

    return [{
        lengthCm: Math.max(1, toNumber(body.lengthCm, 30)),
        widthCm: Math.max(1, toNumber(body.widthCm, 30)),
        heightCm: Math.max(1, toNumber(body.heightCm, 30)),
        weightKg: Math.max(0.1, toNumber(body.weightKg, 1)),
        quantity: parcelCount,
    }];
}

function serviceLevelFromUrgency(urgency?: string): string {
    const normalized = String(urgency || '').trim().toLowerCase();
    if (['same_day', 'same-day', 'urgent', 'priority', 'express'].includes(normalized)) {
        return 'SAME_DAY';
    }
    if (['next_day', 'next-day'].includes(normalized)) {
        return 'NEXT_DAY';
    }
    return 'STANDARD';
}

function lineAmount(lineItems: PriceLine[], type: string): number {
    return Number(lineItems
        .filter(item => item.type === type)
        .reduce((sum, item) => sum + Number(item.amount || 0), 0)
        .toFixed(2));
}

export async function geocodeController(req: Request, res: Response) {
    try {
        const address = sanitizeLocationInput(req.body?.address, 'address');
        const result = await geocodeAddress(address);

        return res.json({
            formattedAddress: result.formattedAddress,
            lat: result.lat,
            lng: result.lng,
            postcode: result.postcode,
            success: true,
        });
    } catch (error) {
        return sendMapsError(res, error);
    }
}

export async function distanceController(req: Request, res: Response) {
    try {
        const origin = sanitizeLocationInput(req.body?.origin || req.body?.pickupPostcode, 'origin');
        const destination = sanitizeLocationInput(req.body?.destination || req.body?.dropoffPostcode, 'destination');
        const waypoints = Array.isArray(req.body?.waypoints) ? req.body.waypoints : [];

        const route = await calculateRouteDistance({ origin, destination, waypoints });

        return res.json({
            distanceMiles: route.distanceMiles,
            distanceKm: route.distanceKm,
            durationMinutes: route.durationMinutes,
            polyline: route.polyline,
            success: true,
        });
    } catch (error) {
        return sendMapsError(res, error);
    }
}

export async function routePricingController(req: Request, res: Response) {
    try {
        const origin = sanitizeLocationInput(req.body?.origin || req.body?.pickupPostcode, 'origin');
        const destination = sanitizeLocationInput(req.body?.destination || req.body?.dropoffPostcode, 'destination');
        const vehicleType = normalizeVehicleType(String(req.body?.vehicleType || 'SMALL_VAN'));
        const items = normalizeDimensions(req.body);

        if (!items.every(item => item.weightKg > 0 && item.lengthCm > 0 && item.widthCm > 0 && item.heightCm > 0)) {
            return res.status(400).json({
                success: false,
                error: 'Parcel dimensions and weight must be greater than zero.',
            });
        }

        const vehicle = await (prisma as any).vehicleClass.findUnique({
            where: { name: vehicleType },
        });

        if (!vehicle || !vehicle.isActive) {
            return res.status(400).json({
                success: false,
                error: 'Selected vehicle is unavailable for pricing.',
            });
        }

        const weights = PricingService.calculateChargeableWeight(items);
        const suitability = await SuitabilityService.evaluateSuitability(
            vehicle.id,
            items,
            weights.actualWeightKg,
            weights.volumetricWeightKg
        );

        if (!suitability.suitable) {
            return res.status(422).json({
                success: false,
                error: suitability.message || 'Selected vehicle is not suitable for this load.',
            });
        }

        const route = await calculateRouteDistance({ origin, destination });
        const parcelQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
        const authenticatedUser = (req as any).user;
        const userRecord = authenticatedUser?.userId
            ? await prisma.user.findUnique({
                where: { id: authenticatedUser.userId },
                select: { businessAccountId: true },
            })
            : null;
        const effectiveBusinessId = isAdminRole(authenticatedUser?.role)
            ? req.body?.businessId
            : userRecord?.businessAccountId;
        const flags = {
            ...(req.body?.flags || {}),
            serviceLevel: serviceLevelFromUrgency(req.body?.urgency),
        };

        const pricing = await PricingService.generateCustomerQuote(
            vehicle.id,
            route.distanceMiles,
            weights.chargeableWeightKg,
            flags,
            parcelQuantity,
            effectiveBusinessId || undefined
        );

        const lineItems = pricing.lineItems as PriceLine[];
        const basePrice = lineAmount(lineItems, 'BASE_FEE') + lineAmount(lineItems, 'MILEAGE');
        const urgencyFee = lineAmount(lineItems, 'SLA_UPLIFT') + lineAmount(lineItems, 'OOH_SURCHARGE');
        const weightFee = lineAmount(lineItems, 'WEIGHT_SURCHARGE');
        const multiParcelFee = lineAmount(lineItems, 'HANDLING_FEE');

        return res.json({
            distanceMiles: route.distanceMiles,
            distanceKm: route.distanceKm,
            durationMinutes: route.durationMinutes,
            polyline: route.polyline,
            basePrice: Number(basePrice.toFixed(2)),
            vehicleMultiplier: 1,
            urgencyFee,
            weightFee,
            multiParcelFee,
            subtotalExVat: pricing.customerTotal,
            vatAmount: pricing.vatAmount,
            totalPrice: pricing.totalIncVat,
            totalExVat: pricing.customerTotal,
            currency: 'GBP',
            selectedVehicle: vehicle.name,
            parcelCount: parcelQuantity,
            chargeableWeightKg: weights.chargeableWeightKg,
            success: true,
        });
    } catch (error) {
        return sendMapsError(res, error);
    }
}
