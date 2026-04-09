import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ShieldAlert, ArrowLeft, CheckCircle, XCircle, Search, MessageSquare, DollarSign } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { apiClient } from '@/services/api';
import * as Haptics from 'expo-haptics';

export default function AdminDisputesScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [disputes, setDisputes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    
    // Modal state
    const [selectedDispute, setSelectedDispute] = useState<any>(null);
    const [resolveModal, setResolveModal] = useState(false);
    const [refundAmount, setRefundAmount] = useState('');
    const [refundType, setRefundType] = useState('NONE');

    useEffect(() => {
        loadDisputes();
    }, []);

    const loadDisputes = async () => {
        try {
            setLoading(true);
            const res = await apiClient('/disputes');
            setDisputes(res.disputes || []);
        } catch (error) {
            console.error('Failed to load disputes', error);
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async () => {
        try {
            const payload = {
                status: 'RESOLVED',
                refundStatus: refundType,
                refundAmount: refundType !== 'NONE' ? parseFloat(refundAmount) : 0
            };
            await apiClient(`/disputes/${selectedDispute.id}/resolve`, {
                method: 'PATCH',
                body: JSON.stringify(payload)
            });
            Alert.alert('Resolved', 'Dispute has been resolved.');
            setResolveModal(false);
            loadDisputes();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to resolve dispute.');
        }
    };

    const renderDispute = ({ item }: { item: any }) => (
        <TouchableOpacity 
            style={styles.card}
            onPress={() => {
                setSelectedDispute(item);
                setResolveModal(true);
            }}
        >
            <View style={styles.cardHeader}>
                <View style={styles.cardTitleBox}>
                    <ShieldAlert size={18} color={item.status === 'OPEN' ? Colors.danger : Colors.success} />
                    <Text style={styles.cardJob}>{item.job?.jobNumber || 'Unknown Job'}</Text>
                </View>
                <View style={[styles.badge, item.status === 'OPEN' ? styles.badgeOpen : styles.badgeResolved]}>
                    <Text style={[styles.badgeText, item.status === 'OPEN' ? styles.textOpen : styles.textResolved]}>
                        {item.status}
                    </Text>
                </View>
            </View>
            <Text style={styles.cardReason}>{item.reason}</Text>
            <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
            
            <View style={styles.cardFooter}>
                <Text style={styles.cardMeta}>Raised by: {item.creator?.firstName} {item.creator?.lastName}</Text>
                {item.refundStatus && item.refundStatus !== 'NONE' && (
                    <Text style={styles.cardRefund}>Refunded: £{item.refundAmount}</Text>
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <ArrowLeft size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Disputes Center</Text>
                    <View style={{ width: 44 }} />
                </View>
                
                <View style={styles.searchBox}>
                    <Search size={18} color={Colors.textMuted} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search Job Number..."
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>

            {loading ? (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color={Colors.adminPrimary} />
                </View>
            ) : (
                <FlatList
                    data={disputes.filter(d => d.job?.jobNumber?.includes(search.toUpperCase()))}
                    renderItem={renderDispute}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <ShieldAlert size={48} color={Colors.textMuted} />
                            <Text style={styles.emptyText}>No disputes found.</Text>
                        </View>
                    }
                />
            )}

            {/* Resolve Modal */}
            <Modal visible={resolveModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
                         <View style={styles.modalHeader}>
                             <Text style={styles.modalTitle}>Resolve Dispute</Text>
                             <TouchableOpacity onPress={() => setResolveModal(false)}>
                                 <XCircle size={24} color={Colors.textSecondary} />
                             </TouchableOpacity>
                         </View>

                         {selectedDispute && (
                             <ScrollView style={styles.modalScroll}>
                                 <Text style={styles.label}>Job: {selectedDispute.job?.jobNumber}</Text>
                                 <Text style={styles.label}>Reason: {selectedDispute.reason}</Text>
                                 <Text style={styles.descBox}>{selectedDispute.description}</Text>

                                 <Text style={styles.label}>Issue Refund?</Text>
                                 <View style={styles.row}>
                                     <TouchableOpacity 
                                        style={[styles.refundBtn, refundType === 'NONE' && styles.refundBtnActive]} 
                                        onPress={() => setRefundType('NONE')}
                                     >
                                         <Text style={[styles.refundBtnText, refundType==='NONE' && styles.refundBtnTextActive]}>No Refund</Text>
                                     </TouchableOpacity>
                                     <TouchableOpacity 
                                        style={[styles.refundBtn, refundType === 'PARTIAL' && styles.refundBtnActive]} 
                                        onPress={() => setRefundType('PARTIAL')}
                                     >
                                         <Text style={[styles.refundBtnText, refundType==='PARTIAL' && styles.refundBtnTextActive]}>Partial</Text>
                                     </TouchableOpacity>
                                     <TouchableOpacity 
                                        style={[styles.refundBtn, refundType === 'FULL' && styles.refundBtnActive]} 
                                        onPress={() => {
                                            setRefundType('FULL');
                                            setRefundAmount(selectedDispute.job?.calculatedPrice?.toString() || '0');
                                        }}
                                     >
                                         <Text style={[styles.refundBtnText, refundType==='FULL' && styles.refundBtnTextActive]}>Full</Text>
                                     </TouchableOpacity>
                                 </View>

                                 {refundType !== 'NONE' && (
                                     <View style={{ marginTop: 16 }}>
                                         <Text style={styles.label}>Refund Amount (£)</Text>
                                         <TextInput
                                             style={styles.input}
                                             keyboardType="numeric"
                                             value={refundAmount}
                                             onChangeText={setRefundAmount}
                                         />
                                     </View>
                                 )}

                                 <TouchableOpacity style={styles.submitBtn} onPress={handleResolve}>
                                     <Text style={styles.submitBtnText}>Resolve Dispute</Text>
                                 </TouchableOpacity>
                             </ScrollView>
                         )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// Keep Typescript happy with ScrollView import which I forgot
import { ScrollView } from 'react-native';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { backgroundColor: Colors.navy, paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '800' as const, color: '#FFFFFF' },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 12, height: 48, marginTop: 16 },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 15 },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: 16 },
    empty: { alignItems: 'center', justifyContent: 'center', padding: 40 },
    emptyText: { fontSize: 16, color: Colors.textMuted, marginTop: 12 },
    card: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    cardTitleBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    cardJob: { fontSize: 16, fontWeight: '700' as const, color: Colors.text },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    badgeOpen: { backgroundColor: Colors.dangerLight },
    badgeResolved: { backgroundColor: Colors.successLight },
    badgeText: { fontSize: 11, fontWeight: '700' as const },
    textOpen: { color: Colors.danger },
    textResolved: { color: Colors.success },
    cardReason: { fontSize: 14, fontWeight: '600' as const, color: Colors.text, marginBottom: 4 },
    cardDesc: { fontSize: 13, color: Colors.textSecondary, marginBottom: 12 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12 },
    cardMeta: { fontSize: 12, color: Colors.textMuted },
    cardRefund: { fontSize: 12, color: Colors.success, fontWeight: '700' as const },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '800' as const },
    modalScroll: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '700' as const, color: Colors.text, marginBottom: 8, marginTop: 12 },
    descBox: { backgroundColor: Colors.surfaceAlt, padding: 12, borderRadius: 8, fontSize: 14, color: Colors.textSecondary },
    row: { flexDirection: 'row', gap: 10 },
    refundBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
    refundBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    refundBtnText: { fontSize: 13, fontWeight: '600' as const, color: Colors.textSecondary },
    refundBtnTextActive: { color: '#FFF' },
    input: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, padding: 12, borderRadius: 8, fontSize: 16 },
    submitBtn: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
    submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' as const }
});
