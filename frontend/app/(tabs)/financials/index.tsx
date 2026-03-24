import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Receipt,
  Download,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  CreditCard,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
const MOCK_BUSINESS_PROFILE = {
  companyName: 'TechCorp Ltd',
  registrationNumber: 'CRN-92837465',
  vatNumber: 'GB123456789',
  industry: 'Technology Manufacturing',
  billingTerms: 'Net 30',
  creditLimit: 15000,
  creditUsed: 4250.50,
  primaryContact: {
    name: 'Sarah Jenkins',
    email: 'sarah.j@techcorp.example.com',
    phone: '+44 (0) 20 7123 4567',
    role: 'Procurement Director'
  }
};

const MOCK_CUSTOMER_INVOICES: any[] = [
  {
    id: '1',
    invoiceNumber: 'INV-2023-001',
    date: new Date(Date.now() - 86400000 * 5).toISOString(),
    dueDate: new Date(Date.now() + 86400000 * 25).toISOString(),
    subtotal: 1041.67,
    vatAmount: 208.33,
    amount: 1250.00,
    status: 'PENDING',
    description: 'Monthly Logistics Retainer - October',
    items: 4,
  },
  {
    id: '2',
    invoiceNumber: 'INV-2023-002',
    date: new Date(Date.now() - 86400000 * 15).toISOString(),
    dueDate: new Date(Date.now() + 86400000 * 15).toISOString(),
    subtotal: 375.42,
    vatAmount: 75.08,
    amount: 450.50,
    status: 'PAID',
    description: 'Emergency Same-Day Delivery Surcharge',
    items: 1,
  },
  {
    id: '3',
    invoiceNumber: 'INV-2023-003',
    date: new Date(Date.now() - 86400000 * 45).toISOString(),
    dueDate: new Date(Date.now() - 86400000 * 15).toISOString(),
    subtotal: 2666.67,
    vatAmount: 533.33,
    amount: 3200.00,
    status: 'OVERDUE',
    description: 'Quarterly Dedicated Fleet Allocation',
    items: 12,
  },
];

const MOCK_CUSTOMER_STATEMENTS: any[] = [
  {
    id: '1',
    period: 'September 2023',
    openingBalance: 4500.00,
    totalInvoiced: 12500.00,
    totalPaid: 15000.00,
    closingBalance: 2000.00,
    invoiceCount: 18,
  },
  {
    id: '2',
    period: 'August 2023',
    openingBalance: 1200.00,
    totalInvoiced: 14800.00,
    totalPaid: 11500.00,
    closingBalance: 4500.00,
    invoiceCount: 22,
  },
];

type ViewMode = 'invoices' | 'statements';
type InvoiceFilter = 'all' | 'PENDING' | 'PAID' | 'OVERDUE';

const INVOICE_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  PENDING: { label: 'Pending', color: Colors.warning, bg: '#FEF3C7', icon: Clock },
  PAID: { label: 'Paid', color: Colors.success, bg: '#D1FAE5', icon: CheckCircle },
  OVERDUE: { label: 'Overdue', color: Colors.danger, bg: '#FEE2E2', icon: AlertTriangle },
  DRAFT: { label: 'Draft', color: Colors.textMuted, bg: '#F3F4F6', icon: FileText },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatCurrency(amount: number): string {
  return `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function FinancialsScreen() {
  const insets = useSafeAreaInsets();
  const [viewMode, setViewMode] = useState<ViewMode>('invoices');
  const [invoiceFilter, setInvoiceFilter] = useState<InvoiceFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const profile = MOCK_BUSINESS_PROFILE;

  const filteredInvoices = useMemo(() => {
    if (invoiceFilter === 'all') return MOCK_CUSTOMER_INVOICES;
    return MOCK_CUSTOMER_INVOICES.filter((inv: any) => inv.status === invoiceFilter);
  }, [invoiceFilter]);

  const totalOutstanding = useMemo(() =>
    MOCK_CUSTOMER_INVOICES
      .filter((inv: any) => inv.status === 'PENDING' || inv.status === 'OVERDUE')
      .reduce((sum: number, inv: any) => sum + inv.amount, 0),
    []
  );

  const totalOverdue = useMemo(() =>
    MOCK_CUSTOMER_INVOICES
      .filter((inv: any) => inv.status === 'OVERDUE')
      .reduce((sum: number, inv: any) => sum + inv.amount, 0),
    []
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const handleDownloadPDF = useCallback((invoice: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Download Invoice', `Invoice ${invoice.invoiceNumber} PDF would be downloaded.`);
  }, []);

  const handleExport = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Export Data', 'Your financial data will be exported as CSV.');
  }, []);

  const renderInvoice = useCallback(({ item }: { item: any }) => {
    const config = INVOICE_STATUS_CONFIG[item.status];
    const StatusIcon = config.icon;

    return (
      <View style={styles.invoiceCard}>
        <View style={styles.invoiceHeader}>
          <View>
            <Text style={styles.invoiceNumber}>{item.invoiceNumber}</Text>
            <Text style={styles.invoiceDesc} numberOfLines={1}>{item.description}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
            <StatusIcon size={12} color={config.color} />
            <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
          </View>
        </View>

        <View style={styles.invoiceBody}>
          <View style={styles.invoiceAmounts}>
            <View style={styles.invoiceAmountRow}>
              <Text style={styles.invoiceAmountLabel}>Subtotal</Text>
              <Text style={styles.invoiceAmountValue}>{formatCurrency(item.subtotal)}</Text>
            </View>
            <View style={styles.invoiceAmountRow}>
              <Text style={styles.invoiceAmountLabel}>VAT (20%)</Text>
              <Text style={styles.invoiceAmountValue}>{formatCurrency(item.vatAmount)}</Text>
            </View>
            <View style={[styles.invoiceAmountRow, styles.invoiceTotalRow]}>
              <Text style={styles.invoiceTotalLabel}>Total</Text>
              <Text style={styles.invoiceTotalValue}>{formatCurrency(item.amount)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.invoiceFooter}>
          <View style={styles.invoiceDates}>
            <Text style={styles.invoiceDateText}>Issued: {formatDate(item.date)}</Text>
            <Text style={[styles.invoiceDateText, item.status === 'OVERDUE' && { color: Colors.danger }]}>
              Due: {formatDate(item.dueDate)}
            </Text>
          </View>
          <View style={styles.invoiceActions}>
            <Text style={styles.invoiceItems}>{item.items} items</Text>
            <TouchableOpacity
              style={styles.downloadBtn}
              onPress={() => handleDownloadPDF(item)}
              activeOpacity={0.7}
            >
              <Download size={14} color={Colors.customerPrimary} />
              <Text style={styles.downloadBtnText}>PDF</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }, [handleDownloadPDF]);

  const renderStatement = useCallback(({ item }: { item: any }) => {
    const netChange = item.totalInvoiced - item.totalPaid;
    const isPositive = netChange > 0;

    return (
      <View style={styles.statementCard}>
        <View style={styles.statementHeader}>
          <Text style={styles.statementPeriod}>{item.period}</Text>
          <View style={styles.statementInvoiceCount}>
            <Text style={styles.statementInvoiceCountText}>{item.invoiceCount} invoices</Text>
          </View>
        </View>

        <View style={styles.statementBody}>
          <View style={styles.statementRow}>
            <Text style={styles.statementLabel}>Opening Balance</Text>
            <Text style={styles.statementValue}>{formatCurrency(item.openingBalance)}</Text>
          </View>
          <View style={styles.statementRow}>
            <View style={styles.statementRowLeft}>
              <TrendingUp size={12} color={Colors.danger} />
              <Text style={styles.statementLabel}>Invoiced</Text>
            </View>
            <Text style={[styles.statementValue, { color: Colors.danger }]}>+{formatCurrency(item.totalInvoiced)}</Text>
          </View>
          <View style={styles.statementRow}>
            <View style={styles.statementRowLeft}>
              <TrendingDown size={12} color={Colors.success} />
              <Text style={styles.statementLabel}>Paid</Text>
            </View>
            <Text style={[styles.statementValue, { color: Colors.success }]}>-{formatCurrency(item.totalPaid)}</Text>
          </View>
          <View style={[styles.statementRow, styles.statementTotalRow]}>
            <Text style={styles.statementTotalLabel}>Closing Balance</Text>
            <Text style={[styles.statementTotalValue, item.closingBalance > 0 && { color: Colors.danger }]}>
              {formatCurrency(item.closingBalance)}
            </Text>
          </View>
        </View>
      </View>
    );
  }, []);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Financials</Text>
            <Text style={styles.headerSubtitle}>{profile.billingTerms} · {profile.companyName}</Text>
          </View>
          <TouchableOpacity style={styles.exportBtn} onPress={handleExport} activeOpacity={0.7}>
            <Download size={16} color={Colors.textInverse} />
          </TouchableOpacity>
        </View>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { borderLeftColor: Colors.warning }]}>
            <CreditCard size={16} color={Colors.warning} />
            <Text style={styles.summaryValue}>{formatCurrency(totalOutstanding)}</Text>
            <Text style={styles.summaryLabel}>Outstanding</Text>
          </View>
          <View style={[styles.summaryCard, { borderLeftColor: Colors.danger }]}>
            <AlertTriangle size={16} color={Colors.danger} />
            <Text style={styles.summaryValue}>{formatCurrency(totalOverdue)}</Text>
            <Text style={styles.summaryLabel}>Overdue</Text>
          </View>
          <View style={[styles.summaryCard, { borderLeftColor: Colors.customerPrimary }]}>
            <Receipt size={16} color={Colors.customerPrimary} />
            <Text style={styles.summaryValue}>{formatCurrency(profile.creditLimit - profile.creditUsed)}</Text>
            <Text style={styles.summaryLabel}>Credit Left</Text>
          </View>
        </View>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'invoices' && styles.tabActive]}
          onPress={() => setViewMode('invoices')}
        >
          <Receipt size={14} color={viewMode === 'invoices' ? Colors.customerPrimary : Colors.textMuted} />
          <Text style={[styles.tabText, viewMode === 'invoices' && styles.tabTextActive]}>Invoices</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'statements' && styles.tabActive]}
          onPress={() => setViewMode('statements')}
        >
          <FileText size={14} color={viewMode === 'statements' ? Colors.customerPrimary : Colors.textMuted} />
          <Text style={[styles.tabText, viewMode === 'statements' && styles.tabTextActive]}>Statements</Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'invoices' && (
        <View style={styles.filterBar}>
          {(['all', 'PENDING', 'PAID', 'OVERDUE'] as InvoiceFilter[]).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, invoiceFilter === f && styles.filterChipActive]}
              onPress={() => { setInvoiceFilter(f); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            >
              <Text style={[styles.filterChipText, invoiceFilter === f && styles.filterChipTextActive]}>
                {f === 'all' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {viewMode === 'invoices' ? (
        <FlatList
          data={filteredInvoices}
          renderItem={renderInvoice}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.customerPrimary} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Receipt size={44} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No invoices</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={MOCK_CUSTOMER_STATEMENTS}
          renderItem={renderStatement}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.customerPrimary} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.navy, paddingHorizontal: 20, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 26, fontWeight: '800' as const, color: Colors.textInverse },
  headerSubtitle: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  exportBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.navyLight, alignItems: 'center', justifyContent: 'center' },
  summaryRow: { flexDirection: 'row', gap: 8 },
  summaryCard: { flex: 1, backgroundColor: Colors.navyLight, borderRadius: 12, padding: 12, borderLeftWidth: 3, gap: 4 },
  summaryValue: { fontSize: 14, fontWeight: '800' as const, color: Colors.textInverse },
  summaryLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '500' as const },
  tabBar: { flexDirection: 'row', backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 6 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.customerPrimary },
  tabText: { fontSize: 14, fontWeight: '600' as const, color: Colors.textMuted },
  tabTextActive: { color: Colors.customerPrimary },
  filterBar: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8, backgroundColor: Colors.surface },
  filterChip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 10, backgroundColor: Colors.surfaceAlt },
  filterChipActive: { backgroundColor: Colors.customerPrimary },
  filterChipText: { fontSize: 12, fontWeight: '600' as const, color: Colors.textSecondary },
  filterChipTextActive: { color: '#FFFFFF' },
  list: { padding: 16, paddingBottom: 24 },
  invoiceCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  invoiceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  invoiceNumber: { fontSize: 15, fontWeight: '700' as const, color: Colors.text },
  invoiceDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, maxWidth: 200 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  statusText: { fontSize: 11, fontWeight: '600' as const },
  invoiceBody: { marginBottom: 12 },
  invoiceAmounts: { gap: 6 },
  invoiceAmountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  invoiceAmountLabel: { fontSize: 13, color: Colors.textMuted },
  invoiceAmountValue: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' as const },
  invoiceTotalRow: { paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.borderLight, marginTop: 4 },
  invoiceTotalLabel: { fontSize: 14, fontWeight: '700' as const, color: Colors.text },
  invoiceTotalValue: { fontSize: 18, fontWeight: '800' as const, color: Colors.customerPrimary },
  invoiceFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  invoiceDates: { gap: 2 },
  invoiceDateText: { fontSize: 11, color: Colors.textMuted },
  invoiceActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  invoiceItems: { fontSize: 11, color: Colors.textMuted },
  downloadBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#CCFBF1', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4 },
  downloadBtnText: { fontSize: 12, fontWeight: '600' as const, color: Colors.customerPrimary },
  statementCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  statementHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  statementPeriod: { fontSize: 16, fontWeight: '700' as const, color: Colors.text },
  statementInvoiceCount: { backgroundColor: Colors.surfaceAlt, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statementInvoiceCountText: { fontSize: 11, fontWeight: '600' as const, color: Colors.textSecondary },
  statementBody: { gap: 8 },
  statementRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statementRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statementLabel: { fontSize: 13, color: Colors.textSecondary },
  statementValue: { fontSize: 13, fontWeight: '500' as const, color: Colors.text },
  statementTotalRow: { paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.borderLight, marginTop: 4 },
  statementTotalLabel: { fontSize: 14, fontWeight: '700' as const, color: Colors.text },
  statementTotalValue: { fontSize: 17, fontWeight: '800' as const, color: Colors.text },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700' as const, color: Colors.text },
});
