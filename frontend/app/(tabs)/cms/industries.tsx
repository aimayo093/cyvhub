import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    ArrowLeft,
    Save,
    Eye,
    Plus,
    Trash2,
    ChevronDown,
    ChevronUp,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import * as Haptics from 'expo-haptics';
import { IndustryDetail, initialIndustryDetails } from '@/constants/cmsDefaults';
import { useCMS } from '@/context/CMSContext';

export default function IndustriesCMS() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { setIndustryDetails } = useCMS();
    const [industries, setIndustries] = useState<Record<string, IndustryDetail>>(initialIndustryDetails);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const saved = await AsyncStorage.getItem('cms_industryDetails');
                if (saved) {
                    setIndustries({ ...initialIndustryDetails, ...JSON.parse(saved) });
                }
            } catch (e) {
                console.error('Failed to load industry CMS:', e);
            }
        };
        loadData();
    }, []);

    const handleSave = async () => {
        try {
            await AsyncStorage.setItem('cms_industryDetails', JSON.stringify(industries));
            setIndustryDetails(industries); // Broadcast to global context
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setHasUnsavedChanges(false);
            Alert.alert('Success', 'Industry pages published!');
        } catch (e) {
            Alert.alert('Error', 'Failed to save changes.');
        }
    };

    const updateField = (id: string, key: keyof IndustryDetail, value: any) => {
        setIndustries(prev => ({
            ...prev,
            [id]: { ...prev[id], [key]: value }
        }));
        setHasUnsavedChanges(true);
    };

    const updateFeature = (id: string, index: number, value: string) => {
        const updated = [...industries[id].features];
        updated[index] = value;
        updateField(id, 'features', updated);
    };

    const addFeature = (id: string) => {
        updateField(id, 'features', [...industries[id].features, '']);
    };

    const removeFeature = (id: string, index: number) => {
        updateField(id, 'features', industries[id].features.filter((_, i) => i !== index));
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

    const detail = activeId ? industries[activeId] : null;

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => activeId ? setActiveId(null) : router.back()} style={styles.backButton}>
                        <ArrowLeft size={20} color={Colors.textInverse} />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>{activeId ? detail?.title : 'Industries Manager'}</Text>
                        <Text style={styles.headerSubtitle}>{activeId ? 'Edit industry detail page' : 'Manage industry-specific content'}</Text>
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
                {!activeId ? (
                    // INDUSTRY LIST VIEW
                    <View>
                        <Text style={styles.sectionTitle}>Select an Industry to Edit</Text>
                        <Text style={styles.sectionDesc}>Each industry has its own detailed public page with problem/solution, stats, equipment, and case studies.</Text>
                        {Object.entries(industries).map(([key, ind]) => (
                            <TouchableOpacity
                                key={key}
                                style={styles.industryListItem}
                                onPress={() => setActiveId(key)}
                            >
                                <View style={styles.industryListContent}>
                                    <Text style={styles.industryListTitle}>{ind.title}</Text>
                                    <Text style={styles.industryListSubtitle}>{ind.subtitle}</Text>
                                </View>
                                <ChevronDown size={20} color={Colors.textMuted} style={{ transform: [{ rotate: '-90deg' }] }} />
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : detail ? (
                    // INDUSTRY DETAIL EDITOR
                    <View>
                        {/* Hero Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Hero Section</Text>
                            <View style={styles.card}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Page Title</Text>
                                    <TextInput style={styles.input} value={detail.title} onChangeText={t => updateField(activeId, 'title', t)} />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Subtitle</Text>
                                    <TextInput style={styles.input} value={detail.subtitle} onChangeText={t => updateField(activeId, 'subtitle', t)} />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Hero Image URL</Text>
                                    <TextInput style={styles.input} value={detail.heroImageUrl} onChangeText={t => updateField(activeId, 'heroImageUrl', t)} />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Icon Name</Text>
                                    <TextInput style={styles.input} value={detail.icon} onChangeText={t => updateField(activeId, 'icon', t)} placeholder="e.g. Truck, Monitor, Package" />
                                </View>
                            </View>
                        </View>

                        {/* Problem / Solution */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Problem & Solution</Text>
                            <View style={styles.card}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Problem Title</Text>
                                    <TextInput style={styles.input} value={detail.problemTitle} onChangeText={t => updateField(activeId, 'problemTitle', t)} />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Problem Content</Text>
                                    <TextInput style={[styles.input, styles.textArea]} value={detail.problemContent} onChangeText={t => updateField(activeId, 'problemContent', t)} multiline numberOfLines={4} />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Solution Title</Text>
                                    <TextInput style={styles.input} value={detail.solutionTitle} onChangeText={t => updateField(activeId, 'solutionTitle', t)} />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Solution Content</Text>
                                    <TextInput style={[styles.input, styles.textArea]} value={detail.solutionContent} onChangeText={t => updateField(activeId, 'solutionContent', t)} multiline numberOfLines={4} />
                                </View>
                            </View>
                        </View>

                        {/* Features */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeaderRow}>
                                <Text style={styles.sectionTitle}>Key Features</Text>
                                <TouchableOpacity style={styles.addButton} onPress={() => addFeature(activeId)}>
                                    <Plus size={16} color="#FFF" />
                                    <Text style={styles.addButtonText}>Add</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.card}>
                                {detail.features.map((feature, idx) => (
                                    <View key={idx} style={styles.listItemRow}>
                                        <TextInput
                                            style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                            value={feature}
                                            onChangeText={t => updateFeature(activeId, idx, t)}
                                            placeholder="Feature description"
                                        />
                                        <TouchableOpacity onPress={() => removeFeature(activeId, idx)} style={styles.trashBtn}>
                                            <Trash2 size={16} color={Colors.danger} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Stats */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeaderRow}>
                                <Text style={styles.sectionTitle}>Industry Stats</Text>
                                <TouchableOpacity style={styles.addButton} onPress={() => addStat(activeId)}>
                                    <Plus size={16} color="#FFF" />
                                    <Text style={styles.addButtonText}>Add</Text>
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

                        {/* Equipment */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeaderRow}>
                                <Text style={styles.sectionTitle}>Equipment</Text>
                                <TouchableOpacity style={styles.addButton} onPress={() => addEquipment(activeId)}>
                                    <Plus size={16} color="#FFF" />
                                    <Text style={styles.addButtonText}>Add</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.card}>
                                {detail.equipment.map((equip, idx) => (
                                    <View key={idx} style={styles.subCard}>
                                        <View style={styles.subCardHeader}>
                                            <Text style={styles.subCardNum}>Equipment {idx + 1}</Text>
                                            <TouchableOpacity onPress={() => removeEquipment(activeId, idx)} style={styles.trashBtn}>
                                                <Trash2 size={16} color={Colors.danger} />
                                            </TouchableOpacity>
                                        </View>
                                        <TextInput style={styles.input} value={equip.title} onChangeText={t => updateEquipment(activeId, idx, 'title', t)} placeholder="Title" />
                                        <TextInput style={[styles.input, styles.textArea]} value={equip.desc} onChangeText={t => updateEquipment(activeId, idx, 'desc', t)} placeholder="Description" multiline />
                                        <TextInput style={styles.input} value={equip.icon} onChangeText={t => updateEquipment(activeId, idx, 'icon', t)} placeholder="Icon name (e.g. Package)" />
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Process Steps */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeaderRow}>
                                <Text style={styles.sectionTitle}>Process Steps</Text>
                                <TouchableOpacity style={styles.addButton} onPress={() => addStep(activeId)}>
                                    <Plus size={16} color="#FFF" />
                                    <Text style={styles.addButtonText}>Add</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.card}>
                                {detail.processSteps.map((step, idx) => (
                                    <View key={idx} style={styles.subCard}>
                                        <View style={styles.subCardHeader}>
                                            <Text style={styles.subCardNum}>Step {idx + 1}</Text>
                                            <TouchableOpacity onPress={() => removeStep(activeId, idx)} style={styles.trashBtn}>
                                                <Trash2 size={16} color={Colors.danger} />
                                            </TouchableOpacity>
                                        </View>
                                        <TextInput style={styles.input} value={step.title} onChangeText={t => updateStep(activeId, idx, 'title', t)} placeholder="Step title" />
                                        <TextInput style={[styles.input, styles.textArea]} value={step.desc} onChangeText={t => updateStep(activeId, idx, 'desc', t)} placeholder="Step description" multiline />
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Case Study */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Case Study</Text>
                            <View style={styles.card}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Case Study Title</Text>
                                    <TextInput style={styles.input} value={detail.caseStudyTitle} onChangeText={t => updateField(activeId, 'caseStudyTitle', t)} />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Quote</Text>
                                    <TextInput style={[styles.input, styles.textArea]} value={detail.caseStudyQuote} onChangeText={t => updateField(activeId, 'caseStudyQuote', t)} multiline numberOfLines={3} />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Author</Text>
                                    <TextInput style={styles.input} value={detail.caseStudyAuthor} onChangeText={t => updateField(activeId, 'caseStudyAuthor', t)} />
                                </View>
                            </View>
                        </View>

                        <View style={{ height: 40 }} />
                    </View>
                ) : null}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
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
        backgroundColor: Colors.navyLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.textInverse,
    },
    headerSubtitle: {
        fontSize: 13,
        color: Colors.textMuted,
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
    section: { marginBottom: 24 },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text,
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
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    inputGroup: { marginBottom: 16 },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginBottom: 6,
    },
    input: {
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: Colors.text,
        marginBottom: 12,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.adminPrimary,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
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
        marginBottom: 12,
    },
    trashBtn: {
        padding: 8,
        backgroundColor: Colors.dangerLight,
        borderRadius: 8,
    },
    subCard: {
        backgroundColor: Colors.background,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        marginBottom: 12,
    },
    subCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    subCardNum: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textSecondary,
    },
    industryListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    industryListContent: { flex: 1 },
    industryListTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 4,
    },
    industryListSubtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
});
