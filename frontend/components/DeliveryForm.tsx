import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
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
  Plus,
  Send,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import { apiClient } from '@/services/api';
import { PostcodeAutocompleteMobile } from '@/components/shared/PostcodeAutocompleteMobile';

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

interface DeliveryFormProps {
  mode: 'booking' | 'quote';
  onSubmit: (formData: any) => Promise<void>;
  isSubmitting: boolean;
  initialData?: any;
}

export const DeliveryForm: React.FC<DeliveryFormProps> = ({
  mode,
  onSubmit,
  isSubmitting,
  initialData,
}) => {
  const { customer } = useAuth();

  // State
  const [pickup, setPickup] = useState<any>(initialData?.pickup || null);
  const [pickupContact, setPickupContact] = useState<string>(initialData?.pickupContactName || '');
  const [pickupContactPhone, setPickupContactPhone] = useState<string>(initialData?.pickupContactPhone || '');
  
  const [dropoff, setDropoff] = useState<any>(initialData?.dropoff || (customer ? {
    line1: customer.defaultAddress || '',
    townCity: customer.defaultCity || '',
    postcode: customer.defaultPostcode || '',
    latitude: 0,
    longitude: 0
  } : null));
  
  const [dropoffContact, setDropoffContact] = useState<string>(
    initialData?.dropoffContactName || (customer ? `${customer.firstName} ${customer.lastName}` : '')
  );
  const [dropoffContactPhone, setDropoffContactPhone] = useState<string>(
    initialData?.dropoffContactPhone || (customer ? customer.phone : '')
  );

  const [parcels, setParcels] = useState<any[]>(initialData?.parcels || [
    { lengthCm: '', widthCm: '', heightCm: '', weightKg: '', quantity: '1', description: '' }
  ]);
  const [specialInstructions, setSpecialInstructions] = useState<string>(initialData?.specialInstructions || '');
  const [selectedVehicle, setSelectedVehicle] = useState<string>(initialData?.vehicleType || 'Small Van');
  const [selectedJobType, setSelectedJobType] = useState<string>(initialData?.jobType || 'General Freight');
  const [selectedPickupWindow, setSelectedPickupWindow] = useState<string>(initialData?.pickupTimeWindow || '');
  const [selectedDeliveryWindow, setSelectedDeliveryWindow] = useState<string>(initialData?.deliveryTimeWindow || '');
  const [isReadyNow, setIsReadyNow] = useState<boolean>(initialData?.isReadyNow ?? true);

  const [estimatedPrice, setEstimatedPrice] = useState<number>(initialData?.estimatedPrice || 0);
  const [calculationError, setCalculationError] = useState<string>('');
  const [distanceMiles, setDistanceMiles] = useState<number>(0);

  // Picker states
  const [showVehiclePicker, setShowVehiclePicker] = useState<boolean>(false);
  const [showJobTypePicker, setShowJobTypePicker] = useState<boolean>(false);
  const [showPickupWindowPicker, setShowPickupWindowPicker] = useState<boolean>(false);
  const [showDeliveryWindowPicker, setShowDeliveryWindowPicker] = useState<boolean>(false);
  const [showSavedLocations, setShowSavedLocations] = useState<LocationTarget | null>(null);
  const [isSummaryMode, setIsSummaryMode] = useState<boolean>(false);

  // Price calculation
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
          pickupPostcode: pickup?.postcode,
          dropoffPostcode: dropoff?.postcode,
          pickupCoords: { lat: pickup?.latitude, lng: pickup?.longitude },
          dropoffCoords: { lat: dropoff?.latitude, lng: dropoff?.longitude },
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
        setDistanceMiles(response.distanceMiles || 0);
        const normalize = (s: string) => (s || '').toUpperCase().replace(/\s/g, '_');
        const quote = response.quotes.find((q: any) => normalize(q.vehicleName) === normalize(selectedVehicle));

        if (quote) {
          setEstimatedPrice(quote.totalExVat);
          setCalculationError('');
        } else if (response.error) {
          setCalculationError(response.error);
          setEstimatedPrice(0);
        } else {
          setCalculationError(`No pricing found for ${selectedVehicle}.`);
          setEstimatedPrice(0);
        }
      }
    } catch (e: any) {
      setCalculationError(e.message || 'Price calculation unavailable.');
      setEstimatedPrice(0);
    }
  }, [pickup, dropoff, parcels, selectedVehicle, customer]);

  useEffect(() => {
    fetchPrice();
  }, [fetchPrice]);

  const handleQuickFill = useCallback((target: LocationTarget) => {
    if (!customer) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const addr = {
      line1: customer.defaultAddress || '',
      townCity: customer.defaultCity || '',
      postcode: customer.defaultPostcode || '',
      latitude: 0,
      longitude: 0
    };
    const name = `${customer.firstName} ${customer.lastName}`;
    if (target === 'pickup') {
      setPickup(addr);
      setPickupContact(name);
      setPickupContactPhone(customer.phone || '');
    } else {
      setDropoff(addr);
      setDropoffContact(name);
      setDropoffContactPhone(customer.phone || '');
    }
  }, [customer]);

  const getWindowLabel = useCallback((value: string): string => {
    return TIME_WINDOWS.find(tw => tw.value === value)?.label ?? 'Select time window';
  }, []);

  const validate = useCallback((): boolean => {
    if (!pickup?.line1?.trim() || !pickup?.townCity?.trim() || !pickup?.postcode?.trim() || !pickupContact.trim() || !pickupContactPhone.trim()) {
      Alert.alert('Missing Info', 'Please fill in all pickup details, including a contact phone number.');
      return false;
    }
    if (!dropoff?.line1?.trim() || !dropoff?.townCity?.trim() || !dropoff?.postcode?.trim() || !dropoffContact.trim() || !dropoffContactPhone.trim()) {
      Alert.alert('Missing Info', 'Please fill in all dropoff details, including a contact phone number.');
      return false;
    }
    const parcelsValid = parcels.every(p => p.lengthCm && p.weightKg);
    if (!parcelsValid) {
      Alert.alert('Missing Info', 'Please fill in dimensions and weight for all parcels.');
      return false;
    }
    return true;
  }, [pickup, pickupContact, dropoff, dropoffContact, parcels]);

  const handleInternalSubmit = async () => {
    if (!validate()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (mode === 'booking' && !isSummaryMode) {
      setIsSummaryMode(true);
      return;
    }
    
    const formData = {
      pickup,
      pickupContactName: pickupContact.trim(),
      pickupContactPhone: pickupContactPhone.trim(),
      dropoff,
      dropoffContactName: dropoffContact.trim(),
      dropoffContactPhone: dropoffContactPhone.trim(),
      parcels: parcels.map(p => ({
        ...p,
        lengthCm: parseFloat(p.lengthCm),
        widthCm: parseFloat(p.widthCm),
        heightCm: parseFloat(p.heightCm),
        weightKg: parseFloat(p.weightKg),
        quantity: parseInt(p.quantity, 10) || 1
      })),
      vehicleType: selectedVehicle,
      estimatedPrice,
      distanceMiles,
      jobType: selectedJobType,
      specialInstructions: specialInstructions.trim() || undefined,
      pickupTimeWindow: isReadyNow ? 'READY_NOW' : (selectedPickupWindow || undefined),
      deliveryTimeWindow: selectedDeliveryWindow || undefined,
      isReadyNow,
      totalIncVat: estimatedPrice * 1.2,
      vatAmount: estimatedPrice * 0.2,
    };

    await onSubmit(formData);
  };

  const renderQuickFill = (target: LocationTarget) => (
    <View style={styles.savedLocationsWrap}>
      <TouchableOpacity 
        style={styles.quickFillBtn}
        onPress={() => handleQuickFill(target)}
      >
        <User size={14} color={Colors.customerPrimary} />
        <Text style={styles.quickFillText}>Fill with my profile address</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSummary = () => {
    const vat = estimatedPrice * 0.2;
    const total = estimatedPrice + vat;

    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summaryHeader}>
          <Calculator size={22} color={Colors.customerPrimary} />
          <View>
            <Text style={styles.summaryTitle}>Booking Summary</Text>
            <Text style={styles.summarySubtitle}>Review your shipment details</Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryIcon}>
              <MapPin size={16} color={Colors.success} />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>PICKUP</Text>
              <Text style={styles.summaryText}>{pickup?.line1}, {pickup?.townCity}</Text>
              <Text style={styles.summarySubtext}>{pickupContact}</Text>
            </View>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <View style={styles.summaryIcon}>
              <MapPin size={16} color={Colors.danger} />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>DROPOFF</Text>
              <Text style={styles.summaryText}>{dropoff?.line1}, {dropoff?.townCity}</Text>
              <Text style={styles.summarySubtext}>{dropoffContact}</Text>
            </View>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <View style={styles.summaryIcon}>
              <Truck size={16} color={Colors.customerPrimary} />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>SHIPMENT</Text>
              <Text style={styles.summaryText}>{selectedVehicle} · {selectedJobType}</Text>
              <Text style={styles.summarySubtext}>
                {parcels.reduce((acc, p) => acc + (parseInt(p.quantity) || 1), 0)} items · {distanceMiles.toFixed(1)} miles
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.priceBreakdownCard}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal</Text>
            <Text style={styles.priceValue}>£{estimatedPrice.toFixed(2)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>VAT (20%)</Text>
            <Text style={styles.priceValue}>£{vat.toFixed(2)}</Text>
          </View>
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>£{total.toFixed(2)}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.backLink}
          onPress={() => setIsSummaryMode(false)}
        >
          <Text style={styles.backLinkText}>Edit details</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {isSummaryMode ? (
        renderSummary()
      ) : (
        <>
          {/* Pickup Section */}
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
              <PostcodeAutocompleteMobile 
                label="Pickup Address" 
                onAddressSelect={setPickup} 
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
              <View style={styles.inputRow}>
                <User size={16} color={Colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="Contact phone at pickup"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="phone-pad"
                  value={pickupContactPhone}
                  onChangeText={setPickupContactPhone}
                />
              </View>
            </View>
          </View>

          {/* Dropoff Section */}
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
              <PostcodeAutocompleteMobile 
                label="Dropoff Address" 
                onAddressSelect={setDropoff} 
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
              <View style={styles.inputRow}>
                <User size={16} color={Colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="Contact phone at dropoff"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="phone-pad"
                  value={dropoffContactPhone}
                  onChangeText={setDropoffContactPhone}
                />
              </View>
            </View>
          </View>

          {/* Job Type Section */}
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

          {/* Parcels Section */}
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
                  <View style={styles.parcelRow}>
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

          {/* Special Instructions Section */}
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
                />
              </View>
            </View>
          </View>

          {/* Vehicle Type Section */}
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

          {/* Collection Time Section */}
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

          {/* Estimate Card */}
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
        </>
      )}

      {/* Main Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, (isSubmitting || (calculationError !== '' && !isSummaryMode)) && styles.submitButtonDisabled]}
        onPress={handleInternalSubmit}
        disabled={isSubmitting || (calculationError !== '' && !isSummaryMode)}
        activeOpacity={0.8}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            <Text style={styles.submitButtonText}>
              {mode === 'booking' 
                ? (isSummaryMode ? 'Confirm & Pay Now' : 'Continue to Summary') 
                : 'Submit Quote Request'}
            </Text>
            {mode === 'booking' ? (
                <ChevronRight size={18} color="#FFFFFF" />
            ) : (
                <Send size={18} color="#FFFFFF" />
            )}
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
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
  submitButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.customerPrimary,
    borderRadius: 14,
    height: 56,
    gap: 8,
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
  estimateCardError: {
    borderColor: Colors.danger + '40',
    backgroundColor: '#FEF2F2',
  },
  // Summary Styles
  summaryContainer: {
    marginBottom: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    backgroundColor: Colors.customerPrimary + '10',
    padding: 16,
    borderRadius: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.customerPrimary,
  },
  summarySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 16,
    gap: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  summarySubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: 44,
  },
  priceBreakdownCard: {
    backgroundColor: Colors.navy,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    gap: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  totalRow: {
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  backLink: {
    alignSelf: 'center',
    paddingVertical: 10,
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.customerPrimary,
    textDecorationLine: 'underline',
  },
});
