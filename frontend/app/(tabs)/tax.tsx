import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ShieldCheck,
  Building2,
  Download,
  UploadCloud,
  FileText,
  Settings,
  RefreshCw,
  Calculator,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';

// Dummy 9-box VAT return data based on our mock finances
const MOCK_VAT_RETURN = {
  box1: 52400.00, // VAT due on sales
  box2: 0.00,     // VAT due on acquisitions from EU
  box3: 52400.00, // Total output tax (Box 1 + 2)
  box4: 12150.00, // VAT reclaimed on purchases
  box5: 40250.00, // Net VAT to pay (Box 3 - 4)
  box6: 262000.00,// Total value of sales excl. VAT
  box7: 60750.00, // Total value of purchases excl. VAT
  box8: 0.00,     // Total value of dispatched goods to EU
  box9: 0.00,     // Total value of acquisitions from EU
};

export default function TaxComplianceScreen() {
  const insets = useSafeAreaInsets();
  const { admin } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [vatRate, setVatRate] = useState('20.0');
  const [mtdConnected, setMtdConnected] = useState(true);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const handleExportCSV = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Export Complete', 'The HMRC VAT compliance report has been exported to CSV.');
  };

  const handleSubmitHMRC = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!mtdConnected) {
      Alert.alert('MTD Not Connected', 'Please authorize Make Tax Digital before submitting.');
      return;
    }
    Alert.alert(
      'Submit VAT Return',
      'Are you sure you want to submit the Q4 2023 VAT Return to HMRC via MTD?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit to HMRC', onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Success', 'VAT Return successfully submitted to HMRC. Receipt ID: #HM849X21');
          }
        }
      ]
    );
  };

  const handleSaveRates = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Rates Saved', 'The platform standard VAT rate has been updated.');
  };

  if (!admin) return null; // Protect route

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Tax & VAT</Text>
            <Text style={styles.headerSubtitle}>HMRC Compliance & Settings</Text>
          </View>
          <View style={styles.gatewayBadges}>
            <View style={[styles.gatewayBadge, { backgroundColor: mtdConnected ? Colors.success + '20' : Colors.warning + '20' }]}>
              {mtdConnected ? (
                <ShieldCheck size={14} color={Colors.success} />
              ) : (
                <AlertTriangle size={14} color={Colors.warning} />
              )}
              <Text style={[styles.gatewayText, { color: mtdConnected ? Colors.success : Colors.warning }]}>
                {mtdConnected ? 'MTD Authorized' : 'MTD Disconnected'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.adminPrimary} />}
      >
        {/* Company Identity */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Building2 size={18} color={Colors.adminPrimary} />
            <Text style={styles.sectionTitle}>Company Tax Identity</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Registered Name</Text>
            <Text style={styles.detailValue}>CYVhub Logistics Ltd</Text>
          </View>
          <View style={[styles.detailRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
            <Text style={styles.detailLabel}>VAT Registration No.</Text>
            <Text style={styles.detailValue}>GB 123 4567 89</Text>
          </View>
        </View>

        {/* VAT Rate Configuration */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Settings size={18} color={Colors.adminPrimary} />
            <Text style={styles.sectionTitle}>Platform VAT Engine</Text>
          </View>
          <Text style={styles.helperText}>Set the default standard VAT rate applied to all taxable domestic invoices and charges generated through CYVhub.</Text>
          <View style={styles.inputRow}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Standard Rate (%)</Text>
              <TextInput
                style={styles.textInput}
                value={vatRate}
                onChangeText={setVatRate}
                keyboardType="decimal-pad"
              />
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveRates} activeOpacity={0.8}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* MTD Status & Period */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <RefreshCw size={18} color={Colors.adminPrimary} />
            <Text style={styles.sectionTitle}>Reporting Period: Q4 2023</Text>
          </View>
          <View style={styles.periodRow}>
            <View>
              <Text style={styles.periodLabel}>Period Start</Text>
              <Text style={styles.periodValue}>01 Oct 2023</Text>
            </View>
            <View style={styles.periodDivider} />
            <View>
              <Text style={styles.periodLabel}>Period End</Text>
              <Text style={styles.periodValue}>31 Dec 2023</Text>
            </View>
            <View style={styles.periodDivider} />
            <View>
              <Text style={styles.periodLabel}>Deadline</Text>
              <Text style={[styles.periodValue, { color: Colors.warning }]}>07 Feb 2024</Text>
            </View>
          </View>
        </View>

        {/* 9-Box VAT Return */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Calculator size={18} color={Colors.adminPrimary} />
            <Text style={styles.sectionTitle}>Calculated VAT Return</Text>
          </View>
          <Text style={styles.helperText}>These figures are automatically calculated from your cleared platform payouts, fleet expenses, and rendered invoices for connected carriers and customers.</Text>

          <View style={styles.boxGrid}>
            <View style={styles.boxRow}>
              <View style={styles.boxCell}>
                <Text style={styles.boxLabel}>Box 1: VAT due on sales</Text>
                <Text style={styles.boxValue}>£{MOCK_VAT_RETURN.box1.toLocaleString()}</Text>
              </View>
              <View style={styles.boxCell}>
                <Text style={styles.boxLabel}>Box 2: VAT on EU acqs.</Text>
                <Text style={styles.boxValue}>£{MOCK_VAT_RETURN.box2.toLocaleString()}</Text>
              </View>
            </View>
            <View style={styles.boxRow}>
              <View style={[styles.boxCell, styles.boxHighlight]}>
                <Text style={[styles.boxLabel, styles.boxLabelHighlight]}>Box 3: Total VAT due</Text>
                <Text style={[styles.boxValue, styles.boxValueHighlight]}>£{MOCK_VAT_RETURN.box3.toLocaleString()}</Text>
              </View>
              <View style={styles.boxCell}>
                <Text style={styles.boxLabel}>Box 4: VAT reclaimed</Text>
                <Text style={styles.boxValue}>£{MOCK_VAT_RETURN.box4.toLocaleString()}</Text>
              </View>
            </View>
            <View style={styles.boxRow}>
              <View style={[styles.boxCell, styles.boxCritical]}>
                <Text style={[styles.boxLabel, styles.boxLabelHighlight]}>Box 5: Net VAT to pay</Text>
                <Text style={[styles.boxValue, styles.boxValueHighlight]}>£{MOCK_VAT_RETURN.box5.toLocaleString()}</Text>
              </View>
              <View style={styles.boxCell}>
                <Text style={styles.boxLabel}>Box 6: Total sales (ex VAT)</Text>
                <Text style={styles.boxValue}>£{MOCK_VAT_RETURN.box6.toLocaleString()}</Text>
              </View>
            </View>
            <View style={styles.boxRow}>
              <View style={styles.boxCell}>
                <Text style={styles.boxLabel}>Box 7: Total purchases (ex VAT)</Text>
                <Text style={styles.boxValue}>£{MOCK_VAT_RETURN.box7.toLocaleString()}</Text>
              </View>
              <View style={styles.boxCell}>
                <Text style={styles.boxLabel}>Box 8: Dispatch to EU</Text>
                <Text style={styles.boxValue}>£{MOCK_VAT_RETURN.box8.toLocaleString()}</Text>
              </View>
            </View>
            <View style={[styles.boxRow, { borderBottomWidth: 0 }]}>
              <View style={styles.boxCell}>
                <Text style={styles.boxLabel}>Box 9: Acqs. from EU</Text>
                <Text style={styles.boxValue}>£{MOCK_VAT_RETURN.box9.toLocaleString()}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtnOutline} onPress={handleExportCSV} activeOpacity={0.7}>
            <Download size={16} color={Colors.adminPrimary} />
            <Text style={styles.actionBtnTextOutline}>Export CSV</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtnPrimary} onPress={handleSubmitHMRC} activeOpacity={0.8}>
            <UploadCloud size={16} color="#FFFFFF" />
            <Text style={styles.actionBtnTextPrimary}>Submit to HMRC</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.navy,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textInverse,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
  },
  gatewayBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  gatewayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  gatewayText: {
    fontSize: 12,
    fontWeight: '700',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  helperText: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  saveBtn: {
    backgroundColor: Colors.adminPrimary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 8,
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  periodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: 8,
  },
  periodLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  periodValue: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  periodDivider: {
    width: 1,
    height: '100%',
    backgroundColor: Colors.borderLight,
  },
  boxGrid: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 8,
    overflow: 'hidden',
  },
  boxRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  boxCell: {
    flex: 1,
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: Colors.borderLight,
  },
  boxLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
    marginBottom: 6,
  },
  boxValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  boxHighlight: {
    backgroundColor: Colors.info + '10',
  },
  boxLabelHighlight: {
    color: Colors.text,
  },
  boxValueHighlight: {
    fontSize: 16,
    color: Colors.primary,
  },
  boxCritical: {
    backgroundColor: Colors.adminPrimary + '15',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.adminPrimary,
    borderRadius: 10,
    paddingVertical: 14,
  },
  actionBtnTextOutline: {
    color: Colors.adminPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.success,
    borderRadius: 10,
    paddingVertical: 14,
  },
  actionBtnTextPrimary: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
