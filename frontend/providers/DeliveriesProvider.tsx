import React, { useState, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { apiClient } from '@/services/api';
import { useAuth } from './AuthProvider';
import { Delivery, DeliveryStatus, PaymentStatus } from '@/types';

export const [DeliveriesProvider, useDeliveries] = createContextHook(() => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const { isAuthenticated } = useAuth();

  const loadDeliveries = useCallback(async () => {
    if (!isAuthenticated) {
      setDeliveries([]);
      return;
    }
    try {
      const response = await apiClient('/deliveries');
      setDeliveries(response.data || []);
    } catch (e) {
      console.error('Failed to load deliveries:', e);
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

  const getDelivery = useCallback(
    (id: string): Delivery | undefined => deliveries.find(d => d.id === id),
    [deliveries]
  );

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

  const updateDeliveryPayment = useCallback((deliveryId: string, paymentStatus: PaymentStatus) => {
    // Payment update logic
    setDeliveries(prev =>
      prev.map(d => d.id === deliveryId ? { ...d, paymentStatus } : d)
    );
  }, []);

  return {
    deliveries,
    activeDeliveries,
    completedDeliveries,
    getDelivery,
    refreshDeliveries: loadDeliveries,
    createDelivery,
    cancelDelivery,
    updateDeliveryPayment,
  };
});
