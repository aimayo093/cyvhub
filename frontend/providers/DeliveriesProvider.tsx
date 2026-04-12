import React, { useState, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { apiClient } from '@/services/api';
import { useAuth } from './AuthProvider';
import { Delivery, DeliveryStatus, PaymentStatus } from '@/types';

export const [DeliveriesProvider, useDeliveries] = createContextHook(() => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const loadDeliveries = useCallback(async () => {
    if (!isAuthenticated) {
      setDeliveries([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient('/deliveries');
      setDeliveries(response.data || response || []);
    } catch (e: any) {
      console.error('Failed to load deliveries:', e);
      setError(e?.message || 'Failed to load deliveries');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Load initially when user changes
  React.useEffect(() => {
    loadDeliveries();
  }, [loadDeliveries]);

  const activeDeliveries = useMemo(
    () => deliveries.filter(d => !['DELIVERED', 'CANCELLED'].includes(d.status)),
    [deliveries]
  );

  const completedDeliveries = useMemo(
    () => deliveries.filter(d => d.status === 'DELIVERED'),
    [deliveries]
  );

  const getDelivery = useCallback((id: string) => {
    if (!id) return undefined;
    return deliveries.find(d => d.id === id);
  }, [deliveries]);

  const createDelivery = useCallback(async (delivery: Omit<Delivery, 'id' | 'trackingNumber' | 'createdAt' | 'status'>) => {
    try {
      const response = await apiClient('/deliveries', {
        method: 'POST',
        body: JSON.stringify(delivery)
      });
      setDeliveries(prev => [response.data, ...prev]);
      return response.data;
    } catch (e) {
      console.error('Failed to create delivery:', e);
      throw e;
    }
  }, []);

  const cancelDelivery = useCallback(async (id: string) => {
    try {
      await apiClient(`/deliveries/${id}/cancel`, { method: 'PATCH' });
      setDeliveries(prev =>
        prev.map(d => d.id === id ? { ...d, status: 'CANCELLED' as DeliveryStatus } : d)
      );
    } catch (e) {
      console.error('Failed to cancel delivery:', e);
    }
  }, []);

  const updateDeliveryPayment = useCallback(async (deliveryId: string, paymentStatus: PaymentStatus) => {
    // 1. Optimistic update — instant UI feedback
    setDeliveries(prev =>
      prev.map(d => d.id === deliveryId ? { ...d, paymentStatus } : d)
    );
    // 2. Persist to backend so the status survives page refresh
    try {
      await apiClient(`/deliveries/${deliveryId}`, {
        method: 'PATCH',
        body: JSON.stringify({ paymentStatus }),
      });
    } catch (e) {
      console.warn('[DeliveriesProvider] Failed to persist paymentStatus to backend:', e);
    }
    // 3. Re-fetch full list from server to get the canonical state
    await loadDeliveries();
  }, [loadDeliveries]);

  return {
    deliveries,
    isLoading,
    error,
    activeDeliveries,
    completedDeliveries,
    getDelivery,
    refreshDeliveries: loadDeliveries,
    createDelivery,
    cancelDelivery,
    updateDeliveryPayment,
  };
});
