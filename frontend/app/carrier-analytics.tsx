import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Stack } from 'expo-router';
import {
  TrendingUp,
  Clock,
  CheckCircle,
  Briefcase,
  AlertTriangle,
  Star,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  MapPin,
  Brain,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

type AnalyticsTab = 'performance' | 'delays' | 'ai';

export default function CarrierAnalyticsScreen() {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('performance');
  const [refreshing, setRefreshing] = useState(false);
  
  // Real data state
  const [performance, setPerformance] = useState<any[]>([
    { month: new Date().toLocaleDateString('en-GB', { month: 'short' }), slaCompliance: 100, onTimePercent: 100, revenue: 0, avgRating: 5.0, jobsCompleted: 0 }
  ]);
  const [delays, setDelays] = useState<any[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const latest = performance[performance.length - 1];
  const previous = performance[performance.length - 2] || latest;

  const slaDelta = latest.slaCompliance - previous.slaCompliance;
  const onTimeDelta = latest.onTimePercent - previous.onTimePercent;
  const revenueDelta = previous.revenue > 0 ? ((latest.revenue - previous.revenue) / previous.revenue * 100) : 0;

  const maxRevenue = Math.max(...performance.map((p: any) => p.revenue)) || 1000;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Performance Analytics' }} />

      <View style={styles.tabBar}>
        {([
          { key: 'performance' as const, label: 'Performance', icon: TrendingUp },
          { key: 'delays' as const, label: 'Delays', icon: Clock },
          { key: 'ai' as const, label: 'AI Insights', icon: Brain },
        ]).map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => {
              setActiveTab(tab.key);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <tab.icon size={14} color={activeTab === tab.key ? '#FFF' : Colors.textSecondary} />
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.carrierPrimary} />
        }
      >
        {activeTab === 'performance' && (
          <>
            <View style={styles.kpiGrid}>
              <KPICard
                title="SLA Compliance"
                value={`${latest.slaCompliance}%`}
                delta={slaDelta}
                icon={CheckCircle}
                color={Colors.success}
              />
              <KPICard
                title="On-Time Rate"
                value={`${latest.onTimePercent}%`}
                delta={onTimeDelta}
                icon={Clock}
                color={Colors.info}
              />
              <KPICard
                title="Revenue"
                value={`£${latest.revenue.toLocaleString()}`}
                delta={revenueDelta}
                icon={TrendingUp}
                color={Colors.carrierPrimary}
              />
              <KPICard
                title="Avg Rating"
                value={latest.avgRating.toFixed(1)}
                delta={latest.avgRating - previous.avgRating}
                icon={Star}
                color={Colors.warning}
              />
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Monthly Revenue Trend</Text>
              <View style={styles.chart}>
                {performance.map((p: any) => (
                  <View key={p.month} style={styles.barCol}>
                    <Text style={styles.barValue}>£{(p.revenue / 1000).toFixed(1)}k</Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: `${(p.revenue / maxRevenue) * 100}%`,
                            backgroundColor: p.month === latest.month ? Colors.carrierPrimary : Colors.carrierPrimary + '40',
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.barLabel}>{p.month}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Performance by Month</Text>
              {performance.map((p: any, i: number) => (
                <View key={p.month} style={[styles.perfRow, i === performance.length - 1 && { borderBottomWidth: 0 }]}>
                  <Text style={styles.perfMonth}>{p.month}</Text>
                  <View style={styles.perfMetrics}>
                    <View style={styles.perfMetricItem}>
                      <View style={[styles.perfDot, { backgroundColor: Colors.success }]} />
                      <Text style={styles.perfMetricValue}>{p.slaCompliance}%</Text>
                    </View>
                    <View style={styles.perfMetricItem}>
                      <View style={[styles.perfDot, { backgroundColor: Colors.info }]} />
                      <Text style={styles.perfMetricValue}>{p.onTimePercent}%</Text>
                    </View>
                    <View style={styles.perfMetricItem}>
                      <View style={[styles.perfDot, { backgroundColor: Colors.warning }]} />
                      <Text style={styles.perfMetricValue}>{p.avgRating}</Text>
                    </View>
                  </View>
                  <Text style={styles.perfJobs}>{p.jobsCompleted} jobs</Text>
                </View>
              ))}
              <View style={styles.perfLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.perfDot, { backgroundColor: Colors.success }]} />
                  <Text style={styles.legendText}>SLA</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.perfDot, { backgroundColor: Colors.info }]} />
                  <Text style={styles.legendText}>On-time</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.perfDot, { backgroundColor: Colors.warning }]} />
                  <Text style={styles.legendText}>Rating</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {activeTab === 'delays' && (
          <>
            <View style={styles.delayHeader}>
              <AlertTriangle size={20} color={Colors.warning} />
              <View>
                <Text style={styles.delayHeaderTitle}>Delay Breakdown</Text>
                <Text style={styles.delayHeaderSub}>Last 30 days · {delays.reduce((a: number, b: any) => a + b.count, 0)} total incidents</Text>
              </View>
            </View>

            {delays.map((delay: any, i: number) => {
              const maxCount = Math.max(...delays.map((d: any) => d.count)) || 1;
              const pct = (delay.count / maxCount) * 100;
              return (
                <View key={i} style={styles.delayCard}>
                  <View style={styles.delayTop}>
                    <Text style={styles.delayReason}>{delay.reason}</Text>
                    <View style={styles.delayCount}>
                      <Text style={styles.delayCountText}>{delay.count}x</Text>
                    </View>
                  </View>
                  <View style={styles.delayBar}>
                    <View style={[styles.delayBarFill, { width: `${pct}%` }]} />
                  </View>
                  <View style={styles.delayMeta}>
                    <View style={styles.delayMetaItem}>
                      <Clock size={11} color={Colors.textMuted} />
                      <Text style={styles.delayMetaText}>Avg: {delay.avgDelayMins} mins</Text>
                    </View>
                    <View style={styles.delayMetaItem}>
                      <MapPin size={11} color={Colors.textMuted} />
                      <Text style={styles.delayMetaText}>{(delay.routes || []).join(', ')}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
            {delays.length === 0 && (
              <View style={styles.emptyState}>
                <Clock size={40} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>No delays recorded</Text>
              </View>
            )}
          </>
        )}

        {activeTab === 'ai' && (
          <>
            <View style={styles.aiHeader}>
              <View style={styles.aiHeaderIcon}>
                <Brain size={24} color={Colors.carrierPrimary} />
              </View>
              <Text style={styles.aiHeaderTitle}>AI Performance Suggestions</Text>
              <Text style={styles.aiHeaderSub}>
                Based on your delivery data and performance metrics
              </Text>
            </View>

            {aiSuggestions.map((suggestion: any) => {
              const impactColor = suggestion.impact === 'HIGH'
                ? Colors.danger
                : suggestion.impact === 'MEDIUM'
                  ? Colors.warning
                  : Colors.info;
              const impactBg = suggestion.impact === 'HIGH'
                ? Colors.dangerLight
                : suggestion.impact === 'MEDIUM'
                  ? Colors.warningLight
                  : Colors.infoLight;
              return (
                <View key={suggestion.id} style={styles.aiCard}>
                  <View style={styles.aiCardTop}>
                    <Zap size={16} color={Colors.carrierPrimary} />
                    <Text style={styles.aiCardTitle}>{suggestion.title}</Text>
                    <View style={[styles.impactBadge, { backgroundColor: impactBg }]}>
                      <Text style={[styles.impactText, { color: impactColor }]}>
                        {suggestion.impact}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.aiCardDesc}>{suggestion.description}</Text>
                </View>
              );
            })}
            {aiSuggestions.length === 0 && (
              <View style={styles.emptyState}>
                <Brain size={40} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>No AI suggestions yet</Text>
              </View>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function KPICard({ title, value, delta, icon: Icon, color }: {
  title: string;
  value: string;
  delta: number;
  icon: React.ComponentType<{ size: number; color: string }>;
  color: string;
}) {
  const isPositive = delta >= 0;
  return (
    <View style={[styles.kpiCard, { borderLeftColor: color }]}>
      <View style={[styles.kpiIcon, { backgroundColor: color + '15' }]}>
        <Icon size={16} color={color} />
      </View>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiTitle}>{title}</Text>
      <View style={styles.kpiDelta}>
        {isPositive
          ? <ArrowUpRight size={11} color={Colors.success} />
          : <ArrowDownRight size={11} color={Colors.danger} />
        }
        <Text style={[styles.kpiDeltaText, { color: isPositive ? Colors.success : Colors.danger }]}>
          {isPositive ? '+' : ''}{delta.toFixed(1)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabBar: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.surfaceAlt,
    gap: 5,
  },
  tabActive: {
    backgroundColor: Colors.carrierPrimary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 3,
  },
  kpiIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  kpiTitle: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  kpiDelta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 6,
  },
  kpiDeltaText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  chartCard: {
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
    height: 140,
    gap: 6,
  },
  barCol: {
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
  perfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  perfMonth: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    width: 36,
  },
  perfMetrics: {
    flex: 1,
    flexDirection: 'row',
    gap: 14,
  },
  perfMetricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  perfDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  perfMetricValue: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  perfJobs: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  perfLegend: {
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
  delayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    backgroundColor: Colors.warningLight,
    padding: 14,
    borderRadius: 14,
  },
  delayHeaderTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  delayHeaderSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  delayCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  delayTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  delayReason: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  delayCount: {
    backgroundColor: Colors.warningLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  delayCountText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.warning,
  },
  delayBar: {
    height: 6,
    backgroundColor: Colors.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  delayBarFill: {
    height: '100%',
    backgroundColor: Colors.warning,
    borderRadius: 3,
  },
  delayMeta: {
    gap: 6,
  },
  delayMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  delayMetaText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  aiHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 16,
  },
  aiHeaderIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.carrierPrimary + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  aiHeaderTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  aiHeaderSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    paddingHorizontal: 20,
  },
  aiCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  aiCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  aiCardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  impactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  impactText: {
    fontSize: 10,
    fontWeight: '700' as const,
  },
  aiCardDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '600',
    marginTop: 12,
  },
});
