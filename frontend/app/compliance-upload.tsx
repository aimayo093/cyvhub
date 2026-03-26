import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  Upload, ChevronLeft, FileText, Calendar, CheckCircle,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { apiClient } from '@/services/api';

const DOC_TYPES = [
  { slug: 'driving_licence',       label: 'Driving Licence' },
  { slug: 'motor_insurance',       label: 'Motor Insurance' },
  { slug: 'mot_certificate',       label: 'MOT Certificate' },
  { slug: 'goods_in_transit',      label: 'Goods in Transit Insurance' },
  { slug: 'public_liability',      label: 'Public Liability Insurance' },
  { slug: 'right_to_work',         label: 'Right to Work' },
  { slug: 'vehicle_registration',  label: 'Vehicle Registration (V5)' },
];

export default function ComplianceUploadScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { docType: preselectedType } = useLocalSearchParams<{ docType?: string }>();

  const [selectedType, setSelectedType] = useState(preselectedType || '');
  const [expiryDate, setExpiryDate] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileBase64, setFileBase64] = useState('');
  const [mimeType, setMimeType] = useState('');
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const pickFile = async () => {
    if (Platform.OS === 'web') {
      // Web: use a standard HTML file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,application/pdf';
      input.onchange = async (e: any) => {
        const file: File = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          const result = ev.target?.result as string;
          const base64 = result.split(',')[1];
          setFileBase64(base64);
          setFileName(file.name);
          setMimeType(file.type);
        };
        reader.readAsDataURL(file);
      };
      input.click();
    } else {
      // Native: use expo-image-picker (images only; PDF support via camera)
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow photo library access to upload documents.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        base64: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setFileName(asset.uri.split('/').pop() || 'document.jpg');
        setMimeType(asset.mimeType || 'image/jpeg');
        setFileBase64(asset.base64 || '');
      }
    }
  };

  const handleSubmit = async () => {
    if (!selectedType) return Alert.alert('Error', 'Please select a document type');
    if (!fileName || !fileBase64) return Alert.alert('Error', 'Please choose a file to upload');

    try {
      setUploading(true);

      const fileUrl = `data:${mimeType};base64,${fileBase64}`;

      await apiClient('/compliance/upload', {
        method: 'POST',
        body: JSON.stringify({
          documentType: selectedType,
          fileName,
          fileUrl,
          mimeType,
          expiryDate: expiryDate || undefined,
          issueDate: issueDate || undefined,
        }),
      });

      setSuccess(true);
      setTimeout(() => router.back(), 2000);
    } catch (err: any) {
      Alert.alert('Upload Failed', err?.message || 'Could not upload document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (success) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <View style={styles.successIcon}>
          <CheckCircle size={56} color={Colors.success} />
        </View>
        <Text style={styles.successTitle}>Document Uploaded</Text>
        <Text style={styles.successBody}>
          Your document has been submitted for review. You'll be notified once it's verified.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={22} color={Colors.textInverse} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Document</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Document Type Selector */}
        <Text style={styles.label}>Document Type *</Text>
        <View style={styles.typeGrid}>
          {DOC_TYPES.map((t) => (
            <TouchableOpacity
              key={t.slug}
              style={[styles.typeChip, selectedType === t.slug && styles.typeChipActive]}
              onPress={() => setSelectedType(t.slug)}
            >
              <Text style={[styles.typeChipText, selectedType === t.slug && styles.typeChipTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* File Picker */}
        <Text style={styles.label}>File *</Text>
        <TouchableOpacity style={styles.filePicker} onPress={pickFile}>
          <Upload size={24} color={Colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.filePickerText}>
              {fileName || 'Tap to choose file'}
            </Text>
            <Text style={styles.filePickerSub}>
              {Platform.OS === 'web' ? 'PDF, JPG, or PNG accepted' : 'Photos from your library'}
            </Text>
          </View>
          <FileText size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        {/* Dates */}
        <View style={styles.dateRow}>
          <View style={styles.dateField}>
            <Text style={styles.label}>Issue Date</Text>
            <View style={styles.dateInput}>
              <Calendar size={14} color={Colors.textMuted} />
              <TextInput
                style={styles.dateInputText}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.textMuted}
                value={issueDate}
                onChangeText={setIssueDate}
                keyboardType="numeric"
              />
            </View>
          </View>
          <View style={styles.dateField}>
            <Text style={styles.label}>Expiry Date</Text>
            <View style={styles.dateInput}>
              <Calendar size={14} color={Colors.textMuted} />
              <TextInput
                style={styles.dateInputText}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.textMuted}
                value={expiryDate}
                onChangeText={setExpiryDate}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, uploading && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Submit for Review</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.navy, paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8,
  },
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.textInverse },
  body: { padding: 20, paddingBottom: 40 },
  label: {
    fontSize: 13, fontWeight: '600' as const,
    color: Colors.textSecondary, marginBottom: 8, marginTop: 20,
  },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  typeChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeChipText: { fontSize: 12, fontWeight: '500' as const, color: Colors.textSecondary },
  typeChipTextActive: { color: '#fff' },
  filePicker: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16,
    backgroundColor: Colors.surface, borderRadius: 12,
    borderWidth: 2, borderStyle: 'dashed' as const, borderColor: Colors.primary + '60',
  },
  filePickerText: { fontSize: 14, fontWeight: '500' as const, color: Colors.text },
  filePickerSub: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  dateRow: { flexDirection: 'row', gap: 12 },
  dateField: { flex: 1 },
  dateInput: {
    flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12,
    backgroundColor: Colors.surface, borderRadius: 10, borderWidth: 1, borderColor: Colors.border,
  },
  dateInputText: { flex: 1, fontSize: 13, color: Colors.text },
  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 32,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' as const },
  successIcon: { marginBottom: 20 },
  successTitle: { fontSize: 22, fontWeight: '700' as const, color: Colors.text, marginBottom: 10 },
  successBody: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 20 },
});
