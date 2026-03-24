import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import {
  Building2,
  Mail,
  Phone,
  FileText,
  Shield,
  MapPin,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Upload,
  Edit3,
  Save,
  X,
  Globe,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import { useCarrier } from '@/providers/CarrierProvider';

const AVAILABLE_COVERAGE_REGIONS = [
  'Swansea', 'Cardiff', 'Newport', 'Neath', 'Llanelli',
  'Carmarthen', 'Pembrokeshire', 'Bridgend', 'Merthyr Tydfil'
];

const MOCK_CARRIER_COMPLIANCE = [
  { id: '1', type: 'Operator Licence', status: 'VALID', expiryDate: '2027-04-15' },
  { id: '2', type: 'Goods in Transit Insurance', status: 'EXPIRING_SOON', expiryDate: '2026-04-01' },
  { id: '3', type: 'Public Liability', status: 'VALID', expiryDate: '2026-11-20' },
  { id: '4', type: 'Driver Background Checks', status: 'EXPIRED', expiryDate: '2026-02-15' },
];
function getComplianceIcon(status: string) {
  switch (status) {
    case 'VALID': return { Icon: CheckCircle, color: Colors.success };
    case 'EXPIRING_SOON': return { Icon: AlertTriangle, color: Colors.warning };
    case 'EXPIRED': return { Icon: XCircle, color: Colors.danger };
    default: return { Icon: Clock, color: Colors.textMuted };
  }
}

function getComplianceBg(status: string) {
  switch (status) {
    case 'VALID': return Colors.successLight;
    case 'EXPIRING_SOON': return Colors.warningLight;
    case 'EXPIRED': return Colors.dangerLight;
    default: return Colors.surfaceAlt;
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function CarrierProfileScreen() {
  const { carrier, updateProfile } = useAuth();
  const { coverageRegions, updateCoverageRegions } = useCarrier();
  const [isEditing, setIsEditing] = useState(false);
  const [companyName, setCompanyName] = useState(carrier?.companyName ?? '');
  const [tradingName, setTradingName] = useState(carrier?.tradingName ?? '');
  const [contactEmail, setContactEmail] = useState(carrier?.email ?? '');
  const [contactPhone, setContactPhone] = useState(carrier?.phone ?? '');
  const [showRegionPicker, setShowRegionPicker] = useState(false);
  const [selectedRegions, setSelectedRegions] = useState<string[]>(coverageRegions);

  const handleSave = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateProfile(carrier?.id || '', {
      companyName,
      tradingName,
      email: contactEmail,
      phone: contactPhone,
    });
    updateCoverageRegions(selectedRegions);
    setIsEditing(false);
    Alert.alert('Saved', 'Company profile updated successfully.');
  }, [companyName, tradingName, contactEmail, contactPhone, selectedRegions, updateProfile, updateCoverageRegions]);

  const handleUploadDoc = useCallback((docType: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Upload Document', `Select a file to upload for ${docType}`, [
      { text: 'Camera', onPress: () => Alert.alert('Info', 'Camera capture would open here') },
      { text: 'Gallery', onPress: () => Alert.alert('Info', 'File picker would open here') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, []);

  const toggleRegion = useCallback((region: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedRegions(prev =>
      prev.includes(region) ? prev.filter(r => r !== region) : [...prev, region]
    );
  }, []);

  if (!carrier) return null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ title: 'Company Profile' }} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.companyHeader}>
          <View style={styles.companyAvatar}>
            <Building2 size={32} color={Colors.carrierPrimary} />
          </View>
          <View style={styles.companyHeaderInfo}>
            <Text style={styles.companyName}>{carrier.companyName}</Text>
            <Text style={styles.tradingName}>{carrier.tradingName}</Text>
            <View style={[styles.statusBadge, {
              backgroundColor: carrier.status === 'APPROVED' ? Colors.successLight : Colors.warningLight,
            }]}>
              <View style={[styles.statusDot, {
                backgroundColor: carrier.status === 'APPROVED' ? Colors.success : Colors.warning,
              }]} />
              <Text style={[styles.statusText, {
                color: carrier.status === 'APPROVED' ? Colors.success : Colors.warning,
              }]}>{carrier.status}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.editToggle}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (isEditing) {
                setCompanyName(carrier.companyName);
                setTradingName(carrier.tradingName);
                setContactEmail(carrier.email);
                setContactPhone(carrier.phone);
                setSelectedRegions(coverageRegions);
              }
              setIsEditing(!isEditing);
            }}
          >
            {isEditing ? <X size={18} color={Colors.danger} /> : <Edit3 size={18} color={Colors.carrierPrimary} />}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company Details</Text>
          <View style={styles.card}>
            {isEditing ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Company Name</Text>
                  <TextInput
                    style={styles.input}
                    value={companyName}
                    onChangeText={setCompanyName}
                    placeholder="Company name"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Trading Name</Text>
                  <TextInput
                    style={styles.input}
                    value={tradingName}
                    onChangeText={setTradingName}
                    placeholder="Trading name"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    style={styles.input}
                    value={contactEmail}
                    onChangeText={setContactEmail}
                    placeholder="Email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Phone</Text>
                  <TextInput
                    style={styles.input}
                    value={contactPhone}
                    onChangeText={setContactPhone}
                    placeholder="Phone"
                    keyboardType="phone-pad"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
              </>
            ) : (
              <>
                <DetailRow icon={Building2} label="Company Name" value={carrier.companyName} />
                <DetailRow icon={Globe} label="Trading Name" value={carrier.tradingName} />
                <DetailRow icon={Mail} label="Email" value={carrier.email} />
                <DetailRow icon={Phone} label="Phone" value={carrier.phone} />
                <DetailRow icon={CreditCard} label="Reg. Number" value={carrier.registrationNumber} />
                <DetailRow icon={Shield} label="VAT Number" value={carrier.vatNumber} />
                <DetailRow icon={FileText} label="Operator Licence" value={carrier.operatorLicence} />
                <DetailRow icon={Clock} label="OL Expiry" value={formatDate(carrier.operatorLicenceExpiry)} />
                <DetailRow icon={Clock} label="Member Since" value={formatDate(carrier.memberSince)} last />
              </>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Coverage Regions</Text>
            {!isEditing && (
              <TouchableOpacity onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsEditing(true);
                setShowRegionPicker(true);
              }}>
                <Edit3 size={16} color={Colors.carrierPrimary} />
              </TouchableOpacity>
            )}
          </View>
          {isEditing ? (
            <View style={styles.regionGrid}>
              {AVAILABLE_COVERAGE_REGIONS.map((region: string) => {
                const isSelected = selectedRegions.includes(region);
                return (
                  <TouchableOpacity
                    key={region}
                    style={[styles.regionChip, isSelected && styles.regionChipActive]}
                    onPress={() => toggleRegion(region)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.regionChipText, isSelected && styles.regionChipTextActive]}>
                      {region}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.regionGrid}>
              {coverageRegions.map((region) => (
                <View key={region} style={styles.regionTag}>
                  <MapPin size={11} color={Colors.carrierPrimary} />
                  <Text style={styles.regionTagText}>{region}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compliance Documents</Text>
          {MOCK_CARRIER_COMPLIANCE.map((doc: any) => {
            const { Icon: StatusIcon, color } = getComplianceIcon(doc.status);
            const bg = getComplianceBg(doc.status);
            return (
              <View key={doc.id} style={styles.complianceCard}>
                <View style={styles.complianceTop}>
                  <View style={[styles.complianceIconWrap, { backgroundColor: bg }]}>
                    <StatusIcon size={16} color={color} />
                  </View>
                  <View style={styles.complianceInfo}>
                    <Text style={styles.complianceType}>{doc.type}</Text>
                    <Text style={[styles.complianceStatus, { color }]}>
                      {doc.status.replace('_', ' ')}
                      {doc.expiryDate && ` · ${formatDate(doc.expiryDate)}`}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.uploadBtn}
                    onPress={() => handleUploadDoc(doc.type)}
                    activeOpacity={0.7}
                  >
                    <Upload size={14} color={Colors.carrierPrimary} />
                    <Text style={styles.uploadBtnText}>Upload</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {isEditing && (
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            activeOpacity={0.7}
          >
            <Save size={18} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function DetailRow({ icon: Icon, label, value, last }: {
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.detailRow, !last && styles.detailRowBorder]}>
      <Icon size={16} color={Colors.carrierPrimary} />
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
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
  },
  companyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 14,
  },
  companyAvatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.carrierPrimary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyHeaderInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  tradingName: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  editToggle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 10,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  detailValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  inputGroup: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  inputLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600' as const,
    marginBottom: 6,
  },
  input: {
    fontSize: 15,
    color: Colors.text,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  regionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  regionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.carrierPrimary + '10',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  regionTagText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.carrierPrimary,
  },
  regionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  regionChipActive: {
    backgroundColor: Colors.carrierPrimary,
    borderColor: Colors.carrierPrimary,
  },
  regionChipText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  regionChipTextActive: {
    color: '#FFFFFF',
  },
  complianceCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  complianceTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  complianceIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  complianceInfo: {
    flex: 1,
  },
  complianceType: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  complianceStatus: {
    fontSize: 11,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.carrierPrimary + '10',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 5,
  },
  uploadBtnText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.carrierPrimary,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.carrierPrimary,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
    marginTop: 4,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
