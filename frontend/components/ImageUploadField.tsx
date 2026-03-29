import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Upload, X, ImageIcon } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { apiClient } from '@/services/api';

interface ImageUploadFieldProps {
    value: string;
    onUploadComplete: (url: string) => void;
    label?: string;
}

export default function ImageUploadField({ value, onUploadComplete, label }: ImageUploadFieldProps) {
    const [uploading, setUploading] = useState(false);

    const pickImage = async () => {
        // No permissions request is necessary for launching the image library
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            uploadImage(result.assets[0].uri);
        }
    };

    const uploadImage = async (uri: string) => {
        setUploading(true);
        try {
            const formData = new FormData();
            
            // Handle platform differences for FormData
            if (Platform.OS === 'web') {
                const response = await fetch(uri);
                const blob = await response.blob();
                formData.append('media', blob, 'upload.jpg');
            } else {
                // Native
                formData.append('media', {
                    uri,
                    name: 'upload.jpg',
                    type: 'image/jpeg',
                } as any);
            }

            const response = await apiClient('/media/upload', {
                method: 'POST',
                body: formData,
            });

            if (response.success && response.asset?.url) {
                onUploadComplete(response.asset.url);
            }
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={styles.row}>
                <View style={styles.previewContainer}>
                    {value ? (
                        <Image source={{ uri: value }} style={styles.preview} />
                    ) : (
                        <View style={styles.placeholder}>
                            <ImageIcon size={24} color={Colors.textMuted} />
                        </View>
                    )}
                    {uploading && (
                        <View style={styles.overlay}>
                            <ActivityIndicator color="#FFF" />
                        </View>
                    )}
                </View>
                
                <View style={styles.actions}>
                    <TouchableOpacity 
                        style={styles.uploadBtn} 
                        onPress={pickImage}
                        disabled={uploading}
                    >
                        <Upload size={16} color="#FFF" />
                        <Text style={styles.uploadBtnText}>
                            {uploading ? 'Uploading...' : 'Choose File'}
                        </Text>
                    </TouchableOpacity>
                    
                    {value ? (
                        <TouchableOpacity 
                            style={styles.clearBtn} 
                            onPress={() => onUploadComplete('')}
                            disabled={uploading}
                        >
                            <X size={16} color={Colors.danger} />
                            <Text style={styles.clearBtnText}>Clear</Text>
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        width: '100%',
    },
    label: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 8,
        fontWeight: '500'
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    previewContainer: {
        width: 80,
        height: 60,
        borderRadius: 8,
        backgroundColor: '#F1F5F9',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        position: 'relative',
    },
    preview: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    placeholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    actions: {
        flex: 1,
        flexDirection: 'row',
        gap: 12,
    },
    uploadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        gap: 6,
    },
    uploadBtnText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    clearBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        gap: 6,
    },
    clearBtnText: {
        color: Colors.danger,
        fontSize: 14,
        fontWeight: '600',
    },
});
