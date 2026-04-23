import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Image, TouchableOpacity } from 'react-native';
import { Leaf, BatteryCharging, Wind, ArrowRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Link } from 'expo-router';

export default function GreenFleetPage() {
    return (
        <ScrollView style={styles.container}>
            {/* HERO SECTION */}
            <View style={styles.heroSection}>
                <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?q=80&w=2072&auto=format&fit=crop' }}
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="cover"
                />
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(21, 128, 61, 0.85)' }]} />
                <View style={styles.heroContent}>
                    <Text style={styles.heroTitle}>Sustainable Green Fleet</Text>
                    <Text style={styles.heroSubtitle}>
                        Zero-emission logistics for the modern city. Delivering exceptional service while protecting our planet.
                    </Text>
                </View>
            </View>

            {/* CONTENT SECTION */}
            <View style={styles.section}>
                <View style={styles.contentMax}>
                    <View style={styles.grid}>
                        <View style={styles.textCol}>
                            <Text style={styles.h2}>Driving Towards Zero</Text>
                            <Text style={styles.p}>
                                Urban logistics is changing. CYVhub is at the forefront of the green revolution, aggressively replacing combustion vehicles with 100% electric vans and specialized cargo bikes in every major UK city center.
                            </Text>
                            <Text style={styles.p}>
                                Not only does our Green Fleet help your business hit its ESG and sustainability targets, but it also allows us to bypass Ultra Low Emission Zone (ULEZ) charges and navigate through dense traffic faster using dedicated cycle infrastructure.
                            </Text>

                            <View style={styles.featureList}>
                                <View style={styles.featureRow}>
                                    <Leaf size={24} color={Colors.success} />
                                    <Text style={styles.featureText}>Carbon-offset guarantees on all deliveries</Text>
                                </View>
                                <View style={styles.featureRow}>
                                    <BatteryCharging size={24} color={Colors.success} />
                                    <Text style={styles.featureText}>100% electric vehicle and cargo-bike fleet</Text>
                                </View>
                                <View style={styles.featureRow}>
                                    <Wind size={24} color={Colors.success} />
                                    <Text style={styles.featureText}>Detailed emissions reporting for ESG</Text>
                                </View>
                            </View>

                            <Link 
                                href="/about" 
                                asChild
                                onClick={(e) => {
                                    if (Platform.OS === 'web') {
                                        e.preventDefault();
                                        window.location.href = '/about';
                                    }
                                }}
                            >
                                <TouchableOpacity style={styles.ctaBtn}>
                                    <Text style={styles.ctaBtnText}>Read our Sustainability Report</Text>
                                    <ArrowRight size={20} color="#FFFFFF" />
                                </TouchableOpacity>
                            </Link>

                        </View>

                        <View style={styles.imageCol}>
                            <Image
                                source={{ uri: 'https://images.unsplash.com/photo-1502570149819-b2260483d302?q=80&w=2070&auto=format&fit=crop' }}
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
        color: '#DCFCE7',
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
        flexDirection: Platform.OS === 'web' ? 'row' : 'column',
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
        backgroundColor: Colors.success,
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
