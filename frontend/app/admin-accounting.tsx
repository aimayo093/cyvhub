import React, { useState, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Modal,
    SafeAreaView,
    Platform,
    RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
    ChevronLeft,
    DollarSign,
    TrendingUp,
    TrendingDown,
    Users,
    Truck,
    CheckCircle,
    Clock,
    AlertCircle,
    FileText,
    Send,
    Eye,
    Filter,
    CreditCard,
    Receipt,
    BarChart3,
    Layers,
    CheckSquare,
    XCircle,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { apiClient } from '@/services/api';
import { SettlementBatch, SettlementStatus, AccountingEntry } from '@/types';

type TabView = 'overview' | 'settlements' | 'ledger';
type SettlementFilter = 'all' | 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'PROCESSING' | 'PAID' | 'FAILED';
type LedgerFilter = 'all' | 'credit' | 'debit';

const formatCurrency = (amount: number) => `£${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const STATUS_CONFIG: Record<SettlementStatus, { label: string; color: string; bg: string; icon: typeof CheckCircle }> = {
    DRAFT: { label: 'Draft', color: '#64748B', bg: '#F1F5F9', icon: FileText },
    PENDING_APPROVAL: { label: 'Pending', color: '#F59E0B', bg: '#FEF3C7', icon: Clock },
    APPROVED: { label: 'Approved', color: '#3B82F6', bg: '#DBEAFE', icon: CheckCircle },
    PROCESSING: { label: 'Processing', color: '#8B5CF6', bg: '#EDE9FE', icon: Send },
    PAID: { label: 'Paid', color: '#10B981', bg: '#D1FAE5', icon: CheckCircle },
    FAILED: { label: 'Failed', color: '#EF4444', bg: '#FEE2E2', icon: XCircle },
};

export default function AdminAccountingScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabView>('overview');
    const [settlements, setSettlements] = useState<SettlementBatch[]>([]);
    const [ledger, setLedger] = useState<AccountingEntry[]>([]);
    const [settlementFilter, setSettlementFilter] = useState<SettlementFilter>('all');
    const [ledgerFilter, setLedgerFilter] = useState<LedgerFilter>('all');
    const [selectedSettlement, setSelectedSettlement] = useState<SettlementBatch | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        try {
            const [settlementsRes, ledgerRes] = await Promise.all([
                apiClient('/payments/settlements'),
                apiClient('/payments/ledger')
            ]);
            if (settlementsRes.settlements) setSettlements(settlementsRes.settlements);
            if (ledgerRes.ledger) setLedger(ledgerRes.ledger);
        } catch (e) {
            console.error('Failed to load accounting data', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    React.useEffect(() => {
        loadData();
    }, [loadData]);

    // Summary calculations
    const totalPaidOut = useMemo(() =>
        settlements.filter(s => s.status === 'PAID').reduce((sum, s) => sum + s.netAmount, 0), [settlements]);
    const pendingAmount = useMemo(() =>
        settlements.filter(s => ['DRAFT', 'PENDING_APPROVAL', 'APPROVED'].includes(s.status)).reduce((sum, s) => sum + s.netAmount, 0), [settlements]);
    const totalFees = useMemo(() =>
        settlements.filter(s => s.status === 'PAID').reduce((sum, s) => sum + s.totalDeductions, 0), [settlements]);
    const driverPayouts = useMemo(() =>
        settlements.filter(s => s.recipientType === 'driver' && s.status === 'PAID').reduce((sum, s) => sum + s.netAmount, 0), [settlements]);
    const carrierPayouts = useMemo(() =>
        settlements.filter(s => s.recipientType === 'carrier' && s.status === 'PAID').reduce((sum, s) => sum + s.netAmount, 0), [settlements]);

    const filteredSettlements = useMemo(() => {
        if (settlementFilter === 'all') return settlements;
        return settlements.filter(s => s.status === settlementFilter);
    }, [settlements, settlementFilter]);

    const filteredLedger = useMemo(() => {
        if (ledgerFilter === 'all') return ledger;
        return ledger.filter(e => e.type === ledgerFilter);
    }, [ledger, ledgerFilter]);

    const handleApprove = useCallback((id: string) => {
        Alert.alert('Approve Settlement', 'Are you sure you want to approve this settlement?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Approve', onPress: () => {
                    setSettlements(prev => prev.map(s =>
                        s.id === id ? { ...s, status: 'APPROVED' as SettlementStatus, approvedBy: 'Admin', approvedAt: new Date().toISOString() } : s
                    ));
                    setSelectedSettlement(null);
                }
            },
        ]);
    }, []);

    const handleProcess = useCallback((id: string) => {
        Alert.alert('Process Payment', 'This will initiate payment to the recipient. Continue?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Process', onPress: () => {
                    setSettlements(prev => prev.map(s =>
                        s.id === id ? { ...s, status: 'PROCESSING' as SettlementStatus } : s
                    ));
                    setTimeout(() => {
                        setSettlements(prev => prev.map(s =>
                            s.id === id ? { ...s, status: 'PAID' as SettlementStatus, processedAt: new Date().toISOString() } : s
                        ));
                    }, 2000);
                    setSelectedSettlement(null);
                }
            },
        ]);
    }, []);

    const handleBatchProcess = useCallback(() => {
        const approved = settlements.filter(s => s.status === 'APPROVED');
        if (approved.length === 0) {
            Alert.alert('No Settlements', 'No approved settlements to process.');
            return;
        }
        Alert.alert(
            'Batch Process',
            `Process ${approved.length} approved settlement(s) totaling ${formatCurrency(approved.reduce((s, a) => s + a.netAmount, 0))}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Process All', onPress: () => {
                        const ids = approved.map(a => a.id);
                        setSettlements(prev => prev.map(s =>
                            ids.includes(s.id) ? { ...s, status: 'PROCESSING' as SettlementStatus } : s
                        ));
                        setTimeout(() => {
                            setSettlements(prev => prev.map(s =>
                                ids.includes(s.id) ? { ...s, status: 'PAID' as SettlementStatus, processedAt: new Date().toISOString() } : s
                            ));
                        }, 2500);
                    }
                },
            ]
        );
    }, [settlements]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadData();
    }, [loadData]);

    const tabs: { key: TabView; label: string; icon: typeof BarChart3 }[] = [
        { key: 'overview', label: 'Overview', icon: BarChart3 },
        { key: 'settlements', label: 'Settlements', icon: Layers },
        { key: 'ledger', label: 'Ledger', icon: Receipt },
    ];

    const renderOverview = () => (
        <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {/* Summary Cards */}
            <View style={styles.summaryGrid}>
                <View style={[styles.summaryCard, { borderLeftColor: '#10B981' }]}>
                    <View style={styles.summaryIconRow}>
                        <View style={[styles.summaryIcon, { backgroundColor: '#D1FAE5' }]}>
                            <CheckCircle size={18} color="#10B981" />
                        </View>
                    </View>
                    <Text style={styles.summaryAmount}>{formatCurrency(totalPaidOut)}</Text>
                    <Text style={styles.summaryLabel}>Total Paid Out</Text>
                </View>

                <View style={[styles.summaryCard, { borderLeftColor: '#F59E0B' }]}>
                    <View style={styles.summaryIconRow}>
                        <View style={[styles.summaryIcon, { backgroundColor: '#FEF3C7' }]}>
                            <Clock size={18} color="#F59E0B" />
                        </View>
                    </View>
                    <Text style={styles.summaryAmount}>{formatCurrency(pendingAmount)}</Text>
                    <Text style={styles.summaryLabel}>Pending</Text>
                </View>

                <View style={[styles.summaryCard, { borderLeftColor: '#8B5CF6' }]}>
                    <View style={styles.summaryIconRow}>
                        <View style={[styles.summaryIcon, { backgroundColor: '#EDE9FE' }]}>
                            <DollarSign size={18} color="#8B5CF6" />
                        </View>
                    </View>
                    <Text style={styles.summaryAmount}>{formatCurrency(totalFees)}</Text>
                    <Text style={styles.summaryLabel}>Fees Collected</Text>
                </View>
            </View>

            {/* Breakdown */}
            <View style={styles.breakdownCard}>
                <Text style={styles.sectionTitle}>Payout Breakdown</Text>
                <View style={styles.breakdownRow}>
                    <View style={styles.breakdownLeft}>
                        <Users size={16} color={Colors.primary} />
                        <Text style={styles.breakdownLabel}>Driver Payouts</Text>
                    </View>
                    <Text style={styles.breakdownValue}>{formatCurrency(driverPayouts)}</Text>
                </View>
                <View style={styles.breakdownDivider} />
                <View style={styles.breakdownRow}>
                    <View style={styles.breakdownLeft}>
                        <Truck size={16} color={Colors.carrierPrimary} />
                        <Text style={styles.breakdownLabel}>Carrier Payouts</Text>
                    </View>
                    <Text style={styles.breakdownValue}>{formatCurrency(carrierPayouts)}</Text>
                </View>
                <View style={styles.breakdownDivider} />
                <View style={styles.breakdownRow}>
                    <View style={styles.breakdownLeft}>
                        <TrendingUp size={16} color="#10B981" />
                        <Text style={styles.breakdownLabel}>Platform Revenue</Text>
                    </View>
                    <Text style={[styles.breakdownValue, { color: '#10B981' }]}>{formatCurrency(totalFees)}</Text>
                </View>
            </View>

            {/* Pending Actions */}
            <View style={styles.actionsCard}>
                <Text style={styles.sectionTitle}>Pending Actions</Text>
                {settlements.filter(s => s.status === 'PENDING_APPROVAL').map(s => (
                    <View key={s.id} style={styles.actionItem}>
                        <View style={styles.actionLeft}>
                            <AlertCircle size={16} color="#F59E0B" />
                            <View>
                                <Text style={styles.actionName}>{s.recipientName}</Text>
                                <Text style={styles.actionMeta}>{s.recipientType} • {s.jobsCount} jobs • {formatCurrency(s.netAmount)}</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.approveBtn}
                            onPress={() => handleApprove(s.id)}
                        >
                            <Text style={styles.approveBtnText}>Approve</Text>
                        </TouchableOpacity>
                    </View>
                ))}
                {settlements.filter(s => s.status === 'PENDING_APPROVAL').length === 0 && (
                    <Text style={styles.emptyText}>No pending approvals</Text>
                )}

                <TouchableOpacity style={styles.batchButton} onPress={handleBatchProcess}>
                    <Send size={16} color="#fff" />
                    <Text style={styles.batchButtonText}>Process All Approved Settlements</Text>
                </TouchableOpacity>
            </View>

            <View style={{ height: 40 }} />
        </ScrollView>
    );

    const renderSettlements = () => (
        <View style={{ flex: 1 }}>
            {/* Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                {(['all', 'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PAID'] as SettlementFilter[]).map(f => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.filterChip, settlementFilter === f && styles.filterChipActive]}
                        onPress={() => setSettlementFilter(f)}
                    >
                        <Text style={[styles.filterChipText, settlementFilter === f && styles.filterChipTextActive]}>
                            {f === 'all' ? 'All' : STATUS_CONFIG[f as SettlementStatus]?.label || f}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <ScrollView showsVerticalScrollIndicator={false}>
                {filteredSettlements.map(s => {
                    const statusCfg = STATUS_CONFIG[s.status];
                    const StatusIcon = statusCfg.icon;
                    return (
                        <TouchableOpacity
                            key={s.id}
                            style={styles.settlementCard}
                            onPress={() => setSelectedSettlement(s)}
                        >
                            <View style={styles.settlementHeader}>
                                <View style={styles.settlementRecipient}>
                                    {s.recipientType === 'driver' ? (
                                        <Users size={16} color={Colors.primary} />
                                    ) : (
                                        <Truck size={16} color={Colors.carrierPrimary} />
                                    )}
                                    <Text style={styles.settlementName}>{s.recipientName}</Text>
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
                                    <StatusIcon size={12} color={statusCfg.color} />
                                    <Text style={[styles.statusBadgeText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
                                </View>
                            </View>

                            <View style={styles.settlementBody}>
                                <View style={styles.settlementDetail}>
                                    <Text style={styles.settlementDetailLabel}>Period</Text>
                                    <Text style={styles.settlementDetailValue}>{formatDate(s.periodStart)} — {formatDate(s.periodEnd)}</Text>
                                </View>
                                <View style={styles.settlementAmounts}>
                                    <View style={styles.amountCol}>
                                        <Text style={styles.amountLabel}>Gross</Text>
                                        <Text style={styles.amountValue}>{formatCurrency(s.grossAmount)}</Text>
                                    </View>
                                    <Text style={styles.amountMinus}>−</Text>
                                    <View style={styles.amountCol}>
                                        <Text style={styles.amountLabel}>Deduct</Text>
                                        <Text style={[styles.amountValue, { color: Colors.danger }]}>{formatCurrency(s.totalDeductions)}</Text>
                                    </View>
                                    <Text style={styles.amountEquals}>=</Text>
                                    <View style={styles.amountCol}>
                                        <Text style={styles.amountLabel}>Net</Text>
                                        <Text style={[styles.amountValue, { color: '#10B981', fontWeight: '800' }]}>{formatCurrency(s.netAmount)}</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.settlementFooter}>
                                <Text style={styles.settlementRef}>{s.reference}</Text>
                                <Text style={styles.settlementJobs}>{s.jobsCount} jobs • {s.method}</Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Settlement Detail Modal */}
            <Modal visible={!!selectedSettlement} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {selectedSettlement && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Settlement Detail</Text>
                                    <TouchableOpacity onPress={() => setSelectedSettlement(null)}>
                                        <XCircle size={24} color={Colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.modalSection}>
                                    <Text style={styles.modalSectionTitle}>Recipient</Text>
                                    <Text style={styles.modalValue}>{selectedSettlement.recipientName}</Text>
                                    <Text style={styles.modalMeta}>{selectedSettlement.recipientType} • {selectedSettlement.reference}</Text>
                                </View>

                                <View style={styles.modalSection}>
                                    <Text style={styles.modalSectionTitle}>Period</Text>
                                    <Text style={styles.modalValue}>{formatDate(selectedSettlement.periodStart)} — {formatDate(selectedSettlement.periodEnd)}</Text>
                                    <Text style={styles.modalMeta}>{selectedSettlement.jobsCount} jobs completed</Text>
                                </View>

                                <View style={styles.modalSection}>
                                    <Text style={styles.modalSectionTitle}>Breakdown</Text>
                                    <View style={styles.modalRow}>
                                        <Text style={styles.modalRowLabel}>Gross Earnings</Text>
                                        <Text style={styles.modalRowValue}>{formatCurrency(selectedSettlement.grossAmount)}</Text>
                                    </View>
                                    {selectedSettlement.deductions.map((d, i) => (
                                        <View key={i} style={styles.modalRow}>
                                            <Text style={[styles.modalRowLabel, { color: Colors.danger }]}>− {d.description}</Text>
                                            <Text style={[styles.modalRowValue, { color: Colors.danger }]}>-{formatCurrency(d.amount)}</Text>
                                        </View>
                                    ))}
                                    <View style={styles.modalDivider} />
                                    <View style={styles.modalRow}>
                                        <Text style={[styles.modalRowLabel, { fontWeight: '700' }]}>Net Payout</Text>
                                        <Text style={[styles.modalRowValue, { color: '#10B981', fontWeight: '800', fontSize: 18 }]}>{formatCurrency(selectedSettlement.netAmount)}</Text>
                                    </View>
                                </View>

                                <View style={styles.modalSection}>
                                    <Text style={styles.modalSectionTitle}>Payment Method</Text>
                                    <View style={styles.methodBadge}>
                                        <CreditCard size={14} color={Colors.primary} />
                                        <Text style={styles.methodText}>{selectedSettlement.method === 'stripe' ? 'Stripe' : 'PayPal'}</Text>
                                    </View>
                                </View>

                                {/* Action Buttons */}
                                {selectedSettlement.status === 'PENDING_APPROVAL' && (
                                    <TouchableOpacity
                                        style={[styles.modalAction, { backgroundColor: '#10B981' }]}
                                        onPress={() => handleApprove(selectedSettlement.id)}
                                    >
                                        <CheckSquare size={16} color="#fff" />
                                        <Text style={styles.modalActionText}>Approve Settlement</Text>
                                    </TouchableOpacity>
                                )}
                                {selectedSettlement.status === 'APPROVED' && (
                                    <TouchableOpacity
                                        style={[styles.modalAction, { backgroundColor: Colors.primary }]}
                                        onPress={() => handleProcess(selectedSettlement.id)}
                                    >
                                        <Send size={16} color="#fff" />
                                        <Text style={styles.modalActionText}>Process Payment</Text>
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity
                                    style={[styles.modalAction, { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border }]}
                                    onPress={() => setSelectedSettlement(null)}
                                >
                                    <Text style={[styles.modalActionText, { color: Colors.text }]}>Close</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );

    const renderLedger = () => (
        <View style={{ flex: 1 }}>
            {/* Filter */}
            <View style={styles.ledgerFilterRow}>
                {(['all', 'credit', 'debit'] as LedgerFilter[]).map(f => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.ledgerFilterBtn, ledgerFilter === f && styles.ledgerFilterBtnActive]}
                        onPress={() => setLedgerFilter(f)}
                    >
                        {f === 'credit' && <TrendingUp size={14} color={ledgerFilter === f ? '#fff' : '#10B981'} />}
                        {f === 'debit' && <TrendingDown size={14} color={ledgerFilter === f ? '#fff' : '#EF4444'} />}
                        <Text style={[styles.ledgerFilterText, ledgerFilter === f && styles.ledgerFilterTextActive]}>
                            {f === 'all' ? 'All' : f === 'credit' ? 'Credits' : 'Debits'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {filteredLedger.map(entry => (
                    <View key={entry.id} style={styles.ledgerEntry}>
                        <View style={[styles.ledgerIcon, { backgroundColor: entry.type === 'credit' ? '#D1FAE5' : '#FEE2E2' }]}>
                            {entry.type === 'credit' ? (
                                <TrendingUp size={16} color="#10B981" />
                            ) : (
                                <TrendingDown size={16} color="#EF4444" />
                            )}
                        </View>
                        <View style={styles.ledgerInfo}>
                            <Text style={styles.ledgerDesc}>{entry.description}</Text>
                            <Text style={styles.ledgerMeta}>
                                {formatDate(entry.date)} • {entry.reference}
                                {entry.recipientName ? ` • ${entry.recipientName}` : ''}
                            </Text>
                        </View>
                        <View style={styles.ledgerAmountCol}>
                            <Text style={[styles.ledgerAmount, { color: entry.type === 'credit' ? '#10B981' : '#EF4444' }]}>
                                {entry.type === 'credit' ? '+' : '-'}{formatCurrency(entry.amount)}
                            </Text>
                            <Text style={styles.ledgerBalance}>Bal: {formatCurrency(entry.balance)}</Text>
                        </View>
                    </View>
                ))}
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.screen}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <ChevronLeft size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Accounting</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Tabs */}
                <View style={styles.tabRow}>
                    {tabs.map(t => {
                        const isActive = activeTab === t.key;
                        const Icon = t.icon;
                        return (
                            <TouchableOpacity
                                key={t.key}
                                style={[styles.tab, isActive && styles.tabActive]}
                                onPress={() => setActiveTab(t.key)}
                            >
                                <Icon size={16} color={isActive ? Colors.adminPrimary : Colors.textMuted} />
                                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{t.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {activeTab === 'overview' && renderOverview()}
                    {activeTab === 'settlements' && renderSettlements()}
                    {activeTab === 'ledger' && renderLedger()}
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.navy },
    screen: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: Colors.navy, paddingHorizontal: 16, paddingVertical: 14,
        paddingTop: Platform.OS === 'web' ? 14 : 8,
    },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
    tabRow: {
        flexDirection: 'row', backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
    tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.adminPrimary },
    tabText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
    tabTextActive: { color: Colors.adminPrimary },
    content: { flex: 1 },

    // Overview
    summaryGrid: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 16, gap: 10 },
    summaryCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: 12, padding: 14, borderLeftWidth: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    summaryIconRow: { marginBottom: 8 },
    summaryIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    summaryAmount: { fontSize: 17, fontWeight: '800', color: Colors.text },
    summaryLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },

    breakdownCard: { backgroundColor: Colors.surface, margin: 16, borderRadius: 14, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 12 },
    breakdownRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
    breakdownLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    breakdownLabel: { fontSize: 14, color: Colors.text },
    breakdownValue: { fontSize: 15, fontWeight: '700', color: Colors.text },
    breakdownDivider: { height: 1, backgroundColor: Colors.borderLight },

    actionsCard: { backgroundColor: Colors.surface, marginHorizontal: 16, borderRadius: 14, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    actionItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
    actionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    actionName: { fontSize: 14, fontWeight: '600', color: Colors.text },
    actionMeta: { fontSize: 12, color: Colors.textSecondary },
    approveBtn: { backgroundColor: '#10B981', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
    approveBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    emptyText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', paddingVertical: 16 },
    batchButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.adminPrimary, paddingVertical: 14, borderRadius: 12, marginTop: 14 },
    batchButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },

    // Settlements
    filterRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
    filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border },
    filterChipActive: { backgroundColor: Colors.adminPrimary, borderColor: Colors.adminPrimary },
    filterChipText: { fontSize: 13, fontWeight: '600', color: Colors.text },
    filterChipTextActive: { color: '#fff' },

    settlementCard: { backgroundColor: Colors.surface, marginHorizontal: 16, marginBottom: 10, borderRadius: 14, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    settlementHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    settlementRecipient: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    settlementName: { fontSize: 15, fontWeight: '700', color: Colors.text },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusBadgeText: { fontSize: 12, fontWeight: '600' },
    settlementBody: {},
    settlementDetail: { marginBottom: 8 },
    settlementDetailLabel: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase' },
    settlementDetailValue: { fontSize: 13, color: Colors.text, marginTop: 1 },
    settlementAmounts: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.surfaceAlt, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 8 },
    amountCol: { alignItems: 'center' },
    amountLabel: { fontSize: 10, color: Colors.textSecondary, fontWeight: '600', textTransform: 'uppercase' },
    amountValue: { fontSize: 14, fontWeight: '700', color: Colors.text },
    amountMinus: { fontSize: 18, color: Colors.textSecondary, fontWeight: '300' },
    amountEquals: { fontSize: 18, color: Colors.textSecondary, fontWeight: '300' },
    settlementFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.borderLight },
    settlementRef: { fontSize: 12, fontWeight: '600', color: Colors.primary },
    settlementJobs: { fontSize: 12, color: Colors.textSecondary },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
    modalSection: { marginBottom: 16 },
    modalSectionTitle: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', marginBottom: 4 },
    modalValue: { fontSize: 16, fontWeight: '600', color: Colors.text },
    modalMeta: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
    modalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
    modalRowLabel: { fontSize: 14, color: Colors.text },
    modalRowValue: { fontSize: 14, fontWeight: '600', color: Colors.text },
    modalDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 6 },
    methodBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.surfaceAlt, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignSelf: 'flex-start' },
    methodText: { fontSize: 14, fontWeight: '600', color: Colors.text },
    modalAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, marginBottom: 10 },
    modalActionText: { color: '#fff', fontSize: 15, fontWeight: '700' },

    // Ledger
    ledgerFilterRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
    ledgerFilterBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.surfaceAlt, flex: 1, justifyContent: 'center' },
    ledgerFilterBtnActive: { backgroundColor: Colors.adminPrimary },
    ledgerFilterText: { fontSize: 13, fontWeight: '600', color: Colors.text },
    ledgerFilterTextActive: { color: '#fff' },

    ledgerEntry: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.borderLight, gap: 10 },
    ledgerIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    ledgerInfo: { flex: 1 },
    ledgerDesc: { fontSize: 13, fontWeight: '600', color: Colors.text },
    ledgerMeta: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
    ledgerAmountCol: { alignItems: 'flex-end' },
    ledgerAmount: { fontSize: 14, fontWeight: '700' },
    ledgerBalance: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
});
