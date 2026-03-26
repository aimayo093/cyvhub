import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Lock, Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { apiClient } from '@/services/api';

export default function ResetPasswordScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { token } = useLocalSearchParams<{ token?: string }>();

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Invalid reset link. Please request a new one.');
        }
    }, [token]);

    const handleReset = async () => {
        if (!newPassword || !confirmPassword) {
            setError('Please fill in both password fields');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }
        setError('');
        setIsLoading(true);

        try {
            await apiClient('/auth/reset-password', {
                method: 'POST',
                body: JSON.stringify({ token, newPassword }),
            });
            setSuccess(true);
        } catch (e: any) {
            setError(e.message || 'Something went wrong. Please try requesting a new reset link.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/login')} activeOpacity={0.7}>
                <ArrowLeft size={20} color={Colors.textInverse} />
                <Text style={styles.backBtnText}>Back to Login</Text>
            </TouchableOpacity>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inner}>
                <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                    {success ? (
                        <View style={styles.successWrap}>
                            <View style={styles.successIcon}>
                                <CheckCircle size={64} color={Colors.success} />
                            </View>
                            <Text style={styles.successTitle}>Password updated!</Text>
                            <Text style={styles.successBody}>
                                Your password has been reset successfully. You can now log in with your new password.
                            </Text>
                            <TouchableOpacity style={styles.loginBtn} onPress={() => router.replace('/login')} activeOpacity={0.85}>
                                <Text style={styles.loginBtnText}>Go to Login</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.formWrap}>
                            <View style={styles.iconWrap}>
                                <Lock size={40} color={Colors.primary} />
                            </View>
                            <Text style={styles.title}>Set new password</Text>
                            <Text style={styles.subtitle}>
                                Choose a strong password with at least 8 characters, including uppercase, lowercase, and a number.
                            </Text>

                            {error ? (
                                <View style={styles.errorBox}>
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            ) : null}

                            <Text style={styles.inputLabel}>New Password</Text>
                            <View style={styles.inputContainer}>
                                <Lock size={16} color={Colors.textMuted} />
                                <TextInput
                                    style={styles.input}
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    placeholder="At least 8 characters"
                                    placeholderTextColor={Colors.textMuted}
                                    secureTextEntry={!showNew}
                                />
                                <TouchableOpacity onPress={() => setShowNew(!showNew)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                    {showNew ? <EyeOff size={16} color={Colors.textMuted} /> : <Eye size={16} color={Colors.textMuted} />}
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.inputLabel}>Confirm Password</Text>
                            <View style={styles.inputContainer}>
                                <Lock size={16} color={Colors.textMuted} />
                                <TextInput
                                    style={styles.input}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    placeholder="Repeat your new password"
                                    placeholderTextColor={Colors.textMuted}
                                    secureTextEntry={!showConfirm}
                                />
                                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                    {showConfirm ? <EyeOff size={16} color={Colors.textMuted} /> : <Eye size={16} color={Colors.textMuted} />}
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={[styles.submitBtn, (isLoading || !token) && styles.submitBtnDisabled]}
                                onPress={handleReset}
                                disabled={isLoading || !token}
                                activeOpacity={0.85}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#FFFFFF" size="small" />
                                ) : (
                                    <Text style={styles.submitBtnText}>Reset Password</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.navy },
    backBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12 },
    backBtnText: { color: Colors.textInverse, fontSize: 14, fontWeight: '600' },
    inner: { flex: 1, backgroundColor: Colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
    content: { padding: 28, paddingTop: 40, minHeight: 500 },
    formWrap: { alignItems: 'center' },
    iconWrap: {
        width: 80, height: 80, borderRadius: 24,
        backgroundColor: Colors.primaryLight || '#EBF4FF',
        alignItems: 'center', justifyContent: 'center', marginBottom: 24,
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
        alignItems: 'center', justifyContent: 'center', width: '100%',
        shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    submitBtnDisabled: { opacity: 0.5 },
    submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    successWrap: { alignItems: 'center', paddingTop: 20 },
    successIcon: { marginBottom: 24 },
    successTitle: { fontSize: 26, fontWeight: '800', color: Colors.text, textAlign: 'center', marginBottom: 12 },
    successBody: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 36 },
    loginBtn: {
        backgroundColor: Colors.primary, borderRadius: 14, height: 54,
        alignItems: 'center', justifyContent: 'center', width: '100%',
    },
    loginBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
