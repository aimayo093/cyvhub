import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Stack } from 'expo-router';
import {
  BarChart3,
  TrendingUp,
  Leaf,
  Target,
  MapPin,
  Package,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { apiClient } from '@/services/api';
import { ActivityIndicator, RefreshControl } from 'react-native';

type TabType = 'sla' | 'volume' | 'cost' | 'emissions' | 'comparison';

const TABS: { key: TabType; label: string; icon: typeof BarChart3 }[] = [
  { key: 'sla', label: 'SLA', icon: Target },
  { key: 'volume', label: 'Volume', icon: Package },
  { key: 'cost', label: 'Cost', icon: MapPin },
  { key: 'emissions', label: 'Emissions', icon: Leaf },
  { key: 'comparison', label: 'Compare', icon: TrendingUp },
];

export default function CustomerAnalyticsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('sla');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>({
    slaByMonth: [],
    deliveryVolume: [],
    costByRoute: [],
    emissionsMonthly: [],
    performanceComparison: []
  });

  const loadData = useCallback(async () => {
    try {
      const res = await apiClient('/analytics/earnings');
      if (res && res.data) {
        const dv = res.data.deliveryVolume || [];
        // Map backend to frontend chart structure
        setData({
          slaByMonth: dv.map((i: any) => ({ month: i.name, compliance: i.sla || 100, target: 95 })),
          deliveryVolume: dv.map((i: any) => ({ month: i.name, count: i.volume || 0 })),
          costByRoute: [], // Placeholder for future route-specific endpoint
          emissionsMonthly: dv.map((i: any) => ({ month: i.name, kgCO2: (i.volume || 0) * 0.25 })), // Mocked based on volume
          performanceComparison: [{ metric: 'On-Time Delivery', yours: res.data.slaCompliance || 100, average: 95 }]
        });
      }
    } catch (e) {
      console.warn('Failed to load customer analytics', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const maxVolume = Math.max(...(data.deliveryVolume || []).map((d: any) => d.count), 0) || 100;
  const maxEmissions = Math.max(...(data.emissionsMonthly || []).map((d: any) => d.kgCO2), 0) || 100;

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.customerPrimary} />
        <Text style={{ marginTop: 12, color: Colors.textSecondary }}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Analytics',
          headerStyle: { backgroundColor: Colors.navy },
          headerTintColor: Colors.textInverse,
          headerTitleStyle: { fontWeight: '600' as const },
        }}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={styles.tabBarContent}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => { setActiveTab(tab.key); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            >
              <Icon size={14} color={isActive ? '#FFFFFF' : Colors.textSecondary} />
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.customerPrimary} />}
      >
        {activeTab === 'sla' && (
          <>
            <Text style={styles.chartTitle}>SLA Compliance by Month</Text>
            <Text style={styles.chartSubtitle}>Target: 95% compliance rate</Text>
            <View style={styles.chartCard}>
              {data.slaByMonth.map((item: any) => {
                const isMet = item.compliance >= item.target;
                return (
                  <View key={item.month} style={styles.slaRow}>
                    <Text style={styles.slaMonth}>{item.month}</Text>
                    <View style={styles.slaBarContainer}>
                      <View style={[styles.slaBar, { width: `${item.compliance}%`, backgroundColor: isMet ? Colors.success : Colors.warning }]} />
                      <View style={[styles.slaTarget, { left: `${item.target}%` }]} />
                    </View>
                    <Text style={[styles.slaValue, { color: isMet ? Colors.success : Colors.warning }]}>{item.compliance}%</Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
                <Text style={styles.legendText}>Met Target</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.warning }]} />
                <Text style={styles.legendText}>Below Target</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.danger, width: 2, height: 16, borderRadius: 1 }]} />
                <Text style={styles.legendText}>Target (95%)</Text>
              </View>
            </View>
          </>
        )}

        {activeTab === 'volume' && (
          <>
            <Text style={styles.chartTitle}>Delivery Volume by Month</Text>
            <Text style={styles.chartSubtitle}>Total deliveries per period</Text>
            <View style={styles.barChartCard}>
              <View style={styles.barChart}>
                {data.deliveryVolume.map((item: any) => {
                  const heightPct = (item.count / maxVolume) * 100;
                  return (
                    <View key={item.month} style={styles.barWrap}>
                      <View style={styles.barOuter}>
                        <View style={[styles.bar, { height: `${heightPct}%`, backgroundColor: Colors.customerPrimary }]} />
                      </View>
                      <Text style={styles.barLabel}>{item.month}</Text>
                      <Text style={styles.barValue}>{item.count}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{data.deliveryVolume.reduce((s: number, d: any) => s + d.count, 0)}</Text>
                <Text style={styles.statLabel}>Total (6 months)</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{Math.round(data.deliveryVolume.reduce((s: number, d: any) => s + d.count, 0) / 6)}</Text>
                <Text style={styles.statLabel}>Monthly Avg</Text>
              </View>
            </View>
          </>
        )}

        {activeTab === 'cost' && (
          <>
            <Text style={styles.chartTitle}>Cost per Route</Text>
            <Text style={styles.chartSubtitle}>Average cost and trip frequency</Text>
            {data.costByRoute.map((item: any, index: number) => (
              <View key={item.route} style={styles.costRow}>
                <View style={styles.costRank}>
                  <Text style={styles.costRankText}>{index + 1}</Text>
                </View>
                <View style={styles.costInfo}>
                  <Text style={styles.costRoute}>{item.route}</Text>
                  <Text style={styles.costTrips}>{item.trips} trips</Text>
                </View>
                <Text style={styles.costValue}>£{item.avgCost.toFixed(2)}</Text>
              </View>
            ))}

            <View style={styles.costSummary}>
              <Text style={styles.costSummaryTitle}>Cost Insights</Text>
              <Text style={styles.costSummaryText}>
                Your highest-cost route is Swansea → Cardiff at £145.50 avg. Consider consolidating shipments to reduce per-unit costs.
              </Text>
            </View>
          </>
        )}

        {activeTab === 'emissions' && (
          <>
            <Text style={styles.chartTitle}>Carbon Emissions Tracking</Text>
            <Text style={styles.chartSubtitle}>Monthly CO₂ emissions (kg)</Text>
            <View style={styles.barChartCard}>
              <View style={styles.barChart}>
                {data.emissionsMonthly.map((item: any) => {
                  const heightPct = (item.kgCO2 / maxEmissions) * 100;
                  return (
                    <View key={item.month} style={styles.barWrap}>
                      <View style={styles.barOuter}>
                        <View style={[styles.bar, { height: `${heightPct}%`, backgroundColor: '#0066FF' }]} />
                      </View>
                      <Text style={styles.barLabel}>{item.month}</Text>
                      <Text style={styles.barValue}>{item.kgCO2}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={styles.emissionsSummary}>
              <View style={[styles.emissionsCard, { borderLeftColor: '#0066FF' }]}>
                <Leaf size={18} color="#0066FF" />
                <View>
                  <Text style={styles.emissionsValue}>{data.emissionsMonthly.reduce((s: number, d: any) => s + d.kgCO2, 0).toLocaleString()} kg</Text>
                  <Text style={styles.emissionsLabel}>Total CO₂ (6 months)</Text>
                </View>
              </View>
              <View style={[styles.emissionsCard, { borderLeftColor: Colors.customerPrimary }]}>
                <TrendingUp size={18} color={Colors.customerPrimary} />
                <View>
                  <Text style={styles.emissionsValue}>-4.3%</Text>
                  <Text style={styles.emissionsLabel}>vs. Previous Period</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {activeTab === 'comparison' && (
          <>
            <Text style={styles.chartTitle}>Performance vs. Platform Average</Text>
            <Text style={styles.chartSubtitle}>How you compare with other businesses</Text>
            {data.performanceComparison.map((item: any) => {
              const yourWidth = item.yours;
              const avgWidth = item.average;
              const isBetter = item.yours >= item.average;
              return (
                <View key={item.metric} style={styles.comparisonItem}>
                  <Text style={styles.comparisonMetric}>{item.metric}</Text>
                  <View style={styles.comparisonBars}>
                    <View style={styles.comparisonBarRow}>
                      <Text style={styles.comparisonBarLabel}>You</Text>
                      <View style={styles.comparisonBarContainer}>
                        <View style={[styles.comparisonBar, { width: `${yourWidth}%`, backgroundColor: isBetter ? Colors.customerPrimary : Colors.warning }]} />
                      </View>
                      <Text style={[styles.comparisonValue, { color: isBetter ? Colors.customerPrimary : Colors.warning }]}>{item.yours}%</Text>
                    </View>
                    <View style={styles.comparisonBarRow}>
                      <Text style={styles.comparisonBarLabel}>Avg</Text>
                      <View style={styles.comparisonBarContainer}>
                        <View style={[styles.comparisonBar, { width: `${avgWidth}%`, backgroundColor: Colors.textMuted + '60' }]} />
                      </View>
                      <Text style={styles.comparisonValue}>{item.average}%</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  tabBar: { backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border, maxHeight: 56 },
  tabBarContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.surfaceAlt, gap: 6 },
  tabActive: { backgroundColor: Colors.customerPrimary },
  tabText: { fontSize: 13, fontWeight: '600' as const, color: Colors.textSecondary },
  tabTextActive: { color: '#FFFFFF' },
  body: { flex: 1 },
  bodyContent: { padding: 16 },
  chartTitle: { fontSize: 18, fontWeight: '800' as const, color: Colors.text, marginBottom: 4 },
  chartSubtitle: { fontSize: 13, color: Colors.textSecondary, marginBottom: 16 },
  chartCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 12, marginBottom: 16 },
  slaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  slaMonth: { width: 32, fontSize: 12, fontWeight: '600' as const, color: Colors.textSecondary },
  slaBarContainer: { flex: 1, height: 20, backgroundColor: Colors.borderLight, borderRadius: 6, overflow: 'hidden', position: 'relative' as const },
  slaBar: { height: '100%', borderRadius: 6 },
  slaTarget: { position: 'absolute' as const, top: 0, bottom: 0, width: 2, backgroundColor: Colors.danger },
  slaValue: { width: 46, fontSize: 13, fontWeight: '700' as const, textAlign: 'right' as const },
  legendRow: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: Colors.textMuted },
  barChartCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: 16 },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 160 },
  barWrap: { flex: 1, alignItems: 'center', gap: 4 },
  barOuter: { width: '100%', height: 120, justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 6, minHeight: 4 },
  barLabel: { fontSize: 11, fontWeight: '600' as const, color: Colors.textMuted },
  barValue: { fontSize: 11, fontWeight: '700' as const, color: Colors.text },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  statValue: { fontSize: 22, fontWeight: '800' as const, color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  costRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.border, gap: 12 },
  costRank: { width: 28, height: 28, borderRadius: 8, backgroundColor: Colors.customerPrimary + '15', alignItems: 'center', justifyContent: 'center' },
  costRankText: { fontSize: 13, fontWeight: '700' as const, color: Colors.customerPrimary },
  costInfo: { flex: 1 },
  costRoute: { fontSize: 14, fontWeight: '600' as const, color: Colors.text },
  costTrips: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  costValue: { fontSize: 16, fontWeight: '800' as const, color: Colors.customerPrimary },
  costSummary: { backgroundColor: '#CCFBF1', borderRadius: 14, padding: 16, marginTop: 8 },
  costSummaryTitle: { fontSize: 14, fontWeight: '700' as const, color: Colors.customerPrimaryDark, marginBottom: 6 },
  costSummaryText: { fontSize: 13, color: Colors.customerPrimaryDark, lineHeight: 20 },
  emissionsSummary: { flexDirection: 'row', gap: 10 },
  emissionsCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, borderLeftWidth: 3 },
  emissionsValue: { fontSize: 16, fontWeight: '800' as const, color: Colors.text },
  emissionsLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  comparisonItem: { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  comparisonMetric: { fontSize: 15, fontWeight: '700' as const, color: Colors.text, marginBottom: 12 },
  comparisonBars: { gap: 8 },
  comparisonBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  comparisonBarLabel: { width: 28, fontSize: 11, fontWeight: '600' as const, color: Colors.textMuted },
  comparisonBarContainer: { flex: 1, height: 14, backgroundColor: Colors.borderLight, borderRadius: 7, overflow: 'hidden' },
  comparisonBar: { height: '100%', borderRadius: 7 },
  comparisonValue: { width: 42, fontSize: 12, fontWeight: '700' as const, color: Colors.textSecondary, textAlign: 'right' as const },
});
