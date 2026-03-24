import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Download, FileText, CheckCircle, Clock, AlertTriangle, Send } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
const MOCK_INVOICES: any[] = [
    {
        id: '1',
        invoiceNumber: 'INV-2023-001',
        date: new Date(Date.now() - 86400000 * 5).toISOString(),
        dueDate: new Date(Date.now() + 86400000 * 25).toISOString(),
        amount: 1250.00,
        status: 'PENDING',
        customerName: 'TechCorp Ltd',
        description: 'Monthly Logistics Retainer - October',
        items: 4,
        routeId: 'TR-1029',
    },
];

const MOCK_CONTRACTS: any[] = [
    { id: '1', businessName: 'TechCorp Ltd', status: 'ACTIVE' },
];
export default function InvoiceDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const invoice = useMemo(() => MOCK_INVOICES.find((inv: any) => inv.id === id) || MOCK_INVOICES[0], [id]);
    const business = useMemo(() => MOCK_CONTRACTS[0], []);

    const statusInfo = useMemo(() => {
        switch (invoice.status) {
            case 'PAID': return { color: Colors.success, bg: Colors.successLight, icon: CheckCircle, label: 'Paid' };
            case 'PENDING': return { color: Colors.warning, bg: Colors.warningLight, icon: Clock, label: 'Pending' };
            case 'OVERDUE': return { color: Colors.danger, bg: Colors.dangerLight, icon: AlertTriangle, label: 'Overdue' };
            case 'DRAFT': return { color: Colors.textMuted, bg: '#F1F5F9', icon: FileText, label: 'Draft' };
            default: return { color: Colors.textMuted, bg: '#F1F5F9', icon: FileText, label: invoice.status };
        }
    }, [invoice.status]);
    const StatusIcon = statusInfo.icon;

    const mockJobs = useMemo(() => {
        const jobCount = invoice.items;
        const baseAmount = invoice.amount / 1.2; // roughly remove VAT
        const amountPerJob = baseAmount / jobCount;

        return Array.from({ length: jobCount }).map((_, i) => ({
            id: `JOB-${Math.floor(Math.random() * 90000) + 10000}`,
            date: new Date(new Date(invoice.date).getTime() + (i * 86400000)).toLocaleDateString('en-GB'),
            route: ['Swansea → Cardiff', 'Cardiff → Newport', 'London → Birmingham'][Math.floor(Math.random() * 3)],
            amount: amountPerJob * (0.8 + Math.random() * 0.4) // randomize slightly
        }));
    }, [invoice]);

    const subtotal = mockJobs.reduce((sum: number, j: any) => sum + j.amount, 0);
    const vat = subtotal * 0.20;
    const total = subtotal + vat;

    const handleDownload = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Downloaded', `Invoice ${invoice.invoiceNumber}.pdf has been downloaded.`);
    };

    const handleMarkPaid = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', `Invoice ${invoice.invoiceNumber} marked as PAID.`, [{ text: 'OK', onPress: () => router.back() }]);
    };

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
                    <Text style={styles.clientName}>{business.businessName}</Text>
                    <Text style={styles.clientInfo}>{business.status} Account</Text>
                    <View style={styles.divider} />
                    <Text style={styles.dueDate}>Payment Due: <Text style={invoice.status === 'OVERDUE' ? { color: Colors.danger } : {}}>{new Date(invoice.dueDate).toLocaleDateString('en-GB')}</Text></Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Job Line Items</Text>
                    {mockJobs.map((job, idx) => (
                        <View key={idx} style={styles.jobRow}>
                            <View style={styles.jobLeft}>
                                <Text style={styles.jobId}>{job.id} <Text style={styles.jobDate}>· {job.date}</Text></Text>
                                <Text style={styles.jobRoute}>{job.route}</Text>
                            </View>
                            <Text style={styles.jobAmount}>£{job.amount.toFixed(2)}</Text>
                        </View>
                    ))}

                    <View style={styles.divider} />

                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Subtotal</Text>
                        <Text style={styles.summaryValue}>£{subtotal.toFixed(2)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>VAT (20%)</Text>
                        <Text style={styles.summaryValue}>£{vat.toFixed(2)}</Text>
                    </View>
                    <View style={[styles.summaryRow, { marginTop: 8 }]}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>£{total.toFixed(2)}</Text>
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
