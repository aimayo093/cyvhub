import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  FileText,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRightCircle,
  ChevronDown,
  MapPin,
  Truck,
  Shield,
  Send,
  X,
  Package as PackageIcon,
  Trash2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { Quote, QuoteStatus } from '@/types';
import { useAuth } from '@/providers/AuthProvider';

const MOCK_SAVED_LOCATIONS = [
  { id: '1', label: 'London HQ', city: 'London', postcode: 'EC1A 1BB' },
  { id: '2', label: 'Manchester Hub', city: 'Manchester', postcode: 'M1 1AA' },
  { id: '3', label: 'Birmingham Depot', city: 'Birmingham', postcode: 'B1 1AA' },
  { id: '4', label: 'Bristol Site', city: 'Bristol', postcode: 'BS1 1AA' },
];

import { apiClient } from '@/services/api';

type FilterTab = 'all' | 'PENDING' | 'APPROVED' | 'CONVERTED' | 'EXPIRED';

const STATUS_CONFIG: Record<QuoteStatus, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  PENDING: { label: 'Pending', color: Colors.warning, bg: '#FEF3C7', icon: Clock },
  APPROVED: { label: 'Approved', color: Colors.success, bg: '#D1FAE5', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: Colors.danger, bg: '#FEE2E2', icon: XCircle },
  EXPIRED: { label: 'Expired', color: Colors.textMuted, bg: '#F3F4F6', icon: Clock },
  CONVERTED: { label: 'Job Created', color: Colors.customerPrimary, bg: '#CCFBF1', icon: ArrowRightCircle },
};

const VEHICLE_TYPES = ['Small Van', 'Medium Van', 'Large Van', 'HGV'];
const JOB_TYPES = ['IT Equipment', 'Construction', 'Medical', 'Furniture', 'Office Supplies', 'General Freight'];
const SLA_OPTIONS = ['Standard 24h', 'Next-day by noon', 'Same-day delivery', 'Urgent 4h'];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function CustomerQuotesScreen() {
  const { customer } = useAuth();
  const [insets, setInsets] = useState(useSafeAreaInsets()); // Fix insets issues on some platforms
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [showNewQuote, setShowNewQuote] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [pickupCity, setPickupCity] = useState('London');
  const [pickupPostcode, setPickupPostcode] = useState('');
  const [dropoffCity, setDropoffCity] = useState('');
  const [dropoffPostcode, setDropoffPostcode] = useState('');
  const [vehicleType, setVehicleType] = useState('Small Van');
  const [jobType, setJobType] = useState('General Freight');
  const [slaRequirement, setSlaRequirement] = useState('Standard 24h');
  const [notes, setNotes] = useState('');
  const [showVehiclePicker, setShowVehiclePicker] = useState(false);
  const [showJobTypePicker, setShowJobTypePicker] = useState(false);
  const [showSlaPicker, setShowSlaPicker] = useState(false);

  const [parcels, setParcels] = useState<any[]>([
    { lengthCm: '30', widthCm: '30', heightCm: '30', weightKg: '5', quantity: '1', description: '' }
  ]);
  const [estimatedPrice, setEstimatedPrice] = useState<number>(0);
  const [calculationError, setCalculationError] = useState<string>('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculations, setCalculations] = useState<any>(null);

  const fetchPrice = useCallback(async () => {
    if (!pickupPostcode || !dropoffPostcode || parcels.length === 0) {
      setEstimatedPrice(0);
      setCalculationError('');
      return;
    }

    setIsCalculating(true);
    setCalculationError('');
    try {
      const response = await apiClient('/quotes/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupPostcode,
          dropoffPostcode,
          items: parcels.map(p => ({
            lengthCm: parseFloat(p.lengthCm) || 0,
            widthCm: parseFloat(p.widthCm) || 0,
            heightCm: parseFloat(p.heightCm) || 0,
            weightKg: parseFloat(p.weightKg) || 0,
            quantity: parseInt(p.quantity, 10) || 1
          })),
          businessId: customer?.businessAccountId || undefined
        })
      });

      if (response && response.quotes) {
        setCalculations(response);
        const quote = response.quotes.find((q: any) => q.vehicleName === vehicleType);
        if (quote) {
          setEstimatedPrice(quote.totalExVat);
          setCalculationError('');
        } else if (response.error) {
          setCalculationError(response.error);
          setEstimatedPrice(0);
        } else {
          setCalculationError(`No pricing for ${vehicleType}`);
          setEstimatedPrice(0);
        }
      }
    } catch (e: any) {
      setCalculationError('Route/Pricing unavailable');
      setEstimatedPrice(0);
    } finally {
      setIsCalculating(false);
    }
  }, [pickupPostcode, dropoffPostcode, parcels, vehicleType, customer]);

  useEffect(() => {
    if (showNewQuote) {
      fetchPrice();
    }
  }, [fetchPrice, showNewQuote]);

  const filteredQuotes = useMemo(() => {
    if (filter === 'all') return quotes;
    return quotes.filter(q => q.status === filter);
  }, [filter, quotes]);

  const fetchQuotes = useCallback(async () => {
    try {
      setRefreshing(true);
      const data = await apiClient('/quotes');
      setQuotes(data.quotes || []);
    } catch (error) {
      console.error('Failed to load quotes:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const onRefresh = useCallback(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const handleApproveQuote = useCallback((quoteId: string) => {
    const quote = quotes.find(q => q.id === quoteId);
    if (!quote) return;
    const price = quote.finalPrice ?? quote.estimatedPrice;
    Alert.alert(
      'Accept Quote',
      `Accept the quoted price of £${price.toFixed(2)} for ${quote.pickupCity} → ${quote.dropoffCity}?`,
      [
        { text: 'Decline', style: 'cancel' },
        {
          text: 'Accept Price',
          onPress: async () => {
            try {
              await apiClient(`/quotes/${quoteId}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status: 'APPROVED' })
              });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              fetchQuotes();
              Alert.alert('Quote Accepted', 'You can now convert this quote to a delivery job.');
            } catch (err) {
              Alert.alert('Error', 'Failed to approve quote on the server.');
            }
          },
        },
      ]
    );
  }, [quotes, fetchQuotes]);

  const handleRejectQuote = useCallback((quoteId: string) => {
    Alert.alert('Decline Quote', 'Are you sure you want to decline this quote?', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Decline',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          setQuotes(prev => prev.map(q =>
            q.id === quoteId ? { ...q, status: 'EXPIRED' as QuoteStatus } : q
          ));
        },
      },
    ]);
  }, []);

  const handleConvertToJob = useCallback((quoteId: string) => {
    Alert.alert('Convert to Job', 'Create a delivery job from this approved quote?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Create Job',
        onPress: () => {
          const quote = quotes.find(q => q.id === quoteId);
          if (!quote) return;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          // Navigate to booking with pre-filled info
          router.push({
            pathname: '/book-delivery' as any,
            params: {
              prePickup: quote.pickupPostcode,
              preDropoff: quote.dropoffPostcode,
              preVehicle: quote.vehicleType,
              quoteId: quote.id,
              prePrice: (quote.finalPrice || quote.estimatedPrice).toString()
            }
          });
        },
      },
    ]);
  }, [quotes, router]);

  const handleSubmitQuote = async () => {
    if (!dropoffPostcode || !pickupPostcode) {
      Alert.alert('Missing Info', 'Please provide both postcodes.');
      return;
    }
    if (estimatedPrice <= 0 && !calculationError) {
      Alert.alert('Incomplete', 'Price not yet calculated.');
      return;
    }

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const quantity = parcels.reduce((sum, p) => sum + (parseInt(p.quantity, 10) || 1), 0);
      
      const payload = {
        quoteNumber: `QT-${Date.now().toString().slice(-6)}`,
        customerId: customer?.id ?? 'guest',
        businessId: customer?.businessAccountId || undefined,
        pickupPostcode,
        dropoffPostcode,
        vehicleType,
        distanceKm: calculations?.distanceMiles * 1.609 || 0, // Convert miles to km for consistency
        estimatedCost: estimatedPrice,
        quantity,
        parcels: parcels.map(p => ({
            lengthCm: parseFloat(p.lengthCm) || 0,
            widthCm: parseFloat(p.widthCm) || 0,
            heightCm: parseFloat(p.heightCm) || 0,
            weightKg: parseFloat(p.weightKg) || 0,
            quantity: parseInt(p.quantity, 10) || 1,
            description: p.description || ''
        }))
      };

      await apiClient('/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Quote request submitted successfully.');
      setShowNewQuote(false);
      fetchQuotes();
    } catch (error: any) {
      console.error('Failed to submit quote:', error);
      Alert.alert('Error', error.message || 'Failed to submit quote request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuote = useCallback(({ item }: { item: Quote }) => {
    const config = STATUS_CONFIG[item.status];
    const StatusIcon = config.icon;
    const isApproved = item.status === 'APPROVED';

    return (
      <View style={styles.quoteCard}>
        <View style={styles.quoteHeader}>
          <Text style={styles.quoteNumber}>{item.quoteNumber}</Text>
          <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
            <StatusIcon size={12} color={config.color} />
            <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
          </View>
        </View>

        <View style={styles.quoteRoute}>
          <MapPin size={14} color={Colors.textSecondary} />
          <Text style={styles.quoteRouteText}>{item.pickupCity} → {item.dropoffCity}</Text>
        </View>

        <View style={styles.quoteDetails}>
          <View style={styles.quoteDetail}>
            <Truck size={12} color={Colors.textMuted} />
            <Text style={styles.quoteDetailText}>{item.vehicleType}</Text>
          </View>
          <View style={styles.quoteDetail}>
            <Shield size={12} color={Colors.textMuted} />
            <Text style={styles.quoteDetailText}>{item.slaRequirement}</Text>
          </View>
          <View style={styles.quoteDetail}>
            <Clock size={12} color={Colors.textMuted} />
            <Text style={styles.quoteDetailText}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>

        <View style={styles.quoteFooter}>
          <View>
            <Text style={styles.quotePriceLabel}>
              {item.finalPrice ? 'Final Price' : item.estimatedPrice > 0 ? 'Estimated' : 'Awaiting Price'}
            </Text>
            <Text style={styles.quotePrice}>
              {item.finalPrice ? `£${item.finalPrice.toFixed(2)}` : item.estimatedPrice > 0 ? `£${item.estimatedPrice.toFixed(2)}` : '—'}
            </Text>
          </View>
          {item.notes && (
            <Text style={styles.quoteNotes} numberOfLines={1}>{item.notes}</Text>
          )}
        </View>

        {item.status === 'PENDING' && item.estimatedPrice > 0 && (
          <View style={styles.quoteActions}>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => handleApproveQuote(item.id)}
              activeOpacity={0.8}
            >
              <CheckCircle size={15} color="#FFFFFF" />
              <Text style={styles.acceptButtonText}>Accept Price</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.declineButton}
              onPress={() => handleRejectQuote(item.id)}
              activeOpacity={0.8}
            >
              <XCircle size={15} color={Colors.danger} />
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>
          </View>
        )}

        {isApproved && (
          <TouchableOpacity
            style={styles.convertButton}
            onPress={() => handleConvertToJob(item.id)}
            activeOpacity={0.8}
          >
            <ArrowRightCircle size={16} color="#FFFFFF" />
            <Text style={styles.convertButtonText}>Convert to Job</Text>
          </TouchableOpacity>
        )}

        <View style={styles.quoteExpiry}>
          <Text style={styles.quoteExpiryText}>
            {item.status === 'EXPIRED' ? 'Expired' : `Expires ${formatDate(item.expiresAt)}`}
          </Text>
        </View>
      </View>
    );
  }, [handleConvertToJob, handleApproveQuote, handleRejectQuote]);

  const renderPickerOptions = (options: string[], selected: string, onSelect: (v: string) => void, onClose: () => void) => (
    <View style={styles.pickerOptions}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt}
          style={[styles.pickerOption, selected === opt && styles.pickerOptionActive]}
          onPress={() => { onSelect(opt); onClose(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
        >
          <Text style={[styles.pickerOptionText, selected === opt && styles.pickerOptionTextActive]}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Quotes</Text>
            <Text style={styles.headerSubtitle}>
              {quotes.filter(q => q.status === 'PENDING').length} pending · {quotes.filter(q => q.status === 'APPROVED').length} approved
            </Text>
          </View>
          <TouchableOpacity
            style={styles.newQuoteBtn}
            onPress={() => { setShowNewQuote(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
            activeOpacity={0.8}
          >
            <Plus size={18} color="#FFFFFF" />
            <Text style={styles.newQuoteBtnText}>New Quote</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.filterBar}>
        {(['all', 'PENDING', 'APPROVED', 'CONVERTED', 'EXPIRED'] as FilterTab[]).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => { setFilter(f); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          >
            <Text style={[styles.filterLabel, filter === f && styles.filterLabelActive]}>
              {f === 'all' ? 'All' : f === 'CONVERTED' ? 'Jobs' : f.charAt(0) + f.slice(1).toLowerCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredQuotes}
        renderItem={renderQuote}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.customerPrimary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <FileText size={44} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No quotes found</Text>
            <Text style={styles.emptySubtitle}>Submit a quote request to get started</Text>
          </View>
        }
      />

      <Modal visible={showNewQuote} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request a Quote</Text>
              <TouchableOpacity onPress={() => setShowNewQuote(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={styles.formSection}>
                <Text style={styles.formSectionLabel}>Pickup Location</Text>
                <View style={styles.formRow}>
                  <View style={[styles.formInput, { flex: 1 }]}>
                    <TextInput
                      style={styles.input}
                      placeholder="City"
                      placeholderTextColor={Colors.textMuted}
                      value={pickupCity}
                      onChangeText={setPickupCity}
                    />
                  </View>
                  <View style={[styles.formInput, { flex: 0.6 }]}>
                    <TextInput
                      style={styles.input}
                      placeholder="Postcode"
                      placeholderTextColor={Colors.textMuted}
                      value={pickupPostcode}
                      onChangeText={setPickupPostcode}
                      autoCapitalize="characters"
                    />
                  </View>
                </View>

                <Text style={styles.savedLabel}>Quick select:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.savedScroll}>
                  {MOCK_SAVED_LOCATIONS.map((loc: any) => (
                    <TouchableOpacity
                      key={loc.id}
                      style={[styles.savedChip, pickupCity === loc.city && pickupPostcode === loc.postcode && styles.savedChipActive]}
                      onPress={() => { setPickupCity(loc.city); setPickupPostcode(loc.postcode); }}
                    >
                      <Text style={[styles.savedChipText, pickupCity === loc.city && pickupPostcode === loc.postcode && styles.savedChipTextActive]}>{loc.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formSectionLabel}>Dropoff Location</Text>
                <View style={styles.formRow}>
                  <View style={[styles.formInput, { flex: 1 }]}>
                    <TextInput
                      style={styles.input}
                      placeholder="City"
                      placeholderTextColor={Colors.textMuted}
                      value={dropoffCity}
                      onChangeText={setDropoffCity}
                    />
                  </View>
                  <View style={[styles.formInput, { flex: 0.6 }]}>
                    <TextInput
                      style={styles.input}
                      placeholder="Postcode"
                      placeholderTextColor={Colors.textMuted}
                      value={dropoffPostcode}
                      onChangeText={setDropoffPostcode}
                      autoCapitalize="characters"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formSectionLabel}>Vehicle Type</Text>
                <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowVehiclePicker(!showVehiclePicker)}>
                  <Text style={styles.pickerBtnText}>{vehicleType}</Text>
                  <ChevronDown size={18} color={Colors.textMuted} />
                </TouchableOpacity>
                {showVehiclePicker && renderPickerOptions(VEHICLE_TYPES, vehicleType, setVehicleType, () => setShowVehiclePicker(false))}
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formSectionLabel}>Job Type</Text>
                <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowJobTypePicker(!showJobTypePicker)}>
                  <Text style={styles.pickerBtnText}>{jobType}</Text>
                  <ChevronDown size={18} color={Colors.textMuted} />
                </TouchableOpacity>
                {showJobTypePicker && renderPickerOptions(JOB_TYPES, jobType, setJobType, () => setShowJobTypePicker(false))}
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formSectionLabel}>SLA Expectation</Text>
                <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowSlaPicker(!showSlaPicker)}>
                  <Text style={styles.pickerBtnText}>{slaRequirement}</Text>
                  <ChevronDown size={18} color={Colors.textMuted} />
                </TouchableOpacity>
                {showSlaPicker && renderPickerOptions(SLA_OPTIONS, slaRequirement, setSlaRequirement, () => setShowSlaPicker(false))}
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formSectionLabel}>Parcels Information</Text>
                <View style={styles.parcelsList}>
                  {parcels.map((parcel, index) => (
                    <View key={index} style={styles.parcelBox}>
                        <View style={styles.formRow}>
                             <TextInput
                                 style={[styles.smallInput, { flex: 3 }]}
                                 placeholder="Description (Box of parts)"
                                 placeholderTextColor={Colors.textMuted}
                                 value={parcel.description}
                                 onChangeText={(v) => {
                                     const newParcels = [...parcels];
                                     newParcels[index].description = v;
                                     setParcels(newParcels);
                                 }}
                             />
                             <TextInput
                                 style={[styles.smallInput, { flex: 1 }]}
                                 placeholder="Qty"
                                 placeholderTextColor={Colors.textMuted}
                                 keyboardType="numeric"
                                 value={parcel.quantity}
                                 onChangeText={(v) => {
                                     const newParcels = [...parcels];
                                     newParcels[index].quantity = v;
                                     setParcels(newParcels);
                                 }}
                             />
                        </View>
                       <View style={styles.formRow}>
                            <TextInput
                                style={styles.smallInput}
                                placeholder="L (cm)"
                                placeholderTextColor={Colors.textMuted}
                                keyboardType="numeric"
                                value={parcel.lengthCm}
                                onChangeText={(v) => {
                                    const newParcels = [...parcels];
                                    newParcels[index].lengthCm = v;
                                    setParcels(newParcels);
                                }}
                            />
                            <TextInput
                                style={styles.smallInput}
                                placeholder="W"
                                placeholderTextColor={Colors.textMuted}
                                keyboardType="numeric"
                                value={parcel.widthCm}
                                onChangeText={(v) => {
                                    const newParcels = [...parcels];
                                    newParcels[index].widthCm = v;
                                    setParcels(newParcels);
                                }}
                            />
                            <TextInput
                                style={styles.smallInput}
                                placeholder="H"
                                placeholderTextColor={Colors.textMuted}
                                keyboardType="numeric"
                                value={parcel.heightCm}
                                onChangeText={(v) => {
                                    const newParcels = [...parcels];
                                    newParcels[index].heightCm = v;
                                    setParcels(newParcels);
                                }}
                            />
                            <TextInput
                                style={styles.smallInput}
                                placeholder="Kg"
                                placeholderTextColor={Colors.textMuted}
                                keyboardType="numeric"
                                value={parcel.weightKg}
                                onChangeText={(v) => {
                                    const newParcels = [...parcels];
                                    newParcels[index].weightKg = v;
                                    setParcels(newParcels);
                                }}
                            />
                        </View>
                        {parcels.length > 1 && (
                            <TouchableOpacity 
                                onPress={() => {
                                    const newParcels = [...parcels];
                                    newParcels.splice(index, 1);
                                    setParcels(newParcels);
                                }}
                                style={styles.removeParcelBtn}
                            >
                                <Trash2 size={14} color={Colors.danger} />
                                <Text style={styles.removeParcelText}>Remove</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                  ))}
                  <TouchableOpacity 
                    style={styles.addParcelBtn}
                    onPress={() => setParcels([...parcels, { lengthCm: '', widthCm: '', heightCm: '', weightKg: '', quantity: '1', description: '' }])}
                  >
                    <Plus size={14} color={Colors.customerPrimary} />
                    <Text style={styles.addParcelBtnText}>Add Another Parcel Type</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formSectionLabel}>Notes (Optional)</Text>
                <View style={[styles.formInput, { minHeight: 80, alignItems: 'flex-start', paddingTop: 14 }]}>
                  <TextInput
                    style={[styles.input, { textAlignVertical: 'top' }]}
                    placeholder="Additional details about your delivery needs..."
                    placeholderTextColor={Colors.textMuted}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                  />
                </View>
              </View>

              <View style={[styles.estimateCard, calculationError && styles.estimateCardError]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.estimateLabel}>
                    {calculationError ? 'Pricing Issue' : 'Estimated Quote'}
                  </Text>
                  <Text style={styles.estimateSubLabel}>
                    {isCalculating ? 'Calculating real-time rates...' : (calculationError || `${vehicleType} · ${parcels.length} Items`)}
                  </Text>
                </View>
                {!calculationError && !isCalculating && estimatedPrice > 0 && (
                  <Text style={styles.estimatePrice}>
                    £{estimatedPrice.toFixed(2)}
                  </Text>
                )}
                {isCalculating && <ActivityIndicator size="small" color={Colors.customerPrimary} />}
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, (isSubmitting || estimatedPrice <= 0 || !!calculationError) && { opacity: 0.5 }]}
                onPress={handleSubmitQuote}
                disabled={isSubmitting || estimatedPrice <= 0 || !!calculationError}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Send size={18} color="#FFFFFF" />
                    <Text style={styles.submitBtnText}>Submit Quote Request</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.navy, paddingHorizontal: 20, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 26, fontWeight: '800' as const, color: Colors.textInverse },
  headerSubtitle: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  newQuoteBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.customerPrimary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, gap: 6 },
  newQuoteBtnText: { fontSize: 13, fontWeight: '700' as const, color: '#FFFFFF' },
  filterBar: { flexDirection: 'row', backgroundColor: Colors.surface, paddingHorizontal: 12, paddingVertical: 10, gap: 6, borderBottomWidth: 1, borderBottomColor: Colors.border },
  filterTab: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 10, backgroundColor: Colors.surfaceAlt },
  filterTabActive: { backgroundColor: Colors.customerPrimary },
  filterLabel: { fontSize: 12, fontWeight: '600' as const, color: Colors.textSecondary },
  filterLabelActive: { color: '#FFFFFF' },
  list: { padding: 16, paddingBottom: 24 },
  quoteCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  quoteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  quoteNumber: { fontSize: 15, fontWeight: '700' as const, color: Colors.text },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  statusText: { fontSize: 11, fontWeight: '600' as const },
  quoteRoute: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  quoteRouteText: { fontSize: 14, color: Colors.text, fontWeight: '500' as const },
  quoteDetails: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  quoteDetail: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  quoteDetailText: { fontSize: 11, color: Colors.textMuted },
  quoteFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  quotePriceLabel: { fontSize: 11, color: Colors.textMuted },
  quotePrice: { fontSize: 20, fontWeight: '800' as const, color: Colors.customerPrimary },
  quoteNotes: { fontSize: 11, color: Colors.textMuted, flex: 1, textAlign: 'right' as const, marginLeft: 12 },
  quoteActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  acceptButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.success, borderRadius: 12, paddingVertical: 12, gap: 6 },
  acceptButtonText: { fontSize: 13, fontWeight: '700' as const, color: '#FFFFFF' },
  declineButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, gap: 5, borderWidth: 1, borderColor: Colors.dangerLight },
  declineButtonText: { fontSize: 13, fontWeight: '600' as const, color: Colors.danger },
  convertButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.customerPrimary, borderRadius: 12, paddingVertical: 12, gap: 6, marginTop: 12 },
  convertButtonText: { fontSize: 14, fontWeight: '700' as const, color: '#FFFFFF' },
  quoteExpiry: { marginTop: 8 },
  quoteExpiryText: { fontSize: 11, color: Colors.textMuted },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700' as const, color: Colors.text },
  emptySubtitle: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' as const },
  modalContainer: { flex: 1, backgroundColor: Colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 16, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: 20, fontWeight: '800' as const, color: Colors.text },
  modalBody: { flex: 1 },
  modalContent: { padding: 16 },
  formSection: { marginBottom: 20 },
  formSectionLabel: { fontSize: 14, fontWeight: '700' as const, color: Colors.text, marginBottom: 8 },
  formRow: { flexDirection: 'row', gap: 10 },
  formInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, minHeight: 48, gap: 10 },
  input: { flex: 1, fontSize: 14, color: Colors.text },
  savedLabel: { fontSize: 12, color: Colors.textMuted, marginTop: 10, marginBottom: 6 },
  savedScroll: { flexDirection: 'row' },
  savedChip: { backgroundColor: Colors.surface, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, borderWidth: 1, borderColor: Colors.border },
  savedChipActive: { backgroundColor: Colors.customerPrimary, borderColor: Colors.customerPrimary },
  savedChipText: { fontSize: 12, fontWeight: '600' as const, color: Colors.textSecondary },
  savedChipTextActive: { color: '#FFFFFF' },
  pickerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, height: 48 },
  pickerBtnText: { fontSize: 14, fontWeight: '500' as const, color: Colors.text },
  pickerOptions: { marginTop: 8, gap: 4 },
  pickerOption: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: Colors.surfaceAlt },
  pickerOptionActive: { backgroundColor: Colors.customerPrimary },
  pickerOptionText: { fontSize: 14, fontWeight: '500' as const, color: Colors.text },
  pickerOptionTextActive: { color: '#FFFFFF', fontWeight: '600' as const },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.customerPrimary, borderRadius: 14, height: 56, gap: 8 },
  submitBtnText: { fontSize: 16, fontWeight: '700' as const, color: '#FFFFFF' },
  parcelsList: { gap: 10 },
  parcelBox: { backgroundColor: Colors.surfaceAlt, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.borderLight, gap: 8 },
  smallInput: { backgroundColor: Colors.surface, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 10, height: 40, fontSize: 13, color: Colors.text, flex: 1 },
  removeParcelBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end', paddingTop: 4 },
  removeParcelText: { fontSize: 12, color: Colors.danger, fontWeight: '600' as const },
  addParcelBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: Colors.customerPrimary, borderRadius: 12, gap: 6, marginTop: 4 },
  addParcelBtnText: { fontSize: 13, fontWeight: '600' as const, color: Colors.customerPrimary },
  estimateCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.customerPrimary + '10', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: Colors.customerPrimary + '30' },
  estimateCardError: { backgroundColor: Colors.danger + '05', borderColor: Colors.danger + '20' },
  estimateLabel: { fontSize: 12, fontWeight: '700' as const, color: Colors.textMuted, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  estimateSubLabel: { fontSize: 13, color: Colors.text, fontWeight: '600' as const, marginTop: 2 },
  estimatePrice: { fontSize: 24, fontWeight: '800' as const, color: Colors.customerPrimary },
});
