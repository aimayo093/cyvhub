import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Package, Clock, MapPin, ChevronRight, Truck, Navigation } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useDeliveries } from '@/providers/DeliveriesProvider';
import { Delivery, DeliveryStatus } from '@/types';

type FilterTab = 'active' | 'completed' | 'all';

const DELIVERY_STATUS_CONFIG: Record<DeliveryStatus, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Pending', color: Colors.deliveryPending, bg: '#FEF3C7' },
  CONFIRMED: { label: 'Confirmed', color: Colors.deliveryConfirmed, bg: '#DBEAFE' },
  DRIVER_ASSIGNED: { label: 'Driver Assigned', color: Colors.deliveryAssigned, bg: '#EDE9FE' },
  PICKED_UP: { label: 'Picked Up', color: Colors.deliveryPickedUp, bg: '#CFFAFE' },
  IN_TRANSIT: { label: 'In Transit', color: Colors.deliveryInTransit, bg: '#DBEAFE' },
  DELIVERED: { label: 'Delivered', color: Colors.deliveryDelivered, bg: '#D1FAE5' },
  CANCELLED: { label: 'Cancelled', color: Colors.deliveryCancelled, bg: '#F3F4F6' },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export default function DeliveriesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { deliveries, activeDeliveries, completedDeliveries } = useDeliveries();
  const [filter, setFilter] = useState<FilterTab>('active');
  const [refreshing, setRefreshing] = useState(false);

  const filteredDeliveries = useMemo(() => {
    switch (filter) {
      case 'active': return activeDeliveries;
      case 'completed': return completedDeliveries;
      default: return deliveries;
    }
  }, [filter, deliveries, activeDeliveries, completedDeliveries]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const handleDeliveryPress = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/delivery-detail' as any, params: { id } });
  }, [router]);

  const handleTrackLive = useCallback((delivery: Delivery) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/track-delivery' as any,
      params: {
        deliveryId: delivery.id,
        driverName: delivery.driverName,
        driverPhone: delivery.driverPhone,
        vehicleType: delivery.vehicleType,
      },
    });
  }, [router]);

  const renderDelivery = useCallback(({ item }: { item: Delivery }) => {
    const statusConfig = DELIVERY_STATUS_CONFIG[item.status];
    return (
      <TouchableOpacity
        style={styles.deliveryCard}
        onPress={() => handleDeliveryPress(item.id)}
        activeOpacity={0.7}
        testID={`delivery-card-${item.id}`}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardTopLeft}>
            <Text style={styles.trackingNumber}>{item.trackingNumber}</Text>
            <Text style={styles.packageDesc} numberOfLines={1}>{item.packageDescription}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
          </View>
        </View>

        <View style={styles.cardRoute}>
          <View style={styles.routeRow}>
            <View style={styles.routeDotGreen} />
            <Text style={styles.routeText} numberOfLines={1}>{item.pickupAddress}, {item.pickupCity}</Text>
          </View>
          <View style={styles.routeConnector} />
          <View style={styles.routeRow}>
            <View style={styles.routeDotRed} />
            <Text style={styles.routeText} numberOfLines={1}>{item.dropoffAddress}, {item.dropoffCity}</Text>
          </View>
        </View>

        <View style={styles.cardBottom}>
          <View style={styles.cardMeta}>
            <Truck size={12} color={Colors.textMuted} />
            <Text style={styles.metaText}>{item.vehicleType}</Text>
          </View>
          {item.estimatedDelivery && (
            <View style={styles.cardMeta}>
              <Clock size={12} color={Colors.textMuted} />
              <Text style={styles.metaText}>
                {item.status === 'DELIVERED' && item.deliveredAt
                  ? `Delivered ${formatDate(item.deliveredAt)}`
                  : `Est. ${formatDate(item.estimatedDelivery)} ${formatTime(item.estimatedDelivery)}`}
              </Text>
            </View>
          )}
          <Text style={styles.price}>£{item.estimatedPrice.toFixed(2)}</Text>
          <ChevronRight size={16} color={Colors.textMuted} />
        </View>

        {item.driverName && ['DRIVER_ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(item.status) && (
          <TouchableOpacity
            style={styles.trackLiveBtn}
            onPress={(e) => { e.stopPropagation(); handleTrackLive(item); }}
            activeOpacity={0.7}
          >
            <View style={styles.trackLiveDot} />
            <Navigation size={14} color="#fff" />
            <Text style={styles.trackLiveBtnText}>Track Live</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  }, [handleDeliveryPress]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>My Deliveries</Text>
        <Text style={styles.headerSubtitle}>
          {activeDeliveries.length} active · {completedDeliveries.length} completed
        </Text>
      </View>

      <View style={styles.filterBar}>
        {(['active', 'completed', 'all'] as FilterTab[]).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => { setFilter(f); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterLabel, filter === f && styles.filterLabelActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredDeliveries}
        renderItem={renderDelivery}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.customerPrimary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Package size={44} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No {filter} deliveries</Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'active'
                ? 'Book a delivery from the Home tab to get started'
                : 'Your completed deliveries will appear here'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.navy,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: Colors.textInverse,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
  },
  filterBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: Colors.customerPrimary,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  filterLabelActive: {
    color: '#FFFFFF',
  },
  list: {
    padding: 16,
    paddingBottom: 24,
  },
  deliveryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  cardTopLeft: {
    flex: 1,
    marginRight: 12,
  },
  trackingNumber: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  packageDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  cardRoute: {
    paddingLeft: 2,
    marginBottom: 12,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  routeDotGreen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  routeDotRed: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.danger,
  },
  routeConnector: {
    width: 2,
    height: 12,
    backgroundColor: Colors.border,
    marginLeft: 3,
    marginVertical: 2,
  },
  routeText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500' as const,
    flex: 1,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: 12,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  price: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.customerPrimary,
    marginLeft: 'auto',
  },
  trackLiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.customerPrimary,
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 12,
    gap: 6,
  },
  trackLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  trackLiveBtnText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
