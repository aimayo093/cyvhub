import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Platform, Image, ActivityIndicator, Alert, useWindowDimensions } from 'react-native';
import { MapPin, Phone, Mail, Send, ChevronDown, ChevronUp, MessageSquare, Clock, Globe, Rocket, FileText, Building2, ShieldCheck } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Head from 'expo-router/head';
import { useCMS } from '@/context/CMSContext';


const IconMap: any = {
    Phone, Mail, MapPin, MessageSquare, Clock, Globe, Rocket, FileText, Building2, ShieldCheck
};

const DynamicIcon = ({ name, size = 24, color = Colors.primary }: any) => {
    const IconComponent = IconMap[name] || MessageSquare;
    return <IconComponent size={size} color={color} />;
};

export default function ContactPage() {
    const { contactPage: config, isLoaded } = useCMS();
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const [form, setForm] = useState({ name: '', email: '', company: '', message: '' });
    const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

    const handleSubmit = () => {
        if (!form.name || !form.email || !form.message) {
            Alert.alert('Missing Fields', 'Please fill in all required fields.');
            return;
        }
        Alert.alert('Success', 'Your message has been sent! Our team will contact you shortly.');
        setForm({ name: '', email: '', company: '', message: '' });
    };

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
                <title>Contact CYVhub — 24/7 Logistics Support</title>
                <meta name="description" content="Get in touch with CYVhub's logistics experts 24/7/365. Sales, operations, billing, and technical support — we're always here to keep your business moving." />
                <meta property="og:title" content="Contact CYVhub — 24/7 Logistics Support" />
                <meta property="og:description" content="Speak to our team about bespoke contracts, urgent bookings, or account support. Enterprise logistics made simple." />
                <meta property="og:image" content="https://www.cyvhub.com/og-image.png" />
                <meta property="og:url" content="https://www.cyvhub.com/contact" />
                <meta property="og:type" content="website" />
            </Head>
            {/* HERO SECTION */}
            <View style={[styles.heroSection, { paddingVertical: SCREEN_WIDTH >= 1024 ? 160 : 100 }]}>
                <Image
                    source={{ uri: config.heroImageUrl }}
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="cover"
                />
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.4)' }]} />
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: Colors.primary, opacity: 0.2 }]} />
                <View style={styles.heroContent}>
                    <Text style={[styles.heroTitle, { fontSize: SCREEN_WIDTH >= 1024 ? 80 : 48 }]}>{config.heroTitle}</Text>
                    <Text style={[styles.heroSubtitle, { fontSize: SCREEN_WIDTH >= 1024 ? 26 : 18 }]}>{config.heroSubtitle}</Text>
                </View>
            </View>

            {/* MAIN CONTACT & FORM */}
            <View style={styles.mainContent}>
                <View style={styles.contentMax}>
                    <View style={[styles.splitLayout, { flexDirection: SCREEN_WIDTH >= 1024 ? 'row' : 'column', gap: 80 }]}>
                        {/* LEFT: INFO & DEPARTMENTS */}
                        <View style={styles.infoSide}>
                            <Text style={styles.sectionTag}>{config.contactTag}</Text>
                            <Text style={[styles.sideTitle, { fontSize: SCREEN_WIDTH >= 768 ? 48 : 32 }]}>{config.contactSideTitle}</Text>

                            <View style={styles.methodsGrid}>
                                {config.contactMethods.map((method) => (
                                    <View key={method.id} style={styles.methodCard}>
                                        <View style={[styles.methodIcon, { backgroundColor: Colors.primary + '10' }]}>
                                            <DynamicIcon name={method.icon} size={28} color={Colors.primary} />
                                        </View>
                                        <View style={styles.methodText}>
                                            <Text style={styles.methodLabel}>{method.label}</Text>
                                            <Text style={styles.methodValue}>{method.value}</Text>
                                            <Text style={styles.methodSub}>{method.subtext}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>

                            <View style={styles.officeBox}>
                                <Text style={styles.officeLabel}>GLOBAL HEADQUARTERS</Text>
                                <Text style={styles.officeAddress}>{config.officeAddress || '123 Logistics Way, London, UK'}</Text>
                                <View style={styles.officeMeta}>
                                    <View style={styles.metaItem}>
                                        <Mail size={16} color={Colors.primary} />
                                        <Text style={styles.metaText}>{config.officeEmail || 'hello@cyvhub.com'}</Text>
                                    </View>
                                    <View style={styles.metaItem}>
                                        <Phone size={16} color={Colors.primary} />
                                        <Text style={styles.metaText}>{config.officePhone || '0800 123 4567'}</Text>
                                    </View>
                                </View>
                            </View>

                            <Text style={[styles.sideTitle, { marginTop: 60 }]}>{config.departmentsTitle}</Text>
                            <View style={styles.deptList}>
                                {config.departments.map((dept) => (
                                    <View key={dept.id} style={styles.deptCard}>
                                        <View style={styles.deptHeader}>
                                            <View style={styles.deptIconBox}>
                                                <DynamicIcon name={dept.icon} size={24} color={Colors.primary} />
                                            </View>
                                            <Text style={styles.deptName}>{dept.name}</Text>
                                        </View>
                                        <Text style={styles.deptDesc}>{dept.desc}</Text>
                                        <View style={styles.deptContact}>
                                            <Text style={styles.deptInfo}>{dept.email}</Text>
                                            <Text style={styles.deptInfo}>{dept.phone}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* RIGHT: FORM */}
                        <View style={styles.formSide}>
                            <View style={[styles.formCard, { padding: SCREEN_WIDTH >= 768 ? 80 : 30 }]}>
                                <Text style={styles.formTitle}>{config.formTitle}</Text>
                                <Text style={styles.formDesc}>{config.formDesc}</Text>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Full Name</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="John Smith"
                                        placeholderTextColor="#94A3B8"
                                        value={form.name}
                                        onChangeText={t => setForm({ ...form, name: t })}
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Work Email</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="john@company.com"
                                        placeholderTextColor="#94A3B8"
                                        value={form.email}
                                        onChangeText={t => setForm({ ...form, email: t })}
                                        keyboardType="email-address"
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Company (Optional)</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Acme Logistics"
                                        placeholderTextColor="#94A3B8"
                                        value={form.company}
                                        onChangeText={t => setForm({ ...form, company: t })}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Message</Text>
                                    <TextInput
                                        style={[styles.input, styles.textArea]}
                                        placeholder="How can we help your business?"
                                        placeholderTextColor="#94A3B8"
                                        value={form.message}
                                        onChangeText={t => setForm({ ...form, message: t })}
                                        multiline
                                        numberOfLines={6}
                                    />
                                </View>

                                <TouchableOpacity
                                    style={styles.submitBtn}
                                    onPress={handleSubmit}
                                    activeOpacity={0.9}
                                >
                                    <Text style={styles.submitBtnText}>Submit Inquiry</Text>
                                    <Rocket size={24} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </View>

            {/* STRATEGIC HUBS */}
            <View style={[styles.section, { backgroundColor: '#0F172A' }]}>
                <View style={styles.contentMax}>
                    <Text style={styles.sectionTagInverse}>OUR NETWORK</Text>
                    <Text style={[styles.sectionTitleInverse, { fontSize: SCREEN_WIDTH >= 1024 ? 56 : 36 }]}>{config.hubsTitle}</Text>
                    <View style={styles.hubsGrid}>
                        {config.hubs.map((hub) => (
                            <View key={hub.id} style={[styles.hubCard, { width: SCREEN_WIDTH >= 1024 ? '23%' : SCREEN_WIDTH >= 768 ? '47%' : '100%' }]}>
                                <View style={styles.hubIconBox}>
                                    <Building2 size={32} color="#FFF" />
                                </View>
                                <Text style={styles.hubCity}>{hub.city}</Text>
                                <Text style={styles.hubAddress}>{hub.address}</Text>
                                <View style={styles.coverageBadge}>
                                    <Text style={styles.coverageText}>{hub.coverage}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            </View>

            {/* FAQ SECTION */}
            <View style={[styles.faqSection, { backgroundColor: '#F8FAFC' }]}>
                <View style={styles.contentMax}>
                    <Text style={styles.sectionTagCenter}>GOT QUESTIONS?</Text>
                    <Text style={[styles.faqTitle, { fontSize: SCREEN_WIDTH >= 768 ? 56 : 36 }]}>{config.faqsTitle}</Text>
                    <View style={styles.faqList}>
                        {config.faqs.map((faq) => (
                            <TouchableOpacity
                                key={faq.id}
                                style={[styles.faqItem, expandedFaq === faq.id && styles.faqExpanded]}
                                onPress={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                                activeOpacity={0.8}
                            >
                                <View style={styles.faqHeader}>
                                    <Text style={styles.faqQuestion}>{faq.question}</Text>
                                    <View style={[styles.faqIcon, expandedFaq === faq.id && { backgroundColor: Colors.primary }]}>
                                        {expandedFaq === faq.id ? (
                                            <ChevronUp size={20} color="#FFF" />
                                        ) : (
                                            <ChevronDown size={20} color={Colors.textMuted} />
                                        )}
                                    </View>
                                </View>
                                {expandedFaq === faq.id && (
                                    <View style={styles.faqContent}>
                                        <Text style={styles.faqAnswer}>{faq.answer}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
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
    mainContent: {
        paddingVertical: 120,
        paddingHorizontal: 24,
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
    sectionTagInverse: {
        color: Colors.primary,
        fontSize: 14,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 3,
        marginBottom: 20,
    },
    sectionTitleInverse: {
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 80,
        letterSpacing: -2,
    },
    splitLayout: {
    },
    infoSide: {
        flex: 1,
    },
    sideTitle: {
        fontWeight: '900',
        color: Colors.navy,
        marginBottom: 32,
        letterSpacing: -1,
    },
    methodsGrid: {
        gap: 20,
    },
    methodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 32,
        backgroundColor: '#FFFFFF',
        borderRadius: 32,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 5,
    },
    methodIcon: {
        width: 64,
        height: 64,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 24,
    },
    methodText: {
        flex: 1,
    },
    methodLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: Colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 8,
    },
    methodValue: {
        fontSize: 24,
        fontWeight: '900',
        color: Colors.navy,
        marginBottom: 4,
    },
    methodSub: {
        fontSize: 16,
        color: Colors.textSecondary,
    },
    officeBox: {
        marginTop: 40,
        padding: 40,
        backgroundColor: '#F8FAFC',
        borderRadius: 32,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    officeLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: Colors.textSecondary,
        letterSpacing: 2,
        marginBottom: 16,
    },
    officeAddress: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.navy,
        lineHeight: 30,
        marginBottom: 24,
    },
    officeMeta: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 24,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    metaText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text,
    },
    deptList: {
        gap: 24,
    },
    deptCard: {
        backgroundColor: '#FFFFFF',
        padding: 32,
        borderRadius: 32,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    deptHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    deptIconBox: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: Colors.primary + '10',
        alignItems: 'center',
        justifyContent: 'center',
    },
    deptName: {
        fontSize: 22,
        fontWeight: '900',
        color: Colors.navy,
        marginLeft: 20,
    },
    deptDesc: {
        fontSize: 17,
        color: Colors.textSecondary,
        lineHeight: 26,
        marginBottom: 24,
    },
    deptContact: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 24,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    deptInfo: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.primary,
    },
    formSide: {
        flex: 1.4,
    },
    formCard: {
        backgroundColor: '#F8FAFC',
        borderRadius: 50,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 30 },
        shadowOpacity: 0.1,
        shadowRadius: 50,
        elevation: 20,
    },
    formTitle: {
        fontSize: 48,
        fontWeight: '900',
        color: Colors.navy,
        marginBottom: 16,
        letterSpacing: -2,
    },
    formDesc: {
        fontSize: 20,
        color: Colors.textSecondary,
        marginBottom: 60,
        lineHeight: 32,
    },
    inputGroup: {
        marginBottom: 32,
    },
    label: {
        fontSize: 15,
        fontWeight: '800',
        color: Colors.navy,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 20,
        paddingHorizontal: 24,
        paddingVertical: 20,
        fontSize: 18,
        color: Colors.navy,
    },
    textArea: {
        height: 180,
        textAlignVertical: 'top',
    },
    submitBtn: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 24,
        borderRadius: 20,
        marginTop: 20,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.4,
        shadowRadius: 30,
        elevation: 15,
    },
    submitBtnText: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFF',
        marginRight: 16,
    },
    hubsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 24,
    },
    hubCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        padding: 40,
        borderRadius: 32,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    hubIconBox: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    hubCity: {
        fontSize: 28,
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 16,
        letterSpacing: -0.5,
    },
    hubAddress: {
        fontSize: 18,
        color: '#94A3B8',
        lineHeight: 28,
        marginBottom: 32,
    },
    coverageBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 30,
        backgroundColor: Colors.primary + '20',
        borderWidth: 1,
        borderColor: Colors.primary + '40',
    },
    coverageText: {
        color: Colors.primary,
        fontSize: 13,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    faqSection: {
        paddingVertical: 140,
        paddingHorizontal: 24,
    },
    faqTitle: {
        fontWeight: '900',
        color: Colors.navy,
        textAlign: 'center',
        marginBottom: 80,
        letterSpacing: -2,
    },
    faqList: {
        maxWidth: 900,
        width: '100%',
        alignSelf: 'center',
        gap: 20,
    },
    faqItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: 32,
        padding: 40,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    faqExpanded: {
        borderColor: Colors.primary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.05,
        shadowRadius: 40,
        elevation: 5,
    },
    faqHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 30,
    },
    faqQuestion: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.navy,
        flex: 1,
        letterSpacing: -0.5,
    },
    faqIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    faqContent: {
        marginTop: 32,
        paddingTop: 32,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    faqAnswer: {
        fontSize: 19,
        color: Colors.textSecondary,
        lineHeight: 32,
    }
});
