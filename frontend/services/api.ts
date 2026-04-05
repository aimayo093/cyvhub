import { Platform } from 'react-native';
import { getToken, setToken, clearToken, TOKEN_KEY } from './session';

// QA-1: Use EXPO_PUBLIC_API_URL for production deployments.
// Falls back to localhost (web) or Android emulator address.
export const API_URL = process.env.EXPO_PUBLIC_API_URL
    ?? (Platform.OS === 'web'
        ? '/api'
        : 'http://localhost:3000/api'); // Default for development locally

export { TOKEN_KEY, getToken, setToken, clearToken };

export const apiClient = async (endpoint: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    
    // SEC-AUDIT: Only set application/json if body is not FormData
    if (!(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }

    // Always attempt to attach the Bearer token if it exists
    const token = await getToken();
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
        // 'include' sends the HTTP-only session cookie on web; on native this is ignored.
        credentials: 'include',
    });

    if (!response.ok) {
        let errorMessage = 'An error occurred';
        try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
        } catch (e) {
            // Ignored — response body may not be JSON
        }
        throw new Error(errorMessage);
    }

    return response.json();
};

