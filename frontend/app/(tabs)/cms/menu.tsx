import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    ArrowLeft,
    Save,
    Plus,
    Trash2,
    GripVertical,
    Link,
    ChevronDown,
    ChevronUp,
    CheckCircle2,
    XCircle,
    Eye,
    EyeOff
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import * as Haptics from 'expo-haptics';
import { MenuItem, MenuConfig, initialMenuConfig } from '@/constants/cmsDefaults';
import { useCMS } from '@/context/CMSContext';

export default function MenuCMS() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { menuConfig, setMenuConfig, isLoaded } = useCMS();
    const [config, setConfig] = useState<MenuConfig>(initialMenuConfig);
    const [loading, setLoading] = useState(true);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (isLoaded && menuConfig) {
            setConfig(menuConfig);
            setLoading(false);
        }
    }, [isLoaded, menuConfig]);

    const handleSave = async () => {
        try {
            await setMenuConfig(config, true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setHasUnsavedChanges(false);
            Alert.alert('✅ Success', 'Navigation menu updated and published!');
        } catch (e) {
            console.error('[MenuCMS] Save Error:', e);
            Alert.alert('❌ Error', 'Failed to save menu changes.');
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const addItem = (parentId?: string) => {
        const newItem: MenuItem = {
            id: Date.now().toString(),
            label: 'New Link',
            url: '/',
            showHeader: true,
            showFooter: true
        };

        if (!parentId) {
            setConfig(prev => ({ ...prev, items: [...prev.items, newItem] }));
        } else {
            setConfig(prev => ({
                ...prev,
                items: prev.items.map(item => {
                    if (item.id === parentId) {
                        return { ...item, children: [...(item.children || []), newItem] };
                    }
                    return item;
                })
            }));
            setExpandedItems(prev => ({ ...prev, [parentId]: true }));
        }
        setHasUnsavedChanges(true);
    };

    const removeItem = (id: string, parentId?: string) => {
        if (!parentId) {
            setConfig(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));
        } else {
            setConfig(prev => ({
                ...prev,
                items: prev.items.map(item => {
                    if (item.id === parentId) {
                        return { ...item, children: (item.children || []).filter(c => c.id !== id) };
                    }
                    return item;
                })
            }));
        }
        setHasUnsavedChanges(true);
    };

    const updateItem = (id: string, updates: Partial<MenuItem>, parentId?: string) => {
        if (!parentId) {
            setConfig(prev => ({
                ...prev,
                items: prev.items.map(i => i.id === id ? { ...i, ...updates } : i)
            }));
        } else {
            setConfig(prev => ({
                ...prev,
                items: prev.items.map(item => {
                    if (item.id === parentId) {
                        return { 
                            ...item, 
                            children: (item.children || []).map(c => c.id === id ? { ...c, ...updates } : c) 
                        };
                    }
                    return item;
                })
            }));
        }
        setHasUnsavedChanges(true);
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={Colors.adminPrimary} />
            </View>
        );
    }

    const renderMenuItem = (item: MenuItem, isChild = false, parentId?: string) => {
        const isExpanded = expandedItems[item.id];
        const hasChildren = item.children && item.children.length > 0;

        return (
            <View key={item.id} style={[styles.menuItemRow, isChild && styles.childItem]}>
                <View style={[styles.itemCard, isChild && styles.childCard]}>
                    <View style={styles.itemHeader}>
                        <View style={styles.itemHeaderLeft}>
                            <GripVertical size={16} color={Colors.textSecondary} style={{ marginRight: 8 }} />
                            <TextInput
                                style={styles.itemLabelInput}
                                value={item.label}
                                onChangeText={t => updateItem(item.id, { label: t }, parentId)}
                                placeholder="Link Label"
                            />
                        </View>
                        <View style={styles.itemHeaderRight}>
                            <TouchableOpacity 
                                style={[styles.visibilityBtn, item.showHeader && styles.visibilityBtnActive]}
                                onPress={() => updateItem(item.id, { showHeader: !item.showHeader }, parentId)}
                            >
                                {item.showHeader ? <Eye size={16} color={Colors.primary} /> : <EyeOff size={16} color={Colors.textSecondary} />}
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.deleteItemBtn}
                                onPress={() => removeItem(item.id, parentId)}
                            >
                                <Trash2 size={16} color={Colors.danger} />
                            </TouchableOpacity>
                            {!isChild && (
                                <TouchableOpacity onPress={() => toggleExpand(item.id)}>
                                    {isExpanded ? <ChevronUp size={20} color={Colors.text} /> : <ChevronDown size={20} color={Colors.text} />}
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    <View style={styles.itemBody}>
                        <View style={styles.urlInputContainer}>
                            <Link size={14} color={Colors.textSecondary} style={{ marginRight: 8 }} />
                            <TextInput
                                style={styles.urlInput}
                                value={item.url}
                                onChangeText={t => updateItem(item.id, { url: t }, parentId)}
                                placeholder="URL (e.g. /services or https://...)"
                                autoCapitalize="none"
                            />
                        </View>
                        
                        <View style={styles.toggleRow}>
                            <TouchableOpacity 
                                style={[styles.footerToggle, item.showHeader && styles.headerToggleActive]}
                                onPress={() => updateItem(item.id, { showHeader: !item.showHeader }, parentId)}
                            >
                                <Text style={[styles.footerToggleText, item.showHeader && styles.headerToggleTextActive]}>
                                    {item.showHeader ? 'Show in Header' : 'Hidden in Header'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.footerToggle, item.showFooter && styles.footerToggleActive]}
                                onPress={() => updateItem(item.id, { showFooter: !item.showFooter }, parentId)}
                            >
                                <Text style={[styles.footerToggleText, item.showFooter && styles.footerToggleTextActive]}>
                                    {item.showFooter ? 'Show in Footer' : 'Hidden in Footer'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.footerToggle, item.newTab && styles.newTabToggleActive]}
                                onPress={() => updateItem(item.id, { newTab: !item.newTab }, parentId)}
                            >
                                <Text style={[styles.footerToggleText, item.newTab && styles.newTabToggleTextActive]}>
                                    Open in New Tab
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {!isChild && (
                            <View style={styles.descInputContainer}>
                                <Text style={styles.descLabel}>Short Description (for Mega-menus)</Text>
                                <TextInput
                                    style={styles.descInput}
                                    value={item.description || ''}
                                    onChangeText={t => updateItem(item.id, { description: t }, parentId)}
                                    placeholder="Brief summary for dropdown..."
                                    multiline
                                    numberOfLines={2}
                                />
                            </View>
                        )}
                    </View>

                    {isExpanded && !isChild && (
                        <View style={styles.childrenContainer}>
                            {(item.children || []).map(child => renderMenuItem(child, true, item.id))}
                            <TouchableOpacity 
                                style={styles.addChildBtn}
                                onPress={() => addItem(item.id)}
                            >
                                <Plus size={16} color={Colors.primary} />
                                <Text style={styles.addChildText}>Add Sub-menu Item</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <ArrowLeft size={20} color="#FFF" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>Menu Editor</Text>
                        <Text style={styles.headerSubtitle}>Manage site navigation</Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.saveBtn, !hasUnsavedChanges && { opacity: 0.6 }]}
                        onPress={handleSave}
                        disabled={!hasUnsavedChanges}
                    >
                        <Save size={18} color="#FFF" />
                        <Text style={styles.saveBtnText}>Save Menu</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
                <View style={styles.infoCard}>
                    <Text style={styles.infoText}>
                        Manage the links that appear in the website header and footer. You can create a 2-level hierarchy for dropdown menus.
                    </Text>
                </View>

                <View style={styles.menuList}>
                    {config.items.map(item => renderMenuItem(item))}
                </View>

                <TouchableOpacity 
                    style={styles.addMainBtn}
                    onPress={() => addItem()}
                >
                    <Plus size={20} color="#FFF" />
                    <Text style={styles.addMainBtnText}>Add Main Menu Item</Text>
                </TouchableOpacity>

                <View style={{ height: 100 }} />
            </ScrollView>

            {hasUnsavedChanges && (
                <View style={styles.unsavedBar}>
                    <Text style={styles.unsavedText}>You have unsaved changes</Text>
                    <TouchableOpacity style={styles.unsavedSaveBtn} onPress={handleSave}>
                        <Text style={styles.unsavedSaveText}>Publish Changes</Text>
                    </TouchableOpacity>
                </View>
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
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.adminPrimary,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
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
    infoCard: {
        backgroundColor: '#E0F2FE',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#BAE6FD',
    },
    infoText: {
        color: '#0369A1',
        fontSize: 14,
        lineHeight: 20,
    },
    menuList: {
        marginBottom: 24,
    },
    menuItemRow: {
        marginBottom: 12,
    },
    childItem: {
        marginLeft: 32,
        marginTop: 8,
    },
    itemCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    childCard: {
        backgroundColor: '#F8FAFC',
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    itemHeaderLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemLabelInput: {
        flex: 1,
        fontSize: 15,
        fontWeight: '700',
        color: Colors.text,
        paddingVertical: 4,
    },
    itemHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    visibilityBtn: {
        padding: 6,
        borderRadius: 6,
        backgroundColor: '#F1F5F9',
    },
    visibilityBtnActive: {
        backgroundColor: Colors.primary + '15',
    },
    deleteItemBtn: {
        padding: 6,
        borderRadius: 6,
        backgroundColor: '#FEE2E2',
    },
    itemBody: {
        marginTop: 8,
    },
    urlInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    urlInput: {
        flex: 1,
        fontSize: 14,
        color: Colors.textSecondary,
    },
    toggleRow: {
        flexDirection: 'row',
        marginTop: 8,
    },
    footerToggle: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginRight: 8,
    },
    footerToggleActive: {
        backgroundColor: Colors.success + '10',
        borderColor: Colors.success + '20',
    },
    footerToggleText: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    footerToggleTextActive: {
        color: Colors.success,
    },
    headerToggleActive: {
        backgroundColor: Colors.primary + '10',
        borderColor: Colors.primary + '20',
    },
    headerToggleTextActive: {
        color: Colors.primary,
    },
    newTabToggleActive: {
        backgroundColor: Colors.adminPrimary + '10',
        borderColor: Colors.adminPrimary + '20',
    },
    newTabToggleTextActive: {
        color: Colors.adminPrimary,
    },
    descInputContainer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    descLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginBottom: 6,
    },
    descInput: {
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        padding: 10,
        fontSize: 13,
        color: Colors.text,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        minHeight: 60,
        textAlignVertical: 'top',
    },
    childrenContainer: {
        marginTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 12,
    },
    addChildBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        padding: 8,
        marginTop: 8,
    },
    addChildText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.primary,
        marginLeft: 6,
    },
    addMainBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.adminPrimary,
        paddingVertical: 14,
        borderRadius: 12,
        shadowColor: Colors.adminPrimary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    addMainBtnText: {
        color: '#FFF',
        fontWeight: '800',
        fontSize: 16,
        marginLeft: 8,
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
