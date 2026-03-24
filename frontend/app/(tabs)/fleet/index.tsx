import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Truck,
  CheckCircle,
  AlertTriangle,
  WifiOff,
  Calendar,
  Shield,
  Wrench,
  User,
  Plus,
  X,
  ChevronDown,
  MapPin,
  Clock,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import { useCarrier } from '@/providers/CarrierProvider';
import { FleetVehicle } from '@/types';

const AVAILABLE_COVERAGE_REGIONS = [
  'London',
  'Greater London',
  'South East',
  'South West',
  'East of England',
  'East Midlands',
  'West Midlands',
  'Yorkshire and The Humber',
  'North East',
  'North West',
  'Wales',
  'Scotland',
  'Northern Ireland',
];
type FleetFilter = 'all' | 'ACTIVE' | 'MAINTENANCE' | 'OFFLINE';
type FleetTab = 'vehicles' | 'regions' | 'schedule';

const FILTERS: { key: FleetFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'MAINTENANCE', label: 'Maint.' },
  { key: 'OFFLINE', label: 'Offline' },
];

const VEHICLE_TYPES = ['Small Van', 'Medium Van', 'Large Van', 'HGV'];

function getStatusIcon(status: FleetVehicle['status']) {
  switch (status) {
    case 'ACTIVE': return CheckCircle;
    case 'MAINTENANCE': return Wrench;
    case 'OFFLINE': return WifiOff;
  }
}

function getStatusColor(status: FleetVehicle['status']) {
  switch (status) {
    case 'ACTIVE': return Colors.success;
    case 'MAINTENANCE': return Colors.warning;
    case 'OFFLINE': return Colors.textMuted;
  }
}

function getStatusBg(status: FleetVehicle['status']) {
  switch (status) {
    case 'ACTIVE': return Colors.successLight;
    case 'MAINTENANCE': return Colors.warningLight;
    case 'OFFLINE': return '#F1F5F9';
  }
}

export default function FleetScreen() {
  const insets = useSafeAreaInsets();
  const { userRole } = useAuth();
  const { fleet, updateVehicleStatus, addVehicle, coverageRegions, updateCoverageRegions, availability, updateAvailability } = useCarrier();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FleetFilter>('all');
  const [activeTab, setActiveTab] = useState<FleetTab>('vehicles');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRegions, setSelectedRegions] = useState<string[]>(coverageRegions);

  const [formReg, setFormReg] = useState('');
  const [formType, setFormType] = useState('Medium Van');
  const [formMake, setFormMake] = useState('');
  const [formModel, setFormModel] = useState('');
  const [formYear, setFormYear] = useState('');
  const [formCapacity, setFormCapacity] = useState('');
  const [showTypePicker, setShowTypePicker] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const filteredFleet = filter === 'all' ? fleet : fleet.filter(v => v.status === filter);

  const handleToggleStatus = useCallback((vehicle: FleetVehicle) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (vehicle.status === 'ACTIVE') {
      updateVehicleStatus(vehicle.id, 'OFFLINE');
    } else if (vehicle.status === 'OFFLINE') {
      updateVehicleStatus(vehicle.id, 'ACTIVE');
    }
  }, [updateVehicleStatus]);

  const handleAddVehicle = useCallback(() => {
    if (!formReg || !formMake || !formModel) {
      Alert.alert('Error', 'Please fill in registration, make and model.');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addVehicle({
      registration: formReg.toUpperCase(),
      type: formType,
      make: formMake,
      model: formModel,
      year: parseInt(formYear) || new Date().getFullYear(),
      capacity: formCapacity || 'TBC',
      status: 'ACTIVE',
      motExpiry: '2027-01-01',
      insuranceExpiry: '2027-01-01',
      lastService: new Date().toISOString().split('T')[0],
    });
    setShowAddModal(false);
    setFormReg('');
    setFormMake('');
    setFormModel('');
    setFormYear('');
    setFormCapacity('');
  }, [formReg, formType, formMake, formModel, formYear, formCapacity, addVehicle]);

  const toggleRegion = useCallback((region: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedRegions(prev => {
      const updated = prev.includes(region) ? prev.filter(r => r !== region) : [...prev, region];
      return updated;
    });
  }, []);

  const saveRegions = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateCoverageRegions(selectedRegions);
    Alert.alert('Saved', 'Coverage regions updated.');
  }, [selectedRegions, updateCoverageRegions]);

  const toggleScheduleDay = useCallback((dayIndex: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = availability.map((slot, i) =>
      i === dayIndex ? { ...slot, active: !slot.active } : slot
    );
    updateAvailability(updated);
  }, [availability, updateAvailability]);

  if (userRole !== 'carrier') {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Fleet management is not available in this view.</Text>
      </View>
    );
  }

  const activeCount = fleet.filter(v => v.status === 'ACTIVE').length;
  const maintenanceCount = fleet.filter(v => v.status === 'MAINTENANCE').length;
  const offlineCount = fleet.filter(v => v.status === 'OFFLINE').length;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Fleet Management</Text>
            <Text style={styles.headerSubtitle}>{fleet.length} vehicles registered</Text>
          </View>
          {activeTab === 'vehicles' && (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => { setShowAddModal(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              activeOpacity={0.7}
            >
              <Plus size={18} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { borderBottomColor: Colors.success }]}>
            <Text style={styles.summaryValue}>{activeCount}</Text>
            <Text style={styles.summaryLabel}>Active</Text>
          </View>
          <View style={[styles.summaryCard, { borderBottomColor: Colors.warning }]}>
            <Text style={styles.summaryValue}>{maintenanceCount}</Text>
            <Text style={styles.summaryLabel}>Maint.</Text>
          </View>
          <View style={[styles.summaryCard, { borderBottomColor: Colors.textMuted }]}>
            <Text style={styles.summaryValue}>{offlineCount}</Text>
            <Text style={styles.summaryLabel}>Offline</Text>
          </View>
        </View>
      </View>

      <View style={styles.tabBar}>
        {([
          { key: 'vehicles' as const, label: 'Vehicles', icon: Truck },
          { key: 'regions' as const, label: 'Regions', icon: MapPin },
          { key: 'schedule' as const, label: 'Schedule', icon: Clock },
        ]).map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
            onPress={() => {
              setActiveTab(tab.key);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <tab.icon size={14} color={activeTab === tab.key ? '#FFF' : Colors.textSecondary} />
            <Text style={[styles.tabItemText, activeTab === tab.key && styles.tabItemTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'vehicles' && (
        <>
          <View style={styles.filterRow}>
            {FILTERS.map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setFilter(f.key);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterChipText, filter === f.key && styles.filterChipTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.carrierPrimary} />
            }
          >
            {filteredFleet.map((vehicle) => {
              const StatusIcon = getStatusIcon(vehicle.status);
              const statusColor = getStatusColor(vehicle.status);
              const statusBg = getStatusBg(vehicle.status);

              return (
                <View key={vehicle.id} style={styles.vehicleCard}>
                  <View style={styles.vehicleHeader}>
                    <View style={styles.vehicleInfo}>
                      <View style={[styles.vehicleTypeIcon, { backgroundColor: Colors.carrierPrimary + '12' }]}>
                        <Truck size={20} color={Colors.carrierPrimary} />
                      </View>
                      <View style={styles.vehicleDetails}>
                        <Text style={styles.vehicleReg}>{vehicle.registration}</Text>
                        <Text style={styles.vehicleMakeModel}>{vehicle.make} {vehicle.model}</Text>
                      </View>
                    </View>
                    <View style={[styles.vehicleStatusBadge, { backgroundColor: statusBg }]}>
                      <StatusIcon size={12} color={statusColor} />
                      <Text style={[styles.vehicleStatusText, { color: statusColor }]}>{vehicle.status}</Text>
                    </View>
                  </View>

                  <View style={styles.vehicleMeta}>
                    <View style={styles.vehicleMetaItem}>
                      <Text style={styles.vehicleMetaLabel}>Type</Text>
                      <Text style={styles.vehicleMetaValue}>{vehicle.type}</Text>
                    </View>
                    <View style={styles.vehicleMetaItem}>
                      <Text style={styles.vehicleMetaLabel}>Capacity</Text>
                      <Text style={styles.vehicleMetaValue}>{vehicle.capacity}</Text>
                    </View>
                    <View style={styles.vehicleMetaItem}>
                      <Text style={styles.vehicleMetaLabel}>Year</Text>
                      <Text style={styles.vehicleMetaValue}>{vehicle.year}</Text>
                    </View>
                  </View>

                  {vehicle.currentDriver && (
                    <View style={styles.vehicleDriver}>
                      <User size={13} color={Colors.textMuted} />
                      <Text style={styles.vehicleDriverText}>{vehicle.currentDriver}</Text>
                    </View>
                  )}

                  <View style={styles.vehicleCompliance}>
                    <View style={styles.complianceItem}>
                      <Calendar size={12} color={Colors.textMuted} />
                      <Text style={styles.complianceText}>MOT: {vehicle.motExpiry}</Text>
                    </View>
                    <View style={styles.complianceItem}>
                      <Shield size={12} color={Colors.textMuted} />
                      <Text style={styles.complianceText}>Ins: {vehicle.insuranceExpiry}</Text>
                    </View>
                  </View>

                  {vehicle.status !== 'MAINTENANCE' && (
                    <TouchableOpacity
                      style={[styles.toggleBtn, {
                        backgroundColor: vehicle.status === 'ACTIVE' ? Colors.dangerLight : Colors.successLight,
                        borderColor: vehicle.status === 'ACTIVE' ? Colors.danger + '30' : Colors.success + '30',
                      }]}
                      onPress={() => handleToggleStatus(vehicle)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.toggleBtnText, {
                        color: vehicle.status === 'ACTIVE' ? Colors.danger : Colors.success,
                      }]}>
                        {vehicle.status === 'ACTIVE' ? 'Set Offline' : 'Set Active'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}

            {filteredFleet.length === 0 && (
              <View style={styles.emptyState}>
                <Truck size={48} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>No vehicles found</Text>
                <Text style={styles.emptySubtitle}>No vehicles match the selected filter.</Text>
              </View>
            )}

            <View style={{ height: 24 }} />
          </ScrollView>
        </>
      )}

      {activeTab === 'regions' && (
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.regionHeader}>
            <MapPin size={20} color={Colors.carrierPrimary} />
            <View>
              <Text style={styles.regionHeaderTitle}>Coverage Regions</Text>
              <Text style={styles.regionHeaderSub}>{selectedRegions.length} regions selected</Text>
            </View>
          </View>

          <View style={styles.regionGrid}>
            {AVAILABLE_COVERAGE_REGIONS.map((region: any) => {
              const isSelected = selectedRegions.includes(region);
              return (
                <TouchableOpacity
                  key={region}
                  style={[styles.regionChip, isSelected && styles.regionChipActive]}
                  onPress={() => toggleRegion(region)}
                  activeOpacity={0.7}
                >
                  {isSelected && <CheckCircle size={14} color="#FFF" />}
                  <Text style={[styles.regionChipText, isSelected && styles.regionChipTextActive]}>
                    {region}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={saveRegions} activeOpacity={0.7}>
            <Text style={styles.saveBtnText}>Save Regions</Text>
          </TouchableOpacity>

          <View style={{ height: 24 }} />
        </ScrollView>
      )}

      {activeTab === 'schedule' && (
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.scheduleHeader}>
            <Clock size={20} color={Colors.carrierPrimary} />
            <View>
              <Text style={styles.scheduleHeaderTitle}>Availability Schedule</Text>
              <Text style={styles.scheduleHeaderSub}>Set your operating hours</Text>
            </View>
          </View>

          {availability.map((slot, index) => (
            <View key={slot.day} style={styles.scheduleRow}>
              <TouchableOpacity
                style={[styles.dayToggle, slot.active && styles.dayToggleActive]}
                onPress={() => toggleScheduleDay(index)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dayToggleText, slot.active && styles.dayToggleTextActive]}>
                  {slot.day.slice(0, 3)}
                </Text>
              </TouchableOpacity>
              <View style={styles.scheduleInfo}>
                <Text style={styles.scheduleDay}>{slot.day}</Text>
                {slot.active ? (
                  <Text style={styles.scheduleTime}>{slot.startTime} - {slot.endTime}</Text>
                ) : (
                  <Text style={styles.scheduleClosed}>Closed</Text>
                )}
              </View>
              <View style={[styles.scheduleStatus, { backgroundColor: slot.active ? Colors.successLight : Colors.surfaceAlt }]}>
                <Text style={[styles.scheduleStatusText, { color: slot.active ? Colors.success : Colors.textMuted }]}>
                  {slot.active ? 'Active' : 'Off'}
                </Text>
              </View>
            </View>
          ))}

          <View style={{ height: 24 }} />
        </ScrollView>
      )}

      <Modal visible={showAddModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Vehicle</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.formLabel}>Registration</Text>
              <TextInput
                style={styles.formInput}
                value={formReg}
                onChangeText={setFormReg}
                placeholder="e.g. CY24 NEW"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="characters"
              />

              <Text style={styles.formLabel}>Vehicle Type</Text>
              <TouchableOpacity
                style={styles.pickerBtn}
                onPress={() => setShowTypePicker(!showTypePicker)}
              >
                <Text style={styles.pickerBtnText}>{formType}</Text>
                <ChevronDown size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
              {showTypePicker && (
                <View style={styles.pickerOptions}>
                  {VEHICLE_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.pickerOption, formType === type && styles.pickerOptionActive]}
                      onPress={() => { setFormType(type); setShowTypePicker(false); }}
                    >
                      <Text style={[styles.pickerOptionText, formType === type && styles.pickerOptionTextActive]}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View style={styles.formRow}>
                <View style={styles.formHalf}>
                  <Text style={styles.formLabel}>Make</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formMake}
                    onChangeText={setFormMake}
                    placeholder="e.g. Mercedes"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
                <View style={styles.formHalf}>
                  <Text style={styles.formLabel}>Model</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formModel}
                    onChangeText={setFormModel}
                    placeholder="e.g. Sprinter"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formHalf}>
                  <Text style={styles.formLabel}>Year</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formYear}
                    onChangeText={setFormYear}
                    placeholder="2024"
                    keyboardType="number-pad"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
                <View style={styles.formHalf}>
                  <Text style={styles.formLabel}>Capacity</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formCapacity}
                    onChangeText={setFormCapacity}
                    placeholder="e.g. 1,400 kg"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleAddVehicle} activeOpacity={0.7}>
                <Plus size={18} color="#FFF" />
                <Text style={styles.submitBtnText}>Add Vehicle</Text>
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
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center' as const,
  },
  header: {
    backgroundColor: Colors.navy,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.textInverse,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
    marginBottom: 16,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.carrierPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.navyLight,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.textInverse,
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: Colors.surfaceAlt,
    gap: 5,
  },
  tabItemActive: {
    backgroundColor: Colors.carrierPrimary,
  },
  tabItemText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  tabItemTextActive: {
    color: '#FFFFFF',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.carrierPrimary,
    borderColor: Colors.carrierPrimary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
  },
  vehicleCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  vehicleTypeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleDetails: {
    flex: 1,
  },
  vehicleReg: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  vehicleMakeModel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  vehicleStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  vehicleStatusText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  vehicleMeta: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  vehicleMetaItem: {
    flex: 1,
    alignItems: 'center',
  },
  vehicleMetaLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  vehicleMetaValue: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 2,
  },
  vehicleDriver: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  vehicleDriverText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  vehicleCompliance: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  complianceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  complianceText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  toggleBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
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
    textAlign: 'center' as const,
    paddingHorizontal: 32,
  },
  regionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    backgroundColor: Colors.carrierPrimary + '10',
    padding: 14,
    borderRadius: 14,
  },
  regionHeaderTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  regionHeaderSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  regionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  regionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 5,
  },
  regionChipActive: {
    backgroundColor: Colors.carrierPrimary,
    borderColor: Colors.carrierPrimary,
  },
  regionChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  regionChipTextActive: {
    color: '#FFFFFF',
  },
  saveBtn: {
    backgroundColor: Colors.carrierPrimary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    backgroundColor: Colors.carrierPrimary + '10',
    padding: 14,
    borderRadius: 14,
  },
  scheduleHeaderTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  scheduleHeaderSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  dayToggle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayToggleActive: {
    backgroundColor: Colors.carrierPrimary,
    borderColor: Colors.carrierPrimary,
  },
  dayToggleText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.textMuted,
  },
  dayToggleTextActive: {
    color: '#FFFFFF',
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleDay: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  scheduleTime: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  scheduleClosed: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  scheduleStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scheduleStatusText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '85%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 6,
    marginTop: 12,
  },
  formInput: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formHalf: {
    flex: 1,
  },
  pickerBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pickerBtnText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  pickerOptions: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  pickerOption: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  pickerOptionActive: {
    backgroundColor: Colors.carrierPrimary + '12',
  },
  pickerOptionText: {
    fontSize: 14,
    color: Colors.text,
  },
  pickerOptionTextActive: {
    color: Colors.carrierPrimary,
    fontWeight: '600' as const,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.carrierPrimary,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 24,
    gap: 8,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
