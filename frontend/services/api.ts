import { Platform } from 'react-native';
import { getToken, setToken, clearToken, TOKEN_KEY } from './session';

// QA-1: Use EXPO_PUBLIC_API_URL for production deployments.
// Falls back to localhost (web) or Android emulator address.
const baseApi = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'web' ? '' : 'http://localhost:3000');
export const API_URL = baseApi.endsWith('/api') ? baseApi : `${baseApi}/api`;

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

    let response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
        // 'include' sends the HTTP-only session cookie on web; on native this is ignored.
        credentials: 'include',
    });

    // Auto-refresh logic on 401
    if (response.status === 401 && !endpoint.startsWith('/auth/')) {
        try {
            const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
                method: 'POST',
                credentials: 'include',
            });
            if (refreshRes.ok) {
                const refreshData = await refreshRes.json();
                if (refreshData.token) {
                    await setToken(refreshData.token);
                    headers.set('Authorization', `Bearer ${refreshData.token}`);
                    // Retry original request
                    response = await fetch(`${API_URL}${endpoint}`, {
                        ...options,
                        headers,
                        credentials: 'include',
                    });
                }
            }
        } catch (refreshErr) {
            console.warn('[API] Auto-refresh token failed:', refreshErr);
        }
    }

    if (!response.ok) {
        let errorMessage = 'An error occurred';
        let errorCode = 'UNKNOWN_ERROR';
        try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
            errorCode = errorData.code || errorCode;
            
            // Console log the detailed error for debugging in the browser/emulator
            console.error(`[API Error] ${errorCode}: ${errorMessage}`, errorData);
        } catch (e) {
            // Ignored — response body may not be JSON
        }
        
        const error: any = new Error(errorMessage);
        error.code = errorCode;
        error.response = response;
        throw error;
    }

    return response.json();
};

