import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { apiClient } from '@/services/api';
import { ResponsiveContainer } from '@/components/ResponsiveContainer';

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);

    const handleSubmit = async () => {
        if (!email.trim()) {
            setError('Please enter your email address');
            return;
        }
        setError('');
        setIsLoading(true);
        try {
            await apiClient('/auth/forgot-password', {
                method: 'POST',
                body: JSON.stringify({ email: email.trim().toLowerCase() }),
            });
            setSent(true);
        } catch (e: any) {
            setError(e.message || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
                <ArrowLeft size={20} color={Colors.textInverse} />
                <Text style={styles.backBtnText}>Back to Login</Text>
            </TouchableOpacity>

            <ResponsiveContainer scrollable={true} backgroundColor={Colors.background} maxWidth={600} contentContainerStyle={{ borderTopLeftRadius: 28, borderTopRightRadius: 28 }}>
                <View style={styles.content}>
                    {sent ? (
                        /* ── Success state ── */
                        <View style={styles.successWrap}>
                            <View style={styles.successIcon}>
                                <CheckCircle size={56} color={Colors.success} />
                            </View>
                            <Text style={styles.successTitle}>Check your inbox</Text>
                            <Text style={styles.successBody}>
                                If an account with <Text style={{ fontWeight: '700' }}>{email}</Text> exists, we've sent a password reset link. It will expire in 1 hour.
                            </Text>
                            <Text style={styles.successNote}>
                                Didn't get it? Check your spam folder or try again in a few minutes.
                            </Text>
                            <TouchableOpacity style={styles.loginBtn} onPress={() => router.replace('/login')} activeOpacity={0.85}>
                                <Text style={styles.loginBtnText}>Return to Login</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        /* ── Request form ── */
                        <View style={styles.formWrap}>
                            <View style={styles.iconWrap}>
                                <Mail size={40} color={Colors.primary} />
                            </View>
                            <Text style={styles.title}>Forgot your password?</Text>
                            <Text style={styles.subtitle}>
                                Enter your registered email and we'll send you a secure link to reset your password.
                            </Text>

                            {error ? (
                                <View style={styles.errorBox}>
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            ) : null}

                            <Text style={styles.inputLabel}>Email Address</Text>
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
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
                                onPress={handleSubmit}
                                disabled={isLoading}
                                activeOpacity={0.85}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#FFFFFF" size="small" />
                                ) : (
                                    <Text style={styles.submitBtnText}>Send Reset Link</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn}>
                                <Text style={styles.cancelBtnText}>Back to login</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ResponsiveContainer>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.navy },
    backBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 20, paddingVertical: 12,
    },
    backBtnText: { color: Colors.textInverse, fontSize: 14, fontWeight: '600' },
    content: { padding: 28, paddingTop: 40, minHeight: 500 },

    /* Form */
    formWrap: { alignItems: 'center' },
    iconWrap: {
        width: 80, height: 80, borderRadius: 24,
        backgroundColor: Colors.primaryLight || '#EBF4FF',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 24,
    },
    title: { fontSize: 24, fontWeight: '800', color: Colors.text, textAlign: 'center', marginBottom: 12 },
    subtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
    errorBox: { backgroundColor: Colors.dangerLight, padding: 12, borderRadius: 10, marginBottom: 16, width: '100%' },
    errorText: { color: Colors.danger, fontSize: 13, fontWeight: '500' },
    inputLabel: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, marginBottom: 6, alignSelf: 'flex-start', textTransform: 'uppercase' as const, letterSpacing: 0.5 },
    inputContainer: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: Colors.surface, borderRadius: 12,
        borderWidth: 1.5, borderColor: Colors.border,
        paddingHorizontal: 14, height: 52, gap: 10,
        width: '100%', marginBottom: 20,
    },
    input: { flex: 1, fontSize: 15, color: Colors.text, outlineStyle: 'none' } as any,
    submitBtn: {
        backgroundColor: Colors.primary, borderRadius: 14, height: 54,
        alignItems: 'center', justifyContent: 'center',
        width: '100%', marginBottom: 16,
        shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    submitBtnDisabled: { opacity: 0.7 },
    submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    cancelBtn: { padding: 12 },
    cancelBtnText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '500' },

    /* Success */
    successWrap: { alignItems: 'center', paddingTop: 20 },
    successIcon: { marginBottom: 24 },
    successTitle: { fontSize: 24, fontWeight: '800', color: Colors.text, textAlign: 'center', marginBottom: 12 },
    successBody: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 12 },
    successNote: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 32 },
    loginBtn: {
        backgroundColor: Colors.primary, borderRadius: 14, height: 54,
        alignItems: 'center', justifyContent: 'center', width: '100%',
    },
    loginBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
