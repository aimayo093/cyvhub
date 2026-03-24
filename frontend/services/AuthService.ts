import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { UserRole } from '@/types';
import { apiClient, TOKEN_KEY } from './api';

const AUTH_KEY = 'cyvhub_auth_v2';
const ROLE_KEY = 'cyvhub_role_v2';

// SEC-AUDIT-4: The EXPO_PUBLIC_ADMIN_KEY has been removed.
// Any EXPO_PUBLIC_* variable is embedded in the JS bundle and is NOT a secret.
// The admin portal is now accessible directly on web; actual data access is enforced
// by the backend JWT role check (role === 'admin'), which cannot be bypassed client-side.

export class AuthService {
    /**
     * Rate Limiter for SEC-07 Audit Fix
     * (Client-side for UX — the backend also enforces its own rate limit).
     */
    static async checkRateLimit(): Promise<{ locked: boolean; waitTimeMinutes?: number }> {
        const lockTimeStr = await SecureStore.getItemAsync('cyvhub_auth_lock_time');
        if (lockTimeStr) {
            const lockTime = parseInt(lockTimeStr, 10);
            const now = Date.now();
            if (now < lockTime) {
                return { locked: true, waitTimeMinutes: Math.ceil((lockTime - now) / 60000) };
            } else {
                await SecureStore.deleteItemAsync('cyvhub_auth_lock_time');
                await SecureStore.deleteItemAsync('cyvhub_auth_attempts');
            }
        }
        return { locked: false };
    }

    static async recordFailedAttempt(): Promise<void> {
        const attemptsStr = await SecureStore.getItemAsync('cyvhub_auth_attempts');
        const attempts = attemptsStr ? parseInt(attemptsStr, 10) + 1 : 1;

        if (attempts >= 5) {
            const lockTime = Date.now() + (10 * 60 * 1000);
            await SecureStore.setItemAsync('cyvhub_auth_lock_time', lockTime.toString());
        } else {
            await SecureStore.setItemAsync('cyvhub_auth_attempts', attempts.toString());
        }
    }

    /**
     * Authenticates via the real backend
     */
    static async authenticate(email: string, password: string, role: UserRole): Promise<{ success: boolean; token?: string; error?: string; user?: any }> {
        const rateLimit = await this.checkRateLimit();
        if (rateLimit.locked) {
            return { success: false, error: `Account locked. Try again in ${rateLimit.waitTimeMinutes} minutes.` };
        }

        try {
            const response = await apiClient('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });

            // QA-3: Verify the backend role matches the selected portal for ALL roles
            if (response.user.role !== role) {
                return { success: false, error: 'Account does not have privileges for this portal.' };
            }

            // Reset attempts on success
            await SecureStore.deleteItemAsync('cyvhub_auth_attempts');
            await SecureStore.deleteItemAsync('cyvhub_auth_lock_time');

            // SEC-AUDIT-6: On web, the browser manages the HTTP-only cookie automatically.
            // Only store the token in SecureStore on native mobile platforms.
            if (Platform.OS !== 'web') {
                await SecureStore.setItemAsync(AUTH_KEY, 'true');
                await SecureStore.setItemAsync(ROLE_KEY, response.user.role);
                await SecureStore.setItemAsync(TOKEN_KEY, response.token);
            }

            return { success: true, token: response.token, user: response.user };
        } catch (e: any) {
            await this.recordFailedAttempt();
            return { success: false, error: e.message || 'Invalid email or password' };
        }
    }

    /**
     * Verifies the stored session and returns the user role / profile from the backend
     */
    static async verifySession(): Promise<{ role: UserRole | null; isAuthenticated: boolean; user?: any }> {
        try {
            if (Platform.OS === 'web') {
                // SEC-AUDIT-6: Web auth uses HTTP-only cookies — just call the API and let
                // the browser attach the cookie automatically. No SecureStore check needed.
                try {
                    const user = await apiClient('/profile', { method: 'GET' });
                    if (user && user.role) {
                        return { role: user.role as UserRole, isAuthenticated: true, user };
                    }
                } catch (e) {
                    // Cookie absent, expired, or invalid
                }
            } else {
                // Mobile: check SecureStore first to avoid a network call when not logged in
                const auth = await SecureStore.getItemAsync(AUTH_KEY);
                const token = await SecureStore.getItemAsync(TOKEN_KEY);

                if (auth === 'true' && token) {
                    try {
                        // Call backend to verify token and get fresh profile
                        const user = await apiClient('/profile', { method: 'GET' });

                        if (user && user.role) {
                            return { role: user.role as UserRole, isAuthenticated: true, user };
                        }
                    } catch (e) {
                        // Token tampered, expired, or server rejected it
                        await this.clearSession();
                    }
                }
            }
        } catch (e) {
            console.error('Session verification failed:', e);
        }

        return { role: null, isAuthenticated: false };
    }

    /**
     * Clears the stored session.
     * On web: calls the backend /logout endpoint to clear the server-side HTTP-only cookie.
     * On mobile: deletes the token from SecureStore.
     */
    static async clearSession(): Promise<void> {
        if (Platform.OS === 'web') {
            // SEC-AUDIT-6: Tell the server to expire the HTTP-only cookie
            try {
                await apiClient('/auth/logout', { method: 'POST' });
            } catch (e) {
                // Ignore errors — session is best-effort cleared
            }
        } else {
            await SecureStore.deleteItemAsync(AUTH_KEY);
            await SecureStore.deleteItemAsync(ROLE_KEY);
            await SecureStore.deleteItemAsync(TOKEN_KEY);
        }
    }

    // SEC-AUDIT-4: validateAdminAccess() has been removed.
    // Admin access is enforced exclusively at the backend API level via JWT role guards.

    /**
     * Signs up a new user on the backend
     */
    static async signup(firstName: string, lastName: string, email: string, password: string, role: UserRole): Promise<{ success: boolean; error?: string; user?: any }> {
        if (role === 'admin') return { success: false, error: 'Cannot register as an administrator' };

        try {
            const response = await apiClient('/auth/signup', {
                method: 'POST',
                body: JSON.stringify({ firstName, lastName, email, password, role }),
            });

            // SEC-AUDIT-6: On web, the browser manages the session cookie automatically.
            // Only store token in SecureStore on native mobile platforms.
            if (Platform.OS !== 'web') {
                await SecureStore.setItemAsync(AUTH_KEY, 'true');
                await SecureStore.setItemAsync(ROLE_KEY, response.user.role);
                await SecureStore.setItemAsync(TOKEN_KEY, response.token);
            }

            return { success: true, user: response.user };
        } catch (e: any) {
            return { success: false, error: e.message || 'Registration failed' };
        }
    }
}
