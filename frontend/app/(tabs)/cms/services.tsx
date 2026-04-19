import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Image,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    ArrowLeft,
    Save,
    Eye,
    Plus,
    Trash2,
    GripVertical,
    ImageIcon,
    Type,
    Zap,
    Package,
    Layout,
    X,
    CheckCircle2,
} from 'lucide-react-native';
import { Modal } from 'react-native';
import Colors from '@/constants/colors';
import * as Haptics from 'expo-haptics';
import { ServicesPageConfig, initialServicesPage, ServiceDetailConfig, ServicePageDetail } from '@/constants/cmsDefaults';
import { useCMS } from '@/context/CMSContext';
import CMSImagePicker from '@/components/CMSImagePicker';

export default function ServicesCMS() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { servicesPage, setServicesPage, serviceDetails, setServiceDetails, isLoaded, batchUpdateAndSync } = useCMS();
    const [config, setConfig] = useState<ServicesPageConfig>(initialServicesPage);
    const [details, setDetails] = useState<Record<string, ServicePageDetail>>({});
    const [editingSlug, setEditingSlug] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    useEffect(() => {
        if (isLoaded && servicesPage) {
            setConfig(servicesPage);
        }
        if (isLoaded && serviceDetails) {
            setDetails(serviceDetails);
        }
        if (isLoaded) setLoading(false);
    }, [isLoaded, servicesPage, serviceDetails]);

    const handleSave = async () => {
        try {
            // Use batchUpdateAndSync to save both page layout and service details at once
            await batchUpdateAndSync({
                servicesPage: config,
                serviceDetails: details
            }, true);
            
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setHasUnsavedChanges(false);
            Alert.alert('✅ Success', 'Services content published globally!');
        } catch (e) {
            console.error('[ServicesCMS] Save Error:', e);
            Alert.alert('❌ Error', 'Failed to save changes. Please check your connection.');
        }
    };

    const updateConfig = (updates: Partial<ServicesPageConfig>) => {
        setConfig(prev => ({ ...prev, ...updates }));
        setHasUnsavedChanges(true);
    };

    const addService = () => {
        const newService: ServiceDetailConfig = {
            id: Date.now().toString(),
            title: 'New Service',
            description: 'Service description goes here...',
            icon: 'Package',
            features: ['Feature 1', 'Feature 2'],
            imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d',
        };
        updateConfig({ mainServices: [...config.mainServices, newService] });
    };

    const removeService = (id: string) => {
        updateConfig({ mainServices: config.mainServices.filter(s => s.id !== id) });
    };

    const updateService = (id: string, updates: Partial<ServiceDetailConfig>) => {
        updateConfig({
            mainServices: config.mainServices.map(s => s.id === id ? { ...s, ...updates } : s)
        });
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={Colors.adminPrimary} />
            </View>
        );
    }

    // Sort published services by order
    const sortedServices = Object.values(details)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

    const togglePublish = (slug: string) => {
        setDetails(prev => ({
            ...prev,
            [slug]: { ...prev[slug], publishStatus: !prev[slug].publishStatus }
        }));
        setHasUnsavedChanges(true);
    };

    const updateOrder = (slug: string, newOrder: number) => {
        setDetails(prev => ({
            ...prev,
            [slug]: { ...prev[slug], order: newOrder }
        }));
        setHasUnsavedChanges(true);
    };

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <ArrowLeft size={20} color={Colors.textInverse} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>Services Editor</Text>
                        <Text style={styles.headerSubtitle}>Manage public service offerings</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={styles.previewBtn}
                            onPress={() => router.push('/(public)/services')}
                        >
                            <Eye size={18} color={Colors.textInverse} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.saveBtn, !hasUnsavedChanges && { opacity: 0.6 }]}
                            onPress={handleSave}
                            disabled={!hasUnsavedChanges}
                        >
                            <Save size={18} color="#FFF" />
                            <Text style={styles.saveBtnText}>Publish</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
                {/* LANDING PAGE CONFIG */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Landing Page Content</Text>
                    <View style={styles.card}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Page Title</Text>
                            <TextInput
                                style={styles.input}
                                value={config.title}
                                onChangeText={t => updateConfig({ title: t })}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Hero Heading</Text>
                            <TextInput
                                style={styles.input}
                                value={config.heroHeading}
                                onChangeText={t => updateConfig({ heroHeading: t })}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Hero Subtext</Text>
                            <TextInput
                                style={[styles.input, { height: 80 }]}
                                value={config.heroSubtext}
                                onChangeText={t => updateConfig({ heroSubtext: t })}
                                multiline
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Hero Background Image</Text>
                            <CMSImagePicker
                                value={config.heroImageUrl}
                                onImageSelected={url => updateConfig({ heroImageUrl: url })}
                                label="Page Hero Image"
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Intro Section (Long Text)</Text>
                            <TextInput
                                style={[styles.input, { height: 120 }]}
                                value={config.introSection}
                                onChangeText={t => updateConfig({ introSection: t })}
                                multiline
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Card Intro Highlight Text</Text>
                            <TextInput
                                style={[styles.input, { height: 60 }]}
                                value={config.cardIntroText}
                                onChangeText={t => updateConfig({ cardIntroText: t })}
                                multiline
                            />
                        </View>
                    </View>
                </View>

                {/* SERVICES GRID MANAGEMENT */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Service Offerings ({sortedServices.length})</Text>
                    </View>

                    {sortedServices.map((service, index) => (
                        <View key={service.id} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={styles.cardHeaderLeft}>
                                    <Text style={styles.cardIndex}>#{service.order} - {service.title}</Text>
                                </View>
                                <View style={styles.cardHeaderRight}>
                                    <TouchableOpacity 
                                        style={[styles.publishToggle, service.publishStatus && styles.publishToggleActive]}
                                        onPress={() => togglePublish(service.slug)}
                                    >
                                        <Text style={[styles.publishToggleText, service.publishStatus && styles.publishToggleTextActive]}>
                                            {service.publishStatus ? 'Published' : 'Hidden'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.inputLabel}>Display Order</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={service.order?.toString()}
                                        onChangeText={t => updateOrder(service.slug, parseInt(t) || 0)}
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={[styles.inputGroup, { flex: 3 }]}>
                                    <Text style={styles.inputLabel}>Summary Link Slug</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: '#F1F5F9' }]}
                                        value={service.slug}
                                        editable={false}
                                    />
                                </View>
                            </View>

                            <Text style={styles.summaryPreview}>{service.summary}</Text>

                            <View style={[styles.row, { marginTop: 12 }]}>
                                <TouchableOpacity 
                                    style={[styles.editDetailsBtn, { flex: 1 }]} 
                                    onPress={() => setEditingSlug(service.slug)}
                                >
                                    <Layout size={16} color={Colors.primary} />
                                    <Text style={styles.editDetailsText}>Edit Dedicated Page</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.previewBtnSmall, { width: 44 }]} 
                                    onPress={() => router.push(`/(public)/services/${service.slug}` as any)}
                                >
                                    <Eye size={16} color={Colors.primary} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>

                {/* LANDING PAGE CTA */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Landing Page CTA</Text>
                    <View style={styles.card}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>CTA Heading</Text>
                            <TextInput
                                style={styles.input}
                                value={config.ctaHeading}
                                onChangeText={t => updateConfig({ ctaHeading: t })}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>CTA Subtext</Text>
                            <TextInput
                                style={[styles.input, { height: 80 }]}
                                value={config.ctaText}
                                onChangeText={t => updateConfig({ ctaText: t })}
                                multiline
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Button Label</Text>
                            <TextInput
                                style={styles.input}
                                value={config.ctaButton}
                                onChangeText={t => updateConfig({ ctaButton: t })}
                            />
                        </View>
                    </View>
                </View>


                <View style={{ height: 100 }} />
            </ScrollView>

            {hasUnsavedChanges && (
                <View style={styles.unsavedBar}>
                    <Text style={styles.unsavedText}>You have unsaved changes</Text>
                    <TouchableOpacity style={styles.unsavedSaveBtn} onPress={handleSave}>
                        <Text style={styles.unsavedSaveText}>Save Now</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* DETAILS EDITOR MODAL */}
            {editingSlug && (
                <Modal visible={!!editingSlug} animationType="slide" presentationStyle="pageSheet">
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setEditingSlug(null)} style={styles.modalClose}>
                                <X size={24} color={Colors.text} />
                            </TouchableOpacity>
                            <Text style={styles.modalTitle}>Service Detail Editor</Text>
                            <TouchableOpacity 
                                onPress={() => setEditingSlug(null)} 
                                style={styles.modalDone}
                            >
                                <Text style={styles.modalDoneText}>Done</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                             {(() => {
                                const d = details[editingSlug] || ({} as ServicePageDetail);
                                const updateDetail = (up: Partial<ServicePageDetail>) => {
                                    setDetails(prev => ({
                                        ...prev,
                                        [editingSlug]: { ...d, ...up }
                                    }));
                                    setHasUnsavedChanges(true);
                                };

                                return (
                                    <View style={{ padding: 20 }}>
                                        <Text style={styles.sectionTitle}>Dedicated Page Hero</Text>
                                        <View style={styles.card}>
                                            <View style={styles.inputGroup}>
                                                <Text style={styles.inputLabel}>Hero Heading</Text>
                                                <TextInput style={styles.input} value={d.heroHeading} onChangeText={t => updateDetail({ heroHeading: t })} />
                                            </View>
                                            <View style={styles.inputGroup}>
                                                <Text style={styles.inputLabel}>Hero Subtext</Text>
                                                <TextInput style={[styles.input, { height: 80 }]} multiline value={d.heroSubtext} onChangeText={t => updateDetail({ heroSubtext: t })} />
                                            </View>
                                             <View style={styles.inputGroup}>
                                                 <Text style={styles.inputLabel}>Hero Image</Text>
                                                 <CMSImagePicker
                                                     value={d.heroImageUrl}
                                                     onImageSelected={url => updateDetail({ heroImageUrl: url })}
                                                     label="Service Hero Image"
                                                 />
                                             </View>
                                        </View>

                                        <Text style={styles.sectionTitle}>Core Content</Text>
                                        <View style={styles.card}>
                                            <View style={styles.inputGroup}>
                                                <Text style={styles.inputLabel}>Service Overview (Visible on Page)</Text>
                                                <TextInput style={[styles.input, { height: 120 }]} multiline value={d.overview} onChangeText={t => updateDetail({ overview: t })} />
                                            </View>
                                            <View style={styles.inputGroup}>
                                                <Text style={styles.inputLabel}>Service Description (Technical/Deep)</Text>
                                                <TextInput style={[styles.input, { height: 120 }]} multiline value={d.description} onChangeText={t => updateDetail({ description: t })} />
                                            </View>
                                            <View style={styles.inputGroup}>
                                                <Text style={styles.inputLabel}>How It Works (Process)</Text>
                                                <TextInput style={[styles.input, { height: 120 }]} multiline value={d.howItWorks} onChangeText={t => updateDetail({ howItWorks: t })} />
                                            </View>
                                        </View>

                                        <Text style={styles.sectionTitle}>Benefits & Applications</Text>
                                        <View style={styles.card}>
                                            <View style={styles.inputGroup}>
                                                <Text style={styles.inputLabel}>Key Benefits (one per line)</Text>
                                                <TextInput 
                                                    style={[styles.input, { height: 120 }]} 
                                                    multiline 
                                                    value={d.benefits?.join('\n')} 
                                                    onChangeText={t => updateDetail({ benefits: t.split('\n').filter(Boolean) })} 
                                                />
                                            </View>
                                            <View style={styles.inputGroup}>
                                                <Text style={styles.inputLabel}>Typical Use Cases (one per line)</Text>
                                                <TextInput 
                                                    style={[styles.input, { height: 120 }]} 
                                                    multiline 
                                                    value={d.useCases?.join('\n')} 
                                                    onChangeText={t => updateDetail({ useCases: t.split('\n').filter(Boolean) })} 
                                                />
                                            </View>
                                            <View style={styles.inputGroup}>
                                                <Text style={styles.inputLabel}>Why Choose Us Factors (one per line)</Text>
                                                <TextInput 
                                                    style={[styles.input, { height: 120 }]} 
                                                    multiline 
                                                    value={d.whyChooseUs?.join('\n')} 
                                                    onChangeText={t => updateDetail({ whyChooseUs: t.split('\n').filter(Boolean) })} 
                                                />
                                            </View>
                                        </View>

                                        <Text style={styles.sectionTitle}>Page Specific CTA</Text>
                                        <View style={styles.card}>
                                            <View style={styles.inputGroup}>
                                                <Text style={styles.inputLabel}>CTA Heading</Text>
                                                <TextInput style={styles.input} value={d.ctaHeading} onChangeText={t => updateDetail({ ctaHeading: t })} />
                                            </View>
                                            <View style={styles.inputGroup}>
                                                <Text style={styles.inputLabel}>CTA Text</Text>
                                                <TextInput style={styles.input} value={d.ctaText} onChangeText={t => updateDetail({ ctaText: t })} />
                                            </View>
                                            <View style={styles.row}>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.inputLabel}>Btn Label</Text>
                                                    <TextInput style={styles.input} value={d.ctaButtonText} onChangeText={t => updateDetail({ ctaButtonText: t })} />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.inputLabel}>Btn URL</Text>
                                                    <TextInput style={styles.input} value={d.ctaButtonUrl} onChangeText={t => updateDetail({ ctaButtonUrl: t })} />
                                                </View>
                                            </View>
                                        </View>

                                        <Text style={styles.sectionTitle}>SEO & Meta</Text>
                                        <View style={styles.card}>
                                            <View style={styles.inputGroup}>
                                                <Text style={styles.inputLabel}>Meta Title</Text>
                                                <TextInput style={styles.input} value={d.metaTitle} onChangeText={t => updateDetail({ metaTitle: t })} />
                                            </View>
                                            <View style={styles.inputGroup}>
                                                <Text style={styles.inputLabel}>Meta Description</Text>
                                                <TextInput style={[styles.input, { height: 80 }]} multiline value={d.metaDesc} onChangeText={t => updateDetail({ metaDesc: t })} />
                                            </View>
                                        </View>

                                        <Text style={styles.sectionTitle}>Preview Summary (Landing Page Card)</Text>
                                        <View style={styles.card}>
                                            <View style={styles.inputGroup}>
                                                <Text style={styles.inputLabel}>Main Service Title</Text>
                                                <TextInput style={styles.input} value={d.title} onChangeText={t => updateDetail({ title: t })} />
                                            </View>
                                            <View style={styles.inputGroup}>
                                                <Text style={styles.inputLabel}>Summary Text (1-2 lines)</Text>
                                                <TextInput style={[styles.input, { height: 60 }]} multiline value={d.summary} onChangeText={t => updateDetail({ summary: t })} />
                                            </View>
                                            <View style={styles.inputGroup}>
                                                <Text style={styles.inputLabel}>Dashboard Icon</Text>
                                                <TextInput style={styles.input} value={d.icon} onChangeText={t => updateDetail({ icon: t })} />
                                            </View>
                                        </View>
                                    </View>
                                );
                            })()}
                        </ScrollView>
                    </View>
                </Modal>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        backgroundColor: Colors.navy,
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitleContainer: {
        flex: 1,
        marginLeft: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFF',
    },
    headerSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
    },
    headerActions: {
        flexDirection: 'row',
        gap: 8,
    },
    previewBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.adminPrimary,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        gap: 8,
    },
    saveBtnText: {
        color: '#FFF',
        fontWeight: '700',
    },
    body: {
        flex: 1,
    },
    bodyContent: {
        padding: 16,
    },
    section: {
        marginBottom: 32,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.text,
    },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.adminPrimary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 6,
    },
    addBtnText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '600',
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    cardHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    dragHandle: {
        padding: 4,
    },
    cardIndex: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textSecondary,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        color: Colors.text,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    nestedCard: {
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#EDF2F7',
    },
    unsavedBar: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: Colors.navy,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    unsavedText: {
        color: '#FFF',
        fontWeight: '600',
    },
    unsavedSaveBtn: {
        backgroundColor: Colors.adminPrimary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
    },
    unsavedSaveText: {
        color: '#FFF',
        fontWeight: '700',
    },
    editDetailsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary + '10',
        paddingVertical: 10,
        borderRadius: 10,
        gap: 8,
        borderWidth: 1,
        borderColor: Colors.primary + '20',
    },
    editDetailsText: {
        color: Colors.primary,
        fontWeight: '700',
        fontSize: 14,
    },
    summaryPreview: {
        fontSize: 14,
        color: 'gray',
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 8,
        fontStyle: 'italic',
    },
    publishToggle: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: Colors.danger + '10',
        borderWidth: 1,
        borderColor: Colors.danger + '20',
    },
    publishToggleActive: {
        backgroundColor: Colors.primary + '10',
        borderColor: Colors.primary + '20',
    },
    publishToggleText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.danger,
    },
    publishToggleTextActive: {
        color: Colors.primary,
    },
});
