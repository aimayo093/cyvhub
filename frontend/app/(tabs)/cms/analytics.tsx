import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    ArrowLeft,
    Users,
    MousePointerClick,
    TrendingUp,
    Search,
    Globe,
    Clock,
} from 'lucide-react-native';
import Colors from '@/constants/colors';

const { width } = Dimensions.get('window');

// Mock Data
const stats = [
    { id: '1', title: 'Total Visitors', value: '24,592', trend: '+12.5%', isUp: true, icon: Users, color: Colors.adminPrimary },
    { id: '2', title: 'Quote Conversions', value: '1,284', trend: '+8.2%', isUp: true, icon: MousePointerClick, color: Colors.success },
    { id: '3', title: 'Bounce Rate', value: '42.3%', trend: '-2.1%', isUp: true, icon: TrendingUp, color: Colors.warning },
    { id: '4', title: 'Avg. Session', value: '2m 45s', trend: '+15s', isUp: true, icon: Clock, color: Colors.purple },
];

const topPages = [
    { path: '/', views: '12,450', avgTime: '1m 20s' },
    { path: '/services/same-day', views: '4,210', avgTime: '2m 15s' },
    { path: '/guest-quote', views: '3,800', avgTime: '3m 40s' },
    { path: '/about', views: '1,500', avgTime: '1m 10s' },
    { path: '/services/b2b', views: '1,100', avgTime: '2m 05s' },
];

const trafficSources = [
    { source: 'Organic Search (Google)', sessions: '45%' },
    { source: 'Direct', sessions: '30%' },
    { source: 'Referral (LinkedIn)', sessions: '15%' },
    { source: 'Paid Social', sessions: '10%' },
];

export default function AnalyticsCMS() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft size={20} color={Colors.textInverse} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>Marketing Analytics</Text>
                        <Text style={styles.headerSubtitle}>Performance overview for last 30 days</Text>
                    </View>
                </View>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>

                {/* Highlight Stats Grid */}
                <View style={styles.statsGrid}>
                    {stats.map((stat) => (
                        <View key={stat.id} style={styles.statCard}>
                            <View style={styles.statHeader}>
                                <View style={[styles.iconWrapper, { backgroundColor: stat.color + '15' }]}>
                                    <stat.icon size={20} color={stat.color} />
                                </View>
                                <View style={[styles.trendBadge, { backgroundColor: stat.isUp ? Colors.success + '15' : Colors.danger + '15' }]}>
                                    <Text style={[styles.trendText, { color: stat.isUp ? Colors.success : Colors.danger }]}>{stat.trend}</Text>
                                </View>
                            </View>
                            <Text style={styles.statTitle}>{stat.title}</Text>
                            <Text style={styles.statValue}>{stat.value}</Text>
                        </View>
                    ))}
                </View>

                {/* Popular Pages */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Most Visited Pages</Text>
                    <View style={styles.card}>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.th, { flex: 3 }]}>Page Path</Text>
                            <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Views</Text>
                            <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Avg. Time</Text>
                        </View>
                        {topPages.map((page, index) => (
                            <View key={index} style={[styles.tableRow, index === topPages.length - 1 && { borderBottomWidth: 0 }]}>
                                <Text style={[styles.td, { flex: 3, fontWeight: '500', color: Colors.adminPrimary }]}>{page.path}</Text>
                                <Text style={[styles.td, { flex: 1, textAlign: 'right' }]}>{page.views}</Text>
                                <Text style={[styles.td, { flex: 1, textAlign: 'right' }]}>{page.avgTime}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Traffic Sources */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Traffic Sources</Text>
                    <View style={styles.card}>
                        {trafficSources.map((source, index) => (
                            <View key={index} style={[styles.tableRow, index === trafficSources.length - 1 && { borderBottomWidth: 0 }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 3 }}>
                                    {index === 0 && <Search size={16} color={Colors.textSecondary} />}
                                    {index === 1 && <Globe size={16} color={Colors.textSecondary} />}
                                    {index === 2 && <Users size={16} color={Colors.textSecondary} />}
                                    {index === 3 && <MousePointerClick size={16} color={Colors.textSecondary} />}
                                    <Text style={[styles.td, { flex: 1 }]}>{source.source}</Text>
                                </View>
                                <Text style={[styles.td, { flex: 1, textAlign: 'right', fontWeight: '600' }]}>{source.sessions}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { backgroundColor: Colors.navy, paddingBottom: 16 },
    headerTop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
    backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    headerTitleContainer: { flex: 1, marginLeft: 8 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.textInverse, marginBottom: 4 },
    headerSubtitle: { fontSize: 13, color: Colors.textMuted },
    content: { flex: 1 },
    contentPadding: { padding: 20 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 32 },
    statCard: { width: width > 768 ? '23%' : '47%', backgroundColor: Colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border },
    statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    iconWrapper: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    trendBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    trendText: { fontSize: 12, fontWeight: '700' },
    statTitle: { fontSize: 13, color: Colors.textSecondary, marginBottom: 4 },
    statValue: { fontSize: 24, fontWeight: '800', color: Colors.text },
    section: { marginBottom: 32 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 16 },
    card: { backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
    tableHeader: { flexDirection: 'row', padding: 16, backgroundColor: Colors.background, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
    th: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase' },
    tableRow: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.borderLight, alignItems: 'center' },
    td: { fontSize: 14, color: Colors.text },
});
