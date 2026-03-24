import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  FlatList,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  TrendingUp,
  Wallet,
  Send,
  RotateCcw,
  Shield,
  Pause,
  Play,
  ChevronRight,
  X,
  BarChart3,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { usePayments } from '@/providers/PaymentProvider';
import { useAuth } from '@/providers/AuthProvider';
import { PaymentTransaction, PayoutRecord } from '@/types';

const PAYPAL_BLUE = '#0070BA';
const STRIPE_PURPLE = '#635BFF';

type ViewMode = 'overview' | 'transactions' | 'payouts';
type TxnFilter = 'all' | 'charge' | 'refund';
type PayoutFilter = 'all' | 'PENDING' | 'PROCESSING' | 'PAID' | 'ON_HOLD';

function formatCurrency(amount: number): string {
  return `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

const TXN_STATUS_MAP: Record<string, { color: string; bg: string; icon: typeof CheckCircle }> = {
  COMPLETED: { color: Colors.success, bg: Colors.successLight, icon: CheckCircle },
  PENDING: { color: Colors.warning, bg: Colors.warningLight, icon: Clock },
  PROCESSING: { color: Colors.info, bg: Colors.infoLight, icon: Clock },
  FAILED: { color: Colors.danger, bg: Colors.dangerLight, icon: XCircle },
  REFUNDED: { color: Colors.purple, bg: Colors.purpleLight, icon: RotateCcw },
};

const PAYOUT_STATUS_MAP: Record<string, { color: string; bg: string; label: string }> = {
  PENDING: { color: Colors.warning, bg: Colors.warningLight, label: 'Pending' },
  PROCESSING: { color: Colors.info, bg: Colors.infoLight, label: 'Processing' },
  PAID: { color: Colors.success, bg: Colors.successLight, label: 'Paid' },
  FAILED: { color: Colors.danger, bg: Colors.dangerLight, label: 'Failed' },
  ON_HOLD: { color: '#9333EA', bg: '#F3E8FF', label: 'On Hold' },
};

function DetailRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, valueColor ? { color: valueColor } : undefined]} numberOfLines={2}>{value}</Text>
    </View>
  );
}

function AdminPaymentsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    transactions, payouts, summary,
    processRefund, processPayout, holdPayout, releasePayout,
  } = usePayments();

  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [txnFilter, setTxnFilter] = useState<TxnFilter>('all');
  const [payoutFilter, setPayoutFilter] = useState<PayoutFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<PaymentTransaction | null>(null);
  const [selectedPayout, setSelectedPayout] = useState<PayoutRecord | null>(null);

  const filteredTxns = useMemo(() => {
    if (txnFilter === 'all') return transactions;
    return transactions.filter(t => t.type === txnFilter);
  }, [transactions, txnFilter]);

  const filteredPayouts = useMemo(() => {
    if (payoutFilter === 'all') return payouts;
    return payouts.filter(p => p.status === payoutFilter);
  }, [payouts, payoutFilter]);

  const maxRevenue = Math.max(...summary.monthlyRevenue.map(m => m.revenue), 1);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const handleRefund = useCallback((txn: PaymentTransaction) => {
    Alert.alert(
      'Process Refund',
      `Refund ${formatCurrency(txn.amount)} for ${txn.description}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Full Refund', onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await processRefund(txn.id);
            setSelectedTxn(null);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Refunded', 'Refund has been processed successfully.');
          }
        },
      ]
    );
  }, [processRefund]);

  const handleProcessPayout = useCallback((payout: PayoutRecord) => {
    Alert.alert(
      'Process Payout',
      `Pay ${formatCurrency(payout.amount)} to ${payout.recipientName} via ${payout.method === 'stripe' ? 'Stripe' : 'PayPal'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Process', onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await processPayout(payout.id);
            setSelectedPayout(null);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Payout Sent', `${formatCurrency(payout.amount)} sent to ${payout.recipientName}.`);
          }
        },
      ]
    );
  }, [processPayout]);

  const handleHoldPayout = useCallback((payout: PayoutRecord) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    holdPayout(payout.id);
    setSelectedPayout(null);
    Alert.alert('Payout Held', `Payout to ${payout.recipientName} has been placed on hold.`);
  }, [holdPayout]);

  const handleReleasePayout = useCallback((payout: PayoutRecord) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    releasePayout(payout.id);
    setSelectedPayout(null);
    Alert.alert('Payout Released', `Payout to ${payout.recipientName} has been released.`);
  }, [releasePayout]);

  const renderOverview = () => (
    <ScrollView
      style={styles.body}
      contentContainerStyle={styles.bodyContent}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.adminPrimary} />}
    >
      <View style={styles.balanceRow}>
        <View style={[styles.balanceCard, { borderLeftColor: STRIPE_PURPLE }]}>
          <View style={[styles.balanceIcon, { backgroundColor: STRIPE_PURPLE + '15' }]}>
            <CreditCard size={18} color={STRIPE_PURPLE} />
          </View>
          <Text style={styles.balanceValue}>{formatCurrency(summary.stripeBalance)}</Text>
          <Text style={styles.balanceLabel}>Stripe Balance</Text>
        </View>
        <View style={[styles.balanceCard, { borderLeftColor: PAYPAL_BLUE }]}>
          <View style={[styles.balanceIcon, { backgroundColor: PAYPAL_BLUE + '15' }]}>
            <Text style={styles.paypalSmall}>P</Text>
          </View>
          <Text style={styles.balanceValue}>{formatCurrency(summary.paypalBalance)}</Text>
          <Text style={styles.balanceLabel}>PayPal Balance</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: Colors.successLight }]}>
            <TrendingUp size={16} color={Colors.success} />
          </View>
          <Text style={styles.statValue}>{formatCurrency(summary.totalRevenue)}</Text>
          <Text style={styles.statLabel}>Total Revenue</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: Colors.infoLight }]}>
            <Send size={16} color={Colors.info} />
          </View>
          <Text style={styles.statValue}>{formatCurrency(summary.totalPayouts)}</Text>
          <Text style={styles.statLabel}>Total Payouts</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: Colors.warningLight }]}>
            <Clock size={16} color={Colors.warning} />
          </View>
          <Text style={styles.statValue}>{formatCurrency(summary.pendingPayouts)}</Text>
          <Text style={styles.statLabel}>Pending Payouts</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: Colors.purpleLight }]}>
            <DollarSign size={16} color={Colors.purple} />
          </View>
          <Text style={styles.statValue}>{formatCurrency(summary.platformFees)}</Text>
          <Text style={styles.statLabel}>Platform Fees</Text>
        </View>
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Monthly Revenue vs Payouts</Text>
        <View style={styles.chart}>
          {summary.monthlyRevenue.map((item) => (
            <View key={item.month} style={styles.chartBarGroup}>
              <View style={styles.chartBars}>
                <View style={[styles.chartBar, { height: `${(item.revenue / maxRevenue) * 100}%`, backgroundColor: Colors.adminPrimary }]} />
                <View style={[styles.chartBar, { height: `${(item.payouts / maxRevenue) * 100}%`, backgroundColor: Colors.info + '60' }]} />
              </View>
              <Text style={styles.chartBarLabel}>{item.month}</Text>
            </View>
          ))}
        </View>
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.adminPrimary }]} />
            <Text style={styles.legendText}>Revenue</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.info + '60' }]} />
            <Text style={styles.legendText}>Payouts</Text>
          </View>
        </View>
      </View>

      <View style={styles.recentSection}>
        <View style={styles.recentHeader}>
          <Text style={styles.recentTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => setViewMode('transactions')} activeOpacity={0.7}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        {transactions.slice(0, 5).map(txn => {
          const statusConfig = TXN_STATUS_MAP[txn.status] ?? TXN_STATUS_MAP.PENDING;
          return (
            <TouchableOpacity
              key={txn.id}
              style={styles.txnItem}
              onPress={() => setSelectedTxn(txn)}
              activeOpacity={0.7}
            >
              <View style={[styles.txnIcon, { backgroundColor: txn.type === 'refund' ? Colors.purpleLight : statusConfig.bg }]}>
                {txn.type === 'refund' ? (
                  <RotateCcw size={14} color={Colors.purple} />
                ) : (
                  <ArrowUpRight size={14} color={statusConfig.color} />
                )}
              </View>
              <View style={styles.txnInfo}>
                <Text style={styles.txnDesc} numberOfLines={1}>{txn.description}</Text>
                <Text style={styles.txnMeta}>{txn.customerName} · {formatDate(txn.createdAt)}</Text>
              </View>
              <View style={styles.txnRight}>
                <Text style={[styles.txnAmount, txn.type === 'refund' && { color: Colors.purple }]}>
                  {txn.type === 'refund' ? '-' : '+'}{formatCurrency(txn.amount)}
                </Text>
                <View style={styles.txnMethodBadge}>
                  {txn.method === 'stripe' ? (
                    <CreditCard size={10} color={STRIPE_PURPLE} />
                  ) : (
                    <Text style={styles.txnMethodPP}>P</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.recentSection}>
        <View style={styles.recentHeader}>
          <Text style={styles.recentTitle}>Pending Payouts</Text>
          <TouchableOpacity onPress={() => setViewMode('payouts')} activeOpacity={0.7}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        {payouts.filter(p => p.status === 'PENDING' || p.status === 'PROCESSING').slice(0, 4).map(po => {
          const statusConfig = PAYOUT_STATUS_MAP[po.status] ?? PAYOUT_STATUS_MAP.PENDING;
          return (
            <TouchableOpacity
              key={po.id}
              style={styles.payoutItem}
              onPress={() => setSelectedPayout(po)}
              activeOpacity={0.7}
            >
              <View style={[styles.payoutAvatar, { backgroundColor: po.recipientType === 'driver' ? Colors.primary + '15' : Colors.carrierPrimary + '15' }]}>
                <Text style={[styles.payoutAvatarText, { color: po.recipientType === 'driver' ? Colors.primary : Colors.carrierPrimary }]}>
                  {po.recipientName.charAt(0)}
                </Text>
              </View>
              <View style={styles.payoutInfo}>
                <Text style={styles.payoutName}>{po.recipientName}</Text>
                <Text style={styles.payoutMeta}>{po.recipientType === 'driver' ? 'Driver' : 'Carrier'} · {po.jobsCount} jobs</Text>
              </View>
              <View style={styles.payoutRight}>
                <Text style={styles.payoutAmount}>{formatCurrency(po.amount)}</Text>
                <View style={[styles.payoutStatusBadge, { backgroundColor: statusConfig.bg }]}>
                  <Text style={[styles.payoutStatusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );

  const renderTransactions = () => (
    <View style={styles.body}>
      <View style={styles.filterBar}>
        {(['all', 'charge', 'refund'] as TxnFilter[]).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, txnFilter === f && styles.filterChipActive]}
            onPress={() => { setTxnFilter(f); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          >
            <Text style={[styles.filterChipText, txnFilter === f && styles.filterChipTextActive]}>
              {f === 'all' ? 'All' : f === 'charge' ? 'Charges' : 'Refunds'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={filteredTxns}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.adminPrimary} />}
        renderItem={({ item: txn }) => {
          const statusConfig = TXN_STATUS_MAP[txn.status] ?? TXN_STATUS_MAP.PENDING;
          const StatusIcon = statusConfig.icon;
          return (
            <TouchableOpacity style={styles.txnCard} onPress={() => setSelectedTxn(txn)} activeOpacity={0.7}>
              <View style={styles.txnCardTop}>
                <View style={styles.txnCardLeft}>
                  <View style={[styles.txnTypeIcon, { backgroundColor: txn.type === 'refund' ? Colors.purpleLight : statusConfig.bg }]}>
                    {txn.type === 'refund' ? <RotateCcw size={14} color={Colors.purple} /> : <ArrowUpRight size={14} color={statusConfig.color} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.txnCardDesc} numberOfLines={1}>{txn.description}</Text>
                    <Text style={styles.txnCardCustomer}>{txn.customerName}</Text>
                  </View>
                </View>
                <Text style={[styles.txnCardAmount, txn.type === 'refund' && { color: Colors.purple }]}>
                  {txn.type === 'refund' ? '-' : ''}{formatCurrency(txn.amount)}
                </Text>
              </View>
              <View style={styles.txnCardBottom}>
                <View style={[styles.txnCardStatus, { backgroundColor: statusConfig.bg }]}>
                  <StatusIcon size={10} color={statusConfig.color} />
                  <Text style={[styles.txnCardStatusText, { color: statusConfig.color }]}>{txn.status}</Text>
                </View>
                <View style={styles.txnCardMethodRow}>
                  {txn.method === 'stripe' ? (
                    <>
                      <CreditCard size={11} color={STRIPE_PURPLE} />
                      <Text style={styles.txnCardMethodText}>{txn.cardLast4 ? `•••• ${txn.cardLast4}` : 'Stripe'}</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.ppSmallIcon}>P</Text>
                      <Text style={styles.txnCardMethodText}>PayPal</Text>
                    </>
                  )}
                </View>
                <Text style={styles.txnCardDate}>{formatDate(txn.createdAt)}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <CreditCard size={40} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No transactions</Text>
          </View>
        }
      />
    </View>
  );

  const renderPayouts = () => (
    <View style={styles.body}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBar}>
        {(['all', 'PENDING', 'PROCESSING', 'PAID', 'ON_HOLD'] as PayoutFilter[]).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, payoutFilter === f && styles.filterChipActive]}
            onPress={() => { setPayoutFilter(f); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          >
            <Text style={[styles.filterChipText, payoutFilter === f && styles.filterChipTextActive]}>
              {f === 'all' ? 'All' : PAYOUT_STATUS_MAP[f]?.label ?? f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <FlatList
        data={filteredPayouts}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.adminPrimary} />}
        renderItem={({ item: po }) => {
          const statusConfig = PAYOUT_STATUS_MAP[po.status] ?? PAYOUT_STATUS_MAP.PENDING;
          return (
            <TouchableOpacity style={styles.payoutCard} onPress={() => setSelectedPayout(po)} activeOpacity={0.7}>
              <View style={styles.payoutCardTop}>
                <View style={[styles.payoutCardAvatar, { backgroundColor: po.recipientType === 'driver' ? Colors.primary + '15' : Colors.carrierPrimary + '15' }]}>
                  <Text style={[styles.payoutCardAvatarText, { color: po.recipientType === 'driver' ? Colors.primary : Colors.carrierPrimary }]}>
                    {po.recipientName.charAt(0)}
                  </Text>
                </View>
                <View style={styles.payoutCardInfo}>
                  <Text style={styles.payoutCardName}>{po.recipientName}</Text>
                  <Text style={styles.payoutCardType}>
                    {po.recipientType === 'driver' ? 'Driver' : 'Carrier'} · {po.reference}
                  </Text>
                </View>
                <View style={styles.payoutCardRight}>
                  <Text style={styles.payoutCardAmount}>{formatCurrency(po.amount)}</Text>
                  <View style={[styles.payoutCardStatus, { backgroundColor: statusConfig.bg }]}>
                    <Text style={[styles.payoutCardStatusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.payoutCardBottom}>
                <View style={styles.payoutCardDetail}>
                  <Text style={styles.payoutCardDetailLabel}>Period</Text>
                  <Text style={styles.payoutCardDetailValue}>{formatDate(po.periodStart)} - {formatDate(po.periodEnd)}</Text>
                </View>
                <View style={styles.payoutCardDetail}>
                  <Text style={styles.payoutCardDetailLabel}>Jobs</Text>
                  <Text style={styles.payoutCardDetailValue}>{po.jobsCount}</Text>
                </View>
                <View style={styles.payoutCardDetail}>
                  <Text style={styles.payoutCardDetailLabel}>Gross</Text>
                  <Text style={styles.payoutCardDetailValue}>{formatCurrency(po.grossAmount)}</Text>
                </View>
                <View style={styles.payoutCardDetail}>
                  <Text style={styles.payoutCardDetailLabel}>Deductions</Text>
                  <Text style={[styles.payoutCardDetailValue, { color: Colors.danger }]}>-{formatCurrency(po.deductions)}</Text>
                </View>
              </View>
              <View style={styles.payoutCardFooter}>
                <View style={styles.payoutCardMethodRow}>
                  {po.method === 'stripe' ? (
                    <><CreditCard size={11} color={STRIPE_PURPLE} /><Text style={styles.payoutCardMethodText}>Stripe Connect</Text></>
                  ) : (
                    <><Text style={styles.ppSmallIcon}>P</Text><Text style={styles.payoutCardMethodText}>PayPal</Text></>
                  )}
                </View>
                {(po.status === 'PENDING' || po.status === 'ON_HOLD') && (
                  <View style={styles.payoutActions}>
                    {po.status === 'PENDING' && (
                      <>
                        <TouchableOpacity style={styles.payoutActionBtn} onPress={() => handleProcessPayout(po)}>
                          <Send size={12} color={Colors.success} />
                          <Text style={[styles.payoutActionText, { color: Colors.success }]}>Pay</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.payoutActionBtn} onPress={() => handleHoldPayout(po)}>
                          <Pause size={12} color={Colors.warning} />
                          <Text style={[styles.payoutActionText, { color: Colors.warning }]}>Hold</Text>
                        </TouchableOpacity>
                      </>
                    )}
                    {po.status === 'ON_HOLD' && (
                      <TouchableOpacity style={styles.payoutActionBtn} onPress={() => handleReleasePayout(po)}>
                        <Play size={12} color={Colors.info} />
                        <Text style={[styles.payoutActionText, { color: Colors.info }]}>Release</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Send size={40} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No payouts</Text>
          </View>
        }
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Payments</Text>
            <Text style={styles.headerSubtitle}>Stripe & PayPal Management</Text>
          </View>
          <View style={styles.gatewayBadges}>
            <View style={[styles.gatewayBadge, { backgroundColor: STRIPE_PURPLE + '20' }]}>
              <CreditCard size={12} color={STRIPE_PURPLE} />
              <Text style={[styles.gatewayText, { color: STRIPE_PURPLE }]}>Stripe</Text>
            </View>
            <View style={[styles.gatewayBadge, { backgroundColor: PAYPAL_BLUE + '20' }]}>
              <Text style={[styles.ppBadgeIcon, { color: PAYPAL_BLUE }]}>P</Text>
              <Text style={[styles.gatewayText, { color: PAYPAL_BLUE }]}>PayPal</Text>
            </View>
          </View>
        </View>

        {/* Accounting Button */}
        <TouchableOpacity
          style={styles.accountingButton}
          onPress={() => { router.push('/admin-accounting' as any); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          activeOpacity={0.7}
        >
          <BarChart3 size={16} color="#fff" />
          <Text style={styles.accountingButtonText}>Accounting & Settlements</Text>
          <ChevronRight size={16} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        {(['overview', 'transactions', 'payouts'] as ViewMode[]).map(mode => (
          <TouchableOpacity
            key={mode}
            style={[styles.tab, viewMode === mode && styles.tabActive]}
            onPress={() => { setViewMode(mode); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          >
            {mode === 'overview' && <Wallet size={14} color={viewMode === mode ? Colors.adminPrimary : Colors.textMuted} />}
            {mode === 'transactions' && <CreditCard size={14} color={viewMode === mode ? Colors.adminPrimary : Colors.textMuted} />}
            {mode === 'payouts' && <Send size={14} color={viewMode === mode ? Colors.adminPrimary : Colors.textMuted} />}
            <Text style={[styles.tabText, viewMode === mode && styles.tabTextActive]}>
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {viewMode === 'overview' && renderOverview()}
      {viewMode === 'transactions' && renderTransactions()}
      {viewMode === 'payouts' && renderPayouts()}

      <Modal visible={!!selectedTxn} animationType="slide" presentationStyle="pageSheet">
        {selectedTxn && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Transaction Details</Text>
              <TouchableOpacity onPress={() => setSelectedTxn(null)}><X size={24} color={Colors.text} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalContent}>
              <View style={styles.detailAmountCard}>
                <Text style={[styles.detailAmount, selectedTxn.type === 'refund' && { color: Colors.purple }]}>
                  {selectedTxn.type === 'refund' ? '-' : ''}{formatCurrency(selectedTxn.amount)}
                </Text>
                <View style={[styles.detailStatusBadge, { backgroundColor: (TXN_STATUS_MAP[selectedTxn.status] ?? TXN_STATUS_MAP.PENDING).bg }]}>
                  <Text style={[styles.detailStatusText, { color: (TXN_STATUS_MAP[selectedTxn.status] ?? TXN_STATUS_MAP.PENDING).color }]}>{selectedTxn.status}</Text>
                </View>
              </View>
              <View style={styles.detailSection}>
                <DetailRow label="Type" value={selectedTxn.type === 'charge' ? 'Payment' : 'Refund'} />
                <DetailRow label="Description" value={selectedTxn.description} />
                <DetailRow label="Customer" value={selectedTxn.customerName ?? '-'} />
                <DetailRow label="Email" value={selectedTxn.customerEmail ?? '-'} />
                <DetailRow label="Method" value={selectedTxn.method === 'stripe' ? `Stripe (•••• ${selectedTxn.cardLast4 ?? '****'})` : `PayPal (${selectedTxn.paypalEmail ?? '-'})`} />
                {selectedTxn.trackingNumber && <DetailRow label="Tracking" value={selectedTxn.trackingNumber} />}
                {selectedTxn.stripePaymentId && <DetailRow label="Stripe ID" value={selectedTxn.stripePaymentId} />}
                <DetailRow label="Created" value={`${formatDate(selectedTxn.createdAt)} ${formatTime(selectedTxn.createdAt)}`} />
                {selectedTxn.completedAt && <DetailRow label="Completed" value={`${formatDate(selectedTxn.completedAt)} ${formatTime(selectedTxn.completedAt)}`} />}
              </View>
              {selectedTxn.type === 'charge' && selectedTxn.status === 'COMPLETED' && (
                <TouchableOpacity style={styles.refundBtn} onPress={() => handleRefund(selectedTxn)} activeOpacity={0.8}>
                  <RotateCcw size={16} color={Colors.danger} />
                  <Text style={styles.refundBtnText}>Issue Refund</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        )}
      </Modal>

      <Modal visible={!!selectedPayout} animationType="slide" presentationStyle="pageSheet">
        {selectedPayout && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Payout Details</Text>
              <TouchableOpacity onPress={() => setSelectedPayout(null)}><X size={24} color={Colors.text} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalContent}>
              <View style={styles.detailAmountCard}>
                <Text style={styles.detailAmount}>{formatCurrency(selectedPayout.amount)}</Text>
                <View style={[styles.detailStatusBadge, { backgroundColor: (PAYOUT_STATUS_MAP[selectedPayout.status] ?? PAYOUT_STATUS_MAP.PENDING).bg }]}>
                  <Text style={[styles.detailStatusText, { color: (PAYOUT_STATUS_MAP[selectedPayout.status] ?? PAYOUT_STATUS_MAP.PENDING).color }]}>
                    {(PAYOUT_STATUS_MAP[selectedPayout.status] ?? PAYOUT_STATUS_MAP.PENDING).label}
                  </Text>
                </View>
              </View>
              <View style={styles.detailSection}>
                <DetailRow label="Recipient" value={selectedPayout.recipientName} />
                <DetailRow label="Type" value={selectedPayout.recipientType === 'driver' ? 'Driver' : 'Carrier'} />
                <DetailRow label="Reference" value={selectedPayout.reference} />
                <DetailRow label="Period" value={`${formatDate(selectedPayout.periodStart)} - ${formatDate(selectedPayout.periodEnd)}`} />
                <DetailRow label="Jobs" value={String(selectedPayout.jobsCount)} />
                <DetailRow label="Gross Amount" value={formatCurrency(selectedPayout.grossAmount)} />
                <DetailRow label="Deductions" value={`-${formatCurrency(selectedPayout.deductions)}`} valueColor={Colors.danger} />
                <DetailRow label="Net Payout" value={formatCurrency(selectedPayout.amount)} valueColor={Colors.success} />
                <DetailRow label="Method" value={selectedPayout.method === 'stripe' ? 'Stripe Connect' : 'PayPal'} />
                {selectedPayout.stripeAccountId && <DetailRow label="Stripe Account" value={selectedPayout.stripeAccountId} />}
                {selectedPayout.paypalEmail && <DetailRow label="PayPal" value={selectedPayout.paypalEmail} />}
                {selectedPayout.paidAt && <DetailRow label="Paid At" value={`${formatDate(selectedPayout.paidAt)} ${formatTime(selectedPayout.paidAt)}`} />}
              </View>
              {selectedPayout.status === 'PENDING' && (
                <View style={styles.payoutModalActions}>
                  <TouchableOpacity style={styles.payoutModalPayBtn} onPress={() => handleProcessPayout(selectedPayout)} activeOpacity={0.8}>
                    <Send size={16} color="#FFFFFF" />
                    <Text style={styles.payoutModalPayText}>Process Payout</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.payoutModalHoldBtn} onPress={() => handleHoldPayout(selectedPayout)} activeOpacity={0.8}>
                    <Pause size={16} color={Colors.warning} />
                    <Text style={styles.payoutModalHoldText}>Place on Hold</Text>
                  </TouchableOpacity>
                </View>
              )}
              {selectedPayout.status === 'ON_HOLD' && (
                <TouchableOpacity style={styles.payoutModalReleaseBtn} onPress={() => handleReleasePayout(selectedPayout)} activeOpacity={0.8}>
                  <Play size={16} color="#FFFFFF" />
                  <Text style={styles.payoutModalPayText}>Release Payout</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

function CustomerPaymentsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { transactions, cards, paypalAccounts } = usePayments();
  const [refreshing, setRefreshing] = useState(false);

  const customerTxns = useMemo(() =>
    transactions.filter(t => t.customerName === 'Sian Edwards' || t.customerEmail === 'customer@cyvhub.com'),
    [transactions]
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  return (
    <View style={styles.container}>
      <View style={[styles.customerHeader, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Payments</Text>
        <Text style={styles.headerSubtitle}>Payment history & methods</Text>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.customerPrimary} />}
      >
        <TouchableOpacity
          style={styles.manageMethodsCard}
          onPress={() => { router.push('/payment-methods' as any); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          activeOpacity={0.7}
        >
          <View style={styles.manageMethodsLeft}>
            <Shield size={20} color={Colors.customerPrimary} />
            <View>
              <Text style={styles.manageMethodsTitle}>Payment Methods</Text>
              <Text style={styles.manageMethodsSub}>
                {cards.length} card{cards.length !== 1 ? 's' : ''} · {paypalAccounts.length} PayPal
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        <Text style={styles.customerSectionTitle}>Transaction History</Text>
        {customerTxns.map(txn => {
          const statusConfig = TXN_STATUS_MAP[txn.status] ?? TXN_STATUS_MAP.PENDING;
          return (
            <View key={txn.id} style={styles.customerTxnCard}>
              <View style={styles.customerTxnTop}>
                <View style={[styles.customerTxnIcon, { backgroundColor: txn.type === 'refund' ? Colors.purpleLight : statusConfig.bg }]}>
                  {txn.type === 'refund' ? <RotateCcw size={14} color={Colors.purple} /> : <ArrowUpRight size={14} color={statusConfig.color} />}
                </View>
                <View style={styles.customerTxnInfo}>
                  <Text style={styles.customerTxnDesc}>{txn.description}</Text>
                  <Text style={styles.customerTxnDate}>{formatDate(txn.createdAt)}</Text>
                </View>
                <Text style={[styles.customerTxnAmount, txn.type === 'refund' && { color: Colors.purple }]}>
                  {txn.type === 'refund' ? '+' : '-'}{formatCurrency(txn.amount)}
                </Text>
              </View>
              <View style={styles.customerTxnBottom}>
                <View style={[styles.customerTxnStatus, { backgroundColor: statusConfig.bg }]}>
                  <Text style={[styles.customerTxnStatusText, { color: statusConfig.color }]}>{txn.status}</Text>
                </View>
                <View style={styles.customerTxnMethod}>
                  {txn.method === 'stripe' ? (
                    <Text style={styles.customerTxnMethodText}>•••• {txn.cardLast4 ?? '****'}</Text>
                  ) : (
                    <Text style={[styles.customerTxnMethodText, { color: PAYPAL_BLUE }]}>PayPal</Text>
                  )}
                </View>
              </View>
            </View>
          );
        })}

        {customerTxns.length === 0 && (
          <View style={styles.emptyState}>
            <CreditCard size={40} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No transactions yet</Text>
            <Text style={styles.emptySubtitle}>Your payment history will appear here</Text>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

export default function PaymentsScreen() {
  const { userRole } = useAuth();
  if (userRole === 'admin') return <AdminPaymentsScreen />;
  return <CustomerPaymentsScreen />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.navy, paddingHorizontal: 20, paddingBottom: 16 },
  customerHeader: { backgroundColor: Colors.navy, paddingHorizontal: 20, paddingBottom: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerTitle: { fontSize: 26, fontWeight: '800' as const, color: Colors.textInverse },
  headerSubtitle: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  gatewayBadges: { flexDirection: 'row', gap: 6, marginTop: 4 },
  gatewayBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  gatewayText: { fontSize: 11, fontWeight: '700' as const },
  ppBadgeIcon: { fontSize: 12, fontWeight: '800' as const, fontStyle: 'italic' },
  tabBar: { flexDirection: 'row', backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 6 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.adminPrimary },
  tabText: { fontSize: 13, fontWeight: '600' as const, color: Colors.textMuted },
  tabTextActive: { color: Colors.adminPrimary },
  body: { flex: 1 },
  bodyContent: { padding: 16 },
  balanceRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  balanceCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, borderLeftWidth: 3 },
  balanceIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  balanceValue: { fontSize: 18, fontWeight: '800' as const, color: Colors.text },
  balanceLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2, fontWeight: '500' as const },
  paypalSmall: { fontSize: 16, fontWeight: '800' as const, color: PAYPAL_BLUE, fontStyle: 'italic' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: { width: '47%', backgroundColor: Colors.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border },
  statIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontSize: 15, fontWeight: '800' as const, color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2, fontWeight: '500' as const },
  chartCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  chartTitle: { fontSize: 15, fontWeight: '700' as const, color: Colors.text, marginBottom: 16 },
  chart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120, gap: 6 },
  chartBarGroup: { flex: 1, alignItems: 'center' },
  chartBars: { flexDirection: 'row', flex: 1, gap: 2, width: '100%', alignItems: 'flex-end' },
  chartBar: { flex: 1, borderRadius: 4, minHeight: 4 },
  chartBarLabel: { fontSize: 10, fontWeight: '600' as const, color: Colors.textSecondary, marginTop: 6 },
  chartLegend: { flexDirection: 'row', justifyContent: 'center', gap: 16, paddingTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: Colors.textMuted, fontWeight: '500' as const },
  recentSection: { marginBottom: 16 },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  recentTitle: { fontSize: 15, fontWeight: '700' as const, color: Colors.text },
  viewAllText: { fontSize: 13, fontWeight: '600' as const, color: Colors.adminPrimary },
  txnItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 12, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: Colors.border, gap: 10 },
  txnIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  txnInfo: { flex: 1 },
  txnDesc: { fontSize: 13, fontWeight: '600' as const, color: Colors.text },
  txnMeta: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  txnRight: { alignItems: 'flex-end', gap: 4 },
  txnAmount: { fontSize: 14, fontWeight: '700' as const, color: Colors.success },
  txnMethodBadge: { width: 18, height: 18, borderRadius: 4, backgroundColor: Colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  txnMethodPP: { fontSize: 10, fontWeight: '800' as const, color: PAYPAL_BLUE, fontStyle: 'italic' },
  payoutItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 12, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: Colors.border, gap: 10 },
  payoutAvatar: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  payoutAvatarText: { fontSize: 16, fontWeight: '700' as const },
  payoutInfo: { flex: 1 },
  payoutName: { fontSize: 13, fontWeight: '600' as const, color: Colors.text },
  payoutMeta: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  payoutRight: { alignItems: 'flex-end', gap: 4 },
  payoutAmount: { fontSize: 14, fontWeight: '700' as const, color: Colors.text },
  payoutStatusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  payoutStatusText: { fontSize: 10, fontWeight: '600' as const },
  filterBar: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  filterChip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 10, backgroundColor: Colors.surfaceAlt },
  filterChipActive: { backgroundColor: Colors.adminPrimary },
  filterChipText: { fontSize: 12, fontWeight: '600' as const, color: Colors.textSecondary },
  filterChipTextActive: { color: '#FFFFFF' },
  listContent: { padding: 16, paddingBottom: 24 },
  txnCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  txnCardTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  txnCardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  txnTypeIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  txnCardDesc: { fontSize: 13, fontWeight: '600' as const, color: Colors.text },
  txnCardCustomer: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  txnCardAmount: { fontSize: 16, fontWeight: '800' as const, color: Colors.success },
  txnCardBottom: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  txnCardStatus: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, gap: 3 },
  txnCardStatusText: { fontSize: 10, fontWeight: '600' as const },
  txnCardMethodRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  txnCardMethodText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' as const },
  ppSmallIcon: { fontSize: 10, fontWeight: '800' as const, color: PAYPAL_BLUE, fontStyle: 'italic' },
  txnCardDate: { fontSize: 11, color: Colors.textMuted, marginLeft: 'auto' },
  payoutCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  payoutCardTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  payoutCardAvatar: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  payoutCardAvatarText: { fontSize: 18, fontWeight: '700' as const },
  payoutCardInfo: { flex: 1 },
  payoutCardName: { fontSize: 14, fontWeight: '700' as const, color: Colors.text },
  payoutCardType: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  payoutCardRight: { alignItems: 'flex-end', gap: 4 },
  payoutCardAmount: { fontSize: 16, fontWeight: '800' as const, color: Colors.text },
  payoutCardStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  payoutCardStatusText: { fontSize: 10, fontWeight: '700' as const },
  payoutCardBottom: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.borderLight, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  payoutCardDetail: {},
  payoutCardDetailLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '500' as const },
  payoutCardDetailValue: { fontSize: 13, fontWeight: '600' as const, color: Colors.text, marginTop: 1 },
  payoutCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10 },
  payoutCardMethodRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  payoutCardMethodText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' as const },
  payoutActions: { flexDirection: 'row', gap: 8 },
  payoutActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.surfaceAlt },
  payoutActionText: { fontSize: 12, fontWeight: '600' as const },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700' as const, color: Colors.text },
  emptySubtitle: { fontSize: 13, color: Colors.textSecondary },
  modalContainer: { flex: 1, backgroundColor: Colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: 20, fontWeight: '800' as const, color: Colors.text },
  modalBody: { flex: 1 },
  modalContent: { padding: 20 },
  detailAmountCard: { alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 16, padding: 24, marginBottom: 20, borderWidth: 1, borderColor: Colors.border, gap: 8 },
  detailAmount: { fontSize: 36, fontWeight: '800' as const, color: Colors.text, letterSpacing: -1 },
  detailStatusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  detailStatusText: { fontSize: 12, fontWeight: '700' as const },
  detailSection: { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: Colors.border },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  detailLabel: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' as const },
  detailValue: { fontSize: 13, fontWeight: '600' as const, color: Colors.text, maxWidth: '55%', textAlign: 'right' },
  refundBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.dangerLight, borderRadius: 14, height: 54, gap: 8, borderWidth: 1, borderColor: Colors.danger + '30' },
  refundBtnText: { fontSize: 16, fontWeight: '700' as const, color: Colors.danger },
  payoutModalActions: { gap: 10 },
  payoutModalPayBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.success, borderRadius: 14, height: 54, gap: 8 },
  payoutModalPayText: { fontSize: 16, fontWeight: '700' as const, color: '#FFFFFF' },
  payoutModalHoldBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.warningLight, borderRadius: 14, height: 54, gap: 8, borderWidth: 1, borderColor: Colors.warning + '30' },
  payoutModalHoldText: { fontSize: 16, fontWeight: '700' as const, color: Colors.warning },
  payoutModalReleaseBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.info, borderRadius: 14, height: 54, gap: 8 },
  manageMethodsCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surface, borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: Colors.customerPrimary + '30' },
  manageMethodsLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  manageMethodsTitle: { fontSize: 15, fontWeight: '700' as const, color: Colors.text },
  manageMethodsSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  customerSectionTitle: { fontSize: 16, fontWeight: '700' as const, color: Colors.text, marginBottom: 12 },
  customerTxnCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  customerTxnTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  customerTxnIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  customerTxnInfo: { flex: 1 },
  customerTxnDesc: { fontSize: 13, fontWeight: '600' as const, color: Colors.text },
  customerTxnDate: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  customerTxnAmount: { fontSize: 16, fontWeight: '800' as const, color: Colors.text },
  customerTxnBottom: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  customerTxnStatus: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  customerTxnStatusText: { fontSize: 10, fontWeight: '600' as const },
  customerTxnMethod: {},
  customerTxnMethodText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' as const },
  accountingButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.adminPrimary, borderRadius: 12, paddingVertical: 12, marginTop: 12, gap: 8 },
  accountingButtonText: { fontSize: 14, fontWeight: '700' as const, color: '#FFFFFF' },
});
