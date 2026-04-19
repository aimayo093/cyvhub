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
            <View style={[styles.heroSection, { paddingVertical: SCREEN_WIDTH >= 1024 ? 140 : 100 }]}>
                <Image
                    source={{ uri: config.heroImageUrl }}
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="cover"
                />
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(15, 23, 42, 0.7)' }]} />
                <View style={styles.heroContent}>
                    <Text style={[styles.heroTitle, { fontSize: SCREEN_WIDTH >= 1024 ? 72 : 48 }]}>{config.heroTitle}</Text>
                    <Text style={[styles.heroSubtitle, { fontSize: SCREEN_WIDTH >= 1024 ? 24 : 18 }]}>{config.heroSubtitle}</Text>
                </View>
            </View>

            {/* MAIN CONTACT & FORM */}
            <View style={styles.mainContent}>
                <View style={styles.contentMax}>
                    <View style={[styles.splitLayout, { flexDirection: SCREEN_WIDTH >= 768 ? 'row' : 'column' }]}>
                        {/* LEFT: INFO & DEPARTMENTS */}
                        <View style={styles.infoSide}>
                            <Text style={styles.sectionTag}>{config.contactTag}</Text>
                            <Text style={styles.sideTitle}>{config.contactSideTitle}</Text>

                            <View style={styles.methodsGrid}>
                                {config.contactMethods.map((method) => (
                                    <View key={method.id} style={styles.methodCard}>
                                        <View style={[styles.methodIcon, { backgroundColor: Colors.primary + '10' }]}>
                                            <DynamicIcon name={method.icon} size={24} color={Colors.primary} />
                                        </View>
                                        <View style={styles.methodText}>
                                            <Text style={styles.methodLabel}>{method.label}</Text>
                                            <Text style={styles.methodValue}>{method.value}</Text>
                                            <Text style={styles.methodSub}>{method.subtext}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>

                            <Text style={[styles.sideTitle, { marginTop: 40 }]}>{config.departmentsTitle}</Text>
                            <View style={styles.deptList}>
                                {config.departments.map((dept) => (
                                    <View key={dept.id} style={styles.deptCard}>
                                        <View style={styles.deptHeader}>
                                            <View style={styles.deptIconBox}>
                                                <DynamicIcon name={dept.icon} size={20} color={Colors.primary} />
                                            </View>
                                            <Text style={styles.deptName}>{dept.name}</Text>
                                        </View>
                                        <Text style={styles.deptDesc}>{dept.desc}</Text>
                                        <View style={[styles.deptContact, { flexDirection: SCREEN_WIDTH >= 768 ? 'row' : 'column' }]}>
                                            <Text style={styles.deptInfo}>{dept.email}</Text>
                                            <Text style={styles.deptInfo}>{dept.phone}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* RIGHT: FORM */}
                        <View style={styles.formSide}>
                            <View style={[styles.formCard, { padding: SCREEN_WIDTH >= 768 ? 60 : 30 }]}>
                                <Text style={styles.formTitle}>{config.formTitle}</Text>
                                <Text style={styles.formDesc}>{config.formDesc}</Text>

                                <View style={[styles.inputRow, { flexDirection: SCREEN_WIDTH >= 768 ? 'row' : 'column' }]}>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Full Name</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="John Smith"
                                            value={form.name}
                                            onChangeText={t => setForm({ ...form, name: t })}
                                        />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Work Email</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="john@company.com"
                                            value={form.email}
                                            onChangeText={t => setForm({ ...form, email: t })}
                                            keyboardType="email-address"
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Company (Optional)</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Acme Logistics"
                                        value={form.company}
                                        onChangeText={t => setForm({ ...form, company: t })}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Message</Text>
                                    <TextInput
                                        style={[styles.input, styles.textArea]}
                                        placeholder="How can we help your business?"
                                        value={form.message}
                                        onChangeText={t => setForm({ ...form, message: t })}
                                        multiline
                                        numberOfLines={5}
                                    />
                                </View>

                                <TouchableOpacity
                                    style={styles.submitBtn}
                                    onPress={handleSubmit}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.submitBtnText}>Submit Inquiry</Text>
                                    <Rocket size={18} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </View>

            {/* STRATEGIC HUBS */}
            <View style={[styles.section, { backgroundColor: Colors.navy }]}>
                <View style={styles.contentMax}>
                    <Text style={[styles.sectionTagInverse, { textAlign: SCREEN_WIDTH >= 768 ? 'left' : 'center' }]}>{config.hubsTag}</Text>
                    <Text style={[styles.sectionTitleInverse, { textAlign: SCREEN_WIDTH >= 768 ? 'left' : 'center', fontSize: SCREEN_WIDTH >= 1024 ? 48 : 36 }]}>{config.hubsTitle}</Text>
                    <View style={styles.hubsGrid}>
                        {config.hubs.map((hub) => (
                            <View key={hub.id} style={styles.hubCard}>
                                <Building2 size={32} color={Colors.primary} style={{ marginBottom: 20 }} />
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
            <View style={styles.faqSection}>
                <View style={styles.contentMax}>
                    <Text style={styles.faqTitle}>{config.faqsTitle}</Text>
                    <View style={styles.faqList}>
                        {config.faqs.map((faq) => (
                            <TouchableOpacity
                                key={faq.id}
                                style={[styles.faqItem, expandedFaq === faq.id && styles.faqExpanded]}
                                onPress={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.faqHeader}>
                                    <Text style={styles.faqQuestion}>{faq.question}</Text>
                                    {expandedFaq === faq.id ? (
                                        <ChevronUp size={20} color={Colors.primary} />
                                    ) : (
                                        <ChevronDown size={20} color={Colors.textMuted} />
                                    )}
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
        paddingVertical: 120,
        paddingHorizontal: 24,
    },
    sectionTag: {
        color: Colors.primary,
        fontSize: 14,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 12,
    },
    sectionTagInverse: {
        color: Colors.primary,
        fontSize: 14,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 16,
    },
    sectionTitleInverse: {
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 60,
        letterSpacing: -1,
    },
    splitLayout: {
    },
    infoSide: {
        flex: 1,
    },
    sideTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: Colors.navy,
        marginBottom: 24,
        letterSpacing: -0.5,
    },
    methodsGrid: {
    },
    methodCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 24,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 16,
    },
    methodIcon: {
        width: 52,
        height: 52,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 20,
    },
    methodText: {
        flex: 1,
    },
    methodLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: Colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    methodValue: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 2,
    },
    methodSub: {
        fontSize: 15,
        color: Colors.textSecondary,
    },
    deptList: {
    },
    deptCard: {
        backgroundColor: '#F8FAFC',
        padding: 24,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 20,
    },
    deptHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    deptIconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: Colors.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
    },
    deptName: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.navy,
        marginLeft: 12,
    },
    deptDesc: {
        fontSize: 15,
        color: Colors.textSecondary,
        lineHeight: 22,
        marginBottom: 16,
    },
    deptContact: {
    },
    deptInfo: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.primary,
        marginRight: 24,
        marginBottom: 8,
    },
    formSide: {
        flex: 1.4,
    },
    formCard: {
        backgroundColor: '#F8FAFC',
        borderRadius: 40,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    formTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: Colors.navy,
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    formDesc: {
        fontSize: 17,
        color: Colors.textSecondary,
        marginBottom: 40,
        lineHeight: 26,
    },
    inputRow: {
        marginBottom: 20,
    },
    inputGroup: {
        flex: 1,
        marginBottom: 20,
        marginHorizontal: 10,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 10,
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: Colors.text,
    },
    textArea: {
        height: 140,
        textAlignVertical: 'top',
    },
    submitBtn: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 16,
        marginTop: 20,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 8,
    },
    submitBtnText: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFF',
        marginRight: 12,
    },
    hubsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    hubCard: {
        flex: 1,
        minWidth: 260,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 32,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        margin: 12,
    },
    hubCity: {
        fontSize: 22,
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 12,
    },
    hubAddress: {
        fontSize: 16,
        color: '#94A3B8',
        lineHeight: 24,
        marginBottom: 20,
    },
    coverageBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: Colors.primary + '20',
        borderWidth: 1,
        borderColor: Colors.primary + '40',
    },
    coverageText: {
        color: Colors.primary,
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    faqSection: {
        paddingVertical: 120,
        paddingHorizontal: 24,
    },
    faqTitle: {
        fontSize: 40,
        fontWeight: '900',
        color: Colors.navy,
        textAlign: 'center',
        marginBottom: 60,
        letterSpacing: -1,
    },
    faqList: {
        maxWidth: 800,
        width: '100%',
        alignSelf: 'center',
    },
    faqItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 16,
    },
    faqExpanded: {
        borderColor: Colors.primary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    faqHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    faqQuestion: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
        flex: 1,
        paddingRight: 20,
    },
    faqContent: {
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    faqAnswer: {
        fontSize: 17,
        color: Colors.textSecondary,
        lineHeight: 26,
    }
});
