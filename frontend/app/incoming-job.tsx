import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Vibration,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Bell,
  MapPin,
  Truck,
  Clock,
  Wallet,
  CheckCircle,
  XCircle,
  Navigation,
  Package,
  Zap,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useJobs } from '@/providers/JobsProvider';
import { DispatchAttempt } from '@/types';

const OFFER_DURATION = 30; // seconds

// ─── Animated Ring ───────────────────────────────────────────────────────────
function RingAnimation() {
  const scale1 = useRef(new Animated.Value(1)).current;
  const scale2 = useRef(new Animated.Value(1)).current;
  const opacity1 = useRef(new Animated.Value(0.8)).current;
  const opacity2 = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const ring1 = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale1, { toValue: 2.2, duration: 1200, useNativeDriver: true }),
          Animated.timing(opacity1, { toValue: 0, duration: 1200, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale1, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity1, { toValue: 0.8, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    const ring2 = Animated.loop(
      Animated.sequence([
        Animated.delay(600),
        Animated.parallel([
          Animated.timing(scale2, { toValue: 2.2, duration: 1200, useNativeDriver: true }),
          Animated.timing(opacity2, { toValue: 0, duration: 1200, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale2, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity2, { toValue: 0.5, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    ring1.start();
    ring2.start();
    return () => { ring1.stop(); ring2.stop(); };
  }, []);

  return (
    <View style={styles.ringContainer}>
      <Animated.View style={[styles.ring, { transform: [{ scale: scale1 }], opacity: opacity1 }]} />
      <Animated.View style={[styles.ring, { transform: [{ scale: scale2 }], opacity: opacity2 }]} />
      <View style={styles.bellCircle}>
        <Bell size={36} color="#FFFFFF" />
      </View>
    </View>
  );
}

// ─── Countdown Bar ────────────────────────────────────────────────────────────
function CountdownBar({ seconds, total }: { seconds: number; total: number }) {
  const progress = seconds / total;
  const isUrgent = seconds <= 10;
  const color = isUrgent ? Colors.danger : Colors.success;

  return (
    <View style={styles.countdownWrap}>
      <View style={[styles.countdownTrack, { borderColor: isUrgent ? Colors.danger : Colors.border }]}>
        <View style={[styles.countdownFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.countdownText, { color }]}>{seconds}s</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function IncomingJobScreen() {
  const router = useRouter();
  const { pendingOffer, acceptOffer, rejectOffer } = useJobs();

  const [secondsLeft, setSecondsLeft] = useState(OFFER_DURATION);
  const [loading, setLoading] = useState<'accept' | 'reject' | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const offer: DispatchAttempt | null = pendingOffer;

  // Compute remaining time from offerExpiresAt
  useEffect(() => {
    if (!offer) return;
    const expiresAt = new Date(offer.offerExpiresAt).getTime();

    const tick = () => {
      const remaining = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) {
        clearInterval(timerRef.current!);
        router.back();
      }
    };

    tick();
    timerRef.current = setInterval(tick, 500);
    return () => clearInterval(timerRef.current!);
  }, [offer]);

  // Haptic vibration on mount
  useEffect(() => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      // Pattern: on, off, on, off, on
      Vibration.vibrate([0, 400, 200, 400, 200, 400]);
    }
    return () => Vibration.cancel();
  }, []);

  const handleAccept = useCallback(async () => {
    if (!offer) return;
    setLoading('accept');
    try {
      await acceptOffer(offer.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)/jobs');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not accept offer. Please try again.');
    } finally {
      setLoading(null);
    }
  }, [offer, acceptOffer, router]);

  const handleReject = useCallback(async () => {
    if (!offer) return;
    setLoading('reject');
    try {
      await rejectOffer(offer.id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not decline offer.');
    } finally {
      setLoading(null);
    }
  }, [offer, rejectOffer, router]);

  if (!offer || !offer.job) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.driverPrimary} />
        <Text style={styles.waitText}>Loading offer details...</Text>
      </View>
    );
  }

  const job = offer.job;
  const payoutAmount = (job as any).payoutAmount ?? ((job.calculatedPrice ?? 0) * 0.8);
  const isUrgent = (job as any).priority === 'URGENT';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {isUrgent && (
          <View style={styles.urgentBadge}>
            <Zap size={12} color="#FFFFFF" />
            <Text style={styles.urgentText}>URGENT</Text>
          </View>
        )}
        <Text style={styles.headerTitle}>New Job Offer</Text>
        <Text style={styles.headerSubtitle}>Respond before the timer runs out</Text>
      </View>

      {/* Animated ring */}
      <RingAnimation />

      {/* Countdown */}
      <CountdownBar seconds={secondsLeft} total={OFFER_DURATION} />

      {/* Job info card */}
      <View style={styles.jobCard}>
        {/* Route */}
        <View style={styles.routeRow}>
          <View style={styles.routePoint}>
            <View style={styles.pickupDot} />
            <Text style={styles.routeCity}>{job.pickupCity || 'Pickup'}</Text>
            <Text style={styles.routePostcode}>{job.pickupPostcode || ''}</Text>
          </View>
          <View style={styles.routeArrow}>
            <Navigation size={16} color={Colors.driverPrimary} />
          </View>
          <View style={styles.routePoint}>
            <View style={styles.dropoffDot} />
            <Text style={styles.routeCity}>{job.dropoffCity || 'Dropoff'}</Text>
            <Text style={styles.routePostcode}>{job.dropoffPostcode || ''}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Details grid */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Wallet size={16} color={Colors.success} />
            <Text style={styles.detailLabel}>Your Payout</Text>
            <Text style={[styles.detailValue, styles.payoutValue]}>
              £{payoutAmount.toFixed(2)}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Truck size={16} color={Colors.driverPrimary} />
            <Text style={styles.detailLabel}>Vehicle</Text>
            <Text style={styles.detailValue}>{job.vehicleType || '—'}</Text>
          </View>

          {offer.distanceKm !== undefined && (
            <View style={styles.detailItem}>
              <MapPin size={16} color={Colors.textMuted} />
              <Text style={styles.detailLabel}>Distance to You</Text>
              <Text style={styles.detailValue}>{offer.distanceKm.toFixed(1)} km</Text>
            </View>
          )}

          {(job.distanceKm) && (
            <View style={styles.detailItem}>
              <Navigation size={16} color={Colors.textMuted} />
              <Text style={styles.detailLabel}>Job Distance</Text>
              <Text style={styles.detailValue}>{Number(job.distanceKm).toFixed(1)} km</Text>
            </View>
          )}

          {(job as any).pickupWindowStart && (
            <View style={styles.detailItem}>
              <Clock size={16} color={Colors.warning} />
              <Text style={styles.detailLabel}>Pickup Window</Text>
              <Text style={styles.detailValue}>
                {(job as any).pickupWindowStart}–{(job as any).pickupWindowEnd}
              </Text>
            </View>
          )}

          {(job as any).goodsDescription && (
            <View style={styles.detailItem}>
              <Package size={16} color={Colors.textMuted} />
              <Text style={styles.detailLabel}>Goods</Text>
              <Text style={styles.detailValue} numberOfLines={2}>{(job as any).goodsDescription}</Text>
            </View>
          )}
        </View>

        <Text style={styles.attemptLabel}>Offer #{offer.attemptNumber}</Text>
      </View>

      {/* CTA Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.rejectBtn, loading === 'reject' && styles.btnDisabled]}
          onPress={handleReject}
          disabled={!!loading}
          activeOpacity={0.8}
        >
          {loading === 'reject'
            ? <ActivityIndicator color={Colors.danger} size="small" />
            : <XCircle size={22} color={Colors.danger} />}
          <Text style={styles.rejectBtnText}>Decline</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.acceptBtn, loading === 'accept' && styles.btnDisabled]}
          onPress={handleAccept}
          disabled={!!loading}
          activeOpacity={0.8}
        >
          {loading === 'accept'
            ? <ActivityIndicator color="#FFFFFF" size="small" />
            : <CheckCircle size={22} color="#FFFFFF" />}
          <Text style={styles.acceptBtnText}>Accept Job</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.autoDeclineNote}>
        The offer will automatically decline when the timer expires.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1120',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  waitText: {
    marginTop: 16,
    color: '#94A3B8',
    fontSize: 14,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.danger,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },
  urgentText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800' as const,
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
  // ─── Ring ────────────────────────────────────────────────────────────────────
  ringContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  ring: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: Colors.driverPrimary,
  },
  bellCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.driverPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ─── Countdown ─────────────────────────────────────────────────────────────
  countdownWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    marginBottom: 20,
  },
  countdownTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    overflow: 'hidden',
  },
  countdownFill: {
    height: '100%',
    borderRadius: 4,
  },
  countdownText: {
    fontSize: 15,
    fontWeight: '700' as const,
    minWidth: 30,
    textAlign: 'right',
  },
  // ─── Job Card ────────────────────────────────────────────────────────────────
  jobCard: {
    width: '100%',
    backgroundColor: '#1A2539',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2D3F5C',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  routePoint: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  routeArrow: {
    paddingHorizontal: 8,
  },
  pickupDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.driverPrimary,
    marginBottom: 4,
  },
  dropoffDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
    marginBottom: 4,
  },
  routeCity: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700' as const,
    textAlign: 'center',
  },
  routePostcode: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#2D3F5C',
    marginBottom: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    width: '47%',
    backgroundColor: '#0F1A2E',
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  detailLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    color: '#E2E8F0',
    fontWeight: '600' as const,
  },
  payoutValue: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.success,
  },
  attemptLabel: {
    marginTop: 12,
    fontSize: 11,
    color: '#475569',
    textAlign: 'right',
  },
  // ─── Buttons ─────────────────────────────────────────────────────────────────
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 12,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.danger,
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  rejectBtnText: {
    color: Colors.danger,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  acceptBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: Colors.driverPrimary,
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800' as const,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  autoDeclineNote: {
    fontSize: 11,
    color: '#475569',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});
