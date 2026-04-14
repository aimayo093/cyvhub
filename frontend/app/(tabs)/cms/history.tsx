import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    ArrowLeft,
    History,
    RotateCcw,
    CheckCircle,
    Eye,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import * as Haptics from 'expo-haptics';
import { apiClient } from '@/services/api';
import { useCMS } from '@/context/CMSContext';

type RevisionEntry = {
    id: string;
    entityType: string;
    entityKey: string;
    snapshot: any;
    updatedBy: string;
    createdAt: string;
};

export default function RevisionHistoryCMS() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { refreshFromBackend } = useCMS();

    const [history, setHistory] = useState<RevisionEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [restoring, setRestoring] = useState<string | null>(null);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const data = await apiClient('/cms/revisions');
            setHistory(data);
        } catch (error) {
            console.error('[CMS] Failed to fetch revisions:', error);
            Alert.alert('Error', 'Could not load revision history.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const handleRestore = (rev: RevisionEntry) => {
        Alert.alert(
            'Restore Version',
            `Are you sure you want to restore the ${rev.entityKey} config to this previous version?\n\nCurrent unpublished changes will be lost.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Restore',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setRestoring(rev.id);
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            await apiClient(`/cms/revisions/${rev.id}/restore`, { method: 'POST' });
                            
                            // Immediately refresh context to pull the newly restored global bundle
                            await refreshFromBackend(true);
                            
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            Alert.alert('Success', 'Version restored successfully. The live site has been updated.');
                            fetchHistory(); // Refresh the list
                        } catch (error) {
                            console.error('[CMS] Failed to restore revision:', error);
                            Alert.alert('Error', 'Failed to restore this revision. Please try again.');
                        } finally {
                            setRestoring(null);
                        }
                    }
                }
            ]
        );
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'published': return { bg: Colors.success + '20', text: Colors.success };
            case 'archived': return { bg: Colors.borderLight, text: Colors.textSecondary };
            default: return { bg: Colors.adminPrimary + '20', text: Colors.adminPrimary };
        }
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft size={20} color={Colors.textInverse} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>Revision History</Text>
                        <Text style={styles.headerSubtitle}>Content version control and backups</Text>
                    </View>
                </View>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>

                <View style={styles.infoCard}>
                    <History size={24} color={Colors.adminPrimary} style={{ marginBottom: 12 }} />
                    <Text style={styles.infoTitle}>Safeguard your content</Text>
                    <Text style={styles.infoDesc}>
                        The system creates a permanent backup before every global publish. You can safely restore any previous snapshot to the live platform.
                    </Text>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color={Colors.adminPrimary} style={{ marginTop: 40 }} />
                ) : history.length === 0 ? (
                    <Text style={{ textAlign: 'center', color: Colors.textSecondary, marginTop: 20 }}>No revision history available yet.</Text>
                ) : (
                    <View style={styles.timeline}>
                        {history.map((rev, index) => {
                            const isLatest = index === 0;
                            const status = isLatest ? 'Archived (Latest backup)' : 'archived';
                            const statusStyle = getStatusStyle(status);

                            return (
                                <View key={rev.id} style={styles.timelineItem}>
                                    <View style={styles.timelineLine} />
                                    <View style={[styles.timelineDot, isLatest && { backgroundColor: Colors.adminSecondary }]} />

                                    <View style={styles.revisionCard}>
                                        <View style={styles.revisionHeader}>
                                            <Text style={styles.revisionPage}>{rev.entityKey}</Text>
                                            <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
                                                <Text style={[styles.badgeText, { color: statusStyle.text }]}>
                                                    {status.toUpperCase()}
                                                </Text>
                                            </View>
                                        </View>

                                        <Text style={styles.revisionChanges}>
                                            {rev.entityType === 'GLOBAL_CONFIG' ? 'Global CMS Bundle Update' : 'Page Update'}
                                        </Text>

                                        <View style={styles.revisionMetaContainer}>
                                            <Text style={styles.revisionMeta}>{formatDate(rev.createdAt)}</Text>
                                            <Text style={styles.revisionMetaDot}>•</Text>
                                            <Text style={styles.revisionMeta}>User ID: {rev.updatedBy.substring(0, 8)}...</Text>
                                        </View>

                                        <View style={styles.actionRow}>
                                            <TouchableOpacity 
                                                style={[styles.actionBtn, { backgroundColor: Colors.warning + '10' }]}
                                                onPress={() => handleRestore(rev)}
                                                disabled={restoring === rev.id}
                                            >
                                                {restoring === rev.id ? (
                                                    <ActivityIndicator size="small" color={Colors.warning} />
                                                ) : (
                                                    <>
                                                        <RotateCcw size={14} color={Colors.warning} />
                                                        <Text style={[styles.actionBtnText, { color: Colors.warning }]}>Restore to Live</Text>
                                                    </>
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}

                <View style={{ height: 60 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { backgroundColor: Colors.navy, paddingBottom: 16 },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
    backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    headerTitleContainer: { flex: 1, marginLeft: 8 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.textInverse, marginBottom: 4 },
    headerSubtitle: { fontSize: 13, color: Colors.textMuted },
    content: { flex: 1 },
    contentPadding: { padding: 20 },
    infoCard: { backgroundColor: Colors.adminPrimary + '10', borderRadius: 12, padding: 20, marginBottom: 32, borderWidth: 1, borderColor: Colors.adminPrimary + '30' },
    infoTitle: { fontSize: 16, fontWeight: '700', color: Colors.adminPrimary, marginBottom: 8 },
    infoDesc: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
    timeline: { paddingLeft: 10 },
    timelineItem: { position: 'relative', paddingLeft: 30, marginBottom: 24 },
    timelineLine: { position: 'absolute', left: 5, top: 16, bottom: -24, width: 2, backgroundColor: Colors.borderLight },
    timelineDot: { position: 'absolute', left: 0, top: 4, width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.border, zIndex: 1, borderWidth: 2, borderColor: Colors.background },
    revisionCard: { backgroundColor: Colors.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.border },
    revisionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    revisionPage: { fontSize: 16, fontWeight: '700', color: Colors.text },
    badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    badgeText: { fontSize: 10, fontWeight: '700' },
    revisionChanges: { fontSize: 14, color: Colors.textSecondary, fontStyle: 'italic', marginBottom: 12 },
    revisionMetaContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    revisionMeta: { fontSize: 12, color: Colors.textMuted },
    revisionMetaDot: { fontSize: 12, color: Colors.textMuted, marginHorizontal: 6 },
    actionRow: { flexDirection: 'row', gap: 12, borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: 12 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.adminPrimary + '10', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
    actionBtnText: { fontSize: 13, fontWeight: '600', color: Colors.adminPrimary },
});
