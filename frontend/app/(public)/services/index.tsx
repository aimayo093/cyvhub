import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, useWindowDimensions, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useCMS } from '@/context/CMSContext';
import Colors from '@/constants/colors';
import { 
    Clock, 
    Target, 
    Zap, 
    Shield, 
    Package, 
    Users, 
    FileText, 
    Rocket,
    BarChart3,
    Truck,
    Plane,
    Globe,
    ArrowRight,
    Calendar,
    Map,
    Briefcase,
    ArrowLeftRight,
    ShieldCheck,
    Settings
} from 'lucide-react-native';
import Head from 'expo-router/head';

const IconMap: any = {
    Clock, Target, Zap, Shield, Package, Users, FileText, Rocket, BarChart3, Truck, Plane, Globe, Calendar, Map, Briefcase, ArrowLeftRight, ShieldCheck, Settings
};

const DynamicIcon = ({ name, size = 24, color = Colors.primary }: any) => {
    const IconComponent = IconMap[name] || Package;
    return <IconComponent size={size} color={color} />;
};

export default function ServicesHubPage() {
    const { servicesPage, serviceDetails, isLoaded } = useCMS();
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const router = useRouter();

    if (!isLoaded) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    // Sort published services by order - ULTRA DEFENSIVE mapping
    const publishedServices = Object.entries(serviceDetails || {})
        .filter(([, s]) => s && typeof s === 'object' && s.publishStatus)
        .map(([slug, s]) => {
            if (typeof s !== 'object') return null;
            return { ...s, slug: s.slug || slug };
        })
        .filter((s): s is any => s !== null)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

    const isMobile = SCREEN_WIDTH < 768;

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <Head>
                <title>{servicesPage?.title || 'Our Services'} | CYVhub Logistics Solutions</title>
                <meta name="description" content={servicesPage?.introSection?.substring(0, 160) || 'Our professional logistics services.'} />
            </Head>

            {/* HERO SECTION */}
            <View style={[styles.heroSection, { height: isMobile ? 400 : 500 }]}>
                <Image
                    source={{ uri: servicesPage.heroImageUrl }}
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="cover"
                />
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(15, 23, 42, 0.75)' }]} />
                <View style={[styles.contentMax, styles.heroContent]}>
                    <Text style={styles.heroTag}>Logistics Excellence</Text>
                    <Text style={[styles.titleText, { fontSize: isMobile ? 40 : 64, lineHeight: isMobile ? 48 : 72 }]}>
                        {servicesPage.heroHeading}
                    </Text>
                    <Text style={styles.heroSubtitle}>{servicesPage.heroSubtext}</Text>
                </View>
            </View>

            {/* INTRO SECTION */}
            <View style={styles.introSection}>
                <View style={styles.contentMax}>
                    <View style={[styles.introContentInner, { flexDirection: isMobile ? 'column' : 'row' }]}>
                        <View style={styles.introTextCol}>
                            <Text style={styles.sectionHeading}>A Flexible Approach to Logistics</Text>
                            <Text style={styles.introDescription}>{servicesPage.introSection}</Text>
                        </View>
                        <View style={styles.introCardCol}>
                            <View style={styles.glassCard}>
                                <Text style={styles.glassCardText}>{servicesPage.cardIntroText}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>

            {/* SERVICES GRID */}
            <View style={[styles.section, { backgroundColor: '#F8FAFC' }]}>
                <View style={styles.contentMax}>
                    <Text style={styles.gridTitle}>Our Specialist Services</Text>
                    <View style={styles.servicesGrid}>
                        {publishedServices.map((service) => (
                            <TouchableOpacity 
                                key={service.id} 
                                style={[styles.serviceCard, { width: SCREEN_WIDTH >= 1024 ? '31%' : isMobile ? '100%' : '47%' }]}
                                onPress={() => {
                                    if (Platform.OS === 'web') {
                                        window.location.href = `/services/${service.slug}`;
                                    } else {
                                        router.push(`/services/${service.slug}` as any);
                                    }
                                }}
                                activeOpacity={0.9}
                            >
                                <View style={styles.cardImageContainer}>
                                    <Image source={{ uri: service.heroImageUrl }} style={styles.cardImage} resizeMode="cover" />
                                    <View style={styles.cardIconOverlay}>
                                        <DynamicIcon name={service.icon} size={28} color="#FFF" />
                                    </View>
                                </View>
                                <View style={styles.cardContent}>
                                    <Text style={styles.serviceTitle}>{service.title}</Text>
                                    <Text style={styles.serviceDesc} numberOfLines={3}>{service.summary}</Text>
                                    <View style={styles.learnMore}>
                                        <Text style={styles.learnMoreText}>View Resource</Text>
                                        <ArrowRight size={16} color={Colors.primary} />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>

            {/* CTA SECTION */}
            <View style={styles.ctaSection}>
                <View style={styles.contentMax}>
                    <View style={[styles.ctaCard, { padding: isMobile ? 40 : 80 }]}>
                        <Text style={styles.ctaTitle}>{servicesPage.ctaHeading}</Text>
                        <Text style={styles.ctaDesc}>{servicesPage.ctaText}</Text>
                        <TouchableOpacity 
                            style={styles.primaryBtn} 
                            onPress={() => {
                                if (Platform.OS === 'web') {
                                    window.location.href = '/contact';
                                } else {
                                    router.push('/contact');
                                }
                            }}
                        >
                            <Text style={styles.primaryBtnText}>{servicesPage.ctaButton}</Text>
                        </TouchableOpacity>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroSection: {
        width: '100%',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    heroContent: {
        zIndex: 10,
        paddingHorizontal: 20,
    },
    heroTag: {
        color: Colors.primary,
        fontSize: 14,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 16,
    },
    titleText: {
        color: '#FFFFFF',
        fontWeight: '900',
        marginBottom: 24,
    },
    heroSubtitle: {
        fontSize: 18,
        color: 'rgba(255,255,255,0.8)',
        lineHeight: 28,
        maxWidth: 600,
    },
    contentMax: {
        maxWidth: 1280,
        width: '100%',
        alignSelf: 'center',
        paddingHorizontal: 20,
    },
    introSection: {
        paddingVertical: 100,
        backgroundColor: '#FFFFFF',
    },
    introContentInner: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    introTextCol: {
        flex: 1.5,
        marginRight: Platform.OS === 'web' ? 60 : 0,
    },
    sectionHeading: {
        fontSize: 32,
        fontWeight: '800',
        color: Colors.navy,
        marginBottom: 24,
    },
    introDescription: {
        fontSize: 18,
        color: '#64748B',
        lineHeight: 30,
    },
    introCardCol: {
        flex: 1,
    },
    glassCard: {
        backgroundColor: Colors.primary + '05',
        padding: 40,
        borderRadius: 32,
        borderWidth: 1,
        borderColor: Colors.primary + '10',
    },
    glassCardText: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.primary,
        lineHeight: 32,
        fontStyle: 'italic',
    },
    section: {
        paddingVertical: 100,
    },
    gridTitle: {
        fontSize: 36,
        fontWeight: '900',
        color: Colors.navy,
        textAlign: 'center',
        marginBottom: 60,
    },
    servicesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    serviceCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
        margin: 12,
    },
    cardImageContainer: {
        height: 200,
        width: '100%',
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    cardIconOverlay: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardContent: {
        padding: 24,
    },
    serviceTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.navy,
        marginBottom: 12,
    },
    serviceDesc: {
        fontSize: 15,
        color: '#64748B',
        lineHeight: 24,
        marginBottom: 20,
    },
    learnMore: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    learnMoreText: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.primary,
        marginRight: 8,
    },
    ctaSection: {
        paddingVertical: 100,
        backgroundColor: '#FFFFFF',
    },
    ctaCard: {
        backgroundColor: Colors.navy,
        borderRadius: 40,
        alignItems: 'center',
    },
    ctaTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 16,
    },
    ctaDesc: {
        fontSize: 18,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        marginBottom: 40,
        maxWidth: 600,
    },
    primaryBtn: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 32,
        paddingVertical: 18,
        borderRadius: 16,
    },
    primaryBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    },
    ctaBarSubtitle: {
        fontSize: 18,
        color: 'rgba(255,255,255,0.8)',
    },
});
