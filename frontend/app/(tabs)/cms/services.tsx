import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    ArrowLeft,
    Save,
    Plus,
    Trash2,
    ChevronDown,
    CheckCircle,
    XCircle,
    Layout,
    Type,
    Zap,
    ImageIcon,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import * as Haptics from 'expo-haptics';
import { ServicePageDetail, ServicesPageConfig, initialServicesPage } from '@/constants/cmsDefaults';
import { useCMS } from '@/context/CMSContext';
import CMSImagePicker from '@/components/CMSImagePicker';

export default function ServicesCMS() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { 
        serviceDetails, 
        isLoaded, 
        batchUpdateAndSync,
        servicesPage 
    } = useCMS();
    
    const [services, setServices] = useState<Record<string, ServicePageDetail>>({});
    const [pageConfig, setPageConfig] = useState<ServicesPageConfig>(initialServicesPage);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isEditingLanding, setIsEditingLanding] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isLoaded) {
            if (serviceDetails) setServices(serviceDetails);
            if (servicesPage) setPageConfig(servicesPage);
            setLoading(false);
        }
    }, [isLoaded, serviceDetails, servicesPage]);

    const handleSave = async () => {
        try {
            await batchUpdateAndSync({
                serviceDetails: services,
                servicesPage: pageConfig
            }, true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setHasUnsavedChanges(false);
            Alert.alert('✅ Success', 'Services content published!');
        } catch (e) {
            console.error('[ServicesCMS] Save Error:', e);
            Alert.alert('❌ Error', 'Failed to save changes.');
        }
    };

    const updateField = (id: string, key: keyof ServicePageDetail, value: any) => {
        setServices(prev => ({
            ...prev,
            [id]: { ...prev[id], [key]: value }
        }));
        setHasUnsavedChanges(true);
    };

    const updatePageField = (key: keyof ServicesPageConfig, value: any) => {
        setPageConfig(prev => ({ ...prev, [key]: value }));
        setHasUnsavedChanges(true);
    };

    const addService = () => {
        const id = Date.now().toString();
        const newService: ServicePageDetail = {
            id,
            slug: 'new-service-' + id,
            title: 'New Service',
            summary: '',
            heroHeading: '',
            heroSubtext: '',
            overview: '',
            description: '',
            benefits: [],
            useCases: [],
            howItWorks: '',
            whyChooseUs: [],
            ctaHeading: '',
            ctaText: '',
            ctaButtonText: 'Contact Us',
            ctaButtonUrl: '/contact',
            heroImageUrl: '',
            icon: 'Package',
            publishStatus: false,
            order: Object.keys(services).length + 1,
            metaTitle: '',
            metaDesc: '',
        };
        setServices(prev => ({ ...prev, [id]: newService }));
        setHasUnsavedChanges(true);
        setActiveId(id);
    };

    const removeService = (id: string) => {
        Alert.alert('Delete Service', 'Are you sure you want to delete this service?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => {
                const newServices = { ...services };
                delete newServices[id];
                setServices(newServices);
                setHasUnsavedChanges(true);
            }}
        ]);
    };

    const detail = activeId ? services[activeId] : null;

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={Colors.adminPrimary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity 
                        onPress={() => {
                            if (activeId) setActiveId(null);
                            else if (isEditingLanding) setIsEditingLanding(false);
                            else router.back();
                        }} 
                        style={styles.backButton}
                    >
                        <ArrowLeft size={20} color={Colors.textInverse} />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>
                            {activeId ? detail?.title : isEditingLanding ? 'Landing Page Editor' : 'Services Manager'}
                        </Text>
                        <Text style={styles.headerSubtitle}>
                            {activeId ? 'Edit service detail page' : isEditingLanding ? 'General landing page settings' : 'Manage public service offerings'}
                        </Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={[styles.saveButton, !hasUnsavedChanges && styles.saveButtonDisabled]}
                            onPress={handleSave}
                            disabled={!hasUnsavedChanges}
                        >
                            <Save size={16} color={hasUnsavedChanges ? '#FFF' : 'rgba(255,255,255,0.5)'} />
                            <Text style={[styles.saveButtonText, !hasUnsavedChanges && { color: 'rgba(255,255,255,0.5)' }]}>Publish</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>
                {!activeId && !isEditingLanding ? (
                    // DASHBOARD VIEW
                    <View>
                        <TouchableOpacity 
                            style={[styles.listItem, { backgroundColor: Colors.navyLight, borderColor: Colors.primary }]}
                            onPress={() => setIsEditingLanding(true)}
                        >
                            <View style={styles.listIcon}>
                                <Layout size={20} color={Colors.primary} />
                            </View>
                            <View style={styles.listContent}>
                                <Text style={[styles.listTitle, { color: '#FFF' }]}>Main Landing Page</Text>
                                <Text style={[styles.listSubtitle, { color: 'rgba(255,255,255,0.6)' }]}>Hero title, intro text, and metadata...</Text>
                            </View>
                            <ChevronDown size={20} color={Colors.textMuted} style={{ transform: [{ rotate: '-90deg' }] }} />
                        </TouchableOpacity>

                        <View style={styles.sectionHeaderRow}>
                            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Service Offerings</Text>
                            <TouchableOpacity style={[styles.addButton, { marginTop: 24 }]} onPress={addService}>
                                <Plus size={16} color="#FFF" />
                                <Text style={styles.addButtonText}>Add Service</Text>
                            </TouchableOpacity>
                        </View>
                        
                        {Object.entries(services)
                            .sort(([, a], [, b]) => (a.order || 0) - (b.order || 0))
                            .map(([key, svc]) => (
                            <TouchableOpacity
                                key={key}
                                style={styles.listItem}
                                onPress={() => setActiveId(key)}
                            >
                                <View style={styles.listIcon}>
                                    {svc.publishStatus ? (
                                        <CheckCircle size={20} color={Colors.success} />
                                    ) : (
                                        <XCircle size={20} color={Colors.textMuted} />
                                    )}
                                </View>
                                <View style={styles.listContent}>
                                    <View style={styles.listHeader}>
                                        <Text style={styles.listTitle}>{svc.title}</Text>
                                        <Text style={[styles.statusBadge, svc.publishStatus ? styles.statusPublished : styles.statusDraft]}>
                                            {svc.publishStatus ? 'Active' : 'Draft'}
                                        </Text>
                                    </View>
                                    <Text style={styles.listSubtitle} numberOfLines={1}>{svc.summary || svc.description}</Text>
                                </View>
                                <ChevronDown size={20} color={Colors.textMuted} style={{ transform: [{ rotate: '-90deg' }] }} />
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : isEditingLanding ? (
                    // LANDING PAGE EDITOR
                    <View>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Hero Content</Text>
                            <View style={styles.card}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Page Title</Text>
                                    <TextInput style={styles.input} value={pageConfig.title} onChangeText={t => updatePageField('title', t)} />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Hero Heading</Text>
                                    <TextInput style={styles.input} value={pageConfig.heroHeading} onChangeText={t => updatePageField('heroHeading', t)} />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Hero Subtext</Text>
                                    <TextInput style={[styles.input, styles.textArea]} value={pageConfig.heroSubtext} onChangeText={t => updatePageField('heroSubtext', t)} multiline />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Hero Image URL</Text>
                                    <CMSImagePicker
                                        value={pageConfig.heroImageUrl}
                                        onSelect={(url: string) => updatePageField('heroImageUrl', url)}
                                        label="Landing Hero Image"
                                    />
                                </View>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Intro Content</Text>
                            <View style={styles.card}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Intro Section (Long Text)</Text>
                                    <TextInput style={[styles.input, styles.textArea]} value={pageConfig.introSection} onChangeText={t => updatePageField('introSection', t)} multiline />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Card Grid Intro Text</Text>
                                    <TextInput style={[styles.input, styles.textArea]} value={pageConfig.cardIntroText} onChangeText={t => updatePageField('cardIntroText', t)} multiline />
                                </View>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Global CTA</Text>
                            <View style={styles.card}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>CTA Heading</Text>
                                    <TextInput style={styles.input} value={pageConfig.ctaHeading} onChangeText={t => updatePageField('ctaHeading', t)} />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>CTA Subtext</Text>
                                    <TextInput style={[styles.input, styles.textArea]} value={pageConfig.ctaText} onChangeText={t => updatePageField('ctaText', t)} multiline />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Button Label</Text>
                                    <TextInput style={styles.input} value={pageConfig.ctaButton} onChangeText={t => updatePageField('ctaButton', t)} />
                                </View>
                            </View>
                        </View>
                        <View style={{ height: 100 }} />
                    </View>
                ) : detail && activeId ? (
                    // SERVICE DETAIL EDITOR
                    <View>
                        <View style={styles.section}>
                            <View style={styles.sectionHeaderRow}>
                                <Text style={styles.sectionTitle}>Publish Settings</Text>
                                <TouchableOpacity 
                                    style={[styles.statusToggle, detail.publishStatus ? styles.statusToggleActive : styles.statusToggleInactive]} 
                                    onPress={() => updateField(activeId, 'publishStatus', !detail.publishStatus)}
                                >
                                    <Text style={styles.statusToggleText}>{detail.publishStatus ? 'Active' : 'Draft'}</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.card}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Display Order (Numeric)</Text>
                                    <TextInput style={styles.input} value={String(detail.order || 0)} onChangeText={t => updateField(activeId, 'order', parseInt(t) || 0)} keyboardType="numeric" />
                                </View>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Core Identity</Text>
                            <View style={styles.card}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Service Name</Text>
                                    <TextInput style={styles.input} value={detail.title} onChangeText={t => updateField(activeId, 'title', t)} />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>URL Slug</Text>
                                    <TextInput style={styles.input} value={detail.slug} onChangeText={t => updateField(activeId, 'slug', t)} placeholder="e.g. same-day-delivery" />
                                </View>
                                <View style={styles.inputGroup}>
                                    <View style={styles.labelRow}>
                                        <Text style={styles.inputLabel}>Short Summary (Card Preview)</Text>
                                        <Text style={styles.counter}>{detail.summary?.length || 0} chars</Text>
                                    </View>
                                    <TextInput style={[styles.input, styles.textArea, { minHeight: 60 }]} value={detail.summary} onChangeText={t => updateField(activeId, 'summary', t)} multiline />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Hero Heading</Text>
                                    <TextInput style={styles.input} value={detail.heroHeading} onChangeText={t => updateField(activeId, 'heroHeading', t)} />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Hero Subtext</Text>
                                    <TextInput style={[styles.input, styles.textArea]} value={detail.heroSubtext} onChangeText={t => updateField(activeId, 'heroSubtext', t)} multiline />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Hero Image</Text>
                                    <CMSImagePicker
                                        value={detail.heroImageUrl}
                                        onSelect={(url: string) => updateField(activeId, 'heroImageUrl', url)}
                                        label="Service Hero Image"
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Dashboard Icon (Lucide name)</Text>
                                    <TextInput style={styles.input} value={detail.icon} onChangeText={t => updateField(activeId, 'icon', t)} />
                                </View>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Main Content (Professional Copy)</Text>
                            <View style={styles.card}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Service Overview (The "What")</Text>
                                    <TextInput style={[styles.input, styles.textArea, { minHeight: 120 }]} value={detail.overview} onChangeText={t => updateField(activeId, 'overview', t)} multiline />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Detailed Description (4 Paragraphs)</Text>
                                    <TextInput style={[styles.input, styles.textArea, { minHeight: 240 }]} value={detail.description} onChangeText={t => updateField(activeId, 'description', t)} multiline />
                                    <Text style={styles.inputHint}>Use double newlines (\n\n) to separate paragraphs.</Text>
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>How It Works (Operational Process)</Text>
                                    <TextInput style={[styles.input, styles.textArea, { minHeight: 120 }]} value={detail.howItWorks} onChangeText={t => updateField(activeId, 'howItWorks', t)} multiline />
                                </View>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <View style={styles.sectionHeaderRow}>
                                <Text style={styles.sectionTitle}>Key Benefits & Use Cases</Text>
                            </View>
                            <View style={styles.card}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Key Benefits (one per line)</Text>
                                    <TextInput 
                                        style={[styles.input, styles.textArea]} 
                                        value={detail.benefits?.join('\n')} 
                                        onChangeText={t => updateField(activeId, 'benefits', t.split('\n').filter(Boolean))} 
                                        multiline 
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Common Use Cases (one per line)</Text>
                                    <TextInput 
                                        style={[styles.input, styles.textArea]} 
                                        value={detail.useCases?.join('\n')} 
                                        onChangeText={t => updateField(activeId, 'useCases', t.split('\n').filter(Boolean))} 
                                        multiline 
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Why Choose Us Factors (one per line)</Text>
                                    <TextInput 
                                        style={[styles.input, styles.textArea]} 
                                        value={detail.whyChooseUs?.join('\n')} 
                                        onChangeText={t => updateField(activeId, 'whyChooseUs', t.split('\n').filter(Boolean))} 
                                        multiline 
                                    />
                                </View>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Page Closing CTA</Text>
                            <View style={styles.card}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>CTA Heading</Text>
                                    <TextInput style={styles.input} value={detail.ctaHeading} onChangeText={t => updateField(activeId, 'ctaHeading', t)} />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>CTA Supporting Text</Text>
                                    <TextInput style={styles.input} value={detail.ctaText} onChangeText={t => updateField(activeId, 'ctaText', t)} />
                                </View>
                                <View style={styles.row}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.inputLabel}>Button Label</Text>
                                        <TextInput style={styles.input} value={detail.ctaButtonText} onChangeText={t => updateField(activeId, 'ctaButtonText', t)} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.inputLabel}>Button Link</Text>
                                        <TextInput style={styles.input} value={detail.ctaButtonUrl} onChangeText={t => updateField(activeId, 'ctaButtonUrl', t)} />
                                    </View>
                                </View>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>SEO & Social</Text>
                            <View style={styles.card}>
                                <View style={styles.inputGroup}>
                                    <View style={styles.labelRow}>
                                        <Text style={styles.inputLabel}>Meta Title (Browser Tab)</Text>
                                        <Text style={[styles.counter, detail.metaTitle?.length > 60 && { color: Colors.danger }]}>{detail.metaTitle?.length || 0}/60</Text>
                                    </View>
                                    <TextInput style={styles.input} value={detail.metaTitle} onChangeText={t => updateField(activeId, 'metaTitle', t)} />
                                </View>
                                <View style={styles.inputGroup}>
                                    <View style={styles.labelRow}>
                                        <Text style={styles.inputLabel}>Meta Description (Google Snippet)</Text>
                                        <Text style={[styles.counter, detail.metaDesc?.length > 160 && { color: Colors.danger }]}>{detail.metaDesc?.length || 0}/160</Text>
                                    </View>
                                    <TextInput style={[styles.input, styles.textArea]} value={detail.metaDesc} onChangeText={t => updateField(activeId, 'metaDesc', t)} multiline />
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.dangerZoneBtn} onPress={() => removeService(activeId)}>
                            <Trash2 size={16} color={Colors.danger} />
                            <Text style={styles.dangerZoneText}>Delete Service Offering</Text>
                        </TouchableOpacity>

                        <View style={{ height: 100 }} />
                    </View>
                ) : null}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: {
        backgroundColor: Colors.navy,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFF',
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 2,
    },
    headerActions: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.adminPrimary,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        gap: 8,
    },
    saveButtonDisabled: {
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    saveButtonText: {
        color: '#FFF',
        fontWeight: '700',
    },
    content: { flex: 1 },
    contentPadding: { padding: 20 },
    section: { marginBottom: 32 },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.text,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 16,
    },
    listIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
    },
    listContent: { flex: 1 },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    listTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
    },
    listSubtitle: {
        fontSize: 13,
        color: Colors.textSecondary,
    },
    statusBadge: {
        fontSize: 10,
        fontWeight: '800',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        textTransform: 'uppercase',
    },
    statusPublished: {
        backgroundColor: Colors.success + '20',
        color: Colors.success,
    },
    statusDraft: {
        backgroundColor: '#F1F5F9',
        color: Colors.textMuted,
    },
    inputGroup: { marginBottom: 16 },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    inputLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.textSecondary,
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        color: Colors.text,
    },
    textArea: { minHeight: 100, textAlignVertical: 'top' },
    inputHint: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
    counter: { fontSize: 11, color: Colors.textMuted },
    row: { flexDirection: 'row', gap: 12 },
    statusToggle: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
    },
    statusToggleActive: {
        backgroundColor: Colors.success + '10',
        borderColor: Colors.success + '40',
    },
    statusToggleInactive: {
        backgroundColor: '#F1F5F9',
        borderColor: '#E2E8F0',
    },
    statusToggleText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.textSecondary,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.adminPrimary,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    addButtonText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '700',
    },
    dangerZoneBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.danger + '40',
        gap: 8,
        marginTop: 40,
    },
    dangerZoneText: {
        color: Colors.danger,
        fontWeight: '700',
    },
});
