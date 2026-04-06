import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Briefcase,
  Clock,
  CheckCircle,
  Truck,
  AlertTriangle,
  XCircle,
  ChevronRight,
  TrendingUp,
  Zap,
  Plus,
  Search,
  User,
  Building2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useJobs } from '@/providers/JobsProvider';
import { Job } from '@/types';

type JobFilter = 'all' | 'active' | 'completed' | 'cancelled';

function getStatusInfo(status: string) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    DRAFT: { label: 'Draft', color: Colors.textMuted, bg: '#F1F5F9' },
    PENDING_DISPATCH: { label: 'Pending', color: Colors.warning, bg: Colors.warningLight },
    ASSIGNED: { label: 'Assigned', color: Colors.statusAssigned, bg: '#EEF2FF' },
    DRIVER_ACCEPTED: { label: 'Accepted', color: Colors.statusAccepted, bg: '#DBEAFE' },
    EN_ROUTE_TO_PICKUP: { label: 'En Route', color: Colors.statusEnRoute, bg: Colors.warningLight },
    ARRIVED_PICKUP: { label: 'At Pickup', color: Colors.statusArrived, bg: Colors.infoLight },
    PICKED_UP: { label: 'Picked Up', color: Colors.statusPickedUp, bg: Colors.purpleLight },
    EN_ROUTE_TO_DROPOFF: { label: 'Delivering', color: Colors.primary, bg: '#DBEAFE' },
    ARRIVED_DROPOFF: { label: 'At Dropoff', color: Colors.success, bg: Colors.successLight },
    DELIVERED: { label: 'Delivered', color: Colors.statusDelivered, bg: Colors.successLight },
    COMPLETED: { label: 'Completed', color: Colors.success, bg: Colors.successLight },
    FAILED: { label: 'Failed', color: Colors.statusFailed, bg: Colors.dangerLight },
    CANCELLED: { label: 'Cancelled', color: Colors.statusCancelled, bg: '#F1F5F9' },
  };
  return map[status] ?? { label: status, color: Colors.textMuted, bg: '#F1F5F9' };
}

export default function ManageJobsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { jobs: allJobs, isLoading: loading, refreshJobs } = useJobs();
  const [activeFilter, setActiveFilter] = useState<JobFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refreshJobs();
  }, [refreshJobs]);

  const filteredJobs = useMemo(() => {
    let result = allJobs;
    switch (activeFilter) {
      case 'active':
        result = result.filter((j: any) => !['DELIVERED', 'COMPLETED', 'FAILED', 'CANCELLED'].includes(j.status));
        break;
      case 'completed':
        result = result.filter((j: any) => ['DELIVERED', 'COMPLETED'].includes(j.status));
        break;
      case 'cancelled':
        result = result.filter((j: any) => ['FAILED', 'CANCELLED'].includes(j.status));
        break;
    }

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      result = result.filter((j: any) =>
        j.jobNumber.toLowerCase().includes(q) ||
        j.pickupCity.toLowerCase().includes(q) ||
        j.dropoffCity.toLowerCase().includes(q) ||
        (j.customer?.businessAccount?.tradingName?.toLowerCase().includes(q))
      );
    }

    return result;
  }, [activeFilter, allJobs, searchQuery]);

  const stats = useMemo(() => ({
    total: allJobs.length,
    active: allJobs.filter((j: any) => !['DELIVERED', 'COMPLETED', 'FAILED', 'CANCELLED'].includes(j.status)).length,
    completed: allJobs.filter((j: any) => ['DELIVERED', 'COMPLETED'].includes(j.status)).length,
    revenue: allJobs.reduce((sum: number, j: any) => sum + (j.calculatedPrice || 0), 0),
  }), [allJobs]);

  const filters: { key: JobFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: allJobs.length },
    { key: 'active', label: 'Active', count: stats.active },
    { key: 'completed', label: 'Done', count: stats.completed },
    { key: 'cancelled', label: 'Failed', count: allJobs.filter((j: any) => ['FAILED', 'CANCELLED'].includes(j.status)).length },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Operations Master</Text>
            <Text style={styles.headerSubtitle}>Full platform job visibility</Text>
          </View>
          <TouchableOpacity style={styles.createButton} onPress={() => router.push('/admin-create-job' as any)}>
            <Plus size={16} color={Colors.textInverse} />
            <Text style={styles.createButtonText}>Create</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <Search size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by ID, city, or business..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Zap size={14} color={Colors.warning} />
            <Text style={styles.statValue}>{stats.active}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statItem}>
            <CheckCircle size={14} color={Colors.success} />
            <Text style={styles.statValue}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Done</Text>
          </View>
          <View style={styles.statItem}>
            <TrendingUp size={14} color={Colors.adminPrimary} />
            <Text style={styles.statValue}>£{(stats.revenue / 1000).toFixed(1)}k</Text>
            <Text style={styles.statLabel}>Volume</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {filters.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
              onPress={() => {
                setActiveFilter(f.key);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, activeFilter === f.key && styles.filterChipTextActive]}>
                {f.label} ({f.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={Colors.adminPrimary} />
        }
      >
        {filteredJobs.map((job: any) => {
          const statusInfo = getStatusInfo(job.status);
          const businessName = job.customer?.businessAccount?.tradingName || 'Retail Customer';
          
          return (
            <TouchableOpacity
              key={job.id}
              style={styles.jobCard}
              activeOpacity={0.7}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({ pathname: '/job-detail' as any, params: { id: job.id } });
              }}
            >
              <View style={styles.jobCardTop}>
                <View style={styles.jobNumberWrap}>
                  <Briefcase size={13} color={Colors.adminPrimary} />
                  <Text style={styles.jobNumber}>{job.jobNumber}</Text>
                </View>
                <View style={[styles.jobStatus, { backgroundColor: statusInfo.bg }]}>
                  <Text style={[styles.jobStatusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                </View>
              </View>

              <View style={styles.jobRoute}>
                <View style={styles.routePoint}>
                  <View style={[styles.routeDot, { backgroundColor: Colors.success }]} />
                  <Text style={styles.routeText} numberOfLines={1}>{job.pickupCity}</Text>
                </View>
                <ChevronRight size={14} color={Colors.textMuted} />
                <View style={styles.routePoint}>
                  <View style={[styles.routeDot, { backgroundColor: Colors.danger }]} />
                  <Text style={styles.routeText} numberOfLines={1}>{job.dropoffCity}</Text>
                </View>
              </View>

              <View style={styles.jobCardBottom}>
                <Text style={styles.jobBusiness}>{businessName}</Text>
                <Text style={styles.jobPrice}>£{(job.calculatedPrice || 0).toFixed(2)}</Text>
              </View>

              <View style={styles.jobAssignments}>
                <View style={[styles.assignmentBox, job.customer ? styles.assignmentActive : null]}>
                  <User size={12} color={job.customer ? Colors.customerPrimary : Colors.textMuted} />
                  <Text style={[styles.assignmentText, job.customer ? null : styles.assignmentTextEmpty]}>
                    {job.customer ? `${job.customer.firstName} ${job.customer.lastName}` : 'Guest'}
                  </Text>
                </View>
                <View style={[styles.assignmentBox, job.assignedDriver ? styles.assignmentActive : null]}>
                  <Truck size={12} color={job.assignedDriver ? Colors.primary : Colors.textMuted} />
                  <Text style={[styles.assignmentText, job.assignedDriver ? null : styles.assignmentTextEmpty]}>
                    {job.assignedDriver ? `${job.assignedDriver.firstName} ${job.assignedDriver.lastName}` : (job.assignedCarrier?.carrierProfile?.tradingName || 'Unassigned')}
                  </Text>
                </View>
              </View>

              {job.priority === 'URGENT' && (
                <View style={styles.urgentBadge}>
                  <AlertTriangle size={10} color={Colors.danger} />
                  <Text style={styles.urgentText}>URGENT</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {filteredJobs.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Briefcase size={40} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No jobs found</Text>
            <Text style={styles.emptySubtitle}>Try a different filter or search</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.navy, paddingHorizontal: 20, paddingBottom: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 22, fontWeight: '800' as const, color: Colors.textInverse },
  headerSubtitle: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  createButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.adminPrimary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, gap: 6 },
  createButtonText: { color: Colors.textInverse, fontWeight: '700' as const, fontSize: 13 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 10, paddingHorizontal: 12, height: 42, marginBottom: 16, gap: 10 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statItem: { flex: 1, backgroundColor: Colors.navyLight, borderRadius: 12, paddingVertical: 12, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 17, fontWeight: '700' as const, color: Colors.textInverse },
  statLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '500' as const },
  filterRow: { gap: 8 },
  filterChip: { backgroundColor: Colors.navyLight, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  filterChipActive: { backgroundColor: Colors.adminPrimary },
  filterChipText: { fontSize: 13, fontWeight: '600' as const, color: Colors.textMuted },
  filterChipTextActive: { color: '#FFFFFF' },
  body: { flex: 1 },
  bodyContent: { padding: 16 },
  jobCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  jobCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  jobNumberWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  jobNumber: { fontSize: 14, fontWeight: '700' as const, color: Colors.text },
  jobStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  jobStatusText: { fontSize: 11, fontWeight: '700' as const },
  jobRoute: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  routePoint: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 },
  routeDot: { width: 8, height: 8, borderRadius: 4 },
  routeText: { fontSize: 13, color: Colors.textSecondary, flex: 1 },
  jobCardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  jobBusiness: { fontSize: 12, color: Colors.textMuted, fontWeight: '500' as const },
  jobPrice: { fontSize: 15, fontWeight: '700' as const, color: Colors.text },
  jobAssignments: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: 12, marginTop: 12 },
  assignmentBox: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 6, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed' },
  assignmentActive: { borderStyle: 'solid', backgroundColor: Colors.surface },
  assignmentText: { fontSize: 11, fontWeight: '600' as const, color: Colors.text },
  assignmentTextEmpty: { color: Colors.textMuted },
  urgentBadge: { position: 'absolute', top: 0, right: 0, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dangerLight, paddingHorizontal: 8, paddingVertical: 3, borderTopRightRadius: 14, borderBottomLeftRadius: 8, gap: 4 },
  urgentText: { fontSize: 9, fontWeight: '800' as const, color: Colors.danger },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700' as const, color: Colors.text },
  emptySubtitle: { fontSize: 13, color: Colors.textSecondary },
});
