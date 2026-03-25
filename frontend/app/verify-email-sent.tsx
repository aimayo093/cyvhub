import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

/**
 * Shown immediately after signup.
 * Receives the user's email as a query param to display it.
 */
export default function VerifyEmailSentScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name="mail-outline" size={56} color="#4f9cf9" />
        </View>
        <Text style={styles.title}>Check your inbox</Text>
        <Text style={styles.body}>
          We've sent a verification link to{'\n'}
          <Text style={styles.email}>{email || 'your email address'}</Text>
        </Text>
        <Text style={styles.hint}>
          Click the link in the email to activate your account. The link expires in 24 hours.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace('/login' as any)}
        >
          <Text style={styles.buttonText}>Back to Login</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          Didn't receive it? Check your spam folder.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f9',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 36,
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
    ...(Platform.OS === 'web' ? { boxShadow: '0 4px 24px rgba(0,0,0,0.08)' } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 4,
    }),
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0a2540',
    marginBottom: 12,
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    color: '#4a5568',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  email: {
    fontWeight: '600',
    color: '#0a2540',
  },
  hint: {
    fontSize: 13,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  button: {
    backgroundColor: '#0a2540',
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    fontSize: 12,
    color: '#a0aec0',
    textAlign: 'center',
  },
});
