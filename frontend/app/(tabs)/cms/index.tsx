import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Layout,
    FileText,
    Info,
    Phone,
    Settings,
    ChevronRight,
    MonitorPlay,
    Image as ImageIcon,
    BarChart,
    History,
    TrendingUp,
    Truck,
    Star,
    Factory,
    Bell,
    Briefcase,
    HelpCircle,
    MessageSquareText,
    BookOpen,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import * as Haptics from 'expo-haptics';

export default function CMSDashboard() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const handleNav = (route: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(route as any);
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.headerTitle}>Marketing Website</Text>
                        <Text style={styles.headerSubtitle}>Content Management System</Text>
                    </View>
                    <View style={styles.headerIcon}>
                        <Layout size={20} color={Colors.adminPrimary} />
                    </View>
                </View>
            </View>

            <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Core Pages</Text>
                    <Text style={styles.sectionDesc}>Manage the content and layout of your public-facing web pages.</Text>

                    <View style={styles.menuGroup}>
                        <TouchableOpacity style={styles.menuItem} onPress={() => handleNav('/(tabs)/cms/homepage')} activeOpacity={0.7}>
                            <View style={[styles.menuIcon, { backgroundColor: Colors.adminPrimary + '15' }]}>
                                <MonitorPlay size={20} color={Colors.adminPrimary} />
                            </View>
                            <View style={styles.menuText}>
                                <Text style={styles.menuTitle}>Homepage Configurator</Text>
                                <Text style={styles.menuSubtitle}>Hero banners, sliders, and featured services</Text>
                            </View>
                            <ChevronRight size={20} color={Colors.textMuted} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={() => handleNav('/(tabs)/cms/booking')} activeOpacity={0.7}>
                            <View style={[styles.menuIcon, { backgroundColor: Colors.primary + '15' }]}>
                                <Truck size={20} color={Colors.primary} />
                            </View>
                            <View style={styles.menuText}>
                                <Text style={styles.menuTitle}>Guest Booking Wizard</Text>
                                <Text style={styles.menuSubtitle}>Manage quote tiers, vehicle capacity, and pricing</Text>
                            </View>
                            <ChevronRight size={20} color={Colors.textMuted} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={() => handleNav('/(tabs)/cms/services')} activeOpacity={0.7}>
                            <View style={[styles.menuIcon, { backgroundColor: Colors.primary + '15' }]}>
                                <FileText size={20} color={Colors.primary} />
                            </View>
                            <View style={styles.menuText}>
                                <Text style={styles.menuTitle}>Services Manager</Text>
                                <Text style={styles.menuSubtitle}>Add or modify service offerings and FAQs</Text>
                            </View>
                            <ChevronRight size={20} color={Colors.textMuted} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={() => handleNav('/(tabs)/cms/about')} activeOpacity={0.7}>
                            <View style={[styles.menuIcon, { backgroundColor: Colors.warning + '15' }]}>
                                <Info size={20} color={Colors.warning} />
                            </View>
                            <View style={styles.menuText}>
                                <Text style={styles.menuTitle}>About Us</Text>
                                <Text style={styles.menuSubtitle}>Company story, team profiles, and stats</Text>
                            </View>
                            <ChevronRight size={20} color={Colors.textMuted} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={() => handleNav('/(tabs)/cms/contact')} activeOpacity={0.7}>
                            <View style={[styles.menuIcon, { backgroundColor: Colors.success + '15' }]}>
                                <Phone size={20} color={Colors.success} />
                            </View>
                            <View style={styles.menuText}>
                                <Text style={styles.menuTitle}>Contact Us Manager</Text>
                                <Text style={styles.menuSubtitle}>Contact forms, map location, and emails</Text>
                            </View>
                            <ChevronRight size={20} color={Colors.textMuted} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={() => handleNav('/(tabs)/cms/industries')} activeOpacity={0.7}>
                            <View style={[styles.menuIcon, { backgroundColor: Colors.primary + '15' }]}>
                                <Factory size={20} color={Colors.primary} />
                            </View>
                            <View style={styles.menuText}>
                                <Text style={styles.menuTitle}>Industries Manager</Text>
                                <Text style={styles.menuSubtitle}>Edit industry-specific detail pages</Text>
                            </View>
                            <ChevronRight size={20} color={Colors.textMuted} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={() => handleNav('/(tabs)/cms/menu')} activeOpacity={0.7}>
                            <View style={[styles.menuIcon, { backgroundColor: Colors.info + '15' }]}>
                                <Settings size={20} color={Colors.info} />
                            </View>
                            <View style={styles.menuText}>
                                <Text style={styles.menuTitle}>Menu Editor</Text>
                                <Text style={styles.menuSubtitle}>Manage navigation links and structure</Text>
                            </View>
                            <ChevronRight size={20} color={Colors.textMuted} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={() => handleNav('/(tabs)/cms/careers')} activeOpacity={0.7}>
                            <View style={[styles.menuIcon, { backgroundColor: Colors.success + '15' }]}>
                                <Briefcase size={20} color={Colors.success} />
                            </View>
                            <View style={styles.menuText}>
                                <Text style={styles.menuTitle}>Careers Manager</Text>
                                <Text style={styles.menuSubtitle}>Job openings and recruitment content</Text>
                            </View>
                            <ChevronRight size={20} color={Colors.textMuted} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={() => handleNav('/(tabs)/cms/faq')} activeOpacity={0.7}>
                            <View style={[styles.menuIcon, { backgroundColor: Colors.info + '15' }]}>
                                <HelpCircle size={20} color={Colors.info} />
                            </View>
                            <View style={styles.menuText}>
                                <Text style={styles.menuTitle}>FAQ Manager</Text>
                                <Text style={styles.menuSubtitle}>Create, publish, categorize, and reorder public FAQs</Text>
                            </View>
                            <ChevronRight size={20} color={Colors.textMuted} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={() => handleNav('/(tabs)/cms/response-templates')} activeOpacity={0.7}>
                            <View style={[styles.menuIcon, { backgroundColor: Colors.purple + '15' }]}>
                                <MessageSquareText size={20} color={Colors.purple} />
                            </View>
                            <View style={styles.menuText}>
                                <Text style={styles.menuTitle}>Response Templates</Text>
                                <Text style={styles.menuSubtitle}>Internal support replies for consistent customer responses</Text>
                            </View>
                            <ChevronRight size={20} color={Colors.textMuted} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={() => handleNav('/(tabs)/cms/policies')} activeOpacity={0.7}>
                            <View style={[styles.menuIcon, { backgroundColor: Colors.warning + '15' }]}>
                                <BookOpen size={20} color={Colors.warning} />
                            </View>
                            <View style={styles.menuText}>
                                <Text style={styles.menuTitle}>Policy Manager</Text>
                                <Text style={styles.menuSubtitle}>Internal staff-only policies and operating guidance</Text>
                            </View>
                            <ChevronRight size={20} color={Colors.textMuted} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={() => handleNav('/(tabs)/cms/ai-settings')} activeOpacity={0.7}>
                            <View style={[styles.menuIcon, { backgroundColor: Colors.adminPrimary + '15' }]}>
                                <Settings size={20} color={Colors.adminPrimary} />
                            </View>
                            <View style={styles.menuText}>
                                <Text style={styles.menuTitle}>AI Settings</Text>
                                <Text style={styles.menuSubtitle}>Configure assistant locations, draft mode, knowledge sources, and logs</Text>
                            </View>
                            <ChevronRight size={20} color={Colors.textMuted} />
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={() => handleNav('/(tabs)/cms/homepage?tab=testimonials')} activeOpacity={0.7}>
                            <View style={[styles.menuIcon, { backgroundColor: '#FBBF2415' }]}>
                                <Star size={20} color="#FBBF24" />
                            </View>
                            <View style={styles.menuText}>
                                <Text style={styles.menuTitle}>Client Testimonials</Text>
                                <Text style={styles.menuSubtitle}>Add, remove, and reorder client reviews</Text>
                            </View>
                            <ChevronRight size={20} color={Colors.textMuted} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Global Management</Text>
                    <Text style={styles.sectionDesc}>Site-wide settings, media, and marketing performance.</Text>

                    <View style={styles.menuGroup}>
                        <TouchableOpacity style={styles.menuItem} onPress={() => handleNav('/(tabs)/cms/seo')} activeOpacity={0.7}>
                            <View style={[styles.menuIcon, { backgroundColor: Colors.purple + '15' }]}>
                                <Settings size={20} color={Colors.purple} />
                            </View>
                            <View style={styles.menuText}>
                                <Text style={styles.menuTitle}>SEO & Meta Tags</Text>
                                <Text style={styles.menuSubtitle}>Global titles, keywords, and Open Graph config</Text>
                            </View>
                            <ChevronRight size={20} color={Colors.textMuted} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={() => handleNav('/admin-notification-settings')} activeOpacity={0.7}>
                            <View style={[styles.menuIcon, { backgroundColor: Colors.warning + '15' }]}>
                                <Bell size={20} color={Colors.warning} />
                            </View>
                            <View style={styles.menuText}>
                                <Text style={styles.menuTitle}>Notification Settings</Text>
                                <Text style={styles.menuSubtitle}>Configure SMS and Email providers and rules</Text>
                            </View>
                            <ChevronRight size={20} color={Colors.textMuted} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={() => handleNav('/(tabs)/cms/media')} activeOpacity={0.7}>
                            <View style={[styles.menuIcon, { backgroundColor: Colors.info + '15' }]}>
                                <ImageIcon size={20} color={Colors.info} />
                            </View>
                            <View style={styles.menuText}>
                                <Text style={styles.menuTitle}>Media Library</Text>
                                <Text style={styles.menuSubtitle}>Manage uploaded images, icons, and videos</Text>
                            </View>
                            <ChevronRight size={20} color={Colors.textMuted} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={() => handleNav('/(tabs)/cms/history')} activeOpacity={0.7}>
                            <View style={[styles.menuIcon, { backgroundColor: Colors.danger + '15' }]}>
                                <History size={20} color={Colors.danger} />
                            </View>
                            <View style={styles.menuText}>
                                <Text style={styles.menuTitle}>Revision History</Text>
                                <Text style={styles.menuSubtitle}>View past edits and restore draft versions</Text>
                            </View>
                            <ChevronRight size={20} color={Colors.textMuted} />
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={() => handleNav('/(tabs)/cms/analytics')} activeOpacity={0.7}>
                            <View style={[styles.menuIcon, { backgroundColor: Colors.success + '15' }]}>
                                <TrendingUp size={20} color={Colors.success} />
                            </View>
                            <View style={styles.menuText}>
                                <Text style={styles.menuTitle}>Marketing Analytics</Text>
                                <Text style={styles.menuSubtitle}>Page views, conversions, and traffic sources</Text>
                            </View>
                            <ChevronRight size={20} color={Colors.textMuted} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        backgroundColor: Colors.navy,
        paddingHorizontal: 20,
        paddingBottom: 24,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.textInverse,
        marginTop: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: Colors.textMuted,
    },
    headerIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.navyLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    body: {
        flex: 1,
    },
    bodyContent: {
        padding: 20,
    },
    section: {
        marginBottom: 28,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 4,
    },
    sectionDesc: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 16,
    },
    menuGroup: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingHorizontal: 16,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
        gap: 16,
    },
    menuIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuText: {
        flex: 1,
    },
    menuTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 2,
    },
    menuSubtitle: {
        fontSize: 13,
        color: Colors.textSecondary,
    },
});
