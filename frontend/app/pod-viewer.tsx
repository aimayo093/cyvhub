import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import {
  FileSignature,
  Camera,
  User,
  MessageSquare,
  Clock,
  MapPin,
  Download,
  CheckCircle,
  Package,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { apiClient } from '@/services/api';

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' at ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export default function PODViewerScreen() {
  const { deliveryId } = useLocalSearchParams<{ deliveryId: string }>();

  const [pod, setPod] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!deliveryId) return;
    const fetchPod = async () => {
      try {
        const response = await apiClient(`/deliveries/${deliveryId}/pod`);
        setPod(response.data);
      } catch (e) {
        console.error('Failed to load POD:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchPod();
  }, [deliveryId]);

  const handleDownload = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Download POD', 'Proof of delivery document would be downloaded as PDF.');
  };

  if (loading) {
    return (
      <View style={styles.emptyContainer}>
        <Stack.Screen
          options={{
            title: 'Proof of Delivery',
            headerStyle: { backgroundColor: Colors.navy },
            headerTintColor: Colors.textInverse,
          }}
        />
        <Text style={styles.emptySubtitle}>Loading Proof of Delivery...</Text>
      </View>
    );
  }

  if (!pod) {
    return (
      <View style={styles.emptyContainer}>
        <Stack.Screen
          options={{
            title: 'Proof of Delivery',
            headerStyle: { backgroundColor: Colors.navy },
            headerTintColor: Colors.textInverse,
          }}
        />
        <Package size={48} color={Colors.textMuted} />
        <Text style={styles.emptyTitle}>No POD Available</Text>
        <Text style={styles.emptySubtitle}>Proof of delivery will be available once the delivery is completed.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Proof of Delivery',
          headerStyle: { backgroundColor: Colors.navy },
          headerTintColor: Colors.textInverse,
          headerTitleStyle: { fontWeight: '600' as const },
          headerRight: () => (
            <TouchableOpacity onPress={handleDownload} style={styles.headerBtn}>
              <Download size={20} color={Colors.customerPrimary} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.verifiedBanner}>
          <CheckCircle size={18} color={Colors.success} />
          <View>
            <Text style={styles.verifiedTitle}>Delivery Verified</Text>
            <Text style={styles.verifiedSubtitle}>POD captured on {formatDateTime(pod.capturedAt)}</Text>
          </View>
        </View>

        <View style={styles.trackingCard}>
          <Text style={styles.trackingNumber}>{pod.trackingNumber}</Text>
          <View style={styles.trackingMeta}>
            <MapPin size={12} color={Colors.textMuted} />
            <Text style={styles.trackingAddress}>{pod.dropoffAddress}, {pod.dropoffCity}</Text>
          </View>
          <View style={styles.trackingMeta}>
            <Clock size={12} color={Colors.textMuted} />
            <Text style={styles.trackingTime}>Delivered: {formatDateTime(pod.deliveredAt)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={16} color={Colors.customerPrimary} />
            <Text style={styles.sectionTitle}>Receiver</Text>
          </View>
          <View style={styles.receiverCard}>
            <View style={styles.receiverAvatar}>
              <Text style={styles.receiverInitial}>{pod.receiverName[0]}</Text>
            </View>
            <Text style={styles.receiverName}>{pod.receiverName}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileSignature size={16} color={Colors.customerPrimary} />
            <Text style={styles.sectionTitle}>Signature</Text>
          </View>
          <View style={styles.signatureCard}>
            <Image
              source={{ uri: pod.signatureUrl }}
              style={styles.signatureImage}
              resizeMode="contain"
            />
            <Text style={styles.signatureCaption}>Digital signature captured at delivery</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Camera size={16} color={Colors.customerPrimary} />
            <Text style={styles.sectionTitle}>Photos ({pod.photoUrls.length})</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
            {pod.photoUrls.map((url: string, i: number) => (
              <View key={i} style={styles.photoCard}>
                <Image source={{ uri: url }} style={styles.photo} resizeMode="cover" />
                <Text style={styles.photoLabel}>Photo {i + 1}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {pod.notes && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MessageSquare size={16} color={Colors.customerPrimary} />
              <Text style={styles.sectionTitle}>Delivery Notes</Text>
            </View>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{pod.notes}</Text>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload} activeOpacity={0.8}>
          <Download size={18} color="#FFFFFF" />
          <Text style={styles.downloadBtnText}>Download POD as PDF</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  emptyContainer: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' as const },
  headerBtn: { padding: 8 },
  scroll: { flex: 1 },
  content: { padding: 16 },
  verifiedBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#D1FAE5', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#A7F3D0', marginBottom: 16 },
  verifiedTitle: { fontSize: 15, fontWeight: '700' as const, color: '#065F46' },
  verifiedSubtitle: { fontSize: 12, color: '#047857', marginTop: 2 },
  trackingCard: { backgroundColor: Colors.navy, borderRadius: 14, padding: 16, marginBottom: 20 },
  trackingNumber: { fontSize: 18, fontWeight: '800' as const, color: Colors.textInverse, marginBottom: 8 },
  trackingMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  trackingAddress: { fontSize: 13, color: Colors.textMuted },
  trackingTime: { fontSize: 13, color: Colors.textMuted },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700' as const, color: Colors.text },
  receiverCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border },
  receiverAvatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#CCFBF1', alignItems: 'center', justifyContent: 'center' },
  receiverInitial: { fontSize: 18, fontWeight: '700' as const, color: Colors.customerPrimary },
  receiverName: { fontSize: 16, fontWeight: '600' as const, color: Colors.text },
  signatureCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  signatureImage: { width: '100%', height: 120, borderRadius: 8, backgroundColor: '#F8FAFC', marginBottom: 8 },
  signatureCaption: { fontSize: 11, color: Colors.textMuted },
  photoScroll: { flexDirection: 'row' },
  photoCard: { marginRight: 12, alignItems: 'center' },
  photo: { width: 200, height: 150, borderRadius: 14, backgroundColor: Colors.surfaceAlt },
  photoLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 6 },
  notesCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border },
  notesText: { fontSize: 14, color: Colors.text, lineHeight: 20 },
  downloadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.customerPrimary, borderRadius: 14, height: 56, gap: 8 },
  downloadBtnText: { fontSize: 16, fontWeight: '700' as const, color: '#FFFFFF' },
});
