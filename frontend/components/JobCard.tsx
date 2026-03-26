import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin, Clock, Truck, ChevronRight, AlertTriangle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Job, JobStatus } from '@/types';

interface JobCardProps {
  job: Job;
  onPress: () => void;
  compact?: boolean;
  isCurrent?: boolean;
  isDark?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
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

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export default React.memo(function JobCard({ job, onPress, compact, isCurrent, isDark }: JobCardProps) {
  const statusInfo = STATUS_CONFIG[job.status] ?? { label: job.status, color: Colors.textMuted, bg: '#F3F4F6' };

  return (
    <TouchableOpacity
      style={[
        styles.card, 
        compact && styles.cardCompact,
        isCurrent && styles.cardCurrent,
        isDark && styles.cardDark
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      testID={`job-card-${job.id}`}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.jobNumber, isDark && styles.textWhite]}>{job.jobNumber}</Text>
          {job.businessName && (
            <Text style={[styles.businessName, isDark && styles.textLight]}>{job.businessName}</Text>
          )}
        </View>
        <View style={styles.headerRight}>
          {job.priority === 'URGENT' && (
            <View style={styles.urgentBadge}>
              <AlertTriangle size={10} color={Colors.danger} />
              <Text style={styles.urgentText}>URGENT</Text>
            </View>
          )}
          <View style={[styles.statusBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : statusInfo.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: isDark ? '#FFF' : statusInfo.color }]} />
            <Text style={[styles.statusText, { color: isDark ? '#FFF' : statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.route}>
        <View style={styles.routePoint}>
          <View style={styles.pickupDot} />
          <View style={styles.routeTextWrap}>
            <Text style={styles.routeLabel}>PICKUP</Text>
            <Text style={styles.routeAddress} numberOfLines={1}>
              {job.pickupAddressLine1}, {job.pickupCity}
            </Text>
            <View style={styles.timeRow}>
              <Clock size={11} color={Colors.textMuted} />
              <Text style={styles.timeText}>
                {formatTime(job.pickupWindowStart)} - {formatTime(job.pickupWindowEnd)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.routeLine} />

        <View style={styles.routePoint}>
          <View style={styles.dropoffDot} />
          <View style={styles.routeTextWrap}>
            <Text style={styles.routeLabel}>DROPOFF</Text>
            <Text style={styles.routeAddress} numberOfLines={1}>
              {job.dropoffAddressLine1}, {job.dropoffCity}
            </Text>
            <View style={styles.timeRow}>
              <Clock size={11} color={Colors.textMuted} />
              <Text style={styles.timeText}>
                {formatTime(job.dropoffWindowStart)} - {formatTime(job.dropoffWindowEnd)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {!compact && (
        <View style={styles.footer}>
          <View style={styles.footerItem}>
            <Truck size={13} color={Colors.textMuted} />
            <Text style={styles.footerText}>{job.vehicleType}</Text>
          </View>
          {job.distanceKm != null && (
            <View style={styles.footerItem}>
              <MapPin size={13} color={Colors.textMuted} />
              <Text style={styles.footerText}>{job.distanceKm.toFixed(1)} km</Text>
            </View>
          )}
          <Text style={styles.price}>£{job.calculatedPrice.toFixed(2)}</Text>
          <ChevronRight size={18} color={Colors.textMuted} />
        </View>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardCompact: {
    padding: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  jobNumber: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  businessName: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.dangerLight,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  urgentText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: Colors.danger,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  route: {
    paddingLeft: 2,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  pickupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.success,
    marginTop: 3,
  },
  dropoffDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.danger,
    marginTop: 3,
  },
  routeLine: {
    width: 2,
    height: 16,
    backgroundColor: Colors.border,
    marginLeft: 4,
    marginVertical: 2,
  },
  routeTextWrap: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  routeAddress: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.text,
    marginTop: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  timeText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: 12,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  price: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginLeft: 'auto',
  },
  cardCurrent: {
    borderColor: Colors.primary,
    borderWidth: 2,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  cardDark: {
    backgroundColor: '#1E293B',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  textWhite: {
    color: '#FFFFFF',
  },
  textLight: {
    color: 'rgba(255,255,255,0.7)',
  },
});
