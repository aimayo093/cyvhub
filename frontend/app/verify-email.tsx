import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '@/services/api';

type Status = 'loading' | 'success' | 'error';

export default function VerifyEmailScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const [status, setStatus] = useState<Status>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('No verification token found in the link.');
      return;
    }

    (async () => {
      try {
        await apiClient(`/auth/verify-email?token=${encodeURIComponent(token)}`, { method: 'GET' });
        setStatus('success');
      } catch (err: any) {
        setStatus('error');
        setErrorMsg(
          err?.message ||
          'This verification link is invalid or has expired.'
        );
      }
    })();
  }, [token]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {status === 'loading' && (
          <>
            <ActivityIndicator size="large" color="#4f9cf9" style={{ marginBottom: 20 }} />
            <Text style={styles.title}>Verifying your email…</Text>
            <Text style={styles.body}>Please wait a moment.</Text>
          </>
        )}

        {status === 'success' && (
          <>
            <View style={[styles.iconWrap, { backgroundColor: '#f0fff4' }]}>
              <Ionicons name="checkmark-circle-outline" size={56} color="#38a169" />
            </View>
            <Text style={styles.title}>Email verified!</Text>
            <Text style={styles.body}>
              Your account is now active. You can log in and get started.
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.replace('/login' as any)}
            >
              <Text style={styles.buttonText}>Go to Login</Text>
            </TouchableOpacity>
          </>
        )}

        {status === 'error' && (
          <>
            <View style={[styles.iconWrap, { backgroundColor: '#fff5f5' }]}>
              <Ionicons name="close-circle-outline" size={56} color="#e53e3e" />
            </View>
            <Text style={styles.title}>Verification failed</Text>
            <Text style={styles.body}>{errorMsg}</Text>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#e53e3e' }]}
              onPress={() => router.replace('/login' as any)}
            >
              <Text style={styles.buttonText}>Back to Login</Text>
            </TouchableOpacity>
          </>
        )}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
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
    marginBottom: 28,
  },
  button: {
    backgroundColor: '#0a2540',
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
