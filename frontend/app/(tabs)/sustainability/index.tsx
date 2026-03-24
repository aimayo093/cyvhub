import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Leaf,
  TrendingDown,
  TrendingUp,
  Minus,
  Truck,
  MapPin,
  Building2,
  Zap,
  ArrowRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

const MOCK_SUSTAINABILITY_DATA = {
  monthlyTrend: [
    { month: 'Sep', kgCO2: 14500, jobCount: 420 },
    { month: 'Oct', kgCO2: 13800, jobCount: 415 },
    { month: 'Nov', kgCO2: 14200, jobCount: 430 },
    { month: 'Dec', kgCO2: 12500, jobCount: 390 },
    { month: 'Jan', kgCO2: 11800, jobCount: 405 },
    { month: 'Feb', kgCO2: 10500, jobCount: 385 },
  ],
  emissionsPerJob: [
    { jobNumber: 'CY-8901', route: 'Cardiff → London', kgCO2: 45.2, vehicleType: 'Medium Van' },
    { jobNumber: 'CY-8902', route: 'Swansea → Bristol', kgCO2: 28.5, vehicleType: 'Small Van' },
    { jobNumber: 'CY-8903', route: 'Newport → Birmingham', kgCO2: 35.8, vehicleType: 'Medium Van' },
  ],
  emissionsByRoute: [
    { route: 'Cardiff → London', totalKgCO2: 4520, jobs: 100, avgKgCO2: 45.2 },
    { route: 'Swansea → Bristol', totalKgCO2: 3420, jobs: 120, avgKgCO2: 28.5 },
    { route: 'Newport → Birmingham', totalKgCO2: 2864, jobs: 80, avgKgCO2: 35.8 },
  ],
  emissionsByBusiness: [
    { business: 'TechCorp Ltd', totalKgCO2: 2450, jobs: 85, trend: 'down' as const },
    { business: 'BuildCo Supplies', totalKgCO2: 3800, jobs: 60, trend: 'up' as const },
    { business: 'MedEquip Pro', totalKgCO2: 1250, jobs: 40, trend: 'stable' as const },
  ],
  aiSuggestions: [
    {
      id: 'sug-1',
      title: 'Batch Deliveries for BuildCo',
      description: 'BuildCo Supplies frequently orders multiple single items to the same site. Consolidating these into batch deliveries could save significant emissions.',
      potentialSaving: 450,
      difficulty: 'EASY',
    },
    {
      id: 'sug-2',
      title: 'EV Upgrade for Bristol Route',
      description: 'The Swansea → Bristol route is short enough for standard EV range. Upgrading 2 vans could eliminate tailpipe emissions for this segment.',
      potentialSaving: 1200,
      difficulty: 'HARD',
    },
  ],
};
type SustainTab = 'overview' | 'routes' | 'businesses' | 'suggestions';

function getTrendIcon(trend: 'up' | 'down' | 'stable') {
  switch (trend) {
    case 'up': return { Icon: TrendingUp, color: Colors.danger };
    case 'down': return { Icon: TrendingDown, color: Colors.success };
    case 'stable': return { Icon: Minus, color: Colors.textMuted };
  }
}

function getDifficultyStyle(diff: string) {
  switch (diff) {
    case 'EASY': return { color: Colors.success, bg: Colors.successLight };
    case 'MEDIUM': return { color: Colors.warning, bg: Colors.warningLight };
    case 'HARD': return { color: Colors.danger, bg: Colors.dangerLight };
    default: return { color: Colors.textMuted, bg: '#F1F5F9' };
  }
}

export default function SustainabilityScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<SustainTab>('overview');
  const [refreshing, setRefreshing] = useState(false);
  const data = MOCK_SUSTAINABILITY_DATA;

  const totalEmissions = data.monthlyTrend.reduce((s: number, m: any) => s + m.kgCO2, 0);
  const totalJobs = data.monthlyTrend.reduce((s: number, m: any) => s + m.jobCount, 0);
  const avgPerJob = totalJobs > 0 ? totalEmissions / totalJobs : 0;
  const maxMonthly = Math.max(...data.monthlyTrend.map((m: any) => m.kgCO2));
  const potentialSavings = data.aiSuggestions.reduce((s: number, sug: any) => s + sug.potentialSaving, 0);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Sustainability</Text>
            <Text style={styles.headerSubtitle}>Carbon footprint tracking & reduction</Text>
          </View>
          <View style={styles.headerIcon}>
            <Leaf size={20} color="#059669" />
          </View>
        </View>

        <View style={styles.tabRow}>
          {([
            { key: 'overview' as SustainTab, label: 'Overview' },
            { key: 'routes' as SustainTab, label: 'Routes' },
            { key: 'businesses' as SustainTab, label: 'Businesses' },
            { key: 'suggestions' as SustainTab, label: 'AI Tips' },
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}
      >
        {activeTab === 'overview' && (
          <>
            <View style={styles.heroCard}>
              <View style={styles.heroIconWrap}>
                <Leaf size={32} color="#059669" />
              </View>
              <Text style={styles.heroValue}>{(totalEmissions / 1000).toFixed(1)} tonnes</Text>
              <Text style={styles.heroLabel}>Total CO₂ emissions tracked (6 months)</Text>
              <View style={styles.heroStats}>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatValue}>{totalJobs.toLocaleString()}</Text>
                  <Text style={styles.heroStatLabel}>Jobs</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatValue}>{avgPerJob.toFixed(1)} kg</Text>
                  <Text style={styles.heroStatLabel}>Avg/Job</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStat}>
                  <Text style={[styles.heroStatValue, { color: Colors.success }]}>{(potentialSavings / 1000).toFixed(1)}t</Text>
                  <Text style={styles.heroStatLabel}>Saveable</Text>
                </View>
              </View>
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Monthly Emissions Trend (kg CO₂)</Text>
              <View style={styles.barChart}>
                {data.monthlyTrend.map((item: any) => (
                  <View key={item.month} style={styles.barWrap}>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { height: `${maxMonthly > 0 ? (item.kgCO2 / maxMonthly) * 100 : 0}%` }]} />
                    </View>
                    <Text style={styles.barLabel}>{item.month}</Text>
                    <Text style={styles.barValue}>{(item.kgCO2 / 1000).toFixed(1)}t</Text>
                  </View>
                ))}
              </View>
            </View>

            <Text style={styles.sectionTitle}>Per-Job Emissions</Text>
            {data.emissionsPerJob.map((job: any, i: number) => (
              <View key={i} style={styles.jobEmissionCard}>
                <View style={styles.jobEmissionLeft}>
                  <Text style={styles.jobEmissionNumber}>{job.jobNumber}</Text>
                  <Text style={styles.jobEmissionRoute}>{job.route}</Text>
                </View>
                <View style={styles.jobEmissionRight}>
                  <Text style={styles.jobEmissionKg}>{job.kgCO2} kg</Text>
                  <View style={styles.vehicleBadge}>
                    <Truck size={9} color={Colors.textMuted} />
                    <Text style={styles.vehicleText}>{job.vehicleType}</Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {activeTab === 'routes' && (
          <>
            <Text style={styles.sectionTitle}>Emissions by Route</Text>
            {data.emissionsByRoute.map((route: any, i: number) => {
              const maxRoute = Math.max(...data.emissionsByRoute.map((r: any) => r.totalKgCO2));
              const pct = maxRoute > 0 ? (route.totalKgCO2 / maxRoute) * 100 : 0;
              return (
                <View key={i} style={styles.routeCard}>
                  <View style={styles.routeTop}>
                    <View style={styles.routeNameWrap}>
                      <MapPin size={13} color="#059669" />
                      <Text style={styles.routeName}>{route.route}</Text>
                    </View>
                    <Text style={styles.routeTotal}>{(route.totalKgCO2 / 1000).toFixed(1)}t</Text>
                  </View>
                  <View style={styles.routeBarBg}>
                    <View style={[styles.routeBarFill, { width: `${pct}%` }]} />
                  </View>
                  <View style={styles.routeBottom}>
                    <Text style={styles.routeMeta}>{route.jobs} jobs · avg {route.avgKgCO2.toFixed(1)} kg/job</Text>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {activeTab === 'businesses' && (
          <>
            <Text style={styles.sectionTitle}>Emissions by Business</Text>
            {data.emissionsByBusiness.map((biz: any, i: number) => {
              const trendInfo = getTrendIcon(biz.trend);
              const TrendIcon = trendInfo.Icon;
              return (
                <View key={i} style={styles.bizEmissionCard}>
                  <View style={styles.bizEmissionTop}>
                    <View style={styles.bizEmissionInfo}>
                      <Building2 size={14} color={Colors.textSecondary} />
                      <Text style={styles.bizEmissionName}>{biz.business}</Text>
                    </View>
                    <View style={styles.bizEmissionTrend}>
                      <TrendIcon size={14} color={trendInfo.color} />
                      <Text style={[styles.bizEmissionTotal, { color: trendInfo.color }]}>
                        {(biz.totalKgCO2 / 1000).toFixed(1)}t
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.bizEmissionMeta}>{biz.jobs} jobs · avg {(biz.totalKgCO2 / biz.jobs).toFixed(1)} kg/job</Text>
                </View>
              );
            })}
          </>
        )}

        {activeTab === 'suggestions' && (
          <>
            <View style={styles.savingsHero}>
              <Zap size={24} color={Colors.success} />
              <Text style={styles.savingsValue}>{(potentialSavings / 1000).toFixed(1)} tonnes</Text>
              <Text style={styles.savingsLabel}>Potential CO₂ reduction identified by AI</Text>
            </View>

            {data.aiSuggestions.map((sug: any) => {
              const diffStyle = getDifficultyStyle(sug.difficulty);
              return (
                <View key={sug.id} style={styles.suggestionCard}>
                  <View style={styles.sugTop}>
                    <Text style={styles.sugTitle}>{sug.title}</Text>
                    <View style={[styles.diffBadge, { backgroundColor: diffStyle.bg }]}>
                      <Text style={[styles.diffText, { color: diffStyle.color }]}>{sug.difficulty}</Text>
                    </View>
                  </View>
                  <Text style={styles.sugDesc}>{sug.description}</Text>
                  <View style={styles.sugBottom}>
                    <View style={styles.savingBadge}>
                      <Leaf size={11} color={Colors.success} />
                      <Text style={styles.savingText}>-{sug.potentialSaving} kg CO₂</Text>
                    </View>
                    <TouchableOpacity style={styles.implementBtn} activeOpacity={0.7}>
                      <Text style={styles.implementText}>Review</Text>
                      <ArrowRight size={12} color="#059669" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
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
  headerIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#05966918', alignItems: 'center', justifyContent: 'center' },
  tabRow: { flexDirection: 'row', backgroundColor: Colors.navyLight, borderRadius: 10, padding: 3 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#059669' },
  tabText: { fontSize: 11, fontWeight: '600' as const, color: Colors.textMuted },
  tabTextActive: { color: Colors.textInverse },
  body: { flex: 1 },
  bodyContent: { padding: 16 },
  heroCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#A7F3D0' },
  heroIconWrap: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  heroValue: { fontSize: 32, fontWeight: '800' as const, color: Colors.text },
  heroLabel: { fontSize: 13, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },
  heroStats: { flexDirection: 'row', marginTop: 16, gap: 16 },
  heroStat: { alignItems: 'center' },
  heroStatValue: { fontSize: 16, fontWeight: '700' as const, color: Colors.text },
  heroStatLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  heroStatDivider: { width: 1, backgroundColor: Colors.border },
  chartCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  chartTitle: { fontSize: 14, fontWeight: '700' as const, color: Colors.text, marginBottom: 16 },
  barChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 130, gap: 6 },
  barWrap: { flex: 1, alignItems: 'center', gap: 4 },
  barTrack: { flex: 1, width: '80%', backgroundColor: '#D1FAE5', borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 6, minHeight: 4, backgroundColor: '#059669' },
  barLabel: { fontSize: 11, fontWeight: '600' as const, color: Colors.textMuted },
  barValue: { fontSize: 9, fontWeight: '600' as const, color: Colors.textSecondary },
  sectionTitle: { fontSize: 15, fontWeight: '700' as const, color: Colors.text, marginBottom: 12 },
  jobEmissionCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  jobEmissionLeft: { flex: 1 },
  jobEmissionNumber: { fontSize: 13, fontWeight: '700' as const, color: Colors.text },
  jobEmissionRoute: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  jobEmissionRight: { alignItems: 'flex-end', gap: 4 },
  jobEmissionKg: { fontSize: 14, fontWeight: '700' as const, color: Colors.text },
  vehicleBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  vehicleText: { fontSize: 10, color: Colors.textMuted },
  routeCard: { backgroundColor: Colors.surface, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  routeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  routeNameWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  routeName: { fontSize: 13, fontWeight: '600' as const, color: Colors.text },
  routeTotal: { fontSize: 15, fontWeight: '800' as const, color: Colors.text },
  routeBarBg: { height: 6, backgroundColor: '#D1FAE5', borderRadius: 3, marginBottom: 8 },
  routeBarFill: { height: 6, backgroundColor: '#059669', borderRadius: 3 },
  routeBottom: {},
  routeMeta: { fontSize: 11, color: Colors.textMuted },
  bizEmissionCard: { backgroundColor: Colors.surface, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  bizEmissionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  bizEmissionInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bizEmissionName: { fontSize: 14, fontWeight: '600' as const, color: Colors.text },
  bizEmissionTrend: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bizEmissionTotal: { fontSize: 15, fontWeight: '700' as const },
  bizEmissionMeta: { fontSize: 11, color: Colors.textMuted },
  savingsHero: { backgroundColor: Colors.surface, borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#A7F3D0', gap: 6 },
  savingsValue: { fontSize: 28, fontWeight: '800' as const, color: Colors.success },
  savingsLabel: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
  suggestionCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  sugTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8 },
  sugTitle: { fontSize: 14, fontWeight: '700' as const, color: Colors.text, flex: 1 },
  diffBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  diffText: { fontSize: 10, fontWeight: '700' as const },
  sugDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19, marginBottom: 10 },
  sugBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  savingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  savingText: { fontSize: 12, fontWeight: '600' as const, color: Colors.success },
  implementBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  implementText: { fontSize: 12, fontWeight: '600' as const, color: '#059669' },
});
