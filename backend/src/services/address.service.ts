import axios from 'axios';

const API_KEY = process.env.GETADDRESS_API_KEY;

export interface AddressResult {
    id: string;
    line1: string;
    line2?: string;
    townCity: string;
    county?: string;
    postcode: string;
    latitude: number;
    longitude: number;
    formatted: string;
}

export class AddressService {
    /**
     * Resolves a UK postcode to a list of street-level addresses.
     * Fallback to postcodes.io if getAddress.io is unavailable.
     */
    static async findAddresses(postcode: string): Promise<AddressResult[]> {
        const cleanPostcode = postcode.replace(/\s/g, '').toUpperCase();
        
        // 1. Try getAddress.io if key is available
        if (API_KEY) {
            try {
                const response = await axios.get(`https://api.getaddress.io/find/${cleanPostcode}`, {
                    params: {
                        'api-key': API_KEY,
                        'expand': true
                    }
                });

                if (response.data && response.data.addresses) {
                    return response.data.addresses.map((addr: any, index: number) => ({
                        id: `${cleanPostcode}-${index}`,
                        line1: addr.line_1 || addr.formatted_address[0],
                        line2: addr.line_2 || '',
                        townCity: addr.town_or_city,
                        county: addr.county || '',
                        postcode: cleanPostcode,
                        latitude: response.data.latitude,
                        longitude: response.data.longitude,
                        formatted: [addr.line_1, addr.line_2, addr.town_or_city, cleanPostcode].filter(Boolean).join(', ')
                    }));
                }
            } catch (error: any) {
                console.warn('[AddressService] getAddress.io failed, falling back to postcodes.io:', error.message);
            }
        }

        // 2. Fallback to postcodes.io (Postcode-level only)
        try {
            const pcResponse = await axios.get(`https://api.postcodes.io/postcodes/${cleanPostcode}`);
            const result = pcResponse.data.result;

            // Return a single "manual" entry with Town/City auto-filled
            return [{
                id: `manual-${cleanPostcode}`,
                line1: '', // User to fill
                line2: '',
                townCity: result.parliamentary_constituency || result.admin_district || '',
                county: result.admin_county || '',
                postcode: cleanPostcode,
                latitude: result.latitude,
                longitude: result.longitude,
                formatted: `${cleanPostcode} (Manual Entry Required)`
            }];
        } catch (error: any) {
            console.error('[AddressService] Both services failed:', error.message);
            throw new Error('Invalid postcode or lookup service unavailable.');
        }
    }

    /**
     * Autocomplete suggestions for UK postcodes and addresses.
     * Only works if getAddress.io key is provided.
     */
    static async autocomplete(query: string) {
        if (!API_KEY) {
            // If no API key, we don't return suggestions (UI will wait for full postcode)
            return [];
        }
        
        try {
            const response = await axios.get(`https://api.getaddress.io/autocomplete/${encodeURIComponent(query)}`, {
                params: { 'api-key': API_KEY }
            });

            return response.data.suggestions.map((s: any) => ({
                id: s.id,
                description: s.address
            }));
        } catch (error: any) {
            console.error('[AddressService] Autocomplete failed:', error.message);
            return [];
        }
    }

    /**
     * Resolve a specific suggestion ID to a full address.
     */
    static async getDetail(id: string) {
        if (!API_KEY) throw new Error('Address service not configured.');
        
        try {
            const response = await axios.get(`https://api.getaddress.io/get/${id}`, {
                params: { 'api-key': API_KEY }
            });

            const addr = response.data;
            return {
                line1: addr.line_1,
                line2: addr.line_2,
                townCity: addr.town_or_city,
                county: addr.county,
                postcode: addr.postcode,
                latitude: addr.latitude,
                longitude: addr.longitude
            };
        } catch (error: any) {
            console.error('[AddressService] Get detail failed:', error.message);
            throw new Error('Could not retrieve address details.');
        }
    }
}
