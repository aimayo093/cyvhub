import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Image, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Clock, Navigation, CheckCircle, ArrowRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Link } from 'expo-router';

export default function SameDayDeliveryPage() {
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    return (
        <ScrollView style={styles.container}>
            {/* HERO SECTION */}
            <View style={[styles.heroSection, { paddingVertical: SCREEN_WIDTH >= 1024 ? 120 : 80 }]}>
                <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?q=80&w=2072&auto=format&fit=crop' }}
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="cover"
                />
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(15, 23, 42, 0.7)' }]} />
                <View style={styles.heroContent}>
                    <Text style={[styles.heroTitle, { fontSize: SCREEN_WIDTH >= 1024 ? 56 : 40 }]}>Same Day Direct Delivery</Text>
                    <Text style={[styles.heroSubtitle, { fontSize: SCREEN_WIDTH >= 1024 ? 20 : 18 }]}>
                        When it absolutely, positively has to be there today. Point-to-point dedicated courier services across mainland UK.
                    </Text>
                </View>
            </View>

            {/* CONTENT SECTION */}
            <View style={styles.section}>
                <View style={styles.contentMax}>
                    <View style={[styles.grid, { flexDirection: SCREEN_WIDTH >= 768 ? 'row' : 'column' }]}>
                        <View style={styles.textCol}>
                            <Text style={styles.h2}>Speed Without Compromise</Text>
                            <Text style={styles.p}>
                                Our Same Day Direct service is designed for urgent, time-critical consignments. Unlike traditional postal networks, your goods never enter a sorting facility. A dedicated vehicle is dispatched to collect your item and drives directly to the destination without any detours.
                            </Text>
                            <Text style={styles.p}>
                                We maintain an average collection time of under 60 minutes across the major UK metropolitan areas, and guarantee direct routing to ensure your package arrives as fast as road conditions allow.
                            </Text>

                            <View style={styles.featureList}>
                                <View style={styles.featureRow}>
                                    <Clock size={24} color={Colors.primary} />
                                    <Text style={styles.featureText}>Collection within 60 minutes</Text>
                                </View>
                                <View style={styles.featureRow}>
                                    <Navigation size={24} color={Colors.primary} />
                                    <Text style={styles.featureText}>Direct point-to-point routing</Text>
                                </View>
                                <View style={styles.featureRow}>
                                    <CheckCircle size={24} color={Colors.primary} />
                                    <Text style={styles.featureText}>Dedicated vehicle exclusively for your goods</Text>
                                </View>
                            </View>

                            <Link 
                                href="/login" 
                                asChild
                                onClick={(e) => {
                                    if (Platform.OS === 'web') {
                                        e.preventDefault();
                                        window.location.href = '/login';
                                    }
                                }}
                            >
                                <TouchableOpacity style={styles.ctaBtn}>
                                    <Text style={styles.ctaBtnText}>Get an Instant Quote</Text>
                                    <ArrowRight size={20} color="#FFFFFF" />
                                </TouchableOpacity>
                            </Link>

                        </View>

                        <View style={styles.imageCol}>
                            <Image
                                source={{ uri: 'https://images.unsplash.com/photo-1621845184288-75c3fd5b8214?q=80&w=2070&auto=format&fit=crop' }}
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
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroContent: {
        maxWidth: 800,
        alignItems: 'center',
    },
    heroTitle: {
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 20,
        textAlign: 'center',
    },
    heroSubtitle: {
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
        alignItems: 'center',
    },
    textCol: {
        flex: 1.2,
        marginRight: Platform.OS === 'web' ? 60 : 0,
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
        backgroundColor: Colors.primary,
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
