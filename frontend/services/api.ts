import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// QA-1: Use EXPO_PUBLIC_API_URL for production deployments.
// Falls back to localhost (web) or Android emulator address.
export const API_URL = process.env.EXPO_PUBLIC_API_URL
    ?? (Platform.OS === 'web'
        ? '/api'
        : 'http://10.0.2.2:3000/api'); // Android emulator maps to host machine's localhost

export const TOKEN_KEY = 'cyvhub_session_token';

export const getToken = async () => {
    return await SecureStore.getItemAsync(TOKEN_KEY);
};

export const apiClient = async (endpoint: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    
    // SEC-AUDIT: Only set application/json if body is not FormData
    if (!(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }

    // SEC-AUDIT-6: Web uses HTTP-only cookies — token is sent automatically by the browser.
    // Mobile uses Bearer token from SecureStore in the Authorization header.
    const isWeb = Platform.OS === 'web';
    if (!isWeb) {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
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

