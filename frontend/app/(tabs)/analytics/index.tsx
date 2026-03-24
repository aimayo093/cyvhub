import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BarChart3,
  TrendingUp,
  Target,
  Leaf,
  MapPin,
  Award,
  AlertTriangle,
  Building2,
  Brain,
  Zap,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { apiClient } from '@/services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TabKey = 'overview' | 'performance' | 'clients' | 'ai';

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const [analyticsRes, aiRes] = await Promise.all([
        apiClient('/analytics/platform'),
        apiClient('/ai/anomalies')
      ]);
      setStats(analyticsRes.stats);
      setAnalytics(analyticsRes.analytics);
      setClients(analyticsRes.clients);
      setAnomalies(aiRes.anomalies);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  if (loading || !analytics || !stats) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.adminPrimary} />
      </View>
    );
  }

  const MOCK_BUSINESS_ACCOUNTS = clients;
  const MOCK_ANOMALY_ALERTS = anomalies;

  const maxJobVolume = Math.max(...analytics.jobVolume.map((j: any) => j.count));
  const maxCarbon = Math.max(...analytics.carbonByMonth.map((c: any) => c.kgCO2));

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Analytics</Text>
            <Text style={styles.headerSubtitle}>Platform performance insights</Text>
          </View>
          <View style={styles.headerIcon}>
            <BarChart3 size={20} color={Colors.adminPrimary} />
          </View>
        </View>

        <View style={styles.tabRow}>
          {([
            { key: 'overview' as TabKey, label: 'Overview' },
            { key: 'performance' as TabKey, label: 'Performance' },
            { key: 'clients' as TabKey, label: 'Clients' },
            { key: 'ai' as TabKey, label: 'AI Insights' },
          ]).map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => { setActiveTab(tab.key); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.adminPrimary} />}
      >
        {activeTab === 'overview' && (
          <>
            <View style={styles.kpiRow}>
              <View style={[styles.kpiCard, { borderLeftColor: Colors.adminPrimary }]}>
                <TrendingUp size={16} color={Colors.adminPrimary} />
                <Text style={styles.kpiValue}>{stats.slaComplianceRate}%</Text>
                <Text style={styles.kpiLabel}>SLA Compliance</Text>
              </View>
              <View style={[styles.kpiCard, { borderLeftColor: Colors.success }]}>
                <Leaf size={16} color={Colors.success} />
                <Text style={styles.kpiValue}>{(stats.carbonSavedKg / 1000).toFixed(1)}t</Text>
                <Text style={styles.kpiLabel}>CO2 Tracked</Text>
              </View>
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Job Volume Trend</Text>
              <View style={styles.barChart}>
                {analytics.jobVolume.map((item: any) => (
                  <View key={item.month} style={styles.barWrap}>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { height: `${(item.count / maxJobVolume) * 100}%`, backgroundColor: Colors.adminPrimary }]} />
                    </View>
                    <Text style={styles.barLabel}>{item.month}</Text>
                    <Text style={styles.barValue}>{item.count}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>SLA Compliance Rate</Text>
              <View style={styles.barChart}>
                {analytics.slaCompliance.map((item: any) => (
                  <View key={item.month} style={styles.barWrap}>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, {
                        height: `${item.rate}%`,
                        backgroundColor: item.rate >= 93 ? Colors.success : item.rate >= 90 ? Colors.warning : Colors.danger,
                      }]} />
                    </View>
                    <Text style={styles.barLabel}>{item.month}</Text>
                    <Text style={styles.barValue}>{item.rate}%</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <AlertTriangle size={16} color={Colors.warning} />
                <Text style={styles.sectionTitle}>Delay Hotspots</Text>
              </View>
              {analytics.delayHotspots.map((spot: any, i: any) => (
                <View key={i} style={styles.hotspotCard}>
                  <MapPin size={14} color={Colors.danger} />
                  <View style={styles.hotspotInfo}>
                    <Text style={styles.hotspotName}>{spot.location}</Text>
                    <Text style={styles.hotspotMeta}>{spot.incidents} incidents · avg {spot.avgDelay}min delay</Text>
                  </View>
                  <View style={[styles.delayBadge, { backgroundColor: spot.avgDelay > 15 ? Colors.dangerLight : Colors.warningLight }]}>
                    <Text style={[styles.delayText, { color: spot.avgDelay > 15 ? Colors.danger : Colors.warning }]}>+{spot.avgDelay}m</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {activeTab === 'performance' && (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Award size={16} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Top Drivers</Text>
              </View>
              {analytics.topDrivers.map((driver: any, i: any) => (
                <View key={i} style={styles.performerCard}>
                  <View style={[styles.rankBadge, { backgroundColor: i === 0 ? '#FEF3C7' : Colors.surfaceAlt }]}>
                    <Text style={[styles.rankText, { color: i === 0 ? Colors.warning : Colors.textSecondary }]}>#{i + 1}</Text>
                  </View>
                  <View style={styles.performerInfo}>
                    <Text style={styles.performerName}>{driver.name}</Text>
                    <Text style={styles.performerMeta}>{driver.jobs} jobs · {driver.rating} rating</Text>
                  </View>
                  <View style={[styles.slaPill, { backgroundColor: driver.sla >= 95 ? Colors.successLight : Colors.warningLight }]}>
                    <Text style={[styles.slaValue, { color: driver.sla >= 95 ? Colors.success : Colors.warning }]}>{driver.sla}%</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Award size={16} color={Colors.carrierPrimary} />
                <Text style={styles.sectionTitle}>Top Carriers</Text>
              </View>
              {analytics.topCarriers.map((carrier: any, i: any) => (
                <View key={i} style={styles.performerCard}>
                  <View style={[styles.rankBadge, { backgroundColor: i === 0 ? '#FEF3C7' : Colors.surfaceAlt }]}>
                    <Text style={[styles.rankText, { color: i === 0 ? Colors.warning : Colors.textSecondary }]}>#{i + 1}</Text>
                  </View>
                  <View style={styles.performerInfo}>
                    <Text style={styles.performerName}>{carrier.name}</Text>
                    <Text style={styles.performerMeta}>{carrier.jobs} jobs · {carrier.rating} rating</Text>
                  </View>
                  <View style={[styles.slaPill, { backgroundColor: carrier.sla >= 93 ? Colors.successLight : Colors.warningLight }]}>
                    <Text style={[styles.slaValue, { color: carrier.sla >= 93 ? Colors.success : Colors.warning }]}>{carrier.sla}%</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MapPin size={16} color={Colors.info} />
                <Text style={styles.sectionTitle}>Cost Per Route</Text>
              </View>
              {analytics.costPerRoute.map((route: any, i: any) => (
                <View key={i} style={styles.routeCard}>
                  <Text style={styles.routeName}>{route.route}</Text>
                  <View style={styles.routeStats}>
                    <Text style={styles.routeJobs}>{route.jobs} jobs</Text>
                    <Text style={styles.routeCost}>avg £{route.avgCost}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {activeTab === 'clients' && (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Building2 size={16} color={Colors.businessPrimary} />
                <Text style={styles.sectionTitle}>Top Business Clients</Text>
              </View>
              {MOCK_BUSINESS_ACCOUNTS.filter((b: any) => b.status === 'ACTIVE').sort((a: any, b: any) => b.totalSpend - a.totalSpend).map((biz: any, i: any) => (
                <View key={biz.id} style={styles.performerCard}>
                  <View style={[styles.rankBadge, { backgroundColor: i === 0 ? '#FEF3C7' : Colors.surfaceAlt }]}>
                    <Text style={[styles.rankText, { color: i === 0 ? Colors.warning : Colors.textSecondary }]}>#{i + 1}</Text>
                  </View>
                  <View style={styles.performerInfo}>
                    <Text style={styles.performerName}>{biz.tradingName}</Text>
                    <Text style={styles.performerMeta}>{biz.totalJobs} jobs · {biz.industryProfile}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' as const }}>
                    <Text style={{ fontSize: 14, fontWeight: '700' as const, color: Colors.text }}>£{(biz.totalSpend / 1000).toFixed(1)}k</Text>
                    <View style={[styles.slaPill, { backgroundColor: biz.slaCompliance >= 95 ? Colors.successLight : biz.slaCompliance >= 90 ? Colors.warningLight : Colors.dangerLight }]}>
                      <Text style={[styles.slaValue, { color: biz.slaCompliance >= 95 ? Colors.success : biz.slaCompliance >= 90 ? Colors.warning : Colors.danger }]}>{biz.slaCompliance}%</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <TrendingUp size={16} color={Colors.success} />
                <Text style={styles.sectionTitle}>Client Revenue Breakdown</Text>
              </View>
              {MOCK_BUSINESS_ACCOUNTS.filter((b: any) => b.totalSpend > 0).sort((a: any, b: any) => b.totalSpend - a.totalSpend).map((biz: any) => {
                const maxSpend = Math.max(...MOCK_BUSINESS_ACCOUNTS.map((b: any) => b.totalSpend));
                const pct = (biz.totalSpend / maxSpend) * 100;
                return (
                  <View key={biz.id} style={styles.routeCard}>
                    <View style={{ flexDirection: 'row' as const, justifyContent: 'space-between' as const, marginBottom: 6 }}>
                      <Text style={styles.routeName}>{biz.tradingName}</Text>
                      <Text style={{ fontSize: 13, fontWeight: '700' as const, color: Colors.text }}>£{biz.totalSpend.toLocaleString()}</Text>
                    </View>
                    <View style={{ height: 6, backgroundColor: Colors.borderLight, borderRadius: 3 }}>
                      <View style={{ height: 6, width: `${pct}%`, backgroundColor: Colors.businessPrimary, borderRadius: 3 }} />
                    </View>
                    <View style={styles.routeStats}>
                      <Text style={styles.routeJobs}>{biz.totalJobs} jobs</Text>
                      <Text style={styles.routeCost}>Balance: £{biz.currentBalance.toFixed(0)}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {activeTab === 'ai' && (
          <>
            <View style={styles.kpiRow}>
              <View style={[styles.kpiCard, { borderLeftColor: Colors.adminPrimary }]}>
                <Brain size={16} color={Colors.adminPrimary} />
                <Text style={styles.kpiValue}>{MOCK_ANOMALY_ALERTS.filter((a: any) => !a.acknowledged).length}</Text>
                <Text style={styles.kpiLabel}>Active Alerts</Text>
              </View>
              <View style={[styles.kpiCard, { borderLeftColor: Colors.warning }]}>
                <Zap size={16} color={Colors.warning} />
                <Text style={styles.kpiValue}>{MOCK_ANOMALY_ALERTS.filter((a: any) => a.severity === 'CRITICAL').length}</Text>
                <Text style={styles.kpiLabel}>Critical</Text>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Brain size={16} color={Colors.adminPrimary} />
                <Text style={styles.sectionTitle}>AI-Detected Anomalies</Text>
              </View>
              {MOCK_ANOMALY_ALERTS.map((alert: any) => {
                const sevColor = alert.severity === 'CRITICAL' ? Colors.danger : alert.severity === 'WARNING' ? Colors.warning : Colors.info;
                return (
                  <View key={alert.id} style={[styles.hotspotCard, { borderLeftWidth: 3, borderLeftColor: sevColor }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.hotspotName}>{alert.title}</Text>
                      <Text style={styles.hotspotMeta}>{alert.type.replace(/_/g, ' ')} · {alert.affectedEntity}</Text>
                      <Text style={{ fontSize: 11, color: Colors.info, marginTop: 4, fontWeight: '500' as const }} numberOfLines={1}>{alert.suggestedAction}</Text>
                    </View>
                    <View style={[styles.delayBadge, { backgroundColor: alert.severity === 'CRITICAL' ? Colors.dangerLight : alert.severity === 'WARNING' ? Colors.warningLight : Colors.infoLight }]}>
                      <Text style={[styles.delayText, { color: sevColor }]}>{alert.severity}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={styles.tipsCard}>
              <Text style={styles.tipsTitle}>AI Performance Insights</Text>
              <View style={styles.tipItem}>
                <View style={[styles.tipDot, { backgroundColor: Colors.adminPrimary }]} />
                <Text style={styles.tipText}>Friday PM deliveries have 3× SLA breach rate — consider adding 30min buffer</Text>
              </View>
              <View style={styles.tipItem}>
                <View style={[styles.tipDot, { backgroundColor: Colors.warning }]} />
                <Text style={styles.tipText}>WalesExpress SLA dropped 6.6% this month — schedule performance review</Text>
              </View>
              <View style={styles.tipItem}>
                <View style={[styles.tipDot, { backgroundColor: Colors.success }]} />
                <Text style={styles.tipText}>Iwan Davies has highest SLA (97.8%) — consider for priority assignments</Text>
              </View>
              <View style={styles.tipItem}>
                <View style={[styles.tipDot, { backgroundColor: Colors.danger }]} />
                <Text style={styles.tipText}>HGV costs on Pembrokeshire routes 23% above average — renegotiate carrier rates</Text>
              </View>
            </View>
          </>
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
  tabRow: { flexDirection: 'row', backgroundColor: Colors.navyLight, borderRadius: 10, padding: 3 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: Colors.adminPrimary },
  tabText: { fontSize: 12, fontWeight: '600' as const, color: Colors.textMuted },
  tabTextActive: { color: Colors.textInverse },
  body: { flex: 1 },
  bodyContent: { padding: 16 },
  kpiRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  kpiCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, borderLeftWidth: 3, alignItems: 'center', gap: 6 },
  kpiValue: { fontSize: 22, fontWeight: '800' as const, color: Colors.text },
  kpiLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '500' as const },
  chartCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  chartTitle: { fontSize: 14, fontWeight: '700' as const, color: Colors.text, marginBottom: 16 },
  barChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 130, gap: 6 },
  barWrap: { flex: 1, alignItems: 'center', gap: 4 },
  barTrack: { flex: 1, width: '80%', backgroundColor: Colors.borderLight, borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 6, minHeight: 4 },
  barLabel: { fontSize: 11, fontWeight: '600' as const, color: Colors.textMuted },
  barValue: { fontSize: 9, fontWeight: '600' as const, color: Colors.textSecondary },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700' as const, color: Colors.text },
  hotspotCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.border, gap: 10 },
  hotspotInfo: { flex: 1 },
  hotspotName: { fontSize: 13, fontWeight: '600' as const, color: Colors.text },
  hotspotMeta: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  delayBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  delayText: { fontSize: 11, fontWeight: '700' as const },
  performerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.border, gap: 10 },
  rankBadge: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 13, fontWeight: '800' as const },
  performerInfo: { flex: 1 },
  performerName: { fontSize: 14, fontWeight: '600' as const, color: Colors.text },
  performerMeta: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  slaPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  slaValue: { fontSize: 12, fontWeight: '700' as const },
  routeCard: { backgroundColor: Colors.surface, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  routeName: { fontSize: 13, fontWeight: '600' as const, color: Colors.text },
  routeStats: { flexDirection: 'row', gap: 12, marginTop: 6 },
  routeJobs: { fontSize: 12, color: Colors.textMuted },
  routeCost: { fontSize: 12, fontWeight: '600' as const, color: Colors.primary },
  carbonHero: { backgroundColor: Colors.surface, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#A7F3D0', gap: 8 },
  carbonHeroValue: { fontSize: 32, fontWeight: '800' as const, color: Colors.text },
  carbonHeroLabel: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
  tipsCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#A7F3D0' },
  tipsTitle: { fontSize: 14, fontWeight: '700' as const, color: Colors.text, marginBottom: 14 },
  tipItem: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  tipDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  tipText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
});
