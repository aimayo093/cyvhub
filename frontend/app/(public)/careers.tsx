import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Dimensions, TouchableOpacity } from 'react-native';
import { Briefcase, Zap, Heart, Globe, ArrowRight } from 'lucide-react-native';
import Colors from '@/constants/colors';

export default function CareersPage() {
    return (
        <ScrollView style={styles.container}>
            {/* HERO */}
            <View style={styles.heroSection}>
                <View style={styles.heroContent}>
                    <Text style={styles.heroTitle}>Build the Future of Logistics</Text>
                    <Text style={styles.heroSubtitle}>
                        At CYVhub, we are transforming the way businesses move goods. Join our dynamic team and help us build a smarter, greener delivery network.
                    </Text>
                </View>
            </View>

            {/* WHY JOIN US */}
            <View style={styles.section}>
                <View style={styles.contentMax}>
                    <Text style={styles.sectionTitle}>Why CYVhub?</Text>
                    <View style={styles.perksGrid}>
                        <View style={styles.perkCard}>
                            <View style={[styles.iconBox, { backgroundColor: Colors.primary + '15' }]}>
                                <Zap size={28} color={Colors.primary} />
                            </View>
                            <Text style={styles.perkTitle}>Innovation First</Text>
                            <Text style={styles.perkDesc}>We leverage deep tech and AI to optimize routes and pricing in real-time. Work on challenging problems that have physical real-world impact.</Text>
                        </View>
                        <View style={styles.perkCard}>
                            <View style={[styles.iconBox, { backgroundColor: Colors.success + '15' }]}>
                                <Globe size={28} color={Colors.success} />
                            </View>
                            <Text style={styles.perkTitle}>Work from Anywhere</Text>
                            <Text style={styles.perkDesc}>While our hubs are distributed across the UK, our tech and support teams enjoy flexible, remote-first working arrangements.</Text>
                        </View>
                        <View style={styles.perkCard}>
                            <View style={[styles.iconBox, { backgroundColor: Colors.purple + '15' }]}>
                                <Heart size={28} color={Colors.purple} />
                            </View>
                            <Text style={styles.perkTitle}>Health & Wellbeing</Text>
                            <Text style={styles.perkDesc}>Comprehensive private healthcare, enhanced parental leave, and regular mental wellness days because we care about our people.</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* OPEN POSITIONS */}
            <View style={[styles.section, { backgroundColor: Colors.surfaceAlt }]}>
                <View style={styles.contentMax}>
                    <Text style={styles.sectionTitle}>Open Roles</Text>

                    <View style={styles.jobList}>
                        <View style={styles.jobCard}>
                            <View>
                                <Text style={styles.jobTitle}>Senior Full-Stack Engineer</Text>
                                <Text style={styles.jobLocation}>Remote (UK) • Engineering</Text>
                            </View>
                            <TouchableOpacity style={styles.applyBtn}>
                                <Text style={styles.applyBtnText}>Apply</Text>
                                <ArrowRight size={16} color={Colors.primary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.jobCard}>
                            <View>
                                <Text style={styles.jobTitle}>Regional Fleet Manager</Text>
                                <Text style={styles.jobLocation}>London / Hybrid • Operations</Text>
                            </View>
                            <TouchableOpacity style={styles.applyBtn}>
                                <Text style={styles.applyBtnText}>Apply</Text>
                                <ArrowRight size={16} color={Colors.primary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.jobCard}>
                            <View>
                                <Text style={styles.jobTitle}>B2B Account Executive</Text>
                                <Text style={styles.jobLocation}>Manchester • Sales</Text>
                            </View>
                            <TouchableOpacity style={styles.applyBtn}>
                                <Text style={styles.applyBtnText}>Apply</Text>
                                <ArrowRight size={16} color={Colors.primary} />
                            </TouchableOpacity>
                        </View>
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
        gap: 32,
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
        gap: 16,
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
        gap: 16,
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
        gap: 8,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: Colors.primary + '15',
    },
    applyBtnText: {
        color: Colors.primary,
        fontWeight: '700',
        fontSize: 16,
    }
});
