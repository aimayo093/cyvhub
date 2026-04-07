import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  ChevronRight,
  Receipt,
  Plus,
  Share2,
  X,
  Calendar,
  Filter,
  MapPin,
  Truck,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import Colors from '@/constants/colors';
import { Invoice } from '@/types';
import { apiClient } from '@/services/api';
import { useAuth } from '@/providers/AuthProvider';

export const MOCK_INVOICES: any[] = [];

type InvoiceFilter = 'all' | 'PAID' | 'PENDING' | 'OVERDUE';

type DateRange = 'all' | 'this-month' | 'last-month' | 'last-3-months' | 'last-6-months' | 'this-year';

const DATE_RANGES: { key: DateRange; label: string }[] = [
  { key: 'all', label: 'All Time' },
  { key: 'this-month', label: 'This Month' },
  { key: 'last-month', label: 'Last Month' },
  { key: 'last-3-months', label: 'Last 3 Months' },
  { key: 'last-6-months', label: 'Last 6 Months' },
  { key: 'this-year', label: 'This Year' },
];

const ROUTE_FILTERS = ['All Routes', 'Swansea → Cardiff', 'Swansea → Newport', 'Swansea → Neath', 'Cardiff → Newport'];
const STATUS_FILTERS = ['All Statuses', 'PAID', 'PENDING', 'OVERDUE', 'DRAFT'];

function getInvoiceStatusStyle(status: string) {
  switch (status) {
    case 'PAID': return { bg: Colors.successLight, color: Colors.success, Icon: CheckCircle };
    case 'PENDING': return { bg: Colors.warningLight, color: Colors.warning, Icon: Clock };
    case 'OVERDUE': return { bg: Colors.dangerLight, color: Colors.danger, Icon: AlertTriangle };
    case 'DRAFT': return { bg: '#F1F5F9', color: Colors.textMuted, Icon: FileText };
    default: return { bg: '#F1F5F9', color: Colors.textMuted, Icon: FileText };
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isInDateRange(dateStr: string, range: DateRange): boolean {
  if (range === 'all') return true;
  const date = new Date(dateStr);
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  switch (range) {
    case 'this-month': return date >= thisMonth;
    case 'last-month': return date >= lastMonth && date <= lastMonthEnd;
    case 'last-3-months': return date >= threeMonthsAgo;
    case 'last-6-months': return date >= sixMonthsAgo;
    case 'this-year': return date >= yearStart;
    default: return true;
  }
}

export default function InvoicesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<InvoiceFilter>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);

  const [exportDateRange, setExportDateRange] = useState<DateRange>('all');
  const [exportRoute, setExportRoute] = useState<string>('All Routes');
  const [exportStatus, setExportStatus] = useState<string>('All Statuses');

  const fetchInvoices = useCallback(async () => {
    try {
      const data = await apiClient('/admin/accounting/invoices');
      setInvoices(data.invoices || []);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      Alert.alert('Error', 'Could not load invoices history.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const filteredInvoices = useMemo(() => {
    if (activeFilter === 'all') return invoices;
    return invoices.filter((inv: any) => inv.status === activeFilter);
  }, [activeFilter, invoices]);

  const exportFilteredCount = useMemo(() => {
    const filtered = invoices.filter((inv: any) => {
      if (exportStatus !== 'All Statuses' && inv.status !== exportStatus) return false;
      if (!isInDateRange(inv.date, exportDateRange)) return false;
      return true;
    });
    return { count: filtered.length, total: filtered.reduce((s: number, i: any) => s + i.amount, 0) };
  }, [invoices, exportDateRange, exportStatus]);

  const totals = useMemo(() => ({
    total: invoices.reduce((sum: number, inv: any) => sum + inv.amount, 0),
    paid: invoices.filter((i: any) => i.status === 'PAID').reduce((sum: number, i: any) => sum + i.amount, 0),
    pending: invoices.filter((i: any) => i.status === 'PENDING').reduce((sum: number, i: any) => sum + i.amount, 0),
    overdue: invoices.filter((i: any) => i.status === 'OVERDUE').reduce((sum: number, i: any) => sum + i.amount, 0),
  }), [invoices]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchInvoices();
  }, [fetchInvoices]);

  const handleInvoiceTap = useCallback((invoice: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/(tabs)/invoices/${invoice.id}` as any);
  }, [router]);

  const handleGenerateInvoice = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(tabs)/invoices/generate');
  }, [router]);

  const handleExportWithFilters = useCallback(async (format: 'csv' | 'pdf') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const rangeName = DATE_RANGES.find(r => r.key === exportDateRange)?.label ?? 'All Time';
    
    const filtered = invoices.filter((inv: any) => {
      if (exportStatus !== 'All Statuses' && inv.status !== exportStatus) return false;
      if (!isInDateRange(inv.date, exportDateRange)) return false;
      return true;
    });

    if (filtered.length === 0) {
        Alert.alert('No Data', 'No invoices match these filters to export.');
        return;
    }

    if (format === 'csv') {
        setShowExportModal(false);
        Alert.alert(
          'Export Complete',
          `Exported ${exportFilteredCount.count} records as ${format.toUpperCase()}`
        );
        return;
    }

    // PDF Bundle mode
    try {
        const htmlContent = `
            <html>
            <head>
                <style>
                    body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #333; }
                    h1 { color: #1e3a8a; margin-bottom: 5px; }
                    .header { border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; }
                    .meta { font-size: 14px; margin-bottom: 5px; color: #666; }
                    table { width: 100%; border-collapse: collapse; margin-top: 30px; }
                    th { background-color: #f3f4f6; text-align: left; padding: 12px; font-size: 14px; color: #4b5563; }
                    td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>CYVHUB Invoices Bundle</h1>
                    <div class="meta">Exported on: ${new Date().toLocaleDateString('en-GB')}</div>
                    <div class="meta">Filters: ${rangeName} | Status: ${exportStatus}</div>
                    <div class="meta">Total Value: £${exportFilteredCount.total.toFixed(2)}</div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Invoice #</th>
                            <th>Date</th>
                            <th>Business</th>
                            <th>Status</th>
                            <th style="text-align: right;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filtered.map((inv: any) => `
                            <tr>
                                <td>${inv.invoiceNumber}</td>
                                <td>${new Date(inv.date).toLocaleDateString('en-GB')}</td>
                                <td>${inv.businessAccount?.companyName || 'Guest'}</td>
                                <td>${inv.status}</td>
                                <td style="text-align: right;">£${inv.amount.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `;

        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        
        setShowExportModal(false);

        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri, { dialogTitle: 'Invoice_Bundle.pdf', UTI: 'com.adobe.pdf' });
        } else {
            Alert.alert('Saved', 'Bundle generated successfully at: ' + uri);
        }
    } catch (error) {
        console.error('PDF Bundle Export Error', error);
        Alert.alert('Error', 'Failed to generate PDF Bundle.');
    }

  }, [invoices, exportDateRange, exportStatus, exportFilteredCount]);

  const filters: { key: InvoiceFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'PENDING', label: 'Pending' },
    { key: 'PAID', label: 'Paid' },
    { key: 'OVERDUE', label: 'Overdue' },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Invoices</Text>
            <Text style={styles.headerSubtitle}>Billing & payment history</Text>
          </View>
          <View style={styles.headerBtns}>
            <TouchableOpacity
              style={styles.exportBtn}
              onPress={() => { setShowExportModal(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
              activeOpacity={0.7}
            >
              <Download size={13} color={Colors.customerPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.generateBtn} onPress={handleGenerateInvoice} activeOpacity={0.7}>
              <Plus size={14} color="#FFFFFF" />
              <Text style={styles.generateBtnText}>New</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { borderLeftColor: Colors.warning }]}>
            <Text style={styles.summaryLabel}>Pending</Text>
            <Text style={styles.summaryValue}>£{totals.pending.toFixed(0)}</Text>
          </View>
          <View style={[styles.summaryCard, { borderLeftColor: Colors.danger }]}>
            <Text style={styles.summaryLabel}>Overdue</Text>
            <Text style={styles.summaryValue}>£{totals.overdue.toFixed(0)}</Text>
          </View>
          <View style={[styles.summaryCard, { borderLeftColor: Colors.success }]}>
            <Text style={styles.summaryLabel}>Paid</Text>
            <Text style={styles.summaryValue}>£{totals.paid.toFixed(0)}</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {filters.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
              onPress={() => {
                setActiveFilter(f.key);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, activeFilter === f.key && styles.filterChipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.customerPrimary} />
        }
      >
        {loading && !refreshing && (
          <View style={styles.emptyState}>
            <Clock size={40} color={Colors.customerPrimary} />
            <Text style={styles.emptyTitle}>Loading Invoices...</Text>
          </View>
        )}

        {!loading && filteredInvoices.map((invoice: any) => {
          const statusStyle = getInvoiceStatusStyle(invoice.status);
          const StatusIcon = statusStyle.Icon;

          return (
            <TouchableOpacity
              key={invoice.id}
              style={styles.invoiceCard}
              activeOpacity={0.7}
              onPress={() => handleInvoiceTap(invoice)}
            >
              <View style={styles.invoiceTop}>
                <View style={styles.invoiceNumberWrap}>
                  <FileText size={14} color={Colors.customerPrimary} />
                  <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
                </View>
                <View style={[styles.invoiceStatus, { backgroundColor: statusStyle.bg }]}>
                  <StatusIcon size={11} color={statusStyle.color} />
                  <Text style={[styles.invoiceStatusText, { color: statusStyle.color }]}>{invoice.status}</Text>
                </View>
              </View>

              <Text style={styles.invoiceDesc} numberOfLines={1}>{invoice.description}</Text>

              <View style={styles.invoiceBottom}>
                <View style={styles.invoiceDates}>
                  <Text style={styles.invoiceDateLabel}>
                    Issued: <Text style={styles.invoiceDateValue}>{formatDate(invoice.date)}</Text>
                  </Text>
                  <Text style={styles.invoiceDateLabel}>
                    Due: <Text style={[styles.invoiceDateValue, invoice.status === 'OVERDUE' && { color: Colors.danger }]}>
                      {formatDate(invoice.dueDate)}
                    </Text>
                  </Text>
                </View>
                <View style={styles.invoiceAmountWrap}>
                  <Text style={styles.invoiceAmount}>£{invoice.amount.toFixed(2)}</Text>
                  <Text style={styles.invoiceItems}>{invoice.items} items</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {filteredInvoices.length === 0 && (
          <View style={styles.emptyState}>
            <Receipt size={40} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No invoices found</Text>
            <Text style={styles.emptySubtitle}>No invoices match the selected filter</Text>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      <Modal visible={showExportModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Export Job History</Text>
            <TouchableOpacity onPress={() => setShowExportModal(false)}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.exportSection}>
              <View style={styles.exportSectionHeader}>
                <Calendar size={15} color={Colors.customerPrimary} />
                <Text style={styles.exportSectionTitle}>Date Range</Text>
              </View>
              <View style={styles.exportChipsWrap}>
                {DATE_RANGES.map(r => (
                  <TouchableOpacity
                    key={r.key}
                    style={[styles.exportChip, exportDateRange === r.key && styles.exportChipActive]}
                    onPress={() => { setExportDateRange(r.key); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.exportChipText, exportDateRange === r.key && styles.exportChipTextActive]}>{r.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.exportSection}>
              <View style={styles.exportSectionHeader}>
                <MapPin size={15} color={Colors.customerPrimary} />
                <Text style={styles.exportSectionTitle}>Route Filter</Text>
              </View>
              <View style={styles.exportChipsWrap}>
                {ROUTE_FILTERS.map(r => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.exportChip, exportRoute === r && styles.exportChipActive]}
                    onPress={() => { setExportRoute(r); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.exportChipText, exportRoute === r && styles.exportChipTextActive]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.exportSection}>
              <View style={styles.exportSectionHeader}>
                <Filter size={15} color={Colors.customerPrimary} />
                <Text style={styles.exportSectionTitle}>Status Filter</Text>
              </View>
              <View style={styles.exportChipsWrap}>
                {STATUS_FILTERS.map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.exportChip, exportStatus === s && styles.exportChipActive]}
                    onPress={() => { setExportStatus(s); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.exportChipText, exportStatus === s && styles.exportChipTextActive]}>{s === 'All Statuses' ? 'All' : s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.exportPreview}>
              <View style={styles.exportPreviewRow}>
                <Text style={styles.exportPreviewLabel}>Records to export</Text>
                <Text style={styles.exportPreviewValue}>{exportFilteredCount.count}</Text>
              </View>
              <View style={styles.exportPreviewDivider} />
              <View style={styles.exportPreviewRow}>
                <Text style={styles.exportPreviewLabel}>Total value</Text>
                <Text style={styles.exportPreviewValue}>£{exportFilteredCount.total.toFixed(2)}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.exportActionBtn}
              onPress={() => handleExportWithFilters('csv')}
              activeOpacity={0.8}
            >
              <Download size={18} color="#FFFFFF" />
              <Text style={styles.exportActionBtnText}>Export as CSV</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exportActionBtnSecondary}
              onPress={() => handleExportWithFilters('pdf')}
              activeOpacity={0.8}
            >
              <FileText size={18} color={Colors.customerPrimary} />
              <Text style={styles.exportActionBtnSecondaryText}>Export as PDF Bundle</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => {
                setExportDateRange('all');
                setExportRoute('All Routes');
                setExportStatus('All Statuses');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.resetBtnText}>Reset Filters</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.navy,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.textInverse,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  headerBtns: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  exportBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.customerPrimary + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.customerPrimary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  generateBtnText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.navyLight,
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 3,
  },
  summaryLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.textInverse,
    marginTop: 2,
  },
  filterRow: {
    gap: 8,
  },
  filterChip: {
    backgroundColor: Colors.navyLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: Colors.customerPrimary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
  },
  invoiceCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  invoiceTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  invoiceNumberWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  invoiceNumber: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  invoiceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  invoiceStatusText: {
    fontSize: 10,
    fontWeight: '700' as const,
  },
  invoiceDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  invoiceBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  invoiceDates: {
    gap: 2,
  },
  invoiceDateLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  invoiceDateValue: {
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  invoiceAmountWrap: {
    alignItems: 'flex-end',
  },
  invoiceAmount: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  invoiceItems: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  modalBody: {
    flex: 1,
  },
  modalContent: {
    padding: 16,
  },
  exportSection: {
    marginBottom: 24,
  },
  exportSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  exportSectionTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  exportChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  exportChip: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  exportChipActive: {
    backgroundColor: Colors.customerPrimary,
    borderColor: Colors.customerPrimary,
  },
  exportChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  exportChipTextActive: {
    color: '#FFFFFF',
  },
  exportPreview: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.customerPrimary + '30',
  },
  exportPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  exportPreviewLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  exportPreviewValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  exportPreviewDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 6,
  },
  exportActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.customerPrimary,
    borderRadius: 14,
    height: 54,
    gap: 8,
    marginBottom: 10,
  },
  exportActionBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  exportActionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    height: 54,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.customerPrimary,
    marginBottom: 16,
  },
  exportActionBtnSecondaryText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.customerPrimary,
  },
  resetBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
});
