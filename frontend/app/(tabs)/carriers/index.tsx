import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Truck,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Star,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
  AlertTriangle,
  Target,
  Users,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { ActivityIndicator } from 'react-native';
import { apiClient } from '@/services/api';
import { AdminCarrierView } from '@/types';

type CarrierFilter = 'all' | 'APPROVED' | 'PENDING' | 'SUSPENDED';

function getComplianceStyle(status: string) {
  switch (status) {
    case 'COMPLIANT': return { color: Colors.success, bg: Colors.successLight, label: 'Compliant', Icon: ShieldCheck };
    case 'EXPIRING_SOON': return { color: Colors.warning, bg: Colors.warningLight, label: 'Expiring', Icon: ShieldAlert };
    case 'NON_COMPLIANT': return { color: Colors.danger, bg: Colors.dangerLight, label: 'Non-Compliant', Icon: ShieldAlert };
    default: return { color: Colors.textMuted, bg: '#F1F5F9', label: status, Icon: Shield };
  }
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'APPROVED': return { color: Colors.success, bg: Colors.successLight };
    case 'PENDING': return { color: Colors.warning, bg: Colors.warningLight };
    case 'SUSPENDED': return { color: Colors.danger, bg: Colors.dangerLight };
    default: return { color: Colors.textMuted, bg: '#F1F5F9' };
  }
}

export default function CarriersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState<CarrierFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [carriers, setCarriers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCarriers = async () => {
    try {
      const response = await apiClient('/carriers');
      setCarriers(response.carriers || []);
    } catch (error) {
      console.error('Failed to fetch carriers:', error);
      Alert.alert('Error', 'Could not load carriers.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCarriers();
  }, []);

  const filteredCarriers = useMemo(() => {
    if (activeFilter === 'all') return carriers;
    return carriers.filter((c: any) => c.status === activeFilter);
  }, [activeFilter, carriers]);

  const counts = useMemo(() => ({
    total: carriers.length,
    approved: carriers.filter((c: any) => c.status === 'APPROVED').length,
    pending: carriers.filter((c: any) => c.status === 'PENDING').length,
    suspended: carriers.filter((c: any) => c.status === 'SUSPENDED').length,
  }), [carriers]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCarriers();
  }, []);

  const handleCarrierAction = useCallback((carrier: AdminCarrierView) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/(tabs)/carriers/${carrier.id}` as any);
  }, [router]);

  const filters: { key: CarrierFilter; label: string }[] = [
    { key: 'all', label: `All (${counts.total})` },
    { key: 'APPROVED', label: `Active (${counts.approved})` },
    { key: 'PENDING', label: `Pending (${counts.pending})` },
    { key: 'SUSPENDED', label: `Suspended (${counts.suspended})` },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Carrier Management</Text>
            <Text style={styles.headerSubtitle}>Manage carrier partners & compliance</Text>
          </View>
          <View style={styles.headerIcon}>
            <Truck size={20} color={Colors.adminPrimary} />
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderLeftColor: Colors.success }]}>
            <CheckCircle size={14} color={Colors.success} />
            <Text style={styles.statValue}>{counts.approved}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: Colors.warning }]}>
            <Clock size={14} color={Colors.warning} />
            <Text style={styles.statValue}>{counts.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: Colors.danger }]}>
            <XCircle size={14} color={Colors.danger} />
            <Text style={styles.statValue}>{counts.suspended}</Text>
            <Text style={styles.statLabel}>Suspended</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {filters.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
              onPress={() => { setActiveFilter(f.key); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, activeFilter === f.key && styles.filterChipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.adminPrimary} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color={Colors.adminPrimary} style={{ marginTop: 40 }} />
        ) : (
          filteredCarriers.map((carrier: any) => {
            const statusStyle = getStatusStyle(carrier.status);
            // Derive a pseudo compliance status base on what the API returned:
            const isCompliant = carrier.complianceDocs?.every((doc: any) => doc.status === 'VALID')
            const complianceStatus = isCompliant ? 'COMPLIANT' : 'EXPIRING_SOON'
            const compStyle = getComplianceStyle(complianceStatus);
            const CompIcon = compStyle.Icon;

            // Re-parse regions since sqlite schema returns it as a stringified json
            let regions = []
            try {
              regions = typeof carrier.coverageRegions === 'string' ? JSON.parse(carrier.coverageRegions) : carrier.coverageRegions
            } catch (e) { }

            return (
              <TouchableOpacity
                key={carrier.id}
                style={styles.carrierCard}
                onPress={() => handleCarrierAction(carrier)}
                activeOpacity={0.7}
              >
                <View style={styles.cardTop}>
                  <View style={styles.carrierInfo}>
                    <View style={styles.carrierAvatar}>
                      <Text style={styles.carrierAvatarText}>{carrier.tradingName[0]}</Text>
                    </View>
                    <View style={styles.carrierNames}>
                      <Text style={styles.carrierName}>{carrier.tradingName}</Text>
                      <Text style={styles.carrierCompany}>{carrier.contactFirstName} {carrier.contactLastName}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusText, { color: statusStyle.color }]}>{carrier.status}</Text>
                  </View>
                </View>

                <View style={styles.metricsRow}>
                  <View style={styles.metric}>
                    <Target size={12} color={Colors.textMuted} />
                    <Text style={styles.metricValue}>{carrier.slaScore > 0 ? `${carrier.slaScore}%` : 'N/A'}</Text>
                    <Text style={styles.metricLabel}>SLA</Text>
                  </View>
                  <View style={styles.metric}>
                    <Star size={12} color={Colors.warning} />
                    <Text style={styles.metricValue}>{carrier.rating > 0 ? carrier.rating.toFixed(1) : 'N/A'}</Text>
                    <Text style={styles.metricLabel}>Rating</Text>
                  </View>
                  <View style={styles.metric}>
                    <Truck size={12} color={Colors.textMuted} />
                    <Text style={styles.metricValue}>{carrier.vehicles?.length || 0}</Text>
                    <Text style={styles.metricLabel}>Fleet</Text>
                  </View>
                  <View style={styles.metric}>
                    <Users size={12} color={Colors.textMuted} />
                    <Text style={styles.metricValue}>{carrier.totalJobsCompleted}</Text>
                    <Text style={styles.metricLabel}>Jobs</Text>
                  </View>
                </View>

                <View style={styles.cardBottom}>
                  <View style={styles.regionsWrap}>
                    <MapPin size={11} color={Colors.textMuted} />
                    <Text style={styles.regionsText} numberOfLines={1}>
                      {regions.slice(0, 3).join(', ')}{regions.length > 3 ? ` +${regions.length - 3}` : ''}
                    </Text>
                  </View>
                  <View style={[styles.complianceBadge, { backgroundColor: compStyle.bg }]}>
                    <CompIcon size={10} color={compStyle.color} />
                    <Text style={[styles.complianceText, { color: compStyle.color }]}>{compStyle.label}</Text>
                  </View>
                </View>

                {carrier.preferredFor && carrier.preferredFor.length > 0 && (
                  <View style={styles.preferredRow}>
                    <Star size={10} color={Colors.warning} />
                    <Text style={styles.preferredText}>Preferred for: {carrier.preferredFor.join(', ')}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}

        {!loading && filteredCarriers.length === 0 && (
          <View style={styles.emptyState}>
            <Truck size={40} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No carriers found</Text>
            <Text style={styles.emptySubtitle}>No carriers match the selected filter</Text>
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
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statCard: { flex: 1, backgroundColor: Colors.navyLight, borderRadius: 10, padding: 10, borderLeftWidth: 3, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 18, fontWeight: '700' as const, color: Colors.textInverse },
  statLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '500' as const },
  filterRow: { gap: 8 },
  filterChip: { backgroundColor: Colors.navyLight, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  filterChipActive: { backgroundColor: Colors.adminPrimary },
  filterChipText: { fontSize: 13, fontWeight: '600' as const, color: Colors.textMuted },
  filterChipTextActive: { color: '#FFFFFF' },
  body: { flex: 1 },
  bodyContent: { padding: 16 },
  carrierCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  carrierInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  carrierAvatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.carrierPrimary + '15', alignItems: 'center', justifyContent: 'center' },
  carrierAvatarText: { fontSize: 16, fontWeight: '700' as const, color: Colors.carrierPrimary },
  carrierNames: { flex: 1 },
  carrierName: { fontSize: 15, fontWeight: '700' as const, color: Colors.text },
  carrierCompany: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '700' as const },
  metricsRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  metric: { flex: 1, backgroundColor: Colors.surfaceAlt, borderRadius: 8, padding: 8, alignItems: 'center', gap: 3 },
  metricValue: { fontSize: 14, fontWeight: '700' as const, color: Colors.text },
  metricLabel: { fontSize: 9, color: Colors.textMuted, fontWeight: '500' as const },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  regionsWrap: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  regionsText: { fontSize: 11, color: Colors.textMuted, flex: 1 },
  complianceBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, gap: 4 },
  complianceText: { fontSize: 10, fontWeight: '700' as const },
  preferredRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  preferredText: { fontSize: 11, color: Colors.warning, fontWeight: '500' as const },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700' as const, color: Colors.text },
  emptySubtitle: { fontSize: 13, color: Colors.textSecondary },
});
