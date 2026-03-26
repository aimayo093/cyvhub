import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import {
  DollarSign,
  Plus,
  Clock,
  Truck,
  TrendingUp,
  Calendar,
  CheckCircle,
  AlertTriangle,
  X,
  ChevronDown,
  History,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useCarrier } from '@/providers/CarrierProvider';
import { CarrierRateCard, Job } from '@/types';

type ViewTab = 'active' | 'history';

function getHistoryFromJobs(jobs: Job[]) {
  const historyMap: Record<string, { vehicleType: string; period: string; jobsUsed: number; totalRevenue: number }> = {};

  jobs.forEach(job => {
    const date = new Date(job.completedAt || job.createdAt);
    const period = date.toLocaleString('default', { month: 'short', year: 'numeric' });
    const key = `${job.vehicleType}-${period}`;

    if (!historyMap[key]) {
      historyMap[key] = {
        vehicleType: job.vehicleType,
        period,
        jobsUsed: 0,
        totalRevenue: 0,
      };
    }
    historyMap[key].jobsUsed += 1;
    historyMap[key].totalRevenue += job.calculatedPrice;
  });

  return Object.values(historyMap).sort((a, b) => new Date(b.period).getTime() - new Date(a.period).getTime());
}

const VEHICLE_TYPES = ['Small Van', 'Medium Van', 'Large Van', 'HGV'];

function getStatusColor(status: CarrierRateCard['status']) {
  switch (status) {
    case 'ACTIVE': return Colors.success;
    case 'DRAFT': return Colors.info;
    case 'EXPIRED': return Colors.textMuted;
  }
}

function getStatusBg(status: CarrierRateCard['status']) {
  switch (status) {
    case 'ACTIVE': return Colors.successLight;
    case 'DRAFT': return Colors.infoLight;
    case 'EXPIRED': return '#F1F5F9';
  }
}

export default function CarrierRatesScreen() {
  const { rateCards, addRateCard, updateRateCard, completedJobs } = useCarrier();
  const [activeTab, setActiveTab] = useState<ViewTab>('active');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCard, setEditingCard] = useState<CarrierRateCard | null>(null);

  const [formVehicleType, setFormVehicleType] = useState('Medium Van');
  const [formBaseRate, setFormBaseRate] = useState('');
  const [formPerKm, setFormPerKm] = useState('');
  const [formPerStop, setFormPerStop] = useState('');
  const [formWeekend, setFormWeekend] = useState('');
  const [formOOH, setFormOOH] = useState('');
  const [formHeavy, setFormHeavy] = useState('');
  const [showVehiclePicker, setShowVehiclePicker] = useState(false);

  const activeCards = rateCards.filter(r => r.status === 'ACTIVE');
  const expiredCards = rateCards.filter(r => r.status === 'EXPIRED');

  const resetForm = useCallback(() => {
    setFormVehicleType('Medium Van');
    setFormBaseRate('');
    setFormPerKm('');
    setFormPerStop('');
    setFormWeekend('');
    setFormOOH('');
    setFormHeavy('');
    setEditingCard(null);
  }, []);

  const handleAdd = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    resetForm();
    setShowAddModal(true);
  }, [resetForm]);

  const handleEdit = useCallback((card: CarrierRateCard) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingCard(card);
    setFormVehicleType(card.vehicleType);
    setFormBaseRate(card.baseRate.toString());
    setFormPerKm(card.perKmRate.toString());
    setFormPerStop(card.perStopRate.toString());
    setFormWeekend(card.weekendSurcharge.toString());
    setFormOOH(card.outOfHoursSurcharge.toString());
    setFormHeavy(card.heavyGoodsSurcharge.toString());
    setShowAddModal(true);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!formBaseRate || !formPerKm) {
      Alert.alert('Error', 'Please fill in at least base rate and per km rate.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const data = {
      vehicleType: formVehicleType,
      baseRate: parseFloat(formBaseRate),
      perKmRate: parseFloat(formPerKm),
      perStopRate: parseFloat(formPerStop || '0'),
      weekendSurcharge: parseFloat(formWeekend || '0'),
      outOfHoursSurcharge: parseFloat(formOOH || '0'),
      heavyGoodsSurcharge: parseFloat(formHeavy || '0'),
      effectiveFrom: new Date().toISOString().split('T')[0],
      status: 'ACTIVE' as const,
    };

    if (editingCard) {
      updateRateCard(editingCard.id, data);
    } else {
      addRateCard(data);
    }

    setShowAddModal(false);
    resetForm();
  }, [formVehicleType, formBaseRate, formPerKm, formPerStop, formWeekend, formOOH, formHeavy, editingCard, addRateCard, updateRateCard, resetForm]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Rate Management' }} />

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.tabActive]}
          onPress={() => { setActiveTab('active'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
        >
          <DollarSign size={14} color={activeTab === 'active' ? '#FFF' : Colors.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>Rate Cards</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => { setActiveTab('history'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
        >
          <History size={14} color={activeTab === 'history' ? '#FFF' : Colors.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>Usage History</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'active' ? (
          <>
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, { borderLeftColor: Colors.success }]}>
                <Text style={styles.summaryValue}>{activeCards.length}</Text>
                <Text style={styles.summaryLabel}>Active Cards</Text>
              </View>
              <View style={[styles.summaryCard, { borderLeftColor: Colors.textMuted }]}>
                <Text style={styles.summaryValue}>{expiredCards.length}</Text>
                <Text style={styles.summaryLabel}>Expired</Text>
              </View>
              <View style={[styles.summaryCard, { borderLeftColor: Colors.carrierPrimary }]}>
                <Text style={styles.summaryValue}>{VEHICLE_TYPES.length}</Text>
                <Text style={styles.summaryLabel}>Vehicle Types</Text>
              </View>
            </View>

            {rateCards.map((card) => {
              const statusColor = getStatusColor(card.status);
              const statusBg = getStatusBg(card.status);
              return (
                <TouchableOpacity
                  key={card.id}
                  style={styles.rateCard}
                  onPress={() => card.status === 'ACTIVE' ? handleEdit(card) : null}
                  activeOpacity={card.status === 'ACTIVE' ? 0.7 : 1}
                >
                  <View style={styles.rateCardHeader}>
                    <View style={styles.rateCardLeft}>
                      <View style={[styles.vehicleIcon, { backgroundColor: Colors.carrierPrimary + '12' }]}>
                        <Truck size={18} color={Colors.carrierPrimary} />
                      </View>
                      <View>
                        <Text style={styles.rateVehicle}>{card.vehicleType}</Text>
                        <View style={[styles.rateStatusBadge, { backgroundColor: statusBg }]}>
                          <Text style={[styles.rateStatusText, { color: statusColor }]}>{card.status}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.rateCardRight}>
                      <Text style={styles.rateBaseLabel}>Base</Text>
                      <Text style={styles.rateBaseValue}>£{card.baseRate.toFixed(2)}</Text>
                    </View>
                  </View>

                  <View style={styles.rateGrid}>
                    <RateItem label="Per Km" value={`£${card.perKmRate.toFixed(2)}`} />
                    <RateItem label="Per Stop" value={`£${card.perStopRate.toFixed(2)}`} />
                    <RateItem label="Weekend" value={`+${card.weekendSurcharge}%`} />
                    <RateItem label="Out of Hours" value={`+${card.outOfHoursSurcharge}%`} />
                    <RateItem label="Heavy Goods" value={`+${card.heavyGoodsSurcharge}%`} />
                    <RateItem label="From" value={card.effectiveFrom} />
                  </View>

                  {card.effectiveTo && (
                    <View style={styles.rateExpiry}>
                      <Calendar size={11} color={Colors.textMuted} />
                      <Text style={styles.rateExpiryText}>Expired: {card.effectiveTo}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity style={styles.addButton} onPress={handleAdd} activeOpacity={0.7}>
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add Rate Card</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.historyTitle}>Rate Usage by Period</Text>
            {getHistoryFromJobs(completedJobs).map((item: any, index: number) => {
              const avgPerJob = item.jobsUsed > 0 ? (item.totalRevenue / item.jobsUsed) : 0;
              return (
                <View key={`${item.vehicleType}-${item.period}`} style={styles.historyCard}>
                  <View style={styles.historyTop}>
                    <View style={styles.historyLeft}>
                      <Truck size={16} color={Colors.carrierPrimary} />
                      <View>
                        <Text style={styles.historyVehicle}>{item.vehicleType}</Text>
                        <Text style={styles.historyPeriod}>{item.period}</Text>
                      </View>
                    </View>
                    <Text style={styles.historyRevenue}>£{item.totalRevenue.toLocaleString()}</Text>
                  </View>
                  <View style={styles.historyMeta}>
                    <View style={styles.historyMetaItem}>
                      <Text style={styles.historyMetaValue}>{item.jobsUsed}</Text>
                      <Text style={styles.historyMetaLabel}>Jobs</Text>
                    </View>
                    <View style={styles.historyMetaItem}>
                      <Text style={styles.historyMetaValue}>£{avgPerJob.toFixed(2)}</Text>
                      <Text style={styles.historyMetaLabel}>Avg/Job</Text>
                    </View>
                    <View style={styles.historyMetaItem}>
                      <Text style={styles.historyMetaValue}>£{item.totalRevenue.toLocaleString()}</Text>
                      <Text style={styles.historyMetaLabel}>Revenue</Text>
                    </View>
                  </View>
                </View>
              );
            })}
            {completedJobs.length === 0 && (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Clock size={40} color={Colors.textMuted} strokeWidth={1} />
                <Text style={{ color: Colors.textMuted, marginTop: 12, fontSize: 13 }}>No history available yet.</Text>
              </View>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingCard ? 'Edit Rate Card' : 'New Rate Card'}
              </Text>
              <TouchableOpacity onPress={() => { setShowAddModal(false); resetForm(); }}>
                <X size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.formLabel}>Vehicle Type</Text>
              <TouchableOpacity
                style={styles.pickerBtn}
                onPress={() => setShowVehiclePicker(!showVehiclePicker)}
              >
                <Text style={styles.pickerBtnText}>{formVehicleType}</Text>
                <ChevronDown size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
              {showVehiclePicker && (
                <View style={styles.pickerOptions}>
                  {VEHICLE_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.pickerOption, formVehicleType === type && styles.pickerOptionActive]}
                      onPress={() => { setFormVehicleType(type); setShowVehiclePicker(false); }}
                    >
                      <Text style={[styles.pickerOptionText, formVehicleType === type && styles.pickerOptionTextActive]}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View style={styles.formRow}>
                <View style={styles.formHalf}>
                  <Text style={styles.formLabel}>Base Rate (£)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formBaseRate}
                    onChangeText={setFormBaseRate}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
                <View style={styles.formHalf}>
                  <Text style={styles.formLabel}>Per Km (£)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formPerKm}
                    onChangeText={setFormPerKm}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formHalf}>
                  <Text style={styles.formLabel}>Per Stop (£)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formPerStop}
                    onChangeText={setFormPerStop}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
                <View style={styles.formHalf}>
                  <Text style={styles.formLabel}>Weekend (%)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formWeekend}
                    onChangeText={setFormWeekend}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formHalf}>
                  <Text style={styles.formLabel}>Out of Hours (%)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formOOH}
                    onChangeText={setFormOOH}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
                <View style={styles.formHalf}>
                  <Text style={styles.formLabel}>Heavy Goods (%)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formHeavy}
                    onChangeText={setFormHeavy}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.7}>
                <CheckCircle size={18} color="#FFF" />
                <Text style={styles.submitBtnText}>
                  {editingCard ? 'Update Rate Card' : 'Create Rate Card'}
                </Text>
              </TouchableOpacity>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function RateItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.rateItem}>
      <Text style={styles.rateItemLabel}>{label}</Text>
      <Text style={styles.rateItemValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabBar: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.surfaceAlt,
    gap: 6,
  },
  tabActive: {
    backgroundColor: Colors.carrierPrimary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 3,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  summaryLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  rateCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rateCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  rateCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vehicleIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateVehicle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  rateStatusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  rateStatusText: {
    fontSize: 10,
    fontWeight: '700' as const,
  },
  rateCardRight: {
    alignItems: 'flex-end',
  },
  rateBaseLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  rateBaseValue: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.carrierPrimary,
  },
  rateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    padding: 10,
    gap: 0,
  },
  rateItem: {
    width: '33.33%',
    alignItems: 'center',
    paddingVertical: 6,
  },
  rateItemLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  rateItemValue: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 2,
  },
  rateExpiry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  rateExpiryText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.carrierPrimary,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
    marginTop: 4,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  historyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  historyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  historyVehicle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  historyPeriod: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  historyRevenue: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.carrierPrimary,
  },
  historyMeta: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    padding: 10,
  },
  historyMetaItem: {
    flex: 1,
    alignItems: 'center',
  },
  historyMetaValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  historyMetaLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500' as const,
    marginTop: 2,
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
