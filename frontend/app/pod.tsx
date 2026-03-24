import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  Camera,
  FileSignature,
  CheckCircle,
  User,
  MessageSquare,
  ChevronRight,
  Image,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useJobs } from '@/providers/JobsProvider';

export default function PODScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getJob, submitPOD } = useJobs();

  const job = getJob(id ?? '');

  const [receiverName, setReceiverName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [signatureCaptured, setSignatureCaptured] = useState<boolean>(false);
  const [photoCount, setPhotoCount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleCaptureSignature = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSignatureCaptured(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleTakePhoto = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhotoCount(prev => prev + 1);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleSubmitPOD = useCallback(() => {
    if (!receiverName.trim()) {
      Alert.alert('Missing Info', 'Please enter the receiver name.');
      return;
    }
    if (!signatureCaptured) {
      Alert.alert('Missing Signature', 'Please capture the receiver signature.');
      return;
    }

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    setTimeout(() => {
      if (job) {
        submitPOD(job.id, {
          receiverName: receiverName.trim(),
          signatureCaptured,
          photoCount,
          notes: notes.trim(),
        });
      }
      setIsSubmitting(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // POD submitted successfully
      Alert.alert(
        'Delivery Complete!',
        'Proof of delivery has been recorded successfully.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }, 800);
  }, [receiverName, notes, signatureCaptured, photoCount, job, submitPOD, router]);

  if (!job) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: 'Proof of Delivery' }} />
        <Text style={styles.loadingText}>Job not found</Text>
      </View>
    );
  }

  const allComplete = receiverName.trim().length > 0 && signatureCaptured && photoCount > 0;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Proof of Delivery',
          headerStyle: { backgroundColor: Colors.navy },
          headerTintColor: Colors.textInverse,
          headerTitleStyle: { fontWeight: '600' as const },
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.jobInfo}>
            <Text style={styles.jobNumber}>{job.jobNumber}</Text>
            <Text style={styles.jobRoute}>
              {job.dropoffAddressLine1}, {job.dropoffCity}
            </Text>
            <Text style={styles.jobContact}>Receiver: {job.dropoffContactName}</Text>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <User size={16} color={Colors.primary} />
              <Text style={styles.sectionLabel}>Receiver Details</Text>
            </View>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Receiver name (who signed)"
                placeholderTextColor={Colors.textMuted}
                value={receiverName}
                onChangeText={setReceiverName}
                autoCapitalize="words"
                testID="pod-receiver-name"
              />
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <FileSignature size={16} color={Colors.primary} />
              <Text style={styles.sectionLabel}>Signature</Text>
            </View>
            {signatureCaptured ? (
              <View style={styles.capturedBox}>
                <CheckCircle size={24} color={Colors.success} />
                <View style={styles.capturedInfo}>
                  <Text style={styles.capturedText}>Signature captured</Text>
                  <TouchableOpacity onPress={() => setSignatureCaptured(false)}>
                    <Text style={styles.recaptureText}>Recapture</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.captureBtn}
                onPress={handleCaptureSignature}
                activeOpacity={0.7}
              >
                <View style={styles.signatureArea}>
                  <FileSignature size={32} color={Colors.textMuted} />
                  <Text style={styles.signatureHint}>Tap to capture signature</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Camera size={16} color={Colors.primary} />
              <Text style={styles.sectionLabel}>Photos</Text>
            </View>
            <View style={styles.photoContent}>
              <View style={styles.photoRow}>
                <TouchableOpacity
                  style={styles.photoBtn}
                  onPress={handleTakePhoto}
                  activeOpacity={0.7}
                >
                  <Camera size={22} color={Colors.primary} />
                  <Text style={styles.photoBtnText}>Take Photo</Text>
                </TouchableOpacity>
              </View>
              {photoCount > 0 && (
                <View style={styles.photoGrid}>
                  {Array.from({ length: photoCount }).map((_, i) => (
                    <View key={i} style={styles.photoThumb}>
                      <Image size={20} color={Colors.textMuted} />
                      <Text style={styles.photoThumbText}>Photo {i + 1}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <MessageSquare size={16} color={Colors.primary} />
              <Text style={styles.sectionLabel}>Delivery Notes (Optional)</Text>
            </View>
            <View style={[styles.inputRow, { minHeight: 80, alignItems: 'flex-start', paddingTop: 14 }]}>
              <TextInput
                style={[styles.input, { textAlignVertical: 'top' }]}
                placeholder="Any notes about the delivery..."
                placeholderTextColor={Colors.textMuted}
                value={notes}
                onChangeText={setNotes}
                multiline
                testID="pod-notes"
              />
            </View>
          </View>

          <View style={styles.checklistCard}>
            <Text style={styles.checklistTitle}>POD Checklist</Text>
            <View style={styles.checkItem}>
              <CheckCircle size={16} color={receiverName.trim() ? Colors.success : Colors.border} />
              <Text style={[styles.checkText, receiverName.trim() ? styles.checkTextDone : undefined]}>Receiver name</Text>
            </View>
            <View style={styles.checkItem}>
              <CheckCircle size={16} color={signatureCaptured ? Colors.success : Colors.border} />
              <Text style={[styles.checkText, signatureCaptured ? styles.checkTextDone : undefined]}>Signature</Text>
            </View>
            <View style={styles.checkItem}>
              <CheckCircle size={16} color={photoCount > 0 ? Colors.success : Colors.border} />
              <Text style={[styles.checkText, photoCount > 0 ? styles.checkTextDone : undefined]}>
                Photo evidence {photoCount > 0 ? `(${photoCount})` : ''}
              </Text>
            </View>
            <View style={styles.checkItem}>
              <CheckCircle size={16} color={notes.trim() ? Colors.success : Colors.border} />
              <Text style={[styles.checkText, notes.trim() ? styles.checkTextDone : undefined]}>Notes (optional)</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              isSubmitting && styles.submitButtonDisabled,
              !allComplete && styles.submitButtonIncomplete,
            ]}
            onPress={handleSubmitPOD}
            disabled={isSubmitting}
            activeOpacity={0.8}
            testID="submit-pod"
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Complete Delivery</Text>
                <ChevronRight size={18} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  loadingText: { fontSize: 15, color: Colors.textSecondary },
  scrollView: { flex: 1 },
  content: { padding: 16 },
  jobInfo: { backgroundColor: Colors.navy, borderRadius: 14, padding: 16, marginBottom: 16 },
  jobNumber: { fontSize: 16, fontWeight: '700' as const, color: Colors.textInverse },
  jobRoute: { fontSize: 14, color: Colors.textMuted, marginTop: 4 },
  jobContact: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  sectionCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionLabel: { fontSize: 14, fontWeight: '700' as const, color: Colors.text },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceAlt, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, minHeight: 48, gap: 10 },
  input: { flex: 1, fontSize: 14, color: Colors.text },
  captureBtn: { borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed', borderRadius: 12, overflow: 'hidden' },
  signatureArea: { height: 120, alignItems: 'center', justifyContent: 'center', gap: 8 },
  signatureHint: { fontSize: 13, color: Colors.textMuted },
  capturedBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.successLight, borderRadius: 12, padding: 16, gap: 10 },
  capturedInfo: { flex: 1 },
  capturedText: { fontSize: 14, fontWeight: '600' as const, color: Colors.success },
  recaptureText: { fontSize: 12, color: Colors.primary, fontWeight: '500' as const, marginTop: 2 },
  photoContent: { gap: 12 },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  photoBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DBEAFE', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  photoBtnText: { fontSize: 14, fontWeight: '600' as const, color: Colors.primary },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoThumb: { width: 72, height: 72, borderRadius: 10, backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', gap: 4 },
  photoThumbText: { fontSize: 9, color: Colors.textMuted, fontWeight: '500' as const },
  checklistCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  checklistTitle: { fontSize: 14, fontWeight: '700' as const, color: Colors.text, marginBottom: 12 },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  checkText: { fontSize: 14, color: Colors.textMuted },
  checkTextDone: { color: Colors.text, fontWeight: '500' as const },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.success, borderRadius: 14, height: 56, gap: 6 },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonIncomplete: { opacity: 0.85 },
  submitButtonText: { fontSize: 16, fontWeight: '700' as const, color: '#FFFFFF' },
});
