import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// QA-1: Use EXPO_PUBLIC_API_URL for production deployments.
// Falls back to localhost (web) or Android emulator address.
export const API_URL = process.env.EXPO_PUBLIC_API_URL
    ?? (Platform.OS === 'web'
        ? '/api'
        : 'http://localhost:3000/api'); // Default for development locally

export const TOKEN_KEY = 'cyvhub_session_token';

/**
 * SEC-AUDIT-6: Hybrid Auth approach.
 * We store and send the token as a Bearer header on ALL platforms for maximum reliability.
 * On Web, we also set the httpOnly cookie for server-side benefits, but the API client
 * will explicitly send the header to handle cross-origin dev environments.
 */
export const getToken = async () => {
    if (Platform.OS === 'web') {
        return localStorage.getItem(TOKEN_KEY);
    }
    return await SecureStore.getItemAsync(TOKEN_KEY);
};

export const setToken = async (token: string) => {
    if (Platform.OS === 'web') {
        localStorage.setItem(TOKEN_KEY, token);
    } else {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
};

export const clearToken = async () => {
    if (Platform.OS === 'web') {
        localStorage.removeItem(TOKEN_KEY);
    } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
};

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

