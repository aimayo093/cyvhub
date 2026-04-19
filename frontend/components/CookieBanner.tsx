import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import { Link } from 'expo-router';
import Colors from '@/constants/colors';

const CONSENT_KEY = 'cyv_cookie_consent';

export default function CookieBanner() {
    const [visible, setVisible] = useState(false);
    const [fadeAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        // Only run on web
        if (Platform.OS !== 'web') return;

        try {
            const consent = localStorage.getItem(CONSENT_KEY);
            if (!consent) {
                setVisible(true);
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 400,
                    delay: 800, // small delay so page loads first
                    useNativeDriver: true,
                }).start();
            }
        } catch {
            // localStorage not available (SSR etc), skip
        }
    }, []);

    const handleAccept = () => {
        try {
            localStorage.setItem(CONSENT_KEY, 'accepted');
        } catch {}
        dismiss();
    };

    const handleDecline = () => {
        try {
            localStorage.setItem(CONSENT_KEY, 'declined');
        } catch {}
        dismiss();
    };

    const dismiss = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => setVisible(false));
    };

    if (!visible || Platform.OS !== 'web') return null;

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <View style={styles.inner}>
                <View style={styles.textBlock}>
                    <Text style={styles.title}>🍪 We use cookies</Text>
                    <Text style={styles.body}>
                        CYVhub uses essential cookies to keep the platform running. We may also use analytics cookies to improve your experience.{' '}
                        <Link href="/(public)/privacy" style={styles.link}>Privacy Policy</Link>
                    </Text>
                </View>
                <View style={styles.actions}>
                    <TouchableOpacity
                        onPress={handleDecline}
                        style={styles.declineBtn}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.declineText}>Decline</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={handleAccept}
                        style={styles.acceptBtn}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.acceptText}>Accept All</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'fixed' as any,
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    inner: {
        backgroundColor: Colors.navy,
        borderRadius: 20,
        padding: 20,
        flexDirection: Platform.OS === 'web' ? 'row' : 'column',
        alignItems: Platform.OS === 'web' ? 'center' : 'flex-start',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
        maxWidth: 1200,
        alignSelf: 'center',
        width: '100%',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    textBlock: {
        flex: 1,
        marginRight: Platform.OS === 'web' ? 24 : 0,
        marginBottom: Platform.OS === 'web' ? 0 : 16,
    },
    title: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 6,
    },
    body: {
        fontSize: 14,
        color: '#94A3B8',
        lineHeight: 20,
    },
    link: {
        color: Colors.primary,
        fontWeight: '700',
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    declineBtn: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        marginRight: 12,
    },
    declineText: {
        color: '#94A3B8',
        fontWeight: '600',
        fontSize: 14,
    },
    acceptBtn: {
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: Colors.primary,
    },
    acceptText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },
});
