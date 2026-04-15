import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, FileText, CheckCircle, Clock, XCircle, ArrowRight, Truck, MapPin, Calculator, Calendar, Send } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { QuoteStatus } from '@/types';

import { apiClient } from '@/services/api';

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

    const [quote, setQuote] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);

    const fetchQuote = React.useCallback(async () => {
        try {
            const res = await apiClient(`/quotes/${id}`);
            setQuote(res.quote);
        } catch (err) {
            console.error('Failed to load quote details', err);
            Alert.alert('Error', 'Failed to load quote details.');
            router.back();
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    React.useEffect(() => {
        fetchQuote();
    }, [fetchQuote]);

    const statusColor = quote ? getQuoteStatusColor(quote.status) : Colors.textMuted;

    const estimatedBase = quote ? parseFloat(((quote.estimatedCost || 0) * 0.3).toFixed(2)) : 0;
    const estimatedMileage = quote ? parseFloat(((quote.estimatedCost || 0) * 0.5).toFixed(2)) : 0;
    const estimatedSurcharge = quote ? parseFloat(((quote.estimatedCost || 0) * 0.2).toFixed(2)) : 0;

    const handleAction = async (title: string, message: string, newStatus?: string, style: 'default' | 'destructive' = 'default') => {
        Haptics.impactAsync(style === 'destructive' ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium);
        
        if (newStatus && quote) {
            Alert.alert(title, message, [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm', 
                    style: style === 'destructive' ? 'destructive' : 'default',
                    onPress: async () => {
                        try {
                            await apiClient(`/quotes/${id}/status`, {
                                method: 'PATCH',
                                body: JSON.stringify({ status: newStatus })
                            });
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            fetchQuote();
                        } catch (err) {
                            Alert.alert('Error', 'Failed to update quote status.');
                        }
                    }
                }
            ]);
            return;
        }

        Alert.alert(title, message);
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <ChevronLeft size={24} color={Colors.textInverse} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleWrap}>
                        <Text style={styles.headerTitle}>Quote Details</Text>
                    </View>
                    <View style={{ width: 32 }} />
                </View>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color={Colors.adminPrimary} />
                    <Text style={{ color: Colors.textMuted, marginTop: 12, fontSize: 14 }}>Loading quote details...</Text>
                </View>
            </View>
        );
    }

    if (!quote) {
        return (
            <View style={styles.container}>
                <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <ChevronLeft size={24} color={Colors.textInverse} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleWrap}>
                        <Text style={styles.headerTitle}>Quote Details</Text>
                    </View>
                    <View style={{ width: 32 }} />
                </View>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
                    <FileText size={48} color={Colors.textMuted} style={{ opacity: 0.4 }} />
                    <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.text, marginTop: 16, textAlign: 'center' }}>Quote not found</Text>
                    <Text style={{ fontSize: 14, color: Colors.textMuted, marginTop: 8, textAlign: 'center' }}>This quote may have been removed or is no longer available.</Text>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={{ marginTop: 24, backgroundColor: Colors.adminPrimary, paddingHorizontal: 28, paddingVertical: 13, borderRadius: 12 }}
                    >
                        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

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
                        <Text style={styles.totalValue}>£{(quote.estimatedCost || 0).toFixed(2)}</Text>
                    </View>

                    {quote.basePrice && quote.estimatedCost && quote.basePrice !== quote.estimatedCost && (
                        <View style={styles.finalTotalRow}>
                            <Text style={styles.finalTotalLabel}>Adjusted Final Price</Text>
                            <Text style={styles.finalTotalValue}>£{(quote.basePrice || 0).toFixed(2)}</Text>
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

                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.success }]} onPress={() => handleAction('Approve Quote', 'Quote approved. The client will be notified.', 'APPROVED')}>
                            <CheckCircle size={18} color="#FFFFFF" />
                            <Text style={styles.actionText}>Approve & Send</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.danger }]} onPress={() => handleAction('Reject Quote', 'Are you sure you want to reject this quote request?', 'REJECTED', 'destructive')}>
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
