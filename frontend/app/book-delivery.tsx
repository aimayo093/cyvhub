import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import {
  MapPin,
  User,
  Package,
  Truck,
  ChevronRight,
  ChevronDown,
  Clock,
  FileText,
  Bookmark,
  AlertCircle,
  Calculator,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useDeliveries } from '@/providers/DeliveriesProvider';
import { useAuth } from '@/providers/AuthProvider';
import { apiClient } from '@/services/api';
import { Plus } from 'lucide-react-native';
import { ResponsiveContainer } from '@/components/ResponsiveContainer';
import StructuredAddressInput from '@/components/StructuredAddressInput';

const VEHICLE_TYPES = ['Small Van', 'Medium Van', 'Large Van', 'HGV'];
const JOB_TYPES = ['IT Equipment', 'Construction', 'Medical', 'Furniture', 'Office Supplies', 'General Freight', 'Fragile Items', 'Documents'];
const TIME_WINDOWS = [
  { label: 'Morning (8am - 12pm)', value: '08:00-12:00' },
  { label: 'Afternoon (12pm - 5pm)', value: '12:00-17:00' },
  { label: 'Evening (5pm - 9pm)', value: '17:00-21:00' },
  { label: 'Any time today', value: 'any-today' },
  { label: 'Next business day', value: 'next-day' },
];

type LocationTarget = 'pickup' | 'dropoff';

export default function BookDeliveryScreen() {
  const router = useRouter();
  const { createDelivery } = useDeliveries();
  const { customer } = useAuth();

  const params = useLocalSearchParams();
  const [pickup, setPickup] = useState<any>(null);
  const [pickupContact, setPickupContact] = useState<string>('');
  
  const [dropoff, setDropoff] = useState<any>(customer ? {
    line1: customer.defaultAddress || '',
    townCity: customer.defaultCity || '',
    postcode: customer.defaultPostcode || '',
    latitude: 0,
    longitude: 0
  } : null);
  
  const [dropoffContact, setDropoffContact] = useState<string>(
    customer ? `${customer.firstName} ${customer.lastName}` : ''
  );

  const [estimatedPrice, setEstimatedPrice] = useState<number>(0);
  
  useEffect(() => {
    if (params.prePickup) setPickup({ postcode: params.prePickup as string, latitude: 0, longitude: 0 });
    if (params.preDropoff) setDropoff({ postcode: params.preDropoff as string, latitude: 0, longitude: 0 });
    if (params.preVehicle) setSelectedVehicle(params.preVehicle as string);
    if (params.prePrice) setEstimatedPrice(parseFloat(params.prePrice as string) || 0);
  }, [params]);

  const [parcels, setParcels] = useState<any[]>([
    { lengthCm: '', widthCm: '', heightCm: '', weightKg: '', quantity: '1', description: '' }
  ]);
  const [specialInstructions, setSpecialInstructions] = useState<string>('');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('Small Van');
  const [selectedJobType, setSelectedJobType] = useState<string>('General Freight');
  const [selectedPickupWindow, setSelectedPickupWindow] = useState<string>('');
  const [selectedDeliveryWindow, setSelectedDeliveryWindow] = useState<string>('');
  const [showVehiclePicker, setShowVehiclePicker] = useState<boolean>(false);
  const [distanceMiles, setDistanceMiles] = useState<number>(0);
  const [showJobTypePicker, setShowJobTypePicker] = useState<boolean>(false);
  const [showPickupWindowPicker, setShowPickupWindowPicker] = useState<boolean>(false);
  const [showDeliveryWindowPicker, setShowDeliveryWindowPicker] = useState<boolean>(false);
  const [showSavedLocations, setShowSavedLocations] = useState<LocationTarget | null>(null);
  const [isReadyNow, setIsReadyNow] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [calculationError, setCalculationError] = useState<string>('');

  const fetchPrice = useCallback(async () => {
    if (!pickup?.postcode || !dropoff?.postcode || parcels.length === 0) {
      setCalculationError('');
      setEstimatedPrice(0);
      return;
    }

    setCalculationError('');
    try {
      const response = await apiClient('/quotes/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupPostcode: pickup.postcode,
          dropoffPostcode: dropoff.postcode,
          pickupCoords: { lat: pickup.latitude, lng: pickup.longitude },
          dropoffCoords: { lat: dropoff.latitude, lng: dropoff.longitude },
          items: parcels.map(p => ({
            lengthCm: parseFloat(p.lengthCm) || 0,
            widthCm: parseFloat(p.widthCm) || 0,
            heightCm: parseFloat(p.heightCm) || 0,
            weightKg: parseFloat(p.weightKg) || 0,
            quantity: parseInt(p.quantity, 10) || 1
          }))
        })
      });

      if (response && response.quotes) {
        setDistanceMiles(response.distanceMiles || 0);
        // Normalize strings for matching (e.g., "SMALL_VAN" vs "Small Van")
        const normalize = (s: string) => (s || '').toUpperCase().replace(/\s/g, '_');
        const quote = response.quotes.find((q: any) => normalize(q.vehicleName) === normalize(selectedVehicle));

        if (quote) {
          setEstimatedPrice(quote.totalExVat);
          setCalculationError('');
        } else if (response.error) {
          // This happens when no vehicles are suitable
          setCalculationError(response.error);
          setEstimatedPrice(0);
        } else {
          setCalculationError(`No pricing found for ${selectedVehicle}.`);
          setEstimatedPrice(0);
        }
      }
    } catch (e: any) {
      console.error('Price calculation failed', e.message);
      setCalculationError(e.message || 'We couldn\'t calculate a price for this route.');
      setEstimatedPrice(0);
    }
  }, [pickup, dropoff, parcels, selectedVehicle]);

  useEffect(() => {
    fetchPrice();
  }, [fetchPrice]);

  const handleQuickFill = useCallback((target: LocationTarget) => {
    if (!customer) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (target === 'pickup') {
      setPickup({
        line1: customer.defaultAddress || '',
        townCity: customer.defaultCity || '',
        postcode: customer.defaultPostcode || '',
        latitude: 0,
        longitude: 0
      });
      setPickupContact(`${customer.firstName} ${customer.lastName}`);
    } else {
      setDropoff({
        line1: customer.defaultAddress || '',
        townCity: customer.defaultCity || '',
        postcode: customer.defaultPostcode || '',
        latitude: 0,
        longitude: 0
      });
      setDropoffContact(`${customer.firstName} ${customer.lastName}`);
    }
  }, [customer]);

  const getWindowLabel = useCallback((value: string): string => {
    return TIME_WINDOWS.find(tw => tw.value === value)?.label ?? 'Select time window';
  }, []);

  const validate = useCallback((): boolean => {
    if (!pickup?.line1?.trim() || !pickup?.townCity?.trim() || !pickup?.postcode?.trim() || !pickupContact.trim()) {
      Alert.alert('Missing Info', 'Please fill in all pickup details.');
      return false;
    }
    if (!dropoff?.line1?.trim() || !dropoff?.townCity?.trim() || !dropoff?.postcode?.trim() || !dropoffContact.trim()) {
      Alert.alert('Missing Info', 'Please fill in all dropoff details.');
      return false;
    }
    const parcelsValid = parcels.every(p => p.lengthCm && p.weightKg);
    if (!parcelsValid) {
      Alert.alert('Missing Info', 'Please fill in dimensions and weight for all parcels.');
      return false;
    }
    return true;
  }, [pickup, pickupContact, dropoff, dropoffContact, parcels]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const price = estimatedPrice;
      // createDelivery returns a Promise — field names must match backend schema
      const delivery = await createDelivery({
        pickupAddressLine1: pickup.line1,
        pickupAddressLine2: pickup.line2,
        pickupCity: pickup.townCity,
        pickupPostcode: pickup.postcode,
        pickupLatitude: pickup.latitude,
        pickupLongitude: pickup.longitude,
        pickupContactName: pickupContact.trim(),
        pickupContactPhone: '0000000000',

        dropoffAddressLine1: dropoff.line1,
        dropoffAddressLine2: dropoff.line2,
        dropoffCity: dropoff.townCity,
        dropoffPostcode: dropoff.postcode,
        dropoffLatitude: dropoff.latitude,
        dropoffLongitude: dropoff.longitude,
        dropoffContactName: dropoffContact.trim(),
        dropoffContactPhone: '0000000000',

        parcels: parcels.map(p => ({
            lengthCm: parseFloat(p.lengthCm),
            widthCm: parseFloat(p.widthCm),
            heightCm: parseFloat(p.heightCm),
            weightKg: parseFloat(p.weightKg),
            quantity: parseInt(p.quantity, 10) || 1,
            description: p.description || ''
        })),
        vehicleType: selectedVehicle,
        estimatedPrice: price,
        estimatedPickup: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        estimatedDelivery: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
        jobType: selectedJobType,
        specialInstructions: specialInstructions.trim() || undefined,
        pickupTimeWindow: isReadyNow ? 'READY_NOW' : (selectedPickupWindow || undefined),
        deliveryTimeWindow: selectedDeliveryWindow || undefined,
        isReadyNow,
        businessAccountId: customer?.businessAccountId || undefined,
        quoteId: params.quoteId || undefined,
      } as any);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Delivery created successfully. Redirect to branded checkout.
      router.push({
        pathname: '/checkout' as any,
        params: {
            jobId: delivery.id,
            jobNumber: delivery.jobNumber,
            amount: price.toString(),
            pickup: delivery.pickupCity,
            dropoff: delivery.dropoffCity,
        }
      });
    } catch (error: any) {
      console.error('Delivery creation failed:', error);
      const errorMsg = error?.message || 'Failed to create delivery booking.';
      Alert.alert('Booking Failed', errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  }, [validate, createDelivery, pickup, pickupContact, dropoff, dropoffContact, selectedVehicle, router, selectedJobType, specialInstructions, selectedPickupWindow, selectedDeliveryWindow, estimatedPrice, parcels, isReadyNow]);

  const handleSaveQuote = useCallback(async () => {
    if (!validate()) return;
    if (estimatedPrice <= 0) {
      Alert.alert('Cannot Save', 'Please ensure a valid price is calculated before saving.');
      return;
    }
    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const quantity = parcels.reduce((sum, p) => sum + (parseInt(p.quantity, 10) || 1), 0);
      
      const payload = {
        quoteNumber: `QT-${Date.now()}`,
        customerId: customer?.id ?? 'guest',
        businessId: customer?.businessAccountId || undefined,
        pickupPostcode: pickup?.postcode?.trim(),
        dropoffPostcode: dropoff?.postcode?.trim(),
        vehicleType: selectedVehicle,
        distanceKm: distanceMiles * 1.60934, // Convert miles to km for schema
        estimatedCost: estimatedPrice,
        quantity,
        items: parcels.map(p => ({
          weightKg: parseFloat(p.weightKg) || 0,
          lengthCm: parseFloat(p.lengthCm) || 0,
          widthCm: parseFloat(p.widthCm) || 0,
          heightCm: parseFloat(p.heightCm) || 0,
          quantity: parseInt(p.quantity, 10) || 1,
          description: p.description || ''
        }))
      };

      const res = await apiClient('/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Quote Saved', 'Your quote has been saved successfully.');
      router.back();
    } catch (error: any) {
      console.error('Save Quote failed:', error);
      Alert.alert('Save Failed', error?.message || 'Failed to save quote.');
    } finally {
      setIsSubmitting(false);
    }
  }, [validate, estimatedPrice, customer, pickup, dropoff, selectedVehicle, parcels, router]);

  const renderQuickFill = useCallback((target: LocationTarget) => (
    <View style={styles.savedLocationsWrap}>
      <TouchableOpacity 
        style={styles.quickFillBtn}
        onPress={() => handleQuickFill(target)}
      >
        <User size={14} color={Colors.customerPrimary} />
        <Text style={styles.quickFillText}>Fill with my profile address</Text>
      </TouchableOpacity>
    </View>
  ), [handleQuickFill]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Book a Delivery',
          headerStyle: { backgroundColor: Colors.navy },
          headerTintColor: Colors.textInverse,
          headerTitleStyle: { fontWeight: '600' as const },
        }}
      />

      <ResponsiveContainer scrollable={true} backgroundColor={Colors.background}>
        <View style={styles.contentInner}>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: Colors.success }]} />
              <Text style={styles.sectionLabel}>Pickup Details</Text>
              <TouchableOpacity
                style={styles.savedLocationToggle}
                onPress={() => setShowSavedLocations(showSavedLocations === 'pickup' ? null : 'pickup')}
              >
                <Bookmark size={14} color={Colors.customerPrimary} />
              </TouchableOpacity>
            </View>

            {showSavedLocations === 'pickup' && renderQuickFill('pickup')}

            <View style={styles.inputGroup}>
              <StructuredAddressInput 
                label="Pickup Address" 
                onAddressChange={setPickup} 
                initialValue={pickup} 
              />

              <View style={styles.inputRow}>
                <User size={16} color={Colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="Contact name at pickup"
                  placeholderTextColor={Colors.textMuted}
                  value={pickupContact}
                  onChangeText={setPickupContact}
                />
              </View>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: Colors.danger }]} />
              <Text style={styles.sectionLabel}>Dropoff Details</Text>
              <TouchableOpacity
                style={styles.savedLocationToggle}
                onPress={() => setShowSavedLocations(showSavedLocations === 'dropoff' ? null : 'dropoff')}
              >
                <Bookmark size={14} color={Colors.customerPrimary} />
              </TouchableOpacity>
            </View>

            {showSavedLocations === 'dropoff' && renderQuickFill('dropoff')}

            <View style={styles.inputGroup}>
              <StructuredAddressInput 
                label="Dropoff Address" 
                onAddressChange={setDropoff} 
                initialValue={dropoff} 
              />

              <View style={styles.inputRow}>
                <User size={16} color={Colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="Contact name at dropoff"
                  placeholderTextColor={Colors.textMuted}
                  value={dropoffContact}
                  onChangeText={setDropoffContact}
                />
              </View>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <FileText size={16} color={Colors.customerPrimary} />
              <Text style={styles.sectionLabel}>Job Type</Text>
            </View>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowJobTypePicker(!showJobTypePicker)}
              activeOpacity={0.7}
            >
              <Text style={styles.pickerButtonText}>{selectedJobType}</Text>
              <ChevronDown size={18} color={Colors.textMuted} />
            </TouchableOpacity>

            {showJobTypePicker && (
              <View style={styles.pickerOptions}>
                {JOB_TYPES.map(jt => (
                  <TouchableOpacity
                    key={jt}
                    style={[styles.pickerOption, selectedJobType === jt && styles.pickerOptionActive]}
                    onPress={() => {
                      setSelectedJobType(jt);
                      setShowJobTypePicker(false);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text style={[styles.pickerOptionText, selectedJobType === jt && styles.pickerOptionTextActive]}>{jt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Package size={16} color={Colors.customerPrimary} />
              <Text style={styles.sectionLabel}>Parcels Information</Text>
            </View>
            <View style={styles.parcelsList}>
              {parcels.map((parcel, index) => (
                <View key={index} style={styles.parcelBox}>
                    <View style={styles.parcelRow}>
                         <TextInput
                             style={[styles.smallInput, { flex: 3 }]}
                             placeholder="Description (e.g. Box of parts)"
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
                             keyboardType="numeric"
                             value={parcel.quantity}
                             onChangeText={(v) => {
                                 const newParcels = [...parcels];
                                 newParcels[index].quantity = v;
                                 setParcels(newParcels);
                             }}
                         />
                    </View>
                   <View style={styles.parcelRow}>
                        <TextInput
                            style={styles.smallInput}
                            placeholder="L (cm)"
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

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <AlertCircle size={16} color={Colors.warning} />
              <Text style={styles.sectionLabel}>Special Instructions</Text>
              <Text style={styles.optionalTag}>Optional</Text>
            </View>
            <View style={styles.inputGroup}>
              <View style={[styles.inputRow, { minHeight: 72, alignItems: 'flex-start', paddingTop: 14 }]}>
                <TextInput
                  style={[styles.input, { textAlignVertical: 'top' }]}
                  placeholder="E.g., Ring doorbell, use side entrance, call on arrival..."
                  placeholderTextColor={Colors.textMuted}
                  value={specialInstructions}
                  onChangeText={setSpecialInstructions}
                  multiline
                  testID="special-instructions"
                />
              </View>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Truck size={16} color={Colors.customerPrimary} />
              <Text style={styles.sectionLabel}>Vehicle Type</Text>
            </View>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowVehiclePicker(!showVehiclePicker)}
              activeOpacity={0.7}
            >
              <Text style={styles.pickerButtonText}>{selectedVehicle}</Text>
              <ChevronDown size={18} color={Colors.textMuted} />
            </TouchableOpacity>

            {showVehiclePicker && (
              <View style={styles.pickerOptions}>
                {VEHICLE_TYPES.map(vehicle => (
                  <TouchableOpacity
                    key={vehicle}
                    style={[styles.pickerOption, selectedVehicle === vehicle && styles.pickerOptionActive]}
                    onPress={() => {
                      setSelectedVehicle(vehicle);
                      setShowVehiclePicker(false);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text style={[styles.pickerOptionText, selectedVehicle === vehicle && styles.pickerOptionTextActive]}>{vehicle}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Clock size={16} color={Colors.customerPrimary} />
              <Text style={styles.sectionLabel}>Collection Time</Text>
            </View>
            <View style={styles.vehicleOptions}>
              <TouchableOpacity 
                style={[styles.vehicleOption, isReadyNow && styles.vehicleOptionSelected]} 
                onPress={() => {
                  setIsReadyNow(true);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }} 
                activeOpacity={0.8}
              >
                <Clock size={14} color={isReadyNow ? '#FFFFFF' : Colors.textMuted} />
                <Text style={[styles.vehicleText, isReadyNow && styles.vehicleTextSelected]}>Ready Now</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.vehicleOption, !isReadyNow && styles.vehicleOptionSelected]} 
                onPress={() => {
                  setIsReadyNow(false);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }} 
                activeOpacity={0.8}
              >
                <Calculator size={14} color={!isReadyNow ? '#FFFFFF' : Colors.textMuted} />
                <Text style={[styles.vehicleText, !isReadyNow && styles.vehicleTextSelected]}>Pre-book Later</Text>
              </TouchableOpacity>
            </View>

            {!isReadyNow && (
              <>
                <Text style={[styles.subLabel, { marginTop: 14 }]}>Pickup Window</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowPickupWindowPicker(!showPickupWindowPicker)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pickerButtonText, !selectedPickupWindow && { color: Colors.textMuted }]}>
                    {selectedPickupWindow ? getWindowLabel(selectedPickupWindow) : 'Select pickup time window'}
                  </Text>
                  <ChevronDown size={18} color={Colors.textMuted} />
                </TouchableOpacity>

                {showPickupWindowPicker && (
                  <View style={styles.pickerOptions}>
                    {TIME_WINDOWS.map(tw => (
                      <TouchableOpacity
                        key={tw.value}
                        style={[styles.pickerOption, selectedPickupWindow === tw.value && styles.pickerOptionActive]}
                        onPress={() => {
                          setSelectedPickupWindow(tw.value);
                          setShowPickupWindowPicker(false);
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                      >
                        <Text style={[styles.pickerOptionText, selectedPickupWindow === tw.value && styles.pickerOptionTextActive]}>{tw.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            )}

            <Text style={[styles.subLabel, { marginTop: 14 }]}>Delivery Window</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowDeliveryWindowPicker(!showDeliveryWindowPicker)}
              activeOpacity={0.7}
            >
              <Text style={[styles.pickerButtonText, !selectedDeliveryWindow && { color: Colors.textMuted }]}>
                {selectedDeliveryWindow ? getWindowLabel(selectedDeliveryWindow) : 'Select delivery time window'}
              </Text>
              <ChevronDown size={18} color={Colors.textMuted} />
            </TouchableOpacity>

            {showDeliveryWindowPicker && (
              <View style={styles.pickerOptions}>
                {TIME_WINDOWS.map(tw => (
                  <TouchableOpacity
                    key={tw.value}
                    style={[styles.pickerOption, selectedDeliveryWindow === tw.value && styles.pickerOptionActive]}
                    onPress={() => {
                      setSelectedDeliveryWindow(tw.value);
                      setShowDeliveryWindowPicker(false);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text style={[styles.pickerOptionText, selectedDeliveryWindow === tw.value && styles.pickerOptionTextActive]}>{tw.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={[styles.estimateCard, calculationError && styles.estimateCardError]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.estimateLabel}>
                {calculationError ? 'Calculation Issue' : 'Estimated Price'}
              </Text>
              <Text style={styles.estimateSubLabel}>
                {calculationError ? calculationError : `${selectedJobType} · ${selectedVehicle}`}
              </Text>
            </View>
            {!calculationError && (
              <Text style={styles.estimatePrice}>
                £{pickup?.postcode && dropoff?.postcode && estimatedPrice > 0 ? estimatedPrice.toFixed(2) : '--'}
              </Text>
            )}
            {calculationError && <AlertCircle size={20} color={Colors.danger} />}
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.saveQuoteButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSaveQuote}
              disabled={isSubmitting || calculationError !== ''}
              activeOpacity={0.8}
            >
              <Text style={styles.saveQuoteButtonText}>Save Quote</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting || calculationError !== ''}
              activeOpacity={0.8}
              testID="submit-delivery"
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Book Now</Text>
                  <ChevronRight size={18} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </View>
      </ResponsiveContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  contentInner: {
    paddingVertical: 16,
    paddingHorizontal: 0,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
    flex: 1,
  },
  optionalTag: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: Colors.textMuted,
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  savedLocationToggle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.customerPrimary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedLocationsWrap: {
    marginBottom: 12,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    padding: 10,
  },
  savedLocationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  savedLocationsLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.customerPrimary,
  },
  savedChipsRow: {
    gap: 8,
    paddingRight: 8,
  },
  savedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  savedChipActive: {
    backgroundColor: Colors.customerPrimary,
    borderColor: Colors.customerPrimary,
  },
  savedChipText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  savedChipTextActive: {
    color: '#FFFFFF',
  },
  inputGroup: {
    gap: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    minHeight: 48,
    gap: 10,
    flexWrap: 'wrap',
    paddingVertical: 8,
  },
  inputSplit: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    minWidth: 150,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    height: 48,
  },
  pickerButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  pickerOptions: {
    marginTop: 10,
    gap: 6,
  },
  pickerOption: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: Colors.surfaceAlt,
  },
  pickerOptionActive: {
    backgroundColor: Colors.customerPrimary,
  },
  pickerOptionText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  pickerOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  estimateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.customerPrimary + '40',
  },
  estimateLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  estimateSubLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  estimatePrice: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.customerPrimary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  saveQuoteButton: {
    flex: 1,
    height: 56,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.customerPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  saveQuoteButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.customerPrimary,
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.customerPrimary,
    borderRadius: 14,
    height: 56,
    gap: 6,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  quickFillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.customerPrimary + '15',
    padding: 12,
    borderRadius: 10,
    gap: 10,
    marginTop: 4,
  },
  quickFillText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.customerPrimary,
  },
  parcelsList: {
    gap: 12,
  },
  parcelBox: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  parcelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  smallInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    fontSize: 13,
    color: Colors.text,
  },
  addParcelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.customerPrimary + '40',
    borderStyle: 'dashed',
    borderRadius: 10,
  },
  addParcelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.customerPrimary,
  },
  removeParcelBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
  },
  removeParcelText: {
    fontSize: 12,
    color: Colors.danger,
    fontWeight: '600',
  },
  vehicleOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  vehicleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    flex: 1,
    minWidth: 120,
    justifyContent: 'center',
  },
  vehicleOptionSelected: {
    borderColor: Colors.customerPrimary,
    backgroundColor: Colors.customerPrimary,
  },
  vehicleText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  vehicleTextSelected: {
    color: '#FFFFFF',
  },
  formRow: {
    width: '100%',
  },
  estimateCardError: {
    borderColor: Colors.danger + '40',
    backgroundColor: '#FEF2F2',
  },
});
