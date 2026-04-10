import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Plus, Save, Building2, Truck, Percent, Target } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { ResponsiveContainer } from '@/components/ResponsiveContainer';

export default function ContractBuilderScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [businessName, setBusinessName] = useState('');
    const [contactEmail, setContactEmail] = useState('');

    // Rate Rules
    const [smallVanBase, setSmallVanBase] = useState('45.00');
    const [smallVanKm, setSmallVanKm] = useState('1.20');

    const [largeVanBase, setLargeVanBase] = useState('60.00');
    const [largeVanKm, setLargeVanKm] = useState('1.50');

    // Surcharges
    const [weekendSurcharge, setWeekendSurcharge] = useState('25');
    const [oohSurcharge, setOohSurcharge] = useState('25');
    const [heavySurcharge, setHeavySurcharge] = useState('15');

    // SLAs
    const [stdHours, setStdHours] = useState('8');
    const [urgentHours, setUrgentHours] = useState('2');
    const [penalty, setPenalty] = useState('10');

    const handleSave = () => {
        if (!businessName.trim() || !contactEmail.trim()) {
            Alert.alert('Missing Info', 'Please provide a Business Name and Contact Email.');
            return;
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Contract draft created securely.', [
            { text: 'OK', onPress: () => router.back() }
        ]);
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <View style={styles.headerContent}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <ChevronLeft size={24} color={Colors.textInverse} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleWrap}>
                        <Plus size={20} color={Colors.textInverse} />
                        <Text style={styles.headerTitle}>New Contract Builder</Text>
                    </View>
                    <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                        <Save size={16} color={Colors.textInverse} />
                        <Text style={styles.saveBtnText}>Save</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ResponsiveContainer scrollable={true} backgroundColor={Colors.background}>
                <View style={styles.bodyContent}>
                    {/* Business Details */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <Building2 size={18} color={Colors.adminPrimary} />
                            <Text style={styles.sectionTitle}>Business Details</Text>
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Business Name</Text>
                            <TextInput style={styles.input} value={businessName} onChangeText={setBusinessName} placeholder="e.g. Acme Corp" placeholderTextColor={Colors.textMuted} />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Primary Contact Email</Text>
                            <TextInput style={styles.input} value={contactEmail} onChangeText={setContactEmail} placeholder="billing@acme.com" keyboardType="email-address" autoCapitalize="none" placeholderTextColor={Colors.textMuted} />
                        </View>
                    </View>

                    {/* Rate Rules */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <Truck size={18} color={Colors.adminPrimary} />
                            <Text style={styles.sectionTitle}>Vehicle Rate Rules</Text>
                        </View>

                        <Text style={styles.subHeading}>Small Van</Text>
                        <View style={styles.row}>
                            <View style={styles.col}>
                                <Text style={styles.label}>Base Rate (£)</Text>
                                <TextInput style={styles.input} value={smallVanBase} onChangeText={setSmallVanBase} keyboardType="numeric" />
                            </View>
                            <View style={styles.col}>
                                <Text style={styles.label}>Per KM (£)</Text>
                                <TextInput style={styles.input} value={smallVanKm} onChangeText={setSmallVanKm} keyboardType="numeric" />
                            </View>
                        </View>

                        <Text style={[styles.subHeading, { marginTop: 16 }]}>Large Van</Text>
                        <View style={styles.row}>
                            <View style={styles.col}>
                                <Text style={styles.label}>Base Rate (£)</Text>
                                <TextInput style={styles.input} value={largeVanBase} onChangeText={setLargeVanBase} keyboardType="numeric" />
                            </View>
                            <View style={styles.col}>
                                <Text style={styles.label}>Per KM (£)</Text>
                                <TextInput style={styles.input} value={largeVanKm} onChangeText={setLargeVanKm} keyboardType="numeric" />
                            </View>
                        </View>
                    </View>

                    {/* Surcharges */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <Percent size={18} color={Colors.adminPrimary} />
                            <Text style={styles.sectionTitle}>Surcharges (%)</Text>
                        </View>

                        <View style={styles.row}>
                            <View style={styles.col}>
                                <Text style={styles.label}>Weekend</Text>
                                <TextInput style={styles.input} value={weekendSurcharge} onChangeText={setWeekendSurcharge} keyboardType="numeric" />
                            </View>
                            <View style={styles.col}>
                                <Text style={styles.label}>Out of Hours</Text>
                                <TextInput style={styles.input} value={oohSurcharge} onChangeText={setOohSurcharge} keyboardType="numeric" />
                            </View>
                            <View style={styles.col}>
                                <Text style={styles.label}>Heavy Goods</Text>
                                <TextInput style={styles.input} value={heavySurcharge} onChangeText={setHeavySurcharge} keyboardType="numeric" />
                            </View>
                        </View>
                    </View>

                    {/* SLA Definitions */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <Target size={18} color={Colors.adminPrimary} />
                            <Text style={styles.sectionTitle}>SLA Definitions</Text>
                        </View>

                        <View style={styles.row}>
                            <View style={styles.col}>
                                <Text style={styles.label}>Standard (hrs)</Text>
                                <TextInput style={styles.input} value={stdHours} onChangeText={setStdHours} keyboardType="numeric" />
                            </View>
                            <View style={styles.col}>
                                <Text style={styles.label}>Urgent (hrs)</Text>
                                <TextInput style={styles.input} value={urgentHours} onChangeText={setUrgentHours} keyboardType="numeric" />
                            </View>
                            <View style={styles.col}>
                                <Text style={styles.label}>Breach Penalty (%)</Text>
                                <TextInput style={styles.input} value={penalty} onChangeText={setPenalty} keyboardType="numeric" />
                            </View>
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
    header: { backgroundColor: Colors.navy, paddingHorizontal: 20, paddingBottom: 16 },
    headerContent: {
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        maxWidth: 1000,
        alignSelf: 'center',
        width: '100%',
    },
    backBtn: { padding: 4, marginLeft: -4 },
    headerTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginLeft: 12 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.textInverse },
    saveBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.success, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, gap: 6 },
    saveBtnText: { color: Colors.textInverse, fontWeight: '700', fontSize: 14 },
    bodyContent: { paddingVertical: 20, paddingHorizontal: 0, gap: 16 },
    sectionCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: Colors.border },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.borderLight, paddingBottom: 12 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
    subHeading: { fontSize: 13, fontWeight: '600', color: Colors.adminPrimary, marginBottom: 8 },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
    input: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 12, height: 44, fontSize: 14, color: Colors.text, ...(Platform.OS === 'web' && { outlineStyle: 'none' }) } as any,
    row: { flexDirection: 'row', gap: 12 },
    col: { flex: 1 }
});
