import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Modal,
    FlatList,
    ActivityIndicator,
    TextInput,
    Platform,
    ScrollView,
} from 'react-native';
import { 
    Upload, 
    X, 
    ImageIcon, 
    Search, 
    Check, 
    Plus, 
    Library,
    Filter
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { apiClient } from '@/services/api';

interface MediaAsset {
    id: string;
    url: string;
    filename: string;
    type: string;
    category?: string;
    altText?: string;
}

interface CMSImagePickerProps {
    value: string;
    onSelect: (url: string) => void;
    label?: string;
    category?: string;
}

export default function CMSImagePicker({ value, onSelect, label, category }: CMSImagePickerProps) {
    const [modalVisible, setModalVisible] = useState(false);
    const [library, setLibrary] = useState<MediaAsset[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<string | null>(category || null);

    const fetchLibrary = async () => {
        setLoading(true);
        try {
            const query = activeFilter ? `?category=${activeFilter}` : '';
            const response = await apiClient(`/media${query}`);
            if (response?.media) {
                setLibrary(response.media);
            }
        } catch (error) {
            console.error('[CMSImagePicker] fetchLibrary error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (modalVisible) {
            fetchLibrary();
        }
    }, [modalVisible, activeFilter]);

    const handleUpload = async (file: any) => {
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('media', file);
            if (category) formData.append('category', category);

            const response = await apiClient('/media/upload', {
                method: 'POST',
                body: formData,
            });

            if (response?.success && response?.asset) {
                onSelect(response.asset.url);
                setModalVisible(false);
            }
        } catch (error) {
            console.error('[CMSImagePicker] upload error:', error);
        } finally {
            setUploading(false);
        }
    };

    // Web File Implementation
    const fileInputRef = React.useRef<any>(null);
    const triggerWebUpload = () => fileInputRef.current?.click();
    const handleWebFileChange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) handleUpload(file);
    };

    const filteredLibrary = library.filter(item => 
        item.filename?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.altText?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            
            <View style={styles.previewWrapper}>
                {value ? (
                    <Image source={{ uri: value }} style={styles.previewImage} />
                ) : (
                    <View style={styles.placeholder}>
                        <ImageIcon size={32} color={Colors.textMuted} />
                        <Text style={styles.placeholderText}>No image selected</Text>
                    </View>
                )}
                
                <View style={styles.overlayActions}>
                    <TouchableOpacity 
                        style={styles.actionBtn} 
                        onPress={() => setModalVisible(true)}
                    >
                        <Library size={16} color="#FFF" />
                        <Text style={styles.actionBtnText}>Choose from Library</Text>
                    </TouchableOpacity>
                    
                    {value ? (
                        <TouchableOpacity 
                            style={[styles.actionBtn, styles.removeBtn]} 
                            onPress={() => onSelect('')}
                        >
                            <X size={16} color="#FFF" />
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Media Library</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X size={24} color={Colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.searchBar}>
                            <Search size={20} color={Colors.textMuted} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search assets..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>

                        <View style={styles.libraryActions}>
                            <TouchableOpacity style={styles.uploadNewBtn} onPress={triggerWebUpload}>
                                <Plus size={18} color="#FFF" />
                                <Text style={styles.uploadNewText}>Upload New</Text>
                            </TouchableOpacity>
                            {Platform.OS === 'web' && (
                                <input 
                                    ref={fileInputRef}
                                    type="file" 
                                    style={{ display: 'none' }} 
                                    onChange={handleWebFileChange}
                                />
                            )}
                        </View>

                        {loading ? (
                            <View style={styles.center}>
                                <ActivityIndicator size="large" color={Colors.primary} />
                                <Text style={styles.loadingText}>Loading library...</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={filteredLibrary}
                                keyExtractor={(item) => item.id}
                                numColumns={3}
                                contentContainerStyle={styles.listContent}
                                renderItem={({ item }) => (
                                    <TouchableOpacity 
                                        style={[
                                            styles.gridItem,
                                            value === item.url && styles.gridItemActive
                                        ]}
                                        onPress={() => {
                                            onSelect(item.url);
                                            setModalVisible(false);
                                        }}
                                    >
                                        <Image source={{ uri: item.url }} style={styles.gridImage} />
                                        {value === item.url && (
                                            <View style={styles.checkBadge}>
                                                <Check size={12} color="#FFF" />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                )}
                                ListEmptyComponent={() => (
                                    <View style={styles.emptyState}>
                                        <ImageIcon size={48} color={Colors.border} />
                                        <Text style={styles.emptyText}>No assets found</Text>
                                    </View>
                                )}
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginBottom: 8,
    },
    previewWrapper: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
        overflow: 'hidden',
        position: 'relative',
    },
    previewImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    placeholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderText: {
        marginTop: 8,
        color: Colors.textMuted,
        fontSize: 14,
    },
    overlayActions: {
        position: 'absolute',
        bottom: 12,
        left: 12,
        right: 12,
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        flex: 1,
        height: 40,
        backgroundColor: Colors.navy,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    removeBtn: {
        flex: 0,
        width: 40,
        backgroundColor: Colors.danger,
    },
    actionBtnText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '85%',
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
        marginBottom: 16,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
    },
    libraryActions: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    uploadNewBtn: {
        flex: 1,
        height: 48,
        backgroundColor: Colors.primary,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    uploadNewText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    listContent: {
        paddingBottom: 40,
    },
    gridItem: {
        flex: 1/3,
        aspectRatio: 1,
        margin: 4,
        borderRadius: 8,
        backgroundColor: Colors.background,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    gridItemActive: {
        borderColor: Colors.primary,
    },
    gridImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    checkBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: Colors.textSecondary,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        marginTop: 12,
        color: Colors.textMuted,
        fontSize: 16,
    },
});
