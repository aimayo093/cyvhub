import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, Image, ActivityIndicator, Dimensions } from 'react-native';
import { Link, useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Truck, Clock, ShieldCheck, Zap, ArrowRight, Package, Map,
    CalendarSync, FileText, Box, Archive, BriefcaseMedical,
    Monitor, AlertTriangle, Eye, ArrowLeftRight, HardHat, Building2,
    Settings, Factory, Recycle, ArrowLeft, ChevronRight, Quote
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/colors';
import { IndustryDetail, initialIndustryDetails } from '@/constants/cmsDefaults';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

export default function IndustryDetailPage() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [detail, setDetail] = useState<IndustryDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            const loadData = async () => {
                try {
                    const industryId = id as string;

                    // Try CMS data first, fallback to defaults
                    const saved = await AsyncStorage.getItem('cms_industryDetails');
                    if (saved) {
                        const allIndustries = JSON.parse(saved);
                        if (allIndustries[industryId]) {
                            setDetail(allIndustries[industryId]);
                            return;
                        }
                    }

                    // Fallback to initial defaults
                    const industryData = initialIndustryDetails[industryId];
                    if (industryData) {
                        setDetail(industryData);
                    }
                } catch (e) {
                    console.error('Failed to load industry detail:', e);
                } finally {
                    setLoading(false);
                }
            };
            loadData();
        }, [id])
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (!detail) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Industry not found</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* HERO SECTION */}
            <View style={styles.heroSection}>
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
                    <Text style={styles.heroTitle}>{detail.title}</Text>
                    <Text style={styles.heroSubtitle}>{detail.subtitle}</Text>
                </View>
            </View>

            {/* STATS BAR */}
            <View style={styles.statsBar}>
                <View style={styles.contentMax}>
                    <View style={styles.statsInner}>
                        {detail.stats.map((stat, index) => (
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
                    <View style={styles.dualGrid}>
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
                            <Text style={styles.blockTitle}>{detail.solutionTitle}</Text>
                            <Text style={styles.blockText}>{detail.solutionContent}</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* EQUIPMENT & CAPABILITY */}
            <LinearGradient colors={['#F8FAFC', '#FFFFFF']} style={styles.contentSection}>
                <View style={styles.contentMax}>
                    <Text style={styles.sectionHeading}>Bespoke Fleet & Capability</Text>
                    <View style={styles.equipmentGrid}>
                        {detail.equipment.map((item, index) => (
                            <View key={index} style={styles.equipmentCard}>
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
                    <Text style={styles.sectionHeading}>Our Logistics Workflow</Text>
                    <View style={styles.processSteps}>
                        {detail.processSteps.map((step, index) => (
                            <View key={index} style={styles.processItem}>
                                <View style={styles.processNumber}>
                                    <Text style={styles.processNumberText}>{index + 1}</Text>
                                </View>
                                <View style={styles.processContent}>
                                    <Text style={styles.processTitle}>{step.title}</Text>
                                    <Text style={styles.processDesc}>{step.desc}</Text>
                                </View>
                                {index < detail.processSteps.length - 1 && Platform.OS === 'web' && (
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
                    <Text style={[styles.sectionHeading, { color: '#FFF' }]}>Industry-Leading Standards</Text>
                    <View style={styles.featuresGrid}>
                        {detail.features.map((feature, index) => (
                            <View key={index} style={styles.featureItem}>
                                <View style={styles.checkIcon}>
                                    <ShieldCheck size={20} color={Colors.primary} />
                                </View>
                                <Text style={styles.featureText}>{feature}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </LinearGradient>

            {/* CASE STUDY SECTION */}
            <View style={styles.caseStudySection}>
                <View style={styles.contentMax}>
                    <View style={styles.caseStudyCard}>
                        <LinearGradient
                            colors={['rgba(255,255,255,1)', 'rgba(241,245,249,0.5)']}
                            style={StyleSheet.absoluteFillObject}
                        />
                        <Quote size={48} color={Colors.primary} style={styles.quoteIcon} />
                        <Text style={styles.caseStudyTitle}>{detail.caseStudyTitle}</Text>
                        <Text style={styles.caseStudyQuote}>"{detail.caseStudyQuote}"</Text>
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
                    <Text style={styles.ctaTitle}>Ready to streamline your {detail.id} logistics?</Text>
                    <Text style={styles.ctaDesc}>Get in touch with our specialist sector team today for a bespoke consultation.</Text>
                    <Link href="/contact" asChild>
                        <TouchableOpacity style={styles.ctaBtn}>
                            <Text style={styles.ctaBtnText}>Request a Consultation</Text>
                            <ArrowRight size={20} color={Colors.primary} />
                        </TouchableOpacity>
                    </Link>
                </View>
            </LinearGradient>
        </ScrollView>
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
        gap: 30,
    },
    statItem: {
        alignItems: 'center',
        paddingHorizontal: 20,
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
        gap: 30,
        justifyContent: 'center',
        marginTop: 20,
    },
    equipmentCard: {
        width: Platform.OS === 'web' ? 'calc(33.333% - 20px)' as any : '100%',
        backgroundColor: '#FFFFFF',
        padding: 40,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        textAlign: 'center',
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
        flexDirection: Platform.OS === 'web' ? 'row' : 'column',
        justifyContent: 'space-between',
        gap: 40,
        marginTop: 40,
    },
    processItem: {
        flex: 1,
        alignItems: 'center',
        position: 'relative',
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
        paddingVertical: Platform.OS === 'web' ? 140 : 100,
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
        gap: 8,
    },
    backLinkText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
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
        fontSize: Platform.OS === 'web' ? 72 : 44,
        fontWeight: '900',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: Platform.OS === 'web' ? 84 : 52,
    },
    heroSubtitle: {
        fontSize: Platform.OS === 'web' ? 26 : 20,
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
        flexDirection: Platform.OS === 'web' ? 'row' : 'column',
        gap: 60,
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
        fontSize: Platform.OS === 'web' ? 48 : 36,
        fontWeight: '900',
        color: Colors.navy,
        textAlign: 'center',
        marginBottom: 80,
    },
    featuresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 30,
        justifyContent: 'center',
    },
    featureItem: {
        width: Platform.OS === 'web' ? 'calc(50% - 15px)' as any : '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 32,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
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
    },
    caseStudySection: {
        paddingVertical: 140,
        paddingHorizontal: 24,
        backgroundColor: '#F1F5F9',
    },
    caseStudyCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 48,
        padding: Platform.OS === 'web' ? 100 : 50,
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
        fontSize: Platform.OS === 'web' ? 36 : 24,
        fontWeight: '800',
        color: Colors.navy,
        textAlign: 'center',
        lineHeight: Platform.OS === 'web' ? 52 : 36,
        marginBottom: 48,
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
        gap: 16,
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
    }
});
