import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Briefcase, Check, X, MapPin, Clock, AlertTriangle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import { useJobs, useFilteredJobs } from '@/providers/JobsProvider';
import { useCarrier } from '@/providers/CarrierProvider';
import JobCard from '@/components/JobCard';
import { Job } from '@/types';

type FilterTab = 'active' | 'available' | 'upcoming' | 'completed' | 'all';
type CarrierFilterTab = 'assigned' | 'offers' | 'completed' | 'all';

const DRIVER_FILTERS: { key: FilterTab; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'available', label: 'Available' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Done' },
];

const CARRIER_FILTERS: { key: CarrierFilterTab; label: string }[] = [
  { key: 'assigned', label: 'Assigned' },
  { key: 'offers', label: 'Offers' },
  { key: 'completed', label: 'Done' },
  { key: 'all', label: 'All' },
];

function DriverJobsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('active');
  const [refreshing, setRefreshing] = useState(false);
  const filteredJobs = useFilteredJobs(activeFilter);
  const { activeJobs, availableJobs, upcomingJobs, completedJobs } = useJobs();

  const counts = useMemo(() => ({
    active: activeJobs.length,
    available: availableJobs.length,
    upcoming: upcomingJobs.length,
    completed: completedJobs.length,
    all: activeJobs.length + availableJobs.length + completedJobs.length,
  }), [activeJobs, availableJobs, upcomingJobs, completedJobs]);

  const handleJobPress = useCallback((jobId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/job-detail' as any, params: { id: jobId } });
  }, [router]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const renderJob = useCallback(({ item }: { item: Job }) => (
    <JobCard job={item} onPress={() => handleJobPress(item.id)} />
  ), [handleJobPress]);

  const keyExtractor = useCallback((item: Job) => item.id, []);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Jobs</Text>
            <Text style={styles.headerSubtitle}>{filteredJobs.length} jobs found</Text>
          </View>
        </View>
      </View>

      <View style={styles.filterBar}>
        {DRIVER_FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterTab, activeFilter === f.key && styles.filterTabActive]}
            onPress={() => {
              setActiveFilter(f.key);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterLabel, activeFilter === f.key && styles.filterLabelActive]}>
              {f.label}
            </Text>
            {counts[f.key] > 0 && (
              <View style={[styles.filterCount, activeFilter === f.key && styles.filterCountActive]}>
                <Text style={[styles.filterCountText, activeFilter === f.key && styles.filterCountTextActive]}>
                  {counts[f.key]}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredJobs}
        renderItem={renderJob}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Briefcase size={44} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No {activeFilter} jobs</Text>
            <Text style={styles.emptySubtitle}>
              {activeFilter === 'active'
                ? 'Accept an available job to get started'
                : activeFilter === 'available'
                ? 'No new jobs available right now'
                : 'Complete some jobs to see them here'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

function CarrierJobsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<CarrierFilterTab>('assigned');
  const [refreshing, setRefreshing] = useState(false);
  const { assignedJobs, availableJobs, completedJobs, carrierJobs, acceptJob, rejectJob } = useCarrier();

  const getFilteredJobs = useMemo(() => {
    switch (activeFilter) {
      case 'assigned': return assignedJobs;
      case 'offers': return availableJobs;
      case 'completed': return completedJobs;
      default: return [...carrierJobs, ...availableJobs];
    }
  }, [activeFilter, assignedJobs, availableJobs, completedJobs, carrierJobs]);

  const counts = useMemo(() => ({
    assigned: assignedJobs.length,
    offers: availableJobs.length,
    completed: completedJobs.length,
    all: carrierJobs.length + availableJobs.length,
  }), [assignedJobs, availableJobs, completedJobs, carrierJobs]);

  const handleJobPress = useCallback((jobId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/job-detail' as any, params: { id: jobId } });
  }, [router]);

  const handleAccept = useCallback((jobId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    acceptJob(jobId);
  }, [acceptJob]);

  const handleReject = useCallback((jobId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    rejectJob(jobId);
  }, [rejectJob]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const renderCarrierJob = useCallback(({ item }: { item: Job }) => {
    const isOffer = item.status === 'PENDING_DISPATCH';

    return (
      <TouchableOpacity
        style={styles.carrierJobCard}
        onPress={() => handleJobPress(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.carrierJobTop}>
          <View style={styles.carrierJobLeft}>
            <Text style={styles.carrierJobNumber}>{item.jobNumber}</Text>
            <View style={[
              styles.carrierJobPriority,
              { backgroundColor: item.priority === 'URGENT' ? Colors.dangerLight : Colors.infoLight },
            ]}>
              {item.priority === 'URGENT' && <AlertTriangle size={10} color={Colors.danger} />}
              <Text style={[
                styles.carrierJobPriorityText,
                { color: item.priority === 'URGENT' ? Colors.danger : Colors.info },
              ]}>{item.priority}</Text>
            </View>
          </View>
          <Text style={styles.carrierJobPrice}>£{item.calculatedPrice.toFixed(2)}</Text>
        </View>

        <View style={styles.carrierJobRoute}>
          <MapPin size={13} color={Colors.carrierPrimary} />
          <Text style={styles.carrierJobRouteText}>{item.pickupCity} → {item.dropoffCity}</Text>
          <Text style={styles.carrierJobDistance}>{item.distanceKm?.toFixed(1)} km</Text>
        </View>

        <View style={styles.carrierJobMeta}>
          <Text style={styles.carrierJobMetaText}>{item.vehicleType}</Text>
          <Text style={styles.carrierJobMetaDot}>·</Text>
          <Text style={styles.carrierJobMetaText}>{item.categoryName}</Text>
          <Text style={styles.carrierJobMetaDot}>·</Text>
          <Text style={styles.carrierJobMetaText}>{item.businessName}</Text>
        </View>

        {item.slaStatus && (
          <View style={styles.carrierJobSla}>
            <Clock size={12} color={
              item.slaStatus === 'AT_RISK' ? Colors.warning :
              item.slaStatus === 'BREACHED' ? Colors.danger : Colors.success
            } />
            <Text style={[styles.carrierJobSlaText, {
              color: item.slaStatus === 'AT_RISK' ? Colors.warning :
              item.slaStatus === 'BREACHED' ? Colors.danger : Colors.success
            }]}>SLA: {item.slaStatus.replace('_', ' ')}</Text>
          </View>
        )}

        {isOffer && (
          <View style={styles.carrierJobActions}>
            <TouchableOpacity
              style={[styles.carrierActionBtn, styles.carrierRejectBtn]}
              onPress={() => handleReject(item.id)}
              activeOpacity={0.7}
            >
              <X size={16} color={Colors.danger} />
              <Text style={styles.carrierRejectText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.carrierActionBtn, styles.carrierAcceptBtn]}
              onPress={() => handleAccept(item.id)}
              activeOpacity={0.7}
            >
              <Check size={16} color="#FFFFFF" />
              <Text style={styles.carrierAcceptText}>Accept</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  }, [handleJobPress, handleAccept, handleReject]);

  const keyExtractor = useCallback((item: Job) => item.id, []);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Jobs</Text>
            <Text style={styles.headerSubtitle}>{getFilteredJobs.length} jobs found</Text>
          </View>
        </View>
      </View>

      <View style={styles.filterBar}>
        {CARRIER_FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterTab, activeFilter === f.key && styles.carrierFilterActive]}
            onPress={() => {
              setActiveFilter(f.key);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterLabel, activeFilter === f.key && styles.carrierFilterLabelActive]}>
              {f.label}
            </Text>
            {counts[f.key] > 0 && (
              <View style={[styles.filterCount, activeFilter === f.key && styles.carrierFilterCountActive]}>
                <Text style={[styles.filterCountText, activeFilter === f.key && styles.filterCountTextActive]}>
                  {counts[f.key]}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={getFilteredJobs}
        renderItem={renderCarrierJob}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.carrierPrimary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Briefcase size={44} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No {activeFilter} jobs</Text>
            <Text style={styles.emptySubtitle}>
              {activeFilter === 'offers'
                ? 'No new job offers available right now'
                : activeFilter === 'assigned'
                ? 'No jobs currently assigned to you'
                : 'No completed jobs to display'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

export default function JobsScreen() {
  const { userRole } = useAuth();
  if (userRole === 'carrier') return <CarrierJobsScreen />;
  return <DriverJobsScreen />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.navy,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: Colors.textInverse,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
  },
  filterBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.surfaceAlt,
    gap: 4,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
  },
  carrierFilterActive: {
    backgroundColor: Colors.carrierPrimary,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  filterLabelActive: {
    color: Colors.textInverse,
  },
  carrierFilterLabelActive: {
    color: Colors.textInverse,
  },
  filterCount: {
    backgroundColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
  },
  filterCountActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  carrierFilterCountActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  filterCountText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
  },
  filterCountTextActive: {
    color: Colors.textInverse,
  },
  list: {
    padding: 16,
    paddingBottom: 24,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    paddingHorizontal: 24,
  },
  carrierJobCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  carrierJobTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  carrierJobLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  carrierJobNumber: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  carrierJobPriority: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  carrierJobPriorityText: {
    fontSize: 10,
    fontWeight: '700' as const,
  },
  carrierJobPrice: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.carrierPrimary,
  },
  carrierJobRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  carrierJobRouteText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  carrierJobDistance: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  carrierJobMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  carrierJobMetaText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  carrierJobMetaDot: {
    fontSize: 12,
    color: Colors.textMuted,
    marginHorizontal: 6,
  },
  carrierJobSla: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  carrierJobSlaText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  carrierJobActions: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  carrierActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  carrierRejectBtn: {
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: Colors.danger + '30',
  },
  carrierAcceptBtn: {
    backgroundColor: Colors.carrierPrimary,
  },
  carrierRejectText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.danger,
  },
  carrierAcceptText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
