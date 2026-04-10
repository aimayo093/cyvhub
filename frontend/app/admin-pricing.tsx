import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  ChevronLeft, 
  Save, 
  Truck, 
  Package, 
  Clock, 
  ShieldCheck, 
  Globe, 
  Percent,
  Plus,
  Trash2
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { apiClient } from '@/services/api';

export default function AdminPricingScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState<any>(null);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            setLoading(true);
            const res = await apiClient('/cms/config/pricing_engine_config');
            if (res && res.config) {
                setConfig(res.config);
            }
        } catch (e) {
            console.error('Failed to load pricing config', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await apiClient('/cms/config', {
                method: 'POST',
                body: JSON.stringify({
                    key: 'pricing_engine_config',
                    config: config
                })
            });
            Alert.alert("Success", "UK Logic Engine Configured Successfully.");
        } catch (e) {
            console.error("Failed to save config", e);
            Alert.alert("Error", "Failed to update configuration.");
        } finally {
            setSaving(false);
        }
    };

    const updateNested = (category: string, key: string, val: any) => {
        setConfig((prev: any) => ({
            ...prev,
            [category]: {
                ...prev[category],
                [key]: val
            }
        }));
    };

    if (loading || !config) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={Colors.adminPrimary} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[styles.container, { paddingTop: insets.top }]}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ChevronLeft size={22} color={Colors.textInverse} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>UK Pricing Engine</Text>
                <TouchableOpacity onPress={handleSave} disabled={saving}>
                    {saving ? <ActivityIndicator size="small" color="#FFF" /> : <Save size={22} color="#FFF" />}
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                
                {/* 1. Vehicle Matrix */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <Truck size={20} color={Colors.adminPrimary} />
                        <Text style={styles.sectionTitle}>Vehicle Matrix (Base + Mile)</Text>
                    </View>
                    {Object.keys(config.base_vehicle_fees || {}).map(vkey => (
                        <View key={vkey} style={styles.matrixRow}>
                            <Text style={styles.matrixLabel}>{vkey.replace('_', ' ')}</Text>
                            <View style={styles.matrixInputs}>
                                <View style={styles.matrixInputWrap}>
                                    <Text style={styles.microLabel}>Base (£)</Text>
                                    <TextInput 
                                        style={styles.matrixInput} 
                                        keyboardType="numeric"
                                        value={config.base_vehicle_fees[vkey]?.toString()}
                                        onChangeText={(val) => updateNested('base_vehicle_fees', vkey, parseFloat(val) || 0)}
                                    />
                                </View>
                                <View style={styles.matrixInputWrap}>
                                    <Text style={styles.microLabel}>Mile (£)</Text>
                                    <TextInput 
                                        style={styles.matrixInput} 
                                        keyboardType="numeric"
                                        value={config.mileage_rates[vkey]?.toString()}
                                        onChangeText={(val) => updateNested('mileage_rates', vkey, parseFloat(val) || 0)}
                                    />
                                </View>
                            </View>
                        </View>
                    ))}
                </View>

                {/* 2. Parcel Handling */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <Package size={20} color={Colors.adminPrimary} />
                        <Text style={styles.sectionTitle}>Multi-Parcel Handling</Text>
                    </View>
                    <View style={styles.inputRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.inputLabel}>Tier 1 Max (Qty)</Text>
                            <TextInput 
                                style={styles.textInput}
                                keyboardType="numeric"
                                value={config.parcel_handling_fees.tier_1_max.toString()}
                                onChangeText={(val) => updateNested('parcel_handling_fees', 'tier_1_max', parseInt(val) || 0)}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.inputLabel}>Tier 1 Fee (£)</Text>
                            <TextInput 
                                style={styles.textInput}
                                keyboardType="numeric"
                                value={config.parcel_handling_fees.tier_1_fee.toString()}
                                onChangeText={(val) => updateNested('parcel_handling_fees', 'tier_1_fee', parseFloat(val) || 0)}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.inputLabel}>Tier 2 Fee (£)</Text>
                            <TextInput 
                                style={styles.textInput}
                                keyboardType="numeric"
                                value={config.parcel_handling_fees.tier_2_fee.toString()}
                                onChangeText={(val) => updateNested('parcel_handling_fees', 'tier_2_fee', parseFloat(val) || 0)}
                            />
                        </View>
                    </View>
                </View>

                {/* 3. Global Surcharges & VAT */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <Percent size={20} color={Colors.adminPrimary} />
                        <Text style={styles.sectionTitle}>Surcharges & VAT</Text>
                    </View>
                    <View style={styles.inputRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.inputLabel}>VAT (%)</Text>
                            <TextInput 
                                style={styles.textInput}
                                keyboardType="numeric"
                                value={config.surcharges.vat_percentage.toString()}
                                onChangeText={(val) => updateNested('surcharges', 'vat_percentage', parseFloat(val) || 0)}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.inputLabel}>Remote Area (£)</Text>
                            <TextInput 
                                style={styles.textInput}
                                keyboardType="numeric"
                                value={config.surcharges.remote_area_flat.toString()}
                                onChangeText={(val) => updateNested('surcharges', 'remote_area_flat', parseFloat(val) || 0)}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.inputLabel}>OOH Flat (£)</Text>
                            <TextInput 
                                style={styles.textInput}
                                keyboardType="numeric"
                                value={config.surcharges.out_of_hours_flat.toString()}
                                onChangeText={(val) => updateNested('surcharges', 'out_of_hours_flat', parseFloat(val) || 0)}
                            />
                        </View>
                    </View>
                </View>

                {/* 4. Remote Postcode Prefixes */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <Globe size={20} color={Colors.adminPrimary} />
                        <Text style={styles.sectionTitle}>Remote Areas (Postcode Prefixes)</Text>
                    </View>
                    <View style={styles.tagCloud}>
                        {config.remote_postcode_prefixes.map((p: string, idx: number) => (
                            <View key={idx} style={styles.tag}>
                                <Text style={styles.tagText}>{p}</Text>
                                <TouchableOpacity onPress={() => {
                                    const next = config.remote_postcode_prefixes.filter((_: any, i: number) => i !== idx);
                                    setConfig((prev: any) => ({ ...prev, remote_postcode_prefixes: next }));
                                }}>
                                    <X size={12} color={Colors.textMuted} />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                    <View style={styles.inputRow}>
                         <TextInput 
                             style={[styles.textInput, { flex: 1 }]} 
                             placeholder="Add prefix (e.g. BT)" 
                             autoCapitalize="characters"
                             onSubmitEditing={(e) => {
                                 const val = e.nativeEvent.text.toUpperCase();
                                 if (val && !config.remote_postcode_prefixes.includes(val)) {
                                     setConfig((prev: any) => ({ 
                                         ...prev, 
                                         remote_postcode_prefixes: [...prev.remote_postcode_prefixes, val] 
                                     }));
                                 }
                             }}
                         />
                    </View>
                </View>

                <TouchableOpacity 
                    style={[styles.saveBtn, saving && { opacity: 0.7 }]} 
                    onPress={handleSave} 
                    disabled={saving}
                >
                    {saving ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveBtnText}>Update UK Logistics Engine</Text>}
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const X = ({ size, color }: any) => <Trash2 size={size} color={color} />;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: Colors.navy, paddingHorizontal: 20, paddingBottom: 16, paddingTop: 8,
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.textInverse },
    content: { padding: 16 },
    sectionCard: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
    matrixRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
    matrixLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, flex: 1 },
    matrixInputs: { flexDirection: 'row', gap: 10 },
    matrixInputWrap: { alignItems: 'center' },
    microLabel: { fontSize: 10, color: Colors.textMuted, marginBottom: 4 },
    matrixInput: { width: 60, height: 36, backgroundColor: Colors.surfaceAlt, borderRadius: 6, borderWidth: 1, borderColor: Colors.border, textAlign: 'center', fontSize: 13, color: Colors.text },
    inputRow: { flexDirection: 'row', gap: 10 },
    inputLabel: { fontSize: 12, fontWeight: '600', color: Colors.textMuted, marginBottom: 6 },
    textInput: { height: 44, backgroundColor: Colors.surfaceAlt, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, fontSize: 14, color: Colors.text },
    tagCloud: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    tag: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceAlt, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, gap: 6 },
    tagText: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary },
    saveBtn: { backgroundColor: Colors.adminPrimary, height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 10, shadowColor: Colors.adminPrimary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
    saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' }
});
