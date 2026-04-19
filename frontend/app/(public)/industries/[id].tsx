import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, Image, ActivityIndicator, Dimensions, useWindowDimensions } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Truck, Clock, ShieldCheck, Zap, ArrowRight, Package, Map,
    CalendarSync, FileText, Box, Archive, BriefcaseMedical,
    Monitor, AlertTriangle, Eye, ArrowLeftRight, HardHat, Building2,
    Settings, Factory, Recycle, ArrowLeft, ChevronRight, Quote
} from 'lucide-react-native';
import { useCMS } from '@/context/CMSContext';
import Colors from '@/constants/colors';
import { IndustryDetail } from '@/constants/cmsDefaults';
import ErrorBoundary from '@/components/ErrorBoundary';

// Removed static Dimensions
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

function IndustryDetailPage() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { industryDetails, isLoaded } = useCMS();
    const { width: SCREEN_WIDTH } = useWindowDimensions();

    const detail = industryDetails[id as string];

    if (!isLoaded) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (!detail) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Industry not found: {id}</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* HERO SECTION */}
            <View style={[styles.heroSection, { paddingVertical: SCREEN_WIDTH >= 1024 ? 140 : 100 }]}>
                <Image
                    source={{ uri: detail.heroImageUrl }}
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="cover"
                />
                <LinearGradient
                    colors={['rgba(15, 23, 42, 0.9)', 'rgba(15, 23, 42, 0.4)']}
                    style={StyleSheet.absoluteFillObject}
                />
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.3)' }]} />
                <View style={styles.heroContent}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
                        <ArrowLeft size={18} color="#FFF" />
                        <Text style={styles.backLinkText}>Back to Services</Text>
                    </TouchableOpacity>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>INDUSTRY FOCUS</Text>
                    </View>
                    <Text style={[styles.heroTitle, { fontSize: SCREEN_WIDTH >= 1024 ? 72 : 44, lineHeight: SCREEN_WIDTH >= 1024 ? 84 : 52 }]}>{detail.title}</Text>
                    <Text style={[styles.heroSubtitle, { fontSize: SCREEN_WIDTH >= 1024 ? 26 : 20, lineHeight: SCREEN_WIDTH >= 1024 ? 38 : 30 }]}>{detail.subtitle}</Text>
                </View>
            </View>

            {/* STATS BAR */}
            <View style={styles.statsBar}>
                <View style={styles.contentMax}>
                    <View style={styles.statsInner}>
                        {detail.stats && Array.isArray(detail.stats) && detail.stats.map((stat, index) => (
                            <View key={index} style={styles.statItem}>
                                <Text style={styles.statValue}>{stat.value}</Text>
                                <Text style={styles.statLabel}>{stat.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </View>

            {/* PROBLEM & SOLUTION SECTION */}
            <View style={styles.contentSection}>
                <View style={styles.contentMax}>
                    <View style={[styles.dualGrid, { flexDirection: SCREEN_WIDTH >= 768 ? 'row' : 'column' }]}>
                        <View style={styles.contentBlock}>
                            <View style={styles.iconBox}>
                                <AlertTriangle size={32} color={Colors.primary} />
                            </View>
                            <Text style={styles.blockTitle}>{detail.problemTitle}</Text>
                            <Text style={styles.blockText}>{detail.problemContent}</Text>
                        </View>
                        <View style={styles.contentBlock}>
                            <View style={styles.iconBox}>
                                <Zap size={32} color={Colors.primary} />
                            </View>
                            <Text style={styles.blockTitle}>{detail?.solutionTitle || ''}</Text>
                            {(detail?.solutionContent || '').split('\n\n').map((para, i) => (
                                <Text key={i} style={[styles.blockText, i > 0 && { marginTop: 16 }]}>
                                    {para.trim()}
                                </Text>
                            ))}
                        </View>
                    </View>
                </View>
            </View>

            {/* EQUIPMENT & CAPABILITY */}
            <LinearGradient colors={['#F8FAFC', '#FFFFFF']} style={styles.contentSection}>
                <View style={styles.contentMax}>
                    <Text style={[styles.sectionHeading, { fontSize: SCREEN_WIDTH >= 768 ? 48 : 36 }]}>Bespoke Fleet & Capability</Text>
                    <View style={styles.equipmentGrid}>
                        {detail?.equipment && Array.isArray(detail.equipment) && detail.equipment.map((item: any, index: number) => (
                            <View key={index} style={[styles.equipmentCard, { width: SCREEN_WIDTH >= 1024 ? '31%' : '100%' }]}>
                                <View style={styles.equipmentIconBox}>
                                    <DynamicIcon name={item.icon} size={32} color={Colors.primary} />
                                </View>
                                <Text style={styles.equipmentTitle}>{item.title}</Text>
                                <Text style={styles.equipmentDesc}>{item.desc}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </LinearGradient>

            {/* PROCESS SECTION */}
            <View style={styles.contentSection}>
                <View style={styles.contentMax}>
                    <Text style={[styles.sectionHeading, { fontSize: SCREEN_WIDTH >= 768 ? 48 : 36 }]}>Our Logistics Workflow</Text>
                    <View style={[styles.processSteps, { flexDirection: SCREEN_WIDTH >= 768 ? 'row' : 'column' }]}>
                        {detail?.processSteps && Array.isArray(detail.processSteps) && detail.processSteps.map((step: any, index: number) => (
                            <View key={index} style={styles.processItem}>
                                <View style={styles.processNumber}>
                                    <Text style={styles.processNumberText}>{index + 1}</Text>
                                </View>
                                <View style={styles.processContent}>
                                    <Text style={styles.processTitle}>{step.title}</Text>
                                    <Text style={styles.processDesc}>{step.desc}</Text>
                                </View>
                                {index < (detail.processSteps?.length || 0) - 1 && SCREEN_WIDTH >= 768 && (
                                    <View style={styles.processLine} />
                                )}
                            </View>
                        ))}
                    </View>
                </View>
            </View>

            {/* FEATURES LIST (GLASSMORPHISM) */}
            <LinearGradient colors={[Colors.navy, '#0A1128']} style={styles.contentSection}>
                <View style={styles.contentMax}>
                    <Text style={[styles.sectionHeading, { color: '#FFF', fontSize: SCREEN_WIDTH >= 768 ? 48 : 36 }]}>Industry-Leading Standards</Text>
                    <View style={styles.featuresGrid}>
                        {detail?.whyChooseUs?.map((feature: string, index: number) => (
                            <View key={index} style={[styles.featureItem, { width: SCREEN_WIDTH >= 1024 ? '47%' : '100%' }]}>
                                <View style={styles.checkIcon}>
                                    <ShieldCheck size={20} color={Colors.primary} />
                                </View>
                                <Text style={styles.featureText}>{feature}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </LinearGradient>

            {/* SERVICES STRIP */}
            {detail?.typicalServices && detail.typicalServices.length > 0 && (
                <View style={[styles.contentSection, { backgroundColor: '#F8FAFC' }]}>
                    <View style={styles.contentMax}>
                        <Text style={[styles.sectionHeading, { fontSize: SCREEN_WIDTH >= 768 ? 48 : 36, marginBottom: 40 }]}>Services We Use for This Industry</Text>
                        <View style={styles.servicesStrip}>
                            {detail.typicalServices.map((service: string, index: number) => (
                                <Link key={index} href="/services" asChild>
                                    <TouchableOpacity style={styles.servicePill}>
                                        <Text style={styles.servicePillText}>{service}</Text>
                                        <ArrowRight size={16} color={Colors.primary} />
                                    </TouchableOpacity>
                                </Link>
                            ))}
                        </View>
                    </View>
                </View>
            )}

            {/* CASE STUDY SECTION */}
            <View style={styles.caseStudySection}>
                <View style={styles.contentMax}>
                    <View style={[styles.caseStudyCard, { padding: SCREEN_WIDTH >= 1024 ? 100 : 50 }]}>
                        <LinearGradient
                            colors={['rgba(255,255,255,1)', 'rgba(241,245,249,0.5)']}
                            style={StyleSheet.absoluteFillObject}
                        />
                        <Quote size={48} color={Colors.primary} style={styles.quoteIcon} />
                        <Text style={styles.caseStudyTitle}>{detail.caseStudyTitle}</Text>
                        <Text style={[styles.caseStudyQuote, { fontSize: SCREEN_WIDTH >= 768 ? 36 : 24, lineHeight: SCREEN_WIDTH >= 768 ? 52 : 36 }]}>"{detail.caseStudyQuote}"</Text>
                        <View style={styles.authorBox}>
                            <View style={styles.authorInfo}>
                                <Text style={styles.authorName}>{detail.caseStudyAuthor}</Text>
                                <Text style={styles.authorVerified}>Verified Enterprise Client</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>

            {/* CTA SECTION */}
            <LinearGradient colors={['#1e293b', Colors.navy]} style={styles.ctaSection}>
                <View style={styles.ctaContent}>
                    <Text style={styles.ctaTitle}>Ready to streamline your {detail?.id || 'logistics'}?</Text>
                    <Text style={styles.ctaDesc}>Get in touch with our specialist sector team today for a bespoke consultation.</Text>
                    <Link href="/quote" asChild>
                        <TouchableOpacity style={styles.ctaBtn}>
                            <Text style={styles.ctaBtnText}>Get a Tailored Quote</Text>
                            <ArrowRight size={20} color={Colors.primary} />
                        </TouchableOpacity>
                    </Link>
                </View>
            </LinearGradient>
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
    statsBar: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 50,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    statsInner: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
    },
    statItem: {
        alignItems: 'center',
        paddingHorizontal: 20,
        margin: 15,
    },
    statValue: {
        fontSize: 48,
        fontWeight: '900',
        color: Colors.primary,
        marginBottom: 8,
    },
    statLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.navy,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    equipmentGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginTop: 20,
    },
    equipmentCard: {
        backgroundColor: '#FFFFFF',
        padding: 40,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        textAlign: 'center',
        margin: 15,
    },
    equipmentIconBox: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    equipmentTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.navy,
        marginBottom: 16,
        textAlign: 'center',
    },
    equipmentDesc: {
        fontSize: 16,
        color: Colors.textSecondary,
        lineHeight: 26,
        textAlign: 'center',
    },
    processSteps: {
        justifyContent: 'space-between',
        marginTop: 40,
    },
    processItem: {
        flex: 1,
        alignItems: 'center',
        position: 'relative',
        marginVertical: 20,
    },
    processNumber: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        zIndex: 2,
    },
    processNumberText: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: '900',
    },
    processContent: {
        alignItems: 'center',
    },
    processTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.navy,
        marginBottom: 12,
        textAlign: 'center',
    },
    processDesc: {
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
    },
    processLine: {
        position: 'absolute',
        top: 30,
        left: '60%',
        width: '80%',
        height: 2,
        backgroundColor: '#E2E8F0',
        zIndex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    errorText: {
        fontSize: 18,
        color: Colors.textSecondary,
        marginBottom: 20,
    },
    backBtn: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: Colors.primary,
        borderRadius: 8,
    },
    backBtnText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    contentMax: {
        maxWidth: 1200,
        width: '100%',
        alignSelf: 'center',
    },
    heroSection: {
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 550,
        position: 'relative',
    },
    heroContent: {
        maxWidth: 800,
        alignItems: 'center',
        zIndex: 1,
    },
    backLink: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 40,
    },
    backLinkText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    badge: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 30,
        marginBottom: 32,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 2,
    },
    heroTitle: {
        fontWeight: '900',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 32,
    },
    heroSubtitle: {
        color: '#CBD5E1',
        textAlign: 'center',
        lineHeight: 38,
        maxWidth: 750,
    },
    contentSection: {
        paddingVertical: 120,
        paddingHorizontal: 24,
    },
    dualGrid: {
    },
    contentBlock: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 50,
        borderRadius: 32,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 2,
        margin: 30,
    },
    iconBox: {
        width: 72,
        height: 72,
        borderRadius: 20,
        backgroundColor: Colors.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    blockTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: Colors.navy,
        marginBottom: 20,
    },
    blockText: {
        fontSize: 19,
        color: Colors.textSecondary,
        lineHeight: 32,
    },
    sectionHeading: {
        fontWeight: '900',
        color: Colors.navy,
        textAlign: 'center',
        marginBottom: 80,
    },
    featuresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 32,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        margin: 15,
    },
    checkIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFF',
        flex: 1,
        marginLeft: 20,
    },
    caseStudySection: {
        paddingVertical: 140,
        paddingHorizontal: 24,
        backgroundColor: '#F1F5F9',
    },
    caseStudyCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 48,
        alignItems: 'center',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.1,
        shadowRadius: 40,
        elevation: 10,
    },
    quoteIcon: {
        marginBottom: 40,
        opacity: 0.2,
    },
    caseStudyTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: Colors.primary,
        letterSpacing: 3,
        marginBottom: 32,
        textTransform: 'uppercase',
    },
    caseStudyQuote: {
        fontWeight: '800',
        fontStyle: 'italic',
    },
    authorBox: {
        alignItems: 'center',
    },
    authorInfo: {
        alignItems: 'center',
    },
    authorName: {
        fontSize: 22,
        fontWeight: '900',
        color: Colors.navy,
    },
    authorVerified: {
        fontSize: 16,
        color: Colors.primary,
        fontWeight: '800',
        marginTop: 4,
    },
    ctaSection: {
        paddingVertical: 140,
        paddingHorizontal: 24,
        backgroundColor: Colors.navy,
        alignItems: 'center',
    },
    ctaContent: {
        maxWidth: 800,
        alignItems: 'center',
    },
    ctaTitle: {
        fontSize: 48,
        fontWeight: '900',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 24,
    },
    ctaDesc: {
        fontSize: 22,
        color: '#94A3B8',
        textAlign: 'center',
        marginBottom: 60,
        lineHeight: 34,
    },
    ctaBtn: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 50,
        paddingVertical: 24,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 8,
    },
    ctaBtnText: {
        fontSize: 20,
        fontWeight: '900',
        color: '#FFF',
        marginRight: 16,
    },
    servicesStrip: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    servicePill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        margin: 8,
    },
    servicePillText: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.navy,
        marginRight: 12,
    }
});
