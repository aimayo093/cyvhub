import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, Shield, ArrowLeft, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';

export default function AdminLoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const result = await login(email.trim(), password, 'admin');
      if (result.success) {
        router.replace('/(tabs)');
      } else {
        setError(result.error || 'Invalid credentials or not an admin account.');
      }
    } catch (e) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [email, password, login, router]);

  return (
    <View style={styles.container}>
      <View style={[styles.contentWrap, isDesktop && { paddingVertical: 32 }]}>
        <View style={[styles.topSection, { paddingTop: insets.top + (isDesktop ? 40 : 20) }]}>
          {!isDesktop && (
            <TouchableOpacity style={[styles.backBtn, { top: insets.top + 20 }]} onPress={() => router.replace('/')} activeOpacity={0.7}>
              <ArrowLeft size={20} color={Colors.textInverse} />
              <Text style={styles.backBtnText}>Back to Home</Text>
            </TouchableOpacity>
          )}
          <Shield size={64} color={Colors.adminPrimary} style={{ marginBottom: 20 }} />
          <Text style={styles.adminTitle}>Admin Portal</Text>
          <Text style={styles.adminSubtitle}>Platform management</Text>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.formWrapper, isDesktop && styles.formWrapperDesktop]}>
          <ScrollView contentContainerStyle={[styles.formContainer, { paddingBottom: insets.bottom + 20 }]} keyboardShouldPersistTaps="handled">
            <Text style={styles.formTitle}>Admin Access</Text>
            <Text style={styles.formSubtitle}>Sign in to manage the platform</Text>
            
            {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Admin Email</Text>
              <View style={styles.inputContainer}>
                <Mail size={16} color={Colors.textMuted} />
                <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="admin@cyvhub.com" placeholderTextColor={Colors.textMuted} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputContainer}>
                <Lock size={16} color={Colors.textMuted} />
                <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Enter password" placeholderTextColor={Colors.textMuted} secureTextEntry={!showPassword} />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  {showPassword ? <EyeOff size={16} color={Colors.textMuted} /> : <Eye size={16} color={Colors.textMuted} />}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={[styles.submitButton, isLoading && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={isLoading} activeOpacity={0.8}>
              {isLoading ? <ActivityIndicator color="#FFFFFF" size="small" /> : <>
                <Text style={styles.submitButtonText}>Secure Sign In</Text>
                <ChevronRight size={18} color="#FFFFFF" />
              </>}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.navy },
  contentWrap: { flex: 1, width: '100%', maxWidth: 500, alignSelf: 'center' },
  topSection: { paddingHorizontal: 24, paddingBottom: 24, alignItems: 'center', position: 'relative' },
  backBtn: { position: 'absolute', left: 24, flexDirection: 'row', alignItems: 'center', gap: 6, zIndex: 10, padding: 8 },
  backBtnText: { color: Colors.textInverse, fontSize: 14, fontWeight: '600' },
  adminTitle: { fontSize: 28, fontWeight: '800', color: Colors.textInverse },
  adminSubtitle: { fontSize: 15, color: Colors.textMuted, marginTop: 8 },
  formWrapper: { flex: 1, backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  formWrapperDesktop: { borderRadius: 28, maxHeight: 680, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.1, shadowRadius: 24 },
  formContainer: { padding: 24, paddingTop: 32 },
  formTitle: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  formSubtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 24 },
  errorBox: { backgroundColor: Colors.dangerLight, padding: 12, borderRadius: 10, marginBottom: 16 },
  errorText: { color: Colors.danger, fontSize: 13, fontWeight: '500' },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6, letterSpacing: 0.3 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceAlt, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 14, height: 50, gap: 10 },
  input: { flex: 1, fontSize: 15, color: Colors.text, outlineStyle: 'none' } as any,
  submitButton: { flexDirection: 'row', backgroundColor: Colors.adminPrimary, borderRadius: 14, height: 54, alignItems: 'center', justifyContent: 'center', marginTop: 8, gap: 6 },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
