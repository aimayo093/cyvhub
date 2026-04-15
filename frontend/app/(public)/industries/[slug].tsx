import React from 'react';
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
    Quote
} from 'lucide-react-native';
import Head from 'expo-router/head';

const IconMap: any = {
    Truck, AlertTriangle, Zap, ShieldCheck, HardHat, Building2, Settings, Factory, Recycle, Package
};

const DynamicIcon = ({ name, size = 24, color = Colors.primary }: any) => {
    const IconComponent = IconMap[name] || Package;
    return <IconComponent size={size} color={color} />;
};

export default function IndustryDetailPage() {
    const { slug } = useLocalSearchParams<{ slug: string }>();
    const { industryDetails, isLoaded } = useCMS();
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const router = useRouter();

    const config = industryDetails[slug as string];

    if (!isLoaded) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (!config) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorTitle}>Industry Not Found</Text>
                <Text style={styles.errorSubtitle}>We couldn't find the industry profile you're looking for.</Text>
                <TouchableOpacity style={styles.homeBtn} onPress={() => router.push('/')}>
                    <Text style={styles.homeBtnText}>Return Home</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const isMobile = SCREEN_WIDTH < 768;

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <Head>
                <title>{config.title} Specialized Logistics | CYVhub</title>
                <meta name="description" content={`Specialized transport and supply chain solutions for the ${config.title} sector. ${config.subtitle}`} />
            </Head>

            {/* HERO SECTION */}
            <View style={[styles.heroSection, { height: isMobile ? 400 : 550 }]}>
                <Image
                    source={{ uri: config.heroImageUrl }}
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="cover"
                />
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(15, 23, 42, 0.8)' }]} />
                <View style={[styles.contentMax, styles.heroContent]}>
                    <Text style={styles.heroTag}>Industry Specialism</Text>
                    <Text style={[styles.titleText, { fontSize: isMobile ? 40 : 64, lineHeight: isMobile ? 48 : 72 }]}>
                        {config.title}
                    </Text>
                    <Text style={styles.heroSubtitle}>{config.subtitle}</Text>
                    <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/contact')}>
                        <Text style={styles.primaryBtnText}>Discuss Your Sector Needs</Text>
                        <ArrowRight size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* STATS BAR */}
            <View style={styles.statsBar}>
                <View style={[styles.contentMax, styles.statsInner]}>
                    {config.stats.map((stat, index) => (
                        <View key={index} style={styles.statItem}>
                            <Text style={styles.statValue}>{stat.value}</Text>
                            <Text style={styles.statLabel}>{stat.label}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* PROBLEM & SOLUTION SECTION */}
            <View style={styles.section}>
                <View style={styles.contentMax}>
                    <View style={[styles.dualGrid, { flexDirection: isMobile ? 'column' : 'row' }]}>
                        <View style={styles.contentBlock}>
                            <View style={styles.iconBox}>
                                <AlertTriangle size={32} color={Colors.primary} />
                            </View>
                            <Text style={styles.blockTitle}>{config.problemTitle}</Text>
                            <Text style={styles.blockText}>{config.problemContent}</Text>
                        </View>
                        <View style={styles.contentBlock}>
                            <View style={styles.iconBox}>
                                <Zap size={32} color={Colors.primary} />
                            </View>
                            <Text style={styles.blockTitle}>{config.solutionTitle}</Text>
                            <Text style={styles.blockText}>{config.solutionContent}</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* EQUIPMENT & CAPABILITY */}
            <View style={[styles.section, { backgroundColor: '#F8FAFC' }]}>
                <View style={styles.contentMax}>
                    <Text style={styles.sectionHeader}>Sector Capability</Text>
                    <View style={styles.equipmentGrid}>
                        {config.equipment.map((item, index) => (
                            <View key={index} style={[styles.equipmentCard, { width: isMobile ? '100%' : '31%' }]}>
                                <View style={styles.equipmentIconBox}>
                                    <DynamicIcon name={item.icon} size={32} color={Colors.primary} />
                                </View>
                                <Text style={styles.equipmentTitle}>{item.title}</Text>
                                <Text style={styles.equipmentDesc}>{item.desc}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </View>

            {/* PROCESS SECTION */}
            <View style={styles.section}>
                <View style={styles.contentMax}>
                    <h2 style={{ fontSize: 36, fontWeight: '900', textAlign: 'center', marginBottom: 60, color: Colors.navy }}>
                        Workflow & Standards
                    </h2>
                    <View style={[styles.processSteps, { flexDirection: isMobile ? 'column' : 'row' }]}>
                        {config.processSteps.map((step, idx) => (
                            <View key={idx} style={styles.processItem}>
                                <View style={styles.stepNumBox}>
                                    <Text style={styles.stepNum}>{idx + 1}</Text>
                                </View>
                                {idx < config.processSteps.length - 1 && !isMobile && <View style={styles.processLine} />}
                                <Text style={styles.processTitle}>{step.title}</Text>
                                <Text style={styles.processDesc}>{step.desc}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </View>

            {/* CASE STUDY SECTION */}
            <View style={styles.caseStudySection}>
                <View style={styles.contentMax}>
                    <View style={[styles.caseStudyCard, { padding: isMobile ? 40 : 80 }]}>
                        <Quote size={48} color={Colors.primary} style={{ opacity: 0.2, marginBottom: 24 }} />
                        <Text style={styles.caseStudyTitle}>{config.caseStudyTitle}</Text>
                        <Text style={[styles.caseStudyQuote, { fontSize: isMobile ? 24 : 32 }]}>
                            "{config.caseStudyQuote}"
                        </Text>
                        <View style={{ marginTop: 32 }}>
                            <Text style={{ fontWeight: '900', fontSize: 20, color: Colors.navy }}>{config.caseStudyAuthor}</Text>
                            <Text style={{ color: Colors.primary, fontWeight: '700', marginTop: 4 }}>Verified Enterprise Client</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* CTA SECTION */}
            <View style={styles.ctaSection}>
                <View style={styles.ctaContent}>
                    <Text style={styles.ctaHeadline}>Ready to solve your {config.title} logistics?</Text>
                    <Text style={styles.ctaSubline}>Bring your complex requirements to our sector specialists today.</Text>
                    <TouchableOpacity style={styles.whiteBtn} onPress={() => router.push('/contact')}>
                        <Text style={styles.whiteBtnText}>Contact Our Sector Team</Text>
                    </TouchableOpacity>
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
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        minHeight: 400,
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
        color: '#94A3B8',
        lineHeight: 32,
        maxWidth: 700,
        marginBottom: 40,
    },
    primaryBtn: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 32,
        paddingVertical: 18,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        alignSelf: 'flex-start',
    },
    primaryBtnText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    statsBar: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 60,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    statsInner: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
        gap: 40,
    },
    statItem: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    statValue: {
        fontSize: 44,
        fontWeight: '900',
        color: Colors.primary,
        marginBottom: 8,
    },
    statLabel: {
        fontSize: 14,
        fontWeight: '900',
        color: Colors.navy,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    section: {
        paddingVertical: 100,
    },
    dualGrid: {
        gap: 40,
    },
    contentBlock: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 40,
        borderRadius: 32,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    iconBox: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: Colors.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    blockTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: Colors.navy,
        marginBottom: 16,
    },
    blockText: {
        fontSize: 17,
        color: 'gray',
        lineHeight: 28,
    },
    sectionHeader: {
        fontSize: 36, 
        fontWeight: '900', 
        textAlign: 'center', 
        marginBottom: 60, 
        color: Colors.navy 
    },
    equipmentGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 32,
        justifyContent: 'center',
    },
    equipmentCard: {
        backgroundColor: '#FFFFFF',
        padding: 40,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
    },
    equipmentIconBox: {
        width: 72,
        height: 72,
        borderRadius: 36,
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
        color: 'gray',
        textAlign: 'center',
        lineHeight: 24,
    },
    processSteps: {
        justifyContent: 'space-between',
        gap: 32,
    },
    processItem: {
        flex: 1,
        alignItems: 'center',
        position: 'relative',
    },
    stepNumBox: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        zIndex: 2,
    },
    stepNum: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: '900',
    },
    processLine: {
        position: 'absolute',
        top: 30,
        left: '50%',
        width: '100%',
        height: 2,
        backgroundColor: '#E2E8F0',
        zIndex: 1,
    },
    processTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.navy,
        marginBottom: 12,
        textAlign: 'center',
    },
    processDesc: {
        fontSize: 15,
        color: 'gray',
        textAlign: 'center',
        lineHeight: 22,
    },
    caseStudySection: {
        paddingVertical: 120,
        backgroundColor: '#F1F5F9',
    },
    caseStudyCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 40,
        alignItems: 'center',
    },
    caseStudyTitle: {
        color: Colors.primary,
        fontWeight: '900',
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: 24,
    },
    caseStudyQuote: {
        fontWeight: '800',
        textAlign: 'center',
        color: Colors.navy,
        lineHeight: 44,
    },
    ctaSection: {
        backgroundColor: Colors.navy,
        paddingVertical: 100,
        alignItems: 'center',
    },
    ctaContent: {
        maxWidth: 800,
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    ctaHeadline: {
        fontSize: 40,
        fontWeight: '900',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 20,
    },
    ctaSubline: {
        fontSize: 20,
        color: '#94A3B8',
        textAlign: 'center',
        marginBottom: 48,
        lineHeight: 30,
    },
    whiteBtn: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 40,
        paddingVertical: 20,
        borderRadius: 12,
    },
    whiteBtnText: {
        color: Colors.primary,
        fontSize: 18,
        fontWeight: '800',
    }
});
