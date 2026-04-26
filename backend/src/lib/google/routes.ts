import {
    googleMapsGet,
    GoogleMapsProviderError,
    sanitizeLocationInput,
} from './mapsClient';

type GoogleDirectionsResponse = {
    status: string;
    error_message?: string;
    routes: Array<{
        overview_polyline?: {
            points: string;
        };
        legs: Array<{
            distance: { value: number; text: string };
            duration: { value: number; text: string };
        }>;
    }>;
};

export type RouteDistanceRequest = {
    origin: string;
    destination: string;
    waypoints?: string[];
};

export type RouteDistanceResult = {
    distanceMeters: number;
    distanceKm: number;
    distanceMiles: number;
    durationSeconds: number;
    durationMinutes: number;
    polyline: string;
};

export async function calculateGoogleRouteDistance({
    origin,
    destination,
    waypoints = [],
}: RouteDistanceRequest): Promise<RouteDistanceResult> {
    const safeOrigin = sanitizeLocationInput(origin, 'origin');
    const safeDestination = sanitizeLocationInput(destination, 'destination');
    const safeWaypoints = waypoints
        .filter(Boolean)
        .slice(0, 8)
        .map((waypoint, index) => sanitizeLocationInput(waypoint, `waypoint ${index + 1}`));

    const data = await googleMapsGet<GoogleDirectionsResponse>('directions/json', {
        origin: safeOrigin,
        destination: safeDestination,
        waypoints: safeWaypoints.length ? safeWaypoints.join('|') : undefined,
        mode: 'driving',
        units: 'metric',
        region: 'uk',
    });

    if (data.status !== 'OK' || !data.routes?.[0]?.legs?.length) {
        throw new GoogleMapsProviderError(`Directions returned ${data.status}`);
    }

    const route = data.routes[0];
    const distanceMeters = route.legs.reduce((total, leg) => total + (leg.distance?.value || 0), 0);
    const durationSeconds = route.legs.reduce((total, leg) => total + (leg.duration?.value || 0), 0);

    return {
        distanceMeters,
        distanceKm: Number((distanceMeters / 1000).toFixed(2)),
        distanceMiles: Number((distanceMeters * 0.000621371).toFixed(2)),
        durationSeconds,
        durationMinutes: Math.ceil(durationSeconds / 60),
        polyline: route.overview_polyline?.points || '',
    };
}

export function coordinatesToGoogleLocation(coords: { lat: number; lng: number }): string {
    return `${coords.lat},${coords.lng}`;
}
