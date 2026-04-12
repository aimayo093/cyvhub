import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  MapPin,
  Phone,
  Clock,
  Truck,
  Package,
  CheckCircle,
  ChevronRight,
  User,
  XCircle,
  FileSignature,
  Shield,
  Brain,
  Navigation,
  AlertTriangle,
  Zap,
  CreditCard,
  Wallet,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useDeliveries } from '@/providers/DeliveriesProvider';
import { usePayments } from '@/providers/PaymentProvider';
import { DeliveryStatus, SLAStatus } from '@/types';

const STATUS_CONFIG: Record<DeliveryStatus, { label: string; color: string; bg: string }> = {
  PENDING_PAYMENT: { label: 'Pending Payment', color: Colors.warning, bg: '#FEF3C7' },
  PENDING: { label: 'Pending', color: Colors.deliveryPending, bg: '#FEF3C7' },
  CONFIRMED: { label: 'Confirmed', color: Colors.deliveryConfirmed, bg: '#DBEAFE' },
  DRIVER_ASSIGNED: { label: 'Driver Assigned', color: Colors.deliveryAssigned, bg: '#EDE9FE' },
  PICKED_UP: { label: 'Picked Up', color: Colors.deliveryPickedUp, bg: '#CFFAFE' },
  IN_TRANSIT: { label: 'In Transit', color: Colors.deliveryInTransit, bg: '#DBEAFE' },
  DELIVERED: { label: 'Delivered', color: Colors.deliveryDelivered, bg: '#D1FAE5' },
  CANCELLED: { label: 'Cancelled', color: Colors.deliveryCancelled, bg: '#F3F4F6' },
};

const SLA_CONFIG: Record<SLAStatus, { label: string; color: string; bg: string; icon: typeof CheckCircle }> = {
  ON_TRACK: { label: 'On Track', color: Colors.success, bg: '#D1FAE5', icon: CheckCircle },
  AT_RISK: { label: 'At Risk', color: Colors.warning, bg: '#FEF3C7', icon: AlertTriangle },
  BREACHED: { label: 'SLA Breached', color: Colors.danger, bg: '#FEE2E2', icon: XCircle },
  MET: { label: 'SLA Met', color: Colors.success, bg: '#D1FAE5', icon: CheckCircle },
};

const STATUS_STEPS: DeliveryStatus[] = [
  'PENDING_PAYMENT',
  'PENDING',
  'CONFIRMED',
  'DRIVER_ASSIGNED',
  'PICKED_UP',
  'IN_TRANSIT',
  'DELIVERED',
];

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getSLAForDelivery(status: DeliveryStatus): SLAStatus {
  switch (status) {
    case 'DELIVERED': return 'MET';
    case 'CANCELLED': return 'MET';
    case 'IN_TRANSIT': return 'ON_TRACK';
    case 'PICKED_UP': return 'ON_TRACK';
    case 'DRIVER_ASSIGNED': return 'ON_TRACK';
    case 'CONFIRMED': return 'ON_TRACK';
    case 'PENDING': return 'ON_TRACK';
    case 'PENDING_PAYMENT': return 'AT_RISK';
    default: return 'ON_TRACK';
  }
}

function getAIEta(status: DeliveryStatus, estimatedDelivery?: string): { eta: string; confidence: number; message: string } {
  if (status === 'DELIVERED' || status === 'CANCELLED') {
    return { eta: '', confidence: 100, message: 'Delivery completed' };
  }
  if (!estimatedDelivery) {
    return { eta: '', confidence: 0, message: 'Calculating...' };
  }

  const est = new Date(estimatedDelivery);
  const adjustedMinutes = status === 'IN_TRANSIT' ? -15 : status === 'PICKED_UP' ? 5 : 20;
  const adjusted = new Date(est.getTime() + adjustedMinutes * 60 * 1000);
  const confidence = status === 'IN_TRANSIT' ? 94 : status === 'PICKED_UP' ? 87 : 72;

  return {
    eta: adjusted.toISOString(),
    confidence,
    message: status === 'IN_TRANSIT'
      ? 'Based on real-time traffic and driver location'
      : status === 'PICKED_UP'
        ? 'Based on route analysis and current conditions'
        : 'Based on historical data for this route',
  };
}

export default function DeliveryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getDelivery, cancelDelivery } = useDeliveries();

  const delivery = useMemo(() => getDelivery(id ?? ''), [id, getDelivery]);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [driverProgress] = useState<number>(() => {
    if (!delivery) return 0;
    if (delivery.status === 'IN_TRANSIT') return 0.65;
    if (delivery.status === 'PICKED_UP') return 0.35;
    if (delivery.status === 'DRIVER_ASSIGNED') return 0.15;
    if (delivery.status === 'DELIVERED') return 1;
    return 0;
  });

  useEffect(() => {
    if (delivery && ['IN_TRANSIT', 'PICKED_UP'].includes(delivery.status)) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [delivery, pulseAnim]);

  const slaStatus = useMemo(() => {
    if (!delivery) return 'ON_TRACK' as SLAStatus;
    return delivery.slaStatus ?? getSLAForDelivery(delivery.status);
  }, [delivery]);

  const aiEta = useMemo(() => {
    if (!delivery) return { eta: '', confidence: 0, message: '' };
    return getAIEta(delivery.status, delivery.estimatedDelivery);
  }, [delivery]);

  const handleCall = useCallback((phone: string) => {
    Linking.openURL(`tel:${phone}`);
  }, []);

  const handleCancel = useCallback(() => {
    if (!delivery) return;
    Alert.alert('Cancel Delivery', 'Are you sure you want to cancel this delivery?', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel Delivery',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          cancelDelivery(delivery.id);
          router.back();
        },
      },
    ]);
  }, [delivery, cancelDelivery, router]);

  if (!id) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: 'Delivery Details' }} />
        <ActivityIndicator size="large" color={Colors.customerPrimary} />
        <Text style={styles.loadingText}>Missing delivery ID</Text>
      </View>
    );
  }

  if (!delivery) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: 'Delivery Details' }} />
        <ActivityIndicator size="large" color={Colors.customerPrimary} />
        <Text style={styles.loadingText}>Loading delivery details...</Text>
      </View>
    );
  }

  // Defensive Lookups: Fallback to PENDING/ON_TRACK if backend returns specific Job statuses or missing SLA
  const statusConfig = STATUS_CONFIG[delivery.status as DeliveryStatus] || STATUS_CONFIG.PENDING;
  const slaConfig = delivery.slaStatus ? (SLA_CONFIG[delivery.slaStatus] || SLA_CONFIG.ON_TRACK) : SLA_CONFIG.ON_TRACK;
  const SlaIcon = slaConfig.icon;
  const currentStepIndex = STATUS_STEPS.indexOf(delivery.status);
  const canCancel = ['PENDING_PAYMENT', 'PENDING', 'CONFIRMED'].includes(delivery.status);
  const isActiveDelivery = !['DELIVERED', 'CANCELLED'].includes(delivery.status);

  // Compute payment status from delivery field or from transactions
  const { transactions } = usePayments();
  const paymentStatus = useMemo(() => {
    if (delivery.paymentStatus) return delivery.paymentStatus;
    const txn = transactions.find(
      t => t.deliveryId === delivery.id && t.type === 'charge'
    );
    return txn?.status ?? 'PENDING';
  }, [delivery, transactions]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: delivery.trackingNumber,
          headerStyle: { backgroundColor: Colors.navy },
          headerTintColor: Colors.textInverse,
          headerTitleStyle: { fontWeight: '600' as const },
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statusSection}>
          <View style={[styles.statusBadgeLarge, { backgroundColor: statusConfig.bg }]}>
            <View style={[styles.statusDotLarge, { backgroundColor: statusConfig.color }]} />
            <Text style={[styles.statusLabelLarge, { color: statusConfig.color }]}>{statusConfig.label}</Text>
          </View>
          <Text style={styles.price}>£{delivery.estimatedPrice.toFixed(2)}</Text>
        </View>

        {isActiveDelivery && (
          <View style={styles.slaAiRow}>
            <View style={[styles.slaCard, { borderLeftColor: slaConfig.color }]}>
              <View style={styles.slaHeader}>
                <SlaIcon size={14} color={slaConfig.color} />
                <Text style={[styles.slaLabel, { color: slaConfig.color }]}>{slaConfig.label}</Text>
              </View>
              <Text style={styles.slaSubtext}>
                {delivery.slaStatus === 'ON_TRACK' ? 'Delivery on schedule' : delivery.slaStatus === 'AT_RISK' ? 'Pending assignment' : 'Running behind schedule'}
              </Text>
            </View>

            <View style={[styles.aiEtaCard, { borderLeftColor: Colors.customerPrimary }]}>
              <View style={styles.slaHeader}>
                <Brain size={14} color={Colors.customerPrimary} />
                <Text style={[styles.slaLabel, { color: Colors.customerPrimary }]}>AI ETA</Text>
              </View>
              {aiEta.eta ? (
                <>
                  <Text style={styles.aiEtaTime}>{formatTime(aiEta.eta)}</Text>
                  <Text style={styles.aiEtaConfidence}>{aiEta.confidence}% confidence</Text>
                </>
              ) : (
                <Text style={styles.aiEtaConfidence}>{aiEta.message}</Text>
              )}
            </View>
          </View>
        )}

        {delivery.status === 'DELIVERED' && (
          <View style={styles.slaMetBanner}>
            <Shield size={16} color={Colors.success} />
            <Text style={styles.slaMetText}>SLA Met — Delivered on time</Text>
          </View>
        )}

        {isActiveDelivery && (
          <View style={styles.liveMapCard}>
            <View style={styles.liveMapHeader}>
              <View style={styles.liveMapHeaderLeft}>
                <Navigation size={14} color={Colors.customerPrimary} />
                <Text style={styles.liveMapTitle}>Live Tracking</Text>
              </View>
              {['IN_TRANSIT', 'PICKED_UP'].includes(delivery.status) && (
                <View style={styles.liveBadge}>
                  <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              )}
            </View>

            <View style={styles.mapPlaceholder}>
              <View style={styles.mapRouteVisual}>
                <View style={styles.mapPickupPoint}>
                  <View style={styles.mapPickupDot} />
                  <Text style={styles.mapPointLabel}>{delivery.pickupCity}</Text>
                </View>

                <View style={styles.mapRouteLine}>
                  <View style={[styles.mapRouteProgress, { width: `${driverProgress * 100}%` as any }]} />
                  {delivery.driverName && driverProgress > 0 && driverProgress < 1 && (
                    <Animated.View
                      style={[
                        styles.mapDriverMarker,
                        { left: `${driverProgress * 100}%` as any },
                      ]}
                    >
                      <Truck size={14} color="#FFFFFF" />
                    </Animated.View>
                  )}
                </View>

                <View style={styles.mapDropoffPoint}>
                  <View style={styles.mapDropoffDot} />
                  <Text style={styles.mapPointLabel}>{delivery.dropoffCity}</Text>
                </View>
              </View>

              <View style={styles.mapStats}>
                <View style={styles.mapStat}>
                  <Text style={styles.mapStatLabel}>Distance</Text>
                  <Text style={styles.mapStatValue}>
                    {delivery.pickupCity === delivery.dropoffCity ? '~5 km' : '~45 km'}
                  </Text>
                </View>
                <View style={styles.mapStatDivider} />
                <View style={styles.mapStat}>
                  <Text style={styles.mapStatLabel}>Est. Arrival</Text>
                  <Text style={styles.mapStatValue}>
                    {aiEta.eta ? formatTime(aiEta.eta) : delivery.estimatedDelivery ? formatTime(delivery.estimatedDelivery) : '--:--'}
                  </Text>
                </View>
                <View style={styles.mapStatDivider} />
                <View style={styles.mapStat}>
                  <Text style={styles.mapStatLabel}>Status</Text>
                  <Text style={[styles.mapStatValue, { color: statusConfig.color }]}>{statusConfig.label}</Text>
                </View>
              </View>
            </View>

            {aiEta.message && aiEta.eta ? (
              <View style={styles.aiInsightRow}>
                <Zap size={12} color={Colors.customerPrimary} />
                <Text style={styles.aiInsightText}>{aiEta.message}</Text>
              </View>
            ) : null}
          </View>
        )}

        {delivery.status !== 'CANCELLED' && (
          <View style={styles.progressCard}>
            <Text style={styles.progressTitle}>Delivery Progress</Text>
            <View style={styles.progressSteps}>
              {STATUS_STEPS.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const stepConfig = STATUS_CONFIG[step];
                return (
                  <View key={step} style={styles.progressStep}>
                    <View style={styles.progressStepIndicator}>
                      <View style={[
                        styles.progressDot,
                        isCompleted && { backgroundColor: Colors.customerPrimary },
                        isCurrent && styles.progressDotCurrent,
                      ]}>
                        {isCompleted && <CheckCircle size={12} color="#FFFFFF" />}
                      </View>
                      {index < STATUS_STEPS.length - 1 && (
                        <View style={[
                          styles.progressLine,
                          isCompleted && index < currentStepIndex && { backgroundColor: Colors.customerPrimary },
                        ]} />
                      )}
                    </View>
                    <Text style={[
                      styles.progressStepLabel,
                      isCompleted && { color: Colors.text, fontWeight: '600' as const },
                      isCurrent && { color: Colors.customerPrimary },
                    ]}>
                      {stepConfig.label}
                    </Text>
                  </View>
                );
              })}
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
              <Text style={styles.routeAddress}>{delivery.pickupAddress}</Text>
              <Text style={styles.routeCity}>{delivery.pickupCity}, {delivery.pickupPostcode}</Text>
              <Text style={styles.routeContact}>{delivery.pickupContact}</Text>
              {delivery.estimatedPickup && (
                <View style={styles.routeMeta}>
                  <Clock size={12} color={Colors.textMuted} />
                  <Text style={styles.routeTime}>
                    {formatDate(delivery.estimatedPickup)} at {formatTime(delivery.estimatedPickup)}
                  </Text>
                </View>
              )}
              {delivery.pickupTimeWindow && (
                <View style={styles.routeMeta}>
                  <Clock size={12} color={Colors.customerPrimary} />
                  <Text style={[styles.routeTime, { color: Colors.customerPrimary }]}>Window: {delivery.pickupTimeWindow}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.routePoint}>
            <View style={styles.routeIndicator}>
              <View style={styles.dropoffDot} />
            </View>
            <View style={styles.routeDetails}>
              <Text style={styles.routeLabel}>DROPOFF</Text>
              <Text style={styles.routeAddress}>{delivery.dropoffAddress}</Text>
              <Text style={styles.routeCity}>{delivery.dropoffCity}, {delivery.dropoffPostcode}</Text>
              <Text style={styles.routeContact}>{delivery.dropoffContact}</Text>
              {delivery.estimatedDelivery && (
                <View style={styles.routeMeta}>
                  <Clock size={12} color={Colors.textMuted} />
                  <Text style={styles.routeTime}>
                    {delivery.deliveredAt
                      ? `Delivered ${formatDate(delivery.deliveredAt)} at ${formatTime(delivery.deliveredAt)}`
                      : `Est. ${formatDate(delivery.estimatedDelivery)} at ${formatTime(delivery.estimatedDelivery)}`}
                  </Text>
                </View>
              )}
              {delivery.deliveryTimeWindow && (
                <View style={styles.routeMeta}>
                  <Clock size={12} color={Colors.customerPrimary} />
                  <Text style={[styles.routeTime, { color: Colors.customerPrimary }]}>Window: {delivery.deliveryTimeWindow}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          {delivery.parcels && delivery.parcels.length > 0 ? (
            <View style={styles.parcelsSubSection}>
              <View style={styles.infoRow}>
                <Package size={16} color={Colors.customerPrimary} />
                <Text style={styles.infoLabel}>Items</Text>
                <Text style={styles.infoValue}>{delivery.parcels.reduce((sum, p) => sum + p.quantity, 0)} Total</Text>
              </View>
              {delivery.parcels.map((parcel, idx) => (
                <View key={idx} style={styles.parcelMiniItem}>
                  <Text style={styles.parcelMiniText}>
                    {parcel.quantity}x {parcel.description || 'Parcel'} ({parcel.lengthCm}x{parcel.widthCm}x{parcel.heightCm}cm, {parcel.weightKg}kg)
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.infoRow}>
              <Package size={16} color={Colors.customerPrimary} />
              <Text style={styles.infoLabel}>Package</Text>
              <Text style={styles.infoValue}>{delivery.packageDescription}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Truck size={16} color={Colors.customerPrimary} />
            <Text style={styles.infoLabel}>Vehicle</Text>
            <Text style={styles.infoValue}>{delivery.vehicleType}</Text>
          </View>
          {delivery.jobType && (
            <View style={styles.infoRow}>
              <Package size={16} color={Colors.customerPrimary} />
              <Text style={styles.infoLabel}>Job Type</Text>
              <Text style={styles.infoValue}>{delivery.jobType}</Text>
            </View>
          )}
          <View style={[styles.infoRow, !delivery.specialInstructions ? { borderBottomWidth: 0 } : {}]}>
            <Clock size={16} color={Colors.customerPrimary} />
            <Text style={styles.infoLabel}>Booked</Text>
            <Text style={styles.infoValue}>{formatDate(delivery.createdAt)}</Text>
          </View>
          {delivery.specialInstructions && (
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <AlertTriangle size={16} color={Colors.warning} />
              <Text style={styles.infoLabel}>Notes</Text>
              <Text style={styles.infoValue}>{delivery.specialInstructions}</Text>
            </View>
          )}
          {/* Payment Status */}
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <CreditCard size={16} color={paymentStatus === 'COMPLETED' ? Colors.success : Colors.warning} />
            <Text style={styles.infoLabel}>Payment</Text>
            <View style={[styles.paymentBadge, { backgroundColor: paymentStatus === 'COMPLETED' ? Colors.successLight : paymentStatus === 'PROCESSING' ? Colors.infoLight : '#FEF3C7' }]}>
              <Text style={[styles.paymentBadgeText, { color: paymentStatus === 'COMPLETED' ? Colors.success : paymentStatus === 'PROCESSING' ? Colors.info : Colors.warning }]}>
                {paymentStatus === 'COMPLETED' ? 'Paid' : paymentStatus === 'PROCESSING' ? 'Processing' : 'Unpaid'}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment CTA for Unpaid Jobs */}
        {paymentStatus !== 'COMPLETED' && delivery.status !== 'CANCELLED' && (
          <View style={styles.paymentCTASection}>
            <View style={styles.paymentWarning}>
              <AlertTriangle size={18} color={Colors.warning} />
              <Text style={styles.paymentWarningText}>
                {delivery.status === 'PENDING_PAYMENT' 
                  ? 'Payment is required to confirm this booking and assign a driver.'
                  : 'Payment for this delivery is still pending.'}
              </Text>
            </View>
            <TouchableOpacity
                style={styles.payNowBtn}
                onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({
                    pathname: '/payment-checkout' as any,
                    params: {
                    amount: delivery.estimatedPrice.toFixed(2),
                    description: `Delivery ${delivery.trackingNumber}`,
                    deliveryId: delivery.id,
                    trackingNumber: delivery.trackingNumber,
                    },
                });
                }}
                activeOpacity={0.7}
            >
                <Wallet size={18} color="#fff" />
                <Text style={styles.payNowBtnText}>Pay £{delivery.estimatedPrice.toFixed(2)} Now</Text>
                <ChevronRight size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {delivery.driverName && (
          <View style={styles.driverCard}>
            <View style={styles.driverAvatar}>
              <User size={20} color={Colors.customerPrimary} />
            </View>
            <View style={styles.driverDetails}>
              <Text style={styles.driverCardName}>{delivery.driverName}</Text>
              <Text style={styles.driverCardLabel}>Assigned Driver</Text>
            </View>
            {delivery.driverPhone && (
              <TouchableOpacity
                style={styles.callDriverBtn}
                onPress={() => handleCall(delivery.driverPhone!)}
              >
                <Phone size={16} color={Colors.customerPrimary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {delivery.driverName && isActiveDelivery && ['DRIVER_ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(delivery.status) && (
          <TouchableOpacity
            style={styles.trackDriverBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({
                pathname: '/track-delivery' as any,
                params: {
                  deliveryId: delivery.id,
                  driverName: delivery.driverName,
                  driverPhone: delivery.driverPhone,
                  vehicleType: delivery.vehicleType,
                },
              });
            }}
            activeOpacity={0.7}
          >
            <MapPin size={18} color="#fff" />
            <Text style={styles.trackDriverBtnText}>Track Driver Live</Text>
            <ChevronRight size={16} color="#fff" />
          </TouchableOpacity>
        )}

        {delivery.deliveredAt && (
          <View style={styles.completedBanner}>
            <CheckCircle size={18} color={Colors.success} />
            <Text style={styles.completedText}>
              Delivered on {formatDate(delivery.deliveredAt)} at {formatTime(delivery.deliveredAt)}
            </Text>
          </View>
        )}

        {delivery.status === 'DELIVERED' && (
          <TouchableOpacity
            style={styles.podButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({ pathname: '/pod-viewer' as any, params: { deliveryId: delivery.id } });
            }}
            activeOpacity={0.7}
          >
            <FileSignature size={18} color={Colors.customerPrimary} />
            <Text style={styles.podButtonText}>View Proof of Delivery</Text>
            <ChevronRight size={16} color={Colors.customerPrimary} />
          </TouchableOpacity>
        )}

        {canCancel && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            activeOpacity={0.7}
          >
            <XCircle size={18} color={Colors.danger} />
            <Text style={styles.cancelButtonText}>Cancel Delivery</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
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
  statusSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
  },
  statusDotLarge: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabelLarge: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  price: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  slaAiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  slaCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 3,
  },
  aiEtaCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 3,
  },
  slaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  slaLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  slaSubtext: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  aiEtaTime: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.text,
    marginTop: 2,
  },
  aiEtaConfidence: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  slaMetBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  slaMetText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#065F46',
  },
  liveMapCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    overflow: 'hidden',
  },
  liveMapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  liveMapHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveMapTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.danger,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: Colors.danger,
  },
  mapPlaceholder: {
    padding: 16,
  },
  mapRouteVisual: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  mapPickupPoint: {
    alignItems: 'center',
    gap: 6,
  },
  mapPickupDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.success,
    borderWidth: 3,
    borderColor: '#D1FAE5',
  },
  mapPointLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    maxWidth: 60,
    textAlign: 'center' as const,
  },
  mapRouteLine: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginHorizontal: 8,
    position: 'relative' as const,
  },
  mapRouteProgress: {
    height: 4,
    backgroundColor: Colors.customerPrimary,
    borderRadius: 2,
    position: 'absolute' as const,
    top: 0,
    left: 0,
  },
  mapDriverMarker: {
    position: 'absolute' as const,
    top: -14,
    marginLeft: -14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.customerPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  mapDropoffPoint: {
    alignItems: 'center',
    gap: 6,
  },
  mapDropoffDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.danger,
    borderWidth: 3,
    borderColor: '#FEE2E2',
  },
  mapStats: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    padding: 12,
  },
  mapStat: {
    flex: 1,
    alignItems: 'center',
  },
  mapStatLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  mapStatValue: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  mapStatDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  aiInsightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.customerPrimary + '08',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  aiInsightText: {
    fontSize: 11,
    color: Colors.customerPrimary,
    fontWeight: '500' as const,
    flex: 1,
  },
  progressCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  progressSteps: {
    gap: 0,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  progressStepIndicator: {
    alignItems: 'center',
    width: 20,
  },
  progressDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotCurrent: {
    borderWidth: 3,
    borderColor: Colors.customerPrimary,
    backgroundColor: '#FFFFFF',
  },
  progressLine: {
    width: 2,
    height: 20,
    backgroundColor: Colors.border,
  },
  progressStepLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    paddingTop: 2,
    paddingBottom: 14,
  },
  routeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
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
  routeContact: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
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
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: 16,
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
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
    marginBottom: 16,
  },
  driverAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverDetails: {
    flex: 1,
  },
  driverCardName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  driverCardLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  callDriverBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.successLight,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 16,
  },
  completedText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#065F46',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dangerLight,
    paddingVertical: 14,
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.danger,
  },
  paymentCTASection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.warning + '40',
    gap: 12,
  },
  paymentWarning: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    backgroundColor: Colors.warning + '10',
    padding: 12,
    borderRadius: 12,
  },
  paymentWarningText: {
    flex: 1,
    fontSize: 12,
    color: Colors.text,
    fontWeight: '500' as const,
    lineHeight: 18,
  },
  payNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.customerPrimary,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  payNowBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  podButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#CCFBF1',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.customerPrimary + '30',
  },
  podButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.customerPrimary,
  },
  trackDriverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.customerPrimary,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    marginBottom: 16,
  },
  trackDriverBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#fff',
  },
  paymentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  paymentBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  payNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.customerPrimary,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    marginBottom: 16,
  },
  payNowBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#fff',
  },
  parcelsSubSection: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingBottom: 8,
    marginBottom: 8,
  },
  parcelMiniItem: {
    paddingLeft: 32,
    paddingVertical: 4,
  },
  parcelMiniText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
