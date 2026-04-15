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
                {/* HERO SECTION */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Hero Section</Text>
                    <View style={styles.card}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Headline</Text>
                            <TextInput
                                style={styles.input}
                                value={config.heroTitle}
                                onChangeText={t => updateConfig({ heroTitle: t })}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Subheading</Text>
                            <TextInput
                                style={[styles.input, { height: 80 }]}
                                value={config.heroSubtitle}
                                onChangeText={t => updateConfig({ heroSubtitle: t })}
                                multiline
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Hero Background Image URL</Text>
                            <TextInput
                                style={styles.input}
                                value={config.heroImageUrl}
                                onChangeText={t => updateConfig({ heroImageUrl: t })}
                            />
                        </View>
                    </View>
                </View>

                {/* MAIN SERVICES */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Main Services</Text>
                        <TouchableOpacity style={styles.addBtn} onPress={addService}>
                            <Plus size={16} color="#FFF" />
                            <Text style={styles.addBtnText}>Add Service</Text>
                        </TouchableOpacity>
                    </View>

                    {config.mainServices.map((service, index) => (
                        <View key={service.id} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={styles.cardHeaderLeft}>
                                    <View style={styles.dragHandle}><GripVertical size={16} color={Colors.textMuted} /></View>
                                    <Text style={styles.cardIndex}>Service #{index + 1}</Text>
                                </View>
                                <TouchableOpacity onPress={() => removeService(service.id)}>
                                    <Trash2 size={18} color={Colors.danger} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Title</Text>
                                <TextInput
                                    style={styles.input}
                                    value={service.title}
                                    onChangeText={t => updateService(service.id, { title: t })}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Description</Text>
                                <TextInput
                                    style={[styles.input, { height: 60 }]}
                                    value={service.description}
                                    onChangeText={t => updateService(service.id, { description: t })}
                                    multiline
                                />
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.inputLabel}>Icon Name</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={service.icon}
                                        onChangeText={t => updateService(service.id, { icon: t })}
                                    />
                                </View>
                                <View style={[styles.inputGroup, { flex: 2 }]}>
                                    <Text style={styles.inputLabel}>Image URL</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={service.imageUrl}
                                        onChangeText={t => updateService(service.id, { imageUrl: t })}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Features (one per line)</Text>
                                <TextInput
                                    style={[styles.input, { height: 80 }]}
                                    value={service.features.join('\n')}
                                    onChangeText={t => updateService(service.id, { features: t.split('\n') })}
                                    multiline
                                    placeholder="Feature 1&#10;Feature 2"
                                />
                            </View>
                            <View style={[styles.row, { marginTop: 12 }]}>
                                <TouchableOpacity 
                                    style={[styles.editDetailsBtn, { flex: 1 }]} 
                                    onPress={() => setEditingSlug(service.id)}
                                >
                                    <Layout size={16} color={Colors.primary} />
                                    <Text style={styles.editDetailsText}>Edit Page Details</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.previewBtnSmall, { width: 44 }]} 
                                    onPress={() => router.push(`/(public)/services/${service.id}` as any)}
                                >
                                    <Eye size={16} color={Colors.primary} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>

                {/* WHAT WE DELIVER */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Delivery Types</Text>
                    <View style={styles.card}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Section Title</Text>
                            <TextInput
                                style={styles.input}
                                value={config.whatWeDeliverTitle}
                                onChangeText={t => updateConfig({ whatWeDeliverTitle: t })}
                            />
                        </View>

                        {config.deliveryItems.map((item, idx) => (
                            <View key={item.id} style={styles.nestedCard}>
                                <View style={styles.row}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.inputLabel}>Item Title</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={item.title}
                                            onChangeText={t => {
                                                const newItems = [...config.deliveryItems];
                                                newItems[idx].title = t;
                                                updateConfig({ deliveryItems: newItems });
                                            }}
                                        />
                                    </View>
                                    <View style={{ width: 80, marginLeft: 12 }}>
                                        <Text style={styles.inputLabel}>Icon</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={item.icon}
                                            onChangeText={t => {
                                                const newItems = [...config.deliveryItems];
                                                newItems[idx].icon = t;
                                                updateConfig({ deliveryItems: newItems });
                                            }}
                                        />
                                    </View>
                                </View>
                                <View style={[styles.inputGroup, { marginTop: 12 }]}>
                                    <Text style={styles.inputLabel}>Item Description</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={item.desc}
                                        onChangeText={t => {
                                            const newItems = [...config.deliveryItems];
                                            newItems[idx].desc = t;
                                            updateConfig({ deliveryItems: newItems });
                                        }}
                                    />
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* CALL TO ACTION */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Call to Action</Text>
                    <View style={styles.card}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>CTA Title</Text>
                            <TextInput
                                style={styles.input}
                                value={config.ctaTitle}
                                onChangeText={t => updateConfig({ ctaTitle: t })}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>CTA Description</Text>
                            <TextInput
                                style={styles.input}
                                value={config.ctaDesc}
                                onChangeText={t => updateConfig({ ctaDesc: t })}
                            />
                        </View>
                        <View style={[styles.row, { marginBottom: 12 }]}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.inputLabel}>Button Text</Text>
                                <TextInput
                                    style={styles.input}
                                    value={config.ctaBtnText}
                                    onChangeText={t => updateConfig({ ctaBtnText: t })}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.inputLabel}>Button URL</Text>
                                <TextInput
                                    style={styles.input}
                                    value={config.ctaBtnUrl}
                                    onChangeText={t => updateConfig({ ctaBtnUrl: t })}
                                />
                            </View>
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
                                const d = details[editingSlug] || {
                                    title: '', description: '', longContent: '', heroImageUrl: '',
                                    metaTitle: '', metaDesc: '', benefits: [], features: [], process: []
                                };
                                const updateDetail = (up: Partial<ServicePageDetail>) => {
                                    setDetails(prev => ({
                                        ...prev,
                                        [editingSlug]: { ...d, ...up }
                                    }));
                                    setHasUnsavedChanges(true);
                                };

                                return (
                                    <View style={{ padding: 20 }}>
                                        <Text style={styles.sectionTitle}>Main Content</Text>
                                        <View style={styles.card}>
                                            <View style={styles.inputGroup}>
                                                <Text style={styles.inputLabel}>Hero Title</Text>
                                                <TextInput style={styles.input} value={d.title} onChangeText={t => updateDetail({ title: t })} />
                                            </View>
                                            <View style={styles.inputGroup}>
                                                <Text style={styles.inputLabel}>Hero Image URL</Text>
                                                <TextInput style={styles.input} value={d.heroImageUrl} onChangeText={t => updateDetail({ heroImageUrl: t })} />
                                            </View>
                                            <View style={styles.inputGroup}>
                                                <Text style={styles.inputLabel}>Short Description</Text>
                                                <TextInput style={[styles.input, { height: 60 }]} multiline value={d.description} onChangeText={t => updateDetail({ description: t })} />
                                            </View>
                                            <View style={styles.inputGroup}>
                                                <Text style={styles.inputLabel}>Long Overview Content</Text>
                                                <TextInput style={[styles.input, { height: 120 }]} multiline value={d.longContent} onChangeText={t => updateDetail({ longContent: t })} />
                                            </View>
                                        </View>

                                        <Text style={styles.sectionTitle}>SEO Meta Data</Text>
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

                                        {/* Benefits, Features, Process lists could be added here similarly */}
                                        <Text style={styles.infoText}>Tip: Benefits and Process steps can be expanded in the next CMS update. Currently using defaults for new services.</Text>
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
    previewBtnSmall: {
        width: 44,
        height: 44,
        borderRadius: 10,
        backgroundColor: Colors.primary + '10',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.primary + '20',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    modalClose: {
        width: 40,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.navy,
    },
    modalDone: {
        width: 60,
        alignItems: 'flex-end',
    },
    modalDoneText: {
        color: Colors.primary,
        fontWeight: '800',
    },
    modalBody: {
        flex: 1,
    },
    infoText: {
        fontSize: 13,
        color: Colors.textSecondary,
        textAlign: 'center',
        fontStyle: 'italic',
        marginTop: 10,
    }
});
