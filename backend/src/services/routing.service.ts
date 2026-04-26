import axios from 'axios';
import { calculateRouteDistance } from '../lib/google/distance';
import { geocodeAddress } from '../lib/google/geocode';
import { coordinatesToGoogleLocation } from '../lib/google/routes';
import { GoogleMapsConfigError } from '../lib/google/mapsClient';
import { Logger } from '../utils/logger';

type Coordinates = { lat: number; lng: number };

export class RoutingService {
    private static readonly logger = new Logger(RoutingService.name);

    /**
     * Master distance orchestrator for pricing and quote flows.
     * Returns road miles or null when no reliable route can be found.
     */
    static async calculateDistance(fromPostcode: string, toPostcode: string): Promise<number | null> {
        try {
            try {
                const route = await calculateRouteDistance({
                    origin: fromPostcode,
                    destination: toPostcode,
                });
                return route.distanceMiles;
            } catch (error: any) {
                if (error instanceof GoogleMapsConfigError) {
                    this.logger.warn('GOOGLE_MAPS_SERVER_KEY is missing; using fallback route distance services.');
                } else {
                    this.logger.warn(`Google route distance failed for ${fromPostcode}->${toPostcode}.`);
                }
            }

            const [fromCoords, toCoords] = await Promise.all([
                this.getPostcodeCoords(fromPostcode),
                this.getPostcodeCoords(toPostcode),
            ]);

            if (fromCoords && toCoords) {
                const fallbackRoute = await this.calculateRoadRoute(fromCoords, toCoords);
                return fallbackRoute.distanceMiles;
            }

            this.logger.warn(`Could not calculate distance for postcodes: ${fromPostcode} -> ${toPostcode}`);
            return null;
        } catch (error: any) {
            this.logger.error('Distance calculation fatal error', error.stack);
            return null;
        }
    }

    static async getPostcodeCoords(postcode: string): Promise<Coordinates | null> {
        try {
            if (process.env.GOOGLE_MAPS_SERVER_KEY) {
                const googleResult = await geocodeAddress(postcode);
                return { lat: googleResult.lat, lng: googleResult.lng };
            }
        } catch {
            this.logger.warn(`Google geocode failed for postcode ${postcode}; falling back to postcodes.io.`);
        }

        try {
            const clean = postcode.replace(/\s/g, '').toUpperCase();
            const res = await axios.get(`https://api.postcodes.io/postcodes/${clean}`, { timeout: 8000 });
            if (res.status === 200 && res.data.status === 200) {
                return {
                    lat: res.data.result.latitude,
                    lng: res.data.result.longitude,
                };
            }
            return null;
        } catch {
            return null;
        }
    }

    static haversineDistanceMiles(a: Coordinates, b: Coordinates): number {
        const R = 3958.8;
        const dLat = (b.lat - a.lat) * Math.PI / 180;
        const dLon = (b.lng - a.lng) * Math.PI / 180;
        const lat1 = a.lat * Math.PI / 180;
        const lat2 = b.lat * Math.PI / 180;
        const x = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.asin(Math.sqrt(x));
    }

    static async calculateRoadRoute(origin: Coordinates, destination: Coordinates) {
        try {
            const route = await calculateRouteDistance({
                origin: coordinatesToGoogleLocation(origin),
                destination: coordinatesToGoogleLocation(destination),
            });

            return {
                distanceMiles: route.distanceMiles,
                durationMinutes: route.durationMinutes,
                distanceKm: route.distanceKm,
                polyline: route.polyline,
            };
        } catch (error: any) {
            if (error instanceof GoogleMapsConfigError) {
                this.logger.warn('GOOGLE_MAPS_SERVER_KEY is missing; using fallback route service.');
            } else {
                this.logger.warn(`Google route failed: ${error.message}`);
            }
        }

        try {
            const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
            const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=false`;
            const response = await axios.get(url, { timeout: 10000 });

            if (response.data.code !== 'Ok') {
                throw new Error(`Routing service error: ${response.data.code}`);
            }

            const route = response.data.routes[0];

            return {
                distanceMiles: Number((route.distance * 0.000621371).toFixed(2)),
                durationMinutes: Math.ceil(route.duration / 60),
                distanceKm: Number((route.distance / 1000).toFixed(2)),
                polyline: '',
            };
        } catch (error: any) {
            this.logger.warn(`OSRM route failed: ${error.message}`);
            const airDist = this.calculateHaversine(origin, destination);
            const roadEstimate = airDist * 1.3;
            return {
                distanceMiles: Number(roadEstimate.toFixed(2)),
                durationMinutes: Math.ceil(roadEstimate * 2.5),
                distanceKm: Number((roadEstimate * 1.60934).toFixed(2)),
                polyline: '',
            };
        }
    }

    private static calculateHaversine(o: Coordinates, d: Coordinates) {
        return this.haversineDistanceMiles(o, d);
    }
}
