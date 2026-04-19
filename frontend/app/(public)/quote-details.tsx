import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Package, Ruler, Weight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuoteStore } from '@/hooks/useQuoteStore';
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
    const { fromAddress, toAddress, senderPhone, receiverPhone, parcels: storedParcels, setStep2 } = useQuoteStore();
    const [parcels, setParcels] = useState<any[]>([]);
    const [config, setConfig] = useState<QuoteDetailsConfig>(initialQuoteDetails);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (storedParcels && storedParcels.length > 0) {
            setParcels(storedParcels.map(p => ({
                id: p.id,
                length: p.lengthCm?.toString() || '',
                width: p.widthCm?.toString() || '',
                height: p.heightCm?.toString() || '',
                weight: p.weightKg?.toString() || '',
                quantity: p.quantity?.toString() || '1',
                description: p.description || ''
            })));
        } else {
            setParcels([{ id: Math.random().toString(), length: '', width: '', height: '', weight: '', quantity: '1', description: '' }]);
        }
    }, [storedParcels]);


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
                    if (Array.isArray(parsed.parcels)) {
                        setParcels(parsed.parcels);
                    } else if (parsed.length) {
                        setParcels([{
                            length: parsed.length || '',
                            width: parsed.width || '',
                            height: parsed.height || '',
                            weight: parsed.weight || '',
                            quantity: parsed.quantity || '1',
                            description: ''
                        }]);
                    }
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
        const isValid = parcels.every(p => p.length && p.width && p.height && p.weight && parseInt(p.quantity, 10) > 0);
        if (!isValid) {
            Alert.alert('Missing Information', 'Please fill in all dimensions, weight, and quantity for all parcels.');
            return;
        }

        const totalWeight = parcels.reduce((sum, p) => sum + (parseFloat(p.weight) * parseInt(p.quantity, 10)), 0);

        if (totalWeight > 1200) {
            Alert.alert(
                'High Capacity Load',
                'Your shipment exceeds 1,200kg, which is the limit for our standard vehicles. Please contact support for a specialized heavy-haulage quote.',
                [{ text: 'OK' }]
            );
            return;
        }

        // Save to store
        setStep2(parcels.map(p => ({
            id: p.id || Math.random().toString(),
            lengthCm: parseFloat(p.length),
            widthCm: parseFloat(p.width),
            heightCm: parseFloat(p.height),
            weightKg: parseFloat(p.weight),
            quantity: parseInt(p.quantity, 10),
            description: p.description || ''
        })));

        router.push('/(public)/guest-quote' as any);
    };

    const addParcel = () => {
        setParcels([...parcels, { id: Math.random().toString(), length: '', width: '', height: '', weight: '', quantity: '1', description: '' }]);
    };

    const removeParcel = (index: number) => {
        if (parcels.length > 1) {
            const newParcels = [...parcels];
            newParcels.splice(index, 1);
            setParcels(newParcels);
        }
    };

    const updateParcel = (index: number, field: string, value: string) => {
        const newParcels = [...parcels];
        newParcels[index] = { ...newParcels[index], [field]: value };
        setParcels(newParcels);
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
                            <Text style={styles.summaryValue}>{fromAddress}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>To:</Text>
                            <Text style={styles.summaryValue}>{toAddress}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Phones:</Text>
                            <Text style={styles.summaryValue}>{senderPhone} → {receiverPhone}</Text>
                        </View>
                    </View>

                    <View style={styles.formSection}>
                        {parcels.map((parcel, index) => (
                            <View key={index} style={styles.parcelCard}>
                                <View style={styles.parcelHeader}>
                                    <Text style={styles.parcelTitle}>Parcel #{index + 1}</Text>
                                    {parcels.length > 1 && (
                                        <TouchableOpacity onPress={() => removeParcel(index)}>
                                            <Text style={styles.removeText}>Remove</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                <View style={styles.inputGroup}>
                                    <View style={styles.inputLabelRow}>
                                        <Ruler size={18} color="#64748b" />
                                        <Text style={styles.inputLabel}>Dimensions (cm)</Text>
                                    </View>
                                    <View style={styles.dimRow}>
                                        <TextInput
                                            style={styles.dimInput}
                                            placeholder="L"
                                            keyboardType="numeric"
                                            value={parcel.length}
                                            onChangeText={(v) => updateParcel(index, 'length', v)}
                                        />
                                        <Text style={styles.dimX}>×</Text>
                                        <TextInput
                                            style={styles.dimInput}
                                            placeholder="W"
                                            keyboardType="numeric"
                                            value={parcel.width}
                                            onChangeText={(v) => updateParcel(index, 'width', v)}
                                        />
                                        <Text style={styles.dimX}>×</Text>
                                        <TextInput
                                            style={styles.dimInput}
                                            placeholder="H"
                                            keyboardType="numeric"
                                            value={parcel.height}
                                            onChangeText={(v) => updateParcel(index, 'height', v)}
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <View style={styles.inputLabelRow}>
                                        <Weight size={18} color="#64748b" />
                                        <Text style={styles.inputLabel}>Weight (kg) per unit</Text>
                                    </View>
                                    <TextInput
                                        style={styles.fullInput}
                                        placeholder="e.g. 10"
                                        keyboardType="numeric"
                                        value={parcel.weight}
                                        onChangeText={(v) => updateParcel(index, 'weight', v)}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <View style={styles.inputLabelRow}>
                                        <Package size={18} color="#64748b" />
                                        <Text style={styles.inputLabel}>Quantity</Text>
                                    </View>
                                    <TextInput
                                        style={styles.fullInput}
                                        placeholder="e.g. 1"
                                        keyboardType="number-pad"
                                        value={parcel.quantity}
                                        onChangeText={(v) => updateParcel(index, 'quantity', v)}
                                    />
                                </View>
                            </View>
                        ))}

                        <TouchableOpacity 
                            style={styles.addParcelBtn}
                            onPress={addParcel}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.addParcelBtnText}>+ Add Another Parcel Type</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.continueBtn}
                            onPress={handleGetPrices}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.continueBtnText}>Calculate Unified Price</Text>
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
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a237e',
        marginLeft: 8,
    },
    dimRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
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
        marginHorizontal: 6,
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
    parcelCard: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 24,
    },
    parcelHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    parcelTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a237e',
    },
    removeText: {
        color: '#ef4444',
        fontSize: 12,
        fontWeight: '600',
    },
    addParcelBtn: {
        backgroundColor: '#f1f5f9',
        height: 50,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderStyle: 'dashed',
    },
    addParcelBtnText: {
        color: '#64748b',
        fontSize: 14,
        fontWeight: '600',
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
