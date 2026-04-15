import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, useWindowDimensions, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import { useCMS } from '@/context/CMSContext';
import Colors from '@/constants/Colors';
import { 
    CheckCircle2, 
    ArrowRight, 
    Clock, 
    Target, 
    Zap, 
    Shield, 
    Package, 
    Users, 
    FileText, 
    Rocket,
    BarChart3,
    Truck,
    Plane,
    Globe
} from 'lucide-react-native';
import Head from 'expo-router/head';

const IconMap: any = {
    Clock, Target, Zap, Shield, Package, Users, FileText, Rocket, CheckCircle2, BarChart3, Truck, Plane, Globe
};

const DynamicIcon = ({ name, size = 24, color = Colors.primary }: any) => {
    const IconComponent = IconMap[name] || CheckCircle2;
    return <IconComponent size={size} color={color} />;
};

export default function ServiceDetailPage() {
    const { slug } = useLocalSearchParams<{ slug: string }>();
    const { serviceDetails, isLoaded } = useCMS();
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const router = useRouter();

    const config = serviceDetails[slug as string];

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
                <Text style={styles.errorTitle}>Service Not Found</Text>
                <Text style={styles.errorSubtitle}>We couldn't find the service you're looking for.</Text>
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
                <title>{config.metaTitle}</title>
                <meta name="description" content={config.metaDesc} />
            </Head>

            {/* HERO SECTION */}
            <View style={[styles.heroSection, { height: isMobile ? 400 : 500 }]}>
                <Image
                    source={{ uri: config.heroImageUrl }}
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="cover"
                />
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(15, 23, 42, 0.7)' }]} />
                <View style={[styles.contentMax, styles.heroContent]}>
                    <Text style={styles.heroTag}>Logistics Solutions</Text>
                    <Text style={[styles.titleText, { fontSize: isMobile ? 40 : 64, lineHeight: isMobile ? 48 : 72 }]}>
                        {config.title}
                    </Text>
                    <Text style={styles.heroSubtitle}>{config.description}</Text>
                    <View style={styles.heroActions}>
                        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/contact')}>
                            <Text style={styles.primaryBtnText}>Get an Instant Quote</Text>
                            <ArrowRight size={20} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* LONG CONTENT SECTION */}
            <View style={styles.section}>
                <View style={styles.contentMax}>
                    <View style={[styles.splitGrid, { flexDirection: isMobile ? 'column' : 'row' }]}>
                        <View style={styles.mainText}>
                            <Text style={styles.sectionTitle}>Overview</Text>
                            <Text style={styles.longDescription}>{config.longContent}</Text>
                            
                            <Text style={styles.sectionSubTitle}>Key Benefits</Text>
                            <View style={styles.benefitsGrid}>
                                {config.benefits.map((benefit, idx) => (
                                    <View key={idx} style={styles.benefitItem}>
                                        <CheckCircle2 size={20} color={Colors.primary} />
                                        <Text style={styles.benefitText}>{benefit}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        <View style={styles.sidebar}>
                            <View style={styles.ctaBox}>
                                <Text style={styles.ctaBoxTitle}>Ready to Ship?</Text>
                                <Text style={styles.ctaBoxText}>Our experts are ready to handle your critical deliveries 24/7.</Text>
                                <TouchableOpacity style={styles.ctaBoxBtn} onPress={() => router.push('/contact')}>
                                    <Text style={styles.ctaBoxBtnText}>Contact Our Desk</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </View>

            {/* FEATURES GRID */}
            <View style={[styles.section, { backgroundColor: '#F8FAFC' }]}>
                <View style={styles.contentMax}>
                    <Text style={styles.sectionHeader}>
                        Why Choose Our {config.title}
                    </Text>
                    <View style={styles.featuresGrid}>
                        {config.features.map((feature) => (
                            <View key={feature.id} style={[styles.featureCard, { width: isMobile ? '100%' : '31%' }]}>
                                <View style={styles.featureIconBox}>
                                    <DynamicIcon name={feature.icon} size={32} color={Colors.primary} />
                                </View>
                                <Text style={styles.featureTitle}>{feature.title}</Text>
                                <Text style={styles.featureDesc}>{feature.desc}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </View>

            {/* PROCESS SECTION */}
            <View style={styles.section}>
                <View style={styles.contentMax}>
                    <Text style={styles.sectionHeader}>
                        How It Works
                    </Text>
                    <View style={[styles.processSteps, { flexDirection: isMobile ? 'column' : 'row' }]}>
                        {config.process.map((step, idx) => (
                            <View key={step.id} style={styles.processItem}>
                                <View style={styles.stepNumBox}>
                                    <Text style={styles.stepNum}>{step.step}</Text>
                                </View>
                                {idx < config.process.length - 1 && !isMobile && <View style={styles.processLine} />}
                                <Text style={styles.processTitle}>{step.title}</Text>
                                <Text style={styles.processDesc}>{step.desc}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </View>

            {/* FINAL CTA */}
            <View style={styles.ctaBar}>
                <View style={styles.contentMax}>
                    <View style={[styles.ctaInner, { flexDirection: isMobile ? 'column' : 'row' }]}>
                        <View style={styles.ctaTextContainer}>
                            <Text style={styles.ctaBarTitle}>Specialist Requirements?</Text>
                            <Text style={styles.ctaBarSubtitle}>Our team can design a bespoke solution for your specific cargo needs.</Text>
                        </View>
                        <TouchableOpacity style={styles.whiteBtn} onPress={() => router.push('/contact')}>
                            <Text style={styles.whiteBtnText}>Talk to an Expert</Text>
                        </TouchableOpacity>
                    </View>
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
    heroActions: {
        flexDirection: 'row',
        gap: 16,
    },
    primaryBtn: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 32,
        paddingVertical: 18,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    primaryBtnText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    section: {
        paddingVertical: 100,
    },
    sectionTitle: {
        fontSize: 32, 
        fontWeight: '800', 
        marginBottom: 24, 
        color: Colors.navy
    },
    sectionSubTitle: {
        fontSize: 24, 
        fontWeight: '800', 
        marginTop: 40, 
        marginBottom: 20, 
        color: Colors.navy
    },
    sectionHeader: {
        fontSize: 36, 
        fontWeight: '900', 
        textAlign: 'center', 
        marginBottom: 60, 
        color: Colors.navy 
    },
    splitGrid: {
        gap: 60,
    },
    mainText: {
        flex: 2,
    },
    longDescription: {
        fontSize: 18,
        color: 'gray',
        lineHeight: 30,
    },
    benefitsGrid: {
        gap: 16,
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    benefitText: {
        fontSize: 17,
        color: Colors.navy,
        fontWeight: '500',
    },
    sidebar: {
        flex: 1,
    },
    ctaBox: {
        backgroundColor: Colors.navy,
        padding: 40,
        borderRadius: 24,
    },
    ctaBoxTitle: {
        fontSize: 20, 
        fontWeight: '800', 
        color: '#FFF', 
        marginBottom: 12
    },
    ctaBoxText: {
        color: '#94A3B8',
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 24,
    },
    ctaBoxBtn: {
        backgroundColor: Colors.primary,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    ctaBoxBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    featuresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 32,
    },
    featureCard: {
        backgroundColor: '#FFFFFF',
        padding: 40,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    featureIconBox: {
        width: 64,
        height: 64,
        borderRadius: 16,
        backgroundColor: Colors.primary + '10',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    featureTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.navy,
        marginBottom: 12,
    },
    featureDesc: {
        fontSize: 16,
        color: 'gray',
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
    },
    processDesc: {
        fontSize: 15,
        color: 'gray',
        textAlign: 'center',
        lineHeight: 22,
    },
    ctaBar: {
        backgroundColor: Colors.primary,
        paddingVertical: 60,
    },
    ctaInner: {
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 32,
    },
    ctaTextContainer: {
        flex: 1,
    },
    ctaBarTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 12,
    },
    ctaBarSubtitle: {
        fontSize: 18,
        color: 'rgba(255,255,255,0.8)',
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
