import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, Image, ActivityIndicator, Dimensions } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import Head from 'expo-router/head';
import {
    Truck, Clock, ShieldCheck, Zap, ArrowRight, Package, Map,
    CalendarSync, FileText, Box, Archive, BriefcaseMedical,
    Monitor, AlertTriangle, Eye, ArrowLeftRight, HardHat, Building2,
    Settings, Factory, Recycle, ArrowUp, ChevronRight
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useCMS } from '@/context/CMSContext';


const { width: SCREEN_WIDTH } = Dimensions.get('window');

const IconMap: any = {
    Truck, Clock, ShieldCheck, Zap, Package, Map,
    CalendarSync, FileText, Box, Archive, BriefcaseMedical,
    Monitor, AlertTriangle, Eye, ArrowLeftRight, HardHat, Building2,
    Settings, Factory, Recycle
};

const DynamicIcon = ({ name, size = 24, color = Colors.primary, style = {} }: any) => {
    const IconComponent = IconMap[name] || Package;
    return <IconComponent size={size} color={color} style={style} />;
};

export default function ServicesPage() {
    const params = useLocalSearchParams();
    const scrollRef = useRef<ScrollView>(null);
    const { servicesPage: config, isLoaded } = useCMS();
    const [sectionOffsets, setSectionOffsets] = useState<Record<string, number>>({});
    const [showBackToTop, setShowBackToTop] = useState(false);

    useEffect(() => {
        if (isLoaded && params.industry && sectionOffsets[params.industry as string] !== undefined) {
            // Need a slight delay to ensure layout is fully settled
            const timer = setTimeout(() => {
                scrollRef.current?.scrollTo({
                    y: sectionOffsets[params.industry as string],
                    animated: true
                });
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isLoaded, params.industry, sectionOffsets]);

    const handleLayout = (id: string, y: number) => {
        setSectionOffsets(prev => ({ ...prev, [id]: y }));
    };

    const handleScroll = (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        setShowBackToTop(offsetY > 400);
    };

    const scrollToTop = () => {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
    };

    if (!isLoaded) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', minHeight: 400 }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <Head>
                <title>Services — Industry-Specific Courier Solutions | CYVhub</title>
                <meta name="description" content="CYVhub delivers specialist logistics for Construction, IT, Medical, Manufacturing, and Reverse Logistics sectors. Same-day B2B courier services across the UK." />
                <meta property="og:title" content="Services — Industry-Specific Courier Solutions | CYVhub" />
                <meta property="og:description" content="Specialist same-day logistics for Construction, IT, Medical, and Manufacturing sectors. 60-minute collection, live tracking, and full compliance." />
                <meta property="og:image" content="https://www.cyvhub.com/og-image.png" />
                <meta property="og:url" content="https://www.cyvhub.com/services" />
                <meta property="og:type" content="website" />
            </Head>
            <ScrollView
                ref={scrollRef}
                style={styles.container}
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
                onScroll={handleScroll}
            >
                {/* HERO SECTION */}
                <View style={styles.heroSection}>
                    <Image
                        source={{ uri: config.heroImageUrl }}
                        style={StyleSheet.absoluteFillObject}
                        resizeMode="cover"
                    />
                    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(15, 23, 42, 0.75)' }]} />
                    <View style={styles.heroContent}>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>SECTOR-SPECIFIC EXPERTISE</Text>
                        </View>
                        <Text style={styles.heroTitle}>{config.heroTitle}</Text>
                        <Text style={styles.heroSubtitle}>{config.heroSubtitle}</Text>
                    </View>
                </View>

                {/* SPECIALIST DELIVERIES GRID */}
                <View style={[styles.section, { backgroundColor: '#F8FAFC' }]}>
                    <View style={styles.contentMax}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitleCenter}>{config.whatWeDeliverTitle}</Text>
                            <View style={[styles.divider, { alignSelf: 'center', marginBottom: 60 }]} />
                        </View>
                        <View style={styles.deliveryItemsGrid}>
                            {config.deliveryItems.map((item) => (
                                <View key={item.id} style={styles.deliveryItemCard}>
                                    <View style={[styles.iconBox, { backgroundColor: Colors.primary + '15', marginBottom: 20 }]}>
                                        <DynamicIcon name={item.icon} size={32} color={Colors.primary} />
                                    </View>
                                    <Text style={styles.deliveryItemTitle}>{item.title}</Text>
                                    <Text style={styles.deliveryItemDesc}>{item.desc}</Text>
                                    <Link href={item.link as any} asChild>
                                        <TouchableOpacity style={styles.itemLink} activeOpacity={0.7}>
                                            <Text style={styles.itemLinkText}>Learn More</Text>
                                            <ChevronRight size={16} color={Colors.primary} />
                                        </TouchableOpacity>
                                    </Link>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>

                {/* MAIN SERVICES / INDUSTRIES */}
                <View style={[styles.section, { backgroundColor: '#FFFFFF' }]}>
                    <View style={styles.contentMax}>
                        {config.mainServices.map((service, index) => (
                            <View
                                key={service.id}
                                onLayout={(e) => handleLayout(service.id, e.nativeEvent.layout.y)}
                                style={[
                                    styles.serviceBlock,
                                    (index % 2 !== 0 && Platform.OS === 'web') && { flexDirection: 'row-reverse' }
                                ]}
                            >
                                <View style={styles.serviceText}>
                                    <View style={[styles.iconBox, { backgroundColor: Colors.primary + '15' }]}>
                                        <DynamicIcon name={service.icon} size={32} color={Colors.primary} />
                                    </View>
                                    <Text style={styles.serviceTitle}>{service.title}</Text>
                                    <View style={styles.divider} />
                                    <Text style={styles.serviceDesc}>{service.description}</Text>

                                    <View style={styles.featureGrid}>
                                        {service.features.map((feature, fIndex) => (
                                            <View key={fIndex} style={styles.featureItem}>
                                                <View style={styles.checkCircle}>
                                                    <ShieldCheck size={14} color="#FFF" />
                                                </View>
                                                <Text style={styles.featureText}>{feature}</Text>
                                            </View>
                                        ))}
                                    </View>

                                    <View style={styles.actionRow}>
                                        <Link href="/contact" asChild>
                                            <TouchableOpacity style={styles.learnMoreBtn}>
                                                <Text style={styles.learnMoreText}>Discuss Your Requirements</Text>
                                                <ArrowRight size={18} color={Colors.primary} />
                                            </TouchableOpacity>
                                        </Link>

                                        <Link href={`/industries/${service.id}`} asChild>
                                            <TouchableOpacity style={styles.industryDetailBtn}>
                                                <Text style={styles.industryDetailText}>Explore Industry</Text>
                                                <ChevronRight size={18} color={Colors.primary} />
                                            </TouchableOpacity>
                                        </Link>
                                    </View>
                                </View>
                                <View style={styles.serviceImageContainer}>
                                    <Image
                                        source={{ uri: service.imageUrl }}
                                        style={styles.serviceImage}
                                        resizeMode="cover"
                                    />
                                    <View style={styles.imageOverlay} />
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.ctaSection}>
                    <View style={styles.ctaContent}>
                        <Text style={styles.ctaTitle}>{config.ctaTitle}</Text>
                        <Text style={styles.ctaDesc}>{config.ctaDesc}</Text>
                        <Link href={config.ctaBtnUrl as any} asChild>
                            <TouchableOpacity style={styles.ctaBtn} activeOpacity={0.8}>
                                <Text style={styles.ctaBtnText}>{config.ctaBtnText}</Text>
                                <ArrowRight size={20} color={Colors.primary} />
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>
            </ScrollView>

            {showBackToTop && (
                <TouchableOpacity
                    style={styles.backToTop}
                    onPress={scrollToTop}
                    activeOpacity={0.8}
                >
                    <ArrowUp size={24} color="#FFF" />
                </TouchableOpacity>
            )}
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
        paddingVertical: Platform.OS === 'web' ? 120 : 80,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 450,
        position: 'relative',
    },
    heroContent: {
        maxWidth: 800,
        alignItems: 'center',
        zIndex: 1,
    },
    badge: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 50,
        marginBottom: 24,
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1.5,
    },
    heroTitle: {
        fontSize: Platform.OS === 'web' ? 64 : 44,
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 24,
        textAlign: 'center',
        letterSpacing: -1,
    },
    heroSubtitle: {
        fontSize: Platform.OS === 'web' ? 22 : 18,
        color: '#CBD5E1',
        textAlign: 'center',
        lineHeight: 32,
        fontWeight: '500',
        maxWidth: 600,
    },
    section: {
        paddingVertical: 100,
        paddingHorizontal: 24,
    },
    sectionTitleCenter: {
        fontSize: Platform.OS === 'web' ? 42 : 32,
        fontWeight: '800',
        color: Colors.navy,
        textAlign: 'center',
        marginBottom: 16,
    },
    serviceBlock: {
        flexDirection: Platform.OS === 'web' ? 'row' : 'column',
        gap: Platform.OS === 'web' ? 80 : 40,
        marginBottom: 120,
        alignItems: 'center',
    },
    serviceText: {
        flex: 1,
    },
    serviceImageContainer: {
        flex: 1,
        width: '100%',
        aspectRatio: 1.3,
        borderRadius: 32,
        overflow: 'hidden',
        backgroundColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.15,
        shadowRadius: 30,
        elevation: 10,
    },
    serviceImage: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(26, 35, 126, 0.05)',
    },
    iconBox: {
        width: 64,
        height: 64,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    serviceTitle: {
        fontSize: 36,
        fontWeight: '800',
        color: Colors.navy,
        marginBottom: 16,
        letterSpacing: -0.5,
    },
    divider: {
        width: 60,
        height: 4,
        backgroundColor: Colors.primary,
        marginBottom: 24,
        borderRadius: 2,
    },
    serviceDesc: {
        fontSize: 18,
        color: Colors.textSecondary,
        lineHeight: 28,
        marginBottom: 32,
    },
    featureGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 20,
        marginBottom: 40,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        width: Platform.OS === 'web' ? '45%' : '100%',
        gap: 12,
    },
    checkCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureText: {
        fontSize: 16,
        color: Colors.text,
        fontWeight: '600',
    },
    learnMoreBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    learnMoreText: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.primary,
    },
    deliveryItemsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 32,
        justifyContent: 'center',
    },
    deliveryItemCard: {
        width: Platform.OS === 'web' ? 'calc(33.333% - 22px)' as any : '100%',
        minWidth: 300,
        backgroundColor: '#FFFFFF',
        padding: 40,
        borderRadius: 32,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    deliveryItemTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.navy,
        marginBottom: 12,
    },
    deliveryItemDesc: {
        fontSize: 16,
        color: Colors.textSecondary,
        lineHeight: 24,
        marginBottom: 24,
    },
    itemLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    itemLinkText: {
        color: Colors.primary,
        fontWeight: '700',
        fontSize: 14,
    },
    ctaSection: {
        backgroundColor: Colors.navy,
        paddingVertical: 120,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    ctaContent: {
        maxWidth: 800,
        alignItems: 'center',
    },
    ctaTitle: {
        fontSize: 40,
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 20,
        textAlign: 'center',
        letterSpacing: -1,
    },
    ctaDesc: {
        fontSize: 20,
        color: '#94A3B8',
        marginBottom: 48,
        textAlign: 'center',
        lineHeight: 30,
    },
    ctaBtn: {
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingVertical: 20,
        borderRadius: 16,
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    ctaBtnText: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.navy,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 32,
        marginTop: 10,
    },
    industryDetailBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    industryDetailText: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.primary,
    },
    sectionHeader: {
        marginBottom: 60,
    },
    backToTop: {
        position: 'absolute',
        bottom: 40,
        right: 40,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 15,
        zIndex: 100,
    }
});
