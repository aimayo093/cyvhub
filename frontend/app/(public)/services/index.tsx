import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, useWindowDimensions, ActivityIndicator } from 'react-native';
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
    ArrowRight
} from 'lucide-react-native';
import Head from 'expo-router/head';

const IconMap: any = {
    Clock, Target, Zap, Shield, Package, Users, FileText, Rocket, BarChart3, Truck, Plane, Globe
};

const DynamicIcon = ({ name, size = 24, color = Colors.primary }: any) => {
    const IconComponent = IconMap[name] || Package;
    return <IconComponent size={size} color={color} />;
};

export default function ServicesHubPage() {
    const { servicesPage, isLoaded } = useCMS();
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const router = useRouter();
    const [activeCategory, setActiveCategory] = useState('All');

    if (!isLoaded) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    const categories = ['All', ...new Set(servicesPage.mainServices.map((s: any) => s.category || 'Specialist'))];
    const filteredServices = activeCategory === 'All' 
        ? servicesPage.mainServices 
        : servicesPage.mainServices.filter((s: any) => (s.category || 'Specialist') === activeCategory);

    const isMobile = SCREEN_WIDTH < 768;

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <Head>
                <title>Logistics Services | Same Day, B2B & Specialized Courier | CYVhub</title>
                <meta name="description" content="Explore CYVhub's comprehensive range of logistics services including same-day delivery, B2B logistics, AOG, medical transport, and specialized freight solutions." />
            </Head>

            {/* HERO SECTION */}
            <View style={[styles.heroSection, { height: isMobile ? 350 : 450 }]}>
                <Image
                    source={{ uri: servicesPage.heroImageUrl }}
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="cover"
                />
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(15, 23, 42, 0.75)' }]} />
                <View style={[styles.contentMax, styles.heroContent]}>
                    <Text style={styles.heroTag}>Our Solutions</Text>
                    <Text style={[styles.titleText, { fontSize: isMobile ? 44 : 64, lineHeight: isMobile ? 52 : 72 }]}>
                        {servicesPage.heroTitle}
                    </Text>
                    <Text style={styles.heroSubtitle}>{servicesPage.heroSubtitle}</Text>
                </View>
            </View>

            {/* FILTER SECTION */}
            <View style={styles.filterBar}>
                <View style={[styles.contentMax, styles.filterInner]}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                        {categories.map(cat => (
                            <TouchableOpacity 
                                key={cat} 
                                style={[styles.filterBtn, activeCategory === cat && styles.filterBtnActive]}
                                onPress={() => setActiveCategory(cat)}
                            >
                                <Text style={[styles.filterBtnText, activeCategory === cat && styles.filterBtnTextActive]}>{cat}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>

            {/* SERVICES GRID */}
            <View style={styles.section}>
                <View style={styles.contentMax}>
                    <View style={styles.servicesGrid}>
                        {filteredServices.map((service: any) => (
                            <TouchableOpacity 
                                key={service.id} 
                                style={[styles.serviceCard, { width: SCREEN_WIDTH >= 1024 ? '31%' : isMobile ? '100%' : '47%' }]}
                                onPress={() => router.push(`/services/${service.id}` as any)}
                                activeOpacity={0.9}
                            >
                                <View style={styles.cardImageContainer}>
                                    <Image source={{ uri: service.imageUrl }} style={styles.cardImage} resizeMode="cover" />
                                    <View style={styles.cardIconOverlay}>
                                        <DynamicIcon name={service.icon} size={28} color="#FFF" />
                                    </View>
                                </View>
                                <View style={styles.cardContent}>
                                    <Text style={styles.categoryTag}>{service.category || 'Specialist'}</Text>
                                    <Text style={styles.serviceTitle}>{service.title}</Text>
                                    <Text style={styles.serviceDesc}>{service.description}</Text>
                                    <View style={styles.learnMore}>
                                        <Text style={styles.learnMoreText}>Explore Service</Text>
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
                        <Text style={styles.ctaTitle}>Don't see what you need?</Text>
                        <Text style={styles.ctaDesc}>We specialize in bespoke logistics for high-value and complex cargo. Talk to our solutions team today.</Text>
                        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/contact')}>
                            <Text style={styles.primaryBtnText}>Get a Custom Solution</Text>
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
        minHeight: 400,
    },
    contentMax: {
        maxWidth: 1200,
        width: '100%',
        alignSelf: 'center',
        paddingHorizontal: 24,
    },
    heroSection: {
        position: 'relative',
        justifyContent: 'center',
    },
    heroContent: {
        zIndex: 1,
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
        fontWeight: '900', 
        color: '#FFF', 
        marginBottom: 20,
    },
    heroSubtitle: {
        fontSize: 20,
        color: 'rgba(255,255,255,0.7)',
        lineHeight: 32,
        maxWidth: 700,
    },
    filterBar: {
        backgroundColor: '#F8FAFC',
        paddingVertical: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    filterInner: {
        paddingHorizontal: 12,
    },
    filterScroll: {
        gap: 12,
    },
    filterBtn: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 30,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    filterBtnActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    filterBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.navyMedium,
    },
    filterBtnTextActive: {
        color: '#FFFFFF',
    },
    section: {
        paddingVertical: 80,
    },
    servicesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 32,
        justifyContent: 'center',
    },
    serviceCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)',
    },
    cardImageContainer: {
        height: 200,
        width: '100%',
        position: 'relative',
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    cardIconOverlay: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        zIndex: 2,
    },
    cardContent: {
        padding: 24,
    },
    categoryTag: {
        fontSize: 12,
        fontWeight: '800',
        color: Colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
    },
    serviceTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.navy,
        marginBottom: 12,
    },
    serviceDesc: {
        fontSize: 16,
        color: 'gray',
        lineHeight: 24,
        marginBottom: 24,
    },
    learnMore: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    learnMoreText: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.primary,
    },
    ctaSection: {
        paddingVertical: 80,
    },
    ctaCard: {
        backgroundColor: Colors.navy,
        borderRadius: 40,
        alignItems: 'center',
        textAlign: 'center',
    },
    ctaTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 16,
    },
    ctaDesc: {
        fontSize: 18,
        color: '#94A3B8',
        lineHeight: 28,
        marginBottom: 40,
        maxWidth: 700,
        textAlign: 'center',
    },
    primaryBtn: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 40,
        paddingVertical: 20,
        borderRadius: 12,
    },
    primaryBtnText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
    }
});
