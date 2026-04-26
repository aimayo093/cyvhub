import axios from 'axios';

export class GoogleMapsConfigError extends Error {
    constructor(message = 'Google Maps server key is not configured.') {
        super(message);
        this.name = 'GoogleMapsConfigError';
    }
}

export class GoogleMapsProviderError extends Error {
    constructor(message = 'Google Maps request failed.') {
        super(message);
        this.name = 'GoogleMapsProviderError';
    }
}

export class GoogleMapsValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'GoogleMapsValidationError';
    }
}

const GOOGLE_MAPS_BASE_URL = 'https://maps.googleapis.com/maps/api';
const MAX_LOCATION_LENGTH = 240;

export function getGoogleMapsServerKey(): string {
    const key = process.env.GOOGLE_MAPS_SERVER_KEY;
    if (!key) {
        throw new GoogleMapsConfigError();
    }
    return key;
}

export function sanitizeLocationInput(value: unknown, fieldName = 'address'): string {
    if (typeof value !== 'string') {
        throw new GoogleMapsValidationError(`${fieldName} must be a string.`);
    }

    const sanitized = value
        .trim()
        .replace(/[<>]/g, '')
        .replace(/\s+/g, ' ')
        .slice(0, MAX_LOCATION_LENGTH);

    if (!sanitized) {
        throw new GoogleMapsValidationError(`${fieldName} is required.`);
    }

    return sanitized;
}

export async function googleMapsGet<T>(
    endpoint: string,
    params: Record<string, string | number | boolean | undefined>
): Promise<T> {
    const key = getGoogleMapsServerKey();
    const query = Object.fromEntries(
        Object.entries(params)
            .filter(([, value]) => value !== undefined && value !== '')
            .map(([name, value]) => [name, String(value)])
    );

    const response = await axios.get<T>(`${GOOGLE_MAPS_BASE_URL}/${endpoint}`, {
        params: { ...query, key },
        timeout: 10000,
    });

    return response.data;
}
