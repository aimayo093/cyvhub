import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
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

type RevisionEntry = {
    id: string;
    page: string;
    timestamp: string;
    author: string;
    changes: string;
    status: 'published' | 'draft' | 'archived';
};

const mockHistory: RevisionEntry[] = [
    {
        id: 'rev-105',
        page: 'Homepage',
        timestamp: 'Today, 14:30',
        author: 'Aimayo (Admin)',
        changes: 'Updated Hero headline and CTA link',
        status: 'published',
    },
    {
        id: 'rev-104',
        page: 'Services',
        timestamp: 'Yesterday, 09:15',
        author: 'System Auto-Save',
        changes: 'Draft saved during feature list edit',
        status: 'draft',
    },
    {
        id: 'rev-103',
        page: 'About Us',
        timestamp: 'Oct 24, 2024, 16:45',
        author: 'Aimayo (Admin)',
        changes: 'Added new team member',
        status: 'archived',
    },
    {
        id: 'rev-102',
        page: 'Homepage',
        timestamp: 'Oct 22, 2024, 11:20',
        author: 'Aimayo (Admin)',
        changes: 'Reordered slider items',
        status: 'archived',
    },
    {
        id: 'rev-101',
        page: 'Contact Us',
        timestamp: 'Oct 20, 2024, 10:00',
        author: 'Aimayo (Admin)',
        changes: 'Updated support phone number',
        status: 'archived',
    },
];

export default function RevisionHistoryCMS() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const handleRestore = (id: string, page: string) => {
        Alert.alert(
            'Restore Version',
            `Are you sure you want to restore the ${page} page to this previous version?\n\nCurrent unpublished changes will be lost.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Restore',
                    style: 'destructive',
                    onPress: () => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        Alert.alert('Success', 'Version restored successfully. You are now editing the restored version.');
                    }
                }
            ]
        );
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'published': return { bg: Colors.success + '20', text: Colors.success };
            case 'draft': return { bg: Colors.warning + '20', text: Colors.warning };
            default: return { bg: Colors.borderLight, text: Colors.textSecondary };
        }
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
                        The system automatically saves drafts as you work and creates a permanent backup every time you publish. You can safely preview or restore any previous version.
                    </Text>
                </View>

                <View style={styles.timeline}>
                    {mockHistory.map((rev, index) => {
                        const statusStyle = getStatusStyle(rev.status);

                        return (
                            <View key={rev.id} style={styles.timelineItem}>
                                <View style={styles.timelineLine} />
                                <View style={[styles.timelineDot, rev.status === 'published' && { backgroundColor: Colors.success }]} />

                                <View style={styles.revisionCard}>
                                    <View style={styles.revisionHeader}>
                                        <Text style={styles.revisionPage}>{rev.page}</Text>
                                        <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
                                            {rev.status === 'published' && <CheckCircle size={10} color={statusStyle.text} style={{ marginRight: 4 }} />}
                                            <Text style={[styles.badgeText, { color: statusStyle.text }]}>{rev.status.toUpperCase()}</Text>
                                        </View>
                                    </View>

                                    <Text style={styles.revisionChanges}>"{rev.changes}"</Text>

                                    <View style={styles.revisionMetaContainer}>
                                        <Text style={styles.revisionMeta}>{rev.timestamp}</Text>
                                        <Text style={styles.revisionMetaDot}>•</Text>
                                        <Text style={styles.revisionMeta}>{rev.author}</Text>
                                    </View>

                                    <View style={styles.actionRow}>
                                        <TouchableOpacity style={styles.actionBtn}>
                                            <Eye size={14} color={Colors.adminPrimary} />
                                            <Text style={styles.actionBtnText}>Preview</Text>
                                        </TouchableOpacity>
                                        {rev.status !== 'published' && (
                                            <TouchableOpacity
                                                style={[styles.actionBtn, { backgroundColor: Colors.danger + '10' }]}
                                                onPress={() => handleRestore(rev.id, rev.page)}
                                            >
                                                <RotateCcw size={14} color={Colors.danger} />
                                                <Text style={[styles.actionBtnText, { color: Colors.danger }]}>Restore to Draft</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            </View>
                        );
                    })}
                </View>

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
