import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Truck, ShieldCheck, ShieldAlert, Star, MapPin, FileText, CheckCircle, XCircle, Users, Activity } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { ActivityIndicator } from 'react-native';
import { apiClient } from '@/services/api';

export default function CarrierProfileScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [carrier, setCarrier] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCarrier = async () => {
            try {
                const response = await apiClient(`/carriers/${id}`);
                setCarrier(response.carrier);
            } catch (error) {
                console.error('Failed to fetch carrier details:', error);
                Alert.alert('Error', 'Could not load carrier profile.');
                router.back();
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchCarrier();
    }, [id, router]);

    const updateStatus = async (status: string) => {
        try {
            await apiClient(`/carriers/${id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status })
            });
            setCarrier((prev: any) => ({ ...prev, status }));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Success', `Carrier status updated to ${status}.`, [{ text: 'OK', onPress: () => router.back() }]);
        } catch (error) {
            console.error('Failed to update status:', error);
            Alert.alert('Error', 'Failed to update carrier status.');
        }
    };

    const handleApprove = () => updateStatus('APPROVED');

    const handleReject = () => updateStatus('REJECTED');

    const handleViewDoc = (docUrl: string) => {
        Alert.alert('Document Viewer', `Viewing document URL: ${docUrl}`);
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={Colors.adminPrimary} />
            </View>
        );
    }

    if (!carrier) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
                <Truck size={48} color={Colors.textMuted} style={{ opacity: 0.4 }} />
                <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.text, marginTop: 16, textAlign: 'center' }}>Carrier not found</Text>
                <Text style={{ fontSize: 14, color: Colors.textMuted, marginTop: 8, textAlign: 'center' }}>This carrier profile could not be loaded.</Text>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{ marginTop: 24, backgroundColor: Colors.adminPrimary, paddingHorizontal: 28, paddingVertical: 13, borderRadius: 12 }}
                >
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const isPending = carrier.status === 'PENDING';

    // Parse regions since SQLite treats JSON strings lightly
    let regions = [];
    try {
        regions = typeof carrier.coverageRegions === 'string' ? JSON.parse(carrier.coverageRegions) : carrier.coverageRegions;
    } catch (e) { }

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={Colors.textInverse} />
                </TouchableOpacity>
                <View style={styles.headerTitleWrap}>
                    <Text style={styles.headerTitle}>Carrier Profile</Text>
                </View>
                <View style={{ width: 32 }} />
            </View>

            <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>

                {/* Identity Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{carrier.tradingName[0]}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.tradingName}>{carrier.tradingName}</Text>
                            <Text style={styles.legalName}>{carrier.companyName}</Text>
                        </View>
                        <View style={[styles.statusBadge, isPending ? styles.statusWarning : styles.statusSuccess]}>
                            <Text style={[styles.statusText, isPending ? styles.textWarning : styles.textSuccess]}>{carrier.status}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                        <View style={styles.infoCol}>
                            <Text style={styles.infoLabel}>Primary Contact</Text>
                            <Text style={styles.infoValue}>{carrier.contactFirstName} {carrier.contactLastName}</Text>
                        </View>
                        <View style={styles.infoCol}>
                            <Text style={styles.infoLabel}>Coverage</Text>
                            <Text style={styles.infoValue} numberOfLines={1}>{regions?.join(', ') || 'N/A'}</Text>
                        </View>
                    </View>
                </View>

                {/* Performance & Fleet Metrics */}
                {!isPending && (
                    <View style={styles.metricsGrid}>
                        <View style={styles.metricCard}>
                            <Activity size={18} color={Colors.adminPrimary} />
                            <Text style={styles.metricValue}>{carrier.slaScore}%</Text>
                            <Text style={styles.metricLabel}>SLA Compliance</Text>
                        </View>
                        <View style={styles.metricCard}>
                            <Star size={18} color={Colors.warning} />
                            <Text style={styles.metricValue}>{carrier.rating.toFixed(1)}</Text>
                            <Text style={styles.metricLabel}>Driver Rating</Text>
                        </View>
                        <View style={styles.metricCard}>
                            <Users size={18} color={Colors.adminPrimary} />
                            <Text style={styles.metricValue}>{carrier.totalJobsCompleted}</Text>
                            <Text style={styles.metricLabel}>Total Jobs</Text>
                        </View>
                        <View style={styles.metricCard}>
                            <Truck size={18} color={Colors.adminPrimary} />
                            <Text style={styles.metricValue}>{carrier.vehicles?.length || 0}</Text>
                            <Text style={styles.metricLabel}>Active Fleet</Text>
                        </View>
                    </View>
                )}

                {/* Compliance Documents */}
                <Text style={styles.sectionTitle}>Compliance Documents</Text>
                <View style={styles.docsContainer}>
                    {carrier.complianceDocs && carrier.complianceDocs.length > 0 ? carrier.complianceDocs.map((doc: any, idx: number) => {
                        const isDocValid = doc.status === 'VALID';
                        return (
                            <TouchableOpacity key={idx} style={styles.docRow} onPress={() => handleViewDoc(doc.documentUrl)}>
                                <View style={styles.docLeft}>
                                    <FileText size={18} color={Colors.textSecondary} />
                                    <Text style={styles.docName}>{doc.type}</Text>
                                </View>
                                <View style={[styles.docStatus, { backgroundColor: isDocValid ? Colors.successLight : Colors.warningLight }]}>
                                    {isDocValid ? <ShieldCheck size={12} color={Colors.success} /> : <ShieldAlert size={12} color={Colors.warning} />}
                                    <Text style={[styles.docStatusText, { color: isDocValid ? Colors.success : Colors.warning }]}>
                                        {isDocValid ? 'Verified' : 'Review Needed'}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    }) : (
                        <View style={{ padding: 16, alignItems: 'center' }}>
                            <Text style={{ color: Colors.textMuted }}>No documents uploaded yet.</Text>
                        </View>
                    )}
                </View>

                {/* Action Buttons */}
                {isPending ? (
                    <View style={styles.actionGrid}>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.success }]} onPress={handleApprove}>
                            <CheckCircle size={18} color="#FFFFFF" />
                            <Text style={styles.actionText}>Approve Carrier</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.danger }]} onPress={handleReject}>
                            <XCircle size={18} color="#FFFFFF" />
                            <Text style={styles.actionText}>Reject Application</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.actionGrid}>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.adminPrimary }]} onPress={() => Alert.alert('Rate Cards', 'Navigating to detailed Rate Card comparison...')}>
                            <Text style={[styles.actionText, { color: Colors.adminPrimary }]}>Review Rate Cards</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.danger }]} onPress={() => {
                            Alert.alert('Suspend', `Are you sure you want to suspend ${carrier.tradingName}?`, [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Suspend', style: 'destructive', onPress: () => updateStatus('SUSPENDED') }
                            ]);
                        }}>
                            <Text style={[styles.actionText, { color: Colors.danger }]}>Suspend Carrier</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { backgroundColor: Colors.navy, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: { padding: 4, marginLeft: -4 },
    headerTitleWrap: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.textInverse },

    body: { flex: 1 },
    bodyContent: { padding: 16, gap: 16 },

    card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: { width: 48, height: 48, borderRadius: 14, backgroundColor: Colors.carrierPrimary + '15', alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 20, fontWeight: '800', color: Colors.carrierPrimary },
    tradingName: { fontSize: 18, fontWeight: '800', color: Colors.text },
    legalName: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },

    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusSuccess: { backgroundColor: Colors.successLight },
    statusWarning: { backgroundColor: Colors.warningLight },
    statusText: { fontSize: 12, fontWeight: '700' },
    textSuccess: { color: Colors.success },
    textWarning: { color: Colors.warning },

    divider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 16 },
    infoRow: { flexDirection: 'row', gap: 16 },
    infoCol: { flex: 1 },
    infoLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 4 },
    infoValue: { fontSize: 14, fontWeight: '600', color: Colors.text },

    metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    metricCard: { width: '48%', backgroundColor: Colors.surface, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
    metricValue: { fontSize: 20, fontWeight: '800', color: Colors.text, marginVertical: 6 },
    metricLabel: { fontSize: 12, color: Colors.textMuted },

    sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginTop: 8 },
    docsContainer: { backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
    docRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
    docLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    docName: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
    docStatus: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    docStatusText: { fontSize: 11, fontWeight: '700' },

    actionGrid: { gap: 12, marginTop: 8 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, gap: 8 },
    actionText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
