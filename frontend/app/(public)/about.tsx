import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Dimensions, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Shield, Leaf, Users, Award, MapPin, Truck, ShieldCheck, Zap, Eye, Target, Rocket, Map, FileText, BriefcaseMedical, Clock, Package } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Link } from 'expo-router';
import Head from 'expo-router/head';
import { useCMS } from '@/context/CMSContext';


const IconMap: any = {
    Shield, Leaf, Users, Award, MapPin, Truck, ShieldCheck, Zap, Eye, Target, Rocket, Map, FileText, BriefcaseMedical, Clock, Package
};

const DynamicIcon = ({ name, size = 24, color = Colors.primary }: any) => {
    const IconComponent = IconMap[name] || Shield;
    return <IconComponent size={size} color={color} />;
};

export default function AboutUsPage() {
    const { aboutPage: config, isLoaded } = useCMS();

    if (!isLoaded) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', minHeight: 400 }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <Head>
                <title>About CYVhub — Redefining UK B2B Logistics</title>
                <meta name="description" content="Learn about CYVhub, the UK's technology-first same-day courier service. Our mission, values, and commitment to sustainable logistics, operated by Cyvrix Limited." />
                <meta property="og:title" content="About CYVhub — Redefining UK B2B Logistics" />
                <meta property="og:description" content="Founded in 2020, CYVhub operates the UK's most advanced B2B courier network. 2M+ deliveries, 5,000+ drivers, 99.8% on-time rate." />
                <meta property="og:image" content="https://www.cyvhub.com/og-image.png" />
                <meta property="og:url" content="https://www.cyvhub.com/about" />
                <meta property="og:type" content="website" />
            </Head>
            {/* HERO SECTION */}
            <View style={styles.heroSection}>
                <Image
                    source={{ uri: config.heroImageUrl }}
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="cover"
                />
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(15, 23, 42, 0.75)' }]} />
                <View style={styles.heroContent}>
                    <Text style={styles.heroTitle}>{config.heroTitle}</Text>
                    <Text style={styles.heroSubtitle}>{config.heroSubtitle}</Text>
                </View>
            </View>

            {/* STATS BAR */}
            <View style={styles.statsBar}>
                <View style={styles.contentMax}>
                    <View style={styles.statsInner}>
                        {config.stats.map((stat, index) => (
                            <View key={index} style={styles.statItem}>
                                <View style={styles.statIconBox}>
                                    <DynamicIcon name={stat.icon} size={28} color={Colors.primary} />
                                </View>
                                <Text style={styles.statValue}>{stat.value}</Text>
                                <Text style={styles.statLabel}>{stat.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </View>

            {/* STORY SECTION */}
            <View style={styles.section}>
                <View style={styles.contentMax}>
                    <View style={styles.storyGrid}>
                        <View style={styles.storyText}>
                            <Text style={styles.sectionTag}>{config.storyTag}</Text>
                            <Text style={styles.sectionTitle}>{config.storyTitle}</Text>
                            <Text style={styles.sectionDesc}>{config.storyContent}</Text>
                        </View>
                        <View style={styles.storyVisual}>
                            <Image
                                source={{ uri: 'https://images.unsplash.com/photo-1586528116311-ad8669966155' }}
                                style={styles.storyImage}
                                resizeMode="cover"
                            />
                        </View>
                    </View>
                </View>
            </View>

            {/* MISSION & VISION */}
            <View style={[styles.section, { backgroundColor: Colors.navy }]}>
                <View style={styles.contentMax}>
                    <View style={styles.dualGrid}>
                        <View style={styles.missionCardInverse}>
                            <View style={styles.iconBoxInverse}>
                                <Target size={32} color={Colors.primary} />
                            </View>
                            <Text style={styles.missionTitleInverse}>{config.missionTitle}</Text>
                            <Text style={styles.missionContentInverse}>{config.missionContent}</Text>
                        </View>
                        <View style={styles.missionCardInverse}>
                            <View style={styles.iconBoxInverse}>
                                <Rocket size={32} color={Colors.primary} />
                            </View>
                            <Text style={styles.missionTitleInverse}>{config.visionTitle}</Text>
                            <Text style={styles.missionContentInverse}>{config.visionContent}</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* VALUES SECTION */}
            <View style={styles.section}>
                <View style={styles.contentMax}>
                    <Text style={[styles.sectionTitle, { textAlign: 'center', marginBottom: 60 }]}>
                        {config.valuesTitle}
                    </Text>
                    <View style={styles.valuesGrid}>
                        {config.values.map((value) => (
                            <View key={value.id} style={styles.valueCard}>
                                <View style={[styles.valueIcon, { backgroundColor: Colors.primary + '15' }]}>
                                    <DynamicIcon name={value.icon} size={28} color={Colors.primary} />
                                </View>
                                <Text style={styles.valueTitle}>{value.title}</Text>
                                <Text style={styles.valueDesc}>{value.desc}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </View>

            {/* MILESTONES */}
            <View style={[styles.section, { backgroundColor: '#F8FAFC' }]}>
                <View style={styles.contentMax}>
                    <Text style={[styles.sectionTitle, { textAlign: 'center', marginBottom: 60 }]}>
                        {config.milestonesTitle}
                    </Text>
                    <View style={styles.milestonesTimeline}>
                        {config.milestones.map((milestone, index) => (
                            <View key={index} style={styles.milestoneItem}>
                                <View style={styles.milestoneYearBox}>
                                    <Text style={styles.milestoneYear}>{milestone.year}</Text>
                                </View>
                                <View style={styles.milestoneContent}>
                                    <Text style={styles.milestoneTitle}>{milestone.title}</Text>
                                    <Text style={styles.milestoneDesc}>{milestone.desc}</Text>
                                </View>
                                {index < config.milestones.length - 1 && Platform.OS === 'web' && (
                                    <View style={styles.milestoneLine} />
                                )}
                            </View>
                        ))}
                    </View>
                </View>
            </View>

            {/* SUSTAINABILITY */}
            <View style={styles.section}>
                <View style={styles.contentMax}>
                    <View style={styles.splitGrid}>
                        <View style={styles.splitText}>
                            <Text style={styles.sectionTag}>{config.sustainabilityTag}</Text>
                            <Text style={styles.sectionTitle}>{config.sustainabilityTitle}</Text>
                            <Text style={styles.sectionDesc}>{config.sustainabilityDesc}</Text>
                        </View>
                        <View style={styles.splitText}>
                            <View style={styles.sustainabilityGrid}>
                                {config.sustainabilityItems.map((item) => (
                                    <View key={item.id} style={styles.susItem}>
                                        <View style={styles.susIcon}>
                                            <DynamicIcon name={item.icon} size={24} color={Colors.primary} />
                                        </View>
                                        <View style={styles.susContent}>
                                            <Text style={styles.susTitle}>{item.title}</Text>
                                            <Text style={styles.susDesc}>{item.desc}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>
                </View>
            </View>

            {/* CTA */}
            <View style={styles.ctaSection}>
                <View style={styles.contentMax}>
                    <View style={styles.ctaCard}>
                        <View style={styles.ctaText}>
                            <Text style={styles.ctaTitle}>{config.ctaTitle}</Text>
                            <Text style={styles.ctaDesc}>{config.ctaDesc}</Text>
                        </View>
                        <Link href={config.ctaBtnUrl as any} asChild>
                            <TouchableOpacity style={styles.ctaBtn} activeOpacity={0.8}>
                                <Text style={styles.ctaBtnText}>{config.ctaBtnText}</Text>
                                <Rocket size={20} color="#FFF" />
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
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
    statIconBox: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    statValue: {
        fontSize: 36,
        fontWeight: '900',
        color: Colors.navy,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    storyGrid: {
        flexDirection: Platform.OS === 'web' ? 'row' : 'column',
        gap: 80,
        alignItems: 'center',
    },
    storyText: {
        flex: 1,
    },
    storyVisual: {
        flex: 1,
        width: '100%',
        height: 400,
        borderRadius: 40,
        overflow: 'hidden',
    },
    storyImage: {
        width: '100%',
        height: '100%',
    },
    dualGrid: {
        flexDirection: Platform.OS === 'web' ? 'row' : 'column',
        gap: 40,
    },
    missionCardInverse: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 50,
        borderRadius: 32,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    iconBoxInverse: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    missionTitleInverse: {
        fontSize: 32,
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 16,
        letterSpacing: -0.5,
    },
    missionContentInverse: {
        fontSize: 19,
        color: '#94A3B8',
        lineHeight: 30,
    },
    milestonesTimeline: {
        flexDirection: Platform.OS === 'web' ? 'row' : 'column',
        justifyContent: 'space-between',
        gap: 32,
    },
    milestoneItem: {
        flex: 1,
        alignItems: 'center',
        position: 'relative',
    },
    milestoneYearBox: {
        width: 80,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        zIndex: 2,
    },
    milestoneYear: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '900',
    },
    milestoneContent: {
        alignItems: 'center',
    },
    milestoneTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.navy,
        marginBottom: 12,
        textAlign: 'center',
    },
    milestoneDesc: {
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
    },
    milestoneLine: {
        position: 'absolute',
        top: 20,
        left: '60%',
        width: '80%',
        height: 2,
        backgroundColor: '#E2E8F0',
        zIndex: 1,
    },
    sustainabilityGrid: {
        gap: 32,
    },
    susItem: {
        flexDirection: 'row',
        gap: 20,
    },
    susIcon: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: Colors.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
    },
    susContent: {
        flex: 1,
    },
    susTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.navy,
        marginBottom: 8,
    },
    susDesc: {
        fontSize: 16,
        color: Colors.textSecondary,
        lineHeight: 24,
    },
    container: {
        backgroundColor: '#FFFFFF',
    },
    contentMax: {
        maxWidth: 1200,
        width: '100%',
        alignSelf: 'center',
    },
    heroSection: {
        backgroundColor: Colors.navy,
        paddingVertical: Platform.OS === 'web' ? 140 : 100,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 500,
        position: 'relative',
    },
    heroContent: {
        maxWidth: 900,
        alignItems: 'center',
        zIndex: 1,
    },
    heroTitle: {
        fontSize: Platform.OS === 'web' ? 72 : 48,
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 24,
        textAlign: 'center',
        letterSpacing: -1.5,
    },
    heroSubtitle: {
        fontSize: Platform.OS === 'web' ? 24 : 18,
        color: '#CBD5E1',
        textAlign: 'center',
        lineHeight: 36,
        fontWeight: '500',
        maxWidth: 700,
    },
    section: {
        paddingVertical: 120,
        paddingHorizontal: 24,
    },
    sectionTag: {
        color: Colors.primary,
        fontSize: 14,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: Platform.OS === 'web' ? 48 : 36,
        fontWeight: '900',
        color: Colors.navy,
        marginBottom: 24,
        letterSpacing: -1,
    },
    sectionDesc: {
        fontSize: 19,
        color: Colors.textSecondary,
        lineHeight: 32,
        marginBottom: 32,
    },
    splitGrid: {
        flexDirection: Platform.OS === 'web' ? 'row' : 'column',
        gap: 80,
    },
    splitText: {
        flex: 1,
    },
    missionCard: {
        backgroundColor: '#F1F5F9',
        padding: 48,
        borderRadius: 40,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    iconBox: {
        width: 64,
        height: 64,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    missionTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 16,
        letterSpacing: -0.5,
    },
    missionContent: {
        fontSize: 18,
        color: Colors.textSecondary,
        lineHeight: 28,
    },
    valuesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 32,
        justifyContent: 'center',
    },
    valueCard: {
        width: Platform.OS === 'web' ? 'calc(33.333% - 22px)' as any : '100%',
        minWidth: 300,
        backgroundColor: '#FFFFFF',
        padding: 48,
        borderRadius: 32,
        alignItems: 'center',
        textAlign: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 5,
    },
    valueIcon: {
        width: 72,
        height: 72,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    valueTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 16,
        textAlign: 'center',
    },
    valueDesc: {
        fontSize: 17,
        color: Colors.textSecondary,
        lineHeight: 26,
        textAlign: 'center',
    },
    ctaSection: {
        paddingVertical: 60,
        paddingHorizontal: 24,
    },
    ctaCard: {
        backgroundColor: Colors.navy,
        borderRadius: 40,
        padding: Platform.OS === 'web' ? 80 : 40,
        flexDirection: Platform.OS === 'web' ? 'row' : 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 40,
        overflow: 'hidden',
        position: 'relative',
    },
    ctaText: {
        flex: 1,
    },
    ctaTitle: {
        fontSize: Platform.OS === 'web' ? 44 : 32,
        fontWeight: '900',
        color: '#FFF',
        marginBottom: 16,
        letterSpacing: -1,
    },
    ctaDesc: {
        fontSize: 20,
        color: 'rgba(255,255,255,0.7)',
        lineHeight: 30,
        maxWidth: 600,
    },
    ctaBtn: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingVertical: 20,
        borderRadius: 16,
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    ctaBtnText: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFF',
    }
});
