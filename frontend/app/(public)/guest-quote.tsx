import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuoteStore } from '@/hooks/useQuoteStore';
import { GuestQuoteConfig, initialGuestQuote } from '@/constants/cmsDefaults';
import { useCMS } from '@/context/CMSContext';



// Top Stepper Component
const Stepper = ({ currentStep }: { currentStep: number }) => {
    return (
        <View style={styles.stepperContainer}>
            <View style={[styles.stepBox, currentStep === 1 && styles.stepBoxActive]}>
                <Text style={[styles.stepText, currentStep === 1 && styles.stepTextActive]}>QUOTE REQUEST</Text>
            </View>
            <View style={styles.stepConnector} />
            <View style={[styles.stepBox, currentStep === 2 && styles.stepBoxActive]}>
                <Text style={[styles.stepText, currentStep === 2 && styles.stepTextActive]}>BOOKING DETAILS</Text>
            </View>
            <View style={styles.stepConnector} />
            <View style={[styles.stepBox, currentStep === 3 && styles.stepBoxActive]}>
                <Text style={[styles.stepText, currentStep === 3 && styles.stepTextActive]}>REVIEW & BOOK</Text>
            </View>
        </View>
    );
};

// Vehicle Card Component
const VehicleCard = ({ title, dimensions, weight, priceEx, priceInc, originalPerParcelExVat, discountApplied, quantity, onBook }: any) => {
    const isBulk = quantity > 1 && discountApplied > 0;
    const baseTotal = isBulk ? (originalPerParcelExVat * quantity).toFixed(2) : priceEx.toFixed(2);

    return (
        <View style={styles.vehicleCard}>
            <View style={styles.vehicleIconWrapper}>
                <Truck size={48} color="#3498db" />
            </View>
            <Text style={styles.vehicleTitle}>{title}</Text>

            <View style={styles.specsContainer}>
                <Text style={styles.specDimension}>{dimensions}</Text>
                <Text style={styles.specLabel}>(LxWxH)</Text>
                <Text style={styles.specWeight}>Max {weight}</Text>
            </View>

            <View style={styles.priceContainer}>
                {isBulk && (
                    <View style={styles.bulkBadgeContainer}>
                        <Tag size={14} color="#10b981" style={{ marginRight: 6 }} />
                        <Text style={styles.bulkBadgeText}>Bulk Saving: £{discountApplied.toFixed(2)}</Text>
                    </View>
                )}
                <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                    {isBulk && <Text style={[styles.strikethroughPrice, { marginRight: 8 }]}>£{baseTotal}</Text>}
                    <Text style={styles.priceEx}>£{priceEx.toFixed(2)}</Text>
                </View>
                <Text style={styles.priceTaxLabel}>excl. VAT ({quantity} {quantity === 1 ? 'parcel' : 'parcels'})</Text>
            </View>

            <View style={styles.priceIncContainer}>
                <Text style={styles.priceInc}>£{priceInc.toFixed(2)}</Text>
                <Text style={styles.priceIncLabel}>incl. VAT</Text>
            </View>

            <TouchableOpacity style={styles.bookBtn} onPress={onBook} activeOpacity={0.8}>
                <Text style={styles.bookBtnText}>Book</Text>
            </TouchableOpacity>
        </View>
    );
};

import { Truck, Clock, ShieldCheck, MapPin, Package, Tag } from 'lucide-react-native';
import { Alert, ActivityIndicator } from 'react-native';
import { apiClient } from '@/services/api';

export default function GuestQuotePage() {
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const { fromAddress, toAddress, fromPostcode, toPostcode, parcels: storedParcels, totalDistanceMiles, setStep3 } = useQuoteStore();
    const router = useRouter();

    // CMS config from global context (live, synced with backend)
    const { homepageData } = useCMS();
    const config: GuestQuoteConfig = homepageData['cms_guestQuoteConfig'] || initialGuestQuote;

    const [dynamicQuotes, setDynamicQuotes] = useState<any[]>([]);
    const [rejectedVehicles, setRejectedVehicles] = useState<any[]>([]);
    const [distance, setDistance] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const [retrievedParams, setRetrievedParams] = useState<any>(null);

    useEffect(() => {
        const fetchQuotes = async () => {
            if (!fromPostcode || !toPostcode || storedParcels.length === 0) {
                setIsLoading(false);
                return;
            }

            try {
                // 1. CMS config is now sourced from the global CMSContext (set at top of component)

                const response = await apiClient('/quotes/calculate', {
                    method: 'POST',
                    body: JSON.stringify({
                        pickupPostcode: fromPostcode,
                        dropoffPostcode: toPostcode,
                        items: storedParcels.map((p: any) => ({
                            lengthCm: Number(p.lengthCm),
                            widthCm: Number(p.widthCm),
                            heightCm: Number(p.heightCm),
                            weightKg: Number(p.weightKg),
                            quantity: Number(p.quantity) || 1
                        }))
                    })
                });

                if (response) {
                    setDynamicQuotes(response.quotes || []);
                    setRejectedVehicles(response.rejectedVehicles || []);
                    setDistance(response.distanceMiles || 0);
                }
            } catch (error: any) {
                console.error('[CYVhub Error] Step 3 Pricing calculation failed');
                console.error('[CYVhub Error Stack]', error?.stack);
                console.error('[CYVhub Error Context]', { 
                    action: 'fetchQuotes',
                    fromPostcode,
                    toPostcode,
                    parcels: storedParcels
                });
                
                // Consolidate dual error displays:
                // Remove Alert.alert blocking modal.
                // The UI will show "No suitable vehicles found" with the manual submission path.
                setDynamicQuotes([]);
                setRejectedVehicles([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchQuotes();
    }, [fromPostcode, toPostcode, storedParcels]);

    const hasAnyParams = !!(fromPostcode && toPostcode && storedParcels.length > 0);

    const handleBook = (tier: string, vehicleName: string, price: number) => {
        setStep3({
            estimatedPrice: price,
            selectedServiceType: tier
        });
        router.push('/(public)/guest-checkout' as any);
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={{ marginTop: 16, color: Colors.primary, fontWeight: '600' }}>Calculating best rates...</Text>
            </View>
        );
    }

    if (!hasAnyParams) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 40 }]}>
                <Truck size={64} color={Colors.primary} style={{ marginBottom: 24 }} />
                <Text style={[styles.pageTitle, { textAlign: 'center' }]}>Requirements Missing</Text>
                <Text style={[styles.tierDesc, { textAlign: 'center', marginBottom: 32 }]}>
                    To provide an accurate quote, we need your collection postcode, delivery postcode, and item dimensions.
                </Text>
                <TouchableOpacity 
                    style={[styles.bookBtn, { backgroundColor: Colors.primary, borderColor: Colors.primary }]} 
                    onPress={() => router.push('/')}
                >
                    <Text style={[styles.bookBtnText, { color: '#FFF' }]}>Start New Quote</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const currentDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
    const parsedValidityText = config.validityText.replace('{time}', currentTime).replace('{date}', currentDate);

    return (
        <ScrollView style={styles.container}>
            <Stepper currentStep={2} />

            <View style={styles.content}>
                <Text style={styles.pageTitle}>{config.pageTitle}</Text>
                <Text style={styles.quoteValidity}>{parsedValidityText}</Text>

                <View style={styles.summaryBox}>
                    <View style={styles.distanceHighlight}>
                        <Truck size={24} color="#FFF" style={{ marginRight: 12 }} />
                        <Text style={styles.distanceText}>Total Distance: <Text style={{ fontWeight: '800' }}>{totalDistanceMiles?.toFixed(1) || '—'}</Text> miles</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <MapPin size={16} color={Colors.primary} style={{ marginRight: 8 }} />
                        <Text style={styles.summaryLabel}>Route:</Text>
                        <Text style={styles.summaryValue} numberOfLines={1}>
                            {fromAddress} → {toAddress}
                        </Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Package size={16} color={Colors.primary} style={{ marginRight: 8 }} />
                        <Text style={styles.summaryLabel}>Items:</Text>
                        <Text style={styles.summaryValue}>
                            {storedParcels.length} parcel type(s) · {storedParcels.reduce((acc: number, p: any) => acc + (p.quantity || 0), 0)} total units
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.changeBtn} activeOpacity={0.8} onPress={() => router.back()}>
                        <Text style={styles.changeBtnText}>Edit Details</Text>
                    </TouchableOpacity>
                </View>

                {dynamicQuotes.length === 0 && rejectedVehicles.length === 0 ? (
                    <View style={styles.noVehicles}>
                        <Text style={styles.tierTitle}>No suitable vehicles found</Text>
                        <Text style={styles.tierDesc}>Your items are too large or heavy for our standard same-day fleet. Please contact our special loads team for a manual quote.</Text>
                        <TouchableOpacity 
                            style={[styles.bookBtn, { backgroundColor: Colors.primary, borderColor: Colors.primary, marginTop: 16 }]} 
                            onPress={() => handleBook("MANUAL", "Specialized Vehicle", 0)}
                        >
                            <Text style={[styles.bookBtnText, { color: '#FFF' }]}>Proceed to Manual Quote</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        {dynamicQuotes.length > 0 && (
                            <View style={styles.tierSection}>
                                <Text style={styles.tierTitle}>Available Vehicles</Text>
                                <Text style={styles.tierDesc}>The following vehicles can safely accommodate your load based on the dimensions provided.</Text>

                                <View style={styles.cardGrid}>
                                    {dynamicQuotes.map(q => (
                                        <VehicleCard
                                            key={q.vehicleId}
                                            title={q.vehicleName.replace(/_/g, ' ')}
                                            dimensions={q.dimensions}
                                            weight={q.maxWeight}
                                            priceEx={q.totalExVat}
                                            priceInc={q.totalIncVat}
                                            originalPerParcelExVat={q.originalPerParcelExVat}
                                            discountApplied={q.discountApplied}
                                            quantity={q.quantity}
                                            onBook={() => handleBook("SAME DAY", q.vehicleName, q.totalExVat)}
                                        />
                                    ))}
                                </View>
                            </View>
                        )}

                        {rejectedVehicles.length > 0 && (
                            <View style={[styles.tierSection, { borderBottomWidth: 0 }]}>
                                <Text style={[styles.tierTitle, { color: '#ef4444' }]}>Restricted Vehicles</Text>
                                <Text style={styles.tierDesc}>These vehicles cannot carry your load for the following reasons:</Text>
                                
                                <View style={styles.rejectedList}>
                                    {rejectedVehicles.map(rv => (
                                        <View key={rv.vehicleId} style={styles.rejectedItem}>
                                            <View style={styles.rejectedBadge}>
                                                <Text style={styles.rejectedBadgeText}>{rv.name.replace(/_/g, ' ')}</Text>
                                            </View>
                                            <Text style={styles.rejectedReason}>{rv.message}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}
                    </>
                )}

                <View style={styles.bottomActions}>
                    <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.8} onPress={() => router.push('/')}>
                        <Text style={styles.secondaryBtnText}>Get another quote</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    stepperContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    stepBox: {
        backgroundColor: '#E2E8F0',
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
    },
    stepBoxActive: {
        backgroundColor: '#3498db',
    },
    stepText: {
        color: '#64748b',
        fontWeight: '700',
        fontSize: 14,
    },
    stepTextActive: {
        color: '#FFFFFF',
    },
    stepConnector: {
        width: 40,
        height: 2,
        backgroundColor: '#E2E8F0',
        marginHorizontal: -5,
        zIndex: -1,
    },
    content: {
        maxWidth: 1000,
        width: '100%',
        alignSelf: 'center',
        padding: 24,
    },
    pageTitle: {
        fontSize: 32,
        fontWeight: '600',
        color: '#1a237e',
        marginBottom: 8,
    },
    quoteValidity: {
        fontSize: 16,
        color: '#1a237e',
        marginBottom: 24,
    },
    summaryBox: {
        position: 'relative',
        marginBottom: 40,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    distanceHighlight: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
    },
    distanceText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600',
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    summaryLabel: {
        width: 180,
        fontSize: 16,
        fontWeight: '600',
        color: '#1a237e',
    },
    summaryValue: {
        fontSize: 16,
        color: '#1a237e',
    },
    changeBtn: {
        position: 'absolute',
        right: 0,
        bottom: 20,
        backgroundColor: '#3498db',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        zIndex: 10, // Ensure it receives taps
        elevation: 5, // Android shadow/z-index equivalent
    },
    changeBtnText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },
    tierSection: {
        marginBottom: 40,
        paddingBottom: 40,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    tierTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1a237e',
        marginBottom: 8,
    },
    tierDesc: {
        fontSize: 16,
        color: '#64748b',
        marginBottom: 24,
    },
    boldTime: {
        fontWeight: '700',
        color: '#1a237e',
    },
    cardGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    vehicleCard: {
        minWidth: 280,
        flexGrow: 1,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        padding: 24,
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        margin: 10,
    },
    vehicleIconWrapper: {
        marginBottom: 16,
    },
    vehicleTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#3498db',
        marginBottom: 24,
    },
    specsContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    specDimension: {
        fontSize: 14,
        color: '#3498db',
        marginBottom: 4,
    },
    specLabel: {
        fontSize: 14,
        color: '#1a237e',
        fontWeight: '600',
        marginBottom: 4,
    },
    specWeight: {
        fontSize: 14,
        color: '#3498db',
    },
    priceContainer: {
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        paddingTop: 16,
        width: '100%',
        marginBottom: 12,
    },
    priceEx: {
        fontSize: 32,
        fontWeight: '800',
        color: '#1a237e',
        marginBottom: 4,
    },
    strikethroughPrice: {
        fontSize: 20,
        fontWeight: '600',
        color: '#94a3b8',
        textDecorationLine: 'line-through',
        marginBottom: 8, // align baseline slightly
    },
    bulkBadgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ecfdf5', // emerald-50
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#a7f3d0', // emerald-200
    },
    bulkBadgeText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#10b981', // emerald-500
    },
    priceTaxLabel: {
        fontSize: 14,
        color: '#64748b',
    },
    priceIncContainer: {
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        paddingTop: 12,
        paddingBottom: 24,
        width: '100%',
    },
    priceInc: {
        fontSize: 14,
        color: '#3498db',
        fontWeight: '700',
    },
    priceIncLabel: {
        fontSize: 14,
        color: '#3498db',
        textDecorationLine: 'underline',
    },
    bookBtn: {
        borderWidth: 1,
        borderColor: '#3498db',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 32,
        backgroundColor: '#FFFFFF',
    },
    bookBtnText: {
        color: '#3498db',
        fontWeight: '700',
        fontSize: 16,
    },
    bottomActions: {
        alignItems: 'flex-end',
        marginTop: 20,
    },
    secondaryBtn: {
        backgroundColor: '#E2E8F0',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 24,
    },
    secondaryBtnText: {
        color: '#3498db',
        fontWeight: '700',
        fontSize: 16,
    },
    noVehicles: {
        padding: 40,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    rejectedList: {
    },
    rejectedItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef2f2',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#fee2e2',
        marginBottom: 12,
    },
    rejectedBadge: {
        backgroundColor: '#ef4444',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        minWidth: 100,
        alignItems: 'center',
        marginRight: 12,
    },
    rejectedBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '800',
    },
    rejectedReason: {
        flex: 1,
        fontSize: 14,
        color: '#ef4444',
        fontWeight: '500',
    }
});
