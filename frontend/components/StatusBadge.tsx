import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';
import { JobStatus } from '@/types';

interface StatusBadgeProps {
  status: JobStatus;
  large?: boolean;
}

const CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ASSIGNED: { label: 'Assigned', color: Colors.statusAssigned, bg: '#EEF2FF' },
  DRIVER_ACCEPTED: { label: 'Accepted', color: Colors.statusAccepted, bg: '#EFF6FF' },
  EN_ROUTE_TO_PICKUP: { label: 'En Route to Pickup', color: Colors.statusEnRoute, bg: '#FEF3C7' },
  ARRIVED_PICKUP: { label: 'At Pickup', color: Colors.statusArrived, bg: '#CFFAFE' },
  PICKED_UP: { label: 'Picked Up', color: Colors.statusPickedUp, bg: '#EDE9FE' },
  EN_ROUTE_TO_DROPOFF: { label: 'En Route to Dropoff', color: '#7C3AED', bg: '#EDE9FE' },
  ARRIVED_DROPOFF: { label: 'At Dropoff', color: Colors.statusDelivered, bg: '#D1FAE5' },
  DELIVERED: { label: 'Delivered', color: Colors.statusDelivered, bg: '#D1FAE5' },
  FAILED: { label: 'Failed', color: Colors.statusFailed, bg: '#FEE2E2' },
  CANCELLED: { label: 'Cancelled', color: Colors.statusCancelled, bg: '#F3F4F6' },
};

export default React.memo(function StatusBadge({ status, large }: StatusBadgeProps) {
  const info = CONFIG[status] ?? { label: status, color: Colors.textMuted, bg: '#F3F4F6' };

  return (
    <View style={[styles.badge, { backgroundColor: info.bg }, large && styles.badgeLarge]}>
      <View style={[styles.dot, { backgroundColor: info.color }]} />
      <Text style={[styles.label, { color: info.color }, large && styles.labelLarge]}>
        {info.label}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
  },
  badgeLarge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  labelLarge: {
    fontSize: 13,
  },
});
