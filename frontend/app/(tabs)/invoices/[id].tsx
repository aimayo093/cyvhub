import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Download, FileText, CheckCircle, Clock, AlertTriangle, Send } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import Colors from '@/constants/colors';
import { apiClient } from '@/services/api';

export default function InvoiceDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [invoice, setInvoice] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchInvoice = useCallback(async () => {
        try {
            const data = await apiClient(`/admin/accounting/invoices/${id}`);
            setInvoice(data.invoice);
        } catch (error) {
            console.error('Fetch invoice failed', error);
            Alert.alert('Error', 'Failed to load invoice details.');
            router.back();
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    React.useEffect(() => {
        fetchInvoice();
    }, [fetchInvoice]);

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'PAID': return { color: Colors.success, bg: Colors.successLight, icon: CheckCircle, label: 'Paid' };
            case 'PENDING': return { color: Colors.warning, bg: Colors.warningLight, icon: Clock, label: 'Pending' };
            case 'OVERDUE': return { color: Colors.danger, bg: Colors.dangerLight, icon: AlertTriangle, label: 'Overdue' };
            case 'DRAFT': return { color: Colors.textMuted, bg: '#F1F5F9', icon: FileText, label: 'Draft' };
            default: return { color: Colors.textMuted, bg: '#F1F5F9', icon: FileText, label: status };
        }
    };

    const handleDownload = async () => {
        if (!invoice) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            const businessName = invoice.businessAccount?.companyName || 'Guest Customer';
            const htmlContent = `
                <html>
                <head>
                    <style>
                        body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #333; }
                        h1 { color: #1e3a8a; }
                        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; }
                        .meta { font-size: 14px; margin-bottom: 5px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 30px; }
                        th { background-color: #f3f4f6; text-align: left; padding: 12px; font-size: 14px; color: #4b5563; }
                        td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
                        .totals { text-align: right; margin-top: 20px; font-size: 16px; }
                        .totals strong { font-size: 18px; color: #111827; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div>
                            <h1>INVOICE</h1>
                            <div class="meta"><strong>CYVHUB Logistics</strong></div>
                            <div class="meta">VAT Reg: ${invoice.vatRegNumber}</div>
                        </div>
                        <div style="text-align: right;">
                            <h2>${invoice.invoiceNumber}</h2>
                            <div class="meta">Date: ${new Date(invoice.date).toLocaleDateString('en-GB')}</div>
                            <div class="meta">Due: ${new Date(invoice.dueDate).toLocaleDateString('en-GB')}</div>
                            <div class="meta">Status: <strong>${invoice.status}</strong></div>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 40px;">
                        <h3 style="margin-bottom: 8px;">Bill To:</h3>
                        <div class="meta"><strong>${businessName}</strong></div>
                        <div class="meta">${invoice.businessAccount?.billingAddress || 'N/A'}</div>
                        <div class="meta">${invoice.businessAccount?.billingCity || ''} ${invoice.businessAccount?.billingPostcode || ''}</div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Job ID</th>
                                <th>Route</th>
                                <th>Date</th>
                                <th style="text-align: right;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${invoice.jobs?.map((j: any) => `
                                <tr>
                                    <td>${j.jobNumber}</td>
                                    <td>${j.pickupPostcode} &rarr; ${j.dropoffPostcode}</td>
                                    <td>${new Date(j.createdAt).toLocaleDateString('en-GB')}</td>
                                    <td style="text-align: right;">£${j.calculatedPrice.toFixed(2)}</td>
                                </tr>
                            `).join('') || ''}
                        </tbody>
                    </table>

                    <div class="totals">
                        <div style="margin-bottom: 8px;">Subtotal: £${invoice.amount.toFixed(2)}</div>
                        <div style="margin-bottom: 8px;">VAT (${invoice.vatRate}%): £${invoice.taxAmount.toFixed(2)}</div>
                        <div style="margin-top: 15px;"><strong>Total: £${invoice.totalWithTax.toFixed(2)}</strong></div>
                    </div>
                </body>
                </html>
            `;
            
            const { uri } = await Print.printToFileAsync({ html: htmlContent });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, { dialogTitle: `Invoice_${invoice.invoiceNumber}.pdf`, UTI: 'com.adobe.pdf' });
            } else {
                Alert.alert('Saved', 'Invoice generated successfully at: ' + uri);
            }
        } catch (error) {
            console.error('PDF Export Error', error);
            Alert.alert('Error', 'Failed to generate PDF.');
        }
    };

    const handleMarkPaid = () => {
        Alert.alert('Confirm Payment', 'Mark this invoice as fully paid?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Confirm', onPress: async () => {
                try {
                    await apiClient(`/admin/accounting/invoices/${id}/paid`, { method: 'PATCH' });
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    fetchInvoice();
                } catch (error) {
                    Alert.alert('Error', 'Failed to mark as paid');
                }
            }}
        ]);
    };

    if (loading || !invoice) return (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="large" color={Colors.adminPrimary} />
        </View>
    );

    const statusInfo = getStatusInfo(invoice.status);
    const StatusIcon = statusInfo.icon;


    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={Colors.textInverse} />
                </TouchableOpacity>
                <View style={styles.headerTitleWrap}>
                    <Text style={styles.headerTitle}>Invoice {invoice.invoiceNumber}</Text>
                </View>
                <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload}>
                    <Download size={18} color={Colors.textInverse} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>

                <View style={styles.statusRow}>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                        <StatusIcon size={14} color={statusInfo.color} />
                        <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                    </View>
                    <Text style={styles.dateText}>Issued: {new Date(invoice.date).toLocaleDateString('en-GB')}</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.clientName}>{invoice.businessAccount?.companyName || 'Guest'}</Text>
                    <Text style={styles.clientInfo}>VAT Reg: {invoice.vatRegNumber}</Text>
                    <View style={styles.divider} />
                    <Text style={styles.dueDate}>Payment Due: <Text style={invoice.status === 'OVERDUE' ? { color: Colors.danger } : {}}>{new Date(invoice.dueDate).toLocaleDateString('en-GB')}</Text></Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Job Line Items</Text>
                    {invoice.jobs?.map((job: any, idx: number) => (
                        <View key={idx} style={styles.jobRow}>
                            <View style={styles.jobLeft}>
                                <Text style={styles.jobId}>{job.jobNumber} <Text style={styles.jobDate}>· {new Date(job.createdAt).toLocaleDateString('en-GB')}</Text></Text>
                                <Text style={styles.jobRoute}>{job.pickupPostcode} → {job.dropoffPostcode}</Text>
                            </View>
                            <Text style={styles.jobAmount}>£{job.calculatedPrice.toFixed(2)}</Text>
                        </View>
                    ))}

                    {(!invoice.jobs || invoice.jobs.length === 0) && (
                        <Text style={{ color: Colors.textMuted }}>No distinct jobs tracked for this invoice.</Text>
                    )}

                    <View style={styles.divider} />

                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Subtotal</Text>
                        <Text style={styles.summaryValue}>£{invoice.amount.toFixed(2)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>VAT ({invoice.vatRate}%)</Text>
                        <Text style={styles.summaryValue}>£{invoice.taxAmount.toFixed(2)}</Text>
                    </View>
                    <View style={[styles.summaryRow, { marginTop: 8 }]}>
                        <Text style={styles.totalLabel}>Total (inc. VAT)</Text>
                        <Text style={styles.totalValue}>£{invoice.totalWithTax.toFixed(2)}</Text>
                    </View>
                </View>

                <View style={styles.actionGrid}>
                    {invoice.status !== 'PAID' && (
                        <TouchableOpacity style={styles.primaryBtn} onPress={handleMarkPaid}>
                            <CheckCircle size={18} color="#FFFFFF" />
                            <Text style={styles.primaryBtnText}>Mark as Paid</Text>
                        </TouchableOpacity>
                    )}
                    {invoice.status === 'DRAFT' && (
                        <TouchableOpacity style={styles.secondaryBtn} onPress={() => Alert.alert('Sent', 'Invoice sent to client')}>
                            <Send size={18} color={Colors.adminPrimary} />
                            <Text style={styles.secondaryBtnText}>Send to Client</Text>
                        </TouchableOpacity>
                    )}
                </View>

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
    downloadBtn: { padding: 4, marginRight: -4 },

    body: { flex: 1 },
    bodyContent: { padding: 16, gap: 16 },

    statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
    statusText: { fontSize: 13, fontWeight: '700' },
    dateText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },

    card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border },
    clientName: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 4 },
    clientInfo: { fontSize: 13, color: Colors.textSecondary, marginBottom: 2 },
    divider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 12 },
    dueDate: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },

    sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 12 },
    jobRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    jobLeft: { flex: 1 },
    jobId: { fontSize: 13, fontWeight: '700', color: Colors.text },
    jobDate: { fontWeight: '400', color: Colors.textMuted },
    jobRoute: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
    jobAmount: { fontSize: 14, fontWeight: '600', color: Colors.text },

    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    summaryLabel: { fontSize: 14, color: Colors.textSecondary },
    summaryValue: { fontSize: 14, fontWeight: '600', color: Colors.text },
    totalLabel: { fontSize: 18, fontWeight: '800', color: Colors.text },
    totalValue: { fontSize: 22, fontWeight: '800', color: Colors.adminPrimary },

    actionGrid: { gap: 12 },
    primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.success, borderRadius: 12, paddingVertical: 16, gap: 8 },
    primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
    secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.adminPrimary, borderRadius: 12, paddingVertical: 16, gap: 8 },
    secondaryBtnText: { fontSize: 16, fontWeight: '700', color: Colors.adminPrimary },
});
