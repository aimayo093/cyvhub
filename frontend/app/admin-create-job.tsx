import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Search,
  Building2,
  MapPin,
  Truck,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Package,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { apiClient } from '@/services/api';
import { useJobs } from '@/providers/JobsProvider';
import { ResponsiveContainer } from '@/components/ResponsiveContainer';
import { PostcodeAutocompleteMobile } from '@/components/shared/PostcodeAutocompleteMobile';

export default function AdminCreateJobScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { adminCreateJob } = useJobs();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [pickup, setPickup] = useState<any>(null);
  const [dropoff, setDropoff] = useState<any>(null);

  const [formData, setFormData] = useState({
    customerEmail: '',
    pickupName: '',
    pickupPhone: '',
    dropoffName: '',
    dropoffPhone: '',
    vehicleType: 'SMALL_VAN',
    goodsDescription: '',
    priority: 'NORMAL' as 'NORMAL' | 'URGENT',
    weightKg: '10',
    lengthCm: '30',
    widthCm: '30',
    heightCm: '30',
    distanceMiles: '10',
  });

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    try {
      const res = await apiClient('/admin/businesses');
      setBusinesses(res || []);
    } catch (error) {
      console.error('Failed to load businesses:', error);
    }
  };

  const filteredBusinesses = businesses.filter(b => 
    b.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.tradingName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNext = async () => {
    if (step === 1 && !selectedBusiness && searchQuery === '') {
       // Allow continuing as guest
    }
    
    if (step === 2 && pickup?.postcode && dropoff?.postcode) {
        setLoading(true);
        try {
            const res = await apiClient('/location/distance', {
                method: 'POST',
                body: JSON.stringify({
                    pickupPostcode: pickup.postcode,
                    dropoffPostcode: dropoff.postcode
                })
            });
            if (res && res.distanceMiles) {
                setFormData(prev => ({ ...prev, distanceMiles: res.distanceMiles.toString() }));
            }
        } catch (e) {
            console.warn('Could not auto-calc distance:', e);
        } finally {
            setLoading(false);
        }
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (step === 1) {
      router.back();
    } else {
      setStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    // 1. FRONTEND VALIDATION
    const dist = parseFloat(formData.distanceMiles || '0');
    const weight = parseFloat(formData.weightKg || '0');
    if (dist <= 0) {
      return Alert.alert('Validation Error', 'Please enter a valid distance (> 0 miles)');
    }
    if (weight <= 0) {
      return Alert.alert('Validation Error', 'Weight must be greater than 0kg');
    }

    setLoading(true);
    try {
      // Map frontend fields to backend refined schema
      const payload = {
        businessId: selectedBusiness?.id,
        customerEmail: formData.customerEmail,
        pickupContactName: formData.pickupName,
        pickupContactPhone: formData.pickupPhone,
        pickupAddressLine1: pickup.line1,
        pickupAddressLine2: pickup.line2,
        pickupCity: pickup.townCity,
        pickupCounty: pickup.county,
        pickupPostcode: pickup.postcode,
        pickupLatitude: pickup.latitude,
        pickupLongitude: pickup.longitude,

        dropoffContactName: formData.dropoffName,
        dropoffContactPhone: formData.dropoffPhone,
        dropoffAddressLine1: dropoff.line1,
        dropoffAddressLine2: dropoff.line2,
        dropoffCity: dropoff.townCity,
        dropoffCounty: dropoff.county,
        dropoffPostcode: dropoff.postcode,
        dropoffLatitude: dropoff.latitude,
        dropoffLongitude: dropoff.longitude,

        vehicleType: formData.vehicleType,
        goodsDescription: formData.goodsDescription,
        priority: formData.priority,
        // Integrate with the new Pricing Engine via Items array
        items: [
          {
            weightKg: weight,
            lengthCm: parseFloat(formData.lengthCm || '0'),
            widthCm: parseFloat(formData.widthCm || '0'),
            heightCm: parseFloat(formData.heightCm || '0'),
            quantity: 1,
            description: formData.goodsDescription || 'Standard Parcel'
          }
        ],
        pickupTimeWindow: new Date().toISOString(),
        deliveryTimeWindow: new Date(Date.now() + 4 * 3600000).toISOString(),
        jobType: 'SAME_DAY',
        distanceMilesOverride: dist,
        pickupCoords: { lat: pickup.latitude, lng: pickup.longitude },
        dropoffCoords: { lat: dropoff.latitude, lng: dropoff.longitude },
      };

      console.log('[DEBUG] Submitting Job Payload:', payload);
      await adminCreateJob(payload);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Job & Quote created successfully', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/manage-jobs' as any) }
      ]);
    } catch (error: any) {
        console.error('Submit Error:', error);
        Alert.alert('System Error', error.message || 'Failed to create job. Pricing or Suitability mismatch.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <ArrowLeft size={24} color={Colors.textInverse} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create New Job</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.stepIndicator}>
          {[1, 2, 3].map(s => (
            <React.Fragment key={s}>
               <View style={[styles.stepDot, step >= s && styles.stepDotActive]}>
                 <Text style={[styles.stepNum, step >= s && styles.stepNumActive]}>{s}</Text>
               </View>
               {s < 3 && <View style={[styles.stepLine, step > s && styles.stepLineActive]} />}
            </React.Fragment>
          ))}
        </View>
      </View>

      <ResponsiveContainer scrollable={true} backgroundColor="#F8FAFC">
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.label}>Select Client Account</Text>
            <View style={styles.searchBox}>
              <Search size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search business names..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <TouchableOpacity 
              style={[styles.businessCard, selectedBusiness === null && styles.selectedCard]}
              onPress={() => setSelectedBusiness(null)}
            >
              <Text style={styles.businessName}>Retail / Guest Customer</Text>
              <Text style={styles.businessSub}>Standard platform pricing</Text>
              {selectedBusiness === null && <CheckCircle2 size={20} color={Colors.primary} />}
            </TouchableOpacity>

            {filteredBusinesses.map(b => (
              <TouchableOpacity 
                key={b.id}
                style={[styles.businessCard, selectedBusiness?.id === b.id && styles.selectedCard]}
                onPress={() => setSelectedBusiness(b)}
              >
                <View style={styles.businessInfo}>
                  <Text style={styles.businessName}>{b.companyName}</Text>
                  <Text style={styles.businessSub}>{b.contract ? 'Contracted Rates' : 'Account Pricing'}</Text>
                </View>
                {selectedBusiness?.id === b.id && <CheckCircle2 size={20} color={Colors.primary} />}
              </TouchableOpacity>
            ))}

            <Text style={[styles.label, { marginTop: 24 }]}>Customer Notification Email</Text>
            <TextInput
              style={styles.input}
              placeholder="customer@example.com (Required for Invoice)"
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.customerEmail}
              onChangeText={val => setFormData({ ...formData, customerEmail: val })}
            />
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.sectionTitle}>Pickup Details</Text>
            
            <View style={{ marginBottom: 12 }}>
                <PostcodeAutocompleteMobile 
                  label="Pickup Address" 
                  onAddressSelect={setPickup} 
                  initialValue={pickup} 
                />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Contact Name"
              value={formData.pickupName}
              onChangeText={val => setFormData({ ...formData, pickupName: val })}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              keyboardType="phone-pad"
              value={formData.pickupPhone}
              onChangeText={val => setFormData({ ...formData, pickupPhone: val })}
            />

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Dropoff Details</Text>
            
            <View style={{ marginBottom: 12 }}>
                <PostcodeAutocompleteMobile 
                  label="Dropoff Address" 
                  onAddressSelect={setDropoff} 
                  initialValue={dropoff} 
                />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Contact Name"
              value={formData.dropoffName}
              onChangeText={val => setFormData({ ...formData, dropoffName: val })}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              keyboardType="phone-pad"
              value={formData.dropoffPhone}
              onChangeText={val => setFormData({ ...formData, dropoffPhone: val })}
            />
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContainer}>
             <Text style={styles.sectionTitle}>Job Requirements</Text>

             <Text style={styles.label}>Parcel Dimensions</Text>
             <View style={styles.row}>
               <View style={{ flex: 1 }}>
                 <Text style={styles.miniLabel}>Weight (kg)</Text>
                 <TextInput
                   style={styles.input}
                   keyboardType="numeric"
                   value={formData.weightKg}
                   onChangeText={val => setFormData({ ...formData, weightKg: val })}
                 />
               </View>
               <View style={{ flex: 1 }}>
                 <Text style={styles.miniLabel}>Length (cm)</Text>
                 <TextInput
                   style={styles.input}
                   keyboardType="numeric"
                   value={formData.lengthCm}
                   onChangeText={val => setFormData({ ...formData, lengthCm: val })}
                 />
               </View>
             </View>
             <View style={styles.row}>
               <View style={{ flex: 1 }}>
                 <Text style={styles.miniLabel}>Width (cm)</Text>
                 <TextInput
                   style={styles.input}
                   keyboardType="numeric"
                   value={formData.widthCm}
                   onChangeText={val => setFormData({ ...formData, widthCm: val })}
                 />
               </View>
               <View style={{ flex: 1 }}>
                 <Text style={styles.miniLabel}>Height (cm)</Text>
                 <TextInput
                   style={styles.input}
                   keyboardType="numeric"
                   value={formData.heightCm}
                   onChangeText={val => setFormData({ ...formData, heightCm: val })}
                 />
               </View>
             </View>

             <View style={styles.row}>
               <View style={{ flex: 1 }}>
                 <Text style={styles.miniLabel}>Distance (miles)</Text>
                 <TextInput
                   style={styles.input}
                   keyboardType="numeric"
                   value={formData.distanceMiles}
                   onChangeText={val => setFormData({ ...formData, distanceMiles: val })}
                 />
               </View>
               <View style={{ flex: 1 }} />
             </View>

             <Text style={styles.label}>Vehicle Type</Text>
             <View style={styles.vehicleGrid}>
               {[
                 { id: 'SMALL_VAN', label: 'Small Van' },
                 { id: 'MEDIUM_VAN', label: 'Medium Van' },
                 { id: 'LARGE_VAN', label: 'Large Van' },
                 { id: 'LUTON_BOX', label: 'Luton Box' }
               ].map(v => (
                 <TouchableOpacity 
                   key={v.id} 
                   style={[styles.vehicleBtn, formData.vehicleType === v.id && styles.vehicleBtnActive]}
                   onPress={() => setFormData({ ...formData, vehicleType: v.id })}
                 >
                   <Truck size={20} color={formData.vehicleType === v.id ? '#FFF' : Colors.textMuted} />
                   <Text style={[styles.vehicleBtnText, formData.vehicleType === v.id && styles.vehicleBtnTextActive]}>{v.label}</Text>
                 </TouchableOpacity>
               ))}
             </View>

             <Text style={styles.label}>Goods Description</Text>
             <TextInput
               style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
               multiline
               placeholder="What are we moving?"
               value={formData.goodsDescription}
               onChangeText={val => setFormData({ ...formData, goodsDescription: val })}
             />

             <Text style={styles.label}>Priority</Text>
             <View style={styles.row}>
               <TouchableOpacity 
                 style={[styles.priorityBtn, formData.priority === 'NORMAL' && styles.priorityBtnActive]} 
                 onPress={() => setFormData({ ...formData, priority: 'NORMAL' })}
               >
                 <Text style={[styles.priorityText, formData.priority === 'NORMAL' && styles.priorityTextActive]}>Normal (SLA)</Text>
               </TouchableOpacity>
               <TouchableOpacity 
                 style={[styles.priorityBtn, formData.priority === 'URGENT' && styles.priorityBtnUrgent]} 
                 onPress={() => setFormData({ ...formData, priority: 'URGENT' })}
               >
                 <Text style={[styles.priorityText, formData.priority === 'URGENT' && styles.priorityTextActive]}>Urgent (NOW)</Text>
               </TouchableOpacity>
             </View>

             <View style={styles.summaryBox}>
                <Text style={styles.summaryTitle}>Job Summary</Text>
                <View style={styles.summaryItem}>
                   <Building2 size={14} color={Colors.textMuted} />
                   <Text style={styles.summaryValue}>{selectedBusiness?.companyName || 'Guest Customer'}</Text>
                </View>
                 <View style={styles.summaryItem}>
                    <MapPin size={14} color={Colors.textMuted} />
                    <Text style={styles.summaryValue}>{pickup?.townCity || 'Pickup City'} → {dropoff?.townCity || 'Dropoff City'}</Text>
                 </View>
             </View>
          </View>
        )}
      </ResponsiveContainer>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        {step < 3 ? (
          <TouchableOpacity 
             style={styles.nextBtn} 
             onPress={handleNext}
             disabled={loading}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : (
                <>
                  <Text style={styles.nextBtnText}>Continue</Text>
                  <ChevronRight size={20} color="#FFF" />
                </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.nextBtn, { backgroundColor: Colors.success }]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.nextBtnText}>Create Job & Quote</Text>
                <CheckCircle2 size={20} color="#FFF" />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: Colors.navy, paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1000, alignSelf: 'center', width: '100%' },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800' as const, color: '#FFFFFF' },
  stepIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24, maxWidth: 1000, alignSelf: 'center', width: '100%' },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: Colors.adminPrimary },
  stepNum: { fontSize: 12, fontWeight: '700' as const, color: 'rgba(255,255,255,0.5)' },
  stepNumActive: { color: '#FFF' },
  stepLine: { width: 40, height: 2, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 8 },
  stepLineActive: { backgroundColor: Colors.adminPrimary },
  content: { flex: 1 },
  contentInner: { paddingVertical: 20, paddingHorizontal: 0 },
  footerContent: { padding: 20, maxWidth: 1000, alignSelf: 'center', width: '100%' },
  stepContainer: { animationDuration: '0.3s' },
  sectionTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text, marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600' as const, color: Colors.textSecondary, marginBottom: 8, marginTop: 12 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 12, height: 48, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15 },
  businessCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#E2E8F0' },
  selectedCard: { borderColor: Colors.primary, backgroundColor: Colors.primary + '05', borderWidth: 2 },
  businessInfo: { flex: 1 },
  businessName: { fontSize: 15, fontWeight: '700' as const, color: Colors.text },
  businessSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  input: { backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 16, height: 50, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0', fontSize: 15 },
  miniLabel: { fontSize: 12, fontWeight: '600' as const, color: Colors.textMuted, marginBottom: 4 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  vehicleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  vehicleBtn: { flex: 1, minWidth: '45%', backgroundColor: '#FFF', padding: 16, borderRadius: 12, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  vehicleBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  vehicleBtnText: { fontSize: 13, fontWeight: '600' as const, color: Colors.textSecondary },
  vehicleBtnTextActive: { color: '#FFF' },
  priorityBtn: { flex: 1, backgroundColor: '#FFF', paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  priorityBtnActive: { backgroundColor: Colors.success, borderColor: Colors.success },
  priorityBtnUrgent: { backgroundColor: Colors.danger, borderColor: Colors.danger },
  priorityText: { fontSize: 14, fontWeight: '700' as const, color: Colors.textSecondary },
  priorityTextActive: { color: '#FFF' },
  summaryBox: { backgroundColor: Colors.navyLight, padding: 16, borderRadius: 14, marginTop: 24 },
  summaryTitle: { fontSize: 14, fontWeight: '700' as const, color: '#FFF', marginBottom: 12 },
  summaryItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  summaryValue: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  footer: { padding: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  nextBtn: { backgroundColor: Colors.adminPrimary, borderRadius: 14, height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  nextBtnText: { fontSize: 16, fontWeight: '700' as const, color: '#FFF' },
  addressRefSummary: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  addressRefText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
});
