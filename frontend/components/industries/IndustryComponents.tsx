import React from 'react';
import {
    View, Text, StyleSheet, Image, TouchableOpacity,
    ScrollView, useWindowDimensions
} from 'react-native';
import {
    ArrowRight, AlertTriangle, Zap, Quote, Package,
    Truck, Clock, Shield, Users, FileText, Signal,
    ShieldCheck, ArrowLeftRight, ClipboardList,
    PlusSquare, FileSearch, CheckCircle, CheckCircle2,
    Maximize, Check, Thermometer, HardHat, Monitor,
    Factory, Plane, Utensils, Settings, HeartPulse,
    Cpu, Car, RefreshCw, ShieldAlert, UserCheck,
    BarChart, Layers, Repeat, Eye, Wrench, Lock,
    Target, PauseCircle, Link, TrendingDown, AlertCircle,
    DollarSign
} from 'lucide-react-native';
import Colors from '@/constants/colors';

// ─── Shared Types ─────────────────────────────────────────
interface IndustryComponentProps {
    accentColor: string;
    layoutTheme?: 'left' | 'center';
}

// ─── DynamicIcon ──────────────────────────────────────────
export const DynamicIcon = ({ name, size, color }: { name: string; size: number; color: string }) => {
    const icons: Record<string, any> = {
        AlertTriangle, Zap, Package, Truck, Clock, Shield, Users,
        FileText, Signal, ShieldCheck, ArrowLeftRight, ClipboardList,
        PlusSquare, FileSearch, CheckCircle, CheckCircle2, Maximize,
        Check, Thermometer, HardHat, Monitor, Factory, Plane,
        Utensils, Settings, HeartPulse, Cpu, Car, RefreshCw,
        ShieldAlert, UserCheck, BarChart, Layers, Repeat, Eye,
        Wrench, Lock,
        // Also support lowercase/dashed names for easier CMS entry
        'heart-pulse': HeartPulse,
        'hard-hat': HardHat,
        'cpu': Cpu,
        'factory': Factory,
        'plane': Plane,
        'refresh-cw': RefreshCw,
        'car': Car,
        'utensils': Utensils,
        'shield-alert': ShieldAlert,
        'user-check': UserCheck,
        'bar-chart': BarChart,
        'layers': Layers,
        'repeat': Repeat,
        'eye': Eye,
        'wrench': Wrench,
        'lock': Lock,
        'check-circle': CheckCircle,
        'package': Package,
        'clock': Clock,
        'zap': Zap,
        'shield': Shield,
        'target': Target,
        'pause-circle': PauseCircle,
        'link': Link,
        'trending-down': TrendingDown,
        'alert-circle': AlertCircle,
        'dollar-sign': DollarSign,
        'shield-check': ShieldCheck,
        'clipboard-list': ClipboardList,
        'file-search': FileSearch,
        'arrow-left-right': ArrowLeftRight,
        'plus-square': PlusSquare,
        'signal': Signal,
    };
    const Icon = icons[name] || AlertTriangle;
    return <Icon size={size} color={color} />;
};

// ─── 1. Hero Section ─────────────────────────────────────
export const HeroSection = ({
    accentColor,
    layoutTheme,
    eyebrow,
    title,
    subtitle,
    imageUrl,
    onGetStarted,
    onLearnMore,
}: IndustryComponentProps & {
    eyebrow: string;
    title: string;
    subtitle: string;
    imageUrl?: string;
    onGetStarted: () => void;
    onLearnMore: () => void;
}) => {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    const isCenter = layoutTheme === 'center';

    return (
        <View style={[s.heroOuter]}>
            <View style={[s.heroContainer, isMobile && s.heroContainerMobile, isCenter && { flexDirection: 'column', textAlign: 'center' }]}>
                <View style={[s.heroTextCol, isMobile && s.heroTextColMobile, isCenter && { alignItems: 'center', paddingRight: 0, marginBottom: isCenter && imageUrl ? 48 : 0 }]}>
                    <Text style={[s.heroEyebrow, isCenter && { textAlign: 'center' }]}>{eyebrow.toUpperCase()}</Text>
                    <Text style={[s.heroTitle, isMobile && s.heroTitleMobile, isCenter && { textAlign: 'center' }]}>{title}</Text>
                    <Text style={[s.heroSubtitle, isCenter && { textAlign: 'center' }]}>{subtitle}</Text>
                    <View style={[s.row, s.heroActions, isCenter && { justifyContent: 'center' }]}>
                        <TouchableOpacity
                            style={[s.primaryBtn, { backgroundColor: accentColor }]}
                            onPress={onGetStarted}
                            activeOpacity={0.82}
                        >
                            <Text style={s.primaryBtnText}>Get Started</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[s.secondaryBtn, { borderColor: accentColor }]}
                            onPress={onLearnMore}
                            activeOpacity={0.82}
                        >
                            <Text style={[s.secondaryBtnText, { color: accentColor }]}>Learn More</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={[s.heroVisualCol, isMobile && s.heroVisualColMobile]}>
                    {imageUrl ? (
                        <Image source={{ uri: imageUrl }} style={s.heroImage} resizeMode="cover" />
                    ) : (
                        <View style={[s.heroImagePlaceholder, { backgroundColor: accentColor + '12' }]}>
                            <Package size={80} color={accentColor} />
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
};

// ─── 2. Stats Bar ─────────────────────────────────────────
export const StatsBar = ({
    accentColor,
    layoutTheme,
    stats,
}: IndustryComponentProps & { stats: { label: string; value: string }[] }) => (
    <View style={s.statsBar}>
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[s.statsBarInner, layoutTheme === 'center' && { justifyContent: 'center', width: '100%' }]}
        >
            {stats.map((stat, i) => (
                <View key={i} style={s.statItem}>
                    <Text style={[s.statNumber, { color: accentColor }]}>{stat.value}</Text>
                    <Text style={s.statLabel}>{stat.label}</Text>
                </View>
            ))}
        </ScrollView>
    </View>
);

// ─── 3. Challenge Section ────────────────────────────────
export const ChallengeSection = ({
    accentColor,
    layoutTheme,
    industryName,
    challenges,
}: IndustryComponentProps & {
    industryName: string;
    challenges: { icon: string; title: string; desc: string }[];
}) => {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    const isCenter = layoutTheme === 'center';

    return (
        <View style={s.section}>
            <View style={[s.sectionInner, isCenter && { alignItems: 'center' }]}>
                <Text style={[s.sectionEyebrow, isCenter && { textAlign: 'center' }]}>THE CHALLENGE</Text>
                <Text style={[s.sectionH2, isCenter && { textAlign: 'center' }]}>What {industryName} teams face every day</Text>
                <View style={[s.grid, isMobile && s.gridMobile, isCenter && { justifyContent: 'center' }]}>
                    {challenges.map((c, i) => (
                        <View key={i} style={[s.challengeCard, !isMobile && s.challengeCardDesktop, isCenter && { alignItems: 'center' }]}>
                            <View style={[s.iconWrap, { backgroundColor: accentColor + '12' }]}>
                                <DynamicIcon name={c.icon} size={22} color={accentColor} />
                            </View>
                            <Text style={[s.cardTitle, isCenter && { textAlign: 'center' }]}>{c.title}</Text>
                            <Text style={[s.cardBody, isCenter && { textAlign: 'center' }]}>{c.desc}</Text>
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
};

// ─── 4. Solution Section ─────────────────────────────────
export const SolutionSection = ({
    accentColor,
    layoutTheme,
    features,
}: IndustryComponentProps & {
    features: { title: string; desc: string; icon: string; imageUrl?: string }[];
}) => {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    const isCenter = layoutTheme === 'center';

    return (
        <View style={[s.section, s.bgGrey]}>
            <View style={s.sectionInner}>
                <Text style={s.sectionEyebrow}>OUR SOLUTION</Text>
                <Text style={s.sectionH2}>How CYVhub solves it</Text>
                {features.map((f, i) => (
                    <View
                        key={i}
                        style={[
                            s.featureRow,
                            isMobile && s.featureRowMobile,
                            i % 2 !== 0 && !isMobile && s.featureRowReverse,
                        ]}
                    >
                        <View style={s.featureTextCol}>
                            <View style={[s.iconWrap, { backgroundColor: accentColor + '12' }]}>
                                <DynamicIcon name={f.icon} size={24} color={accentColor} />
                            </View>
                            <Text style={s.featureTitle}>{f.title}</Text>
                            <Text style={s.featureDesc}>{f.desc}</Text>
                            <TouchableOpacity style={s.row} activeOpacity={0.7}>
                                <Text style={[s.featureLink, { color: accentColor }]}>Learn more</Text>
                                <ArrowRight size={14} color={accentColor} />
                            </TouchableOpacity>
                        </View>
                        <View style={s.featureVisualCol}>
                            <View style={[s.featureVisualPlaceholder, { backgroundColor: accentColor + '08' }]}>
                                {f.imageUrl ? (
                                    <Image source={{ uri: f.imageUrl }} style={s.heroImage} resizeMode="cover" />
                                ) : (
                                    <DynamicIcon name={f.icon} size={72} color={accentColor + '28'} />
                                )}
                            </View>
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
};

// ─── 5. Use Case Section ─────────────────────────────────
export const UseCaseSection = ({
    accentColor,
    layoutTheme,
    industryName,
    useCases,
}: IndustryComponentProps & {
    industryName: string;
    useCases: { title: string; desc: string; badge: string }[];
}) => {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    const isCenter = layoutTheme === 'center';

    return (
        <View style={s.section}>
            <View style={[s.sectionInner, isCenter && { alignItems: 'center' }]}>
                <Text style={[s.sectionEyebrow, isCenter && { textAlign: 'center' }]}>USE CASES</Text>
                <Text style={[s.sectionH2, isCenter && { textAlign: 'center' }]}>Built for how {industryName} actually works</Text>
                <ScrollView
                    horizontal={isMobile}
                    showsHorizontalScrollIndicator={false}
                    style={isMobile ? s.scrollContainer : undefined}
                >
                    <View style={[s.useCaseGrid, isMobile && s.useCaseGridMobile]}>
                        {useCases.map((uc, i) => (
                            <View key={i} style={[s.useCaseCard, isCenter && { alignItems: 'center' }]}>
                                <View style={[s.badge, { backgroundColor: accentColor + '12' }, isCenter && { alignSelf: 'center' }]}>
                                    <Text style={[s.badgeText, { color: accentColor }]}>{uc.badge}</Text>
                                </View>
                                <Text style={[s.useCaseTitle, isCenter && { textAlign: 'center' }]}>{uc.title}</Text>
                                <Text style={[s.cardBody, isCenter && { textAlign: 'center' }]}>{uc.desc}</Text>
                            </View>
                        ))}
                    </View>
                </ScrollView>
            </View>
        </View>
    );
};

// ─── 6. Testimonial Block ────────────────────────────────
export const TestimonialBlock = ({
    accentColor,
    layoutTheme,
    quote,
    author,
    role,
    company,
}: IndustryComponentProps & {
    quote: string;
    author: string;
    role: string;
    company: string;
}) => {
    const isCenter = layoutTheme === 'center';
    return (
    <View style={[s.testimonialContainer, { backgroundColor: accentColor + '0C' }, isCenter && { alignItems: 'center' }]}>
        <View style={[s.testimonialIconWrap, { backgroundColor: accentColor + '18' }]}>
            <Quote size={26} color={accentColor} />
        </View>
        <Text style={s.testimonialQuote}>"{quote}"</Text>
        <View style={[s.testimonialDivider, { backgroundColor: accentColor }]} />
        <Text style={s.testimonialAuthor}>{author}</Text>
        <Text style={s.testimonialRole}>{role}, {company}</Text>
    </View>
    );
};

// ─── 7. Related Industries ───────────────────────────────
export const RelatedIndustries = ({
    accentColor,
    layoutTheme,
    industries,
    onPress,
}: IndustryComponentProps & {
    industries: { slug: string; title: string; icon: string; accentColor?: string }[];
    onPress: (slug: string) => void;
}) => {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    const isCenter = layoutTheme === 'center';

    return (
        <View style={s.relatedSection}>
            <View style={[s.sectionInner, isCenter && { alignItems: 'center' }]}>
                <Text style={[s.sectionEyebrow, isCenter && { textAlign: 'center' }]}>EXPLORE OTHER INDUSTRIES</Text>
                <View style={[s.relatedGrid, isMobile && s.relatedGridMobile]}>
                    {industries.map((ind) => {
                        const ia = ind.accentColor || accentColor;
                        return (
                            <TouchableOpacity
                                key={ind.slug}
                                style={s.relatedCard}
                                onPress={() => onPress(ind.slug)}
                                activeOpacity={0.8}
                            >
                                <View style={[s.relatedIconWrap, { backgroundColor: ia + '18' }]}>
                                    <DynamicIcon name={ind.icon} size={18} color={ia} />
                                </View>
                                <Text style={s.relatedTitle}>{ind.title}</Text>
                                <ArrowRight size={14} color={ia} />
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        </View>
    );
};

// ─── 8. Footer CTA ───────────────────────────────────────
export const IndustryFooterCTA = ({
    accentColor,
    title,
    subtext,
    onGetQuote,
    onTalkToUs,
}: IndustryComponentProps & {
    title: string;
    subtext: string;
    onGetQuote?: () => void;
    onTalkToUs?: () => void;
}) => (
    <View style={s.footerCta}>
        <View style={[s.footerAccentBar, { backgroundColor: accentColor }]} />
        <Text style={s.footerCtaTitle}>{title}</Text>
        <Text style={s.footerCtaSub}>{subtext}</Text>
        <View style={s.footerCtaBtns}>
            <TouchableOpacity style={s.ctaWhiteBtn} onPress={onGetQuote} activeOpacity={0.85}>
                <Text style={s.ctaWhiteBtnText}>Get a Quote</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.ctaOutlineBtn} onPress={onTalkToUs} activeOpacity={0.85}>
                <Text style={s.ctaOutlineBtnText}>Talk to Us</Text>
            </TouchableOpacity>
        </View>
    </View>
);

// ─── Styles ───────────────────────────────────────────────
const s = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center' },
    bgGrey: { backgroundColor: '#F8F9FA' },

    section: { paddingVertical: 88, paddingHorizontal: 32, backgroundColor: '#FFF' },
    sectionInner: { maxWidth: 1100, alignSelf: 'center', width: '100%' },
    sectionEyebrow: {
        fontSize: 12, fontWeight: '700', color: '#6B7280',
        letterSpacing: 1.5, marginBottom: 12, textTransform: 'uppercase',
    },
    sectionH2: {
        fontSize: 32, fontWeight: '800', color: '#111827',
        marginBottom: 48, letterSpacing: -0.5,
    },

    // Hero
    heroOuter: { backgroundColor: '#FFF' },
    heroContainer: {
        flexDirection: 'row', paddingVertical: 100, paddingHorizontal: 64,
        alignItems: 'center', maxWidth: 1280, alignSelf: 'center', width: '100%',
    },
    heroContainerMobile: { flexDirection: 'column', paddingHorizontal: 24, paddingVertical: 60 },
    heroTextCol: { flex: 6, paddingRight: 52 },
    heroTextColMobile: { flex: 0, paddingRight: 0, marginBottom: 36 },
    heroEyebrow: {
        fontSize: 12, fontWeight: '700', color: '#6B7280',
        letterSpacing: 1.5, marginBottom: 16, textTransform: 'uppercase',
    },
    heroTitle: { fontSize: 64, fontWeight: '900', color: '#111827', lineHeight: 72, marginBottom: 24, letterSpacing: -1.5 },
    heroTitleMobile: { fontSize: 40, lineHeight: 48, letterSpacing: -1 },
    heroSubtitle: { fontSize: 20, color: '#4B5563', lineHeight: 32, marginBottom: 40 },
    heroActions: { gap: 14 },
    heroVisualCol: { flex: 4, height: 440, borderRadius: 24, overflow: 'hidden' },
    heroVisualColMobile: { flex: 0, width: '100%', height: 260 },
    heroImage: { width: '100%', height: '100%' },
    heroImagePlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
    primaryBtn: { paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12 },
    primaryBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
    secondaryBtn: { paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12, borderWidth: 1.5 },
    secondaryBtnText: { fontWeight: '800', fontSize: 16 },

    // Stats
    statsBar: { backgroundColor: '#F3F4F6', paddingVertical: 36 },
    statsBarInner: { paddingHorizontal: 64, gap: 72, alignItems: 'flex-start' },
    statItem: { alignItems: 'flex-start' },
    statNumber: { fontSize: 36, fontWeight: '900', marginBottom: 4 },
    statLabel: { fontSize: 14, color: '#6B7280', fontWeight: '600' },

    // Challenges
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 24 },
    gridMobile: { flexDirection: 'column' },
    challengeCard: {
        backgroundColor: '#F9FAFB', padding: 32,
        borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB',
    },
    challengeCardDesktop: { flex: 1, minWidth: 260 },
    iconWrap: { width: 50, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    cardTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 10 },
    cardBody: { fontSize: 16, color: '#6B7280', lineHeight: 26 },

    // Solution
    featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 72, gap: 56 },
    featureRowMobile: { flexDirection: 'column', gap: 28 },
    featureRowReverse: { flexDirection: 'row-reverse' },
    featureTextCol: { flex: 1 },
    featureVisualCol: { flex: 1, height: 360, borderRadius: 20, overflow: 'hidden' },
    featureVisualPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
    featureTitle: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 14 },
    featureDesc: { fontSize: 17, color: '#6B7280', lineHeight: 28, marginBottom: 20 },
    featureLink: { fontWeight: '700', fontSize: 15, marginRight: 6 },

    // Use Cases
    scrollContainer: { marginHorizontal: -24, paddingHorizontal: 24 },
    useCaseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
    useCaseGridMobile: { flexWrap: 'nowrap' },
    useCaseCard: {
        width: 300, backgroundColor: '#FFF', padding: 28,
        borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB',
    },
    useCaseTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 10, marginTop: 12 },
    badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    badgeText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

    // Testimonial
    testimonialContainer: { paddingVertical: 96, paddingHorizontal: 32, alignItems: 'center' },
    testimonialIconWrap: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 28 },
    testimonialQuote: {
        fontSize: 24, fontWeight: '700', color: '#111827',
        fontStyle: 'italic', textAlign: 'center', lineHeight: 40,
        marginBottom: 32, maxWidth: 760,
    },
    testimonialDivider: { width: 40, height: 3, borderRadius: 2, marginBottom: 18 },
    testimonialAuthor: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 4 },
    testimonialRole: { fontSize: 15, color: '#6B7280' },

    // Related
    relatedSection: { paddingVertical: 72, paddingHorizontal: 32, backgroundColor: '#FFF' },
    relatedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
    relatedGridMobile: { flexDirection: 'column' },
    relatedCard: {
        flex: 1, minWidth: 200, flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: '#F9FAFB', borderRadius: 14, padding: 16,
        borderWidth: 1, borderColor: '#E5E7EB',
    },
    relatedIconWrap: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    relatedTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: '#111827' },

    // Footer CTA
    footerCta: { paddingVertical: 100, paddingHorizontal: 32, alignItems: 'center', backgroundColor: '#111827' },
    footerAccentBar: { width: 44, height: 4, borderRadius: 2, marginBottom: 32 },
    footerCtaTitle: {
        fontSize: 40, fontWeight: '900', color: '#FFF',
        textAlign: 'center', marginBottom: 16, letterSpacing: -0.5,
    },
    footerCtaSub: {
        fontSize: 18, color: 'rgba(255,255,255,0.62)',
        textAlign: 'center', marginBottom: 48, maxWidth: 520,
    },
    footerCtaBtns: { flexDirection: 'row', gap: 14, flexWrap: 'wrap', justifyContent: 'center' },
    ctaWhiteBtn: { backgroundColor: '#FFF', paddingHorizontal: 36, paddingVertical: 17, borderRadius: 12 },
    ctaWhiteBtnText: { fontWeight: '800', fontSize: 16, color: '#111827' },
    ctaOutlineBtn: { paddingHorizontal: 36, paddingVertical: 17, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.38)' },
    ctaOutlineBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
});
