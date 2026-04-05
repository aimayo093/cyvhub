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
        // PRODUCTION RECOVERY: Temporarily disabled client-side lock to bypass state from previous failed routing attempts.
        // const rateLimit = await this.checkRateLimit();
        // if (rateLimit.locked) {
        //     return { success: false, error: `Account locked. Try again in ${rateLimit.waitTimeMinutes} minutes.` };
        // }

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

            // SEC-AUDIT-6: Use unified setToken for hybrid auth
            await setToken(response.token);
            
            // Legacy cleanup (if needed) — optional
            if (Platform.OS !== 'web') {
                await SecureStore.setItemAsync(AUTH_KEY, 'true');
                await SecureStore.setItemAsync(ROLE_KEY, response.user.role);
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
            // SEC-AUDIT-6: Unified auth check for all platforms
            const token = await getToken();
            if (!token) return { role: null, isAuthenticated: false };

            try {
                // Call backend to verify token and get fresh profile
                // The Bearer token is automatically attached by apiClient
                const user = await apiClient('/profile', { method: 'GET' });

                if (user && user.role) {
                    return { role: user.role as UserRole, isAuthenticated: true, user };
                }
            } catch (e) {
                // Token tampered, expired, or server rejected it
                console.warn('Session verification failed, clearing session.');
                await this.clearSession();
            }
        } catch (e) {
            console.error('Session verification failed:', e);
        }

        return { role: null, isAuthenticated: false };
    }

    /**
     * Clears the stored session.
     */
    static async clearSession(): Promise<void> {
        // SEC-AUDIT-6: Hybrid logout
        // Tell server to clear cookie, and clear local bearer token
        try {
            if (Platform.OS === 'web') {
                await apiClient('/auth/logout', { method: 'POST' });
            }
        } catch (e) { /* ignore */ }
        
        await clearToken();
        
        if (Platform.OS !== 'web') {
            await SecureStore.deleteItemAsync(AUTH_KEY);
            await SecureStore.deleteItemAsync(ROLE_KEY);
        }
    }

    // SEC-AUDIT-4: validateAdminAccess() has been removed.
    // Admin access is enforced exclusively at the backend API level via JWT role guards.

    /**
     * Signs up a new user on the backend.
     * Does NOT store a session or log the user in — the user must verify their email first.
     */
    static async signup(
        firstName: string,
        lastName: string,
        email: string,
        password: string,
        role: UserRole,
        phone: string,
    ): Promise<{ success: boolean; error?: string; email?: string }> {
        if (role === 'admin') return { success: false, error: 'Cannot register as an administrator' };

        try {
            const response = await apiClient('/auth/signup', {
                method: 'POST',
                body: JSON.stringify({ firstName, lastName, email, password, role, phone }),
            });

            // Backend returns { message, email } — no token. User must verify email before login.
            return { success: true, email: response.email };
        } catch (e: any) {
            return { success: false, error: e.message || 'Registration failed' };
        }
    }

}
