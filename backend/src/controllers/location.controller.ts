import { Response } from 'express';
import { prisma } from '../index';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { AddressService } from '../services/address.service';
import { RoutingService } from '../services/routing.service';

/**
 * Driver location updates (Supabase Realtime)
 */
export const updateDriverLocation = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const driverId = req.user?.userId;
        const role = req.user?.role;
        if (!driverId || (role !== 'driver' && role !== 'carrier')) {
            return res.status(403).json({ error: 'Only drivers and carriers can update location.' });
        }
        const { lat, lng } = req.body;
        if (typeof lat !== 'number' || typeof lng !== 'number') {
            return res.status(400).json({ error: 'lat and lng must be numbers.' });
        }
        await prisma.user.update({
            where: { id: driverId },
            data: { lastKnownLat: lat, lastKnownLng: lng },
        });
        return res.json({ success: true, message: 'Location updated.' });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to update location.' });
    }
};

/**
 * Fetch active driver locations
 */
export const getActiveDriverLocations = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const drivers = await prisma.user.findMany({
            where: {
                role: { in: ['driver', 'carrier'] },
                status: 'ACTIVE',
                lastKnownLat: { not: null },
                lastKnownLng: { not: null },
            },
            select: { id: true, firstName: true, lastName: true, role: true, lastKnownLat: true, lastKnownLng: true },
        });
        return res.json({ drivers });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch driver locations.' });
    }
};

/**
 * NEW: Resolve UK Postcode to Address List
 * GET /api/location/addresses?postcode=...
 */
export const getAddressesByPostcode = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const postcode = req.query.postcode as string;
        if (!postcode) return res.status(400).json({ error: 'Postcode is required.' });
        const addresses = await AddressService.findAddresses(postcode);
        return res.json({ addresses });
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
};

/**
 * NEW: UK Address Autocomplete
 * GET /api/location/autocomplete?query=...
 */
export const autocompleteAddress = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const query = req.query.query as string;
        if (!query) return res.status(400).json({ error: 'Query string is required.' });
        const suggestions = await AddressService.autocomplete(query);
        return res.json({ suggestions });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

/**
 * REFACTORED: Calculate ROAD Distance
 * POST /api/location/distance
 * Body: { pickupPostcode, dropoffPostcode, pickupCoords?, dropoffCoords? }
 */
export const calculateDistance = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { pickupPostcode, dropoffPostcode, pickupCoords, dropoffCoords } = req.body;
        
        let pCoords = pickupCoords;
        let dCoords = dropoffCoords;

        // If coords weren't provided, resolve them via getAddress or fall back (legacy support)
        if (!pCoords || !dCoords) {
             const [pRes, dRes] = await Promise.all([
                 AddressService.findAddresses(pickupPostcode),
                 AddressService.findAddresses(dropoffPostcode)
             ]);
             pCoords = { lat: pRes[0].latitude, lng: pRes[0].longitude };
             dCoords = { lat: dRes[0].latitude, lng: dRes[0].longitude };
        }

        const route = await RoutingService.calculateRoadRoute(pCoords, dCoords);

        return res.json({
             distanceMiles: route.distanceMiles,
             durationMinutes: route.durationMinutes,
             pickup: pCoords,
             dropoff: dCoords
        });

    } catch (error: any) {
        console.error('[Location] Distance Error:', error.message);
        return res.status(400).json({ error: error.message || 'Failed to calculate road route.' });
    }
};
