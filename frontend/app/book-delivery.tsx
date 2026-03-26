import React, { useState, useCallback, useMemo } from 'react';
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
import { useRouter, Stack } from 'expo-router';
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
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useDeliveries } from '@/providers/DeliveriesProvider';
import { useAuth } from '@/providers/AuthProvider';

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

  const [pickupAddress, setPickupAddress] = useState<string>('');
  const [pickupCity, setPickupCity] = useState<string>('');
  const [pickupPostcode, setPickupPostcode] = useState<string>('');
  const [pickupContact, setPickupContact] = useState<string>('');
  const [dropoffAddress, setDropoffAddress] = useState<string>(customer?.defaultAddress ?? '');
  const [dropoffCity, setDropoffCity] = useState<string>(customer?.defaultCity ?? '');
  const [dropoffPostcode, setDropoffPostcode] = useState<string>(customer?.defaultPostcode ?? '');
  const [dropoffContact, setDropoffContact] = useState<string>(
    customer ? `${customer.firstName} ${customer.lastName}` : ''
  );
  const [packageDescription, setPackageDescription] = useState<string>('');
  const [specialInstructions, setSpecialInstructions] = useState<string>('');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('Small Van');
  const [selectedJobType, setSelectedJobType] = useState<string>('General Freight');
  const [selectedPickupWindow, setSelectedPickupWindow] = useState<string>('');
  const [selectedDeliveryWindow, setSelectedDeliveryWindow] = useState<string>('');
  const [showVehiclePicker, setShowVehiclePicker] = useState<boolean>(false);
  const [showJobTypePicker, setShowJobTypePicker] = useState<boolean>(false);
  const [showPickupWindowPicker, setShowPickupWindowPicker] = useState<boolean>(false);
  const [showDeliveryWindowPicker, setShowDeliveryWindowPicker] = useState<boolean>(false);
  const [showSavedLocations, setShowSavedLocations] = useState<LocationTarget | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const estimatePrice = useCallback((): number => {
    // Pricing logic aligned with VehicleClass baselines
    const baseRates: Record<string, number> = {
      'Small Van': 15,
      'Medium Van': 25,
      'Large Van': 45,
      'HGV': 85
    };
    
    const base = baseRates[selectedVehicle] || 25;
    const cityMultiplier = pickupCity.toLowerCase() !== dropoffCity.toLowerCase() ? 1.5 : 1;
    const jobTypeMultiplier = selectedJobType === 'Medical' || selectedJobType === 'Fragile Items' ? 1.25 : 1;
    
    return Math.round(base * cityMultiplier * jobTypeMultiplier * 100) / 100;
  }, [selectedVehicle, pickupCity, dropoffCity, selectedJobType]);

  const handleQuickFill = useCallback((target: LocationTarget) => {
    if (!customer) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (target === 'pickup') {
      setPickupAddress(customer.defaultAddress || '');
      setPickupCity(customer.defaultCity || '');
      setPickupPostcode(customer.defaultPostcode || '');
      setPickupContact(`${customer.firstName} ${customer.lastName}`);
    } else {
      setDropoffAddress(customer.defaultAddress || '');
      setDropoffCity(customer.defaultCity || '');
      setDropoffPostcode(customer.defaultPostcode || '');
      setDropoffContact(`${customer.firstName} ${customer.lastName}`);
    }
  }, [customer]);

  const getWindowLabel = useCallback((value: string): string => {
    return TIME_WINDOWS.find(tw => tw.value === value)?.label ?? 'Select time window';
  }, []);

  const validate = useCallback((): boolean => {
    if (!pickupAddress.trim() || !pickupCity.trim() || !pickupPostcode.trim() || !pickupContact.trim()) {
      Alert.alert('Missing Info', 'Please fill in all pickup details.');
      return false;
    }
    if (!dropoffAddress.trim() || !dropoffCity.trim() || !dropoffPostcode.trim() || !dropoffContact.trim()) {
      Alert.alert('Missing Info', 'Please fill in all dropoff details.');
      return false;
    }
    if (!packageDescription.trim()) {
      Alert.alert('Missing Info', 'Please describe your package.');
      return false;
    }
    return true;
  }, [pickupAddress, pickupCity, pickupPostcode, pickupContact, dropoffAddress, dropoffCity, dropoffPostcode, dropoffContact, packageDescription]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const price = estimatePrice();
      // createDelivery returns a Promise
      const delivery = await createDelivery({
        pickupAddress: pickupAddress.trim(),
        pickupCity: pickupCity.trim(),
        pickupPostcode: pickupPostcode.trim(),
        pickupContact: pickupContact.trim(),
        dropoffAddress: dropoffAddress.trim(),
        dropoffCity: dropoffCity.trim(),
        dropoffPostcode: dropoffPostcode.trim(),
        dropoffContact: dropoffContact.trim(),
        packageDescription: packageDescription.trim(),
        vehicleType: selectedVehicle,
        estimatedPrice: price,
        estimatedPickup: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        estimatedDelivery: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
        jobType: selectedJobType,
        specialInstructions: specialInstructions.trim() || undefined,
        pickupTimeWindow: selectedPickupWindow || undefined,
        deliveryTimeWindow: selectedDeliveryWindow || undefined,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Delivery created successfully

      Alert.alert(
        'Proceed to Payment',
        `Your delivery ${delivery.trackingNumber} has been created. Pay £${price.toFixed(2)} now?`,
        [
          {
            text: 'Pay Now',
            onPress: () => {
              router.replace({
                pathname: '/payment-checkout' as any,
                params: {
                  amount: price.toFixed(2),
                  description: `Delivery ${delivery.trackingNumber}`,
                  deliveryId: delivery.id,
                  trackingNumber: delivery.trackingNumber,
                },
              });
            },
          },
          {
            text: 'Pay Later',
            style: 'cancel',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to create delivery booking.');
    } finally {
      setIsSubmitting(false);
    }
  }, [validate, createDelivery, pickupAddress, pickupCity, pickupPostcode, pickupContact, dropoffAddress, dropoffCity, dropoffPostcode, dropoffContact, packageDescription, selectedVehicle, estimatePrice, router, selectedJobType, specialInstructions, selectedPickupWindow, selectedDeliveryWindow]);

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

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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
              <View style={styles.inputRow}>
                <MapPin size={16} color={Colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="Pickup address"
                  placeholderTextColor={Colors.textMuted}
                  value={pickupAddress}
                  onChangeText={setPickupAddress}
                  testID="pickup-address"
                />
              </View>
              <View style={styles.inputSplit}>
                <View style={[styles.inputRow, { flex: 1 }]}>
                  <TextInput
                    style={styles.input}
                    placeholder="City"
                    placeholderTextColor={Colors.textMuted}
                    value={pickupCity}
                    onChangeText={setPickupCity}
                  />
                </View>
                <View style={[styles.inputRow, { flex: 0.6 }]}>
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
              <View style={styles.inputRow}>
                <User size={16} color={Colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="Contact name"
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
              <View style={styles.inputRow}>
                <MapPin size={16} color={Colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="Dropoff address"
                  placeholderTextColor={Colors.textMuted}
                  value={dropoffAddress}
                  onChangeText={setDropoffAddress}
                  testID="dropoff-address"
                />
              </View>
              <View style={styles.inputSplit}>
                <View style={[styles.inputRow, { flex: 1 }]}>
                  <TextInput
                    style={styles.input}
                    placeholder="City"
                    placeholderTextColor={Colors.textMuted}
                    value={dropoffCity}
                    onChangeText={setDropoffCity}
                  />
                </View>
                <View style={[styles.inputRow, { flex: 0.6 }]}>
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
              <View style={styles.inputRow}>
                <User size={16} color={Colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="Contact name"
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
              <Text style={styles.sectionLabel}>Package Info</Text>
            </View>
            <View style={styles.inputGroup}>
              <View style={[styles.inputRow, { minHeight: 72, alignItems: 'flex-start', paddingTop: 14 }]}>
                <TextInput
                  style={[styles.input, { textAlignVertical: 'top' }]}
                  placeholder="Describe your package (e.g., 2x boxes, fragile items)"
                  placeholderTextColor={Colors.textMuted}
                  value={packageDescription}
                  onChangeText={setPackageDescription}
                  multiline
                  testID="package-description"
                />
              </View>
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
              <Text style={styles.sectionLabel}>Time Windows</Text>
              <Text style={styles.optionalTag}>Optional</Text>
            </View>

            <Text style={styles.subLabel}>Pickup Window</Text>
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

          <View style={styles.estimateCard}>
            <View>
              <Text style={styles.estimateLabel}>Estimated Price</Text>
              <Text style={styles.estimateSubLabel}>{selectedJobType} · {selectedVehicle}</Text>
            </View>
            <Text style={styles.estimatePrice}>
              £{pickupCity && dropoffCity ? estimatePrice().toFixed(2) : '--'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
            testID="submit-delivery"
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Confirm Booking</Text>
                <ChevronRight size={18} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  content: {
    padding: 16,
    maxWidth: Platform.OS === 'web' ? 800 : '100%',
    width: '100%',
    alignSelf: 'center',
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
  },
  inputSplit: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
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
  submitButton: {
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
});
