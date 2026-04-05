import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
  Dimensions,
  useWindowDimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, Truck, ShoppingBag, User, ChevronRight, Container, ArrowLeft, Phone } from 'lucide-react-native';
import { Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import { UserRole } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type AuthMode = 'login' | 'signup';

const ALL_ROLES: { key: UserRole; label: string; icon: React.ComponentType<{ size: number; color: string }>; color: string; desc: string; webOnly?: boolean }[] = [
  { key: 'customer', label: 'Business', icon: ShoppingBag, color: Colors.customerPrimary, desc: 'Book & track deliveries' },
  { key: 'carrier', label: 'Carrier', icon: Container, color: Colors.carrierPrimary, desc: 'Manage fleet & jobs' },
  { key: 'driver', label: 'Driver', icon: Truck, color: Colors.primary, desc: 'Accept jobs & earn' },
  { key: 'admin', label: 'Admin', icon: User, color: '#6366F1', desc: 'System management' },
];

export default function LoginScreen() {
  const router = useRouter();
  const { role: urlRole } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;
  const { login, signup } = useAuth();

  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [selectedRole, setSelectedRole] = useState<UserRole>('customer');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  const ROLES = Platform.OS === 'web' 
    ? ALL_ROLES 
    : ALL_ROLES.filter(r => r.key !== 'customer');

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleRoleSwitch = useCallback((role: UserRole) => {
    if (role === selectedRole) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedRole(role);
    setError('');
  }, [selectedRole]);

  const toggleAuthMode = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
    setAuthMode(prev => prev === 'login' ? 'signup' : 'login');
    setError('');
  }, [fadeAnim]);

  const handleSubmit = useCallback(async () => {
    if (authMode === 'signup') {
      if (!firstName.trim() || !lastName.trim()) {
        setError('Please enter your first and last name');
        return;
      }
      if (!phone.trim()) {
        setError('Please enter a phone number');
        return;
      }
    }
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      if (authMode === 'login') {
        const result = await login(email.trim(), password, selectedRole);
        if (result.success) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.replace('/');
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setError(result.error || 'Invalid email or password');
        }
      } else {
        const result = await signup(firstName.trim(), lastName.trim(), email.trim(), password, selectedRole, phone.trim());
        if (result.success) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          // Redirect to "check your inbox" screen — user must verify before logging in
          router.replace(`/verify-email-sent?email=${encodeURIComponent(result.email ?? email.trim())}` as any);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setError(result.error || 'Could not create account. Please try again.');
        }
      }
    } catch (e) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [authMode, email, password, firstName, lastName, phone, selectedRole, login, signup, router]);




  const currentRole = ALL_ROLES.find(r => r.key === selectedRole) || ROLES[0];
  const accentColor = currentRole.color;  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.navy, '#0F172A', Colors.primary + '30']}
        style={StyleSheet.absoluteFill}
      />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrap}>
          {/* TOP SECTION: BRANDING & ROLE CHOICE */}
          <View style={[styles.topSection, { paddingTop: insets.top + (isDesktop ? 40 : 20) }]}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.push('/')}
              activeOpacity={0.7}
            >
              <ArrowLeft size={18} color="#FFF" />
              <Text style={styles.backBtnText}>Home</Text>
            </TouchableOpacity>

            <Animated.View style={[styles.logoWrap, { transform: [{ scale: logoScale }], opacity: logoOpacity }]}>
              <Image
                source={require('@/assets/images/logo-white-no-bg.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </Animated.View>

            <View style={styles.roleHeaderWrap}>
              <Text style={styles.roleTitle}>Who are you?</Text>
              <Text style={styles.roleSubtitle}>Select your access level</Text>
            </View>

            <View style={styles.roleGrid}>
              {ROLES.map((role) => {
                const RoleIcon = role.icon;
                const isActive = selectedRole === role.key;
                return (
                  <TouchableOpacity
                    key={role.key}
                    style={[
                      styles.roleCard,
                      isActive && { borderColor: role.color }
                    ]}
                    onPress={() => handleRoleSwitch(role.key)}
                    activeOpacity={0.7}
                  >
                    {isActive && (
                      <LinearGradient
                        colors={[role.color + '30', role.color + '10']}
                        style={StyleSheet.absoluteFill}
                        start={{x: 0, y: 0}}
                        end={{x: 1, y: 1}}
                      />
                    )}
                    <RoleIcon size={20} color={isActive ? role.color : Colors.textMuted} />
                    <Text style={[styles.roleCardLabel, isActive && { color: role.color }]}>
                      {role.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* FORM SECTION: GLASSMORPHISM CARD */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.formOuterWrap}
          >
            <BlurView intensity={Platform.OS === 'ios' ? 40 : 80} tint="dark" style={styles.glassCard}>
              <Animated.View style={{ opacity: fadeAnim }}>
                <View style={styles.formHeader}>
                  <Text style={styles.formTitle}>
                    {authMode === 'login' ? 'Welcome Back' : 'Get Started'}
                  </Text>
                  <Text style={styles.formSubtitle}>
                    {authMode === 'login'
                      ? `Sign in to your ${currentRole.label.toLowerCase()} hub`
                      : `Create your ${currentRole.label.toLowerCase()} account`}
                  </Text>
                </View>

                {error ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                {authMode === 'signup' && (
                  <>
                    <View style={styles.nameRow}>
                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.inputLabel}>FIRST NAME</Text>
                        <View style={styles.inputContainer}>
                          <TextInput
                            style={styles.input}
                            value={firstName}
                            onChangeText={setFirstName}
                            placeholder="John"
                            placeholderTextColor={Colors.textMuted + '80'}
                            autoCapitalize="words"
                            autoComplete="given-name"
                            accessibilityLabel="First Name"
                          />
                        </View>
                      </View>
                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.inputLabel}>LAST NAME</Text>
                        <View style={styles.inputContainer}>
                          <TextInput
                            style={styles.input}
                            value={lastName}
                            onChangeText={setLastName}
                            placeholder="Doe"
                            placeholderTextColor={Colors.textMuted + '80'}
                            autoCapitalize="words"
                            autoComplete="family-name"
                            accessibilityLabel="Last Name"
                          />
                        </View>
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>PHONE NUMBER</Text>
                      <View style={styles.inputContainer}>
                        <Phone size={16} color={Colors.textMuted} />
                        <TextInput
                          style={styles.input}
                          value={phone}
                          onChangeText={setPhone}
                          placeholder="+44 7700 900000"
                          placeholderTextColor={Colors.textMuted + '80'}
                          keyboardType="phone-pad"
                          autoComplete="tel"
                          accessibilityLabel="Phone Number"
                        />
                      </View>
                    </View>
                  </>
                )}

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                  <View style={styles.inputContainer}>
                    <Mail size={16} color={Colors.textMuted} />
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="your@email.com"
                      placeholderTextColor={Colors.textMuted + '80'}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="email"
                      accessibilityLabel="Email Address"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>PASSWORD</Text>
                  <View style={styles.inputContainer}>
                    <Lock size={16} color={Colors.textMuted} />
                    <TextInput
                      style={styles.input}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="••••••••"
                      placeholderTextColor={Colors.textMuted + '80'}
                      secureTextEntry={!showPassword}
                      autoComplete={authMode === 'login' ? 'password' : 'new-password'}
                      accessibilityLabel="Password"
                    />
                    <TouchableOpacity 
                      onPress={() => setShowPassword(!showPassword)}
                      accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                      accessibilityRole="button"
                    >
                      {showPassword ? (
                        <EyeOff size={18} color={Colors.textMuted} />
                      ) : (
                        <Eye size={18} color={Colors.textMuted} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {authMode === 'login' && (
                  <TouchableOpacity
                    style={styles.forgotPasswordBtn}
                    onPress={() => router.push('/forgot-password' as any)}
                  >
                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                  </TouchableOpacity>
                ) || <View style={{ height: 12 }} />}

                <TouchableOpacity
                  style={[styles.submitButton, { backgroundColor: accentColor }, isLoading && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.submitButtonText}>
                        {authMode === 'login' ? 'Sign In' : 'Join CYVHUB'}
                      </Text>
                      <ChevronRight size={18} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.switchMode} onPress={toggleAuthMode} activeOpacity={0.7}>
                  <Text style={styles.switchModeText}>
                    {authMode === 'login' ? "New here? " : "Already registered? "}
                  </Text>
                  <Text style={[styles.switchModeAction, { color: accentColor }]}>
                    {authMode === 'login' ? 'Create Account' : 'Back to Login'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </BlurView>
          </KeyboardAvoidingView>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentWrap: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingBottom: 40,
  },
  topSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  backBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  logoWrap: {
    marginBottom: 24,
  },
  logoImage: {
    width: 160,
    height: 48,
  },
  roleHeaderWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  roleTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  roleSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 2,
  },
  roleGrid: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  roleCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 6,
    overflow: 'hidden',
  },
  roleCardLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.2,
  },
  formOuterWrap: {
    paddingHorizontal: 20,
  },
  glassCard: {
    borderRadius: 30,
    overflow: 'hidden',
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: Platform.OS === 'android' ? 'rgba(30, 41, 59, 0.95)' : 'transparent',
  },
  formHeader: {
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  formSubtitle: {
    fontSize: 15,
    color: Colors.textMuted,
    marginTop: 4,
    lineHeight: 20,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
    fontWeight: '600',
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 8,
    letterSpacing: 1,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    height: 56,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFF',
    paddingVertical: 12,
  },
  forgotPasswordBtn: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: -4,
  },
  forgotPasswordText: {
    fontSize: 13,
    color: Colors.primaryLight,
    fontWeight: '700',
  },
  submitButton: {
    flexDirection: 'row',
    borderRadius: 18,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  switchMode: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    paddingVertical: 4,
  },
  switchModeText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  switchModeAction: {
    fontSize: 14,
    fontWeight: '800',
  },
});
;
