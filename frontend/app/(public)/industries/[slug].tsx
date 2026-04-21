import React from 'react';
import { 
    View, Text, StyleSheet, ScrollView, Image, 
    TouchableOpacity, useWindowDimensions, ActivityIndicator 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCMS } from '@/context/CMSContext';
import Colors from '@/constants/colors';
import { 
    ArrowRight, Package, Truck, AlertTriangle, Zap, ShieldCheck, 
    HardHat, Building2, Settings, Factory, Recycle, 
    BriefcaseMedical, Plane, Utensils, Monitor, Shield, 
    ShoppingBag, ArrowLeftRight 
} from 'lucide-react-native';
import Head from 'expo-router/head';
import ErrorBoundary from '@/components/ErrorBoundary';
import { 
    HeroSection, StatsBar, ChallengeSection, 
    SolutionSection, UseCaseSection, TestimonialBlock,
    IndustryFooterCTA 
} from '@/components/industries/IndustryComponents';

const IconMap: any = {
    Truck, AlertTriangle, Zap, ShieldCheck, HardHat, Building2,
    Settings, Factory, Recycle, Package, BriefcaseMedical, Plane,
    Utensils, Monitor, Shield, ShoppingBag, ArrowLeftRight,
};

const DynamicIcon = ({ name, size = 24, color = Colors.primary }: any) => {
    const C = IconMap[name] || Package;
    return <C size={size} color={color} />;
};

function IndustryDetailPage() {
    const { slug } = useLocalSearchParams<{ slug: string }>();
    const { industryDetails, isLoaded } = useCMS();
    const router = useRouter();
    const { width: W } = useWindowDimensions();
    const isMobile = W < 768;

    const config = industryDetails[slug as string];
    
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

    const accent = config.accentColor || Colors.primary;

    return (
        <ScrollView style={s.root} showsVerticalScrollIndicator={false}>
            <Head>
                <title>{config.metaTitle || `${config.title} Logistics | CYVhub`}</title>
                <meta name="description" content={config.metaDesc || config.description} />
            </Head>

            <HeroSection
                accentColor={accent}
                eyebrow="Industry Sector"
                title={config.title}
                subtitle={config.subtitle}
                imageUrl={config.heroImageUrl}
                onGetStarted={() => router.push('/contact')}
                onLearnMore={() => {/* Smooth scroll to next section */}}
            />

            {config.stats && config.stats.length > 0 && (
                <StatsBar accentColor={accent} stats={config.stats} />
            )}

            <ChallengeSection 
                accentColor={accent} 
                industryName={config.title} 
                challenges={config.challenges || []} 
            />

            <SolutionSection 
                accentColor={accent} 
                features={config.features || []} 
            />

            <UseCaseSection 
                accentColor={accent} 
                industryName={config.title} 
                useCases={config.useCases || []} 
            />

            {!!config.caseStudyQuote && (
                <TestimonialBlock 
                    accentColor={accent}
                    quote={config.caseStudyQuote}
                    author={config.caseStudyAuthor}
                    role="Operations Lead"
                    company={config.caseStudyTitle}
                />
            )}

            <IndustryFooterCTA 
                accentColor={accent}
                title={config.ctaHeading}
                subtext={config.ctaText}
            />

            {/* ── RELATED INDUSTRIES ── */}
            <View style={[s.relatedSection, { paddingHorizontal: isMobile ? 24 : 60 }]}>
                <View style={{ maxWidth: 1100, alignSelf: 'center', width: '100%' }}>
                    <Text style={s.relatedLabel}>EXPLORE OTHER INDUSTRIES</Text>
                    <View style={[s.relatedGrid, { flexDirection: isMobile ? 'column' : 'row', flexWrap: 'wrap' }]}>
                        {Object.values(industryDetails)
                            .filter((ind: any) => ind.slug !== slug && ind.publishStatus)
                            .slice(0, isMobile ? 3 : 4)
                            .map((ind: any) => {
                                const indAccent = ind.accentColor || Colors.primary;
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
