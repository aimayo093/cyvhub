import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Image, TouchableOpacity } from 'react-native';
import { Server, Combine, Users, ArrowRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Link } from 'expo-router';

export default function B2BLogisticsPage() {
    return (
        <ScrollView style={styles.container}>
            {/* HERO SECTION */}
            <View style={styles.heroSection}>
                <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?q=80&w=2070&auto=format&fit=crop' }}
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="cover"
                />
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(15, 23, 42, 0.7)' }]} />
                <View style={styles.heroContent}>
                    <Text style={styles.heroTitle}>Enterprise B2B Logistics</Text>
                    <Text style={styles.heroSubtitle}>
                        Scalable delivery networks, optimized multi-drop routes, and API-first integrations for modern enterprises.
                    </Text>
                </View>
            </View>

            {/* CONTENT SECTION */}
            <View style={styles.section}>
                <View style={styles.contentMax}>
                    <View style={[styles.grid, { flexDirection: Platform.OS === 'web' ? 'row-reverse' : 'column' }]}>
                        <View style={styles.textCol}>
                            <Text style={styles.h2}>Smarter Logistics at Scale</Text>
                            <Text style={styles.p}>
                                Our enterprise B2B platform is built for high-volume dispatch operations. Whether you are moving stock from warehouses to retail outlets or delivering daily supplies across a network of corporate clients, we provide the digital infrastructure and physical fleet to make it seamless.
                            </Text>
                            <Text style={styles.p}>
                                Stop relying on rigid scheduling. Our dynamic AI routing adjusts multi-drop manifests on the fly, saving businesses up to 30% on their overall logistics spend by maximizing vehicle utilization.
                            </Text>

                            <View style={styles.featureList}>
                                <View style={styles.featureRow}>
                                    <Combine size={24} color={Colors.info} />
                                    <Text style={styles.featureText}>Intelligent multi-drop route optimization</Text>
                                </View>
                                <View style={styles.featureRow}>
                                    <Server size={24} color={Colors.info} />
                                    <Text style={styles.featureText}>RESTful API for automated dispatch</Text>
                                </View>
                                <View style={styles.featureRow}>
                                    <Users size={24} color={Colors.info} />
                                    <Text style={styles.featureText}>Dedicated corporate account management</Text>
                                </View>
                            </View>

                            <Link href="/contact" asChild>
                                <TouchableOpacity style={styles.ctaBtn}>
                                    <Text style={styles.ctaBtnText}>Consult an Expert</Text>
                                    <ArrowRight size={20} color="#FFFFFF" />
                                </TouchableOpacity>
                            </Link>
                        </View>

                        <View style={styles.imageCol}>
                            <Image
                                source={{ uri: 'https://images.unsplash.com/photo-1580674684081-7767331afc1e?q=80&w=2070&auto=format&fit=crop' }}
                                style={styles.sideImage}
                                resizeMode="cover"
                            />
                        </View>
                    </View>
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
    heroSection: {
        paddingVertical: Platform.OS === 'web' ? 120 : 80,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroContent: {
        maxWidth: 800,
        alignItems: 'center',
    },
    heroTitle: {
        fontSize: Platform.OS === 'web' ? 56 : 40,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 20,
        textAlign: 'center',
    },
    heroSubtitle: {
        fontSize: Platform.OS === 'web' ? 20 : 18,
        color: '#E2E8F0',
        textAlign: 'center',
        lineHeight: 28,
        maxWidth: 600,
    },
    section: {
        paddingVertical: 80,
        paddingHorizontal: 20,
    },
    contentMax: {
        maxWidth: 1200,
        width: '100%',
        alignSelf: 'center',
    },
    grid: {
        flexDirection: 'column', // Handled dynamically in style array inline
        alignItems: 'center',
    },
    textCol: {
        flex: 1.2,
        marginHorizontal: Platform.OS === 'web' ? 60 : 0,
    },
    imageCol: {
        flex: 1,
        width: '100%',
    },
    h2: {
        fontSize: 36,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 24,
    },
    p: {
        fontSize: 18,
        color: Colors.textSecondary,
        lineHeight: 28,
        marginBottom: 24,
    },
    featureList: {
        marginTop: 16,
        marginBottom: 40,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    featureText: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.text,
        marginLeft: 16,
    },
    sideImage: {
        width: '100%',
        aspectRatio: 4 / 3,
        borderRadius: 24,
    },
    ctaBtn: {
        backgroundColor: Colors.navy,
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
    },
    ctaBtnText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    }
});
