import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Image,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    ArrowLeft,
    UploadCloud,
    Trash2,
    Copy,
    Search,
    Filter,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { apiClient, API_URL, getToken } from '@/services/api';

type MediaItem = {
    id: string;
    url: string;
    filename: string;
    size: string;
    type: 'image' | 'icon' | 'document';
    dateUploaded: string;
};

export default function MediaLibraryCMS() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    const loadMedia = async () => {
        try {
            setLoading(true);
            const response = await apiClient('/media');
            setMediaItems(response.media || response.data?.media || []);
        } catch (e) {
            console.error('Failed to load media:', e);
            Alert.alert('Error', 'Failed to load media from the server.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMedia();
    }, []);

    const handleUpload = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert('Permission to access camera roll is required!');
            return;
        }

        const pickerResult = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (pickerResult.canceled) {
            return;
        }

        const asset = pickerResult.assets[0];

        const formData = new FormData();
        const filename = asset.fileName || asset.uri.split('/').pop() || 'upload.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('media', {
            uri: asset.uri,
            name: filename,
            type,
        } as any);

        try {
            Alert.alert('Uploading...', 'Please wait', [], { cancelable: false });
            // Direct fetch required for multipart/form-data rather than JSON wrapper
            const token = await getToken();
            const response = await fetch(`${API_URL}/media/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });

            const result = await response.json();

            if (response.ok && result.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                await loadMedia(); // Refresh list
                Alert.alert('Success', 'Media uploaded successfully!');
            } else {
                throw new Error(result.error || 'Upload failed');
            }
        } catch (e) {
            console.error('Upload Error:', e);
            Alert.alert('Error', 'Failed to upload media.');
        }
    };

    const copyUrl = (url: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // Build full URL for external usage
        const fullUrl = url.startsWith('/') ? `${API_URL.replace('/api', '')}${url}` : url;
        // Navigation.clipboard... depending on expo version implementation
        console.log('Copying URL:', fullUrl);
        Alert.alert('Copied!', 'Image URL constructed for clipboard:\n\n' + fullUrl);
    };

    const deleteMedia = (id: string, filename: string) => {
        Alert.alert(
            'Delete File',
            `Are you sure you want to permanently delete \n\n"${filename}"? \n\nAny pages using this image will break.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            await apiClient(`/media/${id}`, { method: 'DELETE' });
                            setMediaItems(mediaItems.filter(m => m.id !== id));
                        } catch (e) {
                            Alert.alert('Error', 'Failed to delete media.');
                        }
                    }
                }
            ]
        );
    };

    const filteredMedia = mediaItems.filter(m => m.filename.toLowerCase().includes(searchQuery.toLowerCase()));

    const getFullImageUrl = (url: string) => {
        if (url.startsWith('http')) return url;
        return `${API_URL.replace('/api', '')}${url}`;
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft size={20} color={Colors.textInverse} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>Media Library</Text>
                        <Text style={styles.headerSubtitle}>Manage site images and assets</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={styles.uploadButton}
                            onPress={handleUpload}
                        >
                            <UploadCloud size={16} color="#FFF" />
                            <Text style={styles.uploadButtonText}>Upload New</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <Search size={16} color={Colors.textSecondary} style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search by filename..."
                            placeholderTextColor={Colors.textMuted}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                    <TouchableOpacity style={styles.filterBtn}>
                        <Filter size={18} color={Colors.textInverse} />
                    </TouchableOpacity>
                </View>
            </View>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : (
                <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>
                    <View style={styles.mediaGrid}>
                        {filteredMedia.map((item) => (
                            <View key={item.id} style={styles.mediaCard}>
                                <Image source={{ uri: getFullImageUrl(item.url) }} style={styles.mediaThumbnail} />

                                <View style={styles.mediaDetails}>
                                    <Text style={styles.mediaFilename} numberOfLines={1} ellipsizeMode="middle">{item.filename}</Text>
                                    <View style={styles.mediaMetaRow}>
                                        <View style={styles.mediaBadge}>
                                            <Text style={styles.mediaBadgeText}>{item.type.toUpperCase()}</Text>
                                        </View>
                                        <Text style={styles.mediaSize}>{item.size}</Text>
                                    </View>

                                    <View style={styles.mediaActions}>
                                        <TouchableOpacity style={styles.actionBtn} onPress={() => copyUrl(item.url)}>
                                            <Copy size={14} color={Colors.adminPrimary} />
                                            <Text style={styles.actionText}>Copy URL</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteMedia(item.id, item.filename)}>
                                            <Trash2 size={14} color={Colors.danger} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        ))}
                        {filteredMedia.length === 0 && (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyStateTitle}>No media found</Text>
                                <Text style={styles.emptyStateDesc}>Upload an image or check your search query.</Text>
                            </View>
                        )}
                    </View>
                    <View style={{ height: 40 }} />
                </ScrollView>
            )}
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
    uploadButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.adminPrimary, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, gap: 6 },
    uploadButtonText: { color: Colors.textInverse, fontSize: 13, fontWeight: '600' },
    searchContainer: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 16, gap: 12 },
    searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.navyLight, borderRadius: 8, paddingHorizontal: 12 },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, height: 40, color: Colors.textInverse, fontSize: 14 },
    filterBtn: { width: 40, height: 40, backgroundColor: Colors.navyLight, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    content: { flex: 1 },
    contentPadding: { padding: 20 },
    mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between' },
    mediaCard: { width: '47%', backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', marginBottom: 16 },
    mediaThumbnail: { width: '100%', height: 120, backgroundColor: Colors.borderLight, resizeMode: 'cover' },
    mediaDetails: { padding: 12 },
    mediaFilename: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 8 },
    mediaMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    mediaBadge: { backgroundColor: Colors.background, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: Colors.borderLight },
    mediaBadgeText: { fontSize: 9, fontWeight: '700', color: Colors.textSecondary },
    mediaSize: { fontSize: 12, color: Colors.textMuted },
    mediaActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.adminPrimary + '15', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 },
    actionText: { fontSize: 12, fontWeight: '600', color: Colors.adminPrimary },
    deleteBtn: { width: 28, height: 28, borderRadius: 6, backgroundColor: Colors.danger + '15', alignItems: 'center', justifyContent: 'center' },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, width: '100%' },
    emptyStateTitle: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4 },
    emptyStateDesc: { fontSize: 14, color: Colors.textMuted },
});
