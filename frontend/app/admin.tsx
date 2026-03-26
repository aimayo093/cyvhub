import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  useWindowDimensions, Animated, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, Shield, ArrowLeft, ChevronRight, CheckCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';

const FEATURES = [
  'Manage drivers, customers & carriers',
  'Review and approve compliance documents',
  'Monitor live deliveries & dispatch',
  'Full CMS control over website content',
  'Access analytics, invoices & payroll',
];

export default function AdminLoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 900;
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

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
    <View style={[styles.container, { paddingTop: isDesktop ? 0 : insets.top }]}>
      {isDesktop ? (
        /* ── DESKTOP: Two-column split layout ── */
        <View style={styles.desktopWrap}>
          {/* LEFT PANEL — brand side */}
          <Animated.View style={[styles.leftPanel, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <TouchableOpacity style={styles.backBtnLight} onPress={() => router.replace('/')} activeOpacity={0.7}>
              <ArrowLeft size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.backBtnLightText}>Back to Site</Text>
            </TouchableOpacity>

            <View style={styles.leftContent}>
              <Image
                source={require('@/assets/images/logo-white-no-bg.png')}
                style={styles.logoDesktop}
                resizeMode="contain"
              />
              <View style={styles.shieldBadge}>
                <Shield size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.leftTitle}>CYVhub{'\n'}Admin Portal</Text>
              <Text style={styles.leftSubtitle}>
                Secure access for authorised administrators only
              </Text>

              <View style={styles.featureList}>
                {FEATURES.map((f, i) => (
                  <View key={i} style={styles.featureRow}>
                    <CheckCircle size={16} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>

          {/* RIGHT PANEL — form side */}
          <Animated.View style={[styles.rightPanel, { opacity: fadeAnim }]}>
            <ScrollView contentContainerStyle={styles.formScrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>Welcome back</Text>
                <Text style={styles.formSubtitle}>Sign in to your admin account</Text>

                {error ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <View style={styles.inputContainer}>
                    <Mail size={16} color={Colors.textMuted} />
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="admin@cyvhub.com"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={styles.inputContainer}>
                    <Lock size={16} color={Colors.textMuted} />
                    <TextInput
                      style={styles.input}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Enter your password"
                      placeholderTextColor={Colors.textMuted}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      {showPassword ? <EyeOff size={16} color={Colors.textMuted} /> : <Eye size={16} color={Colors.textMuted} />}
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={isLoading}
                  activeOpacity={0.85}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.submitButtonText}>Secure Sign In</Text>
                      <ChevronRight size={18} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>

                <Text style={styles.secureNote}>🔒 256-bit encrypted admin session</Text>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      ) : (
        /* ── MOBILE: Single column layout ── */
        <View style={styles.container}>
          <View style={[styles.mobileTopSection, { paddingTop: insets.top + 12 }]}>
            <TouchableOpacity style={styles.backBtnMobile} onPress={() => router.replace('/')} activeOpacity={0.7}>
              <ArrowLeft size={20} color={Colors.textInverse} />
              <Text style={styles.backBtnText}>Back to Home</Text>
            </TouchableOpacity>
            <View style={styles.mobileLogoWrap}>
              <Image source={require('@/assets/images/logo-white-no-bg.png')} style={styles.logoMobile} resizeMode="contain" />
            </View>
            <Shield size={48} color={Colors.adminPrimary} style={{ marginBottom: 12 }} />
            <Text style={styles.adminTitle}>Admin Portal</Text>
            <Text style={styles.adminSubtitle}>Secure platform management</Text>
          </View>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.mobileFormWrapper}>
            <ScrollView contentContainerStyle={[styles.formContainer, { paddingBottom: insets.bottom + 20 }]} keyboardShouldPersistTaps="handled">
              <Text style={styles.formTitle}>Welcome back</Text>
              <Text style={styles.formSubtitle}>Sign in to your admin account</Text>

              {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={styles.inputContainer}>
                  <Mail size={16} color={Colors.textMuted} />
                  <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="admin@cyvhub.com" placeholderTextColor={Colors.textMuted} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputContainer}>
                  <Lock size={16} color={Colors.textMuted} />
                  <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Enter your password" placeholderTextColor={Colors.textMuted} secureTextEntry={!showPassword} />
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
              <Text style={styles.secureNote}>🔒 256-bit encrypted admin session</Text>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.navy },

  /* Desktop layout */
  desktopWrap: { flex: 1, flexDirection: 'row' },

  leftPanel: {
    width: '42%',
    background: 'linear-gradient(160deg, #0F172A 0%, #1E3A5F 60%, #1a237e 100%)' as any,
    backgroundColor: '#0F172A',
    paddingHorizontal: 48,
    paddingVertical: 48,
    justifyContent: 'space-between',
  },
  backBtnLight: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  backBtnLightText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' },
  leftContent: { flex: 1, justifyContent: 'center', paddingTop: 40 },
  logoDesktop: { width: 160, height: 48, marginBottom: 40 },
  shieldBadge: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  leftTitle: {
    fontSize: 40, fontWeight: '900', color: '#FFFFFF',
    letterSpacing: -1, lineHeight: 48, marginBottom: 16,
  },
  leftSubtitle: {
    fontSize: 16, color: 'rgba(255,255,255,0.6)',
    lineHeight: 24, marginBottom: 48,
  },
  featureList: { gap: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureText: { color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: '500' },

  rightPanel: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
  },
  formScrollContent: { flexGrow: 1, justifyContent: 'center', padding: 60 },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },

  /* Mobile layout */
  mobileTopSection: {
    paddingHorizontal: 24, paddingBottom: 32, alignItems: 'center', position: 'relative',
  },
  mobileLogoWrap: { marginBottom: 20 },
  logoMobile: { width: 130, height: 40 },
  backBtnMobile: {
    position: 'absolute', left: 24, top: 12,
    flexDirection: 'row', alignItems: 'center', gap: 6, zIndex: 10, padding: 8,
  },
  backBtnText: { color: Colors.textInverse, fontSize: 14, fontWeight: '600' },
  adminTitle: { fontSize: 26, fontWeight: '800', color: Colors.textInverse },
  adminSubtitle: { fontSize: 14, color: Colors.textMuted, marginTop: 6 },
  mobileFormWrapper: {
    flex: 1, backgroundColor: Colors.surface,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
  },
  formContainer: { padding: 24, paddingTop: 32 },

  /* Shared */
  formTitle: { fontSize: 24, fontWeight: '800', color: Colors.text, marginBottom: 6 },
  formSubtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 28 },
  errorBox: { backgroundColor: Colors.dangerLight, padding: 12, borderRadius: 10, marginBottom: 16 },
  errorText: { color: Colors.danger, fontSize: 13, fontWeight: '500' },
  inputGroup: { marginBottom: 18 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' } as any,
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12, borderWidth: 1.5, borderColor: '#E2E8F0',
    paddingHorizontal: 14, height: 52, gap: 10,
  },
  input: { flex: 1, fontSize: 15, color: Colors.text, outlineStyle: 'none' } as any,
  submitButton: {
    flexDirection: 'row', backgroundColor: '#1a237e',
    borderRadius: 14, height: 56,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 8, gap: 8,
    shadowColor: '#1a237e',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  secureNote: { textAlign: 'center', fontSize: 12, color: Colors.textMuted, marginTop: 20 },
});
