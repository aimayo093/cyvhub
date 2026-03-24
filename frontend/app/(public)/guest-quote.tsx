import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Truck } from 'lucide-react-native';
import Colors from '@/constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GuestQuoteConfig, initialGuestQuote } from '@/constants/cmsDefaults';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
const VehicleCard = ({ title, dimensions, weight, priceEx, priceInc, onBook }: any) => {
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
                <Text style={styles.priceEx}>£{priceEx.toFixed(2)}</Text>
                <Text style={styles.priceTaxLabel}>excl. VAT</Text>
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

export default function GuestQuotePage() {
    const { collection, delivery, ready, vehicle } = useLocalSearchParams();
    const router = useRouter();
    const [config, setConfig] = useState<GuestQuoteConfig>(initialGuestQuote);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadConfig = async () => {
            try {
                const storedConfig = await AsyncStorage.getItem('cms_guestQuoteConfig');
                if (storedConfig) {
                    setConfig(JSON.parse(storedConfig));
                }
            } catch (error) {
                console.error('Failed to load guest quote config:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadConfig();
    }, []);

    const handleBook = (service: string, vehicle: string, price: number) => {
        router.push({
            pathname: '/guest-checkout',
            params: {
                collection: collection as string || 'SA11 2AY',
                delivery: delivery as string || 'CF10 1AF',
                serviceType: service,
                vehicleType: vehicle,
                price: price.toString()
            }
        });
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const currentDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
    const parsedValidityText = config.validityText.replace('{time}', currentTime).replace('{date}', currentDate);

    return (
        <ScrollView style={styles.container}>
            <Stepper currentStep={1} />

            <View style={styles.content}>
                <Text style={styles.pageTitle}>{config.pageTitle}</Text>
                <Text style={styles.quoteValidity}>{parsedValidityText}</Text>

                <View style={styles.summaryBox}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Collection postcode:</Text>
                        <Text style={styles.summaryValue}>{collection || 'SA11 2AY'}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Delivery postcode:</Text>
                        <Text style={styles.summaryValue}>{delivery || 'CF10 1AF'}</Text>
                    </View>
                    <TouchableOpacity style={styles.changeBtn} activeOpacity={0.8} onPress={() => router.back()}>
                        <Text style={styles.changeBtnText}>Change details</Text>
                    </TouchableOpacity>
                </View>

                {config.tiers.map((tier, index) => {
                    const isLast = index === config.tiers.length - 1;

                    // Parse description for bold markdown (**text**)
                    const renderDescriptionLines = (text: string) => {
                        const parts = text.split(/(\*\*.*?\*\*)/g);
                        return parts.map((part, i) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                                return <Text key={i} style={styles.boldTime}>{part.slice(2, -2)}</Text>;
                            }
                            return <Text key={i}>{part}</Text>;
                        });
                    };

                    // Filter vehicles if a specific vehicle is passed in via params
                    const filteredVehicles = vehicle
                        ? tier.vehicles.filter(v => v.title.toLowerCase().includes((vehicle as string).toLowerCase()))
                        : tier.vehicles;

                    if (filteredVehicles.length === 0) return null;

                    return (
                        <View key={tier.id} style={[styles.tierSection, isLast && { borderBottomWidth: 0, paddingBottom: 0 }]}>
                            <Text style={styles.tierTitle}>{tier.title}</Text>
                            <Text style={styles.tierDesc}>{renderDescriptionLines(tier.description)}</Text>

                            <View style={styles.cardGrid}>
                                {filteredVehicles.map(v => (
                                    <VehicleCard
                                        key={v.id}
                                        title={v.title}
                                        dimensions={v.dimensions}
                                        weight={v.weight}
                                        priceEx={v.priceEx}
                                        priceInc={v.priceInc}
                                        onBook={() => handleBook(tier.title, v.title, v.priceEx)}
                                    />
                                ))}
                            </View>
                        </View>
                    );
                })}

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
        flexDirection: Platform.OS === 'web' ? 'row' : 'column',
        gap: 20,
    },
    vehicleCard: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 4,
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
    }
});
