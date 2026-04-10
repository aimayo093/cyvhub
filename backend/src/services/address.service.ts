import axios from 'axios';

const API_KEY = process.env.GETADDRESS_API_KEY;

export class AddressService {
    /**
     * Resolves a UK postcode to a list of street-level addresses.
     */
    static async findAddresses(postcode: string) {
        if (!API_KEY) {
            console.error('[AddressService] Missing GETADDRESS_API_KEY');
            throw new Error('Address service is not configured.');
        }

        const cleanPostcode = postcode.replace(/\s/g, '').toUpperCase();
        
        try {
            const response = await axios.get(`https://api.getaddress.io/find/${cleanPostcode}`, {
                params: {
                    'api-key': API_KEY,
                    'expand': true
                }
            });

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
        } catch (error: any) {
            console.error('[AddressService] Lookup failed:', error.response?.data || error.message);
            if (error.response?.status === 404) {
                throw new Error('Postcode not found.');
            }
            throw new Error('Failed to resolve address. Please try again or enter manually.');
        }
    }

    /**
     * Autocomplete suggestions for UK postcodes and addresses.
     */
    static async autocomplete(query: string) {
        if (!API_KEY) throw new Error('Address service not configured.');
        
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
