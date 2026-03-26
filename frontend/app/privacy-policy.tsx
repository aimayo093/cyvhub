import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Shield, Lock, Eye } from 'lucide-react-native';
import Head from 'expo-router/head';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';

export default function PrivacyPolicyPage() {
    const { userRole } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const isDriver = userRole === 'driver';
    const isCarrier = userRole === 'carrier';

    return (
        <View style={styles.wrapper}>
            <Head>
                <title>Privacy Policy | CYVhub</title>
                <meta name="description" content="CYVhub Privacy Policy. How Cyvrix Limited protects your data." />
            </Head>

            <View style={[styles.navbar, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={20} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.navTitle}>Privacy Policy</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
                <View style={styles.content}>
                    <Text style={styles.lastUpdated}>Version 2.4 - {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</Text>
                    
                    <Text style={styles.p}>
                        At CYVhub, operated by Cyvrix Limited, we take your privacy seriously. This policy explains how we collect and use your personal data.
                    </Text>

                    {isDriver && (
                        <>
                            <Text style={styles.h2}>1. Real-Time Location Tracking</Text>
                            <Text style={styles.p}>
                                To provide accurate delivery estimates and safety monitoring, we collect background location data while the app is active and you are marked as 'On Duty'. This data is shared only with the relevant customer for the duration of their delivery.
                            </Text>
                            <Text style={styles.h2}>2. Identification & Background Checks</Text>
                            <Text style={styles.p}>
                                We process your government-issued ID and driving history to verify your eligibility. This data is stored securely and accessed only by our compliance team.
                            </Text>
                        </>
                    )}

                    {isCarrier && (
                        <>
                            <Text style={styles.h2}>1. Fleet & Operational Data</Text>
                            <Text style={styles.p}>
                                We collect data regarding your fleet capacity, vehicle registrations, and insurance coverage. This is used to match your company with appropriate enterprise-level contracts.
                            </Text>
                            <Text style={styles.h2}>2. Financial Information</Text>
                            <Text style={styles.p}>
                                Bank details and VAT registration info are processed via our secure payment partners (Stripe) to facilitate automated settlement.
                            </Text>
                        </>
                    )}

                    <Text style={styles.h2}>Data Sharing</Text>
                    <Text style={styles.p}>
                        We never sell your data to third parties. We share data only with service providers (e.g., Stripe, AWS, Resend) necessary to operate the platform.
                    </Text>

                    <Text style={styles.h2}>Your Rights</Text>
                    <Text style={styles.p}>
                        Under UK GDPR, you have the right to access, correct, or request the deletion of your data. Contact our Data Protection Officer at dpo@cyvhub.com for any inquiries.
                    </Text>

                    <View style={styles.footerInfo}>
                        <Lock size={16} color={Colors.success} />
                        <Text style={styles.footerText}>GDPR Compliant & Encrypted</Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: { flex: 1, backgroundColor: '#fff' },
    navbar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    backBtn: { padding: 8 },
    navTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
    container: { flex: 1 },
    content: { padding: 24 },
    lastUpdated: { fontSize: 13, color: Colors.textMuted, marginBottom: 24, fontWeight: '600' },
    h2: { fontSize: 20, fontWeight: '800', color: Colors.text, marginTop: 32, marginBottom: 16 },
    p: { fontSize: 15, color: Colors.textSecondary, lineHeight: 26, marginBottom: 16 },
    footerInfo: {
        flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 40,
        padding: 16, backgroundColor: Colors.successLight + '20', borderRadius: 12,
    },
    footerText: { fontSize: 13, fontWeight: '600', color: Colors.success },
});
