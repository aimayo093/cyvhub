import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    ArrowLeft,
    Save,
    Eye,
    Globe,
    Search,
    Type,
    FileText,
    ImageIcon,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import * as Haptics from 'expo-haptics';

type SEOPageConfig = {
    id: string;
    path: string;
    title: string;
    description: string;
    keywords: string;
    ogImageUrl: string;
    noIndex: boolean;
};

const initialSeoData: SEOPageConfig[] = [
    {
        id: '1',
        path: '/',
        title: 'CYVhub | Smarter B2B Same Day Courier Network',
        description: 'The premier UK B2B logistics network specializing in same day courier services, green fleet options, and dedicated enterprise solutions.',
        keywords: 'same day courier, B2B logistics, UK courier, green fleet, pallet delivery',
        ogImageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e',
        noIndex: false,
    },
    {
        id: '2',
        path: '/services',
        title: 'Our Services | CYVhub',
        description: 'Explore our range of B2B delivery services from rapid Same Day responses to structured contract Logistics.',
        keywords: 'delivery services, same day delivery, sustainable logistics',
        ogImageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d',
        noIndex: false,
    },
    {
        id: '3',
        path: '/about',
        title: 'About Us | CYVhub',
        description: 'Learn about our mission to make B2B logistics transparent, reliable, and sustainable.',
        keywords: 'about cyvhub, logistics company, cyvhub team',
        ogImageUrl: '',
        noIndex: false,
    }
];

export default function SeoCMS() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [pages, setPages] = useState<SEOPageConfig[]>(initialSeoData);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [globalSiteName, setGlobalSiteName] = useState('CYVhub Logistics');

    const handleSave = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setHasUnsavedChanges(false);
        alert('SEO Settings Published!');
    };

    const updatePageMeta = (id: string, key: keyof SEOPageConfig, value: any) => {
        setPages(pages.map(p => p.id === id ? { ...p, [key]: value } : p));
        setHasUnsavedChanges(true);
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft size={20} color={Colors.textInverse} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>SEO & Meta Tags</Text>
                        <Text style={styles.headerSubtitle}>Manage Search Engine Visibility</Text>
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
                {/* Global Settings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Global Default Settings</Text>
                    <View style={styles.card}>
                        <View style={styles.inputGroup}>
                            <View style={styles.inputLabelRow}>
                                <Globe size={14} color={Colors.textSecondary} />
                                <Text style={styles.inputLabel}>Global Site Name (Suffix)</Text>
                            </View>
                            <TextInput
                                style={styles.input}
                                value={globalSiteName}
                                onChangeText={t => { setGlobalSiteName(t); setHasUnsavedChanges(true); }}
                                placeholder="Appended to titles, e.g. - CYVhub"
                            />
                        </View>
                    </View>
                </View>

                {/* Page Specific Settings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Page-Level Metadata</Text>
                    <Text style={styles.sectionDesc}>Configure titles and descriptions for individual routes.</Text>

                    {pages.map((page) => (
                        <View key={page.id} style={styles.pageCard}>
                            <View style={styles.pageHeader}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Search size={18} color={Colors.adminPrimary} />
                                    <Text style={styles.pagePath}>{page.path}</Text>
                                </View>
                            </View>
                            <View style={styles.pageBody}>
                                <View style={styles.inputGroup}>
                                    <View style={styles.inputLabelRow}>
                                        <Type size={14} color={Colors.textSecondary} />
                                        <Text style={styles.inputLabel}>Page Title (Max 60 chars)</Text>
                                        <Text style={[styles.charCount, page.title.length > 60 && { color: Colors.danger }]}>
                                            {page.title.length}/60
                                        </Text>
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        value={page.title}
                                        onChangeText={t => updatePageMeta(page.id, 'title', t)}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <View style={styles.inputLabelRow}>
                                        <FileText size={14} color={Colors.textSecondary} />
                                        <Text style={styles.inputLabel}>Meta Description (Max 160 chars)</Text>
                                        <Text style={[styles.charCount, page.description.length > 160 && { color: Colors.danger }]}>
                                            {page.description.length}/160
                                        </Text>
                                    </View>
                                    <TextInput
                                        style={[styles.input, styles.textArea]}
                                        multiline
                                        value={page.description}
                                        onChangeText={t => updatePageMeta(page.id, 'description', t)}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <View style={styles.inputLabelRow}>
                                        <Type size={14} color={Colors.textSecondary} />
                                        <Text style={styles.inputLabel}>Meta Keywords (Comma separated)</Text>
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        value={page.keywords}
                                        onChangeText={t => updatePageMeta(page.id, 'keywords', t)}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <View style={styles.inputLabelRow}>
                                        <ImageIcon size={14} color={Colors.textSecondary} />
                                        <Text style={styles.inputLabel}>Open Graph Image URL (Social Sharing)</Text>
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        value={page.ogImageUrl}
                                        onChangeText={t => updatePageMeta(page.id, 'ogImageUrl', t)}
                                        placeholder="https://..."
                                    />
                                </View>

                                <View style={styles.switchRow}>
                                    <View>
                                        <Text style={styles.switchLabel}>Hide from Search Engines</Text>
                                        <Text style={styles.switchDesc}>Applies a 'noindex' tag to this page.</Text>
                                    </View>
                                    <Switch
                                        value={page.noIndex}
                                        onValueChange={v => updatePageMeta(page.id, 'noIndex', v)}
                                        trackColor={{ true: Colors.danger }}
                                    />
                                </View>
                            </View>
                        </View>
                    ))}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { backgroundColor: Colors.navy, paddingBottom: 16 },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
    backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    headerTitleContainer: { flex: 1, marginLeft: 8 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.textInverse, marginBottom: 4 },
    headerSubtitle: { fontSize: 13, color: Colors.textMuted },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    saveButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.adminPrimary, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, gap: 6 },
    saveButtonDisabled: { backgroundColor: 'rgba(52, 152, 219, 0.5)' },
    saveButtonText: { color: Colors.textInverse, fontSize: 13, fontWeight: '600' },
    content: { flex: 1 },
    contentPadding: { padding: 20 },
    section: { marginBottom: 32 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 4 },
    sectionDesc: { fontSize: 14, color: Colors.textSecondary, marginBottom: 16 },
    card: { backgroundColor: Colors.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.border },
    pageCard: { backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, marginBottom: 16, overflow: 'hidden' },
    pageHeader: { backgroundColor: Colors.background, padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
    pagePath: { fontSize: 16, fontWeight: '700', color: Colors.text },
    pageBody: { padding: 16 },
    inputGroup: { marginBottom: 16 },
    inputLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    inputLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, flex: 1 },
    charCount: { fontSize: 12, color: Colors.textMuted },
    input: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: Colors.text },
    textArea: { height: 80, textAlignVertical: 'top' },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: Colors.borderLight, marginTop: 8 },
    switchLabel: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 2 },
    switchDesc: { fontSize: 13, color: Colors.textSecondary },
});
