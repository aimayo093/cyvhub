import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    TextInput,
    Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    ShieldCheck,
    Search,
    Filter,
    User,
    Clock,
    Activity,
    ArrowRight,
    ShieldAlert,
    Edit3,
    Trash2,
    LogIn,
    Settings,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

const { width } = Dimensions.get('window');

// Mock Audit Log Data
const MOCK_AUDIT_LOGS = [
    { id: 'AL-1001', action: 'USER_LOGIN', user: 'Admin (System)', role: 'admin', ip: '192.168.1.104', timestamp: '2026-02-28T08:30:00Z', details: 'Successful login via web portal', severity: 'info' },
    { id: 'AL-1002', action: 'PRICE_OVERRIDE', user: 'Admin (David)', role: 'admin', ip: '10.0.0.45', timestamp: '2026-02-28T09:15:22Z', details: 'Overrode contract price for CYV-2026-0852 from £145 to £120. Reason: Client dispute.', severity: 'warning' },
    { id: 'AL-1003', action: 'CARRIER_SUSPENDED', user: 'Admin (System)', role: 'admin', ip: '192.168.1.104', timestamp: '2026-02-28T10:05:11Z', details: 'Suspended Carrier ID C-9982 (SwiftHaul) due to expired Goods in Transit insurance.', severity: 'critical' },
    { id: 'AL-1004', action: 'JOB_ASSIGNED', user: 'Dispatcher (Sarah)', role: 'dispatcher', ip: '192.168.1.112', timestamp: '2026-02-28T10:30:45Z', details: 'Assigned Job CYV-2026-0853 to Internal Driver (Dylan Price).', severity: 'info' },
    { id: 'AL-1005', action: 'SETTINGS_CHANGED', user: 'SuperAdmin (Emma)', role: 'superadmin', ip: '82.132.245.18', timestamp: '2026-02-28T11:45:00Z', details: 'Updated global VAT rate from 20% to 21%.', severity: 'critical' },
    { id: 'AL-1006', action: 'PROFILE_UPDATED', user: 'Carrier (WalesExpress)', role: 'carrier', ip: '212.159.10.4', timestamp: '2026-02-28T13:20:18Z', details: 'Updated contact email and phone number.', severity: 'info' },
    { id: 'AL-1007', action: 'FAILED_LOGIN', user: 'Unknown', role: 'unknown', ip: '45.33.12.89', timestamp: '2026-02-28T14:12:05Z', details: 'Failed login attempt for admin@cyvhub.com. Invalid password.', severity: 'warning' },
    { id: 'AL-1008', action: 'QUOTATION_APPROVED', user: 'Admin (System)', role: 'admin', ip: '192.168.1.104', timestamp: '2026-02-28T15:00:30Z', details: 'Approved Quote CYV-QT-2026-0042 for TechWorks Ltd.', severity: 'info' },
];

function getActionIcon(action: string) {
    if (action.includes('LOGIN')) return LogIn;
    if (action.includes('UPDATE') || action.includes('EDIT') || action.includes('CHANGE')) return Edit3;
    if (action.includes('DELETE') || action.includes('SUSPEND')) return Trash2;
    if (action.includes('OVERRIDE') || action.includes('FAIL')) return ShieldAlert;
    if (action.includes('SETTING')) return Settings;
    return Activity;
}

function getSeverityColor(sev: string) {
    switch (sev) {
        case 'info': return Colors.info;
        case 'warning': return Colors.warning;
        case 'critical': return Colors.danger;
        default: return Colors.textMuted;
    }
}

export default function SecurityScreen() {
    const insets = useSafeAreaInsets();
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterSeverity, setFilterSeverity] = useState<string | null>(null);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 800);
    }, []);

    const filteredLogs = useMemo(() => {
        return MOCK_AUDIT_LOGS.filter(log => {
            const matchesSearch = log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.details.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = filterSeverity ? log.severity === filterSeverity : true;
            return matchesSearch && matchesFilter;
        }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [searchQuery, filterSeverity]);

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.headerTitle}>Security & Governance</Text>
                        <Text style={styles.headerSubtitle}>System audit logs and access control</Text>
                    </View>
                    <View style={styles.headerIcon}>
                        <ShieldCheck size={20} color={Colors.adminPrimary} />
                    </View>
                </View>

                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <Search size={18} color={Colors.textMuted} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search audit logs by action, user, or IP..."
                            placeholderTextColor={Colors.textMuted}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <Text style={{ color: Colors.textMuted, fontSize: 18 }}>×</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <TouchableOpacity style={styles.filterBtn} activeOpacity={0.7}>
                        <Filter size={18} color={Colors.textInverse} />
                    </TouchableOpacity>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChips} style={{ marginTop: 12 }}>
                    {['all', 'info', 'warning', 'critical'].map((sev) => {
                        const isActive = (sev === 'all' && !filterSeverity) || sev === filterSeverity;
                        return (
                            <TouchableOpacity
                                key={sev}
                                style={[
                                    styles.filterChip,
                                    isActive && { backgroundColor: sev === 'all' ? Colors.adminPrimary : getSeverityColor(sev) },
                                    !isActive && { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border }
                                ]}
                                onPress={() => {
                                    setFilterSeverity(sev === 'all' ? null : sev);
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                }}
                            >
                                <Text style={[styles.filterChipText, isActive ? { color: '#FFF' } : { color: Colors.text }]}>
                                    {sev.charAt(0).toUpperCase() + sev.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        )
                    })}
                </ScrollView>
            </View>

            <ScrollView
                style={styles.body}
                contentContainerStyle={styles.bodyContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.adminPrimary} />}
            >
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>24</Text>
                        <Text style={styles.statLabel}>Active Sessions</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: Colors.danger }]}>2</Text>
                        <Text style={styles.statLabel}>Failed Logins (24h)</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{MOCK_AUDIT_LOGS.length}</Text>
                        <Text style={styles.statLabel}>Events Logged</Text>
                    </View>
                </View>

                <View style={styles.logContainer}>
                    <Text style={styles.sectionTitle}>Recent Audit Events</Text>

                    {filteredLogs.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateText}>No audit logs found matching your criteria.</Text>
                        </View>
                    ) : (
                        filteredLogs.map((log) => {
                            const ActionIcon = getActionIcon(log.action);
                            const sevColor = getSeverityColor(log.severity);

                            return (
                                <View key={log.id} style={styles.logCard}>
                                    <View style={[styles.logIconWrap, { backgroundColor: sevColor + '15' }]}>
                                        <ActionIcon size={16} color={sevColor} />
                                    </View>
                                    <View style={styles.logContent}>
                                        <View style={styles.logHeader}>
                                            <Text style={styles.logAction}>{log.action.replace(/_/g, ' ')}</Text>
                                            <Text style={styles.logTime}>
                                                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Text>
                                        </View>
                                        <Text style={styles.logDetails}>{log.details}</Text>
                                        <View style={styles.logMeta}>
                                            <View style={styles.metaBadge}>
                                                <User size={10} color={Colors.textMuted} />
                                                <Text style={styles.metaText}>{log.user}</Text>
                                            </View>
                                            <View style={styles.metaBadge}>
                                                <Activity size={10} color={Colors.textMuted} />
                                                <Text style={styles.metaText}>{log.ip}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>
                <View style={{ height: 24 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { backgroundColor: Colors.navy, paddingHorizontal: 20, paddingBottom: 16 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.textInverse },
    headerSubtitle: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
    headerIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.adminPrimary + '18', alignItems: 'center', justifyContent: 'center' },
    searchContainer: { flexDirection: 'row', gap: 10 },
    searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 16, height: 48, gap: 10 },
    searchInput: { flex: 1, fontSize: 15, color: Colors.text },
    filterBtn: { width: 48, height: 48, backgroundColor: Colors.adminPrimary, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    filterChips: { gap: 8 },
    filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
    filterChipText: { fontSize: 12, fontWeight: '600' },
    body: { flex: 1 },
    bodyContent: { padding: 16 },
    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    statCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
    statValue: { fontSize: 24, fontWeight: '800', color: Colors.text },
    statLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 4, textAlign: 'center' },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 12 },
    logContainer: { gap: 10 },
    logCard: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, gap: 12 },
    logIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    logContent: { flex: 1 },
    logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    logAction: { fontSize: 13, fontWeight: '700', color: Colors.text },
    logTime: { fontSize: 11, color: Colors.textMuted },
    logDetails: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18, marginBottom: 8 },
    logMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    metaBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6, gap: 4 },
    metaText: { fontSize: 10, color: Colors.textMuted, fontWeight: '500' },
    emptyState: { padding: 40, alignItems: 'center' },
    emptyStateText: { color: Colors.textMuted, fontSize: 14 },
});
