import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  ChevronRight,
  ArrowRight,
  Plus,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import { QuoteStatus } from '@/types';
import { apiClient } from '@/services/api';

export const MOCK_QUOTES: any[] = [
  {
    id: '1',
    quoteNumber: 'QT-2023-001',
    businessName: 'TechCorp Ltd',
    pickupCity: 'London',
    dropoffCity: 'Manchester',
    vehicleType: 'Small Van',
    jobType: 'B2B',
    slaRequirement: 'Same Day',
    distanceKm: 320,
    estimatedPrice: 145.00,
    status: 'PENDING' as QuoteStatus,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    expiresAt: new Date(Date.now() + 86400000 * 6).toISOString(),
    notes: 'Please ensure fragile handling.',
  },
  {
    id: '2',
    quoteNumber: 'QT-2023-002',
    businessName: 'BuildCo Supplies',
    pickupCity: 'Birmingham',
    dropoffCity: 'Bristol',
    vehicleType: 'Large Van',
    jobType: 'Construction',
    slaRequirement: 'Next Day',
    distanceKm: 140,
    estimatedPrice: 95.50,
    finalPrice: 85.00,
    status: 'CONVERTED' as QuoteStatus,
    convertedJobId: 'JOB-9921',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    expiresAt: new Date(Date.now() + 86400000 * 4).toISOString(),
  },
  {
    id: '3',
    quoteNumber: 'QT-2023-003',
    businessName: 'MedEquip Pro',
    pickupCity: 'Leeds',
    dropoffCity: 'Newcastle',
    vehicleType: 'Medium Van',
    jobType: 'Medical',
    slaRequirement: 'Standard',
    distanceKm: 160,
    estimatedPrice: 110.00,
    status: 'REJECTED' as QuoteStatus,
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    expiresAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

type QuoteFilter = 'all' | 'PENDING' | 'APPROVED' | 'CONVERTED';

function getQuoteStatusStyle(status: QuoteStatus) {
  switch (status) {
    case 'PENDING': return { color: Colors.warning, bg: Colors.warningLight, Icon: Clock, label: 'Pending' };
    case 'APPROVED': return { color: Colors.success, bg: Colors.successLight, Icon: CheckCircle, label: 'Approved' };
    case 'REJECTED': return { color: Colors.danger, bg: Colors.dangerLight, Icon: XCircle, label: 'Rejected' };
    case 'EXPIRED': return { color: Colors.textMuted, bg: '#F1F5F9', Icon: AlertTriangle, label: 'Expired' };
    case 'CONVERTED': return { color: Colors.primary, bg: '#DBEAFE', Icon: ArrowRight, label: 'Converted' };
    default: return { color: Colors.textMuted, bg: '#F1F5F9', Icon: Clock, label: status };
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function QuotesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';
  const accent = Colors.adminPrimary;

  const [activeFilter, setActiveFilter] = useState<QuoteFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [quotes, setQuotes] = useState<any[]>([]);

  const fetchQuotes = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await apiClient('/quotes');
      setQuotes(res.quotes || []);
    } catch (err) {
      console.error('Failed to fetch quotes:', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const filteredQuotes = useMemo(() => {
    if (activeFilter === 'all') return quotes;
    return quotes.filter((q: any) => q.status === activeFilter);
  }, [activeFilter, quotes]);

  const onRefresh = useCallback(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const handleQuoteTap = useCallback((quote: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/(tabs)/quotes/${quote.id}` as any);
  }, [router]);

  const handleNewQuote = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/book-delivery' as any);
  }, [router]);

  const filters: { key: QuoteFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'PENDING', label: 'Pending' },
    { key: 'APPROVED', label: 'Approved' },
    { key: 'CONVERTED', label: 'Converted' },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Quotes</Text>
            <Text style={styles.headerSubtitle}>
              {isAdmin ? 'Manage quotation requests' : 'Request and track quotes'}
            </Text>
          </View>
          {isAdmin && (
            <TouchableOpacity style={[styles.newBtn, { backgroundColor: accent }]} onPress={handleNewQuote} activeOpacity={0.7}>
              <Plus size={14} color="#FFFFFF" />
              <Text style={styles.newBtnText}>New</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {filters.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, activeFilter === f.key && { backgroundColor: accent }]}
              onPress={() => { setActiveFilter(f.key); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, activeFilter === f.key && styles.filterChipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} />}
      >
        {filteredQuotes.map((quote: any) => {
          const statusStyle = getQuoteStatusStyle(quote.status);
          const StatusIcon = statusStyle.Icon;
          return (
            <TouchableOpacity
              key={quote.id}
              style={styles.quoteCard}
              onPress={() => handleQuoteTap(quote)}
              activeOpacity={0.7}
            >
              <View style={styles.quoteTop}>
                <View style={styles.quoteNumberWrap}>
                  <FileText size={13} color={accent} />
                  <Text style={styles.quoteNumber}>{quote.quoteNumber}</Text>
                </View>
                <View style={[styles.quoteStatus, { backgroundColor: statusStyle.bg }]}>
                  <StatusIcon size={11} color={statusStyle.color} />
                  <Text style={[styles.quoteStatusText, { color: statusStyle.color }]}>{statusStyle.label}</Text>
                </View>
              </View>

              <Text style={styles.quoteBusiness}>{quote.businessName}</Text>

              <View style={styles.quoteRoute}>
                <View style={[styles.routeDot, { backgroundColor: Colors.success }]} />
                <Text style={styles.routeCity}>{quote.pickupCity}</Text>
                <ChevronRight size={12} color={Colors.textMuted} />
                <View style={[styles.routeDot, { backgroundColor: Colors.danger }]} />
                <Text style={styles.routeCity}>{quote.dropoffCity}</Text>
              </View>

              <View style={styles.quoteBottom}>
                <Text style={styles.quoteDetail}>{quote.vehicleType} · {quote.jobType}</Text>
                <Text style={styles.quoteSla}>{quote.slaRequirement}</Text>
                <Text style={styles.quotePrice}>£{(quote.finalPrice ?? quote.estimatedPrice).toFixed(2)}</Text>
              </View>

              <View style={styles.quoteDates}>
                <Text style={styles.dateText}>Created: {formatDate(quote.createdAt)}</Text>
                <Text style={styles.dateText}>Expires: {formatDate(quote.expiresAt)}</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {filteredQuotes.length === 0 && (
          <View style={styles.emptyState}>
            <FileText size={40} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No quotes found</Text>
            <Text style={styles.emptySubtitle}>No quotes match the selected filter</Text>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.navy, paddingHorizontal: 20, paddingBottom: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  headerTitle: { fontSize: 22, fontWeight: '800' as const, color: Colors.textInverse },
  headerSubtitle: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  newBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, gap: 4 },
  newBtnText: { fontSize: 13, fontWeight: '700' as const, color: '#FFFFFF' },
  filterRow: { gap: 8 },
  filterChip: { backgroundColor: Colors.navyLight, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  filterChipText: { fontSize: 13, fontWeight: '600' as const, color: Colors.textMuted },
  filterChipTextActive: { color: '#FFFFFF' },
  body: { flex: 1 },
  bodyContent: { padding: 16 },
  quoteCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  quoteTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  quoteNumberWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  quoteNumber: { fontSize: 13, fontWeight: '700' as const, color: Colors.text },
  quoteStatus: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, gap: 4 },
  quoteStatusText: { fontSize: 10, fontWeight: '700' as const },
  quoteBusiness: { fontSize: 14, fontWeight: '600' as const, color: Colors.text, marginBottom: 8 },
  quoteRoute: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  routeDot: { width: 8, height: 8, borderRadius: 4 },
  routeCity: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' as const },
  quoteBottom: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  quoteDetail: { fontSize: 11, color: Colors.textMuted },
  quoteSla: { fontSize: 11, color: Colors.info, fontWeight: '500' as const },
  quotePrice: { fontSize: 16, fontWeight: '800' as const, color: Colors.text, marginLeft: 'auto' },
  quoteDates: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  dateText: { fontSize: 10, color: Colors.textMuted },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700' as const, color: Colors.text },
  emptySubtitle: { fontSize: 13, color: Colors.textSecondary },
});
