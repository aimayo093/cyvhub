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
import {
  Navigation,
  AlertTriangle,
  CheckCircle,
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
import { DispatchJob, SLAStatus } from '@/types';

const MOCK_DISPATCH_JOBS: any[] = [
  { id: '1', jobNumber: 'CYV-8910', status: 'PENDING_DISPATCH', pickupCity: 'London', dropoffCity: 'Birmingham', vehicleType: 'LWB Van', calculatedPrice: 145.50, priority: 'URGENT', slaTarget: new Date(Date.now() + 3600000).toISOString(), slaStatus: 'AT_RISK', distanceKm: 185 },
  { id: '2', jobNumber: 'CYV-8911', status: 'DISPATCHED', assignedTo: 'D-412', assignedType: 'DRIVER', pickupCity: 'Manchester', dropoffCity: 'Liverpool', vehicleType: 'SWB Van', calculatedPrice: 85.00, priority: 'STANDARD', slaTarget: new Date(Date.now() + 7200000).toISOString(), slaStatus: 'ON_TRACK', distanceKm: 55 },
  { id: '3', jobNumber: 'CYV-8912', status: 'PENDING_DISPATCH', pickupCity: 'Bristol', dropoffCity: 'Cardiff', vehicleType: 'Luton', calculatedPrice: 110.00, priority: 'STANDARD', slaTarget: new Date(Date.now() + 14400000).toISOString(), slaStatus: 'ON_TRACK', distanceKm: 70 },
  { id: '4', jobNumber: 'CYV-8913', status: 'AT_PICKUP', assignedTo: 'C-882 (FastRoute)', assignedType: 'CARRIER', pickupCity: 'Leeds', dropoffCity: 'Newcastle', vehicleType: 'HGV', calculatedPrice: 450.00, priority: 'STANDARD', slaTarget: new Date(Date.now() - 1800000).toISOString(), slaStatus: 'BREACHED', distanceKm: 160 },
];

function getSLAStyle(status: SLAStatus) {
  switch (status) {
    case 'ON_TRACK': return { color: Colors.success, bg: Colors.successLight, label: 'On Track' };
    case 'AT_RISK': return { color: Colors.warning, bg: Colors.warningLight, label: 'At Risk' };
    case 'BREACHED': return { color: Colors.danger, bg: Colors.dangerLight, label: 'Breached' };
    case 'MET': return { color: Colors.success, bg: Colors.successLight, label: 'Met' };
    default: return { color: Colors.textMuted, bg: '#F1F5F9', label: status };
  }
}

function timeUntil(dateStr: string): string {
  const now = new Date();
  const target = new Date(dateStr);
  const diffMs = target.getTime() - now.getTime();
  if (diffMs < 0) return 'Overdue';
  const hours = Math.floor(diffMs / 3600000);
  const mins = Math.floor((diffMs % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export default function DispatchScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const pendingJobs = useMemo(() => MOCK_DISPATCH_JOBS.filter(j => j.status === 'PENDING_DISPATCH'), []);
  const activeJobs = useMemo(() => MOCK_DISPATCH_JOBS.filter(j => j.status !== 'PENDING_DISPATCH'), []);
  const atRiskCount = useMemo(() => MOCK_DISPATCH_JOBS.filter(j => j.slaStatus === 'AT_RISK' || j.slaStatus === 'BREACHED').length, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const handleAssign = useCallback((job: DispatchJob) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      `Assign ${job.jobNumber}`,
      `${job.pickupCity} → ${job.dropoffCity}\nVehicle: ${job.vehicleType}\nPrice: £${job.calculatedPrice.toFixed(2)}`,
      [
        { text: 'Assign Driver', onPress: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); Alert.alert('Assigned', 'Job assigned to available driver'); } },
        { text: 'Assign Carrier', onPress: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); Alert.alert('Assigned', 'Job assigned to carrier partner'); } },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, []);

  const handleJobActions = useCallback((job: DispatchJob) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const actions: any[] = [];

    if (job.status === 'PENDING_DISPATCH') {
      actions.push({ text: 'Assign Driver', onPress: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); Alert.alert('Assigned', 'Job assigned to driver'); } });
      actions.push({ text: 'Assign Carrier', onPress: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); Alert.alert('Assigned', 'Job assigned to carrier'); } });
    }

    actions.push({ text: 'Edit Job Details', onPress: () => Alert.alert('Edit Job', `Editing ${job.jobNumber}\n\nPickup: ${job.pickupCity}\nDropoff: ${job.dropoffCity}\nVehicle: ${job.vehicleType}\nPrice: £${job.calculatedPrice.toFixed(2)}\n\nAll fields are editable.`) });

    if (job.assignedTo) {
      actions.push({
        text: 'Reassign', onPress: () => Alert.alert('Reassign', `Current: ${job.assignedTo} (${job.assignedType})\n\nSelect new assignee for ${job.jobNumber}`, [
          { text: 'Assign Driver', onPress: () => Alert.alert('Reassigned', 'Job reassigned to new driver') },
          { text: 'Assign Carrier', onPress: () => Alert.alert('Reassigned', 'Job reassigned to new carrier') },
          { text: 'Cancel', style: 'cancel' },
        ])
      });
    }

    actions.push({
      text: 'SLA Override', onPress: () => Alert.alert('SLA Override', `Current SLA target: ${new Date(job.slaTarget).toLocaleString('en-GB')}\nStatus: ${job.slaStatus}\n\nOverride reason required:\n- Customer request\n- Force majeure\n- Operational decision\n- Other`, [
        { text: 'Override', onPress: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); Alert.alert('SLA Override', 'SLA target updated with override reason logged'); } },
        { text: 'Cancel', style: 'cancel' },
      ])
    });

    actions.push({
      text: 'Add Note', onPress: () => Alert.alert('Internal Note', `Add internal note to ${job.jobNumber}:\n\nNotes are visible to admin/dispatch only and logged with timestamp.`, [
        { text: 'Save Note', onPress: () => Alert.alert('Saved', 'Note added to job history') },
        { text: 'Cancel', style: 'cancel' },
      ])
    });

    actions.push({
      text: 'Cancel Job', style: 'destructive', onPress: () => Alert.alert('Cancel Job', `Are you sure you want to cancel ${job.jobNumber}?\n\nThis action requires a reason and will notify the business.`, [
        { text: 'Confirm Cancel', style: 'destructive', onPress: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); Alert.alert('Cancelled', `${job.jobNumber} has been cancelled`); } },
        { text: 'Go Back', style: 'cancel' },
      ])
    });

    actions.push({ text: 'Close', style: 'cancel' });

    Alert.alert(
      `${job.jobNumber} Actions`,
      `${job.pickupCity} → ${job.dropoffCity}\n${job.vehicleType} · £${job.calculatedPrice.toFixed(2)}\nSLA: ${job.slaStatus}${job.assignedTo ? `\nAssigned: ${job.assignedTo}` : ''}`,
      actions
    );
  }, []);

  const handleCreateJob = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Create New Job',
      'Manual job creation:\n\n1. Select business account\n2. Set pickup address & time window\n3. Set dropoff address & time window\n4. Choose vehicle type\n5. Set priority & SLA target\n6. Add special instructions\n7. Calculate pricing\n8. Assign driver/carrier (optional)',
      [
        { text: 'Start', onPress: () => Alert.alert('Job Builder', 'Job creation form would open here with all fields pre-populated from business defaults') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, []);

  const renderJob = useCallback((job: DispatchJob) => {
    const slaStyle = getSLAStyle(job.slaStatus);
    return (
      <TouchableOpacity
        key={job.id}
        style={styles.jobCard}
        onPress={() => job.status === 'PENDING_DISPATCH' ? handleAssign(job) : handleJobActions(job)}
        onLongPress={() => handleJobActions(job)}
        activeOpacity={0.7}
      >
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

        <View style={styles.routeRow}>
          <View style={[styles.routeDot, { backgroundColor: Colors.success }]} />
          <Text style={styles.routeCity}>{job.pickupCity}</Text>
          <ChevronRight size={12} color={Colors.textMuted} />
          <View style={[styles.routeDot, { backgroundColor: Colors.danger }]} />
          <Text style={styles.routeCity}>{job.dropoffCity}</Text>
          <Text style={styles.distance}>{job.distanceKm.toFixed(0)} km</Text>
        </View>

        <View style={styles.jobBottom}>
          <View style={styles.jobMeta}>
            <Truck size={12} color={Colors.textMuted} />
            <Text style={styles.metaText}>{job.vehicleType}</Text>
          </View>
          <View style={styles.jobMeta}>
            <Clock size={12} color={Colors.textMuted} />
            <Text style={styles.metaText}>{timeUntil(job.slaTarget)}</Text>
          </View>
          {job.assignedTo ? (
            <View style={styles.assignedBadge}>
              <Users size={10} color={Colors.primary} />
              <Text style={styles.assignedText}>{job.assignedTo}</Text>
            </View>
          ) : (
            <View style={styles.unassignedBadge}>
              <Text style={styles.unassignedText}>Unassigned</Text>
            </View>
          )}
          <Text style={styles.price}>£{job.calculatedPrice.toFixed(0)}</Text>
        </View>

        <View style={styles.jobActionsRow}>
          {!job.assignedTo && (
            <TouchableOpacity style={styles.miniAction} onPress={() => handleAssign(job)} activeOpacity={0.7}>
              <Users size={11} color={Colors.primary} />
              <Text style={[styles.miniActionText, { color: Colors.primary }]}>Assign</Text>
            </TouchableOpacity>
          )}
          {job.assignedTo && (
            <TouchableOpacity style={styles.miniAction} onPress={() => Alert.alert('Reassign', `Reassign ${job.jobNumber} from ${job.assignedTo}`)} activeOpacity={0.7}>
              <RefreshCw size={11} color={Colors.warning} />
              <Text style={[styles.miniActionText, { color: Colors.warning }]}>Reassign</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.miniAction} onPress={() => Alert.alert('Edit', `Edit ${job.jobNumber} details`)} activeOpacity={0.7}>
            <Edit3 size={11} color={Colors.textSecondary} />
            <Text style={[styles.miniActionText, { color: Colors.textSecondary }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.miniAction} onPress={() => Alert.alert('Note', `Add note to ${job.jobNumber}`)} activeOpacity={0.7}>
            <MessageSquare size={11} color={Colors.textSecondary} />
            <Text style={[styles.miniActionText, { color: Colors.textSecondary }]}>Note</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.miniAction} onPress={() => Alert.alert('Cancel', `Cancel ${job.jobNumber}?`, [{ text: 'Confirm', style: 'destructive' }, { text: 'No', style: 'cancel' }])} activeOpacity={0.7}>
            <XCircle size={11} color={Colors.danger} />
            <Text style={[styles.miniActionText, { color: Colors.danger }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }, [handleAssign, handleJobActions]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Dispatch Console</Text>
            <Text style={styles.headerSubtitle}>Real-time job assignment</Text>
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.adminPrimary} />}
      >
        <TouchableOpacity style={styles.createJobBtn} onPress={handleCreateJob} activeOpacity={0.7}>
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
              <Text style={styles.sectionTitle}>In Progress ({activeJobs.length})</Text>
            </View>
            {activeJobs.map(renderJob)}
          </View>
        )}

        <View style={{ height: 24 }} />
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
  headerIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.adminPrimary + '18', alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, backgroundColor: Colors.navyLight, borderRadius: 10, padding: 10, borderLeftWidth: 3, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 18, fontWeight: '700' as const, color: Colors.textInverse },
  statLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '500' as const },
  body: { flex: 1 },
  bodyContent: { padding: 16 },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '700' as const, color: Colors.text },
  jobCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  jobTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  jobNumberWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  jobNumber: { fontSize: 14, fontWeight: '700' as const, color: Colors.text },
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
  assignedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DBEAFE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, gap: 3, marginLeft: 'auto' },
  assignedText: { fontSize: 10, fontWeight: '600' as const, color: Colors.primary },
  unassignedBadge: { backgroundColor: Colors.warningLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 'auto' },
  unassignedText: { fontSize: 10, fontWeight: '700' as const, color: Colors.warning },
  price: { fontSize: 14, fontWeight: '700' as const, color: Colors.text },
  createJobBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.adminPrimary, borderRadius: 12, paddingVertical: 12, gap: 6, marginBottom: 16 },
  createJobBtnText: { fontSize: 14, fontWeight: '700' as const, color: '#FFFFFF' },
  jobActionsRow: { flexDirection: 'row', gap: 6, marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  miniAction: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: Colors.surfaceAlt },
  miniActionText: { fontSize: 10, fontWeight: '600' as const },
});
