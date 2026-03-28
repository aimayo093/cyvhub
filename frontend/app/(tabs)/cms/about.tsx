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
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    ArrowLeft,
    Save,
    Eye,
    Plus,
    Trash2,
    GripVertical,
    ImageIcon,
    Type,
    Target,
    Heart,
    Info,
    Package,
    Clock,
    Users,
    ShieldCheck,
    Calendar,
    Leaf,
    FileText,
    Map,
    TrendingUp,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import * as Haptics from 'expo-haptics';
import { AboutPageConfig, initialAboutPage, WhyCardConfig } from '@/constants/cmsDefaults';
import { useCMS } from '@/context/CMSContext';

export default function AboutCMS() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { setAboutPage } = useCMS();
    const [config, setConfig] = useState<AboutPageConfig>(initialAboutPage);
    const [loading, setLoading] = useState(true);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const saved = await AsyncStorage.getItem('cms_aboutPageConfig');
            if (saved) {
                setConfig(JSON.parse(saved));
            }
        } catch (e) {
            console.error('Failed to load about CMS:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            await setAboutPage(config, true); // Sync to backend & global context
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setHasUnsavedChanges(false);
            Alert.alert('Success', 'About Us content published globally!');
        } catch (e) {
            Alert.alert('Error', 'Failed to save changes.');
        }
    };

    const updateConfig = (updates: Partial<AboutPageConfig>) => {
        setConfig(prev => ({ ...prev, ...updates }));
        setHasUnsavedChanges(true);
    };

    const addValue = () => {
        const newValue: WhyCardConfig = {
            id: Date.now().toString(),
            title: 'New Value',
            desc: 'Description of the value.',
            icon: 'Heart',
        };
        updateConfig({ values: [...config.values, newValue] });
    };

    const removeValue = (id: string) => {
        updateConfig({ values: config.values.filter(v => v.id !== id) });
    };

    const updateValue = (id: string, updates: Partial<WhyCardConfig>) => {
        updateConfig({
            values: config.values.map(v => v.id === id ? { ...v, ...updates } : v)
        });
    };

    const addMilestone = () => {
        const newMilestone = { year: '2024', title: 'New Milestone', desc: 'Description...' };
        updateConfig({ milestones: [...config.milestones, newMilestone] });
    };

    const removeMilestone = (index: number) => {
        const newMilestones = [...config.milestones];
        newMilestones.splice(index, 1);
        updateConfig({ milestones: newMilestones });
    };

    const updateMilestone = (index: number, updates: any) => {
        const newMilestones = [...config.milestones];
        newMilestones[index] = { ...newMilestones[index], ...updates };
        updateConfig({ milestones: newMilestones });
    };

    const addSustainabilityItem = () => {
        const newItem: WhyCardConfig = {
            id: Date.now().toString(),
            title: 'New Initiative',
            desc: 'Description...',
            icon: 'Leaf',
        };
        updateConfig({ sustainabilityItems: [...config.sustainabilityItems, newItem] });
    };

    const removeSustainabilityItem = (id: string) => {
        updateConfig({ sustainabilityItems: config.sustainabilityItems.filter(i => i.id !== id) });
    };

    const updateSustainabilityItem = (id: string, updates: Partial<WhyCardConfig>) => {
        updateConfig({
            sustainabilityItems: config.sustainabilityItems.map(i => i.id === id ? { ...i, ...updates } : i)
        });
    };

    const updateStat = (index: number, updates: any) => {
        const newStats = [...config.stats];
        newStats[index] = { ...newStats[index], ...updates };
        updateConfig({ stats: newStats });
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
                        <Text style={styles.headerTitle}>About Us Editor</Text>
                        <Text style={styles.headerSubtitle}>Manage company story and values</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={styles.previewBtn}
                            onPress={() => router.push('/(public)/about')}
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

                {/* OUR STORY */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Our Story</Text>
                    <View style={styles.card}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Section Tag</Text>
                            <TextInput
                                style={styles.input}
                                value={config.storyTag}
                                onChangeText={t => updateConfig({ storyTag: t })}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Story Title</Text>
                            <TextInput
                                style={styles.input}
                                value={config.storyTitle}
                                onChangeText={t => updateConfig({ storyTitle: t })}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Story Content</Text>
                            <TextInput
                                style={[styles.input, { height: 120 }]}
                                value={config.storyContent}
                                onChangeText={t => updateConfig({ storyContent: t })}
                                multiline
                            />
                        </View>
                    </View>
                </View>

                {/* OUR MISSION */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Our Mission</Text>
                    <View style={styles.card}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Mission Title</Text>
                            <TextInput
                                style={styles.input}
                                value={config.missionTitle}
                                onChangeText={t => updateConfig({ missionTitle: t })}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Mission Content</Text>
                            <TextInput
                                style={[styles.input, { height: 80 }]}
                                value={config.missionContent}
                                onChangeText={t => updateConfig({ missionContent: t })}
                                multiline
                            />
                        </View>
                    </View>
                </View>

                {/* OUR VALUES */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Core Values</Text>
                        <TouchableOpacity style={styles.addBtn} onPress={addValue}>
                            <Plus size={16} color="#FFF" />
                            <Text style={styles.addBtnText}>Add Value</Text>
                        </TouchableOpacity>
                    </View>


                    <View style={styles.card}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Section Title</Text>
                            <TextInput
                                style={styles.input}
                                value={config.valuesTitle}
                                onChangeText={t => updateConfig({ valuesTitle: t })}
                            />
                        </View>
                    </View>

                    {config.values.map((value, index) => (
                        <View key={value.id} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={styles.cardHeaderLeft}>
                                    <View style={styles.dragHandle}><GripVertical size={16} color={Colors.textMuted} /></View>
                                    <Text style={styles.cardIndex}>Value #{index + 1}</Text>
                                </View>
                                <TouchableOpacity onPress={() => removeValue(value.id)}>
                                    <Trash2 size={18} color={Colors.danger} />
                                </TouchableOpacity>
                            </View>

                            <View style={[styles.row, { marginBottom: 12 }]}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>Title</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={value.title}
                                        onChangeText={t => updateValue(value.id, { title: t })}
                                    />
                                </View>
                                <View style={{ width: 80 }}>
                                    <Text style={styles.inputLabel}>Icon</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={value.icon}
                                        onChangeText={t => updateValue(value.id, { icon: t })}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Description</Text>
                                <TextInput
                                    style={[styles.input, { height: 60 }]}
                                    value={value.desc}
                                    onChangeText={t => updateValue(value.id, { desc: t })}
                                    multiline
                                />
                            </View>
                        </View>
                    ))}
                </View>

                {/* TRUST STATISTICS */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Trust Statistics</Text>
                    <View style={styles.card}>
                        {config.stats.map((stat, idx) => (
                            <View key={idx} style={[styles.nestedCard, { marginBottom: 12 }]}>
                                <View style={styles.row}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.inputLabel}>Value (e.g. 2M+)</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={stat.value}
                                            onChangeText={t => updateStat(idx, { value: t })}
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.inputLabel}>Label</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={stat.label}
                                            onChangeText={t => updateStat(idx, { label: t })}
                                        />
                                    </View>
                                    <View style={{ width: 80 }}>
                                        <Text style={styles.inputLabel}>Icon</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={stat.icon}
                                            onChangeText={t => updateStat(idx, { icon: t })}
                                        />
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* MILESTONES */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Key Milestones</Text>
                        <TouchableOpacity style={styles.addBtn} onPress={addMilestone}>
                            <Plus size={16} color="#FFF" />
                            <Text style={styles.addBtnText}>Add Milestone</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Section Title</Text>
                            <TextInput
                                style={styles.input}
                                value={config.milestonesTitle}
                                onChangeText={t => updateConfig({ milestonesTitle: t })}
                            />
                        </View>
                    </View>

                    {config.milestones.map((ms, index) => (
                        <View key={index} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardIndex}>Milestone #{index + 1}</Text>
                                <TouchableOpacity onPress={() => removeMilestone(index)}>
                                    <Trash2 size={18} color={Colors.danger} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.row}>
                                <View style={{ width: 100 }}>
                                    <Text style={styles.inputLabel}>Year</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={ms.year}
                                        onChangeText={t => updateMilestone(index, { year: t })}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>Title</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={ms.title}
                                        onChangeText={t => updateMilestone(index, { title: t })}
                                    />
                                </View>
                            </View>

                            <View style={[styles.inputGroup, { marginTop: 12 }]}>
                                <Text style={styles.inputLabel}>Description</Text>
                                <TextInput
                                    style={[styles.input, { height: 60 }]}
                                    value={ms.desc}
                                    onChangeText={t => updateMilestone(index, { desc: t })}
                                    multiline
                                />
                            </View>
                        </View>
                    ))}
                </View>

                {/* SUSTAINABILITY */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Sustainability</Text>
                        <TouchableOpacity style={styles.addBtn} onPress={addSustainabilityItem}>
                            <Plus size={16} color="#FFF" />
                            <Text style={styles.addBtnText}>Add Initiative</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Section Tag</Text>
                            <TextInput
                                style={styles.input}
                                value={config.sustainabilityTag}
                                onChangeText={t => updateConfig({ sustainabilityTag: t })}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Section Title</Text>
                            <TextInput
                                style={styles.input}
                                value={config.sustainabilityTitle}
                                onChangeText={t => updateConfig({ sustainabilityTitle: t })}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Description</Text>
                            <TextInput
                                style={[styles.input, { height: 80 }]}
                                value={config.sustainabilityDesc}
                                onChangeText={t => updateConfig({ sustainabilityDesc: t })}
                                multiline
                            />
                        </View>
                    </View>

                    {config.sustainabilityItems.map((item, index) => (
                        <View key={item.id} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={styles.cardHeaderLeft}>
                                    <View style={styles.dragHandle}><GripVertical size={16} color={Colors.textMuted} /></View>
                                    <Text style={styles.cardIndex}>Initiative #{index + 1}</Text>
                                </View>
                                <TouchableOpacity onPress={() => removeSustainabilityItem(item.id)}>
                                    <Trash2 size={18} color={Colors.danger} />
                                </TouchableOpacity>
                            </View>

                            <View style={[styles.row, { marginBottom: 12 }]}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>Title</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={item.title}
                                        onChangeText={t => updateSustainabilityItem(item.id, { title: t })}
                                    />
                                </View>
                                <View style={{ width: 80 }}>
                                    <Text style={styles.inputLabel}>Icon</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={item.icon}
                                        onChangeText={t => updateSustainabilityItem(item.id, { icon: t })}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Description</Text>
                                <TextInput
                                    style={[styles.input, { height: 60 }]}
                                    value={item.desc}
                                    onChangeText={t => updateSustainabilityItem(item.id, { desc: t })}
                                    multiline
                                />
                            </View>
                        </View>
                    ))}
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
        </View>
    );
}

const styles: any = StyleSheet.create({
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
});
