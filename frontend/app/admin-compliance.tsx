import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft, CheckCircle, XCircle, Clock, AlertTriangle,
  Shield, Users, FileCheck, Eye,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { apiClient } from '@/services/api';

type StatusFilter = 'all' | 'pending_review' | 'verified' | 'rejected';

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending_review', label: 'Pending' },
  { key: 'verified', label: 'Verified' },
  { key: 'rejected', label: 'Rejected' },
];

function getStatusIcon(status: string) {
  switch (status) {
    case 'verified': return { Icon: CheckCircle, color: Colors.success };
    case 'pending_review': return { Icon: Clock, color: Colors.warning };
    case 'rejected': return { Icon: XCircle, color: Colors.danger };
    case 'expired': return { Icon: AlertTriangle, color: Colors.warning };
    default: return { Icon: Shield, color: Colors.textMuted };
  }
}

function getOverallBadgeStyle(status: string): { bg: string; text: string; label: string } {
  switch (status) {
    case 'verified': return { bg: Colors.successLight, text: Colors.success, label: 'Verified' };
    case 'pending_verification': return { bg: Colors.warningLight, text: Colors.warning, label: 'Under Review' };
    case 'rejected': return { bg: Colors.dangerLight, text: Colors.danger, label: 'Rejected' };
    case 'action_required': return { bg: Colors.dangerLight, text: Colors.danger, label: 'Action Required' };
    default: return { bg: Colors.borderLight, text: Colors.textMuted, label: 'Not Submitted' };
  }
}

export default function AdminComplianceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setError(null);
      const url = filter === 'all' ? '/compliance/admin/all' : `/compliance/admin/all?status=${filter}`;
      const res = await apiClient(url);
      setData(res);
    } catch (e: any) {
      setError(e?.message || 'Failed to load compliance data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { setLoading(true); loadData(); }, [filter]);

  const onRefresh = useCallback(() => { setRefreshing(true); loadData(); }, [filter]);

  const counts = data?.counts ?? {};

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={22} color={Colors.textInverse} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Driver Compliance</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { borderTopColor: Colors.warning }]}>
          <Text style={styles.summaryCount}>{counts.pending_review ?? 0}</Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
        <View style={[styles.summaryCard, { borderTopColor: Colors.success }]}>
          <Text style={styles.summaryCount}>{counts.verified ?? 0}</Text>
          <Text style={styles.summaryLabel}>Verified</Text>
        </View>
        <View style={[styles.summaryCard, { borderTopColor: Colors.danger }]}>
          <Text style={styles.summaryCount}>{counts.rejected ?? 0}</Text>
          <Text style={styles.summaryLabel}>Rejected</Text>
        </View>
        <View style={[styles.summaryCard, { borderTopColor: Colors.info }]}>
          <Text style={styles.summaryCount}>{counts.total ?? 0}</Text>
          <Text style={styles.summaryLabel}>Total Docs</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.adminPrimary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadData} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (data?.drivers ?? []).length === 0 ? (
        <View style={styles.center}>
          <FileCheck size={48} color={Colors.textMuted} style={{ opacity: 0.3 }} />
          <Text style={styles.emptyTitle}>No documents found</Text>
          <Text style={styles.emptyBody}>
            {filter === 'pending_review'
              ? 'No documents waiting for review.'
              : 'No compliance documents match this filter.'}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {(data?.drivers ?? []).map((entry: any) => {
            const badge = getOverallBadgeStyle(entry.overallStatus);
            const pendingCount = (entry.documents ?? []).filter((d: any) => d.status === 'pending_review').length;
            return (
              <TouchableOpacity
                key={entry.driver.id}
                style={styles.driverCard}
                onPress={() => router.push((`/admin-compliance-detail?driverId=${entry.driver.id}`) as any)}
                activeOpacity={0.7}
              >
                {/* Driver Avatar */}
                <View style={[styles.driverAvatar, { backgroundColor: Colors.adminPrimary + '20' }]}>
                  <Text style={styles.driverAvatarText}>
                    {entry.driver.firstName?.[0]}{entry.driver.lastName?.[0]}
                  </Text>
                </View>

                {/* Info */}
                <View style={styles.driverInfo}>
                  <Text style={styles.driverName}>
                    {entry.driver.firstName} {entry.driver.lastName}
                  </Text>
                  <Text style={styles.driverEmail}>{entry.driver.email}</Text>
                  <View style={[styles.overallBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.overallBadgeText, { color: badge.text }]}>
                      {badge.label}
                    </Text>
                  </View>
                  {pendingCount > 0 && (
                    <Text style={styles.pendingNote}>{pendingCount} doc{pendingCount > 1 ? 's' : ''} awaiting review</Text>
                  )}
                </View>

                {/* Arrow */}
                <Eye size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.navy, paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8,
  },
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.textInverse },
  summaryRow: {
    flexDirection: 'row', padding: 16, gap: 10,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  summaryCard: {
    flex: 1, alignItems: 'center', paddingVertical: 12,
    backgroundColor: Colors.background, borderRadius: 10,
    borderTopWidth: 3, borderWidth: 1, borderColor: Colors.border,
  },
  summaryCount: { fontSize: 22, fontWeight: '800' as const, color: Colors.text },
  summaryLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '500' as const, marginTop: 2 },
  filterRow: {
    flexDirection: 'row', padding: 12, gap: 8,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.adminPrimary, borderColor: Colors.adminPrimary },
  filterText: { fontSize: 12, fontWeight: '600' as const, color: Colors.textSecondary },
  filterTextActive: { color: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorText: { fontSize: 14, color: Colors.danger, textAlign: 'center', marginBottom: 12 },
  retryBtn: { backgroundColor: Colors.adminPrimary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' as const },
  emptyTitle: { fontSize: 16, fontWeight: '700' as const, color: Colors.text, marginTop: 16 },
  emptyBody: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginTop: 8 },
  listContent: { padding: 16 },
  driverCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface, borderRadius: 14, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  driverAvatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  driverAvatarText: { fontSize: 16, fontWeight: '700' as const, color: Colors.adminPrimary },
  driverInfo: { flex: 1 },
  driverName: { fontSize: 15, fontWeight: '700' as const, color: Colors.text },
  driverEmail: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  overallBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 10, marginTop: 6,
  },
  overallBadgeText: { fontSize: 11, fontWeight: '700' as const },
  pendingNote: { fontSize: 11, color: Colors.warning, fontWeight: '500' as const, marginTop: 4 },
});
