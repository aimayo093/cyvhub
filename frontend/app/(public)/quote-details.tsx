import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Package, Ruler, Weight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QuoteDetailsConfig, initialQuoteDetails } from '@/constants/cmsDefaults';



// Custom Stepper
const Stepper = ({ currentStep }: { currentStep: number }) => (
    <View style={styles.stepperContainer}>
        <View style={[styles.stepBox, currentStep >= 1 && styles.stepBoxActive]}>
            <Text style={[styles.stepText, currentStep >= 1 && styles.stepTextActive]}>LOCATIONS</Text>
        </View>
        <View style={styles.stepConnector} />
        <View style={[styles.stepBox, currentStep === 1.5 && styles.stepBoxActive]}>
            <Text style={[styles.stepText, currentStep === 1.5 && styles.stepTextActive]}>REQUIREMENTS</Text>
        </View>
        <View style={styles.stepConnector} />
        <View style={[styles.stepBox, currentStep === 2 && styles.stepBoxActive]}>
            <Text style={[styles.stepText, currentStep === 2 && styles.stepTextActive]}>PRICES</Text>
        </View>
    </View>
);

export default function QuoteDetailsPage() {
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const { collection, delivery, ready, vehicle } = useLocalSearchParams();
    const router = useRouter();

    const [length, setLength] = useState('');
    const [width, setWidth] = useState('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [config, setConfig] = useState<QuoteDetailsConfig>(initialQuoteDetails);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadStoredData = async () => {
            try {
                // Load CMS
                const storedCMS = await AsyncStorage.getItem('cms_quoteDetailsConfig');
                if (storedCMS) {
                    setConfig(JSON.parse(storedCMS));
                }

                // Pre-fill from previous session if URL params are missing or just for convenience
                const lastDetails = await AsyncStorage.getItem('last_quote_details');
                if (lastDetails) {
                    const parsed = JSON.parse(lastDetails);
                    if (!length) setLength(parsed.length || '');
                    if (!width) setWidth(parsed.width || '');
                    if (!height) setHeight(parsed.height || '');
                    if (!weight) setWeight(parsed.weight || '');
                }
            } catch (e) {
                console.error('Failed to load data for quote-details', e);
            } finally {
                setIsLoading(false);
            }
        };
        loadStoredData();
    }, []);

    const handleGetPrices = async () => {
        if (!length || !width || !height || !weight) {
            Alert.alert('Missing Information', 'Please fill in all dimensions and weight to get a quote.');
            return;
        }

        const w = parseFloat(weight);
        const l = parseFloat(length);
        const wd = parseFloat(width);
        const h = parseFloat(height);

        if (isNaN(w) || isNaN(l) || isNaN(wd) || isNaN(h)) {
            Alert.alert('Invalid Input', 'Please enter numeric values for dimensions and weight.');
            return;
        }

        // Check if weight is within standard limits
        if (w < 1) {
            Alert.alert('Weight Too Low', 'Minimum weight for a booking is 1kg.');
            return;
        }

        if (w > 1300) {
            Alert.alert(
                'Special Quote Required',
                'For shipments over 1,300kg, please contact our support team for a dedicated heavy-load quote.',
                [{ text: 'OK' }]
            );
            return;
        }

        // Basic dimension check for standard Large Van (Max L: 4.2m)
        if (l > 420 || wd > 210 || h > 210) {
            Alert.alert(
                'Oversized Item',
                'One or more dimensions exceed our standard fleet capacity. Please contact us for a special oversized-load quote.',
                [{ text: 'OK' }]
            );
            return;
        }

        try {
            await AsyncStorage.setItem('last_quote_details', JSON.stringify({
                length, width, height, weight
            }));
        } catch (e) {
            console.error('Failed to save quote details', e);
        }

        router.push({
            pathname: '/(public)/guest-quote',
            params: {
                collection,
                delivery,
                ready,
                vehicle,
                length,
                width,
                height,
                weight
            }
        });
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView style={styles.container}>
                <Stepper currentStep={1.5} />

                <View style={styles.content}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <ArrowLeft size={20} color={Colors.primary} />
                        <Text style={styles.backBtnText}>Back to locations</Text>
                    </TouchableOpacity>

                    <Text style={styles.pageTitle}>{config.pageTitle}</Text>
                    <Text style={styles.pageSubtitle}>{config.subTitle}</Text>

                    <View style={styles.summaryBox}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>From:</Text>
                            <Text style={styles.summaryValue}>{collection as string}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>To:</Text>
                            <Text style={styles.summaryValue}>{delivery as string}</Text>
                        </View>
                    </View>

                    <View style={styles.formSection}>
                        <View style={styles.inputGroup}>
                            <View style={styles.inputLabelRow}>
                                <Ruler size={18} color="#64748b" />
                                <Text style={styles.inputLabel}>Dimensions (cm)</Text>
                            </View>
                            <View style={styles.dimRow}>
                                <TextInput
                                    style={styles.dimInput}
                                    placeholder="Length"
                                    keyboardType="numeric"
                                    value={length}
                                    onChangeText={setLength}
                                />
                                <Text style={styles.dimX}>×</Text>
                                <TextInput
                                    style={styles.dimInput}
                                    placeholder="Width"
                                    keyboardType="numeric"
                                    value={width}
                                    onChangeText={setWidth}
                                />
                                <Text style={styles.dimX}>×</Text>
                                <TextInput
                                    style={styles.dimInput}
                                    placeholder="Height"
                                    keyboardType="numeric"
                                    value={height}
                                    onChangeText={setHeight}
                                />
                            </View>
                            <Text style={styles.weightNote}>Max for standard fleet: 420 x 210 x 210 cm</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.inputLabelRow}>
                                <Weight size={18} color="#64748b" />
                                <Text style={styles.inputLabel}>Total Weight (kg)</Text>
                            </View>
                            <TextInput
                                style={styles.fullInput}
                                placeholder="e.g. 50"
                                keyboardType="numeric"
                                value={weight}
                                onChangeText={setWeight}
                            />
                            <View style={styles.weightLimitContainer}>
                                <Text style={styles.weightNote}>Minimum: <Text style={styles.boldNano}>1kg</Text></Text>
                                <Text style={styles.weightNote}>Maximum: <Text style={styles.boldNano}>1,300kg</Text></Text>
                            </View>
                        </View>

                        <TouchableOpacity 
                            style={styles.continueBtn}
                            onPress={handleGetPrices}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.continueBtnText}>Get Automatic Pricing</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
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
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    stepBoxActive: {
        backgroundColor: Colors.primary,
    },
    stepText: {
        color: '#64748b',
        fontWeight: '700',
        fontSize: 12,
    },
    stepTextActive: {
        color: '#FFFFFF',
    },
    stepConnector: {
        width: 30,
        height: 2,
        backgroundColor: '#E2E8F0',
        marginHorizontal: -2,
    },
    content: {
        maxWidth: 600,
        width: '100%',
        alignSelf: 'center',
        padding: 24,
    },
    backBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    backBtnText: {
        color: Colors.primary,
        fontWeight: '600',
        marginLeft: 8,
    },
    pageTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1a237e',
        marginBottom: 8,
    },
    pageSubtitle: {
        fontSize: 16,
        color: '#64748b',
        marginBottom: 32,
    },
    summaryBox: {
        backgroundColor: '#f8fafc',
        padding: 16,
        borderRadius: 12,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    summaryRow: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    summaryLabel: {
        width: 60,
        fontWeight: '600',
        color: '#64748b',
    },
    summaryValue: {
        color: '#1a237e',
        fontWeight: '500',
    },
    formSection: {
        gap: 24,
    },
    inputGroup: {
        gap: 8,
    },
    inputLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a237e',
    },
    dimRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 12,
    },
    dimInput: {
        flex: 1,
        minWidth: 100,
        height: 50,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
        backgroundColor: '#f8fafc',
    },
    dimX: {
        fontSize: 18,
        color: '#64748b',
        fontWeight: '600',
    },
    fullInput: {
        height: 50,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
        backgroundColor: '#f8fafc',
    },
    weightNote: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 4,
    },
    weightLimitContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    boldNano: {
        fontWeight: '700',
        color: '#1a237e',
    },
    continueBtn: {
        backgroundColor: Colors.primary,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    continueBtnText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    }
});
