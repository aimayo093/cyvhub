import {
    googleMapsGet,
    GoogleMapsProviderError,
    sanitizeLocationInput,
} from './mapsClient';

type GoogleGeocodeResponse = {
    status: string;
    error_message?: string;
    results: Array<{
        formatted_address: string;
        geometry: {
            location: {
                lat: number;
                lng: number;
            };
        };
        address_components: Array<{
            long_name: string;
            short_name: string;
            types: string[];
        }>;
    }>;
};

export type GeocodeResult = {
    formattedAddress: string;
    lat: number;
    lng: number;
    postcode: string | null;
};

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
    const safeAddress = sanitizeLocationInput(address, 'address');
    const data = await googleMapsGet<GoogleGeocodeResponse>('geocode/json', {
        address: safeAddress,
        region: 'uk',
        components: 'country:GB',
    });

    if (data.status !== 'OK' || !data.results?.[0]) {
        throw new GoogleMapsProviderError(`Geocoding returned ${data.status}`);
    }

    const result = data.results[0];
    const postcodeComponent = result.address_components.find(component =>
        component.types.includes('postal_code')
    );

    return {
        formattedAddress: result.formatted_address,
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        postcode: postcodeComponent?.long_name || postcodeComponent?.short_name || null,
    };
}
