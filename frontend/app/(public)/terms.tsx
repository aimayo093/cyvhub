import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, useWindowDimensions } from 'react-native';
import Head from 'expo-router/head';
import Colors from '@/constants/colors';


export default function TermsPage() {
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    return (
        <ScrollView style={styles.container}>
            <Head>
                <title>Terms of Service | CYVhub</title>
                <meta name="description" content="CYVhub terms of service. Your agreement with Cyvrix Limited covering bookings, payments, liability, and usage of the CYVhub courier platform." />
                <meta property="og:title" content="Terms of Service | CYVhub" />
                <meta property="og:url" content="https://www.cyvhub.com/terms" />
                <meta property="og:type" content="website" />
            </Head>
            <View style={[styles.header, { paddingVertical: SCREEN_WIDTH >= 768 ? 80 : 60 }]}>
                <View style={styles.headerContent}>
                    <Text style={[styles.headerTitle, { fontSize: SCREEN_WIDTH >= 768 ? 48 : 36 }]}>Terms of Service</Text>
                    <Text style={styles.headerSubtitle}>
                        Effective Date: {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                    </Text>
                </View>
            </View>

            <View style={styles.content}>
                <View style={styles.documentBody}>
                    <Text style={styles.p}>
                        Welcome to CYVhub (a brand operated by Cyvrix Limited). By accessing our website or utilizing our logistics services, you agree to be bound by the following Terms of Service. Please read them carefully.
                    </Text>

                    <Text style={styles.h2}>1. Services Provided</Text>
                    <Text style={styles.p}>
                        CYVhub provides a technology platform that connects businesses requiring delivery services ("Customers") with independent courier partners and fleets ("Couriers"). CYVhub acts as a logistics broker and technology provider on behalf of Cyvrix Limited.
                    </Text>

                    <Text style={styles.h2}>2. Account Registration</Text>
                    <Text style={styles.p}>
                        Corporate customers must provide accurate and complete information when registering an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                    </Text>

                    <Text style={styles.h2}>3. Booking & Payment</Text>
                    <Text style={styles.p}>
                        Quotes provided on the platform are valid based on the exact dimensions, weight, and postcodes provided. Any discrepancy at the time of collection may result in additional charges. Payments are processed via our secure gateway, and corporate invoices are strictly on 30-day terms unless otherwise agreed.
                    </Text>

                    <Text style={styles.h2}>4. Prohibited Items</Text>
                    <Text style={styles.p}>
                        Customers agree not to ship hazardous materials, illegal substances, live animals, or items requiring specialized licensing without prior written approval from CYVhub. If prohibited items are discovered, the delivery will be halted at the customer's expense.
                    </Text>

                    <Text style={styles.h2}>5. Liability & Insurance</Text>
                    <Text style={styles.p}>
                        Standard deliveries are insured up to £10,000 against loss or damage while in transit. Certain exclusions apply (e.g., fragile glass, undocumented antiques). Customers requiring higher liability coverage must specify this at the time of booking.
                    </Text>

                    <Text style={styles.h2}>6. Cancellation Policy</Text>
                    <Text style={styles.p}>
                        Cancellations made before a courier is dispatched are fully refundable. Cancellations made after a courier has been dispatched to the collection point will incur a "dead run" fee equivalent to 50% of the quoted price or £30, whichever is greater.
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
    }
});
