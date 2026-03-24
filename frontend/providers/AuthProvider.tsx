import React, { useState, useEffect, useCallback } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { AuthService } from '@/services/AuthService';
import { apiClient } from '@/services/api';
import { DriverProfile, CustomerProfile, AdminProfile, CarrierProfile, UserRole } from '@/types';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [carrier, setCarrier] = useState<CarrierProfile | null>(null);

  const loadProfileForRole = useCallback((role: UserRole, userObj: any) => {
    if (role === 'driver') setDriver(userObj);
    else if (role === 'customer') setCustomer(userObj);
    else if (role === 'admin') setAdmin(userObj);
    else if (role === 'carrier') setCarrier(userObj);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { role, isAuthenticated: verified, user } = await AuthService.verifySession();
        if (verified && role && user) {
          setUserRole(role);
          loadProfileForRole(role, user);
          setIsAuthenticated(true);
        }
      } catch (e) {
        // Error check already handled in AuthService
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [loadProfileForRole]);

  const login = useCallback(async (email: string, password: string, role: UserRole): Promise<{ success: boolean; error?: string }> => {
    const result = await AuthService.authenticate(email, password, role);

    if (result.success && result.user) {
      loadProfileForRole(role, result.user);
      setUserRole(role);
      setIsAuthenticated(true);
      return { success: true };
    }
    return { success: false, error: result.error };
  }, [loadProfileForRole]);

  const signup = useCallback(async (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    role: UserRole,
  ): Promise<{ success: boolean; error?: string }> => {
    const result = await AuthService.signup(firstName, lastName, email, password, role);
    if (!result.success || !result.user) return { success: false, error: result.error };

    loadProfileForRole(role, result.user);
    setUserRole(role);
    setIsAuthenticated(true);
    return { success: true };
  }, [loadProfileForRole]);

  const logout = useCallback(async () => {
    await AuthService.clearSession();
    setIsAuthenticated(false);
    setUserRole(null);
    setDriver(null);
    setCustomer(null);
    setAdmin(null);
    setCarrier(null);
  }, []);

  const updateDriverStatus = useCallback((status: DriverProfile['currentStatus']) => {
    setDriver(prev => prev ? { ...prev, currentStatus: status } : null);
  }, []);

  const updateProfile = useCallback(async (userId: string, updates: Partial<DriverProfile & CustomerProfile & AdminProfile & CarrierProfile>) => {
    try {
      if (!userId) return;

      const response = await apiClient(`/profile/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });

      if (response && response.user) {
        if (userRole === 'driver') {
          setDriver(prev => prev ? { ...prev, ...updates } : null);
        } else if (userRole === 'customer') {
          setCustomer(prev => prev ? { ...prev, ...updates } : null);
        } else if (userRole === 'admin') {
          setAdmin(prev => prev ? { ...prev, ...updates } : null);
        } else if (userRole === 'carrier') {
          setCarrier(prev => prev ? { ...prev, ...updates } : null);
        }
      }
    } catch (e) {
      console.error('Failed to update profile:', e);
      alert('Failed to update profile');
    }
  }, [userRole]);

  return {
    isAuthenticated,
    isLoading,
    userRole,
    driver,
    customer,
    admin,
    carrier,
    login,
    signup,
    logout,
    updateDriverStatus,
    updateProfile,
  };
});

