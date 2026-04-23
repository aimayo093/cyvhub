import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Dimensions, TouchableOpacity, Image, ActivityIndicator, useWindowDimensions } from 'react-native';
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
    const { width: SCREEN_WIDTH } = useWindowDimensions();

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
            <View style={[styles.heroSection, { paddingVertical: SCREEN_WIDTH >= 1024 ? 160 : 100 }]}>
                <Image
                    source={{ uri: config.heroImageUrl }}
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="cover"
                />
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]} />
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: Colors.primary, opacity: 0.2 }]} />
                <View style={styles.heroContent}>
                    <Text style={[styles.heroTitle, { fontSize: SCREEN_WIDTH >= 1024 ? 80 : 48 }]}>{config.heroTitle}</Text>
                    <Text style={[styles.heroSubtitle, { fontSize: SCREEN_WIDTH >= 1024 ? 26 : 18 }]}>{config.heroSubtitle}</Text>
                </View>
            </View>

            {/* STATS BAR */}
            <View style={styles.statsBar}>
                <View style={styles.contentMax}>
                    <View style={styles.statsInner}>
                        {config.stats.map((stat, index) => (
                            <View key={index} style={styles.statItem}>
                                <View style={styles.statIconBox}>
                                    <DynamicIcon name={stat.icon} size={32} color={Colors.primary} />
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
                    <View style={[styles.storyGrid, { flexDirection: SCREEN_WIDTH >= 1024 ? 'row' : 'column', gap: 60 }]}>
                        <View style={styles.storyText}>
                            <Text style={styles.sectionTag}>{config.storyTag}</Text>
                            <Text style={[styles.sectionTitle, { fontSize: SCREEN_WIDTH >= 768 ? 56 : 36 }]}>{config.storyTitle}</Text>
                            <Text style={styles.sectionDesc}>{config.storyContent}</Text>
                        </View>
                        <View style={[styles.storyVisual, { height: SCREEN_WIDTH >= 1024 ? 600 : 400 }]}>
                            <Image
                                source={{ uri: 'https://images.unsplash.com/photo-1586528116311-ad8669966155' }}
                                style={styles.storyImage}
                                resizeMode="cover"
                            />
                            <View style={styles.imageOverlay} />
                        </View>
                    </View>
                </View>
            </View>

            {/* MISSION & VISION */}
            <View style={[styles.section, { backgroundColor: '#0F172A' }]}>
                <View style={styles.contentMax}>
                    <View style={[styles.dualGrid, { flexDirection: SCREEN_WIDTH >= 768 ? 'row' : 'column', gap: 30 }]}>
                        <View style={styles.missionCardInverse}>
                            <View style={styles.iconBoxInverse}>
                                <Target size={40} color="#FFF" />
                            </View>
                            <Text style={styles.missionTitleInverse}>{config.missionTitle}</Text>
                            <Text style={styles.missionContentInverse}>{config.missionContent}</Text>
                        </View>
                        <View style={styles.missionCardInverse}>
                            <View style={styles.iconBoxInverse}>
                                <Rocket size={40} color="#FFF" />
                            </View>
                            <Text style={styles.missionTitleInverse}>{config.visionTitle}</Text>
                            <Text style={styles.missionContentInverse}>{config.visionContent}</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* TEAM HIGHLIGHTS */}
            {config.teamHighlights && config.teamHighlights.length > 0 && (
                <View style={styles.section}>
                    <View style={styles.contentMax}>
                        <Text style={styles.sectionTagCenter}>OUR LEADERSHIP</Text>
                        <Text style={[styles.sectionTitleCenter, { fontSize: SCREEN_WIDTH >= 768 ? 56 : 36 }]}>Meet the Visionaries</Text>
                        <View style={styles.teamGrid}>
                            {config.teamHighlights.map((member) => (
                                <View key={member.id} style={[styles.teamCard, { width: SCREEN_WIDTH >= 1024 ? '48%' : '100%' }]}>
                                    <View style={styles.teamImageContainer}>
                                        <Image source={{ uri: member.imageUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e' }} style={styles.teamImage} />
                                    </View>
                                    <View style={styles.teamInfo}>
                                        <Text style={styles.teamName}>{member.name}</Text>
                                        <Text style={styles.teamRole}>{member.role}</Text>
                                        <Text style={styles.teamBio}>{member.bio}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            )}

            {/* VALUES SECTION */}
            <View style={[styles.section, { backgroundColor: '#F8FAFC' }]}>
                <View style={styles.contentMax}>
                    <Text style={styles.sectionTagCenter}>CORE VALUES</Text>
                    <Text style={[styles.sectionTitleCenter, { marginBottom: 80, fontSize: SCREEN_WIDTH >= 768 ? 56 : 36 }]}>
                        {config.valuesTitle}
                    </Text>
                    <View style={styles.valuesGrid}>
                        {config.values.map((value) => (
                            <View key={value.id} style={[styles.valueCard, { width: SCREEN_WIDTH >= 1024 ? '31%' : SCREEN_WIDTH >= 768 ? '47%' : '100%' }]}>
                                <View style={[styles.valueIcon, { backgroundColor: Colors.primary + '15' }]}>
                                    <DynamicIcon name={value.icon} size={32} color={Colors.primary} />
                                </View>
                                <Text style={styles.valueTitle}>{value.title}</Text>
                                <Text style={styles.valueDesc}>{value.desc}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </View>

            {/* OFFICE ADDRESS */}
            {config.officeAddress && (
                <View style={styles.section}>
                    <View style={styles.contentMax}>
                        <View style={[styles.addressBox, { flexDirection: SCREEN_WIDTH >= 768 ? 'row' : 'column' }]}>
                            <View style={styles.addressInfo}>
                                <Text style={styles.sectionTag}>VISIT US</Text>
                                <Text style={styles.addressTitle}>Our Headquarters</Text>
                                <View style={styles.addressRow}>
                                    <MapPin size={24} color={Colors.primary} />
                                    <Text style={styles.addressText}>{config.officeAddress}</Text>
                                </View>
                                <TouchableOpacity 
                                    style={styles.directionsBtn}
                                    onPress={() => {
                                        if (Platform.OS === 'web') {
                                            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(config.officeAddress || '')}`, '_blank');
                                        }
                                    }}
                                >
                                    <Text style={styles.directionsBtnText}>Get Directions</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.addressVisual}>
                                <Image source={{ uri: 'https://images.unsplash.com/photo-1497366216548-37526070297c' }} style={styles.addressImage} />
                            </View>
                        </View>
                    </View>
                </View>
            )}

            {/* MILESTONES */}
            <View style={[styles.section, { backgroundColor: '#F8FAFC' }]}>
                <View style={styles.contentMax}>
                    <Text style={styles.sectionTagCenter}>THE JOURNEY</Text>
                    <Text style={[styles.sectionTitleCenter, { marginBottom: 80, fontSize: SCREEN_WIDTH >= 768 ? 56 : 36 }]}>
                        {config.milestonesTitle}
                    </Text>
                    <View style={[styles.milestonesTimeline, { flexDirection: SCREEN_WIDTH >= 1024 ? 'row' : 'column' }]}>
                        {config.milestones.map((milestone, index) => (
                            <View key={index} style={styles.milestoneItem}>
                                <View style={styles.milestoneYearBox}>
                                    <Text style={styles.milestoneYear}>{milestone.year}</Text>
                                </View>
                                <View style={styles.milestoneContent}>
                                    <Text style={styles.milestoneTitle}>{milestone.title}</Text>
                                    <Text style={styles.milestoneDesc}>{milestone.desc}</Text>
                                </View>
                                {index < config.milestones.length - 1 && SCREEN_WIDTH >= 1024 && (
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
                    <View style={[styles.splitGrid, { flexDirection: SCREEN_WIDTH >= 1024 ? 'row' : 'column', gap: 60 }]}>
                        <View style={styles.splitText}>
                            <Text style={styles.sectionTag}>{config.sustainabilityTag}</Text>
                            <Text style={[styles.sectionTitle, { fontSize: SCREEN_WIDTH >= 768 ? 56 : 36 }]}>{config.sustainabilityTitle}</Text>
                            <Text style={styles.sectionDesc}>{config.sustainabilityDesc}</Text>
                        </View>
                        <View style={styles.splitText}>
                            <View style={styles.sustainabilityGrid}>
                                {config.sustainabilityItems.map((item) => (
                                    <View key={item.id} style={styles.susItem}>
                                        <View style={styles.susIcon}>
                                            <DynamicIcon name={item.icon} size={28} color={Colors.primary} />
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
                    <View style={[styles.ctaCard, { padding: SCREEN_WIDTH >= 768 ? 80 : 40, flexDirection: SCREEN_WIDTH >= 1024 ? 'row' : 'column' }]}>
                        <View style={styles.ctaText}>
                            <Text style={[styles.ctaTitle, { fontSize: SCREEN_WIDTH >= 768 ? 56 : 32 }]}>{config.ctaTitle}</Text>
                            <Text style={styles.ctaDesc}>{config.ctaDesc}</Text>
                        </View>
                        <Link 
                            href={config.ctaBtnUrl as any} 
                            asChild
                            onClick={(e) => {
                                if (Platform.OS === 'web') {
                                    e.preventDefault();
                                    window.location.href = config.ctaBtnUrl;
                                }
                            }}
                        >
                            <TouchableOpacity style={styles.ctaBtn} activeOpacity={0.9}>
                                <Text style={styles.ctaBtnText}>{config.ctaBtnText}</Text>
                                <Rocket size={24} color="#FFF" style={{ marginLeft: 12 }} />
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
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
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 24,
        textAlign: 'center',
        letterSpacing: -1.5,
    },
    heroSubtitle: {
        color: '#CBD5E1',
        textAlign: 'center',
        lineHeight: 36,
        fontWeight: '500',
        maxWidth: 700,
    },
    statsBar: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 80,
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
        margin: 20,
    },
    statIconBox: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    statValue: {
        fontSize: 48,
        fontWeight: '900',
        color: Colors.navy,
        marginBottom: 8,
    },
    statLabel: {
        fontSize: 14,
        fontWeight: '800',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    section: {
        paddingVertical: 140,
        paddingHorizontal: 24,
    },
    sectionTag: {
        color: Colors.primary,
        fontSize: 14,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 3,
        marginBottom: 20,
    },
    sectionTagCenter: {
        color: Colors.primary,
        fontSize: 14,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 3,
        marginBottom: 20,
        textAlign: 'center',
    },
    sectionTitle: {
        fontWeight: '900',
        color: Colors.navy,
        marginBottom: 32,
        letterSpacing: -2,
        lineHeight: Platform.OS === 'web' ? 64 : 44,
    },
    sectionTitleCenter: {
        fontWeight: '900',
        color: Colors.navy,
        marginBottom: 32,
        letterSpacing: -2,
        textAlign: 'center',
        lineHeight: Platform.OS === 'web' ? 64 : 44,
    },
    sectionDesc: {
        fontSize: 20,
        color: Colors.textSecondary,
        lineHeight: 36,
        marginBottom: 40,
    },
    storyGrid: {
        alignItems: 'center',
    },
    storyText: {
        flex: 1,
    },
    storyVisual: {
        flex: 1.2,
        width: '100%',
        borderRadius: 40,
        overflow: 'hidden',
        position: 'relative',
    },
    storyImage: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: Colors.primary,
        opacity: 0.1,
    },
    dualGrid: {
    },
    missionCardInverse: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        padding: 60,
        borderRadius: 40,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    iconBoxInverse: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
    },
    missionTitleInverse: {
        fontSize: 36,
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 20,
        letterSpacing: -1,
    },
    missionContentInverse: {
        fontSize: 20,
        color: '#94A3B8',
        lineHeight: 34,
    },
    teamGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 30,
        marginTop: 40,
    },
    teamCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 32,
        padding: 32,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        gap: 24,
    },
    teamImageContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,
        overflow: 'hidden',
        borderWidth: 4,
        borderColor: Colors.primary + '20',
    },
    teamImage: {
        width: '100%',
        height: '100%',
    },
    teamInfo: {
        flex: 1,
    },
    teamName: {
        fontSize: 24,
        fontWeight: '900',
        color: Colors.navy,
        marginBottom: 4,
    },
    teamRole: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.primary,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    teamBio: {
        fontSize: 16,
        color: Colors.textSecondary,
        lineHeight: 24,
    },
    valuesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 30,
    },
    valueCard: {
        backgroundColor: '#FFFFFF',
        padding: 60,
        borderRadius: 40,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.05,
        shadowRadius: 40,
        elevation: 10,
    },
    valueIcon: {
        width: 80,
        height: 80,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    valueTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: Colors.navy,
        marginBottom: 20,
        textAlign: 'center',
    },
    valueDesc: {
        fontSize: 18,
        color: Colors.textSecondary,
        lineHeight: 30,
        textAlign: 'center',
    },
    addressBox: {
        backgroundColor: '#FFFFFF',
        borderRadius: 40,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 30 },
        shadowOpacity: 0.1,
        shadowRadius: 50,
        elevation: 20,
    },
    addressInfo: {
        flex: 1,
        padding: 60,
        justifyContent: 'center',
    },
    addressTitle: {
        fontSize: 36,
        fontWeight: '900',
        color: Colors.navy,
        marginBottom: 24,
        letterSpacing: -1,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 40,
    },
    addressText: {
        fontSize: 20,
        color: Colors.textSecondary,
        flex: 1,
        lineHeight: 30,
    },
    directionsBtn: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 32,
        paddingVertical: 18,
        borderRadius: 16,
        alignSelf: 'flex-start',
    },
    directionsBtnText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '800',
    },
    addressVisual: {
        flex: 1.2,
        height: 500,
    },
    addressImage: {
        width: '100%',
        height: '100%',
    },
    milestonesTimeline: {
        justifyContent: 'space-between',
        gap: 40,
    },
    milestoneItem: {
        flex: 1,
        alignItems: 'center',
        position: 'relative',
    },
    milestoneYearBox: {
        width: 100,
        height: 50,
        borderRadius: 25,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
        zIndex: 2,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
    },
    milestoneYear: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: '900',
    },
    milestoneContent: {
        alignItems: 'center',
    },
    milestoneTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: Colors.navy,
        marginBottom: 16,
        textAlign: 'center',
    },
    milestoneDesc: {
        fontSize: 17,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 28,
    },
    milestoneLine: {
        position: 'absolute',
        top: 25,
        left: '70%',
        width: '60%',
        height: 2,
        backgroundColor: '#E2E8F0',
        zIndex: 1,
    },
    splitGrid: {
    },
    splitText: {
        flex: 1,
    },
    sustainabilityGrid: {
        gap: 40,
    },
    susItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    susIcon: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: Colors.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 24,
    },
    susContent: {
        flex: 1,
    },
    susTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: Colors.navy,
        marginBottom: 12,
    },
    susDesc: {
        fontSize: 18,
        color: Colors.textSecondary,
        lineHeight: 30,
    },
    ctaSection: {
        paddingVertical: 100,
        paddingHorizontal: 24,
    },
    ctaCard: {
        backgroundColor: '#0F172A',
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'space-between',
        overflow: 'hidden',
        position: 'relative',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    ctaText: {
        flex: 1,
    },
    ctaTitle: {
        fontWeight: '900',
        color: '#FFF',
        marginBottom: 24,
        letterSpacing: -2,
    },
    ctaDesc: {
        fontSize: 24,
        color: '#94A3B8',
        lineHeight: 38,
        maxWidth: 700,
        marginBottom: Platform.OS === 'web' ? 0 : 40,
    },
    ctaBtn: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 48,
        paddingVertical: 24,
        borderRadius: 20,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.4,
        shadowRadius: 30,
        elevation: 15,
    },
    ctaBtnText: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFF',
    }
});
