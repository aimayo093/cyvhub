import axios from 'axios';
import { Logger } from '../utils/logger';

export class RoutingService {
    private static readonly logger = new Logger(RoutingService.name);
    /**
     * MASTER DISTANCE ORCHESTRATOR
     * Never throws. Returns number (miles) or null.
     */
    static async calculateDistance(fromPostcode: string, toPostcode: string): Promise<number | null> {
        try {
            // 1. Try Google Maps if key exists
            const googleKey = process.env.GOOGLE_MAPS_API_KEY;
            if (googleKey) {
                try {
                    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${fromPostcode}&destinations=${toPostcode}&key=${googleKey}`;
                    const response = await axios.get(url);
                    if (response.data.status === 'OK' && response.data.rows[0].elements[0].status === 'OK') {
                        return Number((response.data.rows[0].elements[0].distance.value * 0.000621371).toFixed(2));
                    }
                } catch (err) {
                    this.logger.warn(`Google Maps failed for ${fromPostcode}->${toPostcode}`);
                }
            }

            // 2. Try OSRM (needs coords)
            const [fromCoords, toCoords] = await Promise.all([
                this.getPostcodeCoords(fromPostcode),
                this.getPostcodeCoords(toPostcode)
            ]);

            if (fromCoords && toCoords) {
                try {
                    const coords = `${fromCoords.lng},${fromCoords.lat};${toCoords.lng},${toCoords.lat}`;
                    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=false`;
                    const res = await axios.get(url);
                    if (res.data.code === 'Ok') {
                        return Number((res.data.routes[0].distance * 0.000621371).toFixed(2));
                    }
                } catch (err) {
                    this.logger.warn(`OSRM failed for ${fromPostcode}->${toPostcode}`);
                }

                // 3. Haversine Fallback
                return Number(this.haversineDistanceMiles(fromCoords, toCoords).toFixed(2));
            }

            this.logger.warn(`Could not calculate distance for postcodes: ${fromPostcode} -> ${toPostcode}`);
            return null;
        } catch (error: any) {
            this.logger.error('Distance calculation fatal error', error.stack);
            return null;
        }
    }

    static async getPostcodeCoords(postcode: string): Promise<{ lat: number, lng: number } | null> {
        try {
            const clean = postcode.replace(/\s/g, '').toUpperCase();
            const res = await axios.get(`https://api.postcodes.io/postcodes/${clean}`);
            if (res.status === 200 && res.data.status === 200) {
                return {
                    lat: res.data.result.latitude,
                    lng: res.data.result.longitude
                };
            }
            return null;
        } catch {
            return null;
        }
    }

    static haversineDistanceMiles(a: { lat: number, lng: number }, b: { lat: number, lng: number }): number {
        const R = 3958.8; // Miles
        const dLat = (b.lat - a.lat) * Math.PI / 180;
        const dLon = (b.lng - a.lng) * Math.PI / 180;
        const lat1 = a.lat * Math.PI / 180;
        const lat2 = b.lat * Math.PI / 180;
        const x = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.asin(Math.sqrt(x));
    }

    static async calculateRoadRoute(origin: { lat: number, lng: number }, destination: { lat: number, lng: number }) {
        // 1. Try Google Maps if key exists
        const googleKey = process.env.GOOGLE_MAPS_API_KEY;
        if (googleKey) {
            try {
                const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.lat},${origin.lng}&destinations=${destination.lat},${destination.lng}&key=${googleKey}`;
                const response = await axios.get(url);
                const data = response.data;

                if (data.status === 'OK' && data.rows[0].elements[0].status === 'OK') {
                    const element = data.rows[0].elements[0];
                    return {
                        distanceMiles: Number((element.distance.value * 0.000621371).toFixed(2)),
                        durationMinutes: Math.ceil(element.duration.value / 60)
                    };
                }
                console.warn('[RoutingService] Google Maps returned non-OK status:', data.status);
            } catch (err: any) {
                console.error('[RoutingService] Google Maps failed:', err.message);
            }
        }

        // 2. Fallback to OSRM
        try {
            // OSRM coordinates format is {lng},{lat}
            const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
            const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=false`;

            const response = await axios.get(url);

            if (response.data.code !== 'Ok') {
                throw new Error(`Routing service error: ${response.data.code}`);
            }

            const route = response.data.routes[0];
            const distanceMeters = route.distance;
            const durationSeconds = route.duration;

            return {
                distanceMiles: Number((distanceMeters * 0.000621371).toFixed(2)),
                durationMinutes: Math.ceil(durationSeconds / 60)
            };
        } catch (error: any) {
            console.error('[RoutingService] OSRM Route failed:', error.message);
            
            // 3. Critical Fallback: Haversine * 1.3 (Traditional approximation)
            const airDist = this.calculateHaversine(origin, destination);
            return {
                distanceMiles: Number((airDist * 1.3).toFixed(2)),
                durationMinutes: Math.ceil(airDist * 1.3 * 2.5) // Loose approx: 2.5 mins per mile
            };
        }
    }

    private static calculateHaversine(o: { lat: number, lng: number }, d: { lat: number, lng: number }) {
        const R = 3958.8; // Miles
        const dLat = (d.lat - o.lat) * Math.PI / 180;
        const dLon = (d.lng - o.lng) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(o.lat * Math.PI / 180) * Math.cos(d.lat * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
}
