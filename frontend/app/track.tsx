import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  MapPin,
  Clock,
  ArrowLeft,
  Navigation,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { apiClient } from '@/services/api';

export default function TrackingPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [trackingId, setTrackingId] = useState(id as string || '');
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTracking = async (searchId: string) => {
    if (!searchId) return;
    setLoading(true);
    setError(null);
    try {
      // In a real app, this would be a public endpoint /api/track/:id
      // For this demo, we'll try to find the job by its trackingNumber or jobNumber
      const response = await apiClient(`/deliveries/track/${searchId}`);
      if (response && response.data) {
        setJob(response.data);
      } else {
        setError('Tracking information not found. Please check your reference.');
      }
    } catch (err: any) {
      console.error('Tracking fetch failed:', err);
      setError('Could not retrieve tracking details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchTracking(id as string);
    }
  }, [id]);

  const StatusStep = ({ status, label, time, isCompleted, isCurrent }: any) => (
    <View style={styles.statusRow}>
      <View style={styles.statusLineContainer}>
        <View style={[styles.statusPoint, isCompleted && styles.statusPointCompleted, isCurrent && styles.statusPointCurrent]}>
          {isCompleted && <CheckCircle2 size={16} color="#fff" />}
        </View>
        <View style={[styles.statusLine, isCompleted && styles.statusLineCompleted]} />
      </View>
      <View style={styles.statusContent}>
        <Text style={[styles.statusLabel, isCurrent && styles.statusLabelCurrent]}>{label}</Text>
        {time && <Text style={styles.statusTime}>{time}</Text>}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Track Delivery',
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: Colors.navy },
          headerTintColor: '#fff',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
               <ArrowLeft size={24} color="#fff" />
            </TouchableOpacity>
          )
        }} 
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Search Header */}
        <View style={styles.searchCard}>
          <Text style={styles.searchTitle}>Enter Tracking Number</Text>
          <View style={styles.searchInputContainer}>
            <Search size={20} color={Colors.textMuted} />
            <input 
              style={styles.webInput} 
              placeholder="e.g. CYV-TRK-000001"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchTracking(trackingId)}
            />
            <TouchableOpacity style={styles.searchBtn} onPress={() => fetchTracking(trackingId)}>
               <Text style={styles.searchBtnText}>Track</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading && <ActivityIndicator size="large" color={Colors.customerPrimary} style={{ marginTop: 40 }} />}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {job && (
          <View style={styles.resultsContainer}>
            {/* Status Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.refLabel}>Job Reference</Text>
                  <Text style={styles.refValue}>{job.jobNumber}</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{job.status.replace('_', ' ')}</Text>
                </View>
              </View>

              <View style={styles.timeline}>
                <StatusStep 
                  label="Booking Received" 
                  time={new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  isCompleted={true}
                />
                <StatusStep 
                  label="Ready for Dispatch" 
                  time={job.paymentStatus === 'COMPLETED' ? 'Confirmed' : 'Pending Payment'}
                  isCompleted={job.paymentStatus === 'COMPLETED'}
                  isCurrent={job.status === 'PENDING_DISPATCH'}
                />
                <StatusStep 
                  label="Out for Delivery" 
                  isCompleted={job.status === 'IN_TRANSIT' || job.status === 'COMPLETED'}
                  isCurrent={job.status === 'IN_TRANSIT'}
                />
                <StatusStep 
                  label="Delivered" 
                  isCompleted={job.status === 'COMPLETED'}
                  isCurrent={job.status === 'COMPLETED'}
                />
              </View>
            </View>

            {/* Route Card */}
            <View style={[styles.card, { marginTop: 20 }]}>
              <Text style={styles.cardSectionTitle}>Route Details</Text>
              <View style={styles.routeItem}>
                <MapPin size={18} color={Colors.success} />
                <View>
                  <Text style={styles.routePointLabel}>Collection</Text>
                  <Text style={styles.routePointValue}>{job.pickupCity}, {job.pickupPostcode}</Text>
                </View>
              </View>
              <View style={styles.routeDivider} />
              <View style={styles.routeItem}>
                <MapPin size={18} color={Colors.danger} />
                <View>
                  <Text style={styles.routePointLabel}>Delivery</Text>
                  <Text style={styles.routePointValue}>{job.dropoffCity}, {job.dropoffPostcode}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {!job && !loading && (
          <View style={styles.emptyState}>
            <Package size={64} color={Colors.border} />
            <Text style={styles.emptyTitle}>No Delivery Selected</Text>
            <Text style={styles.emptyDesc}>Enter your branded tracking number starts with CYV- to see real-time updates.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    padding: 20,
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  searchCard: {
    backgroundColor: Colors.surface,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  searchTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.navy,
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    gap: 12,
  },
  webInput: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: Colors.text,
    paddingHorizontal: 8,
    borderWidth: 0,
  },
  searchBtn: {
    backgroundColor: Colors.customerPrimary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  searchBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#991B1B',
    textAlign: 'center',
    fontSize: 14,
  },
  resultsContainer: {
    marginTop: 24,
  },
  card: {
    backgroundColor: Colors.surface,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  refLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  refValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.navy,
    marginTop: 4,
  },
  badge: {
    backgroundColor: Colors.customerPrimary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    color: Colors.customerPrimary,
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  timeline: {
    paddingLeft: 4,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statusLineContainer: {
    alignItems: 'center',
    width: 24,
  },
  statusPoint: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.border,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPointCompleted: {
    backgroundColor: Colors.success,
  },
  statusPointCurrent: {
    backgroundColor: Colors.customerPrimary,
    borderWidth: 4,
    borderColor: Colors.customerPrimary + '40',
  },
  statusLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    minHeight: 40,
    marginTop: -4,
    marginBottom: -4,
  },
  statusLineCompleted: {
    backgroundColor: Colors.success,
  },
  statusContent: {
    paddingBottom: 24,
    flex: 1,
  },
  statusLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  statusLabelCurrent: {
    color: Colors.navy,
    fontWeight: '700',
  },
  statusTime: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 20,
  },
  routeItem: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  routePointLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  routePointValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 2,
  },
  routeDivider: {
    width: 1.5,
    height: 20,
    backgroundColor: Colors.border,
    marginLeft: 8,
    marginVertical: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    opacity: 0.8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.navy,
    marginTop: 20,
  },
  emptyDesc: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 280,
    lineHeight: 20,
  },
});
