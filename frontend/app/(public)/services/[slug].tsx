import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, useWindowDimensions, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import { useCMS } from '@/context/CMSContext';
import Colors from '@/constants/colors';
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
    Globe,
    Calendar,
    Map,
    Briefcase,
    ArrowLeftRight,
    ShieldCheck,
    Settings
} from 'lucide-react-native';
import Head from 'expo-router/head';

const IconMap: any = {
    Clock, Target, Zap, Shield, Package, Users, FileText, Rocket, CheckCircle2, BarChart3, Truck, Plane, Globe, Calendar, Map, Briefcase, ArrowLeftRight, ShieldCheck, Settings
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

    if (!config || !config.publishStatus) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorTitle}>Service Not Found</Text>
                <Text style={styles.errorSubtitle}>We couldn't find the service you're looking for.</Text>
                <TouchableOpacity 
                    style={styles.homeBtn} 
                    onPress={() => {
                        if (Platform.OS === 'web') {
                            window.location.href = '/';
                        } else {
                            router.push('/');
                        }
                    }}
                >
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
                    <Text style={styles.heroTag}>Service Excellence</Text>
                    <Text style={[styles.titleText, { fontSize: isMobile ? 40 : 64, lineHeight: isMobile ? 48 : 72 }]}>
                        {config.heroHeading}
                    </Text>
                    <Text style={styles.heroSubtitle}>{config.heroSubtext}</Text>
                    <View style={styles.heroActions}>
                        <TouchableOpacity 
                            style={styles.primaryBtn} 
                            onPress={() => {
                                if (Platform.OS === 'web') {
                                    window.location.href = '/contact';
                                } else {
                                    router.push('/contact');
                                }
                            }}
                        >
                            <Text style={styles.primaryBtnText}>Get an Instant Quote</Text>
                            <ArrowRight size={20} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* OVERVIEW SECTION */}
            <View style={styles.section}>
                <View style={styles.contentMax}>
                    <View style={[styles.splitGrid, { flexDirection: isMobile ? 'column' : 'row' }]}>
                        <View style={styles.mainText}>
                            <Text style={styles.sectionTitle}>Overview</Text>
                            <Text style={styles.longDescription}>{config.overview}</Text>
                            
                            <Text style={styles.sectionSubTitle}>How We Deliver</Text>
                            <Text style={styles.longDescription}>{config.howItWorks}</Text>
                        </View>

                        <View style={styles.sidebar}>
                            <View style={styles.ctaBox}>
                                <Text style={styles.ctaBoxTitle}>Ready to Move?</Text>
                                <Text style={styles.ctaBoxText}>Our logistics experts are ready to handle your business-critical jobs 24/7/365.</Text>
                                <TouchableOpacity 
                                    style={styles.ctaBoxBtn} 
                                    onPress={() => {
                                        if (Platform.OS === 'web') {
                                            window.location.href = '/contact';
                                        } else {
                                            router.push('/contact');
                                        }
                                    }}
                                >
                                    <Text style={styles.ctaBoxBtnText}>Open an Account</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </View>

            {/* DESCRIPTION SECTION */}
            <View style={[styles.section, { backgroundColor: '#F8FAFC' }]}>
                <View style={styles.contentMax}>
                    <View style={[styles.splitGrid, { flexDirection: isMobile ? 'column' : 'row' }]}>
                        <View style={styles.sidebar}>
                             <View style={styles.benefitHeaderBox}>
                                <DynamicIcon name={config.icon} size={48} color={Colors.primary} />
                                <Text style={styles.benefitHeaderTitle}>Professional Solution</Text>
                             </View>
                        </View>
                        <View style={styles.mainText}>
                            <Text style={styles.sectionTitle}>Service Description</Text>
                            <Text style={styles.longDescription}>{config.description}</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* BENEFITS & USE CASES */}
            <View style={styles.section}>
                <View style={styles.contentMax}>
                    <View style={[styles.splitGrid, { flexDirection: isMobile ? 'column' : 'row' }]}>
                        <View style={styles.mainText}>
                            <Text style={styles.sectionSubTitle}>Key Benefits</Text>
                            <View style={styles.benefitsGrid}>
                                {config.benefits && Array.isArray(config.benefits) && config.benefits.map((benefit: any, idx: number) => (
                                    <View key={idx} style={styles.benefitItem}>
                                        <CheckCircle2 size={24} color={Colors.primary} />
                                        <Text style={styles.benefitText}>{benefit}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                        <View style={styles.mainText}>
                            <Text style={styles.sectionSubTitle}>Typical Use Cases</Text>
                            <View style={styles.benefitsGrid}>
                                {config.useCases && Array.isArray(config.useCases) && config.useCases.map((useCase: any, idx: number) => (
                                    <View key={idx} style={styles.benefitItem}>
                                        <View style={styles.bulletPoint} />
                                        <Text style={styles.benefitText}>{useCase}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>
                </View>
            </View>

            {/* WHY CHOOSE US */}
            <View style={[styles.section, { backgroundColor: Colors.navy }]}>
                <View style={styles.contentMax}>
                    <Text style={[styles.sectionHeader, { color: '#FFF' }]}>Why Choose CYVhub</Text>
                    <View style={styles.centeredContent}>
                         {config.whyChooseUs && Array.isArray(config.whyChooseUs) && config.whyChooseUs.map((text: any, idx: number) => (
                             <Text key={idx} style={styles.whiteInfoText}>{text}</Text>
                         ))}
                    </View>
                </View>
            </View>

            {/* FINAL CTA */}
            <View style={styles.ctaBar}>
                <View style={styles.contentMax}>
                    <View style={[styles.ctaInner, { flexDirection: isMobile ? 'column' : 'row' }]}>
                        <View style={styles.ctaTextContainer}>
                            <Text style={styles.ctaBarTitle}>{config.ctaHeading}</Text>
                            <Text style={styles.ctaBarSubtitle}>{config.ctaText}</Text>
                        </View>
                        <TouchableOpacity 
                            style={styles.whiteBtn} 
                            onPress={() => {
                                if (Platform.OS === 'web') {
                                    window.location.href = config.ctaButtonUrl || '/contact';
                                } else {
                                    router.push(config.ctaButtonUrl as any);
                                }
                            }}
                        >
                            <Text style={styles.whiteBtnText}>{config.ctaButtonText}</Text>
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
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    errorTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: Colors.navy,
        marginBottom: 12,
    },
    errorSubtitle: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 32,
    },
    homeBtn: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
    },
    homeBtnText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    heroSection: {
        width: '100%',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    heroContent: {
        zIndex: 10,
        paddingHorizontal: 20,
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
        color: '#FFFFFF',
        fontWeight: '900',
        marginBottom: 24,
    },
    heroSubtitle: {
        fontSize: 18,
        color: 'rgba(255,255,255,0.8)',
        lineHeight: 28,
        maxWidth: 600,
        marginBottom: 32,
    },
    heroActions: {
        flexDirection: 'row',
    },
    primaryBtn: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    primaryBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
        marginLeft: 12,
    },
    contentMax: {
        maxWidth: 1280,
        width: '100%',
        alignSelf: 'center',
        paddingHorizontal: 20,
    },
    section: {
        paddingVertical: 100,
    },
    splitGrid: {
    },
    mainText: {
        flex: 2,
    },
    sidebar: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: Colors.navy,
        marginBottom: 32,
    },
    sectionSubTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.navy,
        marginTop: 48,
        marginBottom: 24,
    },
    longDescription: {
        fontSize: 18,
        color: '#64748B',
        lineHeight: 30,
        marginBottom: 24,
    },
    ctaBox: {
        backgroundColor: Colors.navy,
        padding: 40,
        borderRadius: 32,
    },
    ctaBoxTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 12,
    },
    ctaBoxText: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.7)',
        lineHeight: 24,
        marginBottom: 32,
    },
    ctaBoxBtn: {
        backgroundColor: Colors.primary,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    ctaBoxBtnText: {
        color: '#FFFFFF',
        fontWeight: '800',
    },
    benefitHeaderBox: {
        alignItems: 'center',
        padding: 40,
        backgroundColor: '#FFF',
        borderRadius: 32,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    benefitHeaderTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.navy,
        marginTop: 16,
        textAlign: 'center',
    },
    benefitsGrid: {
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    benefitText: {
        fontSize: 16,
        color: '#64748B',
        fontWeight: '500',
        marginLeft: 16,
    },
    bulletPoint: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: Colors.primary,
    },
    sectionHeader: {
        fontSize: 36,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 60,
    },
    centeredContent: {
        alignItems: 'center',
        maxWidth: 900,
        alignSelf: 'center',
    },
    whiteInfoText: {
        fontSize: 22,
        color: 'rgba(255,255,255,0.7)',
        lineHeight: 36,
        textAlign: 'center',
        fontWeight: '500',
        marginBottom: 32,
    },
    ctaBar: {
        backgroundColor: Colors.primary,
        paddingVertical: 80,
    },
    ctaInner: {
        alignItems: 'center',
        justifyContent: 'space-between',
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
        color: 'rgba(255,255,255,0.9)',
    },
    whiteBtn: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 40,
        paddingVertical: 20,
        borderRadius: 16,
    },
    whiteBtnText: {
        color: Colors.primary,
        fontSize: 18,
        fontWeight: '800',
    },
});
