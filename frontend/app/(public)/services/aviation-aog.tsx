import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, Image, Dimensions, useWindowDimensions } from 'react-native';
import { Link, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { 
    Plane, ShieldCheck, Clock, Zap, ArrowRight, 
    CheckCircle, AlertTriangle, MapPin, Phone
} from 'lucide-react-native';
import Colors from '@/constants/colors';

// Removed static Dimensions get

export default function AviationAOGPage() {
    const router = useRouter();
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    return (
        <View style={{ flex: 1 }}>
            <Head>
                <title>AOG & Aviation Logistics — Mission Critical Support | CYVhub</title>
                <meta name="description" content="Time-critical Aviation & AOG (Aircraft on Ground) logistics. 24/7 priority courier services for aircraft parts, engines, and specialist equipment across the UK." />
            </Head>

            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {/* HERO SECTION */}
                <View style={[styles.heroSection, { paddingVertical: SCREEN_WIDTH >= 1024 ? 140 : 80 }]}>
                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&q=80&w=1200' }}
                        style={StyleSheet.absoluteFillObject}
                        resizeMode="cover"
                    />
                    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(15, 23, 42, 0.7)' }]} />
                    <View style={styles.heroContent}>
                        <View style={styles.badge}>
                            <Plane size={14} color="#FFF" style={{ marginRight: 8 }} />
                            <Text style={styles.badgeText}>MISSION CRITICAL</Text>
                        </View>
                        <Text style={[styles.heroTitle, { fontSize: SCREEN_WIDTH >= 1024 ? 72 : 48 }]}>Aviation & AOG Support</Text>
                        <Text style={[styles.heroSubtitle, { fontSize: SCREEN_WIDTH >= 1024 ? 22 : 18 }]}>
                            When every minute counts, trust the UK's fastest network for aircraft-on-ground logistics. 
                            24/7/365 dedicated response for mission-critical parts.
                        </Text>
                        <View style={[styles.heroActionRow, { flexDirection: SCREEN_WIDTH >= 768 ? 'row' : 'column' }]}>
                            <TouchableOpacity 
                                style={styles.primaryBtn}
                                onPress={() => router.push('/guest-quote?vehicle=Large%20Van&ready=true' as any)}
                            >
                                <Text style={styles.primaryBtnText}>Book Emergency Courier</Text>
                                <ArrowRight size={18} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* KEY CAPABILITIES */}
                <View style={styles.section}>
                    <View style={styles.contentMax}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTag}>CAPABILITIES</Text>
                            <Text style={[styles.sectionTitle, { fontSize: SCREEN_WIDTH >= 768 ? 48 : 36 }]}>Built for High-Stakes Logistics</Text>
                            <Text style={styles.sectionDesc}>
                                We understand that AOG situations cost thousands per hour. Our infrastructure is optimized for immediate response.
                            </Text>
                        </View>

                        <View style={styles.grid}>
                            <View style={[styles.card, { width: SCREEN_WIDTH >= 1024 ? '23%' : SCREEN_WIDTH >= 768 ? '47%' : '100%' }]}>
                                <View style={[styles.iconBox, { backgroundColor: '#EEF2FF' }]}>
                                    <Clock size={28} color={Colors.primary} />
                                </View>
                                <Text style={styles.cardTitle}>60-Min Collection</Text>
                                <Text style={styles.cardText}>Nationwide collection within 60 minutes of booking, 24 hours a day.</Text>
                            </View>

                            <View style={[styles.card, { width: SCREEN_WIDTH >= 1024 ? '23%' : SCREEN_WIDTH >= 768 ? '47%' : '100%' }]}>
                                <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
                                    <ShieldCheck size={28} color="#16A34A" />
                                </View>
                                <Text style={styles.cardTitle}>Specialist Handling</Text>
                                <Text style={styles.cardText}>Drivers trained in handling sensitive avionics, structural components, and engines.</Text>
                            </View>

                            <View style={[styles.card, { width: SCREEN_WIDTH >= 1024 ? '23%' : SCREEN_WIDTH >= 768 ? '47%' : '100%' }]}>
                                <View style={[styles.iconBox, { backgroundColor: '#FFF7ED' }]}>
                                    <MapPin size={28} color="#EA580C" />
                                </View>
                                <Text style={styles.cardTitle}>Airport Specialists</Text>
                                <Text style={styles.cardText}>Direct airside-adjacent deliveries to all major UK airports and private airfields.</Text>
                            </View>

                            <View style={[styles.card, { width: SCREEN_WIDTH >= 1024 ? '23%' : SCREEN_WIDTH >= 768 ? '47%' : '100%' }]}>
                                <View style={[styles.iconBox, { backgroundColor: '#FEF2F2' }]}>
                                    <Zap size={28} color="#DC2626" />
                                </View>
                                <Text style={styles.cardTitle}>Real-Time Tracking</Text>
                                <Text style={styles.cardText}>Live GPS tracking and instant digital proof of delivery for total visibility.</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* AOG WORKFLOW */}
                <View style={[styles.section, { backgroundColor: '#F8FAFC' }]}>
                    <View style={styles.contentMax}>
                        <View style={[styles.splitRow, { flexDirection: SCREEN_WIDTH >= 768 ? 'row' : 'column' }]}>
                            <View style={styles.splitText}>
                                <Text style={styles.sectionTag}>OUR PROCESS</Text>
                                <Text style={[styles.sectionTitle, { fontSize: SCREEN_WIDTH >= 768 ? 48 : 36, textAlign: 'left' }]}>The AOG Response Protocol</Text>
                                <View style={styles.stepRow}>
                                    <View style={styles.stepNum}><Text style={styles.stepNumText}>1</Text></View>
                                    <View style={styles.stepInfo}>
                                        <Text style={styles.stepTitle}>Immediate Dispatch</Text>
                                        <Text style={styles.stepDesc}>Once booked, the nearest suitable dedicated vehicle is dispatched instantly.</Text>
                                    </View>
                                </View>
                                <View style={styles.stepRow}>
                                    <View style={styles.stepNum}><Text style={styles.stepNumText}>2</Text></View>
                                    <View style={styles.stepInfo}>
                                        <Text style={styles.stepTitle}>Secure Transit</Text>
                                        <Text style={styles.stepDesc}>Dedicated vehicles only. No co-loading. Your parts are the only priority.</Text>
                                    </View>
                                </View>
                                <View style={styles.stepRow}>
                                    <View style={styles.stepNum}><Text style={styles.stepNumText}>3</Text></View>
                                    <View style={styles.stepInfo}>
                                        <Text style={styles.stepTitle}>Direct Handover</Text>
                                        <Text style={styles.stepDesc}>Direct delivery to the hangar or airside gate with instant POD notification.</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.splitImageContainer}>
                                <Image 
                                    source={{ uri: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=1200' }} 
                                    style={styles.splitImage} 
                                />
                                <View style={styles.imageOverlay} />
                            </View>
                        </View>
                    </View>
                </View>

                {/* CTA */}
                <View style={styles.ctaSection}>
                    <View style={styles.ctaContent}>
                        <Text style={[styles.ctaTitle, { fontSize: SCREEN_WIDTH >= 768 ? 56 : 36 }]}>Minimize Downtime Today</Text>
                        <Text style={styles.ctaDesc}>Join hundreds of aviation partners who trust CYVhub for their most critical logistics needs.</Text>
                        <View style={[styles.ctaActions, { flexDirection: SCREEN_WIDTH >= 768 ? 'row' : 'column' }]}>
                            <TouchableOpacity 
                                style={styles.ctaPrimaryBtn}
                                onPress={() => router.push('/guest-quote' as any)}
                            >
                                <Text style={styles.ctaPrimaryBtnText}>Get Emergency Quote</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.ctaSecondaryBtn}
                                onPress={() => router.push('/contact' as any)}
                            >
                                <Phone size={18} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={styles.ctaSecondaryBtnText}>24/7 AOG Desk</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    contentMax: {
        maxWidth: 1200,
        width: '100%',
        alignSelf: 'center',
    },
    heroSection: {
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 550,
        position: 'relative',
    },
    heroContent: {
        maxWidth: 850,
        alignItems: 'center',
        zIndex: 1,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#DC2626',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 50,
        marginBottom: 32,
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 2,
    },
    heroTitle: {
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 24,
        textAlign: 'center',
        letterSpacing: -1.5,
    },
    heroSubtitle: {
        color: '#E2E8F0',
        textAlign: 'center',
        lineHeight: 34,
        fontWeight: '500',
        maxWidth: 700,
        marginBottom: 48,
    },
    heroActionRow: {
    },
    primaryBtn: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingVertical: 20,
        borderRadius: 16,
    },
    primaryBtnText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
    },
    section: {
        paddingVertical: 120,
        paddingHorizontal: 24,
    },
    sectionHeader: {
        alignItems: 'center',
        marginBottom: 80,
        maxWidth: 800,
        alignSelf: 'center',
    },
    sectionTag: {
        color: Colors.primary,
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 3,
        marginBottom: 16,
        textTransform: 'uppercase',
    },
    sectionTitle: {
        fontWeight: '900',
        color: '#0F172A',
        textAlign: 'center',
        marginBottom: 24,
        letterSpacing: -1,
    },
    sectionDesc: {
        fontSize: 20,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 30,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    card: {
        minWidth: 260,
        backgroundColor: '#FFFFFF',
        padding: 32,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 5,
    },
    iconBox: {
        width: 60,
        height: 60,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 12,
    },
    cardText: {
        fontSize: 16,
        color: '#64748B',
        lineHeight: 24,
    },
    splitRow: {
        alignItems: 'center',
    },
    splitText: {
        flex: 1,
    },
    splitImageContainer: {
        flex: 1.2,
        width: '100%',
        aspectRatio: 1.4,
        borderRadius: 40,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.2,
        shadowRadius: 30,
        elevation: 15,
    },
    splitImage: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(26, 35, 126, 0.1)',
    },
    stepRow: {
        flexDirection: 'row',
        marginBottom: 40,
    },
    stepNum: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    stepNumText: {
        fontSize: 20,
        fontWeight: '900',
        color: Colors.primary,
    },
    stepInfo: {
        flex: 1,
    },
    stepTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 8,
    },
    stepDesc: {
        fontSize: 18,
        color: '#64748B',
        lineHeight: 28,
        maxWidth: 500,
    },
    ctaSection: {
        backgroundColor: '#0F172A',
        paddingVertical: 120,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    ctaContent: {
        maxWidth: 800,
        alignItems: 'center',
    },
    ctaTitle: {
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 24,
        textAlign: 'center',
        letterSpacing: -1.5,
    },
    ctaDesc: {
        fontSize: 22,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 32,
        marginBottom: 56,
    },
    ctaActions: {
    },
    ctaPrimaryBtn: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 48,
        paddingVertical: 20,
        borderRadius: 16,
        marginRight: Platform.OS === 'web' ? 20 : 0,
        marginBottom: Platform.OS === 'web' ? 0 : 20,
    },
    ctaPrimaryBtnText: {
        color: '#0F172A',
        fontSize: 18,
        fontWeight: '900',
    },
    ctaSecondaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 48,
        paddingVertical: 20,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    ctaSecondaryBtnText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
    },
});
