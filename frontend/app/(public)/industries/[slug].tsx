
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, useWindowDimensions, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import { useCMS } from '@/context/CMSContext';
import Colors from '@/constants/colors';
import { 
    AlertTriangle, 
    Zap, 
    ShieldCheck, 
    ArrowRight, 
    Truck, 
    HardHat, 
    Building2, 
    Settings, 
    Factory, 
    Recycle, 
    Package, 
    Quote,
    BriefcaseMedical,
    Plane,
    Utensils,
    ChevronRight,
    Home,
    CheckCircle2,
    Monitor,
    Shield,
    ShoppingBag,
    ArrowLeft
} from 'lucide-react-native';
import Head from 'expo-router/head';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import ErrorBoundary from '@/components/ErrorBoundary';

const IconMap: any = {
    Truck, 
    AlertTriangle, 
    Zap, 
    ShieldCheck, 
    HardHat, 
    Building2, 
    Settings, 
    Factory, 
    Recycle, 
    Package, 
    BriefcaseMedical, 
    Plane, 
    Utensils, 
    Monitor,
    Shield,
    ShoppingBag
};

const DynamicIcon = ({ name, size = 24, color = Colors.primary }: any) => {
    const IconComponent = IconMap[name] || Package;
    return <IconComponent size={size} color={color} />;
};

function IndustryDetailPage() {
    const { slug } = useLocalSearchParams<{ slug: string }>();
    const { industryDetails, isLoaded } = useCMS();
    const router = useRouter();
    const { width: SCREEN_WIDTH } = useWindowDimensions();

    const config = industryDetails[slug as string];

    if (!isLoaded) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (!config || !config.publishStatus) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorTitle}>Industry Not Found</Text>
                <Text style={styles.errorSubtitle}>We couldn't find the industry you're looking for.</Text>
                <TouchableOpacity style={styles.homeBtn} onPress={() => router.push('/industries')}>
                    <Text style={styles.homeBtnText}>Back to Industries</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const isMobile = SCREEN_WIDTH < 768;

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <Head>
                <title>{config?.metaTitle || `${config?.title || 'Industry'} Specialized Logistics | CYVhub`}</title>
                <meta name="description" content={config?.metaDesc || `Specialized transport and supply chain solutions for the ${config?.title || 'this'} sector. ${config?.subtitle || ''}`} />
            </Head>

            {/* STICKY HEADER / NAV BAR */}
            <View style={styles.headerWrapper}>
                <BlurView intensity={80} style={styles.blurHeader}>
                    <View style={styles.contentMax}>
                        <View style={styles.headerInner}>
                            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                                <ArrowLeft size={20} color={Colors.navy} />
                                <Text style={styles.backBtnText}>Back to Industries</Text>
                            </TouchableOpacity>
                            {!isMobile && (
                                <View style={styles.headerStats}>
                                    <View style={styles.headerStatItem}>
                                        <ShieldCheck size={16} color={Colors.primary} />
                                        <Text style={styles.headerStatText}>Fully Insured</Text>
                                    </View>
                                    <View style={styles.headerStatItem}>
                                        <Zap size={16} color={Colors.primary} />
                                        <Text style={styles.headerStatText}>Rapid Response</Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>
                </BlurView>
            </View>

            {/* HERO SECTION */}
            <View style={[styles.heroSection, { height: isMobile ? 500 : 700 }]}>
                <Image
                    source={{ uri: config?.heroImageUrl || 'https://images.unsplash.com/photo-1565701451180-93bd4f1265a2?q=80&w=2070&auto=format&fit=crop' }}
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="cover"
                />
                <LinearGradient
                    colors={['rgba(15, 23, 42, 0.4)', 'rgba(15, 23, 42, 0.95)']}
                    style={StyleSheet.absoluteFillObject}
                />
                <View style={[styles.contentMax, styles.heroContent]}>
                    <View style={styles.heroTextContainer}>
                        <View style={styles.badge}>
                            <Text style={styles.heroTag}>Sector Specialism</Text>
                        </View>
                        <Text style={[styles.titleText, { fontSize: isMobile ? 48 : 84, lineHeight: isMobile ? 56 : 92 }]}>
                            {config?.title || 'Industry'}
                        </Text>
                        <Text style={styles.heroSubtitle}>{config?.subtitle || 'Specialized logistics solutions'}</Text>

                        <View style={styles.heroActions}>
                            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/contact')}>
                                <Text style={styles.primaryBtnText}>Request a Consultation</Text>
                                <ArrowRight size={20} color="#FFF" />
                            </TouchableOpacity>
                            {!isMobile && (
                                <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/services')}>
                                    <Text style={styles.secondaryBtnText}>View All Services</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
            </View>

            {/* BREADCRUMBS SECURED BELOW HERO ON SCROLL */}
            <View style={styles.breadcrumbBar}>
                <View style={styles.contentMax}>
                    <View style={styles.breadcrumbInner}>
                        <Link href="/" asChild>
                            <TouchableOpacity style={styles.breadcrumbLink}>
                                <Home size={14} color={Colors.textSecondary} />
                                <Text style={styles.breadcrumbText}>Home</Text>
                            </TouchableOpacity>
                        </Link>
                        <ChevronRight size={12} color={Colors.textSecondary} style={{ marginHorizontal: 8 }} />
                        <Link href="/industries" asChild>
                            <TouchableOpacity style={styles.breadcrumbLink}>
                                <Text style={styles.breadcrumbText}>Industries</Text>
                            </TouchableOpacity>
                        </Link>
                        <ChevronRight size={12} color={Colors.textSecondary} style={{ marginHorizontal: 8 }} />
                        <Text style={[styles.breadcrumbText, { color: Colors.primary, fontWeight: '700' }]}>{config?.title || 'Sector'}</Text>
                    </View>
                </View>
            </View>

            {/* OVERVIEW SECTION */}
            <View style={styles.overviewSection}>
                <View style={styles.contentMax}>
                    <View style={[styles.dualLayout, { flexDirection: isMobile ? 'column' : 'row' }]}>
                        <View style={styles.overviewMain}>
                            <View style={styles.tagWrapper}>
                                <View style={styles.activeLine} />
                                <Text style={styles.sectionTag}>Executive Overview</Text>
                            </View>
                            <Text style={styles.overviewText}>{config?.overview || ''}</Text>
                            <Text style={styles.descriptionText}>{config?.description || ''}</Text>
                        </View>
                        <View style={styles.statsSidebar}>
                            {config?.stats && Array.isArray(config.stats) && config.stats.map((stat, index) => (
                                <View key={index} style={styles.statCard}>
                                    <Text style={styles.statValue}>{stat?.value || '-'}</Text>
                                    <Text style={styles.statLabel}>{stat?.label || ''}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            </View>

            {/* PROBLEM & SOLUTION SECTION - DARK THEMED INTERLUDE */}
            <View style={styles.darkSection}>
                <View style={styles.contentMax}>
                    <View style={[styles.dualGrid, { flexDirection: isMobile ? 'column' : 'row' }]}>
                        <View style={styles.contentBlockLight}>
                            <View style={styles.problemHeader}>
                                <AlertTriangle size={32} color="#DC2626" />
                                <Text style={styles.blockTitle}>{config?.problemTitle || 'Industry Challenges'}</Text>
                            </View>
                            <Text style={styles.blockText}>{config?.problemContent || 'Complex logistics demands require specialized solutions.'}</Text>
                        </View>
                        <View style={styles.contentBlockDark}>
                            <LinearGradient
                                colors={[Colors.navy, '#1e293b']}
                                style={StyleSheet.absoluteFillObject}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            />
                            <View style={styles.solutionHeader}>
                                <Zap size={32} color={Colors.primary} />
                                <Text style={[styles.blockTitle, { color: '#FFF' }]}>{config?.solutionTitle || 'CYVhub Solutions'}</Text>
                            </View>
                            {(config?.solutionContent || 'We deliver specialized logistics expertise tailored to your industry.')
                                .split('\n\n')
                                .filter((p: string) => p.trim().length > 0)
                                .map((paragraph: string, idx: number) => (
                                    <Text key={idx} style={[styles.blockText, { color: 'rgba(255,255,255,0.82)', marginBottom: 20, zIndex: 1 }]}>
                                        {paragraph.trim()}
                                    </Text>
                                ))
                            }
                        </View>
                    </View>
                </View>
            </View>

            {/* VALUE PROPOSITION & SERVICES */}
            <View style={styles.section}>
                <View style={styles.contentMax}>
                    <View style={[styles.dualLayout, { flexDirection: isMobile ? 'column' : 'row' }]}>
                        <View style={{ flex: 1, marginRight: isMobile ? 0 : 100, marginBottom: isMobile ? 40 : 0 }}>
                            <Text style={styles.sectionHeaderSmall}>Strategic Advantage</Text>
                            <Text style={styles.subHeaderLarge}>Why Industry Leaders Trust CYVhub</Text>
                             <View style={styles.listContainer}>
                                {config?.whyChooseUs && Array.isArray(config.whyChooseUs) && config.whyChooseUs.map((item: string, idx: number) => (
                                    <View key={idx} style={styles.listItem}>
                                        <View style={styles.checkWrapper}>
                                            <CheckCircle2 size={20} color={Colors.primary} />
                                        </View>
                                        <Text style={styles.listText}>{item || ''}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                        <View style={styles.servicesBox}>
                            <Text style={styles.servicesHeader}>Typical Workflows</Text>
                            <View style={styles.serviceList}>
                                {config?.typicalServices && Array.isArray(config.typicalServices) && config.typicalServices.map((service: string, idx: number) => (
                                    <View key={idx} style={styles.serviceRow}>
                                        <View style={styles.serviceIconWrap}>
                                            <ArrowRight size={14} color={Colors.primary} />
                                        </View>
                                        <Text style={styles.serviceRowText}>{service || ''}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>
                </View>
            </View>

            {/* EQUIPMENT & CAPABILITY */}
            {config?.equipment && Array.isArray(config.equipment) && config.equipment.length > 0 && (
                <View style={styles.lightSection}>
                    <View style={styles.contentMax}>
                        <View style={styles.centeredHeader}>
                            <Text style={styles.sectionTag}>Technical Capability</Text>
                            <Text style={styles.sectionHeaderLarge}>Specialized Fleet & Equipment</Text>
                        </View>
                        <View style={styles.equipmentGrid}>
                            {config.equipment?.map((item: any, index: number) => (
                                <View key={index} style={[styles.equipmentCard, { width: isMobile ? '100%' : '31%' }]}>
                                    <View style={styles.equipmentIconBox}>
                                        <DynamicIcon name={item?.icon || 'Package'} size={32} color={Colors.primary} />
                                    </View>
                                    <Text style={styles.equipmentTitle}>{item?.title || ''}</Text>
                                    <Text style={styles.equipmentDesc}>{item?.desc || ''}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            )}

            {/* QUOTE / CASE STUDY SECTION */}
            {config?.caseStudyQuote && (
                <View style={styles.caseStudySection}>
                    <View style={styles.contentMax}>
                        <View style={styles.caseStudyCard}>
                            <View style={styles.quoteIcon}>
                                <Quote size={60} color={Colors.primary} />
                            </View>
                            <Text style={styles.caseStudyTitle}>{config?.caseStudyTitle || 'Success Narrative'}</Text>
                            <Text style={[styles.caseStudyQuote, { fontSize: isMobile ? 22 : 36 }]}>
                                "{config?.caseStudyQuote || ''}"
                            </Text>
                            <View style={styles.authorBox}>
                                <View style={styles.authorLine} />
                                <Text style={styles.authorName}>{config?.caseStudyAuthor || 'Industry Partner'}</Text>
                                <Text style={styles.authorRole}>Verified Industry Partner</Text>
                            </View>
                        </View>
                    </View>
                </View>
            )}

            {/* FINAL CTA */}
            <View style={styles.ctaWrapper}>
                <LinearGradient
                    colors={[Colors.navy, '#0f172a']}
                    style={styles.ctaSection}
                >
                    <View style={styles.ctaContent}>
                        <Text style={styles.ctaHeadline}>{config?.ctaHeading || 'Ready to Transform Your Logistics?'}</Text>
                        <Text style={styles.ctaSubline}>{config?.ctaText || 'Connect with our industry specialists today.'}</Text>
                        <TouchableOpacity style={styles.whiteBtn} onPress={() => router.push('/contact')}>
                            <Text style={styles.whiteBtnText}>{config?.ctaButtonText || 'Contact Us'}</Text>
                            <ArrowRight size={20} color={Colors.navy} />
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </View>
        </ScrollView>
    );
}

export default function IndustryDetailPageWithBoundary() {
    return (
        <ErrorBoundary>
            <IndustryDetailPage />
        </ErrorBoundary>
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
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        minHeight: 600,
    },
    errorTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: Colors.navy,
        marginBottom: 12,
    },
    errorSubtitle: {
        fontSize: 18,
        color: 'gray',
        marginBottom: 32,
        textAlign: 'center',
    },
    homeBtn: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
    },
    homeBtnText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
    },
    headerWrapper: {
        zIndex: 10,
        backgroundColor: 'transparent',
    },
    blurHeader: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(226, 232, 240, 0.5)',
    },
    headerInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backBtn: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.navy,
        marginLeft: 12,
    },
    headerStats: {
        flexDirection: 'row',
    },
    headerStatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 32,
    },
    headerStatText: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textSecondary,
        marginLeft: 8,
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
        marginTop: -80, // Offset for header overlap effect
    },
    heroContent: {
        zIndex: 1,
    },
    heroTextContainer: {
        maxWidth: 900,
    },
    badge: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(56, 189, 248, 0.15)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 100,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(56, 189, 248, 0.3)',
    },
    heroTag: {
        color: Colors.primary,
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    titleText: {
        fontWeight: '900', 
        color: '#FFF', 
    },
    heroSubtitle: {
        fontSize: 24,
        color: 'rgba(255,255,255,0.7)',
        lineHeight: 38,
        marginTop: 24,
        fontWeight: '500',
    },
    heroActions: {
        flexDirection: 'row',
        marginTop: 48,
    },
    primaryBtn: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 36,
        paddingVertical: 20,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 10,
    },
    primaryBtnText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
        marginRight: 12,
    },
    secondaryBtn: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 36,
        paddingVertical: 20,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        marginLeft: 24,
    },
    secondaryBtnText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    breadcrumbBar: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    breadcrumbInner: {
        flexDirection: 'row',
        alignItems: 'center',
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
    overviewSection: {
        paddingVertical: 100,
        backgroundColor: '#FFFFFF',
    },
    dualLayout: {
    },
    overviewMain: {
        flex: 1.5,
    },
    tagWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    activeLine: {
        width: 40,
        height: 3,
        backgroundColor: Colors.primary,
        borderRadius: 2,
    },
    sectionTag: {
        color: Colors.primary,
        fontWeight: '900',
        fontSize: 13,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginLeft: 16,
    },
    overviewText: {
        fontSize: 26,
        color: Colors.navy,
        lineHeight: 42,
        fontWeight: '700',
        marginBottom: 32,
    },
    descriptionText: {
        fontSize: 18,
        color: Colors.textSecondary,
        lineHeight: 32,
        fontWeight: '400',
    },
    statsSidebar: {
        flex: 1,
        width: '100%',
    },
    statCard: {
        backgroundColor: '#F8FAFC',
        padding: 40,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        elevation: 4,
        marginBottom: 24,
    },
    statValue: {
        fontSize: 48,
        fontWeight: '900',
        color: Colors.primary,
        marginBottom: 8,
    },
    statLabel: {
        fontSize: 14,
        fontWeight: '800',
        color: Colors.navy,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    darkSection: {
        paddingVertical: 100,
        backgroundColor: '#0F172A',
    },
    dualGrid: {
    },
    contentBlockLight: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 56,
        borderRadius: 32,
    },
    contentBlockDark: {
        flex: 1,
        padding: 56,
        borderRadius: 32,
        overflow: 'hidden',
        position: 'relative',
    },
    problemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    solutionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        zIndex: 1,
    },
    blockTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: Colors.navy,
        marginLeft: 16,
    },
    blockText: {
        fontSize: 18,
        color: Colors.textSecondary,
        lineHeight: 30,
        zIndex: 1,
    },
    section: {
        paddingVertical: 120,
    },
    sectionHeaderSmall: {
        color: Colors.primary,
        fontWeight: '900',
        fontSize: 13,
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 16,
    },
    subHeaderLarge: {
        fontSize: 44,
        fontWeight: '900',
        color: Colors.navy,
        marginBottom: 48,
        lineHeight: 54,
    },
    listContainer: {
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    checkWrapper: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    listText: {
        fontSize: 19,
        color: Colors.textSecondary,
        lineHeight: 28,
        fontWeight: '500',
        flex: 1,
        marginLeft: 16,
    },
    servicesBox: {
        flex: 0.9,
        backgroundColor: '#F8FAFC',
        padding: 56,
        borderRadius: 32,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    servicesHeader: {
        fontSize: 24,
        fontWeight: '900',
        color: Colors.navy,
        marginBottom: 40,
    },
    serviceList: {
    },
    serviceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    serviceIconWrap: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
    serviceRowText: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.textSecondary,
        marginLeft: 16,
    },
    lightSection: {
        paddingVertical: 120,
        backgroundColor: '#F8FAFC',
    },
    centeredHeader: {
        alignItems: 'center',
        marginBottom: 80,
    },
    sectionHeaderLarge: {
        fontSize: 44,
        fontWeight: '900',
        color: Colors.navy,
        marginTop: 16,
        textAlign: 'center',
    },
    equipmentGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    equipmentCard: {
        backgroundColor: '#FFFFFF',
        padding: 48,
        borderRadius: 24,
        elevation: 2,
        alignItems: 'flex-start',
        margin: 16,
    },
    equipmentIconBox: {
        width: 64,
        height: 64,
        borderRadius: 16,
        backgroundColor: Colors.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    equipmentTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: Colors.navy,
        marginBottom: 16,
    },
    equipmentDesc: {
        fontSize: 16,
        color: 'gray',
        lineHeight: 26,
    },
    caseStudySection: {
        paddingVertical: 140,
        backgroundColor: '#FFFFFF',
    },
    caseStudyCard: {
        backgroundColor: '#F1F5F9',
        borderRadius: 48,
        padding: 80,
        alignItems: 'center',
        position: 'relative',
    },
    quoteIcon: {
        marginBottom: 40,
        opacity: 0.15,
    },
    caseStudyTitle: {
        color: Colors.primary,
        fontWeight: '900',
        letterSpacing: 2,
        textTransform: 'uppercase',
        fontSize: 14,
        marginBottom: 24,
    },
    caseStudyQuote: {
        fontWeight: '800',
        textAlign: 'center',
        color: Colors.navy,
        lineHeight: 52,
        maxWidth: 900,
    },
    authorBox: {
        marginTop: 48,
        alignItems: 'center',
    },
    authorLine: {
        width: 60,
        height: 2,
        backgroundColor: Colors.primary,
        marginBottom: 16,
    },
    authorName: {
        fontWeight: '900',
        fontSize: 22,
        color: Colors.navy,
    },
    authorRole: {
        color: Colors.primary,
        fontWeight: '700',
        marginTop: 6,
        fontSize: 16,
    },
    ctaWrapper: {
        paddingHorizontal: 24,
        paddingBottom: 48,
        backgroundColor: '#FFFFFF',
    },
    ctaSection: {
        borderRadius: 40,
        paddingVertical: 100,
        alignItems: 'center',
        overflow: 'hidden',
    },
    ctaContent: {
        maxWidth: 800,
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    ctaHeadline: {
        fontSize: 48,
        fontWeight: '900',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 24,
    },
    ctaSubline: {
        fontSize: 22,
        color: '#94A3B8',
        textAlign: 'center',
        marginBottom: 56,
        lineHeight: 34,
        fontWeight: '500',
    },
    whiteBtn: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 48,
        paddingVertical: 22,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 8,
    },
    whiteBtnText: {
        color: Colors.navy,
        fontSize: 20,
        fontWeight: '900',
        marginLeft: 16,
    }
});
