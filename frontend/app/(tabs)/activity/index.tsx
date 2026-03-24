import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Package,
  Truck,
  CheckCircle,
  CreditCard,
  Star,
  ChevronRight,
  Bell,
  BellRing,
  AlertTriangle,
  Briefcase,
  RefreshCw,
  Shield,
  Settings,
  Clock,
  Map as MapIcon,
  List,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import { apiClient } from '@/services/api';
import MapView from '@/components/MapView';

const MOCK_ACTIVITY: any[] = [];
const MOCK_DRIVER_NOTIFICATIONS: any[] = [];
import { ActivityItem, DriverNotification, DriverNotificationType } from '@/types';

const CUSTOMER_ICON_MAP: Record<ActivityItem['type'], { Icon: typeof Package; color: string; bg: string }> = {
  delivery_created: { Icon: Package, color: Colors.customerPrimary, bg: '#CCFBF1' },
  delivery_picked_up: { Icon: Truck, color: Colors.primary, bg: '#DBEAFE' },
  delivery_completed: { Icon: CheckCircle, color: Colors.success, bg: '#D1FAE5' },
  payment: { Icon: CreditCard, color: Colors.purple, bg: '#EDE9FE' },
  rating: { Icon: Star, color: Colors.warning, bg: '#FEF3C7' },
};

const DRIVER_ICON_MAP: Record<DriverNotificationType, { Icon: typeof Package; color: string; bg: string }> = {
  new_job: { Icon: Briefcase, color: Colors.primary, bg: '#DBEAFE' },
  sla_warning: { Icon: AlertTriangle, color: Colors.warning, bg: '#FEF3C7' },
  assignment_change: { Icon: RefreshCw, color: Colors.purple, bg: '#EDE9FE' },
  job_update: { Icon: Clock, color: Colors.info, bg: '#CFFAFE' },
  compliance: { Icon: Shield, color: Colors.carrierPrimary, bg: '#FFEDD5' },
  system: { Icon: Settings, color: Colors.textSecondary, bg: '#F1F5F9' },
};

type DriverFilter = 'all' | 'unread' | 'sla_warning' | 'new_job';

const DRIVER_FILTERS: { key: DriverFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'sla_warning', label: 'SLA' },
  { key: 'new_job', label: 'Jobs' },
];

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function CustomerActivityScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const fetchActivity = useCallback(async () => {
    try {
      const data = await apiClient('/activity');
      const mapped = data.map((log: any) => ({
        id: log.id,
        type: log.type,
        title: log.title,
        subtitle: log.message,
        message: log.message,
        timestamp: log.timestamp,
        amount: log.amount,
        deliveryId: log.jobId,
        jobId: log.jobId,
        severity: log.severity,
        read: log.read
      }));
      setActivity(mapped);
    } catch (error) {
      console.error('Fetch activity error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchActivity();
  }, [fetchActivity]);

  const handlePress = useCallback((item: ActivityItem) => {
    if (item.deliveryId) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push({ pathname: '/delivery-detail' as any, params: { id: item.deliveryId } });
    }
  }, [router]);

  const renderItem = useCallback(({ item, index }: { item: ActivityItem; index: number }) => {
    const iconConfig = CUSTOMER_ICON_MAP[item.type];
    const IconComponent = iconConfig.Icon;
    const isLast = index === MOCK_ACTIVITY.length - 1;

    return (
      <TouchableOpacity
        style={[styles.activityRow, !isLast && styles.activityRowBorder]}
        onPress={() => handlePress(item)}
        activeOpacity={item.deliveryId ? 0.6 : 1}
      >
        <View style={[styles.iconCircle, { backgroundColor: iconConfig.bg }]}>
          <IconComponent size={18} color={iconConfig.color} />
        </View>
        <View style={styles.activityContent}>
          <Text style={styles.activityTitle}>{item.title}</Text>
          <Text style={styles.activitySubtitle} numberOfLines={1}>{item.subtitle}</Text>
        </View>
        <View style={styles.activityRight}>
          <Text style={styles.activityTime}>{timeAgo(item.timestamp)}</Text>
          {item.amount != null && (
            <Text style={styles.activityAmount}>£{item.amount.toFixed(2)}</Text>
          )}
        </View>
        {item.deliveryId && <ChevronRight size={14} color={Colors.textMuted} />}
      </TouchableOpacity>
    );
  }, [handlePress]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.headerTitle}>Activity</Text>
            <Text style={styles.headerSubtitle}>Recent updates and notifications</Text>
          </View>
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
              onPress={() => { setViewMode('list'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            >
              <List size={16} color={viewMode === 'list' ? '#fff' : Colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive]}
              onPress={() => { setViewMode('map'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            >
              <MapIcon size={16} color={viewMode === 'map' ? '#fff' : Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {viewMode === 'list' ? (
        <FlatList
          data={activity}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.customerPrimary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Bell size={44} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No activity yet</Text>
              <Text style={styles.emptySubtitle}>
                Your delivery updates and notifications will appear here
              </Text>
            </View>
          }
        />
      ) : (
        <View style={styles.mapContainer}>
          <MapView
            center={{ latitude: 51.6214, longitude: -3.9436 }}
            zoom={10}
            markers={activity.filter(a => a.jobId).map(a => ({
              id: a.id,
              latitude: 51.6214 + (Math.random() - 0.5) * 0.1, // Simulated cluster for demo
              longitude: -3.9436 + (Math.random() - 0.5) * 0.1,
              title: a.title,
              type: 'driver'
            }))}
            height="100%"
          />
        </View>
      )}
    </View>
  );
}

function DriverNotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<DriverFilter>('all');
  const [notifications, setNotifications] = useState<DriverNotification[]>([]);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await apiClient('/activity');
      const mapped = data.map((log: any) => ({
        id: log.id,
        type: log.type,
        title: log.title,
        message: log.message,
        timestamp: log.timestamp,
        jobId: log.jobId,
        severity: log.severity,
        read: log.read
      }));
      setNotifications(mapped);
    } catch (error) {
      console.error('Fetch notifications error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const filteredNotifications = useMemo(() => {
    switch (activeFilter) {
      case 'unread':
        return notifications.filter(n => !n.read);
      case 'sla_warning':
        return notifications.filter(n => n.type === 'sla_warning');
      case 'new_job':
        return notifications.filter(n => n.type === 'new_job' || n.type === 'assignment_change');
      default:
        return notifications;
    }
  }, [activeFilter, notifications]);

  const filterCounts = useMemo(() => ({
    all: notifications.length,
    unread: notifications.filter(n => !n.read).length,
    sla_warning: notifications.filter(n => n.type === 'sla_warning').length,
    new_job: notifications.filter(n => n.type === 'new_job' || n.type === 'assignment_change').length,
  }), [notifications]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, [fetchNotifications]);

  const handlePress = useCallback((item: DriverNotification) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (!item.read) {
      setNotifications(prev =>
        prev.map(n => n.id === item.id ? { ...n, read: true } : n)
      );
    }

    if (item.jobId) {
      router.push({ pathname: '/job-detail' as any, params: { id: item.jobId } });
    }
  }, [router]);

  const handleMarkAllRead = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const renderNotification = useCallback(({ item, index }: { item: DriverNotification; index: number }) => {
    const iconConfig = DRIVER_ICON_MAP[item.type];
    const IconComponent = iconConfig.Icon;
    const isLast = index === filteredNotifications.length - 1;

    return (
      <TouchableOpacity
        style={[
          styles.notifRow,
          !isLast && styles.activityRowBorder,
          !item.read && styles.notifUnread,
        ]}
        onPress={() => handlePress(item)}
        activeOpacity={0.6}
        testID={`notification-${item.id}`}
      >
        <View style={[styles.iconCircle, { backgroundColor: iconConfig.bg }]}>
          <IconComponent size={18} color={iconConfig.color} />
          {!item.read && <View style={styles.unreadDot} />}
        </View>
        <View style={styles.notifContent}>
          <View style={styles.notifTitleRow}>
            <Text style={[styles.notifTitle, !item.read && styles.notifTitleUnread]} numberOfLines={1}>
              {item.title}
            </Text>
            {item.severity === 'urgent' && (
              <View style={styles.severityBadge}>
                <Text style={styles.severityText}>URGENT</Text>
              </View>
            )}
            {item.severity === 'warning' && (
              <View style={[styles.severityBadge, styles.severityWarning]}>
                <Text style={[styles.severityText, styles.severityWarningText]}>WARNING</Text>
              </View>
            )}
          </View>
          <Text style={styles.notifMessage} numberOfLines={2}>{item.message}</Text>
          <Text style={styles.notifTime}>{timeAgo(item.timestamp)}</Text>
        </View>
        {item.jobId && <ChevronRight size={14} color={Colors.textMuted} />}
      </TouchableOpacity>
    );
  }, [handlePress, filteredNotifications.length]);

  return (
    <View style={styles.container}>
      <View style={[styles.driverHeader, { paddingTop: insets.top + 12 }]}>
        <View style={styles.driverHeaderRow}>
          <View>
            <Text style={styles.headerTitle}>Notifications</Text>
            <Text style={styles.headerSubtitle}>
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </Text>
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.markAllBtn}
              onPress={handleMarkAllRead}
              activeOpacity={0.7}
            >
              <CheckCircle size={14} color={Colors.textInverse} />
              <Text style={styles.markAllText}>Read all</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.driverFilterBar}>
        {DRIVER_FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.driverFilterTab, activeFilter === f.key && styles.driverFilterTabActive]}
            onPress={() => {
              setActiveFilter(f.key);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.driverFilterLabel, activeFilter === f.key && styles.driverFilterLabelActive]}>
              {f.label}
            </Text>
            {filterCounts[f.key] > 0 && (
              <View style={[styles.driverFilterCount, activeFilter === f.key && styles.driverFilterCountActive]}>
                <Text style={[styles.driverFilterCountText, activeFilter === f.key && styles.driverFilterCountTextActive]}>
                  {filterCounts[f.key]}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredNotifications}
        renderItem={renderNotification}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <BellRing size={44} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptySubtitle}>
              {activeFilter === 'unread'
                ? 'You\'re all caught up!'
                : activeFilter === 'sla_warning'
                  ? 'No SLA alerts right now'
                  : 'No job notifications to show'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

export default function ActivityScreen() {
  const { userRole } = useAuth();
  if (userRole === 'driver') return <DriverNotificationsScreen />;
  return <CustomerActivityScreen />;
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
  driverHeader: {
    backgroundColor: Colors.navy,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  driverHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.navyLight,
    padding: 2,
    borderRadius: 8,
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: Colors.customerPrimary,
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
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    marginTop: 4,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  driverFilterBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  driverFilterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.surfaceAlt,
    gap: 4,
  },
  driverFilterTabActive: {
    backgroundColor: Colors.primary,
  },
  driverFilterLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  driverFilterLabelActive: {
    color: Colors.textInverse,
  },
  driverFilterCount: {
    backgroundColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
  },
  driverFilterCountActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  driverFilterCountText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
  },
  driverFilterCountTextActive: {
    color: Colors.textInverse,
  },
  list: {
    padding: 16,
    paddingBottom: 24,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 14,
    gap: 12,
  },
  activityRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  mapContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  activitySubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  activityRight: {
    alignItems: 'flex-end',
  },
  activityTime: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  activityAmount: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.purple,
    marginTop: 2,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 14,
    gap: 12,
    borderRadius: 0,
  },
  notifUnread: {
    backgroundColor: '#F0F7FF',
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  notifContent: {
    flex: 1,
  },
  notifTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
    flex: 1,
  },
  notifTitleUnread: {
    fontWeight: '700' as const,
  },
  severityBadge: {
    backgroundColor: Colors.dangerLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  severityText: {
    fontSize: 9,
    fontWeight: '800' as const,
    color: Colors.danger,
    letterSpacing: 0.3,
  },
  severityWarning: {
    backgroundColor: Colors.warningLight,
  },
  severityWarningText: {
    color: '#92400E',
  },
  notifMessage: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 3,
    lineHeight: 17,
  },
  notifTime: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
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
    textAlign: 'center' as const,
    paddingHorizontal: 32,
  },
});
