import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Save, Plus, Trash2, GripVertical, Settings2 } from 'lucide-react-native';
import Colors from '@/constants/colors';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GuestQuoteConfig, ServiceTier, VehicleOption, initialGuestQuote } from '@/constants/cmsDefaults';

export default function BookingCMS() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [config, setConfig] = useState<GuestQuoteConfig>(initialGuestQuote);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
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

    const handleSave = async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        try {
            await AsyncStorage.setItem('cms_guestQuoteConfig', JSON.stringify(config));
            setHasUnsavedChanges(false);
            if (Platform.OS === 'web') {
                alert('Guest Booking Content Published!');
            } else {
                Alert.alert('Success', 'Guest Booking Content Published!');
            }
        } catch (error) {
            console.error('Failed to save guest quote config', error);
        }
    };

    const updateConfig = (key: keyof GuestQuoteConfig, value: any) => {
        setConfig({ ...config, [key]: value });
        setHasUnsavedChanges(true);
    };

    // --- Service Tiers ---
    const addTier = () => {
        setConfig({
            ...config,
            tiers: [...config.tiers, { id: Date.now().toString(), title: 'New Tier', description: '', vehicles: [] }]
        });
        setHasUnsavedChanges(true);
    };
    const updateTier = (id: string, key: keyof ServiceTier, value: string) => {
        setConfig({
            ...config,
            tiers: config.tiers.map(t => t.id === id ? { ...t, [key]: value } : t)
        });
        setHasUnsavedChanges(true);
    };
    const removeTier = (id: string) => {
        setConfig({ ...config, tiers: config.tiers.filter(t => t.id !== id) });
        setHasUnsavedChanges(true);
    };

    // --- Vehicles ---
    const addVehicle = (tierId: string) => {
        setConfig({
            ...config,
            tiers: config.tiers.map(t => {
                if (t.id === tierId) {
                    return {
                        ...t,
                        vehicles: [...t.vehicles, {
                            id: Date.now().toString(),
                            title: 'New Vehicle',
                            dimensions: '',
                            weight: '',
                            priceEx: 0,
                            priceInc: 0
                        }]
                    };
                }
                return t;
            })
        });
        setHasUnsavedChanges(true);
    };
    const updateVehicle = (tierId: string, vId: string, key: keyof VehicleOption, value: any) => {
        setConfig({
            ...config,
            tiers: config.tiers.map(t => {
                if (t.id === tierId) {
                    return {
                        ...t,
                        vehicles: t.vehicles.map(v => v.id === vId ? { ...v, [key]: value } : v)
                    };
                }
                return t;
            })
        });
        setHasUnsavedChanges(true);
    };
    const removeVehicle = (tierId: string, vId: string) => {
        setConfig({
            ...config,
            tiers: config.tiers.map(t => {
                if (t.id === tierId) {
                    return {
                        ...t,
                        vehicles: t.vehicles.filter(v => v.id !== vId)
                    };
                }
                return t;
            })
        });
        setHasUnsavedChanges(true);
    };

    if (isLoading) return null;

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft size={20} color={Colors.textInverse} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>Guest Booking Editor</Text>
                        <Text style={styles.headerSubtitle}>Manage quote tiers and vehicles</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={[styles.saveButton, !hasUnsavedChanges && styles.saveButtonDisabled]}
                            onPress={handleSave}
                            disabled={!hasUnsavedChanges}
                        >
                            <Save size={16} color={hasUnsavedChanges ? '#FFF' : 'rgba(255,255,255,0.5)'} />
                            <Text style={[styles.saveButtonText, !hasUnsavedChanges && { color: 'rgba(255,255,255,0.5)' }]}>Publish</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>
                {/* Global Settings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Global Settings</Text>
                    <View style={styles.card}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Page Title</Text>
                            <TextInput style={styles.input} value={config.pageTitle} onChangeText={t => updateConfig('pageTitle', t)} />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Validity Text (Use {'{time}'} and {'{date}'} as variables)</Text>
                            <TextInput style={styles.input} value={config.validityText} onChangeText={t => updateConfig('validityText', t)} />
                        </View>
                    </View>
                </View>

                {/* Service Tiers */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Service Tiers</Text>
                        <TouchableOpacity style={styles.addButton} onPress={addTier}>
                            <Plus size={16} color="#FFF" />
                            <Text style={styles.addButtonText}>Add Tier</Text>
                        </TouchableOpacity>
                    </View>

                    {config.tiers.map((tier, tierIndex) => (
                        <View key={tier.id} style={[styles.card, { marginBottom: 24 }]}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardHeaderTitle}>Tier {tierIndex + 1}</Text>
                                <TouchableOpacity onPress={() => removeTier(tier.id)} style={styles.trashBtn}>
                                    <Trash2 size={16} color={Colors.danger} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Tier Title</Text>
                                <TextInput style={styles.input} value={tier.title} onChangeText={t => updateTier(tier.id, 'title', t)} />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Description</Text>
                                <TextInput style={[styles.input, styles.textArea]} multiline value={tier.description} onChangeText={t => updateTier(tier.id, 'description', t)} />
                            </View>

                            {/* Vehicles */}
                            <View style={styles.vehiclesSection}>
                                <View style={styles.sectionHeaderRow}>
                                    <Text style={styles.sectionSubtitle}>Vehicles</Text>
                                    <TouchableOpacity style={styles.addSmallBtn} onPress={() => addVehicle(tier.id)}>
                                        <Plus size={14} color={Colors.primary} />
                                        <Text style={styles.addSmallBtnText}>Add Vehicle</Text>
                                    </TouchableOpacity>
                                </View>

                                {tier.vehicles.map((v, vIndex) => (
                                    <View key={v.id} style={styles.vehicleCard}>
                                        <View style={styles.cardHeader}>
                                            <View style={styles.row}>
                                                <GripVertical size={16} color={Colors.textMuted} />
                                                <Text style={styles.vehicleTitle}>Vehicle {vIndex + 1}</Text>
                                            </View>
                                            <TouchableOpacity onPress={() => removeVehicle(tier.id, v.id)} style={styles.trashBtn}>
                                                <Trash2 size={16} color={Colors.danger} />
                                            </TouchableOpacity>
                                        </View>

                                        <View style={styles.row}>
                                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                                <Text style={styles.inputLabel}>Title</Text>
                                                <TextInput style={[styles.input, styles.inputSmall]} value={v.title} onChangeText={t => updateVehicle(tier.id, v.id, 'title', t)} />
                                            </View>
                                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                                <Text style={styles.inputLabel}>Max Weight</Text>
                                                <TextInput style={[styles.input, styles.inputSmall]} value={v.weight} onChangeText={t => updateVehicle(tier.id, v.id, 'weight', t)} />
                                            </View>
                                        </View>

                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>Dimensions (LxWxH)</Text>
                                            <TextInput style={[styles.input, styles.inputSmall]} value={v.dimensions} onChangeText={t => updateVehicle(tier.id, v.id, 'dimensions', t)} />
                                        </View>

                                        <View style={styles.row}>
                                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                                <Text style={styles.inputLabel}>Price (ex VAT)</Text>
                                                <TextInput style={[styles.input, styles.inputSmall]} keyboardType="numeric" value={v.priceEx.toString()} onChangeText={t => updateVehicle(tier.id, v.id, 'priceEx', parseFloat(t) || 0)} />
                                            </View>
                                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                                <Text style={styles.inputLabel}>Price (inc VAT)</Text>
                                                <TextInput style={[styles.input, styles.inputSmall]} keyboardType="numeric" value={v.priceInc.toString()} onChangeText={t => updateVehicle(tier.id, v.id, 'priceInc', parseFloat(t) || 0)} />
                                            </View>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    ))}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { backgroundColor: Colors.navy, paddingBottom: 16 },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
    backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    headerTitleContainer: { flex: 1, marginLeft: 8 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.textInverse, marginBottom: 4 },
    headerSubtitle: { fontSize: 13, color: Colors.textMuted },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    saveButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.adminPrimary, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, gap: 6 },
    saveButtonDisabled: { backgroundColor: 'rgba(52, 152, 219, 0.5)' },
    saveButtonText: { color: Colors.textInverse, fontSize: 13, fontWeight: '600' },
    content: { flex: 1 },
    contentPadding: { padding: 20 },
    section: { marginBottom: 32 },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 4 },
    sectionSubtitle: { fontSize: 16, fontWeight: '600', color: Colors.text, },
    addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.adminPrimary, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, gap: 6 },
    addButtonText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
    addSmallBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary + '15', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, gap: 6 },
    addSmallBtnText: { color: Colors.primary, fontSize: 12, fontWeight: '600' },
    card: { backgroundColor: Colors.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.border },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
    cardHeaderTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
    vehicleCard: { backgroundColor: Colors.background, borderRadius: 8, padding: 12, borderWidth: 1, borderColor: Colors.border, marginBottom: 12 },
    vehiclesSection: { marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: Colors.border },
    vehicleTitle: { fontSize: 14, fontWeight: '600', color: Colors.text },
    inputGroup: { marginBottom: 12 },
    inputLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
    input: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: Colors.text },
    inputSmall: { paddingVertical: 8, fontSize: 13 },
    textArea: { height: 80, textAlignVertical: 'top' },
    row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    trashBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.danger + '15', alignItems: 'center', justifyContent: 'center' },
});
