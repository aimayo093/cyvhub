import axios from 'axios';

interface PostcodeData {
    result: {
        latitude: number;
        longitude: number;
    }
}

/**
 * Calculates the distance between two UK postcodes in miles.
 * Uses postcodes.io (Free) and Haversine formula.
 */
export async function calculateMiles(postcodeA: string, postcodeB: string): Promise<number> {
    try {
        // 1. Sanitize input (strip extra spaces and uppercase for postcodes.io compatibility)
        const cleanA = postcodeA.replace(/\s/g, '').toUpperCase();
        const cleanB = postcodeB.replace(/\s/g, '').toUpperCase();

        // 2. Get Coordinates
        const [resA, resB] = await Promise.all([
            axios.get<PostcodeData>(`https://api.postcodes.io/postcodes/${cleanA}`),
            axios.get<PostcodeData>(`https://api.postcodes.io/postcodes/${cleanB}`)
        ]);

        const lat1 = resA.data.result.latitude;
        const lon1 = resA.data.result.longitude;
        const lat2 = resB.data.result.latitude;
        const lon2 = resB.data.result.longitude;

        // 2. Haversine Formula (Air Distance)
        const R = 3958.8; // Earth radius in miles
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
            
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const airDistance = R * c;

        // 3. Road Distance Approximation (Standard 25-30% uplift for UK roads)
        const roadDistance = airDistance * 1.25;

        return Number(roadDistance.toFixed(2));
    } catch (error) {
        console.error('Distance calculation failed:', error);
        // Fallback for demo/dev (approx 50 miles if API fails)
        return 50; 
    }
}
