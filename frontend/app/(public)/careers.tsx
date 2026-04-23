import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Briefcase, Zap, Heart, Globe, ArrowRight, MapPin, Clock, Users, Star, Target, Shield, Rocket } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useCMS } from '@/context/CMSContext';
import Head from 'expo-router/head';
import { useRouter } from 'expo-router';

const IconMap: any = {
    Zap, Globe, Heart, Rocket, Target, Star, Users, Shield, MapPin, Clock, Briefcase
};

const DynamicIcon = ({ name, size = 28, color = Colors.primary }: any) => {
    const IconComponent = IconMap[name] || Briefcase;
    return <IconComponent size={size} color={color} />;
};

export default function CareersPage() {
    const { careersPage, jobOpenings, isLoaded } = useCMS();
    const router = useRouter();

    if (!isLoaded) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    const config = careersPage;
    const publishedJobs = (jobOpenings || [])
        .filter(j => j.isPublished)
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    return (
        <ScrollView style={styles.container}>
            <Head>
                <title>Join the Fleet | Careers at CYVhub Logistics</title>
                <meta name="description" content="Help us build the smartest logistics network in the UK. Explore open engineering, operations, and sales roles at CYVhub." />
            </Head>

            {/* HERO */}
            <View style={styles.heroSection}>
                <View style={styles.heroContent}>
                    <Text style={styles.heroTitle}>{config.heroTitle}</Text>
                    <Text style={styles.heroSubtitle}>
                        {config.heroSubtitle}
                    </Text>
                </View>
            </View>

            {/* INTRO/CULTURE */}
            <View style={styles.section}>
                <View style={styles.contentMax}>
                    <View style={styles.introBox}>
                        <Text style={styles.introTitle}>{config.introTitle}</Text>
                        <Text style={styles.introContent}>{config.introContent}</Text>
                    </View>
                    
                    <View style={styles.perksGrid}>
                        {config.perks.map((perk) => (
                            <View key={perk.id} style={styles.perkCard}>
                                <View style={[styles.iconBox, { backgroundColor: Colors.primary + '10' }]}>
                                    <DynamicIcon name={perk.icon} color={Colors.primary} />
                                </View>
                                <Text style={styles.perkTitle}>{perk.title}</Text>
                                <Text style={styles.perkDesc}>{perk.desc}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </View>

            {/* OPEN POSITIONS */}
            <View style={[styles.section, { backgroundColor: '#F8FAFC' }]}>
                <View style={styles.contentMax}>
                    <Text style={styles.sectionTitle}>Current Opportunities</Text>
                    
                    {publishedJobs.length > 0 ? (
                        <View style={styles.jobList}>
                            {publishedJobs.map((job) => (
                                <View key={job.id} style={styles.jobCard}>
                                    <View style={styles.jobInfo}>
                                        <Text style={styles.jobTitle}>{job.title}</Text>
                                        <View style={styles.jobMetaRow}>
                                            <View style={styles.metaItem}>
                                                <MapPin size={14} color={Colors.textSecondary} />
                                                <Text style={styles.jobMetaText}>{job.location}</Text>
                                            </View>
                                            <View style={styles.metaItem}>
                                                <Briefcase size={14} color={Colors.textSecondary} />
                                                <Text style={styles.jobMetaText}>{job.department} • {job.employmentType.replace('_', ' ')}</Text>
                                            </View>
                                        </View>
                                        <Text style={styles.jobSummary} numberOfLines={2}>{job.summary}</Text>
                                    </View>
                                    <TouchableOpacity 
                                        style={styles.applyBtn}
                                        onPress={() => {
                                            if (Platform.OS === 'web') {
                                                window.location.href = `/contact?ref=job_${job.id}`;
                                            } else {
                                                router.push(`/contact?ref=job_${job.id}` as any);
                                            }
                                        }}
                                    >
                                        <Text style={styles.applyBtnText}>View Role</Text>
                                        <ArrowRight size={16} color={Colors.primary} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyJobs}>
                            <Text style={styles.emptyJobsText}>No open roles right now. Join our talent network to stay updated!</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* TALENT NETWORK CTA */}
            <View style={styles.ctaSection}>
                <View style={styles.ctaCard}>
                    <Text style={styles.ctaTitle}>{config.ctaTitle}</Text>
                    <Text style={styles.ctaSubtitle}>{config.ctaSubtitle}</Text>
                    <TouchableOpacity 
                        style={styles.ctaBtn}
                        onPress={() => {
                            if (Platform.OS === 'web') {
                                window.location.href = '/contact';
                            } else {
                                router.push('/contact' as any);
                            }
                        }}
                    >
                        <Text style={styles.ctaBtnText}>{config.ctaButtonText}</Text>
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
    heroSection: {
        backgroundColor: Colors.navy,
        paddingVertical: Platform.OS === 'web' ? 100 : 60,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    heroContent: {
        maxWidth: 800,
        alignItems: 'center',
    },
    heroTitle: {
        fontSize: Platform.OS === 'web' ? 56 : 40,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 20,
        textAlign: 'center',
    },
    heroSubtitle: {
        fontSize: Platform.OS === 'web' ? 20 : 18,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 28,
        maxWidth: 600,
    },
    section: {
        paddingVertical: 80,
        paddingHorizontal: 20,
    },
    contentMax: {
        maxWidth: 1000,
        width: '100%',
        alignSelf: 'center',
    },
    sectionTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 40,
        textAlign: 'center',
    },
    perksGrid: {
        flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    },
    perkCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 32,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
        textAlign: 'center',
        margin: 16,
    },
    iconBox: {
        width: 64,
        height: 64,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    perkTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 12,
    },
    perkDesc: {
        fontSize: 15,
        color: Colors.textSecondary,
        lineHeight: 24,
        textAlign: 'center',
    },
    jobList: {
    },
    jobCard: {
        flexDirection: Platform.OS === 'web' ? 'row' : 'column',
        justifyContent: 'space-between',
        alignItems: Platform.OS === 'web' ? 'center' : 'flex-start',
        backgroundColor: '#FFFFFF',
        padding: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: 16,
    },
    jobTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 4,
    },
    jobLocation: {
        fontSize: 15,
        color: Colors.textSecondary,
    },
    applyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: Colors.primary + '15',
    },
    applyBtnText: {
        color: Colors.primary,
        fontWeight: '700',
        fontSize: 16,
        marginRight: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 400,
    },
    introBox: {
        marginBottom: 60,
        alignItems: 'center',
    },
    introTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: Colors.navy,
        textAlign: 'center',
        marginBottom: 20,
    },
    introContent: {
        fontSize: 18,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 28,
        maxWidth: 800,
    },
    jobInfo: {
        flex: 1,
    },
    jobMetaRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    jobMetaText: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginLeft: 4,
    },
    jobSummary: {
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 20,
    },
    emptyJobs: {
        padding: 40,
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    emptyJobsText: {
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    ctaSection: {
        padding: 40,
        backgroundColor: '#FFF',
    },
    ctaCard: {
        maxWidth: 1000,
        width: '100%',
        alignSelf: 'center',
        backgroundColor: Colors.primary,
        borderRadius: 24,
        padding: 60,
        alignItems: 'center',
    },
    ctaTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#FFF',
        textAlign: 'center',
        marginBottom: 16,
    },
    ctaSubtitle: {
        fontSize: 18,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        marginBottom: 40,
        maxWidth: 600,
        lineHeight: 26,
    },
    ctaBtn: {
        backgroundColor: '#FFF',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
    },
    ctaBtnText: {
        color: Colors.primary,
        fontSize: 16,
        fontWeight: '800',
    }
});
