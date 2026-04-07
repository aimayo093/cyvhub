import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Building2, CreditCard, FileText, Settings, PauseCircle, PlayCircle, ShieldBan, Mail, Phone, MapPin, Edit2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { apiClient } from '@/services/api';

export default function BusinessProfileScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [biz, setBiz] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBiz = async () => {
            try {
                setLoading(true);
                const data = await apiClient(`/businesses/${id}`);
                setBiz(data.business);
            } catch (error) {
                console.error('Failed to fetch business profile:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchBiz();
    }, [id]);

    const handleAction = async (title: string, message: string, style: 'default' | 'destructive' | 'cancel' = 'default') => {
        Haptics.impactAsync(style === 'destructive' ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium);
        
        if (title === 'Suspend Account' || title === 'Reactivate Account') {
            const newStatus = title === 'Suspend Account' ? 'SUSPENDED' : 'ACTIVE';
            Alert.alert(title, message, [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm', 
                    style: style === 'destructive' ? 'destructive' : 'default',
                    onPress: async () => {
                        try {
                            const res = await apiClient(`/businesses/${id}/status`, {
                                method: 'PATCH',
                                body: JSON.stringify({ status: newStatus })
                            });
                            setBiz(res.business);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        } catch (err) {
                            Alert.alert('Error', 'Failed to update business status.');
                        }
                    }
                }
            ]);
            return;
        }

        if (title === 'Modify Billing') {
            Alert.prompt(
                'Modify Billing', 
                'Enter new Credit Limit (e.g. 5000)',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Save', onPress: async (limit?: string) => {
                        try {
                            const res = await apiClient(`/businesses/${id}`, {
                                method: 'PATCH',
                                body: JSON.stringify({ creditLimit: parseFloat(limit || '0') })
                            });
                            setBiz(res.business);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        } catch (err) {
                            Alert.alert('Error', 'Failed to update billing details.');
                        }
                    }}
                ],
                'plain-text',
                biz?.creditLimit?.toString() || '0'
            );
            return;
        }

        if (title === 'Assign Contract') {
            Alert.prompt(
                'Assign SLA Contract',
                'Enter the Contract ID to assign to this business. Leave blank to remove.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Save', onPress: async (contractId?: string) => {
                        try {
                            const res = await apiClient(`/businesses/${id}`, {
                                method: 'PATCH',
                                body: JSON.stringify({ contractId: contractId || null })
                            });
                            setBiz(res.business);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        } catch (err) {
                            Alert.alert('Error', 'Failed to assign contract. Ensure the Contract ID is valid.');
                        }
                    }}
                ],
                'plain-text',
                biz?.contractId || ''
            );
            return;
        }

        if (title === 'Edit Information') {
            // Simplified multi-field editing via multiple prompts or a dedicated modal
            // Here we'll use a specific field selector for brevity in this UI pattern
            Alert.alert(
                'Edit Information',
                'Which field would you like to update?',
                [
                    { text: 'Trading Name', onPress: () => editField('tradingName', 'Trading Name', biz.tradingName) },
                    { text: 'Legal Name', onPress: () => editField('companyName', 'Legal Name', biz.companyName) },
                    { text: 'Contact Email', onPress: () => editField('contactEmail', 'Contact Email', biz.contactEmail) },
                    { text: 'Cancel', style: 'cancel' }
                ]
            );
            return;
        }

        Alert.alert(title, message);
    };

    const editField = (field: string, label: string, current: string) => {
        Alert.prompt(
            `Update ${label}`,
            `Enter the new ${label} for this business:`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Save', onPress: async (val?: string) => {
                    if (!val) return;
                    try {
                        const res = await apiClient(`/admin/businesses/${id}`, {
                            method: 'PATCH',
                            body: JSON.stringify({ [field]: val })
                        });
                        if (res.business) {
                            setBiz(res.business);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        }
                    } catch (err) {
                        Alert.alert('Error', 'Failed to update field.');
                    }
                }}
            ],
            'plain-text',
            current
        );
    };

    if (loading || !biz) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={Colors.adminPrimary} />
            </View>
        );
    }

    const isActive = biz.status === 'ACTIVE';

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={Colors.textInverse} />
                </TouchableOpacity>
                <View style={styles.headerTitleWrap}>
                    <Text style={styles.headerTitle}>Business Profile</Text>
                </View>
                <TouchableOpacity style={styles.editBtn} onPress={() => handleAction('Edit Information', '')}>
                    <Edit2 size={20} color={Colors.textInverse} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>

                {/* Core Identity Card */}
                <View style={styles.card}>
                    <View style={styles.identityRow}>
                        <View style={styles.avatar}>
                            <Building2 size={24} color={Colors.adminPrimary} />
                        </View>
                        <View style={styles.identityText}>
                            <Text style={styles.tradingName}>{biz.tradingName}</Text>
                            <Text style={styles.legalName}>{biz.companyName}</Text>
                        </View>
                        <View style={[styles.statusBadge, biz.status === 'ACTIVE' ? styles.statusActive : biz.status === 'SUSPENDED' ? styles.statusSuspended : styles.statusPending]}>
                            <Text style={[styles.statusText, biz.status === 'ACTIVE' ? styles.textActive : biz.status === 'SUSPENDED' ? styles.textSuspended : styles.textPending]}>
                                {biz.status}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.contactGrid}>
                        <View style={styles.contactItem}>
                            <Mail size={14} color={Colors.textMuted} />
                            <Text style={styles.contactText}>{biz.contactEmail}</Text>
                        </View>
                        <View style={styles.contactItem}>
                            <Phone size={14} color={Colors.textMuted} />
                            <Text style={styles.contactText}>{biz.contactPhone}</Text>
                        </View>
                        <View style={[styles.contactItem, { width: '100%' }]}>
                            <MapPin size={14} color={Colors.textMuted} />
                            <Text style={styles.contactText}>{biz.billingAddress}, {biz.billingCity}, {biz.billingPostcode}</Text>
                        </View>
                    </View>
                </View>

                {/* Financial Overview */}
                <Text style={styles.sectionTitle}>Financial Summary</Text>
                <View style={styles.financeGrid}>
                    <View style={styles.financeCard}>
                        <Text style={styles.financeLabel}>Current Balance</Text>
                        <Text style={[styles.financeValue, { color: biz.currentBalance > 0 ? Colors.danger : Colors.text }]}>
                            £{biz.currentBalance.toFixed(2)}
                        </Text>
                    </View>
                    <View style={styles.financeCard}>
                        <Text style={styles.financeLabel}>Total Spend</Text>
                        <Text style={styles.financeValue}>£{biz.totalSpend.toLocaleString()}</Text>
                    </View>
                    <View style={styles.financeCard}>
                        <Text style={styles.financeLabel}>Credit Limit</Text>
                        <Text style={styles.financeValue}>£{biz.creditLimit.toLocaleString()}</Text>
                    </View>
                    <View style={styles.financeCard}>
                        <Text style={styles.financeLabel}>Billing Terms</Text>
                        <Text style={styles.financeValue}>{biz.billingTerms}</Text>
                    </View>
                </View>

                {/* Contract & Pricing */}
                <Text style={styles.sectionTitle}>Contract Rules</Text>
                <View style={styles.contractCard}>
                    <View style={styles.contractHeader}>
                        <FileText size={20} color={biz.contractId ? Colors.success : Colors.textMuted} />
                        <View style={styles.contractTitleWrap}>
                            <Text style={styles.contractTitle}>{biz.contractId ? 'Active SLA Contract' : 'Standard Ad-hoc Pricing'}</Text>
                            <Text style={styles.contractSubtitle}>{biz.contractId ? `Ref: ${biz.contractId}` : 'No volume discounts applied'}</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.outlineBtn}
                        onPress={() => handleAction('Assign Contract', 'Opening contract assignment modal...')}
                    >
                        <Text style={styles.outlineBtnText}>{biz.contractId ? 'Switch Contract' : 'Assign New Contract'}</Text>
                    </TouchableOpacity>
                </View>

                {/* Administrative Actions */}
                <Text style={styles.sectionTitle}>Overrides & Oversight</Text>
                <View style={styles.actionsContainer}>
                    <TouchableOpacity style={styles.actionRow} onPress={() => handleAction('Modify Billing', 'Open billing configurations')}>
                        <CreditCard size={20} color={Colors.textSecondary} />
                        <View style={styles.actionTextWrap}>
                            <Text style={styles.actionTitle}>Modify Billing Terms</Text>
                            <Text style={styles.actionSubtitle}>Adjust credit limits and invoice terms</Text>
                        </View>
                        <ChevronLeft size={20} color={Colors.textMuted} style={{ transform: [{ rotate: '180deg' }] }} />
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <TouchableOpacity style={styles.actionRow} onPress={() => handleAction('Pricing Rules', 'Open pricing rule overrides')}>
                        <Settings size={20} color={Colors.textSecondary} />
                        <View style={styles.actionTextWrap}>
                            <Text style={styles.actionTitle}>Pricing Overrides</Text>
                            <Text style={styles.actionSubtitle}>Set custom surcharges or base rate discounts</Text>
                        </View>
                        <ChevronLeft size={20} color={Colors.textMuted} style={{ transform: [{ rotate: '180deg' }] }} />
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    {isActive ? (
                        <TouchableOpacity style={styles.actionRow} onPress={() => handleAction('Suspend Account', 'Are you sure you want to suspend this account?', 'destructive')}>
                            <ShieldBan size={20} color={Colors.danger} />
                            <View style={styles.actionTextWrap}>
                                <Text style={[styles.actionTitle, { color: Colors.danger }]}>Suspend Account</Text>
                                <Text style={styles.actionSubtitle}>Immediately halt booking permissions</Text>
                            </View>
                            <ChevronLeft size={20} color={Colors.danger} style={{ transform: [{ rotate: '180deg' }] }} />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.actionRow} onPress={() => handleAction('Reactivate Account', 'Reactivating this business account...')}>
                            <PlayCircle size={20} color={Colors.success} />
                            <View style={styles.actionTextWrap}>
                                <Text style={[styles.actionTitle, { color: Colors.success }]}>Reactivate Account</Text>
                                <Text style={styles.actionSubtitle}>Restore full booking access</Text>
                            </View>
                            <ChevronLeft size={20} color={Colors.success} style={{ transform: [{ rotate: '180deg' }] }} />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { backgroundColor: Colors.navy, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: { padding: 4, marginLeft: -4 },
    headerTitleWrap: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.textInverse },
    editBtn: { padding: 4, marginRight: -4 },

    body: { flex: 1 },
    bodyContent: { padding: 16, gap: 16 },

    card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border },
    identityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: { width: 48, height: 48, borderRadius: 12, backgroundColor: Colors.navyLight, alignItems: 'center', justifyContent: 'center' },
    identityText: { flex: 1 },
    tradingName: { fontSize: 18, fontWeight: '800', color: Colors.text },
    legalName: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },

    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusActive: { backgroundColor: Colors.successLight },
    statusSuspended: { backgroundColor: Colors.dangerLight },
    statusPending: { backgroundColor: Colors.warningLight },
    statusText: { fontSize: 11, fontWeight: '700' },
    textActive: { color: Colors.success },
    textSuspended: { color: Colors.danger },
    textPending: { color: Colors.warning },

    divider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 14 },

    contactGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    contactItem: { flexDirection: 'row', alignItems: 'center', gap: 6, width: '48%' },
    contactText: { fontSize: 12, color: Colors.textSecondary },

    sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginTop: 8 },

    financeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    financeCard: { width: '48%', backgroundColor: Colors.surface, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: Colors.border },
    financeLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 4 },
    financeValue: { fontSize: 18, fontWeight: '800', color: Colors.text },

    contractCard: { backgroundColor: Colors.surface, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, gap: 16 },
    contractHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    contractTitleWrap: { flex: 1 },
    contractTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
    contractSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
    outlineBtn: { borderWidth: 1, borderColor: Colors.adminPrimary, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
    outlineBtnText: { fontSize: 14, fontWeight: '600', color: Colors.adminPrimary },

    actionsContainer: { backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 8 },
    actionRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 14 },
    actionTextWrap: { flex: 1 },
    actionTitle: { fontSize: 15, fontWeight: '600', color: Colors.text },
    actionSubtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
});
