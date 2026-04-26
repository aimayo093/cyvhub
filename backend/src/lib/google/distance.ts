import { calculateGoogleRouteDistance, RouteDistanceRequest, RouteDistanceResult } from './routes';

export async function calculateRouteDistance(
    request: RouteDistanceRequest
): Promise<RouteDistanceResult> {
    return calculateGoogleRouteDistance(request);
}
