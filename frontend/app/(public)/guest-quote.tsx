import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GuestQuoteConfig, initialGuestQuote } from '@/constants/cmsDefaults';



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
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
                    {isBulk && <Text style={styles.strikethroughPrice}>£{baseTotal}</Text>}
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
    const { collection, delivery, ready, vehicle, parcels } = useLocalSearchParams();
    const router = useRouter();
    const [config, setConfig] = useState<GuestQuoteConfig>(initialGuestQuote);
    const [dynamicQuotes, setDynamicQuotes] = useState<any[]>([]);
    const [rejectedVehicles, setRejectedVehicles] = useState<any[]>([]);
    const [distance, setDistance] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const [retrievedParams, setRetrievedParams] = useState<any>(null);

    useEffect(() => {
        const fetchQuotes = async () => {
            let activeCollection = collection;
            let activeDelivery = delivery;
            let activeParcels = parcels ? JSON.parse(parcels as string) : [];

            // Recovery Logic: If URL params are missing, check AsyncStorage
            if (!activeCollection || !activeDelivery || activeParcels.length === 0) {
                try {
                    const q1 = await AsyncStorage.getItem('last_quote_params');
                    const q2 = await AsyncStorage.getItem('last_quote_details');
                    if (q1 && q2) {
                        const p1 = JSON.parse(q1);
                        const p2 = JSON.parse(q2);
                        activeCollection = p1.collection;
                        activeDelivery = p1.delivery;
                        activeParcels = p2.parcels || [];
                        setRetrievedParams({ 
                            collection: activeCollection, 
                            delivery: activeDelivery, 
                            parcels: activeParcels
                        });
                    }
                } catch (e) {
                    console.error('State recovery failed', e);
                }
            }

            if (!activeCollection || !activeDelivery || activeParcels.length === 0) {
                setIsLoading(false);
                return;
            }

            try {
                // 1. Fetch CMS text config for page titles/validity
                const storedConfig = await AsyncStorage.getItem('cms_guestQuoteConfig');
                if (storedConfig) {
                    setConfig(JSON.parse(storedConfig));
                }

                // 2. Fetch Dynamic Pricing from Backend
                const response = await apiClient('/quotes/calculate', {
                    method: 'POST',
                    body: JSON.stringify({
                        pickupPostcode: activeCollection,
                        dropoffPostcode: activeDelivery,
                        items: activeParcels.map((p: any) => ({
                            lengthCm: Number(p.length),
                            widthCm: Number(p.width),
                            heightCm: Number(p.height),
                            weightKg: Number(p.weight),
                            quantity: Number(p.quantity) || 1
                        }))
                    })
                });

                if (response) {
                    setDynamicQuotes(response.quotes || []);
                    setRejectedVehicles(response.rejectedVehicles || []);
                    setDistance(response.distanceMiles || 0);
                }
            } catch (error) {
                console.error('Failed to fetch dynamic quotes:', error);
                Alert.alert('Calculation Error', 'We couldn\'t calculate a price for this route. Please contact support.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchQuotes();
    }, [collection, delivery, parcels]);

    // Use either URL params or recovered params
    const finalCollection = collection || retrievedParams?.collection;
    const finalDelivery = delivery || retrievedParams?.delivery;
    const finalParcels = parcels ? JSON.parse(parcels as string) : (retrievedParams?.parcels || []);

    const hasAnyParams = !!(finalCollection && finalDelivery && finalParcels.length > 0);

    const handleBook = (tier: string, vehicleName: string, price: number) => {
        router.push({
            pathname: '/guest-checkout',
            params: {
                collection: finalCollection as string,
                delivery: finalDelivery as string,
                serviceType: tier,
                vehicleType: vehicleName,
                price: price.toString(),
                parcels: JSON.stringify(finalParcels)
            }
        });
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
                    <View style={styles.summaryRow}>
                        <MapPin size={16} color={Colors.primary} style={{ marginRight: 8 }} />
                        <Text style={styles.summaryLabel}>Route:</Text>
                        <Text style={styles.summaryValue}>{finalCollection} → {finalDelivery} ({distance} miles)</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Package size={16} color={Colors.primary} style={{ marginRight: 8 }} />
                        <Text style={styles.summaryLabel}>Items:</Text>
                        <Text style={styles.summaryValue}>
                            {finalParcels.length} parcel type(s) · {finalParcels.reduce((acc: number, p: any) => acc + (parseInt(p.quantity, 10) || 0), 0)} total units
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
        gap: 20,
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
        gap: 12,
    },
    rejectedItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef2f2',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#fee2e2',
        gap: 12,
    },
    rejectedBadge: {
        backgroundColor: '#ef4444',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        minWidth: 100,
        alignItems: 'center',
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
