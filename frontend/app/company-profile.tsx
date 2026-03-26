import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  FileText,
  Shield,
  Clock,
  Edit3,
  Save,
  Factory,
  Banknote,
  ChevronDown,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { apiClient } from '@/services/api';

const INDUSTRY_OPTIONS = ['IT / Technology', 'Construction', 'Manufacturing', 'Wholesale / Distribution', 'Medical', 'Furniture', 'Custom'];

function formatCurrency(amount: number): string {
  return `£${(amount || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function CompanyProfileScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [editContactName, setEditContactName] = useState('');
  const [editContactEmail, setEditContactEmail] = useState('');
  const [editContactPhone, setEditContactPhone] = useState('');
  const [editBillingAddress, setEditBillingAddress] = useState('');
  const [editBillingCity, setEditBillingCity] = useState('');
  const [editBillingPostcode, setEditBillingPostcode] = useState('');
  const [editIndustry, setEditIndustry] = useState('');
  const [showIndustryPicker, setShowIndustryPicker] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await apiClient('/profile');
      setUserData(data);
      // Seed editable state
      const biz = data.businessAccount;
      setEditContactName(data.firstName + ' ' + data.lastName);
      setEditContactEmail(data.email || '');
      setEditContactPhone(data.phone || biz?.contactPhone || '');
      setEditBillingAddress(biz?.billingAddress || '');
      setEditBillingCity(biz?.billingCity || '');
      setEditBillingPostcode(biz?.billingPostcode || '');
      setEditIndustry(biz?.industryProfile || '');
    } catch (err) {
      console.error('CompanyProfile fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfile();
  }, [fetchProfile]);

  const biz = userData?.businessAccount;

  const profile = useMemo(() => ({
    companyName: biz?.companyName || userData?.firstName + ' ' + userData?.lastName || '—',
    tradingName: biz?.tradingName || '—',
    status: biz?.status || userData?.status || 'ACTIVE',
    registrationNumber: biz?.registrationNumber || '—',
    vatNumber: biz?.vatNumber || '—',
    industryProfile: biz?.industryProfile || '—',
    joinDate: userData?.createdAt || new Date().toISOString(),
    billingTerms: biz?.billingTerms || 'Net 30',
    creditLimit: biz?.creditLimit || 0,
    creditUsed: biz?.currentBalance || 0,
    currentBalance: biz?.currentBalance || 0,
    contactName: (userData?.firstName || '') + ' ' + (userData?.lastName || ''),
    contactEmail: userData?.email || '—',
    contactPhone: userData?.phone || biz?.contactPhone || '—',
    billingAddress: biz?.billingAddress || '—',
    billingCity: biz?.billingCity || '—',
    billingPostcode: biz?.billingPostcode || '—',
    totalJobs: biz?.totalJobs || 0,
    totalSpend: biz?.totalSpend || 0,
    slaCompliance: biz?.slaCompliance || 100,
  }), [userData, biz]);

  const handleSave = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    try {
      // Update own user profile fields
      await apiClient(`/profile/${userData?.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ phone: editContactPhone }),
      });
      await fetchProfile();
      setIsEditing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Profile Updated', 'Your details have been saved.');
    } catch (err) {
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [userData?.id, editContactPhone, fetchProfile]);

  const creditPercent = profile.creditLimit > 0 ? Math.round((profile.creditUsed / profile.creditLimit) * 100) : 0;

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.customerPrimary} />
        <Text style={{ marginTop: 12, color: Colors.textMuted }}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Company Profile',
          headerStyle: { backgroundColor: Colors.navy },
          headerTintColor: Colors.textInverse,
          headerTitleStyle: { fontWeight: '600' as const },
          headerRight: () => (
            <TouchableOpacity
              onPress={() => {
                if (isEditing) handleSave();
                else setIsEditing(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={styles.headerBtn}
              disabled={saving}
            >
              {saving ? <ActivityIndicator size={18} color={Colors.customerPrimary} /> : isEditing ? <Save size={18} color={Colors.customerPrimary} /> : <Edit3 size={18} color={Colors.textInverse} />}
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.customerPrimary} />}
        >
          <View style={styles.companyHeader}>
            <View style={styles.companyIcon}>
              <Building2 size={28} color={Colors.customerPrimary} />
            </View>
            <Text style={styles.companyName}>{profile.companyName}</Text>
            <Text style={styles.tradingName}>Trading as: {profile.tradingName}</Text>
            <View style={[styles.statusBadge, { backgroundColor: profile.status === 'ACTIVE' ? '#D1FAE5' : '#FEF3C7' }]}>
              <Text style={[styles.statusText, { color: profile.status === 'ACTIVE' ? Colors.success : Colors.warning }]}>{profile.status}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Company Registration</Text>
            <View style={styles.detailCard}>
              <DetailRow icon={FileText} label="Registration No." value={profile.registrationNumber} />
              <DetailRow icon={Shield} label="VAT Number" value={profile.vatNumber} />
              <DetailRow icon={Factory} label="Industry Profile" value={isEditing ? undefined : profile.industryProfile}>
                {isEditing && (
                  <View style={{ flex: 1 }}>
                    <TouchableOpacity style={styles.inlinePickerBtn} onPress={() => setShowIndustryPicker(!showIndustryPicker)}>
                      <Text style={styles.inlinePickerText}>{editIndustry}</Text>
                      <ChevronDown size={14} color={Colors.textMuted} />
                    </TouchableOpacity>
                    {showIndustryPicker && (
                      <View style={styles.inlinePickerOptions}>
                        {INDUSTRY_OPTIONS.map(opt => (
                          <TouchableOpacity
                            key={opt}
                            style={[styles.inlinePickerOption, editIndustry === opt && styles.inlinePickerOptionActive]}
                            onPress={() => { setEditIndustry(opt); setShowIndustryPicker(false); }}
                          >
                            <Text style={[styles.inlinePickerOptionText, editIndustry === opt && { color: '#FFF' }]}>{opt}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </DetailRow>
              <DetailRow icon={Clock} label="Member Since" value={new Date(profile.joinDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} last />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Billing & Credit</Text>
            <View style={styles.detailCard}>
              <DetailRow icon={Banknote} label="Billing Terms" value={profile.billingTerms} />
              <DetailRow icon={CreditCard} label="Credit Limit" value={formatCurrency(profile.creditLimit)} />
              <View style={styles.creditRow}>
                <View style={styles.creditBarContainer}>
                  <View style={[styles.creditBar, { width: `${creditPercent}%`, backgroundColor: creditPercent > 80 ? Colors.danger : creditPercent > 60 ? Colors.warning : Colors.customerPrimary }]} />
                </View>
                <Text style={styles.creditText}>{formatCurrency(profile.creditUsed)} / {formatCurrency(profile.creditLimit)} used ({creditPercent}%)</Text>
              </View>
              <DetailRow icon={CreditCard} label="Current Balance" value={formatCurrency(profile.currentBalance)} last />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Details</Text>
            <View style={styles.detailCard}>
              {isEditing ? (
                <>
                  <EditableRow label="Contact Name" value={editContactName} onChange={setEditContactName} />
                  <EditableRow label="Email" value={editContactEmail} onChange={setEditContactEmail} keyboardType="email-address" />
                  <EditableRow label="Phone" value={editContactPhone} onChange={setEditContactPhone} keyboardType="phone-pad" last />
                </>
              ) : (
                <>
                  <DetailRow icon={Mail} label="Contact Name" value={profile.contactName} />
                  <DetailRow icon={Mail} label="Email" value={profile.contactEmail} />
                  <DetailRow icon={Phone} label="Phone" value={profile.contactPhone} last />
                </>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Billing Address</Text>
            <View style={styles.detailCard}>
              {isEditing ? (
                <>
                  <EditableRow label="Address" value={editBillingAddress} onChange={setEditBillingAddress} />
                  <EditableRow label="City" value={editBillingCity} onChange={setEditBillingCity} />
                  <EditableRow label="Postcode" value={editBillingPostcode} onChange={setEditBillingPostcode} autoCapitalize="characters" last />
                </>
              ) : (
                <>
                  <DetailRow icon={MapPin} label="Address" value={profile.billingAddress} />
                  <DetailRow icon={MapPin} label="City" value={profile.billingCity} />
                  <DetailRow icon={MapPin} label="Postcode" value={profile.billingPostcode} last />
                </>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Billing Address</Text>
            <View style={styles.locationCard}>
              <View style={styles.locationTop}>
                <MapPin size={14} color={Colors.customerPrimary} />
                <Text style={styles.locationLabel}>{profile.billingAddress}</Text>
              </View>
              <Text style={styles.locationAddress}>{profile.billingCity}, {profile.billingPostcode}</Text>
              <Text style={styles.locationContact}>{profile.contactName} · {profile.contactPhone}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performance</Text>
            <View style={styles.perfRow}>
              <View style={styles.perfCard}>
                <Text style={styles.perfValue}>{profile.totalJobs}</Text>
                <Text style={styles.perfLabel}>Total Jobs</Text>
              </View>
              <View style={styles.perfCard}>
                <Text style={styles.perfValue}>{formatCurrency(profile.totalSpend)}</Text>
                <Text style={styles.perfLabel}>Total Spend</Text>
              </View>
              <View style={styles.perfCard}>
                <Text style={[styles.perfValue, { color: profile.slaCompliance >= 95 ? Colors.success : Colors.warning }]}>{profile.slaCompliance}%</Text>
                <Text style={styles.perfLabel}>SLA Score</Text>
              </View>
            </View>
          </View>

          {isEditing && (
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
              <Save size={18} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function DetailRow({ icon: Icon, label, value, last, children }: {
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  value?: string;
  last?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <View style={[styles.detailRow, !last && styles.detailRowBorder]}>
      <Icon size={16} color={Colors.customerPrimary} />
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        {value ? <Text style={styles.detailValue}>{value}</Text> : children}
      </View>
    </View>
  );
}

function EditableRow({ label, value, onChange, keyboardType, autoCapitalize, last }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'characters';
  last?: boolean;
}) {
  return (
    <View style={[styles.editableRow, !last && styles.detailRowBorder]}>
      <Text style={styles.editableLabel}>{label}</Text>
      <TextInput
        style={styles.editableInput}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerBtn: { padding: 8 },
  scroll: { flex: 1 },
  content: { padding: 16 },
  companyHeader: { alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 16, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  companyIcon: { width: 60, height: 60, borderRadius: 18, backgroundColor: '#CCFBF1', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  companyName: { fontSize: 20, fontWeight: '800' as const, color: Colors.text, textAlign: 'center' as const },
  tradingName: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginTop: 8 },
  statusText: { fontSize: 12, fontWeight: '700' as const },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700' as const, color: Colors.text, marginBottom: 10 },
  detailCard: { backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  detailRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  detailRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  detailContent: { flex: 1 },
  detailLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '500' as const },
  detailValue: { fontSize: 14, color: Colors.text, fontWeight: '500' as const, marginTop: 2 },
  creditRow: { padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  creditBarContainer: { height: 8, backgroundColor: Colors.borderLight, borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  creditBar: { height: '100%', borderRadius: 4 },
  creditText: { fontSize: 12, color: Colors.textSecondary },
  editableRow: { padding: 14 },
  editableLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '500' as const, marginBottom: 4 },
  editableInput: { fontSize: 14, color: Colors.text, fontWeight: '500' as const, borderBottomWidth: 1, borderBottomColor: Colors.customerPrimary, paddingVertical: 4 },
  inlinePickerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  inlinePickerText: { fontSize: 14, color: Colors.text, fontWeight: '500' as const },
  inlinePickerOptions: { marginTop: 8, gap: 4 },
  inlinePickerOption: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: Colors.surfaceAlt },
  inlinePickerOptionActive: { backgroundColor: Colors.customerPrimary },
  inlinePickerOptionText: { fontSize: 13, color: Colors.text },
  locationCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  locationTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  locationLabel: { fontSize: 14, fontWeight: '600' as const, color: Colors.text, flex: 1 },
  defaultBadge: { backgroundColor: '#CCFBF1', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  defaultBadgeText: { fontSize: 10, fontWeight: '700' as const, color: Colors.customerPrimary },
  locationAddress: { fontSize: 13, color: Colors.textSecondary, marginLeft: 20 },
  locationContact: { fontSize: 12, color: Colors.textMuted, marginLeft: 20, marginTop: 2 },
  perfRow: { flexDirection: 'row', gap: 10 },
  perfCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  perfValue: { fontSize: 18, fontWeight: '800' as const, color: Colors.text },
  perfLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.customerPrimary, borderRadius: 14, height: 56, gap: 8, marginTop: 8 },
  saveBtnText: { fontSize: 16, fontWeight: '700' as const, color: '#FFFFFF' },
});
