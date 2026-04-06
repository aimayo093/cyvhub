import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Navigation,
  AlertTriangle,
  Clock,
  ChevronRight,
  Truck,
  Users,
  Zap,
  Target,
  Plus,
  XCircle,
  RefreshCw,
  MessageSquare,
  Edit3,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useJobs } from '@/providers/JobsProvider';
import { Job, SLAStatus } from '@/types';
import AssigneeModal from '@/components/AssigneeModal';

function getSLAStyle(status: SLAStatus) {
  switch (status) {
    case 'ON_TRACK': return { color: Colors.success, bg: Colors.successLight, label: 'On Track' };
    case 'AT_RISK': return { color: Colors.warning, bg: Colors.warningLight, label: 'At Risk' };
    case 'BREACHED': return { color: Colors.danger, bg: Colors.dangerLight, label: 'Breached' };
    case 'MET': return { color: Colors.success, bg: Colors.successLight, label: 'Met' };
    default: return { color: Colors.textMuted, bg: '#F1F5F9', label: status || 'Pending' };
  }
}

function timeSince(dateStr: string): string {
  const now = new Date();
  const past = new Date(dateStr);
  const diffMs = now.getTime() - past.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function DispatchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { jobs, isLoading, refreshJobs, assignJob, cancelJob, addJobNote } = useJobs();
  
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const pendingJobs = useMemo(() => jobs.filter(j => j.status === 'PENDING_DISPATCH'), [jobs]);
  const activeJobs = useMemo(() => jobs.filter(j => 
    ['ASSIGNED', 'DRIVER_ACCEPTED', 'EN_ROUTE_TO_PICKUP', 'ARRIVED_PICKUP', 'PICKED_UP', 'EN_ROUTE_TO_DROPOFF', 'ARRIVED_DROPOFF'].includes(j.status)
  ), [jobs]);
  
  const atRiskCount = useMemo(() => jobs.filter(j => j.slaStatus === 'AT_RISK' || j.slaStatus === 'BREACHED').length, [jobs]);

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refreshJobs();
  }, [refreshJobs]);

  const handleOpenAssign = useCallback((jobId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedJobId(jobId);
    setAssignModalVisible(true);
  }, []);

  const handlePerformAssign = async (assigneeId: string, type: 'driver' | 'carrier') => {
    if (!selectedJobId) return;
    try {
      await assignJob(selectedJobId, type === 'driver' ? { driverId: assigneeId } : { carrierId: assigneeId });
      setAssignModalVisible(false);
      setSelectedJobId(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', `Job assigned to ${type} successfully.`);
    } catch (error) {
       Alert.alert('Assignment Failed', 'Could not assign job. Please try again.');
    }
  };

  const handleAddNote = useCallback((job: Job) => {
    Alert.prompt(
      'Add Internal Note',
      `Notes for ${job.jobNumber} are private to dispatch.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Save', 
          onPress: (text) => {
            if (text) addJobNote(job.id, text);
          } 
        }
      ]
    );
  }, [addJobNote]);

  const handleCancel = useCallback((job: Job) => {
    Alert.alert(
      'Cancel Job',
      `Are you sure you want to cancel ${job.jobNumber}? This will notify the customer.`,
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelJob(job.id, 'Cancelled by Admin');
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            } catch (e) {
              Alert.alert('Error', 'Failed to cancel job.');
            }
          } 
        }
      ]
    );
  }, [cancelJob]);

  const renderJob = useCallback((job: Job) => {
    const slaStyle = getSLAStyle(job.slaStatus as SLAStatus);
    const businessName = (job as any).customer?.businessAccount?.tradingName || 'Retail Customer';

    return (
      <View key={job.id} style={styles.jobCard}>
        <View style={styles.jobTop}>
          <View style={styles.jobNumberWrap}>
            <Text style={styles.jobNumber}>{job.jobNumber}</Text>
            {job.priority === 'URGENT' && (
              <View style={styles.urgentBadge}>
                <AlertTriangle size={9} color={Colors.danger} />
                <Text style={styles.urgentText}>URGENT</Text>
              </View>
            )}
          </View>
          <View style={[styles.slaBadge, { backgroundColor: slaStyle.bg }]}>
            <Target size={10} color={slaStyle.color} />
            <Text style={[styles.slaText, { color: slaStyle.color }]}>{slaStyle.label}</Text>
          </View>
        </View>

        <Text style={styles.businessName}>{businessName}</Text>

        <View style={styles.routeRow}>
          <View style={[styles.routeDot, { backgroundColor: Colors.success }]} />
          <Text style={styles.routeCity}>{job.pickupCity}</Text>
          <ChevronRight size={12} color={Colors.textMuted} />
          <View style={[styles.routeDot, { backgroundColor: Colors.danger }]} />
          <Text style={styles.routeCity}>{job.dropoffCity}</Text>
          {job.distanceKm && <Text style={styles.distance}>{job.distanceKm.toFixed(0)} km</Text>}
        </View>

        <View style={styles.jobBottom}>
          <View style={styles.jobMeta}>
            <Truck size={12} color={Colors.textMuted} />
            <Text style={styles.metaText}>{job.vehicleType}</Text>
          </View>
          <View style={styles.jobMeta}>
            <Clock size={12} color={Colors.textMuted} />
            <Text style={styles.metaText}>{timeSince(job.createdAt)}</Text>
          </View>
          
          <View style={styles.flexFiller} />
          <Text style={styles.price}>£{job.calculatedPrice.toFixed(0)}</Text>
        </View>

        <View style={styles.jobActionsRow}>
          {job.status === 'PENDING_DISPATCH' ? (
            <TouchableOpacity style={[styles.miniAction, { backgroundColor: Colors.primary + '10' }]} onPress={() => handleOpenAssign(job.id)}>
              <Users size={11} color={Colors.primary} />
              <Text style={[styles.miniActionText, { color: Colors.primary }]}>Assign</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.miniAction} onPress={() => handleOpenAssign(job.id)}>
              <RefreshCw size={11} color={Colors.warning} />
              <Text style={[styles.miniActionText, { color: Colors.warning }]}>Reassign</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={styles.miniAction} onPress={() => router.push({ pathname: '/job-detail' as any, params: { id: job.id } })}>
            <Edit3 size={11} color={Colors.textSecondary} />
            <Text style={[styles.miniActionText, { color: Colors.textSecondary }]}>View</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.miniAction} onPress={() => handleAddNote(job)}>
            <MessageSquare size={11} color={Colors.textSecondary} />
            <Text style={[styles.miniActionText, { color: Colors.textSecondary }]}>Note</Text>
          </TouchableOpacity>

          <View style={styles.flexFiller} />
          
          <TouchableOpacity style={styles.miniAction} onPress={() => handleCancel(job)}>
            <XCircle size={11} color={Colors.danger} />
            <Text style={[styles.miniActionText, { color: Colors.danger }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [handleOpenAssign, handleAddNote, handleCancel, router]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Dispatch Console</Text>
            <Text style={styles.headerSubtitle}>Real-time platform operations</Text>
          </View>
          <View style={styles.headerIcon}>
            <Navigation size={20} color={Colors.adminPrimary} />
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderLeftColor: Colors.warning }]}>
            <Zap size={14} color={Colors.warning} />
            <Text style={styles.statValue}>{pendingJobs.length}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: Colors.primary }]}>
            <Truck size={14} color={Colors.primary} />
            <Text style={styles.statValue}>{activeJobs.length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: Colors.danger }]}>
            <AlertTriangle size={14} color={Colors.danger} />
            <Text style={styles.statValue}>{atRiskCount}</Text>
            <Text style={styles.statLabel}>At Risk</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={Colors.adminPrimary} />}
      >
        <TouchableOpacity 
          style={styles.createJobBtn} 
          onPress={() => router.push('/admin-create-job' as any)} 
          activeOpacity={0.7}
        >
          <Plus size={16} color="#FFFFFF" />
          <Text style={styles.createJobBtnText}>Create New Job</Text>
        </TouchableOpacity>

        {pendingJobs.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: Colors.warning }]} />
              <Text style={styles.sectionTitle}>Awaiting Dispatch ({pendingJobs.length})</Text>
            </View>
            {pendingJobs.map(renderJob)}
          </View>
        )}

        {activeJobs.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: Colors.primary }]} />
              <Text style={styles.sectionTitle}>Live Operations ({activeJobs.length})</Text>
            </View>
            {activeJobs.map(renderJob)}
          </View>
        )}

        {jobs.length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <Truck size={40} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No operational jobs</Text>
            <Text style={styles.emptySubtitle}>All clear! Check back later.</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <AssigneeModal
        visible={assignModalVisible}
        onClose={() => { setAssignModalVisible(false); setSelectedJobId(null); }}
        onAssign={handlePerformAssign}
        jobId={selectedJobId || ''}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.navy, paddingHorizontal: 20, paddingBottom: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 22, fontWeight: '800' as const, color: Colors.textInverse },
  headerSubtitle: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  headerIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.adminPrimary + '18', alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, backgroundColor: Colors.navyLight, borderRadius: 10, padding: 10, borderLeftWidth: 3, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 18, fontWeight: '700' as const, color: Colors.textInverse },
  statLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '500' as const },
  body: { flex: 1 },
  bodyContent: { padding: 16 },
  flexFiller: { flex: 1 },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '700' as const, color: Colors.text },
  jobCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  jobTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  jobNumberWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  jobNumber: { fontSize: 14, fontWeight: '700' as const, color: Colors.text },
  businessName: { fontSize: 13, fontWeight: '600' as const, color: Colors.textSecondary, marginBottom: 10 },
  urgentBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dangerLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, gap: 3 },
  urgentText: { fontSize: 9, fontWeight: '800' as const, color: Colors.danger },
  slaBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, gap: 4 },
  slaText: { fontSize: 10, fontWeight: '700' as const },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  routeDot: { width: 8, height: 8, borderRadius: 4 },
  routeCity: { fontSize: 13, color: Colors.text, fontWeight: '500' as const },
  distance: { fontSize: 11, color: Colors.textMuted, marginLeft: 'auto' },
  jobBottom: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  jobMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: Colors.textMuted },
  price: { fontSize: 15, fontWeight: '700' as const, color: Colors.text },
  createJobBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.adminPrimary, borderRadius: 12, paddingVertical: 12, gap: 6, marginBottom: 16 },
  createJobBtnText: { fontSize: 14, fontWeight: '700' as const, color: '#FFFFFF' },
  jobActionsRow: { flexDirection: 'row', gap: 6, marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  miniAction: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: Colors.surfaceAlt },
  miniActionText: { fontSize: 10, fontWeight: '600' as const },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text },
  emptySubtitle: { fontSize: 14, color: Colors.textMuted },
});
