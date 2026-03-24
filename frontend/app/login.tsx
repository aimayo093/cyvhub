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
import { Mail, Lock, Eye, EyeOff, Truck, ShoppingBag, User, ChevronRight, Shield, Container, ArrowLeft } from 'lucide-react-native';
import { Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import { UserRole } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type AuthMode = 'login' | 'signup';

const ALL_ROLES: { key: UserRole; label: string; icon: React.ComponentType<{ size: number; color: string }>; color: string; desc: string; webOnly?: boolean }[] = [
  { key: 'customer', label: 'Business', icon: ShoppingBag, color: Colors.customerPrimary, desc: 'Book & track deliveries' },
  { key: 'carrier', label: 'Carrier', icon: Container, color: Colors.carrierPrimary, desc: 'Manage fleet & jobs' },
  { key: 'driver', label: 'Driver', icon: Truck, color: Colors.primary, desc: 'Accept jobs & earn' },
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
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  const ROLES = ALL_ROLES;

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
    if (authMode === 'signup' && (!firstName.trim() || !lastName.trim())) {
      setError('Please fill in all fields');
      return;
    }
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      let result: { success: boolean; error?: string };
      if (authMode === 'login') {
        result = await login(email.trim(), password, selectedRole);
      } else {
        result = await signup(firstName.trim(), lastName.trim(), email.trim(), password, selectedRole);
      }
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/');
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        // QA-4: Show the specific error from AuthService (e.g. rate-limit message)
        setError(result.error || 'Invalid email or password');
      }
    } catch (e) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [authMode, email, password, firstName, lastName, selectedRole, login, signup, router]);



  const currentRole = ALL_ROLES.find(r => r.key === selectedRole) || ROLES[0];
  const accentColor = currentRole.color;

  return (
    <View style={styles.container}>
      <View style={[styles.contentWrap, isDesktop && { paddingVertical: 32 }]}>
        <View style={[styles.topSection, { paddingTop: insets.top + (isDesktop ? 40 : 20) }]}>
          {!isDesktop && (
            <TouchableOpacity
              style={[styles.backBtn, { top: insets.top + 20 }]}
              onPress={() => router.push('/')}
              activeOpacity={0.7}
            >
              <ArrowLeft size={20} color={Colors.textInverse} />
              <Text style={styles.backBtnText}>Back to Home</Text>
            </TouchableOpacity>
          )}

          <Animated.View style={[styles.logoWrap, { transform: [{ scale: logoScale }], opacity: logoOpacity }]}>
            <Image
              source={require('@/assets/images/logo-white-no-bg.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </Animated.View>

          <View style={styles.roleGrid}>
            {ROLES.map((role) => {
              const RoleIcon = role.icon;
              const isActive = selectedRole === role.key;
              return (
                <TouchableOpacity
                  key={role.key}
                  style={[
                    styles.roleCard,
                    isActive && { borderColor: role.color, backgroundColor: role.color + '15' },
                  ]}
                  onPress={() => handleRoleSwitch(role.key)}
                  activeOpacity={0.7}
                >
                  <RoleIcon size={18} color={isActive ? role.color : Colors.textMuted} />
                  <Text style={[styles.roleCardLabel, isActive && { color: role.color }]}>
                    {role.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.roleDescription}>{currentRole.desc}</Text>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.formWrapper, isDesktop && styles.formWrapperDesktop]}
        >
          <ScrollView
            contentContainerStyle={[styles.formContainer, { paddingBottom: insets.bottom + 20 }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View style={{ opacity: fadeAnim }}>
              <Text style={styles.formTitle}>
                {authMode === 'login' ? 'Welcome back' : 'Create your account'}
              </Text>
              <Text style={styles.formSubtitle}>
                {authMode === 'login'
                  ? `Sign in as ${currentRole.label.toLowerCase()}`
                  : `Sign up as ${currentRole.label.toLowerCase()}`}
              </Text>

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {authMode === 'signup' && (
                <View style={styles.nameRow}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>First Name</Text>
                    <View style={styles.inputContainer}>
                      <User size={16} color={Colors.textMuted} />
                      <TextInput
                        style={styles.input}
                        value={firstName}
                        onChangeText={setFirstName}
                        placeholder="First"
                        placeholderTextColor={Colors.textMuted}
                        autoCapitalize="words"
                        testID="signup-firstname"
                      />
                    </View>
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Last Name</Text>
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={[styles.input, { paddingLeft: 0 }]}
                        value={lastName}
                        onChangeText={setLastName}
                        placeholder="Last"
                        placeholderTextColor={Colors.textMuted}
                        autoCapitalize="words"
                        testID="signup-lastname"
                      />
                    </View>
                  </View>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <View style={styles.inputContainer}>
                  <Mail size={16} color={Colors.textMuted} />
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="your@email.com"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    testID="login-email"
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
                    testID="login-password"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    {showPassword ? (
                      <EyeOff size={16} color={Colors.textMuted} />
                    ) : (
                      <Eye size={16} color={Colors.textMuted} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: accentColor }, isLoading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isLoading}
                activeOpacity={0.8}
                testID="login-submit"
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>
                      {authMode === 'login' ? 'Sign In' : 'Create Account'}
                    </Text>
                    <ChevronRight size={18} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.switchMode} onPress={toggleAuthMode} activeOpacity={0.7}>
                <Text style={styles.switchModeText}>
                  {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
                </Text>
                <Text style={[styles.switchModeAction, { color: accentColor }]}>
                  {authMode === 'login' ? 'Sign Up' : 'Sign In'}
                </Text>
              </TouchableOpacity>


            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.navy,
  },
  contentWrap: {
    flex: 1,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  topSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    left: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 10,
    padding: 8,
  },
  backBtnText: {
    color: Colors.textInverse,
    fontSize: 14,
    fontWeight: '600',
  },
  logoWrap: {
    marginBottom: 20,
  },
  logoImage: {
    width: 180,
    height: 52,
  },
  roleGrid: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  roleCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.navyLight,
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 4,
  },
  roleCardLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.textMuted,
  },
  roleDescription: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  formWrapper: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  formWrapperDesktop: {
    borderRadius: 28,
    maxHeight: 680,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
  },
  formContainer: {
    padding: 24,
    paddingTop: 28,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  errorBox: {
    backgroundColor: Colors.dangerLight,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 13,
    fontWeight: '500' as const,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    height: 50,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    outlineStyle: 'none'
  } as any,
  submitButton: {
    flexDirection: 'row',
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 6,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  switchMode: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 4,
  },
  switchModeText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  switchModeAction: {
    fontSize: 14,
    fontWeight: '700' as const,
  },

});
