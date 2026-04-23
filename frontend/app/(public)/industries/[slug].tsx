import React from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ActivityIndicator, useWindowDimensions
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCMS } from '@/context/CMSContext';
import Colors from '@/constants/colors';
import { Package } from 'lucide-react-native';
import Head from 'expo-router/head';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ScrollView } from 'react-native';
import {
    HeroSection,
    StatsBar,
    ChallengeSection,
    SolutionSection,
    UseCaseSection,
    TestimonialBlock,
    RelatedIndustries,
    IndustryFooterCTA,
} from '@/components/industries/IndustryComponents';

function IndustryDetailPage() {
    const { slug } = useLocalSearchParams<{ slug: string }>();
    const { industryDetails, isLoaded } = useCMS();
    const router = useRouter();
    const { width: W } = useWindowDimensions();

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
                <TouchableOpacity
                    style={[s.pill, { backgroundColor: Colors.primary }]}
                    onPress={() => router.push('/industries')}
                >
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>← Back to Industries</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const accent = config.accentColor || Colors.primary;

    // Related industries (other published, excluding current)
    const relatedList = Object.values(industryDetails)
        .filter((ind: any) => ind.slug !== slug && ind.publishStatus)
        .slice(0, 4)
        .map((ind: any) => ({
            slug: ind.slug,
            title: ind.title,
            icon: ind.icon,
            accentColor: ind.accentColor,
        }));

    // Testimonial data: prefer dedicated testimonial field, fall back to caseStudy fields
    const testimonial = (config as any).testimonial || null;
    const hasTestimonial =
        testimonial
            ? !!(testimonial.quote && testimonial.author)
            : !!(config.caseStudyQuote && config.caseStudyAuthor);

    const quoteText = testimonial?.quote || config.caseStudyQuote || '';
    const quoteAuthor = testimonial?.author || config.caseStudyAuthor || '';
    const quoteRole = testimonial?.role || 'Operations Lead';
    const quoteCompany = testimonial?.company || config.caseStudyTitle || 'CYVhub Client';

    return (
        <ScrollView style={s.root} showsVerticalScrollIndicator={false}>
            <Head>
                <title>{config.metaTitle || `${config.title} Logistics | CYVhub`}</title>
                <meta name="description" content={config.metaDesc || config.description} />
            </Head>

            {/* ── Hero ── */}
            <HeroSection
                accentColor={accent}
                layoutTheme={config.layoutTheme}
                eyebrow="Industry Sector"
                title={config.title}
                subtitle={config.subtitle}
                imageUrl={config.heroImageUrl}
                onGetStarted={() => router.push('/contact')}
                onLearnMore={() => {/* scroll handled natively */}}
            />

            {/* ── Stats ── */}
            {config.stats && config.stats.length > 0 && (
                <StatsBar accentColor={accent} layoutTheme={config.layoutTheme} stats={config.stats} />
            )}

            {/* ── Challenges ── */}
            {config.challenges && config.challenges.length > 0 && (
                <ChallengeSection
                    accentColor={accent}
                    layoutTheme={config.layoutTheme}
                    industryName={config.title}
                    challenges={config.challenges}
                />
            )}

            {/* ── Solution / Features ── */}
            {config.features && config.features.length > 0 && (
                <SolutionSection
                    accentColor={accent}
                    layoutTheme={config.layoutTheme}
                    features={config.features}
                />
            )}

            {/* ── Use Cases ── */}
            {config.useCases && config.useCases.length > 0 && (
                <UseCaseSection
                    accentColor={accent}
                    layoutTheme={config.layoutTheme}
                    industryName={config.title}
                    useCases={config.useCases}
                />
            )}

            {/* ── Testimonial ── */}
            {hasTestimonial && (
                <TestimonialBlock
                    accentColor={accent}
                    layoutTheme={config.layoutTheme}
                    quote={quoteText}
                    author={quoteAuthor}
                    role={quoteRole}
                    company={quoteCompany}
                />
            )}

            {/* ── Related Industries ── */}
            {relatedList.length > 0 && (
                <RelatedIndustries
                    accentColor={accent}
                    layoutTheme={config.layoutTheme}
                    industries={relatedList}
                    onPress={(s) => router.push(`/industries/${s}` as any)}
                />
            )}

            {/* ── Footer CTA ── */}
            <IndustryFooterCTA
                accentColor={accent}
                title={config.ctaHeading}
                subtext={config.ctaText}
                onGetQuote={() => router.push('/guest-quote')}
                onTalkToUs={() => router.push('/contact')}
            />
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
});
