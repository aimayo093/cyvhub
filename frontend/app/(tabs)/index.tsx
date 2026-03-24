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
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import { useJobs } from '@/providers/JobsProvider';
import { useDeliveries } from '@/providers/DeliveriesProvider';
import { useCarrier } from '@/providers/CarrierProvider';
import JobCard from '@/components/JobCard';
import MapView from '@/components/MapView';
const MOCK_PLATFORM_STATS = {
  activeJobs: 245,
  completedJobs: 1284,
  totalJobs: 1550,
  activeDrivers: 182,
  totalDrivers: 215,
  totalCustomers: 450,
  totalBusinesses: 320,
  monthlyRevenue: 1250000,
  totalRevenue: 15400000,
  avgDeliveryTime: '2h 15m',
};

const MOCK_USERS: any[] = [
  { id: '1', name: 'James Wilson', role: 'driver', status: 'ACTIVE', lastActive: '2 mins ago' },
  { id: '2', name: 'Sarah Jenkins', role: 'customer', status: 'ACTIVE', lastActive: '15 mins ago' },
  { id: '3', name: 'Mike Thompson', role: 'driver', status: 'OFFLINE', lastActive: '2 hours ago' },
  { id: '4', name: 'Emma Davis', role: 'customer', status: 'SUSPENDED', lastActive: '1 day ago' },
];

const MOCK_REVENUE_CHART: any[] = [
  { month: 'Sep', amount: 980000 },
  { month: 'Oct', amount: 1050000 },
  { month: 'Nov', amount: 1120000 },
  { month: 'Dec', amount: 1250000 },
  { month: 'Jan', amount: 1180000 },
  { month: 'Feb', amount: 1250000 },
];

const MOCK_CARRIER_EARNINGS = {
  totalRevenue: 45250,
  paidOut: 38000,
  pendingPayment: 7250,
  completedJobs: 842,
  avgPerJob: 53.74,
  period: 'October 2023',
};

const MOCK_CARRIER_MONTHLY_EARNINGS: any[] = [
  { month: 'Aug', revenue: 38000, jobs: 710 },
  { month: 'Sep', revenue: 41500, jobs: 780 },
  { month: 'Oct', revenue: 45250, jobs: 842 },
];

const MOCK_CARRIER_PERFORMANCE: any[] = [
  { month: 'Aug', onTimePercent: 96.5, slaCompliance: 98.2, completedPercent: 100, jobsCompleted: 710, revenue: 38000 },
  { month: 'Sep', onTimePercent: 97.2, slaCompliance: 98.8, completedPercent: 99.8, jobsCompleted: 780, revenue: 41500 },
  { month: 'Oct', onTimePercent: 98.1, slaCompliance: 99.1, completedPercent: 99.9, jobsCompleted: 842, revenue: 45250 },
];

const MOCK_LIVE_ACTIVITY: any[] = [
  { id: '1', type: 'job_completed', title: 'Delivery Completed', description: 'Job #CYV-8942 finished by Driver D-412', severity: 'success', timestamp: new Date(Date.now() - 300000).toISOString() },
  { id: '2', type: 'alert', title: 'Traffic Delay', description: 'Heavy traffic on M4 Eastbound causing 15m delay', severity: 'warning', timestamp: new Date(Date.now() - 1200000).toISOString() },
  { id: '3', type: 'new_booking', title: 'New Urgent Booking', description: 'TechCorp requested immediate pickup from LHR', severity: 'info', timestamp: new Date(Date.now() - 2400000).toISOString() },
  { id: '4', type: 'sla_breach', title: 'SLA Breach Risk', description: 'Job #CYV-8910 is 30 mins behind schedule', severity: 'danger', timestamp: new Date(Date.now() - 3600000).toISOString() },
];

const MOCK_SLA_RISK_PREDICTIONS: any[] = [
  { id: '1', jobNumber: 'CYV-8910', currentStatus: 'IN_TRANSIT', riskLevel: 'CRITICAL', probability: 92, predictedDelayMins: 45, reason: 'Severe accident on M25 + Driver hours limit approaching', suggestedAction: 'Dispatch backup driver from Reading area (12 mins away)', route: 'London → Birmingham' },
  { id: '2', jobNumber: 'CYV-8922', currentStatus: 'PICKED_UP', riskLevel: 'HIGH', probability: 78, predictedDelayMins: 25, reason: 'Unexpected road closure on primary route', suggestedAction: 'Reroute via A40 (adds 8 miles, saves 25 mins)', route: 'Oxford → Bristol' },
  { id: '3', jobNumber: 'CYV-8935', currentStatus: 'EN_ROUTE_TO_PICKUP', riskLevel: 'MEDIUM', probability: 45, predictedDelayMins: 10, reason: 'Slight congestion at pickup location', suggestedAction: 'Notify customer of minor delay', route: 'Manchester → Leeds' },
];

const MOCK_ANOMALY_ALERTS: any[] = [
  { id: '1', title: 'Unusual Route Deviation', description: 'Driver D-412 deviating 15 miles from optimal route. Fuel efficiency dropping.', severity: 'WARNING', timestamp: new Date().toISOString(), type: 'ROUTE', acknowledged: false },
  { id: '2', title: 'Volume Spike Expected', description: 'Historical data + weather patterns predict 40% surge in requests in North West region between 14:00-18:00 today.', severity: 'INFO', timestamp: new Date().toISOString(), type: 'DEMAND', acknowledged: false },
  { id: '3', title: 'Potential SLA Breach Cluster', description: '3 jobs heading to same industrial park in Birmingham are all trending late due to localized event.', severity: 'CRITICAL', timestamp: new Date().toISOString(), type: 'SLA', acknowledged: false },
];

const MOCK_BUSINESS_PROFILE = {
  companyName: 'TechCorp Ltd',
  registrationNumber: 'CRN-92837465',
  vatNumber: 'GB123456789',
  industry: 'Technology Manufacturing',
  billingTerms: 'Net 30',
  creditLimit: 15000,
  creditUsed: 4250.50,
  primaryContact: {
    name: 'Sarah Jenkins',
    email: 'sarah.j@techcorp.example.com',
    phone: '+44 (0) 20 7123 4567',
    role: 'Procurement Director'
  }
};

const MOCK_CUSTOMER_INVOICES: any[] = [
  {
    id: '1',
    invoiceNumber: 'INV-2023-001',
    date: new Date(Date.now() - 86400000 * 5).toISOString(),
    dueDate: new Date(Date.now() + 86400000 * 25).toISOString(),
    subtotal: 1041.67,
    vatAmount: 208.33,
    amount: 1250.00,
    status: 'PENDING',
    description: 'Monthly Logistics Retainer - October',
    items: 4,
  },
  {
    id: '2',
    invoiceNumber: 'INV-2023-002',
    date: new Date(Date.now() - 86400000 * 15).toISOString(),
    dueDate: new Date(Date.now() + 86400000 * 15).toISOString(),
    subtotal: 375.42,
    vatAmount: 75.08,
    amount: 450.50,
    status: 'PAID',
    description: 'Emergency Same-Day Delivery Surcharge',
    items: 1,
  },
  {
    id: '3',
    invoiceNumber: 'INV-2023-003',
    date: new Date(Date.now() - 86400000 * 45).toISOString(),
    dueDate: new Date(Date.now() - 86400000 * 15).toISOString(),
    subtotal: 2666.67,
    vatAmount: 533.33,
    amount: 3200.00,
    status: 'OVERDUE',
    description: 'Quarterly Dedicated Fleet Allocation',
    items: 12,
  },
];

const MOCK_CUSTOMER_ANALYTICS = {
  totalSpendYTD: 42500,
  spendChangePct: 12.5,
  avgCostPerDelivery: 85.40,
  costChangePct: -4.2,
  topRoutes: [
    { origin: 'London HQ', destination: 'Manchester Hub', volume: 145, avgCost: 210 },
    { origin: 'London HQ', destination: 'Birmingham Depot', volume: 98, avgCost: 145 },
    { origin: 'Reading Site', destination: 'Bristol Center', volume: 56, avgCost: 95 },
  ],
  spendByService: [
    { service: 'Same Day', amount: 25000, percentage: 59 },
    { service: 'Next Day', amount: 12500, percentage: 29 },
    { service: 'Scheduled', amount: 5000, percentage: 12 },
  ],
  slaByMonth: [
    { month: 'Jan', compliance: 98.5, target: 95 },
    { month: 'Feb', compliance: 97.2, target: 95 },
    { month: 'Mar', compliance: 99.1, target: 95 },
    { month: 'Apr', compliance: 96.8, target: 95 },
    { month: 'May', compliance: 98.9, target: 95 },
    { month: 'Jun', compliance: 99.5, target: 95 },
  ],
  emissionsMonthly: [
    { month: 'Jan', kgCO2: 1250, offset: 1250 },
    { month: 'Feb', kgCO2: 1100, offset: 1100 },
    { month: 'Mar', kgCO2: 1350, offset: 1350 },
    { month: 'Apr', kgCO2: 950, offset: 950 },
    { month: 'May', kgCO2: 1420, offset: 1420 },
    { month: 'Jun', kgCO2: 1180, offset: 1180 },
  ],
};

const MOCK_AI_SUMMARY = {
  monthlySummary: "Your logistics efficiency improved by 4.2% this month. Spending on 'Same Day' services decreased, indicating better forward planning. Carbon emissions are fully offset, maintaining your green tier status. 2 minor SLA breaches were recorded on the London-Manchester route due to severe weather events.",
  recommendations: [
    { id: '1', title: 'Route Optimization', description: 'Consolidating Tuesday and Thursday Reading-Bristol runs could save approx £450/month.', impact: 'High', type: 'cost' },
    { id: '2', title: 'Service Downgrade', description: '45% of "Same Day" bookings to Birmingham arrive outside office hours. Switching these to "Next Day AM" will reduce costs without impacting operational availability.', impact: 'Medium', type: 'efficiency' },
    { id: '3', title: 'Warehouse Cutoff', description: 'Moving your London HQ pickup cutoff time from 16:30 to 15:45 will improve on-time loading metrics by an estimated 12%.', impact: 'Medium', type: 'performance' }
  ]
};

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
    <View style={styles.container}>
      <View style={[styles.driverHeader, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.driverName}>{driver?.firstName ?? 'Driver'}</Text>
          </View>
          <View style={styles.statusPill}>
            <View style={[styles.statusIndicator, { backgroundColor: driver?.currentStatus === 'AVAILABLE' ? Colors.success : Colors.warning }]} />
            <Text style={styles.statusLabel}>
              {driver?.currentStatus === 'AVAILABLE' ? 'Online' : driver?.currentStatus?.replace('_', ' ') ?? 'Offline'}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Zap size={16} color={Colors.warning} />
            <Text style={styles.statValue}>{activeJobs.length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Clock size={16} color={Colors.primary} />
            <Text style={styles.statValue}>{availableJobs.length}</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
          <View style={styles.statCard}>
            <CheckCircle size={16} color={Colors.success} />
            <Text style={styles.statValue}>{completedJobs.length}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <TrendingUp size={16} color={Colors.purple} />
            <Text style={styles.statValue}>{driver?.rating ?? 0}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {currentJob && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Current Job</Text>
              <Navigation size={16} color={Colors.primary} />
            </View>
            <JobCard job={currentJob} onPress={() => handleJobPress(currentJob.id)} />
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: getNextActionColor(currentJob.status) }]}
                onPress={handleAdvanceStatus}
                activeOpacity={0.8}
              >
                <Text style={styles.actionButtonText}>{getNextActionLabel(currentJob.status)}</Text>
                <ChevronRight size={18} color={Colors.textInverse} />
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}

        {availableJobs.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Available Jobs</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/jobs' as any)}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            {availableJobs.slice(0, 2).map(job => (
              <JobCard key={job.id} job={job} onPress={() => handleJobPress(job.id)} compact />
            ))}
          </View>
        )}

        {!currentJob && availableJobs.length === 0 && (
          <View style={styles.emptyState}>
            <Truck size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySubtitle}>No active or available jobs right now. Check back soon.</Text>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

function CustomerHome() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { customer } = useAuth();
  const { activeDeliveries, completedDeliveries } = useDeliveries();
  const [refreshing, setRefreshing] = useState(false);
  const bizProfile = MOCK_BUSINESS_PROFILE;
  const overdueInvoices = MOCK_CUSTOMER_INVOICES.filter((inv: any) => inv.status === 'OVERDUE');
  const pendingInvoices = MOCK_CUSTOMER_INVOICES.filter((inv: any) => inv.status === 'PENDING');
  const latestSla = MOCK_CUSTOMER_ANALYTICS.slaByMonth[MOCK_CUSTOMER_ANALYTICS.slaByMonth.length - 1];
  const totalEmissions = MOCK_CUSTOMER_ANALYTICS.emissionsMonthly[MOCK_CUSTOMER_ANALYTICS.emissionsMonthly.length - 1];

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

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
      <View style={[styles.customerHeader, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.customerName}>{customer?.firstName ?? 'there'}</Text>
          </View>
          <View style={styles.customerAvatar}>
            <Text style={styles.customerAvatarText}>
              {customer?.firstName?.[0] ?? 'U'}{customer?.lastName?.[0] ?? ''}
            </Text>
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

        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>


          <View style={styles.quickStatsRow}>
            <TouchableOpacity style={styles.quickStatCard} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(tabs)/deliveries' as any); }} activeOpacity={0.7}>
              <Package size={20} color={Colors.customerPrimary} />
              <Text style={styles.quickStatValue}>{activeDeliveries.length}</Text>
              <Text style={styles.quickStatLabel}>Active</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickStatCard} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(tabs)/deliveries' as any); }} activeOpacity={0.7}>
              <CheckCircle size={20} color={Colors.success} />
              <Text style={styles.quickStatValue}>{completedDeliveries.length}</Text>
              <Text style={styles.quickStatLabel}>Completed</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickStatCard} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(tabs)/financials' as any); }} activeOpacity={0.7}>
              <TrendingUp size={20} color={Colors.purple} />
              <Text style={styles.quickStatValue}>{customer?.totalDeliveries ?? 0}</Text>
              <Text style={styles.quickStatLabel}>Total</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.custDashRow}>
            <TouchableOpacity style={[styles.custDashCard, { borderLeftColor: latestSla.compliance >= latestSla.target ? Colors.success : Colors.warning }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/customer-analytics' as any); }} activeOpacity={0.7}>
              <Text style={styles.custDashLabel}>SLA Compliance</Text>
              <Text style={[styles.custDashValue, { color: latestSla.compliance >= latestSla.target ? Colors.success : Colors.warning }]}>{latestSla.compliance}%</Text>
              <Text style={styles.custDashSub}>Target: {latestSla.target}%</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.custDashCard, { borderLeftColor: overdueInvoices.length > 0 ? Colors.danger : Colors.customerPrimary }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(tabs)/financials' as any); }} activeOpacity={0.7}>
              <Text style={styles.custDashLabel}>Outstanding</Text>
              <Text style={styles.custDashValue}>£{(pendingInvoices.reduce((s: number, i: any) => s + i.amount, 0) + overdueInvoices.reduce((s: number, i: any) => s + i.amount, 0)).toLocaleString()}</Text>
              {overdueInvoices.length > 0 && <Text style={[styles.custDashSub, { color: Colors.danger }]}>{overdueInvoices.length} overdue</Text>}
            </TouchableOpacity>
          </View>

          <View style={styles.custDashRow}>
            <TouchableOpacity style={[styles.custDashCard, { borderLeftColor: '#10B981' }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/customer-analytics' as any); }} activeOpacity={0.7}>
              <Text style={styles.custDashLabel}>Emissions</Text>
              <Text style={styles.custDashValue}>{totalEmissions.kgCO2} kg</Text>
              <Text style={styles.custDashSub}>CO₂ this month</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.custDashCard, { borderLeftColor: Colors.customerPrimary }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/customer-ai' as any); }} activeOpacity={0.7}>
              <Text style={styles.custDashLabel}>AI Insights</Text>
              <Brain size={22} color={Colors.customerPrimary} />
              <Text style={styles.custDashSub}>Ask AI anything</Text>
            </TouchableOpacity>
          </View>

          {activeDeliveries.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Active Deliveries</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/deliveries' as any)}>
                  <Text style={[styles.seeAll, { color: Colors.customerPrimary }]}>See all</Text>
                </TouchableOpacity>
              </View>

              {activeDeliveries.slice(0, 2).map(delivery => (
                <TouchableOpacity
                  key={delivery.id}
                  style={styles.activeDeliveryCard}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push({ pathname: '/delivery-detail' as any, params: { id: delivery.id } });
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.activeDeliveryTop}>
                    <View style={styles.trackingBadge}>
                      <Package size={12} color={Colors.customerPrimary} />
                      <Text style={styles.trackingText}>{delivery.trackingNumber}</Text>
                    </View>
                    <View style={[styles.miniStatus, {
                      backgroundColor: delivery.status === 'IN_TRANSIT' ? '#DBEAFE' : '#FEF3C7',
                    }]}>
                      <Text style={[styles.miniStatusText, {
                        color: delivery.status === 'IN_TRANSIT' ? Colors.primary : Colors.warning,
                      }]}>
                        {delivery.status === 'IN_TRANSIT' ? 'In Transit' : 'Confirmed'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.activeDeliveryRoute}>
                    <MapPin size={14} color={Colors.textSecondary} />
                    <Text style={styles.activeDeliveryAddress} numberOfLines={1}>
                      {delivery.dropoffAddress}, {delivery.dropoffCity}
                    </Text>
                  </View>

                  {delivery.driverName && (
                    <View style={styles.driverInfo}>
                      <Truck size={13} color={Colors.textMuted} />
                      <Text style={styles.driverInfoText}>{delivery.driverName}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>AI Monthly Summary</Text>
              <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/customer-ai' as any); }}>
                <Text style={[styles.seeAll, { color: Colors.customerPrimary }]}>Ask AI</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.aiSummaryCard}>
              <Text style={styles.aiSummaryText} numberOfLines={4}>{MOCK_AI_SUMMARY.monthlySummary}</Text>
              <TouchableOpacity style={styles.aiSummaryBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/customer-ai' as any); }} activeOpacity={0.7}>
                <Brain size={14} color={Colors.customerPrimary} />
                <Text style={styles.aiSummaryBtnText}>View Full Summary</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity
                style={styles.quickAction}
                activeOpacity={0.7}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/(tabs)/deliveries' as any);
                }}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: '#CCFBF1' }]}>
                  <MapPin size={20} color={Colors.customerPrimary} />
                </View>
                <Text style={styles.quickActionLabel}>Track</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickAction}
                activeOpacity={0.7}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/(tabs)/customer-quotes' as any);
                }}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Clock size={20} color={Colors.warning} />
                </View>
                <Text style={styles.quickActionLabel}>Quotes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickAction}
                activeOpacity={0.7}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/customer-analytics' as any);
                }}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: '#DBEAFE' }]}>
                  <BarChart3 size={20} color={Colors.primary} />
                </View>
                <Text style={styles.quickActionLabel}>Analytics</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickAction}
                activeOpacity={0.7}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/support' as any);
                }}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: '#EDE9FE' }]}>
                  <Shield size={20} color={Colors.purple} />
                </View>
                <Text style={styles.quickActionLabel}>Support</Text>
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
  const { activeJobs } = useJobs();
  const [refreshing, setRefreshing] = useState(false);
  const stats = MOCK_PLATFORM_STATS;
  const recentUsers = MOCK_USERS.slice(0, 4);
  const maxRevenue = Math.max(...MOCK_REVENUE_CHART.map((r: any) => r.amount));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

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
      <View style={[styles.adminHeader, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.adminName}>{admin?.firstName ?? 'Admin'}</Text>
          </View>
          <View style={styles.adminBadge}>
            <Shield size={14} color={Colors.adminPrimary} />
            <Text style={styles.adminBadgeText}>Admin</Text>
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

          <View style={styles.adminStatsGrid}>
            <TouchableOpacity style={[styles.adminStatCard, { borderLeftColor: Colors.primary }]} onPress={() => router.push('/(tabs)/users' as any)} activeOpacity={0.7}>
              <View style={[styles.adminStatIcon, { backgroundColor: Colors.primary + '15' }]}>
                <Truck size={18} color={Colors.primary} />
              </View>
              <Text style={styles.adminStatValue}>{stats.totalDrivers}</Text>
              <Text style={styles.adminStatLabel}>Total Drivers</Text>
              <Text style={styles.adminStatSub}>{stats.activeDrivers} active</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.adminStatCard, { borderLeftColor: Colors.customerPrimary }]} onPress={() => router.push('/(tabs)/businesses' as any)} activeOpacity={0.7}>
              <View style={[styles.adminStatIcon, { backgroundColor: Colors.customerPrimary + '15' }]}>
                <Users size={18} color={Colors.customerPrimary} />
              </View>
              <Text style={styles.adminStatValue}>{stats.totalCustomers}</Text>
              <Text style={styles.adminStatLabel}>Customers</Text>
              <Text style={styles.adminStatSub}>{stats.totalBusinesses} businesses</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.adminStatCard, { borderLeftColor: Colors.adminPrimary }]} onPress={() => router.push('/(tabs)/manage-jobs' as any)} activeOpacity={0.7}>
              <View style={[styles.adminStatIcon, { backgroundColor: Colors.adminPrimary + '15' }]}>
                <Briefcase size={18} color={Colors.adminPrimary} />
              </View>
              <Text style={styles.adminStatValue}>{stats.activeJobs}</Text>
              <Text style={styles.adminStatLabel}>Active Jobs</Text>
              <Text style={styles.adminStatSub}>{stats.completedJobs} completed</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.adminStatCard, { borderLeftColor: Colors.success }]} onPress={() => router.push('/(tabs)/analytics' as any)} activeOpacity={0.7}>
              <View style={[styles.adminStatIcon, { backgroundColor: Colors.success + '15' }]}>
                <DollarSign size={18} color={Colors.success} />
              </View>
              <Text style={styles.adminStatValue}>£{(stats.monthlyRevenue / 1000).toFixed(1)}k</Text>
              <Text style={styles.adminStatLabel}>Monthly Rev</Text>
              <Text style={styles.adminStatSub}>£{(stats.totalRevenue / 1000).toFixed(0)}k total</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.adminStatCard, { borderLeftColor: Colors.purple }]} onPress={() => router.push('/(tabs)/cms' as any)} activeOpacity={0.7}>
              <View style={[styles.adminStatIcon, { backgroundColor: Colors.purple + '15' }]}>
                <Layout size={18} color={Colors.purple} />
              </View>
              <Text style={styles.adminStatValue}>CMS</Text>
              <Text style={styles.adminStatLabel}>Website Editor</Text>
              <Text style={styles.adminStatSub}>Marketing pages</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Revenue Trend</Text>
            <BarChart3 size={16} color={Colors.adminPrimary} />
          </View>
          <View style={styles.chartCard}>
            <View style={styles.chartBars}>
              {MOCK_REVENUE_CHART.map((item: any) => {
                const heightPct = (item.amount / maxRevenue) * 100;
                return (
                  <View key={item.month} style={styles.chartBarWrap}>
                    <View style={styles.chartBarContainer}>
                      <View
                        style={[
                          styles.chartBar,
                          {
                            height: `${heightPct}%`,
                            backgroundColor: item.month === 'Feb' ? Colors.adminPrimary : Colors.adminPrimary + '40',
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.chartLabel}>{item.month}</Text>
                    <Text style={styles.chartValue}>£{(item.amount / 1000).toFixed(0)}k</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Platform Health</Text>
            <Activity size={16} color={Colors.success} />
          </View>
          <View style={styles.healthGrid}>
            <View style={styles.healthCard}>
              <Text style={styles.healthValue}>{stats.avgDeliveryTime}</Text>
              <Text style={styles.healthLabel}>Avg Delivery</Text>
            </View>
            <View style={styles.healthCard}>
              <Text style={styles.healthValue}>{((stats.completedJobs / stats.totalJobs) * 100).toFixed(1)}%</Text>
              <Text style={styles.healthLabel}>Success Rate</Text>
            </View>
            <View style={styles.healthCard}>
              <Text style={styles.healthValue}>{stats.totalJobs}</Text>
              <Text style={styles.healthLabel}>Total Jobs</Text>
            </View>
          </View>
        </View>

        {MOCK_SLA_RISK_PREDICTIONS.filter((p: any) => p.riskLevel === 'CRITICAL' || p.riskLevel === 'HIGH').length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>SLA Risk Alerts</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/ai-panel' as any)}>
                <Text style={[styles.seeAll, { color: Colors.adminPrimary }]}>View all</Text>
              </TouchableOpacity>
            </View>
            {MOCK_SLA_RISK_PREDICTIONS.filter((p: any) => p.riskLevel === 'CRITICAL' || p.riskLevel === 'HIGH').slice(0, 2).map((pred: any) => (
              <View key={pred.id} style={[styles.alertCard, { borderLeftColor: pred.riskLevel === 'CRITICAL' ? '#991B1B' : Colors.danger }]}>
                <View style={styles.alertTop}>
                  <AlertTriangle size={14} color={pred.riskLevel === 'CRITICAL' ? '#991B1B' : Colors.danger} />
                  <Text style={styles.alertJobNumber}>{pred.jobNumber}</Text>
                  <View style={[styles.alertRiskBadge, { backgroundColor: pred.riskLevel === 'CRITICAL' ? '#FEE2E2' : Colors.dangerLight }]}>
                    <Text style={[styles.alertRiskText, { color: pred.riskLevel === 'CRITICAL' ? '#991B1B' : Colors.danger }]}>{pred.riskLevel}</Text>
                  </View>
                </View>
                <Text style={styles.alertRoute}>{pred.route}</Text>
                <Text style={styles.alertAction} numberOfLines={1}>{pred.suggestedAction}</Text>
              </View>
            ))}
          </View>
        )}

        {MOCK_ANOMALY_ALERTS.filter((a: any) => !a.acknowledged).length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>AI Warnings</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/ai-panel' as any)}>
                <Text style={[styles.seeAll, { color: Colors.adminPrimary }]}>AI Panel</Text>
              </TouchableOpacity>
            </View>
            {MOCK_ANOMALY_ALERTS.filter((a: any) => !a.acknowledged).slice(0, 2).map((alert: any) => (
              <View key={alert.id} style={styles.aiWarningCard}>
                <View style={styles.aiWarningTop}>
                  <Brain size={14} color={alert.severity === 'CRITICAL' ? Colors.danger : Colors.warning} />
                  <Text style={styles.aiWarningTitle} numberOfLines={1}>{alert.title}</Text>
                </View>
                <Text style={styles.aiWarningDesc} numberOfLines={2}>{alert.description}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Live Activity</Text>
            <Radio size={14} color={Colors.success} />
          </View>
          {MOCK_LIVE_ACTIVITY.slice(0, 6).map((evt: any) => {
            const sevColor = evt.severity === 'danger' ? Colors.danger : evt.severity === 'success' ? Colors.success : evt.severity === 'warning' ? Colors.warning : Colors.info;
            return (
              <View key={evt.id} style={styles.activityEvent}>
                <View style={[styles.activityDot, { backgroundColor: sevColor }]} />
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{evt.title}</Text>
                  <Text style={styles.activityDesc} numberOfLines={1}>{evt.description}</Text>
                </View>
                <Text style={styles.activityTime}>{new Date(evt.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
            );
          })}
        </View>



        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Users</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/users' as any)}>
              <Text style={[styles.seeAll, { color: Colors.adminPrimary }]}>View all</Text>
            </TouchableOpacity>
          </View>
          {recentUsers.map((user: any) => (
            <View key={user.id} style={styles.recentUserCard}>
              <View style={[styles.recentUserAvatar, {
                backgroundColor: user.role === 'driver' ? Colors.primary + '15' : Colors.customerPrimary + '15',
              }]}>
                <Text style={[styles.recentUserInitial, {
                  color: user.role === 'driver' ? Colors.primary : Colors.customerPrimary,
                }]}>
                  {user.name[0]}
                </Text>
              </View>
              <View style={styles.recentUserInfo}>
                <Text style={styles.recentUserName}>{user.name}</Text>
                <Text style={styles.recentUserRole}>{user.role}</Text>
              </View>
              <View style={[styles.recentUserStatus, {
                backgroundColor: user.status === 'ACTIVE' ? Colors.successLight : user.status === 'SUSPENDED' ? Colors.dangerLight : Colors.warningLight,
              }]}>
                <Text style={[styles.recentUserStatusText, {
                  color: user.status === 'ACTIVE' ? Colors.success : user.status === 'SUSPENDED' ? Colors.danger : Colors.warning,
                }]}>
                  {user.status}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView >
    </View >
  );
}

function CarrierDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { carrier } = useAuth();
  const { assignedJobs, activeJobs, completedJobs, availableJobs, fleet } = useCarrier();
  const [refreshing, setRefreshing] = useState(false);
  const earnings = MOCK_CARRIER_EARNINGS;
  const monthlyData = MOCK_CARRIER_MONTHLY_EARNINGS;
  const maxRevenue = Math.max(...monthlyData.map((r: any) => r.revenue));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const activeFleetCount = fleet.filter(v => v.status === 'ACTIVE').length;

  return (
    <View style={styles.container}>
      <View style={[styles.carrierHeader, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.carrierName}>{carrier?.tradingName ?? 'Carrier'}</Text>
          </View>
          <View style={styles.carrierBadge}>
            <Container size={14} color={Colors.carrierPrimary} />
            <Text style={styles.carrierBadgeText}>Carrier</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Zap size={16} color={Colors.carrierPrimary} />
            <Text style={styles.statValue}>{activeJobs.length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Clock size={16} color={Colors.warning} />
            <Text style={styles.statValue}>{availableJobs.length}</Text>
            <Text style={styles.statLabel}>Offers</Text>
          </View>
          <View style={styles.statCard}>
            <CheckCircle size={16} color={Colors.success} />
            <Text style={styles.statValue}>{completedJobs.length}</Text>
            <Text style={styles.statLabel}>Done</Text>
          </View>
          <View style={styles.statCard}>
            <TrendingUp size={16} color={Colors.purple} />
            <Text style={styles.statValue}>{carrier?.slaScore ?? 0}%</Text>
            <Text style={styles.statLabel}>SLA</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.carrierPrimary} />
        }
      >
        <View style={styles.carrierQuickStats}>
          <View style={[styles.carrierQuickCard, { borderLeftColor: Colors.carrierPrimary }]}>
            <Text style={styles.carrierQuickValue}>£{earnings.totalRevenue.toLocaleString()}</Text>
            <Text style={styles.carrierQuickLabel}>This Month</Text>
          </View>
          <View style={[styles.carrierQuickCard, { borderLeftColor: Colors.warning }]}>
            <Text style={styles.carrierQuickValue}>£{earnings.pendingPayment.toLocaleString()}</Text>
            <Text style={styles.carrierQuickLabel}>Pending</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Revenue Trend</Text>
            <BarChart3 size={16} color={Colors.carrierPrimary} />
          </View>
          <View style={styles.chartCard}>
            <View style={styles.chartBars}>
              {monthlyData.map((item) => {
                const heightPct = (item.revenue / maxRevenue) * 100;
                return (
                  <View key={item.month} style={styles.chartBarWrap}>
                    <View style={styles.chartBarContainer}>
                      <View
                        style={[
                          styles.chartBar,
                          {
                            height: `${heightPct}%`,
                            backgroundColor: item.month === 'Feb' ? Colors.carrierPrimary : Colors.carrierPrimary + '40',
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.chartLabel}>{item.month}</Text>
                    <Text style={styles.chartValue}>£{(item.revenue / 1000).toFixed(1)}k</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Fleet Overview</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/fleet' as any)}>
              <Text style={[styles.seeAll, { color: Colors.carrierPrimary }]}>Manage</Text>
            </TouchableOpacity>
          </View>
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
              <Text style={styles.carrierFleetLabel}>Maintenance</Text>
            </View>
          </View>
        </View>

        {availableJobs.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Job Offers</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/jobs' as any)}>
                <Text style={[styles.seeAll, { color: Colors.carrierPrimary }]}>See all</Text>
              </TouchableOpacity>
            </View>
            {availableJobs.slice(0, 2).map(job => (
              <TouchableOpacity
                key={job.id}
                style={styles.carrierJobOffer}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push({ pathname: '/job-detail' as any, params: { id: job.id } });
                }}
                activeOpacity={0.7}
              >
                <View style={styles.carrierJobOfferTop}>
                  <Text style={styles.carrierJobOfferNumber}>{job.jobNumber}</Text>
                  <View style={[
                    styles.carrierJobPriority,
                    { backgroundColor: job.priority === 'URGENT' ? Colors.dangerLight : Colors.infoLight },
                  ]}>
                    <Text style={[
                      styles.carrierJobPriorityText,
                      { color: job.priority === 'URGENT' ? Colors.danger : Colors.info },
                    ]}>{job.priority}</Text>
                  </View>
                </View>
                <View style={styles.carrierJobOfferRoute}>
                  <MapPin size={13} color={Colors.textSecondary} />
                  <Text style={styles.carrierJobOfferRouteText}>{job.pickupCity} → {job.dropoffCity}</Text>
                </View>
                <View style={styles.carrierJobOfferBottom}>
                  <Text style={styles.carrierJobOfferVehicle}>{job.vehicleType}</Text>
                  <Text style={styles.carrierJobOfferPrice}>£{job.calculatedPrice.toFixed(2)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Performance</Text>
            <Activity size={16} color={Colors.success} />
          </View>
          <View style={styles.healthGrid}>
            <View style={styles.healthCard}>
              <Text style={styles.healthValue}>{carrier?.rating ?? 0}</Text>
              <Text style={styles.healthLabel}>Rating</Text>
            </View>
            <View style={styles.healthCard}>
              <Text style={styles.healthValue}>{carrier?.totalJobsCompleted ?? 0}</Text>
              <Text style={styles.healthLabel}>Total Jobs</Text>
            </View>
            <View style={styles.healthCard}>
              <Text style={styles.healthValue}>{carrier?.slaScore ?? 0}%</Text>
              <Text style={styles.healthLabel}>SLA Score</Text>
            </View>
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
});
