import React from 'react';
import {
    View, Text, StyleSheet, ScrollView, Image,
    TouchableOpacity, useWindowDimensions, ActivityIndicator, Pressable
} from 'react-native';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import { useCMS } from '@/context/CMSContext';
import Colors from '@/constants/colors';
import {
    AlertTriangle, Zap, ShieldCheck, ArrowRight, Truck, HardHat,
    Building2, Settings, Factory, Recycle, Package, Quote,
    BriefcaseMedical, Plane, Utensils, ChevronRight, Home,
    CheckCircle2, Monitor, Shield, ShoppingBag, ArrowLeft,
    ArrowLeftRight, MapPin, Clock, Phone
} from 'lucide-react-native';
import Head from 'expo-router/head';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import ErrorBoundary from '@/components/ErrorBoundary';

const IconMap: any = {
    Truck, AlertTriangle, Zap, ShieldCheck, HardHat, Building2,
    Settings, Factory, Recycle, Package, BriefcaseMedical, Plane,
    Utensils, Monitor, Shield, ShoppingBag, ArrowLeftRight,
};

const DynamicIcon = ({ name, size = 24, color = Colors.primary }: any) => {
    const C = IconMap[name] || Package;
    return <C size={size} color={color} />;
};

// Industry accent colors for visual variety
const ACCENT_COLORS: Record<string, string> = {
    'medical-healthcare':        '#0D9488',
    'construction-trades':       '#F59E0B',
    'it-spare-parts-field-service': '#6366F1',
    'manufacturing-wholesale':   '#0EA5E9',
    'aog-aviation':              '#EF4444',
    'reverse-logistics':         '#10B981',
    'automotive-parts':          '#F97316',
    'hospitality':               '#EC4899',
};

function IndustryDetailPage() {
    const { slug } = useLocalSearchParams<{ slug: string }>();
    const { industryDetails, isLoaded } = useCMS();
    const router = useRouter();
    const { width: W } = useWindowDimensions();
    const isMobile = W < 768;
    const isTablet = W >= 768 && W < 1100;

    const config = industryDetails[slug as string];
    const accent = ACCENT_COLORS[slug as string] || Colors.primary;

    if (!isLoaded) {
        return (
            <View style={s.centered}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={s.loadingText}>Loading…</Text>
            </View>
        );
    }

    if (!config || !config.publishStatus) {
        return (
            <View style={s.centered}>
                <Package size={64} color={Colors.textMuted} />
                <Text style={s.errTitle}>Industry Not Found</Text>
                <Text style={s.errSub}>We couldn't find the industry you're looking for.</Text>
                <TouchableOpacity style={[s.pill, { backgroundColor: Colors.primary }]} onPress={() => router.push('/industries')}>
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>← Back to Industries</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const solutionParagraphs = (config.solutionContent || '')
        .split('\n\n')
        .map((p: string) => p.trim())
        .filter((p: string) => p.length > 0);

    const benefits = config.whyChooseUs || [];
    const mid = Math.ceil(benefits.length / 2);
    const col1 = benefits.slice(0, mid);
    const col2 = benefits.slice(mid);

    return (
        <ScrollView style={s.root} showsVerticalScrollIndicator={false}>
            <Head>
                <title>{config.metaTitle || `${config.title} Logistics | CYVhub`}</title>
                <meta name="description" content={config.metaDesc || config.description} />
            </Head>

            {/* ── HERO ── */}
            <View style={{ height: isMobile ? 560 : 720, position: 'relative' }}>
                <Image
                    source={{ uri: config.heroImageUrl }}
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="cover"
                />
                <LinearGradient
                    colors={['rgba(10,14,30,0.25)', 'rgba(10,14,30,0.88)']}
                    style={StyleSheet.absoluteFillObject}
                />
                {/* accent bar */}
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: accent }} />

                {/* back button */}
                <TouchableOpacity
                    style={s.backBtn}
                    onPress={() => router.push('/industries')}
                >
                    <BlurView intensity={40} style={s.backBlur}>
                        <ArrowLeft size={18} color="#fff" />
                        <Text style={s.backText}>Industries</Text>
                    </BlurView>
                </TouchableOpacity>

                {/* hero content */}
                <View style={[s.heroContent, { paddingHorizontal: isMobile ? 24 : 60 }]}>
                    {/* badge */}
                    <View style={[s.badge, { borderColor: accent + '60', backgroundColor: accent + '22' }]}>
                        <DynamicIcon name={config.icon} size={16} color={accent} />
                        <Text style={[s.badgeText, { color: accent }]}>Sector Specialism</Text>
                    </View>

                    <Text style={[s.heroTitle, { fontSize: isMobile ? 42 : isTablet ? 64 : 80 }]}>
                        {config.title}
                    </Text>
                    <Text style={[s.heroTagline, { fontSize: isMobile ? 18 : 24 }]}>
                        {config.subtitle}
                    </Text>

                    <View style={s.heroActions}>
                        <TouchableOpacity
                            style={[s.heroCta, { backgroundColor: accent }]}
                            onPress={() => router.push('/contact')}
                        >
                            <Text style={s.heroCtaText}>Get a Tailored Quote</Text>
                            <ArrowRight size={18} color="#fff" />
                        </TouchableOpacity>
                        {!isMobile && (
                            <TouchableOpacity
                                style={s.heroCtaGhost}
                                onPress={() => router.push('/services')}
                            >
                                <Text style={s.heroCtaGhostText}>View All Services</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>

            {/* ── BREADCRUMB ── */}
            <View style={s.breadcrumbBar}>
                <View style={[s.row, { paddingHorizontal: isMobile ? 20 : 60 }]}>
                    <Link href="/" asChild>
                        <TouchableOpacity style={s.row}>
                            <Home size={13} color={Colors.textMuted} />
                            <Text style={s.crumbText}>Home</Text>
                        </TouchableOpacity>
                    </Link>
                    <ChevronRight size={12} color={Colors.textMuted} style={{ marginHorizontal: 8 }} />
                    <Link href="/industries" asChild>
                        <TouchableOpacity>
                            <Text style={s.crumbText}>Industries</Text>
                        </TouchableOpacity>
                    </Link>
                    <ChevronRight size={12} color={Colors.textMuted} style={{ marginHorizontal: 8 }} />
                    <Text style={[s.crumbText, { color: accent, fontWeight: '700' }]}>{config.title}</Text>
                </View>
            </View>

            {/* ── OVERVIEW STRIP ── */}
            <View style={[s.overviewStrip, { paddingHorizontal: isMobile ? 24 : 60 }]}>
                <View style={{ maxWidth: 1100, alignSelf: 'center', width: '100%' }}>
                    <View style={[s.row, { flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center' }]}>
                        <View style={[s.accentLine, { backgroundColor: accent }]} />
                        <Text style={s.overviewText}>{config.description}</Text>
                    </View>
                </View>
            </View>

            {/* ── THE CHALLENGE ── */}
            <View style={s.challengeSection}>
                <LinearGradient colors={['#0a0e1e', '#0f172a']} style={StyleSheet.absoluteFillObject} />
                <View style={[s.sectionInner, { paddingHorizontal: isMobile ? 24 : 60 }]}>
                    <View style={[s.challengeCard, { flexDirection: isMobile ? 'column' : 'row' }]}>
                        <View style={s.challengeIconCol}>
                            <View style={[s.challengeIconWrap, { borderColor: '#DC2626' + '40' }]}>
                                <AlertTriangle size={40} color="#DC2626" />
                            </View>
                            <Text style={s.challengeLabel}>THE CHALLENGE</Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: isMobile ? 0 : 48, marginTop: isMobile ? 32 : 0 }}>
                            <Text style={s.challengeTitle}>{config.problemTitle}</Text>
                            <Text style={s.challengeBody}>{config.problemContent}</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* ── HOW CYVHUB HELPS ── */}
            <View style={[s.helpSection, { paddingHorizontal: isMobile ? 24 : 60 }]}>
                <View style={{ maxWidth: 1100, alignSelf: 'center', width: '100%' }}>
                    {/* section header */}
                    <View style={s.sectionHeader}>
                        <View style={[s.headerPill, { backgroundColor: accent + '18', borderColor: accent + '40' }]}>
                            <Zap size={14} color={accent} />
                            <Text style={[s.headerPillText, { color: accent }]}>HOW WE HELP</Text>
                        </View>
                        <Text style={[s.sectionTitle, { fontSize: isMobile ? 32 : 48 }]}>
                            {config.solutionTitle}
                        </Text>
                    </View>

                    {/* numbered paragraphs */}
                    {solutionParagraphs.map((para: string, idx: number) => (
                        <View key={idx} style={[s.helpCard, isMobile && { flexDirection: 'column' }]}>
                            <View style={[s.helpNum, { backgroundColor: accent }]}>
                                <Text style={s.helpNumText}>{String(idx + 1).padStart(2, '0')}</Text>
                            </View>
                            <View style={{ flex: 1, marginLeft: isMobile ? 0 : 32, marginTop: isMobile ? 20 : 0 }}>
                                <Text style={s.helpPara}>{para}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </View>

            {/* ── KEY BENEFITS ── */}
            <View style={s.benefitsSection}>
                <LinearGradient colors={[accent + '12', '#f8fafc']} style={StyleSheet.absoluteFillObject} />
                <View style={[s.sectionInner, { paddingHorizontal: isMobile ? 24 : 60 }]}>
                    <View style={{ maxWidth: 1100, alignSelf: 'center', width: '100%' }}>
                        <View style={s.sectionHeader}>
                            <View style={[s.headerPill, { backgroundColor: accent + '18', borderColor: accent + '40' }]}>
                                <ShieldCheck size={14} color={accent} />
                                <Text style={[s.headerPillText, { color: accent }]}>KEY BENEFITS</Text>
                            </View>
                            <Text style={[s.sectionTitle, { fontSize: isMobile ? 30 : 44 }]}>
                                Why Industry Leaders Choose CYVhub
                            </Text>
                        </View>

                        <View style={[s.benefitsGrid, { flexDirection: isMobile ? 'column' : 'row' }]}>
                            {[col1, col2].map((col, ci) => (
                                <View key={ci} style={[s.benefitsCol, !isMobile && ci === 0 && { marginRight: 24 }]}>
                                    {col.map((benefit: string, bi: number) => (
                                        <View key={bi} style={s.benefitRow}>
                                            <View style={[s.checkCircle, { backgroundColor: accent + '20', borderColor: accent + '40' }]}>
                                                <CheckCircle2 size={18} color={accent} />
                                            </View>
                                            <Text style={s.benefitText}>{benefit}</Text>
                                        </View>
                                    ))}
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            </View>

            {/* ── CASE STUDY QUOTE ── */}
            {!!config.caseStudyQuote && (
                <View style={s.quoteSection}>
                    <View style={{ maxWidth: 900, alignSelf: 'center', alignItems: 'center', paddingHorizontal: isMobile ? 24 : 60 }}>
                        <View style={[s.quoteIconWrap, { backgroundColor: accent + '18' }]}>
                            <Quote size={32} color={accent} />
                        </View>
                        <Text style={[s.quoteTagline, { color: accent }]}>{config.caseStudyTitle}</Text>
                        <Text style={[s.quoteBody, { fontSize: isMobile ? 20 : 28 }]}>
                            "{config.caseStudyQuote}"
                        </Text>
                        <View style={[s.quoteDivider, { backgroundColor: accent }]} />
                        <Text style={s.quoteAuthor}>{config.caseStudyAuthor}</Text>
                    </View>
                </View>
            )}

            {/* ── CTA BANNER ── */}
            <View style={s.ctaSection}>
                <LinearGradient
                    colors={[accent, accent + 'CC']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                />
                {/* subtle pattern overlay */}
                <View style={s.ctaPattern} />
                <View style={[s.ctaInner, { paddingHorizontal: isMobile ? 24 : 60, flexDirection: isMobile ? 'column' : 'row', alignItems: 'center' }]}>
                    <View style={{ flex: 1, marginBottom: isMobile ? 32 : 0 }}>
                        <Text style={[s.ctaTitle, { fontSize: isMobile ? 26 : 36 }]}>
                            {config.ctaHeading}
                        </Text>
                        <Text style={s.ctaSub}>{config.ctaText}</Text>
                    </View>
                    <View style={[s.ctaBtns, { marginLeft: isMobile ? 0 : 48 }]}>
                        <TouchableOpacity
                            style={s.ctaWhiteBtn}
                            onPress={() => router.push('/contact')}
                        >
                            <Text style={[s.ctaWhiteBtnText, { color: accent }]}>{config.ctaButtonText}</Text>
                            <ArrowRight size={18} color={accent} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={s.ctaGhostBtn}
                            onPress={() => router.push('/guest-quote')}
                        >
                            <Text style={s.ctaGhostBtnText}>Get Instant Quote</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* ── RELATED INDUSTRIES ── */}
            <View style={[s.relatedSection, { paddingHorizontal: isMobile ? 24 : 60 }]}>
                <View style={{ maxWidth: 1100, alignSelf: 'center', width: '100%' }}>
                    <Text style={s.relatedLabel}>EXPLORE OTHER INDUSTRIES</Text>
                    <View style={[s.relatedGrid, { flexDirection: isMobile ? 'column' : 'row', flexWrap: 'wrap' }]}>
                        {Object.values(industryDetails)
                            .filter((ind: any) => ind.slug !== slug && ind.publishStatus)
                            .slice(0, isMobile ? 3 : 4)
                            .map((ind: any) => {
                                const indAccent = ACCENT_COLORS[ind.slug] || Colors.primary;
                                return (
                                    <TouchableOpacity
                                        key={ind.slug}
                                        style={[s.relatedCard, !isMobile && { width: '23%' }]}
                                        onPress={() => router.push(`/industries/${ind.slug}` as any)}
                                    >
                                        <View style={[s.relatedIconWrap, { backgroundColor: indAccent + '18' }]}>
                                            <DynamicIcon name={ind.icon} size={22} color={indAccent} />
                                        </View>
                                        <Text style={s.relatedTitle}>{ind.title}</Text>
                                        <View style={s.relatedArrow}>
                                            <ArrowRight size={14} color={indAccent} />
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                    </View>
                </View>
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

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#fff' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, minHeight: 500 },
    loadingText: { marginTop: 16, fontSize: 16, color: Colors.textSecondary },
    errTitle: { fontSize: 28, fontWeight: '900', color: Colors.navy, marginTop: 24, marginBottom: 8 },
    errSub: { fontSize: 16, color: Colors.textSecondary, textAlign: 'center', marginBottom: 32 },
    pill: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 100 },
    row: { flexDirection: 'row', alignItems: 'center' },

    // HERO
    heroContent: {
        position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 60,
        justifyContent: 'flex-end',
    },
    badge: {
        flexDirection: 'row', alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 14, paddingVertical: 7,
        borderRadius: 100, borderWidth: 1,
        marginBottom: 20,
    },
    badgeText: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginLeft: 8, textTransform: 'uppercase' },
    heroTitle: { fontWeight: '900', color: '#fff', lineHeight: undefined, marginBottom: 16 },
    heroTagline: { color: 'rgba(255,255,255,0.72)', fontWeight: '500', lineHeight: 36, marginBottom: 40, maxWidth: 700 },
    heroActions: { flexDirection: 'row', flexWrap: 'wrap' },
    heroCta: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 32, paddingVertical: 18,
        borderRadius: 14, marginRight: 16, marginBottom: 12,
        elevation: 8,
    },
    heroCtaText: { color: '#fff', fontSize: 16, fontWeight: '800', marginRight: 10 },
    heroCtaGhost: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 28, paddingVertical: 18,
        borderRadius: 14, borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.4)',
        marginBottom: 12,
    },
    heroCtaGhostText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    backBtn: { position: 'absolute', top: 56, left: 24, zIndex: 10 },
    backBlur: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 10,
        borderRadius: 100, overflow: 'hidden',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    },
    backText: { color: '#fff', fontWeight: '700', fontSize: 14, marginLeft: 8 },

    // BREADCRUMB
    breadcrumbBar: {
        backgroundColor: '#fff',
        paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    },
    crumbText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600', marginLeft: 6 },

    // OVERVIEW
    overviewStrip: { paddingVertical: 48, backgroundColor: '#fff' },
    accentLine: { width: 5, height: 60, borderRadius: 3, marginRight: 28, flexShrink: 0 },
    overviewText: { fontSize: 20, color: Colors.navy, fontWeight: '600', lineHeight: 34, flex: 1 },

    // CHALLENGE
    challengeSection: { paddingVertical: 80, position: 'relative', overflow: 'hidden' },
    sectionInner: { position: 'relative', zIndex: 1 },
    challengeCard: {
        maxWidth: 1100, alignSelf: 'center', width: '100%',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 28, padding: 48,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    },
    challengeIconCol: { alignItems: 'center', minWidth: 100 },
    challengeIconWrap: {
        width: 88, height: 88, borderRadius: 44,
        backgroundColor: 'rgba(220,38,38,0.12)',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, marginBottom: 16,
    },
    challengeLabel: { color: '#DC2626', fontSize: 10, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
    challengeTitle: { fontSize: 28, fontWeight: '900', color: '#fff', marginBottom: 20 },
    challengeBody: { fontSize: 17, color: 'rgba(255,255,255,0.72)', lineHeight: 30 },

    // HOW WE HELP
    helpSection: { paddingVertical: 100, backgroundColor: '#fff' },
    sectionHeader: { marginBottom: 56 },
    headerPill: {
        flexDirection: 'row', alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 14, paddingVertical: 7,
        borderRadius: 100, borderWidth: 1, marginBottom: 20,
    },
    headerPillText: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginLeft: 6, textTransform: 'uppercase' },
    sectionTitle: { fontWeight: '900', color: Colors.navy, lineHeight: undefined },
    helpCard: {
        flexDirection: 'row',
        backgroundColor: '#F8FAFC',
        borderRadius: 24, padding: 40,
        marginBottom: 20,
        borderWidth: 1, borderColor: '#F1F5F9',
        elevation: 2,
    },
    helpNum: {
        width: 56, height: 56, borderRadius: 16,
        justifyContent: 'center', alignItems: 'center',
        flexShrink: 0,
    },
    helpNumText: { color: '#fff', fontSize: 20, fontWeight: '900' },
    helpPara: { fontSize: 17, color: Colors.textSecondary, lineHeight: 30 },

    // BENEFITS
    benefitsSection: { paddingVertical: 100, position: 'relative', overflow: 'hidden' },
    benefitsGrid: {},
    benefitsCol: { flex: 1 },
    benefitRow: {
        flexDirection: 'row', alignItems: 'flex-start',
        marginBottom: 24,
    },
    checkCircle: {
        width: 40, height: 40, borderRadius: 20,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, marginRight: 16, flexShrink: 0,
    },
    benefitText: { fontSize: 16, fontWeight: '600', color: Colors.navy, lineHeight: 26, flex: 1, paddingTop: 10 },

    // QUOTE
    quoteSection: { paddingVertical: 100, backgroundColor: '#F8FAFC' },
    quoteIconWrap: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
    quoteTagline: { fontSize: 11, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 24 },
    quoteBody: { fontWeight: '800', color: Colors.navy, lineHeight: 44, textAlign: 'center', marginBottom: 40 },
    quoteDivider: { width: 48, height: 3, borderRadius: 2, marginBottom: 16 },
    quoteAuthor: { fontSize: 16, fontWeight: '700', color: Colors.textSecondary },

    // CTA
    ctaSection: { paddingVertical: 80, position: 'relative', overflow: 'hidden' },
    ctaPattern: {
        position: 'absolute', top: -100, right: -100,
        width: 400, height: 400, borderRadius: 200,
        backgroundColor: 'rgba(255,255,255,0.06)',
    },
    ctaInner: { position: 'relative', zIndex: 1, maxWidth: 1100, alignSelf: 'center', width: '100%' },
    ctaTitle: { fontWeight: '900', color: '#fff', marginBottom: 12, lineHeight: undefined },
    ctaSub: { fontSize: 16, color: 'rgba(255,255,255,0.75)', lineHeight: 26 },
    ctaBtns: { flexDirection: 'row', flexWrap: 'wrap' },
    ctaWhiteBtn: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 28, paddingVertical: 16,
        borderRadius: 14, marginRight: 16, marginBottom: 12,
        elevation: 4,
    },
    ctaWhiteBtnText: { fontWeight: '800', fontSize: 15, marginRight: 8 },
    ctaGhostBtn: {
        paddingHorizontal: 24, paddingVertical: 16,
        borderRadius: 14, borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.5)',
        marginBottom: 12,
    },
    ctaGhostBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

    // RELATED
    relatedSection: { paddingVertical: 80, backgroundColor: '#fff' },
    relatedLabel: { fontSize: 11, fontWeight: '900', color: Colors.textMuted, letterSpacing: 2, marginBottom: 28 },
    relatedGrid: { flexWrap: 'wrap' },
    relatedCard: {
        flex: 1, minWidth: 160,
        backgroundColor: '#F8FAFC',
        borderRadius: 20, padding: 24,
        marginBottom: 16, marginRight: 16,
        borderWidth: 1, borderColor: '#F1F5F9',
        elevation: 1,
    },
    relatedIconWrap: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
    relatedTitle: { fontSize: 14, fontWeight: '800', color: Colors.navy, marginBottom: 16, lineHeight: 20 },
    relatedArrow: {},
});
