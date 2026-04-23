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
    Settings,
    FileText,
    Layout,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import * as Haptics from 'expo-haptics';
import { IndustryDetail, initialIndustryDetails, IndustriesPageConfig } from '@/constants/cmsDefaults';
import { useCMS } from '@/context/CMSContext';
import CMSImagePicker from '@/components/CMSImagePicker';

export default function IndustriesCMS() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { 
        industryDetails, 
        isLoaded, 
        batchUpdateAndSync,
        industriesPage
    } = useCMS();
    
    const [industries, setIndustries] = useState<Record<string, IndustryDetail>>(initialIndustryDetails);
    const [pageConfig, setPageConfig] = useState<IndustriesPageConfig | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isEditingLanding, setIsEditingLanding] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isLoaded) {
            if (industryDetails) setIndustries(prev => ({ ...prev, ...industryDetails }));
            if (industriesPage) setPageConfig(industriesPage);
            setLoading(false);
        }
    }, [isLoaded, industryDetails, industriesPage]);

    const handleSave = async () => {
        try {
            const updates: any = { industryDetails: industries };
            if (pageConfig) updates.industriesPage = pageConfig;
            
            await batchUpdateAndSync(updates, true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setHasUnsavedChanges(false);
            Alert.alert('✅ Success', 'Industry content published!');
        } catch (e) {
            console.error('[IndustriesCMS] Save Error:', e);
            Alert.alert('❌ Error', 'Failed to save changes.');
        }
    };

    const updateField = (id: string, key: keyof IndustryDetail, value: any) => {
        setIndustries(prev => ({
            ...prev,
            [id]: { ...prev[id], [key]: value }
        }));
        setHasUnsavedChanges(true);
    };

    const updatePageField = (key: keyof IndustriesPageConfig, value: any) => {
        if (!pageConfig) return;
        setPageConfig(prev => prev ? ({ ...prev, [key]: value }) : null);
        setHasUnsavedChanges(true);
    };

    // Generic Array Update Helpers
    const updateArrayItem = (id: string, field: 'whyChooseUs' | 'typicalServices' | 'features', index: number, value: string) => {
        const currentField = industries[id][field] || [];
        const updated = [...currentField];
        updated[index] = value;
        updateField(id, field, updated);
    };

    const addArrayItem = (id: string, field: 'whyChooseUs' | 'typicalServices' | 'features') => {
        const currentField = industries[id][field] || [];
        const updated = [...currentField, ''];
        updateField(id, field, updated);
    };

    const removeArrayItem = (id: string, field: 'whyChooseUs' | 'typicalServices' | 'features', index: number) => {
        const currentField = industries[id][field] || [];
        updateField(id, field, currentField.filter((_, i) => i !== index));
    };

    const updateStat = (id: string, index: number, key: 'label' | 'value', val: string) => {
        const updated = [...industries[id].stats];
        updated[index] = { ...updated[index], [key]: val };
        updateField(id, 'stats', updated);
    };

    const addStat = (id: string) => {
        updateField(id, 'stats', [...industries[id].stats, { label: '', value: '' }]);
    };

    const removeStat = (id: string, index: number) => {
        updateField(id, 'stats', industries[id].stats.filter((_, i) => i !== index));
    };

    const updateEquipment = (id: string, index: number, key: 'title' | 'desc' | 'icon', val: string) => {
        const updated = [...industries[id].equipment];
        updated[index] = { ...updated[index], [key]: val };
        updateField(id, 'equipment', updated);
    };

    const addEquipment = (id: string) => {
        updateField(id, 'equipment', [...industries[id].equipment, { title: '', desc: '', icon: 'Package' }]);
    };

    const removeEquipment = (id: string, index: number) => {
        updateField(id, 'equipment', industries[id].equipment.filter((_, i) => i !== index));
    };

    const updateStep = (id: string, index: number, key: 'title' | 'desc', val: string) => {
        const updated = [...industries[id].processSteps];
        updated[index] = { ...updated[index], [key]: val };
        updateField(id, 'processSteps', updated);
    };

    const addStep = (id: string) => {
        updateField(id, 'processSteps', [...industries[id].processSteps, { title: '', desc: '' }]);
    };

    const removeStep = (id: string, index: number) => {
        updateField(id, 'processSteps', industries[id].processSteps.filter((_, i) => i !== index));
    };

    // --- Antigravity Helpers ---
    const updateChallenge = (id: string, index: number, key: 'icon' | 'title' | 'desc', val: string) => {
        const updated = [...(industries[id].challenges || [])];
        updated[index] = { ...updated[index], [key]: val };
        updateField(id, 'challenges', updated);
    };

    const addChallenge = (id: string) => {
        updateField(id, 'challenges', [...(industries[id].challenges || []), { icon: 'AlertTriangle', title: '', desc: '' }]);
    };

    const removeChallenge = (id: string, index: number) => {
        updateField(id, 'challenges', (industries[id].challenges || []).filter((_, i) => i !== index));
    };

    const updateFeature = (id: string, index: number, key: 'title' | 'desc' | 'icon' | 'imageUrl', val: string) => {
        const updated = [...(industries[id].features || [])];
        updated[index] = { ...updated[index], [key]: val };
        updateField(id, 'features', updated);
    };

    const addFeature = (id: string) => {
        updateField(id, 'features', [...(industries[id].features || []), { title: '', desc: '', icon: 'Zap', imageUrl: '' }]);
    };

    const removeFeature = (id: string, index: number) => {
        updateField(id, 'features', (industries[id].features || []).filter((_, i) => i !== index));
    };

    const updateUseCase = (id: string, index: number, key: 'title' | 'desc' | 'badge', val: string) => {
        const updated = [...(industries[id].useCases || [])];
        updated[index] = { ...updated[index], [key]: val };
        updateField(id, 'useCases', updated);
    };

    const addUseCase = (id: string) => {
        updateField(id, 'useCases', [...(industries[id].useCases || []), { title: '', desc: '', badge: 'NEW' }]);
    };

    const removeUseCase = (id: string, index: number) => {
        updateField(id, 'useCases', (industries[id].useCases || []).filter((_, i) => i !== index));
    };

    const updateTestimonial = (id: string, key: 'quote' | 'author' | 'role' | 'company', val: string) => {
        const updated = { ...(industries[id].testimonial || { quote: '', author: '', role: '', company: '' }), [key]: val };
        updateField(id, 'testimonial', updated);
    };

    const detail = activeId ? industries[activeId] : null;

    return (
        <View style={styles.container}>
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
                            {activeId ? detail?.title : isEditingLanding ? 'Landing Page Editor' : 'Industries Manager'}
                        </Text>
                        <Text style={styles.headerSubtitle}>
                            {activeId ? 'Edit industry detail page' : isEditingLanding ? 'General landing page settings' : 'Manage industry-specific content'}
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

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={Colors.adminPrimary} />
                </View>
            ) : (
                <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>
                {!activeId && !isEditingLanding ? (
                    // DASHBOARD VIEW
                    <View>
                        <TouchableOpacity 
                            style={[styles.industryListItem, { backgroundColor: Colors.navyLight, borderColor: Colors.primary }]}
                            onPress={() => setIsEditingLanding(true)}
                        >
                            <View style={styles.industryListIcon}>
                                <Layout size={20} color={Colors.primary} />
                            </View>
                            <View style={styles.industryListContent}>
                                <Text style={[styles.industryListTitle, { color: '#FFF' }]}>Main Landing Page</Text>
                                <Text style={[styles.industryListSubtitle, { color: 'rgba(255,255,255,0.6)' }]}>Hero title, intro text, and metadata...</Text>
                            </View>
                            <ChevronDown size={20} color={Colors.textMuted} style={{ transform: [{ rotate: '-90deg' }] }} />
                        </TouchableOpacity>

                        <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 16 }]}>Sector-Specific Pages</Text>
                        
                        {Object.entries(industries)
                            .sort(([, a], [, b]) => (a.order || 0) - (b.order || 0))
                            .map(([key, ind]) => (
                            <TouchableOpacity
                                key={key}
                                style={styles.industryListItem}
                                onPress={() => setActiveId(key)}
                            >
                                <View style={styles.industryListIcon}>
                                    {ind.publishStatus ? (
                                        <CheckCircle size={20} color={Colors.success} />
                                    ) : (
                                        <XCircle size={20} color={Colors.textMuted} />
                                    )}
                                </View>
                                <View style={styles.industryListContent}>
                                    <View style={styles.industryListHeader}>
                                        <Text style={styles.industryListTitle}>{ind.title}</Text>
                                        <Text style={[styles.statusBadge, ind.publishStatus ? styles.statusPublished : styles.statusDraft]}>
                                            {ind.publishStatus ? 'Published' : 'Draft'}
                                        </Text>
                                    </View>
                                    <Text style={styles.industryListSubtitle} numberOfLines={1}>{ind.subtitle || ind.description}</Text>
                                </View>
                                <ChevronDown size={20} color={Colors.textMuted} style={{ transform: [{ rotate: '-90deg' }] }} />
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : isEditingLanding && pageConfig ? (
                    // LANDING PAGE EDITOR
                    <View>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Hero Content</Text>
                            <View style={styles.card}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Page Title (H1 Tag)</Text>
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
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Intro Content</Text>
                            <View style={styles.card}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Intro Heading</Text>
                                    <TextInput style={styles.input} value={pageConfig.cardIntroHeading} onChangeText={t => updatePageField('cardIntroHeading', t)} />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Intro Main Text</Text>
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
                                    <Text style={styles.inputLabel}>CTA Supporting Text</Text>
                                    <TextInput style={[styles.input, styles.textArea]} value={pageConfig.ctaText} onChangeText={t => updatePageField('ctaText', t)} multiline />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>CTA Button Label</Text>
                                    <TextInput style={styles.input} value={pageConfig.ctaButton} onChangeText={t => updatePageField('ctaButton', t)} />
                                </View>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Search Engine Optmization</Text>
                            <View style={styles.card}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Meta Title</Text>
                                    <TextInput style={styles.input} value={pageConfig.metaTitle} onChangeText={t => updatePageField('metaTitle', t)} />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Meta Description</Text>
                                    <TextInput style={[styles.input, styles.textArea]} value={pageConfig.metaDesc} onChangeText={t => updatePageField('metaDesc', t)} multiline />
                                </View>
                            </View>
                        </View>
                        <View style={{ height: 100 }} />
                    </View>
                ) : detail && activeId ? (
                    // INDUSTRY DETAIL EDITOR
                    <View>
                        {/* Publishing */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeaderRow}>
                                <Text style={styles.sectionTitle}>Publish Settings</Text>
                                <TouchableOpacity 
                                    style={[styles.statusToggle, detail.publishStatus ? styles.statusToggleActive : styles.statusToggleInactive]} 
                                    onPress={() => updateField(activeId, 'publishStatus', !detail.publishStatus)}
                                >
                                    <Text style={styles.statusToggleText}>{detail.publishStatus ? 'Published' : 'Draft'}</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.card}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Display Order (Numeric)</Text>
                                    <TextInput style={styles.input} value={String(detail.order || 0)} onChangeText={t => updateField(activeId, 'order', parseInt(t) || 0)} keyboardType="numeric" />
                                </View>
                            </View>
                        </View>

                        {/* Design & Layout */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Design & Layout</Text>
                            <View style={styles.card}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Page Content Alignment</Text>
                                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
                                        <TouchableOpacity 
                                            style={[styles.statusToggle, detail.layoutTheme !== 'center' ? styles.statusToggleActive : styles.statusToggleInactive, { flex: 1, paddingVertical: 10 }]} 
                                            onPress={() => updateField(activeId, 'layoutTheme', 'left')}
                                        >
                                            <Layout size={16} color={detail.layoutTheme !== 'center' ? '#fff' : Colors.textMuted} style={{ marginRight: 6 }} />
                                            <Text style={styles.statusToggleText}>Left Aligned (Classic)</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            style={[styles.statusToggle, detail.layoutTheme === 'center' ? styles.statusToggleActive : styles.statusToggleInactive, { flex: 1, paddingVertical: 10 }]} 
                                            onPress={() => updateField(activeId, 'layoutTheme', 'center')}
                                        >
                                            <Layout size={16} color={detail.layoutTheme === 'center' ? '#fff' : Colors.textMuted} style={{ marginRight: 6 }} />
                                            <Text style={styles.statusToggleText}>Center Aligned (Modern)</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Basic Info */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Page Content</Text>
                            <View style={styles.card}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Industry Name</Text>
                                    <TextInput style={styles.input} value={detail.title} onChangeText={t => updateField(activeId, 'title', t)} />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>URL Slug</Text>
                                    <TextInput style={styles.input} value={detail.slug} onChangeText={t => updateField(activeId, 'slug', t)} placeholder="e.g. medical-healthcare" />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Hero Tagline</Text>
                                    <TextInput style={styles.input} value={detail.subtitle} onChangeText={t => updateField(activeId, 'subtitle', t)} />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Short Description (Cards/Dropdown)</Text>
                                    <TextInput style={[styles.input, styles.textArea, { minHeight: 60 }]} value={detail.description} onChangeText={t => updateField(activeId, 'description', t)} multiline />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Full Overview Text</Text>
                                    <TextInput style={[styles.input, styles.textArea]} value={detail.overview} onChangeText={t => updateField(activeId, 'overview', t)} multiline />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Hero Image</Text>
                                    <CMSImagePicker
                                        value={detail.heroImageUrl}
                                        onSelect={(url: string) => updateField(activeId, 'heroImageUrl', url)}
                                        label="Industry Hero Image"
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Icon (Lucide name)</Text>
                                    <TextInput style={styles.input} value={detail.icon} onChangeText={t => updateField(activeId, 'icon', t)} />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Accent Color (Hex)</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                        <TextInput style={[styles.input, { flex: 1 }]} value={detail.accentColor} onChangeText={t => updateField(activeId, 'accentColor', t)} placeholder="#000000" />
                                        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: detail.accentColor || '#000' }} />
                                    </View>
                                    <View style={styles.colorPresets}>
                                        {['#DC2626', '#EA580C', '#2563EB', '#0D9488', '#1D4ED8', '#16A34A', '#CA8A04', '#7C3AED'].map(c => (
                                            <TouchableOpacity key={c} style={[styles.colorPreset, { backgroundColor: c }]} onPress={() => updateField(activeId, 'accentColor', c)} />
                                        ))}
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Antigravity Challenges */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeaderRow}>
                                <Text style={styles.sectionTitle}>Antigravity Challenges</Text>
                                <TouchableOpacity style={styles.addButton} onPress={() => addChallenge(activeId)}>
                                    <Plus size={16} color="#FFF" />
                                    <Text style={styles.addButtonText}>Add Challenge</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.card}>
                                {(detail.challenges || []).map((c, idx) => (
                                    <View key={idx} style={[styles.card, { padding: 16, marginBottom: 12, borderStyle: 'dashed' }]}>
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>Icon (Lucide)</Text>
                                            <TextInput style={styles.input} value={c.icon} onChangeText={t => updateChallenge(activeId, idx, 'icon', t)} />
                                        </View>
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>Title</Text>
                                            <TextInput style={styles.input} value={c.title} onChangeText={t => updateChallenge(activeId, idx, 'title', t)} />
                                        </View>
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>Description</Text>
                                            <TextInput style={[styles.input, styles.textArea]} value={c.desc} onChangeText={t => updateChallenge(activeId, idx, 'desc', t)} multiline />
                                        </View>
                                        <TouchableOpacity onPress={() => removeChallenge(activeId, idx)} style={[styles.trashBtn, { alignSelf: 'flex-end' }]}>
                                            <Trash2 size={16} color={Colors.danger} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Antigravity Features */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeaderRow}>
                                <Text style={styles.sectionTitle}>Antigravity Solution Features</Text>
                                <TouchableOpacity style={styles.addButton} onPress={() => addFeature(activeId)}>
                                    <Plus size={16} color="#FFF" />
                                    <Text style={styles.addButtonText}>Add Feature</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.card}>
                                {(detail.features || []).map((f, idx) => (
                                    <View key={idx} style={[styles.card, { padding: 16, marginBottom: 12, borderStyle: 'dashed' }]}>
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>Icon (Lucide)</Text>
                                            <TextInput style={styles.input} value={f.icon} onChangeText={t => updateFeature(activeId, idx, 'icon', t)} />
                                        </View>
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>Title</Text>
                                            <TextInput style={styles.input} value={f.title} onChangeText={t => updateFeature(activeId, idx, 'title', t)} />
                                        </View>
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>Description</Text>
                                            <TextInput style={[styles.input, styles.textArea]} value={f.desc} onChangeText={t => updateFeature(activeId, idx, 'desc', t)} multiline />
                                        </View>
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>Image URL</Text>
                                            <CMSImagePicker
                                                value={f.imageUrl}
                                                onSelect={(url: string) => updateFeature(activeId, idx, 'imageUrl', url)}
                                                label="Feature Image"
                                            />
                                        </View>
                                        <TouchableOpacity onPress={() => removeFeature(activeId, idx)} style={[styles.trashBtn, { alignSelf: 'flex-end' }]}>
                                            <Trash2 size={16} color={Colors.danger} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Antigravity Use Cases */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeaderRow}>
                                <Text style={styles.sectionTitle}>Antigravity Use Cases</Text>
                                <TouchableOpacity style={styles.addButton} onPress={() => addUseCase(activeId)}>
                                    <Plus size={16} color="#FFF" />
                                    <Text style={styles.addButtonText}>Add Use Case</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.card}>
                                {(detail.useCases || []).map((uc, idx) => (
                                    <View key={idx} style={[styles.card, { padding: 16, marginBottom: 12, borderStyle: 'dashed' }]}>
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>Badge</Text>
                                            <TextInput style={styles.input} value={uc.badge} onChangeText={t => updateUseCase(activeId, idx, 'badge', t)} />
                                        </View>
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>Title</Text>
                                            <TextInput style={styles.input} value={uc.title} onChangeText={t => updateUseCase(activeId, idx, 'title', t)} />
                                        </View>
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>Description</Text>
                                            <TextInput style={[styles.input, styles.textArea]} value={uc.desc} onChangeText={t => updateUseCase(activeId, idx, 'desc', t)} multiline />
                                        </View>
                                        <TouchableOpacity onPress={() => removeUseCase(activeId, idx)} style={[styles.trashBtn, { alignSelf: 'flex-end' }]}>
                                            <Trash2 size={16} color={Colors.danger} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Antigravity Testimonial */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Antigravity Testimonial</Text>
                            <View style={styles.card}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Quote</Text>
                                    <TextInput style={[styles.input, styles.textArea]} value={detail.testimonial?.quote || detail.caseStudyQuote || ''} onChangeText={t => updateTestimonial(activeId, 'quote', t)} multiline />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Author</Text>
                                    <TextInput style={styles.input} value={detail.testimonial?.author || detail.caseStudyAuthor || ''} onChangeText={t => updateTestimonial(activeId, 'author', t)} />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Role</Text>
                                    <TextInput style={styles.input} value={detail.testimonial?.role || 'Operations Lead'} onChangeText={t => updateTestimonial(activeId, 'role', t)} />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Company</Text>
                                    <TextInput style={styles.input} value={detail.testimonial?.company || detail.caseStudyTitle || ''} onChangeText={t => updateTestimonial(activeId, 'company', t)} />
                                </View>
                            </View>
                        </View>

                        {/* Challenges & Solutions */}
                        {/* Sector Performance Stats */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeaderRow}>
                                <Text style={styles.sectionTitle}>Sector Performance Stats</Text>
                                <TouchableOpacity style={styles.addButton} onPress={() => addStat(activeId)}>
                                    <Plus size={16} color="#FFF" />
                                    <Text style={styles.addButtonText}>Add Stats</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.card}>
                                {detail.stats.map((stat, idx) => (
                                    <View key={idx} style={styles.listItemRow}>
                                        <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} value={stat.label} onChangeText={t => updateStat(activeId, idx, 'label', t)} placeholder="Label" />
                                        <TextInput style={[styles.input, { flex: 0.5, marginBottom: 0 }]} value={stat.value} onChangeText={t => updateStat(activeId, idx, 'value', t)} placeholder="Value" />
                                        <TouchableOpacity onPress={() => removeStat(activeId, idx)} style={styles.trashBtn}>
                                            <Trash2 size={16} color={Colors.danger} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* SEO Settings */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Search Engine Optimization (SEO)</Text>
                            <View style={styles.card}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Meta Title</Text>
                                    <TextInput style={styles.input} value={detail.metaTitle} onChangeText={t => updateField(activeId, 'metaTitle', t)} placeholder="SEO Title..." />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Meta Description</Text>
                                    <TextInput style={[styles.input, styles.textArea]} value={detail.metaDesc} onChangeText={t => updateField(activeId, 'metaDesc', t)} multiline placeholder="SEO Description..." />
                                </View>
                            </View>
                        </View>

                        {/* CTA Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Page Closing CTA</Text>
                            <View style={styles.card}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>CTA Heading</Text>
                                    <TextInput style={styles.input} value={detail.ctaHeading} onChangeText={t => updateField(activeId, 'ctaHeading', t)} />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>CTA Text</Text>
                                    <TextInput style={[styles.input, styles.textArea]} value={detail.ctaText} onChangeText={t => updateField(activeId, 'ctaText', t)} multiline />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>CTA Button Text</Text>
                                    <TextInput style={styles.input} value={detail.ctaButtonText} onChangeText={t => updateField(activeId, 'ctaButtonText', t)} />
                                </View>
                            </View>
                        </View>

                        <View style={{ height: 100 }} />
                    </View>
                ) : null}
            </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background || '#F8FAFC' },
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
        marginLeft: 'auto',
        flexDirection: 'row',
        gap: 12,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.success,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
    },
    saveButtonDisabled: {
        opacity: 0.5,
    },
    saveButtonText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 14,
    },
    content: { flex: 1 },
    contentPadding: { padding: 20 },
    section: { marginBottom: 32 },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: Colors.navy,
        marginBottom: 8,
    },
    sectionDesc: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 20,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    inputGroup: { marginBottom: 20 },
    inputLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: Colors.textSecondary,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: Colors.navy,
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.navy,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
    },
    addButtonText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 13,
    },
    listItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    trashBtn: {
        padding: 10,
        backgroundColor: '#FEE2E2',
        borderRadius: 10,
    },
    industryListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
        elevation: 1,
    },
    industryListContent: { flex: 1 },
    industryListTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: Colors.navy,
        marginBottom: 4,
    },
    industryListSubtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    industryListIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    industryListHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    statusBadge: {
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        overflow: 'hidden',
    },
    statusPublished: {
        backgroundColor: '#DCFCE7',
        color: '#166534',
    },
    statusDraft: {
        backgroundColor: '#F1F5F9',
        color: '#64748B',
    },
    statusToggle: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
    },
    statusToggleActive: {
        backgroundColor: Colors.success,
    },
    statusToggleInactive: {
        backgroundColor: '#64748B',
    },
    statusToggleText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '800',
    },
    statusHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    inputHint: {
        fontSize: 11,
        color: Colors.textSecondary,
        marginTop: 4,
        fontStyle: 'italic',
    },
    colorPresets: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12,
    },
    colorPreset: {
        width: 32,
        height: 32,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    }
});
