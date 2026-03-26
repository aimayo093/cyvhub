import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Shield, FileText, CheckCircle } from 'lucide-react-native';
import Head from 'expo-router/head';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';

export default function TermsPage() {
    const { userRole } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const isDriver = userRole === 'driver';
    const isCarrier = userRole === 'carrier';
    const isCustomer = userRole === 'customer';

    const getTitle = () => {
        if (isDriver) return 'Driver Terms of Service';
        if (isCarrier) return 'Carrier Service Agreement';
        return 'Terms of Service';
    };

    return (
        <View style={styles.wrapper}>
            <Head>
                <title>{getTitle()} | CYVhub</title>
                <meta name="description" content="CYVhub terms and conditions for our partners and customers." />
            </Head>

            <View style={[styles.navbar, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={20} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.navTitle}>{getTitle()}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
                <View style={styles.content}>
                    <Text style={styles.lastUpdated}>Last Updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
                    
                    <Text style={styles.p}>
                        CYVhub is a brand operated by <Text style={{ fontWeight: '700' }}>Cyvrix Limited</Text>. By using our platform, you agree to these terms.
                    </Text>

                    {isDriver && (
                        <>
                            <Text style={styles.h2}>1. Independent Contractor Status</Text>
                            <Text style={styles.p}>
                                You acknowledge that you are an independent contractor and not an employee of Cyvrix Limited. You are responsible for your own taxes, National Insurance, and equipment.
                            </Text>
                            <Text style={styles.h2}>2. Insurance & Compliance</Text>
                            <Text style={styles.p}>
                                Drivers must maintain valid Goods in Transit and Hire & Reward insurance at all times. Failure to provide proof of valid documentation will result in immediate account suspension.
                            </Text>
                            <Text style={styles.h2}>3. Performance Metrics</Text>
                            <Text style={styles.p}>
                                Your access to high-value jobs is determined by your rating, punctuality, and compliance score. Persistent delays or damaged goods will lower your rank.
                            </Text>
                        </>
                    )}

                    {isCarrier && (
                        <>
                            <Text style={styles.h2}>1. Service Level Agreement (SLA)</Text>
                            <Text style={styles.p}>
                                As a Carrier Partner, you agree to meet a minimum 98% on-time delivery rate. Performance is audited monthly. Repeated failures to meet SLAs may result in contract termination.
                            </Text>
                            <Text style={styles.h2}>2. Sub-Contracting</Text>
                            <Text style={styles.p}>
                                Carriers may only sub-contract to drivers who meet the same compliance standards as specified by CYVhub. You remain fully liable for the actions of any sub-contracted personnel.
                            </Text>
                            <Text style={styles.h2}>3. Payment Terms</Text>
                            <Text style={styles.p}>
                                Carrier settlements are processed on a weekly basis, subject to a 7-day verification period following job completion. All invoices must be submitted via the platform.
                            </Text>
                        </>
                    )}

                    {(!isDriver && !isCarrier) && (
                        <>
                            <Text style={styles.h2}>1. Booking Policy</Text>
                            <Text style={styles.p}>
                                Quotes are generated based on provided weight and dimensions. Cyvrix Limited reserves the right to adjust billing if the actual consignment differs from the booking details.
                            </Text>
                            <Text style={styles.h2}>2. Liability Limits</Text>
                            <Text style={styles.p}>
                                Standard transit liability is limited to £10,000. For high-value consignments, additional coverage must be purchased at the point of booking.
                            </Text>
                            <Text style={styles.h2}>3. Professional Use</Text>
                            <Text style={styles.p}>
                                Business accounts are strictly for professional logistics use. Abuse of the platform or fraudulent bookings will result in immediate termination.
                            </Text>
                        </>
                    )}

                    <Text style={styles.h2}>General Provisions</Text>
                    <Text style={styles.p}>
                        These terms are governed by the laws of England and Wales. Cyvrix Limited reserves the right to update these terms at any time with 30 days notice to active users.
                    </Text>

                    <View style={styles.footerInfo}>
                        <Shield size={16} color={Colors.primary} />
                        <Text style={styles.footerText}>Secure & Verified by Cyvrix Legal</Text>
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
        padding: 16, backgroundColor: Colors.surfaceAlt, borderRadius: 12,
    },
    footerText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
});
