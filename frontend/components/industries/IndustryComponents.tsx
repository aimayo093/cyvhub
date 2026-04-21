import React from 'react';
import { 
    View, Text, StyleSheet, Image, TouchableOpacity, 
    ScrollView, useWindowDimensions 
} from 'react-native';
import { 
    ArrowRight, ChevronRight, CheckCircle2, 
    AlertTriangle, Zap, Quote, Package, LucideIcon,
    Truck, Clock, Shield, Users, FileText, Signal, 
    ShieldCheck, ArrowLeftRight, ClipboardList, 
    PlusSquare, FileSearch, CheckCircle, Maximize, 
    Check, Thermometer, HardHat, Monitor, Factory, 
    Plane, Utensils, Settings
} from 'lucide-react-native';
import Colors from '@/constants/colors';

// --- Shared Types ---
interface IndustryComponentProps {
    accentColor: string;
}

const DynamicIcon = ({ name, size, color }: { name: string, size: number, color: string }) => {
    const icons: any = { 
        AlertTriangle, Zap, Package, Truck, Clock, Shield, Users, 
        Package2: Package, FileText, Signal, ShieldCheck, 
        ArrowLeftRight, ClipboardList, PlusSquare, FileSearch,
        CheckCircle, CheckCircle2, Maximize, Check, Thermometer,
        HardHat, Monitor, Factory, Plane, Utensils, Settings
    };
    const Icon = icons[name] || AlertTriangle;
    return <Icon size={size} color={color} />;
};

// --- 1. HERO SECTION ---
export const HeroSection = ({ 
    accentColor, 
    eyebrow, 
    title, 
    subtitle, 
    imageUrl, 
    onGetStarted, 
    onLearnMore 
}: IndustryComponentProps & { 
    eyebrow: string, 
    title: string, 
    subtitle: string, 
    imageUrl?: string, 
    onGetStarted: () => void, 
    onLearnMore: () => void 
}) => {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    return (
        <View style={[s.heroContainer, isMobile && s.heroContainerMobile]}>
            <View style={[s.heroTextCol, isMobile && s.heroTextColMobile]}>
                <Text style={s.heroEyebrow}>{eyebrow.toUpperCase()}</Text>
                <Text style={s.heroTitle}>{title}</Text>
                <Text style={s.heroSubtitle}>{subtitle}</Text>
                <View style={[s.row, s.heroActions]}>
                    <TouchableOpacity 
                        style={[s.primaryBtn, { backgroundColor: accentColor }]} 
                        onPress={onGetStarted}
                    >
                        <Text style={s.primaryBtnText}>Get Started</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[s.secondaryBtn, { borderColor: accentColor }]} 
                        onPress={onLearnMore}
                    >
                        <Text style={[s.secondaryBtnText, { color: accentColor }]}>Learn More</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <View style={[s.heroVisualCol, isMobile && s.heroVisualColMobile]}>
                {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={s.heroImage} resizeMode="cover" />
                ) : (
                    <View style={[s.heroImagePlaceholder, { backgroundColor: accentColor + '10' }]}>
                        <Package size={80} color={accentColor} />
                    </View>
                )}
            </View>
        </View>
    );
};

// --- 2. STATS BAR ---
export const StatsBar = ({ accentColor, stats }: IndustryComponentProps & { stats: { label: string, value: string }[] }) => {
    return (
        <View style={s.statsBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.statsBarInner}>
                {stats.map((stat, i) => (
                    <View key={i} style={s.statItem}>
                        <Text style={[s.statNumber, { color: accentColor }]}>{stat.value}</Text>
                        <Text style={s.statLabel}>{stat.label}</Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

// --- 3. CHALLENGE SECTION ---
export const ChallengeSection = ({ 
    accentColor, 
    industryName, 
    challenges 
}: IndustryComponentProps & { 
    industryName: string, 
    challenges: { icon: string, title: string, desc: string }[] 
}) => {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    return (
        <View style={s.section}>
            <Text style={s.sectionEyebrow}>THE CHALLENGE</Text>
            <Text style={s.sectionH2}>What {industryName} teams face every day</Text>
            <View style={[s.grid, isMobile && s.gridMobile]}>
                {challenges.map((c, i) => (
                    <View key={i} style={[s.challengeCard, !isMobile && s.challengeCardDesktop]}>
                        <View style={s.challengeIcon}>
                            <DynamicIcon name={c.icon} size={24} color={accentColor} />
                        </View>
                        <Text style={s.cardTitleSmall}>{c.title}</Text>
                        <Text style={s.cardBodySmall}>{c.desc}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

// --- 4. SOLUTION SECTION ---
export const SolutionSection = ({ 
    accentColor, 
    features 
}: IndustryComponentProps & { 
    features: { title: string, desc: string, icon: string, imageUrl?: string }[] 
}) => {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    return (
        <View style={[s.section, s.bgGrey]}>
            <Text style={s.sectionEyebrow}>OUR SOLUTION</Text>
            <Text style={s.sectionH2}>How CYVhub solves it</Text>
            {features.map((f, i) => (
                <View key={i} style={[s.featureRow, isMobile && s.featureRowMobile, i % 2 !== 0 && !isMobile && s.featureRowReverse]}>
                    <View style={s.featureTextCol}>
                        <View style={{ marginBottom: 16 }}>
                            <DynamicIcon name={f.icon} size={28} color={accentColor} />
                        </View>
                        <Text style={s.featureTitle}>{f.title}</Text>
                        <Text style={s.featureDesc}>{f.desc}</Text>
                        <TouchableOpacity style={s.row}>
                            <Text style={[s.featureLink, { color: accentColor }]}>Learn more</Text>
                            <ArrowRight size={14} color={accentColor} />
                        </TouchableOpacity>
                    </View>
                    <View style={s.featureVisualCol}>
                        <View style={[s.featureVisualPlaceholder, { backgroundColor: accentColor + '08' }]}>
                            {f.imageUrl ? (
                                <Image source={{ uri: f.imageUrl }} style={s.heroImage} resizeMode="cover" />
                            ) : (
                                <Zap size={60} color={accentColor} opacity={0.2} />
                            )}
                        </View>
                    </View>
                </View>
            ))}
        </View>
    );
};

// --- 5. USE CASE SECTION ---
export const UseCaseSection = ({ 
    accentColor, 
    industryName, 
    useCases 
}: IndustryComponentProps & { 
    industryName: string, 
    useCases: { title: string, desc: string, badge: string }[] 
}) => {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    return (
        <View style={s.section}>
            <Text style={s.sectionEyebrow}>USE CASES</Text>
            <Text style={s.sectionH2}>Built for how {industryName} actually works</Text>
            <ScrollView horizontal={isMobile} showsHorizontalScrollIndicator={false} style={isMobile ? s.scrollContainer : null}>
                <View style={[s.useCaseGrid, isMobile && s.useCaseGridMobile]}>
                    {useCases.map((uc, i) => (
                        <View key={i} style={s.useCaseCard}>
                            <Text style={s.cardTitleSmall}>{uc.title}</Text>
                            <Text style={s.cardBodySmall}>{uc.desc}</Text>
                            <View style={[s.badge, { backgroundColor: accentColor + '10' }]}>
                                <Text style={[s.badgeText, { color: accentColor }]}>{uc.badge}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
};

// --- 6. TESTIMONIAL BLOCK ---
export const TestimonialBlock = ({ 
    accentColor, 
    quote, 
    author, 
    role, 
    company 
}: IndustryComponentProps & { 
    quote: string, 
    author: string, 
    role: string, 
    company: string 
}) => {
    return (
        <View style={[s.testimonialContainer, { backgroundColor: accentColor + '08' }]}>
            <Quote size={40} color={accentColor} opacity={0.3} style={{ marginBottom: 20 }} />
            <Text style={s.testimonialQuote}>"{quote}"</Text>
            <Text style={s.testimonialAuthor}>{author}</Text>
            <Text style={s.testimonialRole}>{role}, {company}</Text>
        </View>
    );
};

// --- 7. FOOTER CTA ---
export const IndustryFooterCTA = ({ 
    accentColor, 
    title, 
    subtext 
}: IndustryComponentProps & { 
    title: string, 
    subtext: string 
}) => {
    return (
        <View style={[s.footerCta, { backgroundColor: Colors.navy }]}>
            <Text style={s.footerCtaTitle}>{title}</Text>
            <Text style={s.footerCtaSub}>{subtext}</Text>
            <View style={s.footerCtaBtns}>
                <TouchableOpacity style={s.ctaWhiteBtn}>
                    <Text style={[s.ctaWhiteBtnText, { color: Colors.navy }]}>Get a Quote</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.ctaOutlineBtn}>
                    <Text style={s.ctaOutlineBtnText}>Talk to Us</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center' },
    bgGrey: { backgroundColor: '#F8F9FA' },
    section: { paddingVertical: 80, paddingHorizontal: 24, backgroundColor: '#FFF' },
    sectionEyebrow: { 
        fontSize: 12, fontWeight: '700', color: '#6B7280', 
        letterSpacing: 1.5, marginBottom: 12, textTransform: 'uppercase' 
    },
    sectionH2: { 
        fontSize: 32, fontWeight: '800', color: '#111827', 
        marginBottom: 40, letterSpacing: -0.5 
    },

    // HERO
    heroContainer: { 
        flexDirection: 'row', paddingVertical: 100, paddingHorizontal: 60, 
        backgroundColor: '#FFF', alignItems: 'center' 
    },
    heroContainerMobile: { flexDirection: 'column', paddingHorizontal: 24, paddingVertical: 60 },
    heroTextCol: { flex: 6, paddingRight: 40 },
    heroTextColMobile: { flex: 0, paddingRight: 0, marginBottom: 40 },
    heroEyebrow: { fontSize: 13, fontWeight: '700', color: '#6B7280', letterSpacing: 1, marginBottom: 16 },
    heroTitle: { fontSize: 64, fontWeight: '900', color: '#111827', lineHeight: 72, marginBottom: 24, letterSpacing: -1.5 },
    heroSubtitle: { fontSize: 20, color: '#6B7280', lineHeight: 32, marginBottom: 40 },
    heroActions: { gap: 16 },
    heroVisualCol: { flex: 4, height: 400, borderRadius: 24, overflow: 'hidden' },
    heroVisualColMobile: { flex: 0, width: '100%', height: 300 },
    heroImage: { width: '100%', height: '100%' },
    heroImagePlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },

    primaryBtn: { paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12 },
    primaryBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
    secondaryBtn: { paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12, borderWidth: 1.5 },
    secondaryBtnText: { fontWeight: '800', fontSize: 16 },

    // STATS
    statsBar: { backgroundColor: '#F3F4F6', paddingVertical: 32 },
    statsBarInner: { paddingHorizontal: 60, gap: 80 },
    statItem: { alignItems: 'flex-start' },
    statNumber: { fontSize: 32, fontWeight: '900', marginBottom: 4 },
    statLabel: { fontSize: 14, color: '#6B7280', fontWeight: '600' },

    // CHALLENGES
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 24 },
    gridMobile: { flexDirection: 'column' },
    challengeCard: { 
        backgroundColor: '#F9FAFB', padding: 32, 
        borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB' 
    },
    challengeCardDesktop: { flex: 1, minWidth: 300 },
    challengeIcon: { marginBottom: 20 },
    cardTitleSmall: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 12 },
    cardBodySmall: { fontSize: 16, color: '#6B7280', lineHeight: 26 },

    // SOLUTIONS
    featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 80, gap: 60 },
    featureRowMobile: { flexDirection: 'column', gap: 32 },
    featureRowReverse: { flexDirection: 'row-reverse' },
    featureTextCol: { flex: 1 },
    featureVisualCol: { flex: 1, height: 360, borderRadius: 24, overflow: 'hidden' },
    featureVisualPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
    featureTitle: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 20 },
    featureDesc: { fontSize: 18, color: '#6B7280', lineHeight: 30, marginBottom: 24 },
    featureLink: { fontWeight: '700', fontSize: 16, marginRight: 8 },

    // USE CASES
    scrollContainer: { marginHorizontal: -24, paddingHorizontal: 24 },
    useCaseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
    useCaseGridMobile: { flexWrap: 'nowrap' },
    useCaseCard: { 
        width: 320, backgroundColor: '#FFF', padding: 24, 
        borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB' 
    },
    badge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginTop: 16 },
    badgeText: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },

    // TESTIMONIAL
    testimonialContainer: { paddingVertical: 100, paddingHorizontal: 60, alignItems: 'center' },
    testimonialQuote: { 
        fontSize: 24, fontWeight: '700', color: '#111827', 
        fontStyle: 'italic', textAlign: 'center', lineHeight: 38, marginBottom: 32, maxWidth: 800 
    },
    testimonialAuthor: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 4 },
    testimonialRole: { fontSize: 16, color: '#6B7280' },

    // FOOTER CTA
    footerCta: { paddingVertical: 80, paddingHorizontal: 24, alignItems: 'center' },
    footerCtaTitle: { fontSize: 40, fontWeight: '900', color: '#FFF', textAlign: 'center', marginBottom: 16 },
    footerCtaSub: { fontSize: 18, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: 40 },
    footerCtaBtns: { flexDirection: 'row', gap: 16 },
    ctaWhiteBtn: { backgroundColor: '#FFF', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12 },
    ctaWhiteBtnText: { fontWeight: '800', fontSize: 16 },
    ctaOutlineBtn: { paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12, borderWidth: 1.5, borderColor: '#FFF' },
    ctaOutlineBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
});
