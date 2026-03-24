import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
  ActivityIndicator,
  TextInput,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  MapPin,
  Phone,
  Clock,
  Truck,
  Package,
  AlertTriangle,
  ChevronRight,
  Navigation,
  ThumbsUp,
  CheckCircle,
  LocateFixed,
  CircleDot,
  X,
  XCircle,
  Timer,
  Brain,
  Shield,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useJobs } from '@/providers/JobsProvider';
import StatusBadge from '@/components/StatusBadge';
import { JobStatus } from '@/types';
import { useAuth } from '@/providers/AuthProvider';

interface NextAction {
  status: JobStatus;
  label: string;
  color: string;
}

const NEXT_ACTION_MAP: Partial<Record<JobStatus, NextAction>> = {
  ASSIGNED: { status: 'DRIVER_ACCEPTED', label: 'Accept Job', color: Colors.statusAccepted },
  DRIVER_ACCEPTED: { status: 'EN_ROUTE_TO_PICKUP', label: 'Start Driving to Pickup', color: Colors.statusEnRoute },
  EN_ROUTE_TO_PICKUP: { status: 'ARRIVED_PICKUP', label: 'Arrived at Pickup', color: Colors.statusArrived },
  ARRIVED_PICKUP: { status: 'PICKED_UP', label: 'Confirm Pickup', color: Colors.statusPickedUp },
  PICKED_UP: { status: 'EN_ROUTE_TO_DROPOFF', label: 'Start Driving to Dropoff', color: '#7C3AED' },
  EN_ROUTE_TO_DROPOFF: { status: 'ARRIVED_DROPOFF', label: 'Arrived at Dropoff', color: Colors.success },
  ARRIVED_DROPOFF: { status: 'DELIVERED', label: 'Complete Delivery', color: Colors.success },
};

const FAIL_REASONS = [
  'No one available to receive',
  'Address not found',
  'Access denied / gate locked',
  'Customer refused delivery',
  'Damaged goods',
  'Vehicle breakdown',
  'Other',
];

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getSLATimeRemaining(slaTarget: string): { text: string; isUrgent: boolean; isBreach: boolean } {
  const now = new Date();
  const target = new Date(slaTarget);
  const diffMs = target.getTime() - now.getTime();

  if (diffMs <= 0) {
    const overMs = Math.abs(diffMs);
    const overMins = Math.floor(overMs / 60000);
    const overHrs = Math.floor(overMins / 60);
    if (overHrs > 0) {
      return { text: `${overHrs}h ${overMins % 60}m overdue`, isUrgent: true, isBreach: true };
    }
    return { text: `${overMins}m overdue`, isUrgent: true, isBreach: true };
  }

  const totalMins = Math.floor(diffMs / 60000);
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;

  if (hrs > 0) {
    return { text: `${hrs}h ${mins}m remaining`, isUrgent: totalMins < 60, isBreach: false };
  }
  return { text: `${mins}m remaining`, isUrgent: totalMins < 30, isBreach: false };
}

function getAIETA(job: { distanceKm?: number; status: JobStatus; pickupWindowStart: string; dropoffWindowEnd: string }): { eta: string; confidence: number } {
  const now = new Date();
  const distFactor = (job.distanceKm ?? 30) / 50;
  const baseMinutes = Math.round(distFactor * 60);

  let adjustedMinutes = baseMinutes;
  if (['EN_ROUTE_TO_PICKUP', 'EN_ROUTE_TO_DROPOFF'].includes(job.status)) {
    adjustedMinutes = Math.round(baseMinutes * 0.6);
  } else if (['ARRIVED_PICKUP', 'PICKED_UP'].includes(job.status)) {
    adjustedMinutes = Math.round(baseMinutes * 0.4);
  } else if (['ARRIVED_DROPOFF'].includes(job.status)) {
    adjustedMinutes = 5;
  }

  const etaDate = new Date(now.getTime() + adjustedMinutes * 60000);
  const eta = etaDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  let confidence = 0.85;
  if (['ARRIVED_DROPOFF'].includes(job.status)) confidence = 0.98;
  else if (['EN_ROUTE_TO_DROPOFF'].includes(job.status)) confidence = 0.92;
  else if (['PICKED_UP'].includes(job.status)) confidence = 0.88;

  return { eta, confidence: Math.round(confidence * 100) };
}

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getJob, advanceJobStatus, declineJob, failJob } = useJobs();
  const { userRole } = useAuth();

  const job = useMemo(() => getJob(id ?? ''), [id, getJob]);
  const [showFailModal, setShowFailModal] = useState(false);
  const [failReason, setFailReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [slaTimer, setSlaTimer] = useState('');
  const [slaUrgent, setSlaUrgent] = useState(false);
  const [slaBreach, setSlaBreach] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!slaUrgent || slaBreach) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.6, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [slaUrgent, slaBreach, pulseAnim]);

  useEffect(() => {
    if (!job?.slaTarget) return;
    const update = () => {
      const result = getSLATimeRemaining(job.slaTarget!);
      setSlaTimer(result.text);
      setSlaUrgent(result.isUrgent);
      setSlaBreach(result.isBreach);
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [job?.slaTarget]);

  const nextAction = useMemo(() => {
    if (!job) return null;
    return NEXT_ACTION_MAP[job.status] ?? null;
  }, [job]);

  const aiEta = useMemo(() => {
    if (!job) return null;
    if (['DELIVERED', 'FAILED', 'CANCELLED', 'DRAFT', 'PENDING_DISPATCH'].includes(job.status)) return null;
    return getAIETA(job);
  }, [job]);

  const handleAdvance = useCallback(() => {
    if (!job || !nextAction) return;

    if (nextAction.status === 'DELIVERED') {
      Alert.alert('Complete Delivery', 'Are you sure you want to mark this job as delivered?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            advanceJobStatus(job.id);
          },
        },
      ]);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    advanceJobStatus(job.id);
  }, [job, nextAction, advanceJobStatus]);

  const handleDecline = useCallback(() => {
    if (!job) return;
    Alert.alert(
      'Decline Job',
      `Are you sure you want to decline ${job.jobNumber}? It will be returned to the dispatch pool.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            declineJob(job.id);
            router.back();
          },
        },
      ]
    );
  }, [job, declineJob, router]);

  const handleFail = useCallback(() => {
    setShowFailModal(true);
    setFailReason('');
    setCustomReason('');
  }, []);

  const handleSubmitFail = useCallback(() => {
    if (!job) return;
    const reason = failReason === 'Other' ? customReason.trim() : failReason;
    if (!reason) {
      Alert.alert('Select Reason', 'Please select or enter a failure reason.');
      return;
    }
    Alert.alert(
      'Confirm Failed Delivery',
      `Mark ${job.jobNumber} as failed?\n\nReason: ${reason}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Failed',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            failJob(job.id, reason);
            setShowFailModal(false);
            router.back();
          },
        },
      ]
    );
  }, [job, failReason, customReason, failJob, router]);

  const handleCall = useCallback((phone: string) => {
    Linking.openURL(`tel:${phone}`);
  }, []);

  const handleNavigate = useCallback((lat: number, lng: number, label: string) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:${lat},${lng}?q=${lat},${lng}(${label})`,
      default: `https://maps.google.com/?q=${lat},${lng}`,
    });
    if (url) Linking.openURL(url);
  }, []);

  if (!job) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: 'Job Details' }} />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Job not found</Text>
      </View>
    );
  }

  const isActive = !['DELIVERED', 'FAILED', 'CANCELLED', 'DRAFT', 'PENDING_DISPATCH'].includes(job.status);
  const canDecline = job.status === 'ASSIGNED' && userRole === 'driver';
  const canFail = isActive && userRole === 'driver' && !['ASSIGNED'].includes(job.status);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: job.jobNumber }} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statusRow}>
          <StatusBadge status={job.status} large />
          {job.priority === 'URGENT' && (
            <View style={styles.urgentBadge}>
              <AlertTriangle size={12} color={Colors.danger} />
              <Text style={styles.urgentText}>URGENT</Text>
            </View>
          )}
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.price}>£{job.calculatedPrice.toFixed(2)}</Text>
          {job.distanceKm != null && (
            <Text style={styles.distance}>{job.distanceKm.toFixed(1)} km</Text>
          )}
        </View>

        {job.slaTarget && isActive && (
          <View style={[
            styles.slaCard,
            slaBreach && styles.slaCardBreach,
            slaUrgent && !slaBreach && styles.slaCardUrgent,
          ]}>
            <View style={styles.slaRow}>
              <Animated.View style={{ opacity: slaUrgent ? pulseAnim : 1 }}>
                <Timer size={18} color={slaBreach ? Colors.danger : slaUrgent ? Colors.warning : Colors.success} />
              </Animated.View>
              <View style={styles.slaInfo}>
                <Text style={styles.slaLabel}>SLA DEADLINE</Text>
                <Text style={[
                  styles.slaTime,
                  slaBreach && { color: Colors.danger },
                  slaUrgent && !slaBreach && { color: Colors.warning },
                ]}>
                  {slaTimer}
                </Text>
              </View>
              <View style={[
                styles.slaBadge,
                { backgroundColor: slaBreach ? Colors.dangerLight : slaUrgent ? Colors.warningLight : Colors.successLight },
              ]}>
                <Text style={[
                  styles.slaBadgeText,
                  { color: slaBreach ? Colors.danger : slaUrgent ? '#92400E' : '#065F46' },
                ]}>
                  {slaBreach ? 'BREACHED' : slaUrgent ? 'AT RISK' : 'ON TRACK'}
                </Text>
              </View>
            </View>
            <Text style={styles.slaTarget}>Target: {formatTime(job.slaTarget)} on {formatDate(job.slaTarget)}</Text>
          </View>
        )}

        {aiEta && (
          <View style={styles.aiEtaCard}>
            <View style={styles.aiEtaRow}>
              <View style={styles.aiEtaIcon}>
                <Brain size={16} color="#FFFFFF" />
              </View>
              <View style={styles.aiEtaInfo}>
                <Text style={styles.aiEtaLabel}>AI Estimated Delivery</Text>
                <Text style={styles.aiEtaTime}>{aiEta.eta}</Text>
              </View>
              <View style={styles.aiConfidence}>
                <Text style={styles.aiConfidenceValue}>{aiEta.confidence}%</Text>
                <Text style={styles.aiConfidenceLabel}>confidence</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.routeCard}>
          <View style={styles.routePoint}>
            <View style={styles.routeIndicator}>
              <View style={styles.pickupDot} />
              <View style={styles.routeDottedLine} />
            </View>
            <View style={styles.routeDetails}>
              <Text style={styles.routeLabel}>PICKUP</Text>
              <Text style={styles.routeAddress}>{job.pickupAddressLine1}</Text>
              <Text style={styles.routeCity}>{job.pickupCity}, {job.pickupPostcode}</Text>
              <View style={styles.routeMeta}>
                <Clock size={12} color={Colors.textMuted} />
                <Text style={styles.routeTime}>
                  {formatTime(job.pickupWindowStart)} - {formatTime(job.pickupWindowEnd)}
                </Text>
              </View>
              <View style={styles.contactRow}>
                <Text style={styles.contactName}>{job.pickupContactName}</Text>
                <TouchableOpacity
                  style={styles.callButton}
                  onPress={() => handleCall(job.pickupContactPhone)}
                >
                  <Phone size={14} color={Colors.primary} />
                </TouchableOpacity>
                {isActive && (
                  <TouchableOpacity
                    style={styles.navButton}
                    onPress={() => handleNavigate(job.pickupLatitude, job.pickupLongitude, job.pickupAddressLine1)}
                  >
                    <Navigation size={14} color={Colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          <View style={styles.routePoint}>
            <View style={styles.routeIndicator}>
              <View style={styles.dropoffDot} />
            </View>
            <View style={styles.routeDetails}>
              <Text style={styles.routeLabel}>DROPOFF</Text>
              <Text style={styles.routeAddress}>{job.dropoffAddressLine1}</Text>
              <Text style={styles.routeCity}>{job.dropoffCity}, {job.dropoffPostcode}</Text>
              <View style={styles.routeMeta}>
                <Clock size={12} color={Colors.textMuted} />
                <Text style={styles.routeTime}>
                  {formatTime(job.dropoffWindowStart)} - {formatTime(job.dropoffWindowEnd)}
                </Text>
              </View>
              <View style={styles.contactRow}>
                <Text style={styles.contactName}>{job.dropoffContactName}</Text>
                <TouchableOpacity
                  style={styles.callButton}
                  onPress={() => handleCall(job.dropoffContactPhone)}
                >
                  <Phone size={14} color={Colors.primary} />
                </TouchableOpacity>
                {isActive && (
                  <TouchableOpacity
                    style={styles.navButton}
                    onPress={() => handleNavigate(job.dropoffLatitude, job.dropoffLongitude, job.dropoffAddressLine1)}
                  >
                    <Navigation size={14} color={Colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Truck size={16} color={Colors.primary} />
              <Text style={styles.infoLabel}>Vehicle</Text>
              <Text style={styles.infoValue}>{job.vehicleType}</Text>
            </View>
            <View style={styles.infoRow}>
              <Package size={16} color={Colors.primary} />
              <Text style={styles.infoLabel}>Category</Text>
              <Text style={styles.infoValue}>{job.categoryName}</Text>
            </View>
            {job.businessName && (
              <View style={styles.infoRow}>
                <CircleDot size={16} color={Colors.primary} />
                <Text style={styles.infoLabel}>Business</Text>
                <Text style={styles.infoValue}>{job.businessName}</Text>
              </View>
            )}
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <Clock size={16} color={Colors.primary} />
              <Text style={styles.infoLabel}>Created</Text>
              <Text style={styles.infoValue}>{formatDate(job.createdAt)}</Text>
            </View>
          </View>
        </View>

        {job.goodsDescription && (
          <View style={styles.descSection}>
            <Text style={styles.descTitle}>Goods Description</Text>
            <Text style={styles.descText}>{job.goodsDescription}</Text>
          </View>
        )}

        {job.specialInstructions && (
          <View style={styles.instructionsSection}>
            <View style={styles.instructionsHeader}>
              <AlertTriangle size={16} color={Colors.warning} />
              <Text style={styles.instructionsTitle}>Special Instructions</Text>
            </View>
            <Text style={styles.instructionsText}>{job.specialInstructions}</Text>
          </View>
        )}

        {job.completedAt && (
          <View style={styles.completedSection}>
            <CheckCircle size={18} color={Colors.success} />
            <Text style={styles.completedText}>
              Delivered on {formatDate(job.completedAt)} at {formatTime(job.completedAt)}
            </Text>
          </View>
        )}

        {job.status === 'DELIVERED' && job.podSignature && (
          <View style={styles.podSection}>
            <View style={styles.podHeader}>
              <Shield size={16} color={Colors.primary} />
              <Text style={styles.podTitle}>Proof of Delivery</Text>
            </View>
            <View style={styles.podDetails}>
              <View style={styles.podItem}>
                <CheckCircle size={14} color={Colors.success} />
                <Text style={styles.podItemText}>Signature captured</Text>
              </View>
              {job.podPhotos != null && job.podPhotos > 0 && (
                <View style={styles.podItem}>
                  <CheckCircle size={14} color={Colors.success} />
                  <Text style={styles.podItemText}>{job.podPhotos} photo{job.podPhotos > 1 ? 's' : ''} taken</Text>
                </View>
              )}
              {job.podNotes && (
                <View style={styles.podItem}>
                  <CheckCircle size={14} color={Colors.success} />
                  <Text style={styles.podItemText}>Notes: {job.podNotes}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {job.status === 'FAILED' && (
          <View style={styles.failedSection}>
            <XCircle size={18} color={Colors.danger} />
            <Text style={styles.failedText}>
              Delivery failed
            </Text>
          </View>
        )}

        {showFailModal && (
          <View style={styles.failModalCard}>
            <View style={styles.failModalHeader}>
              <XCircle size={18} color={Colors.danger} />
              <Text style={styles.failModalTitle}>Report Failed Delivery</Text>
            </View>
            <Text style={styles.failModalSubtitle}>Select the reason for failure:</Text>
            {FAIL_REASONS.map(reason => (
              <TouchableOpacity
                key={reason}
                style={[styles.failReasonBtn, failReason === reason && styles.failReasonBtnActive]}
                onPress={() => {
                  setFailReason(reason);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.failRadio, failReason === reason && styles.failRadioActive]}>
                  {failReason === reason && <View style={styles.failRadioDot} />}
                </View>
                <Text style={[styles.failReasonText, failReason === reason && styles.failReasonTextActive]}>
                  {reason}
                </Text>
              </TouchableOpacity>
            ))}
            {failReason === 'Other' && (
              <TextInput
                style={styles.failCustomInput}
                placeholder="Describe the reason..."
                placeholderTextColor={Colors.textMuted}
                value={customReason}
                onChangeText={setCustomReason}
                multiline
              />
            )}
            <View style={styles.failModalActions}>
              <TouchableOpacity
                style={styles.failCancelBtn}
                onPress={() => setShowFailModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.failCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.failSubmitBtn}
                onPress={handleSubmitFail}
                activeOpacity={0.7}
              >
                <Text style={styles.failSubmitText}>Submit Failure</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {(nextAction || canDecline || canFail) && !showFailModal && (
        <View style={styles.bottomBar}>
          {canDecline && (
            <View style={styles.dualButtonRow}>
              <TouchableOpacity
                style={styles.declineButton}
                onPress={handleDecline}
                activeOpacity={0.7}
                testID="decline-job-button"
              >
                <X size={18} color={Colors.danger} />
                <Text style={styles.declineButtonText}>Decline</Text>
              </TouchableOpacity>
              {nextAction && (
                <TouchableOpacity
                  style={[styles.acceptButton, { backgroundColor: nextAction.color }]}
                  onPress={handleAdvance}
                  activeOpacity={0.8}
                  testID="advance-status-button"
                >
                  <Text style={styles.advanceButtonText}>{nextAction.label}</Text>
                  <ChevronRight size={20} color={Colors.textInverse} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {!canDecline && nextAction && (
            <View style={styles.actionColumn}>
              {(userRole === 'driver' && job.status === 'ARRIVED_DROPOFF') ? (
                <TouchableOpacity
                  style={[styles.advanceButton, { backgroundColor: Colors.success }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push({ pathname: '/pod' as any, params: { id: job.id } });
                  }}
                  activeOpacity={0.8}
                  testID="pod-button"
                >
                  <Text style={styles.advanceButtonText}>Capture POD & Complete</Text>
                  <ChevronRight size={20} color={Colors.textInverse} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.advanceButton, { backgroundColor: nextAction.color }]}
                  onPress={handleAdvance}
                  activeOpacity={0.8}
                  testID="advance-status-button"
                >
                  <Text style={styles.advanceButtonText}>{nextAction.label}</Text>
                  <ChevronRight size={20} color={Colors.textInverse} />
                </TouchableOpacity>
              )}

              {canFail && (
                <TouchableOpacity
                  style={styles.failButton}
                  onPress={handleFail}
                  activeOpacity={0.7}
                  testID="fail-job-button"
                >
                  <XCircle size={16} color={Colors.danger} />
                  <Text style={styles.failButtonText}>Report Failed Delivery</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.dangerLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  urgentText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.danger,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
    marginBottom: 16,
  },
  price: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  distance: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  slaCard: {
    backgroundColor: Colors.successLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  slaCardUrgent: {
    backgroundColor: Colors.warningLight,
    borderColor: '#FDE68A',
  },
  slaCardBreach: {
    backgroundColor: Colors.dangerLight,
    borderColor: '#FECACA',
  },
  slaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  slaInfo: {
    flex: 1,
  },
  slaLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  slaTime: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#065F46',
    marginTop: 2,
  },
  slaBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  slaBadgeText: {
    fontSize: 10,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
  slaTarget: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  aiEtaCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  aiEtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiEtaIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiEtaInfo: {
    flex: 1,
  },
  aiEtaLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#4338CA',
  },
  aiEtaTime: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#312E81',
    marginTop: 1,
  },
  aiConfidence: {
    alignItems: 'center',
  },
  aiConfidenceValue: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#4338CA',
  },
  aiConfidenceLabel: {
    fontSize: 9,
    color: '#6366F1',
    fontWeight: '600' as const,
  },
  routeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  routePoint: {
    flexDirection: 'row',
    gap: 12,
  },
  routeIndicator: {
    alignItems: 'center',
    width: 14,
    paddingTop: 4,
  },
  pickupDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
  },
  dropoffDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.danger,
  },
  routeDottedLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
    minHeight: 40,
  },
  routeDetails: {
    flex: 1,
    paddingBottom: 16,
  },
  routeLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  routeAddress: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  routeCity: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  routeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  routeTime: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  contactName: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  callButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoSection: {
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  infoLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    width: 70,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
    flex: 1,
  },
  descSection: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  descTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  descText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  instructionsSection: {
    backgroundColor: Colors.warningLight,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 12,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  instructionsTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#92400E',
  },
  instructionsText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  completedSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.successLight,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 12,
  },
  completedText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#065F46',
  },
  podSection: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  podHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  podTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  podDetails: {
    gap: 8,
  },
  podItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  podItemText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  failedSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.dangerLight,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 12,
  },
  failedText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.danger,
  },
  failModalCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.danger + '40',
    marginBottom: 12,
  },
  failModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  failModalTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.danger,
  },
  failModalSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  failReasonBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  failReasonBtnActive: {
    backgroundColor: Colors.dangerLight,
  },
  failRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  failRadioActive: {
    borderColor: Colors.danger,
  },
  failRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.danger,
  },
  failReasonText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  failReasonTextActive: {
    color: Colors.text,
    fontWeight: '600' as const,
  },
  failCustomInput: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    minHeight: 60,
    marginTop: 8,
    textAlignVertical: 'top' as const,
  },
  failModalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  failCancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  failCancelText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  failSubmitBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.danger,
  },
  failSubmitText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  dualButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  declineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    height: 56,
    paddingHorizontal: 20,
    gap: 6,
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: Colors.danger + '30',
  },
  declineButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.danger,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    height: 56,
    gap: 8,
  },
  actionColumn: {
    gap: 10,
  },
  advanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    height: 56,
    gap: 8,
  },
  advanceButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.textInverse,
  },
  failButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6,
    backgroundColor: 'transparent',
  },
  failButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.danger,
  },
});
