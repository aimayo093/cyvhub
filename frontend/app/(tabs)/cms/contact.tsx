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
    Phone,
    Mail,
    MapPin,
    HelpCircle,
    Rocket,
    Clock,
    FileText,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import * as Haptics from 'expo-haptics';
import { ContactPageConfig, initialContactPage, FAQConfig, ContactMethodConfig } from '@/constants/cmsDefaults';
import { useCMS } from '@/context/CMSContext';

export default function ContactCMS() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { contactPage, setContactPage, isLoaded } = useCMS();
    const [config, setConfig] = useState<ContactPageConfig>(initialContactPage);
    const [loading, setLoading] = useState(true);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    useEffect(() => {
        if (isLoaded && contactPage) {
            setConfig(contactPage);
            setLoading(false);
        }
    }, [isLoaded, contactPage]);

    const handleSave = async () => {
        try {
            await setContactPage(config, true); // Sync to backend & global context
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setHasUnsavedChanges(false);
            Alert.alert('Success', 'Contact Us content published globally!');
        } catch (e) {
            Alert.alert('Error', 'Failed to save changes.');
        }
    };

    const updateConfig = (updates: Partial<ContactPageConfig>) => {
        setConfig(prev => ({ ...prev, ...updates }));
        setHasUnsavedChanges(true);
    };

    const addMethod = () => {
        const newMethod: ContactMethodConfig = {
            id: Date.now().toString(),
            label: 'New Method',
            value: 'Value',
            icon: 'Phone',
            subtext: 'Description',
        };
        updateConfig({ contactMethods: [...config.contactMethods, newMethod] });
    };

    const updateMethod = (id: string, updates: Partial<ContactMethodConfig>) => {
        updateConfig({
            contactMethods: config.contactMethods.map(m => m.id === id ? { ...m, ...updates } : m)
        });
    };

    const addFaq = () => {
        const newFaq: FAQConfig = {
            id: Date.now().toString(),
            question: 'New Question?',
            answer: 'Answer goes here...',
        };
        updateConfig({ faqs: [...config.faqs, newFaq] });
    };

    const updateFaq = (id: string, updates: Partial<FAQConfig>) => {
        updateConfig({
            faqs: config.faqs.map(f => f.id === id ? { ...f, ...updates } : f)
        });
    };

    const addDepartment = () => {
        const newDept = {
            id: Date.now().toString(),
            name: 'New Department',
            email: 'dept@cyvhub.com',
            phone: '0800 123 4000',
            icon: 'Rocket',
            desc: 'Description...',
        };
        updateConfig({ departments: [...config.departments, newDept] });
    };

    const updateDepartment = (id: string, updates: any) => {
        updateConfig({
            departments: config.departments.map(d => d.id === id ? { ...d, ...updates } : d)
        });
    };

    const addHub = () => {
        const newHub = {
            id: Date.now().toString(),
            city: 'New City',
            address: '123 Address',
            coverage: 'Coverage Area',
        };
        updateConfig({ hubs: [...config.hubs, newHub] });
    };

    const updateHub = (id: string, updates: any) => {
        updateConfig({
            hubs: config.hubs.map(h => h.id === id ? { ...h, ...updates } : h)
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
                        <Text style={styles.headerTitle}>Contact Editor</Text>
                        <Text style={styles.headerSubtitle}>Manage contact info and FAQs</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={styles.previewBtn}
                            onPress={() => router.push('/(public)/contact')}
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

                {/* CONTACT TEXT */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Contact Layout Text</Text>
                    <View style={styles.card}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Section Tag</Text>
                            <TextInput
                                style={styles.input}
                                value={config.contactTag}
                                onChangeText={t => updateConfig({ contactTag: t })}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Side Title</Text>
                            <TextInput
                                style={styles.input}
                                value={config.contactSideTitle}
                                onChangeText={t => updateConfig({ contactSideTitle: t })}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Form Title</Text>
                            <TextInput
                                style={styles.input}
                                value={config.formTitle}
                                onChangeText={t => updateConfig({ formTitle: t })}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Form Description</Text>
                            <TextInput
                                style={styles.input}
                                value={config.formDesc}
                                onChangeText={t => updateConfig({ formDesc: t })}
                            />
                        </View>
                    </View>
                </View>

                {/* CONTACT METHODS */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Contact Methods</Text>
                        <TouchableOpacity style={styles.addBtn} onPress={addMethod}>
                            <Plus size={16} color="#FFF" />
                            <Text style={styles.addBtnText}>Add Method</Text>
                        </TouchableOpacity>
                    </View>

                    {config.contactMethods.map((method, index) => (
                        <View key={method.id} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={styles.cardHeaderLeft}>
                                    <View style={styles.dragHandle}><GripVertical size={16} color={Colors.textMuted} /></View>
                                    <Text style={styles.cardIndex}>Method #{index + 1}</Text>
                                </View>
                                <TouchableOpacity onPress={() => updateConfig({ contactMethods: config.contactMethods.filter(m => m.id !== method.id) })}>
                                    <Trash2 size={18} color={Colors.danger} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.row}>
                                <View style={{ flex: 1.5 }}>
                                    <Text style={styles.inputLabel}>Label (e.g. Call Us)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={method.label}
                                        onChangeText={t => updateMethod(method.id, { label: t })}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>Icon Name</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={method.icon}
                                        onChangeText={t => updateMethod(method.id, { icon: t })}
                                    />
                                </View>
                            </View>

                            <View style={[styles.inputGroup, { marginTop: 12 }]}>
                                <Text style={styles.inputLabel}>Value (e.g. Phone Number or Email)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={method.value}
                                    onChangeText={t => updateMethod(method.id, { value: t })}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Subtext (e.g. Hours of Operation)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={method.subtext}
                                    onChangeText={t => updateMethod(method.id, { subtext: t })}
                                />
                            </View>
                        </View>
                    ))}
                </View>

                {/* DEPARTMENTS */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Specialised Departments</Text>
                        <TouchableOpacity style={styles.addBtn} onPress={addDepartment}>
                            <Plus size={16} color="#FFF" />
                            <Text style={styles.addBtnText}>Add Dept</Text>
                        </TouchableOpacity>
                    </View>

                    {config.departments.map((dept, index) => (
                        <View key={dept.id} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardIndex}>Dept #{index + 1}</Text>
                                <TouchableOpacity onPress={() => updateConfig({ departments: config.departments.filter(d => d.id !== dept.id) })}>
                                    <Trash2 size={18} color={Colors.danger} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.row}>
                                <View style={{ flex: 1.5 }}>
                                    <Text style={styles.inputLabel}>Name</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={dept.name}
                                        onChangeText={t => updateDepartment(dept.id, { name: t })}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>Icon</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={dept.icon}
                                        onChangeText={t => updateDepartment(dept.id, { icon: t })}
                                    />
                                </View>
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1, marginTop: 12 }]}>
                                    <Text style={styles.inputLabel}>Email</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={dept.email}
                                        onChangeText={t => updateDepartment(dept.id, { email: t })}
                                    />
                                </View>
                                <View style={[styles.inputGroup, { flex: 1, marginTop: 12 }]}>
                                    <Text style={styles.inputLabel}>Phone</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={dept.phone}
                                        onChangeText={t => updateDepartment(dept.id, { phone: t })}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Description</Text>
                                <TextInput
                                    style={styles.input}
                                    value={dept.desc}
                                    onChangeText={t => updateDepartment(dept.id, { desc: t })}
                                    placeholder="Brief description of responsibilities"
                                />
                            </View>
                        </View>
                    ))}
                </View>

                {/* UK HUBS */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Strategic UK Hubs</Text>
                        <TouchableOpacity style={styles.addBtn} onPress={addHub}>
                            <Plus size={16} color="#FFF" />
                            <Text style={styles.addBtnText}>Add Hub</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Section Tag</Text>
                            <TextInput
                                style={styles.input}
                                value={config.hubsTag}
                                onChangeText={t => updateConfig({ hubsTag: t })}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Section Title</Text>
                            <TextInput
                                style={styles.input}
                                value={config.hubsTitle}
                                onChangeText={t => updateConfig({ hubsTitle: t })}
                            />
                        </View>
                    </View>

                    {config.hubs.map((hub, index) => (
                        <View key={hub.id} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardIndex}>Hub #{index + 1}</Text>
                                <TouchableOpacity onPress={() => updateConfig({ hubs: config.hubs.filter(h => h.id !== hub.id) })}>
                                    <Trash2 size={18} color={Colors.danger} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.row}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>City/Location</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={hub.city}
                                        onChangeText={t => updateHub(hub.id, { city: t })}
                                    />
                                </View>
                                <View style={{ flex: 1.5 }}>
                                    <Text style={styles.inputLabel}>Coverage Area</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={hub.coverage}
                                        onChangeText={t => updateHub(hub.id, { coverage: t })}
                                    />
                                </View>
                            </View>

                            <View style={[styles.inputGroup, { marginTop: 12 }]}>
                                <Text style={styles.inputLabel}>Detailed Address</Text>
                                <TextInput
                                    style={styles.input}
                                    value={hub.address}
                                    onChangeText={t => updateHub(hub.id, { address: t })}
                                />
                            </View>
                        </View>
                    ))}
                </View>

                {/* OFFICE & MAP INFO */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Office & Map Configuration</Text>
                    <View style={styles.card}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Main Office Address</Text>
                            <TextInput
                                style={styles.input}
                                value={config.officeAddress}
                                onChangeText={t => updateConfig({ officeAddress: t })}
                            />
                        </View>
                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.inputLabel}>Office Email</Text>
                                <TextInput
                                    style={styles.input}
                                    value={config.officeEmail}
                                    onChangeText={t => updateConfig({ officeEmail: t })}
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.inputLabel}>Office Phone</Text>
                                <TextInput
                                    style={styles.input}
                                    value={config.officePhone}
                                    onChangeText={t => updateConfig({ officePhone: t })}
                                />
                            </View>
                        </View>
                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.inputLabel}>Map Latitude</Text>
                                <TextInput
                                    style={styles.input}
                                    value={config.mapLatitude.toString()}
                                    onChangeText={t => updateConfig({ mapLatitude: parseFloat(t) || 0 })}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.inputLabel}>Map Longitude</Text>
                                <TextInput
                                    style={styles.input}
                                    value={config.mapLongitude.toString()}
                                    onChangeText={t => updateConfig({ mapLongitude: parseFloat(t) || 0 })}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>
                    </View>
                </View>

                {/* FAQS */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
                        <TouchableOpacity style={styles.addBtn} onPress={addFaq}>
                            <Plus size={16} color="#FFF" />
                            <Text style={styles.addBtnText}>Add FAQ</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Section Title</Text>
                            <TextInput
                                style={styles.input}
                                value={config.faqsTitle}
                                onChangeText={t => updateConfig({ faqsTitle: t })}
                            />
                        </View>
                    </View>

                    {config.faqs.map((faq, index) => (
                        <View key={faq.id} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={styles.cardHeaderLeft}>
                                    <Text style={styles.cardIndex}>FAQ #{index + 1}</Text>
                                </View>
                                <TouchableOpacity onPress={() => updateConfig({ faqs: config.faqs.filter(f => f.id !== faq.id) })}>
                                    <Trash2 size={18} color={Colors.danger} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Question</Text>
                                <TextInput
                                    style={styles.input}
                                    value={faq.question}
                                    onChangeText={t => updateFaq(faq.id, { question: t })}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Answer</Text>
                                <TextInput
                                    style={[styles.input, { height: 80 }]}
                                    value={faq.answer}
                                    onChangeText={t => updateFaq(faq.id, { answer: t })}
                                    multiline
                                />
                            </View>
                        </View>
                    ))}
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
