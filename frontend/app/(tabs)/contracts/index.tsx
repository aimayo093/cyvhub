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
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  ChevronRight,
  Calculator,
  Plus,
  Truck,
  Target,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { apiClient } from '@/services/api';

import { Contract } from '@/types';

type ContractFilter = 'all' | 'ACTIVE' | 'DRAFT' | 'EXPIRED';

function getContractStatusStyle(status: string) {
  switch (status) {
    case 'ACTIVE': return { color: Colors.success, bg: Colors.successLight, Icon: CheckCircle };
    case 'DRAFT': return { color: Colors.info, bg: Colors.infoLight, Icon: Clock };
    case 'EXPIRED': return { color: Colors.textMuted, bg: '#F1F5F9', Icon: XCircle };
    case 'PENDING': return { color: Colors.warning, bg: Colors.warningLight, Icon: AlertTriangle };
    default: return { color: Colors.textMuted, bg: '#F1F5F9', Icon: FileText };
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ContractsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState<ContractFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient('/contracts');
      setContracts(data.contracts || []);
    } catch (err) {
      console.error('Failed to fetch contracts:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const filteredContracts = useMemo(() => {
    if (activeFilter === 'all') return contracts;
    return contracts.filter((c: any) => c.status === activeFilter);
  }, [activeFilter, contracts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchContracts();
  }, [fetchContracts]);

  const handleSimulatePricing = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(tabs)/contracts/simulator');
  }, [router]);

  const handleContractAction = useCallback((contract: Contract) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const actions: any[] = [];

    if (contract.status === 'ACTIVE' || contract.status === 'DRAFT') {
      actions.push({ text: 'Edit Contract', onPress: () => Alert.alert('Edit', `Editing ${contract.contractNumber}`) });
      actions.push({
        text: 'View Rate Rules', onPress: () => {
          const rules = contract.rateRules?.map((r: any) => `${r.vehicleType}: £${r.baseRate} + £${r.perKmRate}/km + £${r.perStopRate}/stop (×${r.vehicleMultiplier || 1})`).join('\n') || 'None';
          Alert.alert('Rate Rules', rules);
        }
      });
      actions.push({
        text: 'View Surcharges', onPress: () => {
          const s: any = contract.surcharges || {};
          Alert.alert('Surcharges', `Weekend: ${s.weekend || 0}%\nOut of Hours: ${s.outOfHours || 0}%\nHeavy Goods: ${s.heavyGoods || 0}%\nUrgent: ${s.urgentDelivery || 0}%`);
        }
      });
      actions.push({
        text: 'View SLA Defaults', onPress: () => {
          const sla: any = contract.slaDefaults || {};
          Alert.alert('SLA Defaults', `Standard: ${sla.standardDeliveryHours || 24}h\nUrgent: ${sla.urgentDeliveryHours || 4}h\nSame-day: ${sla.sameDayDeliveryHours || 8}h\nBreach Penalty: ${sla.breachPenaltyPercent || 0}%`);
        }
      });
    }

    if (contract.status === 'DRAFT') {
      actions.push({ text: 'Activate', onPress: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); Alert.alert('Activated', `${contract.contractNumber} is now active`); } });
    }

    actions.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert(
      contract.contractNumber,
      `${contract.businessAccount?.tradingName || contract.businessAccount?.companyName || 'Business'}\nStatus: ${contract.status}\nPeriod: ${formatDate(contract.startDate)} - ${formatDate(contract.endDate)}\nTotal Value: £${(contract.totalValue || 0).toLocaleString()}\nVehicle Types: ${contract.rateRules?.map((r: any) => r.vehicleType).join(', ') || 'N/A'}`,
      actions
    );
  }, []);

  const handleCreateContract = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(tabs)/contracts/builder');
  }, [router]);

  const filters: { key: ContractFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'ACTIVE', label: 'Active' },
    { key: 'DRAFT', label: 'Draft' },
    { key: 'EXPIRED', label: 'Expired' },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Contracts & Pricing</Text>
            <Text style={styles.headerSubtitle}>Rate rules, surcharges & SLA defaults</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.simBtn} onPress={handleSimulatePricing} activeOpacity={0.7}>
              <Calculator size={14} color={Colors.adminPrimary} />
              <Text style={styles.simBtnText}>Simulate</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.createBtn} onPress={handleCreateContract} activeOpacity={0.7}>
          <Plus size={16} color="#FFFFFF" />
          <Text style={styles.createBtnText}>Create New Contract</Text>
        </TouchableOpacity>

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
        {filteredContracts.map((contract: any) => {
          const statusStyle = getContractStatusStyle(contract.status);
          const StatusIcon = statusStyle.Icon;

          return (
            <TouchableOpacity
              key={contract.id}
              style={styles.contractCard}
              onPress={() => handleContractAction(contract)}
              activeOpacity={0.7}
            >
              <View style={styles.cardTop}>
                <View style={styles.contractNumberWrap}>
                  <FileText size={14} color={Colors.adminPrimary} />
                  <Text style={styles.contractNumber}>{contract.contractNumber}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                  <StatusIcon size={10} color={statusStyle.color} />
                  <Text style={[styles.statusText, { color: statusStyle.color }]}>{contract.status}</Text>
                </View>
              </View>

              <Text style={styles.businessName}>{contract.businessAccount?.tradingName || contract.businessAccount?.companyName || 'Unknown Business'}</Text>

              <View style={styles.periodRow}>
                <Text style={styles.periodText}>{formatDate(contract.startDate)} → {formatDate(contract.endDate)}</Text>
                <Text style={styles.valueText}>£{(contract.totalValue || 0).toLocaleString()}</Text>
              </View>

              <View style={styles.rateRulesRow}>
                {contract.rateRules?.map((rule: any, i: any) => (
                  <View key={i} style={styles.rateChip}>
                    <Truck size={10} color={Colors.textSecondary} />
                    <Text style={styles.rateChipText}>{rule.vehicleType}</Text>
                    <Text style={styles.rateChipPrice}>£{rule.baseRate}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.cardBottom}>
                <View style={styles.surchargeWrap}>
                  <Text style={styles.surchargeLabel}>Surcharges: </Text>
                  <Text style={styles.surchargeText}>
                    Wknd {contract.surcharges?.weekend || 0}% · OOH {contract.surcharges?.outOfHours || 0}% · Heavy {contract.surcharges?.heavyGoods || 0}%
                  </Text>
                </View>
                <View style={styles.slaWrap}>
                  <Target size={10} color={Colors.info} />
                  <Text style={styles.slaText}>
                    Std {contract.slaDefaults?.standardDeliveryHours || 24}h · Urgent {contract.slaDefaults?.urgentDeliveryHours || 4}h
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {filteredContracts.length === 0 && (
          <View style={styles.emptyState}>
            <FileText size={40} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No contracts found</Text>
            <Text style={styles.emptySubtitle}>No contracts match the selected filter</Text>
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
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: '800' as const, color: Colors.textInverse },
  headerSubtitle: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8 },
  simBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.adminPrimary + '18', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4 },
  simBtnText: { fontSize: 12, fontWeight: '600' as const, color: Colors.adminPrimary },
  createBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.adminPrimary, borderRadius: 10, paddingVertical: 10, gap: 6, marginBottom: 12 },
  createBtnText: { fontSize: 14, fontWeight: '700' as const, color: '#FFFFFF' },
  filterRow: { gap: 8 },
  filterChip: { backgroundColor: Colors.navyLight, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  filterChipActive: { backgroundColor: Colors.adminPrimary },
  filterChipText: { fontSize: 13, fontWeight: '600' as const, color: Colors.textMuted },
  filterChipTextActive: { color: '#FFFFFF' },
  body: { flex: 1 },
  bodyContent: { padding: 16 },
  contractCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  contractNumberWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  contractNumber: { fontSize: 13, fontWeight: '700' as const, color: Colors.text },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, gap: 4 },
  statusText: { fontSize: 10, fontWeight: '700' as const },
  businessName: { fontSize: 15, fontWeight: '600' as const, color: Colors.text, marginBottom: 8 },
  periodRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  periodText: { fontSize: 12, color: Colors.textSecondary },
  valueText: { fontSize: 16, fontWeight: '800' as const, color: Colors.text },
  rateRulesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  rateChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceAlt, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 },
  rateChipText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' as const },
  rateChipPrice: { fontSize: 11, fontWeight: '700' as const, color: Colors.text },
  cardBottom: { paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.borderLight, gap: 6 },
  surchargeWrap: { flexDirection: 'row', alignItems: 'center' },
  surchargeLabel: { fontSize: 11, color: Colors.textMuted },
  surchargeText: { fontSize: 11, color: Colors.textSecondary },
  slaWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  slaText: { fontSize: 11, color: Colors.info, fontWeight: '500' as const },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700' as const, color: Colors.text },
  emptySubtitle: { fontSize: 13, color: Colors.textSecondary },
});
