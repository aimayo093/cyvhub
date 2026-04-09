import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { ShieldCheck, ArrowLeft } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { apiClient } from '@/services/api';

export default function StripeOnboardScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        initiateOnboarding();
    }, []);

    const initiateOnboarding = async () => {
        setLoading(true);
        try {
            const res = await apiClient('/stripe-connect/onboard', { method: 'POST' });
            if (res.onboardingUrl) {
                // Open Stripe managed onboarding in the device browser securely
                const result = await WebBrowser.openBrowserAsync(res.onboardingUrl);
                // When they return from the browser, we pop them back to the previous screen (earnings)
                router.back();
            } else if (res.onboardingComplete) {
                Alert.alert('Setup Complete', 'Your Stripe payouts are already set up.');
                router.back();
            } else {
                throw new Error('No onboarding URL returned');
            }
        } catch (error: any) {
            console.error('Failed to initiate Stripe onboarding:', error);
            Alert.alert('Error', error.message || 'Failed to connect to Stripe securely.');
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ShieldCheck size={64} color={Colors.primary} style={{ marginBottom: 24 }} />
                <Text style={styles.title}>Securing Connection...</Text>
                <Text style={styles.subtitle}>Routing you to Stripe for identity verification</Text>
                <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 32 }} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Connection Failed</Text>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
                <ArrowLeft size={20} color={Colors.text} />
                <Text style={styles.cancelBtnText}>Go Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.retryBtn} onPress={initiateOnboarding}>
                <Text style={styles.retryBtnText}>Retry Connection</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.textMuted,
        textAlign: 'center',
    },
    retryBtn: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 8,
        marginTop: 24,
        width: '100%',
        alignItems: 'center',
    },
    retryBtnText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    cancelBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.surface,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 8,
        marginTop: 32,
        borderWidth: 1,
        borderColor: Colors.border,
        width: '100%',
    },
    cancelBtnText: {
        color: Colors.text,
        fontWeight: '600',
        marginLeft: 8,
        fontSize: 16,
    }
});
