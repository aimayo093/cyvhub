/**
 * CMS Route Group Layout — Admin-only guard
 *
 * Any attempt to access /(tabs)/cms/* by a non-admin user will be
 * immediately redirected to the user's own dashboard home.
 */
import { Slot, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import Colors from '@/constants/colors';
import { Shield } from 'lucide-react-native';

export default function CMSLayout() {
    const { userRole, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;
        if (userRole !== 'admin') {
            // Non-admins get bounced back to the dashboard
            router.replace('/(tabs)' as any);
        }
    }, [userRole, isLoading, router]);

    // Show a loading state while auth is resolving
    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.adminPrimary} />
            </View>
        );
    }

    // If the user is not admin, show a brief "Access Denied" screen while redirect fires
    if (userRole !== 'admin') {
        return (
            <View style={styles.center}>
                <Shield size={48} color={Colors.danger} />
                <Text style={styles.title}>Access Denied</Text>
                <Text style={styles.subtitle}>The CMS is only accessible to admin users.</Text>
                <ActivityIndicator style={{ marginTop: 20 }} color={Colors.textMuted} />
            </View>
        );
    }

    return <Slot />;
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
        gap: 12,
        padding: 32,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.text,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
});
