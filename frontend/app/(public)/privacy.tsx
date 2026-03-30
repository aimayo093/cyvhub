import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, useWindowDimensions } from 'react-native';
import Head from 'expo-router/head';
import Colors from '@/constants/colors';


export default function PrivacyPage() {
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    return (
        <ScrollView style={styles.container}>
            <Head>
                <title>Privacy Policy | CYVhub</title>
                <meta name="description" content="CYVhub privacy policy. How Cyvrix Limited collects, uses, and protects your personal data in compliance with UK GDPR and data protection law." />
                <meta property="og:title" content="Privacy Policy | CYVhub" />
                <meta property="og:url" content="https://www.cyvhub.com/privacy" />
                <meta property="og:type" content="website" />
            </Head>
            <View style={[styles.header, { paddingVertical: SCREEN_WIDTH >= 768 ? 80 : 60 }]}>
                <View style={styles.headerContent}>
                    <Text style={[styles.headerTitle, { fontSize: SCREEN_WIDTH >= 768 ? 48 : 36 }]}>Privacy Policy</Text>
                    <Text style={styles.headerSubtitle}>
                        Last updated: {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                    </Text>
                </View>
            </View>

            <View style={styles.content}>
                <View style={styles.documentBody}>
                    <Text style={styles.p}>
                        CYVhub (a brand operated by Cyvrix Limited, "we", "our", or "us") is committed to protecting your privacy. This Privacy Policy outlines how your personal information is collected, used, and shared when you visit or make a booking on our platform.
                    </Text>

                    <Text style={styles.h2}>1. Information We Collect</Text>
                    <Text style={styles.p}>
                        We collect information you provide directly to us when opening a corporate account, booking a delivery, or contacting customer support. This includes:
                    </Text>
                    <View style={styles.ul}>
                        <Text style={styles.li}>• Name, email address, and phone number</Text>
                        <Text style={styles.li}>• Company details and billing addresses</Text>
                        <Text style={styles.li}>• Delivery locations (pickup and drop-off coordinates)</Text>
                        <Text style={styles.li}>• Payment information (processed securely via our PCI-compliant partners)</Text>
                    </View>

                    <Text style={styles.h2}>2. How We Use Your Information</Text>
                    <Text style={styles.p}>
                        We use the collected information primarily to fulfill delivery requests, provide real-time tracking, generate invoices, and communicate with you about your account. Furthermore, anonymized location data is used to optimize our routing algorithms and improve operational efficiency across our fleet.
                    </Text>

                    <Text style={styles.h2}>3. Sharing of Information</Text>
                    <Text style={styles.p}>
                        We only share necessary information with our vetted courier partners (e.g., delivery address and recipient contact details) strictly for the purpose of executing the delivery. We do not sell your personal data to third parties for marketing purposes.
                    </Text>

                    <Text style={styles.h2}>4. GDPR Compliance & Your Rights</Text>
                    <Text style={styles.p}>
                        If you are a resident of the UK/EEA, you have the right to access personal information we hold about you and to ask that your personal information be corrected, updated, or deleted. If you would like to exercise this right, please contact our Data Protection Officer at Cyvrix Limited via privacy@cyvhub.com.
                    </Text>

                    <Text style={styles.h2}>5. Data Retention</Text>
                    <Text style={styles.p}>
                        We maintain booking and invoice records for legal and accounting purposes. We retain your personal data only for as long as necessary to provide our services and fulfill the purposes described in this policy.
                    </Text>

                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        backgroundColor: Colors.surfaceAlt,
        paddingHorizontal: 20,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    headerContent: {
        maxWidth: 800,
        alignItems: 'center',
    },
    headerTitle: {
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 16,
    },
    headerSubtitle: {
        fontSize: 16,
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    content: {
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    documentBody: {
        maxWidth: 800,
        width: '100%',
        alignSelf: 'center',
    },
    h2: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.text,
        marginTop: 40,
        marginBottom: 16,
    },
    p: {
        fontSize: 16,
        color: Colors.textSecondary,
        lineHeight: 28,
        marginBottom: 16,
    },
    ul: {
        marginLeft: 16,
        marginBottom: 16,
    },
    li: {
        fontSize: 16,
        color: Colors.textSecondary,
        lineHeight: 28,
        marginBottom: 8,
    }
});
