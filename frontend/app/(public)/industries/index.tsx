import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useCMS } from '@/context/CMSContext';
import Colors from '@/constants/colors';
import { 
    BriefcaseMedical, 
    Truck, 
    Monitor, 
    Factory, 
    Plane, 
    Recycle, 
    Settings, 
    Utensils,
    ArrowRight,
    ChevronRight,
    Home,
    ShieldCheck,
    Zap,
    Users
} from 'lucide-react-native';
import Head from 'expo-router/head';
import { LinearGradient } from 'expo-linear-gradient';
import ErrorBoundary from '@/components/ErrorBoundary';
import { hardNavigate } from '@/utils/hardNavigate';

const IconMap: any = {
    'medical-healthcare': BriefcaseMedical,
    'construction-trades': Truck,
    'it-spare-parts-field-service': Monitor,
    'manufacturing-wholesale': Factory,
    'aog-aviation': Plane,
    'reverse-logistics': Recycle,
    'hospitality': Utensils,
    'automotive-parts': Settings,
    'it-tech': Monitor, // Fallback
    'construction-infrastructure': Truck // Fallback
};

function IndustriesIndexPage() {
    const { industriesPage, industryDetails, isLoaded } = useCMS();
    const { width } = useWindowDimensions();
    const router = useRouter();
    const isMobile = width < 480;
    const isSmallTablet = width >= 480 && width < 768;
    const isTablet = width >= 768 && width < 1280;
    const isDesktop = width >= 1280;

    if (!isLoaded) return null;
    
    // ULTRA DEFENSIVE: Ensure we only map valid objects to prevent "indexed property" crashes
    const visibleIndustries = Object.entries(industryDetails || {})
        .filter(([, ind]) => ind && typeof ind === 'object' && ind.publishStatus)
        .map(([slug, ind]) => {
            if (typeof ind !== 'object') return null;
            return { slug, ...ind };
        })
        .filter((ind): ind is any => ind !== null)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

    const config = industriesPage;

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <Head>
                <title>{config?.title || 'Industries'} | CYVhub Logistics</title>
                <meta name="description" content={config?.heroSubtext || 'Industry specialized logistics.'} />
            </Head>

            {/* HERO SECTION - REFINED PREMIUM LOOK */}
            <View style={styles.heroWrapper}>
                <Image 
                    source={{ uri: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070' }} 
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="cover"
                />
                <LinearGradient
                    colors={['rgba(10, 25, 47, 0.95)', 'rgba(10, 25, 47, 0.7)', 'rgba(10, 25, 47, 0.4)']}
                    style={StyleSheet.absoluteFillObject}
                />
                <View style={styles.contentMax}>
                    <View style={styles.heroContent}>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>B2B SECTOR SPECIALISM</Text>
                        </View>
                        <Text style={[styles.heroTitle, isMobile && styles.heroTitleMobile]}>
                            {config?.heroHeading || 'Industries We Serve'}
                        </Text>
                        <Text style={[styles.heroSubtitle, isMobile && styles.heroSubtitleMobile]}>
                            {config?.heroSubtext || 'Discover our sector-specific logistics solutions.'}
                        </Text>
                    </View>
                </View>
            </View>

            {/* BREADCRUMBS - MODERN FLOATING */}
            <View style={styles.breadcrumbWrapper}>
                <View style={styles.contentMax}>
                    <View style={styles.breadcrumbBar}>
                        <TouchableOpacity style={styles.breadcrumbLink} onPress={() => hardNavigate('/', router)}>
                            <Home size={14} color={Colors.textSecondary} />
                            <Text style={styles.breadcrumbText}>Home</Text>
                        </TouchableOpacity>
                        <ChevronRight size={12} color="#CBD5E1" style={{ marginHorizontal: 8 }} />
                        <Text style={[styles.breadcrumbText, { color: Colors.primary, fontWeight: '700' }]}>Industries We Serve</Text>
                    </View>
                </View>
            </View>

            {/* INTRO SECTION - CLEAN & PROFESSIONAL */}
            <View style={styles.introSection}>
                <View style={styles.contentMax}>
                    <View style={[styles.introGrid, !isDesktop && styles.introGridStack]}>
                        <View style={styles.introLeft}>
                            <View style={styles.accentLine} />
                            <Text style={styles.introText}>{config?.introSection || 'Expert logistics for specialized sectors.'}</Text>
                        </View>
                        <View style={styles.introRight}>
                            <Text style={styles.cardIntroHeading}>{config?.cardIntroHeading || 'Why Section Expertise Matters'}</Text>
                            <Text style={styles.cardIntroText}>{config?.cardIntroText || 'Different industries require different handling and standards.'}</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* INDUSTRIES GRID - PREMIUM CARDS */}
            <View style={styles.gridSection}>
                <View style={styles.contentMax}>
                    <View style={styles.grid}>
                        {visibleIndustries.map((ind) => {
                            const IconComponent = IconMap[ind.slug || ind.id] || Truck;
                            return (
                                <TouchableOpacity
                                    key={ind.id}
                                    style={StyleSheet.flatten([
                                        styles.card,
                                        { width: isMobile ? '100%' : isSmallTablet ? '48%' : isTablet ? '31.5%' : '23%' }
                                    ])}
                                    activeOpacity={0.9}
                                    onPress={() => hardNavigate(`/industries/${ind.slug || ind.id}`, router)}
                                >
                                    <View style={styles.cardImageContainer}>
                                        <Image
                                            source={{ uri: ind.heroImageUrl || 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaad5b?q=80&w=1974' }}
                                            style={styles.cardImage}
                                            resizeMode="cover"
                                        />
                                        <LinearGradient
                                            colors={['transparent', 'rgba(15, 23, 42, 0.9)']}
                                            style={styles.cardGradient}
                                        />
                                        <View style={styles.cardIconFloating}>
                                            <IconComponent size={24} color="#FFF" />
                                        </View>
                                    </View>

                                    <View style={styles.cardContent}>
                                        <Text style={styles.cardTitle}>{ind.title}</Text>
                                        <Text style={styles.cardDesc} numberOfLines={3}>
                                            {ind.subtitle || ind.description}
                                        </Text>
                                        
                                        <View style={styles.cardFooter}>
                                            <Text style={styles.exploreText}>Explore Sector</Text>
                                            <View style={styles.arrowCircle}>
                                                <ArrowRight size={14} color="#FFF" />
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </View>

            {/* TRUST FACTORS */}
            <View style={styles.trustSection}>
                <View style={styles.contentMax}>
                    <View style={styles.trustGrid}>
                        <View style={styles.trustItem}>
                            <ShieldCheck size={32} color={Colors.primary} />
                            <Text style={styles.trustTitle}>Industry Compliant</Text>
                            <Text style={styles.trustText}>Meets specific logistics standards for medical, aviation, and construction.</Text>
                        </View>
                        <View style={styles.trustItem}>
                            <Zap size={32} color={Colors.primary} />
                            <Text style={styles.trustTitle}>Time Critical</Text>
                            <Text style={styles.trustText}>Specialized response teams ready for AOG, urgent medical, and site deliveries.</Text>
                        </View>
                        <View style={styles.trustItem}>
                            <Users size={32} color={Colors.primary} />
                            <Text style={styles.trustTitle}>Sector Experts</Text>
                            <Text style={styles.trustText}>Dedicated account managers who understand your industry requirements.</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* CTA SECTION */}
            <View style={styles.ctaWrapper}>
                <View style={styles.contentMax}>
                    <LinearGradient
                        colors={[Colors.navy, '#1e293b']}
                        style={styles.ctaCard}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.ctaContent}>
                            <Text style={styles.ctaTitle}>{config?.ctaHeading || 'Ready to talk?'}</Text>
                            <Text style={styles.ctaDesc}>{config?.ctaText || 'Get in touch for specialized shipping advice.'}</Text>
                            <TouchableOpacity 
                                style={styles.primaryBtn} 
                                onPress={() => hardNavigate('/contact', router)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.primaryBtnText}>{config?.ctaButton || 'Contact Us'}</Text>
                                <ArrowRight size={20} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                </View>
            </View>
        </ScrollView>
    );
}

export default function IndustriesIndexPageWithBoundary() {
    return (
        <ErrorBoundary>
            <IndustriesIndexPage />
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    contentMax: {
        maxWidth: 1280,
        width: '100%',
        alignSelf: 'center',
        paddingHorizontal: 24,
    },
    heroWrapper: {
        height: 500,
        justifyContent: 'center',
        position: 'relative',
        backgroundColor: Colors.navy,
    },
    heroContent: {
        maxWidth: 800,
    },
    badge: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 30,
        alignSelf: 'flex-start',
        marginBottom: 24,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1.5,
    },
    heroTitle: {
        fontSize: 56,
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 24,
        lineHeight: 64,
        letterSpacing: -1,
    },
    heroTitleMobile: {
        fontSize: 36,
        lineHeight: 44,
    },
    heroSubtitle: {
        fontSize: 20,
        color: 'rgba(255, 255, 255, 0.85)',
        lineHeight: 32,
        fontWeight: '400',
    },
    heroSubtitleMobile: {
        fontSize: 18,
        lineHeight: 28,
    },
    breadcrumbWrapper: {
        backgroundColor: '#FFF',
        marginTop: -30,
        zIndex: 10,
    },
    breadcrumbBar: {
        backgroundColor: '#FFF',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 5
    },
    breadcrumbLink: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    breadcrumbText: {
        fontSize: 13,
        color: Colors.textSecondary,
        fontWeight: '600',
        marginLeft: 6,
    },
    introSection: {
        paddingVertical: 100,
        backgroundColor: '#FCFDFF',
    },
    introGrid: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    introGridStack: {
        flexDirection: 'column',
    },
    introLeft: {
        flex: 1.2,
        marginRight: Platform.OS === 'web' ? 60 : 0,
    },
    accentLine: {
        width: 60,
        height: 5,
        backgroundColor: Colors.primary,
        marginBottom: 32,
        borderRadius: 3,
    },
    introText: {
        fontSize: 19,
        color: Colors.textSecondary,
        lineHeight: 34,
        fontWeight: '400',
    },
    introRight: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 40,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.03,
        shadowRadius: 15,
        elevation: 2
    },
    cardIntroHeading: {
        fontSize: 28,
        fontWeight: '900',
        color: Colors.navy,
        marginBottom: 16,
    },
    cardIntroText: {
        fontSize: 16,
        color: Colors.textSecondary,
        lineHeight: 26,
    },
    gridSection: {
        paddingBottom: 100,
        backgroundColor: '#FCFDFF',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 3,
        margin: 12,
    },
    cardImageContainer: {
        height: 200,
        position: 'relative',
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    cardGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60%',
    },
    cardIconFloating: {
        position: 'absolute',
        top: 20,
        right: 20,
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    cardContent: {
        padding: 24,
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: Colors.navy,
        marginBottom: 12,
    },
    cardDesc: {
        fontSize: 15,
        color: Colors.textSecondary,
        lineHeight: 24,
        marginBottom: 20,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    exploreText: {
        color: Colors.navy,
        fontWeight: '800',
        fontSize: 14,
    },
    arrowCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    trustSection: {
        paddingVertical: 80,
        backgroundColor: '#F8FAFC',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#F1F5F9',
    },
    trustGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    trustItem: {
        width: 300,
        alignItems: 'center',
        margin: 20,
    },
    trustTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.navy,
        marginTop: 20,
        marginBottom: 8,
    },
    trustText: {
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    ctaWrapper: {
        paddingVertical: 120,
    },
    ctaCard: {
        borderRadius: 40,
        overflow: 'hidden',
        padding: 80,
        alignItems: 'center',
    },
    ctaContent: {
        alignItems: 'center',
        maxWidth: 800,
    },
    ctaTitle: {
        fontSize: 42,
        fontWeight: '900',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 52,
    },
    ctaDesc: {
        fontSize: 20,
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
        lineHeight: 30,
        marginBottom: 48,
    },
    primaryBtn: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 48,
        paddingVertical: 20,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    primaryBtnText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
        marginLeft: 12,
    },
});
