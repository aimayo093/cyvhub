import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Save, Settings, Tag } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { apiClient } from '@/services/api';

export default function AdminPricingScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState({
        enable_bulk: true,
        max_discount_cap: 10,
        minimum_margin_threshold: 20
    });

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            setLoading(true);
            const res = await apiClient('/cms/config/pricing_engine_config');
            if (res && res.config) {
                setConfig({
                    enable_bulk: res.config.enable_bulk ?? true,
                    max_discount_cap: res.config.max_discount_cap ?? 10,
                    minimum_margin_threshold: res.config.minimum_margin_threshold ?? 20
                });
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
            Alert.alert("Success", "Pricing Engine Configuration Saved Successfully.");
        } catch (e) {
            console.error("Failed to save config", e);
            Alert.alert("Error", "Failed to update configuration.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={Colors.adminPrimary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ChevronLeft size={22} color={Colors.textInverse} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pricing Engine config</Text>
                <View style={{ width: 38 }} />
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <Tag size={20} color={Colors.adminPrimary} />
                        <Text style={styles.sectionTitle}>Multi-Parcel Discount Rules</Text>
                    </View>
                    
                    <Text style={styles.sectionDesc}>
                        Manage global limitations for identical multi-parcel quotes. These caps prevent individual vehicle rules from sacrificing operating margins.
                    </Text>

                    <View style={styles.settingRow}>
                        <View style={styles.settingTextContainer}>
                            <Text style={styles.settingTitle}>Enable Bulk Pricing</Text>
                            <Text style={styles.settingDesc}>Allow identical parcel volume discounts.</Text>
                        </View>
                        <Switch
                            value={config.enable_bulk}
                            onValueChange={(val) => setConfig(prev => ({ ...prev, enable_bulk: val }))}
                            trackColor={{ false: '#cbd5e1', true: Colors.success }}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <View style={styles.inputHeader}>
                            <Text style={styles.inputLabel}>Maximum Allowed Discount (%)</Text>
                        </View>
                        <TextInput
                            style={styles.textInput}
                            keyboardType="numeric"
                            value={config.max_discount_cap.toString()}
                            onChangeText={(val) => setConfig(prev => ({ ...prev, max_discount_cap: parseInt(val, 10) || 0 }))}
                            placeholder="e.g. 15"
                        />
                        <Text style={styles.helperText}>Any vehicle-specific discount greater than this cap will be automatically throttled back to this limit.</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <View style={styles.inputHeader}>
                            <Text style={styles.inputLabel}>Minimum Margin Protection (%)</Text>
                        </View>
                        <TextInput
                            style={styles.textInput}
                            keyboardType="numeric"
                            value={config.minimum_margin_threshold.toString()}
                            onChangeText={(val) => setConfig(prev => ({ ...prev, minimum_margin_threshold: parseInt(val, 10) || 0 }))}
                            placeholder="e.g. 20"
                        />
                        <Text style={styles.helperText}>If a discounted customer price threatens driver payout margins, the booking will be sent to Manual Review.</Text>
                    </View>

                    <TouchableOpacity 
                        style={[styles.saveBtn, saving && { opacity: 0.7 }]} 
                        onPress={handleSave} 
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <>
                                <Save size={20} color="#FFF" />
                                <Text style={styles.saveBtnText}>Save Configuration</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: Colors.navy, paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8,
    },
    backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textInverse },
    content: { padding: 16 },
    sectionCard: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    sectionDesc: {
        fontSize: 14,
        color: Colors.textMuted,
        lineHeight: 22,
        marginBottom: 24,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
        marginBottom: 24,
    },
    settingTextContainer: { flex: 1, paddingRight: 16 },
    settingTitle: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 4 },
    settingDesc: { fontSize: 13, color: Colors.textMuted, lineHeight: 18 },
    inputGroup: {
        marginBottom: 24,
    },
    inputHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    textInput: {
        height: 52,
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
        color: Colors.text,
    },
    helperText: {
        fontSize: 12,
        color: Colors.textMuted,
        marginTop: 6,
        lineHeight: 18,
    },
    saveBtn: {
        backgroundColor: Colors.adminPrimary,
        height: 56,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 12,
    },
    saveBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    }
});
