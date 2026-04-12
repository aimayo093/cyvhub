import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import Colors from '@/constants/colors';
import { useDeliveries } from '@/providers/DeliveriesProvider';
import { useAuth } from '@/providers/AuthProvider';
import { ResponsiveContainer } from '@/components/ResponsiveContainer';
import { DeliveryForm } from '@/components/DeliveryForm';

export default function BookDeliveryScreen() {
  const router = useRouter();
  const { createDelivery } = useDeliveries();
  const { customer } = useAuth();
  const params = useLocalSearchParams();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialData = useMemo(() => {
    const data: any = {};
    if (params.prePickup) data.pickup = { postcode: params.prePickup as string, latitude: 0, longitude: 0 };
    if (params.preDropoff) data.dropoff = { postcode: params.preDropoff as string, latitude: 0, longitude: 0 };
    if (params.preVehicle) data.vehicleType = params.preVehicle as string;
    if (params.prePrice) data.estimatedPrice = parseFloat(params.prePrice as string) || 0;
    return data;
  }, [params]);

  const handleSubmit = useCallback(async (formData: any) => {
    setIsSubmitting(true);
    try {
      const delivery = await createDelivery({
        pickupAddressLine1: formData.pickup.line1,
        pickupAddressLine2: formData.pickup.line2,
        pickupCity: formData.pickup.townCity,
        pickupPostcode: formData.pickup.postcode,
        pickupLatitude: formData.pickup.latitude,
        pickupLongitude: formData.pickup.longitude,
        pickupContactName: formData.pickupContactName,
        pickupContactPhone: customer?.phone || '',

        dropoffAddressLine1: formData.dropoff.line1,
        dropoffAddressLine2: formData.dropoff.line2,
        dropoffCity: formData.dropoff.townCity,
        dropoffPostcode: formData.dropoff.postcode,
        dropoffLatitude: formData.dropoff.latitude,
        dropoffLongitude: formData.dropoff.longitude,
        dropoffContactName: formData.dropoffContactName,
        dropoffContactPhone: customer?.phone || '',

        parcels: formData.parcels,
        vehicleType: formData.vehicleType,
        estimatedPrice: formData.estimatedPrice,
        estimatedPickup: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        estimatedDelivery: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
        jobType: formData.jobType,
        specialInstructions: formData.specialInstructions,
        pickupTimeWindow: formData.pickupTimeWindow,
        deliveryTimeWindow: formData.deliveryTimeWindow,
        isReadyNow: formData.isReadyNow,
        businessAccountId: customer?.businessAccountId || undefined,
        quoteId: params.quoteId || undefined,
      } as any);

      router.push({
        pathname: '/payment-checkout' as any,
        params: {
          deliveryId: delivery.id,
          trackingNumber: delivery.trackingNumber,
          amount: formData.totalIncVat.toFixed(2),
          description: `Delivery ${delivery.trackingNumber}`,
        }
      });
    } catch (error: any) {
      console.error('Delivery creation failed:', error);
      Alert.alert('Booking Failed', error?.message || 'Failed to create delivery booking.');
    } finally {
      setIsSubmitting(false);
    }
  }, [createDelivery, customer, params.quoteId, router]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Book a Delivery',
          headerStyle: { backgroundColor: Colors.navy },
          headerTintColor: Colors.textInverse,
          headerTitleStyle: { fontWeight: '600' as const },
        }}
      />

      <ResponsiveContainer scrollable={true} backgroundColor={Colors.background}>
        <View style={styles.contentInner}>
          <DeliveryForm 
            mode="booking"
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            initialData={initialData}
          />
          <View style={{ height: 40 }} />
        </View>
      </ResponsiveContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentInner: {
    paddingVertical: 16,
    paddingHorizontal: 0,
  },
});
