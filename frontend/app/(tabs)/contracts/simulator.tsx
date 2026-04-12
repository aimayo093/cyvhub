import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Switch, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Calculator, MapPin, Truck, Target, Info, CheckCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { apiClient } from '@/services/api';
import { ResponsiveContainer } from '@/components/ResponsiveContainer';

const VEHICLES = [
    { id: 'small', name: 'Small Van', multiplier: 1.0 },
    { id: 'large', name: 'Large Van', multiplier: 1.5 },
    { id: 'xl', name: 'XL Van', multiplier: 2.0 },
];

export default function PricingSimulatorScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [pricingType, setPricingType] = useState<'ADHOC' | 'CONTRACT'>('ADHOC');
    const [selectedContractId, setSelectedContractId] = useState<string>('');
    const [contracts, setContracts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadContracts = async () => {
            try {
                const data = await apiClient('/contracts');
                const valid = data.contracts?.filter((c: any) => c.status === 'ACTIVE' || c.status === 'DRAFT') || [];
                setContracts(valid);
                if (valid.length > 0) setSelectedContractId(valid[0].id);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadContracts();
    }, []);
    const [distance, setDistance] = useState('50');
    const [stops, setStops] = useState('1');
    const [selectedVehicle, setSelectedVehicle] = useState('large');

    // Toggles
    const [isWeekend, setIsWeekend] = useState(false);
    const [isOOH, setIsOOH] = useState(false);
    const [isHeavy, setIsHeavy] = useState(false);
    const [isUrgent, setIsUrgent] = useState(false);

    const selectedContract = useMemo(() => contracts.find((c: any) => c.id === selectedContractId) || contracts[0], [selectedContractId, contracts]);

    const pricingResult = useMemo(() => {
        let baseRate = 0;
        let perKm = 0;
        let perStop = 0;
        let multiplier = 1.0;
        let surcharges = { weekend: 0, outOfHours: 0, heavyGoods: 0, urgentDelivery: 0 };

        if (pricingType === 'CONTRACT' && selectedContract) {
            const rules = selectedContract.rateRules || [];
            const activeRule = rules.find((r: any) => r.vehicleType.toLowerCase().includes(selectedVehicle.toLowerCase())) || rules[0] || { baseRate: 0, perKmRate: 0, perStopRate: 0, vehicleMultiplier: 1 };
            baseRate = activeRule.baseRate;
            perKm = activeRule.perKmRate;
            perStop = activeRule.perStopRate;
            multiplier = activeRule.vehicleMultiplier;
            surcharges = selectedContract.surcharges || { weekend: 0, outOfHours: 0, heavyGoods: 0, urgentDelivery: 0 };
        } else {
            // ADHOC standard rates
            const vehicleDef = VEHICLES.find(v => v.id === selectedVehicle)!;
            baseRate = 60.0;
            perKm = 1.80;
            perStop = 15.0;
            multiplier = vehicleDef.multiplier;
            surcharges = { weekend: 25, outOfHours: 25, heavyGoods: 15, urgentDelivery: 30 };
        }

        const distVal = parseFloat(distance) || 0;
        const stopsVal = parseInt(stops) || 0;

        const baseCost = baseRate;
        const distanceCost = distVal * perKm;
        const stopsCost = stopsVal * perStop;
        const subtotal = (baseCost + distanceCost + stopsCost) * multiplier;

        let totalSurchargePct = 0;
        if (isWeekend) totalSurchargePct += surcharges.weekend;
        if (isOOH) totalSurchargePct += surcharges.outOfHours;
        if (isHeavy) totalSurchargePct += surcharges.heavyGoods;
        if (isUrgent) totalSurchargePct += surcharges.urgentDelivery;

        const surchargeAmount = subtotal * (totalSurchargePct / 100);
        const finalTotal = subtotal + surchargeAmount;

        return {
            baseCost, distanceCost, stopsCost, subtotal, surchargeAmount, finalTotal,
            rates: { baseRate, perKm, perStop, multiplier, totalSurchargePct }
        };
    }, [pricingType, selectedContract, distance, stops, selectedVehicle, isWeekend, isOOH, isHeavy, isUrgent]);

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <View style={styles.headerContent}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <ChevronLeft size={24} color={Colors.textInverse} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleWrap}>
                        <Calculator size={20} color={Colors.textInverse} />
                        <Text style={styles.headerTitle}>Pricing Engine Simulator</Text>
                    </View>
                </View>
            </View>

            <ResponsiveContainer scrollable={true} backgroundColor={Colors.background}>
                <View style={styles.bodyContent}>
                    {/* Toggle Pricing Type */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Client Type</Text>
                        <View style={styles.segmentControl}>
                            <TouchableOpacity
                                style={[styles.segmentBtn, pricingType === 'ADHOC' && styles.segmentBtnActive]}
                                onPress={() => { setPricingType('ADHOC'); Haptics.selectionAsync(); }}
                            >
                                <Text style={[styles.segmentText, pricingType === 'ADHOC' && styles.segmentTextActive]}>Ad-hoc Quote</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.segmentBtn, pricingType === 'CONTRACT' && styles.segmentBtnActive]}
                                onPress={() => { setPricingType('CONTRACT'); Haptics.selectionAsync(); }}
                            >
                                <Text style={[styles.segmentText, pricingType === 'CONTRACT' && styles.segmentTextActive]}>Contracted Client</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {pricingType === 'CONTRACT' && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Select Contract</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                                {loading ? (
                                    <ActivityIndicator size="small" color={Colors.adminPrimary} />
                                ) : contracts.length === 0 ? (
                                    <Text style={{ color: Colors.textMuted, fontSize: 13 }}>No active contracts found.</Text>
                                ) : contracts.map((c: any) => (
                                    <TouchableOpacity
                                        key={c.id}
                                        style={[styles.contractChip, selectedContractId === c.id && styles.contractChipActive]}
                                        onPress={() => { setSelectedContractId(c.id); Haptics.selectionAsync(); }}
                                    >
                                        <Text style={[styles.contractChipText, selectedContractId === c.id && styles.contractChipTextActive]}>
                                            {c.businessAccount?.tradingName || c.businessAccount?.companyName || 'Business'}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    <View style={styles.gridRow}>
                        <View style={styles.gridCol}>
                            <Text style={styles.inputLabel}>Distance (km)</Text>
                            <View style={styles.inputWrap}>
                                <MapPin size={16} color={Colors.textMuted} />
                                <TextInput style={styles.input} value={distance} onChangeText={setDistance} keyboardType="numeric" />
                            </View>
                        </View>
                        <View style={styles.gridCol}>
                            <Text style={styles.inputLabel}>Extra Stops</Text>
                            <View style={styles.inputWrap}>
                                <Target size={16} color={Colors.textMuted} />
                                <TextInput style={styles.input} value={stops} onChangeText={setStops} keyboardType="numeric" />
                            </View>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Vehicle Type</Text>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            {VEHICLES.map(v => (
                                <TouchableOpacity
                                    key={v.id}
                                    style={[styles.vehicleBtn, selectedVehicle === v.id && styles.vehicleBtnActive]}
                                    onPress={() => { setSelectedVehicle(v.id); Haptics.selectionAsync(); }}
                                >
                                    <Truck size={16} color={selectedVehicle === v.id ? Colors.adminPrimary : Colors.textMuted} />
                                    <Text style={[styles.vehicleBtnText, selectedVehicle === v.id && styles.vehicleBtnTextActive]}>{v.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Condition Surcharges</Text>
                        <View style={styles.toggleGrid}>
                            <View style={styles.toggleRow}>
                                <Text style={styles.toggleLabel}>Weekend Delivery</Text>
                                <Switch value={isWeekend} onValueChange={v => { setIsWeekend(v); Haptics.selectionAsync(); }} />
                            </View>
                            <View style={styles.toggleRow}>
                                <Text style={styles.toggleLabel}>Out of Hours (OOH)</Text>
                                <Switch value={isOOH} onValueChange={v => { setIsOOH(v); Haptics.selectionAsync(); }} />
                            </View>
                            <View style={styles.toggleRow}>
                                <Text style={styles.toggleLabel}>Heavy / Bulky Goods</Text>
                                <Switch value={isHeavy} onValueChange={v => { setIsHeavy(v); Haptics.selectionAsync(); }} />
                            </View>
                            <View style={styles.toggleRow}>
                                <Text style={styles.toggleLabel}>Urgent SLA (1 hour)</Text>
                                <Switch value={isUrgent} onValueChange={v => { setIsUrgent(v); Haptics.selectionAsync(); }} />
                            </View>
                        </View>
                    </View>

                    <View style={styles.breakdownCard}>
                        <View style={styles.breakdownHeader}>
                            <CheckCircle size={18} color={Colors.success} />
                            <Text style={styles.breakdownTitle}>Calculated Price Breakdown</Text>
                        </View>

                        <View style={styles.breakdownBody}>
                            <View style={styles.bRow}>
                                <Text style={styles.bLabel}>Base Rate</Text>
                                <Text style={styles.bValue}>£{pricingResult.baseCost.toFixed(2)}</Text>
                            </View>
                            <View style={styles.bRow}>
                                <Text style={styles.bLabel}>Distance ({distance}km @ £{pricingResult.rates.perKm.toFixed(2)}/km)</Text>
                                <Text style={styles.bValue}>£{pricingResult.distanceCost.toFixed(2)}</Text>
                            </View>
                            <View style={styles.bRow}>
                                <Text style={styles.bLabel}>Stops ({stops} @ £{pricingResult.rates.perStop.toFixed(2)}/stop)</Text>
                                <Text style={styles.bValue}>£{pricingResult.stopsCost.toFixed(2)}</Text>
                            </View>

                            <View style={styles.bDivider} />

                            <View style={styles.bRow}>
                                <Text style={styles.bLabel}>Vehicle Multiplier (x{pricingResult.rates.multiplier})</Text>
                                <Text style={styles.bValue}>£{pricingResult.subtotal.toFixed(2)}</Text>
                            </View>

                            {pricingResult.rates.totalSurchargePct > 0 && (
                                <View style={styles.bRow}>
                                    <Text style={styles.bLabel}>Surcharges (+{pricingResult.rates.totalSurchargePct}%)</Text>
                                    <Text style={styles.bValue}>£{pricingResult.surchargeAmount.toFixed(2)}</Text>
                                </View>
                            )}

                            <View style={styles.bTotalRow}>
                                <Text style={styles.bTotalLabel}>Final Estimated Price</Text>
                                <Text style={styles.bTotalValue}>£{pricingResult.finalTotal.toFixed(2)}</Text>
                            </View>
                        </View>
                    </View>
                    <View style={{ height: 40 }} />
                </View>
            </ResponsiveContainer>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { backgroundColor: Colors.navy, paddingHorizontal: 20, paddingBottom: 16 },
    headerContent: {
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 12,
        maxWidth: 1000,
        alignSelf: 'center',
        width: '100%',
    },
    backBtn: { padding: 4, marginLeft: -4 },
    headerTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.textInverse },
    bodyContent: { paddingVertical: 20, paddingHorizontal: 0 },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 12 },
    segmentControl: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: Colors.border },
    segmentBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
    segmentBtnActive: { backgroundColor: Colors.adminPrimary },
    segmentText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
    segmentTextActive: { color: '#FFFFFF' },
    contractChip: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.borderLight, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
    contractChipActive: { backgroundColor: Colors.adminPrimary + '20', borderColor: Colors.adminPrimary },
    contractChipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
    contractChipTextActive: { color: Colors.adminPrimary },
    gridRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
    gridCol: { flex: 1 },
    inputLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 },
    inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 12, height: 44, gap: 8 },
    input: { flex: 1, fontSize: 15, color: Colors.text, ...(Platform.OS === 'web' && { outlineStyle: 'none' }) } as any,
    vehicleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingVertical: 12, gap: 8 },
    vehicleBtnActive: { backgroundColor: Colors.adminPrimary + '10', borderColor: Colors.adminPrimary },
    vehicleBtnText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
    vehicleBtnTextActive: { color: Colors.adminPrimary },
    toggleGrid: { backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 16 },
    toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
    toggleLabel: { fontSize: 14, fontWeight: '500', color: Colors.text },
    breakdownCard: { backgroundColor: Colors.navy, borderRadius: 16, overflow: 'hidden', marginTop: 8 },
    breakdownHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
    breakdownTitle: { fontSize: 15, fontWeight: '700', color: Colors.textInverse },
    breakdownBody: { padding: 16, gap: 10 },
    bRow: { flexDirection: 'row', justifyContent: 'space-between' },
    bLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
    bValue: { fontSize: 14, color: Colors.textInverse, fontWeight: '600' },
    bDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 6 },
    bTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
    bTotalLabel: { fontSize: 16, color: Colors.success, fontWeight: '800' },
    bTotalValue: { fontSize: 24, color: Colors.textInverse, fontWeight: '800' }
});
