import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Building2, Mail, Phone, MapPin, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { apiClient } from '@/services/api';
import { ResponsiveContainer } from '@/components/ResponsiveContainer';

export default function CreateBusinessScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        tradingName: '',
        companyName: '',
        contactEmail: '',
        contactPhone: '',
        billingAddress: '',
        billingCity: '',
        billingPostcode: '',
        industryProfile: 'Wholesale / Distribution',
        billingTerms: 'Net 30',
        creditLimit: '1000',
    });

    const industries = [
        'Construction', 'IT / Technology', 'Medical', 
        'Wholesale / Distribution', 'Manufacturing', 'Furniture', 'Other'
    ];

    const handleCreate = async () => {
        if (!form.tradingName || !form.companyName || !form.contactEmail) {
            Alert.alert('Missing Info', 'Please fill in Trading Name, Company Name, and Contact Email.');
            return;
        }

        try {
            setSubmitting(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            // Create business via admin route or direct business route
            const response = await apiClient('/businesses', {
                method: 'POST',
                body: JSON.stringify({
                    ...form,
                    creditLimit: parseFloat(form.creditLimit) || 0
                })
            });

            if (response.business) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert('Success', 'Business account created successfully.', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            }
        } catch (error) {
            console.error('Failed to create business:', error);
            Alert.alert('Error', 'Failed to create business account. Please check the data and try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <View style={styles.headerContent}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <ChevronLeft size={24} color={Colors.textInverse} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleWrap}>
                        <Text style={styles.headerTitle}>New Business Account</Text>
                    </View>
                    <TouchableOpacity 
                        style={[styles.saveBtn, (!form.tradingName || !form.companyName || !form.contactEmail) && styles.saveBtnDisabled]} 
                        onPress={handleCreate}
                        disabled={submitting || !form.tradingName || !form.companyName || !form.contactEmail}
                    >
                        {submitting ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <Check size={20} color="#FFF" />
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <ResponsiveContainer scrollable={true} backgroundColor={Colors.background}>
                <View style={styles.bodyContent}>
                    <View style={styles.sectionHeader}>
                        <Building2 size={18} color={Colors.adminPrimary} />
                        <Text style={styles.sectionTitle}>Company Identity</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Trading Name *</Text>
                        <TextInput 
                            style={styles.input} 
                            value={form.tradingName} 
                            onChangeText={t => setForm({ ...form, tradingName: t })}
                            placeholder="e.g. Acme Logistics SE"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Registered Company Name *</Text>
                        <TextInput 
                            style={styles.input} 
                            value={form.companyName} 
                            onChangeText={t => setForm({ ...form, companyName: t })}
                            placeholder="e.g. Acme Services Limited"
                        />
                    </View>

                    <View style={styles.sectionHeader}>
                        <Mail size={18} color={Colors.adminPrimary} />
                        <Text style={styles.sectionTitle}>Primary Contact</Text>
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Email Address *</Text>
                            <TextInput 
                                style={styles.input} 
                                value={form.contactEmail} 
                                onChangeText={t => setForm({ ...form, contactEmail: t })}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                placeholder="admin@acme.com"
                            />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Phone Number</Text>
                            <TextInput 
                                style={styles.input} 
                                value={form.contactPhone} 
                                onChangeText={t => setForm({ ...form, contactPhone: t })}
                                keyboardType="phone-pad"
                                placeholder="020 7123 4567"
                            />
                        </View>
                    </View>

                    <View style={styles.sectionHeader}>
                        <MapPin size={18} color={Colors.adminPrimary} />
                        <Text style={styles.sectionTitle}>Billing Address</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Street Address</Text>
                        <TextInput 
                            style={styles.input} 
                            value={form.billingAddress} 
                            onChangeText={t => setForm({ ...form, billingAddress: t })}
                            placeholder="123 Business Park"
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>City</Text>
                            <TextInput 
                                style={styles.input} 
                                value={form.billingCity} 
                                onChangeText={t => setForm({ ...form, billingCity: t })}
                                placeholder="London"
                            />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Postcode</Text>
                            <TextInput 
                                style={styles.input} 
                                value={form.billingPostcode} 
                                onChangeText={t => setForm({ ...form, billingPostcode: t })}
                                autoCapitalize="characters"
                                placeholder="EC1A 1BB"
                            />
                        </View>
                    </View>

                    <View style={styles.sectionHeader}>
                        <Building2 size={18} color={Colors.adminPrimary} />
                        <Text style={styles.sectionTitle}>Account Configuration</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Industry Profile</Text>
                        <View style={styles.chipRow}>
                            {industries.map(ind => (
                                <TouchableOpacity 
                                    key={ind} 
                                    style={[styles.chip, form.industryProfile === ind && styles.chipActive]}
                                    onPress={() => setForm({ ...form, industryProfile: ind })}
                                >
                                    <Text style={[styles.chipText, form.industryProfile === ind && styles.chipTextActive]}>{ind}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Credit Limit (£)</Text>
                            <TextInput 
                                style={styles.input} 
                                value={form.creditLimit} 
                                onChangeText={t => setForm({ ...form, creditLimit: t })}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Invoicing Terms</Text>
                            <TextInput 
                                style={styles.input} 
                                value={form.billingTerms} 
                                onChangeText={t => setForm({ ...form, billingTerms: t })}
                            />
                        </View>
                    </View>

                    <View style={{ height: 40 }} />
                </View>
            </ResponsiveContainer>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { 
        backgroundColor: Colors.navy, 
        paddingHorizontal: 20, 
        paddingBottom: 16, 
    },
    headerContent: {
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        maxWidth: 1000,
        alignSelf: 'center',
        width: '100%',
    },
    backBtn: { padding: 4, marginLeft: -4 },
    headerTitleWrap: { flex: 1, marginLeft: 12 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.textInverse },
    saveBtn: { 
        width: 40, 
        height: 40, 
        borderRadius: 12, 
        backgroundColor: Colors.success, 
        alignItems: 'center', 
        justifyContent: 'center' 
    },
    saveBtnDisabled: { opacity: 0.5 },
    bodyContent: { paddingVertical: 20, paddingHorizontal: 0, gap: 20 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
    inputGroup: { gap: 8 },
    label: { fontSize: 14, fontWeight: '600', color: Colors.text },
    input: { 
        backgroundColor: Colors.surface, 
        borderRadius: 12, 
        padding: 12, 
        fontSize: 15, 
        color: Colors.text, 
        borderWidth: 1, 
        borderColor: Colors.border 
    },
    row: { flexDirection: 'row', gap: 12 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { 
        paddingHorizontal: 12, 
        paddingVertical: 6, 
        borderRadius: 20, 
        borderWidth: 1, 
        borderColor: Colors.border,
        backgroundColor: Colors.surface
    },
    chipActive: { 
        backgroundColor: Colors.adminPrimary, 
        borderColor: Colors.adminPrimary 
    },
    chipText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
    chipTextActive: { color: '#FFF' },
});
