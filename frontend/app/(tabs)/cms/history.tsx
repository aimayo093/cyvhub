import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
    History, 
    ArrowLeft, 
    RotateCcw, 
    User, 
    Calendar,
    CheckCircle2,
    Database
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { apiClient } from '@/services/api';
import { useCMS } from '@/context/CMSContext';

interface Revision {
    id: string;
    entityType: string;
    entityKey: string;
    snapshot: any;
    updatedBy: string;
    createdAt: string;
}

export default function CMSHistoryScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { refreshFromBackend } = useCMS();
    
    const [revisions, setRevisions] = useState<Revision[]>([]);
    const [loading, setLoading] = useState(true);
    const [restoringId, setRestoringId] = useState<string | null>(null);

    const fetchRevisions = async () => {
        try {
            setLoading(true);
            const data = await apiClient('/cms/revisions?entityKey=global_cms_bundle');
            setRevisions(data);
        } catch (error) {
            console.error('[History] Failed to fetch revisions:', error);
            Alert.alert('Error', 'Failed to load revision history.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRevisions();
    }, []);

    const handleRestore = (revision: Revision) => {
        Alert.alert(
            'Restore Revision',
            `Are you sure you want to roll back to the version from ${new Date(revision.createdAt).toLocaleString()}? This will overwrite the current live configuration.`,
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Restore Now', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setRestoringId(revision.id);
                            await apiClient(`/cms/revisions/${revision.id}/restore`, { method: 'POST' });
                            
                            // Force refresh the context to pick up the restored data
                            await refreshFromBackend(true);
                            
                            Alert.alert('Success', 'Revision restored successfully!');
                            router.back();
                        } catch (error) {
                            console.error('[History] Restore failed:', error);
                            Alert.alert('Error', 'Failed to restore revision.');
                        } finally {
                            setRestoringId(null);
                        }
                    }
                }
            ]
        );
    };

    const renderRevisionItem = ({ item, index }: { item: Revision, index: number }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={[styles.badge, index === 0 && styles.activeBadge]}>
                    <Text style={[styles.badgeText, index === 0 && styles.activeBadgeText]}>
                        {index === 0 ? 'Current Live' : `v${revisions.length - index}`}
                    </Text>
                </View>
                <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleString()}</Text>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.metaRow}>
                    <User size={14} color={Colors.textMuted} />
                    <Text style={styles.metaText}>Updated By: {item.updatedBy}</Text>
                </View>
                <View style={styles.metaRow}>
                    <Database size={14} color={Colors.textMuted} />
                    <Text style={styles.metaText}>Entity: {item.entityKey}</Text>
                </View>
            </View>

            <TouchableOpacity 
                style={[styles.restoreButton, index === 0 && styles.disabledButton]} 
                onPress={() => handleRestore(item)}
                disabled={index === 0 || restoringId !== null}
            >
                {restoringId === item.id ? (
                    <ActivityIndicator size="small" color="#FFF" />
                ) : (
                    <>
                        <RotateCcw size={16} color="#FFF" />
                        <Text style={styles.restoreButtonText}>Restore this version</Text>
                    </>
                )}
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={20} color={Colors.textInverse} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Publishing History</Text>
                    <Text style={styles.headerSubtitle}>Audit Log & Revisions</Text>
                </View>
                <History size={24} color={Colors.textInverse} style={styles.headerIcon} />
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={Colors.adminPrimary} />
                    <Text style={styles.loadingText}>Fetching architecture logs...</Text>
                </View>
            ) : (
                <FlatList
                    data={revisions}
                    renderItem={renderRevisionItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listPadding}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <CheckCircle2 size={48} color={Colors.textMuted} />
                            <Text style={styles.emptyText}>No revision history found yet.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        backgroundColor: Colors.adminPrimary,
        paddingHorizontal: 20,
        paddingBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.textInverse,
    },
    headerSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
    },
    headerIcon: {
        marginLeft: 'auto',
        opacity: 0.5,
    },
    listPadding: {
        padding: 16,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E9ECEF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: '#E9ECEF',
    },
    activeBadge: {
        backgroundColor: '#D1FAE5', // Greenish
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#495057',
        textTransform: 'uppercase',
    },
    activeBadgeText: {
        color: '#065F46',
    },
    dateText: {
        fontSize: 13,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    cardBody: {
        gap: 8,
        marginBottom: 16,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#F1F3F5',
        paddingVertical: 12,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    metaText: {
        fontSize: 13,
        color: Colors.textMuted,
    },
    restoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4F46E5', // Indigo
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    disabledButton: {
        backgroundColor: '#E9ECEF',
        opacity: 0.8,
    },
    restoreButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: Colors.textMuted,
        fontSize: 14,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 100,
        gap: 16,
    },
    emptyText: {
        color: Colors.textMuted,
        fontSize: 16,
    }
});
