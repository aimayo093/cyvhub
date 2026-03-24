import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Receipt, CheckCircle, Calculator, Save, Building2, Calendar, FileText } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { apiClient } from '@/services/api';

const MOCK_CONTRACTS: any[] = [];
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export default function GenerateInvoiceScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [businesses, setBusinesses] = useState<any[]>([]);
    const [selectedBusiness, setSelectedBusiness] = useState<string>('');
    const [selectedMonth, setSelectedMonth] = useState<string>(MONTHS[new Date().getMonth() - 1] || 'January');
    const [generating, setGenerating] = useState(false);

    React.useEffect(() => {
        const fetchBusinesses = async () => {
            try {
                const data = await apiClient('/businesses');
                setBusinesses(data.businesses);
                if (data.businesses.length > 0) setSelectedBusiness(data.businesses[0].id);
            } catch (error) {
                console.error('Fetch businesses error:', error);
            }
        };
        fetchBusinesses();
    }, []);

    const business = useMemo(() => businesses.find((b: any) => b.id === selectedBusiness), [selectedBusiness, businesses]);

    // Mock checking for unbilled jobs
    const invoiceData = useMemo(() => {
        // Generate some random jobs based on the business selection
        const jobCount = Math.floor(Math.random() * 15) + 5; // 5 to 20 jobs
        const jobs = Array.from({ length: jobCount }).map((_, i) => {
            const isUrgent = Math.random() > 0.8;
            const baseCost = Math.floor(Math.random() * 80) + 30;
            const cost = isUrgent ? baseCost * 1.5 : baseCost;
            return {
                id: `JOB-${Math.floor(Math.random() * 90000) + 10000}`,
                date: `${selectedMonth} ${Math.floor(Math.random() * 28) + 1}, 2024`,
                route: ['Swansea → Cardiff', 'Cardiff → Newport', 'London → Birmingham'][Math.floor(Math.random() * 3)],
                type: isUrgent ? 'Urgent Delivery' : 'Standard Delivery',
                amount: cost
            };
        });

        const subtotal = jobs.reduce((sum, job) => sum + job.amount, 0);
        const vat = subtotal * 0.20; // 20% VAT UK
        const total = subtotal + vat;

        return { jobs, subtotal, vat, total };
    }, [selectedBusiness, selectedMonth]);

    const handleGenerate = async () => {
        if (!selectedBusiness) return;
        setGenerating(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            const result = await apiClient('/invoices/generate', {
                method: 'POST',
                body: JSON.stringify({
                    businessAccountId: selectedBusiness,
                    month: selectedMonth
                })
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(
                'Invoice Generated',
                `Invoice ${result.invoiceNumber} has been created.\n\nTotal: £${result.amount.toFixed(2)}\nIncludes 20% VAT.`,
                [{ text: 'View Invoices', onPress: () => router.back() }]
            );
        } catch (error: any) {
            console.error('Generation Error:', error);
            Alert.alert('Generation Failed', error.message || 'Could not generate invoice at this time.');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={Colors.textInverse} />
                </TouchableOpacity>
                <View style={styles.headerTitleWrap}>
                    <Receipt size={20} color={Colors.textInverse} />
                    <Text style={styles.headerTitle}>Generate Invoice</Text>
                </View>
                <TouchableOpacity
                    style={[styles.generateBtn, generating && { opacity: 0.6 }]}
                    onPress={handleGenerate}
                    disabled={generating || !selectedBusiness}
                >
                    <CheckCircle size={16} color={Colors.textInverse} />
                    <Text style={styles.generateBtnText}>{generating ? 'Generating...' : 'Generate'}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>

                {/* Selection Configuration */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>1. Select Configuration</Text>

                    <Text style={styles.label}><Building2 size={14} color={Colors.textSecondary} /> Business Account</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                        {businesses.map((c: any) => (
                            <TouchableOpacity
                                key={c.id}
                                style={[styles.chip, selectedBusiness === c.id && styles.chipActive]}
                                onPress={() => { setSelectedBusiness(c.id); Haptics.selectionAsync(); }}
                            >
                                <Text style={[styles.chipText, selectedBusiness === c.id && styles.chipTextActive]}>{c.tradingName}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <Text style={[styles.label, { marginTop: 16 }]}><Calendar size={14} color={Colors.textSecondary} /> Billing Month</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                        {MONTHS.map(m => (
                            <TouchableOpacity
                                key={m}
                                style={[styles.chip, selectedMonth === m && styles.chipActive]}
                                onPress={() => { setSelectedMonth(m); Haptics.selectionAsync(); }}
                            >
                                <Text style={[styles.chipText, selectedMonth === m && styles.chipTextActive]}>{m}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Invoice Preview */}
                <View style={styles.previewCard}>
                    <View style={styles.previewHeader}>
                        <Calculator size={18} color={Colors.adminPrimary} />
                        <Text style={styles.previewTitle}>Invoice Preview</Text>
                    </View>

                    <View style={styles.previewBody}>
                        <Text style={styles.previewBusiness}>{business?.tradingName || 'Select Business'}</Text>
                        <Text style={styles.previewPeriod}>Billing Period: {selectedMonth} 2024</Text>

                        <View style={styles.jobsList}>
                            <Text style={styles.jobsListTitle}>Line Items (Unbilled Jobs)</Text>
                            {invoiceData.jobs.slice(0, 3).map((job, idx) => (
                                <View key={idx} style={styles.jobRow}>
                                    <View>
                                        <Text style={styles.jobId}>{job.id} · <Text style={{ fontWeight: '400' }}>{job.date}</Text></Text>
                                        <Text style={styles.jobRoute}>{job.route}</Text>
                                    </View>
                                    <Text style={styles.jobAmount}>£{job.amount.toFixed(2)}</Text>
                                </View>
                            ))}
                            {invoiceData.jobs.length > 3 && (
                                <Text style={styles.moreJobsText}>+ {invoiceData.jobs.length - 3} more jobs...</Text>
                            )}
                        </View>

                        <View style={styles.totalsSection}>
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Subtotal</Text>
                                <Text style={styles.totalValue}>£{invoiceData.subtotal.toFixed(2)}</Text>
                            </View>
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>VAT (20%)</Text>
                                <Text style={styles.totalValue}>£{invoiceData.vat.toFixed(2)}</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.grandTotalRow}>
                                <Text style={styles.grandTotalLabel}>Invoice Total</Text>
                                <Text style={styles.grandTotalValue}>£{invoiceData.total.toFixed(2)}</Text>
                            </View>
                        </View>
                    </View>
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
    headerTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginLeft: 12 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.textInverse },
    generateBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.success, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, gap: 6 },
    generateBtnText: { color: Colors.textInverse, fontWeight: '700', fontSize: 13 },
    body: { flex: 1 },
    bodyContent: { padding: 16, gap: 16 },
    sectionCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
    horizontalScroll: { gap: 8, paddingBottom: 8 },
    chip: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
    chipActive: { backgroundColor: Colors.adminPrimary + '20', borderColor: Colors.adminPrimary },
    chipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
    chipTextActive: { color: Colors.adminPrimary },

    previewCard: { backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.adminPrimary + '30', overflow: 'hidden' },
    previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, backgroundColor: Colors.adminPrimary + '10', borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
    previewTitle: { fontSize: 15, fontWeight: '700', color: Colors.adminPrimary },
    previewBody: { padding: 16 },
    previewBusiness: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 4 },
    previewPeriod: { fontSize: 13, color: Colors.textSecondary, marginBottom: 16 },

    jobsList: { backgroundColor: Colors.background, borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: Colors.borderLight },
    jobsListTitle: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, marginBottom: 10, textTransform: 'uppercase' },
    jobRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    jobId: { fontSize: 13, fontWeight: '700', color: Colors.text },
    jobRoute: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
    jobAmount: { fontSize: 14, fontWeight: '600', color: Colors.text },
    moreJobsText: { fontSize: 12, fontStyle: 'italic', color: Colors.textMuted, textAlign: 'center', marginTop: 4 },

    totalsSection: { paddingHorizontal: 4 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    totalLabel: { fontSize: 14, color: Colors.textSecondary },
    totalValue: { fontSize: 14, fontWeight: '600', color: Colors.text },
    divider: { height: 1, backgroundColor: Colors.border, marginVertical: 12 },
    grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    grandTotalLabel: { fontSize: 16, fontWeight: '800', color: Colors.text },
    grandTotalValue: { fontSize: 20, fontWeight: '800', color: Colors.adminPrimary },
});
