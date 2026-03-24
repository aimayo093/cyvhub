import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Monitor, LogOut, Globe } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface WebOnlyGateProps {
  roleName: string;
  onLogout: () => void;
}

export default function WebOnlyGate({ roleName, onLogout }: WebOnlyGateProps) {
  const insets = useSafeAreaInsets();

  const handleLogout = useCallback(() => {
    onLogout();
  }, [onLogout]);

  if (Platform.OS === 'web') return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.iconContainer}>
        <View style={styles.iconCircle}>
          <Monitor size={48} color={Colors.navy} />
        </View>
        <View style={styles.globeOverlay}>
          <Globe size={20} color={Colors.primary} />
        </View>
      </View>

      <Text style={styles.title}>Web Access Only</Text>
      <Text style={styles.subtitle}>
        The {roleName} portal is designed for desktop and web browsers for the best experience.
      </Text>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>How to access</Text>
        <Text style={styles.infoText}>
          Open <Text style={styles.bold}>app.cyvhub.com</Text> in your desktop or laptop browser and sign in with your {roleName.toLowerCase()} credentials.
        </Text>
      </View>

      <View style={styles.featuresList}>
        <Text style={styles.featuresTitle}>Available on web</Text>
        {roleName === 'Admin' ? (
          <>
            <FeatureRow text="Operations Dashboard & Dispatch Console" />
            <FeatureRow text="User & Carrier Management" />
            <FeatureRow text="Analytics, Reports & AI Insights" />
            <FeatureRow text="Invoicing & Financial Overview" />
            <FeatureRow text="Quote Management & Pricing Engine" />
          </>
        ) : (
          <>
            <FeatureRow text="Business Delivery Management" />
            <FeatureRow text="Invoice & Statement Tracking" />
            <FeatureRow text="Quote Requests & History" />
            <FeatureRow text="Performance Analytics" />
            <FeatureRow text="Team & Location Management" />
          </>
        )}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <LogOut size={18} color={Colors.danger} />
        <Text style={styles.logoutText}>Sign Out & Switch Account</Text>
      </TouchableOpacity>
    </View>
  );
}

function FeatureRow({ text }: { text: string }) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureDot} />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  iconContainer: {
    marginBottom: 28,
    position: 'relative' as const,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primaryLight + '18',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary + '30',
  },
  globeOverlay: {
    position: 'absolute' as const,
    bottom: -2,
    right: -2,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary + '30',
  },
  title: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: Colors.navy,
    marginBottom: 10,
    textAlign: 'center' as const,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 22,
    maxWidth: 320,
    marginBottom: 28,
  },
  infoCard: {
    backgroundColor: Colors.infoLight,
    borderRadius: 14,
    padding: 18,
    width: '100%',
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: Colors.info,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.navy,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '700' as const,
    color: Colors.navy,
  },
  featuresList: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 18,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.navy,
    marginBottom: 14,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  featureText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: Colors.danger + '30',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.danger,
  },
});
