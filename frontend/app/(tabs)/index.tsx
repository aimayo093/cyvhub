import React, { useCallback, useRef, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Truck,
  Clock,
  CheckCircle,
  ChevronRight,
  Navigation,
  Zap,
  TrendingUp,
  Package,
  Plus,
  MapPin,
  ArrowRight,
  Shield,
  Users,
  Briefcase,
  DollarSign,
  BarChart3,
  Activity,
  Container,
  AlertTriangle,
  Brain,
  Radio,
  Layout,
  Tag,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import { useJobs } from '@/providers/JobsProvider';
import { useDeliveries } from '@/providers/DeliveriesProvider';
import { useCarrier } from '@/providers/CarrierProvider';
import { apiClient } from '@/services/api';
import JobCard from '@/components/JobCard';
import MapView from '@/components/MapView';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

function DriverDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { driver } = useAuth();
  const { currentJob, activeJobs, availableJobs, completedJobs, advanceJobStatus } = useJobs();
  const [refreshing, setRefreshing] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (currentJob) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.04, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [currentJob, pulseAnim]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const handleJobPress = useCallback((jobId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/job-detail' as any, params: { id: jobId } });
  }, [router]);

  const handleAdvanceStatus = useCallback(() => {
    if (currentJob) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      advanceJobStatus(currentJob.id);
    }
  }, [currentJob, advanceJobStatus]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getNextActionLabel = (status: string): string => {
    const labels: Record<string, string> = {
      EN_ROUTE_TO_PICKUP: 'Arrived at Pickup',
      ARRIVED_PICKUP: 'Confirm Pickup',
      PICKED_UP: 'Start Driving to Dropoff',
      EN_ROUTE_TO_DROPOFF: 'Arrived at Dropoff',
      ARRIVED_DROPOFF: 'Complete Delivery',
      DRIVER_ACCEPTED: 'Start Driving to Pickup',
    };
    return labels[status] ?? 'Update Status';
  };

  const getNextActionColor = (status: string): string => {
    const colors: Record<string, string> = {
      EN_ROUTE_TO_PICKUP: Colors.info,
      ARRIVED_PICKUP: Colors.purple,
      PICKED_UP: '#7C3AED',
      EN_ROUTE_TO_DROPOFF: Colors.success,
      ARRIVED_DROPOFF: Colors.success,
      DRIVER_ACCEPTED: Colors.warning,
    };
    return colors[status] ?? Colors.primary;
  };

  return (
    <ScrollView 
        style={styles.container} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
    >
      <View style={[styles.premiumHeader, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{driver?.firstName || 'Hero'} 👋</Text>
          </View>
          <TouchableOpacity style={styles.aiButton} onPress={() => router.push('/driver-ai' as any)}>
            <Brain size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsStrip}>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{activeJobs.length || 0}</Text>
            <Text style={styles.statLab}>Active</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{availableJobs.length}</Text>
            <Text style={styles.statLab}>Available</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{completedJobs.length || 0}</Text>
            <Text style={styles.statLab}>Today</Text>
          </View>
        </View>
      </View>
      <View style={styles.content}>
        {/* AI QUICK LAUNCH */}
        <TouchableOpacity 
            style={styles.premiumAiCard} 
            onPress={() => router.push('/driver-ai' as any)}
            activeOpacity={0.9}
        >
            <View style={styles.aiGlow} />
            <Brain size={28} color="#FFF" />
            <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={styles.aiCardTitle}>CYVHUB AI Pilot</Text>
                <Text style={styles.aiCardSub}>Need help with a route or earnings? Ask me anything.</Text>
            </View>
            <ChevronRight size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        {currentJob ? (
          <View style={styles.activeSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.liveIndicator}>
                 <View style={styles.pulseDot} />
                 <Text style={styles.liveText}>LIVE DELIVERY</Text>
              </View>
            </View>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <JobCard job={currentJob} onPress={() => handleJobPress(currentJob.id)} isCurrent isDark />
            </Animated.View>
            <TouchableOpacity style={styles.actionBtnPrimary} onPress={handleAdvanceStatus}>
                <Navigation size={20} color="#FFF" style={{ marginRight: 10 }} />
                <Text style={styles.actionBtnText}>{getNextActionLabel(currentJob.status)}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

      </View>
    </ScrollView>
  );
}

function CustomerHome() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { customer } = useAuth();
  const { activeDeliveries, completedDeliveries } = useDeliveries();
  const [refreshing, setRefreshing] = useState(false);
  
  // Dynamic analytics state
  const [analytics, setAnalytics] = useState<any>({
    spend: 0,
    sla: 100,
    emissions: 0,
    aiSummary: "Start booking deliveries to generate your first logistics performance summary.",
  });

  const loadCustomerData = useCallback(async () => {
    try {
      const res = await apiClient('/analytics/earnings');
      if (res && res.data) {
        setAnalytics((prev: any) => ({
          ...prev,
          spend: res.data.totalSpend || 0,
          sla: res.data.slaCompliance || 100,
          aiSummary: res.data.aiSummary || prev.aiSummary
        }));
      }
    } catch (e) {
      console.warn('Failed to load customer analytics', e);
    }
  }, []);

  useEffect(() => {
    loadCustomerData();
  }, [loadCustomerData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCustomerData();
    setRefreshing(false);
  }, [loadCustomerData]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const mapCenter = { latitude: 51.6000, longitude: -3.6000 };

  const mapMarkers = useMemo(() => {
    const markers: any[] = [];
    activeDeliveries.forEach((del, i) => {
      const latOffset = i * 0.03;
      const lngOffset = i * 0.03;
      markers.push({
        id: `pickup-${del.id}`,
        latitude: 51.6320 - latOffset,
        longitude: -3.9500 + lngOffset,
        title: `Pickup: ${del.trackingNumber}`,
        type: 'pickup',
      });
      if (del.status === 'IN_TRANSIT' && del.driverName) {
        markers.push({
          id: `driver-${del.id}`,
          latitude: 51.6000 - latOffset,
          longitude: -3.7500 + lngOffset,
          title: `Driver: ${del.driverName}`,
          type: 'driver',
        });
      }
    });
    return markers;
  }, [activeDeliveries]);

  return (
    <View style={styles.container}>
      <View style={[styles.premiumHeader, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{customer?.firstName ?? 'Customer'}</Text>
          </View>
          <TouchableOpacity 
            style={styles.aiButton}
            onPress={() => router.push('/customer-ai' as any)}
          >
            <Brain size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsStrip}>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{activeDeliveries.length}</Text>
            <Text style={styles.statLab}>ACTIVE</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statVal}>100%</Text>
            <Text style={styles.statLab}>SLA</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statVal}>£{(analytics.spend / 1000).toFixed(1)}k</Text>
            <Text style={styles.statLab}>SPEND</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.customerPrimary} />
        }
      >
        <View style={styles.mapHeroContainer}>
          <MapView
            center={mapCenter}
            zoom={9}
            markers={mapMarkers}
            height={320}
          />
          <View style={styles.mapHeroOverlay}>
            <TouchableOpacity
              style={styles.mapBookButton}
              activeOpacity={0.85}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/book-delivery' as any);
              }}
            >
              <View style={styles.mapBookButtonContent}>
                <View style={styles.mapBookIconCircle}>
                  <Package size={22} color="#FFFFFF" />
                </View>
                <View style={styles.mapBookText}>
                  <Text style={styles.mapBookTitle}>Book a Delivery</Text>
                  <Text style={styles.mapBookSubtitle}>Where to?</Text>
                </View>
                <View style={styles.mapBookAction}>
                  <Text style={styles.mapBookActionText}>Start</Text>
                  <ArrowRight size={16} color={Colors.customerPrimary} />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          <TouchableOpacity 
            style={styles.premiumAiCard}
            onPress={() => router.push('/customer-ai' as any)}
            activeOpacity={0.9}
          >
            <View style={styles.aiGlow} />
            <View style={{ flex: 1, zIndex: 1 }}>
              <Text style={styles.aiCardTitle}>Logistics AI Insights</Text>
              <Text style={styles.aiCardSub}>{analytics.aiSummary}</Text>
            </View>
            <ChevronRight size={24} color="#FFF" style={{ zIndex: 1 }} />
          </TouchableOpacity>

          <View style={styles.activeSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Shipments</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/deliveries' as any)}>
                <Text style={[styles.seeAll, { color: Colors.customerPrimary }]}>View all</Text>
              </TouchableOpacity>
            </View>

            {activeDeliveries.length > 0 ? (
              activeDeliveries.slice(0, 2).map(delivery => (
                <TouchableOpacity
                  key={delivery.id}
                  style={styles.activeDeliveryCard}
                  onPress={() => router.push({ pathname: '/delivery-detail' as any, params: { id: delivery.id } })}
                >
                  <View style={styles.liveIndicator}>
                    <View style={styles.pulseDot} />
                    <Text style={styles.liveText}>LIVE TRACKING</Text>
                  </View>
                  <View style={styles.activeDeliveryTop}>
                    <Text style={styles.trackingText}>{delivery.trackingNumber}</Text>
                    <Text style={styles.miniStatusText}>{delivery.status}</Text>
                  </View>
                  <Text style={styles.activeDeliveryAddress}>{delivery.dropoffAddress}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Package size={40} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>No active shipments</Text>
                <Text style={styles.emptySubtitle}>Your live deliveries will appear here.</Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Elite Services</Text>
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/book-delivery' as any)}>
                <View style={[styles.quickActionIcon, { backgroundColor: Colors.customerPrimary + '15' }]}>
                  <Package size={24} color={Colors.customerPrimary} />
                </View>
                <Text style={styles.quickActionLabel}>New Booking</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/customer-analytics' as any)}>
                <View style={[styles.quickActionIcon, { backgroundColor: Colors.primary + '15' }]}>
                  <BarChart3 size={24} color={Colors.primary} />
                </View>
                <Text style={styles.quickActionLabel}>Insights</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/support' as any)}>
                <View style={[styles.quickActionIcon, { backgroundColor: Colors.purple + '15' }]}>
                  <Shield size={24} color={Colors.purple} />
                </View>
                <Text style={styles.quickActionLabel}>Security</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { admin } = useAuth();
  const { activeJobs, completedJobs } = useJobs();
  const [refreshing, setRefreshing] = useState(false);
  
  const [platformStats, setPlatformStats] = useState({
    totalDrivers: 0,
    activeDrivers: 0,
    totalCustomers: 0,
    totalBusinesses: 0,
    monthlyRevenue: 0,
    totalRevenue: 0
  });

  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  const [revenueChart, setRevenueChart] = useState<any[]>([]);
  const [platformHealthStats, setPlatformHealthStats] = useState({
    avgDeliveryTime: '0h 0m',
    completedJobs: 0,
    totalJobs: 0,
  });
  const [slaRiskPredictions, setSlaRiskPredictions] = useState<any[]>([]);
  const [anomalyAlerts, setAnomalyAlerts] = useState<any[]>([]);
  const [liveActivity, setLiveActivity] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);

  const loadAdminData = useCallback(async () => {
    try {
      const [analyticsRes, activityRes, anomaliesRes, risksRes] = await Promise.all([
        apiClient('/analytics/platform'),
        apiClient('/activity'),
        apiClient('/ai/anomalies'),
        apiClient('/ai/sla-risks')
      ]);

      if (analyticsRes) {
        setPlatformStats({
          totalDrivers: analyticsRes.stats?.totalDrivers || 0,
          activeDrivers: analyticsRes.stats?.activeDrivers || 0,
          totalCustomers: analyticsRes.stats?.totalCustomers || 0,
          totalBusinesses: analyticsRes.stats?.totalBusinesses || 0,
          monthlyRevenue: analyticsRes.stats?.monthlyRevenue || 0,
          totalRevenue: analyticsRes.stats?.totalRevenue || 0,
        });
        setRevenueChart(analyticsRes.analytics?.jobVolume || []);
        setRecentUsers(analyticsRes.clients || []);
      }

      if (activityRes) setLiveActivity(activityRes);
      if (anomaliesRes) setAnomalyAlerts(anomaliesRes.anomalies || []);
      if (risksRes) setSlaRiskPredictions(risksRes.risks || []);
      
      setLastUpdated(new Date());

    } catch (e) {
      console.error('Failed to load admin dashboard data', e);
    }
  }, []);

  useEffect(() => {
    loadAdminData();
    const interval = setInterval(loadAdminData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [loadAdminData]);

  const maxRevenue = useMemo(() => Math.max(...revenueChart.map((r: any) => r.amount || r.count || 0), 0) || 1000, [revenueChart]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAdminData();
    setRefreshing(false);
  }, [loadAdminData]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const mapCenter = { latitude: 51.5074, longitude: -0.1278 };

  const mapMarkers = useMemo(() => {
    const markers: any[] = [];
    activeJobs.forEach((job, i) => {
      const latOffset = i * 0.02;
      const lngOffset = i * -0.01;
      markers.push({
        id: `job-${job.id}`,
        latitude: 51.5200 + latOffset,
        longitude: -0.1100 + lngOffset,
        title: `Job: ${job.jobNumber}`,
        type: 'pickup',
      });
      markers.push({
        id: `driver-${job.id}`,
        latitude: 51.5150 + latOffset,
        longitude: -0.1050 + lngOffset,
        title: `Driver`,
        type: 'driver',
      });
    });
    return markers;
  }, [activeJobs]);

  return (
    <View style={styles.container}>
      <View style={[styles.premiumHeader, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{admin?.firstName ?? 'Admin'}</Text>
            <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
              Live Stats: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.aiButton}
            onPress={() => router.push('/admin-ai' as any)}
          >
            <Brain size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsStrip}>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{platformStats.activeDrivers}</Text>
            <Text style={styles.statLab}>ONLINE</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{activeJobs.length}</Text>
            <Text style={styles.statLab}>ACTIVE</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statVal}>£{(platformStats.monthlyRevenue / 1000).toFixed(1)}k</Text>
            <Text style={styles.statLab}>REV (M)</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.adminPrimary} />
        }
      >
        <View>
          <View style={[styles.mapHeroContainer, isWeb && SCREEN_WIDTH > 1024 && { height: 400 }]}>
            <MapView
              center={mapCenter}
              zoom={9}
              markers={mapMarkers}
              height={isWeb && SCREEN_WIDTH > 1024 ? 400 : 320}
            />
          </View>
        </View>

        <View style={styles.content}>
          <TouchableOpacity 
            style={[styles.premiumAiCard, { backgroundColor: Colors.adminPrimary + '20' }]}
            onPress={() => router.push('/admin-ai' as any)}
            activeOpacity={0.9}
          >
            <View style={[styles.aiGlow, { backgroundColor: Colors.adminPrimary }]} />
            <View style={{ flex: 1, zIndex: 1 }}>
              <Text style={styles.aiCardTitle}>Command Intelligence</Text>
              <Text style={styles.aiCardSub}>
                {anomalyAlerts.length} active anomalies. Platform stability at 99.9%.
              </Text>
            </View>
            <ChevronRight size={24} color="#FFF" style={{ zIndex: 1 }} />
          </TouchableOpacity>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>System Config</Text>
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/admin-pricing' as any)}>
                <View style={[styles.quickActionIcon, { backgroundColor: Colors.adminPrimary + '15' }]}>
                  <Tag size={24} color={Colors.adminPrimary} />
                </View>
                <Text style={styles.quickActionLabel}>Config Engine</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/admin-compliance' as any)}>
                <View style={[styles.quickActionIcon, { backgroundColor: Colors.success + '15' }]}>
                  <Shield size={24} color={Colors.success} />
                </View>
                <Text style={styles.quickActionLabel}>Compliance</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(tabs)/users' as any)}>
                <View style={[styles.quickActionIcon, { backgroundColor: Colors.info + '15' }]}>
                  <Users size={24} color={Colors.info} />
                </View>
                <Text style={styles.quickActionLabel}>Users</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>SLA Risk Monitor</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/ai-panel' as any)}>
                <Text style={[styles.seeAll, { color: Colors.adminPrimary }]}>View Analysis</Text>
              </TouchableOpacity>
            </View>
            
            {slaRiskPredictions.length > 0 ? (
              slaRiskPredictions.slice(0, 2).map((pred: any) => (
                <View key={pred.id} style={[styles.alertCard, { borderLeftColor: pred.riskLevel === 'CRITICAL' ? Colors.danger : Colors.warning }]}>
                  <View style={styles.alertTop}>
                    <AlertTriangle size={14} color={pred.riskLevel === 'CRITICAL' ? Colors.danger : Colors.warning} />
                    <Text style={styles.alertJobNumber}>{pred.jobNumber}</Text>
                    <View style={[styles.alertRiskBadge, { backgroundColor: (pred.riskLevel === 'CRITICAL' ? Colors.danger : Colors.warning) + '20' }]}>
                      <Text style={[styles.alertRiskText, { color: pred.riskLevel === 'CRITICAL' ? Colors.danger : Colors.warning }]}>{pred.riskLevel}</Text>
                    </View>
                  </View>
                  <Text style={styles.alertRoute}>{pred.route || 'Route under analysis'}</Text>
                  <Text style={styles.alertAction}>{pred.suggestedAction}</Text>
                </View>
              ))
             ) : (
                <View style={styles.aiAlertCard}>
                  <Brain size={20} color={Colors.adminPrimary} />
                  <Text style={styles.aiAlertText}>No high-priority SLA risks detected by AI guards.</Text>
                </View>
             )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>System Health</Text>
            <View style={styles.healthGrid}>
              <View style={styles.healthCard}>
                <Text style={styles.healthValue}>{platformHealthStats.avgDeliveryTime}</Text>
                <Text style={styles.healthLabel}>Avg Delivery</Text>
              </View>
              <View style={styles.healthCard}>
                <Text style={styles.healthValue}>{((platformHealthStats.completedJobs / (platformHealthStats.totalJobs || 1)) * 100).toFixed(1)}%</Text>
                <Text style={styles.healthLabel}>Success</Text>
              </View>
            </View>
          </View>

          {liveActivity.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Live Activity</Text>
              </View>
              {liveActivity.slice(0, 6).map((evt: any) => (
                <View key={evt.id} style={styles.activityEvent}>
                  <View style={[styles.activityDot, { backgroundColor: evt.severity === 'danger' ? Colors.danger : Colors.info }]} />
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>{evt.title}</Text>
                    <Text style={styles.activityDesc} numberOfLines={1}>{evt.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {recentUsers.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Users</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/users' as any)}>
                  <Text style={[styles.seeAll, { color: Colors.adminPrimary }]}>View all</Text>
                </TouchableOpacity>
              </View>
              {recentUsers.slice(0, 3).map((user: any) => (
                <View key={user.id} style={styles.recentUserCard}>
                  <View style={styles.recentUserInfo}>
                    <Text style={styles.recentUserName}>{user.name}</Text>
                    <Text style={styles.recentUserRole}>{user.role}</Text>
                  </View>
                  <View style={[styles.recentUserStatus, { backgroundColor: Colors.success + '20' }]}>
                    <Text style={[styles.recentUserStatusText, { color: Colors.success }]}>{user.status}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function CarrierDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { carrier } = useAuth();
  const { assignedJobs, activeJobs, completedJobs, availableJobs, fleet } = useCarrier();
  const [refreshing, setRefreshing] = useState(false);
  const [earnings, setEarnings] = useState({
    totalRevenue: 0,
    paidOut: 0,
    pendingPayment: 0,
    completedJobs: 0,
    avgPerJob: 0,
    period: 'Current Period'
  });
  const [monthlyEarnings, setMonthlyEarnings] = useState<any[]>([]);
  const maxRevenue = useMemo(() => Math.max(...monthlyEarnings.map((r: any) => r.revenue), 0) || 1000, [monthlyEarnings]);

  const loadCarrierEarnings = useCallback(async () => {
    try {
      const res = await apiClient('/analytics/earnings');
      if (res && res.data) {
        setEarnings(res.data);
      }
    } catch (e) {
      console.warn('Failed to load carrier earnings', e);
    }
  }, []);

  useEffect(() => {
    loadCarrierEarnings();
  }, [loadCarrierEarnings]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCarrierEarnings();
    setRefreshing(false);
  }, [loadCarrierEarnings]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const activeFleetCount = fleet.filter(v => v.status === 'ACTIVE').length;

  return (
    <View style={styles.container}>
      <View style={[styles.premiumHeader, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{carrier?.tradingName ?? 'Carrier'}</Text>
          </View>
          <TouchableOpacity 
            style={styles.aiButton}
            onPress={() => router.push('/carrier-ai' as any)}
          >
            <Brain size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsStrip}>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{activeJobs.length}</Text>
            <Text style={styles.statLab}>ACTIVE</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{availableJobs.length}</Text>
            <Text style={styles.statLab}>OFFERS</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{carrier?.rating ?? 5.0}</Text>
            <Text style={styles.statLab}>RATING</Text>
          </View>
        </View>
      </View>

        <TouchableOpacity
          style={styles.aiQuickLaunch}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/carrier-ai' as any);
          }}
          activeOpacity={0.8}
        >
          <View style={styles.aiQuickLaunchLeft}>
            <View style={[styles.aiIconCircle, { backgroundColor: Colors.carrierPrimary + '20' }]}>
              <Brain size={20} color={Colors.carrierPrimary} />
            </View>
            <View>
              <Text style={styles.aiQuickLaunchTitle}>Carrier AI Assistant</Text>
              <Text style={styles.aiQuickLaunchSubtitle}>Get insights on your fleet & performance</Text>
            </View>
          </View>
          <ArrowRight size={18} color={Colors.textMuted} />
        </TouchableOpacity>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.carrierPrimary} />
        }
      >
        <View style={styles.content}>
          <TouchableOpacity 
            style={[styles.premiumAiCard, { backgroundColor: Colors.carrierPrimary + '20' }]}
            onPress={() => router.push('/carrier-ai' as any)}
            activeOpacity={0.9}
          >
            <View style={[styles.aiGlow, { backgroundColor: Colors.carrierPrimary }]} />
            <View style={{ flex: 1, zIndex: 1 }}>
              <Text style={styles.aiCardTitle}>Fleet Optimization</Text>
              <Text style={styles.aiCardSub}>
                SLA health at 98.4%. 2 high-margin routes available for your fleet.
              </Text>
            </View>
            <ChevronRight size={24} color="#FFF" style={{ zIndex: 1 }} />
          </TouchableOpacity>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Jobs</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/jobs' as any)}>
                <Text style={[styles.seeAll, { color: Colors.carrierPrimary }]}>Manage Fleet</Text>
              </TouchableOpacity>
            </View>

            {activeJobs.length > 0 ? (
              activeJobs.slice(0, 3).map(job => (
                <JobCard 
                  key={job.id} 
                  job={job} 
                  onPress={() => router.push({ pathname: '/job-detail' as any, params: { id: job.id } })}
                  isCurrent={true}
                  isDark={false}
                />
              ))
            ) : (
              <View style={styles.emptyActivityCard}>
                <Truck size={32} color={Colors.textMuted} />
                <Text style={styles.emptyActivityText}>No active jobs currently monitored.</Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
             <Text style={styles.sectionTitle}>Fleet Health</Text>
             <View style={styles.carrierFleetRow}>
                <View style={styles.carrierFleetCard}>
                  <Truck size={20} color={Colors.carrierPrimary} />
                  <Text style={styles.carrierFleetValue}>{fleet.length}</Text>
                  <Text style={styles.carrierFleetLabel}>Total</Text>
                </View>
                <View style={styles.carrierFleetCard}>
                  <CheckCircle size={20} color={Colors.success} />
                  <Text style={styles.carrierFleetValue}>{activeFleetCount}</Text>
                  <Text style={styles.carrierFleetLabel}>Active</Text>
                </View>
                <View style={styles.carrierFleetCard}>
                  <Clock size={20} color={Colors.warning} />
                  <Text style={styles.carrierFleetValue}>{fleet.filter(v => v.status === 'MAINTENANCE').length}</Text>
                  <Text style={styles.carrierFleetLabel}>Srvc</Text>
                </View>
             </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Smart Route Offers</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/jobs' as any)}>
                <Text style={[styles.seeAll, { color: Colors.carrierPrimary }]}>View all</Text>
              </TouchableOpacity>
            </View>
            
            {availableJobs.slice(0, 2).map(job => (
              <TouchableOpacity 
                key={job.id} 
                style={styles.carrierJobOffer}
                onPress={() => router.push({ pathname: '/job-detail' as any, params: { id: job.id } })}
                activeOpacity={0.7}
              >
                <View style={styles.carrierJobOfferTop}>
                  <Text style={styles.carrierJobOfferNumber}>{job.jobNumber}</Text>
                  <Text style={styles.carrierJobOfferPrice}>£{job.calculatedPrice?.toFixed(2) || '---'}</Text>
                </View>
                <Text style={styles.carrierJobOfferRouteText}>{job.pickupCity} → {job.dropoffCity}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

export default function HomeScreen() {
  const { userRole } = useAuth();
  if (userRole === 'driver') return <DriverDashboard />;
  if (userRole === 'admin') return <AdminDashboard />;
  if (userRole === 'carrier') return <CarrierDashboard />;
  return <CustomerHome />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  carrierHeader: {
    backgroundColor: Colors.navy,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  carrierName: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.textInverse,
    marginTop: 2,
  },
  carrierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.carrierPrimary + '18',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },
  carrierBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.carrierPrimary,
  },
  carrierQuickStats: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  carrierQuickCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 3,
  },
  carrierQuickValue: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  carrierQuickLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
    marginTop: 4,
  },
  carrierFleetRow: {
    flexDirection: 'row',
    gap: 10,
  },
  carrierFleetCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  carrierFleetValue: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  carrierFleetLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  carrierJobOffer: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  carrierJobOfferTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  carrierJobOfferNumber: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  carrierJobPriority: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  carrierJobPriorityText: {
    fontSize: 10,
    fontWeight: '700' as const,
  },
  carrierJobOfferRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  carrierJobOfferRouteText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  carrierJobOfferBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  carrierJobOfferVehicle: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  carrierJobOfferPrice: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.carrierPrimary,
  },
  driverHeader: {
    backgroundColor: Colors.navy,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  customerHeader: {
    backgroundColor: Colors.navy,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  adminHeader: {
    backgroundColor: Colors.navy,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  driverName: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.textInverse,
    marginTop: 2,
  },
  customerName: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.textInverse,
    marginTop: 2,
  },
  adminName: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.textInverse,
    marginTop: 2,
  },
  customerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.customerPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerAvatarText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.adminPrimary + '18',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },
  adminBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.adminPrimary,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.navyLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  desktopTopRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
    alignItems: 'stretch',
    minHeight: 400,
  },
  desktopMap: {
    flex: 2,
    marginBottom: 0,
    height: '100%',
  },
  desktopStatsGrid: {
    flex: 1,
    marginBottom: 0,
    alignContent: 'flex-start',
  },
  mapHeroContainer: {
    width: '100%',
    height: 320,
    position: 'relative',
    marginBottom: 20,
  },
  mapHeroOverlay: {
    position: 'absolute',
    bottom: -15,
    left: 20,
    right: 20,
    zIndex: 10,
    shadowColor: Colors.customerPrimaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  mapBookButton: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
  },
  mapBookButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  mapBookIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.customerPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  mapBookText: {
    flex: 1,
  },
  mapBookTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  mapBookSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  mapBookAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.customerPrimary + '15',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  mapBookActionText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.customerPrimary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.navyLight,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.textInverse,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    height: 52,
    gap: 8,
    marginTop: 4,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.textInverse,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  bookCard: {
    backgroundColor: Colors.customerPrimary,
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
  },
  bookCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  bookIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookCardText: {
    flex: 1,
  },
  bookCardTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  bookCardSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  quickStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  quickStatLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  activeDeliveryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeDeliveryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  trackingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trackingText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  miniStatus: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  miniStatusText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  activeDeliveryRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  activeDeliveryAddress: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  driverInfoText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  custDashRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  custDashCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 3,
  },
  custDashLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
    marginBottom: 4,
  },
  custDashValue: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  custDashSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  aiSummaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  aiSummaryText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginBottom: 12,
  },
  aiSummaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  aiSummaryBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.customerPrimary,
  },
  adminStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  adminStatCard: {
    flex: 1,
    minWidth: 160,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 3,
  },
  adminStatIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  adminStatValue: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  adminStatLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  adminStatSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  chartCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    gap: 8,
  },
  chartBarWrap: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  chartBarContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: '100%',
    borderRadius: 6,
    minHeight: 8,
  },
  chartLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  chartValue: {
    fontSize: 9,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  healthGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  healthCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  healthValue: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  healthLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
    marginTop: 4,
  },
  recentUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  recentUserAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentUserInitial: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  recentUserInfo: {
    flex: 1,
  },
  recentUserName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  recentUserRole: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'capitalize' as const,
    marginTop: 1,
  },
  recentUserStatus: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  recentUserStatusText: {
    fontSize: 10,
    fontWeight: '700' as const,
  },
  alertCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 3,
  },
  alertTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  alertJobNumber: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.text,
    flex: 1,
  },
  alertRiskBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  alertRiskText: {
    fontSize: 9,
    fontWeight: '800' as const,
  },
  alertRoute: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  alertAction: {
    fontSize: 11,
    color: Colors.info,
    fontWeight: '500' as const,
  },
  aiWarningCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.warningLight,
  },
  aiWarningTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  aiWarningTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  aiWarningDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  activityEvent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  activityDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  activityTime: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  roadmapCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  roadmapHeader: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  roadmapTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  roadmapSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  roadmapContent: {
    padding: 14,
    gap: 16,
  },
  roadmapCol: {
    borderLeftWidth: 3,
    paddingLeft: 12,
  },
  roadmapColHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  roadmapColTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  roadmapItem: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  aiAlertCard: {
    backgroundColor: Colors.adminPrimary + '10',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.adminPrimary + '20',
    marginTop: 10,
  },
  aiAlertText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  emptyActivityCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    marginTop: 10,
  },
  emptyActivityText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  aiQuickLaunch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  aiQuickLaunchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  aiIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiQuickLaunchTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  aiQuickLaunchSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  premiumHeader: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    backgroundColor: '#0F172A',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  userName: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  aiButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  statLab: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
    fontWeight: '600' as const,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  content: {
    padding: 20,
  },
  premiumAiCard: {
    backgroundColor: Colors.primary,
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  aiGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  aiCardTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  aiCardSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  activeSection: {
    marginBottom: 24,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: 6,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: '#EF4444',
    letterSpacing: 1,
  },
  actionBtnPrimary: {
    backgroundColor: '#0F172A',
    height: 56,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
