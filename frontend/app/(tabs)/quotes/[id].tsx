import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, FileText, CheckCircle, Clock, XCircle, ArrowRight, Truck, MapPin, Calculator, Calendar, Send } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { QuoteStatus } from '@/types';

const MOCK_QUOTES: any[] = [
    {
        id: '1',
        quoteNumber: 'QT-2023-001',
        businessName: 'TechCorp Ltd',
        pickupCity: 'London',
        dropoffCity: 'Manchester',
        vehicleType: 'Small Van',
        jobType: 'B2B',
        slaRequirement: 'Same Day',
        distanceKm: 320,
        estimatedPrice: 145.00,
        status: 'PENDING' as QuoteStatus,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        expiresAt: new Date(Date.now() + 86400000 * 6).toISOString(),
        notes: 'Please ensure fragile handling.',
    },
    {
        id: '2',
        quoteNumber: 'QT-2023-002',
        businessName: 'BuildCo Supplies',
        pickupCity: 'Birmingham',
        dropoffCity: 'Bristol',
        vehicleType: 'Large Van',
        jobType: 'Construction',
        slaRequirement: 'Next Day',
        distanceKm: 140,
        estimatedPrice: 95.50,
        finalPrice: 85.00,
        status: 'CONVERTED' as QuoteStatus,
        convertedJobId: 'JOB-9921',
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        expiresAt: new Date(Date.now() + 86400000 * 4).toISOString(),
    },
    {
        id: '3',
        quoteNumber: 'QT-2023-003',
        businessName: 'MedEquip Pro',
        pickupCity: 'Leeds',
        dropoffCity: 'Newcastle',
        vehicleType: 'Medium Van',
        jobType: 'Medical',
        slaRequirement: 'Standard',
        distanceKm: 160,
        estimatedPrice: 110.00,
        status: 'REJECTED' as QuoteStatus,
        createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
        expiresAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
];

function getQuoteStatusColor(status: QuoteStatus) {
    switch (status) {
        case 'PENDING': return Colors.warning;
        case 'APPROVED': return Colors.success;
        case 'REJECTED': return Colors.danger;
        case 'CONVERTED': return Colors.primary;
        default: return Colors.textMuted;
    }
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function QuoteDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const quote = useMemo(() => MOCK_QUOTES.find((q: any) => q.id === id) || MOCK_QUOTES[0], [id]);
    const statusColor = getQuoteStatusColor(quote.status);

    const estimatedBase = parseFloat((quote.estimatedPrice * 0.3).toFixed(2));
    const estimatedMileage = parseFloat((quote.estimatedPrice * 0.5).toFixed(2));
    const estimatedSurcharge = parseFloat((quote.estimatedPrice * 0.2).toFixed(2));

    const handleAction = (title: string, message: string, style: 'default' | 'destructive' = 'default') => {
        Haptics.impactAsync(style === 'destructive' ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert(title, message);
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={Colors.textInverse} />
                </TouchableOpacity>
                <View style={styles.headerTitleWrap}>
                    <Text style={styles.headerTitle}>Quote Details</Text>
                    <Text style={styles.headerSubtitle}>{quote.quoteNumber}</Text>
                </View>
                <View style={{ width: 32 }} />
            </View>

            <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>

                {/* Quote Top Info */}
                <View style={styles.card}>
                    <View style={styles.quoteHeader}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.businessName}>{quote.businessName}</Text>
                            <View style={styles.dateRow}>
                                <Calendar size={14} color={Colors.textMuted} />
                                <Text style={styles.dateText}>Expires: {formatDate(quote.expiresAt)}</Text>
                            </View>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
                            <Text style={[styles.statusText, { color: statusColor }]}>{quote.status}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.routeContainer}>
                        <View style={styles.routeBlock}>
                            <View style={[styles.dot, { backgroundColor: Colors.success }]} />
                            <View>
                                <Text style={styles.routeLabel}>Pickup</Text>
                                <Text style={styles.routeCity}>{quote.pickupCity}</Text>
                            </View>
                        </View>
                        <View style={styles.routeLine} />
                        <View style={styles.routeBlock}>
                            <View style={[styles.dot, { backgroundColor: Colors.danger }]} />
                            <View>
                                <Text style={styles.routeLabel}>Dropoff</Text>
                                <Text style={styles.routeCity}>{quote.dropoffCity}</Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.requirementsRow}>
                        <View style={styles.reqBadge}>
                            <Truck size={12} color={Colors.textMuted} />
                            <Text style={styles.reqText}>{quote.vehicleType}</Text>
                        </View>
                        <View style={styles.reqBadge}>
                            <Clock size={12} color={Colors.textMuted} />
                            <Text style={styles.reqText}>{quote.slaRequirement}</Text>
                        </View>
                        <View style={styles.reqBadge}>
                            <MapPin size={12} color={Colors.textMuted} />
                            <Text style={styles.reqText}>{quote.distanceKm} km</Text>
                        </View>
                    </View>
                </View>

                {/* Pricing Engine Breakdown */}
                <Text style={styles.sectionTitle}>Price Breakdown</Text>
                <View style={styles.pricingCard}>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Base Rate</Text>
                        <Text style={styles.priceValue}>£{estimatedBase.toFixed(2)}</Text>
                    </View>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Distance Charge</Text>
                        <Text style={styles.priceValue}>£{estimatedMileage.toFixed(2)}</Text>
                    </View>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Vehicle & SLA Surcharge</Text>
                        <Text style={styles.priceValue}>£{estimatedSurcharge.toFixed(2)}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Estimated Total</Text>
                        <Text style={styles.totalValue}>£{quote.estimatedPrice.toFixed(2)}</Text>
                    </View>

                    {quote.finalPrice && quote.finalPrice !== quote.estimatedPrice && (
                        <View style={styles.finalTotalRow}>
                            <Text style={styles.finalTotalLabel}>Adjusted Final Price</Text>
                            <Text style={styles.finalTotalValue}>£{quote.finalPrice.toFixed(2)}</Text>
                        </View>
                    )}
                </View>

                {quote.notes && (
                    <View style={styles.notesCard}>
                        <Text style={styles.notesTitle}>Client Notes</Text>
                        <Text style={styles.notesText}>{quote.notes}</Text>
                    </View>
                )}

                {/* Actions based on status */}
                {quote.status === 'PENDING' && (
                    <View style={styles.actionGrid}>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.adminPrimary }]} onPress={() => handleAction('Adjust Price', 'Open pricing adjustment modal to apply discounts or markups.')}>
                            <Calculator size={18} color={Colors.adminPrimary} />
                            <Text style={[styles.actionText, { color: Colors.adminPrimary }]}>Adjust Price</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.success }]} onPress={() => handleAction('Approve Quote', 'Quote approved. The client will be notified.')}>
                            <CheckCircle size={18} color="#FFFFFF" />
                            <Text style={styles.actionText}>Approve & Send</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.danger }]} onPress={() => handleAction('Reject Quote', 'Are you sure you want to reject this quote request?', 'destructive')}>
                            <XCircle size={18} color="#FFFFFF" />
                            <Text style={styles.actionText}>Reject</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {quote.status === 'APPROVED' && (
                    <View style={styles.actionGrid}>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.primary }]} onPress={() => handleAction('Convert to Job', 'Converting this approved quote directly into an active dispatch job...')}>
                            <ArrowRight size={18} color="#FFFFFF" />
                            <Text style={styles.actionText}>Convert to Job</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {quote.status === 'CONVERTED' && (
                    <View style={styles.actionGrid}>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border }]} onPress={() => handleAction('View Job', `Navigating to job details for ${quote.convertedJobId}`)}>
                            <Truck size={18} color={Colors.text} />
                            <Text style={[styles.actionText, { color: Colors.text }]}>View Converted Job</Text>
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
    headerSubtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },

    body: { flex: 1 },
    bodyContent: { padding: 16, gap: 16 },

    card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border },
    quoteHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    businessName: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 6 },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dateText: { fontSize: 12, color: Colors.textSecondary },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 11, fontWeight: '700' },

    divider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 16 },

    routeContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    routeBlock: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
    dot: { width: 10, height: 10, borderRadius: 5 },
    routeLabel: { fontSize: 11, color: Colors.textMuted, marginBottom: 2 },
    routeCity: { fontSize: 14, fontWeight: '600', color: Colors.text },
    routeLine: { height: 1, flex: 0.5, backgroundColor: Colors.borderLight, marginHorizontal: 10 },

    requirementsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, backgroundColor: Colors.background, padding: 12, borderRadius: 10 },
    reqBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.surface, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: Colors.border },
    reqText: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },

    sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginTop: 8 },

    pricingCard: { backgroundColor: Colors.surface, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: Colors.border },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    priceLabel: { fontSize: 14, color: Colors.textSecondary },
    priceValue: { fontSize: 14, fontWeight: '600', color: Colors.text },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.borderLight },
    totalLabel: { fontSize: 16, fontWeight: '700', color: Colors.text },
    totalValue: { fontSize: 18, fontWeight: '800', color: Colors.text },
    finalTotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.borderLight },
    finalTotalLabel: { fontSize: 15, fontWeight: '700', color: Colors.success },
    finalTotalValue: { fontSize: 20, fontWeight: '800', color: Colors.success },

    notesCard: { backgroundColor: '#FFFBEB', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#FEF08A' },
    notesTitle: { fontSize: 13, fontWeight: '700', color: '#B45309', marginBottom: 6 },
    notesText: { fontSize: 14, color: '#92400E', lineHeight: 20 },

    actionGrid: { gap: 12, marginTop: 8 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, gap: 8 },
    actionText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
