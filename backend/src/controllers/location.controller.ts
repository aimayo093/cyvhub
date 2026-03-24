/**
 * location.controller.ts — Driver location updates via REST + Supabase Realtime.
 *
 * HOW IT WORKS (replaces the old Socket.IO implementation):
 *
 *  1. Driver calls:  PATCH /api/location
 *     Body:  { lat: number, lng: number, heading?: number, speed?: number }
 *     Header: Authorization: Bearer <jwt>
 *
 *  2. Backend writes lastKnownLat/lastKnownLng to the `User` row in Supabase.
 *
 *  3. Supabase Postgres Realtime automatically detects the UPDATE and broadcasts
 *     the changed row to all subscribed front-end clients in real-time.
 *
 *  4. Admin/customer clients subscribe using the Supabase JS SDK:
 *
 *     const channel = supabase
 *       .channel('driver-locations')
 *       .on('postgres_changes', {
 *           event: 'UPDATE',
 *           schema: 'public',
 *           table: 'User',
 *           filter: `role=eq.driver`,
 *       }, (payload) => {
 *           // payload.new contains { id, lastKnownLat, lastKnownLng, ... }
 *           updateDriverMarker(payload.new);
 *       })
 *       .subscribe();
 *
 * IMPORTANT: Supabase Realtime must be enabled for the `User` table in your
 * Supabase project. Go to: Database → Replication → Enable Realtime for `User`.
 */

import { Response } from 'express';
import { prisma } from '../index';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

/**
 * PATCH /api/location
 * 
 * Authenticated drivers call this endpoint periodically (e.g. every 5–10 seconds)
 * to update their current GPS coordinates. The DB write triggers Supabase Realtime
 * which broadcasts the change to all subscribed tracking consumers.
 */
export const updateDriverLocation = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const driverId = req.user?.userId;
        const role = req.user?.role;

        if (!driverId || (role !== 'driver' && role !== 'carrier')) {
            return res.status(403).json({ error: 'Only drivers and carriers can update location.' });
        }

        const { lat, lng, heading, speed } = req.body;

        if (typeof lat !== 'number' || typeof lng !== 'number') {
            return res.status(400).json({ error: 'lat and lng must be numbers.' });
        }

        // Basic coordinate bounds validation
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return res.status(400).json({ error: 'Invalid coordinate values.' });
        }

        // Write to DB — Supabase Realtime picks this up and broadcasts automatically
        await prisma.user.update({
            where: { id: driverId },
            data: {
                lastKnownLat: lat,
                lastKnownLng: lng,
            },
        });

        return res.json({
            success: true,
            message: 'Location updated.',
            data: { driverId, lat, lng, heading, speed, timestamp: new Date().toISOString() },
        });

    } catch (error) {
        console.error('[Location] Update error:', error);
        return res.status(500).json({ error: 'Failed to update location.' });
    }
};

/**
 * GET /api/location/drivers
 * 
 * Returns the last known location of all active drivers.
 * Used for initial map population before Realtime subscription kicks in.
 * Restricted to admin/carrier/customer roles.
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
            select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                lastKnownLat: true,
                lastKnownLng: true,
            },
        });

        return res.json({ drivers });

    } catch (error) {
        console.error('[Location] Fetch drivers error:', error);
        return res.status(500).json({ error: 'Failed to fetch driver locations.' });
    }
};
