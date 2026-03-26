import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, TextInput, Alert, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft, CheckCircle, XCircle, Clock, Shield,
  ExternalLink, FileText, Calendar,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { apiClient } from '@/services/api';

const DOC_TYPE_LABELS: Record<string, string> = {
  driving_licence: 'Driving Licence',
  motor_insurance: 'Motor Insurance',
  mot_certificate: 'MOT Certificate',
  goods_in_transit: 'Goods in Transit Insurance',
  public_liability: 'Public Liability Insurance',
  right_to_work: 'Right to Work',
  vehicle_registration: 'Vehicle Registration (V5)',
};

function StatusBadge({ status }: { status: string }) {
  const cfg = {
    verified:       { bg: Colors.successLight, text: Colors.success,   label: 'Verified',       icon: CheckCircle },
    pending_review: { bg: Colors.warningLight, text: Colors.warning,   label: 'Pending Review', icon: Clock },
    rejected:       { bg: Colors.dangerLight,  text: Colors.danger,    label: 'Rejected',       icon: XCircle },
  }[status] ?? { bg: Colors.borderLight, text: Colors.textMuted, label: 'Not Submitted', icon: Shield };

  const IconComp = cfg.icon;
  return (
    <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
      <IconComp size={12} color={cfg.text} />
      <Text style={[styles.statusBadgeText, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

function formatDate(d: string | null): string {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminComplianceDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { driverId } = useLocalSearchParams<{ driverId: string }>();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionDocId, setActionDocId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [note, setNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const res = await apiClient(`/compliance/admin/driver/${driverId}`);
      setData(res);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to load driver compliance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (driverId) loadData(); }, [driverId]);

  const handleAction = async () => {
    if (!actionDocId || !actionType) return;
    if (actionType === 'reject' && !rejectionReason.trim()) {
      Alert.alert('Required', 'Please enter a rejection reason.');
      return;
    }

    try {
      setSubmitting(true);
      const endpoint = `/compliance/admin/${actionDocId}/${actionType}`;
      await apiClient(endpoint, {
        method: 'POST',
        body: JSON.stringify(
          actionType === 'approve'
            ? { adminNote: note }
            : { rejectionReason, adminNote: note }
        ),
      });

      // Close panel + reload
      setActionDocId(null);
      setActionType(null);
      setNote('');
      setRejectionReason('');
      setLoading(true);
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Action failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.adminPrimary} />
      </View>
    );
  }

  const driver = data?.driver;
  const documents = data?.documents ?? [];
  const requiredTypes = data?.requiredDocTypes ?? [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={22} color={Colors.textInverse} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>
            {driver?.firstName} {driver?.lastName}
          </Text>
          <Text style={styles.headerSub}>Compliance Review</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Documents */}
        {requiredTypes.map((docType: any) => {
          const doc = documents.find((d: any) => d.documentType === docType.slug);
          const isSelected = actionDocId === doc?.id;

          return (
            <View key={docType.slug} style={styles.docCard}>
              {/* Top row */}
              <View style={styles.docHeader}>
                <Shield size={16} color={Colors.textMuted} />
                <Text style={styles.docType}>{DOC_TYPE_LABELS[docType.slug] ?? docType.label}</Text>
                {doc ? <StatusBadge status={doc.status} /> : (
                  <View style={[styles.statusBadge, { backgroundColor: Colors.borderLight }]}>
                    <Text style={[styles.statusBadgeText, { color: Colors.textMuted }]}>Not Submitted</Text>
                  </View>
                )}
              </View>

              {doc && (
                <>
                  {/* Document meta */}
                  <View style={styles.docMeta}>
                    <View style={styles.docMetaRow}>
                      <FileText size={12} color={Colors.textMuted} />
                      <Text style={styles.docMetaText}>{doc.fileName}</Text>
                    </View>
                    <View style={styles.docMetaRow}>
                      <Calendar size={12} color={Colors.textMuted} />
                      <Text style={styles.docMetaText}>Uploaded {formatDate(doc.createdAt)}</Text>
                    </View>
                    {doc.expiryDate && (
                      <View style={styles.docMetaRow}>
                        <Calendar size={12} color={Colors.warning} />
                        <Text style={[styles.docMetaText, { color: Colors.warning }]}>
                          Expires {formatDate(doc.expiryDate)}
                        </Text>
                      </View>
                    )}
                    {doc.rejectionReason && (
                      <Text style={styles.rejectionNote}>
                        Rejection reason: {doc.rejectionReason}
                      </Text>
                    )}
                  </View>

                  {/* View file link */}
                  {doc.fileUrl && (
                    <TouchableOpacity
                      style={styles.viewFileBtn}
                      onPress={() => Linking.openURL(doc.fileUrl)}
                    >
                      <ExternalLink size={14} color={Colors.adminPrimary} />
                      <Text style={styles.viewFileBtnText}>View Document</Text>
                    </TouchableOpacity>
                  )}

                  {/* Action buttons */}
                  {doc.status === 'pending_review' && (
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.approveBtn]}
                        onPress={() => { setActionDocId(doc.id); setActionType('approve'); }}
                      >
                        <CheckCircle size={14} color="#fff" />
                        <Text style={styles.actionBtnText}>Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.rejectBtn]}
                        onPress={() => { setActionDocId(doc.id); setActionType('reject'); }}
                      >
                        <XCircle size={14} color="#fff" />
                        <Text style={styles.actionBtnText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {doc.status !== 'pending_review' && doc.status !== 'not_submitted' && (
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[styles.actionBtn, doc.status === 'verified' ? styles.rejectBtn : styles.approveBtn]}
                        onPress={() => {
                          setActionDocId(doc.id);
                          setActionType(doc.status === 'verified' ? 'reject' : 'approve');
                        }}
                      >
                        <Text style={styles.actionBtnText}>
                          {doc.status === 'verified' ? 'Revoke Approval' : 'Approve'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Inline action panel */}
                  {isSelected && (
                    <View style={styles.actionPanel}>
                      <Text style={styles.actionPanelTitle}>
                        {actionType === 'approve' ? '✓ Approving Document' : '✗ Rejecting Document'}
                      </Text>
                      {actionType === 'reject' && (
                        <>
                          <Text style={styles.panelLabel}>Rejection Reason *</Text>
                          <TextInput
                            style={styles.panelInput}
                            placeholder="State the reason for rejection..."
                            placeholderTextColor={Colors.textMuted}
                            value={rejectionReason}
                            onChangeText={setRejectionReason}
                            multiline
                          />
                        </>
                      )}
                      <Text style={styles.panelLabel}>Admin Note (optional)</Text>
                      <TextInput
                        style={styles.panelInput}
                        placeholder="Add an internal note..."
                        placeholderTextColor={Colors.textMuted}
                        value={note}
                        onChangeText={setNote}
                        multiline
                      />
                      <View style={styles.panelActions}>
                        <TouchableOpacity
                          style={styles.cancelBtn}
                          onPress={() => { setActionDocId(null); setActionType(null); setNote(''); setRejectionReason(''); }}
                        >
                          <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.confirmBtn, actionType === 'approve' ? styles.approveBtn : styles.rejectBtn]}
                          onPress={handleAction}
                          disabled={submitting}
                        >
                          {submitting
                            ? <ActivityIndicator size="small" color="#fff" />
                            : <Text style={styles.actionBtnText}>Confirm {actionType === 'approve' ? 'Approval' : 'Rejection'}</Text>
                          }
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </>
              )}

              {!doc && (
                <Text style={styles.notSubmittedNote}>Driver has not uploaded this document yet.</Text>
              )}
            </View>
          );
        })}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.navy, paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8,
  },
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700' as const, color: Colors.textInverse },
  headerSub: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  body: { padding: 16 },
  docCard: {
    backgroundColor: Colors.surface, borderRadius: 14, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: Colors.border,
  },
  docHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  docType: { flex: 1, fontSize: 14, fontWeight: '600' as const, color: Colors.text },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '700' as const },
  docMeta: { gap: 6, marginBottom: 12 },
  docMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  docMetaText: { fontSize: 12, color: Colors.textSecondary },
  rejectionNote: {
    fontSize: 12, color: Colors.danger, fontStyle: 'italic' as const,
    marginTop: 4, paddingLeft: 18,
  },
  viewFileBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12,
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8,
    backgroundColor: Colors.adminPrimary + '12', alignSelf: 'flex-start' as const,
  },
  viewFileBtnText: { fontSize: 13, fontWeight: '600' as const, color: Colors.adminPrimary },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 10, gap: 6,
  },
  approveBtn: { backgroundColor: Colors.success },
  rejectBtn: { backgroundColor: Colors.danger },
  actionBtnText: { fontSize: 13, fontWeight: '700' as const, color: '#fff' },
  actionPanel: {
    marginTop: 14, padding: 14, backgroundColor: Colors.background,
    borderRadius: 10, borderWidth: 1, borderColor: Colors.border,
  },
  actionPanelTitle: { fontSize: 14, fontWeight: '700' as const, color: Colors.text, marginBottom: 10 },
  panelLabel: { fontSize: 12, fontWeight: '600' as const, color: Colors.textSecondary, marginBottom: 6, marginTop: 10 },
  panelInput: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 10,
    fontSize: 13, color: Colors.text, minHeight: 60, textAlignVertical: 'top' as const,
  },
  panelActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  cancelBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
    backgroundColor: Colors.borderLight, borderWidth: 1, borderColor: Colors.border,
  },
  cancelBtnText: { fontSize: 13, fontWeight: '600' as const, color: Colors.textSecondary },
  confirmBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 10, gap: 6,
  },
  notSubmittedNote: { fontSize: 12, color: Colors.textMuted, fontStyle: 'italic' as const },
});
