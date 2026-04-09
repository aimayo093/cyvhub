import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    RefreshControl,
    ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    ChevronLeft,
    DollarSign,
    Briefcase,
    CheckCircle,
    Clock,
    XCircle,
    FileText,
    RefreshCw,
    PieChart,
    Layers,
    Receipt
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { apiClient } from '@/services/api';

type TabView = 'summary' | 'jobs' | 'settlements' | 'payouts' | 'vat' | 'tax-ni';

export default function AdminFinanceDashboard() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState<TabView>('summary');
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const [jobsBreakdown, setJobsBreakdown] = useState<any[]>([]);
    const [settlements, setSettlements] = useState<any[]>([]);
    const [vatRecords, setVatRecords] = useState<any[]>([]);
    const [taxNiRecords, setTaxNiRecords] = useState<any[]>([]);

    const [summary, setSummary] = useState({
        totalRevenue: 0,
        totalPayouts: 0,
        vatCollected: 0,
        netProfit: 0,
        unreconciledVat: 0
    });

    const loadData = useCallback(async () => {
        try {
            setRefreshing(true);
            
            // 1. Fetch Jobs Breakdown
            const jobsRes = await apiClient('/stripe-connect/jobs-breakdown');
            const jobs = jobsRes.records || [];
            setJobsBreakdown(jobs);

            // 2. Fetch Payouts / Settlements
            const payoutsRes = await apiClient('/stripe-connect/payouts');
            const batches = payoutsRes.payouts || [];
            setSettlements(batches);

            // 3. Fetch VAT
            const vatRes = await apiClient('/stripe-connect/vat-records');
            setVatRecords(vatRes.records || []);

            // 4. Fetch Tax/NI
            const taxNiRes = await apiClient('/stripe-connect/tax-ni-records');
            setTaxNiRecords(taxNiRes.taxNiGroups || []);

            // Calculate Summary
            const rev = jobs.reduce((sum: number, j: any) => sum + j.customerAmount, 0);
            const payouts = jobs.reduce((sum: number, j: any) => sum + j.driverPayout + j.carrierPayout, 0);
            const vat = jobs.reduce((sum: number, j: any) => sum + j.vatAmount, 0);
            const margin = jobs.reduce((sum: number, j: any) => sum + j.marginAmount, 0);

            setSummary({
                totalRevenue: rev,
                totalPayouts: payouts,
                vatCollected: vat,
                netProfit: margin,
                unreconciledVat: vatRes.vatOwedToHMRC || 0
            });

        } catch (error) {
            console.error('Failed to load dashboard:', error);
            Alert.alert('Error', 'Failed to load financial data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleRetryPayout = async (batchId: string) => {
        Alert.alert('Confirm Retry', 'Are you sure you want to retry this Stripe payout?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Retry Payout', style: 'default', onPress: async () => {
                    try {
                        await apiClient(`/stripe-connect/retry-payout/${batchId}`, { method: 'POST' });
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        Alert.alert('Success', 'Payout initiated.');
                        loadData();
                    } catch (e: any) {
                        Alert.alert('Error', e.message || 'Retry failed');
                    }
                }
            }
        ]);
    };

    const handleReconcileVat = async (vatId: string) => {
        Alert.alert('Reconcile VAT', 'Mark this VAT record as paid to HMRC?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Reconcile', style: 'default', onPress: async () => {
                    try {
                        await apiClient(`/stripe-connect/vat-records/${vatId}/reconcile`, { method: 'PATCH' });
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        loadData();
                    } catch (e: any) {
                        Alert.alert('Error', e.message || 'Reconciliation failed');
                    }
                }
            }
        ]);
    };

    const tabs = [
        { id: 'summary', label: 'Summary', icon: PieChart },
        { id: 'jobs', label: 'Jobs', icon: Briefcase },
        { id: 'vat', label: 'VAT', icon: Receipt },
        { id: 'tax-ni', label: 'Tax & NI', icon: Layers },
        { id: 'payouts', label: 'Payout History', icon: DollarSign },
    ];

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginRight: 16 }}>
                    <ChevronLeft size={24} color={Colors.textInverse} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Finance Dashboard</Text>
            </View>

            <View style={styles.tabsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                    {tabs.map(t => (
                        <TouchableOpacity
                            key={t.id}
                            style={[styles.tabBtn, activeTab === t.id && styles.tabBtnActive]}
                            onPress={() => { setActiveTab(t.id as TabView); Haptics.impactAsync(); }}
                        >
                            <t.icon size={16} color={activeTab === t.id ? '#FFF' : Colors.textMuted} style={{ marginRight: 6 }} />
                            <Text style={[styles.tabText, activeTab === t.id && styles.tabTextActive]}>{t.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}>
                
                {/* 1. SUMMARY TAB */}
                {activeTab === 'summary' && (
                    <View style={styles.tabContent}>
                        <View style={styles.summaryGrid}>
                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryLabel}>Total Revenue (inc VAT)</Text>
                                <Text style={styles.summaryVal}>£{summary.totalRevenue.toFixed(2)}</Text>
                            </View>
                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryLabel}>Total Payouts</Text>
                                <Text style={[styles.summaryVal, { color: Colors.warning }]}>£{summary.totalPayouts.toFixed(2)}</Text>
                            </View>
                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryLabel}>Margin (Net Profit)</Text>
                                <Text style={[styles.summaryVal, { color: Colors.success }]}>£{summary.netProfit.toFixed(2)}</Text>
                            </View>
                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryLabel}>Owed to HMRC</Text>
                                <Text style={[styles.summaryVal, { color: Colors.danger }]}>£{summary.unreconciledVat.toFixed(2)}</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* 2. JOBS BREAKDOWN TAB */}
                {activeTab === 'jobs' && (
                    <View style={styles.tabContent}>
                        {jobsBreakdown.map((row) => (
                            <View key={row.id} style={styles.listCard}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <Text style={{ fontWeight: 'bold' }}>{row.jobNumber}</Text>
                                    <Text style={{ color: Colors.textMuted }}>{new Date(row.createdAt).toLocaleDateString()}</Text>
                                </View>
                                <View style={styles.rowItem}><Text>Customer Charge:</Text><Text>£{row.customerAmount.toFixed(2)}</Text></View>
                                <View style={styles.rowItem}><Text>Payout (Driver/Carrier):</Text><Text style={{ color: Colors.warning }}>£{(row.driverPayout + row.carrierPayout).toFixed(2)}</Text></View>
                                <View style={styles.rowItem}><Text>VAT Reserved:</Text><Text style={{ color: Colors.danger }}>£{row.vatAmount.toFixed(2)}</Text></View>
                                <View style={styles.rowItem}><Text>Margin:</Text><Text style={{ color: Colors.success, fontWeight: 'bold' }}>£{row.marginAmount.toFixed(2)}</Text></View>
                            </View>
                        ))}
                    </View>
                )}

                {/* 3. VAT LEDGER TAB */}
                {activeTab === 'vat' && (
                    <View style={styles.tabContent}>
                        {vatRecords.map(vat => (
                            <TouchableOpacity key={vat.id} style={[styles.listCard, vat.reconciled && { opacity: 0.6 }]} onPress={() => !vat.reconciled && handleReconcileVat(vat.id)}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <View>
                                        <Text style={{ fontWeight: 'bold' }}>Ref: {vat.jobId.slice(0, 8).toUpperCase()}</Text>
                                        <Text style={{ color: Colors.textMuted }}>{new Date(vat.createdAt).toLocaleDateString()}</Text>
                                        <Text style={{ fontSize: 18, fontWeight: '800', marginTop: 4 }}>£{vat.vatAmount.toFixed(2)}</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        {vat.reconciled ? (
                                            <View style={styles.badgeSuccess}><CheckCircle size={12} color={Colors.success}/><Text style={styles.badgeTextGreen}>Reconciled</Text></View>
                                        ) : (
                                            <View style={styles.badgeWarning}><Clock size={12} color={Colors.warning}/><Text style={styles.badgeTextYellow}>Owed</Text></View>
                                        )}
                                        <Text style={{ color: Colors.textMuted, fontSize: 12, marginTop: 8 }}>{vat.vatRegNumber}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* 4. TAX & NI TAB */}
                {activeTab === 'tax-ni' && (
                    <View style={styles.tabContent}>
                        {taxNiRecords.map(group => (
                            <View key={group.userId} style={styles.listCard}>
                                <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Employee: {group.userId.slice(0, 8)}</Text>
                                <View style={styles.rowItem}><Text>Gross Earnings:</Text><Text>£{group.totalGross.toFixed(2)}</Text></View>
                                <View style={styles.rowItem}><Text>Income Tax Deducted:</Text><Text style={{ color: Colors.danger }}>£{group.totalTax.toFixed(2)}</Text></View>
                                <View style={styles.rowItem}><Text>NI Deducted:</Text><Text style={{ color: Colors.danger }}>£{group.totalNi.toFixed(2)}</Text></View>
                                <View style={styles.rowItem}><Text>Net Pay Transferred:</Text><Text style={{ color: Colors.success, fontWeight: 'bold' }}>£{group.totalNet.toFixed(2)}</Text></View>
                            </View>
                        ))}
                    </View>
                )}

                {/* 5. PAYOUTS TAB */}
                {activeTab === 'payouts' && (
                    <View style={styles.tabContent}>
                        {settlements.map((batch: any) => (
                            <View key={batch.id} style={styles.listCard}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <Text style={{ fontWeight: 'bold' }}>{batch.recipientName}</Text>
                                    <Text style={{ color: Colors.textMuted }}>{new Date(batch.createdAt).toLocaleDateString()}</Text>
                                </View>
                                <Text style={{ color: Colors.textMuted, fontSize: 12 }}>Batch: {batch.reference}</Text>
                                <View style={[styles.rowItem, { marginTop: 8 }]}>
                                    <Text>Transfer Amt:</Text>
                                    <Text style={{ fontWeight: '800' }}>£{batch.netAmount.toFixed(2)}</Text>
                                </View>

                                <View style={[styles.rowItem, { marginTop: 8 }]}>
                                    <Text>Stripe Status:</Text>
                                    {batch.payoutStatus === 'PAID' && <View style={styles.badgeSuccess}><CheckCircle size={12} color={Colors.success}/><Text style={styles.badgeTextGreen}> PAID</Text></View>}
                                    {batch.payoutStatus === 'FAILED' && <View style={styles.badgeDanger}><XCircle size={12} color={Colors.danger}/><Text style={styles.badgeTextRed}> FAILED</Text></View>}
                                    {batch.payoutStatus === 'PENDING' && <View style={styles.badgeWarning}><Clock size={12} color={Colors.warning}/><Text style={styles.badgeTextYellow}> PENDING</Text></View>}
                                    {batch.payoutStatus === 'RETRYING' && <View style={styles.badgeWarning}><RefreshCw size={12} color={Colors.warning}/><Text style={styles.badgeTextYellow}> RETRY</Text></View>}
                                </View>

                                {batch.stripeTransferId && (
                                    <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 4 }}>ID: {batch.stripeTransferId}</Text>
                                )}

                                {batch.payoutStatus === 'FAILED' && (
                                    <TouchableOpacity style={styles.retryBtn} onPress={() => handleRetryPayout(batch.id)}>
                                        <Text style={styles.retryBtnText}>Retry Payout</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { backgroundColor: Colors.navy, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textInverse },
    tabsContainer: { backgroundColor: Colors.surface, paddingVertical: 12, borderBottomWidth: 1, borderColor: Colors.borderLight },
    tabBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.background, marginRight: 8 },
    tabBtnActive: { backgroundColor: Colors.adminPrimary },
    tabText: { color: Colors.textMuted, fontSize: 13, fontWeight: '600' },
    tabTextActive: { color: '#FFF' },
    tabContent: { padding: 16 },
    summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    summaryCard: { width: '48%', backgroundColor: Colors.surface, padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: Colors.borderLight },
    summaryLabel: { color: Colors.textMuted, fontSize: 12, marginBottom: 8 },
    summaryVal: { fontSize: 20, fontWeight: '800' },
    listCard: { backgroundColor: Colors.surface, padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: Colors.borderLight },
    rowItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    badgeSuccess: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.successLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    badgeTextGreen: { color: Colors.success, fontSize: 10, fontWeight: 'bold', marginLeft: 4 },
    badgeWarning: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.warningLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    badgeTextYellow: { color: Colors.warning, fontSize: 10, fontWeight: 'bold', marginLeft: 4 },
    badgeDanger: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dangerLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    badgeTextRed: { color: Colors.danger, fontSize: 10, fontWeight: 'bold', marginLeft: 4 },
    retryBtn: { marginTop: 12, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.adminPrimary, padding: 10, borderRadius: 8, alignItems: 'center' },
    retryBtnText: { color: Colors.adminPrimary, fontWeight: 'bold' }
});
