import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  TrendingUp,
  Clock,
  MapPin,
  Briefcase,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  CheckCircle,
  BarChart3,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import { apiClient } from '@/services/api';

const SettlementHistoryList = ({ history, isCarrier }: { history: any[], isCarrier?: boolean }) => {
  if (!history || history.length === 0) return null;
  return (
    <View style={styles.chartSection}>
      <Text style={styles.chartTitle}>Settlement History</Text>
      <View style={{ marginTop: 10, borderTopWidth: 1, borderColor: Colors.border }}>
        {history.map((s, i) => (
          <View key={s.id || i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderColor: Colors.border }}>
            <View>
              <Text style={{ fontSize: 13, color: Colors.textMuted, marginBottom: 4 }}>
                {s.jobsCount} Jobs • {new Date(s.createdAt || s.periodStart).toLocaleDateString()}
              </Text>
              <Text style={{ fontSize: 14, fontWeight: '500', color: Colors.text }}>
                Ref: {s.id.slice(0, 8).toUpperCase()}
              </Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: s.status === 'PAID' ? Colors.success : Colors.warning, marginTop: 4 }}>
                {s.status}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 14, color: Colors.textSecondary }}>Gross: £{(s.grossAmount || 0).toFixed(2)}</Text>
              {!isCarrier && s.totalDeductions > 0 && <Text style={{ fontSize: 13, color: Colors.danger }}>Tax/NI: -£{s.totalDeductions.toFixed(2)}</Text>}
              <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.text, marginTop: 4 }}>Net Pay: £{(s.netAmount || 0).toFixed(2)}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};
type Period = 'week' | 'month';

function DriverEarningsScreen() {
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<Period>('week');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const amountAnim = useRef(new Animated.Value(0)).current;

  const loadData = async (p: Period) => {
    setError(null);
    try {
      const res = await apiClient(`/analytics/earnings?period=${p}`);
      setData(res.data ?? res);
    } catch (err: any) {
      console.error('Failed to load earnings:', err);
      setError(err?.message || 'Unable to load earnings data.');
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadData(period);
  }, [period]);

  useEffect(() => {
    if (!loading && data) {
      Animated.timing(amountAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  }, [amountAnim, loading, data]);

  const switchPeriod = useCallback((p: Period) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPeriod(p);
    amountAnim.setValue(0);
    Animated.spring(amountAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [amountAnim]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(period);
  }, [period]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <TrendingUp size={48} color={Colors.textMuted} style={{ opacity: 0.4 }} />
        <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.text, marginTop: 16, textAlign: 'center' }}>
          Unable to Load Earnings
        </Text>
        <Text style={{ fontSize: 13, color: Colors.textMuted, marginTop: 8, textAlign: 'center' }}>
          {error}
        </Text>
        <TouchableOpacity
          onPress={() => { setLoading(true); loadData(period); }}
          style={{ marginTop: 20, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const summary = data?.summary ?? {};
  const netPay = summary.netPay ?? 0;
  const grossPay = summary.grossPay ?? 0;
  const deductions = summary.deductions ?? 0;
  const jobsCompleted = summary.jobsCompleted ?? 0;
  const hoursWorked = summary.hoursWorked ?? 0;
  const milesDriven = summary.milesDriven ?? 0;
  const weeklyEarnings = data?.weeklyEarnings ?? [];
  const maxDaily = Math.max(...weeklyEarnings.map((d: any) => d.amount ?? 0), 1);

  // Empty state
  if (jobsCompleted === 0 && netPay === 0) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { justifyContent: 'center' }]}>
          <Text style={styles.headerTitle}>Earnings</Text>
          <Text style={{ color: Colors.textMuted, fontSize: 13, marginTop: 4 }}>
            {period === 'week' ? 'This Week' : 'This Month'}
          </Text>
          <Text style={{ fontSize: 36, fontWeight: '800', color: Colors.textInverse, marginTop: 8 }}>£0.00</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Briefcase size={56} color={Colors.textMuted} style={{ opacity: 0.3 }} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.text, marginTop: 20, textAlign: 'center' }}>
            No earnings yet
          </Text>
          <Text style={{ fontSize: 13, color: Colors.textMuted, marginTop: 8, textAlign: 'center', lineHeight: 20 }}>
            Your earnings will appear here once you complete your first job. Accept a job to get started!
          </Text>
        </View>
      </View>
    );
  }



  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Earnings</Text>

        <View style={styles.periodToggle}>
          <TouchableOpacity
            style={[styles.periodBtn, period === 'week' && styles.periodBtnActive]}
            onPress={() => switchPeriod('week')}
          >
            <Text style={[styles.periodText, period === 'week' && styles.periodTextActive]}>This Week</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodBtn, period === 'month' && styles.periodBtnActive]}
            onPress={() => switchPeriod('month')}
          >
            <Text style={[styles.periodText, period === 'month' && styles.periodTextActive]}>This Month</Text>
          </TouchableOpacity>
        </View>

        <Animated.View style={[styles.earningsHero, { opacity: amountAnim, transform: [{ scale: amountAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] }]}>
          <Text style={styles.earningsLabel}>Net Earnings</Text>
          <Text style={styles.earningsAmount}>£{netPay.toFixed(2)}</Text>
          <View style={styles.earningsDelta}>
            <ArrowUpRight size={14} color={Colors.success} />
            <Text style={styles.earningsDeltaText}>+12% vs last {period}</Text>
          </View>
        </Animated.View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: Colors.successLight }]}>
              <TrendingUp size={16} color={Colors.success} />
            </View>
            <Text style={styles.statItemValue}>£{grossPay.toFixed(2)}</Text>
            <Text style={styles.statItemLabel}>Gross Pay</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: Colors.dangerLight }]}>
              <ArrowDownRight size={16} color={Colors.danger} />
            </View>
            <Text style={styles.statItemValue}>£{deductions.toFixed(2)}</Text>
            <Text style={styles.statItemLabel}>Tax/NI Deduct</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: Colors.infoLight }]}>
              <Briefcase size={16} color={Colors.info} />
            </View>
            <Text style={styles.statItemValue}>{jobsCompleted}</Text>
            <Text style={styles.statItemLabel}>Jobs</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: Colors.warningLight }]}>
              <Clock size={16} color={Colors.warning} />
            </View>
            <Text style={styles.statItemValue}>{hoursWorked}h</Text>
            <Text style={styles.statItemLabel}>Hours</Text>
          </View>
        </View>

        {period === 'week' && weeklyEarnings.length > 0 && (
          <View style={styles.chartSection}>
            <Text style={styles.chartTitle}>Daily Breakdown</Text>
            <View style={styles.chart}>
              {weeklyEarnings.map((day: any) => (
                <View key={day.date} style={styles.barContainer}>
                  <Text style={styles.barValue}>
                    {day.amount > 0 ? `£${day.amount.toFixed(0)}` : ''}
                  </Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${Math.max((day.amount / maxDaily) * 100, 3)}%`,
                          backgroundColor: day.amount > 0 ? Colors.primary : Colors.border,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{day.dayLabel}</Text>
                  <Text style={styles.barJobs}>{day.jobs} jobs</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.milesSection}>
          <View style={styles.milesCard}>
            <MapPin size={20} color={Colors.primary} />
            <View style={styles.milesInfo}>
              <Text style={styles.milesValue}>{milesDriven.toFixed(1)} miles</Text>
              <Text style={styles.milesLabel}>Total distance driven</Text>
            </View>
            <Text style={styles.milesRate}>
              £{(netPay / Math.max(milesDriven, 1)).toFixed(2)}/mi
            </Text>
          </View>
        </View>

        {data?.history && <SettlementHistoryList history={data.history} />}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

function CarrierRevenueScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const amountAnim = useRef(new Animated.Value(0)).current;

  const loadData = async () => {
    try {
      const res = await apiClient(`/analytics/earnings?period=month`);
      setData(res.data);
    } catch (error) {
      console.error('Failed to load carrier revenue:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!loading && data) {
      Animated.timing(amountAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  }, [amountAnim, loading, data]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  if (loading || !data) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.carrierPrimary} />
      </View>
    );
  }

  const earnings = data;
  const monthlyData = data.monthlyData || [];
  const performance = data.performance || [];
  const maxRevenue = Math.max(...monthlyData.map((r: any) => r.revenue), 1);

  return (
    <View style={styles.container}>
      <View style={[styles.carrierHeader, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Revenue</Text>
        <Text style={styles.carrierPeriod}>{earnings.period}</Text>

        <Animated.View style={[styles.earningsHero, { opacity: amountAnim, transform: [{ scale: amountAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] }]}>
          <Text style={styles.earningsLabel}>Total Revenue</Text>
          <Text style={styles.earningsAmount}>£{earnings.totalRevenue.toLocaleString()}</Text>
          <View style={styles.earningsDelta}>
            <ArrowUpRight size={14} color={Colors.success} />
            <Text style={styles.earningsDeltaText}>+11% vs last month</Text>
          </View>
        </Animated.View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.carrierPrimary} />
        }
      >
        <View style={styles.carrierStatsGrid}>
          <View style={[styles.carrierStatCard, { borderLeftColor: Colors.success }]}>
            <View style={[styles.carrierStatIcon, { backgroundColor: Colors.successLight }]}>
              <DollarSign size={16} color={Colors.success} />
            </View>
            <Text style={styles.carrierStatValue}>£{earnings.paidOut.toLocaleString()}</Text>
            <Text style={styles.carrierStatLabel}>Paid Out</Text>
          </View>
          <View style={[styles.carrierStatCard, { borderLeftColor: Colors.warning }]}>
            <View style={[styles.carrierStatIcon, { backgroundColor: Colors.warningLight }]}>
              <Clock size={16} color={Colors.warning} />
            </View>
            <Text style={styles.carrierStatValue}>£{earnings.pendingPayment.toLocaleString()}</Text>
            <Text style={styles.carrierStatLabel}>Pending</Text>
          </View>
          <View style={[styles.carrierStatCard, { borderLeftColor: Colors.carrierPrimary }]}>
            <View style={[styles.carrierStatIcon, { backgroundColor: Colors.carrierPrimary + '15' }]}>
              <Briefcase size={16} color={Colors.carrierPrimary} />
            </View>
            <Text style={styles.carrierStatValue}>{earnings.completedJobs}</Text>
            <Text style={styles.carrierStatLabel}>Jobs Done</Text>
          </View>
          <View style={[styles.carrierStatCard, { borderLeftColor: Colors.info }]}>
            <View style={[styles.carrierStatIcon, { backgroundColor: Colors.infoLight }]}>
              <BarChart3 size={16} color={Colors.info} />
            </View>
            <Text style={styles.carrierStatValue}>£{earnings.avgPerJob.toFixed(0)}</Text>
            <Text style={styles.carrierStatLabel}>Avg/Job</Text>
          </View>
        </View>

        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Monthly Revenue</Text>
          <View style={styles.chart}>
            {monthlyData.map((item: any) => (
              <View key={item.month} style={styles.barContainer}>
                <Text style={styles.barValue}>£{(item.revenue / 1000).toFixed(1)}k</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: `${Math.max((item.revenue / maxRevenue) * 100, 3)}%`,
                        backgroundColor: item.month === 'Feb' ? Colors.carrierPrimary : Colors.carrierPrimary + '40',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{item.month}</Text>
                <Text style={styles.barJobs}>{item.jobs} jobs</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.performanceSection}>
          <Text style={styles.chartTitle}>Performance Trend</Text>
          {performance.slice(-3).map((p: any) => (
            <View key={p.month} style={styles.performanceRow}>
              <Text style={styles.performanceMonth}>{p.month}</Text>
              <View style={styles.performanceMetrics}>
                <View style={styles.performanceMetric}>
                  <CheckCircle size={12} color={Colors.success} />
                  <Text style={styles.performanceValue}>{p.onTimePercent}%</Text>
                </View>
                <View style={styles.performanceMetric}>
                  <TrendingUp size={12} color={Colors.carrierPrimary} />
                  <Text style={styles.performanceValue}>{p.slaCompliance}%</Text>
                </View>
                <View style={styles.performanceMetric}>
                  <Briefcase size={12} color={Colors.info} />
                  <Text style={styles.performanceValue}>{p.jobsCompleted}</Text>
                </View>
              </View>
              <Text style={styles.performanceRevenue}>£{p.revenue.toLocaleString()}</Text>
            </View>
          ))}
          <View style={styles.performanceLegend}>
            <View style={styles.legendItem}>
              <CheckCircle size={10} color={Colors.success} />
              <Text style={styles.legendText}>On-time</Text>
            </View>
            <View style={styles.legendItem}>
              <TrendingUp size={10} color={Colors.carrierPrimary} />
              <Text style={styles.legendText}>SLA</Text>
            </View>
            <View style={styles.legendItem}>
              <Briefcase size={10} color={Colors.info} />
              <Text style={styles.legendText}>Jobs</Text>
            </View>
          </View>
        </View>

        {data?.history && <SettlementHistoryList history={data.history} isCarrier={true} />}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

export default function EarningsScreen() {
  const { userRole } = useAuth();
  if (userRole === 'carrier') return <CarrierRevenueScreen />;
  return <DriverEarningsScreen />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.navy,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  carrierHeader: {
    backgroundColor: Colors.navy,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: Colors.textInverse,
    marginBottom: 4,
  },
  carrierPeriod: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 16,
  },
  periodToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.navyLight,
    borderRadius: 10,
    padding: 3,
    marginBottom: 20,
    marginTop: 12,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodBtnActive: {
    backgroundColor: Colors.primary,
  },
  periodText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  periodTextActive: {
    color: Colors.textInverse,
  },
  earningsHero: {
    alignItems: 'center',
  },
  earningsLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  earningsAmount: {
    fontSize: 40,
    fontWeight: '800' as const,
    color: Colors.textInverse,
    letterSpacing: -1,
  },
  earningsDelta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  earningsDeltaText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statItemValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statItemLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  carrierStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  carrierStatCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 3,
  },
  carrierStatIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  carrierStatValue: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  carrierStatLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  chartSection: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
    gap: 6,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
  },
  barValue: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 4,
    height: 12,
  },
  barTrack: {
    flex: 1,
    width: '80%',
    backgroundColor: Colors.borderLight,
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 6,
  },
  barJobs: {
    fontSize: 9,
    color: Colors.textMuted,
    marginTop: 2,
  },
  milesSection: {
    marginBottom: 16,
  },
  milesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  milesInfo: {
    flex: 1,
  },
  milesValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  milesLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  milesRate: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  performanceSection: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  performanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  performanceMonth: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    width: 40,
  },
  performanceMetrics: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  performanceMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  performanceValue: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  performanceRevenue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.carrierPrimary,
  },
  performanceLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
});
