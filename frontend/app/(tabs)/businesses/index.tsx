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
  Building2,
  CheckCircle,
  Clock,
  XCircle,
  PauseCircle,
  Target,
  CreditCard,
  TrendingUp,
  FileText,
  ChevronRight,
  Plus,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { apiClient } from '@/services/api';

import { BusinessAccount } from '@/types';

type BizFilter = 'all' | 'ACTIVE' | 'ON_HOLD' | 'PENDING' | 'SUSPENDED';

function getStatusStyle(status: string) {
  switch (status) {
    case 'ACTIVE': return { color: Colors.success, bg: Colors.successLight };
    case 'ON_HOLD': return { color: Colors.warning, bg: Colors.warningLight };
    case 'PENDING': return { color: Colors.info, bg: Colors.infoLight };
    case 'SUSPENDED': return { color: Colors.danger, bg: Colors.dangerLight };
    default: return { color: Colors.textMuted, bg: '#F1F5F9' };
  }
}

function getIndustryColor(industry: string): string {
  switch (industry) {
    case 'Construction': return '#D97706';
    case 'IT / Technology': return '#2563EB';
    case 'Medical': return '#DC2626';
    case 'Wholesale / Distribution': return '#7C3AED';
    case 'Manufacturing': return '#059669';
    case 'Furniture': return '#EA580C';
    default: return Colors.textMuted;
  }
}

export default function BusinessesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState<BizFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBusinesses = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient('/businesses');
      setBusinesses(data.businesses || []);
    } catch (error) {
      console.error('Failed to fetch businesses:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  const filteredAccounts = useMemo(() => {
    if (activeFilter === 'all') return businesses;
    return businesses.filter((b: any) => b.status === activeFilter);
  }, [activeFilter, businesses]);

  const totals = useMemo(() => ({
    total: businesses.length,
    active: businesses.filter((b: any) => b.status === 'ACTIVE').length,
    totalSpend: businesses.reduce((s: any, b: any) => s + (b.totalSpend || 0), 0),
    totalBalance: businesses.reduce((s: any, b: any) => s + (b.currentBalance || 0), 0),
  }), [businesses]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBusinesses();
  }, [fetchBusinesses]);

  const handleBusinessAction = useCallback((biz: BusinessAccount) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/(tabs)/businesses/${biz.id}` as any);
  }, [router]);

  const filters: { key: BizFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'ACTIVE', label: 'Active' },
    { key: 'ON_HOLD', label: 'On Hold' },
    { key: 'PENDING', label: 'Pending' },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Business Accounts</Text>
            <Text style={styles.headerSubtitle}>Manage B2B client accounts</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity 
              style={[styles.headerIcon, { backgroundColor: Colors.success + '18' }]} 
              onPress={() => router.push('/(tabs)/businesses/create')}
            >
              <Plus size={20} color={Colors.success} />
            </TouchableOpacity>
            <View style={styles.headerIcon}>
              <Building2 size={20} color={Colors.adminPrimary} />
            </View>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { borderLeftColor: Colors.primary }]}>
            <Text style={styles.summaryLabel}>Accounts</Text>
            <Text style={styles.summaryValue}>{totals.total}</Text>
          </View>
          <View style={[styles.summaryCard, { borderLeftColor: Colors.success }]}>
            <Text style={styles.summaryLabel}>Revenue</Text>
            <Text style={styles.summaryValue}>£{(totals.totalSpend / 1000).toFixed(0)}k</Text>
          </View>
          <View style={[styles.summaryCard, { borderLeftColor: Colors.warning }]}>
            <Text style={styles.summaryLabel}>Outstanding</Text>
            <Text style={styles.summaryValue}>£{totals.totalBalance.toFixed(0)}</Text>
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
        {filteredAccounts.map((biz: any) => {
          const statusStyle = getStatusStyle(biz.status);
          const industryColor = getIndustryColor(biz.industryProfile);

          return (
            <TouchableOpacity
              key={biz.id}
              style={styles.bizCard}
              onPress={() => handleBusinessAction(biz)}
              activeOpacity={0.7}
            >
              <View style={styles.cardTop}>
                <View style={styles.bizInfo}>
                  <View style={[styles.bizAvatar, { backgroundColor: industryColor + '15' }]}>
                    <Text style={[styles.bizAvatarText, { color: industryColor }]}>{biz.tradingName[0]}</Text>
                  </View>
                  <View style={styles.bizNames}>
                    <Text style={styles.bizName}>{biz.tradingName}</Text>
                    <View style={styles.industryWrap}>
                      <View style={[styles.industryDot, { backgroundColor: industryColor }]} />
                      <Text style={styles.industryText}>{biz.industryProfile}</Text>
                    </View>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                  <Text style={[styles.statusText, { color: statusStyle.color }]}>{biz.status}</Text>
                </View>
              </View>

              <View style={styles.metricsRow}>
                <View style={styles.metric}>
                  <TrendingUp size={12} color={Colors.textMuted} />
                  <Text style={styles.metricValue}>{biz.totalJobs}</Text>
                  <Text style={styles.metricLabel}>Jobs</Text>
                </View>
                <View style={styles.metric}>
                  <CreditCard size={12} color={Colors.textMuted} />
                  <Text style={styles.metricValue}>£{(biz.totalSpend / 1000).toFixed(1)}k</Text>
                  <Text style={styles.metricLabel}>Spend</Text>
                </View>
                <View style={styles.metric}>
                  <Target size={12} color={Colors.textMuted} />
                  <Text style={styles.metricValue}>{biz.slaCompliance > 0 ? `${biz.slaCompliance}%` : 'N/A'}</Text>
                  <Text style={styles.metricLabel}>SLA</Text>
                </View>
                <View style={styles.metric}>
                  <FileText size={12} color={Colors.textMuted} />
                  <Text style={styles.metricValue}>{biz.billingTerms.replace('Net ', '')}</Text>
                  <Text style={styles.metricLabel}>Terms</Text>
                </View>
              </View>

              <View style={styles.cardBottom}>
                <View>
                  <Text style={styles.creditLabel}>Credit: £{biz.creditLimit.toLocaleString()}</Text>
                  <Text style={styles.balanceLabel}>Balance: £{biz.currentBalance.toFixed(2)}</Text>
                </View>
                <View style={styles.contractWrap}>
                  {biz.contractId ? (
                    <View style={styles.contractBadge}>
                      <FileText size={10} color={Colors.success} />
                      <Text style={styles.contractText}>Contract</Text>
                    </View>
                  ) : (
                    <Text style={styles.noContract}>Ad-hoc</Text>
                  )}
                  <ChevronRight size={16} color={Colors.textMuted} />
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {filteredAccounts.length === 0 && (
          <View style={styles.emptyState}>
            <Building2 size={40} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No accounts found</Text>
            <Text style={styles.emptySubtitle}>No business accounts match the selected filter</Text>
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
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  summaryCard: { flex: 1, backgroundColor: Colors.navyLight, borderRadius: 10, padding: 10, borderLeftWidth: 3 },
  summaryLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '500' as const },
  summaryValue: { fontSize: 16, fontWeight: '700' as const, color: Colors.textInverse, marginTop: 2 },
  filterRow: { gap: 8 },
  filterChip: { backgroundColor: Colors.navyLight, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  filterChipActive: { backgroundColor: Colors.adminPrimary },
  filterChipText: { fontSize: 13, fontWeight: '600' as const, color: Colors.textMuted },
  filterChipTextActive: { color: '#FFFFFF' },
  body: { flex: 1 },
  bodyContent: { padding: 16 },
  bizCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  bizInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  bizAvatar: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  bizAvatarText: { fontSize: 16, fontWeight: '700' as const },
  bizNames: { flex: 1 },
  bizName: { fontSize: 15, fontWeight: '700' as const, color: Colors.text },
  industryWrap: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  industryDot: { width: 6, height: 6, borderRadius: 3 },
  industryText: { fontSize: 11, color: Colors.textMuted },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '700' as const },
  metricsRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  metric: { flex: 1, backgroundColor: Colors.surfaceAlt, borderRadius: 8, padding: 8, alignItems: 'center', gap: 3 },
  metricValue: { fontSize: 14, fontWeight: '700' as const, color: Colors.text },
  metricLabel: { fontSize: 9, color: Colors.textMuted, fontWeight: '500' as const },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  creditLabel: { fontSize: 11, color: Colors.textMuted },
  balanceLabel: { fontSize: 12, fontWeight: '600' as const, color: Colors.text, marginTop: 2 },
  contractWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  contractBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.successLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, gap: 4 },
  contractText: { fontSize: 10, fontWeight: '700' as const, color: Colors.success },
  noContract: { fontSize: 11, color: Colors.textMuted },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700' as const, color: Colors.text },
  emptySubtitle: { fontSize: 13, color: Colors.textSecondary },
});
